
import { Client, GatewayIntentBits } from 'discord.js';
import 'dotenv/config';

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

const MSG_ID = process.argv[2];

if (!MSG_ID) {
  console.error('Please provide a message ID');
  process.exit(1);
}

client.once('ready', async () => {
  try {
    // Try to find the message in all cached channels or fetch from specific known channels
    // Since we don't know the channel, we might need to search or rely on cache if the bot is running.
    // But this is a standalone script.
    // Strategy: Fetch all channels, then fetch message.
    
    // Optimisation: rpb-bot knows its channels. 
    // Let's assume the message is in the main guild.
    const guildId = '1319715782032228463'; // RPB Guild ID from memory
    const guild = await client.guilds.fetch(guildId);
    
    if (!guild) {
        console.error('Guild not found');
        process.exit(1);
    }

    // We have to scan text channels. This is expensive but necessary without channel ID.
    // However, the user provided just the ID.
    // Let's try the Staff chat first as it's likely context, or general.
    // Staff chat: 1323818684686401628
    // But better: iterate text channels.
    
    const channels = await guild.channels.fetch();
    const textChannels = channels.filter(c => c && c.isTextBased());

    for (const channel of textChannels.values()) {
        try {
            if (!channel || !channel.isTextBased()) continue;
            const msg = await channel.messages.fetch(MSG_ID).catch(() => null);
            if (msg) {
                console.log(JSON.stringify({
                    content: msg.content,
                    author: msg.author.username,
                    attachments: msg.attachments.map(a => a.url),
                    channel: channel.name
                }));
                process.exit(0);
            }
        } catch {
            // ignore permission errors
        }
    }
    
    console.error('Message not found');
    process.exit(1);

  } catch (error) {
    console.error(error);
    process.exit(1);
  }
});

client.login(process.env.DISCORD_TOKEN);
