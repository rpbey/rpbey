
import { prisma } from '../src/lib/prisma';
import { RankingService } from '../src/lib/ranking-service';

async function main() {
  console.log('🔍 Recherche du tournoi à exclure (B_TS2)...');
  
  // Find the future tournament (B_TS2)
  const tournamentToExclude = await prisma.tournament.findFirst({
    where: {
      OR: [
        { id: 'cm-bts2-auto-imported' },
        { challongeUrl: { contains: 'B_TS2' } }
      ]
    }
  });

  if (tournamentToExclude) {
    console.log(`✅ Tournoi trouvé: ${tournamentToExclude.name} (${tournamentToExclude.id}) - Status actuel: ${tournamentToExclude.status}`);
    
    if (tournamentToExclude.status === 'COMPLETE') {
      console.log('🚧 Changement du statut vers UPCOMING pour l\'exclure du classement actuel...');
      await prisma.tournament.update({
        where: { id: tournamentToExclude.id },
        data: { status: 'UPCOMING' }
      });
      console.log('✅ Statut mis à jour.');
    } else {
      console.log('ℹ️ Le statut est déjà correct (non COMPLETE).');
    }
  } else {
    console.log('⚠️ Tournoi B_TS2 non trouvé.');
  }

  // Recalculate rankings
  console.log('🔄 Recalcul du classement (uniquement les tournois COMPLETED)...');
  await RankingService.recalculateAll();
  
  console.log('🎉 Terminé !');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
