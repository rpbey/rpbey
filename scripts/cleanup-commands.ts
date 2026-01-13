import {
	REST,
	Routes
} from 'discord.js';
import {
	config
} from 'dotenv';

// Load .env
config();

async function main() {
  const token = process.env.DISCORD_TOKEN;
  const guildId = process.env.GUILD_ID;
  
  if (!token) throw new Error('DISCORD_TOKEN missing');
  if (!guildId) throw new Error('GUILD_ID missing');

  console.log('🧹 Starting command cleanup...');

  // Helper to get Client ID from Token
  const getClientId = (t: string) => {
    try {
      const part = t.split('.')[0];
      if (!part) throw new Error('Invalid Token');
      return Buffer.from(part, 'base64').toString('utf-8');
    } catch {
      throw new Error('Invalid Token format');
    }
  };

  const clientId = getClientId(token);
  console.log(`Client ID: ${clientId}`);

  const rest = new REST({ version: '10' }).setToken(token);

  try {
    // 1. Fetch Global Commands
    console.log('Fetching Global Commands...');
    const globalCommands = await rest.get(Routes.applicationCommands(clientId)) as unknown[];
    console.log(`Found ${globalCommands.length} Global commands.`);

    // 2. Fetch Guild Commands
    console.log(`Fetching Guild Commands for ${guildId}...`);
    const guildCommands = await rest.get(Routes.applicationGuildCommands(clientId, guildId)) as unknown[];
    console.log(`Found ${guildCommands.length} Guild commands.`);

    // 3. Delete ALL Global commands (to remove duplicates)
    if (globalCommands.length > 0) {
      console.log('🗑️ Deleting ALL Global commands to resolve duplicates...');
      // We can delete them one by one or set the list to empty
      await rest.put(Routes.applicationCommands(clientId), { body: [] });
      console.log('✅ Global commands cleared.');
    } else {
      console.log('✨ No Global commands to clear.');
    }

    console.log('\n✅ Cleanup complete. Only Guild commands should remain.');
    console.log('You might need to restart your Discord client to see changes immediately.');

  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

main();
