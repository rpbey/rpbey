import type { Metadata } from 'next';
import {
  getAllGachaCards,
  getGachaLeaderboard,
  getGachaStats,
} from '@/server/actions/gacha';
import { GachaLanding } from './_components/GachaLanding';

export const metadata: Metadata = {
  title: 'Gacha TCG | RPB',
  description:
    'Collectionnez les cartes de tous les bladers légendaires ! Système gacha avec 82+ cartes, stats TCG, duels et classements.',
};

export const dynamic = 'force-dynamic';

export default async function GachaPage() {
  const [cards, stats, leaderboard] = await Promise.all([
    getAllGachaCards(),
    getGachaStats(),
    getGachaLeaderboard(),
  ]);

  return <GachaLanding cards={cards} stats={stats} leaderboard={leaderboard} />;
}
