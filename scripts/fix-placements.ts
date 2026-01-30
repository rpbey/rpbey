
import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('🧹 Nettoyage des placements pour les tournois non terminés...');

  const result = await prisma.tournamentParticipant.updateMany({
    where: {
      tournament: {
        status: { not: 'COMPLETE' }
      },
      finalPlacement: { not: null }
    },
    data: {
      finalPlacement: null
    }
  });

  console.log(`✅ ${result.count} placements réinitialisés.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
