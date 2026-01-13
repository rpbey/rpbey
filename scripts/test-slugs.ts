
import { getChallongeService } from '../src/lib/challonge';
import dotenv from 'dotenv';

dotenv.config();

async function testSlugs() {
  const service = getChallongeService();
  const slugs = ['B_TS1', 'rpb-B_TS1', 'rpb_beyblade-B_TS1', 'rpb-B_TS1-1'];
  
  console.log("Testing slugs for BEY-TAMASHII SERIES #1...");
  
  for (const slug of slugs) {
    try {
      const ct = await service.getTournament(slug);
      console.log(`✅ Slug "${slug}" found! ID: ${ct.data.id}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.log(`❌ Slug "${slug}" failed: ${msg}`);
    }
  }
}

testSlugs();
