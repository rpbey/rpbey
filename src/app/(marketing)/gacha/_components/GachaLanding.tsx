'use client';

import {
  CollectionsBookmark,
  EmojiEvents,
  Info,
  LocalFireDepartment,
  Style,
} from '@mui/icons-material';
import { Box, Typography } from '@mui/material';
import type { GachaCard } from '@prisma/client';
import { AnimatePresence, motion } from 'framer-motion';
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

const TABS = [
  {
    id: 'collection',
    label: 'Collection',
    icon: <Style sx={{ fontSize: 22 }} />,
  },
  {
    id: 'catalogue',
    label: 'Catalogue',
    icon: <CollectionsBookmark sx={{ fontSize: 22 }} />,
  },
  {
    id: 'battle',
    label: 'Combat',
    icon: <LocalFireDepartment sx={{ fontSize: 22 }} />,
  },
  {
    id: 'ranking',
    label: 'Classement',
    icon: <EmojiEvents sx={{ fontSize: 22 }} />,
  },
  { id: 'info', label: 'Infos', icon: <Info sx={{ fontSize: 22 }} /> },
] as const;

type TabId = (typeof TABS)[number]['id'];

export function GachaLanding({ cards, stats, leaderboard }: GachaLandingProps) {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<TabId>('collection');

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#0a0a0a',
        pb: { xs: '80px', md: 4 },
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Desktop top nav */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          position: 'sticky',
          top: 0,
          zIndex: 50,
          bgcolor: 'rgba(10,10,10,0.85)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          px: 4,
          gap: 0.5,
          justifyContent: 'center',
        }}
      >
        {TABS.map((tab) => (
          <Box
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              px: 3,
              py: 2,
              cursor: 'pointer',
              color:
                activeTab === tab.id
                  ? 'rgba(255,255,255,0.85)'
                  : 'rgba(255,255,255,0.4)',
              borderBottom:
                activeTab === tab.id
                  ? '2px solid #dc2626'
                  : '2px solid transparent',
              fontWeight: 700,
              fontSize: '0.85rem',
              transition: 'all 0.2s',
              '&:hover': {
                color:
                  activeTab === tab.id
                    ? 'rgba(255,255,255,0.85)'
                    : 'rgba(255,255,255,0.6)',
              },
            }}
          >
            {tab.icon}
            {tab.label}
          </Box>
        ))}
      </Box>

      {/* Hero — visible on collection tab */}
      {activeTab === 'collection' && (
        <GachaHero
          totalCards={stats.totalCards}
          totalCollectors={stats.totalCollectors}
        />
      )}

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <Box
          key={activeTab}
          component={motion.div}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.2 }}
          sx={{ flex: 1 }}
        >
          {activeTab === 'collection' && (
            <>
              <GachaStatsBar stats={stats} />
              {session?.user && <GachaCollection />}
            </>
          )}

          {activeTab === 'catalogue' && (
            <Box sx={{ pt: { xs: 2, md: 0 } }}>
              {/* Mobile catalogue header */}
              <Box sx={{ display: { md: 'none' }, px: 2, mb: 2 }}>
                <Typography
                  variant="h5"
                  fontWeight={900}
                  sx={{ color: 'white' }}
                >
                  Catalogue
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: 'rgba(255,255,255,0.4)' }}
                >
                  {stats.totalCards} cartes disponibles
                </Typography>
              </Box>
              <GachaCatalogue cards={cards} />
            </Box>
          )}

          {activeTab === 'battle' && <BattleMode allCards={cards} />}

          {activeTab === 'ranking' && (
            <Box sx={{ pt: { xs: 2, md: 0 } }}>
              <Box sx={{ display: { md: 'none' }, px: 2, mb: 2 }}>
                <Typography
                  variant="h5"
                  fontWeight={900}
                  sx={{ color: 'white' }}
                >
                  Classement
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: 'rgba(255,255,255,0.4)' }}
                >
                  Top collectionneurs
                </Typography>
              </Box>
              <GachaLeaderboard entries={leaderboard} />
            </Box>
          )}

          {activeTab === 'info' && (
            <Box sx={{ pt: { xs: 2, md: 0 } }}>
              <Box sx={{ display: { md: 'none' }, px: 2, mb: 2 }}>
                <Typography
                  variant="h5"
                  fontWeight={900}
                  sx={{ color: 'white' }}
                >
                  Informations
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: 'rgba(255,255,255,0.4)' }}
                >
                  Taux de drop et récompenses
                </Typography>
              </Box>
              <GachaDropRates />
            </Box>
          )}
        </Box>
      </AnimatePresence>

      {/* Mobile bottom navigation — app-style */}
      <Box
        sx={{
          display: { xs: 'flex', md: 'none' },
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          bgcolor: 'rgba(10,10,10,0.92)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          px: 1,
          py: 0.5,
          pb: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))',
          justifyContent: 'space-around',
        }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <Box
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0.25,
                py: 0.75,
                px: 1,
                cursor: 'pointer',
                borderRadius: 2,
                minWidth: 56,
                color: isActive
                  ? 'rgba(255,255,255,0.85)'
                  : 'rgba(255,255,255,0.35)',
                transition: 'all 0.15s',
                position: 'relative',
                '&:active': { transform: 'scale(0.92)' },
              }}
            >
              {/* Active indicator dot */}
              {isActive && (
                <Box
                  component={motion.div}
                  layoutId="tab-indicator"
                  sx={{
                    position: 'absolute',
                    top: 0,
                    width: 20,
                    height: 3,
                    borderRadius: 2,
                    bgcolor: '#dc2626',
                  }}
                />
              )}
              {tab.icon}
              <Typography
                sx={{
                  fontSize: '0.6rem',
                  fontWeight: isActive ? 700 : 500,
                  lineHeight: 1,
                }}
              >
                {tab.label}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
