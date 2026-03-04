'use client';

import { Box, Grid, Paper, Typography, useTheme } from '@mui/material';
import type { SatrBlader } from '@prisma/client';
import { motion } from 'framer-motion';
import {
  DynamicBarChart as BarChart,
  DynamicPieChart as PieChart,
} from '@/components/ui/DynamicCharts';

interface SatrChartsProps {
  bladers: SatrBlader[];
}

export function SatrCharts({ bladers }: SatrChartsProps) {
  const _theme = useTheme();

  // 1. Data for Bar Chart: Top 7 Bladers by Wins
  const topWinsData = [...bladers]
    .sort((a, b) => b.totalWins - a.totalWins)
    .slice(0, 7)
    .map((b) => ({
      name: b.name,
      wins: b.totalWins,
    }));

  // 2. Data for Pie Chart: Winrate Distribution
  const winrateRanges = {
    '75%+': 0,
    '50-75%': 0,
    '25-50%': 0,
    '<25%': 0,
  };

  bladers.forEach((b) => {
    const total = b.totalWins + b.totalLosses;
    const rate = total > 0 ? (b.totalWins / total) * 100 : 0;
    if (rate >= 75) winrateRanges['75%+']++;
    else if (rate >= 50) winrateRanges['50-75%']++;
    else if (rate >= 25) winrateRanges['25-50%']++;
    else winrateRanges['<25%']++;
  });

  const pieData = Object.entries(winrateRanges).map(([label, value], id) => ({
    id,
    value,
    label,
    color:
      id === 0
        ? '#fbbf24'
        : id === 1
          ? '#4caf50'
          : id === 2
            ? '#ff9800'
            : '#f44336',
  }));

  return (
    <Box
      sx={{ mb: 6 }}
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Grid container spacing={3}>
        {/* Top Winners Bar Chart */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper
            sx={{
              p: 3,
              height: 350,
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: 4,
              overflow: 'hidden',
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 900,
                mb: 2,
                color: '#fbbf24',
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              Top 7 - Victoires de Carrière
            </Typography>
            <Box sx={{ width: '100%', height: 280 }}>
              <BarChart
                dataset={topWinsData}
                xAxis={[{ scaleType: 'band', dataKey: 'name' }]}
                series={[
                  { dataKey: 'wins', color: '#fbbf24', label: 'Victoires' },
                ]}
                slotProps={
                  {
                    legend: { hidden: true },
                  } as any
                }
                sx={{
                  '& .MuiChartsAxis-bottom .MuiChartsAxis-tickLabel': {
                    fill: 'rgba(255,255,255,0.5)',
                    fontWeight: 700,
                    fontSize: 10,
                  },
                  '& .MuiChartsAxis-left .MuiChartsAxis-tickLabel': {
                    fill: 'rgba(255,255,255,0.5)',
                  },
                }}
              />
            </Box>
          </Paper>
        </Grid>

        {/* Winrate Distribution Pie Chart */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper
            sx={{
              p: 3,
              height: 350,
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: 4,
              overflow: 'hidden',
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 900,
                mb: 2,
                color: '#fff',
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              Distribution des Winrates
            </Typography>
            <Box
              sx={{
                width: '100%',
                height: 280,
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <PieChart
                series={[
                  {
                    data: pieData,
                    innerRadius: 60,
                    outerRadius: 100,
                    paddingAngle: 5,
                    cornerRadius: 5,
                    highlightScope: { faded: 'global', highlighted: 'item' },
                    faded: {
                      innerRadius: 30,
                      additionalRadius: -30,
                      color: 'gray',
                    },
                  } as any,
                ]}
                slotProps={
                  {
                    legend: {
                      labelStyle: {
                        fill: 'rgba(255,255,255,0.7)',
                        fontWeight: 700,
                        fontSize: 12,
                      },
                    },
                  } as any
                }
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
