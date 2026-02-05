'use client';

import { AdminPanelSettings } from '@mui/icons-material';
import { GlobalStyles, useMediaQuery, useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { AnimatePresence, type MotionStyle, motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { DynamicBlock } from '@/components/cms/DynamicBlock';
import {
  FeedMyPartnership,
  RankingPreview,
  TournamentVideo,
} from '@/components/marketing';
import { useThemeMode } from '@/components/theme/ThemeRegistry';
import { FadeIn, ScaleOnHover } from '@/components/ui/FadeIn';
import { useSession } from '@/lib/auth-client';
import type { DiscordStats, TeamGroup } from '@/lib/discord-data';

// Dynamic imports for heavy components below the fold
const ChallongeBracket = dynamic(
  () =>
    import('@/components/tournaments/ChallongeBracket').then(
      (mod) => mod.ChallongeBracket,
    ),
  {
    loading: () => <Box sx={{ height: 600, bgcolor: 'background.paper' }} />,
    ssr: false, // Client-side only
  },
);

const DiscordStatusCard = dynamic(
  () =>
    import('@/components/ui/DiscordStatusCard').then(
      (mod) => mod.DiscordStatusCard,
    ),
  {
    ssr: false,
  },
);

// MD3 Expressive 2026 - Spring-based easing for organic motion
const EASE = {
  // Emphasized - main transitions
  EMPHASIZED: [0.2, 0.0, 0.0, 1.0] as const,
  // Emphasized Decelerate - entries
  EMPHASIZED_DECELERATE: [0.05, 0.7, 0.1, 1.0] as const,
  // Emphasized Accelerate - exits
  EMPHASIZED_ACCELERATE: [0.3, 0.0, 0.8, 0.15] as const,
  // Standard - subtle transitions
  STANDARD: [0.2, 0.0, 0, 1.0] as const,
  // Expressive - playful, bouncy (MD3 2026)
  EXPRESSIVE: [0.34, 1.56, 0.64, 1] as const,
};

// MD3 Expressive spring configs
const SPRING = {
  // Snappy for interactions
  snappy: { stiffness: 400, damping: 30, mass: 1 },
  // Bouncy for playful elements
  bouncy: { stiffness: 300, damping: 20, mass: 1.2 },
  // Gentle for large elements
  gentle: { stiffness: 100, damping: 20, mass: 1 },
};

interface HomeClientProps {
  activeTournament?: {
    id: string;
    name: string;
    challongeUrl: string | null;
  } | null;
  heroContent?: string;
  discordStats?: DiscordStats | null;
  discordTeam?: TeamGroup[];
  topRankings?: any[];
}

export default function HomeClient({
  activeTournament,
  heroContent,
  discordStats,
  discordTeam,
  topRankings = [],
}: HomeClientProps) {
  const { backgroundImage, mode } = useThemeMode();
  const { data: session } = useSession();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const [activeHeroTab, setActiveHeroTab] = useState<'tournament' | 'discord'>(
    'tournament',
  );
  const heroOpacity = 1;

  return (
    <>
      {/* Hero Section - MD3 Expressive 2026 */}
      <Box
        component={motion.div}
        style={{ opacity: heroOpacity } as MotionStyle}
        sx={{
          position: 'relative',
          minHeight: { xs: 'auto', md: '95vh' },
          display: 'flex',
          alignItems: { xs: 'flex-start', md: 'center' },
          overflow: 'hidden',
          pt: { xs: 4, md: 0 },
          bgcolor: 'surface.lowest', // MD3 base
        }}
      >
        {/* Background Overlay with subtle gradient */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            zIndex: -1,
            '&::after': {
              content: '""',
              position: 'absolute',
              inset: 0,
              background:
                mode === 'tournament'
                  ? 'linear-gradient(to bottom, rgba(15,23,42,0.3) 0%, rgba(15,23,42,0.95) 100%)'
                  : 'linear-gradient(to bottom, rgba(15,15,15,0.2) 0%, rgba(15,15,15,0.9) 100%)',
            },
          }}
        />

        <Container
          maxWidth="lg"
          sx={{
            position: 'relative',
            zIndex: 1,
            px: { xs: 3, md: 4 },
            py: { xs: 8, md: 10 },
          }}
        >
          <Grid container spacing={6} alignItems="center">
            <Grid size={{ xs: 12, md: 7 }}>
              <Box
                component={motion.div}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: EASE.EMPHASIZED }}
              >
                <Typography
                  variant="h1"
                  sx={{
                    fontSize: {
                      xs: 'clamp(2.5rem, 10vw, 3.5rem)',
                      sm: '4.5rem',
                      md: '5.5rem',
                      lg: '6.5rem',
                    },
                    fontWeight: 900,
                    lineHeight: { xs: 1.1, md: 0.95 },
                    letterSpacing: '-0.05em',
                    mb: 3,
                    textTransform: 'uppercase',
                    textAlign: { xs: 'center', md: 'left' },
                    fontVariationSettings: '"wght" 900, "opsz" 100',
                  }}
                >
                  République
                  <br />
                  Populaire
                  <br />
                  <Box
                    component="span"
                    sx={{
                      background:
                        'linear-gradient(135deg, #dc2626 0%, #fbbf24 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      filter: 'drop-shadow(0 10px 20px rgba(220,38,38,0.3))',
                    }}
                  >
                    Beyblade
                  </Box>
                </Typography>

                <Box
                  sx={{
                    mb: 5,
                    pl: 0.5,
                    borderLeft: { xs: 'none', md: '4px solid #dc2626' },
                    textAlign: { xs: 'center', md: 'left' },
                  }}
                >
                  <DynamicBlock
                    slug="home-hero-text"
                    initialContent={heroContent}
                    fallback="La plus grande communauté française de Beyblade X. Compétition, partage et passion."
                    className="hero-text-block"
                  />
                </Box>

                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={2}
                  alignItems={{ xs: 'center', md: 'flex-start' }}
                >
                  <Button
                    component={Link}
                    href="/tournaments"
                    variant="contained"
                    size="large"
                    sx={{
                      width: { xs: '100%', sm: 'auto' },
                      height: 64,
                      px: 6,
                      borderRadius: '32px', // MD3 Full Round
                      fontSize: '1.1rem',
                      fontWeight: 800,
                      background: '#dc2626',
                      color: 'white',
                      boxShadow: '0 15px 30px rgba(220,38,38,0.4)',
                      '&:hover': {
                        background: '#b91c1c',
                        transform: 'scale(1.05)',
                      },
                      transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }}
                  >
                    Rejoindre l'Arène
                  </Button>
                  <Button
                    component="a"
                    href="https://discord.gg/rpb"
                    variant="outlined"
                    size="large"
                    sx={{
                      width: { xs: '100%', sm: 'auto' },
                      height: 64,
                      px: 4,
                      borderRadius: '32px',
                      borderWidth: 2,
                      borderColor: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      backdropFilter: 'blur(10px)',
                      '&:hover': {
                        borderWidth: 2,
                        borderColor: 'white',
                        bgcolor: 'rgba(255,255,255,0.1)',
                      },
                    }}
                  >
                    Notre Discord
                  </Button>
                </Stack>
              </Box>
            </Grid>

            {!isTablet && (
              <Grid size={{ xs: 12, md: 5 }}>
                <FadeIn delay={0.4} direction="left">
                  <Box
                    sx={{
                      position: 'relative',
                      borderRadius: '48px', // MD3 Large Container
                      overflow: 'hidden',
                      boxShadow: '0 40px 100px rgba(0,0,0,0.6)',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    <Image
                      src="/canvas.png"
                      alt="RPB Tournament"
                      width={600}
                      height={800}
                      style={{
                        objectFit: 'cover',
                        width: '100%',
                        height: 'auto',
                      }}
                      priority
                    />
                  </Box>
                </FadeIn>
              </Grid>
            )}
          </Grid>
        </Container>
      </Box>

      {/* Sections with Surface Colors */}
      <Box sx={{ bgcolor: 'surface.low', py: 10 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 5 }}>
              <ScaleOnHover>
                <Card
                  variant="filled"
                  sx={{
                    bgcolor: 'surface.high',
                    borderRadius: '32px',
                    height: '100%',
                    p: 1,
                    overflow: 'hidden',
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <CardContent>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{ mb: 3 }}
                    >
                      <Box>
                        <Typography
                          variant="h5"
                          fontWeight={900}
                          color="text.primary"
                          sx={{ letterSpacing: '-0.02em' }}
                        >
                          Classement Live
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          fontWeight={600}
                        >
                          TOP 5 BLADERS - SAISON 2
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: '#22c55e',
                          boxShadow: '0 0 12px #22c55e',
                          animation: 'pulse 2s infinite',
                        }}
                      />
                    </Stack>

                    <RankingPreview rankings={topRankings} />
                  </CardContent>
                </Card>
              </ScaleOnHover>
            </Grid>

            <Grid size={{ xs: 12, md: 7 }}>
              <DiscordStatusCard
                initialStats={discordStats}
                initialTeam={discordTeam}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>

      <style jsx global>{`
        @keyframes pulse {
          0% { transform: scale(0.95); opacity: 0.7; }
          70% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(0.95); opacity: 0.7; }
        }
      `}</style>

      <TournamentVideo videoId="nIVOi5NFjAM" />

      <Container maxWidth="lg" sx={{ py: 10 }}>
        <FeedMyPartnership />
      </Container>
    </>
  );
}
