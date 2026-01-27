'use client';

import MoreVertIcon from '@mui/icons-material/MoreVert';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
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
  return (
    <Card
      elevation={0}
      sx={{
        bgcolor: 'transparent',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        '&:hover': {
          '& .play-icon': {
            opacity: 1,
            transform: 'scale(1)',
          },
          '& img': {
            filter: 'brightness(0.8)',
          },
        },
      }}
    >
      <CardActionArea
        onClick={onClick}
        sx={{ borderRadius: { xs: 0, sm: 2 }, overflow: 'hidden' }}
      >
        <Box sx={{ position: 'relative', aspectRatio: '16/9' }}>
          <Image
            src={video.thumbnailUrl}
            alt={video.title}
            fill
            style={{ objectFit: 'cover', transition: 'filter 0.2s' }}
          />

          {/* Overlay gradient */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)`,
            }}
          />

          {/* Duration Badge */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              bgcolor: 'rgba(0,0,0,0.8)',
              color: 'white',
              borderRadius: 0.5,
              px: 0.6,
              py: 0.2,
              fontSize: '0.75rem',
              fontWeight: 'bold',
              zIndex: 1,
            }}
          >
            {video.duration}
          </Box>

          {/* Platform Badge */}
          <Chip
            label={type === 'twitch' ? 'Clip' : 'Vidéo'}
            size="small"
            color={type === 'twitch' ? 'secondary' : 'error'}
            sx={{
              position: 'absolute',
              top: 8,
              left: 8,
              height: 20,
              fontSize: '0.7rem',
              fontWeight: 'bold',
              zIndex: 1,
            }}
          />

          {/* Play Icon Overlay */}
          <Box
            className="play-icon"
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(0,0,0,0.2)',
              opacity: 0,
              transform: 'scale(0.8)',
              transition: 'all 0.2s',
              zIndex: 2,
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                bgcolor: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 3,
              }}
            >
              <PlayArrowIcon color="action" />
            </Box>
          </Box>
        </Box>

        <CardContent
          sx={{ p: { xs: 1.5, sm: 1.5 }, display: 'flex', gap: 1.5 }}
        >
          <Avatar
            src="/logo.png"
            alt="RPB Logo"
            sx={{
              width: 32,
              height: 32,
              bgcolor: 'transparent',
            }}
          />

          <Box sx={{ flex: 1 }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                lineHeight: 1.2,
                mb: 0.5,
                fontSize: { xs: '0.85rem', sm: '0.9rem' },
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                color: 'text.primary',
              }}
            >
              {video.title}
            </Typography>

            <Typography
              variant="caption"
              color="text.secondary"
              noWrap
              sx={{ display: 'block' }}
            >
              {type === 'twitch' ? 'Twitch' : 'YouTube'} •{' '}
              {new Intl.NumberFormat('fr-FR', { notation: 'compact' }).format(
                video.viewCount,
              )}{' '}
              vues
              <Box
                component="span"
                sx={{ display: { xs: 'none', lg: 'inline' } }}
              >
                •{' '}
                {formatDistanceToNow(new Date(video.publishedAt), {
                  addSuffix: true,
                  locale: fr,
                })}
              </Box>
            </Typography>
          </Box>

          <Box sx={{ mt: -0.5, mr: -1, color: 'text.secondary', p: 1 }}>
            <MoreVertIcon fontSize="small" />
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
