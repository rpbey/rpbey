import { Server, type Socket } from 'socket.io';

import { bot } from './bot.js';
import { logger } from './logger.js';

export class SocketManager {
  private static instance: SocketManager;
  public io: Server | null = null;
  private p1 = 0;
  private p2 = 0;

  private constructor() {}

  public static getInstance(): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager();
    }
    return SocketManager.instance;
  }

  public init(server: any) {
    this.io = new Server(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        allowedHeaders: ['x-api-key'],
      },
    });

    this.io.on('connection', (socket: Socket) => {
      logger.info(`[Socket] New connection: ${socket.id}`);

      const apiKey =
        socket.handshake.auth.token || socket.handshake.headers['x-api-key'];
      if (apiKey !== process.env.BOT_API_KEY) {
        logger.warn(
          `[Socket] Unauthorized connection attempt from ${socket.id}`,
        );
        socket.disconnect(true);
        return;
      }

      socket.on('admin_action', (data: any) => {
        if (data.type === 'update_score') {
          this.p1 += data.points;
          this.io?.emit('game_score_update', {
            p1: this.p1,
            p2: this.p2,
            label: data.label,
          });
          logger.info(
            `[Socket] Score updated: ${this.p1} - ${this.p2} (${data.label})`,
          );
        }

        if (data.type === 'reset_game') {
          this.p1 = 0;
          this.p2 = 0;
          this.io?.emit('game_score_update', {
            p1: this.p1,
            p2: this.p2,
            label: 'RESET',
          });
        }
      });

      socket.on('disconnect', () => {
        logger.info(`[Socket] Disconnected: ${socket.id}`);
      });

      this.emitStatusUpdate();
    });

    logger.info('[Socket] Socket.IO initialized');
  }

  public emit(event: string, data: any) {
    if (this.io) {
      this.io.emit(event, data);
    }
  }

  public emitStatusUpdate() {
    if (!this.io || !bot) return;

    const uptime = process.uptime();

    const d = Math.floor(uptime / (3600 * 24));
    const h = Math.floor((uptime % (3600 * 24)) / 3600);
    const m = Math.floor((uptime % 3600) / 60);
    const s = Math.floor(uptime % 60);
    const uptimeFormatted = `${d}j ${h}h ${m}m ${s}s`;

    const status = {
      status: 'running',
      uptime: process.uptime(),
      uptimeFormatted,
      guilds: bot.guilds.cache.size,
      users: bot.users.cache.size,
      ping: bot.ws.ping,
      memoryUsage: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
      nodeVersion: process.version,
    };

    this.io.emit('status_update', status);
  }
}
