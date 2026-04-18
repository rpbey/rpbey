import { Client, GatewayIntentBits } from 'discord.js';

async function main() {
  const token = process.env.DISCORD_TOKEN;
  const guildId = '1319715782032228463';
  const probotId = '282859044593598464';

  const client = new Client({ intents: [GatewayIntentBits.Guilds] });

  try {
    await client.login(token);
    const guild = await client.guilds.fetch(guildId);
    console.log(`--- Fetching Commands for Guild: ${guild.name} ---`);
    
    // Use the client's internal application command manager
    // to list commands from ANY application in the guild
    const commands = await guild.commands.fetch();
    
    const probotCommands = commands.filter(cmd => cmd.applicationId === probotId);
    
    if (probotCommands.size === 0) {
        console.log('No guild-specific commands found for ProBot.');
    } else {
        console.log(`Found ${probotCommands.size} guild-specific commands for ProBot:`);
        probotCommands.forEach(cmd => {
            console.log(`- /${cmd.name}: ${cmd.description}`);
        });
    }

    console.log('\n--- Note ---');
    console.log('Les commandes globales de ProBot ne sont pas listables par une autre application via l\'API.');
    
    client.destroy();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
