import { container } from '@sapphire/framework';
import type { ApiClient } from '@twurple/api';
import { RefreshingAuthProvider, StaticAuthProvider } from '@twurple/auth';
import type { ChatClient } from '@twurple/chat';
import { promises as fs } from 'fs';
import path from 'path';
import { RPB } from './constants.js';
import { prisma } from './prisma.js';

const TOKEN_PATH = path.join(process.cwd(), 'data', 'twitch-tokens.json');

const log = (
  level: 'info' | 'warn' | 'error',
  message: string,
  error?: any,
) => {
  if (container.logger) {
    if (error) container.logger[level](message, error);
    else container.logger[level](message);
  } else {
    console[level](`[Twitch] ${message}`, error || '');
  }
};

export class TwitchBot {
  private authProvider: any = null;
  public chatClient: ChatClient | null = null;
  public apiClient: ApiClient | null = null;
  private channel: string;
  private timer: NodeJS.Timeout | null = null;

  constructor() {
    this.channel =
      process.env.TWITCH_CHANNEL ||
      process.env.NEXT_PUBLIC_TWITCH_CHANNEL ||
      'tv_rpb';
  }

  public async init() {
    log('info', 'Twitch bot integration is currently DISABLED.');
    // Complete early exit to stop the bot from connecting or doing anything.
    return;
  }

  private async handleChatMessage(
    _channel: string,
    user: string,
    text: string,
  ) {
    // Disabled
  }

  private startTimer() {
    // Disabled
  }

  private stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  public async announce(message: string) {
    // Silent
    log('info', `Announce skipped (Bot Disabled): ${message}`);
  }
}

export const twitchBot = new TwitchBot();
