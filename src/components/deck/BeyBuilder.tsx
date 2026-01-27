'use client';

/**
 * BeyBuilder - Component to build a single Bey (Blade + Ratchet + Bit)
 */

import { useMediaQuery, useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import type { Part } from '@prisma/client';
import { DynamicRadarChart as RadarChart } from '@/components/ui/DynamicCharts';
import { PartSelector } from './PartSelector';

export interface BeyData {
  blade: Part | null;
  ratchet: Part | null;
  bit: Part | null;
  nickname: string;
}

interface BeyBuilderProps {
  position: number;
  data: BeyData;
  onChange: (data: BeyData) => void;
  usedPartIds: string[];
  disabled?: boolean;
}

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
): {
  attack: number;
  defense: number;
  stamina: number;
  dash: number;
  burst: number;
  weight: number;
} {
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

export function BeyBuilder({
  position,
  data,
  onChange,
  usedPartIds,
  disabled = false,
}: BeyBuilderProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const stats = calculateStats(data.blade, data.ratchet, data.bit);
  const isComplete = data.blade && data.ratchet && data.bit;

  // Filter out current bey's parts from usedPartIds
  const currentPartIds = [
    data.blade?.id,
    data.ratchet?.id,
    data.bit?.id,
  ].filter(Boolean) as string[];
  const otherUsedPartIds = usedPartIds.filter(
    (id) => !currentPartIds.includes(id),
  );

  return (
    <Box
      sx={{
        p: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          label="SURNOM DU BEY"
          value={data.nickname}
          onChange={(e) => onChange({ ...data, nickname: e.target.value })}
          disabled={disabled}
          size="small"
          placeholder={`Bey #${position}`}
          fullWidth
          variant="filled"
          sx={{
            flexGrow: 1,
            '& .MuiInputBase-root': {
              bgcolor: '#222',
              color: 'white',
              borderRadius: 1,
            },
            '& .MuiInputLabel-root': { color: '#888' },
          }}
        />

        <Chip
          label={isComplete ? 'PRÊT' : 'INCOMPLET'}
          color={isComplete ? 'success' : 'error'}
          size="small"
          variant="outlined"
          sx={{ fontWeight: 'bold' }}
        />
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr',
          gap: 2,
        }}
      >
        <PartSelector
          type="BLADE"
          label="LAME (BLADE)"
          value={data.blade}
          onChange={(blade) => onChange({ ...data, blade })}
          disabled={disabled}
          disabledPartIds={otherUsedPartIds}
          dark={true}
        />

        <PartSelector
          type="RATCHET"
          label="RATCHET"
          value={data.ratchet}
          onChange={(ratchet) => onChange({ ...data, ratchet })}
          disabled={disabled}
          disabledPartIds={otherUsedPartIds}
          dark={true}
        />

        <PartSelector
          type="BIT"
          label="POINTE (BIT)"
          value={data.bit}
          onChange={(bit) => onChange({ ...data, bit })}
          disabled={disabled}
          disabledPartIds={otherUsedPartIds}
          dark={true}
        />
      </Box>

      {/* Stats Radar Chart */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: 'center',
          gap: 2,
          mt: 1,
          p: 2,
          bgcolor: '#080808',
          borderRadius: 2,
          border: '1px solid #333',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            width: isMobile ? '100%' : '50%',
            height: 200,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <RadarChart
            {...({
              series: [
                {
                  type: 'radar',
                  data: [
                    stats.attack,
                    stats.defense,
                    stats.stamina,
                    stats.dash,
                    stats.burst,
                  ],
                  color: '#dc2626',
                },
              ],
              xAxis: [
                {
                  scaleType: 'band',
                  data: ['ATK', 'DEF', 'END', 'DSH', 'BST'],
                },
              ],
              width: 250,
              height: 200,
              margin: { top: 10, bottom: 10, left: 10, right: 10 },
              slotProps: {
                legend: { hidden: true },
              },
              sx: {
                '& .MuiChartsAxis-line': { stroke: '#444' },
                '& .MuiChartsAxis-tick': { stroke: '#444' },
                '& .MuiChartsAxis-tickLabel': {
                  fill: '#aaa',
                  fontWeight: 'bold',
                },
              },
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any)}
          />
        </Box>

        <Box
          sx={{
            width: isMobile ? '100%' : '50%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 2,
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="caption"
              sx={{ color: '#888', fontWeight: 'bold', letterSpacing: 1 }}
            >
              POIDS TOTAL
            </Typography>
            <Typography
              variant="h3"
              sx={{
                color: 'white',
                fontWeight: '900',
                textShadow: '0 0 20px rgba(255,255,255,0.2)',
              }}
            >
              {stats.weight.toFixed(1)}
              <span style={{ fontSize: '1rem', color: '#666' }}>g</span>
            </Typography>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
            <Chip
              label={`ATK ${stats.attack}`}
              size="small"
              sx={{
                bgcolor: 'rgba(239, 68, 68, 0.2)',
                color: '#ef4444',
                fontWeight: 'bold',
              }}
            />
            <Chip
              label={`DEF ${stats.defense}`}
              size="small"
              sx={{
                bgcolor: 'rgba(59, 130, 246, 0.2)',
                color: '#3b82f6',
                fontWeight: 'bold',
              }}
            />
            <Chip
              label={`END ${stats.stamina}`}
              size="small"
              sx={{
                bgcolor: 'rgba(34, 197, 94, 0.2)',
                color: '#22c55e',
                fontWeight: 'bold',
              }}
            />
            <Chip
              label={`DSH ${stats.dash}`}
              size="small"
              sx={{
                bgcolor: 'rgba(251, 191, 36, 0.2)',
                color: '#fbbf24',
                fontWeight: 'bold',
              }}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
