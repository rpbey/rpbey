import type { BotMember, BotRole } from '@/types';
import type { BotStatus } from '@/types/api';
import { BOT_API_KEY, getBotApiUrl } from './bot-config';
import { createClient } from './standard-api';

// Singleton instance for bot communication
export const botClient = createClient(getBotApiUrl(), {
  'x-api-key': BOT_API_KEY,
});

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

export async function getDiscordRoles(): Promise<BotRole[]> {
  try {
    const data = await botClient.get<{ roles: BotRole[] }>('/api/roles', {
      revalidate: 60,
    });
    return data.roles;
  } catch (error) {
    console.error('[BotAPI] Failed to fetch roles:', error);
    return [];
  }
}

export async function getMembersByRole(roleId: string): Promise<BotMember[]> {
  try {
    const data = await botClient.get<{ members: BotMember[] }>(
      '/api/members-by-role',
      {
        params: { roleId },
        revalidate: 0, // No cache for sync operations
      },
    );
    return data.members;
  } catch (error) {
    console.error(
      `[BotAPI] Failed to fetch members for role ${roleId}:`,
      error,
    );
    return [];
  }
}

export async function getBotMember(userId: string): Promise<BotMember | null> {
  try {
    const data = await botClient.get<{ member: BotMember }>('/api/member', {
      params: { userId },
      revalidate: 0,
    });
    return data.member;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error(`[BotAPI] Failed to fetch member ${userId}:`, error);
    }
    return null;
  }
}

export async function dispatchBotAction(
  action: string,
  params: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  try {
    return await botClient.post('/api/dispatch', {
      body: { action, params },
    });
  } catch (error) {
    console.error(`[BotAPI] Failed to dispatch action ${action}:`, error);
    return { success: false, error: (error as Error).message };
  }
}
