'use client';

import { Box, Stack, Tab, Tabs, Typography } from '@mui/material';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface SatrTabsProps {
  mode: 'ranking' | 'career';
  totalBladers: number;
  totalMatches: number;
}

export function SatrTabs({ mode, totalBladers, totalMatches }: SatrTabsProps) {
  const searchParams = useSearchParams();

  const getHref = (view: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('view', view);
    params.delete('page');
    return `/tournaments/satr?${params.toString()}`;
  };

  return (
    <Box
      sx={{
        mb: 4,
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', md: 'center' },
        gap: 2,
        p: 1,
        borderRadius: 4,
        bgcolor: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      <Tabs
        value={mode}
        sx={{
          minHeight: 48,
          '& .MuiTabs-indicator': {
            height: 3,
            borderRadius: '3px 3px 0 0',
            bgcolor: '#fbbf24',
            boxShadow: '0 0 12px rgba(251, 191, 36, 0.5)',
          },
        }}
      >
        <Tab
          label="BBT Saison 2"
          value="ranking"
          component={Link}
          href={getHref('ranking')}
          sx={{
            fontWeight: 900,
            textTransform: 'none',
            fontSize: '1rem',
            color: 'rgba(255,255,255,0.5)',
            '&.Mui-selected': { color: '#fff' },
          }}
        />
        <Tab
          label="Historique des BBT"
          value="career"
          component={Link}
          href={getHref('career')}
          sx={{
            fontWeight: 900,
            textTransform: 'none',
            fontSize: '1rem',
            color: 'rgba(255,255,255,0.5)',
            '&.Mui-selected': { color: '#fff' },
          }}
        />
      </Tabs>

      <Stack direction="row" spacing={4} sx={{ px: 2 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', fontWeight: 800, letterSpacing: 1 }}
          >
            BLADERS
          </Typography>
          <Typography
            variant="h6"
            fontWeight="900"
            sx={{ color: '#fbbf24', lineHeight: 1.2 }}
          >
            {totalBladers}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', fontWeight: 800, letterSpacing: 1 }}
          >
            MATCHS
          </Typography>
          <Typography
            variant="h6"
            fontWeight="900"
            sx={{ color: '#fff', lineHeight: 1.2 }}
          >
            {totalMatches.toLocaleString()}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}
