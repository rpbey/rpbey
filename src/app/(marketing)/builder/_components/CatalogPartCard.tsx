'use client';

import { BarChart, Close } from '@mui/icons-material';
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import type { Part } from '@prisma/client';
import Image from 'next/image';
import { useState } from 'react';

const TYPE_COLORS: Record<string, string> = {
  ATTACK: '#ef4444',
  DEFENSE: '#3b82f6',
  STAMINA: '#22c55e',
  BALANCE: '#a855f7',
};

const STAT_LABELS: Record<string, { label: string; color: string }> = {
  attack: { label: 'ATK', color: '#ef4444' },
  defense: { label: 'DEF', color: '#3b82f6' },
  stamina: { label: 'END', color: '#22c55e' },
  dash: { label: 'DSH', color: '#fbbf24' },
};

function isExternalUrl(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://');
}

function parseStat(val: string | number | null | undefined): number {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const match = String(val).match(/^(\d+)/);
  return match?.[1] ? parseInt(match[1], 10) : 0;
}

const ALL_STATS: { key: keyof Part; label: string; color: string }[] = [
  { key: 'attack', label: 'Attaque', color: '#ef4444' },
  { key: 'defense', label: 'Defense', color: '#3b82f6' },
  { key: 'stamina', label: 'Endurance', color: '#22c55e' },
  { key: 'dash', label: 'Dash', color: '#fbbf24' },
  { key: 'burst', label: 'Anti-Burst', color: '#a855f7' },
];

const SYSTEM_LABELS: Record<string, string> = {
  BX: 'Xtreme',
  UX: 'Ultimate',
  CX: 'Custom',
  COLLAB: 'Collab',
};

interface CatalogPartCardProps {
  part: Part;
  isUsed: boolean;
  onClick: () => void;
}

export function CatalogPartCard({
  part,
  isUsed,
  onClick,
}: CatalogPartCardProps) {
  const [statsOpen, setStatsOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const color = (part.beyType && TYPE_COLORS[part.beyType]) || '#6b7280';

  const renderFallback = () => (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        bgcolor: (theme) => alpha(theme.palette.divider, 0.08),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '12px',
      }}
    >
      <Typography
        variant="h4"
        color="text.disabled"
        fontWeight="900"
        sx={{ opacity: 0.5 }}
      >
        {part.name.charAt(0)}
      </Typography>
    </Box>
  );

  const renderImage = () => {
    if (!part.imageUrl || imgError) {
      return renderFallback();
    }

    // External URLs (beybladeplanner.com etc) - use native img
    if (isExternalUrl(part.imageUrl)) {
      return (
        <img
          src={part.imageUrl}
          alt={part.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
          loading="lazy"
          onError={() => setImgError(true)}
        />
      );
    }

    // Local images - use Next.js Image
    return (
      <Image
        src={part.imageUrl}
        alt={part.name}
        fill
        sizes="80px"
        style={{ objectFit: 'contain' }}
        loading="lazy"
        onError={() => setImgError(true)}
      />
    );
  };

  return (
    <Card
      variant="outlined"
      sx={{
        height: '100%',
        transition: 'all 0.2s ease-out',
        opacity: isUsed ? 0.35 : 1,
        pointerEvents: isUsed ? 'none' : 'auto',
        borderRadius: 2.5,
        borderColor: 'divider',
        '&:hover': {
          transform: isUsed ? 'none' : 'translateY(-3px)',
          boxShadow: isUsed ? 'none' : `0 8px 24px -8px ${alpha(color, 0.35)}`,
          borderColor: color,
        },
        position: 'relative',
        overflow: 'visible',
      }}
    >
      <CardActionArea
        onClick={onClick}
        disabled={isUsed}
        sx={{ height: '100%' }}
      >
        <CardContent
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 0.75,
            p: 1.5,
            '&:last-child': { pb: 1.5 },
          }}
        >
          {part.beyType && (
            <Chip
              label={part.beyType.slice(0, 3)}
              size="small"
              sx={{
                position: 'absolute',
                top: 6,
                right: 6,
                bgcolor: alpha(color, 0.15),
                color: color,
                fontWeight: 'bold',
                fontSize: '0.6rem',
                height: 18,
                '& .MuiChip-label': { px: 0.75 },
              }}
            />
          )}

          {isUsed && (
            <Chip
              label="Utilise"
              size="small"
              sx={{
                position: 'absolute',
                top: 6,
                left: 6,
                bgcolor: 'rgba(0,0,0,0.75)',
                color: '#fff',
                fontWeight: 'bold',
                fontSize: '0.6rem',
                height: 18,
                zIndex: 2,
                '& .MuiChip-label': { px: 0.75 },
              }}
            />
          )}

          <Box sx={{ position: 'relative', width: 80, height: 80 }}>
            {renderImage()}
          </Box>

          <Box sx={{ textAlign: 'center', width: '100%' }}>
            <Typography
              variant="caption"
              fontWeight="900"
              noWrap
              sx={{ display: 'block', lineHeight: 1.3 }}
            >
              {part.name}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              fontSize="0.6rem"
            >
              {part.weight ? `${part.weight}g` : part.type}
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'flex',
              gap: 0.5,
              width: '100%',
              alignItems: 'center',
            }}
          >
            <Box sx={{ display: 'flex', gap: 0.5, flex: 1 }}>
              {(['attack', 'defense', 'stamina', 'dash'] as const).map(
                (stat) => {
                  const val = part[stat as keyof Part];
                  if (!val) return null;
                  const numericVal =
                    typeof val === 'number' ? val : parseInt(String(val), 10);
                  const statInfo = STAT_LABELS[stat] ?? {
                    label: stat,
                    color: '#888',
                  };
                  return (
                    <Tooltip
                      key={stat}
                      title={`${statInfo.label} ${numericVal}`}
                      arrow
                      placement="top"
                    >
                      <Box
                        sx={{
                          flex: 1,
                          height: 4,
                          bgcolor: 'action.hover',
                          borderRadius: 2,
                          overflow: 'hidden',
                          cursor: 'help',
                        }}
                      >
                        <Box
                          sx={{
                            width: `${Math.min(numericVal, 100)}%`,
                            height: '100%',
                            bgcolor: statInfo.color,
                            borderRadius: 2,
                          }}
                        />
                      </Box>
                    </Tooltip>
                  );
                },
              )}
            </Box>
            <Tooltip title="Voir les stats" arrow>
              <Box
                component="span"
                onClick={(e) => {
                  e.stopPropagation();
                  setStatsOpen(true);
                }}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  color: 'text.disabled',
                  '&:hover': { color: 'error.main' },
                  transition: 'color 0.15s',
                  ml: 0.25,
                }}
              >
                <BarChart sx={{ fontSize: 14 }} />
              </Box>
            </Tooltip>
          </Box>
        </CardContent>
      </CardActionArea>

      <Dialog
        open={statsOpen}
        onClose={() => setStatsOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3, overflow: 'hidden' } } }}
      >
        <DialogTitle
          sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6" fontWeight="900" noWrap>
              {part.name}
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
              <Chip
                label={part.type}
                size="small"
                sx={{
                  fontWeight: 'bold',
                  fontSize: '0.65rem',
                  height: 20,
                  borderRadius: 1.5,
                }}
              />
              {part.beyType && (
                <Chip
                  label={part.beyType}
                  size="small"
                  sx={{
                    fontWeight: 'bold',
                    fontSize: '0.65rem',
                    height: 20,
                    borderRadius: 1.5,
                    bgcolor: alpha(color, 0.15),
                    color,
                  }}
                />
              )}
              {part.system && (
                <Chip
                  label={SYSTEM_LABELS[part.system] ?? part.system}
                  size="small"
                  variant="outlined"
                  sx={{
                    fontWeight: 'bold',
                    fontSize: '0.65rem',
                    height: 20,
                    borderRadius: 1.5,
                  }}
                />
              )}
            </Box>
          </Box>
          <IconButton
            size="small"
            onClick={() => setStatsOpen(false)}
            sx={{ ml: 'auto' }}
          >
            <Close fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pb: 3 }}>
          <Box sx={{ display: 'flex', gap: 2.5, mb: 2.5 }}>
            <Box
              sx={{
                position: 'relative',
                width: 100,
                height: 100,
                flexShrink: 0,
              }}
            >
              {renderImage()}
            </Box>
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1,
                alignContent: 'center',
              }}
            >
              {part.weight != null && (
                <Chip
                  label={`${part.weight}g`}
                  size="small"
                  variant="outlined"
                  sx={{
                    fontWeight: 'bold',
                    fontSize: '0.7rem',
                    height: 24,
                    borderRadius: 1.5,
                  }}
                />
              )}
              {part.spinDirection && (
                <Chip
                  label={`Spin: ${part.spinDirection}`}
                  size="small"
                  variant="outlined"
                  sx={{
                    fontWeight: 'bold',
                    fontSize: '0.7rem',
                    height: 24,
                    borderRadius: 1.5,
                  }}
                />
              )}
              {part.height != null && (
                <Chip
                  label={`Hauteur: ${part.height}`}
                  size="small"
                  variant="outlined"
                  sx={{
                    fontWeight: 'bold',
                    fontSize: '0.7rem',
                    height: 24,
                    borderRadius: 1.5,
                  }}
                />
              )}
              {part.protrusions != null && (
                <Chip
                  label={`Contacts: ${part.protrusions}`}
                  size="small"
                  variant="outlined"
                  sx={{
                    fontWeight: 'bold',
                    fontSize: '0.7rem',
                    height: 24,
                    borderRadius: 1.5,
                  }}
                />
              )}
              {part.tipType && (
                <Chip
                  label={`Tip: ${part.tipType}`}
                  size="small"
                  variant="outlined"
                  sx={{
                    fontWeight: 'bold',
                    fontSize: '0.7rem',
                    height: 24,
                    borderRadius: 1.5,
                  }}
                />
              )}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
            {ALL_STATS.map(({ key, label, color: statColor }) => {
              const val = parseStat(part[key] as string | number | null);
              if (!val) return null;
              return (
                <Box key={key}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      mb: 0.25,
                    }}
                  >
                    <Typography
                      variant="caption"
                      fontWeight="bold"
                      color="text.secondary"
                    >
                      {label}
                    </Typography>
                    <Typography
                      variant="caption"
                      fontWeight="900"
                      sx={{ color: statColor }}
                    >
                      {val}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(val, 100)}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      bgcolor: (theme) => alpha(theme.palette.divider, 0.12),
                      '& .MuiLinearProgress-bar': {
                        bgcolor: statColor,
                        borderRadius: 3,
                      },
                    }}
                  />
                </Box>
              );
            })}
          </Box>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
