import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { BOT_API_KEY, getBotApiUrl } from '@/lib/bot-config';

interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' | 'TRACE' | 'FATAL';
  message: string;
}

export async function GET(request: NextRequest) {
  // Check authentication
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const tail = parseInt(searchParams.get('tail') || '100', 10);

  try {
    const botUrl = getBotApiUrl();
    const response = await fetch(`${botUrl}/api/logs?tail=${tail}`, {
      headers: {
        'X-API-Key': BOT_API_KEY,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Bot API error: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json({
      logs: data.logs as LogEntry[],
      count: data.logs?.length || 0,
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch logs', details: String(error) },
      { status: 500 },
    );
  }
}
