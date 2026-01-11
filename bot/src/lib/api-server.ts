import { container } from '@sapphire/framework';
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
import { Colors, RPB } from './constants.js';

const logs: { timestamp: string; level: string; message: string }[] = [];
const MAX_LOGS = 1000;

// Member fetch throttling

let lastMemberFetch = 0;

let memberFetchPromise: Promise<Collection<string, GuildMember> | undefined> | null = null;

const MEMBER_FETCH_COOLDOWN = 5 * 60 * 1000; // 5 minutes

async function ensureMembers(guild: Guild) {
  // If a fetch is already in progress, wait for it
  if (memberFetchPromise) {
    return memberFetchPromise;
  }

  // If we fetched recently, rely on cache
  if (Date.now() - lastMemberFetch < MEMBER_FETCH_COOLDOWN) {
    // Check if cache seems reasonable (e.g. > 90% of member count)
    // If cache is empty or very low, we might force fetch regardless of cooldown?
    // For now, trust the cooldown.
    return;
  }

  // Start a new fetch
  memberFetchPromise = guild.members
    .fetch()
    .then((members) => {
      lastMemberFetch = Date.now();
      return members;
    })
    .catch((err) => {
      container.logger.error("Failed to fetch members:", err);
      // Don't update lastMemberFetch so we retry next time (or maybe cooldown on error too?)
      return undefined;
    })
    .finally(() => {
      memberFetchPromise = null;
    });

  return memberFetchPromise;
}

export function addLog(level: string, message: string) {
  logs.push({
    timestamp: new Date().toISOString(),
    level,
    message,
  });

  // Keep only the last MAX_LOGS entries
  if (logs.length > MAX_LOGS) {
    logs.shift();
  }
}

export function getLogs(tail = 100) {
  return logs.slice(-tail);
}

export async function getBotStatus() {
  const client = container.client;
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
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}j ${hours % 24}h ${minutes % 60}m`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

function formatMemory(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(2)} MB`;
}

/**
 * Base JSON response helper
 */
function sendJSON(res: ServerResponse, data: unknown, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

/**
 * Error response helper
 */
function sendError(res: ServerResponse, message: string, status = 400) {
  sendJSON(res, { error: message }, status);
}

async function handleRequest(req: IncomingMessage, res: ServerResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

  // OPTIONS for Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Check API key
  const apiKey = req.headers['x-api-key'];
  const expectedKey = process.env.BOT_API_KEY;

  if (expectedKey && apiKey !== expectedKey) {
    return sendError(res, 'Unauthorized', 401);
  }

  const url = new URL(
    req.url ?? '/',
    `http://${req.headers.host ?? 'localhost'}`,
  );

  // Router Logic
  try {
    switch (url.pathname) {
      case '/health':
      case '/api/health':
        return sendJSON(res, { ok: true });

      case '/api/status':
        return sendJSON(res, await getBotStatus());

      case '/api/logs': {
        const tail = parseInt(url.searchParams.get('tail') ?? '100', 10);
        return sendJSON(res, { logs: getLogs(tail) });
      }

      case '/api/restart':
      case '/api/sync-commands': {
        if (req.method !== 'POST')
          return sendError(res, 'Method not allowed', 405);
        sendJSON(res, { ok: true, message: 'Bot syncing/restarting...' });
        container.logger.info(
          'Sync/Restart requested via API. Exiting in 1s...',
        );
        setTimeout(() => process.exit(0), 1000);
        return;
      }

      case '/api/roles': {
        const guildId = process.env.GUILD_ID;
        if (!guildId) return sendError(res, 'GUILD_ID not configured');

        const guild = container.client.guilds.cache.get(guildId);
        if (!guild) return sendError(res, 'Guild not found in cache', 404);

        const roles = guild.roles.cache
          .filter((role) => role.name !== '@everyone')
          .map((role) => ({
            id: role.id,
            name: role.name,
            color: role.hexColor,
            position: role.position,
            managed: role.managed,
          }))
          .sort((a, b) => b.position - a.position);

        return sendJSON(res, { roles });
      }

      case '/api/member': {
        // Handle /api/members/:id via logic since switch match is exact path usually?
        // Actually the current router is basic switch(url.pathname).
        // I will add a check for prefix or query param.
        // Let's use /api/member?userId=<id>
        const userId = url.searchParams.get('userId');
        const guildId = process.env.GUILD_ID;

        if (!userId || !guildId)
          return sendError(res, 'Missing userId or GUILD_ID');

        try {
          const guild = container.client.guilds.cache.get(guildId);
          if (!guild) return sendError(res, 'Guild not found', 404);

          const member = await guild.members.fetch(userId).catch(() => null);
          if (!member) return sendError(res, 'Member not found', 404);

          return sendJSON(res, {
            member: {
              id: member.id,
              username: member.user.username,
              displayName: member.displayName,
              avatar: member.user.displayAvatarURL({
                extension: 'png',
                size: 256,
              }),
              nickname: member.nickname,
              joinedAt: member.joinedAt,
              premiumSince: member.premiumSince,
              roles: member.roles.cache.map((r) => ({
                name: r.name,
                color: r.hexColor,
                id: r.id,
              })),
              status: member.presence?.status,
              activities: member.presence?.activities,
              serverAvatar: member.avatarURL({ extension: 'png', size: 256 }),
              globalName: member.user.globalName,
              createdAt: member.user.createdAt,
            },
          });
        } catch (e) {
          container.logger.error(`Error in member fetch for ${userId}:`, e);
          return sendError(res, `Internal error: ${String(e)}`, 500);
        }
      }

      case '/api/members-by-role': {
        const roleId = url.searchParams.get('roleId');
        const guildId = process.env.GUILD_ID;

        if (!roleId || !guildId)
          return sendError(res, 'Missing roleId or GUILD_ID');

        try {
          const guild = container.client.guilds.cache.get(guildId);
          if (!guild) return sendError(res, 'Guild not found', 404);

          // Ensure members are cached (throttled)
          await ensureMembers(guild);

          const role = guild.roles.cache.get(roleId);
          if (!role) return sendError(res, 'Role not found', 404);

          const members = role.members.map((m) => ({
            id: m.id,
            username: m.user.username,
            displayName: m.displayName,
            avatar: m.user.displayAvatarURL({ extension: 'png', size: 256 }),
            nickname: m.nickname,
            joinedAt: m.joinedAt,
            premiumSince: m.premiumSince,
            roles: m.roles.cache.map((r) => ({
              name: r.name,
              color: r.hexColor,
              id: r.id,
            })),
            status: m.presence?.status,
            activities: m.presence?.activities,
            serverAvatar: m.avatarURL({ extension: 'png', size: 256 }),
            globalName: m.user.globalName,
            createdAt: m.user.createdAt,
          }));

          return sendJSON(res, { members });
        } catch (e) {
          container.logger.error(
            `Error in members-by-role for role ${roleId}:`,
            e,
          );
          return sendError(res, `Internal error: ${String(e)}`, 500);
        }
      }

      case '/api/config': {
        const safeEnvKeys = ['NODE_ENV', 'GUILD_ID', 'OWNER_IDS'];
        const env: Record<string, string> = {};
        for (const key of safeEnvKeys) {
          if (process.env[key]) env[key] = process.env[key];
        }

        const colorsFormatted: Record<string, string> = {};
        for (const [key, value] of Object.entries(Colors)) {
          colorsFormatted[key] = `0x${value.toString(16).padStart(6, '0')}`;
        }

        return sendJSON(res, {
          env,
          constants: {
            RPB: {
              Name: RPB.Name,
              FullName: RPB.FullName,
              Discord: RPB.Discord,
            },
            Colors: colorsFormatted,
            Channels: RPB.Channels,
            Roles: RPB.Roles,
            Partners: RPB.Partners,
          },
        });
      }

      case '/api/commands': {
        const commands = container.stores.get('commands');
        const list = commands.map((cmd) => ({
          name: cmd.name,
          description: cmd.description,
          category: cmd.category ?? 'Uncategorized',
          enabled: cmd.enabled,
        }));
        return sendJSON(res, { commands: list });
      }

      case '/api/webhook/twitch': {
        if (req.method !== 'POST')
          return sendError(res, 'Method not allowed', 405);

        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
        });
        req.on('end', async () => {
          try {
            const data = JSON.parse(body);
            if (data.event?.type === 'live') {
              const channel = container.client.channels.cache.get(
                RPB.Channels.Social,
              );
              if (channel?.isTextBased()) {
                await (channel as GuildTextBasedChannel).send({
                  content: `@everyone 🔴 **${data.event.broadcaster_user_name} est en LIVE !**\nhttps://www.twitch.tv/${data.event.broadcaster_user_login}`,
                });
              }
            }
            sendJSON(res, { ok: true });
          } catch {
            sendError(res, 'Invalid JSON', 400);
          }
        });
        return;
      }

      case '/api/webhook/twitch/verify': {
        if (req.method !== 'GET')
          return sendError(res, 'Method not allowed', 405);
        const challenge = url.searchParams.get('hub.challenge');
        container.logger.info(
          `[TwitchVerify] Received challenge: ${challenge}`,
        );
        if (challenge) {
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end(challenge);
          return;
        }
        return sendError(res, 'No challenge provided', 400);
      }

      case '/api/agent/dispatch': {
        if (req.method !== 'POST')
          return sendError(res, 'Method not allowed', 405);

        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
        });
        req.on('end', async () => {
          try {
            const { action, params } = JSON.parse(body);
            const client = container.client;
            const guild = client.guilds.cache.get(process.env.GUILD_ID ?? '');

            if (!guild) return sendError(res, 'Guild not found', 500);

            switch (action) {
              case 'send_message': {
                if (!params?.channelId || !params?.content)
                  return sendError(res, 'Missing params');
                const channel = await client.channels.fetch(params.channelId);
                if (!channel || !channel.isTextBased())
                  return sendError(res, 'Invalid channel');
                const msg = await (channel as GuildTextBasedChannel).send(
                  params.content,
                );
                return sendJSON(res, { success: true, id: msg.id });
              }

              case 'send_dm': {
                if (!params?.userId || !params?.content)
                  return sendError(res, 'Missing params');
                const user = await client.users.fetch(params.userId);
                const msg = await user.send(params.content);
                return sendJSON(res, { success: true, id: msg.id });
              }

              case 'add_role': {
                if (!params?.userId || !params?.roleId)
                  return sendError(res, 'Missing params');
                const member = await guild.members.fetch(params.userId);
                await member.roles.add(params.roleId);
                return sendJSON(res, { success: true });
              }

              case 'remove_role': {
                if (!params?.userId || !params?.roleId)
                  return sendError(res, 'Missing params');
                const member = await guild.members.fetch(params.userId);
                await member.roles.remove(params.roleId);
                return sendJSON(res, { success: true });
              }

              default:
                return sendError(res, `Unknown action: ${action}`, 400);
            }
          } catch (e) {
            container.logger.error('[AgentDispatch] Error:', e);
            sendError(res, String(e), 500);
          }
        });
        return;
      }

      default:
        return sendError(res, 'Not found', 404);
    }
  } catch (error) {
    container.logger.error('API Server Error:', error);
    return sendError(res, `Internal server error: ${String(error)}`, 500);
  }
}

export function startApiServer(port = 3001) {
  const server = createServer((req, res) => {
    void handleRequest(req, res);
  });

  server.listen(port, '0.0.0.0', () => {
    container.logger.info(`Bot API server listening on port ${port}`);
  });

  return server;
}
