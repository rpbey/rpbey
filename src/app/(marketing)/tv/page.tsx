import { Box, Container, Grid } from '@mui/material';
import { cacheLife } from 'next/cache';
import {
  getLatestRPBVideo,
  getRPBClips,
  getRPBStreamInfo,
} from '@/lib/twitch';
import { getRecentYouTubeVideos } from '@/lib/youtube';
import { BeyTubeSection } from './_components/BeyTubeSection';
import { MediaGallery } from './_components/MediaGallery';
import TvHeader from './_components/TvHeader';
import TwitchPlayer from './_components/TwitchPlayer';

export const metadata = {
  title: 'RPB TV | Direct',
  description:
    'Suivez les tournois RPB en direct sur Twitch et retrouvez nos replays sur YouTube.',
};

export default async function TVPage() {
  'use cache';
  cacheLife('minutes');

  const domain = process.env.NEXT_PUBLIC_DOMAIN || 'rpbey.fr';
  const channelName = process.env.NEXT_PUBLIC_TWITCH_CHANNEL || 'tv_rpb';

  // Fetch media in parallel
  const [clips, youtubeVideos, streamInfo, latestVideo] = await Promise.all([
    getRPBClips(6),
    getRecentYouTubeVideos(undefined, 6),
    getRPBStreamInfo(),
    getLatestRPBVideo(),
  ]);

  return (
    <Container
      maxWidth="xl"
      sx={{ py: { xs: 0, md: 4 }, px: { xs: 2, md: 3 } }}
    >
      <Grid container spacing={{ xs: 0, md: 4 }} alignItems="flex-start">
        {/* Colonne Gauche: Header + Player + BeyTube FR */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Box sx={{ mb: { xs: 1, md: 3 }, px: { xs: 1, md: 0 } }}>
            <TvHeader />
          </Box>

          {/* Twitch Player (Live or VOD) */}
          <Box sx={{ mb: 4 }}>
            <TwitchPlayer
              channelName={channelName}
              isLive={streamInfo?.isLive ?? false}
              videoId={latestVideo?.id}
              domain={domain}
            />
          </Box>

          <Box sx={{ position: { lg: 'sticky' }, top: 80, zIndex: 10 }}>
            <BeyTubeSection />
          </Box>
        </Grid>

        {/* Colonne Droite: Médiathèque (Clips & YouTube) */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Box sx={{ px: { xs: 1, md: 0 } }}>
            <MediaGallery
              clips={clips}
              youtubeVideos={youtubeVideos}
              domain={domain}
            />
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
}
