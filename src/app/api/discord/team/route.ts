import { NextResponse } from 'next/server';
import { getDiscordTeam } from '@/lib/discord-data';

export const dynamic = 'force-dynamic';

export async function GET() {
  const team = await getDiscordTeam();
  return NextResponse.json({ team });
}
