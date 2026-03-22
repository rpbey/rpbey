'use client';

import {
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogContent,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import type { Part } from '@prisma/client';
import { useCallback, useEffect, useState } from 'react';

// Pull result from server action
interface PullResult {
  success: boolean;
  parts?: PulledPart[];
  message?: string;
  newBalance?: number;
}

interface PulledPart {
  id: string;
  name: string;
  type: string;
  imageUrl: string | null;
  rarity: string;
  beyType: string | null;
}

const RARITY_COLORS: Record<string, string> = {
  COMMON: '#6b7280',
  RARE: '#3b82f6',
  EPIC: '#8b5cf6',
  LEGENDARY: '#f59e0b',
  SECRET: '#ef4444',
};

const RARITY_LABELS: Record<string, string> = {
  COMMON: 'Commune',
  RARE: 'Rare',
  EPIC: 'Épique',
  LEGENDARY: 'Légendaire',
  SECRET: 'Secrète',
};

const PACK_LINES = [
  {
    id: 'BX',
    name: 'XTREME',
    color: '#ef4444',
    img: '/bbx-icons/BBX-AttackType.png',
    desc: 'Pièces de la série Beyblade Xtreme',
  },
  {
    id: 'UX',
    name: 'ULTIMATE',
    color: '#3b82f6',
    img: '/bbx-icons/BBX-DefenseType.png',
    desc: 'Pièces de la série Ultimate Xtreme',
  },
  {
    id: 'CX',
    name: 'CUSTOM',
    color: '#a855f7',
    img: '/bbx-icons/BBX-BalanceType.png',
    desc: 'Pièces de la série Custom Xtreme',
  },
];

// VFX animation component that plays the Electric Cards reveal
function RevealAnimation({ onComplete }: { onComplete: () => void }) {
  const [frame, setFrame] = useState(0);
  const totalFrames = 64;

  useEffect(() => {
    const interval = setInterval(() => {
      setFrame((f) => {
        if (f >= totalFrames - 1) {
          clearInterval(interval);
          setTimeout(onComplete, 200);
          return f;
        }
        return f + 1;
      });
    }, 40); // ~25fps
    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        bgcolor: 'rgba(0,0,0,0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: { xs: 300, md: 500 },
          height: { xs: 300, md: 500 },
        }}
      >
        <img
          src={`/app-assets/vfx/vfx_UI_ElectricCards_${frame}.png`}
          alt=""
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        />
        {/* Glow overlay */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(circle, ${alpha('#f59e0b', 0.2)} 0%, transparent 70%)`,
            animation: 'pulse 1s infinite',
          }}
        />
      </Box>
      <Typography
        sx={{
          position: 'absolute',
          bottom: '15%',
          color: alpha('#fff', 0.5),
          fontWeight: 900,
          letterSpacing: 3,
          textTransform: 'uppercase',
          fontSize: '0.8rem',
        }}
      >
        Ouverture en cours...
      </Typography>
    </Box>
  );
}

// Revealed card component
function RevealedCard({
  part,
  index,
  total,
}: {
  part: PulledPart;
  index: number;
  total: number;
}) {
  const [visible, setVisible] = useState(false);
  const rarityColor = RARITY_COLORS[part.rarity] || '#6b7280';

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), index * 300);
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <Box
      sx={{
        opacity: visible ? 1 : 0,
        transform: visible
          ? 'scale(1) translateY(0)'
          : 'scale(0.5) translateY(40px)',
        transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
        flex: total > 3 ? '0 0 calc(33.33% - 12px)' : '0 0 calc(50% - 8px)',
        minWidth: 120,
        maxWidth: 180,
      }}
    >
      <Card
        elevation={0}
        sx={{
          borderRadius: 4,
          overflow: 'hidden',
          border: '2px solid',
          borderColor: rarityColor,
          boxShadow: `0 0 20px ${alpha(rarityColor, 0.4)}, inset 0 0 30px ${alpha(rarityColor, 0.05)}`,
          bgcolor: alpha(rarityColor, 0.05),
        }}
      >
        {/* Image */}
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            aspectRatio: '1',
            bgcolor: '#0a0a0a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {part.imageUrl ? (
            <img
              src={part.imageUrl}
              alt={part.name}
              style={{
                width: '80%',
                height: '80%',
                objectFit: 'contain',
                filter: `drop-shadow(0 0 10px ${alpha(rarityColor, 0.6)})`,
              }}
            />
          ) : (
            <Typography variant="h3" sx={{ opacity: 0.1, fontWeight: 900 }}>
              {part.name.charAt(0)}
            </Typography>
          )}
          {/* Rarity sparkle */}
          {(part.rarity === 'LEGENDARY' || part.rarity === 'SECRET') && (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                background: `radial-gradient(circle at 30% 30%, ${alpha(rarityColor, 0.3)} 0%, transparent 50%)`,
                animation: 'bbx-flash 2s infinite',
              }}
            />
          )}
        </Box>

        {/* Info */}
        <Box sx={{ p: 1.5, textAlign: 'center' }}>
          <Typography
            variant="body2"
            fontWeight="900"
            noWrap
            sx={{ fontSize: '0.8rem' }}
          >
            {part.name}
          </Typography>
          <Box
            sx={{
              display: 'flex',
              gap: 0.5,
              justifyContent: 'center',
              mt: 0.5,
            }}
          >
            <Chip
              label={part.type}
              size="small"
              sx={{
                height: 18,
                fontSize: '0.55rem',
                fontWeight: 900,
                bgcolor: alpha('#fff', 0.1),
                color: '#fff',
              }}
            />
            <Chip
              label={RARITY_LABELS[part.rarity] || part.rarity}
              size="small"
              sx={{
                height: 18,
                fontSize: '0.55rem',
                fontWeight: 900,
                bgcolor: alpha(rarityColor, 0.2),
                color: rarityColor,
              }}
            />
          </Box>
        </Box>
      </Card>
    </Box>
  );
}

interface BoosterTabProps {
  allParts: Part[];
}

export function BoosterTab({ allParts }: BoosterTabProps) {
  const [selectedLine, setSelectedLine] = useState<string | null>(null);
  const [pulling, setPulling] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [revealedParts, setRevealedParts] = useState<PulledPart[]>([]);
  const [showReveal, setShowReveal] = useState(false);
  const [currency, setCurrency] = useState(500); // Default starter currency
  const [message, setMessage] = useState<string | null>(null);

  // Client-side random pull (fallback when not logged in)
  const doClientPull = useCallback(
    (line: string, count: number) => {
      const lineParts = allParts.filter((p) => p.system === line || !p.system);
      if (lineParts.length === 0) return [];

      const rarities = ['COMMON', 'RARE', 'EPIC', 'LEGENDARY', 'SECRET'];
      const weights = [60, 25, 10, 4, 1];

      const results: PulledPart[] = [];
      for (let i = 0; i < count; i++) {
        // Pick rarity
        const roll = Math.random() * 100;
        let cumulative = 0;
        let rarity = 'COMMON';
        for (let r = 0; r < rarities.length; r++) {
          cumulative += weights[r] ?? 0;
          if (roll < cumulative) {
            rarity = rarities[r] ?? 'COMMON';
            break;
          }
        }

        // Guarantee at least 1 EPIC+ on multi
        if (
          count > 1 &&
          i === count - 1 &&
          !results.some((r) =>
            ['EPIC', 'LEGENDARY', 'SECRET'].includes(r.rarity),
          )
        ) {
          const epicRoll = Math.random() * 100;
          rarity =
            epicRoll < 70 ? 'EPIC' : epicRoll < 95 ? 'LEGENDARY' : 'SECRET';
        }

        const part = lineParts[Math.floor(Math.random() * lineParts.length)];
        if (!part) continue;
        results.push({
          id: part.id,
          name: part.name,
          type: part.type,
          imageUrl: part.imageUrl,
          rarity,
          beyType: part.beyType,
        });
      }
      return results;
    },
    [allParts],
  );

  const handlePull = useCallback(
    async (count: number) => {
      if (!selectedLine) return;
      const cost = count === 1 ? 100 : 450;
      if (currency < cost) {
        setMessage('Pas assez de BeyCoins !');
        return;
      }

      setPulling(true);
      setShowAnimation(true);

      // Simulate pull while animation plays
      const parts = doClientPull(selectedLine, count);

      // Wait for animation
      setTimeout(() => {
        setShowAnimation(false);
        setRevealedParts(parts);
        setShowReveal(true);
        setCurrency((c) => c - cost);
        setPulling(false);
      }, 2800);
    },
    [selectedLine, currency, doClientPull],
  );

  return (
    <Box>
      {/* Currency display */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 3,
          p: 2,
          borderRadius: 3,
          bgcolor: alpha('#f59e0b', 0.05),
          border: '1px solid',
          borderColor: alpha('#f59e0b', 0.15),
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            component="img"
            src="/bbx-icons/orangeStar.png"
            sx={{ width: 28, height: 28 }}
          />
          <Box>
            <Typography
              variant="h5"
              fontWeight="900"
              sx={{ color: '#f59e0b', lineHeight: 1 }}
            >
              {currency}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight="600"
            >
              BeyCoins
            </Typography>
          </Box>
        </Box>
        <Button
          variant="outlined"
          size="small"
          sx={{
            borderColor: alpha('#22c55e', 0.3),
            color: '#22c55e',
            fontWeight: 900,
            borderRadius: 2,
            '&:hover': { bgcolor: alpha('#22c55e', 0.1) },
          }}
        >
          + Récompense quotidienne
        </Button>
      </Box>

      {message && (
        <Typography
          color="error"
          sx={{ mb: 2, fontWeight: 700, fontSize: '0.85rem' }}
        >
          {message}
        </Typography>
      )}

      {/* Pack selection */}
      <Typography variant="h6" fontWeight="900" sx={{ mb: 2 }}>
        Choisissez un Booster
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
          gap: 2,
          mb: 4,
        }}
      >
        {PACK_LINES.map((pack) => (
          <Card
            key={pack.id}
            variant="outlined"
            onClick={() => setSelectedLine(pack.id)}
            sx={{
              cursor: 'pointer',
              borderRadius: 4,
              borderColor:
                selectedLine === pack.id ? pack.color : alpha(pack.color, 0.15),
              borderWidth: selectedLine === pack.id ? 2 : 1,
              bgcolor:
                selectedLine === pack.id
                  ? alpha(pack.color, 0.08)
                  : 'background.paper',
              transition: 'all 0.3s',
              '&:hover': {
                borderColor: pack.color,
                transform: 'translateY(-4px)',
                boxShadow: `0 8px 24px ${alpha(pack.color, 0.2)}`,
              },
            }}
          >
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Box
                component="img"
                src={pack.img}
                sx={{
                  width: 64,
                  height: 64,
                  mx: 'auto',
                  mb: 2,
                  filter:
                    selectedLine === pack.id
                      ? 'none'
                      : 'grayscale(0.3) opacity(0.7)',
                  transition: 'filter 0.3s',
                }}
              />
              <Typography
                variant="h6"
                fontWeight="900"
                sx={{ color: pack.color }}
              >
                {pack.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {pack.desc}
              </Typography>
            </Box>
          </Card>
        ))}
      </Box>

      {/* Pull buttons */}
      {selectedLine && (
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Button
            variant="contained"
            size="large"
            disabled={pulling || currency < 100}
            onClick={() => handlePull(1)}
            sx={{
              fontWeight: 900,
              borderRadius: 3,
              px: 4,
              py: 1.5,
              fontSize: '1rem',
              bgcolor: PACK_LINES.find((p) => p.id === selectedLine)?.color,
              '&:hover': {
                bgcolor: alpha(
                  PACK_LINES.find((p) => p.id === selectedLine)?.color ||
                    '#fff',
                  0.8,
                ),
              },
            }}
          >
            Pull x1 — 100 ★
          </Button>
          <Button
            variant="contained"
            size="large"
            disabled={pulling || currency < 450}
            onClick={() => handlePull(5)}
            sx={{
              fontWeight: 900,
              borderRadius: 3,
              px: 4,
              py: 1.5,
              fontSize: '1rem',
              bgcolor: '#f59e0b',
              '&:hover': { bgcolor: alpha('#f59e0b', 0.8) },
            }}
          >
            Pull x5 — 450 ★ (1 Épique+ garanti)
          </Button>
        </Box>
      )}

      {/* Drop rates */}
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography
          variant="caption"
          color="text.disabled"
          sx={{ display: 'block' }}
        >
          Taux de drop : Commune 60% · Rare 25% · Épique 10% · Légendaire 4% ·
          Secrète 1%
        </Typography>
      </Box>

      {/* VFX Animation overlay */}
      {showAnimation && <RevealAnimation onComplete={() => {}} />}

      {/* Reveal dialog */}
      <Dialog
        open={showReveal}
        onClose={() => setShowReveal(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              bgcolor: '#0a0a0a',
              borderRadius: 5,
              border: '1px solid',
              borderColor: alpha('#f59e0b', 0.2),
              overflow: 'hidden',
            },
          },
        }}
      >
        <DialogContent sx={{ p: 3 }}>
          <Typography
            variant="h5"
            fontWeight="900"
            sx={{ textAlign: 'center', mb: 3, color: '#fff' }}
          >
            Résultat du Pull !
          </Typography>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1.5,
              justifyContent: 'center',
            }}
          >
            {revealedParts.map((part, i) => (
              <RevealedCard
                key={`${part.id}-${i}`}
                part={part}
                index={i}
                total={revealedParts.length}
              />
            ))}
          </Box>
          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Button
              variant="outlined"
              onClick={() => setShowReveal(false)}
              sx={{
                fontWeight: 900,
                borderRadius: 3,
                borderColor: alpha('#fff', 0.2),
                color: '#fff',
              }}
            >
              Fermer
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
