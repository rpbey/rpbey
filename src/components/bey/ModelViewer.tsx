'use client';

import { Canvas } from '@react-three/fiber';
import { Stage, OrbitControls } from '@react-three/drei';
import { Suspense, useState, useEffect } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { Model } from './Model';

interface ModelViewerProps {
  modelUrl: string;
  textureUrl?: string;
}

function Loader() {
  return (
    <Box
      sx={{
        height: '100%',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 2,
        bgcolor: '#111',
      }}
    >
      <CircularProgress size={40} />
      <Typography variant="caption" color="text.secondary">
        Chargement du modèle...
      </Typography>
    </Box>
  );
}

export function ModelViewer({ modelUrl, textureUrl }: ModelViewerProps) {
  // Key to force remount on url change if needed, though R3F handles it usually.
  // Using key on Canvas or Stage can help reset camera.
  
  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative', bgcolor: '#000', borderRadius: 2, overflow: 'hidden' }}>
      <Canvas shadows dpr={[1, 2]} camera={{ fov: 50 }}>
        <Suspense fallback={null}>
          <Stage environment="city" intensity={0.5} shadows={{ type: 'contact', opacity: 0.7, blur: 2 }}>
            <Model modelUrl={modelUrl} textureUrl={textureUrl} />
          </Stage>
        </Suspense>
        <OrbitControls makeDefault autoRotate autoRotateSpeed={1} />
      </Canvas>
      
      {/* Overlay Loader outside Canvas for better UI control if Suspense fallback is null */}
      {/* Actually Suspense inside Canvas is tricky for HTML overlays. 
          We can use Drei's <Loader /> or just keep it simple.
      */}
    </Box>
  );
}
