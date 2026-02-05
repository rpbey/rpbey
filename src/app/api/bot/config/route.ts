import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { botClient } from '@/lib/bot';

interface BotConfig {
  env: Record<string, string>;
  constants: {
    RPB: Record<string, string>;
    Colors: Record<string, string>;
    Channels: Record<string, string>;
    Roles: Record<string, string>;
  };
}

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let data: BotConfig;
  try {
    data = await botClient.get<BotConfig>('/api/config', {
      cache: 'no-store',
    });
  } catch {
    console.warn('Bot offline, returning default config');
    data = {
      env: {},
      constants: {
        RPB: {},
        Colors: {},
        Channels: {},
        Roles: {},
      },
    };
  }

  return NextResponse.json(data);
}
