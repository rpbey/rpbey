'use client';

import { useEffect, useRef } from 'react';
import Box from '@mui/material/Box';

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
        minHeight: '60vh',
        width: '100%',
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
          width: { xs: '60%', md: '30%' },
          maxWidth: '300px',
          height: 'auto',
          filter: 'drop-shadow(0 0 15px rgba(220, 38, 38, 0.4))',
        }}
      />
    </Box>
  );
}