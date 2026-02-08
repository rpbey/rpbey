'use client';

import { Box, Typography } from '@mui/material';
import dynamic from 'next/dynamic';
import {
  DiscordActivityProvider,
  useDiscordActivity,
} from '@/components/providers/DiscordActivityProvider';

const HybridArena = dynamic(() => import('@/components/activity/HybridArena'), {
  ssr: false,
  loading: () => (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#000',
      }}
    >
      <Typography color="white">Lancement du moteur hybride...</Typography>
    </Box>
  ),
});

function ActivityContent() {
  const { status } = useDiscordActivity();

  if (status === 'loading') {
    return (
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#000',
        }}
      >
        <Typography color="white">Initialisation Discord...</Typography>
      </Box>
    );
  }

  return <HybridArena />;
}

export default function ActivityPage() {
  return (
    <DiscordActivityProvider>
      <ActivityContent />
    </DiscordActivityProvider>
  );
}
