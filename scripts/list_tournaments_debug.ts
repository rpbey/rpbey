
import { prisma } from '../src/lib/prisma';

async function main() {
  const tournaments = await prisma.tournament.findMany({
    orderBy: { date: 'desc' },
    select: {
      id: true,
      name: true,
      date: true,
      challongeUrl: true,
      status: true,
    }
  });

  console.log('Tournaments found:', tournaments);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
