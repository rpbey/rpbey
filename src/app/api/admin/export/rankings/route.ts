
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const format = searchParams.get('format') || 'csv';
  const seasonId = searchParams.get('seasonId');

  // Fetch data
  let data = [];
  
  if (seasonId && seasonId !== 'current') {
    // Historical Data
    const entries = await prisma.seasonEntry.findMany({
      where: { seasonId },
      include: { user: true },
      orderBy: { points: 'desc' }
    });
    
    data = entries.map((e, i) => ({
      Rank: i + 1,
      Name: e.user.name || 'Unknown',
      Username: e.user.username || '',
      DiscordId: e.user.discordId || '',
      Points: e.points,
      Wins: e.wins,
      Losses: e.losses,
      Tournaments: e.tournamentWins
    }));
  } else {
    // Live Data
    const profiles = await prisma.profile.findMany({
      where: { rankingPoints: { gt: 0 } },
      include: { user: true },
      orderBy: [
        { rankingPoints: 'desc' },
        { tournamentWins: 'desc' },
        { wins: 'desc' }
      ]
    });

    data = profiles.map((p, i) => ({
      Rank: i + 1,
      Name: p.user.name || p.bladerName || 'Unknown',
      Username: p.user.username || '',
      DiscordId: p.user.discordId || '',
      Points: p.rankingPoints,
      Wins: p.wins,
      Losses: p.losses,
      Tournaments: p.tournamentWins
    }));
  }

  if (format === 'json') {
    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="rankings-${seasonId || 'current'}.json"`
      }
    });
  }

  // CSV Format
  const csvHeaders = ['Rank', 'Name', 'Username', 'DiscordId', 'Points', 'Wins', 'Losses', 'Tournaments'];
  const csvRows = data.map(row => 
    csvHeaders.map(header => {
      const val = row[header as keyof typeof row];
      return typeof val === 'string' ? `"${val.replace(/