/* eslint-disable react/no-unknown-property */
'use client';

import {
  Float,
  OrbitControls,
  PerspectiveCamera,
  Text,
} from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { Suspense, useRef } from 'react';
import * as THREE from 'three';
import { Model } from '../bey/Model';

interface CompartmentProps {
  position: [number, number, number];
  index: number;
  isOpen: boolean;
  onClick: () => void;
  bladeModel?: { model?: string; texture?: string } | null;
}

// Animated lid component using useFrame for spring-like animation
function AnimatedLid({
  isOpen,
  children,
}: {
  isOpen: boolean;
  children: React.ReactNode;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const targetRotation = isOpen ? -Math.PI * 0.65 : 0; // ~115 degrees

  useFrame(() => {
    if (groupRef.current) {
      // Spring-like interpolation
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        targetRotation,
        0.08,
      );
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, -0.6]}>
      {children}
    </group>
  );
}

function DeckBoxCompartment({
  position,
  index,
  isOpen,
  onClick,
  bladeModel,
}: CompartmentProps) {
  return (
    <group
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {/* Main Body */}
      <mesh position={[0, -0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.8, 1, 1.2]} />
        <meshStandardMaterial color="#080808" roughness={0.9} metalness={0.4} />
      </mesh>

      {/* Interior Insert (Foam/Plastic) */}
      <mesh position={[0, -0.1, 0]} receiveShadow>
        <boxGeometry args={[1.6, 0.2, 1]} />
        <meshStandardMaterial color="#020202" roughness={1} />
      </mesh>

      {/* The Beyblade (if open and model exists) */}
      {isOpen && bladeModel?.model && (
        <group position={[0, 0.3, 0]} scale={0.45}>
          <Float speed={3} rotationIntensity={1} floatIntensity={0.5}>
            <Model
              modelUrl={bladeModel.model}
              textureUrl={bladeModel.texture}
            />
          </Float>
        </group>
      )}

      {/* Lid Group (Articulated at the top back edge) */}
      <AnimatedLid isOpen={isOpen}>
        <group position={[0, 0, 0.6]}>
          {/* Top Face */}
          <mesh position={[0, 0.05, 0]} castShadow>
            <boxGeometry args={[1.8, 0.1, 1.2]} />
            <meshStandardMaterial
              color="#111"
              roughness={0.6}
              metalness={0.5}
            />
          </mesh>

          {/* Front Flap */}
          <mesh position={[0, -0.15, 0.6]} castShadow>
            <boxGeometry args={[1.8, 0.4, 0.05]} />
            <meshStandardMaterial
              color="#111"
              roughness={0.6}
              metalness={0.5}
            />
          </mesh>

          {/* Number Graphic (Embossed look) */}
          <Text
            position={[0, 0.11, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            fontSize={0.9}
            color="#D32F2F"
            anchorX="center"
            anchorY="middle"
            strokeWidth={0.02}
            strokeColor="#000"
          >
            {index}
          </Text>
        </group>
      </AnimatedLid>

      {/* Side Label (Grunge Text) */}
      <Text
        position={[0, -0.5, 0.61]}
        fontSize={0.15}
        color="#D32F2F"
        anchorX="center"
      >
        WBBA OFFICIAL CASE
      </Text>
    </group>
  );
}

interface TripleDeckBoxProps {
  selectedIdx: number;
  onSelect: (idx: number) => void;
  beysModels: (({ model?: string; texture?: string } | null) | undefined)[];
}

export function TripleDeckBox({
  selectedIdx,
  onSelect,
  beysModels,
}: TripleDeckBoxProps) {
  return (
    <Box
      sx={{
        width: '100%',
        height: 400,
        bgcolor: '#000',
        borderRadius: 4,
        overflow: 'hidden',
      }}
    >
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 3, 6]} fov={40} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} castShadow />
        <spotLight
          position={[0, 5, 0]}
          angle={0.3}
          penumbra={1}
          intensity={2}
          castShadow
        />

        <Suspense fallback={null}>
          <group position={[0, 0, 0]}>
            <DeckBoxCompartment
              position={[-2, 0, 0]}
              index={1}
              isOpen={selectedIdx === 0}
              onClick={() => onSelect(0)}
              bladeModel={beysModels[0]}
            />
            <DeckBoxCompartment
              position={[0, 0, 0]}
              index={2}
              isOpen={selectedIdx === 1}
              onClick={() => onSelect(1)}
              bladeModel={beysModels[1]}
            />
            <DeckBoxCompartment
              position={[2, 0, 0]}
              index={3}
              isOpen={selectedIdx === 2}
              onClick={() => onSelect(2)}
              bladeModel={beysModels[2]}
            />
          </group>

          {/* Floor / Table */}
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, -1, 0]}
            receiveShadow
          >
            <planeGeometry args={[20, 20]} />
            <meshStandardMaterial color="#050505" roughness={1} />
          </mesh>
        </Suspense>

        <OrbitControls
          enablePan={false}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2.2}
          minDistance={4}
          maxDistance={10}
        />
      </Canvas>
    </Box>
  );
}

import { Box } from '@mui/material';
