'use client';

import { useTexture } from '@react-three/drei';
import { useLoader } from '@react-three/fiber';
import { useMemo } from 'react';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

interface ModelProps {
  modelUrl: string;
  textureUrl?: string;
}

export function Model({ modelUrl, textureUrl }: ModelProps) {
  // Load model
  const obj = useLoader(OBJLoader, modelUrl);

  // Load texture if provided
  const texture = useTexture(
    textureUrl || '/data_bey/Texture/Texture (White)/DRANSWORD.png',
  );

  const clonedObj = useMemo(() => obj.clone(), [obj]);

  useMemo(() => {
    if (!textureUrl) return;

    // Fix texture encoding/orientation if needed
    // Removed direct mutation to please react-compiler

    clonedObj.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        // Create a new material to avoid sharing with cached object
        mesh.material = new THREE.MeshStandardMaterial({
          map: texture,
          metalness: 0.5,
          roughness: 0.5,
        });
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
  }, [clonedObj, texture, textureUrl]);

  return <primitive {...({ object: clonedObj } as any)} />;
}
