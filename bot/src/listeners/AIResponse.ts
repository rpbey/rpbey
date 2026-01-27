import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import { ChannelType, type Message } from 'discord.js';
import { clawdbotService } from '../lib/clawdbot.js';

@ApplyOptions<Listener.Options>({
  event: Events.MessageCreate,
})
export class AIResponse extends Listener {
  public async run(message: Message) {
    // Ignore bots and empty messages
    if (message.author.bot || !message.content) return;

    const isDM = message.channel.type === ChannelType.DM;
    const botId = this.container.client.user?.id;
    const isMention = botId
      ? message.mentions.has(botId) && !message.mentions.everyone
      : false;

    // We only respond automatically to direct mentions or DMs
    if (!isMention && !isDM) return;

    // Trigger typing indicator
    if ('sendTyping' in message.channel) {
      await (message.channel as any).sendTyping();
    }

    // Prepare message content (remove bot mention)
    const question = message.content
      .replace(new RegExp(`<@!?${botId}>`, 'g'), '')
      .trim();

    // Use channel ID as session ID to maintain context per channel
    const sessionId = isDM
      ? `dm-${message.author.id}`
      : `channel-${message.channel.id}`;

    const response = await clawdbotService.askRyuga(question, sessionId, {
      channel: 'discord',
      to: isDM ? `user:${message.author.id}` : `channel:${message.channel.id}`,
    });

    if (response) {
      // Split response if it's too long for Discord (2000 chars)
      if (response.length > 1950) {
        const chunks = response.match(/[\s\S]{1,1950}/g) || [response];
        for (const chunk of chunks) {
          await message.reply(chunk);
        }
      } else {
        await message.reply(response);
      }
    } else {
      this.container.logger.error(
        '[AIResponse] No response received from Clawdbot',
      );
    }
  }
}
