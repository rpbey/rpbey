import { Client, GatewayIntentBits } from 'discord.js';
import 'dotenv/config';

const ROLES_TO_CREATE = ['Participant', 'Spectateur'];
const ROLES_TO_FIND = ['Reseaux', 'Events', 'Leaks-beyblade'];

async function main() {
  const client = new Client({
    intents: [GatewayIntentBits.Guilds],
  });

  try {
    await client.login(process.env.DISCORD_TOKEN);
  } catch (error) {
    console.error('Failed to login:', error);
    process.exit(1);
  }

  const guildId = process.env.GUILD_ID;
  if (!guildId) {
    console.error('GUILD_ID not found in .env');
    process.exit(1);
  }

  const guild = await client.guilds.fetch(guildId);
  if (!guild) {
    console.error(`Guild ${guildId} not found`);
    process.exit(1);
  }

  console.log(`Connected to guild: ${guild.name}`);

  const roles = await guild.roles.fetch();
  const roleMap: Record<string, string> = {};

  // Find existing roles
  for (const name of [...ROLES_TO_CREATE, ...ROLES_TO_FIND]) {
    const role = roles.find(r => r.name === name);
    if (role) {
      console.log(`Found existing role: ${name} (${role.id})`);
      roleMap[name] = role.id;
    }
  }

  // Create missing roles
  for (const name of ROLES_TO_CREATE) {
    if (!roleMap[name]) {
      console.log(`Creating role: ${name}...`);
      try {
        const newRole = await guild.roles.create({
          name: name,
          reason: 'Created via Gemini CLI for reaction roles',
        });
        console.log(`Created role: ${name} (${newRole.id})`);
        roleMap[name] = newRole.id;
      } catch (error) {
        console.error(`Failed to create role ${name}:`, error);
      }
    }
  }

  console.log('\n--- ROLE IDS FOR CONSTANTS.TS ---');
  console.log(`Participant: '${roleMap['Participant'] || 'MISSING'}'`);
  console.log(`Spectateur: '${roleMap['Spectateur'] || 'MISSING'}'`);
  console.log(`Reseaux: '${roleMap['Reseaux'] || 'MISSING'}'`);
  console.log(`Events: '${roleMap['Events'] || 'MISSING'}'`);
  console.log(`Leaks: '${roleMap['Leaks-beyblade'] || 'MISSING'}'`);

  await client.destroy();
}

main().catch(console.error);
