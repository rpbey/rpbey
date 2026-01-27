'use client';

import { Close } from '@mui/icons-material';
import {
  Avatar,
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Grid as MuiGrid,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { RadarChart } from '@mui/x-charts/RadarChart';
import type { Part } from '@prisma/client';

interface PartDetailModalProps {
  part: Part | null;
  onClose: () => void;
}

const PART_TYPE_LABELS: Record<string, string> = {
  BLADE: 'Lame (Blade)',
  RATCHET: 'Ratchet',
  BIT: 'Pointe (Bit)',
};

const BEY_TYPE_LABELS: Record<string, string> = {
  ATTACK: 'Attaque',
  DEFENSE: 'Défense',
  STAMINA: 'Endurance',
  BALANCE: 'Équilibre',
};

const SPIN_LABELS: Record<string, string> = {
  Right: 'Droite',
  Left: 'Gauche',
  Dual: 'Double',
};

export function PartDetailModal({ part, onClose }: PartDetailModalProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (!part) return null;

  const stats = [
    parseInt(part.attack || '0'),
    parseInt(part.defense || '0'),
    parseInt(part.stamina || '0'),
    parseInt(part.dash || '0'),
    parseInt(part.burst || '0'),
  ];

  return (
    <Dialog
      open={!!part}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { bgcolor: 'background.paper', borderRadius: 3 },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight="900">
            {part.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            ID Externe : {part.externalId}
          </Typography>
        </Box>
        <IconButton onClick={onClose}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        <MuiGrid container>
          {/* Left: Image & Key Specs */}
          <MuiGrid
            size={{ xs: 12, md: 5 }}
            sx={{
              p: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              bgcolor: 'action.hover',
            }}
          >
            <Avatar
              src={part.imageUrl || undefined}
              variant="rounded"
              sx={{ width: 200, height: 200, bgcolor: 'transparent', mb: 4 }}
            >
              {part.name.charAt(0)}
            </Avatar>

            <Box
              sx={{
                display: 'flex',
                gap: 1,
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}
            >
              <Chip
                label={PART_TYPE_LABELS[part.type] || part.type}
                color="primary"
              />
              {part.system && (
                <Chip label={`Système ${part.system}`} variant="outlined" />
              )}
              {part.weight && (
                <Chip label={`${part.weight}g`} variant="outlined" />
              )}
              {part.spinDirection && (
                <Chip
                  label={`Rotation ${SPIN_LABELS[part.spinDirection] || part.spinDirection}`}
                  variant="outlined"
                />
              )}
            </Box>
          </MuiGrid>

          {/* Right: Radar & Details */}
          <MuiGrid size={{ xs: 12, md: 7 }} sx={{ p: 4 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Profil Technique
            </Typography>

            <Box
              sx={{
                height: 300,
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <RadarChart
                {...({
                  series: [
                    {
                      type: 'radar',
                      data: stats,
                      color: theme.palette.primary.main,
                    },
                  ],
                  xAxis: [
                    {
                      scaleType: 'band',
                      data: ['ATT', 'DEF', 'END', 'DSH', 'BST'],
                    },
                  ],
                  width: isMobile ? 300 : 400,
                  height: 250,
                  margin: { top: 10, bottom: 10, left: 30, right: 30 },
                  sx: {
                    '& .MuiChartsAxis-line': { stroke: theme.palette.divider },
                    '& .MuiChartsAxis-tick': { stroke: theme.palette.divider },
                    '& .MuiChartsAxis-tickLabel': {
                      fill: theme.palette.text.secondary,
                      fontWeight: 'bold',
                    },
                  },
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                } as any)}
              />
            </Box>

            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Type de Pièce
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Cette pièce de type{' '}
                <strong>
                  {BEY_TYPE_LABELS[part.beyType || '']?.toLowerCase() ||
                    'inconnu'}
                </strong>{' '}
                fait partie du système {part.system || 'standard'}. Elle offre
                un équilibre de statistiques optimisé pour la compétition.
              </Typography>
            </Box>
          </MuiGrid>
        </MuiGrid>
      </DialogContent>
    </Dialog>
  );
}
