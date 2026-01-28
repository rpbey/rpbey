import { Container } from '@mui/material';
import { cacheLife } from 'next/cache';
import { getBeyTubeFeatured } from '@/lib/beytube';
import { getRPBClips } from '@/lib/twitch';
import { getRecentYouTubeVideos } from '@/lib/youtube';
import TvHeader from './_components/TvHeader';
import { TvFeed } from './_components/TvFeed';

export const metadata = {
  title: 'RPB TV | Clips & Vidéos',
  description:
    'Le meilleur du Beyblade X : Clips Twitch, vidéos RPB et sélection BeyTube FR.',
};

export default async function TVPage() {
  'use cache';
  cacheLife('minutes');

  const domain = process.env.NEXT_PUBLIC_DOMAIN || 'rpbey.fr';

  // Fetch all media in parallel
  const [clips, rpbVideos, beyTubeVideos] = await Promise.all([
    getRPBClips(20),
    getRecentYouTubeVideos(undefined, 20),
    getBeyTubeFeatured(),
  ]);

  return (
    <Container maxWidth="md" sx={{ py: 0, px: 0 }}>
      <TvHeader />
      <TvFeed
        clips={clips}
        rpbVideos={rpbVideos}
        beyTubeVideos={beyTubeVideos}
        domain={domain}
      />
    </Container>
  );
}
