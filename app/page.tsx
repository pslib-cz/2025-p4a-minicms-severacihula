import { Card, CardBody, CardHeader, Chip } from "@nextui-org/react";
import Image from "next/image";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { TagFilter } from "@/components/public/tag-filter";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type HomePageProps = {
  searchParams: Promise<{ tag?: string }>;
};

const PLACEHOLDER_IMAGE_URL =
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80";

const hasValidDatabaseUrl = () => {
  const databaseUrl = process.env.DATABASE_URL;
  return Boolean(databaseUrl && /^(postgresql|postgres):\/\//.test(databaseUrl));
};

const isValidImageUrl = (value?: string | null) => {
  if (!value) {
    return false;
  }

  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const resolveCardImageUrl = (value?: string | null): string => {
  if (value && isValidImageUrl(value)) {
    return value;
  }

  return PLACEHOLDER_IMAGE_URL;
};

const readMainImageUrl = (value: unknown): string | null => {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const candidate = (value as { mainImageUrl?: unknown }).mainImageUrl;
  return typeof candidate === "string" ? candidate : null;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const { tag } = await searchParams;
  const hasDatabaseUrl = hasValidDatabaseUrl();

  const where: Prisma.TripWhereInput = {
    published: true,
    ...(tag
      ? {
          tags: {
            some: { slug: tag },
          },
        }
      : {}),
  };

  const [trips, publishedTripsForTagFilter] = hasDatabaseUrl
    ? await Promise.all([
        prisma.trip.findMany({
          where,
          include: {
            author: { select: { name: true } },
            tags: { select: { id: true, name: true, slug: true } },
          },
          orderBy: { publishDate: "desc" },
        }),
        prisma.trip.findMany({
          select: {
            tags: {
              select: { id: true, name: true, slug: true },
            },
          },
        }),
      ]).catch(() => [[], []])
    : [[], []];

  const tags = Array.from(
    publishedTripsForTagFilter
      .flatMap((trip) => trip.tags)
      .reduce((accumulator, currentTag) => {
        if (!accumulator.has(currentTag.slug)) {
          accumulator.set(currentTag.slug, currentTag);
        }
        return accumulator;
      }, new Map<string, { id: string; name: string; slug: string }>())
      .values(),
  ).sort((leftTag, rightTag) => leftTag.name.localeCompare(rightTag.name, "cs"));

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-6 py-8 md:py-10">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Cestovatelský deník</h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Veřejně publikované články z cest. Filtruj podle štítku.
        </p>
      </section>

      <section>
        <TagFilter tags={tags} activeTag={tag} />
      </section>

      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {!hasDatabaseUrl ? (
          <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
            Databáze není nakonfigurovaná. Nastav DATABASE_URL pro načtení obsahu.
          </p>
        ) : null}
        {trips.map((trip) => (
          <Card
            key={trip.id}
            as={Link}
            href={`/${trip.slug}`}
            className="rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 ease-in-out hover:-translate-y-1 hover:shadow-lg"
          >
            <CardHeader className="pb-1">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{trip.title}</h2>
                <p className="text-xs text-slate-500">
                  {new Date(trip.publishDate).toLocaleDateString("cs-CZ")} · {trip.author.name ?? "Neznámý autor"}
                </p>
              </div>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="relative h-40 w-full overflow-hidden rounded-xl">
                <Image
                  alt={`Náhled cesty: ${trip.title}`}
                  src={resolveCardImageUrl(readMainImageUrl(trip))}
                  fill
                  unoptimized
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover"
                  priority={false}
                />
              </div>
              <p className="line-clamp-3 text-sm leading-6 text-slate-600">{trip.description}</p>
              <div className="flex flex-wrap gap-2">
                {trip.tags.map((tripTag) => (
                  <Chip key={tripTag.id} size="sm" variant="flat" className="text-slate-700">
                    {tripTag.name}
                  </Chip>
                ))}
              </div>
            </CardBody>
          </Card>
        ))}
      </section>
    </main>
  );
}
