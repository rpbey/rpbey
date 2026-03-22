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
import { useCallback, useEffect, useRef, useState } from 'react';
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
    img: '/bbx-icons/BBX-AttackType.webp',
    desc: 'Pièces de la série Beyblade Xtreme',
  },
  {
    id: 'UX',
    name: 'ULTIMATE',
    color: '#3b82f6',
    img: '/bbx-icons/BBX-DefenseType.webp',
    desc: 'Pièces de la série Ultimate Xtreme',
  },
  {
    id: 'CX',
    name: 'CUSTOM',
    color: '#a855f7',
    img: '/bbx-icons/BBX-BalanceType.webp',
    desc: 'Pièces de la série Custom Xtreme',
  },
];

// VFX animation — 4 phases:
// Phase 0: Interactive — user drags/swipes to split the booster pack
// Phase 1: Pack separates with shake
// Phase 2: Electric Cards VFX full screen
// Phase 3: White flash then reveal
function RevealAnimation({
  onComplete,
  packColor,
}: {
  onComplete: () => void;
  packColor: string;
}) {
  // 0=split, 1=separating, 2=vfx, 3=flash
  const [phase, setPhase] = useState(0);
  const [frame, setFrame] = useState(0);
  const [splitProgress, setSplitProgress] = useState(0); // 0-100
  const [glowIntensity, setGlowIntensity] = useState(0);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // After split completes → auto-advance through phases
  useEffect(() => {
    if (phase !== 1) return;
    const t1 = setTimeout(() => setPhase(2), 600);
    const t2 = setTimeout(() => setPhase(3), 2600);
    const t3 = setTimeout(onComplete, 2900);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [phase, onComplete]);

  // VFX frame animation during phase 2
  useEffect(() => {
    if (phase !== 2) return;
    const interval = setInterval(() => {
      setFrame((f) => Math.min(f + 1, 63));
    }, 30);
    return () => clearInterval(interval);
  }, [phase]);

  // Glow pulsing during drag
  useEffect(() => {
    if (phase !== 0) return;
    const interval = setInterval(() => {
      setGlowIntensity((_g) => {
        const base = splitProgress / 100;
        return base * 0.5 + Math.sin(Date.now() / 200) * 0.15 * base;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [phase, splitProgress]);

  // Handle drag/touch to split
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (phase !== 0) return;
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [phase],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (phase !== 0 || !dragStartRef.current) return;
      const dx = Math.abs(e.clientX - dragStartRef.current.x);
      const dy = Math.abs(e.clientY - dragStartRef.current.y);
      const distance = Math.max(dx, dy);
      const threshold = Math.min(window.innerWidth, window.innerHeight) * 0.25;
      const progress = Math.min((distance / threshold) * 100, 100);
      setSplitProgress(progress);

      if (progress >= 100) {
        dragStartRef.current = null;
        setPhase(1);
      }
    },
    [phase],
  );

  const handlePointerUp = useCallback(() => {
    if (phase !== 0) {
      dragStartRef.current = null;
      return;
    }
    dragStartRef.current = null;
    // Snap back if not fully split
    if (splitProgress < 100) {
      setSplitProgress(0);
    }
  }, [phase, splitProgress]);

  const halfGap = (splitProgress / 100) * 120; // max 120px apart

  return (
    <Box
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        bgcolor: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        cursor: phase === 0 ? 'grab' : 'default',
        touchAction: 'none',
        userSelect: 'none',
      }}
    >
      {/* Phase 0: Interactive split */}
      {phase === 0 && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
          }}
        >
          {/* Booster pack — splits in two */}
          <Box
            sx={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Center glow line */}
            <Box
              sx={{
                position: 'absolute',
                width: 4,
                height: '130%',
                bgcolor: packColor,
                opacity: glowIntensity,
                boxShadow: `0 0 ${20 + splitProgress * 0.5}px ${packColor}, 0 0 ${40 + splitProgress}px ${packColor}`,
                zIndex: 3,
                transition: 'opacity 0.1s',
              }}
            />

            {/* Left half */}
            <Box
              sx={{
                transform: `translateX(-${halfGap / 2}px) rotate(-${splitProgress * 0.05}deg)`,
                transition:
                  splitProgress === 0 ? 'transform 0.3s ease-out' : 'none',
                clipPath: 'inset(0 50% 0 0)',
                filter: `drop-shadow(${halfGap > 10 ? `0 0 15px ${packColor}` : 'none'})`,
              }}
            >
              <Box
                component="img"
                src="/bbx-icons/orangeStar.webp"
                alt=""
                sx={{
                  width: { xs: 140, md: 200 },
                  height: { xs: 140, md: 200 },
                }}
              />
            </Box>

            {/* Right half */}
            <Box
              sx={{
                transform: `translateX(${halfGap / 2}px) rotate(${splitProgress * 0.05}deg)`,
                transition:
                  splitProgress === 0 ? 'transform 0.3s ease-out' : 'none',
                clipPath: 'inset(0 0 0 50%)',
                ml: '-100%',
                filter: `drop-shadow(${halfGap > 10 ? `0 0 15px ${packColor}` : 'none'})`,
              }}
            >
              <Box
                component="img"
                src="/bbx-icons/orangeStar.webp"
                alt=""
                sx={{
                  width: { xs: 140, md: 200 },
                  height: { xs: 140, md: 200 },
                }}
              />
            </Box>

            {/* Spark particles along the split */}
            {splitProgress > 30 &&
              Array.from({ length: Math.floor(splitProgress / 15) }).map(
                (_, i) => (
                  <Box
                    key={i}
                    sx={{
                      position: 'absolute',
                      width: 4,
                      height: 4,
                      borderRadius: '50%',
                      bgcolor: packColor,
                      boxShadow: `0 0 6px ${packColor}`,
                      top: `${15 + i * 18 + Math.sin(Date.now() / 100 + i) * 10}%`,
                      left: '50%',
                      transform: `translateX(${Math.sin(i * 1.5) * halfGap * 0.3}px)`,
                      opacity: 0.5 + Math.random() * 0.5,
                      animation: `spark-float-${i % 3} 0.6s ease-out infinite`,
                      '@keyframes spark-float-0': {
                        '0%': {
                          transform: 'translateX(0) scale(1)',
                          opacity: 1,
                        },
                        '100%': {
                          transform: 'translateX(-20px) scale(0)',
                          opacity: 0,
                        },
                      },
                      '@keyframes spark-float-1': {
                        '0%': {
                          transform: 'translateX(0) scale(1)',
                          opacity: 1,
                        },
                        '100%': {
                          transform: 'translateX(20px) scale(0)',
                          opacity: 0,
                        },
                      },
                      '@keyframes spark-float-2': {
                        '0%': {
                          transform: 'translateY(0) scale(1)',
                          opacity: 1,
                        },
                        '100%': {
                          transform: 'translateY(-15px) scale(0)',
                          opacity: 0,
                        },
                      },
                    }}
                  />
                ),
              )}
          </Box>

          {/* Progress bar */}
          <Box
            sx={{
              width: { xs: 200, md: 280 },
              height: 6,
              borderRadius: 3,
              bgcolor: alpha(packColor, 0.15),
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                width: `${splitProgress}%`,
                height: '100%',
                bgcolor: packColor,
                borderRadius: 3,
                boxShadow:
                  splitProgress > 50 ? `0 0 10px ${packColor}` : 'none',
                transition:
                  splitProgress === 0 ? 'width 0.3s ease-out' : 'none',
              }}
            />
          </Box>

          {/* Instruction text */}
          <Typography
            sx={{
              color: alpha('#fff', 0.5),
              fontWeight: 700,
              fontSize: { xs: '0.85rem', md: '1rem' },
              letterSpacing: 1,
              textAlign: 'center',
              animation:
                splitProgress === 0
                  ? 'bbx-pulse-text 2s ease-in-out infinite'
                  : 'none',
              '@keyframes bbx-pulse-text': {
                '0%, 100%': { opacity: 0.4 },
                '50%': { opacity: 0.8 },
              },
            }}
          >
            {splitProgress > 60
              ? 'ENCORE !'
              : splitProgress > 0
                ? 'Continue...'
                : 'Glisser pour ouvrir le booster'}
          </Typography>
        </Box>
      )}

      {/* Phase 1: Pack flies apart with shake */}
      {phase === 1 && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'bbx-shake 0.08s infinite',
            '@keyframes bbx-shake': {
              '0%': { transform: 'translate(0, 0) scale(1.3)' },
              '25%': { transform: 'translate(-3px, 2px) scale(1.32)' },
              '50%': { transform: 'translate(3px, -1px) scale(1.3)' },
              '75%': { transform: 'translate(-2px, -3px) scale(1.33)' },
              '100%': { transform: 'translate(2px, 3px) scale(1.3)' },
            },
          }}
        >
          {/* Left half flies left */}
          <Box
            sx={{
              clipPath: 'inset(0 50% 0 0)',
              animation: 'fly-left 0.5s ease-in forwards',
              '@keyframes fly-left': {
                '0%': {
                  transform: 'translateX(-60px) rotate(-3deg)',
                  opacity: 1,
                },
                '100%': {
                  transform: 'translateX(-200px) rotate(-20deg)',
                  opacity: 0,
                },
              },
            }}
          >
            <Box
              component="img"
              src="/bbx-icons/orangeStar.webp"
              sx={{ width: { xs: 140, md: 200 }, height: { xs: 140, md: 200 } }}
            />
          </Box>
          {/* Right half flies right */}
          <Box
            sx={{
              clipPath: 'inset(0 0 0 50%)',
              ml: '-100%',
              animation: 'fly-right 0.5s ease-in forwards',
              '@keyframes fly-right': {
                '0%': {
                  transform: 'translateX(60px) rotate(3deg)',
                  opacity: 1,
                },
                '100%': {
                  transform: 'translateX(200px) rotate(20deg)',
                  opacity: 0,
                },
              },
            }}
          >
            <Box
              component="img"
              src="/bbx-icons/orangeStar.webp"
              sx={{ width: { xs: 140, md: 200 }, height: { xs: 140, md: 200 } }}
            />
          </Box>
          {/* Center burst */}
          <Box
            sx={{
              position: 'absolute',
              width: 200,
              height: 200,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${packColor} 0%, transparent 70%)`,
              opacity: 0,
              animation: 'center-burst 0.4s 0.1s ease-out forwards',
              '@keyframes center-burst': {
                '0%': { transform: 'scale(0)', opacity: 0.8 },
                '100%': { transform: 'scale(3)', opacity: 0 },
              },
            }}
          />
        </Box>
      )}

      {/* Phase 2: Electric Cards VFX */}
      {phase === 2 && (
        <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
          <Box
            component="img"
            src={`/app-assets/vfx/vfx_UI_ElectricCards_${frame}.webp`}
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
          {frame > 10 && (
            <Box
              component="img"
              src={`/app-assets/vfx/vfx_UI_ElectricCards02_${Math.min(frame - 10, 63)}.webp`}
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

      {/* Phase 3: White flash */}
      {phase === 3 && (
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

// ── TCG Card backgrounds per rarity ──
const RARITY_BG: Record<string, string> = {
  COMMON: 'linear-gradient(145deg, #1a1d24 0%, #2a2d34 50%, #1a1d24 100%)',
  RARE: 'linear-gradient(145deg, #0c1929 0%, #1a3a5c 50%, #0c1929 100%)',
  EPIC: 'linear-gradient(145deg, #1a0c29 0%, #3a1a6c 50%, #1a0c29 100%)',
  LEGENDARY: 'linear-gradient(145deg, #29200c 0%, #6c4a1a 50%, #29200c 100%)',
  SECRET: 'linear-gradient(145deg, #290c0c 0%, #6c1a2a 50%, #0c1a29 100%)',
};

const RARITY_BORDER: Record<string, string> = {
  COMMON: '#3a3d44',
  RARE: '#4a7aac',
  EPIC: '#8a5adc',
  LEGENDARY: '#dca84a',
  SECRET: '#dc4a6a',
};

const TYPE_ICONS: Record<string, string> = {
  BLADE: '/bbx-icons/BBX-AttackType.webp',
  OVER_BLADE: '/bbx-icons/BBX-AttackType.webp',
  RATCHET: '/bbx-icons/BBX-DefenseType.webp',
  BIT: '/bbx-icons/BBX-StaminaType.webp',
  LOCK_CHIP: '/bbx-icons/BBX-BalanceType.webp',
  ASSIST_BLADE: '/bbx-icons/BBX-BalanceType.webp',
};

// TCG-style revealed card — Pokémon card layout with holo effect
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
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const cardRef = useRef<HTMLDivElement>(null);
  const rarityColor = RARITY_COLORS[part.rarity] || '#6b7280';
  const borderColor = RARITY_BORDER[part.rarity] || '#3a3d44';
  const bgGradient = RARITY_BG[part.rarity] || RARITY_BG.COMMON;
  const isHolo = ['EPIC', 'LEGENDARY', 'SECRET'].includes(part.rarity);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), index * 300);
    return () => clearTimeout(timer);
  }, [index]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  }, []);

  // 3D tilt based on mouse position
  const rotateX = ((mousePos.y - 50) / 50) * -8;
  const rotateY = ((mousePos.x - 50) / 50) * 8;

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
        minWidth: { xs: 120, sm: 140 },
        maxWidth: 200,
        perspective: '600px',
      }}
    >
      <Box
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setMousePos({ x: 50, y: 50 })}
        sx={{
          position: 'relative',
          aspectRatio: '5/7',
          borderRadius: '12px',
          overflow: 'hidden',
          border: '3px solid',
          borderColor,
          background: bgGradient,
          boxShadow: `0 4px 20px ${alpha(rarityColor, 0.3)}, 0 0 40px ${alpha(rarityColor, 0.15)}`,
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          transition: 'transform 0.15s ease-out',
          cursor: 'default',
          '&:hover': {
            boxShadow: `0 8px 30px ${alpha(rarityColor, 0.5)}, 0 0 60px ${alpha(rarityColor, 0.2)}`,
          },
        }}
      >
        {/* ── Card Header ── */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 1.2,
            pt: 1,
            pb: 0.5,
          }}
        >
          <Typography
            noWrap
            sx={{
              color: '#fff',
              fontWeight: 900,
              fontSize: { xs: '0.65rem', sm: '0.75rem' },
              flex: 1,
              textShadow: '0 1px 3px rgba(0,0,0,0.5)',
            }}
          >
            {part.name}
          </Typography>
          <Box
            component="img"
            src={TYPE_ICONS[part.type] || '/bbx-icons/BBX-BalanceType.webp'}
            alt=""
            sx={{ width: 16, height: 16, ml: 0.5, flexShrink: 0 }}
          />
        </Box>

        {/* ── Art Window ── */}
        <Box
          sx={{
            mx: 1,
            borderRadius: '6px',
            overflow: 'hidden',
            border: '2px solid',
            borderColor: alpha(borderColor, 0.6),
            position: 'relative',
            aspectRatio: '4/3',
            bgcolor: '#0a0a0e',
          }}
        >
          {part.imageUrl ? (
            <img
              src={part.imageUrl}
              alt={part.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                padding: '8%',
                filter: `drop-shadow(0 0 8px ${alpha(rarityColor, 0.5)})`,
              }}
            />
          ) : (
            <Box
              sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography variant="h3" sx={{ opacity: 0.08, fontWeight: 900 }}>
                {part.name.charAt(0)}
              </Typography>
            </Box>
          )}

          {/* Holographic overlay — only for EPIC+ */}
          {isHolo && (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                background: `
                  linear-gradient(
                    ${115 + (mousePos.x - 50) * 0.5}deg,
                    transparent 20%,
                    ${alpha(rarityColor, 0.15)} 35%,
                    ${alpha('#fff', 0.1)} 40%,
                    ${alpha('#88ccff', 0.12)} 45%,
                    ${alpha(rarityColor, 0.15)} 55%,
                    transparent 70%
                  )
                `,
                backgroundPosition: `${mousePos.x}% ${mousePos.y}%`,
                mixBlendMode: 'color-dodge',
                pointerEvents: 'none',
                transition: 'background-position 0.1s',
              }}
            />
          )}

          {/* SECRET rainbow shimmer */}
          {part.rarity === 'SECRET' && (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                background: `
                  linear-gradient(
                    ${125 + (mousePos.x - 50)}deg,
                    ${alpha('#ff0000', 0.08)} 0%,
                    ${alpha('#ff8800', 0.08)} 15%,
                    ${alpha('#ffff00', 0.08)} 30%,
                    ${alpha('#00ff88', 0.08)} 45%,
                    ${alpha('#0088ff', 0.08)} 60%,
                    ${alpha('#8800ff', 0.08)} 75%,
                    ${alpha('#ff0088', 0.08)} 100%
                  )
                `,
                mixBlendMode: 'screen',
                pointerEvents: 'none',
              }}
            />
          )}
        </Box>

        {/* ── Info Bar (type + rarity) ── */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 1.2,
            pt: 0.6,
          }}
        >
          <Chip
            label={part.type.replace('_', ' ')}
            size="small"
            sx={{
              height: 16,
              fontSize: '0.5rem',
              fontWeight: 900,
              bgcolor: alpha('#fff', 0.08),
              color: alpha('#fff', 0.7),
              letterSpacing: 0.3,
            }}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
            {/* Rarity stars */}
            {Array.from({
              length:
                part.rarity === 'SECRET'
                  ? 5
                  : part.rarity === 'LEGENDARY'
                    ? 4
                    : part.rarity === 'EPIC'
                      ? 3
                      : part.rarity === 'RARE'
                        ? 2
                        : 1,
            }).map((_, i) => (
              <Box
                key={i}
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  bgcolor: rarityColor,
                  boxShadow: isHolo ? `0 0 4px ${rarityColor}` : 'none',
                }}
              />
            ))}
          </Box>
        </Box>

        {/* ── Rarity Label ── */}
        <Box sx={{ px: 1.2, pb: 0.8 }}>
          <Typography
            sx={{
              color: rarityColor,
              fontWeight: 900,
              fontSize: '0.55rem',
              letterSpacing: 1,
              textTransform: 'uppercase',
              textShadow: isHolo
                ? `0 0 8px ${alpha(rarityColor, 0.5)}`
                : 'none',
            }}
          >
            {RARITY_LABELS[part.rarity] || part.rarity}
          </Typography>
        </Box>

        {/* ── Shine sweep (LEGENDARY/SECRET) ── */}
        {(part.rarity === 'LEGENDARY' || part.rarity === 'SECRET') && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(105deg, transparent 40%, ${alpha('#fff', 0.06)} 45%, ${alpha('#fff', 0.12)} 50%, ${alpha('#fff', 0.06)} 55%, transparent 60%)`,
              backgroundSize: '250% 100%',
              animation: 'tcg-shine 3s ease-in-out infinite',
              pointerEvents: 'none',
              '@keyframes tcg-shine': {
                '0%': { backgroundPosition: '200% 0' },
                '100%': { backgroundPosition: '-50% 0' },
              },
            }}
          />
        )}
      </Box>
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
  const [_pendingParts, _setPendingParts] = useState<PulledPart[]>([]);
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

      // Store parts — animation onComplete will trigger reveal
      _setPendingParts(parts);
    },
    [selectedLine, currency, doClientPull, isLoggedIn],
  );

  const _handleAnimationComplete = useCallback(() => {
    setShowAnimation(false);
    setRevealedParts(_pendingParts);
    setShowReveal(true);
    setPulling(false);
    _setPendingParts([]);
  }, [_pendingParts]);

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
            src="/bbx-icons/orangeStar.webp"
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
          sx={{
            mb: 2,
            fontWeight: 700,
            fontSize: '0.85rem',
            color:
              message.includes('+') || message.includes('BeyCoins')
                ? '#22c55e'
                : '#ef4444',
          }}
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
      {showAnimation && (
        <RevealAnimation
          onComplete={_handleAnimationComplete}
          packColor={
            PACK_LINES.find((p) => p.id === selectedLine)?.color || '#f59e0b'
          }
        />
      )}

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
