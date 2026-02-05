'use client';

import { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  useGLTF,
  OrbitControls,
  Environment,
  ContactShadows,
  PerspectiveCamera,
} from '@react-three/drei';
import * as THREE from 'three';
import { Box, CircularProgress, Typography } from '@mui/material';

// 3D Stadium Component
function Stadium() {
  const { scene } = useGLTF('/beyblade_stadium.glb');
  return <primitive object={scene} scale={5} position={[0, -1, 0]} />;
}

// 3D Beyblade Placeholder (until we have full .glb Beys)
function SpinningBey({
  position,
  color = 'red',
}: {
  position: [number, number, number];
  color?: string;
}) {
  const meshRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (meshRef.current) {
      // Fast rotation
      meshRef.current.rotation.y += 15 * delta;
      // Slight wobble
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 10) * 0.1;
      meshRef.current.rotation.z = Math.cos(state.clock.elapsedTime * 10) * 0.1;
    }
  });

  return (
    <group ref={meshRef} position={position}>
      {/* Blade Layer */}
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.5, 0.4, 0.1, 6]} />
        <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Ratchet Layer */}
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.4, 0.45, 0.1, 3]} />
        <meshStandardMaterial color="white" />
      </mesh>
      {/* Bit Layer */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.1, 0.2, 16]} />
        <meshStandardMaterial color="#333" />
      </mesh>
    </group>
  );
}

export default function BeybladeArena3D() {
  return (
    <Box
      sx={{
        width: '100%',
        height: '100vh',
        bgcolor: '#000',
        position: 'relative',
      }}
    >
      <Suspense
        fallback={
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
            }}
          >
            <CircularProgress color="primary" />
            <Typography sx={{ mt: 2, color: 'white' }}>
              Chargement de l'arène 3D...
            </Typography>
          </Box>
        }
      >
        <Canvas shadows>
          <PerspectiveCamera makeDefault position={[5, 5, 5]} fov={50} />
          <OrbitControls
            enablePan={false}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 2.1}
            makeDefault
          />

          <ambientLight intensity={0.5} />
          <spotLight
            position={[10, 10, 10]}
            angle={0.15}
            penumbra={1}
            intensity={2}
            castShadow
          />
          <pointLight position={[-10, -10, -10]} intensity={1} />

          <Stadium />

          <SpinningBey position={[0, 0.1, 0]} color="#dc2626" />
          <SpinningBey position={[1, 0.1, 1]} color="#fbbf24" />

          <ContactShadows
            position={[0, -1, 0]}
            opacity={0.4}
            scale={20}
            blur={2}
            far={4.5}
          />
          <Environment preset="city" />
        </Canvas>
      </Suspense>
    </Box>
  );
}

// Preload the model
useGLTF.preload('/beyblade_stadium.glb');
