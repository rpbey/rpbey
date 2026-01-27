
import { getChallongeService } from '../src/lib/challonge';
import dotenv from 'dotenv';

dotenv.config();

async function checkMe() {
  const service = getChallongeService();
  try {
    // getOAuthToken is private, so I'll just use a direct fetch or modify the service
    // But listTournaments should work if credentials are good.
    
    console.log("Checking API via direct fetch to /me...");
    const serviceInternal = service as unknown as { getOAuthToken: () => Promise<string> };
    const token = await serviceInternal.getOAuthToken();
    const response = await fetch('https://api.challonge.com/v2.1/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Authorization-Type': 'v2',
        'Content-Type': 'application/vnd.api+json'
      }
    });
    
    if (response.ok) {
        const data = await response.json();
        console.log("SUCCESS! Identity:", JSON.stringify(data, null, 2));
    } else {
        console.log("FAILED to get /me:", response.status, await response.text());
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Error:", msg);
  }
}

checkMe();
