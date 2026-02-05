'use client';

import * as PIXI from 'pixi.js';
import { useEffect, useRef } from 'react';

interface BeybladeAssemblerProps {
  app: PIXI.Application;
  x: number;
  y: number;
  bladeId: string; // e.g., 'blade_bx_01_dran_sword'
  ratchetId: string; // e.g., 'ratchet_bx_01_3_60'
  bitId: string; // e.g., 'bit_bx_01_f__flat_'
  scale?: number;
}

export function BeybladeAssembler({
  app,
  x,
  y,
  bladeId,
  ratchetId,
  bitId,
  scale = 1,
}: BeybladeAssemblerProps) {
  const containerRef = useRef<PIXI.Container | null>(null);

  useEffect(() => {
    if (!app || !bladeId || !ratchetId || !bitId) return;

    const container = new PIXI.Container();
    container.x = x;
    container.y = y;
    container.scale.set(scale);

    // Assign refs immediately to avoid closure issues in cleanup
    containerRef.current = container;
    app.stage.addChild(container);

    const loadParts = async () => {
      try {
        // Load textures
        // Note: Paths must match the public directory structure exactly
        // We use a base path helper since images are in 'public/images/parts/'
        const basePath = '/images/parts/';

        // Z-Index Order (Bottom to Top): Bit -> Ratchet -> Blade -> Sticker (if any)
        // Adjust scales if images are not perfectly consistent in size

        // 1. Bit (Bottom/Center)
        const bitTexture = await PIXI.Assets.load(`${basePath}${bitId}.webp`);
        const bitSprite = new PIXI.Sprite(bitTexture);
        bitSprite.anchor.set(0.5);
        bitSprite.scale.set(0.4); // Bits are smaller generally
        container.addChild(bitSprite);

        // 2. Ratchet (Middle)
        const ratchetTexture = await PIXI.Assets.load(
          `${basePath}${ratchetId}.webp`,
        );
        const ratchetSprite = new PIXI.Sprite(ratchetTexture);
        ratchetSprite.anchor.set(0.5);
        ratchetSprite.scale.set(0.6);
        container.addChild(ratchetSprite);

        // 3. Blade (Top/Main)
        const bladeTexture = await PIXI.Assets.load(
          `${basePath}${bladeId}.webp`,
        );
        const bladeSprite = new PIXI.Sprite(bladeTexture);
        bladeSprite.anchor.set(0.5);
        // Blades are the main visual, keep scale closer to 1
        container.addChild(bladeSprite);

        // Animation: Spin the whole container
        // Note: In real Beyblade, Ratchet/Blade spin together, Bit might spin differently?
        // For simplicity, spin the whole assembly.
        app.ticker.add((ticker) => {
          if (container && !container.destroyed) {
            container.rotation += 0.15 * ticker.deltaTime; // Fast spin
          }
        });
      } catch (error) {
        console.error('Failed to load Beyblade parts:', error);
      }
    };

    loadParts();

    return () => {
      if (containerRef.current && !containerRef.current.destroyed) {
        containerRef.current.destroy({ children: true });
        app.stage.removeChild(containerRef.current);
      }
    };
  }, [app, x, y, bladeId, ratchetId, bitId, scale]);

  return null; // This component renders directly to Pixi, no DOM
}
