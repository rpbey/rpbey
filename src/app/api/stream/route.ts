/**
 * RPB Stream API — Tournament Stream Helper integration
 *
 * Public endpoint for TSH to discover active/recent tournaments.
 * GET /api/stream → list streamable tournaments
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_request: NextRequest) {
  try {
    // Return tournaments that are UNDERWAY or recently COMPLETE (last 24h)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const tournaments = await prisma.tournament.findMany({
      where: {
        OR: [
          { status: 'UNDERWAY' },
          { status: 'CHECKIN' },
          {
            status: 'COMPLETE',
            updatedAt: { gte: oneDayAgo },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        status: true,
        format: true,
        date: true,
        location: true,
        challongeUrl: true,
        updatedAt: true,
        _count: { select: { participants: true, matches: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Also include scraped BTS tournaments
    const scrapedTournaments = [];
    const { existsSync, readFileSync } = await import('node:fs');
    const { join } = await import('node:path');

    for (const slug of ['B_TS2', 'B_TS3']) {
      const filePath = join(process.cwd(), 'data/exports', `${slug}.json`);
      if (existsSync(filePath)) {
        const data = JSON.parse(readFileSync(filePath, 'utf-8'));
        scrapedTournaments.push({
          id: slug.toLowerCase(),
          name: `Bey-Tamashii Séries - ${slug}`,
          status: 'COMPLETE',
          format: '3on3 Double Elimination',
          challongeUrl: data.url,
          participantsCount: data.participantsCount,
          matchesCount: data.matchesCount,
          scrapedAt: data.scrapedAt,
        });
      }
    }

    return NextResponse.json({
      data: {
        active: tournaments.map((t) => ({
          id: t.id,
          name: t.name,
          status: t.status,
          format: t.format,
          date: t.date,
          location: t.location,
          challongeUrl: t.challongeUrl,
          participantsCount: t._count.participants,
          matchesCount: t._count.matches,
          streamUrl: `/api/stream/${t.id}`,
          updatedAt: t.updatedAt,
        })),
        scraped: scrapedTournaments,
      },
    });
  } catch (error) {
    console.error('Stream API error:', error);
    return NextResponse.json(
      { error: 'Failed to list tournaments' },
      { status: 500 },
    );
  }
}
