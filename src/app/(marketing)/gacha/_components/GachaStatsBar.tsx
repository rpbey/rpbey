'use client';

import { Box, Typography } from '@mui/material';

const RARITY_CONFIG: Record<string, { label: string; color: string }> = {
  COMMON: { label: 'Commune', color: '#6b7280' },
  RARE: { label: 'Rare', color: '#3b82f6' },
  EPIC: { label: 'Épique', color: '#8b5cf6' },
  LEGENDARY: { label: 'Légendaire', color: '#eab308' },
  SECRET: { label: 'Secrète', color: '#dc2626' },
};

interface GachaStatsBarProps {
  stats: {
    totalCards: number;
    totalOwned: number;
    totalCollectors: number;
    byRarity: Record<string, number>;
    bySeries: Record<string, number>;
  };
}

export function GachaStatsBar({ stats }: GachaStatsBarProps) {
  const statItems = [
    { label: 'Cartes', value: stats.totalCards },
    { label: 'Obtenues', value: stats.totalOwned.toLocaleString('fr-FR') },
    { label: 'Joueurs', value: stats.totalCollectors },
    { label: 'Séries', value: Object.keys(stats.bySeries).length },
  ];

  return (
    <Box sx={{ px: { xs: 2, md: 6 }, mb: 4 }}>
      {/* Stats row — compact */}
      <Box
        sx={{
          display: 'flex',
          gap: { xs: 0, md: 3 },
          mb: 3,
          borderRadius: 2.5,
          bgcolor: 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(255,255,255,0.05)',
          overflow: 'hidden',
        }}
      >
        {statItems.map((item, i) => (
          <Box
            key={item.label}
            sx={{
              flex: 1,
              py: 2,
              px: { xs: 1.5, md: 3 },
              textAlign: 'center',
              borderRight:
                i < statItems.length - 1
                  ? '1px solid rgba(255,255,255,0.04)'
                  : 'none',
            }}
          >
            <Typography
              fontWeight={800}
              sx={{
                color: 'white',
                fontSize: { xs: '1.1rem', md: '1.4rem' },
                lineHeight: 1.2,
              }}
            >
              {item.value}
            </Typography>
            <Typography
              sx={{
                color: 'rgba(255,255,255,0.35)',
                fontSize: { xs: '0.6rem', md: '0.7rem' },
                fontWeight: 500,
              }}
            >
              {item.label}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Rarity distribution — inline */}
      <Box
        sx={{
          display: 'flex',
          height: 6,
          borderRadius: 3,
          overflow: 'hidden',
          mb: 1.5,
        }}
      >
        {['COMMON', 'RARE', 'EPIC', 'LEGENDARY', 'SECRET'].map((rarity) => {
          const count = stats.byRarity[rarity] || 0;
          const pct = (count / stats.totalCards) * 100;
          const config = RARITY_CONFIG[rarity];
          return (
            <Box
              key={rarity}
              sx={{
                width: `${pct}%`,
                bgcolor: config?.color || '#444',
              }}
            />
          );
        })}
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 1.5, md: 3 } }}>
        {['COMMON', 'RARE', 'EPIC', 'LEGENDARY', 'SECRET'].map((rarity) => {
          const count = stats.byRarity[rarity] || 0;
          const config = RARITY_CONFIG[rarity];
          return (
            <Box
              key={rarity}
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: config?.color,
                }}
              />
              <Typography
                sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.68rem' }}
              >
                {config?.label} ({count})
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
