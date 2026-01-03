'use client'

import { useState } from 'react'
import Link from 'next/link'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import MuiLink from '@mui/material/Link'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import {
  Home,
  SkipPrevious,
  SkipNext,
  Download,
  Report,
  PlayArrow,
} from '@mui/icons-material'
import type { Series, Season, Language } from '@/lib/streaming'

interface VideoPlayerProps {
  series: Series
  season: Season
  episodeNumber: number
  language: Language
  isTrailer?: boolean
}

// Mock video sources - in production, these would come from the database
const VIDEO_SOURCES = [
  { name: 'VK Video', value: 'vk' },
  { name: 'SendVid', value: 'sendvid' },
  { name: 'Sibnet', value: 'sibnet' },
]

export function VideoPlayer({ 
  series, 
  season, 
  episodeNumber, 
  language,
  isTrailer = false 
}: VideoPlayerProps) {
  const [selectedSource, setSelectedSource] = useState('vk')
  
  const isVf = language === 'vf'
  const title = isTrailer ? 'Trailer' : `Épisode ${episodeNumber}`
  const prevEpisode = episodeNumber > 1 ? episodeNumber - 1 : null
  const nextEpisode = episodeNumber < season.episodes.length ? episodeNumber + 1 : null

  const basePath = `/tv/${series.id}/${season.id}/${language}`

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <MuiLink
          component={Link}
          href="/tv"
          color="inherit"
          sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
        >
          <Home fontSize="small" />
          Accueil
        </MuiLink>
        <MuiLink component={Link} href={`/tv/${series.id}`} color="inherit">
          {series.name}
        </MuiLink>
        <MuiLink component={Link} href={basePath} color="inherit">
          {season.name} - {isVf ? 'VF' : 'VOSTFR'}
        </MuiLink>
        <Typography color="text.primary">{title}</Typography>
      </Breadcrumbs>

      {/* Title */}
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        {series.name.toUpperCase()} - {season.name.toUpperCase()}
      </Typography>
      <Typography
        variant="h5"
        sx={{ color: series.color, mb: 3 }}
      >
        {title.toUpperCase()} EN {isVf ? 'VF' : 'VOSTFR'}
      </Typography>

      {/* Video Source Selector */}
      <FormControl sx={{ mb: 2, minWidth: 200 }}>
        <InputLabel>LECTEUR</InputLabel>
        <Select
          value={selectedSource}
          label="LECTEUR"
          onChange={(e) => setSelectedSource(e.target.value)}
        >
          {VIDEO_SOURCES.map((source) => (
            <MenuItem key={source.value} value={source.value}>
              {source.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Video Player */}
      <Card
        elevation={0}
        sx={{
          mb: 3,
          borderRadius: 3,
          overflow: 'hidden',
          bgcolor: 'black',
          aspectRatio: '16/9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px solid',
          borderColor: series.color,
        }}
      >
        {/* Placeholder - in production, this would be an iframe */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <IconButton
            sx={{
              width: 80,
              height: 80,
              bgcolor: series.color,
              '&:hover': { bgcolor: series.color, filter: 'brightness(0.9)' },
            }}
          >
            <PlayArrow sx={{ fontSize: 48, color: 'white' }} />
          </IconButton>
          <Typography color="white">
            {series.name} - {season.name} - {title}
          </Typography>
          <Typography variant="caption" color="grey.500">
            Source: {VIDEO_SOURCES.find(s => s.value === selectedSource)?.name}
          </Typography>
        </Box>
      </Card>

      {/* Navigation Controls */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 4 }}
      >
        <Stack direction="row" spacing={1}>
          {/* Previous */}
          <Button
            component={Link}
            href={prevEpisode ? `${basePath}/${prevEpisode}` : `${basePath}/trailer`}
            variant="outlined"
            startIcon={<SkipPrevious />}
            disabled={isTrailer}
            sx={{
              borderColor: series.color,
              color: series.color,
              '&:hover': {
                borderColor: series.color,
                bgcolor: `${series.color}10`,
              },
            }}
          >
            {isTrailer ? '' : prevEpisode ? `Épisode ${prevEpisode}` : 'Trailer'}
          </Button>

          {/* Download */}
          <Button
            variant="outlined"
            startIcon={<Download />}
            sx={{
              borderColor: 'divider',
              color: 'text.primary',
            }}
          >
            Télécharger
          </Button>

          {/* Next */}
          <Button
            component={Link}
            href={isTrailer ? `${basePath}/1` : nextEpisode ? `${basePath}/${nextEpisode}` : basePath}
            variant="contained"
            endIcon={<SkipNext />}
            sx={{
              bgcolor: series.color,
              '&:hover': { bgcolor: series.color, filter: 'brightness(0.9)' },
            }}
          >
            {isTrailer ? 'Épisode 1' : nextEpisode ? `Épisode ${nextEpisode}` : 'Retour'}
          </Button>
        </Stack>

        {/* Report Button */}
        <Button
          variant="text"
          color="error"
          startIcon={<Report />}
          component="a"
          href="https://discord.gg/twdVfesrRj"
          target="_blank"
        >
          Signaler un problème
        </Button>
      </Stack>

      {/* Episode List */}
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Tous les épisodes
      </Typography>
      <Grid container spacing={1}>
        {/* Trailer */}
        <Grid size={{ xs: 6, sm: 4, md: 3, lg: 2 }}>
          <Button
            component={Link}
            href={`${basePath}/trailer`}
            variant={isTrailer ? 'contained' : 'outlined'}
            fullWidth
            sx={{
              py: 1.5,
              bgcolor: isTrailer ? series.color : 'transparent',
              borderColor: isTrailer ? series.color : 'divider',
              color: isTrailer ? 'white' : 'text.primary',
              '&:hover': {
                borderColor: series.color,
                bgcolor: isTrailer ? series.color : `${series.color}10`,
              },
            }}
          >
            Trailer
          </Button>
        </Grid>

        {/* Episodes */}
        {season.episodes.map((ep) => {
          const isActive = ep.number === episodeNumber && !isTrailer
          return (
            <Grid key={ep.number} size={{ xs: 6, sm: 4, md: 3, lg: 2 }}>
              <Button
                component={Link}
                href={`${basePath}/${ep.number}`}
                variant={isActive ? 'contained' : 'outlined'}
                fullWidth
                sx={{
                  py: 1.5,
                  bgcolor: isActive ? series.color : 'transparent',
                  borderColor: isActive ? series.color : 'divider',
                  color: isActive ? 'white' : 'text.primary',
                  '&:hover': {
                    borderColor: series.color,
                    bgcolor: isActive ? series.color : `${series.color}10`,
                  },
                }}
              >
                Épisode {ep.number}
              </Button>
            </Grid>
          )
        })}
      </Grid>
    </Container>
  )
}
