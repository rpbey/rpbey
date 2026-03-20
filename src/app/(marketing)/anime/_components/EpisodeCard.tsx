'use client';

import { PlayArrow } from '@mui/icons-material';
import { Box, Typography } from '@mui/material';
import Image from 'next/image';
import Link from 'next/link';

interface EpisodeCardProps {
  seriesSlug: string;
  number: number;
  title: string;
  titleFr?: string | null;
  thumbnailUrl?: string | null;
  duration: number;
  progress?: number; // 0-1
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function EpisodeCard({
  seriesSlug,
  number,
  title,
  titleFr,
  thumbnailUrl,
  duration,
  progress,
}: EpisodeCardProps) {
  return (
    <Link
      href={`/anime/${seriesSlug}/${number}`}
      style={{ textDecoration: 'none' }}
    >
      <Box
        sx={{
          position: 'relative',
          cursor: 'pointer',
          transition: 'transform 0.2s ease',
          '&:hover': {
            transform: { md: 'scale(1.03)' },
            '& .play-overlay': { opacity: 1 },
          },
        }}
      >
        {/* Thumbnail */}
        <Box
          sx={{
            position: 'relative',
            aspectRatio: '16/9',
            borderRadius: 2,
            overflow: 'hidden',
            bgcolor: 'rgba(255,255,255,0.05)',
          }}
        >
          {thumbnailUrl ? (
            <Image
              src={thumbnailUrl}
              alt={titleFr || title}
              fill
              sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 25vw"
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
                background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
              }}
            >
              <Typography variant="h5" sx={{ opacity: 0.3 }}>
                EP {number}
              </Typography>
            </Box>
          )}

          {/* Episode number badge */}
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              left: 8,
              px: 1,
              py: 0.25,
              borderRadius: 1,
              bgcolor: 'rgba(0,0,0,0.7)',
              color: 'white',
              fontSize: '0.7rem',
              fontWeight: 700,
            }}
          >
            EP {number}
          </Box>

          {/* Duration badge */}
          {duration > 0 && (
            <Box
              sx={{
                position: 'absolute',
                bottom: 8,
                right: 8,
                px: 1,
                py: 0.25,
                borderRadius: 1,
                bgcolor: 'rgba(0,0,0,0.7)',
                color: 'white',
                fontSize: '0.7rem',
                fontWeight: 600,
              }}
            >
              {formatDuration(duration)}
            </Box>
          )}

          {/* Play overlay */}
          <Box
            className="play-overlay"
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(0,0,0,0.4)',
              opacity: 0,
              transition: 'opacity 0.2s',
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                bgcolor: 'rgba(255,255,255,0.9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <PlayArrow sx={{ color: '#0a0a0a', fontSize: 28 }} />
            </Box>
          </Box>

          {/* Progress bar */}
          {progress != null && progress > 0 && (
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 3,
                bgcolor: 'rgba(255,255,255,0.2)',
              }}
            >
              <Box
                sx={{
                  height: '100%',
                  width: `${Math.min(progress * 100, 100)}%`,
                  bgcolor: '#dc2626',
                  borderRadius: '0 1px 0 0',
                }}
              />
            </Box>
          )}
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
      </Box>
    </Link>
  );
}
