'use client';

import { CheckCircle, PlayArrow } from '@mui/icons-material';
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

// Generate a deterministic gradient based on episode number
function episodeGradient(num: number): string {
  const hue = (num * 37 + 200) % 360;
  return `linear-gradient(135deg, hsl(${hue}, 30%, 12%) 0%, hsl(${(hue + 40) % 360}, 25%, 8%) 100%)`;
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
  const isCompleted = progress != null && progress >= 0.9;

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
            '& .ep-thumb': {
              borderColor: 'rgba(255,255,255,0.15)',
            },
          },
        }}
      >
        {/* Thumbnail */}
        <Box
          className="ep-thumb"
          sx={{
            position: 'relative',
            aspectRatio: '16/9',
            borderRadius: 2,
            overflow: 'hidden',
            bgcolor: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            transition: 'border-color 0.2s',
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
                background: episodeGradient(number),
                position: 'relative',
              }}
            >
              <Typography
                sx={{
                  fontSize: { xs: '2rem', md: '2.5rem' },
                  fontWeight: 900,
                  color: 'rgba(255,255,255,0.06)',
                  letterSpacing: '-0.02em',
                  userSelect: 'none',
                }}
              >
                {number}
              </Typography>
            </Box>
          )}

          {/* Episode number badge */}
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              left: 8,
              px: 0.8,
              py: 0.3,
              borderRadius: 1,
              bgcolor: 'rgba(0,0,0,0.75)',
              backdropFilter: 'blur(4px)',
              color: 'white',
              fontSize: '0.65rem',
              fontWeight: 700,
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            EP {number}
          </Box>

          {/* Completed badge */}
          {isCompleted && (
            <Box
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
              }}
            >
              <CheckCircle
                sx={{
                  fontSize: 20,
                  color: '#22c55e',
                  filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.5))',
                }}
              />
            </Box>
          )}

          {/* Duration badge */}
          {duration > 0 && (
            <Box
              sx={{
                position: 'absolute',
                bottom: 8,
                right: 8,
                px: 0.8,
                py: 0.3,
                borderRadius: 1,
                bgcolor: 'rgba(0,0,0,0.75)',
                backdropFilter: 'blur(4px)',
                color: 'rgba(255,255,255,0.8)',
                fontSize: '0.65rem',
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
              bgcolor: 'rgba(0,0,0,0.45)',
              opacity: 0,
              transition: 'opacity 0.2s',
            }}
          >
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                bgcolor: 'rgba(255,255,255,0.95)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
              }}
            >
              <PlayArrow sx={{ color: '#0a0a0a', fontSize: 24 }} />
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
                bgcolor: 'rgba(255,255,255,0.15)',
              }}
            >
              <Box
                sx={{
                  height: '100%',
                  width: `${Math.min(progress * 100, 100)}%`,
                  bgcolor: isCompleted ? '#22c55e' : '#dc2626',
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
            mt: 0.8,
            color: isCompleted ? 'rgba(255,255,255,0.5)' : 'text.primary',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontSize: '0.8rem',
          }}
        >
          {titleFr || title}
        </Typography>
      </Box>
    </Link>
  );
}
