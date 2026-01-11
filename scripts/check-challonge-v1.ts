
import { ChallongeClient } from '../bot/src/lib/challonge';
import dotenv from 'dotenv';

dotenv.config();

async function checkV1() {
  console.log("--- Vérification Challonge API v1 (via API_KEY) ---");
  
  const apiKey = process.env.CHALLONGE_API_KEY;
  if (!apiKey) {
    console.log("❌ CHALLONGE_API_KEY manquant dans .env");
    return;
  }

  const client = new ChallongeClient({
    apiKey,
    authType: 'v1'
  });

  try {
    console.log("1. Récupération des tournois via v1...");
    const response = await client.listTournaments();
    console.log(`✅ Succès! Nombre de tournois trouvés: ${response.data.length}`);
    
    response.data.forEach(t => {
      console.log(`- [${t.id}] ${t.attributes.name} (${t.attributes.url}) status: ${t.attributes.state}`);
    });

    // Essayer de trouver spécifiquement B_TS1
    console.log("\n2. Tentative de récupération de B_TS1...");
    try {
        const t = await client.getTournament('B_TS1');
        console.log(`✅ Trouvé B_TS1: ${t.data.attributes.name}`);
    } catch (e: any) {
        console.log(`❌ B_TS1 non trouvé via v1: ${e.message}`);
    }

  } catch (error: any) {
    console.error("❌ Erreur API v1:", error.message);
  }
}

checkV1();
