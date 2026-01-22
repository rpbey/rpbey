import { Client, GatewayIntentBits } from 'discord.js';
import 'dotenv/config';

async function main() {
  const client = new Client({ intents: [GatewayIntentBits.Guilds] });
  await client.login(process.env.DISCORD_TOKEN);
  const guild = await client.guilds.fetch(process.env.GUILD_ID!);
  const channels = await guild.channels.fetch();
  channels.forEach(c => {
    if (c) console.log(`${c.id} ${c.name} (${c.type})`);
  });
  process.exit(0);
}
main();
