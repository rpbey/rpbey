'use client';

import VerifiedIcon from '@mui/icons-material/CheckCircle';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import {
  Avatar,
  alpha,
  Box,
  Card,
  CardContent,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { getInitials } from '@/lib/utils';

interface TopRankingsPodiumProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  topProfiles: any[];
}

export default function TopRankingsPodium({
  topProfiles,
}: TopRankingsPodiumProps) {
  const theme = useTheme();

  if (!topProfiles || topProfiles.length === 0) return null;

  // Sort profiles to ensure order is 2, 1, 3 for the podium visual
  const podiumOrder = [];
  if (topProfiles[1]) podiumOrder.push({ ...topProfiles[1], rank: 2 });
  if (topProfiles[0]) podiumOrder.push({ ...topProfiles[0], rank: 1 });
  if (topProfiles[2]) podiumOrder.push({ ...topProfiles[2], rank: 3 });

  const getRankColor = (rank: number) => {
    if (rank === 1) return '#FFD700'; // Gold
    if (rank === 2) return '#C0C0C0'; // Silver
    if (rank === 3) return '#CD7F32'; // Bronze
    return theme.palette.text.primary;
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        alignItems: { xs: 'stretch', md: 'flex-end' },
        justifyContent: 'center',
        gap: { xs: 1.5, md: 2 },
        mb: { xs: 4, md: 8 },
        mt: { xs: 2, md: 4 },
        perspective: '1000px',
      }}
    >
      {podiumOrder.map((profile, index) => {
        const isFirst = profile.rank === 1;
        const rankColor = getRankColor(profile.rank);

        return (
          <motion.div
            key={profile.id}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.2, duration: 0.5 }}
            style={{ width: '100%' }}
          >
            <Card
              component={Link}
              href={`/profile/${profile.userId}`}
              sx={{
                position: 'relative',
                overflow: 'visible',
                bgcolor: alpha(theme.palette.background.paper, 0.6),
                backdropFilter: 'blur(10px)',
                border: '2px solid',
                borderColor: alpha(rankColor, 0.5),
                borderRadius: { xs: 3, md: 5 },
                textDecoration: 'none',
                height: {
                  xs: isFirst ? 100 : 80,
                  md: isFirst ? 280 : 240,
                },
                display: 'flex',
                flexDirection: { xs: 'row', md: 'column' },
                alignItems: 'center',
                justifyContent: { xs: 'flex-start', md: 'center' },
                transition: 'all 0.3s ease',
                px: { xs: 2, md: 0 },
                boxShadow: isFirst
                  ? `0 0 30px ${alpha(rankColor, 0.2)}`
                  : `0 10px 20px ${alpha('#000', 0.2)}`,
                '&:hover': {
                  transform: { xs: 'none', md: 'translateY(-10px)' },
                  borderColor: rankColor,
                  boxShadow: `0 0 40px ${alpha(rankColor, 0.4)}`,
                },
              }}
            >
              {/* Rank Icon */}
              <Box
                sx={{
                  position: 'absolute',
                  top: { xs: '50%', md: -25 },
                  left: { xs: -15, md: '50%' },
                  transform: { xs: 'translateY(-50%)', md: 'translateX(-50%)' },
                  width: { xs: 32, md: 50 },
                  height: { xs: 32, md: 50 },
                  bgcolor: rankColor,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 4px 12px ${alpha(rankColor, 0.4)}`,
                  zIndex: 2,
                }}
              >
                <EmojiEventsIcon
                  sx={{
                    color: profile.rank === 1 ? 'black' : 'white',
                    fontSize: { xs: '1.2rem', md: '1.5rem' },
                  }}
                />
              </Box>

              <CardContent
                sx={{
                  p: { xs: 0, md: 4 },
                  pt: { xs: 0, md: 4 },
                  display: 'flex',
                  flexDirection: { xs: 'row', md: 'column' },
                  alignItems: 'center',
                  gap: { xs: 2, md: 0 },
                  textAlign: { xs: 'left', md: 'center' },
                  width: '100%',
                  '&:last-child': { pb: { xs: 0, md: 4 } },
                }}
              >
                <Box
                  sx={{
                    position: 'relative',
                    display: 'inline-block',
                    mb: { xs: 0, md: 2 },
                  }}
                >
                  <Avatar
                    src={profile.user?.image || undefined}
                    sx={{
                      width: { xs: 50, md: isFirst ? 100 : 80 },
                      height: { xs: 50, md: isFirst ? 100 : 80 },
                      mx: 'auto',
                      border: `2px solid ${rankColor}`,
                      boxShadow: `0 0 10px ${alpha(rankColor, 0.3)}`,
                    }}
                  >
                    {getInitials(profile.bladerName || profile.user?.name)}
                  </Avatar>
                </Box>

                <Box sx={{ flex: 1 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: { xs: 'flex-start', md: 'center' },
                      gap: 0.5,
                    }}
                  >
                    <Typography
                      variant={isFirst ? 'h6' : 'subtitle1'}
                      fontWeight={900}
                      noWrap
                      sx={{
                        color: 'text.primary',
                        mb: 0,
                        fontSize: {
                          xs: isFirst ? '1rem' : '0.9rem',
                          md: 'inherit',
                        },
                      }}
                    >
                      {profile.bladerName ||
                        profile.user?.name ||
                        profile.challongeUsername ||
                        'Anonyme'}
                    </Typography>
                    {profile.challongeUsername && (
                      <Tooltip
                        title={`Certifié Challonge : ${profile.challongeUsername}`}
                      >
                        <VerifiedIcon
                          sx={{
                            fontSize: { xs: '0.8rem', md: '1rem' },
                            color: 'info.main',
                            opacity: 0.8,
                          }}
                        />
                      </Tooltip>
                    )}
                  </Box>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      display: { xs: 'none', sm: 'block' },
                      mb: 1,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                      opacity: 0.8,
                    }}
                  >
                    BLADER RPB
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                    px: { xs: 1.5, md: 2 },
                    py: 0.5,
                    borderRadius: 10,
                    bgcolor: alpha(rankColor, 0.1),
                    color: rankColor,
                    border: `1px solid ${alpha(rankColor, 0.2)}`,
                  }}
                >
                  <Typography
                    variant="h6"
                    fontWeight={900}
                    sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}
                  >
                    {profile.rankingPoints}
                  </Typography>
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    sx={{ display: { xs: 'none', md: 'block' } }}
                  >
                    POINTS
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </Box>
  );
}
