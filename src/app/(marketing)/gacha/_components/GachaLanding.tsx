'use client';

import { CollectionsBookmark, LocalFireDepartment } from '@mui/icons-material';
import { Box, Tab, Tabs } from '@mui/material';
import type { GachaCard } from '@prisma/client';
import { useState } from 'react';
import { useSession } from '@/lib/auth-client';
import { BattleMode } from './battle/BattleMode';
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
  const [tab, setTab] = useState(0);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0a0a0a', pb: 8 }}>
      <GachaHero
        totalCards={stats.totalCards}
        totalCollectors={stats.totalCollectors}
      />

      {/* Tab navigation */}
      <Box sx={{ px: { xs: 2, md: 6 }, mb: 3 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            '& .MuiTabs-indicator': {
              bgcolor: tab === 1 ? '#ef4444' : '#8b5cf6',
              height: 3,
              borderRadius: 1.5,
            },
            '& .MuiTab-root': {
              color: 'rgba(255,255,255,0.4)',
              fontWeight: 700,
              textTransform: 'none',
              fontSize: '0.85rem',
              minHeight: 48,
              '&.Mui-selected': {
                color: tab === 1 ? '#ef4444' : '#a78bfa',
              },
            },
          }}
        >
          <Tab
            icon={<CollectionsBookmark sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label="Collection"
          />
          <Tab
            icon={<LocalFireDepartment sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label="Combat 5v5"
          />
        </Tabs>
      </Box>

      {/* Tab content */}
      {tab === 0 && (
        <>
          <GachaStatsBar stats={stats} />
          {session?.user && <GachaCollection />}
          <GachaCatalogue cards={cards} />
          <GachaLeaderboard entries={leaderboard} />
          <GachaDropRates />
        </>
      )}

      {tab === 1 && <BattleMode allCards={cards} />}
    </Box>
  );
}
