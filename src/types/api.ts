/**
 * Shared API Types
 * These types define the communication contract between the RPB Dashboard and the Bot.
 */

export interface BotStatus {
  status: 'running' | 'starting' | 'error';
  uptime: number;
  uptimeFormatted: string;
  guilds: number;
  users: number;
  memberCount: number;
  onlineCount: number;
  ping: number;
  memoryUsage: string;
  nodeVersion: string;
}

export interface BotRole {
  id: string;
  name: string;
  color: string;
  position: number;
  managed: boolean;
}

export interface BotMember {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
}

export interface BotLog {
  timestamp: string;
  level: string;
  message: string;
}

export interface BotConfig {
  env: {
    NODE_ENV?: string;
    GUILD_ID?: string;
    OWNER_IDS?: string;
  };
  constants: {
    RPB: {
      Name: string;
      FullName: string;
      Discord: string;
    };
    Colors: Record<string, string>;
    Channels: Record<string, string>;
  };
}
