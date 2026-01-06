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
  ShoppingBag,
  Newspaper,
  Bolt,
  Star,
} from '@mui/icons-material'
import { DiscordIcon, TrophyIcon, DiscordStatusCard } from '@/components/ui'
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion'
import { ChallongeBracket } from '@/components/tournaments'
import { useThemeMode } from '@/components/theme/ThemeRegistry'
import { Card, CardContent, CardMedia, CardActionArea, Chip, useMediaQuery, useTheme } from '@mui/material'

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

      {/* Quick Access Grid (Android/App Style) */}
      <Container maxWidth="lg" sx={{ mt: { xs: -4, md: -6 }, position: 'relative', zIndex: 10 }}>
        <Grid container spacing={2}>
          {[
            { label: 'Classement', icon: <Leaderboard sx={{ fontSize: 32 }} />, href: '/rankings', color: '#6366f1' },
            { label: 'News X', icon: <Newspaper sx={{ fontSize: 32 }} />, href: '/news', color: '#f59e0b' },
            { label: 'Lineup', icon: <ShoppingBag sx={{ fontSize: 32 }} />, href: '/lineup', color: '#10b981' },
            { label: 'Communauté', icon: <Groups sx={{ fontSize: 32 }} />, href: '/notre-equipe', color: '#ec4899' },
          ].map((item, i) => (
            <Grid key={item.label} size={{ xs: 6, sm: 3 }}>
              <Card
                component={motion.div}
                whileHover={{ y: -8 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                sx={{ 
                  borderRadius: 5, 
                  bgcolor: (theme) => alpha(theme.palette.background.paper, 0.9),
                  backdropFilter: 'blur(10px)',
                  border: '1px solid',
                  borderColor: 'divider',
                  textAlign: 'center',
                }}
              >
                <CardActionArea component={Link} href={item.href} sx={{ p: 3 }}>
                  <Box sx={{ color: item.color, mb: 1, display: 'flex', justifyContent: 'center' }}>
                    {item.icon}
                  </Box>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {item.label}
                  </Typography>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Featured Items / News Section */}
      <Box sx={{ py: 12, position: 'relative' }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 6 }}>
            <Box>
              <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 'bold', letterSpacing: 2 }}>
                ACTUALITÉS
              </Typography>
              <Typography variant="h3" fontWeight="bold">
                Le dernier cri de Gear Sports
              </Typography>
            </Box>
            <Button endIcon={<ArrowForward />} sx={{ fontWeight: 'bold' }}>
              Voir tout
            </Button>
          </Box>

          <Grid container spacing={3}>
            {[
              { title: 'Bey-Tamashii #1: Les inscriptions sont ouvertes!', date: '6 janv. 2026', image: '/news/bt1.jpg', tag: 'Évènement' },
              { title: 'UX-01 Dran Buster: Analyse complète du Bit Accel', date: '4 janv. 2026', image: '/news/dran.jpg', tag: 'Analyse' },
              { title: 'Nouveau format 3on3: Ce qu\'il faut savoir', date: '2 janv. 2026', image: '/news/rules.jpg', tag: 'Règlement' },
            ].map((news, i) => (
              <Grid key={i} size={{ xs: 12, sm: 4 }}>
                <Card
                  component={motion.div}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2 }}
                  sx={{ borderRadius: 6, overflow: 'hidden', height: '100%' }}
                >
                  <CardActionArea sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <Box sx={{ position: 'relative', width: '100%', pt: '56.25%', bgcolor: 'action.hover' }}>
                      <Box 
                        component="img" 
                        src={news.image} 
                        alt={news.title}
                        sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e: any) => e.target.src = 'https://via.placeholder.com/800x450?text=News'}
                      />
                      <Chip 
                        label={news.tag} 
                        size="small" 
                        sx={{ position: 'absolute', top: 16, right: 16, fontWeight: 'bold', bgcolor: 'background.paper', backdropFilter: 'blur(4px)' }} 
                      />
                    </Box>
                    <CardContent sx={{ p: 3, flexGrow: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                         {news.date}
                      </Typography>
                      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, lineHeight: 1.3 }}>
                        {news.title}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Bracket Section with App Feel */}
      <Box sx={{ py: 12, bgcolor: (theme) => alpha(theme.palette.primary.main, 0.03) }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Chip icon={<Star />} label="TOURNOI EN COURS" color="primary" variant="outlined" sx={{ mb: 2, fontWeight: 'bold' }} />
            <Typography variant="h2" fontWeight="900" sx={{ mb: 2 }}>
              BEY-TAMASHII #1
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 700, mx: 'auto' }}>
              La compétition bat son plein au Dernier Bar Avant la Fin du Monde. Suivez les affrontements en temps réel !
            </Typography>
          </Box>

          <Card
            sx={{ 
              borderRadius: 8, 
              border: '1px solid', 
              borderColor: 'divider',
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
              overflow: 'hidden'
            }}
          >
            <ChallongeBracket 
              challongeId="rpbey" 
              height={600}
            />
          </Card>
        </Container>
      </Box>

      {/* Features / Stats */}
      <Container maxWidth="lg" sx={{ py: 15 }}>
        <Grid container spacing={10} alignItems="center">
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="h2" fontWeight="bold" sx={{ mb: 4 }}>
              Pourquoi rejoindre la RPB ?
            </Typography>
            <Stack spacing={4}>
              {[
                { title: 'Tournois Réguliers', desc: 'Des évènements hebdomadaires et mensuels pour tous les niveaux.', icon: <Bolt color="primary" /> },
                { title: 'Classement National', desc: 'Grimpez dans le ranking et devenez le Blader numéro 1 de France.', icon: <Star color="primary" /> },
                { title: 'Entraide & Deckbuilding', desc: 'Partagez vos combos et recevez des conseils des meilleurs joueurs.', icon: <Groups color="primary" /> },
              ].map((f, i) => (
                <Box key={i} sx={{ display: 'flex', gap: 3 }}>
                  <Box sx={{ 
                    minWidth: 56, 
                    height: 56, 
                    borderRadius: 3, 
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {f.icon}
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>{f.title}</Typography>
                    <Typography color="text.secondary">{f.desc}</Typography>
                  </Box>
                </Box>
              ))}
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
             <Box
              sx={{
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: '-10%',
                  right: '-10%',
                  width: '120%',
                  height: '120%',
                  background: (theme) => `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.1)} 0%, transparent 70%)`,
                  zIndex: -1,
                }
              }}
             >
              <Card sx={{ borderRadius: 10, p: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
                <Stack spacing={3}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h5" fontWeight="bold">Bladers Actifs</Typography>
                    <Typography variant="h4" fontWeight="900" color="primary">500+</Typography>
                  </Box>
                  <Divider />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h5" fontWeight="bold">Tournois Joués</Typography>
                    <Typography variant="h4" fontWeight="900" color="primary">120+</Typography>
                  </Box>
                  <Divider />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h5" fontWeight="bold">Parties Lancées</Typography>
                    <Typography variant="h4" fontWeight="900" color="primary">1.5k+</Typography>
                  </Box>
                </Stack>
              </Card>
             </Box>
          </Grid>
        </Grid>
      </Container>
    </>
  )
}
