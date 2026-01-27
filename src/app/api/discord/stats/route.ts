import { NextResponse } from 'next/server';
import { getDiscordStats } from '@/lib/discord-data';

export const dynamic = 'force-dynamic';

export async function GET() {
  const stats = await getDiscordStats();
  return NextResponse.json(stats);
}
