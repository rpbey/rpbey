import { prisma } from '../src/lib/prisma';

async function testRankings() {
  try {
    console.log('Testing getSeasons...');
    const seasons = await prisma.rankingSeason.findMany({
      orderBy: { startDate: 'desc' },
    });
    console.log('Seasons count:', seasons.length);

    console.log('Testing Current Season query...');
    const page = 1;
    const pageSize = 20;
    const searchQuery = '';

    const whereCondition: any = {
      rankingPoints: { gt: 0 },
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

    console.log('Live Profiles count:', liveProfiles.length);
    console.log('Total count:', count);
  } catch (error) {
    console.error('Test Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testRankings();
