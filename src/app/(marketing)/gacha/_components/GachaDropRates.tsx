'use client';

import { Casino, Help } from '@mui/icons-material';
import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';

const DROP_RATES = [
  {
    label: 'RATÉ',
    rate: 35,
    color: '#4b5563',
    emoji: '💨',
    desc: 'Pas de carte — mieux vaut réessayer !',
  },
  {
    label: 'Commune',
    rate: 30,
    color: '#9ca3af',
    emoji: '⚪',
    desc: '1 étoile · Revente : 5 🪙',
  },
  {
    label: 'Rare',
    rate: 20,
    color: '#3b82f6',
    emoji: '🔵',
    desc: '2 étoiles · Revente : 15 🪙',
  },
  {
    label: 'Épique',
    rate: 10,
    color: '#8b5cf6',
    emoji: '🟣',
    desc: '3 étoiles · Revente : 50 🪙',
  },
  {
    label: 'Légendaire',
    rate: 4,
    color: '#fbbf24',
    emoji: '🟡',
    desc: '4 étoiles · Revente : 150 🪙',
  },
  {
    label: 'Secrète',
    rate: 1,
    color: '#ef4444',
    emoji: '🔴',
    desc: '5 étoiles · Revente : 500 🪙',
  },
];

const DAILY_TIERS = [
  { weight: '60%', range: '80 — 120 🪙', color: '#9ca3af' },
  { weight: '25%', range: '150 — 200 🪙', color: '#3b82f6' },
  { weight: '10%', range: '250 — 350 🪙', color: '#8b5cf6' },
  { weight: '4%', range: '500 — 700 🪙 ⭐', color: '#fbbf24' },
  { weight: '1%', range: '1 000 — 1 500 🪙 💎', color: '#ef4444' },
];

const STREAK_BONUSES = [
  { days: 3, bonus: '+50 🪙' },
  { days: 7, bonus: '+150 🪙' },
  { days: 14, bonus: '+300 🪙' },
  { days: 30, bonus: '+750 🪙' },
];

export function GachaDropRates() {
  return (
    <Box sx={{ px: { xs: 2, md: 6 }, mb: 6 }}>
      <Typography
        variant="h5"
        fontWeight={800}
        sx={{
          color: 'white',
          mb: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Help sx={{ color: '#8b5cf6' }} />
        Guide & Taux de drop
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 3,
        }}
      >
        {/* Drop rates */}
        <Box
          component={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          sx={{
            p: 3,
            borderRadius: 3,
            bgcolor: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <Typography
            fontWeight={700}
            sx={{
              color: 'white',
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Casino sx={{ fontSize: 20, color: '#8b5cf6' }} />
            Taux de drop
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: 'rgba(255,255,255,0.4)', mb: 2, display: 'block' }}
          >
            Coût : 50 🪙 / pull · Multi ×10 : 450 🪙 (-10%)
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {DROP_RATES.map((rate) => (
              <Box
                key={rate.label}
                sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}
              >
                <Box
                  sx={{ width: 28, textAlign: 'center', fontSize: '0.9rem' }}
                >
                  {rate.emoji}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      mb: 0.25,
                    }}
                  >
                    <Typography
                      sx={{
                        color: rate.color,
                        fontSize: '0.75rem',
                        fontWeight: 700,
                      }}
                    >
                      {rate.label}
                    </Typography>
                    <Typography
                      sx={{
                        color: rate.color,
                        fontSize: '0.75rem',
                        fontWeight: 800,
                      }}
                    >
                      {rate.rate}%
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      bgcolor: 'rgba(255,255,255,0.06)',
                      overflow: 'hidden',
                    }}
                  >
                    <Box
                      component={motion.div}
                      initial={{ width: 0 }}
                      animate={{ width: `${rate.rate}%` }}
                      transition={{
                        delay: 0.3,
                        duration: 0.8,
                        ease: 'easeOut',
                      }}
                      sx={{
                        height: '100%',
                        borderRadius: 3,
                        bgcolor: rate.color,
                      }}
                    />
                  </Box>
                  <Typography
                    sx={{
                      color: 'rgba(255,255,255,0.35)',
                      fontSize: '0.6rem',
                      mt: 0.25,
                    }}
                  >
                    {rate.desc}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Daily & Streaks */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Daily tiers */}
          <Box
            component={motion.div}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            sx={{
              p: 3,
              borderRadius: 3,
              bgcolor: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <Typography fontWeight={700} sx={{ color: 'white', mb: 2 }}>
              💰 Récompenses quotidiennes
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: 'rgba(255,255,255,0.4)', mb: 2, display: 'block' }}
            >
              Commande : /gacha daily · Cooldown : 20h
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              {DAILY_TIERS.map((tier) => (
                <Box
                  key={tier.weight}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Typography
                    sx={{
                      color: tier.color,
                      fontSize: '0.75rem',
                      fontWeight: 700,
                    }}
                  >
                    {tier.weight}
                  </Typography>
                  <Typography
                    sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem' }}
                  >
                    {tier.range}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Streak bonuses */}
          <Box
            component={motion.div}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            sx={{
              p: 3,
              borderRadius: 3,
              bgcolor: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <Typography fontWeight={700} sx={{ color: 'white', mb: 2 }}>
              🔥 Bonus de série
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: 'rgba(255,255,255,0.4)', mb: 2, display: 'block' }}
            >
              Claim chaque jour pour maintenir ta série !
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              {STREAK_BONUSES.map((streak) => (
                <Box
                  key={streak.days}
                  sx={{
                    flex: '1 1 80px',
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: 'rgba(251,191,36,0.06)',
                    border: '1px solid rgba(251,191,36,0.15)',
                    textAlign: 'center',
                  }}
                >
                  <Typography
                    sx={{
                      color: '#fbbf24',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                    }}
                  >
                    {streak.days}j
                  </Typography>
                  <Typography
                    sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.65rem' }}
                  >
                    {streak.bonus}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Commands */}
          <Box
            component={motion.div}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            sx={{
              p: 3,
              borderRadius: 3,
              bgcolor: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <Typography fontWeight={700} sx={{ color: 'white', mb: 1.5 }}>
              ⌨️ Commandes Discord
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {[
                { cmd: '/gacha daily', desc: 'Réclamer ton argent quotidien' },
                { cmd: '/gacha gacha', desc: 'Tirer une carte (50 🪙)' },
                { cmd: '/gacha multi', desc: 'Tirer ×10 cartes (450 🪙)' },
                { cmd: '/gacha collection', desc: 'Voir ta collection' },
                { cmd: '/gacha duel @user', desc: 'Duel de cartes TCG' },
                { cmd: '/gacha vendre-tout', desc: 'Vendre tous les doublons' },
                { cmd: '/gacha classement', desc: 'Voir le classement' },
              ].map((item) => (
                <Box
                  key={item.cmd}
                  sx={{ display: 'flex', gap: 1, alignItems: 'baseline' }}
                >
                  <Typography
                    component="code"
                    sx={{
                      color: '#a78bfa',
                      fontSize: '0.7rem',
                      fontFamily: 'monospace',
                      bgcolor: 'rgba(139,92,246,0.1)',
                      px: 0.75,
                      py: 0.25,
                      borderRadius: 1,
                      flexShrink: 0,
                    }}
                  >
                    {item.cmd}
                  </Typography>
                  <Typography
                    sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}
                  >
                    {item.desc}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
