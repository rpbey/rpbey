import InfoIcon from '@mui/icons-material/Info';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import { Suspense } from 'react';
import RankingSearch from '@/components/rankings/RankingSearch';
import { RankingsTable } from '@/components/rankings/RankingsTable';
import SeasonSelector from '@/components/rankings/SeasonSelector';
import { PageHeader } from '@/components/ui';
import { prisma } from '@/lib/prisma';
import { getSeasonStandings, getSeasons } from '@/server/actions/season';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Classements | RPB',
  description:
    'Les meilleurs bladers de la République Populaire du Beyblade. Classement officiel mis à jour en temps réel.',
};

// Pour être sûr que la pagination est fraîche

interface RankingsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function RankingsPage({
  searchParams,
}: RankingsPageProps) {
  const resolvedSearchParams = await searchParams;
  const page = Math.max(1, Number(resolvedSearchParams.page) || 1);
  const pageSize = 20;
  const seasonSlug =
    typeof resolvedSearchParams.season === 'string'
      ? resolvedSearchParams.season
      : null;
  const searchQuery =
    typeof resolvedSearchParams.search === 'string'
      ? resolvedSearchParams.search
      : '';

  // Initialize data variables
  let seasons: any[] = [];
  let profiles: any[] = [];
  let totalCount = 0;
  let title = 'Classements Officiels';

  try {
    // Fetch available seasons
    seasons = await getSeasons();

    if (seasonSlug && seasonSlug !== 'current') {
      // Historical Season
      const seasonData = await getSeasonStandings(seasonSlug);
      if (seasonData) {
        title = `Classement - ${seasonData.name}`;

        let entries = seasonData.entries;

        // Filter by search locally for historical data (since it's a fixed array in the action)
        if (searchQuery) {
          entries = entries.filter(
            (e) =>
              e.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              e.user?.username
                ?.toLowerCase()
                .includes(searchQuery.toLowerCase()) ||
              e.user?.discordTag
                ?.toLowerCase()
                .includes(searchQuery.toLowerCase()),
          );
        }

        totalCount = entries.length;
        // Manually paginate the entries
        profiles = entries
          .slice((page - 1) * pageSize, page * pageSize)
          .map((entry) => ({
            id: entry.id,
            userId: entry.userId,
            rankingPoints: entry.points,
            wins: entry.wins,
            losses: entry.losses,
            tournamentWins: entry.tournamentWins,
            bladerName: null, // Fallback to user name in table
            favoriteType: null, // Not stored in history, optional
            user: entry.user,
            // Add missing required Profile fields for serialization safety
            createdAt: new Date(),
            updatedAt: new Date(),
            experience: 'BEGINNER',
          }));
      }
    } else {
      // Current Season (Live Profile Data)

      // 1. Récupération optimisée avec pagination
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const whereCondition: any = {
        rankingPoints: { gt: 0 },
        userId: {
          notIn: [
            'Y5gdJ6ZpfAHfsNcJQc0PMbAqyVeQAiHE', // Yoyo
            'O3Q8olZegE8dfLZTbrQtuD5T3ZqVUkxJ', // Loteux
          ],
        },
        // On peut quand même garder des filtres de secours au cas où les IDs changeraient (peu probable)
        user: {
          name: { notIn: ['Yoyo', 'Loteux', '𝓡𝓟𝓑 | LOTTEUX!'] },
        },
      };

      if (searchQuery) {
        whereCondition.OR = [
          { bladerName: { contains: searchQuery, mode: 'insensitive' } },
          { user: { name: { contains: searchQuery, mode: 'insensitive' } } },
          { user: { username: { contains: searchQuery, mode: 'insensitive' } } },
          {
            user: { discordTag: { contains: searchQuery, mode: 'insensitive' } },
          },
        ];
      }

      const [liveProfiles, count] = await Promise.all([
        prisma.profile.findMany({
          where: whereCondition,
          take: pageSize,
          skip: (page - 1) * pageSize,
          orderBy: [
            { rankingPoints: 'desc' },
            { tournamentWins: 'desc' },
            { wins: 'desc' },
            { bladerName: 'asc' },
          ],
          include: {
            user: {
              include: {
                _count: {
                  select: { tournaments: true },
                },
              },
            },
          },
        }),
        prisma.profile.count({ where: whereCondition }),
      ]);

      profiles = liveProfiles;
      totalCount = count;
    }
  } catch (error) {
    console.error('RankingsPage Error:', error);
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Alert severity="error">
          Une erreur est survenue lors du chargement des classements. Veuillez
          réessayer plus tard.
        </Alert>
      </Container>
    );
  }

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 } }}>
      <PageHeader
        title={title}
        description={
          totalCount > 0
            ? `Les ${totalCount} meilleurs bladers de la République Populaire du Beyblade.`
            : 'Classement officiel.'
        }
      />

      <Box
        sx={{
          mb: 4,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 2,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Suspense
          fallback={
            <Box
              sx={{
                height: 40,
                width: 200,
                bgcolor: 'action.hover',
                borderRadius: 1,
              }}
            />
          }
        >
          <SeasonSelector seasons={seasons} />
        </Suspense>
        <Box sx={{ width: { xs: '100%', md: 400 } }}>
          <Suspense
            fallback={
              <Box
                sx={{
                  height: 40,
                  width: '100%',
                  bgcolor: 'action.hover',
                  borderRadius: 1,
                }}
              />
            }
          >
            <RankingSearch defaultValue={searchQuery} />
          </Suspense>
        </Box>
      </Box>

      <Alert
        severity="info"
        icon={<InfoIcon />}
        sx={{
          mb: 3,
          borderRadius: 3,
          bgcolor: 'primary.main',
          color: 'white',
          '& .MuiAlert-icon': { color: 'white' },
        }}
      >
        Cliquez sur le nom d&apos;un <strong>Blader</strong> pour consulter ses
        statistiques détaillées, son historique de matchs et ses pièces
        favorites.
      </Alert>

      <Suspense
        fallback={
          <Box
            sx={{
              height: 400,
              width: '100%',
              bgcolor: 'action.hover',
              borderRadius: 4,
            }}
          />
        }
      >
        <RankingsTable
          profiles={profiles}
          totalPages={totalPages}
          currentPage={page}
          totalCount={totalCount}
        />
      </Suspense>
    </Container>
  );
}
