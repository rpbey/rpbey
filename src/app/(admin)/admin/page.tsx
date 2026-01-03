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
} from '@mui/icons-material'
import { TrophyIcon } from '@/components/ui/Icons'
import prisma from '@/lib/prisma'

export default async function AdminDashboardPage() {
  const userCount = await prisma.user.count()
  const activeTournamentCount = await prisma.tournament.count({
    where: {
      status: {
        in: ['REGISTRATION_OPEN', 'UNDERWAY', 'CHECKIN']
      }
    }
  })

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
      value: '5,678', 
      change: '+156', 
      icon: SmartToy,
      color: '#5865F2',
    },
    { 
      label: 'Vues TV (mois)', 
      value: '45.2K', 
      change: '+23%', 
      icon: Visibility,
      color: '#dc2626',
    },
  ]

  const recentActivity = [
    { type: 'user', message: 'Nouvel utilisateur inscrit: @Blader42', time: 'Il y a 5 min' },
    { type: 'tournament', message: 'Tournoi "RPB Championship #6" créé', time: 'Il y a 1h' },
    { type: 'bot', message: 'Bot Discord redémarré avec succès', time: 'Il y a 2h' },
    { type: 'stream', message: '156 vues sur Beyblade X Ep.45', time: 'Il y a 3h' },
  ]

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
                        <TrendingUp sx={{ fontSize: 16, color: 'success.main' }} />
                        <Typography variant="caption" color="success.main">
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
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Activité récente
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {recentActivity.map((activity, index) => (
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
                      {activity.time}
                    </Typography>
                  </Box>
                ))}
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
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {[
                  { label: 'Créer un tournoi', icon: TrophyIcon },
                  { label: 'Redémarrer le bot', icon: SmartToy },
                  { label: 'Lancer un stream', icon: PlayArrow },
                ].map((action) => {
                  const Icon = action.icon
                  return (
                    <Box
                      key={action.label}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        p: 2,
                        borderRadius: 2,
                        bgcolor: 'background.default',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          bgcolor: 'primary.main',
                          color: 'white',
                        },
                      }}
                    >
                      <Icon fontSize="small" />
                      <Typography variant="body2">{action.label}</Typography>
                    </Box>
                  )
                })}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  )
}
