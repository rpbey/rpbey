'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import type { TournamentStatus } from '@prisma/client'
import { getChallongeService } from '@/lib/challonge'

export type TournamentInput = {
  name: string
  description?: string | null
  date: string | Date
  location?: string | null
  format: string
  maxPlayers: number
  status: TournamentStatus
  challongeUrl?: string | null
}

export async function syncCommunityTournaments() {
  const communityId = process.env.CHALLONGE_COMMUNITY_ID
  if (!communityId) {
    throw new Error('CHALLONGE_COMMUNITY_ID is not configured')
  }

  const service = getChallongeService()
  
  // Fetch tournaments from Challonge (pending and in_progress)
  // We fetch multiple pages if needed, but for now let's just get the first page of 25
  const response = await service.listCommunityTournaments(communityId, {
    perPage: 25
  })

  const challongeTournaments = response.data

  // Get existing tournaments to avoid duplicates
  const existingTournaments = await prisma.tournament.findMany({
    where: {
      challongeId: { in: challongeTournaments.map(t => t.id) }
    },
    select: { challongeId: true }
  })

  const existingIds = new Set(existingTournaments.map(t => t.challongeId))
  const newTournaments = challongeTournaments.filter(t => !existingIds.has(t.id))

  return newTournaments
}

export async function importTournamentFromChallonge(challongeId: string) {
  const service = getChallongeService()
  const response = await service.getTournament(challongeId)
  const t = response.data.attributes

  // Map Challonge state to our status
  let status: TournamentStatus = 'UPCOMING'
  if (t.state === 'pending') status = 'REGISTRATION_OPEN'
  if (t.state === 'in_progress' || t.state === 'underway') status = 'UNDERWAY'
  if (t.state === 'complete' || t.state === 'ended') status = 'COMPLETE'

  await prisma.tournament.create({
    data: {
      name: t.name,
      description: t.description,
      date: t.startAt ? new Date(t.startAt) : new Date(),
      format: t.tournamentType,
      maxPlayers: 64, // Default
      status,
      challongeId: response.data.id,
      challongeUrl: t.url, // Usually just the slug
    }
  })

  revalidatePath('/admin/tournaments')
}

export async function getTournaments(page = 1, pageSize = 10, search = '') {
  const skip = (page - 1) * pageSize
  
  const where = search ? {
    OR: [
      { name: { contains: search, mode: 'insensitive' as const } },
      { description: { contains: search, mode: 'insensitive' as const } },
    ]
  } : {}

  const [tournaments, total, stats] = await Promise.all([
    prisma.tournament.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { date: 'desc' },
      include: {
        _count: {
          select: { participants: true }
        }
      }
    }),
    prisma.tournament.count({ where }),
    // Global stats (not filtered by search to keep dashboard summary accurate)
    prisma.$transaction([
      prisma.tournament.count(),
      prisma.tournament.count({
        where: {
          status: { in: ['REGISTRATION_OPEN', 'UNDERWAY', 'CHECKIN'] }
        }
      }),
      prisma.tournamentParticipant.count()
    ])
  ])

  return { 
    tournaments, 
    total,
    summary: {
      totalTournaments: stats[0],
      activeTournaments: stats[1],
      totalParticipants: stats[2]
    }
  }
}

export async function createTournament(data: TournamentInput) {
  const { name, description, date, location, format, maxPlayers, status, challongeUrl } = data
  
  await prisma.tournament.create({
    data: {
      name,
      description,
      date: new Date(date),
      location,
      format,
      maxPlayers,
      status,
      challongeUrl,
    },
  })

  revalidatePath('/admin/tournaments')
}

export async function updateTournament(id: string, data: TournamentInput) {
  const { name, description, date, location, format, maxPlayers, status, challongeUrl } = data
  
  await prisma.tournament.update({
    where: { id },
    data: {
      name,
      description,
      date: new Date(date),
      location,
      format,
      maxPlayers,
      status,
      challongeUrl,
    },
  })

  revalidatePath('/admin/tournaments')
  revalidatePath('/tournaments') // Revalidate marketing page if exists
}

export async function deleteTournament(id: string) {
  await prisma.tournament.delete({
    where: { id },
  })

  revalidatePath('/admin/tournaments')
  revalidatePath('/tournaments')
}
