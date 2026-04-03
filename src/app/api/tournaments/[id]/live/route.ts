/**
 * RPB - Tournament Live Data API
 * POST: Scrape live stations/standings/log from Challonge and store in DB
 * GET: Return stored live data (standings, stations, activityLog)
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireStaff } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Return stored live data
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (id === 'bts2' || id === 'bts3') {
      const fileName = id === 'bts2' ? 'B_TS2.json' : 'B_TS3.json';
      const { readFileSync, existsSync } = await import('node:fs');
      const { join } = await import('node:path');
      const filePath = join(process.cwd(), 'data/exports', fileName);

      if (existsSync(filePath)) {
        const data = JSON.parse(readFileSync(filePath, 'utf-8'));
        return NextResponse.json({
          data: {
            standings: (
              data.participants as Array<{ rank: number; name: string }>
            )
              .filter((p) => p.rank > 0)
              .sort((a, b) => a.rank - b.rank),
            stations: [],
            activityLog: [],
            lastUpdated: data.scrapedAt,
          },
        });
      }
    }

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        status: true,
        standings: true,
        stations: true,
        activityLog: true,
        updatedAt: true,
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      data: {
        standings: tournament.standings ?? [],
        stations: tournament.stations ?? [],
        activityLog: tournament.activityLog ?? [],
        lastUpdated: tournament.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error fetching live data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch live data' },
      { status: 500 },
    );
  }
}

// POST - Trigger live scrape (admin/moderator only)
export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    if (!(await requireStaff())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      select: { id: true, challongeUrl: true },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 },
      );
    }

    if (!tournament.challongeUrl) {
      return NextResponse.json(
        { error: 'Tournament not linked to Challonge' },
        { status: 400 },
      );
    }

    // Dynamic import to avoid loading Puppeteer in every API route
    const { ChallongeScraper } = await import(
      '@/lib/scrapers/challonge-scraper'
    );
    const scraper = new ChallongeScraper();

    try {
      const slug = tournament.challongeUrl
        .replace('https://challonge.com/', '')
        .replace(/^\//, '');

      const result = await scraper.scrape(slug);

      await prisma.tournament.update({
        where: { id },
        data: {
          standings: result.standings as never,
          stations: result.stations as never,
          activityLog: result.log as never,
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          standings: result.standings,
          stations: result.stations,
          activityLog: result.log,
          participantsCount: result.participants.length,
          matchesCount: result.matches.length,
        },
      });
    } finally {
      await scraper.close();
    }
  } catch (error) {
    console.error('Error scraping live data:', error);
    return NextResponse.json(
      { error: 'Failed to scrape live data' },
      { status: 500 },
    );
  }
}
