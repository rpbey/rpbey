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

  // Conserver les autres paramètres (comme search) lors du changement d'onglet
  const getHref = (view: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('view', view);
    params.delete('page'); // Reset la page lors du changement de vue
    return `/tournaments/satr?${params.toString()}`;
  };

  return (
    <Box
      sx={{
        mb: 2,
        borderBottom: 1,
        borderColor: 'divider',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <Tabs value={mode}>
        <Tab
          label="BBT Saison 2"
          value="ranking"
          component={Link}
          href={getHref('ranking')}
          sx={{ fontWeight: 'bold', textTransform: 'none' }}
        />
        <Tab
          label="Statistiques de Carrière"
          value="career"
          component={Link}
          href={getHref('career')}
          sx={{ fontWeight: 'bold', textTransform: 'none' }}
        />
      </Tabs>

      {mode === 'career' && (
        <Stack
          direction="row"
          spacing={3}
          sx={{ mr: 2, display: { xs: 'none', sm: 'flex' } }}
        >
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', lineHeight: 1 }}
            >
              JOUEURS
            </Typography>
            <Typography variant="body2" fontWeight="900">
              {totalBladers}
            </Typography>
          </Box>
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', lineHeight: 1 }}
            >
              MATCHS
            </Typography>
            <Typography variant="body2" fontWeight="900">
              {totalMatches.toLocaleString()}
            </Typography>
          </Box>
        </Stack>
      )}
    </Box>
  );
}
