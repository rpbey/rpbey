'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import type { TournamentStatus } from '@prisma/client'

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
