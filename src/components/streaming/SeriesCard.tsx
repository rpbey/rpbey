'use client'

import Link from 'next/link'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import Typography from '@mui/material/Typography'
import type { Series, ContentType } from '@/lib/streaming'

interface SeriesCardProps {
  series: Series
  type: ContentType
}

export function SeriesCard({ series, type }: SeriesCardProps) {
  const href = type === 'film' && series.filmUrl 
    ? series.filmUrl 
    : type === 'scan' 
      ? `/tv/${series.id}/scans`
      : `/tv/${series.id}`

  return (
    <Card
      elevation={0}
      sx={{
        position: 'relative',
        borderRadius: 3,
        overflow: 'hidden',
        aspectRatio: '3/4',
        border: '2px solid transparent',
        transition: 'all 0.3s ease',
        '&:hover': {
          borderColor: series.color,
          transform: 'translateY(-8px)',
          boxShadow: `0 20px 40px ${series.color}40`,
          '& .series-poster': {
            transform: 'scale(1.1)',
          },
          '& .series-character': {
            transform: 'translateX(10px) scale(1.1)',
            opacity: 1,
          },
          '& .series-logo': {
            opacity: 1,
            transform: 'translateY(0)',
          },
        },
      }}
    >
      <CardActionArea
        component={Link}
        href={href}
        sx={{ height: '100%' }}
      >
        {/* Background Poster */}
        <Box
          className="series-poster"
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${series.poster})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            transition: 'transform 0.5s ease',
          }}
        />

        {/* Gradient Overlay */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(to top, ${series.color}CC 0%, transparent 50%, rgba(0,0,0,0.3) 100%)`,
          }}
        />

        {/* Character */}
        <Box
          component="img"
          className="series-character"
          src={series.character}
          alt=""
          sx={{
            position: 'absolute',
            bottom: 0,
            right: -20,
            height: '70%',
            objectFit: 'contain',
            opacity: 0.8,
            transition: 'all 0.5s ease',
            pointerEvents: 'none',
          }}
        />

        {/* Content */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            p: 2,
          }}
        >
          {/* Logo */}
          <Box
            component="img"
            className="series-logo"
            src={series.logo}
            alt={series.name}
            sx={{
              height: 40,
              objectFit: 'contain',
              alignSelf: 'flex-start',
              opacity: 0.9,
              transition: 'all 0.3s ease',
            }}
          />

          {/* Title */}
          <Box>
            <Typography
              variant="h6"
              fontWeight="bold"
              color="white"
              sx={{
                textShadow: '0 2px 8px rgba(0,0,0,0.8)',
              }}
            >
              {series.name}
            </Typography>
            <Typography
              variant="caption"
              color="white"
              sx={{
                opacity: 0.8,
              }}
            >
              {series.years} • {series.seasons.length} saison{series.seasons.length > 1 ? 's' : ''}
            </Typography>
          </Box>
        </Box>
      </CardActionArea>
    </Card>
  )
}
