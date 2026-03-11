import { NextResponse } from 'next/server';
import { getBotLogs } from '@/lib/bot';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tail = parseInt(searchParams.get('tail') ?? '200', 10);
  const since = searchParams.get('since') ?? undefined;

  const logs = await getBotLogs(tail, since);
  return NextResponse.json({ logs });
}
