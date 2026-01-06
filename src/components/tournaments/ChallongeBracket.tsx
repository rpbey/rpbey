'use client'

import React, { useState } from 'react'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Skeleton from '@mui/material/Skeleton'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import RefreshIcon from '@mui/icons-material/Refresh'

interface ChallongeBracketProps {
  challongeId: string
  height?: number | string
  title?: string
}

export function ChallongeBracket({ challongeId, height = 600, title }: ChallongeBracketProps) {
  const [loading, setLoading] = useState(true)
  const [key, setKey] = useState(0) // Used to force refresh

  const handleRefresh = () => {
    setLoading(true)
    setKey(prev => prev + 1)
  }

  const challongeUrl = `https://challonge.com/fr/${challongeId}/module`
  const fullUrl = `https://challonge.com/fr/${challongeId}`

  return (
    <Paper
      elevation={0}
      sx={{
        width: '100%',
        borderRadius: 4,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Box
        sx={{
          px: 3,
          py: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
        }}
      >
        <Typography variant="subtitle1" fontWeight="bold">
          {title || 'Arbre du Tournoi'}
        </Typography>
        <Box>
          <Tooltip title="Rafraîchir">
            <IconButton size="small" onClick={handleRefresh} sx={{ mr: 1 }}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Ouvrir sur Challonge">
            <IconButton 
              size="small" 
              component="a" 
              href={fullUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              color="primary"
            >
              <OpenInNewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Box sx={{ position: 'relative', width: '100%', height }}>
        {loading && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              p: 2,
              zIndex: 1,
              bgcolor: 'background.paper',
            }}
          >
            <Skeleton variant="rectangular" width="100%" height="100%" sx={{ borderRadius: 2 }} />
          </Box>
        )}
        
        <iframe
          key={key}
          src={`${challongeUrl}?theme=1&multiplier=0.9&match_width_multiplier=1.2`}
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="auto"
          allowTransparency={true}
          onLoad={() => setLoading(false)}
          style={{
            border: 'none',
            display: 'block',
          }}
        />
      </Box>
    </Paper>
  )
}
