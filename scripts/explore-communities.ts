
import { getChallongeService } from '../src/lib/challonge';
import dotenv from 'dotenv';

dotenv.config();

async function exploreCommunities() {
  const service = getChallongeService();
  try {
    // Attempt to list communities or find 'RPB'
    console.log("Exploring API for communities...");
    
    // We'll use the 'request' method directly if we can access it (it's private, so we cast to any)
    const client = service as any;
    
    // Try listing communities (guess endpoint)
    // Challonge v2 API documentation isn't fully clear on 'list communities' endpoint in the code
    // But let's try some common patterns
    
    const endpoints = [
        '/communities',
        '/communities/RPB',
        '/organizations',
        '/me' // Maybe communities are in 'me'?
    ];

    for (const ep of endpoints) {
        try {
            console.log(`Trying GET ${ep}...`);
            const res = await client.request('GET', ep);
            console.log(`✅ Success ${ep}:`, JSON.stringify(res, null, 2).substring(0, 500));
        } catch (e: any) {
            console.log(`❌ Failed ${ep}: ${e.message}`);
        }
    }

  } catch (error: any) {
    console.error("Error:", error.message);
  }
}

exploreCommunities();
