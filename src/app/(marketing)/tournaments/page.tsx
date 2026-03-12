import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import EventIcon from '@mui/icons-material/Event';
import GroupsIcon from '@mui/icons-material/Groups';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import { alpha } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { TournamentCardGrid } from '@/components/cards/TournamentCard';
import type { TournamentStatus } from '@/components/ui/StatusChip';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Tournois | RPB',
  description:
    'Découvrez les tournois Beyblade X organisés par la République Populaire du Beyblade. Inscrivez-vous et participez !',
  openGraph: {
    title: 'Tournois Beyblade X | RPB',
    description:
      'Résultats, classements et inscriptions aux tournois officiels RPB.',
  },
};

function mapDbStatus(status: string): TournamentStatus {
  const mapping: Record<string, TournamentStatus> = {
    UPCOMING: 'upcoming',
    PENDING: 'pending',
    ACTIVE: 'underway',
    UNDERWAY: 'underway',
    COMPLETE: 'complete',
    ARCHIVED: 'complete',
    CANCELLED: 'cancelled',
  };
  return mapping[status] || 'pending';
}

const SERIES = [
  {
    id: 'satr',
    name: 'Sun After The Reign',
    subtitle: 'Beyblade Battle Tournament',
    href: '/tournaments/satr',
    logo: '/satr-logo.webp',
    logoWidth: 56,
    logoHeight: 28,
    logoRounded: false,
    color: '#fbbf24',
    colorRgb: '251, 191, 36',
  },
  {
    id: 'wb',
    name: 'Wild Breakers',
    subtitle: 'Ultime Bataille',
    href: '/tournaments/wb',
    logo: '/wb-logo.jpg',
    logoWidth: 44,
    logoHeight: 44,
    logoRounded: true,
    color: '#f87171',
    colorRgb: '248, 113, 113',
  },
] as const;

export default async function TournamentsPage() {
  const dbTournaments = await prisma.tournament.findMany({
    orderBy: { date: 'desc' },
    include: {
      _count: {
        select: { participants: true },
      },
    },
  });

  const exportDir = join(process.cwd(), 'data/exports');
  let scrapedTournaments: Array<{
    id: string;
    name: string;
    description: string;
    startDate: string;
    status: TournamentStatus;
    currentParticipants: number;
    maxParticipants: number;
  }> = [];

  try {
    const bts2 = JSON.parse(
      readFileSync(join(exportDir, 'B_TS2.json'), 'utf-8'),
    );
    const bts3 = JSON.parse(
      readFileSync(join(exportDir, 'B_TS3.json'), 'utf-8'),
    );

    scrapedTournaments = [
      {
        id: 'bts3',
        name: 'Bey-Tamashii Séries #3',
        description:
          'Troisième édition des Bey-Tamashii Séries au Dernier Bar avant la Fin du Monde.',
        startDate: '2026-03-01',
        status: 'complete' as TournamentStatus,
        currentParticipants: bts3.participantsCount || 73,
        maxParticipants: 128,
      },
      {
        id: 'bts2',
        name: 'Bey-Tamashii Séries #2',
        description: 'Deuxième édition des Bey-Tamashii Séries.',
        startDate: '2026-02-08',
        status: 'complete' as TournamentStatus,
        currentParticipants: bts2.participantsCount || 60,
        maxParticipants: 128,
      },
    ];
  } catch (error) {
    console.error('Failed to load scraped tournaments:', error);
  }

  const dbScrapedIds = new Set(['bts2', 'bts3']);
  const dbCards = dbTournaments
    .filter((t) => !dbScrapedIds.has(t.id))
    .map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      startDate: t.date.toISOString(),
      status: mapDbStatus(t.status),
      currentParticipants: t._count.participants,
      maxParticipants: t.maxPlayers,
    }));

  const upcoming = dbCards.filter(
    (t) =>
      t.status === 'upcoming' ||
      t.status === 'pending' ||
      t.status === 'registration_open' ||
      t.status === 'underway' ||
      t.status === 'in_progress',
  );
  const completed = dbCards.filter((t) => t.status === 'complete');

  const totalTournaments = dbCards.length + scrapedTournaments.length;
  const totalParticipants =
    dbTournaments.reduce((sum, t) => sum + t._count.participants, 0) +
    scrapedTournaments.reduce((sum, t) => sum + t.currentParticipants, 0);

  const stats = [
    {
      label: 'Tournois',
      value: totalTournaments,
      icon: EmojiEventsIcon,
      color: '#fbbf24',
    },
    {
      label: 'Participations',
      value: totalParticipants,
      icon: GroupsIcon,
      color: '#dc2626',
    },
    {
      label: 'Séries',
      value: SERIES.length,
      icon: EventIcon,
      color: '#60a5fa',
    },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        position: 'relative',
        bgcolor: 'background.default',
        pb: 8,
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: { xs: '50vh', md: '60vh' },
          background: `radial-gradient(ellipse 80% 50% at 50% -10%, ${alpha('#dc2626', 0.12)} 0%, transparent 70%)`,
          pointerEvents: 'none',
        },
      }}
    >
      <Container
        maxWidth="lg"
        sx={{ position: 'relative', px: { xs: 2, sm: 3 } }}
      >
        {/* Hero Header */}
        <Box
          sx={{
            pt: { xs: 5, md: 8 },
            pb: { xs: 4, md: 6 },
            textAlign: 'center',
          }}
        >
          <Typography
            variant="h2"
            component="h1"
            sx={{
              fontWeight: 900,
              letterSpacing: '-0.03em',
              fontSize: { xs: '2.5rem', md: '3.5rem' },
              mb: 2,
            }}
          >
            Nos{' '}
            <Box
              component="span"
              sx={{
                background: 'linear-gradient(135deg, #dc2626 0%, #fbbf24 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 4px 12px rgba(220, 38, 38, 0.3))',
              }}
            >
              Tournois
            </Box>
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{
              maxWidth: 600,
              mx: 'auto',
              fontWeight: 400,
              fontSize: { xs: '0.95rem', md: '1.1rem' },
              lineHeight: 1.6,
              opacity: 0.7,
            }}
          >
            Participez aux tournois Beyblade X organisés par la communauté RPB.
            Classements, résultats et inscriptions.
          </Typography>
        </Box>

        {/* Stats Bar */}
        <Stack
          direction="row"
          spacing={{ xs: 1.5, md: 3 }}
          justifyContent="center"
          sx={{ mb: { xs: 5, md: 7 } }}
        >
          {stats.map((stat) => (
            <Paper
              key={stat.label}
              elevation={0}
              sx={{
                px: { xs: 2, md: 3.5 },
                py: { xs: 1.5, md: 2 },
                borderRadius: 3,
                bgcolor: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                textAlign: 'center',
                minWidth: { xs: 90, md: 130 },
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.05)',
                  borderColor: alpha(stat.color, 0.2),
                  transform: 'translateY(-2px)',
                },
              }}
            >
              <stat.icon
                sx={{
                  fontSize: { xs: 20, md: 24 },
                  color: stat.color,
                  mb: 0.5,
                  opacity: 0.8,
                }}
              />
              <Typography
                variant="h5"
                fontWeight="900"
                sx={{
                  color: stat.color,
                  fontSize: { xs: '1.3rem', md: '1.6rem' },
                  lineHeight: 1,
                }}
              >
                {stat.value}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  fontSize: { xs: '0.6rem', md: '0.7rem' },
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  fontWeight: 600,
                }}
              >
                {stat.label}
              </Typography>
            </Paper>
          ))}
        </Stack>

        {/* Bey-Tamashii Séries - Featured */}
        {scrapedTournaments.length > 0 && (
          <Box sx={{ mb: { xs: 6, md: 8 } }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                mb: 3,
              }}
            >
              <Box
                sx={{
                  width: 4,
                  height: 28,
                  borderRadius: 2,
                  background:
                    'linear-gradient(180deg, #dc2626 0%, #991b1b 100%)',
                }}
              />
              <Image
                src="/logo.png"
                alt="RPB"
                width={28}
                height={28}
                style={{ borderRadius: '50%' }}
              />
              <Typography
                variant="h5"
                fontWeight="900"
                sx={{ letterSpacing: -0.5 }}
              >
                Bey-Tamashii{' '}
                <Box component="span" sx={{ color: '#dc2626' }}>
                  Séries
                </Box>
              </Typography>
              <Chip
                label="OFFICIEL RPB"
                size="small"
                sx={{
                  fontWeight: 900,
                  fontSize: '0.6rem',
                  height: 22,
                  bgcolor: alpha('#dc2626', 0.15),
                  color: '#dc2626',
                  border: `1px solid ${alpha('#fbbf24', 0.3)}`,
                }}
              />
            </Box>

            <Grid container spacing={{ xs: 2, md: 3 }}>
              {scrapedTournaments.map((bts) => {
                const posterMap: Record<string, string> = {
                  bts3: '/tournaments/BTS3_poster.gif',
                  bts2: '/tournaments/BTS2_optimized.webp',
                };
                const poster = posterMap[bts.id];
                return (
                  <Grid key={bts.id} size={{ xs: 12, md: 6 }}>
                    <Link
                      href={`/tournaments/${bts.id}`}
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      <Paper
                        elevation={0}
                        sx={{
                          borderRadius: 4,
                          overflow: 'hidden',
                          bgcolor: alpha('#dc2626', 0.04),
                          border: `1px solid ${alpha('#dc2626', 0.15)}`,
                          transition:
                            'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                          '&:hover': {
                            borderColor: alpha('#dc2626', 0.4),
                            transform: 'translateY(-4px)',
                            boxShadow: `0 12px 32px ${alpha('#dc2626', 0.2)}`,
                          },
                        }}
                      >
                        {/* Poster */}
                        {poster && (
                          <Box
                            sx={{
                              position: 'relative',
                              height: { xs: 160, md: 200 },
                              overflow: 'hidden',
                            }}
                          >
                            <Image
                              src={poster}
                              alt={bts.name}
                              fill
                              style={{ objectFit: 'cover' }}
                            />
                            <Box
                              sx={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                height: '50%',
                                background:
                                  'linear-gradient(transparent, rgba(0,0,0,0.8))',
                              }}
                            />
                          </Box>
                        )}

                        {/* Info */}
                        <Box sx={{ p: { xs: 2, md: 2.5 } }}>
                          <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                          >
                            <Box>
                              <Typography
                                variant="subtitle1"
                                fontWeight="900"
                                sx={{ lineHeight: 1.3 }}
                              >
                                {bts.name}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {new Date(bts.startDate).toLocaleDateString(
                                  'fr-FR',
                                  {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                  },
                                )}{' '}
                                • {bts.currentParticipants} joueurs
                              </Typography>
                            </Box>
                            <Chip
                              label="Terminé"
                              size="small"
                              sx={{
                                fontWeight: 700,
                                fontSize: '0.65rem',
                                height: 22,
                                bgcolor: 'rgba(255,255,255,0.06)',
                                color: 'text.secondary',
                              }}
                            />
                          </Stack>
                        </Box>
                      </Paper>
                    </Link>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        )}

        {/* Community Tournament Series */}
        <Box sx={{ mb: { xs: 6, md: 8 } }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              mb: 3,
            }}
          >
            <Box
              sx={{
                width: 4,
                height: 28,
                borderRadius: 2,
                background: 'linear-gradient(180deg, #fbbf24 0%, #f87171 100%)',
              }}
            />
            <Typography
              variant="h5"
              fontWeight="900"
              sx={{ letterSpacing: -0.5 }}
            >
              Séries{' '}
              <Box component="span" sx={{ color: '#fbbf24' }}>
                Communautaires
              </Box>
            </Typography>
          </Box>

          <Grid container spacing={{ xs: 2, md: 3 }}>
            {SERIES.map((series) => (
              <Grid key={series.id} size={{ xs: 12, md: 6 }}>
                <Link
                  href={series.href}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <Paper
                    elevation={0}
                    sx={{
                      p: { xs: 2.5, md: 3 },
                      display: 'flex',
                      alignItems: 'center',
                      gap: { xs: 2, md: 2.5 },
                      borderRadius: 4,
                      bgcolor: alpha(series.color, 0.04),
                      border: `1px solid ${alpha(series.color, 0.12)}`,
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: `radial-gradient(circle at 0% 50%, ${alpha(series.color, 0.08)} 0%, transparent 60%)`,
                        opacity: 0,
                        transition: 'opacity 0.3s ease',
                      },
                      '&:hover': {
                        bgcolor: alpha(series.color, 0.08),
                        borderColor: alpha(series.color, 0.3),
                        transform: 'translateY(-3px)',
                        boxShadow: `0 8px 24px ${alpha(series.color, 0.15)}`,
                        '&::before': { opacity: 1 },
                      },
                    }}
                  >
                    <Box
                      sx={{
                        position: 'relative',
                        width: series.logoWidth,
                        height: series.logoHeight,
                        flexShrink: 0,
                        zIndex: 1,
                      }}
                    >
                      <Image
                        src={series.logo}
                        alt={series.name}
                        fill
                        style={{
                          objectFit: 'contain',
                          borderRadius: series.logoRounded ? '50%' : 0,
                        }}
                      />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0, zIndex: 1 }}>
                      <Typography
                        variant="subtitle1"
                        fontWeight="900"
                        sx={{ color: series.color, lineHeight: 1.3 }}
                      >
                        {series.name}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' } }}
                      >
                        {series.subtitle} • Classement & Historique
                      </Typography>
                    </Box>
                    <NavigateNextIcon
                      sx={{
                        color: alpha(series.color, 0.4),
                        fontSize: 28,
                        zIndex: 1,
                        transition: 'transform 0.2s ease',
                        '.MuiPaper-root:hover &': {
                          transform: 'translateX(4px)',
                        },
                      }}
                    />
                  </Paper>
                </Link>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Upcoming Tournaments */}
        {upcoming.length > 0 && (
          <Box sx={{ mb: { xs: 6, md: 8 } }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                mb: 3,
              }}
            >
              <Box
                sx={{
                  width: 4,
                  height: 28,
                  borderRadius: 2,
                  bgcolor: '#60a5fa',
                }}
              />
              <EventIcon sx={{ color: '#60a5fa', fontSize: 22 }} />
              <Typography
                variant="h5"
                fontWeight="900"
                sx={{ letterSpacing: -0.5 }}
              >
                Prochains{' '}
                <Box component="span" sx={{ color: '#60a5fa' }}>
                  Tournois
                </Box>
              </Typography>
              <Chip
                label={upcoming.length}
                size="small"
                sx={{
                  fontWeight: 800,
                  fontSize: '0.7rem',
                  height: 22,
                  bgcolor: alpha('#60a5fa', 0.15),
                  color: '#60a5fa',
                }}
              />
            </Box>
            <TournamentCardGrid tournaments={upcoming} />
          </Box>
        )}

        {/* No upcoming tournaments message */}
        {upcoming.length === 0 && (
          <Paper
            elevation={0}
            sx={{
              textAlign: 'center',
              py: { xs: 5, md: 7 },
              px: 3,
              mb: { xs: 6, md: 8 },
              borderRadius: 4,
              bgcolor: 'rgba(255,255,255,0.02)',
              border: '1px dashed rgba(255,255,255,0.08)',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 200,
                height: 200,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${alpha('#60a5fa', 0.06)} 0%, transparent 70%)`,
              },
            }}
          >
            <EventIcon
              sx={{
                fontSize: { xs: 44, md: 56 },
                color: alpha('#60a5fa', 0.3),
                mb: 2,
              }}
            />
            <Typography
              variant="h6"
              fontWeight="700"
              color="text.secondary"
              sx={{ mb: 0.5 }}
            >
              Aucun tournoi à venir
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'rgba(255,255,255,0.35)',
                maxWidth: 360,
                mx: 'auto',
              }}
            >
              Rejoignez notre Discord pour être informé des prochains événements
              et inscriptions.
            </Typography>
          </Paper>
        )}

        {/* Completed Tournaments */}
        <Box sx={{ mb: 6 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              mb: 3,
            }}
          >
            <Box
              sx={{
                width: 4,
                height: 28,
                borderRadius: 2,
                bgcolor: 'rgba(255,255,255,0.2)',
              }}
            />
            <Typography
              variant="h5"
              fontWeight="900"
              sx={{ letterSpacing: -0.5 }}
            >
              Tournois{' '}
              <Box component="span" sx={{ color: '#dc2626' }}>
                Terminés
              </Box>
            </Typography>
            {completed.length > 0 && (
              <Chip
                label={completed.length}
                size="small"
                sx={{
                  fontWeight: 800,
                  fontSize: '0.7rem',
                  height: 22,
                  bgcolor: 'rgba(255,255,255,0.06)',
                  color: 'text.secondary',
                }}
              />
            )}
          </Box>

          {completed.length > 0 ? (
            <TournamentCardGrid tournaments={completed} />
          ) : (
            <Paper
              elevation={0}
              sx={{
                textAlign: 'center',
                py: 6,
                borderRadius: 4,
                bgcolor: 'rgba(255,255,255,0.02)',
                border: '1px dashed rgba(255,255,255,0.08)',
              }}
            >
              <Typography variant="h6" color="text.secondary" fontWeight="600">
                Aucun tournoi terminé.
              </Typography>
            </Paper>
          )}
        </Box>

        {/* Footer watermark */}
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            display: 'block',
            textAlign: 'center',
            mt: 6,
            opacity: 0.15,
            letterSpacing: 2,
            fontWeight: 900,
            fontSize: { xs: '0.55rem', md: '0.7rem' },
          }}
        >
          RÉPUBLIQUE POPULAIRE DU BEYBLADE • TOURNOIS OFFICIELS
        </Typography>
      </Container>
    </Box>
  );
}
