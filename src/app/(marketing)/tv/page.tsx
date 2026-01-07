import { Container, Typography, Box, Card, CardContent } from '@mui/material'
import Grid from '@mui/material/Grid'
import { getRPBStreamInfo } from '@/lib/twitch'
import { headers } from 'next/headers'
import { LiveTv, Radio } from '@mui/icons-material'

export const metadata = {
  title: 'RPB TV | Direct',
  description: 'Suivez les tournois RPB en direct sur Twitch.',
}

export default async function TVPage() {
  await headers()
  const streamInfo = await getRPBStreamInfo()
  const channelName = process.env.NEXT_PUBLIC_TWITCH_CHANNEL || 'tv_rpb'

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <LiveTv color="primary" sx={{ fontSize: 40 }} />
        <Box>
            <Typography variant="h4" fontWeight="bold">
                RPB TV
            </Typography>
            <Typography variant="body1" color="text.secondary">
                Le direct de la communauté
            </Typography>
        </Box>
      </Box>

      <Box sx={{ position: 'relative', width: '100%', aspectRatio: '16/9', bgcolor: 'black', borderRadius: 4, overflow: 'hidden', mb: 4, boxShadow: 10 }}>
        <iframe
          src={`https://player.twitch.tv/?channel=${channelName}&parent=${process.env.NEXT_PUBLIC_DOMAIN || 'rpbey.fr'}&parent=localhost`}
          height="100%"
          width="100%"
          allowFullScreen
          style={{ border: 'none' }}
        />
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
            <Card sx={{ borderRadius: 4 }}>
                <CardContent>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                        {streamInfo?.isLive ? streamInfo.title : "La chaîne est actuellement hors ligne"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {streamInfo?.isLive 
                            ? `En train de diffuser: ${streamInfo.gameName}` 
                            : "Rejoignez notre Discord pour être notifié du prochain live !"}
                    </Typography>
                </CardContent>
            </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ borderRadius: 4, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'surface.low' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                    <Radio sx={{ fontSize: 48, mb: 1, color: streamInfo?.isLive ? 'error.main' : 'text.disabled' }} />
                    <Typography variant="subtitle1" fontWeight="bold">
                        {streamInfo?.isLive ? `${streamInfo.viewerCount} Spectateurs` : "Pas de live en cours"}
                    </Typography>
                </CardContent>
            </Card>
        </Grid>
      </Grid>
    </Container>
  )
}
