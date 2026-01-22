'use client';

/**
 * BeyBuilder - Component to build a single Bey (Blade + Ratchet + Bit)
 */

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import type { Part } from '@prisma/client';
import { useEffect, useState } from 'react';
import { ModelViewer } from '../bey/ModelViewer';
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

function calculateStats(blade: Part | null): {
  attack: number;
  defense: number;
  stamina: number;
  dash: number;
} | null {
  if (!blade) return null;
  return {
    attack: parseStat(blade.attack),
    defense: parseStat(blade.defense),
    stamina: parseStat(blade.stamina),
    dash: parseStat(blade.dash),
  };
}

function getBeyName(data: BeyData): string {
  const parts = [data.blade?.name, data.ratchet?.name, data.bit?.name].filter(
    Boolean,
  );

  return parts.join(' ') || 'Bey non configuré';
}

export function BeyBuilder({
  position,
  data,
  onChange,
  usedPartIds,
  disabled = false,
}: BeyBuilderProps) {
  const [modelMapping, setModelMapping] = useState<
    Record<string, { model?: string; texture?: string }>
  >({});

  useEffect(() => {
    fetch('/data/part-model-map.json')
      .then((res) => res.json())
      .then((mapping) => {
        setModelMapping(mapping);
      })
      .catch((err) => {
        console.error('Failed to load model mapping', err);
      });
  }, []);

  const stats = calculateStats(data.blade);
  const beyName = getBeyName(data);
  const isComplete = data.blade && data.ratchet && data.bit;

  // Find 3D model for current blade
  const bladeModel = data.blade ? modelMapping[data.blade.id] : null;

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
    <Paper
      elevation={2}
      sx={{
        p: 2,
        borderLeft: 4,
        borderColor: isComplete ? 'primary.main' : 'grey.400',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Typography variant="subtitle1" fontWeight="bold">
          Bey #{position}
        </Typography>
        {isComplete && (
          <Chip
            size="small"
            label="Complet"
            color="success"
            variant="outlined"
          />
        )}
      </Box>

      {/* 3D Preview */}
      <Box
        sx={{
          height: 180,
          mb: 2,
          borderRadius: 2,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        {data.blade ? (
          bladeModel?.model ? (
            <ModelViewer
              modelUrl={bladeModel.model}
              textureUrl={bladeModel.texture}
            />
          ) : (
            <Box
              sx={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'action.hover',
              }}
            >
              <Typography variant="caption" color="text.secondary">
                Aperçu 3D indisponible
              </Typography>
            </Box>
          )
        ) : (
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'action.hover',
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Choisissez une lame pour l'aperçu
            </Typography>
          </Box>
        )}
      </Box>

      <Stack spacing={2}>
        <TextField
          label="Surnom (optionnel)"
          value={data.nickname}
          onChange={(e) => onChange({ ...data, nickname: e.target.value })}
          disabled={disabled}
          size="small"
          placeholder={beyName}
          fullWidth
        />

        <PartSelector
          type="BLADE"
          value={data.blade}
          onChange={(blade) => onChange({ ...data, blade })}
          disabled={disabled}
          disabledPartIds={otherUsedPartIds}
        />

        <PartSelector
          type="RATCHET"
          value={data.ratchet}
          onChange={(ratchet) => onChange({ ...data, ratchet })}
          disabled={disabled}
          disabledPartIds={otherUsedPartIds}
        />

        <PartSelector
          type="BIT"
          value={data.bit}
          onChange={(bit) => onChange({ ...data, bit })}
          disabled={disabled}
          disabledPartIds={otherUsedPartIds}
        />

        {stats && (
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              pt: 1,
              borderTop: 1,
              borderColor: 'divider',
              flexWrap: 'wrap',
            }}
          >
            <Chip
              size="small"
              label={`ATK ${stats.attack}`}
              sx={{ bgcolor: 'error.main', color: 'white' }}
            />
            <Chip
              size="small"
              label={`DEF ${stats.defense}`}
              sx={{ bgcolor: 'info.main', color: 'white' }}
            />
            <Chip
              size="small"
              label={`STA ${stats.stamina}`}
              sx={{ bgcolor: 'success.main', color: 'white' }}
            />
            <Chip
              size="small"
              label={`X ${stats.dash}`}
              sx={{ bgcolor: 'warning.main', color: 'black' }}
            />
          </Box>
        )}
      </Stack>
    </Paper>
  );
}
