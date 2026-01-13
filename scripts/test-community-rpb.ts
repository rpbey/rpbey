
import { getChallongeService } from '../src/lib/challonge';
import dotenv from 'dotenv';

dotenv.config();

async function testCommunity() {
  const service = getChallongeService();
  try {
    console.log("Trying with community ID 'RPB'...");
    const res = await service.listCommunityTournaments('RPB');
    console.log(`✅ Success 'RPB': ${res.data.length} tournaments.`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.log(`❌ Failed with 'RPB': ${msg}`);
  }

  try {
    console.log("\nTrying with community ID 'rpb'...");
    const res = await service.listCommunityTournaments('rpb');
    console.log(`✅ Success 'rpb': ${res.data.length} tournaments.`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.log(`❌ Failed with 'rpb': ${msg}`);
  }
}

testCommunity();
