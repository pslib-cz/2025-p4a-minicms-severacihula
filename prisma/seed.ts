import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("test1234", 10);

  await prisma.trip.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  const [hory, mesto, evropa, asie] = await Promise.all([
    prisma.tag.create({ data: { name: "Hory", slug: "hory" } }),
    prisma.tag.create({ data: { name: "Mesto", slug: "mesto" } }),
    prisma.tag.create({ data: { name: "Evropa", slug: "evropa" } }),
    prisma.tag.create({ data: { name: "Asie", slug: "asie" } }),
  ]);

  const [user1, user2] = await Promise.all([
    prisma.user.create({
      data: {
        name: "Anna Novakova",
        email: "anna@example.com",
        password: passwordHash,
      },
    }),
    prisma.user.create({
      data: {
        name: "Petr Svoboda",
        email: "petr@example.com",
        password: passwordHash,
      },
    }),
  ]);

  await prisma.trip.createMany({
    data: [
      {
        title: "Toulky Krkonosmi",
        slug: "toulky-krkonosmi",
        description: "Vikendovy prechod hrebenovky v Krkonosich.",
        content:
          "Prvni den jsme vystoupali na Snezku, prespali na boudach a druhy den pokracovali smerem na Labskou louku.",
        publishDate: new Date("2025-06-14T09:00:00.000Z"),
        published: true,
        userId: user1.id,
      },
      {
        title: "Vikend v Parizi",
        slug: "vikend-v-parizi",
        description: "Tri dny mezi pamatkami a kavarnami.",
        content:
          "Eiffelovka, Louvre a vecerni prochazky kolem Seiny. Mesto nabizi skvelou atmosferu na kazdem rohu.",
        publishDate: new Date("2025-07-02T11:00:00.000Z"),
        published: true,
        userId: user1.id,
      },
      {
        title: "Bangkok za 48 hodin",
        slug: "bangkok-za-48-hodin",
        description: "Intenzivni navsteva chramu a street foodu.",
        content:
          "Od ranni navstevy Wat Pho po nocni trhy. Mesto je chaoticke, ale neuveritelne zive.",
        publishDate: new Date("2025-08-20T07:30:00.000Z"),
        published: false,
        userId: user2.id,
      },
      {
        title: "Alpske jezero Hallstatt",
        slug: "alpske-jezero-hallstatt",
        description: "Jednodenni vylet k jezeru mezi horami.",
        content:
          "Kombinace horske turistiky a klidneho mestecka u vody. Idealni na fotografovani a pomale tempo.",
        publishDate: new Date("2025-09-05T10:15:00.000Z"),
        published: true,
        userId: user2.id,
      },
      {
        title: "Podzimni Praha",
        slug: "podzimni-praha",
        description: "Mestske objevovani mimo hlavni sezonu.",
        content:
          "Ranni mlhy nad Vltavou, male galerie a skryte kavarny na Vinohradech. Praha umi byt i velmi komorni.",
        publishDate: new Date("2025-10-11T08:00:00.000Z"),
        published: false,
        userId: user1.id,
      },
    ],
  });

  const trips = await prisma.trip.findMany({
    select: { id: true, slug: true },
  });

  const tripBySlug = new Map<string, string>(
    trips.map((trip: { id: string; slug: string }) => [trip.slug, trip.id]),
  );

  const getTripId = (slug: string) => {
    const tripId = tripBySlug.get(slug);
    if (!tripId) {
      throw new Error(`Trip with slug "${slug}" was not found after seeding.`);
    }
    return tripId;
  };

  await Promise.all([
    prisma.trip.update({
      where: { id: getTripId("toulky-krkonosmi") },
      data: { tags: { connect: [{ id: hory.id }, { id: evropa.id }] } },
    }),
    prisma.trip.update({
      where: { id: getTripId("vikend-v-parizi") },
      data: { tags: { connect: [{ id: mesto.id }, { id: evropa.id }] } },
    }),
    prisma.trip.update({
      where: { id: getTripId("bangkok-za-48-hodin") },
      data: { tags: { connect: [{ id: mesto.id }, { id: asie.id }] } },
    }),
    prisma.trip.update({
      where: { id: getTripId("alpske-jezero-hallstatt") },
      data: { tags: { connect: [{ id: hory.id }, { id: evropa.id }] } },
    }),
    prisma.trip.update({
      where: { id: getTripId("podzimni-praha") },
      data: { tags: { connect: [{ id: mesto.id }, { id: evropa.id }] } },
    }),
  ]);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
