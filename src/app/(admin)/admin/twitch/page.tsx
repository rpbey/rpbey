import {
  AccessTime,
  Circle,
  LiveTv,
  VideogameAsset,
  Visibility,
} from '@mui/icons-material';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { headers } from 'next/headers';
import { getRPBStreamInfo } from '@/lib/twitch';
import { formatDateTime } from '@/lib/utils';

export const metadata = {
  title: 'Twitch Integration',
};

export default async function AdminTwitchPage() {
  await headers();
  const streamInfo = await getRPBStreamInfo();
  const isConfigured =
    !!process.env.TWITCH_CLIENT_ID && !!process.env.TWITCH_CLIENT_SECRET;

  if (!isConfigured) {
    return (
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Twitch
        </Typography>
        <Alert severity="warning">
          L'intégration Twitch n'est pas configurée. Veuillez ajouter
          TWITCH_CLIENT_ID et TWITCH_CLIENT_SECRET dans votre fichier .env.
        </Alert>
      </Box>
    );
  }

  if (!streamInfo) {
    return (
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Twitch
        </Typography>
        <Alert severity="error">
          Impossible de récupérer les informations de la chaîne. Vérifiez le nom
          de la chaîne et vos identifiants.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="h4" fontWeight="bold">
          Twitch: {streamInfo.userName}
        </Typography>
        {streamInfo.isLive ? (
          <Chip
            icon={
              <Circle
                sx={{ fontSize: '12px !important', color: 'error.main' }}
              />
            }
            label="EN LIVE"
            color="error"
            variant="outlined"
            sx={{
              fontWeight: 'bold',
              borderColor: 'error.main',
              color: 'error.main',
            }}
          />
        ) : (
          <Chip
            label="HORS LIGNE"
            variant="outlined"
            sx={{ fontWeight: 'bold' }}
          />
        )}
      </Box>

      <Grid container spacing={3}>
        {/* Main Info Card */}
        <Grid size={{ xs: 12, md: 8 }}>
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
              <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
                <Avatar
                  src={streamInfo.avatarUrl}
                  alt={streamInfo.userName}
                  sx={{ width: 80, height: 80 }}
                />
                <Box>
                  <Typography variant="h5" fontWeight="bold" gutterBottom>
                    {streamInfo.title || 'Aucun titre'}
                  </Typography>
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    color="text.secondary"
                  >
                    <VideogameAsset fontSize="small" />
                    <Typography variant="body1">
                      {streamInfo.gameName || 'Aucun jeu'}
                    </Typography>
                  </Stack>
                </Box>
              </Box>

              {streamInfo.isLive && streamInfo.thumbnailUrl && (
                <Box
                  component="img"
                  src={streamInfo.thumbnailUrl}
                  alt="Stream Thumbnail"
                  sx={{
                    width: '100%',
                    borderRadius: 2,
                    aspectRatio: '16/9',
                    objectFit: 'cover',
                  }}
                />
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Stats Grid */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing={3}>
            {/* Viewers Card */}
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center" mb={1}>
                  <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'primary.dark' }}>
                    <Visibility sx={{ color: 'white' }} />
                  </Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Spectateurs
                  </Typography>
                </Stack>
                <Typography variant="h3" fontWeight="bold">
                  {streamInfo.viewerCount ?? 0}
                </Typography>
              </CardContent>
            </Card>

            {/* Uptime Card */}
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center" mb={1}>
                  <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'warning.dark' }}>
                    <AccessTime sx={{ color: 'white' }} />
                  </Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Début du live
                  </Typography>
                </Stack>
                <Typography variant="h6" fontWeight="bold">
                  {streamInfo.startedAt
                    ? formatDateTime(streamInfo.startedAt)
                    : '-'}
                </Typography>
              </CardContent>
            </Card>

            {/* Channel Info */}
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center" mb={1}>
                  <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'success.dark' }}>
                    <LiveTv sx={{ color: 'white' }} />
                  </Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Chaîne
                  </Typography>
                </Stack>
                <Typography variant="body1" fontWeight="bold">
                  twitch.tv/{streamInfo.userName.toLowerCase()}
                </Typography>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
