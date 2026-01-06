import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import { TournamentCardGrid } from '@/components/cards/TournamentCard'
import prisma from '@/lib/prisma'
import { PageHeader } from '@/components/ui'
import { headers } from 'next/headers'

export const metadata = {
  title: 'Tournois',
  description: 'Participez aux tournois officiels de la République Populaire du Beyblade.',
}

export default async function TournamentsPage() {
  await headers()
  const tournaments = await prisma.tournament.findMany({
    orderBy: { date: 'asc' },
    include: {
      _count: {
        select: { participants: true }
      }
    }
  })

  // Map Prisma models to TournamentCard props
  const formattedTournaments = tournaments.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    startDate: t.date,
    status: t.status.toLowerCase() as any,
    maxParticipants: t.maxPlayers,
    currentParticipants: t._count.participants,
  }))

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <PageHeader
        title="Tournois"
        description="Découvrez et inscrivez-vous aux prochains tournois Beyblade X."
      />

      {formattedTournaments.length > 0 ? (
        <TournamentCardGrid tournaments={formattedTournaments} />
      ) : (
        <Box sx={{ textAlign: 'center', py: 10 }}>
          <Typography variant="h6" color="text.secondary">
            Aucun tournoi n'est prévu pour le moment.
          </Typography>
        </Box>
      )}
    </Container>
  )
}
