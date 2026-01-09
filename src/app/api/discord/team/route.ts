import { NextResponse } from 'next/server';
import { getDiscordTeam } from '@/lib/discord-data';

export async function GET() {
  const team = await getDiscordTeam();
  return NextResponse.json({ team });
}