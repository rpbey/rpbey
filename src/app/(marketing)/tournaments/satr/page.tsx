import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  alpha,
  Box,
  Chip,
  Container,
  Grid,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import type { SatrBlader, SatrRanking } from '@prisma/client';
import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';
import RankingSearch from '@/components/rankings/RankingSearch';
import { SatrBladersTable } from '@/components/rankings/SatrBladersTable';
import { SatrCharts } from '@/components/rankings/SatrCharts';
import { SatrHallOfFame } from '@/components/rankings/SatrHallOfFame';
import { SatrTable } from '@/components/rankings/SatrTable';
import { SatrTabs } from '@/components/rankings/SatrTabs';
import { prisma } from '@/lib/prisma';
import { getSatrSeasonStats } from '@/server/actions/satr';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Classement SAtR | Sun After The Reign',
  description:
    'Le classement officiel des Beyblade Battle Tournaments de Sun After the Reign.',
};

interface SatrPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function getChampions() {
  try {
    const path = join(process.cwd(), 'data', 'satr_champions.json');
    const content = await readFile(path, 'utf-8');
    return JSON.parse(content);
  } catch {
    return [];
  }
}

export default async function SatrPage({ searchParams }: SatrPageProps) {
  const resolvedSearchParams = await searchParams;
  const page = Math.max(1, Number(resolvedSearchParams.page) || 1);
  const pageSize = 100;
  const searchQuery =
    typeof resolvedSearchParams.search === 'string'
      ? resolvedSearchParams.search
      : '';
  const mode = (
    resolvedSearchParams.view === 'career' ? 'career' : 'ranking'
  ) as 'ranking' | 'career';

  const [
    champions,
    rankingData,
    globalStats,
    lastUpdate,
    seasonStatsRes,
    allRankingsRaw,
  ] = await Promise.all([
    getChampions(),
    (async () => {
      try {
        if (mode === 'ranking') {
          const whereCondition = searchQuery
            ? {
                playerName: {
                  contains: searchQuery,
                  mode: 'insensitive' as const,
                },
              }
            : {};
          const [rankings, count] = await Promise.all([
            prisma.satrRanking.findMany({
              where: whereCondition,
              orderBy: { rank: 'asc' },
              take: pageSize,
              skip: (page - 1) * pageSize,
            }),
            prisma.satrRanking.count({ where: whereCondition }),
          ]);
          return { items: rankings, total: count };
        } else {
          const whereCondition = searchQuery
            ? {
                name: {
                  contains: searchQuery,
                  mode: 'insensitive' as const,
                },
              }
            : {};
          const [bladers, count] = await Promise.all([
            prisma.satrBlader.findMany({
              where: whereCondition,
              orderBy: [{ tournamentWins: 'desc' }, { totalWins: 'desc' }],
              take: pageSize,
              skip: (page - 1) * pageSize,
            }),
            prisma.satrBlader.count({ where: whereCondition }),
          ]);
          return { items: bladers, total: count };
        }
      } catch (e) {
        console.error('Data fetch error:', e);
        return { items: [], total: 0 };
      }
    })(),
    (async () => {
      try {
        const stats = await prisma.satrBlader.aggregate({
          _sum: { totalWins: true, totalLosses: true },
          _count: { id: true },
        });
        return {
          totalBladers: stats._count.id,
          totalMatches: Math.floor(
            ((stats._sum.totalWins || 0) + (stats._sum.totalLosses || 0)) / 2,
          ),
        };
      } catch {
        return { totalBladers: 0, totalMatches: 0 };
      }
    })(),
    prisma.satrRanking.findFirst({
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true },
    }),
    getSatrSeasonStats(2),
    // All rankings for analysis charts
    prisma.satrRanking.findMany({ orderBy: { rank: 'asc' } }),
  ]);

  const allRankings = allRankingsRaw as SatrRanking[];
  const totalPages = Math.ceil(rankingData.total / pageSize);
  const s2Data =
    seasonStatsRes?.success && seasonStatsRes.data
      ? seasonStatsRes.data
      : { tournamentCount: 0, uniqueParticipants: 0, metas: [] };
  const allTournamentMetas = [...s2Data.metas];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at 50% -20%, #1a0f00 0%, #050505 100%)',
        pt: { xs: 2, md: 4 },
        pb: 8,
      }}
    >
      <Container maxWidth="lg" sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
        <Box
          sx={{
            mb: { xs: 4, md: 6 },
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: { xs: 2, md: 3 },
            px: { xs: 1, md: 0 },
          }}
        >
          {/* Left: Logo */}
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              justifyContent: { xs: 'center', md: 'flex-start' },
              width: '100%',
            }}
          >
            <Box
              sx={{
                position: 'relative',
                width: { xs: 80, md: 100 },
                height: { xs: 40, md: 50 },
              }}
            >
              <Image
                src="/satr-logo.webp"
                alt="Sun After The Reign Logo"
                fill
                style={{ objectFit: 'contain' }}
                priority
              />
            </Box>
          </Box>

          {/* Center: Search */}
          <Box
            sx={{
              flex: 2,
              width: '100%',
              maxWidth: { xs: '100%', md: 600 },
              order: { xs: 3, md: 2 },
            }}
          >
            <Suspense
              fallback={
                <Paper
                  sx={{
                    height: 44,
                    width: '100%',
                    bgcolor: 'rgba(255,255,255,0.05)',
                    borderRadius: 3,
                  }}
                />
              }
            >
              <RankingSearch defaultValue={searchQuery} />
            </Suspense>
          </Box>

          {/* Right: placeholder for symmetry */}
          <Box sx={{ flex: 1, display: { xs: 'none', md: 'block' } }} />
        </Box>

        {/* All-Star Saison 2 */}
        <AllStarSection />

        {/* Hall of Fame */}
        {champions.length > 0 && (
          <SatrHallOfFame
            champions={champions}
            tournamentMetas={allTournamentMetas}
          />
        )}

        <Box sx={{ position: 'relative' }}>
          <SatrTabs
            mode={mode}
            totalBladers={globalStats.totalBladers}
            totalMatches={globalStats.totalMatches}
            tournamentCount={s2Data.tournamentCount}
            uniqueParticipants={s2Data.uniqueParticipants}
          />

          {lastUpdate?.updatedAt && (
            <Typography
              variant="caption"
              sx={{
                position: 'absolute',
                top: { xs: -15, md: -20 },
                right: 8,
                color: 'rgba(255,255,255,0.3)',
                fontStyle: 'italic',
                fontWeight: 600,
                fontSize: { xs: '0.55rem', md: '0.65rem' },
                letterSpacing: 0.5,
                textTransform: 'uppercase',
              }}
            >
              Sync:{' '}
              {lastUpdate.updatedAt.toLocaleString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Typography>
          )}

          <Box sx={{ mt: { xs: 1, md: 2 } }}>
            {mode === 'career' && (
              <SatrCharts
                bladers={rankingData.items as SatrBlader[]}
                allTournamentMetas={allTournamentMetas}
                rankings={allRankings}
              />
            )}

            {mode === 'ranking' ? (
              <SatrTable
                rankings={rankingData.items as SatrRanking[]}
                totalPages={totalPages}
                currentPage={page}
                totalCount={rankingData.total}
              />
            ) : (
              <SatrBladersTable
                bladers={rankingData.items as SatrBlader[]}
                totalPages={totalPages}
                currentPage={page}
                totalCount={rankingData.total}
              />
            )}
          </Box>
        </Box>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            display: 'block',
            textAlign: 'center',
            mt: 6,
            opacity: 0.2,
            letterSpacing: 2,
            fontWeight: 900,
            fontSize: { xs: '0.6rem', md: '0.75rem' },
          }}
        >
          SUN AFTER THE REIGN • BEYBLADE BATTLE TOURNAMENT
        </Typography>
      </Container>
    </Box>
  );
}

// ── All-Star Section ──

const ALL_STAR_EVENTS = [
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

function AllStarSection() {
  return (
    <Box sx={{ mb: { xs: 4, md: 6 } }}>
      <Paper
        elevation={0}
        sx={{
          borderRadius: { xs: 3, md: 4 },
          overflow: 'hidden',
          position: 'relative',
          aspectRatio: { xs: '2/1', sm: '16/9', md: '2.5/1' },
          mb: { xs: 1.5, md: 2 },
        }}
      >
        <Image
          src="/images/satr-banner.webp"
          alt="All-Star SAtR"
          fill
          style={{ objectFit: 'cover' }}
        />
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: {
              xs: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 40%, transparent 100%)',
              md: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.15) 50%, transparent 100%)',
            },
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            px: { xs: 2, md: 3.5 },
            pb: { xs: 1.5, md: 2.5 },
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: '#fbbf24',
              fontWeight: 900,
              letterSpacing: { xs: 1.5, md: 2 },
              textTransform: 'uppercase',
              fontSize: { xs: '0.5rem', md: '0.65rem' },
            }}
          >
            Événement
          </Typography>
          <Typography
            fontWeight="900"
            sx={{
              fontSize: { xs: '1.1rem', md: '1.6rem' },
              lineHeight: 1.2,
              color: '#fff',
            }}
          >
            All-Star Saison 2
          </Typography>
        </Box>
      </Paper>

      <Grid container spacing={{ xs: 1.5, md: 2 }}>
        {ALL_STAR_EVENTS.map((event) => (
          <Grid key={event.id} size={{ xs: 12, sm: 6 }}>
            <Paper
              elevation={0}
              sx={{
                px: { xs: 1.5, md: 2 },
                py: { xs: 1.5, md: 2 },
                borderRadius: { xs: 2.5, md: 3 },
                bgcolor: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                flexDirection: 'column',
                gap: { xs: 0.75, md: 1 },
              }}
            >
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography
                  fontWeight="900"
                  sx={{ fontSize: { xs: '0.9rem', md: '0.95rem' } }}
                >
                  {event.city}
                </Typography>
                <Chip
                  label={`${event.count} joueurs`}
                  size="small"
                  sx={{
                    fontWeight: 800,
                    fontSize: '0.6rem',
                    height: 20,
                    bgcolor: alpha(event.color, 0.12),
                    color: event.color,
                  }}
                />
              </Stack>
              <Typography
                variant="body2"
                fontWeight="700"
                sx={{
                  color: 'rgba(255,255,255,0.85)',
                  fontSize: { xs: '0.78rem', md: '0.85rem' },
                }}
              >
                {new Date(event.date).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}{' '}
                — {event.time}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: 'rgba(255,255,255,0.4)',
                  fontSize: { xs: '0.65rem', md: '0.7rem' },
                }}
              >
                {event.venue} · {event.format}
                {event.note ? ` · ${event.note}` : ''}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Link
        href="https://youtu.be/MFXM_l-tz74"
        target="_blank"
        style={{ textDecoration: 'none', color: 'inherit' }}
      >
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            textAlign: 'center',
            mt: 1.5,
            color: '#fbbf24',
            opacity: 0.5,
            fontWeight: 700,
            fontSize: '0.65rem',
            transition: 'opacity 0.2s',
            '&:hover': { opacity: 1 },
          }}
        >
          VOD récapitulative de la saison
        </Typography>
      </Link>
    </Box>
  );
}
