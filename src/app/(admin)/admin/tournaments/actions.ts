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

export async function getTournaments() {
  return await prisma.tournament.findMany({
    orderBy: { date: 'desc' },
    include: {
      _count: {
        select: { participants: true }
      }
    }
  })
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
