'use client';

import { Box } from '@mui/material';
import type { GachaCard } from '@prisma/client';
import { useSession } from '@/lib/auth-client';
import { GachaCatalogue } from './GachaCatalogue';
import { GachaCollection } from './GachaCollection';
import { GachaDropRates } from './GachaDropRates';
import { GachaHero } from './GachaHero';
import { GachaLeaderboard } from './GachaLeaderboard';
import { GachaStatsBar } from './GachaStatsBar';

interface GachaStats {
  totalCards: number;
  totalOwned: number;
  totalCollectors: number;
  byRarity: Record<string, number>;
  bySeries: Record<string, number>;
}

interface LeaderboardEntry {
  userId: string;
  name: string;
  image: string | null | undefined;
  discordId: string | null | undefined;
  uniqueCards: number;
  totalCards: number;
  currency: number;
  completionPct: number;
}

interface GachaLandingProps {
  cards: GachaCard[];
  stats: GachaStats;
  leaderboard: LeaderboardEntry[];
}

export function GachaLanding({ cards, stats, leaderboard }: GachaLandingProps) {
  const { data: session } = useSession();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0a0a0a', pb: 8 }}>
      <GachaHero
        totalCards={stats.totalCards}
        totalCollectors={stats.totalCollectors}
      />
      <GachaStatsBar stats={stats} />
      {session?.user && <GachaCollection />}
      <GachaCatalogue cards={cards} />
      <GachaLeaderboard entries={leaderboard} />
      <GachaDropRates />
    </Box>
  );
}
