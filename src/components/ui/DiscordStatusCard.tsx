'use client'

import { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Skeleton from '@mui/material/Skeleton'
import { DiscordIcon } from './Icons'
import { api } from '@/lib/standard-api'

export function DiscordStatusCard() {
  const [stats, setStats] = useState<{ onlineCount: number; memberCount: number } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await api.get<{ onlineCount: number; memberCount: number }>('/api/discord/stats', {
          cache: 'no-store'
        })
        setStats(data)
      } catch (error) {
        console.error('Failed to fetch discord stats:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchStats()
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <Skeleton
        variant="rounded"
        width="100%"
        height={160}
        sx={{ borderRadius: 4, maxWidth: 400 }}
      />
    )
  }

  const onlineCount = stats?.onlineCount || 0
  const totalCount = stats?.memberCount || 0

  return (
    <Card
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 4,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        maxWidth: 400,
        width: '100%',
        transition: 'transform 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
        },
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        <Box
          sx={{
            p: 1.5,
            borderRadius: 2,
            bgcolor: '#5865F220',
            color: '#5865F2',
            display: 'flex',
          }}
        >
          <DiscordIcon size={32} />
        </Box>
        <Box>
          <Typography variant="h6" fontWeight="bold">
            Rejoins le Discord
          </Typography>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: '#22c55e',
                }}
              />
              <Typography variant="body2" color="text.secondary">
                {onlineCount.toLocaleString()} en ligne
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: 'text.disabled',
                }}
              />
              <Typography variant="body2" color="text.secondary">
                {totalCount.toLocaleString()} membres
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Stack>

      <Button
        component="a"
        href="https://discord.gg/twdVfesrRj"
        target="_blank"
        rel="noopener noreferrer"
        variant="contained"
        fullWidth
        sx={{
          bgcolor: '#5865F2',
          '&:hover': { bgcolor: '#4752C4' },
          py: 1.2,
          borderRadius: 2,
          fontWeight: 'bold',
          textTransform: 'none',
          fontSize: '1rem',
        }}
      >
        Rejoindre le serveur
      </Button>
    </Card>
  )
}
