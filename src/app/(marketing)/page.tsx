import { connection } from 'next/server';
import { getDiscordStats, getDiscordTeam } from '@/lib/discord-data';
import prisma from '@/lib/prisma';
import HomeClient from './HomeClient';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  await connection();
  
  // Parallel data fetching
  const [stats, team, activeTournament] = await Promise.all([
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
      select: { challongeUrl: true, name: true },
    }),
  ]);

  return (
    <HomeClient
      discordStats={stats}
      discordTeam={team}
      activeTournament={activeTournament}
    />
  );
}
