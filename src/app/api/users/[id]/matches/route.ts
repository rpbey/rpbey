/**
 * RPB - User Matches API
 * Get match history for a specific user
 */

import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: userId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') ?? '20', 10);
    const offset = parseInt(searchParams.get('offset') ?? '0', 10);

    const matches = await prisma.tournamentMatch.findMany({
      where: {
        OR: [{ player1Id: userId }, { player2Id: userId }],
        state: 'complete',
      },
      include: {
        tournament: {
          select: { id: true, name: true },
        },
        player1: {
          select: {
            id: true,
            name: true,
            image: true,
            profile: {
              select: { bladerName: true },
            },
          },
        },
        player2: {
          select: {
            id: true,
            name: true,
            image: true,
            profile: {
              select: { bladerName: true },
            },
          },
        },
        winner: {
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.tournamentMatch.count({
      where: {
        OR: [{ player1Id: userId }, { player2Id: userId }],
        state: 'complete',
      },
    });

    return NextResponse.json({
      data: matches,
      meta: { total, limit, offset },
    });
  } catch (error) {
    console.error('Error fetching user matches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch matches' },
      { status: 500 },
    );
  }
}
