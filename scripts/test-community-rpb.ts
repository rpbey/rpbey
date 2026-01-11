
import { getChallongeService } from '../src/lib/challonge';
import dotenv from 'dotenv';

dotenv.config();

async function testCommunity() {
  const service = getChallongeService();
  try {
    console.log("Testing listCommunityTournaments with 'RPB'...");
    const res = await service.listCommunityTournaments('RPB');
    console.log(`✅ Success! Found ${res.data.length} tournaments.`);
    res.data.forEach(t => console.log(`- ${t.attributes.name} (${t.id})`));
  } catch (error: any) {
    console.log(`❌ Failed with 'RPB': ${error.message}`);
  }

  try {
    console.log("\nTesting listCommunityTournaments with 'rpb' (lowercase)...");
    const res = await service.listCommunityTournaments('rpb');
    console.log(`✅ Success! Found ${res.data.length} tournaments.`);
  } catch (error: any) {
    console.log(`❌ Failed with 'rpb': ${error.message}`);
  }
}

testCommunity();
