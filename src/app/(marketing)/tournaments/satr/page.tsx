import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Box, Container, Paper, Typography } from '@mui/material';
import Image from 'next/image';
import { Suspense } from 'react';
import RankingSearch from '@/components/rankings/RankingSearch';
import { SatrBladersTable } from '@/components/rankings/SatrBladersTable';
import { SatrCharts } from '@/components/rankings/SatrCharts';
import { SatrHallOfFame } from '@/components/rankings/SatrHallOfFame';
import { SatrTable } from '@/components/rankings/SatrTable';
import { SatrTabs } from '@/components/rankings/SatrTabs';
import { type SatrBlader, type SatrRanking } from '@/generated/prisma/client';
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
          sx={{
            color: 'text.secondary',
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
