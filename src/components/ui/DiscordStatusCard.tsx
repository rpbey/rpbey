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
        sx={{ maxWidth: 400 }}
      />
    )
  }

  const onlineCount = stats?.onlineCount || 0
  const totalCount = stats?.memberCount || 0

  return (
    <Card
      variant="outlined"
      sx={{
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        maxWidth: 400,
        width: '100%',
        bgcolor: 'surface.containerLow',
        borderRadius: 4,
        border: '1px solid',
        borderColor: 'divider',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: (theme) => `0 10px 30px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.1)'}`,
          borderColor: '#5865F2',
        },
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        <Box
          sx={{
            p: 1.5,
            borderRadius: 3,
            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(88, 101, 242, 0.2)' : 'rgba(88, 101, 242, 0.1)',
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
                  boxShadow: '0 0 8px rgba(34, 197, 94, 0.4)',
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
          '&:hover': { 
            bgcolor: '#4752C4',
            boxShadow: '0 4px 12px rgba(88, 101, 242, 0.4)',
          },
          py: 1.5,
          fontSize: '1rem',
          borderRadius: 3,
          textTransform: 'none',
          fontWeight: 600,
        }}
      >
        Rejoindre le serveur
      </Button>
    </Card>
  )
}
