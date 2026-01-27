
import 'dotenv/config';
import { Client, GatewayIntentBits, ChannelType, type TextChannel } from 'discord.js';
import { clawdbotService } from '../src/lib/clawdbot.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

async function main() {
  await client.login(process.env.DISCORD_TOKEN);
  
  const botId = client.user?.id;
  if (!botId) throw new Error('Bot ID not found');

  // We check the last 50 messages in allowed channels
  const allowedChannels = ['1319715782820892768', '1323818684686401628', '1465386365272195232'];

  for (const channelId of allowedChannels) {
    const channel = await client.channels.fetch(channelId);
    if (!channel || channel.type !== ChannelType.GuildText) continue;

    const messages = await (channel as TextChannel).messages.fetch({ limit: 50 });
    
    // Reverse to process oldest first
    const sortedMessages = Array.from(messages.values()).reverse();

    for (const msg of sortedMessages) {
      if (msg.author.bot) continue;
      
      // If mentioned but no bot reply follows immediately
      const isMentioned = msg.mentions.has(botId);
      if (isMentioned) {
          // Check if there is already a reply from the bot
          const nextMessages = sortedMessages.slice(sortedMessages.indexOf(msg) + 1);
          const alreadyReplied = nextMessages.some(m => m.author.id === botId && m.reference?.messageId === msg.id);
          
          if (!alreadyReplied) {
              console.log(`Processing missed mention from ${msg.author.username} in ${channel.name}`);
              await msg.channel.sendTyping();
              const response = await clawdbotService.askRyuga(msg.content, `channel-${channelId}`, {
                  channel: 'discord',
                  to: `channel:${channelId}`
              });
              if (response) {
                  await msg.reply(response);
              }
          }
      }
    }
  }

  await client.destroy();
}

main().catch(console.error);
