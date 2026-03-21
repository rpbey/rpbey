import {
  ArrowBack,
  ArrowForward,
  ChevronRight,
  Home,
} from '@mui/icons-material';
import { Box, Button, Chip, Typography } from '@mui/material';
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

  const progress = await getEpisodeProgress(ep.id);
  const savedTime =
    progress && progress.status !== 'COMPLETED' ? progress.progressTime : 0;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0a0a0a', pb: 8 }}>
      {/* Breadcrumb */}
      <Box
        sx={{
          maxWidth: 1200,
          mx: 'auto',
          px: { xs: 2, md: 4 },
          pt: { xs: 1, md: 2 },
          pb: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          flexWrap: 'wrap',
        }}
      >
        <Link
          href="/anime"
          style={{
            color: 'rgba(255,255,255,0.4)',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Home sx={{ fontSize: 16, mr: 0.5 }} />
          <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
            Anime
          </Typography>
        </Link>
        <ChevronRight sx={{ fontSize: 14, color: 'rgba(255,255,255,0.2)' }} />
        <Link
          href={`/anime/${slug}`}
          style={{
            color: 'rgba(255,255,255,0.4)',
            textDecoration: 'none',
          }}
        >
          <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
            {series.titleFr || series.title}
          </Typography>
        </Link>
        <ChevronRight sx={{ fontSize: 14, color: 'rgba(255,255,255,0.2)' }} />
        <Typography
          variant="caption"
          sx={{
            color: 'rgba(255,255,255,0.7)',
            fontSize: '0.75rem',
            fontWeight: 600,
          }}
        >
          Épisode {ep.number}
        </Typography>
      </Box>

      {/* Player */}
      <Box
        sx={{
          maxWidth: 1200,
          mx: 'auto',
          px: { xs: 0, md: 4 },
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

      {/* Episode info + navigation */}
      <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, md: 4 }, mt: 3 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          {/* Left: info */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Chip
                label={`EP ${ep.number}`}
                size="small"
                sx={{
                  fontWeight: 800,
                  fontSize: '0.7rem',
                  bgcolor: '#dc2626',
                  color: 'white',
                  height: 24,
                }}
              />
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {series.titleFr || series.title}
              </Typography>
            </Box>
            <Typography
              variant="h5"
              fontWeight={800}
              sx={{ color: 'text.primary', mb: 1 }}
            >
              {ep.titleFr || ep.title}
            </Typography>
            {ep.synopsis && (
              <Typography
                variant="body2"
                sx={{
                  color: 'rgba(255,255,255,0.6)',
                  maxWidth: 700,
                  lineHeight: 1.6,
                }}
              >
                {ep.synopsis}
              </Typography>
            )}
          </Box>

          {/* Right: prev/next buttons */}
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              flexShrink: 0,
              alignSelf: { xs: 'stretch', md: 'center' },
            }}
          >
            {prev && (
              <Link
                href={`/anime/${slug}/${prev.number}`}
                style={{ textDecoration: 'none' }}
              >
                <Button
                  startIcon={<ArrowBack />}
                  size="small"
                  sx={{
                    borderRadius: 2,
                    px: 2,
                    color: 'text.secondary',
                    border: '1px solid rgba(255,255,255,0.1)',
                    textTransform: 'none',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.05)',
                      borderColor: 'rgba(255,255,255,0.2)',
                    },
                  }}
                >
                  EP {prev.number}
                </Button>
              </Link>
            )}
            {next && (
              <Link
                href={`/anime/${slug}/${next.number}`}
                style={{ textDecoration: 'none' }}
              >
                <Button
                  endIcon={<ArrowForward />}
                  variant="contained"
                  size="small"
                  sx={{
                    bgcolor: '#dc2626',
                    color: 'white',
                    borderRadius: 2,
                    px: 2,
                    textTransform: 'none',
                    fontWeight: 700,
                    '&:hover': { bgcolor: '#b91c1c' },
                  }}
                >
                  Épisode suivant
                </Button>
              </Link>
            )}
          </Box>
        </Box>

        {/* Episode strip — quick jump */}
        <Box
          sx={{
            mt: 4,
            pt: 3,
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <Typography
            variant="body2"
            fontWeight={700}
            sx={{ color: 'text.secondary', mb: 1.5, fontSize: '0.8rem' }}
          >
            Tous les épisodes · {series.titleFr || series.title}
          </Typography>
          <Box
            sx={{
              display: 'flex',
              gap: 0.5,
              flexWrap: 'wrap',
            }}
          >
            {Array.from({ length: series.episodeCount }, (_, i) => i + 1).map(
              (n) => (
                <Link
                  key={n}
                  href={`/anime/${slug}/${n}`}
                  style={{ textDecoration: 'none' }}
                >
                  <Chip
                    label={n}
                    size="small"
                    sx={{
                      minWidth: 36,
                      fontWeight: n === ep.number ? 800 : 500,
                      fontSize: '0.7rem',
                      bgcolor:
                        n === ep.number ? '#dc2626' : 'rgba(255,255,255,0.04)',
                      color:
                        n === ep.number ? 'white' : 'rgba(255,255,255,0.5)',
                      border:
                        n === ep.number
                          ? 'none'
                          : '1px solid rgba(255,255,255,0.06)',
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor:
                          n === ep.number ? '#dc2626' : 'rgba(255,255,255,0.1)',
                      },
                    }}
                  />
                </Link>
              ),
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
