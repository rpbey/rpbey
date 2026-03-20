'use client';

import { Box } from '@mui/material';
import type { ReactNode } from 'react';
import { useSession } from '@/lib/auth-client';
import { AnimeHero } from './AnimeHero';
import { AnimeSearch } from './AnimeSearch';
import { ContinueWatching } from './ContinueWatching';

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

interface AnimeLandingProps {
  featured: FeaturedSeries[];
  children: ReactNode;
}

export function AnimeLanding({ featured, children }: AnimeLandingProps) {
  const { data: session } = useSession();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#0a0a0a',
        pb: 8,
      }}
    >
      <AnimeHero featured={featured} />
      <AnimeSearch />
      {session?.user && <ContinueWatching />}
      {children}
    </Box>
  );
}
