import { Box, Container, Grid } from '@mui/material';
import { cacheLife } from 'next/cache';
import { getRPBClips } from '@/lib/twitch';
import { getRecentYouTubeVideos } from '@/lib/youtube';
import { BeyTubeSection } from './_components/BeyTubeSection';
import { MediaGallery } from './_components/MediaGallery';
import TvHeader from './_components/TvHeader';

export const metadata = {
  title: 'RPB TV | Direct',
  description:
    'Suivez les tournois RPB en direct sur Twitch et retrouvez nos replays sur YouTube.',
};

export default async function TVPage() {
  'use cache';
  cacheLife('minutes');

  const domain = process.env.NEXT_PUBLIC_DOMAIN || 'rpbey.fr';

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
        {/* Colonne Gauche: Header + BeyTube FR */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Box sx={{ mb: { xs: 1, md: 3 }, px: { xs: 1, md: 0 } }}>
            <TvHeader />
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
