import Container from '@mui/material/Container';
import { PageHeader } from '@/components/ui';
import prisma from '@/lib/prisma';
import { RankingsTable } from '@/components/rankings/RankingsTable';

export const metadata = {
  title: 'Classements | RPB',
  description: 'Les meilleurs bladers de la République Populaire du Beyblade. Classement officiel mis à jour en temps réel.',
};

export const dynamic = 'force-dynamic'; // Pour être sûr que la pagination est fraîche

interface RankingsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function RankingsPage({ searchParams }: RankingsPageProps) {
  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams.page) || 1;
  const pageSize = 20;

  // 1. Récupération optimisée avec pagination
  const whereCondition = {
    user: {
      name: { notIn: ['Yoyo', 'Loteux'] },
      username: { notIn: ['yoyo__goat', 'loteux'] },
    },
    bladerName: { notIn: ['Yoyo', 'Loteux'] },
  };

  const [profiles, totalCount] = await Promise.all([
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

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <PageHeader
        title="Classements Officiels"
        description={`Les ${totalCount} meilleurs bladers de la République Populaire du Beyblade.`}
      />

      <RankingsTable 
        profiles={profiles} 
        totalPages={totalPages} 
        currentPage={page}
        totalCount={totalCount}
      />
    </Container>
  );
}