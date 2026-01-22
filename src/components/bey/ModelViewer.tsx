'use client';

import { OrbitControls, PerspectiveCamera, Stage } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { Model } from './Model';

interface ModelViewerProps {
  modelUrl: string;
  textureUrl?: string;
}

export function ModelViewer({ modelUrl, textureUrl }: ModelViewerProps) {
  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        bgcolor: 'background.paper',
        position: 'relative',
      }}
    >
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={50} />
        <Suspense fallback={null}>
          <Stage
            environment="city"
            intensity={0.5}
            contactShadow={{ opacity: 0.4, blur: 2 }}
          >
            <Model modelUrl={modelUrl} textureUrl={textureUrl} />
          </Stage>
        </Suspense>
        <OrbitControls makeDefault autoRotate autoRotateSpeed={0.5} />
      </Canvas>
    </Box>
  );
}

// Sub-component for Box if not imported (ModelViewer usually used within a Box parent)
import { Box } from '@mui/material';
