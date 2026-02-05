'use client';

import { useState, useEffect, useRef } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import * as PIXI from 'pixi.js';
import { BeybladeAssembler } from './BeybladeAssembler';

export function BeybladeArena() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [pixiApp, setPixiApp] = useState<PIXI.Application | null>(null);

  // Prototype Deck Config (DranSword 3-60 Flat)
  const demoDeck = {
    blade: 'blade_bx_01_dran_sword',
    ratchet: 'ratchet_bx_01_3_60',
    bit: 'bit_bx_01_f__flat_',
  };

  useEffect(() => {
    if (!containerRef.current) return;

    // Create PixiJS App
    const app = new PIXI.Application();

    const init = async () => {
      await app.init({
        width: window.innerWidth,
        height: window.innerHeight,
        background: '#0a0a0a',
        antialias: true,
      });

      containerRef.current?.appendChild(app.canvas);
      setPixiApp(app);
      setLoading(false);
    };

    const handleResize = () => {
      app.renderer.resize(window.innerWidth, window.innerHeight);
    };

    init();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      app.destroy(true, { children: true, texture: true });
    };
  }, []);

  return (
    <Box
      ref={containerRef}
      sx={{
        width: '100%',
        height: '100vh',
        bgcolor: '#000',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {pixiApp && !loading && (
        <BeybladeAssembler
          app={pixiApp}
          x={pixiApp.screen.width / 2}
          y={pixiApp.screen.height / 2}
          bladeId={demoDeck.blade}
          ratchetId={demoDeck.ratchet}
          bitId={demoDeck.bit}
          scale={0.8}
        />
      )}

      {loading && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CircularProgress color="primary" />
          <Typography sx={{ mt: 2, color: 'white' }}>
            Assemblage de Dran Sword...
          </Typography>
        </Box>
      )}
    </Box>
  );
}
