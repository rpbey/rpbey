import { Box, Container, Typography } from '@mui/material';
import { getBeyTubeFeatured } from '@/lib/beytube';
import { getRPBClips } from '@/lib/twitch';
import { getRecentYouTubeVideos } from '@/lib/youtube';
import { TvFeed } from './_components/TvFeed';

export const metadata = {
  title: 'Rediffusion TV | Clips & Vidéos',
  description:
    'Le meilleur du Beyblade X : Clips Twitch, vidéos Rediffusion et sélection BeyTube FR.',
};

import { connection } from 'next/server';

export default async function TVPage() {
  await connection();
  const domain = process.env.NEXT_PUBLIC_DOMAIN || 'rpbey.fr';

  // Fetch all media in parallel
  const [clips, rpbVideos, beyTubeVideos] = await Promise.all([
    getRPBClips(20),
    getRecentYouTubeVideos(undefined, 20),
    getBeyTubeFeatured(),
  ]);

  return (
    <Container maxWidth="lg" sx={{ py: 4, px: { xs: 0, sm: 3 } }}>
      <Box sx={{ mb: 4, px: { xs: 2, sm: 0 } }}>
        <Typography
          variant="h2"
          fontWeight="900"
          sx={{
            textTransform: 'uppercase',
            letterSpacing: '-0.02em',
            background: 'linear-gradient(135deg, #dc2626 0%, #fbbf24 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          RPB TV
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" fontWeight="600">
          Clips, Rediffusions et BeyTube FR
        </Typography>
      </Box>

      <TvFeed
        clips={clips}
        rpbVideos={rpbVideos}
        beyTubeVideos={beyTubeVideos}
        domain={domain}
      />
    </Container>
  );
}
