'use client';

import { Box, Paper, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

interface StatsOverviewProps {
  bladeCount: number;
  ratchetCount: number;
  bitCount: number;
  totalCombinations: number;
}

const stats = [
  { key: 'blades', label: 'Blades', color: '#ef4444', icon: '⚔️' },
  { key: 'ratchets', label: 'Ratchets', color: '#f59e0b', icon: '⚙️' },
  { key: 'bits', label: 'Bits', color: '#3b82f6', icon: '🔩' },
  { key: 'combos', label: 'Combinaisons', color: '#a855f7', icon: '♾️' },
];

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K+`;
  return String(n);
}

export function StatsOverview({
  bladeCount,
  ratchetCount,
  bitCount,
  totalCombinations,
}: StatsOverviewProps) {
  const values: Record<string, number> = {
    blades: bladeCount,
    ratchets: ratchetCount,
    bits: bitCount,
    combos: totalCombinations,
  };

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: 'repeat(2, 1fr)',
          sm: 'repeat(4, 1fr)',
        },
        gap: 2,
      }}
    >
      {stats.map((stat) => (
        <Paper
          key={stat.key}
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: 4,
            border: '1px solid',
            borderColor: alpha(stat.color, 0.15),
            bgcolor: alpha(stat.color, 0.03),
            textAlign: 'center',
            transition: 'all 0.3s',
            '&:hover': {
              borderColor: alpha(stat.color, 0.4),
              transform: 'translateY(-2px)',
              boxShadow: `0 8px 24px ${alpha(stat.color, 0.15)}`,
            },
          }}
        >
          <Typography sx={{ fontSize: '1.5rem', mb: 0.5 }}>
            {stat.icon}
          </Typography>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 900,
              color: stat.color,
              lineHeight: 1,
              fontSize: { xs: '1.5rem', md: '2rem' },
            }}
          >
            {formatNumber(values[stat.key] ?? 0)}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: 1,
              mt: 0.5,
              display: 'block',
            }}
          >
            {stat.label}
          </Typography>
        </Paper>
      ))}
    </Box>
  );
}
