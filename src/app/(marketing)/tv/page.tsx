import { Box, Container, Grid } from '@mui/material';
import { cacheLife } from 'next/cache';
import { getLatestRPBVideo, getRPBClips, getRPBStreamInfo } from '@/lib/twitch';
import { getRecentYouTubeVideos } from '@/lib/youtube';
import { BeyTubeSection } from './_components/BeyTubeSection';
import { MediaGallery } from './_components/MediaGallery';
import StreamStatus from './_components/StreamStatus';
import TvHeader from './_components/TvHeader';
import TwitchPlayer from './_components/TwitchPlayer';
import ViewerCount from './_components/ViewerCount';

export const metadata = {
  title: 'RPB TV | Direct',
  description:
    'Suivez les tournois RPB en direct sur Twitch et retrouvez nos replays sur YouTube.',
};

export default async function TVPage() {
  'use cache';
  cacheLife('minutes');
  const streamInfo = await getRPBStreamInfo();
  const channelName = process.env.NEXT_PUBLIC_TWITCH_CHANNEL || 'tv_rpb';
  const domain = process.env.NEXT_PUBLIC_DOMAIN || 'rpbey.fr';

  let videoId = null;
  let latestVideo = null;

  // Si pas de live, on récupère la dernière diffusion pour le player
  if (!streamInfo?.isLive) {
    latestVideo = await getLatestRPBVideo();
    if (latestVideo) {
      videoId = latestVideo.id;
    }
  }

  // Fetch media in parallel
  const [clips, youtubeVideos] = await Promise.all([
    getRPBClips(6),
    getRecentYouTubeVideos(undefined, 6),
  ]);

  return (
    <Container
      maxWidth="xl"
      sx={{ py: { xs: 0, md: 4 }, px: { xs: 2, md: 3 } }}
    >
      <Grid container spacing={{ xs: 0, md: 4 }} alignItems="flex-start">
        {/* Colonne Gauche: Twitch + Stats */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Box sx={{ mb: { xs: 1, md: 3 }, px: { xs: 1, md: 0 } }}>
            <TvHeader />
          </Box>

          <Box sx={{ position: { lg: 'sticky' }, top: 80, zIndex: 10 }}>
            <Box sx={{ mx: { xs: -2, md: 0 } }}>
              <TwitchPlayer
                channelName={channelName}
                isLive={streamInfo?.isLive ?? false}
                videoId={videoId}
                domain={domain}
              />
            </Box>

            <Grid
              container
              spacing={{ xs: 1, md: 2 }}
              sx={{ mt: { xs: 1, md: 2 }, px: { xs: 1, md: 0 } }}
            >
              <Grid size={{ xs: 12, md: 8 }}>
                <StreamStatus
                  streamInfo={streamInfo}
                  latestVideo={latestVideo}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <ViewerCount
                  isLive={streamInfo?.isLive ?? false}
                  viewerCount={streamInfo?.viewerCount}
                  hasLatestVideo={!!latestVideo}
                />
              </Grid>
            </Grid>
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

      {/* New BeyTube FR Section */}
      <Box sx={{ mt: 4, mb: -4 }}>
        <BeyTubeSection />
      </Box>
    </Container>
  );
}
