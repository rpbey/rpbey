'use client';

import {
  Box,
  CircularProgress,
  LinearProgress,
  Typography,
} from '@mui/material';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { getUserGachaProfile } from '@/server/actions/gacha';
import { GachaCardDisplay } from './GachaCardDisplay';

const RARITY_ORDER = ['SECRET', 'LEGENDARY', 'EPIC', 'RARE', 'COMMON'];

const BADGES = [
  { threshold: 5, label: '🥉 Débutant', color: '#cd7f32' },
  { threshold: 10, label: '🥈 Collectionneur', color: '#c0c0c0' },
  { threshold: 15, label: '🥇 Expert', color: '#ffd700' },
  { threshold: 20, label: '🏆 Maître', color: '#e5cc80' },
  { threshold: 25, label: '👑 Champion', color: '#ff6b35' },
  { threshold: 31, label: '⭐ Légende', color: '#ef4444' },
];

type UserProfile = Awaited<ReturnType<typeof getUserGachaProfile>>;

export function GachaCollection() {
  const [profile, setProfile] = useState<UserProfile>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserGachaProfile().then((data) => {
      setProfile(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={32} sx={{ color: '#dc2626' }} />
      </Box>
    );
  }

  if (!profile || profile.inventory.length === 0) return null;

  const currentBadge = BADGES.filter(
    (b) => profile.uniqueCards >= b.threshold,
  ).pop();
  const nextBadge = BADGES.find((b) => profile.uniqueCards < b.threshold);

  // Sort inventory by rarity order
  const sortedInventory = [...profile.inventory].sort((a, b) => {
    const aIdx = RARITY_ORDER.indexOf(a.rarity);
    const bIdx = RARITY_ORDER.indexOf(b.rarity);
    return aIdx - bIdx;
  });

  return (
    <Box sx={{ px: { xs: 2, md: 6 }, mb: 6 }}>
      {/* Header */}
      <Box
        component={motion.div}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        sx={{
          p: 3,
          borderRadius: 3,
          bgcolor: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          mb: 3,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box>
            <Typography
              variant="h6"
              fontWeight={800}
              sx={{
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              Ma collection
              {currentBadge && (
                <Box
                  component="span"
                  sx={{
                    fontSize: '0.7rem',
                    px: 1,
                    py: 0.25,
                    borderRadius: 1,
                    bgcolor: `${currentBadge.color}20`,
                    color: currentBadge.color,
                    fontWeight: 700,
                  }}
                >
                  {currentBadge.label}
                </Box>
              )}
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: 'rgba(255,255,255,0.5)', mt: 0.5 }}
            >
              {profile.uniqueCards} / {profile.totalCards} cartes · 💰{' '}
              {profile.currency.toLocaleString('fr-FR')} 🪙
              {profile.dailyStreak > 0 && ` · 🔥 ${profile.dailyStreak} jours`}
            </Typography>
          </Box>

          {/* Rarity breakdown */}
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            {Object.entries(profile.byRarity)
              .sort(
                ([a], [b]) => RARITY_ORDER.indexOf(a) - RARITY_ORDER.indexOf(b),
              )
              .map(([rarity, count]) => {
                const colors: Record<string, string> = {
                  SECRET: '#ef4444',
                  LEGENDARY: '#fbbf24',
                  EPIC: '#8b5cf6',
                  RARE: '#3b82f6',
                  COMMON: '#9ca3af',
                };
                return (
                  <Box key={rarity} sx={{ textAlign: 'center' }}>
                    <Typography
                      sx={{
                        color: colors[rarity] || '#fff',
                        fontWeight: 800,
                        fontSize: '1rem',
                      }}
                    >
                      {count}
                    </Typography>
                    <Typography
                      sx={{
                        color: 'rgba(255,255,255,0.4)',
                        fontSize: '0.55rem',
                        textTransform: 'uppercase',
                      }}
                    >
                      {rarity.slice(0, 3)}
                    </Typography>
                  </Box>
                );
              })}
          </Box>
        </Box>

        {/* Progress bar */}
        <Box sx={{ mt: 2 }}>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}
          >
            <Typography
              variant="caption"
              sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem' }}
            >
              Progression : {profile.completionPct}%
            </Typography>
            {nextBadge && (
              <Typography
                variant="caption"
                sx={{ color: nextBadge.color, fontSize: '0.65rem' }}
              >
                Prochain : {nextBadge.label} (
                {nextBadge.threshold - profile.uniqueCards} restante
                {nextBadge.threshold - profile.uniqueCards > 1 ? 's' : ''})
              </Typography>
            )}
          </Box>
          <LinearProgress
            variant="determinate"
            value={profile.completionPct}
            sx={{
              height: 6,
              borderRadius: 3,
              bgcolor: 'rgba(255,255,255,0.08)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 3,
                background: 'linear-gradient(90deg, #dc2626, #ef4444)',
              },
            }}
          />
        </Box>
      </Box>

      {/* Collection grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(2, 1fr)',
            sm: 'repeat(3, 1fr)',
            md: 'repeat(5, 1fr)',
            lg: 'repeat(6, 1fr)',
          },
          gap: { xs: 1, md: 2 },
        }}
      >
        {sortedInventory.map((card, i) => (
          <Box
            key={card.id}
            component={motion.div}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.03, 0.6) }}
          >
            <GachaCardDisplay card={card as any} owned={card.count} />
          </Box>
        ))}
      </Box>
    </Box>
  );
}
