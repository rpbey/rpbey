'use client';

import { Add, Close, PlayArrow, Shuffle } from '@mui/icons-material';
import { Box, Button, Chip, Typography } from '@mui/material';
import type { GachaCard } from '@prisma/client';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import { useMemo, useState } from 'react';

const RARITY_COLORS: Record<string, string> = {
  COMMON: '#6b7280',
  RARE: '#3b82f6',
  EPIC: '#8b5cf6',
  LEGENDARY: '#fbbf24',
  SECRET: '#ef4444',
};

const ELEMENT_EMOJI: Record<string, string> = {
  FEU: '🔥',
  EAU: '💧',
  TERRE: '🌿',
  VENT: '🌪️',
  OMBRE: '🌑',
  LUMIERE: '✨',
  NEUTRAL: '⚡',
};

interface TeamBuilderProps {
  availableCards: GachaCard[];
  onStartBattle: (
    team: GachaCard[],
    difficulty: 'easy' | 'normal' | 'hard',
  ) => void;
}

export function TeamBuilder({
  availableCards,
  onStartBattle,
}: TeamBuilderProps) {
  const [selected, setSelected] = useState<GachaCard[]>([]);
  const [difficulty, setDifficulty] = useState<'easy' | 'normal' | 'hard'>(
    'normal',
  );
  const [filterRarity, setFilterRarity] = useState<string>('ALL');

  const filtered = useMemo(() => {
    const selectedIds = new Set(selected.map((c) => c.id));
    return availableCards
      .filter((c) => !selectedIds.has(c.id))
      .filter((c) => filterRarity === 'ALL' || c.rarity === filterRarity);
  }, [availableCards, selected, filterRarity]);

  const addCard = (card: GachaCard) => {
    if (selected.length >= 5) return;
    setSelected((prev) => [...prev, card]);
  };

  const removeCard = (cardId: string) => {
    setSelected((prev) => prev.filter((c) => c.id !== cardId));
  };

  const randomFill = () => {
    const remaining = 5 - selected.length;
    if (remaining <= 0) return;
    const selectedIds = new Set(selected.map((c) => c.id));
    const pool = availableCards.filter((c) => !selectedIds.has(c.id));
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    setSelected((prev) => [...prev, ...shuffled.slice(0, remaining)]);
  };

  const teamPower = selected.reduce(
    (sum, c) => sum + c.atk + c.def + c.spd + c.hp,
    0,
  );

  return (
    <Box>
      {/* Selected team */}
      <Box sx={{ mb: 4 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Typography
            fontWeight={800}
            sx={{ color: 'white', fontSize: '0.9rem' }}
          >
            🎴 Ton équipe ({selected.length}/5)
          </Typography>
          {selected.length > 0 && (
            <Typography
              sx={{ color: '#a78bfa', fontSize: '0.7rem', fontWeight: 600 }}
            >
              Power : {teamPower}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
          {Array.from({ length: 5 }).map((_, i) => {
            const card = selected[i];
            if (card) {
              const color = RARITY_COLORS[card.rarity] || '#6b7280';
              return (
                <Box
                  key={card.id}
                  component={motion.div}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  sx={{
                    position: 'relative',
                    width: { xs: 56, md: 72 },
                    height: { xs: 80, md: 100 },
                    borderRadius: 2,
                    overflow: 'hidden',
                    border: `2px solid ${color}`,
                    cursor: 'pointer',
                    '&:hover .remove-badge': { opacity: 1 },
                  }}
                  onClick={() => removeCard(card.id)}
                >
                  {card.imageUrl ? (
                    <Image
                      src={card.imageUrl}
                      alt={card.name}
                      fill
                      sizes="72px"
                      style={{ objectFit: 'cover' }}
                      unoptimized
                    />
                  ) : (
                    <Box
                      sx={{
                        width: '100%',
                        height: '100%',
                        bgcolor: `${color}30`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      🃏
                    </Box>
                  )}
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      p: 0.25,
                      bgcolor: 'rgba(0,0,0,0.7)',
                      textAlign: 'center',
                    }}
                  >
                    <Typography
                      sx={{
                        color: 'white',
                        fontSize: '0.45rem',
                        fontWeight: 700,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {card.name}
                    </Typography>
                  </Box>
                  <Box
                    className="remove-badge"
                    sx={{
                      position: 'absolute',
                      top: 2,
                      right: 2,
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      bgcolor: 'rgba(239,68,68,0.9)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: { xs: 1, md: 0 },
                      transition: 'opacity 0.2s ease',
                    }}
                  >
                    <Close sx={{ fontSize: 12, color: 'white' }} />
                  </Box>
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 2,
                      left: 2,
                      fontSize: '0.5rem',
                    }}
                  >
                    {ELEMENT_EMOJI[card.element]}
                  </Box>
                </Box>
              );
            }

            // Empty slot
            return (
              <Box
                key={`empty-${i}`}
                sx={{
                  width: { xs: 56, md: 72 },
                  height: { xs: 80, md: 100 },
                  borderRadius: 2,
                  border: '2px dashed rgba(255,255,255,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Add sx={{ color: 'rgba(255,255,255,0.15)', fontSize: 20 }} />
              </Box>
            );
          })}
        </Box>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            size="small"
            startIcon={<Shuffle />}
            onClick={randomFill}
            disabled={selected.length >= 5}
            sx={{
              color: '#a78bfa',
              borderColor: 'rgba(139,92,246,0.3)',
              fontSize: '0.7rem',
              textTransform: 'none',
              '&:hover': { bgcolor: 'rgba(139,92,246,0.1)' },
            }}
            variant="outlined"
          >
            Remplir aléatoirement
          </Button>
          {selected.length > 0 && (
            <Button
              size="small"
              onClick={() => setSelected([])}
              sx={{
                color: 'rgba(255,255,255,0.4)',
                fontSize: '0.7rem',
                textTransform: 'none',
              }}
            >
              Vider
            </Button>
          )}
        </Box>
      </Box>

      {/* Difficulty */}
      <Box sx={{ mb: 3 }}>
        <Typography
          sx={{
            color: 'rgba(255,255,255,0.5)',
            fontSize: '0.7rem',
            mb: 1,
            fontWeight: 600,
          }}
        >
          Difficulté de l&apos;IA
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {(
            [
              {
                val: 'easy',
                label: '🟢 Facile',
                desc: 'Surtout des communes/rares',
              },
              { val: 'normal', label: '🟡 Normal', desc: 'Équilibrée' },
              {
                val: 'hard',
                label: '🔴 Difficile',
                desc: 'Légendaires & secrètes',
              },
            ] as const
          ).map((d) => (
            <Box
              key={d.val}
              onClick={() => setDifficulty(d.val)}
              sx={{
                flex: 1,
                p: 1.5,
                borderRadius: 2,
                cursor: 'pointer',
                bgcolor:
                  difficulty === d.val
                    ? 'rgba(139,92,246,0.15)'
                    : 'rgba(255,255,255,0.03)',
                border: `1px solid ${difficulty === d.val ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.06)'}`,
                textAlign: 'center',
                transition: 'all 0.2s ease',
                '&:hover': { bgcolor: 'rgba(139,92,246,0.1)' },
              }}
            >
              <Typography sx={{ fontSize: '0.8rem', mb: 0.25 }}>
                {d.label}
              </Typography>
              <Typography
                sx={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.55rem' }}
              >
                {d.desc}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Start button */}
      <Button
        fullWidth
        variant="contained"
        size="large"
        disabled={selected.length !== 5}
        startIcon={<PlayArrow />}
        onClick={() => onStartBattle(selected, difficulty)}
        sx={{
          bgcolor: selected.length === 5 ? '#8b5cf6' : 'rgba(255,255,255,0.05)',
          color: 'white',
          fontWeight: 800,
          borderRadius: 2,
          py: 1.5,
          fontSize: '0.95rem',
          textTransform: 'none',
          mb: 4,
          '&:hover': { bgcolor: '#7c3aed' },
          '&.Mui-disabled': {
            color: 'rgba(255,255,255,0.2)',
            bgcolor: 'rgba(255,255,255,0.03)',
          },
        }}
      >
        {selected.length === 5
          ? 'Lancer le combat !'
          : `Sélectionne ${5 - selected.length} carte${5 - selected.length > 1 ? 's' : ''} de plus`}
      </Button>

      {/* Card pool */}
      <Box sx={{ mb: 2 }}>
        <Typography
          fontWeight={700}
          sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', mb: 1.5 }}
        >
          Choisis tes cartes
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.75, mb: 2, flexWrap: 'wrap' }}>
          {[
            { val: 'ALL', label: 'Toutes' },
            { val: 'COMMON', label: '⚪' },
            { val: 'RARE', label: '🔵' },
            { val: 'EPIC', label: '🟣' },
            { val: 'LEGENDARY', label: '🟡' },
            { val: 'SECRET', label: '🔴' },
          ].map((f) => (
            <Chip
              key={f.val}
              label={f.label}
              size="small"
              onClick={() => setFilterRarity(f.val)}
              sx={{
                bgcolor:
                  filterRarity === f.val
                    ? 'rgba(139,92,246,0.2)'
                    : 'rgba(255,255,255,0.05)',
                color:
                  filterRarity === f.val ? '#a78bfa' : 'rgba(255,255,255,0.4)',
                fontWeight: 600,
                fontSize: '0.7rem',
                cursor: 'pointer',
                border:
                  filterRarity === f.val
                    ? '1px solid rgba(139,92,246,0.4)'
                    : '1px solid transparent',
              }}
            />
          ))}
        </Box>
      </Box>

      {/* Card grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(4, 1fr)',
            sm: 'repeat(5, 1fr)',
            md: 'repeat(6, 1fr)',
            lg: 'repeat(8, 1fr)',
          },
          gap: 1,
        }}
      >
        <AnimatePresence mode="popLayout">
          {filtered.map((card) => {
            const color = RARITY_COLORS[card.rarity] || '#6b7280';
            const totalPower = card.atk + card.def + card.spd + card.hp;
            return (
              <Box
                key={card.id}
                component={motion.div}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ scale: 1.05 }}
                onClick={() => addCard(card)}
                sx={{
                  position: 'relative',
                  aspectRatio: '2/3',
                  borderRadius: 2,
                  overflow: 'hidden',
                  border: `1.5px solid ${color}60`,
                  cursor: selected.length < 5 ? 'pointer' : 'default',
                  opacity: selected.length >= 5 ? 0.5 : 1,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: selected.length < 5 ? color : `${color}60`,
                    boxShadow:
                      selected.length < 5 ? `0 0 12px ${color}40` : 'none',
                  },
                }}
              >
                {card.imageUrl ? (
                  <Image
                    src={card.imageUrl}
                    alt={card.name}
                    fill
                    sizes="(max-width: 600px) 25vw, 12vw"
                    style={{ objectFit: 'cover' }}
                    unoptimized
                  />
                ) : (
                  <Box
                    sx={{
                      width: '100%',
                      height: '100%',
                      bgcolor: `${color}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                    }}
                  >
                    🃏
                  </Box>
                )}

                {/* Overlay info */}
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    p: 0.5,
                    background:
                      'linear-gradient(to top, rgba(0,0,0,0.85), transparent)',
                    pt: 3,
                  }}
                >
                  <Typography
                    sx={{
                      color: 'white',
                      fontSize: '0.5rem',
                      fontWeight: 700,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {card.name}
                  </Typography>
                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <Typography
                      sx={{
                        color: color,
                        fontSize: '0.45rem',
                        fontWeight: 600,
                      }}
                    >
                      {ELEMENT_EMOJI[card.element]} P:{totalPower}
                    </Typography>
                  </Box>
                </Box>

                {/* Rarity dot */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 3,
                    right: 3,
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: color,
                    boxShadow: `0 0 6px ${color}`,
                  }}
                />
              </Box>
            );
          })}
        </AnimatePresence>
      </Box>

      {filtered.length === 0 && (
        <Typography
          sx={{
            color: 'rgba(255,255,255,0.3)',
            textAlign: 'center',
            py: 4,
            fontSize: '0.85rem',
          }}
        >
          Aucune carte disponible
        </Typography>
      )}
    </Box>
  );
}
