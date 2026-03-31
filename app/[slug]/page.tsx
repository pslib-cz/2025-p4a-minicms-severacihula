import { Chip } from "@nextui-org/react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GalleryLightbox } from "@/components/public/gallery-lightbox";
import { prisma } from "@/lib/prisma";

type TripDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

const resolveBaseUrl = () => process.env.NEXTAUTH_URL ?? "http://localhost:3000";

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
      title: "Cestovatelský deník",
      description: "Publikované cestovatelské články.",
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
      title: "Cestovatelský deník",
      description: "Publikované cestovatelské články.",
    };
  }

  if (!trip) {
    return {
      title: "Článek nenalezen",
      description: "Požadovaný cestovatelský deník nebyl nalezen.",
    };
  }

  const url = `${resolveBaseUrl()}/${trip.slug}`;
  const mainImageUrl = readMainImageUrl(trip);
  const openGraphImages =
    mainImageUrl && isValidImageUrl(mainImageUrl)
      ? [
          {
            url: mainImageUrl,
            width: 1600,
            height: 900,
            alt: `Náhled článku ${trip.title}`,
          },
        ]
      : undefined;

  return {
    title: trip.title,
    description: trip.description,
    openGraph: {
      type: "article",
      title: trip.title,
      description: trip.description,
      url,
      images: openGraphImages,
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
      select: {
        id: true,
        title: true,
        description: true,
        content: true,
        publishDate: true,
        mainImageUrl: true,
        galleryImageUrls: true,
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

  const heroImage = readMainImageUrl(trip);
  const galleryImageUrls = readGalleryImageUrls(trip);

  return (
    <main className="mx-auto max-w-4xl space-y-8 px-6 py-8 md:py-10">
      <header className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <Link
          href="/"
          className="inline-flex items-center text-sm font-medium text-slate-600 transition-all duration-200 ease-in-out hover:text-blue-700"
        >
          &larr; Zpět na články
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{trip.title}</h1>
        <p className="text-sm text-slate-500">
          {new Date(trip.publishDate).toLocaleDateString("cs-CZ")} · {trip.author.name ?? "Neznámý autor"}
        </p>
        <p className="text-lg leading-8 text-slate-600">{trip.description}</p>
        <div className="flex flex-wrap gap-2">
          {trip.tags.map((tag) => (
            <Chip key={tag.id} size="sm" variant="flat" className="text-slate-700">
              {tag.name}
            </Chip>
          ))}
        </div>
      </header>

      {heroImage && isValidImageUrl(heroImage) ? (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          <img
            src={heroImage}
            alt={trip.title}
            className="h-auto w-full rounded-xl object-cover"
          />
        </section>
      ) : null}

      <article
        className="prose prose-slate max-w-none rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        dangerouslySetInnerHTML={{ __html: trip.content }}
      />

      <GalleryLightbox images={galleryImageUrls} title={`Galerie - ${trip.title}`} />
    </main>
  );
}
