'use client'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Skeleton from '@mui/material/Skeleton'
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

    themeId = '7792' // ID d'un thème transparent ou thème par défaut RPB si existant

  }: ChallongeBracketProps) {

    const [loading, setLoading] = useState(true)

  

    // Construction de l'URL du module avec les bons paramètres pour la transparence

  
    // On force le mode module et on ajoute les paramètres d'affichage
    let moduleUrlString = ''
    if (challongeUrl) {
      try {
        const moduleUrl = new URL(`${challongeUrl}/module`)
        moduleUrl.searchParams.set('theme', themeId)
        moduleUrl.searchParams.set('multiplier', '0.9')
        moduleUrl.searchParams.set('match_width_multiplier', '1.2')
        moduleUrl.searchParams.set('show_final_results', '1')
        moduleUrlString = moduleUrl.toString()
      } catch {
        console.error('Invalid Challonge URL:', challongeUrl)
      }
    }
    
  
    return (
      <Card
        variant="outlined"
        sx={{
          width: '100%',
          borderRadius: 4,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
  
          // Fond semi-transparent pour le conteneur
          bgcolor: (theme) => theme.palette.mode === 'dark' 
            ? 'rgba(33, 31, 31, 0.8)' // surface.container approx
            : 'rgba(255, 255, 255, 0.6)',
          backdropFilter: 'blur(10px)',
        }}
      >
  
  
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
            src={moduleUrlString}
            width="100%"
            height="100%"
            frameBorder="0"
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
      </Card>
    )
  }
  
