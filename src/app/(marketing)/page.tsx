import { getDiscordStats, getDiscordTeam } from '@/lib/discord-data';
import { prisma } from '@/lib/prisma';
import { getContent } from '@/server/actions/cms';
import HomeClient from './HomeClient';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export default async function HomePage() {
  const [stats, team, activeTournament, heroContent, rankings] =
    await Promise.all([
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
        select: {
          id: true,
          challongeUrl: true,
          name: true,
          standings: true,
          stations: true,
          activityLog: true,
        },
      }),
      getContent('home-hero-text'),
      prisma.globalRanking.findMany({
        where: {
          points: { gt: 0 },
          playerName: { notIn: ['Yoyo', 'Loteux', '𝓡𝓟𝓑 | LOTTEUX!'] },
        },
        take: 5,
        orderBy: [
          { points: 'desc' },
          { tournamentWins: 'desc' },
          { wins: 'desc' },
          { playerName: 'asc' },
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      topRankings={rankings as any}
    />
  );
}
