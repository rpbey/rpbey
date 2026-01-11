
import { getChallongeService } from '../src/lib/challonge';
import dotenv from 'dotenv';

dotenv.config();

async function testSlugs() {
  const service = getChallongeService();
  const slugs = ['B_TS1', 'rpb-B_TS1', 'rpb_beyblade-B_TS1', 'rpb-B_TS1-1'];
  
  console.log("Testing slugs for BEY-TAMASHII SERIES #1...");
  
  for (const slug of slugs) {
    try {
      const t = await service.getTournament(slug);
      console.log(`✅ FOUND with slug "${slug}": ${t.data.attributes.name}`);
      return;
    } catch (e: any) {
      console.log(`❌ Slug "${slug}" failed: ${e.message}`);
    }
  }
}

testSlugs();
