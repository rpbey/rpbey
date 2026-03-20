import { ArrowBack, ArrowForward } from '@mui/icons-material';
import { Box, Button, Typography } from '@mui/material';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAnimeEpisode } from '@/server/actions/anime';
import { getEpisodeProgress } from '@/server/actions/anime-progress';
import { EpisodeViewer } from '../../_components/EpisodeViewer';

interface Props {
  params: Promise<{ slug: string; episode: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, episode } = await params;
  const num = Number.parseInt(episode, 10);
  if (Number.isNaN(num)) return { title: 'Épisode introuvable | RPB' };

  const data = await getAnimeEpisode(slug, num);
  if (!data) return { title: 'Épisode introuvable | RPB' };

  return {
    title: `${data.series.titleFr || data.series.title} EP ${num} | RPB`,
    description:
      data.episode.synopsis ||
      `Épisode ${num} de ${data.series.titleFr || data.series.title}`,
  };
}

export default async function EpisodePage({ params }: Props) {
  const { slug, episode } = await params;
  const num = Number.parseInt(episode, 10);
  if (Number.isNaN(num)) notFound();

  const data = await getAnimeEpisode(slug, num);
  if (!data) notFound();

  const { episode: ep, series, prev, next } = data;

  // Get saved progress
  const progress = await getEpisodeProgress(ep.id);
  const savedTime =
    progress && progress.status !== 'COMPLETED' ? progress.progressTime : 0;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0a0a0a', pb: 8 }}>
      {/* Player + source selector */}
      <Box
        sx={{
          maxWidth: 1200,
          mx: 'auto',
          px: { xs: 0, md: 4 },
          pt: { xs: 0, md: 3 },
        }}
      >
        <EpisodeViewer
          title={`${series.titleFr || series.title} - EP ${ep.number}`}
          sources={ep.sources}
          savedProgress={savedTime}
          episodeId={ep.id}
          duration={ep.duration}
        />
      </Box>

      {/* Episode info */}
      <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, md: 4 }, mt: 3 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
          <Link
            href={`/anime/${slug}`}
            style={{ color: 'inherit', textDecoration: 'none' }}
          >
            {series.titleFr || series.title}
          </Link>{' '}
          · Épisode {ep.number}
        </Typography>
        <Typography
          variant="h5"
          fontWeight={800}
          sx={{ color: 'text.primary', mb: 1 }}
        >
          {ep.titleFr || ep.title}
        </Typography>
        {ep.synopsis && (
          <Typography
            variant="body1"
            sx={{ color: 'rgba(255,255,255,0.7)', maxWidth: 800, mb: 3 }}
          >
            {ep.synopsis}
          </Typography>
        )}

        {/* Navigation */}
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          {prev && (
            <Button
              component={Link}
              href={`/anime/${slug}/${prev.number}`}
              startIcon={<ArrowBack />}
              variant="outlined"
              sx={{
                borderColor: 'rgba(255,255,255,0.2)',
                color: 'text.primary',
                borderRadius: 2,
              }}
            >
              EP {prev.number}
            </Button>
          )}
          {next && (
            <Button
              component={Link}
              href={`/anime/${slug}/${next.number}`}
              endIcon={<ArrowForward />}
              variant="contained"
              sx={{
                bgcolor: '#dc2626',
                color: 'white',
                borderRadius: 2,
                '&:hover': { bgcolor: '#b91c1c' },
              }}
            >
              EP {next.number}
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
}
