'use client';

import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { Box, Typography } from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import Image from 'next/image';
import type { VideoInfo } from '@/lib/twitch';

interface MediaCardProps {
  video: VideoInfo;
  type: 'twitch' | 'youtube';
  onClick: () => void;
}

export function MediaCard({ video, type, onClick }: MediaCardProps) {
  const views = new Intl.NumberFormat('fr-FR', { notation: 'compact' }).format(
    video.viewCount,
  );
  const ago = formatDistanceToNow(new Date(video.publishedAt), {
    addSuffix: true,
    locale: fr,
  });

  return (
    <Box
      onClick={onClick}
      sx={{
        cursor: 'pointer',
        borderRadius: 2,
        overflow: 'hidden',
        transition: 'transform 0.2s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          '& .thumb img': { filter: 'brightness(0.75)' },
          '& .play': { opacity: 1 },
        },
      }}
    >
      {/* Thumbnail */}
      <Box
        className="thumb"
        sx={{ position: 'relative', aspectRatio: '16/9', bgcolor: '#111' }}
      >
        <Image
          src={video.thumbnailUrl}
          alt={video.title}
          fill
          sizes="(max-width: 600px) 100vw, 300px"
          loading="lazy"
          style={{ objectFit: 'cover', transition: 'filter 0.2s' }}
        />
        {/* Duration */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 6,
            right: 6,
            bgcolor: 'rgba(0,0,0,0.85)',
            color: '#fff',
            borderRadius: 0.5,
            px: 0.5,
            py: 0.15,
            fontSize: '0.7rem',
            fontWeight: 800,
            lineHeight: 1.4,
          }}
        >
          {video.duration}
        </Box>
        {/* Platform */}
        <Box
          sx={{
            position: 'absolute',
            top: 6,
            left: 6,
            bgcolor: type === 'twitch' ? '#9146ff' : '#ff0000',
            color: '#fff',
            borderRadius: 0.5,
            px: 0.5,
            py: 0.1,
            fontSize: '0.6rem',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          {type === 'twitch' ? 'Clip' : 'YT'}
        </Box>
        {/* Play overlay */}
        <Box
          className="play"
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0,
            transition: 'opacity 0.2s',
          }}
        >
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              bgcolor: 'rgba(255,255,255,0.95)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <PlayArrowIcon sx={{ color: '#000', fontSize: 20 }} />
          </Box>
        </Box>
      </Box>

      {/* Info */}
      <Box sx={{ pt: 1, pb: 0.5 }}>
        <Typography
          fontWeight="700"
          sx={{
            fontSize: '0.8rem',
            lineHeight: 1.3,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {video.title}
        </Typography>
        <Typography
          variant="caption"
          sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}
        >
          {views} vues · {ago}
        </Typography>
      </Box>
    </Box>
  );
}
