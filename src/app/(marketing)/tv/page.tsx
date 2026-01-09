import {
  History,
  LiveTv,
  Radio,
  YouTube as YouTubeIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { headers } from 'next/headers';
import { getLatestRPBVideo, getRPBStreamInfo } from '@/lib/twitch';

export const metadata = {
  title: 'RPB TV | Direct',
  description:
    'Suivez les tournois RPB en direct sur Twitch et retrouvez nos replays sur YouTube.',
};

export default async function TVPage() {
  await headers();
  const streamInfo = await getRPBStreamInfo();
  const channelName = process.env.NEXT_PUBLIC_TWITCH_CHANNEL || 'tv_rpb';
  const youtubeChannelId = 'UCHiDwWI-2uQrsUiJhXt6rng';
  // Uploads playlist ID is channel ID with UU instead of UC
  const youtubeUploadsPlaylistId = youtubeChannelId.replace('UC', 'UU');

  let videoId = null;
  let latestVideo = null;

  if (!streamInfo?.isLive) {
    latestVideo = await getLatestRPBVideo();
    if (latestVideo) {
      videoId = latestVideo.id;
    }
  }

  // Determine Player URL
  // If Live: channel=...
  // If Offline & Video: video=...
  // If Offline & No Video: channel=... (Default offline screen)
  const playerBaseUrl = 'https://player.twitch.tv/';
  const parentParam = `&parent=${process.env.NEXT_PUBLIC_DOMAIN || 'rpbey.fr'}&parent=localhost`;

  let playerSrc = `${playerBaseUrl}?channel=${channelName}${parentParam}`;

  if (!streamInfo?.isLive && videoId) {
    playerSrc = `${playerBaseUrl}?video=${videoId}${parentParam}`;
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <LiveTv color="primary" sx={{ fontSize: 40 }} />
        <Box>
          <Typography variant="h4" fontWeight="bold">
            RPB TV
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Le direct de la communauté sur Twitch
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16/9',
          bgcolor: 'black',
          borderRadius: 4,
          overflow: 'hidden',
          mb: 4,
          boxShadow: 10,
        }}
      >
        <iframe
          src={playerSrc}
          height="100%"
          width="100%"
          allowFullScreen
          style={{ border: 'none' }}
        />
      </Box>

      <Grid container spacing={3} sx={{ mb: 8 }}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ borderRadius: 4 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                {streamInfo?.isLive
                  ? streamInfo.title
                  : latestVideo
                    ? `Dernière diffusion: ${latestVideo.title}`
                    : 'La chaîne est actuellement hors ligne'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {streamInfo?.isLive
                  ? `En train de diffuser: ${streamInfo.gameName}`
                  : latestVideo
                    ? `Diffusé le ${latestVideo.publishedAt.toLocaleDateString('fr-FR')} • ${latestVideo.viewCount} vues`
                    : 'Rejoignez notre Discord pour être notifié du prochain live !'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card
            sx={{
              borderRadius: 4,
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'surface.low',
            }}
          >
            <CardContent sx={{ textAlign: 'center' }}>
              {streamInfo?.isLive ? (
                <>
                  <Radio sx={{ fontSize: 48, mb: 1, color: 'error.main' }} />
                  <Typography variant="subtitle1" fontWeight="bold">
                    {streamInfo.viewerCount} Spectateurs
                  </Typography>
                </>
              ) : (
                <>
                  <History
                    sx={{ fontSize: 48, mb: 1, color: 'text.secondary' }}
                  />
                  <Typography
                    variant="subtitle1"
                    fontWeight="bold"
                    color="text.secondary"
                  >
                    {latestVideo ? 'Rediffusion' : 'Hors ligne'}
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Divider sx={{ mb: 8 }} />

      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <YouTubeIcon color="error" sx={{ fontSize: 40 }} />
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" fontWeight="bold">
            RPB YouTube
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Retrouvez nos dernières vidéos et replays de tournois
          </Typography>
        </Box>
        <Button
          variant="outlined"
          color="error"
          startIcon={<YouTubeIcon />}
          href={`https://www.youtube.com/channel/${youtubeChannelId}`}
          target="_blank"
          rel="noopener noreferrer"
          sx={{ borderRadius: 2, display: { xs: 'none', sm: 'flex' } }}
        >
          S'abonner
        </Button>
      </Box>

      <Box
        sx={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16/9',
          bgcolor: 'black',
          borderRadius: 4,
          overflow: 'hidden',
          mb: 4,
          boxShadow: 10,
        }}
      >
        <iframe
          src={`https://www.youtube-nocookie.com/embed/videoseries?list=${youtubeUploadsPlaylistId}`}
          title="YouTube video player"
          height="100%"
          width="100%"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          style={{ border: 'none' }}
        />
      </Box>

      <Box
        sx={{
          display: { xs: 'flex', sm: 'none' },
          justifyContent: 'center',
          mb: 4,
        }}
      >
        <Button
          variant="contained"
          color="error"
          fullWidth
          startIcon={<YouTubeIcon />}
          href={`https://www.youtube.com/channel/${youtubeChannelId}`}
          target="_blank"
          rel="noopener noreferrer"
          sx={{ borderRadius: 2, py: 1.5, fontWeight: 'bold' }}
        >
          S'abonner à la chaîne
        </Button>
      </Box>
    </Container>
  );
}
