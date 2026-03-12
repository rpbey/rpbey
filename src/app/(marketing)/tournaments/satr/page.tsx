import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import InstagramIcon from '@mui/icons-material/Instagram';
import YouTubeIcon from '@mui/icons-material/YouTube';
import {
  alpha,
  Box,
  Container,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import type { SatrBlader, SatrRanking } from '@prisma/client';
import Image from 'next/image';
import { Suspense } from 'react';
import RankingSearch from '@/components/rankings/RankingSearch';
import { SatrBladersTable } from '@/components/rankings/SatrBladersTable';
import { SatrCharts } from '@/components/rankings/SatrCharts';
import { SatrHallOfFame } from '@/components/rankings/SatrHallOfFame';
import { SatrTable } from '@/components/rankings/SatrTable';
import { SatrTabs } from '@/components/rankings/SatrTabs';
import {
  MuiDiscordIcon as DiscordIcon,
  MuiTikTokIcon as TikTokIcon,
  MuiTwitchIcon as TwitchIcon,
  MuiXIcon as XIcon,
} from '@/components/ui/MuiIcons';
import { prisma } from '@/lib/prisma';
import { getSatrSeasonStats } from '@/server/actions/satr';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Beyblade Battle Tournament | SATR',
  description: 'Le classement officiel SATR.',
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
    season1StatsRes,
  ] = await Promise.all([
    getChampions(),
    (async () => {
      try {
        if (mode === 'ranking') {
          if (!prisma.satrRanking) return { items: [], total: 0 };
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
          if (!prisma.satrBlader) return { items: [], total: 0 };
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
        if (!prisma.satrBlader) return { totalBladers: 0, totalMatches: 0 };
        const stats = await prisma.satrBlader.aggregate({
          _sum: {
            totalWins: true,
            totalLosses: true,
          },
          _count: {
            id: true,
          },
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
    prisma.satrRanking
      ? prisma.satrRanking.findFirst({
          orderBy: { updatedAt: 'desc' },
          select: { updatedAt: true },
        })
      : null,
    getSatrSeasonStats(2),
    getSatrSeasonStats(1),
  ]);

  const totalPages = Math.ceil(rankingData.total / pageSize);
  const s2Data =
    seasonStatsRes?.success && seasonStatsRes.data
      ? seasonStatsRes.data
      : { tournamentCount: 0, uniqueParticipants: 0, metas: [] };
  const s1Data =
    season1StatsRes?.success && season1StatsRes.data
      ? season1StatsRes.data
      : { tournamentCount: 0, uniqueParticipants: 0, metas: [] };
  const allTournamentMetas = [...s1Data.metas, ...s2Data.metas];

  const socials = [
    {
      name: 'TikTok',
      url: 'https://www.tiktok.com/@sunafterthereign',
      icon: TikTokIcon,
      color: '#ff0050',
    },
    {
      name: 'Instagram',
      url: 'https://www.instagram.com/sunafterthereign',
      icon: InstagramIcon,
      color: '#E1306C',
    },
    {
      name: 'X / Twitter',
      url: 'https://x.com/SunAfterTheBey',
      icon: XIcon,
      color: '#fff',
    },
    {
      name: 'Twitch',
      url: 'https://www.twitch.tv/sunafterthereign',
      icon: TwitchIcon,
      color: '#9146FF',
    },
    {
      name: 'Discord',
      url: 'https://discord.gg/afEvCBF9XR',
      icon: DiscordIcon,
      color: '#5865F2',
    },
    {
      name: 'YouTube',
      url: 'https://www.youtube.com/channel/UCm3y-lCQUOM6Vj52LSoLTvA',
      icon: YouTubeIcon,
      color: '#FF0000',
    },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at 50% -20%, #1a1a1a 0%, #050505 100%)',
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
                width: { xs: 90, md: 130 },
                height: { xs: 45, md: 60 },
              }}
            >
              <Image
                src="/satr-logo.webp"
                alt="SATR 2 Logo"
                fill
                style={{ objectFit: 'contain', mixBlendMode: 'screen' }}
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

          {/* Right: Socials */}
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              justifyContent: { xs: 'center', md: 'flex-end' },
              width: '100%',
              order: { xs: 2, md: 3 },
            }}
          >
            <Stack direction="row" spacing={1}>
              {socials.map((s) => (
                <Tooltip key={s.name} title={s.name}>
                  <IconButton
                    component="a"
                    href={s.url}
                    target="_blank"
                    size="small"
                    sx={{
                      color: 'rgba(255,255,255,0.4)',
                      bgcolor: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      '&:hover': {
                        color: s.color,
                        bgcolor: 'rgba(255,255,255,0.08)',
                        transform: 'translateY(-3px)',
                        boxShadow: `0 5px 15px ${alpha(s.color, 0.2)}`,
                      },
                      transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }}
                  >
                    <s.icon sx={{ fontSize: { xs: 18, md: 20 } }} />
                  </IconButton>
                </Tooltip>
              ))}
            </Stack>
          </Box>
        </Box>

        {/* Hall of Fame */}
        <SatrHallOfFame
          champions={champions}
          tournamentMetas={allTournamentMetas}
        />

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
