import { exchangeCode } from '@twurple/auth';
import readline from 'node:readline';

const clientId = process.env.TWITCH_CLIENT_ID;
const clientSecret = process.env.TWITCH_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error('Error: TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET must be set in .env');
  process.exit(1);
}

const redirectUri = 'https://rpbey.fr/api/twitch/callback';
const scopes = ['chat:read', 'chat:edit', 'channel:moderate', 'moderation:read'];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('--- Twitch Bot Token Generator ---');
console.log('1. Visit this URL in your browser:');
console.log(`https://id.twitch.tv/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scopes.join('+')}`);
console.log('\n2. Authorize the application.');
console.log('3. You will be redirected to http://localhost:3000/?code=...');
console.log('4. Copy the "code" parameter from the URL.');

rl.question('\nEnter the code here: ', async (code) => {
  try {
    const tokenData = await exchangeCode(clientId, clientSecret, code.trim(), redirectUri);

    console.log('\n--- SUCCESS! ---');
    console.log('Add these lines to your .env file:\n');
    console.log(`TWITCH_BOT_ACCESS_TOKEN="${tokenData.accessToken}"`);
    console.log(`TWITCH_BOT_REFRESH_TOKEN="${tokenData.refreshToken}"`);
    console.log('\n----------------');

  } catch (error) {
    console.error('\nError exchanging code:', error.message);
  } finally {
    rl.close();
  }
});
