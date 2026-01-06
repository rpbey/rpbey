'use client'

import Link from 'next/link'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import { alpha } from '@mui/material/styles'
import {
  Leaderboard,
  Groups,
  ArrowForward,
} from '@mui/icons-material'
import { DiscordIcon, TrophyIcon, DiscordStatusCard } from '@/components/ui'
import { motion, useScroll, useTransform, useSpring } from 'framer-motion'
import { ChallongeBracket } from '@/components/tournaments'
import { useThemeMode } from '@/components/theme/ThemeRegistry'
import { useMediaQuery, useTheme } from '@mui/material'

export default function HomePage() {
  const { backgroundImage, mode } = useThemeMode()
  const { scrollY } = useScroll()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  // Parallax effects
  const heroY = useTransform(scrollY, [0, 500], [0, 150])
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0])
  const textY = useTransform(scrollY, [0, 500], [0, 50])
  
  // Smooth spring for image
  const imageSpring = useSpring(scrollY, { stiffness: 100, damping: 30 })
  const imageY = useTransform(imageSpring, [0, 500], [0, -50])

  return (
    <>
      {/* Hero Section */}
      <Box
        component={motion.div}
        style={{ opacity: heroOpacity }}
        sx={{
          position: 'relative',
          minHeight: { xs: '80vh', md: '90vh' },
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          perspective: '1000px',
        }}
      >
        {/* Parallax Background */}
        <Box
          component={motion.div}
          style={{ y: heroY }}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: -200,
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            zIndex: -1,
            transition: 'background-image 0.5s ease',
          }}
        />
        
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.7) 100%)',
            zIndex: 0,
          }}
        />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, py: { xs: 8, md: 0 } }}>
          <Grid container spacing={4} alignItems="center">
            <Grid size={{ xs: 12, md: 7 }}>
              <Box
                component={motion.div}
                initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 1, ease: 'easeOut' }}
                style={{ y: textY }}
              >
                <Typography
                  variant="h1"
                  fontWeight={900}
                  sx={{
                    fontSize: { xs: '3rem', sm: '4rem', md: '5rem' },
                    letterSpacing: '-0.03em',
                    mb: 2,
                    color: '#ffffff',
                    lineHeight: 1,
                    textShadow: '0 8px 32px rgba(0,0,0,0.4)',
                  }}
                >
                  RÉPUBLIQUE
                  <br />
                  <Box
                    component="span"
                    sx={{
                      background: mode === 'tournament' 
                        ? 'linear-gradient(90deg, #60A5FA, #93c5fd)'
                        : 'linear-gradient(90deg, #dc2626, #fbbf24)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    BEYBLADE
                  </Box>
                </Typography>
                <Typography
                  variant="h6"
                  component={motion.p}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 0.9, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                  sx={{ 
                    mb: 5, 
                    maxWidth: 550, 
                    color: 'white', 
                    fontSize: { xs: '1.1rem', md: '1.3rem' },
                    fontWeight: 400,
                    textShadow: '0 2px 10px rgba(0,0,0,0.3)',
                    lineHeight: 1.6
                  }}
                >
               La communauté française de référence pour Beyblade X. Divertissement, passion et compétition réunis en un seul lieu.
                </Typography>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 6 }}>
                  <Button
                    component={motion.a}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    variant="contained"
                    size="large"
                    href="/tournaments"
                    startIcon={<TrophyIcon color="white" />}
                    sx={{ 
                      borderRadius: 4, 
                      px: 4, 
                      py: 2, 
                      fontSize: '1.1rem', 
                      bgcolor: mode === 'tournament' ? 'primary.main' : '#dc2626',
                      boxShadow: '0 10px 20px rgba(220, 38, 38, 0.4)'
                    }}
                  >
                    Voir les tournois
                  </Button>
                  <Button
                    component={motion.a}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    variant="outlined"
                    size="large"
                    href="https://discord.gg/twdVfesrRj"
                    startIcon={<DiscordIcon />}
                    sx={{ 
                      borderRadius: 4, 
                      px: 4, 
                      py: 2, 
                      fontSize: '1.1rem', 
                      color: 'white', 
                      borderColor: 'rgba(255,255,255,0.5)',
                      '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' }
                    }}
                  >
                    Rejoindre le Discord
                  </Button>
                </Stack>

                <Box
                  component={motion.div}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.8 }}
                  sx={{ maxWidth: 400 }}
                >
                  <DiscordStatusCard />
                </Box>
              </Box>
            </Grid>

            {!isMobile && (
              <Grid size={{ xs: 12, md: 5 }}>
                <Box
                  component={motion.img}
                  src="/tournoi.png"
                  alt="Tournoi Beyblade"
                  style={{ y: imageY }}
                  initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  transition={{ delay: 0.4, duration: 1.2, type: 'spring' }}
                  sx={{
                    width: '100%',
                    filter: mode === 'tournament' 
                      ? 'drop-shadow(0 40px 80px rgba(96,165,250,0.5))'
                      : 'drop-shadow(0 40px 80px rgba(220,38,38,0.5))',
                  }}
                />
              </Grid>
            )}
          </Grid>
        </Container>
      </Box>

      {/* Bracket Section */}
      <Container maxWidth="lg" sx={{ py: 15 }}>
        <Box
          component={motion.div}
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
        >
          <Typography
            variant="h3"
            fontWeight="bold"
            textAlign="center"
            sx={{ mb: 2 }}
          >
            BEY-TAMASHII SERIES #1
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            textAlign="center"
            sx={{ mb: 8, maxWidth: 600, mx: 'auto' }}
          >
            Suivez l'arbre du tournoi en direct et ne manquez aucun match !
          </Typography>
        </Box>

        <Box
          component={motion.div}
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <ChallongeBracket 
            challongeId="rpbey" 
            height={700}
            title="Arbre Officiel - BEY-TAMASHII SERIES #1" 
          />
        </Box>
      </Container>

      {/* CTA Section */}
      <Container maxWidth="md" sx={{ py: 15, textAlign: 'center' }}>
        <Box
          component={motion.div}
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Typography variant="h3" fontWeight="bold" gutterBottom>
            Prêt à rejoindre la communauté ?
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 5 }}>
            Inscris-toi gratuitement et participe à nos tournois
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button
              component={Link}
              href="/sign-up"
              variant="contained"
              size="large"
              sx={{
                px: 6,
                py: 1.5,
                borderRadius: 3,
                fontSize: '1.1rem',
                textTransform: 'none',
                fontWeight: 'bold',
                boxShadow: '0 8px 20px rgba(220, 38, 38, 0.3)',
              }}
            >
              Créer un compte
            </Button>
            <Button
              component={Link}
              href="/sign-in"
              variant="outlined"
              size="large"
              sx={{
                px: 6,
                py: 1.5,
                borderRadius: 3,
                fontSize: '1.1rem',
                textTransform: 'none',
                fontWeight: 'bold',
                borderWidth: 2,
                '&:hover': { borderWidth: 2 },
              }}
            >
              Se connecter
            </Button>
          </Stack>
        </Box>
      </Container>
    </>
  )
}
