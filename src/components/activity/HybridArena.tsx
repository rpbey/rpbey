'use client';

import { Box, CircularProgress, Typography } from '@mui/material';
import * as PIXI from 'pixi.js';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { useSocket } from '@/components/providers/SocketProvider';

export default function HybridArena() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // --- AUDIO SETUP ---
    audioRef.current = new Audio('/beyblade_generic.mp3');
    audioRef.current.volume = 0.3;

    // --- 1. INITIALIZE THREE.JS ---
    const threeScene = new THREE.Scene();
    const threeCamera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    threeCamera.position.set(0, 8, 12);
    threeCamera.lookAt(0, 0, 0);

    const threeRenderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      stencil: true,
    });
    threeRenderer.setSize(window.innerWidth, window.innerHeight);
    threeRenderer.autoClear = false;
    containerRef.current.appendChild(threeRenderer.domElement);

    // --- 2. INITIALIZE PIXIJS 8 ---
    const app = new PIXI.Application();

    const init = async () => {
      await app.init({
        view: threeRenderer.domElement,
        width: window.innerWidth,
        height: window.innerHeight,
        clearBeforeRender: false,
        backgroundAlpha: 0,
        antialias: true,
      });

      // --- 3D BEYBLADE PHYSICS LOGIC ---
      const bey1 = new THREE.Group();

      // Simple Bey Shape
      const beyBody = new THREE.Mesh(
        new THREE.CylinderGeometry(0.6, 0.4, 0.3, 8),
        new THREE.MeshStandardMaterial({
          color: 0xdc2626,
          metalness: 0.8,
          roughness: 0.2,
        }),
      );
      bey1.add(beyBody);
      threeScene.add(bey1);

      // --- ADD 3D CONTENT (STADIUM) ---
      const loader = new GLTFLoader();
      threeScene.add(new THREE.AmbientLight(0xffffff, 0.5));
      const sun = new THREE.DirectionalLight(0xffffff, 2);
      sun.position.set(5, 10, 5);
      threeScene.add(sun);

      // Xtreme Line Visualization
      const xtremeLineGeo = new THREE.TorusGeometry(
        3,
        0.05,
        16,
        100,
        Math.PI / 1.5,
      );
      const xtremeLineMat = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        toneMapped: false,
      });
      const xtremeLine = new THREE.Mesh(xtremeLineGeo, xtremeLineMat);
      xtremeLine.rotation.x = Math.PI / 2;
      xtremeLine.position.y = -0.8;
      xtremeLine.position.z = 0.5;
      threeScene.add(xtremeLine);

      try {
        const gltf = await loader.loadAsync('/beyblade_stadium.glb');
        const stadium = gltf.scene;
        stadium.scale.set(5, 5, 5);
        stadium.position.y = -1;
        threeScene.add(stadium);
      } catch (e) {
        console.error('3D Load Error:', e);
      }

      // --- ADD PIXI 2D HUD (MD3 Style) ---
      const hud = new PIXI.Container();

      // Game State
      let p1Score = 0;
      let p2Score = 0;
      // const WIN_SCORE = 4;

      // Scoreboard
      const scoreText = new PIXI.Text({
        text: '0 - 0',
        style: {
          fontFamily: 'system-ui',
          fontSize: 48,
          fill: 0xffffff,
          fontWeight: '900',
          letterSpacing: 4,
        },
      });
      scoreText.anchor.set(0.5);
      scoreText.position.set(app.screen.width / 2, 60);
      hud.addChild(scoreText);

      // Listen for Socket score updates (Broadcast)
      if (socket) {
        socket.on(
          'game_score_update',
          (data: { p1: number; p2: number; label: string }) => {
            p1Score = data.p1;
            p2Score = data.p2;
            scoreText.text = `${p1Score} - ${p2Score}`;
            if (audioRef.current) {
              audioRef.current.currentTime = 0;
              audioRef.current.play().catch(() => {});
            }
          },
        );
      }

      // Referee Button Logic
      const emitAction = (label: string, points: number) => {
        if (socket) {
          socket.emit('admin_action', { type: 'update_score', label, points });
        } else {
          // Fallback if no socket (Local only)
          p1Score += points;
          scoreText.text = `${p1Score} - ${p2Score}`;
        }
      };

      const createRefBtn = (
        label: string,
        points: number,
        color: number,
        x: number,
      ) => {
        const btn = new PIXI.Container();
        const bg = new PIXI.Graphics()
          .roundRect(-50, -20, 100, 40, 10)
          .fill(color);
        const txt = new PIXI.Text({
          text: label,
          style: { fontSize: 14, fill: 0xffffff, fontWeight: 'bold' },
        });
        txt.anchor.set(0.5);
        btn.addChild(bg, txt);
        btn.position.set(x, app.screen.height - 60);
        btn.eventMode = 'static';
        btn.cursor = 'pointer';
        btn.on('pointerdown', () => emitAction(label, points));
        return btn;
      };

      hud.addChild(
        createRefBtn('SPIN', 1, 0x3b82f6, app.screen.width / 2 - 120),
      );
      hud.addChild(createRefBtn('BURST', 2, 0xef4444, app.screen.width / 2));
      hud.addChild(
        createRefBtn('XTREME', 3, 0x22c55e, app.screen.width / 2 + 120),
      );

      app.stage.addChild(hud);

      // --- ULTRA-FAST RENDER LOOP ---
      app.ticker.add((ticker) => {
        // Physics: Circular movement simulation
        const time = Date.now() * 0.002;
        const radius = 3 + Math.sin(time * 0.5) * 0.5;
        bey1.position.x = Math.cos(time) * radius;
        bey1.position.z = Math.sin(time) * radius;
        bey1.rotation.y += 0.5 * ticker.deltaTime;

        threeRenderer.clear();
        threeRenderer.render(threeScene, threeCamera);
        threeRenderer.resetState();
        app.renderer.render(app.stage);
      });

      setLoading(false);
    };

    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      threeRenderer.setSize(w, h);
      app.renderer.resize(w, h);
      threeCamera.aspect = w / h;
      threeCamera.updateProjectionMatrix();
    };

    init();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      app.destroy(false, { children: true, texture: true });
      threeRenderer.dispose();
      if (socket) socket.off('game_score_update');
    };
  }, [socket]);

  return (
    <Box
      ref={containerRef}
      sx={{
        width: '100%',
        height: '100vh',
        position: 'relative',
        bgcolor: '#050505',
      }}
    >
      {loading && (
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
          <CircularProgress color="primary" thickness={5} />
          <Typography
            sx={{ mt: 2, color: 'white', fontWeight: 800, letterSpacing: 1 }}
          >
            INITIALISATION DU MOTEUR RPB HYBRID v8
          </Typography>
        </Box>
      )}
    </Box>
  );
}
