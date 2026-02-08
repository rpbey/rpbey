import { RefreshingAuthProvider, StaticAuthProvider } from '@twurple/auth';
import { ChatClient } from '@twurple/chat';
import { ApiClient } from '@twurple/api';
import { container } from '@sapphire/framework';
import { promises as fs } from 'fs';
import path from 'path';
import { prisma } from './prisma.js';
import { RPB } from './constants.js';

const TOKEN_PATH = path.join(process.cwd(), 'data', 'twitch-tokens.json');

const log = (level: 'info' | 'warn' | 'error', message: string, error?: any) => {
  if (container.logger) {
    if (error) container.logger[level](message, error);
    else container.logger[level](message);
  } else {
    console[level](`[Twitch] ${message}`, error || '');
  }
};

export class TwitchBot {
  private authProvider: RefreshingAuthProvider | StaticAuthProvider | null = null;
  public chatClient: ChatClient | null = null;
  public apiClient: ApiClient | null = null;
  private channel: string;
  private timer: NodeJS.Timeout | null = null;

  constructor() {
    this.channel = process.env.TWITCH_CHANNEL || process.env.NEXT_PUBLIC_TWITCH_CHANNEL || 'tv_rpb';
  }

  public async init() {
    const clientId = process.env.TWITCH_CLIENT_ID;
    const clientSecret = process.env.TWITCH_CLIENT_SECRET;

    if (!clientId) { 
      log('warn', 'Missing credentials (TWITCH_CLIENT_ID). Twitch bot will not start.');
      return;
    }

    let accessToken = process.env.TWITCH_BOT_ACCESS_TOKEN;
    let refreshToken = process.env.TWITCH_BOT_REFRESH_TOKEN;

    // Try to load from file
    try {
      const data = await fs.readFile(TOKEN_PATH, 'utf-8');
      const tokens = JSON.parse(data);
      if (tokens.accessToken) {
        accessToken = tokens.accessToken;
        refreshToken = tokens.refreshToken;
        log('info', 'Loaded tokens from storage.');
      }
    } catch {
      // Ignore error
    }

    if (!accessToken) {
      log('warn', 'No tokens found in storage or env. Twitch bot will not start.');
      return;
    }

    try {
      if (refreshToken && clientSecret) {
        const authProvider = new RefreshingAuthProvider({
          clientId,
          clientSecret
        });

        authProvider.onRefresh(async (_userId, newTokenData) => {
            try {
              await fs.writeFile(TOKEN_PATH, JSON.stringify({
                accessToken: newTokenData.accessToken,
                refreshToken: newTokenData.refreshToken,
                expiry: newTokenData.expiresIn,
                obtainmentTimestamp: newTokenData.obtainmentTimestamp
              }, null, 2));
              log('info', 'Tokens refreshed and saved.');
            } catch (e) {
              log('error', 'Failed to save refreshed tokens:', e);
            }
        });

        await authProvider.addUserForToken({
          accessToken,
          refreshToken,
          expiresIn: null, 
          obtainmentTimestamp: 0
        }, ['chat']);
        
        this.authProvider = authProvider;

      } else {
        log('warn', 'Using StaticAuthProvider (No Refresh Token). Token will expire and bot will disconnect.');
        this.authProvider = new StaticAuthProvider(clientId, accessToken);
      }

      this.apiClient = new ApiClient({ authProvider: this.authProvider });

      this.chatClient = new ChatClient({
        authProvider: this.authProvider,
        authIntents: ['chat'],
        channels: [this.channel]
      });

      this.chatClient.onConnect(() => {
        log('info', `Connected to chat channel: ${this.channel}`);
        this.startTimer();
      });

      this.chatClient.onMessage(async (channel, user, text) => {
        await this.handleChatMessage(channel, user, text);
      });

      this.chatClient.onDisconnect((manually, reason) => {
        log('warn', `Disconnected from chat. Manual: ${manually}, Reason: ${reason}`);
        this.stopTimer();
      });
      
      this.chatClient.onAuthenticationFailure((text, retryCount) => {
         log('error', `Auth failure: ${text} (Retry: ${retryCount})`);
      });

      await this.chatClient.connect();

    } catch (error) {
      log('error', 'Failed to initialize:', error);
    }
  }

  private async handleChatMessage(_channel: string, user: string, text: string) {
    const lowerText = text.toLowerCase().trim();
    
    // Hardcoded Commands
    if (lowerText === '!discord') {
      await this.announce(`Rejoignez la plus grande communauté française de Beyblade X sur Discord ! 🌀 ${RPB.Discord}`);
      return;
    }

    // AI Chatbot Commands (!ask or !demander)
    if (lowerText.startsWith('!ask ') || lowerText.startsWith('!demander ')) {
      const question = text.split(' ').slice(1).join(' ').trim();
      if (!question) return;

      try {
        const { aiService } = await import('./ai.js');
        const context = aiService.getKnowledgeBase();
        
        if (context) {
          const answers = await aiService.answerQuestion(question, context);
          if (answers && answers.length > 0 && answers[0].score > 0.4) {
            const reply = `@${user} 🤖 ${answers[0].text}`;
            // Truncate if too long for Twitch
            await this.announce(reply.substring(0, 450));
          } else {
            await this.announce(`@${user} 🤔 Je n'ai pas trouvé de réponse précise dans ma base de connaissances. Posez votre question sur Discord !`);
          }
        }
      } catch (error) {
        log('error', 'Twitch AI error:', error);
      }
      return;
    }

    // Dynamic commands from DB (model BotCommand)
    if (lowerText.startsWith('!')) {
      const cmdName = lowerText.slice(1);
      try {
        const customCmd = await prisma.botCommand.findUnique({
          where: { name: cmdName }
        });
        if (customCmd && customCmd.enabled) {
          await this.announce(customCmd.response);
        }
      } catch (error) {
        log('error', `Error fetching custom command ${cmdName}:`, error);
      }
    }
  }

  private startTimer() {
    this.stopTimer();
    this.timer = setInterval(async () => {
      await this.announce(`🌀 Envie de discuter Beyblade X ? Rejoins notre Discord officiel : ${RPB.Discord}`);
    }, 30 * 60 * 1000); // 30 minutes
  }

  private stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  public async announce(message: string) {
    if (!this.chatClient || !this.chatClient.isConnected) {
      log('warn', 'Cannot announce, chat client not connected.');
      return;
    }
    try {
      await this.chatClient.say(this.channel, message);
      log('info', `Sent message: ${message}`);
    } catch (error) {
      log('error', 'Failed to send message:', error);
    }
  }
}

export const twitchBot = new TwitchBot();