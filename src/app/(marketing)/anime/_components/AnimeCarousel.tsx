'use client';

import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import { Box, IconButton, Typography } from '@mui/material';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { AnimeSeriesCard } from './AnimeSeriesCard';

const GENERATION_LABELS: Record<string, string> = {
  ORIGINAL: 'Beyblade Original (2001-2003)',
  METAL: 'Metal Fight (2009-2012)',
  BURST: 'Beyblade Burst (2016-2021)',
  X: 'Beyblade X (2023+)',
};

const GENERATION_COLORS: Record<string, string> = {
  ORIGINAL: '#1565C0',
  METAL: '#E65100',
  BURST: '#C62828',
  X: '#7B1FA2',
};

interface Series {
  id: string;
  slug: string;
  title: string;
  titleFr: string | null;
  posterUrl: string | null;
  year: number;
  episodeCount: number;
  generation: string;
}

interface AnimeCarouselProps {
  generation: string;
  series: Series[];
}

export function AnimeCarousel({ generation, series }: AnimeCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = scrollRef.current.clientWidth * 0.7;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const accentColor = GENERATION_COLORS[generation] || '#7B1FA2';
  const label = GENERATION_LABELS[generation] || generation;

  return (
    <Box sx={{ mb: 5 }}>
      {/* Section header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: { xs: 2, md: 4 },
          mb: 2,
        }}
      >
        <Typography
          variant="h6"
          fontWeight={800}
          sx={{
            color: 'text.primary',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            '&::before': {
              content: '""',
              width: 4,
              height: 24,
              bgcolor: accentColor,
              borderRadius: 1,
              display: 'inline-block',
            },
          }}
        >
          {label}
        </Typography>
        <Typography
          component={Link}
          href={`/anime?gen=${generation}`}
          variant="body2"
          sx={{
            color: accentColor,
            fontWeight: 600,
            textDecoration: 'none',
            '&:hover': { textDecoration: 'underline' },
          }}
        >
          Voir tout →
        </Typography>
      </Box>

      {/* Carousel */}
      <Box sx={{ position: 'relative', '&:hover .scroll-btn': { opacity: 1 } }}>
        {/* Left arrow */}
        {canScrollLeft && (
          <IconButton
            className="scroll-btn"
            onClick={() => scroll('left')}
            sx={{
              position: 'absolute',
              left: 8,
              top: '40%',
              transform: 'translateY(-50%)',
              zIndex: 10,
              bgcolor: 'rgba(0,0,0,0.7)',
              color: 'white',
              opacity: { xs: 1, md: 0 },
              transition: 'opacity 0.2s',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.9)' },
            }}
          >
            <ChevronLeft />
          </IconButton>
        )}

        {/* Right arrow */}
        {canScrollRight && (
          <IconButton
            className="scroll-btn"
            onClick={() => scroll('right')}
            sx={{
              position: 'absolute',
              right: 8,
              top: '40%',
              transform: 'translateY(-50%)',
              zIndex: 10,
              bgcolor: 'rgba(0,0,0,0.7)',
              color: 'white',
              opacity: { xs: 1, md: 0 },
              transition: 'opacity 0.2s',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.9)' },
            }}
          >
            <ChevronRight />
          </IconButton>
        )}

        <Box
          ref={scrollRef}
          onScroll={handleScroll}
          sx={{
            display: 'flex',
            gap: 2,
            px: { xs: 2, md: 4 },
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          {series.map((s) => (
            <AnimeSeriesCard key={s.id} {...s} />
          ))}
        </Box>
      </Box>
    </Box>
  );
}
