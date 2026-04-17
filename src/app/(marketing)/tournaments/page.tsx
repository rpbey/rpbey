import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EventIcon from '@mui/icons-material/Event';
import GroupsIcon from '@mui/icons-material/Groups';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import { alpha } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { type Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { TournamentCardGrid } from '@/components/cards/TournamentCard';
import { type TournamentStatus } from '@/components/ui/StatusChip';
import { loadJsonSafe } from '@/lib/data-cache';
import { prisma } from '@/lib/prisma';
import { createPageMetadata } from '@/lib/seo-utils';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = createPageMetadata({
  title: 'Tournois | RPB',
  description:
    'Découvrez les tournois Beyblade X organisés par la République Populaire du Beyblade. Inscrivez-vous et participez !',
  path: '/tournaments',
});

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

// ── Data ──

const BTS_EDITIONS = [
  {
    id: 'bts3',
    file: 'B_TS3.json',
    name: 'Bey-Tamashii Séries #3',
    date: '2026-03-01',
    poster: '/tournaments/BTS3_poster.webp',
    fallbackCount: 73,
  },
  {
    id: 'bts2',
    file: 'B_TS2.json',
    name: 'Bey-Tamashii Séries #2',
    date: '2026-02-08',
    poster: '/tournaments/BTS2.webp',
    fallbackCount: 60,
  },
  {
    id: 'bts1',
    file: 'B_TS1.json',
    name: 'Bey-Tamashii Séries #1',
    date: '2026-01-11',
    poster: '/tournaments/BTS1_poster.webp',
    fallbackCount: 69,
  },
];

const PARTNER_SERIES = [
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
  },
  {
    id: 'wb',
    name: 'Wild Breakers',
    subtitle: 'Ultime Bataille',
    href: '/tournaments/wb',
    logo: '/wb-logo.webp',
    logoWidth: 44,
    logoHeight: 44,
    logoRounded: true,
    color: '#f87171',
  },
] as const;

// ── Page ──

export default async function TournamentsPage() {
  interface BtsCard {
    id: string;
    name: string;
    date: string;
    poster: string;
    participants: number;
    matchesCount: number;
    podium: { name: string; rank: number; wins: number; losses: number }[];
  }
  type BtsExport = {
    participants?: {
      name: string;
      rank: number;
      exactWins?: number;
      exactLosses?: number;
    }[];
    participantsCount?: number;
    matchesCount?: number;
  };

  const [dbTournaments, btsExports] = await Promise.all([
    prisma.tournament.findMany({
      orderBy: { date: 'desc' },
      include: { _count: { select: { participants: true } } },
    }),
    Promise.all(
      BTS_EDITIONS.map(async (edition) => ({
        edition,
        data: await loadJsonSafe<BtsExport>(`data/exports/${edition.file}`),
      })),
    ),
  ]);

  const btsCards: BtsCard[] = [];
  for (const { edition, data } of btsExports) {
    if (!data) continue;
    const participants = data.participants || [];
    const podium = participants
      .filter((p) => p.rank <= 3)
      .sort((a, b) => a.rank - b.rank)
      .map((p) => ({
        name: p.name.replace(/✅|✔️/g, '').trim(),
        rank: p.rank,
        wins: p.exactWins || 0,
        losses: p.exactLosses || 0,
      }));

    btsCards.push({
      id: edition.id,
      name: edition.name,
      date: edition.date,
      poster: edition.poster,
      participants: data.participantsCount || edition.fallbackCount,
      matchesCount: data.matchesCount || 0,
      podium,
    });
  }

  // Find upcoming BTS tournament from DB to feature it in the BTS section
  const nextBts = dbTournaments.find(
    (t) =>
      t.name.toLowerCase().includes('bey-tamashii') &&
      (t.status === 'UPCOMING' ||
        t.status === 'REGISTRATION_OPEN' ||
        t.status === 'CHECKIN' ||
        t.status === 'UNDERWAY'),
  );

  const dbScrapedIds = new Set(BTS_EDITIONS.map((e) => e.id));
  const dbCards = dbTournaments
    .filter((t) => !dbScrapedIds.has(t.id) && t.id !== nextBts?.id)
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

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        pb: 8,
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: { xs: '40vh', md: '50vh' },
          background:
            'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(var(--rpb-primary-rgb), 0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        },
      }}
    >
      <Container
        maxWidth="lg"
        sx={{ position: 'relative', px: { xs: 2, sm: 3 } }}
      >
        {/* ═══ HERO ═══ */}
        <Box
          sx={{
            pt: { xs: 2, md: 6 },
            pb: { xs: 3, md: 5 },
            textAlign: 'center',
          }}
        >
          <Typography
            variant="h2"
            component="h1"
            sx={{
              fontWeight: 900,
              letterSpacing: '-0.03em',
              fontSize: { xs: '1.8rem', md: '3rem' },
              mb: 1,
            }}
          >
            Nos{' '}
            <Box
              component="span"
              sx={{
                background:
                  'linear-gradient(135deg, var(--rpb-primary) 0%, var(--rpb-secondary) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Tournois
            </Box>
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: 'text.secondary',
              maxWidth: 520,
              mx: 'auto',
              fontSize: { xs: '0.9rem', md: '1rem' },
              opacity: 0.6,
            }}
          >
            Compétitions officielles RPB et séries partenaires
          </Typography>
        </Box>

        {/* ═══════════════════════════════════════
            SECTION 1 — BEY-TAMASHII SÉRIES (NOS TOURNOIS)
            ═══════════════════════════════════════ */}
        {(btsCards.length > 0 || nextBts) && (
          <Box sx={{ mb: { xs: 6, md: 8 } }}>
            <Heading
              title="Bey-Tamashii Séries"
              accent="OFFICIEL RPB"
              accentColor="var(--rpb-primary)"
              logo="/logo.webp"
            />

            <Grid container spacing={{ xs: 2, md: 3 }}>
              {/* ── Next BTS tournament (upcoming) ── */}
              {nextBts && (
                <Grid
                  size={{ xs: 12, sm: 6, md: 4 }}
                  sx={{ order: { xs: -1, md: 1 } }}
                >
                  <NextBtsTournamentCard tournament={nextBts} />
                </Grid>
              )}

              {btsCards.map((bts) => (
                <Grid key={bts.id} size={{ xs: 12, sm: 6, md: 4 }}>
                  <Link
                    href={`/tournaments/${bts.id}`}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <Paper
                      elevation={0}
                      sx={{
                        borderRadius: 3,
                        overflow: 'hidden',
                        bgcolor: 'rgba(var(--rpb-primary-rgb), 0.03)',
                        border: '1px solid rgba(var(--rpb-primary-rgb), 0.1)',
                        transition:
                          'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        '&:hover': {
                          borderColor: 'rgba(var(--rpb-primary-rgb), 0.35)',
                          transform: 'translateY(-3px)',
                          boxShadow:
                            '0 12px 32px rgba(var(--rpb-primary-rgb), 0.15)',
                        },
                      }}
                    >
                      {/* Poster — uniform max height */}
                      <Box
                        sx={{
                          position: 'relative',
                          overflow: 'hidden',
                          maxHeight: { xs: 300, md: 400 },
                        }}
                      >
                        <Image
                          src={bts.poster}
                          alt={bts.name}
                          width={1040}
                          height={1467}
                          style={{
                            width: '100%',
                            height: 'auto',
                            display: 'block',
                          }}
                        />
                        <Box
                          sx={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: '40%',
                            background:
                              'linear-gradient(transparent, rgba(0,0,0,0.8))',
                          }}
                        />
                      </Box>

                      {/* Info */}
                      <Box sx={{ p: 2 }}>
                        <Stack
                          direction="row"
                          sx={{
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            mb: 1.5,
                          }}
                        >
                          <Box>
                            <Typography
                              sx={{
                                fontWeight: '900',
                                fontSize: '0.95rem',
                                lineHeight: 1.3,
                              }}
                            >
                              {bts.name}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                color: 'text.secondary',
                                fontSize: '0.72rem',
                              }}
                            >
                              {new Date(bts.date).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })}
                            </Typography>
                          </Box>
                          <NavigateNextIcon
                            sx={{
                              color: 'rgba(var(--rpb-primary-rgb), 0.3)',
                              fontSize: 22,
                            }}
                          />
                        </Stack>

                        {/* Stats chips */}
                        <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
                          <Chip
                            icon={<GroupsIcon sx={{ fontSize: 14 }} />}
                            label={`${bts.participants} joueurs`}
                            size="small"
                            sx={{
                              height: 24,
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              bgcolor: 'rgba(var(--rpb-primary-rgb), 0.08)',
                              color: 'text.secondary',
                            }}
                          />
                          {bts.matchesCount > 0 && (
                            <Chip
                              label={`${bts.matchesCount} matchs`}
                              size="small"
                              sx={{
                                height: 24,
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                bgcolor: 'rgba(255,255,255,0.04)',
                                color: 'text.secondary',
                              }}
                            />
                          )}
                        </Stack>

                        {/* Podium */}
                        {bts.podium.length > 0 && (
                          <Stack spacing={0.5}>
                            {bts.podium.map((p) => (
                              <Stack
                                key={p.rank}
                                direction="row"
                                spacing={1}
                                sx={{
                                  alignItems: 'center',
                                  py: 0.4,
                                  px: 1,
                                  borderRadius: 1.5,

                                  bgcolor:
                                    p.rank === 1
                                      ? 'rgba(255,215,0,0.06)'
                                      : 'transparent',
                                }}
                              >
                                <Typography
                                  sx={{
                                    fontSize: '0.8rem',
                                    width: 20,
                                    textAlign: 'center',
                                  }}
                                >
                                  {p.rank === 1
                                    ? '🥇'
                                    : p.rank === 2
                                      ? '🥈'
                                      : '🥉'}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  noWrap
                                  sx={{
                                    fontWeight: p.rank === 1 ? 800 : 600,
                                    flex: 1,
                                    fontSize: '0.75rem',

                                    color:
                                      p.rank === 1 ? '#fbbf24' : 'text.primary',
                                  }}
                                >
                                  {p.name}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontSize: '0.65rem',
                                    color: 'text.disabled',
                                  }}
                                >
                                  {p.wins}V-{p.losses}D
                                </Typography>
                              </Stack>
                            ))}
                          </Stack>
                        )}
                      </Box>
                    </Paper>
                  </Link>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* ═══════════════════════════════════════
            SECTION 2 — SÉRIES PARTENAIRES
            ═══════════════════════════════════════ */}
        <Box sx={{ mb: { xs: 6, md: 8 } }}>
          <Heading title="Séries Partenaires" />

          {/* Partner links */}
          <Grid container spacing={{ xs: 1.5, md: 2 }} sx={{ mb: 3 }}>
            {PARTNER_SERIES.map((series) => (
              <Grid key={series.id} size={{ xs: 12, sm: 6 }}>
                <Link
                  href={series.href}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <Paper
                    elevation={0}
                    sx={{
                      p: { xs: 2, md: 2.5 },
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      borderRadius: 3,
                      bgcolor: alpha(series.color, 0.03),
                      border: `1px solid ${alpha(series.color, 0.1)}`,
                      transition: 'all 0.25s ease',
                      '&:hover': {
                        bgcolor: alpha(series.color, 0.07),
                        borderColor: alpha(series.color, 0.25),
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    <Box
                      sx={{
                        position: 'relative',
                        width: series.logoWidth,
                        height: series.logoHeight,
                        flexShrink: 0,
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
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        sx={{
                          fontWeight: '900',
                          color: series.color,
                          fontSize: { xs: '0.95rem', md: '1rem' },
                          lineHeight: 1.3,
                        }}
                      >
                        {series.name}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'text.secondary',
                          fontSize: '0.7rem',
                        }}
                      >
                        {series.subtitle} · Classement & Historique
                      </Typography>
                    </Box>
                    <NavigateNextIcon
                      sx={{ color: alpha(series.color, 0.3), fontSize: 24 }}
                    />
                  </Paper>
                </Link>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* ═══════════════════════════════════════
            SECTION 3 — PROCHAINS TOURNOIS / HISTORIQUE
            ═══════════════════════════════════════ */}
        {upcoming.length > 0 && (
          <Box sx={{ mb: { xs: 5, md: 6 } }}>
            <Heading title="Prochains Tournois" accentColor="#60a5fa" />
            <TournamentCardGrid tournaments={upcoming} />
          </Box>
        )}

        {completed.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Heading title="Historique" />
            <TournamentCardGrid tournaments={completed} />
          </Box>
        )}

        {upcoming.length === 0 && completed.length === 0 && (
          <Paper
            elevation={0}
            sx={{
              textAlign: 'center',
              py: { xs: 4, md: 5 },
              px: 3,
              mb: 4,
              borderRadius: 3,
              bgcolor: 'rgba(255,255,255,0.02)',
              border: '1px dashed rgba(255,255,255,0.08)',
            }}
          >
            <EventIcon
              sx={{ fontSize: 40, color: 'rgba(255,255,255,0.15)', mb: 1 }}
            />
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
              }}
            >
              Aucun autre tournoi pour le moment
            </Typography>
          </Paper>
        )}

        {/* Footer */}
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            display: 'block',
            textAlign: 'center',
            mt: 6,
            opacity: 0.12,
            letterSpacing: 2,
            fontWeight: 900,
            fontSize: { xs: '0.55rem', md: '0.7rem' },
          }}
        >
          RÉPUBLIQUE POPULAIRE DU BEYBLADE · TOURNOIS OFFICIELS
        </Typography>
      </Container>
    </Box>
  );
}

// ── Next BTS Tournament Card (upcoming) ──

function NextBtsTournamentCard({
  tournament,
}: {
  tournament: {
    id: string;
    name: string;
    date: Date;
    location: string | null;
    description: string | null;
    status: string;
    challongeUrl: string | null;
  };
}) {
  const formattedDate = tournament.date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const formattedTime = tournament.date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Paris',
  });

  // Determine poster — match the naming convention
  const edition = tournament.name.match(/#(\d+)/)?.[1];
  const poster = edition
    ? `/tournaments/BTS${edition}_poster.webp`
    : '/logo.webp';

  return (
    <Link
      href={`/tournaments/${tournament.id}`}
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          overflow: 'hidden',
          position: 'relative',
          bgcolor: 'rgba(var(--rpb-primary-rgb), 0.03)',
          border: '1px solid rgba(var(--rpb-primary-rgb), 0.25)',
          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          '&:hover': {
            borderColor: 'rgba(var(--rpb-primary-rgb), 0.5)',
            transform: 'translateY(-3px)',
            boxShadow: '0 12px 32px rgba(var(--rpb-primary-rgb), 0.2)',
          },
        }}
      >
        {/* Poster */}
        <Box
          sx={{
            position: 'relative',
            overflow: 'hidden',
            maxHeight: { xs: 300, md: 400 },
          }}
        >
          <Image
            src={poster}
            alt={tournament.name}
            width={1040}
            height={1467}
            style={{ width: '100%', height: 'auto', display: 'block' }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '40%',
              background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
            }}
          />
          {/* UPCOMING badge */}
          <Chip
            label="À VENIR"
            size="small"
            sx={{
              position: 'absolute',
              top: 12,
              left: 12,
              fontWeight: 900,
              fontSize: '0.65rem',
              height: 24,
              bgcolor: 'var(--rpb-primary)',
              color: '#fff',
              letterSpacing: 1,
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            }}
          />
        </Box>

        {/* Info */}
        <Box sx={{ p: 2 }}>
          <Stack
            direction="row"
            sx={{
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 1.5,
            }}
          >
            <Box>
              <Typography
                sx={{
                  fontWeight: '900',
                  fontSize: '0.95rem',
                  lineHeight: 1.3,
                }}
              >
                {tournament.name}
              </Typography>
            </Box>
            <NavigateNextIcon
              sx={{ color: 'rgba(var(--rpb-primary-rgb), 0.3)', fontSize: 22 }}
            />
          </Stack>

          {/* Date & Location */}
          <Stack spacing={0.75} sx={{ mb: 1.5 }}>
            <Stack
              direction="row"
              spacing={0.75}
              sx={{
                alignItems: 'center',
              }}
            >
              <CalendarMonthIcon
                sx={{ fontSize: 14, color: 'var(--rpb-primary)', opacity: 0.7 }}
              />
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  fontSize: '0.73rem',
                }}
              >
                {formattedDate} à {formattedTime}
              </Typography>
            </Stack>
            {tournament.location && (
              <Stack
                direction="row"
                spacing={0.75}
                sx={{
                  alignItems: 'center',
                }}
              >
                <LocationOnIcon
                  sx={{
                    fontSize: 14,
                    color: 'var(--rpb-primary)',
                    opacity: 0.7,
                  }}
                />
                <Typography
                  variant="caption"
                  noWrap
                  sx={{
                    color: 'text.secondary',
                    fontWeight: 600,
                    fontSize: '0.7rem',
                  }}
                >
                  {tournament.location.split(',')[0]}
                </Typography>
              </Stack>
            )}
          </Stack>

          {/* CTA */}
          {tournament.challongeUrl && (
            <Box
              sx={{
                py: 1,
                px: 2,
                borderRadius: 2,
                bgcolor: 'rgba(var(--rpb-primary-rgb), 0.1)',
                border: '1px solid rgba(var(--rpb-primary-rgb), 0.2)',
                textAlign: 'center',
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 900,
                  color: 'var(--rpb-primary)',
                  fontSize: '0.72rem',
                  letterSpacing: 0.5,
                }}
              >
                S&apos;INSCRIRE
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>
    </Link>
  );
}

// ── Section heading ──

function Heading({
  title,
  accent,
  accentColor,
  logo,
}: {
  title: string;
  accent?: string;
  accentColor?: string;
  logo?: string;
}) {
  return (
    <Stack
      direction="row"
      spacing={1.5}
      sx={{
        alignItems: 'center',
        mb: 2.5,
      }}
    >
      <Box
        sx={{
          width: 3,
          height: 24,
          borderRadius: 2,
          bgcolor: accentColor || 'rgba(255,255,255,0.2)',
          flexShrink: 0,
        }}
      />
      {logo && (
        <Image
          src={logo}
          alt=""
          width={24}
          height={24}
          style={{ borderRadius: '50%' }}
        />
      )}
      <Typography
        variant="h6"
        sx={{
          fontWeight: '900',
          fontSize: { xs: '1rem', md: '1.15rem' },
          letterSpacing: -0.3,
        }}
      >
        {title}
      </Typography>
      {accent && accentColor && (
        <Chip
          label={accent}
          size="small"
          sx={{
            fontWeight: 900,
            fontSize: '0.55rem',
            height: 20,
            bgcolor: `color-mix(in srgb, ${accentColor} 15%, transparent)`,
            color: accentColor,
            border: `1px solid color-mix(in srgb, ${accentColor} 25%, transparent)`,
          }}
        />
      )}
    </Stack>
  );
}
