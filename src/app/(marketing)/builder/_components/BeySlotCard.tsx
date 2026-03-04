'use client';

import { Close } from '@mui/icons-material';
import {
  Avatar,
  Box,
  Chip,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import type { Part } from '@prisma/client';
import { StatRadar } from '@/components/ui/StatRadar';
import { type BuilderStep, isCXBlade, useBuilder } from './BuilderContext';

function parseStat(stat: string | number | null | undefined): number {
  if (typeof stat === 'number') return stat;
  if (!stat) return 0;
  const match = String(stat).match(/^(\d+)/);
  return match?.[1] ? parseInt(match[1], 10) : 0;
}

function calculateStats(
  blade: Part | null,
  overBlade: Part | null,
  ratchet: Part | null,
  bit: Part | null,
  lockChip: Part | null,
  assistBlade: Part | null,
) {
  const parts = [blade, overBlade, ratchet, bit, lockChip, assistBlade].filter(
    Boolean,
  ) as Part[];
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

interface PartRow {
  key: 'blade' | 'overBlade' | 'ratchet' | 'bit' | 'lockChip' | 'assistBlade';
  label: string;
  step: BuilderStep;
  color: string;
}

const BASE_ROWS: PartRow[] = [
  { key: 'blade', label: 'Blade', step: 'BLADE', color: '#ef4444' },
  { key: 'ratchet', label: 'Ratchet', step: 'RATCHET', color: '#fbbf24' },
  { key: 'bit', label: 'Bit', step: 'BIT', color: '#3b82f6' },
];

const CX_ROWS: PartRow[] = [
  { key: 'blade', label: 'Lame (Core)', step: 'BLADE', color: '#ef4444' },
  {
    key: 'overBlade',
    label: 'Over Blade',
    step: 'OVER_BLADE',
    color: '#ec4899',
  },
  { key: 'lockChip', label: 'Lock Chip', step: 'LOCK_CHIP', color: '#f97316' },
  {
    key: 'assistBlade',
    label: 'Assist',
    step: 'ASSIST_BLADE',
    color: '#8b5cf6',
  },
  { key: 'ratchet', label: 'Ratchet', step: 'RATCHET', color: '#fbbf24' },
  { key: 'bit', label: 'Bit', step: 'BIT', color: '#3b82f6' },
];

export function BeySlotCard({ slotIndex }: BeySlotCardProps) {
  const { state, dispatch } = useBuilder();
  const bey = state.beys[slotIndex as 0 | 1 | 2];
  const isActive = state.activeSlotIndex === slotIndex;
  const isCX = isCXBlade(bey);
  const rows = isCX ? CX_ROWS : BASE_ROWS;

  const isComplete = isCX
    ? !!bey.blade &&
      !!bey.overBlade &&
      !!bey.lockChip &&
      !!bey.assistBlade &&
      !!bey.ratchet &&
      !!bey.bit
    : !!bey.blade && !!bey.ratchet && !!bey.bit;

  const stats = calculateStats(
    bey.blade,
    bey.overBlade,
    bey.ratchet,
    bey.bit,
    bey.lockChip,
    bey.assistBlade,
  );

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
        p: 2,
        borderRadius: 3,
        border: '2px solid',
        borderColor: isActive ? 'error.main' : 'divider',
        bgcolor: isActive
          ? (theme) => alpha(theme.palette.error.main, 0.03)
          : 'transparent',
        boxShadow: isActive ? '0 0 16px rgba(220,38,38,0.12)' : 'none',
        cursor: 'pointer',
        transition: 'all 0.25s ease-out',
        '&:hover': {
          borderColor: isActive ? 'error.main' : 'text.disabled',
          bgcolor: isActive
            ? (theme) => alpha(theme.palette.error.main, 0.03)
            : (theme) => alpha(theme.palette.action.hover, 0.04),
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 1.5,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="subtitle2" fontWeight="900" letterSpacing={0.5}>
            BEY #{slotIndex + 1}
          </Typography>
          {isCX && (
            <Chip
              label="CX"
              size="small"
              sx={{
                fontWeight: 'bold',
                fontSize: '0.6rem',
                height: 20,
                borderRadius: 1,
                bgcolor: 'rgba(139,92,246,0.15)',
                color: '#8b5cf6',
              }}
            />
          )}
        </Box>
        <Chip
          label={isComplete ? 'PRET' : 'INCOMPLET'}
          size="small"
          color={isComplete ? 'success' : 'default'}
          variant={isComplete ? 'filled' : 'outlined'}
          sx={{
            fontWeight: 'bold',
            fontSize: '0.65rem',
            height: 22,
            borderRadius: 1.5,
          }}
        />
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        {rows.map(({ key, label, step, color }) => {
          const part = bey[key];
          const isActiveRow = isActive && state.activeStep === step;
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
                gap: 1.5,
                py: 0.75,
                px: 1.5,
                borderRadius: 2,
                cursor: 'pointer',
                bgcolor: isActiveRow
                  ? (theme) => alpha(theme.palette.error.main, 0.08)
                  : 'transparent',
                border: '1px solid',
                borderColor: isActiveRow ? 'error.main' : 'transparent',
                transition: 'all 0.15s',
                '&:hover': {
                  bgcolor: isActiveRow
                    ? (theme) => alpha(theme.palette.error.main, 0.08)
                    : 'action.hover',
                },
              }}
            >
              <Avatar
                src={part?.imageUrl || undefined}
                variant="rounded"
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: alpha(color, 0.12),
                  color: color,
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  borderRadius: 1.5,
                }}
              >
                {label[0]}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontSize="0.6rem"
                  fontWeight="bold"
                  textTransform="uppercase"
                  letterSpacing={0.5}
                >
                  {label}
                </Typography>
                <Typography variant="body2" fontWeight="bold" noWrap>
                  {part ? (
                    part.name
                  ) : (
                    <Box component="span" sx={{ color: 'text.disabled' }}>
                      Selectionner...
                    </Box>
                  )}
                </Typography>
              </Box>
              {part && (
                <Tooltip title="Retirer" arrow>
                  <IconButton
                    size="small"
                    onClick={(e) => handleRemove(step, e)}
                    sx={{
                      p: 0.5,
                      '&:hover': {
                        color: 'error.main',
                        bgcolor: (theme) =>
                          alpha(theme.palette.error.main, 0.1),
                      },
                    }}
                  >
                    <Close sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          );
        })}
      </Box>

      {isComplete && (
        <Box
          sx={{
            mt: 2,
            p: 2,
            bgcolor: (theme) => alpha(theme.palette.divider, 0.04),
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Box
              sx={{
                width: 140,
                height: 140,
                flexShrink: 0,
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <StatRadar stats={stats} size={140} />
            </Box>

            <Box
              sx={{
                flex: 1,
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
              }}
            >
              <StatBar label="ATK" value={stats.attack} color="#ef4444" />
              <StatBar label="DEF" value={stats.defense} color="#3b82f6" />
              <StatBar label="END" value={stats.stamina} color="#22c55e" />
              <StatBar label="DSH" value={stats.dash} color="#fbbf24" />

              <Box
                sx={{
                  mt: 0.5,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography
                  variant="caption"
                  fontWeight="900"
                  color="text.secondary"
                >
                  POIDS TOTAL
                </Typography>
                <Typography
                  variant="subtitle2"
                  fontWeight="900"
                  color="error.main"
                >
                  {stats.weight.toFixed(1)}g
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}

function StatBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
        <Typography
          sx={{
            fontSize: '0.65rem',
            fontWeight: '900',
            color: 'text.secondary',
          }}
        >
          {label}
        </Typography>
        <Typography
          sx={{ fontSize: '0.65rem', fontWeight: '900', color: color }}
        >
          {value}
        </Typography>
      </Box>
      <Box
        sx={{
          height: 4,
          width: '100%',
          bgcolor: 'rgba(0,0,0,0.1)',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            height: '100%',
            width: `${Math.min(value, 100)}%`,
            bgcolor: color,
            boxShadow: `0 0 8px ${alpha(color, 0.5)}`,
            transition: 'width 1s ease-out',
          }}
        />
      </Box>
    </Box>
  );
}
