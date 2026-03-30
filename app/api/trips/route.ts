import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createTripSchema } from "@/lib/validations/trip";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const trips = await prisma.trip.findMany({
    where: { userId: session.user.id },
    include: { tags: true },
    orderBy: { publishDate: "desc" },
  });

  return NextResponse.json(trips);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createTripSchema.safeParse(body);

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

  const trip = await prisma.trip.create({
    data: {
      ...tripData,
      mainImageUrl,
      galleryImageUrls,
      userId: session.user.id,
      tags: {
        connect: tagIds.map((id) => ({ id })),
      },
    },
    include: { tags: true },
  });

  return NextResponse.json(trip, { status: 201 });
}
