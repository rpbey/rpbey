'use client';

import { AutoAwesome, Groups, Style, TrendingUp } from '@mui/icons-material';
import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';

const RARITY_CONFIG: Record<
  string,
  { label: string; color: string; emoji: string }
> = {
  COMMON: { label: 'Commune', color: '#9ca3af', emoji: '⚪' },
  RARE: { label: 'Rare', color: '#3b82f6', emoji: '🔵' },
  EPIC: { label: 'Épique', color: '#8b5cf6', emoji: '🟣' },
  LEGENDARY: { label: 'Légendaire', color: '#fbbf24', emoji: '🟡' },
  SECRET: { label: 'Secrète', color: '#ef4444', emoji: '🔴' },
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
    {
      icon: <Style sx={{ fontSize: 28, color: '#8b5cf6' }} />,
      label: 'Cartes uniques',
      value: stats.totalCards,
      color: '#8b5cf6',
    },
    {
      icon: <TrendingUp sx={{ fontSize: 28, color: '#22c55e' }} />,
      label: 'Cartes obtenues',
      value: stats.totalOwned.toLocaleString('fr-FR'),
      color: '#22c55e',
    },
    {
      icon: <Groups sx={{ fontSize: 28, color: '#3b82f6' }} />,
      label: 'Collectionneurs',
      value: stats.totalCollectors,
      color: '#3b82f6',
    },
    {
      icon: <AutoAwesome sx={{ fontSize: 28, color: '#fbbf24' }} />,
      label: 'Séries',
      value: Object.keys(stats.bySeries).length,
      color: '#fbbf24',
    },
  ];

  return (
    <Box sx={{ px: { xs: 2, md: 6 }, mb: 5 }}>
      {/* Stats cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
          gap: 2,
          mb: 4,
        }}
      >
        {statItems.map((item, i) => (
          <Box
            key={item.label}
            component={motion.div}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            sx={{
              p: 2.5,
              borderRadius: 3,
              bgcolor: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.05)',
                borderColor: `${item.color}40`,
              },
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                bgcolor: `${item.color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {item.icon}
            </Box>
            <Box>
              <Typography
                variant="h5"
                fontWeight={800}
                sx={{ color: 'white', lineHeight: 1.2 }}
              >
                {item.value}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem' }}
              >
                {item.label}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Rarity distribution bar */}
      <Box
        sx={{
          p: 2.5,
          borderRadius: 3,
          bgcolor: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <Typography
          variant="body2"
          fontWeight={700}
          sx={{ color: 'rgba(255,255,255,0.7)', mb: 2 }}
        >
          Distribution par rareté
        </Typography>
        <Box
          sx={{
            display: 'flex',
            height: 8,
            borderRadius: 4,
            overflow: 'hidden',
            mb: 2,
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
                  bgcolor: config?.color || '#666',
                  transition: 'width 0.5s ease',
                }}
              />
            );
          })}
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 1, md: 3 } }}>
          {['COMMON', 'RARE', 'EPIC', 'LEGENDARY', 'SECRET'].map((rarity) => {
            const count = stats.byRarity[rarity] || 0;
            const config = RARITY_CONFIG[rarity];
            return (
              <Box
                key={rarity}
                sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}
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
                  variant="caption"
                  sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem' }}
                >
                  {config?.emoji} {config?.label} ({count})
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}
