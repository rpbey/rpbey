/**
 * RPB - Single Tournament API
 * GET, PUT, DELETE operations with Challonge sync
 */

import type { TournamentStatus } from '@prisma/client';
import { headers } from 'next/headers';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getChallongeService } from '@/lib/challonge';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Get single tournament with full details
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const includeRelations = {
      participants: {
        include: {
          user: {
            include: {
              profile: true,
            },
          },
        },
        orderBy: { seed: 'asc' } as const,
      },
      matches: {
        include: {
          player1: { include: { profile: true } },
          player2: { include: { profile: true } },
          winner: { include: { profile: true } },
        },
        orderBy: [
          { round: 'asc' } as const,
          { createdAt: 'asc' } as const,
        ],
      },
    };

    let tournament = await prisma.tournament.findUnique({
      where: { id },
      include: includeRelations,
    });

    // Fallback: Try searching by challongeId or challongeUrl slug
    if (!tournament) {
      tournament = await prisma.tournament.findFirst({
        where: {
          OR: [{ challongeId: id }, { challongeUrl: { contains: id } }],
        },
        include: includeRelations,
      });
    }

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: tournament });
  } catch (error) {
    console.error('Error fetching tournament:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tournament' },
      { status: 500 },
    );
  }
}

// PUT - Update tournament
export async function PUT(request: NextRequest, { params }: RouteParams) {
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

    const { id } = await params;
    const body = await request.json();
    const { name, description, date, location, format, maxPlayers, status } =
      body as {
        name?: string;
        description?: string;
        date?: string;
        location?: string;
        format?: string;
        maxPlayers?: number;
        status?: string;
      };

    const existing = await prisma.tournament.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 },
      );
    }

    // SKIP API for B_TS1 (Imported locally)
    const isOfflineTournament =
      existing.challongeId === '17261774' ||
      existing.challongeUrl?.includes('B_TS1');

    // Update on Challonge if linked AND not offline
    if (
      existing.challongeId &&
      (name || description || date) &&
      !isOfflineTournament
    ) {
      try {
        const challonge = getChallongeService();
        await challonge.updateTournament(existing.challongeId, {
          name: name ?? existing.name,
          description: description ?? existing.description ?? '',
          startAt: date ? new Date(date).toISOString() : undefined,
        });
      } catch (err) {
        console.error('Failed to update Challonge tournament:', err);
      }
    }

    const tournament = await prisma.tournament.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(date && { date: new Date(date) }),
        ...(location !== undefined && { location }),
        ...(format && { format }),
        ...(maxPlayers && { maxPlayers }),
        ...(status && { status: status as TournamentStatus }),
      },
    });

    return NextResponse.json({ data: tournament });
  } catch (error) {
    console.error('Error updating tournament:', error);
    return NextResponse.json(
      { error: 'Failed to update tournament' },
      { status: 500 },
    );
  }
}

// DELETE - Delete tournament
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const tournament = await prisma.tournament.findUnique({ where: { id } });
    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 },
      );
    }

    // Delete from Challonge if linked
    const isOfflineTournament =
      tournament.challongeId === '17261774' ||
      tournament.challongeUrl?.includes('B_TS1');

    if (tournament.challongeId && !isOfflineTournament) {
      try {
        const challonge = getChallongeService();
        await challonge.deleteTournament(tournament.challongeId);
      } catch (err) {
        console.error('Failed to delete Challonge tournament:', err);
      }
    }

    // Delete related data first
    await prisma.tournamentMatch.deleteMany({ where: { tournamentId: id } });
    await prisma.tournamentParticipant.deleteMany({
      where: { tournamentId: id },
    });
    await prisma.tournament.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting tournament:', error);
    return NextResponse.json(
      { error: 'Failed to delete tournament' },
      { status: 500 },
    );
  }
}

// PATCH - Special actions (start, finalize, sync)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    const { id } = await params;
    const body = await request.json();
    const { action } = body as {
      action: 'start' | 'finalize' | 'sync' | 'sync_participants';
    };

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        participants: { include: { user: true } },
        matches: true,
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 },
      );
    }

    if (!tournament.challongeId) {
      return NextResponse.json(
        { error: 'Tournament not linked to Challonge' },
        { status: 400 },
      );
    }

    // SKIP API for B_TS1
    if (
      tournament.challongeId === '17261774' ||
      tournament.challongeUrl?.includes('B_TS1')
    ) {
      return NextResponse.json({
        success: true,
        action,
        message: 'Tournament is in offline mode (B_TS1)',
      });
    }

    const challonge = getChallongeService();

    switch (action) {
      case 'sync_participants': {
        const challongeParticipants = await challonge.listParticipants(
          tournament.challongeId,
        );

        const participantsToCreate = [];
        const alreadySyncedLocalIds = new Set(
          tournament.participants
            .filter((p) => p.challongeParticipantId)
            .map((p) => p.id),
        );

        for (const localParticipant of tournament.participants) {
          if (alreadySyncedLocalIds.has(localParticipant.id)) continue;

          const existingInChallonge = challongeParticipants.find(
            (p) =>
              p.attributes.misc === localParticipant.userId ||
              p.attributes.name ===
                (localParticipant.user.name || localParticipant.user.email),
          );

          if (existingInChallonge) {
            await prisma.tournamentParticipant.update({
              where: { id: localParticipant.id },
              data: { challongeParticipantId: String(existingInChallonge.id) },
            });
          } else {
            participantsToCreate.push({
              name: localParticipant.user.name || localParticipant.user.email,
              misc: localParticipant.userId,
              seed: localParticipant.seed ?? undefined,
            });
          }
        }

        if (participantsToCreate.length > 0) {
          const createdParticipants = await challonge.bulkCreateParticipants(
            tournament.challongeId,
            participantsToCreate,
          );

          // Map created participants back to local records
          for (const created of createdParticipants) {
            const localParticipant = tournament.participants.find(
              (p) => p.userId === created.attributes.misc,
            );
            if (localParticipant) {
              await prisma.tournamentParticipant.update({
                where: { id: localParticipant.id },
                data: { challongeParticipantId: String(created.id) },
              });
            }
          }
        }
        break;
      }

      case 'start': {
        await challonge.startTournament(tournament.challongeId);
        await prisma.tournament.update({
          where: { id },
          data: { status: 'UNDERWAY' },
        });
        break;
      }

      case 'finalize': {
        await challonge.finalizeTournament(tournament.challongeId);
        await prisma.tournament.update({
          where: { id },
          data: { status: 'COMPLETE' },
        });
        break;
      }

      case 'sync': {
        // Sync matches from Challonge
        const matches = await challonge.listMatches(tournament.challongeId);

        for (const match of matches) {
          const attrs = match.attributes;

          // Find local players by challonge participant ID
          const player1 = tournament.participants.find(
            (p) => p.challongeParticipantId === String(attrs.player1Id),
          );
          const player2 = tournament.participants.find(
            (p) => p.challongeParticipantId === String(attrs.player2Id),
          );
          const winner = tournament.participants.find(
            (p) => p.challongeParticipantId === String(attrs.winnerId),
          );

          // Challonge v2.1 uses scores as an array or CSV depending on request. Attributes usually have scores as string.
          const scoreStr = attrs.scores || null;

          await prisma.tournamentMatch.upsert({
            where: {
              tournamentId_challongeMatchId: {
                tournamentId: id,
                challongeMatchId: String(match.id),
              },
            },
            update: {
              round: attrs.round,
              state: attrs.state,
              score: scoreStr,
              winnerId: winner?.userId ?? null,
            },
            create: {
              tournamentId: id,
              challongeMatchId: String(match.id),
              round: attrs.round,
              state: attrs.state,
              player1Id: player1?.userId ?? null,
              player2Id: player2?.userId ?? null,
              winnerId: winner?.userId ?? null,
              score: scoreStr,
            },
          });
        }
        break;
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true, action });
  } catch (error) {
    console.error('Error performing tournament action:', error);
    return NextResponse.json(
      { error: 'Failed to perform action' },
      { status: 500 },
    );
  }
}
