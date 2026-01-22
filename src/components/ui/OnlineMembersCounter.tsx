'use client';

import { Box, Chip, Skeleton, Typography, keyframes } from '@mui/material';
import { useEffect, useState } from 'react';

const pulse = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(34, 197, 94, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
  }
`;

export function OnlineMembersCounter() {
  const [onlineCount, setOnlineCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch('/api/bot/status');
        if (res.ok) {
          const data = await res.json();
          setOnlineCount(data.onlineCount);
        }
      } catch (error) {
        console.error('Failed to fetch online count', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <Skeleton variant="rounded" width={120} height={32} />;
  }

  if (onlineCount === null) return null;

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1.5,
        bgcolor: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(8px)',
        px: 2,
        py: 1,
        borderRadius: 4,
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
      }}
    >
      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box
          sx={{
            width: 10,
            height: 10,
            bgcolor: '#22c55e',
            borderRadius: '50%',
            animation: `${pulse} 2s infinite`,
          }}
        />
      </Box>
      <Typography
        variant="subtitle2"
        fontWeight={700}
        sx={{ color: 'white', letterSpacing: '0.05em' }}
      >
        {onlineCount.toLocaleString()} <span style={{ opacity: 0.7, fontWeight: 400 }}>EN LIGNE</span>
      </Typography>
    </Box>
  );
}
