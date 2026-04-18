import { Client, GatewayIntentBits, TextChannel } from 'discord.js';

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

const channelId = '1333203623471087708';
const roleId = '1456751013741592678';
const message = `<@&${roleId}> 📢 **Alerte Communauté !**

Le système de notifications Twitch et YouTube est désormais officiellement configuré sur ce salon.

Restez à l'écoute pour les prochains lives et vidéos ! 🌀`;

async function run() {
  if (!process.env.DISCORD_TOKEN) {
    console.error('Missing DISCORD_TOKEN');
    process.exit(1);
  }

  try {
    await client.login(process.env.DISCORD_TOKEN);
    client.once('ready', async () => {
      const channel = await client.channels.fetch(channelId);
      if (channel && channel.isTextBased()) {
        await (channel as TextChannel).send(message);
        console.log('Announcement sent successfully!');
      } else {
        console.error('Channel not found or not text-based');
      }
      client.destroy();
    });
  } catch (error) {
    console.error('Failed to send announcement:', error);
    process.exit(1);
  }
}

run();
