
import { getChallongeService } from '../src/lib/challonge';

async function findTournament() {
  const service = getChallongeService();
  try {
    console.log("Recherche des tournois sur Challonge...");
    // On cherche les tournois, status 'in_progress' ou 'pending' pour voir si on le trouve
    const response = await service.listTournaments({ state: 'in_progress' }); 
    
    console.log(`Tournois trouvés: ${response.data.length}`);
    response.data.forEach(t => {
      console.log(`ID: ${t.id} | Nom: ${t.attributes.name} | URL: ${t.attributes.url} | State: ${t.attributes.state}`);
    });

    const endedResponse = await service.listTournaments({ state: 'ended' });
    console.log(`Tournois terminés trouvés: ${endedResponse.data.length}`);
    endedResponse.data.forEach(t => {
      console.log(`ID: ${t.id} | Nom: ${t.attributes.name} | URL: ${t.attributes.url} | State: ${t.attributes.state}`);
    });

  } catch (error) {
    console.error("Erreur API Challonge:", error);
  }
}

findTournament();
