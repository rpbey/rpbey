import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function POST() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { getBotApiUrl, BOT_API_KEY } = await import('@/lib/bot-config');
  const botUrl = getBotApiUrl();

  try {
    const response = await fetch(`${botUrl}/api/restart`, {
      method: 'POST',
      headers: {
        'x-api-key': BOT_API_KEY,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to restart bot' },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Failed to restart bot:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
