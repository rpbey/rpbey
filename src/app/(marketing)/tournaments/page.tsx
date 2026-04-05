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

const _ALL_STAR_EVENTS = [
  {
    id: 'allstar-paris',
    city: 'Paris',
    date: '2026-04-19',
    time: '14h00',
    venue: 'Saiba Café (étage E-Spot)',
    count: 16,
    format: 'Poules + Double Élim BO3',
    note: 'Spectateurs bienvenus · Twitch',
    color: '#fbbf24',
  },
  {
    id: 'allstar-marseille',
    city: 'Marseille',
    date: '2026-04-11',
    time: '14h30',
    venue: 'Chaperon Rouge Bar',
    count: 16,
    format: 'Poules + Arbre',
    note: null,
    color: '#f87171',
  },
] as const;

// ── Page ──

export default async function TournamentsPage() {
  const dbTournaments = await prisma.tournament.findMany({
    orderBy: { date: 'desc' },
    include: { _count: { select: { participants: true } } },
  });

  const exportDir = join(process.cwd(), 'data/exports');
  const btsCards: Array<{
    id: string;
    name: string;
    date: string;
    poster: string;
    participants: number;
  }> = [];

  for (const edition of BTS_EDITIONS) {
    try {
      const data = JSON.parse(
        readFileSync(join(exportDir, edition.file), 'utf-8'),
      );
      btsCards.push({
        id: edition.id,
        name: edition.name,
        date: edition.date,
        poster: edition.poster,
        participants: data.participantsCount || edition.fallbackCount,
      });
    } catch {
      // skip missing
    }
  }

  const dbScrapedIds = new Set(BTS_EDITIONS.map((e) => e.id));
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

  const totalTournaments = dbCards.length + btsCards.length;
  const totalParticipants =
    dbTournaments.reduce((sum, t) => sum + t._count.participants, 0) +
    btsCards.reduce((sum, b) => sum + b.participants, 0);

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
            color="text.secondary"
            sx={{
              maxWidth: 520,
              mx: 'auto',
              fontSize: { xs: '0.9rem', md: '1rem' },
              opacity: 0.6,
            }}
          >
            Compétitions officielles RPB et séries partenaires
          </Typography>

          {/* Stats */}
          <Stack
            direction="row"
            spacing={{ xs: 1.5, md: 3 }}
            justifyContent="center"
            sx={{ mt: 3 }}
          >
            {[
              {
                label: 'Tournois',
                value: totalTournaments,
                icon: EmojiEventsIcon,
                color: 'secondary.main',
              },
              {
                label: 'Joueurs',
                value: totalParticipants,
                icon: GroupsIcon,
                color: 'primary.main',
              },
              {
                label: 'Séries',
                value: 1 + PARTNER_SERIES.length,
                icon: EventIcon,
                color: '#60a5fa',
              },
            ].map((stat) => (
              <Paper
                key={stat.label}
                elevation={0}
                sx={{
                  px: { xs: 2, md: 3 },
                  py: { xs: 1, md: 1.5 },
                  borderRadius: 2.5,
                  bgcolor: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  textAlign: 'center',
                  minWidth: { xs: 80, md: 110 },
                }}
              >
                <stat.icon
                  sx={{
                    fontSize: { xs: 18, md: 22 },
                    color: stat.color,
                    mb: 0.25,
                    opacity: 0.7,
                  }}
                />
                <Typography
                  fontWeight="900"
                  sx={{
                    color: stat.color,
                    fontSize: { xs: '1.2rem', md: '1.4rem' },
                    lineHeight: 1,
                  }}
                >
                  {stat.value}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    fontSize: { xs: '0.55rem', md: '0.65rem' },
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
        </Box>

        {/* ═══════════════════════════════════════
            SECTION 1 — BEY-TAMASHII SÉRIES (NOS TOURNOIS)
            ═══════════════════════════════════════ */}
        {btsCards.length > 0 && (
          <Box sx={{ mb: { xs: 6, md: 8 } }}>
            <Heading
              title="Bey-Tamashii Séries"
              accent="OFFICIEL RPB"
              accentColor="var(--rpb-primary)"
              logo="/logo.webp"
            />

            <Grid container spacing={{ xs: 1.5, md: 2.5 }}>
              {btsCards.map((bts, i) => (
                <Grid
                  key={bts.id}
                  size={{ xs: 12, sm: i === 0 ? 12 : 6, md: i === 0 ? 12 : 6 }}
                >
                  <Link
                    href={`/tournaments/${bts.id}`}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <Paper
                      elevation={0}
                      sx={{
                        borderRadius: { xs: 3, md: 4 },
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
                      <Box
                        sx={{
                          position: 'relative',
                          height: {
                            xs: i === 0 ? 180 : 140,
                            md: i === 0 ? 240 : 180,
                          },
                          overflow: 'hidden',
                        }}
                      >
                        <Image
                          src={bts.poster}
                          alt={bts.name}
                          fill
                          style={{ objectFit: 'cover' }}
                        />
                        <Box
                          sx={{
                            position: 'absolute',
                            inset: 0,
                            background:
                              'linear-gradient(transparent 40%, rgba(0,0,0,0.8))',
                          }}
                        />
                      </Box>
                      <Box sx={{ p: { xs: 1.5, md: 2 } }}>
                        <Stack
                          direction="row"
                          alignItems="center"
                          justifyContent="space-between"
                        >
                          <Box>
                            <Typography
                              fontWeight="900"
                              sx={{
                                fontSize: {
                                  xs: i === 0 ? '1rem' : '0.9rem',
                                  md: i === 0 ? '1.1rem' : '0.95rem',
                                },
                                lineHeight: 1.3,
                              }}
                            >
                              {bts.name}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' } }}
                            >
                              {new Date(bts.date).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })}{' '}
                              · {bts.participants} joueurs
                            </Typography>
                          </Box>
                          <NavigateNextIcon
                            sx={{
                              color: 'rgba(var(--rpb-primary-rgb), 0.3)',
                              fontSize: 22,
                            }}
                          />
                        </Stack>
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
                        fontWeight="900"
                        sx={{
                          color: series.color,
                          fontSize: { xs: '0.95rem', md: '1rem' },
                          lineHeight: 1.3,
                        }}
                      >
                        {series.name}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontSize: '0.7rem' }}
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
            <Typography variant="body2" color="text.secondary">
              Aucun autre tournoi pour le moment
            </Typography>
          </Paper>
        )}

        {/* Footer */}
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
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
    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2.5 }}>
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
        fontWeight="900"
        sx={{ fontSize: { xs: '1rem', md: '1.15rem' }, letterSpacing: -0.3 }}
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
