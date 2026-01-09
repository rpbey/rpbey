/**
 * RPB - Blader Profile Header Component
 * Main profile header with avatar and basic info
 */

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
      sx={{
        background: (theme) =>
          `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.warning.main, 0.1)} 100%)`,
        position: 'relative',
        overflow: 'visible',
        borderRadius: 6,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <CardContent sx={{ pt: 4, pb: 4 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
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
            <Avatar
              src={avatarUrl}
              sx={{
                width: { xs: 120, sm: 160 },
                height: { xs: 120, sm: 160 },
                border: 4,
                borderColor: getRankColor(stats.rank),
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                fontSize: '4rem',
                bgcolor: 'primary.main',
              }}
            >
              {stats.bladerName[0]}
            </Avatar>
            {stats.rank <= 3 && (
              <Box
                sx={{
                  position: 'absolute',
                  top: -10,
                  right: -10,
                  bgcolor: getRankColor(stats.rank),
                  borderRadius: '50%',
                  p: 1,
                  display: 'flex',
                  boxShadow: 2,
                }}
              >
                <EmojiEventsIcon sx={{ color: 'black', fontSize: 24 }} />
              </Box>
            )}
          </Box>

          {/* Info Area */}
          <Box sx={{ flex: 1, textAlign: { xs: 'center', sm: 'left' } }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                justifyContent: { xs: 'center', sm: 'flex-start' },
                mb: 1,
              }}
            >
              <Typography
                variant="h3"
                fontWeight="bold"
                sx={{ letterSpacing: '-0.02em' }}
              >
                {stats.bladerName}
              </Typography>
              {isOwnProfile && (
                <Tooltip title="Modifier le profil">
                  <IconButton
                    component={Link}
                    href="/profile"
                    size="small"
                    sx={{ bgcolor: 'action.hover' }}
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
                justifyContent: { xs: 'center', sm: 'flex-start' },
                mb: 3,
              }}
            >
              <Chip
                label={`RANG #${stats.rank}`}
                size="small"
                sx={{
                  bgcolor: getRankColor(stats.rank),
                  color: stats.rank <= 3 ? 'black' : 'white',
                  fontWeight: 900,
                  fontSize: '0.7rem',
                }}
              />
              <Chip
                label={getRankTitle(stats.rank, stats.elo)}
                size="small"
                color="primary"
                sx={{ fontWeight: 'bold' }}
              />
              <Chip
                label={`${stats.elo} ELO`}
                size="small"
                variant="outlined"
                sx={{ fontWeight: 'bold' }}
              />
            </Stack>

            {bio ? (
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ maxWidth: 600, fontStyle: 'italic' }}
              >
                "{bio}"
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
                  mt: 2,
                  display: 'block',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
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
              flexDirection: { xs: 'row', sm: 'column' },
              gap: 1,
              justifyContent: 'center',
            }}
          >
            <Button
              variant="outlined"
              startIcon={<ShareIcon />}
              onClick={handleShare}
              fullWidth
              sx={{ borderRadius: 3 }}
            >
              Partager
            </Button>
            {onDownloadCard && (
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={onDownloadCard}
                fullWidth
                sx={{ borderRadius: 3 }}
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
