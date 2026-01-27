'use client';

import { AdminPanelSettings } from '@mui/icons-material';
import { useMediaQuery, useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import Link from 'next/link';
import DiscordStatusCard from '@/components/dashboard/DiscordStatusCard';
import { FeedMyPartnership, TournamentVideo } from '@/components/marketing';
import { useThemeMode } from '@/components/theme/ThemeRegistry';
import { ChallongeBracket } from '@/components/tournaments/ChallongeBracket';
import { useSession } from '@/lib/auth-client';
import type { DiscordStats, TeamGroup } from '@/lib/discord-data';

import { DiscordIcon, TrophyIcon } from '@/components/ui/Icons';

// M3 Motion Easings
// https://m3.material.io/styles/motion/easing-and-duration/tokens-specs
const EASE = {
  // Emphasized: Begin and end on screen. Used for most standard transitions.
  EMPHASIZED: [0.2, 0.0, 0.0, 1.0] as const,
  // Emphasized Decelerate: Entering screen.
  EMPHASIZED_DECELERATE: [0.05, 0.7, 0.1, 1.0] as const,
  // Emphasized Accelerate: Exiting screen.
  EMPHASIZED_ACCELERATE: [0.3, 0.0, 0.8, 0.15] as const,
  // Standard: General use.
  STANDARD: [0.2, 0.0, 0, 1.0] as const,
};

interface HomeClientProps {
  discordStats: DiscordStats;
  discordTeam: TeamGroup[];
  activeTournament?: {
    name: string;
    challongeUrl: string | null;
  } | null;
}

export default function HomeClient({
  discordStats: _discordStats,
  discordTeam: _discordTeam,
  activeTournament,
}: HomeClientProps) {
  const { backgroundImage, mode } = useThemeMode();
  const { scrollY } = useScroll();
  const { data: session } = useSession();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Parallax effects
  const heroY = useTransform(scrollY, [0, 500], [0, 150]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const textY = useTransform(scrollY, [0, 500], [0, 50]);

  // Smooth spring for image - using a slightly more expressive spring
  const imageSpring = useSpring(scrollY, { stiffness: 70, damping: 15 });
  const imageY = useTransform(imageSpring, [0, 500], [0, -50]);

  return (
    <>
      {/* Hero Section */}
      <Box
        component={motion.div}
        style={{ opacity: heroOpacity } as any}
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
          style={{ y: heroY } as any}
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
            transition: 'background-image 0.5s cubic-bezier(0.2, 0, 0, 1)',
          }}
        />

        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.7) 100%)',
            zIndex: 0,
          }}
        />

        <Container
          maxWidth="lg"
          sx={{ position: 'relative', zIndex: 1, py: { xs: 8, md: 0 } }}
        >
          <Grid container spacing={4} alignItems="center">
            <Grid size={{ xs: 12, md: 7 }}>
              <Box
                component={motion.div}
                initial={{ opacity: 0, y: 40, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{
                  duration: 0.8,
                  ease: EASE.EMPHASIZED_DECELERATE as any,
                }}
                style={{ y: textY } as any}
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
                  POPULAIRE
                  <br />
                  <Box
                    component="span"
                    sx={{
                      background:
                        mode === 'tournament'
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
                  transition={{
                    delay: 0.2,
                    duration: 0.6,
                    ease: EASE.EMPHASIZED as any,
                  }}
                  sx={{
                    mb: 5,
                    maxWidth: 550,
                    color: 'white',
                    fontSize: { xs: '1.1rem', md: '1.3rem' },
                    fontWeight: 400,
                    textShadow: '0 2px 10px rgba(0,0,0,0.3)',
                    lineHeight: 1.6,
                  }}
                >
                  La communauté française de référence pour Beyblade X.
                  Divertissement, passion et compétition réunis en un seul lieu.
                </Typography>

                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={2}
                  sx={{ mt: 4 }}
                  component={motion.div}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                >
                  <Button
                    component="a"
                    href={activeTournament?.challongeUrl || '/tournaments'}
                    target={activeTournament?.challongeUrl ? '_blank' : '_self'}
                    variant="contained"
                    size="large"
                    startIcon={<TrophyIcon size={20} />}
                    sx={{
                      px: 4,
                      py: 1.8,
                      fontSize: '1.1rem',
                      fontWeight: 800,
                      textTransform: 'none',
                      borderRadius: '16px',
                      background:
                        'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                      boxShadow: '0 4px 20px rgba(220, 38, 38, 0.4)',
                      '&:hover': {
                        background:
                          'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 30px rgba(220, 38, 38, 0.5)',
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    S'inscrire au Tournoi
                  </Button>

                  <Button
                    component="a"
                    href="https://discord.gg/rpb"
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="outlined"
                    size="large"
                    startIcon={<DiscordIcon size={20} />}
                    sx={{
                      px: 4,
                      py: 1.8,
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      textTransform: 'none',
                      borderRadius: '16px',
                      color: '#ffffff',
                      borderColor: 'rgba(255,255,255,0.3)',
                      background: 'rgba(255,255,255,0.05)',
                      backdropFilter: 'blur(10px)',
                      '&:hover': {
                        borderColor: '#ffffff',
                        background: 'rgba(255,255,255,0.15)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 25px rgba(255, 255, 255, 0.1)',
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    Rejoindre le Discord
                  </Button>
                </Stack>
              </Box>
            </Grid>

            {!isMobile && (
              <Grid size={{ xs: 12, md: 5 }}>
                <Box
                  component={motion.img}
                  src="/tournoi.png"
                  alt="Tournoi Beyblade"
                  style={{ y: imageY } as any}
                  initial={{ scale: 0.8, opacity: 0, rotate: -5 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  transition={{
                    delay: 0.2,
                    duration: 1.0,
                    ease: EASE.EMPHASIZED as any, // Using emphasized easing instead of spring for cleaner entrance
                  }}
                  sx={{
                    width: '100%',
                    filter:
                      mode === 'tournament'
                        ? 'drop-shadow(0 40px 80px rgba(96,165,250,0.5))'
                        : 'drop-shadow(0 40px 80px rgba(220,38,38,0.5))',
                  }}
                />
              </Grid>
            )}
          </Grid>
        </Container>
      </Box>

      {/* Bracket Section - Only show if there's an active tournament */}
      {activeTournament?.challongeUrl && (
        <Box sx={{ bgcolor: 'surface.low', py: 8 }}>
          <Container maxWidth="lg">
            <Box
              component={motion.div}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{
                duration: 0.6,
                ease: EASE.EMPHASIZED_DECELERATE as any,
              }}
            >
              <Typography
                variant="h3"
                fontWeight="bold"
                textAlign="center"
                sx={{ mb: 2, letterSpacing: '-0.02em' }}
              >
                {activeTournament.name}
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

            <ChallongeBracket
              challongeUrl={activeTournament.challongeUrl}
              title={activeTournament.name}
            />
          </Container>
        </Box>
      )}

      {/* Video Section */}
      <TournamentVideo videoId="nIVOi5NFjAM" />

      {/* Partnership Section */}
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box
          component={motion.div}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: EASE.EMPHASIZED as any }}
        >
          <FeedMyPartnership />
        </Box>
      </Container>

      {/* CTA Section */}
      <Container maxWidth="lg" sx={{ py: 8, position: 'relative' }}>
        <Box
          component={motion.div}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{
            duration: 0.7,
            ease: EASE.EMPHASIZED_DECELERATE as any,
          }}
          sx={{
            position: 'relative',
            borderRadius: 8,
            overflow: 'hidden',
            background: 'linear-gradient(135deg, #1a1a1a 0%, #450a0a 100%)',
            boxShadow: '0 20px 80px rgba(220, 38, 38, 0.2)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {/* Decorative Background Elements */}
          <Box
            sx={{
              position: 'absolute',
              top: '-50%',
              left: '-20%',
              width: '80%',
              height: '200%',
              background:
                'radial-gradient(circle, rgba(220, 38, 38, 0.2) 0%, rgba(0,0,0,0) 70%)',
              transform: 'rotate(-45deg)',
              pointerEvents: 'none',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: '-50%',
              right: '-20%',
              width: '80%',
              height: '200%',
              background:
                'radial-gradient(circle, rgba(251, 191, 36, 0.1) 0%, rgba(0,0,0,0) 70%)',
              transform: 'rotate(-45deg)',
              pointerEvents: 'none',
            }}
          />

          <Grid
            container
            alignItems="center"
            sx={{ position: 'relative', zIndex: 1, minHeight: 400 }}
          >
            <Grid
              size={{ xs: 12, md: 7 }}
              sx={{
                p: { xs: 4, md: 8 },
                textAlign: { xs: 'center', md: 'left' },
              }}
            >
              <Box
                component={motion.div}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{
                  delay: 0.2,
                  duration: 0.6,
                  ease: EASE.EMPHASIZED as any,
                }}
              >
                <Typography
                  variant="h2"
                  fontWeight={900}
                  gutterBottom
                  sx={{
                    color: 'white',
                    fontSize: { xs: '2.5rem', md: '3.5rem' },
                    letterSpacing: '-0.02em',
                    lineHeight: 1.1,
                  }}
                >
                  Prêt à rejoindre
                  <br />
                  <Box component="span" sx={{ color: '#fbbf24' }}>
                    la communauté ?
                  </Box>
                </Typography>
              </Box>

              <Stack
                component={motion.div}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  delay: 0.3,
                  duration: 0.6,
                  ease: EASE.EMPHASIZED as any,
                }}
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                justifyContent={{ xs: 'center', md: 'flex-start' }}
              >
                <Button
                  component="a"
                  href="https://x.com/rpb_ey"
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="contained"
                  size="large"
                  startIcon={
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-labelledby="x-icon-title"
                    >
                      <title id="x-icon-title">X (Twitter)</title>
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  }
                  sx={{
                    px: 4,
                    py: 1.8,
                    fontSize: '1rem',
                    fontWeight: 800,
                    textTransform: 'none',
                    borderRadius: '16px', // Modern slightly squared rounded corners
                    background: '#000000',
                    color: '#ffffff',
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow:
                      '0 4px 20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.2)',
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': {
                      background: '#000000',
                      borderColor: 'rgba(255,255,255,0.3)',
                      transform: 'translateY(-2px)',
                      boxShadow:
                        '0 8px 30px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.3)',
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: '-100%',
                      width: '100%',
                      height: '100%',
                      background:
                        'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
                      transition: '0.5s',
                    },
                    '&:hover::before': {
                      left: '100%',
                    },
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  Nous suivre sur X
                </Button>

                {session?.user?.role === 'admin' ? (
                  <Button
                    component={Link}
                    href="/dashboard"
                    variant="contained"
                    size="large"
                    startIcon={<AdminPanelSettings />}
                    sx={{
                      px: 4,
                      py: 1.8,
                      fontSize: '1rem',
                      fontWeight: 700,
                      textTransform: 'none',
                      borderRadius: '16px',
                      color: '#000000',
                      background: '#fbbf24',
                      boxShadow: '0 4px 20px rgba(251, 191, 36, 0.3)',
                      '&:hover': {
                        background: '#f59e0b',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 30px rgba(251, 191, 36, 0.4)',
                      },
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    Admin Dashboard
                  </Button>
                ) : (
                  <Button
                    component={Link}
                    href="/sign-in"
                    variant="outlined"
                    size="large"
                    sx={{
                      px: 4,
                      py: 1.8,
                      fontSize: '1rem',
                      fontWeight: 700,
                      textTransform: 'none',
                      borderRadius: '16px',
                      color: '#ffffff',
                      borderColor: 'rgba(255,255,255,0.2)',
                      background: 'rgba(255,255,255,0.03)',
                      backdropFilter: 'blur(10px)',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                      '&:hover': {
                        borderColor: '#ffffff',
                        background: 'rgba(255,255,255,0.1)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 25px rgba(255,255,255,0.1)',
                      },
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    Se connecter
                  </Button>
                )}
              </Stack>
            </Grid>

            <Grid
              size={{ xs: 12, md: 5 }}
              sx={{
                display: { xs: 'none', md: 'block' },
                height: '100%',
                position: 'relative',
                minHeight: 400,
                p: 4,
              }}
            >
              <DiscordStatusCard />
            </Grid>
          </Grid>
        </Box>
      </Container>
    </>
  );
}
