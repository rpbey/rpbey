import { ChannelType } from 'discord.js';

import { bot } from '../../lib/bot.js';
import { logger } from '../../lib/logger.js';
import { clearMentions, redis, setScanMeta } from '../../lib/redis.js';

/**
 * Full scan of all text channels to index mention pairs.
 * Stores in Redis as hash: rpb:mentions { "fromId:toId" => count }
 */
export async function mentionsScanTask() {
  const guildId = process.env.GUILD_ID;
  if (!guildId) return;

  const guild = bot.guilds.cache.get(guildId);
  if (!guild) return;

  logger.info('[MentionsScan] Starting full mentions scan...');
  const start = Date.now();

  // Temporary accumulator
  const counts = new Map<string, number>();

  const textChannels = guild.channels.cache.filter(
    (c) =>
      (c.type === ChannelType.GuildText ||
        c.type === ChannelType.GuildAnnouncement) &&
      'messages' in c,
  );

  let channelsScanned = 0;
  let messagesScanned = 0;

  // Process channels in batches of 5 to avoid rate limits
  const channelArr = [...textChannels.values()];
  const BATCH = 5;

  for (let i = 0; i < channelArr.length; i += BATCH) {
    const batch = channelArr.slice(i, i + BATCH);

    await Promise.allSettled(
      batch.map(async (channel) => {
        if (!('messages' in channel)) return;
        try {
          let lastId: string | undefined;
          let fetched = 0;
          const MAX_MESSAGES = 500;

          // Paginate through messages
          while (fetched < MAX_MESSAGES) {
            const options: { limit: number; before?: string } = { limit: 100 };
            if (lastId) options.before = lastId;

            const messages = await channel.messages.fetch(options);
            if (messages.size === 0) break;

            for (const msg of messages.values()) {
              if (msg.author.bot) continue;
              messagesScanned++;

              // Check all mentioned users
              for (const mentioned of msg.mentions.users.values()) {
                if (mentioned.id === msg.author.id) continue;
                const key = `${msg.author.id}:${mentioned.id}`;
                counts.set(key, (counts.get(key) || 0) + 1);
              }
            }

            lastId = messages.last()?.id;
            fetched += messages.size;
            if (messages.size < 100) break;
          }

          channelsScanned++;
        } catch {
          // No permission or other error, skip channel
        }
      }),
    );
  }

  // Write to Redis
  try {
    await redis.connect().catch(() => {});
    await clearMentions();

    // Pipeline for performance
    const pipeline = redis.pipeline();
    for (const [key, count] of counts) {
      pipeline.hset('rpb:mentions', key, count);
    }
    await pipeline.exec();

    await setScanMeta(channelsScanned, messagesScanned);
  } catch (err) {
    logger.error('[MentionsScan] Redis write error:', err);
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  logger.info(
    `[MentionsScan] Done: ${channelsScanned} channels, ${messagesScanned} messages, ${counts.size} pairs in ${elapsed}s`,
  );
}
