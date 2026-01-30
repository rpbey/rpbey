
import { prisma } from '../src/lib/prisma';

async function main() {
  const profiles = await prisma.profile.findMany({
    select: {
      bladerName: true,
      tournamentWins: true,
      rankingPoints: true,
    },
    orderBy: { rankingPoints: 'desc' },
    take: 10
  });

  console.log('Top 10 Profiles:');
  console.log(JSON.stringify(profiles, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
