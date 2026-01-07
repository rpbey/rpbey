import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import {
  Check,
  Close,
  Memory,
  Speed,
  AccessTime,
  Dns,
} from '@mui/icons-material'
import { getBotStatus } from '@/lib/bot'
import { BotActions } from '@/components/admin/BotActions'
import { headers } from 'next/headers'

export default async function AdminDiscordPage() {
  await headers()
  const status = await getBotStatus()
  const isOnline = !!status

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
          icon={isOnline ? <Check /> : <Close />}
          label={isOnline ? 'En ligne' : 'Hors ligne'}
          color={isOnline ? 'success' : 'error'}
          variant="outlined"
        />
      </Box>

      <Grid container spacing={3}>
        {/* Status Card */}
        <Grid size={{ xs: 12, lg: 8 }}>
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
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Status Système
              </Typography>
              
              <Grid container spacing={4} sx={{ mt: 1 }}>
                <Grid size={{ xs: 6, md: 4 }}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <AccessTime color="primary" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">Uptime</Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {status?.uptimeFormatted || '---'}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid size={{ xs: 6, md: 4 }}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Speed color="warning" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">Latence</Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {status?.ping ? `${Math.round(status.ping)}ms` : '---'}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid size={{ xs: 6, md: 4 }}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Memory color="info" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">Mémoire</Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {status?.memoryUsage || '---'}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid size={{ xs: 6, md: 4 }}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Dns color="secondary" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">Node Version</Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {status?.nodeVersion || '---'}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>

              <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mt: 4 }}>
                Statistiques Discord
              </Typography>
              
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <PaperStat label="Serveurs" value={status?.guilds || 0} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <PaperStat label="Utilisateurs" value={status?.memberCount || 0} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <PaperStat label="En ligne" value={status?.onlineCount || 0} color="success.main" />
                </Grid>
              </Grid>

            </CardContent>
          </Card>
        </Grid>

        {/* Actions Card */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <BotActions />
        </Grid>
      </Grid>
    </Container>
  )
}

function PaperStat({ label, value, color }: { label: string, value: number | string, color?: string }) {
  return (
    <Box sx={{ 
      p: 2, 
      borderRadius: 2, 
      bgcolor: 'background.default',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      <Typography variant="h4" fontWeight="bold" color={color}>
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
    </Box>
  )
}
