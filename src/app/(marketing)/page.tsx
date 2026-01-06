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
import { FeatureCard } from '@/components/cards'
import { useThemeMode } from '@/components/theme/ThemeRegistry'

const features = [
  {
    icon: TrophyIcon,
    title: 'Tournois',
    description: 'Participez à des tournois compétitifs et grimpez dans les classements.',
    href: 'https://challonge.com/fr/B_TS1',
    color: '#fbbf24',
    external: true,
  },
  {
    icon: Leaderboard,
    title: 'Classements',
    description: 'Suivez votre progression et comparez-vous aux meilleurs bladers.',
    href: '/rankings',
    color: '#3b82f6',
  },
  {
    icon: Groups,
    title: 'Communauté',
    description: 'Rejoignez notre Discord pour échanger avec des passionnés.',
    href: 'https://discord.gg/twdVfesrRj',
    color: '#5865F2',
    external: true,
  },
]

export default function HomePage() {
  const { backgroundImage, mode } = useThemeMode()
  const { scrollY } = useScroll()

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
          minHeight: '90vh', // Increased height for better parallax feel
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          perspective: '1000px', // For 3D effects
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
            bottom: -200, // Extend bottom for parallax
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            zIndex: -1,
            transition: 'background-image 0.5s ease',
          }}
        />
        
        {/* Gradient Overlay for Text Readability */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.6) 100%)',
            zIndex: 0,
          }}
        />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
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
                  fontWeight={800}
                  sx={{
                    fontSize: { xs: '2.5rem', md: '4.5rem' },
                    letterSpacing: '-0.02em',
                    mb: 2,
                    color: '#ffffff',
                    lineHeight: 1.1,
                    textShadow: '0 4px 30px rgba(0,0,0,0.3)',
                  }}
                >
                  République Populaire
                  <br />
                  du{' '}
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
                    Beyblade
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
                    fontSize: '1.25rem',
                    fontWeight: 300,
                    textShadow: '0 2px 10px rgba(0,0,0,0.3)' 
                  }}
                >
               La communauté française de Beyblade qui allie divertissement et compétitivité.
                </Typography>

                <Box
                  component={motion.div}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.8 }}
                >
                  <DiscordStatusCard />
                </Box>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 5 }} sx={{ display: { xs: 'none', md: 'block' } }}>
              <Box
                component={motion.img}
                src="/tournoi.png"
                alt="Tournoi Beyblade"
                style={{ y: imageY }}
                initial={{ scale: 0.9, opacity: 0, rotate: -5 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{ delay: 0.4, duration: 1.2, type: 'spring' }}
                sx={{
                  width: '100%',
                  maxHeight: 600,
                  objectFit: 'contain',
                  filter: mode === 'tournament' 
                    ? 'drop-shadow(0 30px 60px rgba(96,165,250,0.4))'
                    : 'drop-shadow(0 30px 60px rgba(220,38,38,0.4))',
                }}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
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
            Tout pour les Bladers
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            textAlign="center"
            sx={{ mb: 8, maxWidth: 600, mx: 'auto' }}
          >
            Découvrez tout ce que RPB a à offrir à la communauté Beyblade française
          </Typography>
        </Box>

        <Grid 
          container 
          spacing={4}
          component={motion.div}
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.2
              }
            }
          }}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
        >
          {features.map((feature) => (
            <Grid 
              key={feature.title} 
              size={{ xs: 12, sm: 6, md: 4 }}
              component={motion.div}
              variants={{
                hidden: { opacity: 0, y: 50 },
                show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50 } }
              }}
            >
              <FeatureCard
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                href={feature.href}
                color={feature.color}
                external={feature.external}
              />
            </Grid>
          ))}
        </Grid>
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
