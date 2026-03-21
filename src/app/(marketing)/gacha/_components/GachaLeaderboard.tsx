'use client';

import { Avatar, Box, LinearProgress, Typography } from '@mui/material';
import { motion } from 'framer-motion';

interface LeaderboardEntry {
  userId: string;
  name: string;
  image: string | null | undefined;
  discordId: string | null | undefined;
  uniqueCards: number;
  totalCards: number;
  currency: number;
  completionPct: number;
}

const RANK_STYLES = [
  {
    color: '#ffd700',
    bgcolor: 'rgba(255,215,0,0.1)',
    border: 'rgba(255,215,0,0.3)',
    emoji: '🥇',
  },
  {
    color: '#c0c0c0',
    bgcolor: 'rgba(192,192,192,0.08)',
    border: 'rgba(192,192,192,0.2)',
    emoji: '🥈',
  },
  {
    color: '#cd7f32',
    bgcolor: 'rgba(205,127,50,0.08)',
    border: 'rgba(205,127,50,0.2)',
    emoji: '🥉',
  },
];

interface GachaLeaderboardProps {
  entries: LeaderboardEntry[];
}

export function GachaLeaderboard({ entries }: GachaLeaderboardProps) {
  if (entries.length === 0) return null;

  return (
    <Box id="classement" sx={{ px: { xs: 2, md: 6 }, mb: 6 }}>
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
        Classement
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {entries.map((entry, i) => {
          const rankStyle = i < 3 ? RANK_STYLES[i] : null;

          return (
            <Box
              key={entry.userId}
              component={motion.div}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 2,
                borderRadius: 3,
                bgcolor: rankStyle?.bgcolor || 'rgba(255,255,255,0.02)',
                border: `1px solid ${rankStyle?.border || 'rgba(255,255,255,0.05)'}`,
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: rankStyle
                    ? `${rankStyle.bgcolor}`
                    : 'rgba(255,255,255,0.04)',
                  transform: 'translateX(4px)',
                },
              }}
            >
              {/* Rank */}
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: rankStyle
                    ? `${rankStyle.color}15`
                    : 'rgba(255,255,255,0.05)',
                  flexShrink: 0,
                }}
              >
                {rankStyle ? (
                  <Typography sx={{ fontSize: '1.1rem' }}>
                    {rankStyle.emoji}
                  </Typography>
                ) : (
                  <Typography
                    sx={{
                      color: 'rgba(255,255,255,0.4)',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                    }}
                  >
                    {i + 1}
                  </Typography>
                )}
              </Box>

              {/* Avatar */}
              <Avatar
                src={entry.image || undefined}
                sx={{
                  width: 40,
                  height: 40,
                  border: rankStyle
                    ? `2px solid ${rankStyle.color}40`
                    : '2px solid rgba(255,255,255,0.1)',
                  flexShrink: 0,
                }}
              />

              {/* Info */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  fontWeight={700}
                  sx={{
                    color: rankStyle?.color || 'white',
                    fontSize: '0.85rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {entry.name}
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mt: 0.5,
                  }}
                >
                  <LinearProgress
                    variant="determinate"
                    value={entry.completionPct}
                    sx={{
                      flex: 1,
                      height: 4,
                      borderRadius: 2,
                      bgcolor: 'rgba(255,255,255,0.06)',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 2,
                        bgcolor: rankStyle?.color || '#8b5cf6',
                      },
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'rgba(255,255,255,0.4)',
                      fontSize: '0.65rem',
                      flexShrink: 0,
                    }}
                  >
                    {entry.completionPct}%
                  </Typography>
                </Box>
              </Box>

              {/* Stats */}
              <Box sx={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography
                    fontWeight={800}
                    sx={{ color: 'white', fontSize: '0.9rem' }}
                  >
                    {entry.uniqueCards}
                  </Typography>
                  <Typography
                    sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.55rem' }}
                  >
                    uniques
                  </Typography>
                </Box>
                <Box
                  sx={{
                    textAlign: 'center',
                    display: { xs: 'none', sm: 'block' },
                  }}
                >
                  <Typography
                    fontWeight={800}
                    sx={{ color: '#fbbf24', fontSize: '0.9rem' }}
                  >
                    {entry.currency.toLocaleString('fr-FR')}
                  </Typography>
                  <Typography
                    sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.55rem' }}
                  >
                    🪙
                  </Typography>
                </Box>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
