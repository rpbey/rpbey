import { Box, Container, Typography } from '@mui/material';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { getBeyTubeFeatured } from '@/lib/beytube';
import { createPageMetadata } from '@/lib/seo-utils';
import { getTikTokVideos } from '@/lib/tiktok';
import { getRPBClips, getRPBVideos } from '@/lib/twitch';
import { getRecentYouTubeVideos } from '@/lib/youtube';
import { FeaturedVideo } from './_components/FeaturedVideo';
import { TvFeed } from './_components/TvFeed';

export const metadata = createPageMetadata({
  title: 'RPB TV | Clips & Rediffusions',
  description:
    'Le meilleur du Beyblade X : Clips Twitch, rediffusions et sélection BeyTube FR.',
  path: '/tv',
});

const FEATURED_VIDEO_ID = '4T_oJDeY8PU';

export default async function TVPage() {
  await connection();
  const domain = process.env.NEXT_PUBLIC_DOMAIN || 'rpbey.fr';

  const safeFetch = async <T,>(
    promise: Promise<T>,
    fallback: T,
  ): Promise<T> => {
    try {
      return await promise;
    } catch {
      return fallback;
    }
  };

  const clipsPromise = safeFetch(getRPBClips(20), []);

  const rpbVideosPromise = (async () => {
    const [twitchVods, ytVideos] = await Promise.all([
      safeFetch(getRPBVideos(15), []),
      safeFetch(getRecentYouTubeVideos(undefined, 15), []),
    ]);
    return [...twitchVods, ...ytVideos].sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );
  })();

  const beyTubeVideosPromise = safeFetch(getBeyTubeFeatured(), []);

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
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        pb: 8,
      }}
    >
      <Container maxWidth="lg" sx={{ px: { xs: 1.5, sm: 3 } }}>
        {/* Hero */}
        <Box sx={{ pt: { xs: 2, md: 5 }, pb: { xs: 2, md: 4 } }}>
          <Typography
            variant="h3"
            component="h1"
            fontWeight="900"
            sx={{
              fontSize: { xs: '1.6rem', md: '2.4rem' },
              letterSpacing: '-0.03em',
              background:
                'linear-gradient(135deg, var(--rpb-primary), var(--rpb-secondary))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            RPB TV
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ opacity: 0.6, fontSize: { xs: '0.85rem', md: '0.95rem' } }}
          >
            Clips, rediffusions et BeyTube FR
          </Typography>
        </Box>

        {/* Featured — lazy YouTube embed */}
        <Suspense
          fallback={
            <Box
              sx={{
                aspectRatio: '16/9',
                borderRadius: { xs: 2.5, md: 3.5 },
                bgcolor: '#111',
                mb: 4,
              }}
            />
          }
        >
          <FeaturedVideo videoId={FEATURED_VIDEO_ID} />
        </Suspense>

        <TvFeed
          clipsPromise={clipsPromise}
          rpbVideosPromise={rpbVideosPromise}
          beyTubeVideosPromise={beyTubeVideosPromise}
          tikTokVideosPromise={tikTokVideosPromise}
          domain={domain}
        />
      </Container>
    </Box>
  );
}
