import type { BotMember } from '@/types';
import type { BotStatus } from '@/types/api';
import { createClient } from './standard-api';
import { getBotApiUrl, BOT_API_KEY } from './bot-config';

// Singleton instance for bot communication
export const botClient = createClient(
  getBotApiUrl(),
  {
    'x-api-key': BOT_API_KEY,
  },
);

// Logging interceptor in development
if (process.env.NODE_ENV === 'development') {
  botClient.addInterceptor({
    onRequest: (url, options) => {
      console.log(`[BotAPI] Request: ${options.method || 'GET'} ${url}`);
      return options;
    },
    onError: (error) => {
      console.error(
        `[BotAPI] Error ${error.status}: ${error.message}`,
        error.data,
      );
    },
  });
}

export async function getBotStatus(): Promise<BotStatus | null> {
  try {
    return await botClient.get<BotStatus>('/api/status', {
      revalidate: 10, // Short cache to reflect status changes quickly
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '[BotAPI] Failed to fetch status (Bot likely offline):',
        (error as Error).message,
      );
    }
    return null;
  }
}

export async function getMembersByRole(roleId: string): Promise<BotMember[]> {
  try {
    const data = await botClient.get<{ members: BotMember[] }>(
      '/api/members-by-role',
      {
        params: { roleId },
        revalidate: 300, // Cache for 5 minutes
      },
    );
    return data.members;
  } catch {
    return [];
  }
}
