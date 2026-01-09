/**
 * RPB - Tournament Participants API
 * Manage tournament registration with Challonge sync
 */

import { headers } from 'next/headers';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getChallongeService } from '@/lib/challonge';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - List participants
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const participants = await prisma.tournamentParticipant.findMany({
      where: { tournamentId: id },
      include: {
        user: {
          include: {
            profile: true,
            decks: {
              where: { isActive: true },
              include: {
                beys: {
                  include: {
                    blade: true,
                    ratchet: true,
                    bit: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [{ seed: 'asc' }, { createdAt: 'asc' }],
    });

    return NextResponse.json({ data: participants });
  } catch (error) {
    console.error('Error fetching participants:', error);
    return NextResponse.json(
      { error: 'Failed to fetch participants' },
      { status: 500 },
    );
  }
}

// POST - Register for tournament (self or admin)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { userId, seed } = body as { userId?: string; seed?: number };

    // Admin can register anyone, users can only register themselves
    const targetUserId = userId ?? session.user.id;
    const isAdmin =
      session.user.role === 'admin' || session.user.role === 'moderator';

    if (targetUserId !== session.user.id && !isAdmin) {
      return NextResponse.json(
        { error: 'Cannot register other users' },
        { status: 403 },
      );
    }

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: { _count: { select: { participants: true } } },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 },
      );
    }

    if (tournament.status !== 'UPCOMING') {
      return NextResponse.json(
        { error: 'Tournament is not open for registration' },
        { status: 400 },
      );
    }

    if (tournament._count.participants >= tournament.maxPlayers) {
      return NextResponse.json(
        { error: 'Tournament is full' },
        { status: 400 },
      );
    }

    // Check if already registered
    const existing = await prisma.tournamentParticipant.findUnique({
      where: {
        tournamentId_userId: {
          tournamentId: id,
          userId: targetUserId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Already registered for this tournament' },
        { status: 409 },
      );
    }

    // Get user profile for Challonge name
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: { profile: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let challongeParticipantId: string | undefined;

    // Add to Challonge if linked
    if (tournament.challongeId) {
      try {
        const challonge = getChallongeService();
        const result = await challonge.createParticipant(
          tournament.challongeId,
          {
            name: user.profile?.bladerName ?? user.name ?? 'Unknown',
            seed,
          },
        );
        challongeParticipantId = result.data.id;
      } catch (err) {
        console.error('Failed to add participant to Challonge:', err);
      }
    }

    const participant = await prisma.tournamentParticipant.create({
      data: {
        tournamentId: id,
        userId: targetUserId,
        seed,
        challongeParticipantId,
      },
      include: {
        user: {
          include: { profile: true },
        },
      },
    });

    return NextResponse.json({ data: participant }, { status: 201 });
  } catch (error) {
    console.error('Error registering participant:', error);
    return NextResponse.json({ error: 'Failed to register' }, { status: 500 });
  }
}

// DELETE - Unregister from tournament
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('userId') ?? session.user.id;

    const isAdmin =
      session.user.role === 'admin' || session.user.role === 'moderator';

    if (targetUserId !== session.user.id && !isAdmin) {
      return NextResponse.json(
        { error: 'Cannot unregister other users' },
        { status: 403 },
      );
    }

    const participant = await prisma.tournamentParticipant.findUnique({
      where: {
        tournamentId_userId: {
          tournamentId: id,
          userId: targetUserId,
        },
      },
      include: { tournament: true },
    });

    if (!participant) {
      return NextResponse.json(
        { error: 'Not registered for this tournament' },
        { status: 404 },
      );
    }

    if (participant.tournament.status !== 'UPCOMING') {
      return NextResponse.json(
        { error: 'Cannot unregister from started tournament' },
        { status: 400 },
      );
    }

    // Remove from Challonge if linked
    if (
      participant.tournament.challongeId &&
      participant.challongeParticipantId
    ) {
      try {
        const challonge = getChallongeService();
        await challonge.deleteParticipant(
          participant.tournament.challongeId,
          participant.challongeParticipantId,
        );
      } catch (err) {
        console.error('Failed to remove participant from Challonge:', err);
      }
    }

    await prisma.tournamentParticipant.delete({
      where: {
        tournamentId_userId: {
          tournamentId: id,
          userId: targetUserId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unregistering participant:', error);
    return NextResponse.json(
      { error: 'Failed to unregister' },
      { status: 500 },
    );
  }
}
