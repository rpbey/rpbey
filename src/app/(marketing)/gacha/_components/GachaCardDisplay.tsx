'use client';

import { Favorite, FitnessCenter, FlashOn, Speed } from '@mui/icons-material';
import { Box, Chip, Typography } from '@mui/material';
import type { GachaCard } from '@prisma/client';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useState } from 'react';

const RARITY_THEMES: Record<
  string,
  {
    borderColor: string;
    glowColor: string;
    bgGradient: string[];
    accentColor: string;
    label: string;
    stars: number;
  }
> = {
  COMMON: {
    borderColor: '#6b7280',
    glowColor: 'rgba(107,114,128,0.3)',
    bgGradient: ['#1f2937', '#111827'],
    accentColor: '#9ca3af',
    label: 'COMMUNE',
    stars: 1,
  },
  RARE: {
    borderColor: '#3b82f6',
    glowColor: 'rgba(59,130,246,0.4)',
    bgGradient: ['#1e3a5f', '#0c1f3d'],
    accentColor: '#60a5fa',
    label: 'RARE',
    stars: 2,
  },
  EPIC: {
    borderColor: '#8b5cf6',
    glowColor: 'rgba(139,92,246,0.4)',
    bgGradient: ['#2e1065', '#1a0533'],
    accentColor: '#a78bfa',
    label: 'ÉPIQUE',
    stars: 3,
  },
  LEGENDARY: {
    borderColor: '#fbbf24',
    glowColor: 'rgba(251,191,36,0.5)',
    bgGradient: ['#422006', '#1c0a00'],
    accentColor: '#fcd34d',
    label: 'LÉGENDAIRE',
    stars: 4,
  },
  SECRET: {
    borderColor: '#ef4444',
    glowColor: 'rgba(239,68,68,0.6)',
    bgGradient: ['#450a0a', '#1f0000'],
    accentColor: '#f87171',
    label: '✦ SECRÈTE ✦',
    stars: 5,
  },
};

const SERIES_NAMES: Record<string, string> = {
  METAL_MASTERS: 'Metal Masters',
  METAL_FURY: 'Metal Fury',
  METAL_FUSION: 'Metal Fusion',
  SHOGUN_STEEL: 'Shogun Steel',
  BURST: 'Burst',
  BEYBLADE_X: 'Beyblade X',
  BAKUTEN: 'Bakuten',
};

const ELEMENT_CONFIG: Record<string, { color: string; emoji: string }> = {
  FEU: { color: '#ef4444', emoji: '🔥' },
  EAU: { color: '#3b82f6', emoji: '💧' },
  TERRE: { color: '#84cc16', emoji: '🌿' },
  VENT: { color: '#06b6d4', emoji: '🌪️' },
  OMBRE: { color: '#7c3aed', emoji: '🌑' },
  LUMIERE: { color: '#fbbf24', emoji: '✨' },
  NEUTRAL: { color: '#9ca3af', emoji: '⚡' },
};

interface GachaCardDisplayProps {
  card: GachaCard;
  owned?: number;
  onClick?: () => void;
}

export function GachaCardDisplay({
  card,
  owned,
  onClick,
}: GachaCardDisplayProps) {
  const [flipped, setFlipped] = useState(false);
  // biome-ignore lint/style/noNonNullAssertion: keys are guaranteed to exist
  const theme = RARITY_THEMES[card.rarity] || RARITY_THEMES.COMMON!;
  // biome-ignore lint/style/noNonNullAssertion: keys are guaranteed to exist
  const element = ELEMENT_CONFIG[card.element] || ELEMENT_CONFIG.NEUTRAL!;
  const seriesName = SERIES_NAMES[card.series] || card.series;
  const totalPower = card.atk + card.def + card.spd + card.hp;

  return (
    <Box
      component={motion.div}
      whileHover={{ scale: 1.05, y: -8 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={() => {
        if (onClick) onClick();
        else setFlipped(!flipped);
      }}
      sx={{
        perspective: '1000px',
        cursor: 'pointer',
        width: '100%',
        aspectRatio: '2/3',
      }}
    >
      <Box
        component={motion.div}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.6 }}
        sx={{
          position: 'relative',
          width: '100%',
          height: '100%',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Front face */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            borderRadius: 3,
            overflow: 'hidden',
            border: `2px solid ${theme.borderColor}`,
            boxShadow: `0 0 20px ${theme.glowColor}, inset 0 0 20px rgba(0,0,0,0.3)`,
            background: `linear-gradient(135deg, ${theme.bgGradient[0]}, ${theme.bgGradient[1]})`,
          }}
        >
          {/* Rarity band */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              bgcolor: theme.borderColor,
              zIndex: 2,
            }}
          />

          {/* Character image */}
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              height: '60%',
              overflow: 'hidden',
            }}
          >
            {card.imageUrl ? (
              <Image
                src={card.imageUrl}
                alt={card.name}
                fill
                sizes="(max-width: 600px) 45vw, (max-width: 900px) 30vw, 200px"
                style={{ objectFit: 'cover', objectPosition: 'center top' }}
                unoptimized
              />
            ) : (
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: `linear-gradient(135deg, ${theme.bgGradient[0]}, ${theme.accentColor}20)`,
                }}
              >
                <Typography sx={{ fontSize: '3rem', opacity: 0.3 }}>
                  🃏
                </Typography>
              </Box>
            )}
            {/* Gradient fade */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '40%',
                background: `linear-gradient(to top, ${theme.bgGradient[1]}, transparent)`,
              }}
            />

            {/* Element badge */}
            <Box
              sx={{
                position: 'absolute',
                top: 10,
                right: 10,
                px: 1,
                py: 0.25,
                borderRadius: 1,
                bgcolor: `${element.color}30`,
                border: `1px solid ${element.color}50`,
                fontSize: '0.65rem',
                color: element.color,
                fontWeight: 700,
                zIndex: 2,
              }}
            >
              {element.emoji} {card.element}
            </Box>

            {/* Owned badge */}
            {owned != null && owned > 0 && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 10,
                  left: 10,
                  px: 1,
                  py: 0.25,
                  borderRadius: 1,
                  bgcolor: 'rgba(34,197,94,0.2)',
                  border: '1px solid rgba(34,197,94,0.4)',
                  fontSize: '0.65rem',
                  color: '#22c55e',
                  fontWeight: 700,
                  zIndex: 2,
                }}
              >
                ×{owned}
              </Box>
            )}
          </Box>

          {/* Card info */}
          <Box sx={{ p: 1.5, position: 'relative', zIndex: 1 }}>
            <Typography
              fontWeight={800}
              sx={{
                color: 'white',
                fontSize: { xs: '0.7rem', md: '0.8rem' },
                lineHeight: 1.2,
                mb: 0.25,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {card.name}
            </Typography>
            {card.nameJp && (
              <Typography
                sx={{
                  color: `${theme.accentColor}80`,
                  fontSize: '0.55rem',
                  mb: 0.5,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {card.nameJp}
              </Typography>
            )}

            {/* Series & Rarity */}
            <Box sx={{ display: 'flex', gap: 0.5, mb: 1, flexWrap: 'wrap' }}>
              <Chip
                label={seriesName}
                size="small"
                sx={{
                  height: 18,
                  fontSize: '0.55rem',
                  bgcolor: 'rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.6)',
                  '& .MuiChip-label': { px: 0.75 },
                }}
              />
              <Chip
                label={theme.label}
                size="small"
                sx={{
                  height: 18,
                  fontSize: '0.55rem',
                  bgcolor: `${theme.borderColor}20`,
                  color: theme.accentColor,
                  fontWeight: 700,
                  '& .MuiChip-label': { px: 0.75 },
                }}
              />
            </Box>

            {/* Beyblade name */}
            {card.beyblade && (
              <Typography
                sx={{
                  color: theme.accentColor,
                  fontSize: '0.6rem',
                  fontWeight: 600,
                  mb: 0.75,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                🌀 {card.beyblade}
              </Typography>
            )}

            {/* Special Move */}
            {card.specialMove && (
              <Typography
                sx={{
                  color: '#fbbf24',
                  fontSize: '0.5rem',
                  fontWeight: 600,
                  fontStyle: 'italic',
                  mb: 0.5,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                ⚡ {card.specialMove}
              </Typography>
            )}

            {/* TCG Stats mini bar */}
            {totalPower > 0 && (
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                {[
                  {
                    icon: <FitnessCenter sx={{ fontSize: 10 }} />,
                    val: card.atk,
                    color: '#ef4444',
                  },
                  {
                    icon: <Favorite sx={{ fontSize: 10 }} />,
                    val: card.def,
                    color: '#3b82f6',
                  },
                  {
                    icon: <Speed sx={{ fontSize: 10 }} />,
                    val: card.spd,
                    color: '#22c55e',
                  },
                  {
                    icon: <FlashOn sx={{ fontSize: 10 }} />,
                    val: card.hp,
                    color: '#fbbf24',
                  },
                ].map((stat) => (
                  <Box
                    key={stat.color}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.25,
                      color: stat.color,
                      fontSize: '0.55rem',
                      fontWeight: 700,
                    }}
                  >
                    {stat.icon}
                    {stat.val}
                  </Box>
                ))}
              </Box>
            )}

            {/* Stars */}
            <Box sx={{ mt: 0.5, display: 'flex', gap: 0.25 }}>
              {Array.from({ length: theme.stars }).map((_, i) => (
                <Box
                  key={i}
                  sx={{
                    color: theme.accentColor,
                    fontSize: '0.6rem',
                  }}
                >
                  ★
                </Box>
              ))}
            </Box>
          </Box>
        </Box>

        {/* Back face */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            borderRadius: 3,
            overflow: 'hidden',
            border: `2px solid ${theme.borderColor}`,
            boxShadow: `0 0 20px ${theme.glowColor}`,
            background: `linear-gradient(135deg, ${theme.bgGradient[0]}, ${theme.bgGradient[1]})`,
            p: 2,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Rarity band */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              bgcolor: theme.borderColor,
            }}
          />

          <Typography
            fontWeight={800}
            sx={{ color: 'white', fontSize: '0.85rem', mt: 1, mb: 0.5 }}
          >
            {card.name}
          </Typography>

          {card.beyblade && (
            <Typography
              sx={{
                color: theme.accentColor,
                fontSize: '0.7rem',
                fontWeight: 600,
                mb: 0.25,
              }}
            >
              🌀 {card.beyblade}
            </Typography>
          )}

          {card.specialMove && (
            <Typography
              sx={{
                color: '#fbbf24',
                fontSize: '0.6rem',
                fontWeight: 700,
                fontStyle: 'italic',
                mb: 0.75,
              }}
            >
              ⚡ {card.specialMove}
            </Typography>
          )}

          {/* Description */}
          <Typography
            sx={{
              color: 'rgba(255,255,255,0.6)',
              fontSize: '0.6rem',
              lineHeight: 1.6,
              flex: 1,
              overflow: 'auto',
              '&::-webkit-scrollbar': { width: 3 },
              '&::-webkit-scrollbar-thumb': {
                bgcolor: 'rgba(255,255,255,0.2)',
                borderRadius: 2,
              },
            }}
          >
            {card.description}
          </Typography>

          {/* Full stats */}
          {totalPower > 0 && (
            <Box
              sx={{
                mt: 1.5,
                display: 'flex',
                flexDirection: 'column',
                gap: 0.5,
              }}
            >
              {[
                { label: 'ATK', val: card.atk, max: 100, color: '#ef4444' },
                { label: 'DEF', val: card.def, max: 100, color: '#3b82f6' },
                { label: 'SPD', val: card.spd, max: 100, color: '#22c55e' },
                { label: 'HP', val: card.hp, max: 100, color: '#fbbf24' },
              ].map((stat) => (
                <Box
                  key={stat.label}
                  sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <Typography
                    sx={{
                      color: stat.color,
                      fontSize: '0.55rem',
                      fontWeight: 700,
                      width: 24,
                    }}
                  >
                    {stat.label}
                  </Typography>
                  <Box
                    sx={{
                      flex: 1,
                      height: 4,
                      borderRadius: 2,
                      bgcolor: 'rgba(255,255,255,0.1)',
                    }}
                  >
                    <Box
                      sx={{
                        width: `${stat.val}%`,
                        height: '100%',
                        borderRadius: 2,
                        bgcolor: stat.color,
                        transition: 'width 0.5s ease',
                      }}
                    />
                  </Box>
                  <Typography
                    sx={{
                      color: 'rgba(255,255,255,0.5)',
                      fontSize: '0.5rem',
                      width: 20,
                      textAlign: 'right',
                    }}
                  >
                    {stat.val}
                  </Typography>
                </Box>
              ))}
              <Typography
                sx={{
                  color: 'rgba(255,255,255,0.4)',
                  fontSize: '0.5rem',
                  textAlign: 'center',
                  mt: 0.5,
                }}
              >
                Power Total : {totalPower} · {element.emoji} {card.element}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
