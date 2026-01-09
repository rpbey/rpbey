'use client'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import { alpha, useTheme } from '@mui/material/styles'
import LocalOfferIcon from '@mui/icons-material/LocalOffer'
import LaunchIcon from '@mui/icons-material/Launch'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import { useState } from 'react'

export function FeedMyPartnership() {
  const theme = useTheme()
  const [copied, setCopied] = useState(false)
  const discountCode = 'RPB10'
  const discountUrl = 'https://feedmy.fr/discount/RPB10'

  const handleCopyCode = () => {
    navigator.clipboard.writeText(discountCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card
      variant="elevated"
      sx={{
        p: { xs: 3, md: 4 },
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.background.paper, 1)} 100%)`,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          right: 0,
          width: '150px',
          height: '150px',
          background: `radial-gradient(circle at center, ${alpha(theme.palette.primary.main, 0.15)} 0%, transparent 70%)`,
          transform: 'translate(30%, -30%)',
          pointerEvents: 'none',
        }
      }}
    >
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="center">
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            color: theme.palette.primary.main,
            flexShrink: 0,
          }}
        >
          <LocalOfferIcon sx={{ fontSize: 40 }} />
        </Box>

        <Box sx={{ flexGrow: 1, textAlign: { xs: 'center', sm: 'left' } }}>
          <Typography variant="overline" color="primary" fontWeight="bold">
            Partenaire Officiel
          </Typography>
          <Typography variant="h4" gutterBottom fontWeight="bold">
            FeedMy x RPB
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 500, mb: 2 }}>
            Profitez de <strong>10% de réduction</strong> sur votre commande chez FeedMy, le spécialiste de l'importation japonaise, avec notre code exclusif.
          </Typography>

          <Stack 
            direction={{ xs: 'column', md: 'row' }} 
            spacing={2} 
            alignItems={{ xs: 'stretch', md: 'center' }}
          >
            <Box
              onClick={handleCopyCode}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                border: `2px dashed ${alpha(theme.palette.primary.main, 0.3)}`,
                borderRadius: 2,
                px: 2,
                py: 1,
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.15),
                  borderColor: theme.palette.primary.main,
                }
              }}
            >
              <Typography 
                variant="h6" 
                sx={{ 
                  fontFamily: 'monospace', 
                  fontWeight: 'bold', 
                  color: theme.palette.primary.main,
                  mr: 2 
                }}
              >
                {discountCode}
              </Typography>
              {copied ? (
                <Typography variant="caption" fontWeight="bold" color="success.main">
                  Copié !
                </Typography>
              ) : (
                <ContentCopyIcon sx={{ fontSize: 18, color: theme.palette.primary.main }} />
              )}
            </Box>

            <Button
              variant="contained"
              color="primary"
              endIcon={<LaunchIcon />}
              href={discountUrl}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ py: 1.5 }}
            >
              Utiliser le code
            </Button>
          </Stack>
        </Box>
      </Stack>
    </Card>
  )
}
