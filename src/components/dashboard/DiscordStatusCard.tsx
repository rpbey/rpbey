'use client';

import { alpha, Box, Button, Card, CardContent, Chip, Typography, useTheme } from '@mui/material';
import { useEffect, useState } from 'react';
import useSWR from 'swr';

interface DiscordStats {
  online: number;
  total: number;
  inVoice: number;
  serverName: string;
  instantInvite: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function DiscordStatusCard() {
  const theme = useTheme();
  // Use SWR for real-time updates every 30s
  const { data, error } = useSWR<DiscordStats>('/api/discord/stats', fetcher, {
    refreshInterval: 30000,
  });

  const isLoading = !data && !error;

  return (
    <Card
      elevation={0}
      sx={{
        background: `linear-gradient(135deg, ${alpha('#5865F2', 0.9)} 0%, ${alpha('#404EED', 0.95)} 100%)`,
        borderRadius: 4,
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid',
        borderColor: alpha('#fff', 0.1),
        boxShadow: '0 8px 32px rgba(88, 101, 242, 0.25)',
      }}
    >
        {/* Discord Logo Watermark */}
        <Box
            sx={{
                position: 'absolute',
                top: -20,
                right: -20,
                opacity: 0.1,
                transform: 'rotate(-15deg)',
            }}
        >
            <svg width="150" height="150" viewBox="0 0 127.14 96.36" fill="white">
                <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/>
            </svg>
        </Box>

      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
                <Typography variant="h6" fontWeight="bold" color="white" gutterBottom>
                    Rejoins la Communauté
                </Typography>
                <Typography variant="body2" color="rgba(255,255,255,0.8)">
                    Discute, échange et participe aux tournois sur le serveur Discord officiel.
                </Typography>
            </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
            <Chip 
                label={isLoading ? '...' : `${data?.online || 0} En ligne`} 
                sx={{ bgcolor: 'rgba(74, 222, 128, 0.2)', color: '#4ade80', fontWeight: 'bold', border: '1px solid rgba(74, 222, 128, 0.3)' }}
                size="small"
            />
            <Chip 
                label={isLoading ? '...' : `${data?.inVoice || 0} En vocal`} 
                sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)', color: 'white', fontWeight: 'bold', border: '1px solid rgba(255,255,255,0.2)' }}
                size="small"
            />
        </Box>

        <Button
            variant="contained"
            fullWidth
            href={data?.instantInvite || "https://discord.gg/rpb"}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
                bgcolor: 'white',
                color: '#5865F2',
                fontWeight: 800,
                textTransform: 'none',
                fontSize: '1rem',
                py: 1.5,
                '&:hover': {
                    bgcolor: '#f0f0f0',
                }
            }}
        >
            Rejoindre le Discord
        </Button>
      </CardContent>
    </Card>
  );
}
