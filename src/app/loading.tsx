'use client';

import { useEffect, useRef } from 'react';
import { Box } from '@mui/material';

export default function Loading() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 2.5;
    }
  }, []);

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        bgcolor: '#000',
        zIndex: 9999,
      }}
    >
      <Box
        component="video"
        ref={videoRef}
        src="/rpb.mp4"
        autoPlay
        muted
        loop
        playsInline
        sx={{
          width: { xs: '80%', md: '40%' },
          maxWidth: '500px',
          height: 'auto',
          filter: 'drop-shadow(0 0 20px rgba(220, 38, 38, 0.5))',
        }}
      />
    </Box>
  );
}