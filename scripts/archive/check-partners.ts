
import { Client, GatewayIntentBits } from 'discord.js';
import { config } from 'dotenv';

config();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const client = new Client({ intents: [GatewayIntentBits.Guilds] } as any);

const partners = [
  { name: 'SATR', invite: 'https://discord.gg/afEvCBF9XR' },
  { name: 'WB', invite: 'https://discord.gg/AcuSPdb2HQ' }
];

client.once('ready', async () => {
  console.log(`Logged in as ${client.user?.tag}`);
  
  for (const p of partners) {
    try {
      console.log(`\n🔍 Checking ${p.name}...`);
      const invite = await client.fetchInvite(p.invite);
      const guild = invite.guild;
      
      if (guild) {
        console.log(`✅ FOUND: ${guild.name}`);
        console.log(`   ID: ${guild.id}`);
        console.log(`   Members: ${invite.memberCount}`);
        console.log(`   Description: ${guild.description || 'None'}`);
      } else {
        console.log(`⚠️  Invite valid but no guild info found for ${p.name}`);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`❌ Error fetching ${p.name}:`, msg);
    }
  }
  
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);

