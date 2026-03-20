'use client';

import { InfoOutlined, PlayArrow } from '@mui/icons-material';
import { Box, Button, Typography } from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

interface FeaturedSeries {
  id: string;
  slug: string;
  title: string;
  titleFr: string | null;
  synopsis: string | null;
  bannerUrl: string | null;
  posterUrl: string | null;
  year: number;
  episodeCount: number;
  generation: string;
}

const GENERATION_COLORS: Record<string, string> = {
  ORIGINAL: '#1565C0',
  METAL: '#E65100',
  BURST: '#C62828',
  X: '#7B1FA2',
};

export function AnimeHero({ featured }: { featured: FeaturedSeries[] }) {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % featured.length);
  }, [featured.length]);

  useEffect(() => {
    if (featured.length <= 1) return;
    const interval = setInterval(next, 8000);
    return () => clearInterval(interval);
  }, [featured.length, next]);

  if (featured.length === 0) return null;

  // biome-ignore lint/style/noNonNullAssertion: guarded by length check above
  const series = featured[current]!;
  const imageUrl = series.bannerUrl || series.posterUrl;
  const accentColor = GENERATION_COLORS[series.generation] || '#7B1FA2';

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: { xs: 400, sm: 500, md: 600 },
        overflow: 'hidden',
        mb: 4,
      }}
    >
      {/* Background image */}
      <AnimatePresence mode="wait">
        <Box
          key={series.id}
          component={motion.div}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          sx={{ position: 'absolute', inset: 0 }}
        >
          {imageUrl && (
            <Image
              src={imageUrl}
              alt={series.titleFr || series.title}
              fill
              priority
              sizes="100vw"
              style={{ objectFit: 'cover', objectPosition: 'center 20%' }}
            />
          )}
        </Box>
      </AnimatePresence>

      {/* Gradient overlays */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(to top, #0a0a0a 0%, transparent 60%)`,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(to right, #0a0a0a 0%, transparent 50%)`,
        }}
      />

      {/* Content */}
      <AnimatePresence mode="wait">
        <Box
          key={`content-${series.id}`}
          component={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          sx={{
            position: 'absolute',
            bottom: { xs: 40, md: 60 },
            left: { xs: 16, md: 48 },
            right: { xs: 16, md: '50%' },
            zIndex: 2,
          }}
        >
          {/* Generation badge */}
          <Box
            sx={{
              display: 'inline-block',
              px: 1.5,
              py: 0.5,
              mb: 2,
              borderRadius: 1,
              bgcolor: accentColor,
              color: 'white',
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.05em',
            }}
          >
            {series.generation} · {series.year}
          </Box>

          <Typography
            variant="h3"
            component="h1"
            fontWeight={900}
            sx={{
              color: 'white',
              mb: 1,
              fontSize: { xs: '1.75rem', sm: '2.25rem', md: '3rem' },
              lineHeight: 1.1,
              textShadow: '0 2px 12px rgba(0,0,0,0.5)',
            }}
          >
            {series.titleFr || series.title}
          </Typography>

          {series.synopsis && (
            <Typography
              variant="body1"
              sx={{
                color: 'rgba(255,255,255,0.8)',
                mb: 3,
                maxWidth: 500,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {series.synopsis}
            </Typography>
          )}

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              component={Link}
              href={`/anime/${series.slug}`}
              variant="contained"
              size="large"
              startIcon={<PlayArrow />}
              sx={{
                bgcolor: 'white',
                color: '#0a0a0a',
                fontWeight: 700,
                borderRadius: 2,
                px: 3,
                '&:hover': { bgcolor: 'rgba(255,255,255,0.85)' },
              }}
            >
              Regarder
            </Button>
            <Button
              component={Link}
              href={`/anime/${series.slug}`}
              variant="outlined"
              size="large"
              startIcon={<InfoOutlined />}
              sx={{
                borderColor: 'rgba(255,255,255,0.5)',
                color: 'white',
                fontWeight: 700,
                borderRadius: 2,
                px: 3,
                '&:hover': {
                  borderColor: 'white',
                  bgcolor: 'rgba(255,255,255,0.1)',
                },
              }}
            >
              Plus d&apos;infos
            </Button>
          </Box>
        </Box>
      </AnimatePresence>

      {/* Dots indicator */}
      {featured.length > 1 && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 16,
            right: { xs: 16, md: 48 },
            display: 'flex',
            gap: 1,
            zIndex: 2,
          }}
        >
          {featured.map((item, i) => (
            <Box
              key={item.id}
              onClick={() => setCurrent(i)}
              sx={{
                width: i === current ? 24 : 8,
                height: 8,
                borderRadius: 4,
                bgcolor: i === current ? 'white' : 'rgba(255,255,255,0.4)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
