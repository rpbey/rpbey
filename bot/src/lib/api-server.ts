import crypto from 'node:crypto';
import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from 'node:http';
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

function sendJSON(res: ServerResponse, data: unknown, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

async function getBotStatus() {
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
    memoryUsage: `${(process.memoryUsage().heapUsed / (1024 * 1024)).toFixed(2)} MB`,
    nodeVersion: process.version,
  };
}

async function handleRequest(req: IncomingMessage, res: ServerResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Rate limiting
  const ip = req.socket.remoteAddress || 'unknown';
  if (!checkRateLimit(ip)) {
    return sendJSON(res, { error: 'Too Many Requests' }, 429);
  }

  // API key auth
  const apiKey = req.headers['x-api-key'];
  const expectedKey = process.env.BOT_API_KEY;

  if (!expectedKey) {
    logger.error('BOT_API_KEY not set in environment!');
    return sendJSON(res, { error: 'Server misconfiguration' }, 500);
  }

  const providedBuf = Buffer.from(
    typeof apiKey === 'string' ? apiKey : '',
    'utf8',
  );
  const expectedBuf = Buffer.from(expectedKey, 'utf8');

  if (
    providedBuf.length !== expectedBuf.length ||
    !crypto.timingSafeEqual(providedBuf, expectedBuf)
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

      case '/api/logs': {
        const tail = parseInt(url.searchParams.get('tail') ?? '100', 10);
        const since = url.searchParams.get('since');
        let filtered = getLogs(Math.min(tail, MAX_LOGS));
        if (since) {
          filtered = filtered.filter((l) => l.timestamp > since);
        }
        return sendJSON(res, { logs: filtered });
      }

      case '/api/commands': {
        const commands = bot.applicationCommands.map((cmd) => ({
          name: cmd.name,
          description: cmd.description,
          category: 'group' in cmd ? String(cmd.group) : 'Général',
        }));
        return sendJSON(res, { commands });
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
  server.listen(port, '127.0.0.1', () => {
    logger.info(`Bot API server listening on port ${port}`);
  });
  return server;
}
