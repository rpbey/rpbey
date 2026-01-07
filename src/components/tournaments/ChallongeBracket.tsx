'use client'

import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import RefreshIcon from '@mui/icons-material/Refresh'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import Skeleton from '@mui/material/Skeleton'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { useState } from 'react'

interface ChallongeBracketProps {
  challongeUrl: string
  height?: number | string
  title?: string
  themeId?: string
}

export function ChallongeBracket({ 
  challongeUrl, 
  height = 600, 
  title,
  themeId = '7792' // ID d'un thème transparent ou thème par défaut RPB si existant
}: ChallongeBracketProps) {
  const [loading, setLoading] = useState(true)
  const [key, setKey] = useState(0)

  // Extraction propre de l'ID à partir de l'URL fournie (supporte les sous-domaines)
  // Ex: https://challonge.com/fr/B_TS1 -> B_TS1
  const getTournamentId = (url: string) => {
    const parts = url.split('/')
    return parts[parts.length - 1]
  }

  const tournamentId = getTournamentId(challongeUrl)
  
  // Construction de l'URL du module avec les bons paramètres pour la transparence
  // On force le mode module et on ajoute les paramètres d'affichage
  const moduleUrl = new URL(`${challongeUrl}/module`)
  moduleUrl.searchParams.set('theme', themeId)
  moduleUrl.searchParams.set('multiplier', '0.9')
  moduleUrl.searchParams.set('match_width_multiplier', '1.2')
  moduleUrl.searchParams.set('show_final_results', '1')
  
  const handleRefresh = () => {
    setLoading(true)
    setKey(prev => prev + 1)
  }

  return (
    <Paper
      elevation={0}
      sx={{
        width: '100%',
        borderRadius: 4,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        // Fond semi-transparent pour le conteneur
        bgcolor: (theme) => theme.palette.mode === 'dark' 
          ? 'rgba(0, 0, 0, 0.2)' 
          : 'rgba(255, 255, 255, 0.4)',
        backdropFilter: 'blur(10px)',
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
          // Header transparent
          bgcolor: 'transparent',
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
              href={challongeUrl} 
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
              inset: 0,
              p: 2,
              zIndex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Skeleton variant="rectangular" width="100%" height="100%" sx={{ borderRadius: 2, opacity: 0.5 }} />
          </Box>
        )}
        
        <iframe
          key={key}
          src={moduleUrl.toString()}
          width="100%"
          height="100%"
          scrolling="auto"
          onLoad={() => setLoading(false)}
          style={{
            border: 'none',
            display: 'block',
            // Astuce CSS pour forcer la transparence si le thème le permet
            colorScheme: 'auto', 
          }}
        />
      </Box>
    </Paper>
  )
}
