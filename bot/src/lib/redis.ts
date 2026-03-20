// eslint-disable-next-line @typescript-eslint/no-require-imports -- ioredis ESM compat
import IORedis from 'ioredis';

import { logger } from './logger.js';

// Handle ESM/CJS interop
const Redis =
  (IORedis as unknown as { default: new (...args: unknown[]) => IORedis.Redis })
    .default ?? IORedis;

export const redis = new (
  Redis as unknown as new (
    opts: IORedis.RedisOptions,
  ) => IORedis.Redis
)({
  host: '127.0.0.1',
  port: 6379,
  maxRetriesPerRequest: 3,
});

redis.on('error', (err: Error) => logger.error('[Redis]', err.message));
redis.on('connect', () => logger.info('[Redis] Connected'));

const MENTIONS_KEY = 'rpb:mentions';

/** Get mention count: how many times `fromId` mentioned `toId` */
export async function getMentions(
  fromId: string,
  toId: string,
): Promise<number> {
  const val = await redis.hget(MENTIONS_KEY, `${fromId}:${toId}`);
  return val ? Number.parseInt(val, 10) : 0;
}

/** Increment mention count */
export async function incrMentions(
  fromId: string,
  toId: string,
  count: number,
): Promise<void> {
  if (count <= 0) return;
  await redis.hincrby(MENTIONS_KEY, `${fromId}:${toId}`, count);
}

/** Set mention count (used by full scan) */
export async function setMentions(
  fromId: string,
  toId: string,
  count: number,
): Promise<void> {
  await redis.hset(MENTIONS_KEY, `${fromId}:${toId}`, count);
}

/** Get all mention pairs */
export async function getAllMentions(): Promise<Record<string, number>> {
  const data = await redis.hgetall(MENTIONS_KEY);
  const result: Record<string, number> = {};
  for (const [key, val] of Object.entries(data)) {
    result[key] = Number.parseInt(val, 10);
  }
  return result;
}

/** Clear all mention data (before full rescan) */
export async function clearMentions(): Promise<void> {
  await redis.del(MENTIONS_KEY);
}

/** Set last scan metadata */
export async function setScanMeta(
  channelsScanned: number,
  messagesScanned: number,
): Promise<void> {
  await redis.hset('rpb:mentions:meta', {
    channelsScanned: String(channelsScanned),
    messagesScanned: String(messagesScanned),
    lastScan: new Date().toISOString(),
  });
}

/** Get last scan metadata */
export async function getScanMeta(): Promise<{
  channelsScanned: number;
  messagesScanned: number;
  lastScan: string | null;
}> {
  const data = await redis.hgetall('rpb:mentions:meta');
  return {
    channelsScanned: Number.parseInt(data.channelsScanned || '0', 10),
    messagesScanned: Number.parseInt(data.messagesScanned || '0', 10),
    lastScan: data.lastScan || null,
  };
}
