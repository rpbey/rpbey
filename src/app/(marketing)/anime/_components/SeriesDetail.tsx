'use client';

import { PlayArrow } from '@mui/icons-material';
import { Box, Button, Chip, Typography } from '@mui/material';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getSeriesProgress } from '@/server/actions/anime-progress';
import { EpisodeGrid } from './EpisodeGrid';

const GENERATION_COLORS: Record<string, string> = {
  ORIGINAL: '#1565C0',
  METAL: '#E65100',
  BURST: '#C62828',
  X: '#7B1FA2',
};

interface Episode {
  id: string;
  number: number;
  title: string;
  titleFr: string | null;
  thumbnailUrl: string | null;
  duration: number;
  sources: Array<{ id: string; type: string; url: string; language: string }>;
}

interface SeriesData {
  id: string;
  slug: string;
  title: string;
  titleFr: string | null;
  titleJp: string | null;
  generation: string;
  synopsis: string | null;
  posterUrl: string | null;
  bannerUrl: string | null;
  year: number;
  episodeCount: number;
  episodes: Episode[];
}

export function SeriesDetail({ series }: { series: SeriesData }) {
  const [progressMap, setProgressMap] = useState<
    Record<string, { progressTime: number; status: string }>
  >({});
  const accentColor = GENERATION_COLORS[series.generation] || '#7B1FA2';

  useEffect(() => {
    getSeriesProgress(series.id).then((data) => {
      setProgressMap(
        data as Record<string, { progressTime: number; status: string }>,
      );
    });
  }, [series.id]);

  return (
    <Box>
      {/* Hero banner */}
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: { xs: 250, md: 400 },
          overflow: 'hidden',
        }}
      >
        {series.bannerUrl || series.posterUrl ? (
          <Image
            src={series.bannerUrl || series.posterUrl || ''}
            alt={series.titleFr || series.title}
            fill
            priority
            sizes="100vw"
            style={{ objectFit: 'cover', objectPosition: 'center 20%' }}
          />
        ) : (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              background: `linear-gradient(135deg, ${accentColor}40, #0a0a0a)`,
            }}
          />
        )}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, #0a0a0a 0%, transparent 60%)',
          }}
        />
      </Box>

      {/* Series info */}
      <Box
        sx={{ px: { xs: 2, md: 4 }, mt: -8, position: 'relative', zIndex: 1 }}
      >
        <Box sx={{ display: 'flex', gap: 3, mb: 4 }}>
          {/* Poster */}
          {series.posterUrl && (
            <Box
              sx={{
                display: { xs: 'none', md: 'block' },
                width: 180,
                flexShrink: 0,
              }}
            >
              <Box
                sx={{
                  position: 'relative',
                  aspectRatio: '2/3',
                  borderRadius: 2,
                  overflow: 'hidden',
                  boxShadow: `0 8px 30px ${accentColor}40`,
                }}
              >
                <Image
                  src={series.posterUrl}
                  alt={series.titleFr || series.title}
                  fill
                  sizes="180px"
                  style={{ objectFit: 'cover' }}
                />
              </Box>
            </Box>
          )}

          <Box sx={{ flex: 1 }}>
            <Chip
              label={series.generation}
              size="small"
              sx={{
                bgcolor: accentColor,
                color: 'white',
                fontWeight: 700,
                mb: 1,
              }}
            />
            <Typography
              variant="h4"
              component="h1"
              fontWeight={900}
              sx={{
                color: 'white',
                mb: 1,
                fontSize: { xs: '1.5rem', md: '2.25rem' },
              }}
            >
              {series.titleFr || series.title}
            </Typography>
            {series.titleJp && (
              <Typography
                variant="body2"
                sx={{ color: 'rgba(255,255,255,0.5)', mb: 1 }}
              >
                {series.titleJp}
              </Typography>
            )}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Typography
                variant="body2"
                sx={{ color: 'rgba(255,255,255,0.6)' }}
              >
                {series.year} · {series.episodeCount} épisodes
              </Typography>
              {(() => {
                const langs = new Set<string>();
                for (const ep of series.episodes) {
                  for (const src of ep.sources) {
                    langs.add(src.language);
                  }
                }
                return [...langs].map((lang) => (
                  <Chip
                    key={lang}
                    label={lang}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.6rem',
                      fontWeight: 700,
                      bgcolor:
                        lang === 'VOSTFR'
                          ? 'rgba(220,38,38,0.3)'
                          : 'rgba(59,130,246,0.3)',
                      color: 'white',
                    }}
                  />
                ));
              })()}
            </Box>
            {series.synopsis && (
              <Typography
                variant="body1"
                sx={{ color: 'rgba(255,255,255,0.8)', maxWidth: 700, mb: 3 }}
              >
                {series.synopsis}
              </Typography>
            )}
            {series.episodes.length > 0 && (
              <Button
                component={Link}
                href={`/anime/${series.slug}/1`}
                variant="contained"
                size="large"
                startIcon={<PlayArrow />}
                sx={{
                  bgcolor: accentColor,
                  color: 'white',
                  fontWeight: 700,
                  borderRadius: 2,
                  px: 4,
                  '&:hover': { bgcolor: `${accentColor}DD` },
                }}
              >
                Regarder l&apos;épisode 1
              </Button>
            )}
          </Box>
        </Box>

        {/* Episode list */}
        <Typography
          variant="h5"
          fontWeight={800}
          sx={{ color: 'text.primary', mb: 3 }}
        >
          Épisodes ({series.episodes.length})
        </Typography>
        <EpisodeGrid
          seriesSlug={series.slug}
          episodes={series.episodes}
          progressMap={progressMap}
        />
      </Box>
    </Box>
  );
}
