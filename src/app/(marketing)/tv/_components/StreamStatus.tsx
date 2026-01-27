import { Box, Card, CardContent, Chip, Typography } from '@mui/material';
import type { StreamInfo, VideoInfo } from '@/lib/twitch';

interface StreamStatusProps {
  streamInfo: StreamInfo | null;
  latestVideo: VideoInfo | null;
}

export default function StreamStatus({
  streamInfo,
  latestVideo,
}: StreamStatusProps) {
  return (
    <Card
      sx={{
        borderRadius: 4,
        height: '100%',
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          {streamInfo?.isLive && (
            <Chip
              label="EN DIRECT"
              size="small"
              sx={{
                bgcolor: '#ff0000',
                color: 'white',
                fontWeight: 'bold',
                borderRadius: 1,
                height: 24,
                '& .MuiChip-label': { px: 1 },
              }}
            />
          )}
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h6"
              fontWeight="bold"
              sx={{ lineHeight: 1.3, mb: 0.5 }}
            >
              {streamInfo?.isLive
                ? streamInfo.title
                : latestVideo
                  ? `Replay : ${latestVideo.title}`
                  : 'La chaîne est actuellement hors ligne'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {streamInfo?.isLive
                ? `Catégorie : ${streamInfo.gameName}`
                : latestVideo
                  ? `Diffusé le ${latestVideo.publishedAt.toLocaleDateString('fr-FR')} • ${latestVideo.viewCount} vues`
                  : 'Rejoignez notre Discord pour être notifié du prochain live !'}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
