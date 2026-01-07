import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import prisma from '@/lib/prisma'
import { People, AccountCircle, PlayCircle, EmojiEvents } from '@mui/icons-material'
import { headers } from 'next/headers'
import { StatsCharts } from '@/components/admin/StatsCharts'

export default async function AdminStatsPage() {
  await headers()
  
  // Basic Counts
  const [userCount, profileCount, tournamentCount, matchCount] = await Promise.all([
    prisma.user.count(),
    prisma.profile.count(),
    prisma.tournament.count(),
    prisma.tournamentMatch.count({ where: { state: 'complete' } }),
  ])

  // Aggregate Data (Last 6 months)
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
  sixMonthsAgo.setDate(1) // Start of month

  const users = await prisma.user.findMany({
    where: { createdAt: { gte: sixMonthsAgo } },
    select: { createdAt: true }
  })

  const tournaments = await prisma.tournament.findMany({
    where: { createdAt: { gte: sixMonthsAgo } },
    select: { createdAt: true }
  })

  const matches = await prisma.tournamentMatch.findMany({
    select: { state: true }
  })

  // Helper to group by month
  const groupByMonth = (dates: { createdAt: Date }[]) => {
    const counts: Record<string, number> = {}
    // Init last 6 months
    for (let i = 0; i < 6; i++) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const key = d.toLocaleString('fr-FR', { month: 'short' })
      counts[key] = 0
    }
    
    dates.forEach(item => {
      const key = item.createdAt.toLocaleString('fr-FR', { month: 'short' })
      if (counts[key] !== undefined) counts[key]++
    })
    
    return Object.entries(counts)
      .map(([month, count]) => ({ month, count }))
      .reverse() // Chronological order
  }

  const registrationsData = groupByMonth(users)
  const tournamentsData = groupByMonth(tournaments)

  // Matches Status
  const matchStatusCounts = matches.reduce((acc, match) => {
    const status = match.state === 'complete' ? 'Terminé' : 
                   match.state === 'pending' ? 'En attente' : 'En cours'
    acc[status] = (acc[status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const matchesStatusData = Object.entries(matchStatusCounts).map(([status, count]) => ({
    status,
    count
  }))

  const stats = [
    { label: 'Utilisateurs total', value: userCount, icon: People, color: 'primary.main' },
    { label: 'Profils Bladers', value: profileCount, icon: AccountCircle, color: 'secondary.main' },
    { label: 'Tournois organisés', value: tournamentCount, icon: EmojiEvents, color: 'warning.main' },
    { label: 'Matchs joués', value: matchCount, icon: PlayCircle, color: 'success.main' },
  ]

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Statistiques
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Analytics et métriques réelles de la plateforme
      </Typography>

      <Grid container spacing={3}>
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Grid key={stat.label} size={{ xs: 12, sm: 6, md: 3 }}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  height: '100%',
                }}
              >
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: `${stat.color}15` }}>
                      <Icon sx={{ color: stat.color }} />
                    </Box>
                    <Box>
                      <Typography variant="h4" fontWeight="bold">
                        {stat.value}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {stat.label}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          )
        })}
      </Grid>

      <StatsCharts 
        registrations={registrationsData}
        tournaments={tournamentsData}
        matchesStatus={matchesStatusData}
      />
    </Container>
  )
}
