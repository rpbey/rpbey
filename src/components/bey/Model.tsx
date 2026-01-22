'use client';

import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { useLoader } from '@react-three/fiber';
import { useTexture, Center } from '@react-three/drei';
import { useMemo } from 'react';
import * as THREE from 'three';

interface ModelProps {
  modelUrl: string;
  textureUrl?: string;
}

export function Model({ modelUrl, textureUrl }: ModelProps) {
  // Load model
  const obj = useLoader(OBJLoader, modelUrl);
  
  // Load texture if provided
  const texture = useTexture(textureUrl || '/data_bey/Texture/Texture (White)/DRANSWORD.png'); // Fallback to avoid hook error if empty?
  // Actually hook order must not change. We should always pass a valid url or handle conditional rendering of component.
  // Better: Pass a default white texture or use a separate component for textured vs untextured?
  // Or just rely on standard material if no texture.
  // But useTexture throws if url is empty string?
  // Let's assume textureUrl is always valid if passed, or we handle it at parent level.
  // For now, let's use a clear fallback logic.
  
  const clonedObj = useMemo(() => obj.clone(), [obj]);

  useMemo(() => {
    if (!textureUrl) return;
    
    // Fix texture encoding/orientation if needed
    texture.colorSpace = THREE.SRGBColorSpace;

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

  return <primitive object={clonedObj} />;
}
