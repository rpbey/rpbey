/**
 * RPB - Tournaments API
 * Complete CRUD for tournaments with Challonge sync
 */

import { headers } from 'next/headers';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getChallongeService } from '@/lib/challonge';
import { prisma } from '@/lib/prisma';

// GET - List tournaments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = Math.min(
      Math.max(parseInt(searchParams.get('limit') ?? '50', 10) || 50, 1),
      200,
    );
    const offset = Math.max(
      parseInt(searchParams.get('offset') ?? '0', 10) || 0,
      0,
    );

    const validStatuses = ['PENDING', 'ACTIVE', 'COMPLETE', 'ARCHIVED'];
    const where: Record<string, unknown> = {};
    if (status && validStatuses.includes(status)) {
      where.status = status;
    }

    const [tournaments, total] = await Promise.all([
      prisma.tournament.findMany({
        where,
        include: {
          _count: {
            select: { participants: true, matches: true },
          },
          participants: {
            include: {
              user: {
                include: {
                  profile: true,
                },
              },
            },
          },
        },
        orderBy: { date: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.tournament.count({ where }),
    ]);

    return NextResponse.json({
      data: tournaments,
      meta: { total, limit, offset },
    });
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tournaments' },
      { status: 500 },
    );
  }
}

// POST - Create tournament
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (
      !session?.user ||
      (session.user.role !== 'admin' && session.user.role !== 'moderator')
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      date,
      location,
      format,
      maxPlayers,
      createOnChallonge,
    } = body as {
      name: string;
      description?: string;
      date: string;
      location?: string;
      format?: string;
      maxPlayers?: number;
      createOnChallonge?: boolean;
    };

    if (!name || !date) {
      return NextResponse.json(
        { error: 'Name and date are required' },
        { status: 400 },
      );
    }

    let challongeId: string | undefined;
    let challongeUrl: string | undefined;

    // Create on Challonge if requested
    if (createOnChallonge) {
      try {
        const challonge = getChallongeService();
        const result = await challonge.createTournament({
          name,
          description,
          tournamentType: format?.includes('Double')
            ? 'double elimination'
            : 'single elimination',
          gameName: 'Beyblade X',
          startAt: new Date(date).toISOString(),
          signupCap: maxPlayers,
        });

        challongeId = result.id;
        challongeUrl = `https://challonge.com/${result.attributes.url}`;
      } catch (err) {
        console.error('Failed to create Challonge tournament:', err);
        // Continue without Challonge integration
      }
    }

    const tournament = await prisma.tournament.create({
      data: {
        name,
        description,
        date: new Date(date),
        location,
        format: format ?? '3on3 Double Elimination',
        maxPlayers: maxPlayers ?? 64,
        challongeId,
        challongeUrl,
        status: 'UPCOMING',
      },
    });

    return NextResponse.json({ data: tournament }, { status: 201 });
  } catch (error) {
    console.error('Error creating tournament:', error);
    return NextResponse.json(
      { error: 'Failed to create tournament' },
      { status: 500 },
    );
  }
}

// DELETE - Delete fake tournaments (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const deleteAll = searchParams.get('all') === 'true';

    if (deleteAll) {
      const deleted = await prisma.tournament.deleteMany({});
      return NextResponse.json({
        deleted: deleted.count,
        message: 'All tournaments deleted',
      });
    }

    // Delete only fake tournaments (no challongeId)
    const deleted = await prisma.tournament.deleteMany({
      where: { challongeId: null },
    });

    return NextResponse.json({
      deleted: deleted.count,
      message: 'Fake tournaments deleted',
    });
  } catch (error) {
    console.error('Error deleting tournaments:', error);
    return NextResponse.json(
      { error: 'Failed to delete tournaments' },
      { status: 500 },
    );
  }
}
