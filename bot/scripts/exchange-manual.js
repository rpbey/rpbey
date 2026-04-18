import { exchangeCode } from '@twurple/auth';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const clientId = process.env.TWITCH_CLIENT_ID;
const clientSecret = process.env.TWITCH_CLIENT_SECRET;
const code = 'sr3vradnpmxxuljofyhowx3pk7mqv3';
const redirectUri = 'https://rpbey.fr/api/twitch/callback';
const TOKEN_PATH = path.join(process.cwd(), 'data', 'twitch-tokens.json');

async function run() {
  try {
    console.log('Exchanging code for tokens...');
    const tokenData = await exchangeCode(clientId, clientSecret, code, redirectUri);
    
    await fs.writeFile(TOKEN_PATH, JSON.stringify({
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
      expiry: tokenData.expiresIn,
      obtainmentTimestamp: Date.now()
    }, null, 2));

    console.log('SUCCESS: Tokens saved to bot/data/twitch-tokens.json');
    console.log('Access Token:', tokenData.accessToken.substring(0, 5) + '...');
  } catch (error) {
    console.error('Exchange failed:', error.message);
    if (error.body) console.error('Response:', error.body);
  }
}

run();
