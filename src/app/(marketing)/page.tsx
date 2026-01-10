import { getDiscordStats, getDiscordTeam } from '@/lib/discord-data';
import HomeClient from './HomeClient';

export default async function HomePage() {
  const stats = await getDiscordStats();
  const team = await getDiscordTeam();

  return <HomeClient discordStats={stats} discordTeam={team} />;
}
