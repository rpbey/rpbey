import Container from '@mui/material/Container';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import InfoIcon from '@mui/icons-material/Info';
import { RankingsTable } from '@/components/rankings/RankingsTable';
import RankingSearch from '@/components/rankings/RankingSearch';
import SeasonSelector from '@/components/rankings/SeasonSelector';
import { PageHeader } from '@/components/ui';
import { prisma } from '@/lib/prisma';
import { getSeasonStandings, getSeasons } from '@/server/actions/season';

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
  const page = Number(resolvedSearchParams.page) || 1;
  const pageSize = 20;
  const seasonSlug =
    typeof resolvedSearchParams.season === 'string'
      ? resolvedSearchParams.season
      : null;
  const searchQuery =
    typeof resolvedSearchParams.search === 'string'
      ? resolvedSearchParams.search
      : '';

  // Fetch available seasons
  const seasons = await getSeasons();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let profiles: any[] = [];
  let totalCount = 0;
  let title = 'Classements Officiels';

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
            e.user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.user.username
              ?.toLowerCase()
              .includes(searchQuery.toLowerCase()) ||
            e.user.discordTag
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
        }));
    }
  } else {
    // Current Season (Live Profile Data)

    // 1. Récupération optimisée avec pagination
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
        <SeasonSelector seasons={seasons} />
        <Box sx={{ width: { xs: '100%', md: 400 } }}>
          <RankingSearch defaultValue={searchQuery} />
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

      <RankingsTable
        profiles={profiles}
        totalPages={totalPages}
        currentPage={page}
        totalCount={totalCount}
      />
    </Container>
  );
}
