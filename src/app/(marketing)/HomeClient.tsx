'use client';

import { FiberManualRecord } from '@mui/icons-material';
import { useMediaQuery, useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { domAnimation, LazyMotion, type MotionStyle, m } from 'framer-motion';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { DynamicBlock } from '@/components/cms/DynamicBlock';
import {
  FeedMyPartnership,
  RankingPreview,
  TournamentLiveCarousel,
  TournamentVideo,
} from '@/components/marketing';
import { useThemeMode } from '@/components/theme/ThemeRegistry';
import { FadeIn, ScaleOnHover } from '@/components/ui/FadeIn';
import type { DiscordStats, TeamGroup } from '@/lib/discord-data';

// Dynamic imports for heavy components below the fold
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

interface HomeClientProps {
  activeTournament?: {
    id: string;
    name: string;
    challongeUrl: string | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    standings: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stations: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    activityLog: any;
  } | null;
  heroContent?: string;
  discordStats?: DiscordStats | null;
  discordTeam?: TeamGroup[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  const theme = useTheme();
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const heroOpacity = 1;

  return (
    <LazyMotion features={domAnimation}>
      {/* Hero Section - MD3 Expressive 2026 */}
      <Box
        component={m.div}
        style={{ opacity: heroOpacity } as MotionStyle}
        sx={{
          position: 'relative',
          minHeight: { xs: 'auto', md: '95vh' },
          display: 'flex',
          alignItems: { xs: 'flex-start', md: 'center' },
          overflow: 'hidden',
          pt: { xs: 4, md: 0 },
          bgcolor: 'black', // Pure black base for video/image contrast
        }}
      >
        {/* Background Layer */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            zIndex: 0,
            '&::after': {
              content: '""',
              position: 'absolute',
              inset: 0,
              background:
                mode === 'tournament'
                  ? 'linear-gradient(to bottom, rgba(15,23,42,0.4) 0%, rgba(15,23,42,0.9) 50%, #020617 100%)'
                  : 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 50%, #0F0F0F 100%)',
              zIndex: 2,
            },
          }}
        >
          {/* Video Background (Desktop) */}
          {!isTablet && (
            <video
              autoPlay
              loop
              muted
              playsInline
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                zIndex: 1,
                opacity: 0.6,
              }}
            >
              <source src="/rpb.mp4" type="video/mp4" />
            </video>
          )}

          {/* Fallback Image / Mobile Background */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${backgroundImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              zIndex: 0,
              opacity: isTablet ? 1 : 0.4,
              filter: 'blur(2px)', // Subtle blur for depth
            }}
          />
        </Box>

        <Container
          maxWidth="lg"
          sx={{
            position: 'relative',
            zIndex: 3, // Above all background layers
            px: { xs: 3, md: 4 },
            py: { xs: 8, md: 10 },
          }}
        >
          <Grid container spacing={6} alignItems="center">
            <Grid size={{ xs: 12, md: 7 }}>
              <Box
                component={m.div}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: EASE.EMPHASIZED }}
              >
                {activeTournament && (
                  <FadeIn delay={0.2}>
                    <Chip
                      icon={
                        <FiberManualRecord
                          sx={{
                            fontSize: 12,
                            animation: 'pulse 1.5s infinite',
                          }}
                        />
                      }
                      label={`EN DIRECT : ${activeTournament.name}`}
                      component={Link}
                      href={`/tournaments/${activeTournament.id}`}
                      sx={{
                        mb: 3,
                        px: 1,
                        py: 2.5,
                        borderRadius: '24px',
                        bgcolor: 'rgba(220, 38, 38, 0.1)',
                        color: '#ef4444',
                        fontWeight: 800,
                        border: '1px solid rgba(220, 38, 38, 0.3)',
                        backdropFilter: 'blur(8px)',
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: 'rgba(220, 38, 38, 0.2)',
                          borderColor: '#ef4444',
                        },
                        '@keyframes pulse': {
                          '0%': { opacity: 1 },
                          '50%': { opacity: 0.5 },
                          '100%': { opacity: 1 },
                        },
                      }}
                    />
                  </FadeIn>
                )}

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
                      aspectRatio: '1040/1467',
                      bgcolor: 'black',
                    }}
                  >
                    <Image
                      src={
                        activeTournament?.id === 'cm-bts3-auto-imported' ||
                        activeTournament?.name
                          .toLowerCase()
                          .includes('bey-tamashii series #3')
                          ? '/tournaments/BTS3_poster.gif'
                          : '/canvas.webp'
                      }
                      alt="RPB Tournament"
                      fill
                      sizes="(max-width: 768px) 100vw, 40vw"
                      style={{
                        objectFit: 'cover',
                      }}
                      unoptimized={
                        activeTournament?.id === 'cm-bts3-auto-imported' ||
                        activeTournament?.name
                          .toLowerCase()
                          .includes('bey-tamashii series #3')
                      }
                      priority
                    />
                    {activeTournament && (
                      <Box sx={{ position: 'absolute', inset: 0, zIndex: 2 }}>
                        <TournamentLiveCarousel tournament={activeTournament} />
                      </Box>
                    )}
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
                  variant="elevation"
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
                          component="h2"
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
                          TOP 5 BLADERS - RPB
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

                    <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                      <Button
                        variant="outlined"
                        fullWidth
                        sx={{ borderRadius: 2 }}
                        component={Link}
                        href="/rankings"
                      >
                        Voir tout
                      </Button>
                    </Box>
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

      <TournamentVideo videoId="4T_oJDeY8PU" />

      <Container maxWidth="lg" sx={{ py: 10 }}>
        <FeedMyPartnership />
      </Container>
    </LazyMotion>
  );
}
