/**
 * RPB - Blader Profile Header Component
 * Main profile header with avatar and basic info
 */

'use client'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Avatar from '@mui/material/Avatar'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import ShareIcon from '@mui/icons-material/Share'
import DownloadIcon from '@mui/icons-material/Download'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import type { UserStats } from '@/lib/stats'

interface BladerProfileHeaderProps {
  stats: UserStats
  avatarUrl?: string
  joinDate?: string
  bio?: string
  onDownloadCard?: () => void
}

function getRankColor(rank: number): string {
  if (rank === 1) return '#FFD700' // Gold
  if (rank === 2) return '#C0C0C0' // Silver
  if (rank === 3) return '#CD7F32' // Bronze
  return 'text.secondary'
}

function getRankTitle(rank: number, elo: number): string {
  if (elo >= 1500) return 'Champion'
  if (elo >= 1300) return 'Expert'
  if (elo >= 1150) return 'Confirmé'
  if (elo >= 1000) return 'Intermédiaire'
  return 'Débutant'
}

export function BladerProfileHeader({
  stats,
  avatarUrl,
  joinDate,
  bio,
  onDownloadCard,
}: BladerProfileHeaderProps) {
  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      await navigator.share({
        title: `Profil de ${stats.bladerName} - RPB`,
        url,
      })
    } else {
      await navigator.clipboard.writeText(url)
    }
  }

  return (
    <Card
      sx={{
        background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.1) 0%, rgba(251, 191, 36, 0.1) 100%)',
        position: 'relative',
        overflow: 'visible',
      }}
    >
      <CardContent sx={{ pt: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 3 }}>
          {/* Avatar */}
          <Box sx={{ display: 'flex', justifyContent: { xs: 'center', sm: 'flex-start' } }}>
            <Avatar
              src={avatarUrl}
              sx={{
                width: 120,
                height: 120,
                border: 4,
                borderColor: getRankColor(stats.rank),
                fontSize: '3rem',
              }}
            >
              {stats.bladerName[0]}
            </Avatar>
          </Box>

          {/* Info */}
          <Box sx={{ flex: 1, textAlign: { xs: 'center', sm: 'left' } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: { xs: 'center', sm: 'flex-start' } }}>
              <Typography variant="h4" fontWeight="bold">
                {stats.bladerName}
              </Typography>
              {stats.rank <= 3 && (
                <EmojiEventsIcon sx={{ color: getRankColor(stats.rank), fontSize: 32 }} />
              )}
            </Box>

            <Stack
              direction="row"
              spacing={1}
              sx={{ mt: 1, justifyContent: { xs: 'center', sm: 'flex-start' } }}
            >
              <Chip
                label={`#${stats.rank}`}
                size="small"
                sx={{
                  bgcolor: getRankColor(stats.rank),
                  color: stats.rank <= 3 ? 'black' : 'inherit',
                  fontWeight: 'bold',
                }}
              />
              <Chip label={getRankTitle(stats.rank, stats.elo)} size="small" color="primary" />
              <Chip label={`${stats.elo} ELO`} size="small" variant="outlined" />
            </Stack>

            {bio && (
              <Typography color="text.secondary" sx={{ mt: 2, maxWidth: 500 }}>
                {bio}
              </Typography>
            )}

            {joinDate && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Membre depuis {new Date(joinDate).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </Typography>
            )}
          </Box>

          {/* Actions */}
          <Box sx={{ position: { sm: 'absolute' }, top: { sm: 16 }, right: { sm: 16 } }}>
            <Stack direction="row" spacing={1}>
              <Tooltip title="Partager">
                <IconButton onClick={handleShare}>
                  <ShareIcon />
                </IconButton>
              </Tooltip>
              {onDownloadCard && (
                <Tooltip title="Télécharger la carte">
                  <IconButton onClick={onDownloadCard}>
                    <DownloadIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}
