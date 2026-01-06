import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import { 
  SmartToy, 
  People, 
  TrendingUp,
  Visibility,
  PlayArrow,
  History,
} from '@mui/icons-material'
import { TrophyIcon } from '@/components/ui/Icons'
import prisma from '@/lib/prisma'
import { getBotStatus } from '@/lib/bot'
import { formatDateTime } from '@/lib/utils'
import { headers } from 'next/headers'

import { QuickActions } from '@/components/admin/QuickActions'

export default async function AdminDashboardPage() {
  // Access headers to ensure this page is treated as dynamic by Next.js 16
  await headers()

  const [userCount, activeTournamentCount, profileCount, botStatus] = await Promise.all([
    prisma.user.count(),
    prisma.tournament.count({
      where: {
        status: {
          in: ['REGISTRATION_OPEN', 'UNDERWAY', 'CHECKIN']
        }
      }
    }),
    prisma.profile.count(),
    getBotStatus()
  ])

  const stats = [
    { 
      label: 'Utilisateurs', 
      value: userCount.toLocaleString(), 
      change: '+12%', 
      icon: People,
      color: '#3b82f6',
    },
    { 
      label: 'Tournois actifs', 
      value: activeTournamentCount.toString(), 
      change: '+2', 
      icon: TrophyIcon,
      color: '#fbbf24',
    },
    { 
      label: 'Membres Discord', 
      value: botStatus?.memberCount?.toLocaleString() || '---', 
      change: botStatus ? 'En ligne' : 'Hors ligne', 
      icon: SmartToy,
      color: '#5865F2',
    },
    { 
      label: 'Profils Bladers', 
      value: profileCount.toLocaleString(), 
      change: '+5%', 
      icon: Visibility,
      color: '#dc2626',
    },
  ]

  const recentUsers = await prisma.user.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: { name: true, createdAt: true }
  })

  const recentTournaments = await prisma.tournament.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: { name: true, createdAt: true }
  })

  const recentActivity = [
    ...recentUsers.map(u => ({ 
      type: 'user', 
      message: `Nouvel utilisateur inscrit: ${u.name || 'Anonyme'}`, 
      date: u.createdAt 
    })),
    ...recentTournaments.map(t => ({ 
      type: 'tournament', 
      message: `Tournoi "${t.name}" créé`, 
      date: t.createdAt 
    }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 8)

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Vue d'ensemble
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Bienvenue sur le panel d'administration RPB
      </Typography>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Grid key={stat.label} size={{ xs: 12, sm: 6, lg: 3 }}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {stat.label}
                      </Typography>
                      <Typography variant="h4" fontWeight="bold">
                        {stat.value}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                        <Typography variant="caption" color={stat.change === 'Hors ligne' ? 'error.main' : 'success.main'}>
                          {stat.change}
                        </Typography>
                      </Box>
                    </Box>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: `${stat.color}20`,
                      }}
                    >
                      <Icon sx={{ color: stat.color }} />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )
        })}
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Activity */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <History /> Activité récente
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {recentActivity.length > 0 ? recentActivity.map((activity, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      p: 2,
                      borderRadius: 2,
                      bgcolor: 'background.default',
                    }}
                  >
                    <Typography variant="body2">{activity.message}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDateTime(activity.date)}
                    </Typography>
                  </Box>
                )) : (
                  <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                    Aucune activité récente
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Actions rapides
              </Typography>
              <QuickActions />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  )
}
