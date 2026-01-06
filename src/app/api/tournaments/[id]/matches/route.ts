/**
 * RPB - Tournament Matches API
 * View and report match results with Challonge sync
 */

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { getChallongeService } from '@/lib/challonge'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET - List matches
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const round = searchParams.get('round')
    const state = searchParams.get('state')

    const where: Record<string, unknown> = { tournamentId: id }
    if (round) where.round = parseInt(round, 10)
    if (state) where.state = state

    const matches = await prisma.tournamentMatch.findMany({
      where,
      include: {
        player1: {
          include: {
            profile: true,
            decks: {
              where: { isActive: true },
              include: {
                beys: {
                  include: { blade: true, ratchet: true, bit: true },
                },
              },
            },
          },
        },
        player2: {
          include: {
            profile: true,
            decks: {
              where: { isActive: true },
              include: {
                beys: {
                  include: { blade: true, ratchet: true, bit: true },
                },
              },
            },
          },
        },
        winner: { include: { profile: true } },
      },
      orderBy: [{ round: 'asc' }, { createdAt: 'asc' }],
    })

    // Group by round for bracket display
    const byRound = matches.reduce(
      (acc, match) => {
        const r = match.round
        if (!acc[r]) acc[r] = []
        acc[r].push(match)
        return acc
      },
      {} as Record<number, typeof matches>
    )

    return NextResponse.json({
      data: matches,
      byRound,
    })
  } catch (error) {
    console.error('Error fetching matches:', error)
    return NextResponse.json(
      { error: 'Failed to fetch matches' },
      { status: 500 }
    )
  }
}

// POST - Report match result
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { matchId, winnerId, score1, score2 } = body as {
      matchId: string
      winnerId: string
      score1: number
      score2: number
    }

    const match = await prisma.tournamentMatch.findFirst({
      where: {
        id: matchId,
        tournamentId: id,
      },
      include: {
        tournament: true,
        player1: true,
        player2: true,
      },
    })

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    // Check authorization: admin/mod or one of the players
    const isAdmin = session.user.role === 'admin' || session.user.role === 'moderator'
    const isPlayer = match.player1Id === session.user.id || match.player2Id === session.user.id

    if (!isAdmin && !isPlayer) {
      return NextResponse.json(
        { error: 'Not authorized to report this match' },
        { status: 403 }
      )
    }

    // Validate winner is one of the players
    if (winnerId !== match.player1Id && winnerId !== match.player2Id) {
      return NextResponse.json(
        { error: 'Winner must be one of the players' },
        { status: 400 }
      )
    }

    // Update on Challonge if linked
    if (match.tournament.challongeId && match.challongeMatchId) {
      try {
        const challonge = getChallongeService()

        // Get participant IDs
        const participants = await prisma.tournamentParticipant.findMany({
          where: {
            tournamentId: id,
            userId: { in: [match.player1Id!, match.player2Id!] },
          },
        })

        const winnerParticipant = participants.find((p) => p.userId === winnerId)

        await challonge.reportMatchScore(
          match.tournament.challongeId,
          match.challongeMatchId,
          {
            winnerId: winnerParticipant?.challongeParticipantId ?? '',
            scoresCsv: `${score1}-${score2}`,
          }
        )
      } catch (err) {
        console.error('Failed to report match to Challonge:', err)
      }
    }

    const updated = await prisma.tournamentMatch.update({
      where: { id: matchId },
      data: {
        winnerId,
        score: `${score1}-${score2}`,
        state: 'complete',
      },
      include: {
        player1: { include: { profile: true } },
        player2: { include: { profile: true } },
        winner: { include: { profile: true } },
      },
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('Error reporting match:', error)
    return NextResponse.json(
      { error: 'Failed to report match' },
      { status: 500 }
    )
  }
}
