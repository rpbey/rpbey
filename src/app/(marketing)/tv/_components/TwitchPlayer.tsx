'use client';

import { Box } from '@mui/material';
import { useEffect, useState } from 'react';

interface TwitchPlayerProps {
  channelName: string;
  isLive: boolean;
  videoId?: string | null;
  domain?: string;
}

export default function TwitchPlayer({
  channelName,
  isLive,
  videoId,
  domain = 'rpbey.fr',
}: TwitchPlayerProps) {
  const [hostname, setHostname] = useState<string>(domain);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setHostname(window.location.hostname);
    }
  }, [domain]);

  const playerBaseUrl = 'https://player.twitch.tv/';
  // Note: 'parent' must match the embedding domain.
  const parentParam = `&parent=${hostname}&parent=${domain}&parent=www.${domain}&parent=localhost&parent=46.224.145.55`;
  const autoplayParam = '&autoplay=true';

  let playerSrc = `${playerBaseUrl}?channel=${channelName}${parentParam}${autoplayParam}`;

  // Si la chaîne est hors ligne et qu'on a un ID de vidéo (dernière diffusion), on lance le replay
  if (!isLive && videoId) {
    playerSrc = `${playerBaseUrl}?video=${videoId}${parentParam}${autoplayParam}`;
  }

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        aspectRatio: '16/9',
        bgcolor: 'black',
        borderRadius: { xs: 0, sm: 3 },
        overflow: 'hidden',
        mb: 2,
        boxShadow: 3,
      }}
    >
      <iframe
        src={playerSrc}
        title="Twitch Player"
        height="100%"
        width="100%"
        allowFullScreen
        style={{ border: 'none' }}
      />
    </Box>
  );
}
