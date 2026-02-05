import { getDiscordStats, getDiscordTeam } from '@/lib/discord-data';
import { prisma } from '@/lib/prisma';
import { getContent } from '@/server/actions/cms';
import { connection } from 'next/server';
import HomeClient from './HomeClient';

export default async function HomePage() {
  await connection(); // Force dynamic rendering
  const [stats, team, activeTournament, heroContent, rankings] = await Promise.all([
    getDiscordStats(),
    getDiscordTeam(),
    prisma.tournament.findFirst({
      where: {
        status: {
          in: ['UNDERWAY', 'CHECKIN', 'REGISTRATION_OPEN'],
        },
        challongeUrl: { not: null },
      },
      orderBy: { date: 'desc' },
      select: { id: true, challongeUrl: true, name: true },
    }),
    getContent('home-hero-text'),
    prisma.profile.findMany({
      where: {
        rankingPoints: { gt: 0 },
        userId: {
          notIn: [
            'Y5gdJ6ZpfAHfsNcJQc0PMbAqyVeQAiHE', // Yoyo
            'O3Q8olZegE8dfLZTbrQtuD5T3ZqVUkxJ', // Loteux
          ],
        },
      },
      take: 5,
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
  ]);

  return (
    <HomeClient
      discordStats={stats}
      discordTeam={team}
      activeTournament={activeTournament}
      heroContent={heroContent?.content}
      topRankings={rankings as any}
    />
  );
}
