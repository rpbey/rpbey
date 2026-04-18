import { REST, Routes } from 'discord.js';

async function clearAll() {
  const token = process.env.DISCORD_TOKEN;
  const guildId = process.env.GUILD_ID || process.env.DISCORD_GUILD_ID;
  
  if (!token) throw new Error('DISCORD_TOKEN missing');
  
  const getClientId = (t: string) => atob(t.split('.')[0] ?? '');
  const clientId = getClientId(token);

  const rest = new REST({ version: '10' }).setToken(token);

  console.log(`🧹 Vidage des commandes pour Client: ${clientId}`);

  try {
    console.log('🗑️ Suppression des commandes globales...');
    await rest.put(Routes.applicationCommands(clientId), { body: [] });
    
    if (guildId) {
      console.log(`🗑️ Suppression des commandes de guilde (${guildId})...`);
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: [] });
    }
    
    console.log('✅ Toutes les commandes ont été vidées.');
  } catch (error) {
    console.error('❌ Erreur lors du vidage:', error);
  }
}

clearAll();
