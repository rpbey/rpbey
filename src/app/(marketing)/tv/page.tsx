import { Container } from '@mui/material';
import Grid from '@mui/material/Grid';
import { headers } from 'next/headers';
import { getLatestRPBVideo, getRPBStreamInfo } from '@/lib/twitch';
import StreamStatus from './_components/StreamStatus';
import TvHeader from './_components/TvHeader';
import TwitchPlayer from './_components/TwitchPlayer';
import ViewerCount from './_components/ViewerCount';
import YoutubeSection from './_components/YoutubeSection';

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
  const domain = process.env.NEXT_PUBLIC_DOMAIN || 'rpbey.fr';

  let videoId = null;
  let latestVideo = null;

  if (!streamInfo?.isLive) {
    latestVideo = await getLatestRPBVideo();
    if (latestVideo) {
      videoId = latestVideo.id;
    }
  }

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }}>
      <Grid container spacing={6} alignItems="flex-start">
        {/* Colonne Gauche: Twitch + Stats */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <TvHeader />

          <TwitchPlayer
            channelName={channelName}
            isLive={streamInfo?.isLive ?? false}
            videoId={videoId}
            domain={domain}
          />

          <Grid container spacing={2} sx={{ mt: 3 }}>
            <Grid size={{ xs: 12 }}>
              <StreamStatus streamInfo={streamInfo} latestVideo={latestVideo} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <ViewerCount
                isLive={streamInfo?.isLive ?? false}
                viewerCount={streamInfo?.viewerCount}
                hasLatestVideo={!!latestVideo}
              />
            </Grid>
          </Grid>
        </Grid>

        {/* Colonne Droite: YouTube */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <YoutubeSection channelId={youtubeChannelId} />
        </Grid>
      </Grid>
    </Container>
  );
}
