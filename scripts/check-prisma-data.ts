
import { prisma } from '../src/lib/prisma';

async function main() {
  const count = await prisma.profile.count({
    where: { rankingPoints: { gt: 0 } }
  });
  console.log(`Prisma sees ${count} profiles with rankingPoints > 0`);

  const top = await prisma.profile.findFirst({
    where: { rankingPoints: { gt: 0 } },
    orderBy: { rankingPoints: 'desc' },
    include: { user: true }
  });

  if (top) {
    console.log(`Top player: ${top.bladerName} (${top.user.username}) - ${top.rankingPoints} pts`);
  } else {
    console.log('No top player found.');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
