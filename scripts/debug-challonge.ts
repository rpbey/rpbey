
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const clientId = process.env.CHALLONGE_CLIENT_ID;
const clientSecret = process.env.CHALLONGE_CLIENT_SECRET;

async function testChallonge() {
    console.log('🧪 Testing Challonge API v2.1...');
    console.log(`Client ID: ${clientId ? 'SET' : 'MISSING'}`);
    console.log(`Client Secret: ${clientSecret ? 'SET' : 'MISSING'}`);

    if (!clientId || !clientSecret) {
        console.error('❌ Missing credentials');
        return;
    }

    try {
        console.log('📡 Requesting token with client_credentials...');
        const tokenRes = await fetch('https://api.challonge.com/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'client_credentials',
                client_id: clientId,
                client_secret: clientSecret,
                scope: 'tournaments:read'
            }).toString()
        });

        if (!tokenRes.ok) {
            const err = await tokenRes.text();
            console.error(`❌ Token Request Failed (${tokenRes.status}):`, err);
            return;
        }

        const tokenData = await tokenRes.json();
        console.log('✅ Token obtained successfully');
        
        const accessToken = tokenData.access_token;

        console.log('📡 Fetching tournaments...');
        const apiRes = await fetch('https://api.challonge.com/v2.1/tournaments.json', {
            headers: {
                'Authorization-Type': 'v2',
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/vnd.api+json',
                'Accept': 'application/json'
            }
        });

        if (!apiRes.ok) {
            const err = await apiRes.text();
            console.error(`❌ API Request Failed (${apiRes.status}):`, err);
            return;
        }

        const data = await apiRes.json();
        console.log('✅ Success! Found tournaments:', data.data?.length || 0);

    } catch (error) {
        console.error('❌ Critical Error during test:', error);
    }
}

testChallonge();
