import { connection } from 'next/server';
import { getDiscordStats, getDiscordTeam } from '@/lib/discord-data';
import HomeClient from './HomeClient';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  await connection();
  const stats = await getDiscordStats();
  const team = await getDiscordTeam();

  return <HomeClient discordStats={stats} discordTeam={team} />;
}
