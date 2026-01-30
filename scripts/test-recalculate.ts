
import { RankingService } from '../src/lib/ranking-service';
import { prisma } from '../src/lib/prisma';

async function main() {
  await RankingService.recalculateAll();
  
  const profiles = await prisma.profile.findMany({
    where: { tournamentWins: { gt: 0 } },
    select: { userId: true, tournamentWins: true, rankingPoints: true, user: { select: { name: true } } }
  });

  console.log('Profiles with tournament wins:', profiles.length);
  profiles.forEach(p => {
    console.log(`- ${p.user?.name || p.userId}: Wins=${p.tournamentWins}, Points=${p.rankingPoints}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
