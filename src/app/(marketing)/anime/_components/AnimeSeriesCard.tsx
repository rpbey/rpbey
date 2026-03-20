'use client';

import { Box, Typography } from '@mui/material';
import Image from 'next/image';
import Link from 'next/link';

const GENERATION_COLORS: Record<string, string> = {
  ORIGINAL: '#1565C0',
  METAL: '#E65100',
  BURST: '#C62828',
  X: '#7B1FA2',
};

interface AnimeSeriesCardProps {
  slug: string;
  title: string;
  titleFr?: string | null;
  posterUrl?: string | null;
  year: number;
  episodeCount: number;
  generation: string;
}

export function AnimeSeriesCard({
  slug,
  title,
  titleFr,
  posterUrl,
  year,
  episodeCount,
  generation,
}: AnimeSeriesCardProps) {
  const accentColor = GENERATION_COLORS[generation] || '#7B1FA2';

  return (
    <Link href={`/anime/${slug}`} style={{ textDecoration: 'none' }}>
      <Box
        sx={{
          position: 'relative',
          width: { xs: 130, sm: 150, md: 180 },
          flexShrink: 0,
          cursor: 'pointer',
          scrollSnapAlign: 'start',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          '&:hover': {
            transform: { md: 'scale(1.05)' },
            '& .card-overlay': { opacity: 1 },
            '& .card-image': {
              boxShadow: `0 8px 30px ${accentColor}40`,
            },
          },
        }}
      >
        {/* Poster */}
        <Box
          className="card-image"
          sx={{
            position: 'relative',
            aspectRatio: '2/3',
            borderRadius: 2,
            overflow: 'hidden',
            bgcolor: 'rgba(255,255,255,0.05)',
            transition: 'box-shadow 0.3s ease',
          }}
        >
          {posterUrl ? (
            <Image
              src={posterUrl}
              alt={titleFr || title}
              fill
              sizes="(max-width: 600px) 130px, (max-width: 900px) 150px, 180px"
              style={{ objectFit: 'cover' }}
            />
          ) : (
            <Box
              sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: accentColor,
                opacity: 0.3,
              }}
            >
              <Typography variant="h4" color="white">
                🎬
              </Typography>
            </Box>
          )}

          {/* Hover overlay */}
          <Box
            className="card-overlay"
            sx={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(to top, ${accentColor}CC 0%, transparent 60%)`,
              opacity: 0,
              transition: 'opacity 0.3s ease',
              display: { xs: 'none', md: 'flex' },
              flexDirection: 'column',
              justifyContent: 'flex-end',
              p: 1.5,
            }}
          >
            <Typography variant="caption" color="white" fontWeight={600}>
              {year} · {episodeCount} épisodes
            </Typography>
          </Box>
        </Box>

        {/* Title */}
        <Typography
          variant="body2"
          fontWeight={600}
          sx={{
            mt: 1,
            color: 'text.primary',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {titleFr || title}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {year}
        </Typography>
      </Box>
    </Link>
  );
}
