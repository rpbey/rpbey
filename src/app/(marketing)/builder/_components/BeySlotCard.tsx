'use client';

import { Close } from '@mui/icons-material';
import {
  Avatar,
  Box,
  Chip,
  IconButton,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import type { Part } from '@prisma/client';
import { DynamicRadarChart as RadarChart } from '@/components/ui/DynamicCharts';
import { useBuilder, type BuilderStep } from './BuilderContext';

function parseStat(stat: string | number | null | undefined): number {
  if (typeof stat === 'number') return stat;
  if (!stat) return 0;
  const match = String(stat).match(/^(\d+)/);
  return match?.[1] ? parseInt(match[1], 10) : 0;
}

function calculateStats(
  blade: Part | null,
  ratchet: Part | null,
  bit: Part | null,
) {
  const parts = [blade, ratchet, bit].filter(Boolean) as Part[];
  return parts.reduce(
    (acc, part) => ({
      attack: acc.attack + parseStat(part.attack),
      defense: acc.defense + parseStat(part.defense),
      stamina: acc.stamina + parseStat(part.stamina),
      dash: acc.dash + parseStat(part.dash),
      burst: acc.burst + parseStat(part.burst),
      weight: acc.weight + (part.weight || 0),
    }),
    { attack: 0, defense: 0, stamina: 0, dash: 0, burst: 0, weight: 0 },
  );
}

interface BeySlotCardProps {
  slotIndex: number;
}

const PART_ROWS: { key: 'blade' | 'ratchet' | 'bit'; label: string; step: BuilderStep }[] = [
  { key: 'blade', label: 'Blade', step: 'BLADE' },
  { key: 'ratchet', label: 'Ratchet', step: 'RATCHET' },
  { key: 'bit', label: 'Bit', step: 'BIT' },
];

export function BeySlotCard({ slotIndex }: BeySlotCardProps) {
  const { state, dispatch } = useBuilder();
  const bey = state.beys[slotIndex as 0 | 1 | 2];
  const isActive = state.activeSlotIndex === slotIndex;
  const isComplete = !!bey.blade && !!bey.ratchet && !!bey.bit;
  const stats = calculateStats(bey.blade, bey.ratchet, bey.bit);

  const handleSlotClick = () => {
    dispatch({ type: 'SET_ACTIVE_SLOT', slotIndex });
    dispatch({ type: 'SET_MOBILE_TAB', tab: 'catalog' });
  };

  const handleRemove = (partType: BuilderStep, e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: 'REMOVE_PART', slotIndex, partType });
  };

  const handleRowClick = (step: BuilderStep) => {
    dispatch({ type: 'SET_ACTIVE_SLOT', slotIndex });
    dispatch({ type: 'SET_ACTIVE_STEP', step });
    dispatch({ type: 'SET_MOBILE_TAB', tab: 'catalog' });
  };

  return (
    <Box
      onClick={handleSlotClick}
      sx={{
        p: 1.5,
        borderRadius: 2,
        border: '2px solid',
        borderColor: isActive ? 'error.main' : 'divider',
        bgcolor: isActive ? (theme) => alpha(theme.palette.error.main, 0.04) : 'background.paper',
        boxShadow: isActive ? '0 0 12px rgba(220,38,38,0.15)' : 'none',
        cursor: 'pointer',
        transition: 'all 0.2s',
        '&:hover': {
          borderColor: isActive ? 'error.main' : 'text.secondary',
        },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle2" fontWeight="900">
          BEY #{slotIndex + 1}
        </Typography>
        <Chip
          label={isComplete ? 'PRÊT' : 'INCOMPLET'}
          size="small"
          color={isComplete ? 'success' : 'default'}
          variant="outlined"
          sx={{ fontWeight: 'bold', fontSize: '0.65rem', height: 20 }}
        />
      </Box>

      {PART_ROWS.map(({ key, label, step }) => {
        const part = bey[key];
        return (
          <Box
            key={key}
            onClick={(e) => {
              e.stopPropagation();
              handleRowClick(step);
            }}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              py: 0.75,
              px: 1,
              borderRadius: 1,
              cursor: 'pointer',
              bgcolor: isActive && state.activeStep === step ? (theme) => alpha(theme.palette.error.main, 0.08) : 'transparent',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            <Avatar
              src={part?.imageUrl || undefined}
              variant="rounded"
              sx={{ width: 36, height: 36, bgcolor: 'action.hover', fontSize: '0.7rem' }}
            >
              {label[0]}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="caption" color="text.secondary" fontSize="0.65rem">
                {label}
              </Typography>
              <Typography variant="body2" fontWeight="bold" noWrap>
                {part ? part.name : '—'}
              </Typography>
            </Box>
            {part && (
              <IconButton size="small" onClick={(e) => handleRemove(step, e)} sx={{ p: 0.25 }}>
                <Close fontSize="small" sx={{ fontSize: 16 }} />
              </IconButton>
            )}
          </Box>
        );
      })}

      {isComplete && (
        <Box sx={{ mt: 1.5, p: 1, bgcolor: 'action.hover', borderRadius: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 120, height: 100, flexShrink: 0 }}>
              <RadarChart
                {...({
                  series: [{ type: 'radar', data: [stats.attack, stats.defense, stats.stamina, stats.dash, stats.burst], color: '#dc2626' }],
                  xAxis: [{ scaleType: 'band', data: ['ATK', 'DEF', 'END', 'DSH', 'BST'] }],
                  width: 120,
                  height: 100,
                  margin: { top: 5, bottom: 5, left: 5, right: 5 },
                  slotProps: { legend: { hidden: true } },
                  sx: {
                    '& .MuiChartsAxis-tickLabel': { fill: '#aaa', fontSize: 8, fontWeight: 'bold' },
                    '& .MuiChartsAxis-line': { stroke: '#444' },
                    '& .MuiChartsAxis-tick': { stroke: '#444' },
                  },
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                } as any)}
              />
            </Box>
            <Box sx={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              <Chip label={`ATK ${stats.attack}`} size="small" sx={{ bgcolor: 'rgba(239,68,68,0.15)', color: '#ef4444', fontWeight: 'bold', fontSize: '0.65rem', height: 22 }} />
              <Chip label={`DEF ${stats.defense}`} size="small" sx={{ bgcolor: 'rgba(59,130,246,0.15)', color: '#3b82f6', fontWeight: 'bold', fontSize: '0.65rem', height: 22 }} />
              <Chip label={`END ${stats.stamina}`} size="small" sx={{ bgcolor: 'rgba(34,197,94,0.15)', color: '#22c55e', fontWeight: 'bold', fontSize: '0.65rem', height: 22 }} />
              <Chip label={`DSH ${stats.dash}`} size="small" sx={{ bgcolor: 'rgba(251,191,36,0.15)', color: '#fbbf24', fontWeight: 'bold', fontSize: '0.65rem', height: 22 }} />
              <Chip label={`${stats.weight.toFixed(1)}g`} size="small" variant="outlined" sx={{ fontWeight: 'bold', fontSize: '0.65rem', height: 22 }} />
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}
