import { YouTube as YouTubeIcon } from '@mui/icons-material';
import { Box, Button, Typography } from '@mui/material';

interface YoutubeSectionProps {
  channelId: string;
}

export default function YoutubeSection({ channelId }: YoutubeSectionProps) {
  // Uploads playlist ID is channel ID with UU instead of UC
  const uploadsPlaylistId = channelId.replace('UC', 'UU');

  return (
    <>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <YouTubeIcon color="error" sx={{ fontSize: { xs: 32, sm: 40 } }} />
        <Box sx={{ flexGrow: 1 }}>
          <Typography
            variant="h4"
            fontWeight="bold"
            sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}
          >
            Rediffusion YouTube
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
          >
            Retrouvez nos dernières vidéos et replays de tournois
          </Typography>
        </Box>
        <Button
          variant="outlined"
          color="error"
          startIcon={<YouTubeIcon />}
          href={`https://www.youtube.com/channel/${channelId}`}
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
          src={`https://www.youtube-nocookie.com/embed/videoseries?list=${uploadsPlaylistId}`}
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
          href={`https://www.youtube.com/channel/${channelId}`}
          target="_blank"
          rel="noopener noreferrer"
          sx={{ borderRadius: 2, py: 1.5, fontWeight: 'bold' }}
        >
          S'abonner à la chaîne
        </Button>
      </Box>
    </>
  );
}
