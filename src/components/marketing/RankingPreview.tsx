'use client';

import {
  EmojiEvents as TrophyIcon,
  CheckCircle as VerifiedIcon,
} from '@mui/icons-material';
import {
  Avatar,
  alpha,
  Box,
  Button,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { getInitials } from '@/lib/utils';

interface RankingPreviewProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rankings: any[];
}

export function RankingPreview({ rankings }: RankingPreviewProps) {
  const theme = useTheme();

  return (
    <Box sx={{ width: '100%' }}>
      <Stack spacing={1.5}>
        {rankings.map((profile, index) => {
          const rank = index + 1;
          const isTop3 = rank <= 3;
          const rankColor =
            rank === 1
              ? '#FFD700'
              : rank === 2
                ? '#C0C0C0'
                : rank === 3
                  ? '#CD7F32'
                  : 'transparent';

          return (
            <motion.div
              key={profile.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Box
                component={Link}
                href={`/profile/${profile.userId}`}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  p: 1.5,
                  borderRadius: 3,
                  bgcolor: alpha(theme.palette.background.paper, 0.4),
                  border: '1px solid',
                  borderColor: isTop3 ? alpha(rankColor, 0.3) : 'divider',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                    borderColor: theme.palette.primary.main,
                    transform: 'translateX(8px)',
                  },
                }}
              >
                {/* Rank Badge */}
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    bgcolor: isTop3 ? rankColor : 'action.selected',
                    color: rank === 1 ? 'black' : 'text.primary',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: '0.9rem',
                    flexShrink: 0,
                    boxShadow: isTop3
                      ? `0 0 12px ${alpha(rankColor, 0.4)}`
                      : 'none',
                  }}
                >
                  {rank}
                </Box>

                <Avatar
                  src={profile.user.image || undefined}
                  alt={profile.bladerName || profile.user.name || 'Joueur'}
                  sx={{ width: 40, height: 40, border: '2px solid white' }}
                >
                  {getInitials(profile.bladerName || profile.user.name)}
                </Avatar>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="body2" fontWeight={800} noWrap>
                      {profile.bladerName ||
                        profile.user.name ||
                        profile.challongeUsername}
                    </Typography>
                    {profile.challongeUsername && (
                      <VerifiedIcon
                        sx={{
                          fontSize: '0.8rem',
                          color: 'info.main',
                          opacity: 0.7,
                        }}
                      />
                    )}
                    {profile.tournamentWins > 0 && (
                      <TrophyIcon
                        sx={{
                          fontSize: '0.9rem',
                          color: '#FFD700',
                          filter: 'drop-shadow(0 0 1px rgba(255, 215, 0, 0.4))',
                        }}
                      />
                    )}
                  </Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block' }}
                  >
                    {profile.favoriteType || 'Standard'}
                  </Typography>
                </Box>

                <Box sx={{ textAlign: 'right' }}>
                  <Typography
                    variant="subtitle2"
                    fontWeight={900}
                    color="primary.main"
                  >
                    {profile.rankingPoints}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ fontSize: '0.6rem', opacity: 0.7 }}
                  >
                    PTS
                  </Typography>
                </Box>
              </Box>
            </motion.div>
          );
        })}
      </Stack>

      <Button
        component={Link}
        href="/rankings"
        fullWidth
        variant="outlined"
        sx={{
          mt: 3,
          borderRadius: 3,
          fontWeight: 800,
          borderColor: alpha(theme.palette.divider, 0.1),
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor: alpha(theme.palette.primary.main, 0.05),
          },
        }}
      >
        Voir tout le classement
      </Button>
    </Box>
  );
}
