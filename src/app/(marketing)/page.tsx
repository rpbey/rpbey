import { cacheLife } from 'next/cache';
import { getDiscordStats, getDiscordTeam } from '@/lib/discord-data';
import { prisma } from '@/lib/prisma';
import { getContent } from '@/server/actions/cms';
import HomeClient from './HomeClient';

export default async function HomePage() {
  'use cache';
  cacheLife('minutes');

  const [stats, team, activeTournament, heroContent] = await Promise.all([
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
  ]);

  return (
    <HomeClient
      discordStats={stats}
      discordTeam={team}
      activeTournament={activeTournament}
      heroContent={heroContent?.content}
    />
  );
}
