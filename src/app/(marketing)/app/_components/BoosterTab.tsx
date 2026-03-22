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
import { useSession } from '@/lib/auth-client';
import {
  claimDaily,
  getUserCurrency,
  pullBooster,
  pullMulti,
} from '@/server/actions/gacha';

interface PulledPart {
  id: string;
  name: string;
  type: string;
  imageUrl: string | null;
  rarity: string;
  beyType?: string | null;
  system?: string | null;
  weight?: number | null;
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
// 3-phase animation like the real BBX app:
// Phase 1: Pack zoom-in with shake (0.5s)
// Phase 2: Electric Cards VFX full screen (2s)
// Phase 3: White flash then reveal (0.3s)
function RevealAnimation({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState(0); // 0=pack, 1=vfx, 2=flash
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    // Phase 0 → 1 after 600ms
    const t1 = setTimeout(() => setPhase(1), 600);
    // Phase 1 → 2 after VFX completes
    const t2 = setTimeout(() => setPhase(2), 2600);
    // Complete after flash
    const t3 = setTimeout(onComplete, 2900);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  // VFX frame animation during phase 1
  useEffect(() => {
    if (phase !== 1) return;
    const interval = setInterval(() => {
      setFrame((f) => Math.min(f + 1, 63));
    }, 30);
    return () => clearInterval(interval);
  }, [phase]);

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        bgcolor: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Phase 0: Pack close-up with shake */}
      {phase === 0 && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            animation: 'bbx-shake 0.1s infinite',
            '@keyframes bbx-shake': {
              '0%': { transform: 'translate(0, 0) scale(1.2)' },
              '25%': { transform: 'translate(-2px, 1px) scale(1.22)' },
              '50%': { transform: 'translate(2px, -1px) scale(1.2)' },
              '75%': { transform: 'translate(-1px, -2px) scale(1.23)' },
              '100%': { transform: 'translate(1px, 2px) scale(1.2)' },
            },
          }}
        >
          <Box
            component="img"
            src="/bbx-icons/orangeStar.png"
            sx={{ width: { xs: 80, md: 120 }, height: { xs: 80, md: 120 } }}
          />
          <Typography
            sx={{
              color: '#f59e0b',
              fontWeight: 900,
              fontSize: { xs: '1.2rem', md: '1.8rem' },
              letterSpacing: 4,
              textTransform: 'uppercase',
            }}
          >
            OPENING...
          </Typography>
        </Box>
      )}

      {/* Phase 1: Electric Cards VFX */}
      {phase === 1 && (
        <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
          <Box
            component="img"
            src={`/app-assets/vfx/vfx_UI_ElectricCards_${frame}.png`}
            alt=""
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: { xs: '100vw', md: '60vw' },
              height: { xs: '100vh', md: '60vh' },
              objectFit: 'contain',
            }}
          />
          {/* Secondary VFX layer */}
          {frame > 10 && (
            <Box
              component="img"
              src={`/app-assets/vfx/vfx_UI_ElectricCards02_${Math.min(frame - 10, 63)}.png`}
              alt=""
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%) scale(1.3)',
                width: { xs: '100vw', md: '60vw' },
                height: { xs: '100vh', md: '60vh' },
                objectFit: 'contain',
                opacity: 0.5,
                mixBlendMode: 'screen',
              }}
            />
          )}
          {/* Radial glow pulse */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 60%)',
              animation: 'pulse 0.5s infinite',
            }}
          />
        </Box>
      )}

      {/* Phase 2: White flash */}
      {phase === 2 && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            bgcolor: '#fff',
            animation: 'bbx-flash 0.3s ease-out forwards',
          }}
        />
      )}
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
        flex: {
          xs: '0 0 calc(50% - 8px)',
          sm: total > 3 ? '0 0 calc(33.33% - 12px)' : '0 0 calc(50% - 8px)',
        },
        minWidth: { xs: 100, sm: 120 },
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
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;
  const [selectedLine, setSelectedLine] = useState<string | null>(null);
  const [pulling, setPulling] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [revealedParts, setRevealedParts] = useState<PulledPart[]>([]);
  const [showReveal, setShowReveal] = useState(false);
  const [currency, setCurrency] = useState(500);
  const [message, setMessage] = useState<string | null>(null);

  // Load real currency if logged in
  useEffect(() => {
    if (isLoggedIn) {
      getUserCurrency().then((res) => {
        if (res.success && res.balance !== undefined) {
          setCurrency(res.balance);
        }
      });
    }
  }, [isLoggedIn]);

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

  const handleDailyClaim = useCallback(async () => {
    if (!isLoggedIn) {
      setCurrency((c) => c + 50);
      setMessage('Mode démo : +50 BeyCoins !');
      return;
    }
    const res = await claimDaily();
    if (res.success) {
      setCurrency(res.newBalance ?? currency);
      setMessage(`+${res.amount} BeyCoins ! (Série : ${res.streak} jours)`);
    } else {
      setMessage(res.message ?? 'Erreur');
    }
  }, [isLoggedIn, currency]);

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
      setMessage(null);

      let parts: PulledPart[];

      if (isLoggedIn) {
        // Server-side pull with real persistence
        const line = selectedLine as 'BX' | 'UX' | 'CX';
        const res =
          count === 1 ? await pullBooster(line) : await pullMulti(line);
        if (res.success && res.parts) {
          parts = res.parts;
          setCurrency(res.newBalance ?? currency - cost);
        } else {
          setShowAnimation(false);
          setPulling(false);
          setMessage(res.message ?? 'Erreur lors du pull');
          return;
        }
      } else {
        // Client-side demo mode
        parts = doClientPull(selectedLine, count);
        setCurrency((c) => c - cost);
      }

      // Wait for animation to finish
      setTimeout(() => {
        setShowAnimation(false);
        setRevealedParts(parts);
        setShowReveal(true);
        setPulling(false);
      }, 2800);
    },
    [selectedLine, currency, doClientPull, isLoggedIn],
  );

  return (
    <Box>
      {/* Currency display — stacks on mobile */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          justifyContent: 'space-between',
          gap: { xs: 1.5, sm: 0 },
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
            alt="BeyCoins"
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
              BeyCoins{!isLoggedIn ? ' (démo)' : ''}
            </Typography>
          </Box>
        </Box>
        <Button
          variant="outlined"
          onClick={handleDailyClaim}
          sx={{
            borderColor: alpha('#22c55e', 0.3),
            color: '#22c55e',
            fontWeight: 900,
            borderRadius: 2,
            py: 1,
            minHeight: 44,
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
          gridTemplateColumns: { xs: 'repeat(3, 1fr)', sm: 'repeat(3, 1fr)' },
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
            <Box sx={{ p: { xs: 1.5, sm: 3 }, textAlign: 'center' }}>
              <Box
                component="img"
                src={pack.img}
                alt={pack.name}
                sx={{
                  width: { xs: 40, sm: 64 },
                  height: { xs: 40, sm: 64 },
                  mx: 'auto',
                  mb: { xs: 1, sm: 2 },
                  filter:
                    selectedLine === pack.id
                      ? 'none'
                      : 'grayscale(0.3) opacity(0.7)',
                  transition: 'filter 0.3s',
                }}
              />
              <Typography
                fontWeight="900"
                sx={{
                  color: pack.color,
                  fontSize: { xs: '0.8rem', sm: '1.1rem' },
                }}
              >
                {pack.name}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: { xs: 'none', sm: 'block' } }}
              >
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
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
            justifyContent: 'center',
          }}
        >
          <Button
            variant="contained"
            fullWidth={false}
            disabled={pulling || currency < 100}
            onClick={() => handlePull(1)}
            sx={{
              fontWeight: 900,
              borderRadius: 3,
              px: { xs: 3, sm: 4 },
              py: 1.5,
              fontSize: { xs: '0.9rem', sm: '1rem' },
              minHeight: 48,
              flex: { xs: 1, sm: 'none' },
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
            fullWidth={false}
            disabled={pulling || currency < 450}
            onClick={() => handlePull(5)}
            sx={{
              fontWeight: 900,
              borderRadius: 3,
              px: { xs: 3, sm: 4 },
              py: 1.5,
              fontSize: { xs: '0.9rem', sm: '1rem' },
              minHeight: 48,
              flex: { xs: 1, sm: 'none' },
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
