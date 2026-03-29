import { Chip } from "@nextui-org/react";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { TripGalleryCarousel } from "@/components/public/trip-gallery-carousel";
import { prisma } from "@/lib/prisma";

type TripDetailPageProps = {
  params: Promise<{ slug: string }>;
};

const resolveBaseUrl = () => process.env.NEXTAUTH_URL ?? "http://localhost:3000";
const PLACEHOLDER_IMAGE_URL =
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1600&q=80";

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

const resolveImageUrl = (value?: string | null): string => {
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

const readGalleryImageUrls = (value: unknown): string[] => {
  if (typeof value !== "object" || value === null) {
    return [];
  }

  const candidate = (value as { galleryImageUrls?: unknown }).galleryImageUrls;

  if (!Array.isArray(candidate)) {
    return [];
  }

  return candidate.filter((item): item is string => typeof item === "string");
};

const hasDatabaseUrl = () => {
  const databaseUrl = process.env.DATABASE_URL;
  return Boolean(databaseUrl && /^(postgresql|postgres):\/\//.test(databaseUrl));
};

export async function generateStaticParams() {
  if (!hasDatabaseUrl()) {
    return [];
  }

  try {
    const latestTrips = await prisma.trip.findMany({
      where: { published: true },
      orderBy: { publishDate: "desc" },
      take: 20,
      select: { slug: true },
    });

    return latestTrips.map((trip) => ({ slug: trip.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: TripDetailPageProps): Promise<Metadata> {
  if (!hasDatabaseUrl()) {
    return {
      title: "Cestovatelsky denik",
      description: "Publikovane cestovatelske clanky.",
    };
  }

  const { slug } = await params;

  let trip = null;

  try {
    trip = await prisma.trip.findFirst({
      where: { slug, published: true },
      select: {
        title: true,
        description: true,
        slug: true,
        mainImageUrl: true,
      },
    });
  } catch {
    return {
      title: "Cestovatelsky denik",
      description: "Publikovane cestovatelske clanky.",
    };
  }

  if (!trip) {
    return {
      title: "Clanek nenalezen",
      description: "Pozadovany cestovatelsky denik nebyl nalezen.",
    };
  }

  const url = `${resolveBaseUrl()}/${trip.slug}`;

  return {
    title: trip.title,
    description: trip.description,
    openGraph: {
      type: "article",
      title: trip.title,
      description: trip.description,
      url,
      images: [
        {
          url: resolveImageUrl(readMainImageUrl(trip)),
          width: 1600,
          height: 900,
          alt: `Nahled clanku ${trip.title}`,
        },
      ],
    },
  };
}

export default async function TripDetailPage({ params }: TripDetailPageProps) {
  if (!hasDatabaseUrl()) {
    notFound();
  }

  const { slug } = await params;

  let trip = null;

  try {
    trip = await prisma.trip.findFirst({
      where: { slug, published: true },
      include: {
        author: { select: { name: true } },
        tags: { select: { id: true, name: true } },
      },
    });
  } catch {
    notFound();
  }

  if (!trip) {
    notFound();
  }

  const heroImage = resolveImageUrl(readMainImageUrl(trip));
  const galleryImageUrls = readGalleryImageUrls(trip);

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <header className="space-y-3">
        <h1 className="text-3xl font-bold">{trip.title}</h1>
        <p className="text-sm text-slate-500">
          {new Date(trip.publishDate).toLocaleDateString("cs-CZ")} · {trip.author.name ?? "Neznamy autor"}
        </p>
        <p className="text-lg text-slate-700">{trip.description}</p>
        <div className="flex flex-wrap gap-2">
          {trip.tags.map((tag) => (
            <Chip key={tag.id} size="sm" variant="flat">
              {tag.name}
            </Chip>
          ))}
        </div>
      </header>

      <section className="relative h-[300px] w-full overflow-hidden rounded-2xl sm:h-[430px]">
        <Image
          src={heroImage}
          alt={`Hlavni obrazek clanku ${trip.title}`}
          fill
          unoptimized
          sizes="(max-width: 1024px) 100vw, 1024px"
          className="object-cover"
          priority
        />
      </section>

      <article
        className="prose prose-slate max-w-none"
        dangerouslySetInnerHTML={{ __html: trip.content }}
      />

      <TripGalleryCarousel images={galleryImageUrls} tripTitle={trip.title} />
    </main>
  );
}
