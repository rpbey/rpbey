'use client';

import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ShareIcon from '@mui/icons-material/Share';
import {
  Avatar,
  alpha,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import Link from 'next/link';
import type { UserStats } from '@/lib/stats';

interface BladerProfileHeaderProps {
  stats: UserStats;
  avatarUrl?: string;
  joinDate?: string;
  bio?: string;
  onDownloadCard?: () => void;
  isOwnProfile?: boolean;
}

function getRankColor(rank: number): string {
  if (rank === 1) return '#FFD700'; // Gold
  if (rank === 2) return '#C0C0C0'; // Silver
  if (rank === 3) return '#CD7F32'; // Bronze
  return '#666';
}

function getRankTitle(_rank: number, elo: number): string {
  if (elo >= 1500) return 'Champion';
  if (elo >= 1300) return 'Expert';
  if (elo >= 1150) return 'Confirmé';
  if (elo >= 1000) return 'Intermédiaire';
  return 'Débutant';
}

export function BladerProfileHeader({
  stats,
  avatarUrl,
  joinDate,
  bio,
  onDownloadCard,
  isOwnProfile = false,
}: BladerProfileHeaderProps) {
  const theme = useTheme();

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({
        title: `Profil de ${stats.bladerName} - RPB`,
        url,
      });
    } else {
      await navigator.clipboard.writeText(url);
      alert('Lien copié dans le presse-papier !');
    }
  };

  return (
    <Card
      elevation={0}
      sx={{
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.9)} 0%, ${alpha(
          theme.palette.background.paper,
          0.95,
        )} 100%)`,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 6,
        border: '1px solid',
        borderColor: 'divider',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
      }}
    >
      {/* Decorative background accent */}
      <Box
        sx={{
          position: 'absolute',
          top: -100,
          right: -100,
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha(
            theme.palette.primary.main,
            0.3,
          )} 0%, transparent 70%)`,
          filter: 'blur(40px)',
          zIndex: 0,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -50,
          left: -50,
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha(
            theme.palette.secondary.main,
            0.2,
          )} 0%, transparent 70%)`,
          filter: 'blur(40px)',
          zIndex: 0,
        }}
      />

      <CardContent sx={{ pt: 5, pb: 5, position: 'relative', zIndex: 1 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'center', md: 'flex-start' },
            gap: 4,
          }}
        >
          {/* Avatar Area */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            <Box
              sx={{
                position: 'relative',
                borderRadius: '50%',
                p: 0.5,
                background: `linear-gradient(135deg, ${getRankColor(stats.rank)}, ${alpha(
                  getRankColor(stats.rank),
                  0.3,
                )})`,
              }}
            >
              <Avatar
                src={avatarUrl}
                sx={{
                  width: { xs: 120, md: 160 },
                  height: { xs: 120, md: 160 },
                  border: '4px solid',
                  borderColor: 'background.paper',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                  fontSize: '4rem',
                  bgcolor: 'primary.main',
                }}
              >
                {stats.bladerName[0]}
              </Avatar>
            </Box>

            {stats.rank <= 3 && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  bgcolor: getRankColor(stats.rank),
                  borderRadius: '50%',
                  width: 40,
                  height: 40,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 3,
                  border: '2px solid white',
                  zIndex: 2,
                }}
              >
                <EmojiEventsIcon sx={{ color: 'black', fontSize: 24 }} />
              </Box>
            )}
          </Box>

          {/* Info Area */}
          <Box sx={{ flex: 1, textAlign: { xs: 'center', md: 'left' } }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                justifyContent: { xs: 'center', md: 'flex-start' },
                flexWrap: 'wrap',
                mb: 1.5,
              }}
            >
              <Typography
                variant="h3"
                fontWeight="900"
                sx={{
                  letterSpacing: '-0.03em',
                  background: `linear-gradient(90deg, ${theme.palette.text.primary}, ${theme.palette.text.secondary})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {stats.bladerName}
              </Typography>
              {isOwnProfile && (
                <Tooltip title="Modifier le profil">
                  <IconButton
                    component={Link}
                    href="/dashboard/profile/edit"
                    size="small"
                    sx={{
                      bgcolor: 'action.hover',
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>

            <Stack
              direction="row"
              spacing={1}
              sx={{
                mt: 1,
                justifyContent: { xs: 'center', md: 'flex-start' },
                mb: 3,
                flexWrap: 'wrap',
                gap: 1,
              }}
            >
              <Chip
                label={`RANG #${stats.rank}`}
                size="medium"
                sx={{
                  bgcolor: getRankColor(stats.rank),
                  color: stats.rank <= 3 ? 'black' : 'white',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  boxShadow: `0 0 15px ${alpha(getRankColor(stats.rank), 0.4)}`,
                }}
              />
              <Chip
                label={getRankTitle(stats.rank, stats.elo)}
                size="medium"
                color="secondary"
                variant="filled"
                sx={{ fontWeight: 'bold' }}
              />
              <Chip
                label={`${stats.elo} ELO`}
                size="medium"
                variant="outlined"
                sx={{
                  fontWeight: 'bold',
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                }}
              />
            </Stack>

            {bio ? (
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{
                  maxWidth: 600,
                  lineHeight: 1.6,
                  borderLeft: '2px solid',
                  borderColor: 'primary.light',
                  pl: 2,
                  ml: { xs: 'auto', md: 0 },
                  mr: { xs: 'auto', md: 0 },
                  textAlign: 'left',
                }}
              >
                {bio}
              </Typography>
            ) : (
              <Typography
                variant="body1"
                color="text.disabled"
                sx={{ fontStyle: 'italic' }}
              >
                Pas de bio renseignée.
              </Typography>
            )}

            {joinDate && (
              <Typography
                variant="caption"
                color="text.disabled"
                sx={{
                  mt: 3,
                  display: 'block',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  fontWeight: 600,
                }}
              >
                MAÎTRE BLADER DEPUIS{' '}
                {new Date(joinDate).toLocaleDateString('fr-FR', {
                  month: 'long',
                  year: 'numeric',
                })}
              </Typography>
            )}
          </Box>

          {/* Actions Column */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'row', md: 'column' },
              gap: 1.5,
              justifyContent: 'center',
              minWidth: { md: 200 },
            }}
          >
            <Button
              variant="outlined"
              startIcon={<ShareIcon />}
              onClick={handleShare}
              fullWidth
              sx={{
                borderRadius: 4,
                textTransform: 'none',
                fontWeight: 600,
                borderColor: 'divider',
                color: 'text.primary',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                },
              }}
            >
              Partager
            </Button>
            {onDownloadCard && (
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={onDownloadCard}
                fullWidth
                sx={{
                  borderRadius: 4,
                  textTransform: 'none',
                  fontWeight: 600,
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
                }}
              >
                Carte Blader
              </Button>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
