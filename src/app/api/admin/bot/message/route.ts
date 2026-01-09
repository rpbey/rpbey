import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { channelId, content } = await req.json();

  if (!channelId || !content) {
    return NextResponse.json(
      { error: 'Missing channelId or content' },
      { status: 400 },
    );
  }

  const botUrl = process.env.BOT_API_URL || 'http://localhost:3001';
  const apiKey = process.env.BOT_API_KEY;

  try {
    const response = await fetch(`${botUrl}/api/agent/dispatch`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'send_message',
        params: { channelId, content },
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
