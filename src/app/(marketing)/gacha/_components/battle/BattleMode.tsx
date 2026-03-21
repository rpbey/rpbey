'use client';

import { ArrowBack } from '@mui/icons-material';
import { Box, CircularProgress, IconButton, Typography } from '@mui/material';
import type { GachaCard } from '@prisma/client';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { getUserGachaProfile } from '@/server/actions/gacha';
import { BattleArena } from './BattleArena';
import {
  type BattleResult,
  type BattleTeam,
  generateAITeam,
  prepareBattleCard,
  simulateBattle,
} from './engine';
import { TeamBuilder } from './TeamBuilder';

interface BattleModeProps {
  allCards: GachaCard[];
}

type Phase = 'setup' | 'battle' | 'loading';

export function BattleMode({ allCards }: BattleModeProps) {
  const [phase, setPhase] = useState<Phase>('setup');
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  const [userCards, setUserCards] = useState<GachaCard[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserGachaProfile().then((profile) => {
      if (profile && profile.inventory.length > 0) {
        setUserCards(profile.inventory as unknown as GachaCard[]);
      }
      setLoading(false);
    });
  }, []);

  // Cards available for selection: user's collection or all cards
  const availableCards = useMemo(() => {
    if (userCards && userCards.length >= 5) return userCards;
    return allCards;
  }, [userCards, allCards]);

  const isUsingOwnCards = userCards !== null && userCards.length >= 5;

  const handleStartBattle = (
    team: GachaCard[],
    difficulty: 'easy' | 'normal' | 'hard',
  ) => {
    setPhase('loading');

    // Prepare teams
    const playerCards = team.map(prepareBattleCard);
    const aiPool = allCards.map(prepareBattleCard);
    const aiCards = generateAITeam(aiPool, difficulty);

    const team1: BattleTeam = {
      name: isUsingOwnCards ? 'Mon équipe' : 'Équipe 1',
      cards: playerCards,
      activeIndex: 0,
    };

    const team2: BattleTeam = {
      name: `IA (${difficulty === 'easy' ? 'Facile' : difficulty === 'normal' ? 'Normal' : 'Difficile'})`,
      cards: aiCards,
      activeIndex: 0,
    };

    // Run simulation
    const result = simulateBattle(team1, team2);
    setBattleResult(result);

    setTimeout(() => setPhase('battle'), 500);
  };

  const handleNewBattle = () => {
    setBattleResult(null);
    setPhase('setup');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress size={32} sx={{ color: '#8b5cf6' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ px: { xs: 2, md: 6 }, py: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        {phase === 'battle' && (
          <IconButton
            onClick={handleNewBattle}
            sx={{ color: 'rgba(255,255,255,0.5)' }}
          >
            <ArrowBack />
          </IconButton>
        )}
        <Box>
          <Typography
            variant="h5"
            fontWeight={900}
            sx={{
              color: 'white',
              background: 'linear-gradient(135deg, #ef4444, #fbbf24)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            ⚔️ Arène TCG 5v5
          </Typography>
          <Typography
            sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}
          >
            {isUsingOwnCards
              ? 'Compose ton équipe avec ta collection'
              : 'Mode libre — toutes les cartes sont disponibles'}
          </Typography>
        </Box>
      </Box>

      {/* Phase content */}
      <AnimatePresence mode="wait">
        {phase === 'setup' && (
          <Box
            key="setup"
            component={motion.div}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <TeamBuilder
              availableCards={availableCards}
              onStartBattle={handleStartBattle}
            />
          </Box>
        )}

        {phase === 'loading' && (
          <Box
            key="loading"
            component={motion.div}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              py: 8,
              gap: 2,
            }}
          >
            <CircularProgress size={48} sx={{ color: '#ef4444' }} />
            <Typography
              component={motion.div}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{
                repeat: Number.POSITIVE_INFINITY,
                duration: 1.5,
              }}
              sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}
            >
              Préparation du combat...
            </Typography>
          </Box>
        )}

        {phase === 'battle' && battleResult && (
          <Box
            key="battle"
            component={motion.div}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <BattleArena result={battleResult} onFinish={handleNewBattle} />
          </Box>
        )}
      </AnimatePresence>
    </Box>
  );
}
