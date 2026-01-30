import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { RankingsTable } from '@/components/rankings/RankingsTable';
import SeasonSelector from '@/components/rankings/SeasonSelector';
import { prisma } from '@/lib/prisma';
import { getSeasonStandings, getSeasons } from '@/server/actions/season';

export const metadata = {
  title: 'Classement | Dashboard RPB',
  description: 'Classement officiel RPB basé sur les points de tournoi',
};

interface LeaderboardPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function LeaderboardPage({
  searchParams,
}: LeaderboardPageProps) {
  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams.page) || 1;
  const pageSize = 20;
  const seasonSlug =
    typeof resolvedSearchParams.season === 'string'
      ? resolvedSearchParams.season
      : null;

  // Fetch available seasons
  const seasons = await getSeasons();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let profiles: any[] = [];
  let totalCount = 0;
  let title = 'Classement Officiel';

  if (seasonSlug && seasonSlug !== 'current') {
    // Historical Season
    const seasonData = await getSeasonStandings(seasonSlug);
    if (seasonData) {
      title = `Classement - ${seasonData.name}`;
      totalCount = seasonData.entries.length;
      profiles = seasonData.entries
        .slice((page - 1) * pageSize, page * pageSize)
        .map((entry) => ({
          id: entry.id,
          userId: entry.userId,
          rankingPoints: entry.points,
          wins: entry.wins,
          losses: entry.losses,
          tournamentWins: entry.tournamentWins,
          bladerName: null,
          favoriteType: null,
          user: entry.user,
        }));
    }
  } else {
    // Current Season
    const whereCondition = {
      userId: {
        notIn: [
          'Y5gdJ6ZpfAHfsNcJQc0PMbAqyVeQAiHE', // Yoyo
          'O3Q8olZegE8dfLZTbrQtuD5T3ZqVUkxJ', // Loteux
        ],
      },
      user: {
        name: { notIn: ['Yoyo', 'Loteux', '𝓡𝓟𝓑 | LOTTEUX!'] },
      },
    };

    const [liveProfiles, count] = await Promise.all([
      prisma.profile.findMany({
        where: whereCondition,
        take: pageSize,
        skip: (page - 1) * pageSize,
        orderBy: [
          { rankingPoints: 'desc' },
          { tournamentWins: 'desc' },
          { wins: 'desc' },
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
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          {title}
        </Typography>
        <Typography color="text.secondary">
          Classement officiel RPB basé sur les points de tournoi
        </Typography>
      </Box>

      <SeasonSelector seasons={seasons} baseUrl="/dashboard/leaderboard" />

      <RankingsTable
        profiles={profiles}
        totalPages={totalPages}
        currentPage={page}
        totalCount={totalCount}
        profileUrlPrefix="/dashboard/profile"
        baseUrl="/dashboard/leaderboard"
      />
    </Container>
  );
}