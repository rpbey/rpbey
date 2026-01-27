'use client';

import {
  Box,
  Chip,
  Container,
  Grid,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { getBeyTubeFeatured } from '@/lib/beytube';
import { YouTubeMobileCard } from './YouTubeMobileCard';

const FILTERS = [
  'Tous',
  'Compétition',
  'Deck Building',
  'Vlogs',
  'Unboxing',
  'Tutos',
];

export function BeyTubeSection() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('Tous');

  useEffect(() => {
    getBeyTubeFeatured()
      .then(setVideos)
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box
      sx={{
        py: { xs: 4, md: 8 },
        bgcolor: 'background.default',
        position: 'relative',
      }}
    >
      <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3 } }}>
        <Box sx={{ mb: 2 }}>
          <Typography
            variant="h3"
            fontWeight="900"
            sx={{ mb: 1, textTransform: 'uppercase', letterSpacing: '-0.05em' }}
          >
            BeyTube{' '}
            <Box component="span" sx={{ color: '#dc2626' }}>
              FR
            </Box>
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Le top de la scène francophone sélectionné par la RPB.
          </Typography>
        </Box>

        {/* Filter Carousel */}
        <Stack
          direction="row"
          spacing={1.5}
          sx={{
            py: 2,
            mb: 2,
            overflowX: 'auto',
            '&::-webkit-scrollbar': { display: 'none' },
            scrollbarWidth: 'none',
            mx: { xs: -2, sm: 0 },
            px: { xs: 2, sm: 0 },
          }}
        >
          {FILTERS.map((filter) => (
            <Chip
              key={filter}
              label={filter}
              onClick={() => setActiveFilter(filter)}
              sx={{
                bgcolor:
                  activeFilter === filter ? 'text.primary' : 'action.hover',
                color:
                  activeFilter === filter ? 'background.paper' : 'text.primary',
                fontWeight: 600,
                borderRadius: 2,
                '&:hover': {
                  bgcolor:
                    activeFilter === filter
                      ? 'text.primary'
                      : 'action.selected',
                },
              }}
            />
          ))}
        </Stack>

        <Grid container spacing={{ xs: 2, sm: 3 }}>
          {loading
            ? Array.from(new Array(4)).map((_, i) => (
                <Grid
                  key={i}
                  size={{ xs: 12, sm: 6, md: 4, lg: 3 }}
                  sx={{
                    display: { xs: i < 2 ? 'block' : 'none', sm: 'block' },
                  }}
                >
                  <Skeleton
                    variant="rectangular"
                    sx={{ aspectRatio: '16/9', borderRadius: 3, mb: 2 }}
                  />
                  <Box>
                    <Skeleton width="90%" height={30} />
                    <Skeleton width="60%" />
                  </Box>
                </Grid>
              ))
            : videos.map((video) => (
                <Grid key={video.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                  <YouTubeMobileCard
                    video={{
                      title: video.title,
                      thumbnail: video.thumbnail,
                      duration: video.duration || '0:00',
                      channelName: video.channelName,
                      views: video.views,
                      ago: video.ago || 'Populaire',
                      url: video.url,
                    }}
                  />
                </Grid>
              ))}
        </Grid>
      </Container>
    </Box>
  );
}
