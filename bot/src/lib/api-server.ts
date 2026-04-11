import { timingSafeEqual } from 'node:crypto';
import { bot } from './bot.js';
import { logger } from './logger.js';

// In-memory log buffer
const logs: { timestamp: string; level: string; message: string }[] = [];
const MAX_LOGS = 1000;

export function addLog(level: string, message: string) {
  logs.push({ timestamp: new Date().toISOString(), level, message });
  if (logs.length > MAX_LOGS) logs.shift();
}

export function getLogs(tail = 100) {
  return logs.slice(-tail);
}

// Rate limiting
const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX = 60;
const requestCounts = new Map<string, { count: number; startTime: number }>();

setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of requestCounts.entries()) {
    if (now - record.startTime > RATE_LIMIT_WINDOW) {
      requestCounts.delete(ip);
    }
  }
}, RATE_LIMIT_WINDOW);

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = requestCounts.get(ip);
  if (!record || now - record.startTime > RATE_LIMIT_WINDOW) {
    requestCounts.set(ip, { count: 1, startTime: now });
    return true;
  }
  if (record.count >= RATE_LIMIT_MAX) return false;
  record.count++;
  return true;
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

async function getBotStatus() {
  const client = bot;
  const guild = await client.guilds
    .fetch({ guild: process.env.GUILD_ID ?? '', withCounts: true })
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
    memoryUsage: `${(process.memoryUsage().heapUsed / (1024 * 1024)).toFixed(2)} MB`,
    runtime: `Bun ${Bun.version}`,
  };
}

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS, POST',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
};

/** Auth middleware — validates API key on every non-OPTIONS request */
function authenticate(req: Request): Response | null {
  const expectedKey = process.env.BOT_API_KEY;
  if (!expectedKey) {
    logger.error('BOT_API_KEY not set in environment!');
    return Response.json(
      { error: 'Server misconfiguration' },
      { status: 500, headers: CORS_HEADERS },
    );
  }

  const apiKey = req.headers.get('x-api-key') ?? '';
  const providedBuf = Buffer.from(apiKey, 'utf8');
  const expectedBuf = Buffer.from(expectedKey, 'utf8');

  if (
    providedBuf.length !== expectedBuf.length ||
    !timingSafeEqual(providedBuf, expectedBuf)
  ) {
    return Response.json(
      { error: 'Unauthorized' },
      { status: 401, headers: CORS_HEADERS },
    );
  }

  return null; // Auth passed
}

export function startApiServer(port = 3001) {
  const server = Bun.serve({
    port,
    hostname: '127.0.0.1',

    routes: {
      '/api/status': {
        GET: async (req) => {
          const authError = authenticate(req);
          if (authError) return authError;
          return Response.json(await getBotStatus(), { headers: CORS_HEADERS });
        },
        OPTIONS: () =>
          new Response(null, { status: 204, headers: CORS_HEADERS }),
      },

      '/api/logs': {
        GET: (req) => {
          const authError = authenticate(req);
          if (authError) return authError;
          const url = new URL(req.url);
          const tail = parseInt(url.searchParams.get('tail') ?? '100', 10);
          const since = url.searchParams.get('since');
          let filtered = getLogs(Math.min(tail, MAX_LOGS));
          if (since) {
            filtered = filtered.filter((l) => l.timestamp > since);
          }
          return Response.json({ logs: filtered }, { headers: CORS_HEADERS });
        },
        OPTIONS: () =>
          new Response(null, { status: 204, headers: CORS_HEADERS }),
      },

      '/api/commands': {
        GET: (req) => {
          const authError = authenticate(req);
          if (authError) return authError;
          const commands = bot.applicationCommands.map((cmd) => ({
            name: cmd.name,
            description: cmd.description,
            category: 'group' in cmd ? String(cmd.group) : 'Général',
          }));
          return Response.json({ commands }, { headers: CORS_HEADERS });
        },
        OPTIONS: () =>
          new Response(null, { status: 204, headers: CORS_HEADERS }),
      },
    },

    // Fallback for unmatched routes
    fetch(req) {
      // Rate limiting on fallback
      const ip = server.requestIP(req)?.address ?? 'unknown';
      if (!checkRateLimit(ip)) {
        return Response.json(
          { error: 'Too Many Requests' },
          { status: 429, headers: CORS_HEADERS },
        );
      }

      if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: CORS_HEADERS });
      }

      return Response.json(
        { error: 'Not found' },
        { status: 404, headers: CORS_HEADERS },
      );
    },

    error(error) {
      logger.error('API Server Error:', error);
      return Response.json(
        { error: 'Internal server error' },
        { status: 500, headers: CORS_HEADERS },
      );
    },
  });

  logger.info(`Bot API server listening on http://127.0.0.1:${port}`);
  return server;
}
