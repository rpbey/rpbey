'use client';

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
import type { TikTokVideo } from '@/lib/tiktok';

interface TikTokVideoCardProps {
  video: TikTokVideo;
}

export function TikTokVideoCard({ video }: TikTokVideoCardProps) {
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
        href={video.url}
        target="_blank"
        rel="noopener noreferrer"
        sx={{ borderRadius: { xs: 0, sm: 2 }, overflow: 'hidden' }}
      >
        <Box sx={{ position: 'relative', aspectRatio: '9/16' }}>
          <Image
            src={video.cover}
            alt={video.desc}
            fill
            style={{ objectFit: 'cover', transition: 'filter 0.2s' }}
            unoptimized // TikTok images might be external
          />

          {/* Overlay gradient */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 40%)`,
            }}
          />

          {/* Stats Badge */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 8,
              left: 8,
              color: 'white',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              zIndex: 1,
              display: 'flex',
              gap: 1,
            }}
          >
            <Typography
              variant="caption"
              fontWeight="bold"
              sx={{ color: 'white' }}
            >
              ▶{' '}
              {new Intl.NumberFormat('fr-FR', { notation: 'compact' }).format(
                video.stats.playCount,
              )}
            </Typography>
            <Typography
              variant="caption"
              fontWeight="bold"
              sx={{ color: 'white' }}
            >
              ♥{' '}
              {new Intl.NumberFormat('fr-FR', { notation: 'compact' }).format(
                video.stats.diggCount,
              )}
            </Typography>
          </Box>

          {/* Platform Badge */}
          <Chip
            label="TikTok"
            size="small"
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              height: 20,
              fontSize: '0.7rem',
              fontWeight: 'bold',
              zIndex: 1,
              bgcolor: 'black',
              color: 'white',
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
            src={video.author.avatarThumb}
            alt={video.author.nickname}
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
              {video.desc || 'Vidéo TikTok'}
            </Typography>

            <Typography
              variant="caption"
              color="text.secondary"
              noWrap
              sx={{ display: 'block' }}
            >
              @{video.author.username} •{' '}
              {formatDistanceToNow(new Date(video.createTime * 1000), {
                addSuffix: true,
                locale: fr,
              })}
            </Typography>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
