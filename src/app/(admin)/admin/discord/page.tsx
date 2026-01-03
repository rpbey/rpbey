import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Switch from '@mui/material/Switch'
import {
  Power,
  Refresh,
  Terminal,
  Check,
  Close,
} from '@mui/icons-material'

const botStatus = {
  online: true,
  uptime: '5j 12h 34m',
  servers: 12,
  users: 5678,
  commands: 1234,
  lastRestart: '28 Dec 2025 14:30',
}

const features = [
  { name: 'Tournois', enabled: true, description: 'Système de gestion des tournois' },
  { name: 'Leveling', enabled: true, description: 'Système de niveaux et XP' },
  { name: 'Modération', enabled: true, description: 'Commandes de modération' },
  { name: 'Musique', enabled: false, description: 'Lecteur musical' },
  { name: 'Logs', enabled: true, description: 'Logs des actions' },
]

export default function AdminDiscordPage() {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Bot Discord
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gérez le bot RPB Discord
          </Typography>
        </Box>
        <Chip
          icon={botStatus.online ? <Check /> : <Close />}
          label={botStatus.online ? 'En ligne' : 'Hors ligne'}
          color={botStatus.online ? 'success' : 'error'}
          variant="outlined"
        />
      </Box>

      <Grid container spacing={3}>
        {/* Status Card */}
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
                Status
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Uptime</Typography>
                  <Typography variant="body2" fontWeight="bold">{botStatus.uptime}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Serveurs</Typography>
                  <Typography variant="body2" fontWeight="bold">{botStatus.servers}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Utilisateurs</Typography>
                  <Typography variant="body2" fontWeight="bold">{botStatus.users.toLocaleString()}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Commandes (24h)</Typography>
                  <Typography variant="body2" fontWeight="bold">{botStatus.commands.toLocaleString()}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Dernier redémarrage</Typography>
                  <Typography variant="body2" fontWeight="bold">{botStatus.lastRestart}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Actions Card */}
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
                Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="outlined"
                  color="success"
                  startIcon={<Refresh />}
                  fullWidth
                >
                  Redémarrer le bot
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Power />}
                  fullWidth
                >
                  Arrêter le bot
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Terminal />}
                  fullWidth
                >
                  Voir les logs
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Features Card */}
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
                Fonctionnalités
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {features.map((feature) => (
                  <Box
                    key={feature.name}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      p: 1,
                      borderRadius: 1,
                      bgcolor: 'background.default',
                    }}
                  >
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {feature.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {feature.description}
                      </Typography>
                    </Box>
                    <Switch checked={feature.enabled} size="small" />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  )
}
