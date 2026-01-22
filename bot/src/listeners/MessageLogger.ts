import * as fs from 'node:fs';
import * as path from 'node:path';
import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import { ChannelType, type Message } from 'discord.js';

@ApplyOptions<Listener.Options>({
  event: Events.MessageCreate,
})
export class MessageLogger extends Listener {
  public async run(message: Message) {
    // Ignore bots and empty messages
    if (message.author.bot || !message.content) return;

    // Check conditions: DM or Mention
    const isDM = message.channel.type === ChannelType.DM;
    const botId = this.container.client.user?.id;
    const isMention = botId
      ? message.mentions.has(botId) && !message.mentions.everyone
      : false;

    if (isDM || isMention) {
      const logEntry = {
        content: message.content,
        authorId: message.author.id,
        authorTag: message.author.tag,
        channelType: isDM ? 'DM' : 'GUILD',
        isMention: isMention,
        timestamp: new Date().toISOString(),
      };

      // Use .jsonl (JSON Lines) for efficient appending and ML compatibility
      // We assume the process running the bot starts from the root or we use absolute paths
      // process.cwd() should be the root of the project
      const dataPath = path.join(process.cwd(), 'data', 'training_data.jsonl');

      try {
        // Ensure directory exists
        const dir = path.dirname(dataPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        fs.appendFileSync(dataPath, `${JSON.stringify(logEntry)}\n`);
      } catch (error) {
        this.container.logger.error('Error logging training message:', error);
      }
    }
  }
}
