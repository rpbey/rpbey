'use client';

import {
  Favorite,
  FitnessCenter,
  FlashOn,
  LocalFireDepartment,
  Speed,
} from '@mui/icons-material';
import { Box, LinearProgress, Typography } from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  fireCriticalConfetti,
  fireKOConfetti,
  fireVictoryConfetti,
} from './confetti';
import type { BattleCard, BattleEvent, BattleResult } from './engine';

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

const EVENT_COLORS: Record<string, string> = {
  critical: '#fbbf24',
  special_move: '#ef4444',
  defeated: '#ef4444',
  switch: '#3b82f6',
  dodge: '#22c55e',
  element_bonus: '#a78bfa',
  element_weak: '#f97316',
  combo: '#06b6d4',
  attack: 'rgba(255,255,255,0.5)',
};

interface BattleArenaProps {
  result: BattleResult;
  onFinish: () => void;
}

export function BattleArena({ result, onFinish }: BattleArenaProps) {
  const [currentEventIdx, setCurrentEventIdx] = useState(-1);
  const [isFinished, setIsFinished] = useState(false);
  const [speed, setSpeed] = useState<1 | 2 | 4>(1);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Use maxHp directly from cards
  const [team1Hp, setTeam1Hp] = useState(
    result.team1.cards.map((c) => c.maxHp),
  );
  const [team2Hp, setTeam2Hp] = useState(
    result.team2.cards.map((c) => c.maxHp),
  );
  const maxHp1 = result.team1.cards.map((c) => c.maxHp);
  const maxHp2 = result.team2.cards.map((c) => c.maxHp);

  const [active1, setActive1] = useState(0);
  const [active2, setActive2] = useState(0);
  const [defeated1, setDefeated1] = useState<Set<number>>(new Set());
  const [defeated2, setDefeated2] = useState<Set<number>>(new Set());
  const [currentEvent, setCurrentEvent] = useState<BattleEvent | null>(null);
  const [shakeLeft, setShakeLeft] = useState(false);
  const [shakeRight, setShakeRight] = useState(false);

  const processEventRef = useRef<(idx: number) => void>(undefined);

  const processEvent = useCallback(
    (idx: number) => {
      if (idx >= result.events.length) {
        setIsFinished(true);
        fireVictoryConfetti();
        return;
      }

      const event = result.events[idx]!;
      setCurrentEvent(event);

      const isTeam1Defender = result.team1.cards.some(
        (c) => c.name === event.defender,
      );
      const isTeam2Defender = result.team2.cards.some(
        (c) => c.name === event.defender,
      );

      const isDamageEvent =
        event.type === 'attack' ||
        event.type === 'critical' ||
        event.type === 'special_move';

      if (isDamageEvent) {
        if (isTeam1Defender) {
          const cardIdx = result.team1.cards.findIndex(
            (c) => c.name === event.defender,
          );
          if (cardIdx >= 0) {
            setTeam1Hp((prev) => {
              const next = [...prev];
              next[cardIdx] = Math.max(0, event.remainingHp);
              return next;
            });
            setShakeLeft(true);
            setTimeout(() => setShakeLeft(false), 300);
          }
        } else if (isTeam2Defender) {
          const cardIdx = result.team2.cards.findIndex(
            (c) => c.name === event.defender,
          );
          if (cardIdx >= 0) {
            setTeam2Hp((prev) => {
              const next = [...prev];
              next[cardIdx] = Math.max(0, event.remainingHp);
              return next;
            });
            setShakeRight(true);
            setTimeout(() => setShakeRight(false), 300);
          }
        }
      }

      if (event.type === 'critical' || event.type === 'special_move') {
        fireCriticalConfetti();
      }

      if (event.type === 'defeated') {
        fireKOConfetti();
        if (isTeam1Defender) {
          const cardIdx = result.team1.cards.findIndex(
            (c) => c.name === event.defender,
          );
          if (cardIdx >= 0) setDefeated1((prev) => new Set(prev).add(cardIdx));
        } else if (isTeam2Defender) {
          const cardIdx = result.team2.cards.findIndex(
            (c) => c.name === event.defender,
          );
          if (cardIdx >= 0) setDefeated2((prev) => new Set(prev).add(cardIdx));
        }
      }

      if (event.type === 'switch') {
        if (result.team1.cards.some((c) => c.name === event.defender)) {
          const newIdx = result.team1.cards.findIndex(
            (c) => c.name === event.defender,
          );
          if (newIdx >= 0) setActive1(newIdx);
        } else {
          const newIdx = result.team2.cards.findIndex(
            (c) => c.name === event.defender,
          );
          if (newIdx >= 0) setActive2(newIdx);
        }
      }

      setCurrentEventIdx(idx);
      timerRef.current = setTimeout(
        () => processEventRef.current?.(idx + 1),
        isDamageEvent ? 800 / speed : 400 / speed,
      );
    },
    [result, speed],
  );

  useEffect(() => {
    processEventRef.current = processEvent;
  }, [processEvent]);

  useEffect(() => {
    timerRef.current = setTimeout(() => processEventRef.current?.(0), 1000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const skipToEnd = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    result.team1.cards.forEach((c, i) => {
      setTeam1Hp((prev) => {
        const n = [...prev];
        n[i] = c.currentHp;
        return n;
      });
      if (c.isDefeated) setDefeated1((prev) => new Set(prev).add(i));
    });
    result.team2.cards.forEach((c, i) => {
      setTeam2Hp((prev) => {
        const n = [...prev];
        n[i] = c.currentHp;
        return n;
      });
      if (c.isDefeated) setDefeated2((prev) => new Set(prev).add(i));
    });
    setCurrentEventIdx(result.events.length - 1);
    setIsFinished(true);
    fireVictoryConfetti();
  };

  const renderTeamSlots = (
    cards: BattleCard[],
    hpArr: number[],
    maxHpArr: number[],
    activeIdx: number,
    defeatedSet: Set<number>,
    side: 'left' | 'right',
    shake: boolean,
  ) => (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        flex: 1,
        maxWidth: { xs: '45%', md: 380 },
      }}
    >
      {cards.map((card, i) => {
        const isActive = i === activeIdx && !defeatedSet.has(i);
        const isDead = defeatedSet.has(i);
        const hp = hpArr[i] ?? 0;
        const max = maxHpArr[i] ?? 1;
        const hpPct = Math.round((hp / max) * 100);
        const rarityColor = RARITY_COLORS[card.rarity] || '#6b7280';

        return (
          <Box
            key={card.id}
            component={motion.div}
            animate={
              isActive && shake ? { x: [0, side === 'left' ? -6 : 6, 0] } : {}
            }
            transition={{ duration: 0.15 }}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              p: 1,
              borderRadius: 2,
              bgcolor: isDead
                ? 'rgba(255,255,255,0.02)'
                : isActive
                  ? `${rarityColor}15`
                  : 'rgba(255,255,255,0.03)',
              border: `1px solid ${isActive ? `${rarityColor}50` : isDead ? 'rgba(255,0,0,0.2)' : 'rgba(255,255,255,0.06)'}`,
              opacity: isDead ? 0.4 : 1,
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Card image */}
            <Box
              sx={{
                width: { xs: 36, md: 44 },
                height: { xs: 36, md: 44 },
                borderRadius: 1.5,
                overflow: 'hidden',
                flexShrink: 0,
                position: 'relative',
                border: `2px solid ${rarityColor}${isActive ? '' : '40'}`,
              }}
            >
              {card.imageUrl ? (
                <Image
                  src={card.imageUrl}
                  alt={card.name}
                  fill
                  sizes="44px"
                  style={{ objectFit: 'cover' }}
                  unoptimized
                />
              ) : (
                <Box
                  sx={{
                    width: '100%',
                    height: '100%',
                    bgcolor: `${rarityColor}30`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.8rem',
                  }}
                >
                  🃏
                </Box>
              )}
              {isDead && (
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    bgcolor: 'rgba(0,0,0,0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1rem',
                  }}
                >
                  💀
                </Box>
              )}
            </Box>

            {/* Info */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography
                  sx={{
                    color: isDead ? 'rgba(255,255,255,0.3)' : 'white',
                    fontWeight: isActive ? 800 : 600,
                    fontSize: { xs: '0.6rem', md: '0.7rem' },
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {ELEMENT_EMOJI[card.element] || '⚡'} {card.name}
                </Typography>
                <Typography
                  sx={{
                    color: isDead
                      ? 'rgba(255,0,0,0.5)'
                      : hpPct < 25
                        ? '#ef4444'
                        : hpPct < 50
                          ? '#fbbf24'
                          : '#22c55e',
                    fontSize: '0.55rem',
                    fontWeight: 700,
                    flexShrink: 0,
                    ml: 0.5,
                  }}
                >
                  {isDead ? 'K.O.' : `${hp}/${max}`}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={isDead ? 0 : hpPct}
                sx={{
                  height: 4,
                  borderRadius: 2,
                  mt: 0.5,
                  bgcolor: 'rgba(255,255,255,0.06)',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 2,
                    bgcolor: isDead
                      ? '#ef4444'
                      : hpPct < 25
                        ? '#ef4444'
                        : hpPct < 50
                          ? '#fbbf24'
                          : '#22c55e',
                    transition: 'transform 0.5s ease',
                  },
                }}
              />
              {/* Mini stats for active card */}
              {isActive && !isDead && (
                <Box sx={{ display: 'flex', gap: 0.75, mt: 0.5 }}>
                  {[
                    {
                      icon: (
                        <FitnessCenter sx={{ fontSize: 8, color: '#ef4444' }} />
                      ),
                      val: card.atk,
                    },
                    {
                      icon: <Favorite sx={{ fontSize: 8, color: '#3b82f6' }} />,
                      val: card.def,
                    },
                    {
                      icon: <Speed sx={{ fontSize: 8, color: '#22c55e' }} />,
                      val: card.spd,
                    },
                    {
                      icon: <FlashOn sx={{ fontSize: 8, color: '#fbbf24' }} />,
                      val: card.hp,
                    },
                  ].map((s, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.25,
                        fontSize: '0.5rem',
                        color: 'rgba(255,255,255,0.4)',
                      }}
                    >
                      {s.icon}
                      {s.val}
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        );
      })}
    </Box>
  );

  return (
    <Box sx={{ px: { xs: 1, md: 4 }, py: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography
          variant="h6"
          fontWeight={800}
          sx={{ color: 'white', fontSize: { xs: '0.9rem', md: '1.1rem' } }}
        >
          ⚔️ Combat 5v5
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {[1, 2, 4].map((s) => (
            <Box
              key={s}
              onClick={() => setSpeed(s as 1 | 2 | 4)}
              sx={{
                px: 1,
                py: 0.25,
                borderRadius: 1,
                cursor: 'pointer',
                bgcolor:
                  speed === s
                    ? 'rgba(139,92,246,0.3)'
                    : 'rgba(255,255,255,0.05)',
                color: speed === s ? '#a78bfa' : 'rgba(255,255,255,0.4)',
                fontSize: '0.65rem',
                fontWeight: 700,
                border: `1px solid ${speed === s ? 'rgba(139,92,246,0.4)' : 'transparent'}`,
              }}
            >
              ×{s}
            </Box>
          ))}
          {!isFinished && (
            <Box
              onClick={skipToEnd}
              sx={{
                px: 1,
                py: 0.25,
                borderRadius: 1,
                cursor: 'pointer',
                bgcolor: 'rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.4)',
                fontSize: '0.65rem',
                fontWeight: 700,
                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
              }}
            >
              Skip ⏭
            </Box>
          )}
        </Box>
      </Box>

      {/* Teams */}
      <Box
        sx={{
          display: 'flex',
          gap: { xs: 1, md: 3 },
          justifyContent: 'center',
          mb: 3,
        }}
      >
        <Box sx={{ flex: 1, maxWidth: { xs: '45%', md: 380 } }}>
          <Typography
            sx={{
              color:
                isFinished && result.winner === 'team1'
                  ? '#22c55e'
                  : 'rgba(255,255,255,0.6)',
              fontWeight: 700,
              fontSize: '0.75rem',
              mb: 1,
              textAlign: 'center',
            }}
          >
            {isFinished && result.winner === 'team1' && '👑 '}
            {result.team1.name}
          </Typography>
          {renderTeamSlots(
            result.team1.cards,
            team1Hp,
            maxHp1,
            active1,
            defeated1,
            'left',
            shakeLeft,
          )}
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            px: { xs: 0.5, md: 2 },
          }}
        >
          <Typography
            component={motion.div}
            animate={
              !isFinished ? { scale: [1, 1.1, 1], opacity: [0.6, 1, 0.6] } : {}
            }
            transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2 }}
            sx={{
              color: '#ef4444',
              fontWeight: 900,
              fontSize: { xs: '1.2rem', md: '1.8rem' },
              textShadow: '0 0 20px rgba(239,68,68,0.5)',
            }}
          >
            VS
          </Typography>
          {currentEvent && !isFinished && (
            <Typography
              sx={{
                color: 'rgba(255,255,255,0.4)',
                fontSize: '0.55rem',
                mt: 0.5,
              }}
            >
              R{currentEvent.round}
            </Typography>
          )}
        </Box>

        <Box sx={{ flex: 1, maxWidth: { xs: '45%', md: 380 } }}>
          <Typography
            sx={{
              color:
                isFinished && result.winner === 'team2'
                  ? '#22c55e'
                  : 'rgba(255,255,255,0.6)',
              fontWeight: 700,
              fontSize: '0.75rem',
              mb: 1,
              textAlign: 'center',
            }}
          >
            {isFinished && result.winner === 'team2' && '👑 '}
            {result.team2.name}
          </Typography>
          {renderTeamSlots(
            result.team2.cards,
            team2Hp,
            maxHp2,
            active2,
            defeated2,
            'right',
            shakeRight,
          )}
        </Box>
      </Box>

      {/* Battle log */}
      <Box
        sx={{
          p: 2,
          borderRadius: 2,
          bgcolor: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          maxHeight: 220,
          overflowY: 'auto',
          mb: 3,
          '&::-webkit-scrollbar': { width: 4 },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: 'rgba(255,255,255,0.1)',
            borderRadius: 2,
          },
        }}
      >
        <AnimatePresence mode="popLayout">
          {result.events
            .slice(0, currentEventIdx + 1)
            .reverse()
            .slice(0, 20)
            .map((event, i) => (
              <Box
                key={`${event.round}-${event.type}-${event.attacker}-${i}`}
                component={motion.div}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                sx={{ py: 0.25 }}
              >
                <Typography
                  sx={{
                    color: EVENT_COLORS[event.type] || 'rgba(255,255,255,0.5)',
                    fontSize: '0.65rem',
                  }}
                >
                  <Box
                    component="span"
                    sx={{
                      color: 'rgba(255,255,255,0.2)',
                      mr: 0.75,
                      fontSize: '0.55rem',
                    }}
                  >
                    R{event.round}
                  </Box>
                  {event.message}
                </Typography>
              </Box>
            ))}
        </AnimatePresence>
        {currentEventIdx < 0 && (
          <Typography
            sx={{
              color: 'rgba(255,255,255,0.3)',
              fontSize: '0.7rem',
              textAlign: 'center',
            }}
          >
            Le combat commence...
          </Typography>
        )}
      </Box>

      {/* Result banner */}
      <AnimatePresence>
        {isFinished && (
          <Box
            component={motion.div}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          >
            <Box
              sx={{
                p: 3,
                borderRadius: 3,
                bgcolor:
                  result.winner === 'draw'
                    ? 'rgba(251,191,36,0.1)'
                    : 'rgba(34,197,94,0.1)',
                border: `1px solid ${result.winner === 'draw' ? 'rgba(251,191,36,0.3)' : 'rgba(34,197,94,0.3)'}`,
                textAlign: 'center',
                mb: 2,
              }}
            >
              <Typography
                variant="h5"
                fontWeight={900}
                sx={{
                  color: result.winner === 'draw' ? '#fbbf24' : '#22c55e',
                  mb: 1,
                }}
              >
                {result.winner === 'draw' ? '🤝 Égalité !' : '🏆 Victoire !'}
              </Typography>
              <Typography
                sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}
              >
                {result.finishMessage}
              </Typography>
              <Typography
                sx={{
                  color: 'rgba(255,255,255,0.4)',
                  fontSize: '0.7rem',
                  mt: 1,
                }}
              >
                {result.totalRounds} rounds · MVP : {result.mvp.name} (
                {result.mvp.kills} K.O., {result.mvp.totalDamage} dégâts)
              </Typography>
            </Box>

            <Box
              onClick={onFinish}
              sx={{
                textAlign: 'center',
                p: 1.5,
                borderRadius: 2,
                bgcolor: 'rgba(139,92,246,0.15)',
                border: '1px solid rgba(139,92,246,0.3)',
                color: '#a78bfa',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: 'rgba(139,92,246,0.25)',
                  transform: 'scale(1.02)',
                },
              }}
            >
              <LocalFireDepartment
                sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }}
              />
              Nouveau combat
            </Box>
          </Box>
        )}
      </AnimatePresence>
    </Box>
  );
}
