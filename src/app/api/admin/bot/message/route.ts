import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || (session.user.role !== 'admin' && session.user.role !== 'superadmin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { channelId, userId, content } = await req.json();

  if ((!channelId && !userId) || !content) {
    return NextResponse.json(
      { error: 'Missing destination (channelId or userId) or content' },
      { status: 400 },
    );
  }

  const { getBotApiUrl, BOT_API_KEY } = await import('@/lib/bot-config');
  const botUrl = getBotApiUrl();

  try {
    const action = userId ? 'send_dm' : 'send_message';
    const params = userId ? { userId, content } : { channelId, content };

    const response = await fetch(`${botUrl}/api/agent/dispatch`, {
      method: 'POST',
      headers: {
        'x-api-key': BOT_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action,
        params,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to send message' },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, messageId: data.id });
  } catch (error) {
    console.error('Failed to send message via bot:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
