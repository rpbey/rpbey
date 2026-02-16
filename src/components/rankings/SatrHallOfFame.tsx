'use client';

import { Box, Paper, Stack, Typography } from '@mui/material';
import { useRouter, useSearchParams } from 'next/navigation';
import { TrophyIcon } from '@/components/ui/Icons';

interface Champion {
  tournament: string;
  winner: string;
  date: string;
}

interface SatrHallOfFameProps {
  champions: Champion[];
}

export function SatrHallOfFame({ champions }: SatrHallOfFameProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChampionClick = (name: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('search', name);
          params.set('view', 'career'); // Force career view for historical champions
          params.set('page', '1');
          router.push(`/tournaments/satr?${params.toString()}`);
      };
  return (
    <Box sx={{ mb: 4 }}>
      <Typography
        variant="overline"
        color="text.secondary"
        sx={{ fontWeight: 'bold', mb: 1, display: 'block', px: 1 }}
      >
        Champions Historiques
      </Typography>
      <Stack
        direction="row"
        spacing={2}
        sx={{
          overflowX: 'auto',
          pb: 2,
          px: 1,
          '&::-webkit-scrollbar': { height: '4px' },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: 'rgba(251, 191, 36, 0.2)',
            borderRadius: '4px',
          },
        }}
      >
        {champions.map((c, i) => (
          <Paper
            key={i}
            elevation={0}
            onClick={() => handleChampionClick(c.winner)}
            sx={{
              p: 1.5,
              minWidth: 160,
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              background:
                'linear-gradient(135deg, rgba(251, 191, 36, 0.05) 0%, rgba(0,0,0,0) 100%)',
              textAlign: 'center',
              flexShrink: 0,
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                borderColor: '#fbbf24',
                transform: 'translateY(-4px)',
                boxShadow: '0 4px 12px rgba(251, 191, 36, 0.1)',
              },
            }}
          >
            <Box sx={{ color: '#fbbf24', mb: 1 }}><TrophyIcon fontSize={24} /></Box>
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                color: 'text.secondary',
                fontWeight: 'bold',
              }}
            >
              {c.date}
            </Typography>
            <Typography variant="body2" fontWeight="900" sx={{ mt: 0.5 }}>
              {c.winner}
            </Typography>
          </Paper>
        ))}
      </Stack>
    </Box>
  );
}
