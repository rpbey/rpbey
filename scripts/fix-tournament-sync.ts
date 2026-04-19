import { prisma } from '../src/lib/prisma';
import { getChallongeService } from '../src/lib/challonge';

async function main() {
  const dbId = 'cmk49f8yx00007aa3b5ahh61m'; // BEY-TAMASHII SERIES #1
  const targetChallongeId = process.argv[2]; 

  if (!targetChallongeId) {
    console.log("Usage: bun scripts/fix-tournament-sync.ts <CHALLONGE_ID_OR_SLUG>");
    console.log("Exemple: bun scripts/fix-tournament-sync.ts 12345678");
    console.log("\nNote: L'ID peut être l'ID numérique ou le slug (ex: 'B_TS1').");
    console.log("Si le tournoi est privé, assurez-vous que le bot a les droits.");
    return;
  }

  console.log(`🔄 Liaison du tournoi local ${dbId} avec Challonge ID: ${targetChallongeId}...`);

  try {
    // 1. Update DB Link
    await prisma.tournament.update({
        where: { id: dbId },
        data: { challongeId: targetChallongeId }
    });
    console.log("✅ Base de données mise à jour avec l'ID Challonge.");

    // 2. Try Sync Check
    console.log("📡 Test de connexion à l'API Challonge...");
    const service = getChallongeService();
    
    try {
        const t = await service.getTournament(targetChallongeId);
        console.log(`✅ Tournoi trouvé: "${t.data.attributes.name}"`);
        console.log(`   État: ${t.data.attributes.state}`);
        console.log(`   Participants: ${t.data.attributes.participantsCount}`);
        
        // Update status localement
        const newStatus = t.data.attributes.state === 'complete' ? 'COMPLETE' : 'UNDERWAY';
        await prisma.tournament.update({
            where: { id: dbId },
            data: { status: newStatus }
        });
        console.log(`✅ Statut local mis à jour vers: ${newStatus}`);

        console.log("\n🚀 SUCCÈS ! Le lien est rétabli.");
        console.log("👉 Vous pouvez maintenant aller dans le Dashboard Admin > Tournois et cliquer sur 'Sync Participants' et 'Sync Matchs'.");

    } catch (apiError) {
        console.error("\n❌ Erreur API Challonge:", apiError);
        console.log("\n⚠️ ATTENTION: L'ID a été enregistré en base, mais l'API n'arrive pas à lire le tournoi.");
        console.log("Causes possibles :");
        console.log("1. L'ID est incorrect.");
        console.log("2. Le tournoi est privé et le bot n'est pas admin.");
        console.log("3. Le tournoi appartient à une organisation non accessible.");
    }

  } catch (dbError) {
      console.error("❌ Erreur Base de Données:", dbError);
  } finally {
      await prisma.$disconnect();
  }
}

main();
