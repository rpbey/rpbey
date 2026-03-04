'use client';

import { Close } from '@mui/icons-material';
import {
  Avatar,
  alpha,
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import type { Part } from '@prisma/client';
import { DynamicRadarChart as RadarChart } from '@/components/ui/DynamicCharts';

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
    parseInt(part.attack || '0', 10),
    parseInt(part.defense || '0', 10),
    parseInt(part.stamina || '0', 10),
    parseInt(part.dash || '0', 10),
    parseInt(part.burst || '0', 10),
  ];

  return (
    <Dialog
      open={!!part}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'surface.main',
          borderRadius: 4,
          boxShadow: '0 24px 48px -12px rgba(0,0,0,0.5)',
          backgroundImage: 'none',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: 3,
          pt: 3,
          pb: 1,
        }}
      >
        <Box>
          <Typography
            variant="h5"
            fontWeight="900"
            sx={{ letterSpacing: -0.5 }}
          >
            {part.name}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontWeight: 600 }}
          >
            ID EXTRÊME : {part.externalId}
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          sx={{
            bgcolor: 'surface.highest',
            '&:hover': { bgcolor: 'surface.high' },
          }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0, border: 'none' }}>
        <Grid container>
          {/* Left: Image & Key Specs */}
          <Grid
            size={{ xs: 12, md: 5 }}
            sx={{
              p: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              bgcolor: 'surface.low',
            }}
          >
            <Box
              sx={{
                width: 240,
                height: 240,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                mb: 4,
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.1)} 0%, transparent 70%)`,
                },
              }}
            >
              <Avatar
                src={part.imageUrl || undefined}
                variant="rounded"
                sx={{
                  width: 200,
                  height: 200,
                  bgcolor: 'transparent',
                  filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.3))',
                }}
              >
                {part.name.charAt(0)}
              </Avatar>
            </Box>

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
                sx={{ fontWeight: 800 }}
              />
              {part.system && (
                <Chip
                  label={`Système ${part.system}`}
                  variant="outlined"
                  sx={{ borderColor: 'divider', fontWeight: 600 }}
                />
              )}
              {part.weight && (
                <Chip
                  label={`${part.weight}g`}
                  variant="outlined"
                  sx={{ borderColor: 'divider', fontWeight: 600 }}
                />
              )}
              {part.spinDirection && (
                <Chip
                  label={`Rotation ${SPIN_LABELS[part.spinDirection] || part.spinDirection}`}
                  variant="outlined"
                  sx={{ borderColor: 'divider', fontWeight: 600 }}
                />
              )}
            </Box>
          </Grid>

          {/* Right: Radar & Details */}
          <Grid size={{ xs: 12, md: 7 }} sx={{ p: 4, bgcolor: 'surface.main' }}>
            <Typography
              variant="h6"
              fontWeight="900"
              gutterBottom
              sx={{ letterSpacing: -0.5 }}
            >
              PROFIL TECHNIQUE
            </Typography>

            <Box
              sx={{
                height: 300,
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <RadarChart
                {...({
                  series: [
                    {
                      type: 'radar',
                      data: stats,
                      color: theme.palette.primary.main,
                      fillArea: true,
                    },
                  ],
                  radar: {
                    metrics: ['ATT', 'DEF', 'END', 'DSH', 'BST'],
                    max: 10,
                  },
                  shape: 'circular',
                  divisions: 5,
                  stripeColor: (index: number) =>
                    index % 2 === 0
                      ? alpha(theme.palette.primary.main, 0.08)
                      : 'transparent',
                  width: isMobile ? 300 : 400,
                  height: 280,
                  margin: { top: 20, bottom: 20, left: 40, right: 40 },
                  sx: {
                    '& .MuiChartsAxis-line': { stroke: theme.palette.divider },
                    '& .MuiChartsAxis-tick': { stroke: theme.palette.divider },
                    '& .MuiChartsAxis-tickLabel': {
                      fill: theme.palette.text.secondary,
                      fontWeight: '900',
                      fontSize: '0.75rem',
                    },
                  },
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                } as any)}
              />
            </Box>

            <Box
              sx={{
                mt: 3,
                p: 2,
                borderRadius: 2,
                bgcolor: 'surface.low',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography
                variant="overline"
                color="primary"
                sx={{ fontWeight: 800 }}
              >
                Description
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5, lineHeight: 1.7 }}
              >
                Cette pièce de type{' '}
                <strong style={{ color: theme.palette.text.primary }}>
                  {BEY_TYPE_LABELS[part.beyType || '']?.toLowerCase() ||
                    'inconnu'}
                </strong>{' '}
                fait partie du système {part.system || 'standard'}. Elle offre
                un équilibre de statistiques optimisé pour la compétition RPB.
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
}
