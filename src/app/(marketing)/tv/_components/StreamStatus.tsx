import { Card, CardContent, Typography } from '@mui/material';
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
    <Card sx={{ borderRadius: 4, height: '100%' }}>
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
  );
}
