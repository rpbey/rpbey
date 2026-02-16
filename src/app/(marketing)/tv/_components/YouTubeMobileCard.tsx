'use client';

import { MoreVert as MoreVertIcon } from '@mui/icons-material';
import { Avatar, Box, CardMedia, IconButton, Typography } from '@mui/material';

interface YouTubeMobileCardProps {
  video: {
    title: string;
    thumbnail: string;
    duration: string;
    channelName: string;
    channelAvatar?: string;
    views: number | string;
    ago: string;
    url: string;
  };
}

export function YouTubeMobileCard({ video }: YouTubeMobileCardProps) {
  return (
    <Box
      component="a"
      href={video.url}
      target="_blank"
      sx={{
        mb: 0,
        cursor: 'pointer',
        display: 'block',
        textDecoration: 'none',
        color: 'inherit',
        '&:hover': {
          '& img': {
            filter: 'brightness(0.9)',
          },
        },
      }}
    >
      {/* 1. Miniature (Thumbnail) */}
      <Box sx={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
        <CardMedia
          component="img"
          image={video.thumbnail}
          alt={video.title}
          sx={{
            width: '100%',
            aspectRatio: '16/9',
            objectFit: 'cover',
            borderRadius: 3, // Consistent rounded corners
            transition: 'filter 0.2s',
          }}
        />

        {/* Overlay Durée */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            bgcolor: 'rgba(0,0,0,0.8)',
            color: 'white',
            borderRadius: 1,
            px: 0.6,
            py: 0.2,
            typography: 'caption',
            fontWeight: 'bold',
            fontSize: '0.75rem',
            zIndex: 1,
          }}
        >
          {video.duration}
        </Box>
      </Box>

      {/* 2. Méta-données (Avatar + Titre + Infos) */}
      <Box sx={{ display: 'flex', mt: 1.5, px: 0, gap: 1.5 }}>
        {/* Avatar Chaîne */}
        <Avatar
          src={video.channelAvatar}
          sx={{
            width: 36,
            height: 36,
            bgcolor: 'grey.300',
            fontSize: '0.9rem',
            fontWeight: 'bold',
          }}
        >
          {video.channelName.charAt(0)}
        </Avatar>

        {/* Contenu texte */}
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="body1"
            sx={{
              fontWeight: 500,
              lineHeight: 1.2,
              display: '-webkit-box',
              overflow: 'hidden',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 2, // Limite à 2 lignes
              mb: 0.5,
              fontSize: '1rem',
              color: 'text.primary',
            }}
          >
            {video.title}
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              fontSize: '0.85rem',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 0.5,
            }}
          >
            {video.channelName} •{' '}
            {typeof video.views === 'number'
              ? new Intl.NumberFormat('fr-FR', { notation: 'compact' }).format(
                  video.views,
                )
              : video.views}{' '}
            vues • {video.ago}
          </Typography>
        </Box>

        {/* Menu vertical (MoreVert) */}
        <IconButton
          size="small"
          sx={{
            alignSelf: 'flex-start',
            mt: -0.5,
            color: 'text.secondary',
          }}
          onClick={(e) => {
            e.preventDefault();
            // Menu action here if needed
          }}
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
}
