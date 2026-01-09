import { createClient } from './standard-api';
import type { BotStatus } from '@/types/api';
import type { BotMember } from '@/types';

// Singleton instance for bot communication
export const botClient = createClient(
  process.env.BOT_API_URL || 'http://localhost:3001',
  {
    'x-api-key': process.env.BOT_API_KEY || '',
  }
);

// Logging interceptor in development
if (process.env.NODE_ENV === 'development') {
  botClient.addInterceptor({
    onRequest: (url, options) => {
      console.log(`[BotAPI] Request: ${options.method || 'GET'} ${url}`);
      return options;
    },
    onError: (error) => {
      console.error(`[BotAPI] Error ${error.status}: ${error.message}`, error.data);
    },
  });
}

export async function getBotStatus(): Promise<BotStatus | null> {
  try {
    return await botClient.get<BotStatus>('/api/status', {
      revalidate: 60, // Use the new shortcut
    });
  } catch {
    // Error is already logged by interceptor in dev
    return null;
  }
}

export async function getMembersByRole(roleId: string): Promise<BotMember[]> {
  try {
    const data = await botClient.get<{ members: BotMember[] }>('/api/members-by-role', {
      params: { roleId },
      revalidate: 300, // Cache for 5 minutes
    });
    return data.members;
  } catch {
    return [];
  }
}
