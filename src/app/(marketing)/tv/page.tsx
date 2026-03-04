import { Box, Container, Typography } from '@mui/material';
import { getBeyTubeFeatured } from '@/lib/beytube';
import { getTikTokVideos } from '@/lib/tiktok';
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

  // Helper to fetch with timeout and safety
  const safeFetch = async <T,>(
    promise: Promise<T>,
    fallback: T,
  ): Promise<T> => {
    try {
      return await promise;
    } catch (e) {
      console.error('SafeFetch error:', e);
      return fallback;
    }
  };

  // Start all media fetches in parallel (don't await them yet)
  const clipsPromise = safeFetch(getRPBClips(20), []);
  const rpbVideosPromise = safeFetch(getRecentYouTubeVideos(undefined, 20), []);
  const beyTubeVideosPromise = safeFetch(getBeyTubeFeatured(), []);

  // TikTok needs merging so we create a combined promise
  const tikTokVideosPromise = (async () => {
    const [rpbTikTok, skarnTikTok, sunTikTok] = await Promise.all([
      safeFetch(getTikTokVideos('rpbeyblade1'), []),
      safeFetch(getTikTokVideos('skarngamemaster'), []),
      safeFetch(getTikTokVideos('sunafterthereign'), []),
    ]);

    return [...rpbTikTok, ...skarnTikTok, ...sunTikTok]
      .sort((a, b) => b.createTime - a.createTime)
      .slice(0, 20);
  })();

  return (
    <Container maxWidth="lg" sx={{ py: 4, px: { xs: 0, sm: 3 } }}>
      <Box sx={{ mb: 4, px: { xs: 2, sm: 0 } }}>
        <Typography
          variant="h2"
          component="h1"
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
        clipsPromise={clipsPromise}
        rpbVideosPromise={rpbVideosPromise}
        beyTubeVideosPromise={beyTubeVideosPromise}
        tikTokVideosPromise={tikTokVideosPromise}
        domain={domain}
      />
    </Container>
  );
}
