
import { prisma } from '../src/lib/prisma';

async function main() {
  const tournament = await prisma.tournament.create({
    data: {
      name: "BEY-TAMASHII SERIES #1",
      date: new Date("2026-01-11T14:00:00Z"),
      challongeId: "B_TS1",
      challongeUrl: "https://challonge.com/B_TS1",
      status: "UPCOMING"
    }
  });
  console.log("Tournament created in DB:", tournament.id);
}

main().catch(console.error).finally(() => prisma.$disconnect());
