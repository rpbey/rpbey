'use client'

import { Box, CircularProgress, Typography } from '@mui/material'
import { useThemeMode } from '@/components/theme/ThemeRegistry'
import Image from 'next/image'

export default function Loading() {
  const { backgroundImage } = useThemeMode()

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: 3,
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          bgcolor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(8px)',
          borderRadius: 4,
          p: 4,
        }}
      >
        <Image
          src="/logo.png"
          alt="RPB Logo"
          width={80}
          height={80}
          priority
        />
        <CircularProgress color="primary" size={48} />
        <Typography variant="body1" color="text.secondary">
          Chargement...
        </Typography>
      </Box>
    </Box>
  )
}
