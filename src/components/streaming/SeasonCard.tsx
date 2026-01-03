'use client'

import Link from 'next/link'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardMedia from '@mui/material/CardMedia'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Chip from '@mui/material/Chip'
import { PlayArrow, MenuBook } from '@mui/icons-material'
import type { Series, Season, ContentType } from '@/lib/streaming'

interface SeasonCardProps {
  series: Series
  season: Season
  type?: ContentType
}

export function SeasonCard({ series, season, type = 'anime' }: SeasonCardProps) {
  const isScan = type === 'scan' || season.id === 'scans'
  const baseHref = `/tv/${series.id}/${season.id}`

  return (
    <Card
      elevation={0}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        '&:hover': {
          borderColor: series.color,
          boxShadow: `0 8px 32px ${series.color}30`,
        },
      }}
    >
      {/* Poster */}
      <Box sx={{ position: 'relative' }}>
        <CardMedia
          component="img"
          height={200}
          image={season.poster}
          alt={season.name}
          sx={{ objectFit: 'cover' }}
        />
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(to top, ${series.color}CC 0%, transparent 60%)`,
          }}
        />
        <Typography
          variant="h5"
          fontWeight="bold"
          color="white"
          sx={{
            position: 'absolute',
            bottom: 12,
            left: 16,
            textShadow: '0 2px 8px rgba(0,0,0,0.8)',
          }}
        >
          {season.name}
        </Typography>
      </Box>

      {/* Content */}
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            flex: 1,
            mb: 2,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {season.description}
        </Typography>

        {/* Episode count */}
        {!isScan && season.episodes.length > 0 && (
          <Chip
            label={`${season.episodes.length} épisodes`}
            size="small"
            variant="outlined"
            sx={{ alignSelf: 'flex-start', mb: 2 }}
          />
        )}

        {/* Action Buttons */}
        <Stack direction="row" spacing={1}>
          {isScan ? (
            <Button
              component={Link}
              href={baseHref}
              variant="contained"
              startIcon={<MenuBook />}
              fullWidth
              sx={{
                bgcolor: series.color,
                '&:hover': { bgcolor: series.color, filter: 'brightness(0.9)' },
              }}
            >
              Lire
            </Button>
          ) : (
            <>
              {season.hasVostfr && (
                <Button
                  component={Link}
                  href={`${baseHref}/vostfr`}
                  variant="contained"
                  startIcon={<PlayArrow />}
                  sx={{
                    flex: 1,
                    bgcolor: series.color,
                    '&:hover': { bgcolor: series.color, filter: 'brightness(0.9)' },
                  }}
                >
                  VOSTFR
                </Button>
              )}
              {season.hasVf && (
                <Button
                  component={Link}
                  href={`${baseHref}/vf`}
                  variant="outlined"
                  startIcon={<PlayArrow />}
                  sx={{
                    flex: 1,
                    borderColor: series.color,
                    color: series.color,
                    '&:hover': {
                      borderColor: series.color,
                      bgcolor: `${series.color}10`,
                    },
                  }}
                >
                  VF
                </Button>
              )}
            </>
          )}
        </Stack>
      </CardContent>
    </Card>
  )
}
