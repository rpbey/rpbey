import crypto from 'node:crypto';
import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from 'node:http';
import type {
  Collection,
  Guild,
  GuildMember,
  GuildTextBasedChannel,
} from 'discord.js';
import { z } from 'zod';
import { bot } from './bot.js';
import { RPB } from './constants.js';
import { logger } from './logger.js';
import { SocketManager } from './socket-manager.js';

const logs: { timestamp: string; level: string; message: string }[] = [];
const MAX_LOGS = 1000;

// Rate Limiting
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 60; // 60 requests per minute
const requestCounts = new Map<string, { count: number; startTime: number }>();

// Zod Schemas
const DispatchSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('send_message'),
    params: z.object({ channelId: z.string(), content: z.string() }),
  }),
  z.object({
    action: z.literal('send_dm'),
    params: z.object({ userId: z.string(), content: z.string() }),
  }),
  z.object({
    action: z.literal('add_role'),
    params: z.object({ userId: z.string(), roleId: z.string() }),
  }),
  z.object({
    action: z.literal('remove_role'),
    params: z.object({ userId: z.string(), roleId: z.string() }),
  }),
]);

let lastMemberFetch = 0;
let memberFetchPromise: Promise<
  Collection<string, GuildMember> | undefined
> | null = null;
const MEMBER_FETCH_COOLDOWN = 5 * 60 * 1000;

async function _ensureMembers(guild: Guild) {
  if (memberFetchPromise) return memberFetchPromise;
  if (Date.now() - lastMemberFetch < MEMBER_FETCH_COOLDOWN) return;

  memberFetchPromise = guild.members
    .fetch()
    .then((members) => {
      lastMemberFetch = Date.now();
      return members;
    })
    .catch((err) => {
      logger.error('Failed to fetch members:', err);
      return undefined;
    })
    .finally(() => {
      memberFetchPromise = null;
    });

  return memberFetchPromise;
}

export function addLog(level: string, message: string) {
  const logEntry = { timestamp: new Date().toISOString(), level, message };
  logs.push(logEntry);
  if (logs.length > MAX_LOGS) logs.shift();

  const socketManager = SocketManager.getInstance();
  if (socketManager.io) {
    socketManager.emit('log_new', logEntry);
  }
}

export function getLogs(tail = 100) {
  return logs.slice(-tail);
}

export async function getBotStatus() {
  const client = bot;
  const guild = await client.guilds
    .fetch({
      guild: process.env.GUILD_ID ?? '',
      withCounts: true,
    })
    .catch(() => null);

  return {
    status: client.isReady() ? 'running' : 'starting',
    uptime: client.uptime ?? 0,
    uptimeFormatted: formatUptime(client.uptime ?? 0),
    guilds: client.guilds.cache.size,
    users: client.users.cache.size,
    memberCount: guild?.approximateMemberCount ?? guild?.memberCount ?? 0,
    onlineCount: guild?.approximatePresenceCount ?? 0,
    ping: client.ws.ping,
    memoryUsage: formatMemory(process.memoryUsage().heapUsed),
    nodeVersion: process.version,
  };
}

function formatUptime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}j ${h % 24}h ${m % 60}m`;
  if (h > 0) return `${h}h ${m % 60}m`;
  return `${m}m ${s % 60}s`;
}

function formatMemory(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function sendJSON(res: ServerResponse, data: unknown, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = requestCounts.get(ip);

  if (!record) {
    requestCounts.set(ip, { count: 1, startTime: now });
    return true;
  }

  if (now - record.startTime > RATE_LIMIT_WINDOW) {
    requestCounts.set(ip, { count: 1, startTime: now });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  record.count++;
  return true;
}

// Cleanup rate limit map periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of requestCounts.entries()) {
    if (now - record.startTime > RATE_LIMIT_WINDOW) {
      requestCounts.delete(ip);
    }
  }
}, RATE_LIMIT_WINDOW);

async function handleRequest(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', 'https://rpbey.fr');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Rate Limiting
  const ip = req.socket.remoteAddress || 'unknown';
  if (!checkRateLimit(ip)) {
    return sendJSON(res, { error: 'Too Many Requests' }, 429);
  }

  // Security: Constant-time API Key comparison
  const apiKey = req.headers['x-api-key'];
  const expectedKey = process.env.BOT_API_KEY;

  if (!expectedKey) {
    logger.error('BOT_API_KEY not set in environment!');
    return sendJSON(res, { error: 'Server misconfiguration' }, 500);
  }

  const providedKeyBuffer = Buffer.from(
    typeof apiKey === 'string' ? apiKey : '',
    'utf8',
  );
  const expectedKeyBuffer = Buffer.from(expectedKey, 'utf8');

  if (
    providedKeyBuffer.length !== expectedKeyBuffer.length ||
    !crypto.timingSafeEqual(providedKeyBuffer, expectedKeyBuffer)
  ) {
    return sendJSON(res, { error: 'Unauthorized' }, 401);
  }

  const url = new URL(
    req.url ?? '/',
    `http://${req.headers.host ?? 'localhost'}`,
  );

  try {
    switch (url.pathname) {
      case '/api/status':
        return sendJSON(res, await getBotStatus());
      case '/api/commands': {
        const commands = bot.applicationCommands.map((cmd) => ({
          name: cmd.name,
          description: cmd.description,
          category: 'group' in cmd ? String(cmd.group) : 'Général',
          enabled: true,
        }));
        return sendJSON(res, { commands });
      }
      case '/api/logs':
        return sendJSON(res, {
          logs: getLogs(parseInt(url.searchParams.get('tail') ?? '100', 10)),
        });
      case '/api/roles': {
        const guild = bot.guilds.cache.get(process.env.GUILD_ID ?? '');
        if (!guild) return sendJSON(res, { error: 'Guild not found' }, 404);
        const roles = guild.roles.cache
          .filter((r) => r.name !== '@everyone')
          .map((r) => ({
            id: r.id,
            name: r.name,
            color: r.hexColor,
            position: r.position,
            managed: r.managed,
          }))
          .sort((a, b) => b.position - a.position);
        return sendJSON(res, { roles });
      }
      case '/api/channels': {
        const guild = bot.guilds.cache.get(process.env.GUILD_ID ?? '');
        if (!guild) return sendJSON(res, { error: 'Guild not found' }, 404);
        const channels = guild.channels.cache
          .filter((c) => c.isTextBased())
          .map((c) => ({
            id: c.id,
            name: c.name,
            type: c.type,
            parentId: 'parentId' in c ? c.parentId : null,
            position: 'position' in c ? c.position : 0,
          }))
          .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
        return sendJSON(res, { channels });
      }
      case '/api/members-by-role': {
        const roleId = url.searchParams.get('roleId');
        const guild = bot.guilds.cache.get(process.env.GUILD_ID ?? '');
        if (!guild) return sendJSON(res, { error: 'Guild not found' }, 404);

        await _ensureMembers(guild);

        let members = guild.members.cache;
        if (roleId) {
          members = members.filter((m) => m.roles.cache.has(roleId));
        }

        return sendJSON(res, {
          members: members.map((m) => ({
            id: m.id,
            username: m.user.username,
            displayName: m.displayName,
            nickname: m.nickname,
            avatar: m.user.displayAvatarURL(),
            roles: m.roles.cache.map((r) => r.id),
            joinedAt: m.joinedTimestamp,
            globalName: m.user.globalName,
            serverAvatar: m.avatarURL(),
          })),
        });
      }
      case '/api/webhook/twitch': {
        if (req.method !== 'POST')
          return sendJSON(res, { error: 'Method not allowed' }, 405);
        let body = '';
        let bodySize = 0;

        req.on('data', (c) => {
          body += c;
          bodySize += c.length;
          if (bodySize > 1e6) {
            // 1MB limit
            req.destroy();
            return sendJSON(res, { error: 'Payload too large' }, 413);
          }
        });

        req.on('end', () => {
          void (async () => {
            try {
              const data = JSON.parse(body) as {
                event?: {
                  type: string;
                  broadcaster_user_name?: string;
                  broadcaster_user_login?: string;
                };
              };
              if (data.event?.type === 'live') {
                const channel = bot.channels.cache.get(RPB.Channels.Social);
                if (channel?.isTextBased()) {
                  const mention = RPB.Roles.Reseaux
                    ? `<@&${RPB.Roles.Reseaux}>`
                    : '@everyone';
                  await (channel as GuildTextBasedChannel).send(
                    `${mention} 🔴 **${data.event.broadcaster_user_name} est en LIVE !**\nhttps://www.twitch.tv/${data.event.broadcaster_user_login}`,
                  );
                }
              }
              sendJSON(res, { ok: true });
            } catch {
              sendJSON(res, { error: 'Invalid JSON' }, 400);
            }
          })();
        });
        return;
      }
      case '/api/agent/dispatch': {
        if (req.method !== 'POST')
          return sendJSON(res, { error: 'Method not allowed' }, 405);
        let body = '';
        let bodySize = 0;

        req.on('data', (c) => {
          body += c;
          bodySize += c.length;
          if (bodySize > 1e6) {
            // 1MB limit
            req.destroy();
            return sendJSON(res, { error: 'Payload too large' }, 413);
          }
        });

        req.on('end', () => {
          void (async () => {
            try {
              const rawData = JSON.parse(body);
              const validation = DispatchSchema.safeParse(rawData);

              if (!validation.success) {
                return sendJSON(
                  res,
                  {
                    error: 'Invalid payload schema',
                    details: validation.error,
                  },
                  400,
                );
              }

              const { action, params } = validation.data;
              const guild = bot.guilds.cache.get(process.env.GUILD_ID ?? '');
              if (!guild)
                return sendJSON(res, { error: 'Guild not found' }, 500);

              switch (action) {
                case 'send_message': {
                  const channel = await bot.channels.fetch(params.channelId);
                  if (channel?.isTextBased()) {
                    const msg = await (channel as GuildTextBasedChannel).send(
                      params.content,
                    );
                    return sendJSON(res, { success: true, id: msg.id });
                  }
                  return sendJSON(res, { error: 'Invalid channel' }, 400);
                }
                case 'send_dm': {
                  const user = await bot.users.fetch(params.userId);
                  if (user) {
                    const msg = await user.send(params.content);
                    return sendJSON(res, { success: true, id: msg.id });
                  }
                  return sendJSON(res, { error: 'User not found' }, 404);
                }
                case 'add_role': {
                  const member = await guild.members.fetch(params.userId);
                  await member.roles.add(params.roleId);
                  return sendJSON(res, { success: true });
                }
                case 'remove_role': {
                  const member = await guild.members.fetch(params.userId);
                  await member.roles.remove(params.roleId);
                  return sendJSON(res, { success: true });
                }
              }
            } catch (e) {
              logger.error('[AgentDispatch] Error:', e);
              sendJSON(res, { error: String(e) }, 500);
            }
          })();
        });
        return;
      }
      default:
        return sendJSON(res, { error: 'Not found' }, 404);
    }
  } catch (error) {
    logger.error('API Server Error:', error);
    return sendJSON(res, { error: 'Internal server error' }, 500);
  }
}

export function startApiServer(port = 3001) {
  const server = createServer((req, res) => {
    void handleRequest(req, res);
  });
  SocketManager.getInstance().init(server);
  server.listen(port, '0.0.0.0', () => {
    logger.info(`Bot API server listening on port ${port}`);
  });
  return server;
}
