import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateTripSchema } from "@/lib/validations/trip";

type Params = {
  params: Promise<{ id: string }>;
};

const unauthorizedResponse = () =>
  NextResponse.json({ error: "Unauthorized" }, { status: 401 });

const forbiddenResponse = () =>
  NextResponse.json({ error: "Forbidden" }, { status: 403 });

async function assertOwnership(tripId: string, userId: string) {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: { id: true, userId: true },
  });

  if (!trip) {
    return { status: "not-found" as const };
  }

  if (trip.userId !== userId) {
    return { status: "forbidden" as const };
  }

  return { status: "ok" as const };
}

async function updateTrip(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return unauthorizedResponse();
  }

  const { id } = await params;
  const ownership = await assertOwnership(id, session.user.id);

  if (ownership.status === "not-found") {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  if (ownership.status === "forbidden") {
    return forbiddenResponse();
  }

  const body = await req.json();
  const parsed = updateTripSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const {
    tagIds,
    mainImageUrl,
    galleryImageUrls,
    ...tripData
  } = parsed.data;

  const updatedTrip = await prisma.trip.update({
    where: { id },
    data: {
      ...tripData,
      ...(mainImageUrl !== undefined ? { mainImageUrl } : {}),
      ...(galleryImageUrls !== undefined ? { galleryImageUrls } : {}),
      ...(tagIds
        ? {
            tags: {
              set: tagIds.map((tagId) => ({ id: tagId })),
            },
          }
        : {}),
    },
    include: { tags: true },
  });

  return NextResponse.json(updatedTrip);
}

export async function GET(_: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return unauthorizedResponse();
  }

  const { id } = await params;
  const ownership = await assertOwnership(id, session.user.id);

  if (ownership.status === "not-found") {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  if (ownership.status === "forbidden") {
    return forbiddenResponse();
  }

  const trip = await prisma.trip.findUnique({
    where: { id },
    include: { tags: true },
  });

  return NextResponse.json(trip);
}

export async function PUT(req: Request, context: Params) {
  return updateTrip(req, context);
}

export async function PATCH(req: Request, context: Params) {
  return updateTrip(req, context);
}

export async function DELETE(_: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return unauthorizedResponse();
  }

  const { id } = await params;
  const ownership = await assertOwnership(id, session.user.id);

  if (ownership.status === "not-found") {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  if (ownership.status === "forbidden") {
    return forbiddenResponse();
  }

  await prisma.trip.delete({ where: { id } });

  return new NextResponse(null, { status: 204 });
}
