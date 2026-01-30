
import { prisma } from '../src/lib/prisma';

async function main() {
  const tournaments = await prisma.tournament.findMany({
    where: { status: 'COMPLETE' },
    select: { id: true, name: true, participants: { select: { userId: true, finalPlacement: true } } }
  });

  console.log('Complete Tournaments:', tournaments.length);
  tournaments.forEach(t => {
    console.log(`- ${t.name} (${t.id})`);
    const winners = t.participants.filter(p => p.finalPlacement === 1);
    console.log(`  Winners (Placement 1): ${winners.length}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
