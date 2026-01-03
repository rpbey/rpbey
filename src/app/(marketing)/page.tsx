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
  Tv,
  Leaderboard,
  Groups,
  ArrowForward,
} from '@mui/icons-material'
import { DiscordIcon, TrophyIcon, NextTournamentButton } from '@/components/ui'
import { BEYBLADE_SERIES } from '@/lib/streaming'
import { motion } from 'framer-motion'
import { FeatureCard } from '@/components/cards'
import { SeriesCard } from '@/components/streaming'
import { useThemeMode } from '@/components/theme/ThemeRegistry'

const features = [
  {
    icon: Tv,
    title: 'Streaming',
    description: 'Regardez tous les animes Beyblade en streaming gratuit.',
    href: '/tv',
    color: '#dc2626',
  },
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

  return (
    <>
      {/* Hero Section */}
      <Box
        component={motion.div}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        sx={{
          position: 'relative',
          minHeight: '80vh',
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transition: 'background-image 0.5s ease',
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={4} alignItems="center">
            <Grid size={{ xs: 12, md: 7 }}>
              <Box
                component={motion.div}
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.8 }}
              >
                <Typography
                  variant="h1"
                  fontWeight={800}
                  sx={{
                    fontSize: { xs: '2.5rem', md: '4rem' },
                    letterSpacing: '-0.02em',
                    mb: 2,
                    color: '#ffffff',
                    textShadow: '0 2px 20px rgba(0,0,0,0.5)',
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
                  sx={{ mb: 4, maxWidth: 500, color: 'rgba(255,255,255,0.9)', textShadow: '0 1px 10px rgba(0,0,0,0.5)' }}
                >
               La communauté française de Beyblade qui allie divertissement et compétitivité
                </Typography>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <NextTournamentButton />
                  <Button
                    component="a"
                    href="https://discord.gg/twdVfesrRj"
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="outlined"
                    size="large"
                    startIcon={<DiscordIcon />}
                    sx={{
                      px: 4,
                      py: 1.5,
                      borderRadius: 3,
                      fontSize: '1rem',
                      borderColor: 'rgba(255,255,255,0.5)',
                      color: '#ffffff',
                      backdropFilter: 'blur(8px)',
                      bgcolor: 'rgba(255,255,255,0.1)',
                      '&:hover': {
                        borderColor: '#5865F2',
                        bgcolor: alpha('#5865F2', 0.3),
                      },
                    }}
                  >
                    Rejoindre le Discord
                  </Button>
                </Stack>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 5 }} sx={{ display: { xs: 'none', md: 'block' } }}>
              <Box
                component={motion.img}
                src="/tournoi.png"
                alt="Tournoi Beyblade"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                sx={{
                  width: '100%',
                  maxHeight: 500,
                  objectFit: 'contain',
                  filter: mode === 'tournament' 
                    ? 'drop-shadow(0 20px 40px rgba(96,165,250,0.5))'
                    : 'drop-shadow(0 20px 40px rgba(220,38,38,0.5))',
                }}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 10 }}>
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
          sx={{ mb: 6, maxWidth: 600, mx: 'auto' }}
        >
          Découvrez tout ce que RPB a à offrir à la communauté Beyblade française
        </Typography>

        <Grid container spacing={3}>
          {features.map((feature) => (
            <Grid key={feature.title} size={{ xs: 12, sm: 6, md: 3 }}>
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

      {/* Streaming Section */}
      <Box sx={{ bgcolor: 'background.paper', py: 10 }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Box>
              <Typography variant="h3" fontWeight="bold">
                Streaming Beyblade
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Toutes les séries disponibles gratuitement
              </Typography>
            </Box>
            <Button
              component={Link}
              href="/tv"
              variant="outlined"
              endIcon={<ArrowForward />}
              sx={{ display: { xs: 'none', sm: 'flex' } }}
            >
              Voir tout
            </Button>
          </Box>

          <Grid container spacing={3}>
            {BEYBLADE_SERIES.map((series) => (
              <Grid key={series.id} size={{ xs: 6, sm: 4, md: 3 }}>
                <SeriesCard series={series} type="anime" />
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Container maxWidth="md" sx={{ py: 10, textAlign: 'center' }}>
        <Typography variant="h3" fontWeight="bold" gutterBottom>
          Prêt à rejoindre la communauté ?
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
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
            }}
          >
            Se connecter
          </Button>
        </Stack>
      </Container>
    </>
  )
}
