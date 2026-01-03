'use client'

import Link from 'next/link'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import { PlayArrow } from '@mui/icons-material'
import type { Series, Season, Language } from '@/lib/streaming'

interface EpisodeListProps {
  series: Series
  season: Season
  language: Language
}

export function EpisodeList({ series, season, language }: EpisodeListProps) {
  return (
    <Grid container spacing={1}>
      {/* Trailer button */}
      <Grid size={{ xs: 6, sm: 4, md: 3, lg: 2 }}>
        <Button
          component={Link}
          href={`/tv/${series.id}/${season.id}/${language}/trailer`}
          variant="outlined"
          fullWidth
          sx={{
            py: 1.5,
            borderColor: 'divider',
            color: 'text.primary',
            '&:hover': {
              borderColor: series.color,
              bgcolor: `${series.color}10`,
            },
          }}
        >
          Trailer
        </Button>
      </Grid>

      {/* Episode buttons */}
      {season.episodes.map((episode) => (
        <Grid key={episode.number} size={{ xs: 6, sm: 4, md: 3, lg: 2 }}>
          <Button
            component={Link}
            href={`/tv/${series.id}/${season.id}/${language}/${episode.number}`}
            variant="outlined"
            fullWidth
            startIcon={<PlayArrow sx={{ fontSize: 16 }} />}
            sx={{
              py: 1.5,
              borderColor: 'divider',
              color: 'text.primary',
              justifyContent: 'flex-start',
              '&:hover': {
                borderColor: series.color,
                bgcolor: `${series.color}10`,
              },
            }}
          >
            Épisode {episode.number}
          </Button>
        </Grid>
      ))}
    </Grid>
  )
}
