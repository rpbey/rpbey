import { getChallongeService } from "@/lib/challonge";
import dotenv from "dotenv";
import path from "path";

// Load environment variables manually since we're running as a script
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function checkTournament() {
  const service = getChallongeService();
  const tournamentId = "B_TS1"; // Derived from URL https://challonge.com/fr/B_TS1

  console.log(`Checking tournament: ${tournamentId}...`);

  try {
    const response = await service.getTournament(tournamentId);
    const tournament = response.data;

    console.log("✅ Tournament Found:");
    console.log(`- ID: ${tournament.id}`);
    console.log(`- Name: ${tournament.attributes.name}`);
    console.log(`- URL: ${tournament.attributes.url}`);
    console.log(`- State: ${tournament.attributes.state}`);
    console.log(`- Game: ${tournament.attributes.gameName}`);
    console.log(`- Type: ${tournament.attributes.tournamentType}`);
    console.log(`- Participants: ${tournament.attributes.participantsCount}`);

    if (tournament.attributes.startAt) {
      console.log(`- Start At: ${tournament.attributes.startAt}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`❌ Error fetching tournament: ${error.message}`);
    } else {
      console.error("❌ Unknown error occurred", error);
    }
  }
}

checkTournament();
