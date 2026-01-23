import Container from '@mui/material/Container';
import { RankingsTable } from '@/components/rankings/RankingsTable';
import SeasonSelector from '@/components/rankings/SeasonSelector';
import { PageHeader } from '@/components/ui';
import prisma from '@/lib/prisma';
import { getSeasons, getSeasonStandings } from '@/server/actions/season';

export const metadata = {
  title: 'Classements | RPB',
  description:
    'Les meilleurs bladers de la République Populaire du Beyblade. Classement officiel mis à jour en temps réel.',
};

export const dynamic = 'force-dynamic'; // Pour être sûr que la pagination est fraîche

interface RankingsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function RankingsPage({
  searchParams,
}: RankingsPageProps) {
  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams.page) || 1;
  const pageSize = 20;
  const seasonSlug = typeof resolvedSearchParams.season === 'string' ? resolvedSearchParams.season : null;

  // Fetch available seasons
  const seasons = await getSeasons();

  let profiles: any[] = [];
  let totalCount = 0;
  let title = "Classements Officiels";

  if (seasonSlug && seasonSlug !== 'current') {
    // Historical Season
    const seasonData = await getSeasonStandings(seasonSlug);
    if (seasonData) {
      title = `Classement - ${seasonData.name}`;
      totalCount = seasonData.entries.length;
      // Manually paginate the entries
      profiles = seasonData.entries
        .slice((page - 1) * pageSize, page * pageSize)
        .map(entry => ({
          id: entry.id,
          userId: entry.userId,
          rankingPoints: entry.points,
          wins: entry.wins,
          losses: entry.losses,
          tournamentWins: entry.tournamentWins,
          bladerName: null, // Fallback to user name in table
          favoriteType: null, // Not stored in history, optional
          user: entry.user
        }));
    }
  } else {
    // Current Season (Live Profile Data)
    
    // 1. Récupération optimisée avec pagination
    const whereCondition = {
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
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <PageHeader
        title={title}
        description={`Les ${totalCount} meilleurs bladers de la République Populaire du Beyblade.`}
      />

      <SeasonSelector seasons={seasons} />

      <RankingsTable
        profiles={profiles}
        totalPages={totalPages}
        currentPage={page}
        totalCount={totalCount}
      />
    </Container>
  );
}
