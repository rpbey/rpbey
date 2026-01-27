import { prisma } from '../src/lib/prisma';
import { getChallongeService } from '../src/lib/challonge';
import dotenv from 'dotenv';

dotenv.config();

async function checkStatus() {
  console.log("--- Vérification de l'état de l'API Challonge ---");
  
  const service = getChallongeService();
  
  try {
    // 1. Test d'authentification basic (list tournaments)
    console.log("1. Test d'authentification et récupération des tournois...");
    const tournaments = await service.listTournaments({ perPage: 5 });
    console.log(`✅ Succès! Connecté à Challonge.`);
    console.log(`Nombre de tournois trouvés (accessibles via credentials): ${tournaments.data.length}`);
    
    // 2. Vérification des tournois en base de données
    const dbTournaments = await prisma.tournament.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`\n2. Tournois récents dans la base de données (total: ${dbTournaments.length} affichés):`);
    for (const t of dbTournaments) {
      console.log(`- [${t.id}] ${t.name} | Status: ${t.status} | Challonge: ${t.challongeUrl || 'N/A'}`);
      
      if (t.challongeUrl) {
        // Extraire l'ID du tournoi de l'URL
        // URL format: https://challonge.com/rpb_test_1
        const slug = t.challongeUrl.split('/').pop();
        if (slug) {
          try {
            const ct = await service.getTournament(slug);
            console.log(`   └─ ✅ Trouvé sur Challonge (ID: ${ct.data.id}, State: ${ct.data.attributes.state})`);
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            console.log(`   └─ ❌ Non trouvé ou Erreur sur Challonge (${msg})`);
          }
        }
      }
    }

    if (process.env.CHALLONGE_COMMUNITY_ID) {
      console.log(`\n3. Vérification de la communauté (${process.env.CHALLONGE_COMMUNITY_ID})...`);
      try {
        const commTournaments = await service.listCommunityTournaments(process.env.CHALLONGE_COMMUNITY_ID);
        console.log(`✅ ${commTournaments.data.length} tournois trouvés dans la communauté.`);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.log(`❌ Erreur communauté: ${msg}`);
      }
    } else {
      console.log("\n3. CHALLONGE_COMMUNITY_ID non défini dans .env");
    }

  } catch (error) {
    console.error("\n❌ Erreur Globale API Challonge:");
    const msg = error instanceof Error ? error.message : String(error);
    console.error(msg);
  } finally {
    await prisma.$disconnect();
  }
}

checkStatus();
