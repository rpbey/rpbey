# Stack 3D & Graphismes — RPB Dashboard

> Documentation complète de la stack 3D du projet : état actuel, libs manquantes, migration et patterns.  
> Stack actuelle : `three ^0.182.0` (raw) + `matter-js` (physique 2D) + `framer-motion ^12`

---

## Table des matières

1. [État actuel](#1-état-actuel)
2. [Architecture cible](#2-architecture-cible)
3. [React Three Fiber + Drei](#3-react-three-fiber--drei)
4. [Three.js WebGPU (déjà installé)](#4-threejs-webgpu-déjà-installé)
5. [Physique Beyblade — Rapier WASM](#5-physique-beyblade--rapier-wasm)
6. [Post-processing & VFX](#6-post-processing--vfx)
7. [Animations — GSAP + Framer Motion](#7-animations--gsap--framer-motion)
8. [Rust + wgpu (WebGPU natif)](#8-rust--wgpu-webgpu-natif)
9. [Migration MeshViewer](#9-migration-meshviewer)
10. [Migration BattleArena](#10-migration-battlearena)
11. [Performances & bonnes pratiques](#11-performances--bonnes-pratiques)
12. [Checklist d'installation](#12-checklist-dinstallation)

---

## 1. État actuel

### Fichiers 3D existants

| Fichier | Lib | Description |
|---|---|---|
| `src/app/(marketing)/app/_components/MeshViewer.tsx` | `three` raw | Galerie de modèles OBJ avec textures PBR |
| `src/app/(marketing)/app/_components/BattleArena.tsx` | `matter-js` | Simulation de combat Beyblade 2D |
| `src/app/(marketing)/app/_components/VfxGallery.tsx` | CSS | Galerie assets VFX statiques |
| `public/beyblade_stadium.glb` | non chargé | Modèle GLB de l'arène inutilisé |

### Problèmes identifiés

**MeshViewer.tsx** (`ThreeCanvas` — 250 lignes de `useEffect`) :
- Setup Three.js entièrement manuel dans un `useEffect` → 250 lignes pour un viewer basique
- Pas de Suspense / lazy loading — tous les OBJ se chargent en même temps
- WebGLRenderer fixe — pas de WebGPU, pas de fallback intelligent
- Cleanup manuel fragile (dispose sur chaque objet)
- Environnement simulé avec `CanvasTexture` au lieu d'un vrai HDRI

**BattleArena.tsx** (`Matter.js`) :
- Matter.js est une physique 2D générique non adaptée aux toupies
- Pas de simulation de spin/gyroscope réaliste
- Friction et rebond codés en dur comme constantes magiques
- Pas de détection de collision précise (cercle contre mur courbe)

---

## 2. Architecture cible

```
src/
├── components/
│   └── 3d/
│       ├── BeybladeCanvas.tsx     # Canvas R3F réutilisable
│       ├── BeybladeModel.tsx      # Modèle OBJ/GLB avec matériaux PBR
│       ├── BeybladeArena.tsx      # Arène 3D avec physique Rapier
│       ├── BattleVfx.tsx          # Effets post-processing combat
│       └── useWgpu.ts             # Hook WebGPU renderer
├── lib/
│   └── wasm/
│       ├── physics.ts             # Wrapper Rapier WASM
│       └── wgpu-module/           # Crate Rust (si WebGPU custom)
```

### Dépendances à installer

```bash
# Core R3F
bun add @react-three/fiber @react-three/drei

# Physique Rust WASM
bun add @dimforge/rapier2d-compat

# Post-processing
bun add @react-three/postprocessing postprocessing

# Animations
bun add gsap

# (Optionnel) React Three Rapier — bindings R3F pour Rapier
bun add @react-three/rapier
```

---

## 3. React Three Fiber + Drei

### Pourquoi remplacer le Three.js raw

React Three Fiber (R3F) est un renderer React pour Three.js. Il transforme l'API impérative de Three.js en composants déclaratifs, gérés par le cycle de vie React (Suspense, hooks, unmount automatique).

| Aspect | Three.js raw (actuel) | R3F (cible) |
|---|---|---|
| Setup renderer | ~30 lignes de `useEffect` | `<Canvas>` — 1 ligne |
| Cleanup mémoire | Manuel (`dispose()` partout) | Automatique à l'unmount |
| Resize | `ResizeObserver` manuel | Intégré |
| Suspense/lazy | Non | `<Suspense fallback>` natif |
| Hot reload | Casse le contexte WebGL | Préservé |
| TypeScript | Types Three.js directs | JSX + types R3F |

### Installation

```bash
bun add @react-three/fiber @react-three/drei
```

> R3F v9 requiert React 18+, Three.js r158+ et Next.js 14+. ✅ Compatible avec notre stack.

### Canvas de base

```tsx
// components/3d/BeybladeCanvas.tsx
'use client';

import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';

interface BeybladeCanvasProps {
  children: React.ReactNode;
  className?: string;
}

export function BeybladeCanvas({ children, className }: BeybladeCanvasProps) {
  return (
    <Canvas
      className={className}
      camera={{ position: [2, 2.5, 5], fov: 45 }}
      gl={{
        antialias: true,
        toneMapping: 3, // ACESFilmicToneMapping
        toneMappingExposure: 1.4,
      }}
      shadows
      dpr={[1, 2]} // cap à 2x pour les écrans haute densité
    >
      <Suspense fallback={null}>
        {children}
      </Suspense>
    </Canvas>
  );
}
```

### Modèle OBJ avec R3F + Drei

```tsx
// components/3d/BeybladeModel.tsx
'use client';

import { useOBJ, OrbitControls, Environment, Float, ContactShadows } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

interface BeybladeModelProps {
  path: string;
  premium?: boolean;
  spinning?: boolean;
  spinSpeed?: number;
}

export function BeybladeModel({
  path,
  premium = false,
  spinning = false,
  spinSpeed = 8,
}: BeybladeModelProps) {
  const obj = useOBJ(path);
  const groupRef = useRef<THREE.Group>(null);

  // Spin animation — simulation de rotation
  useFrame((_, delta) => {
    if (spinning && groupRef.current) {
      groupRef.current.rotation.y += delta * spinSpeed;
    }
  });

  return (
    <>
      <Float speed={2} rotationIntensity={0.3} floatIntensity={0.3}>
        <group ref={groupRef}>
          <primitive object={obj} />
        </group>
      </Float>

      {/* Éclairage studio 3 points */}
      <directionalLight position={[4, 8, 6]} intensity={1.5} color="#fff5e6" castShadow={premium} />
      <directionalLight position={[-6, 2, -3]} intensity={0.6} color="#88aaee" />
      <directionalLight position={[0, 3, -6]} intensity={0.8} color="#dc2626" />
      <ambientLight intensity={0.25} />

      {premium && (
        <>
          <ContactShadows position={[0, -1.6, 0]} opacity={0.6} scale={6} blur={2} />
          <Environment preset="studio" />
        </>
      )}

      <OrbitControls
        autoRotate={!spinning}
        autoRotateSpeed={2.5}
        enablePan={false}
        minDistance={2}
        maxDistance={15}
        dampingFactor={0.08}
        enableDamping
      />
    </>
  );
}
```

### Composants Drei utiles pour RPB

```tsx
import {
  // Loaders
  useGLTF,          // GLB/GLTF — plus performant qu'OBJ
  useOBJ,           // OBJ existants
  useTexture,       // Textures avec fallback

  // Helpers
  OrbitControls,    // Caméra interactive
  Float,            // Animation de lévitation
  Sparkles,         // Particules scintillantes
  Trail,            // Traînée de mouvement (spin)
  Billboard,        // Sprite toujours face à la caméra
  Text,             // Texte 3D avec troika-three-text
  Html,             // HTML dans la scène 3D

  // Environnement
  Environment,      // HDRI lighting (studio, city, sunset...)
  ContactShadows,   // Ombres de contact douces
  AccumulativeShadows, // Ombres accumulées réalistes

  // Performance
  Instances,        // Rendu instancié (N toupies identiques)
  PerformanceMonitor, // Adapter qualité selon FPS
  BVHMeshes,        // Accélération raycast

  // Post-processing
  Preload,          // Préchargement des assets
} from '@react-three/drei';
```

---

## 4. Three.js WebGPU (déjà installé)

Three.js `^0.182.0` supporte **WebGPU nativement depuis r171** (septembre 2025). Aucune installation supplémentaire.

### Activer WebGPU dans MeshViewer

```ts
// AVANT — WebGL fixe
import * as THREE from 'three';
const renderer = new THREE.WebGLRenderer({ antialias: true });

// APRÈS — WebGPU avec fallback WebGL automatique
import * as THREE from 'three/webgpu';
const renderer = new THREE.WebGPURenderer({ antialias: true });
await renderer.init(); // async — nécessaire pour WebGPU
```

### Avec R3F — WebGPU renderer

```tsx
// next.config.ts — autoriser les imports WebGPU
webpack(config) {
  config.experiments = { ...config.experiments, asyncWebAssembly: true };
  return config;
}
```

```tsx
import { Canvas } from '@react-three/fiber';
import { WebGPURenderer } from 'three/webgpu';

<Canvas
  gl={(canvas) => {
    const renderer = new WebGPURenderer({ canvas, antialias: true });
    return renderer;
  }}
>
  {/* Scène */}
</Canvas>
```

### TSL — Node Materials (shaders sans GLSL)

TSL (Three Shader Language) remplace GLSL par un système de nodes en JavaScript qui compile vers WGSL (WebGPU) ou GLSL (WebGL) automatiquement.

```ts
import {
  MeshStandardNodeMaterial,
  color, sin, time, uniform,
  vec3, mix, normalWorld,
} from 'three/tsl';

// Matériau pulsant — couleur RPB animée
const mat = new MeshStandardNodeMaterial();
const pulse = sin(time.mul(2.0)).mul(0.5).add(0.5); // 0→1→0
mat.colorNode = mix(
  color(0xce0c07), // rouge RPB
  color(0xf7d301), // jaune RPB
  pulse
);

// Fresnel effect — glow sur les bords
const fresnel = normalWorld.dot(vec3(0, 0, 1)).abs().oneMinus();
mat.emissiveNode = color(0xce0c07).mul(fresnel.pow(2.0));
```

### Support navigateurs WebGPU (2026)

| Navigateur | Support | Notes |
|---|---|---|
| Chrome / Edge | ✅ Stable depuis 2023 | |
| Firefox | ✅ Stable depuis Firefox 141 (juil. 2025) | |
| Safari | ✅ Stable depuis Safari 26 (juin 2025) | iOS, macOS, visionOS |

---

## 5. Physique Beyblade — Rapier WASM

### Pourquoi remplacer Matter.js

Matter.js est une physique générique 2D. Les toupies Beyblade ont des comportements spécifiques :
- **Gyroscopic drift** — une toupie en rotation dérive vers l'extérieur sous l'effet gyroscopique
- **Spin decay** — la vitesse de rotation diminue selon le poids, la surface et les rebonds
- **Burst threshold** — un taux de collision trop élevé déclenche un burst
- **Type matchup** — Attack vs Stamina vs Defense changent les paramètres physiques

Rapier (Rust WASM) offre une simulation déterministe et haute performance :

```bash
bun add @dimforge/rapier2d-compat
```

### Initialisation

```ts
// lib/wasm/physics.ts
import RAPIER from '@dimforge/rapier2d-compat';

let rapierInitialized = false;

export async function initPhysics() {
  if (!rapierInitialized) {
    await RAPIER.init();
    rapierInitialized = true;
  }
  return RAPIER;
}

export function createBeybladeWorld() {
  // Arène horizontale — pas de gravité verticale
  const world = new RAPIER.World({ x: 0.0, y: 0.0 });
  return world;
}
```

### Modèle physique Beyblade

```ts
import RAPIER from '@dimforge/rapier2d-compat';

interface BeybladePhysicsConfig {
  mass: number;           // kg — influence le rebond
  restitution: number;    // 0-1 — rebond élastique
  friction: number;       // friction au sol
  angularDamping: number; // perte de spin par seconde
  linearDamping: number;  // friction de déplacement
}

// Profils par type
const PHYSICS_PROFILES: Record<string, BeybladePhysicsConfig> = {
  ATTACK:  { mass: 0.035, restitution: 0.85, friction: 0.05, angularDamping: 0.08, linearDamping: 0.02 },
  DEFENSE: { mass: 0.045, restitution: 0.60, friction: 0.12, angularDamping: 0.12, linearDamping: 0.06 },
  STAMINA: { mass: 0.030, restitution: 0.70, friction: 0.03, angularDamping: 0.04, linearDamping: 0.01 },
  BALANCE: { mass: 0.038, restitution: 0.72, friction: 0.07, angularDamping: 0.07, linearDamping: 0.03 },
};

export function createBeyblade(
  world: RAPIER.World,
  position: { x: number; y: number },
  velocity: { x: number; y: number },
  type: string
) {
  const config = PHYSICS_PROFILES[type] ?? PHYSICS_PROFILES.BALANCE;

  const body = world.createRigidBody(
    RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(position.x, position.y)
      .setLinvel(velocity.x, velocity.y)
      .setLinearDamping(config.linearDamping)
      .setAngularDamping(config.angularDamping)
  );

  const collider = world.createCollider(
    RAPIER.ColliderDesc.ball(18)
      .setDensity(config.mass / (Math.PI * 0.018 ** 2))
      .setRestitution(config.restitution)
      .setFriction(config.friction)
      .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS),
    body
  );

  return { body, collider };
}

// Mur circulaire de l'arène
export function createArenaWall(world: RAPIER.World, radius: number) {
  const segments = 64;
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const nextAngle = ((i + 1) / segments) * Math.PI * 2;

    const x1 = Math.cos(angle) * radius;
    const y1 = Math.sin(angle) * radius;
    const x2 = Math.cos(nextAngle) * radius;
    const y2 = Math.sin(nextAngle) * radius;

    const wallBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
    world.createCollider(
      RAPIER.ColliderDesc.segment({ x: x1, y: y1 }, { x: x2, y: y2 })
        .setRestitution(0.9),
      wallBody
    );
  }
}
```

### Hook React pour la simulation

```tsx
// hooks/useBeybladePhysics.ts
import { useEffect, useRef, useState } from 'react';
import { initPhysics, createBeybladeWorld, createBeyblade, createArenaWall } from '@/lib/wasm/physics';
import type RAPIER from '@dimforge/rapier2d-compat';

export function useBeybladePhysics(arenaRadius: number) {
  const worldRef = useRef<RAPIER.World | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initPhysics().then(() => {
      const world = createBeybladeWorld();
      createArenaWall(world, arenaRadius);
      worldRef.current = world;
      setReady(true);
    });

    return () => {
      worldRef.current?.free(); // libérer la mémoire WASM
    };
  }, [arenaRadius]);

  const step = () => {
    worldRef.current?.step();
  };

  return { world: worldRef.current, ready, step };
}
```

---

## 6. Post-processing & VFX

### Installation

```bash
bun add @react-three/postprocessing postprocessing
```

### Effets de combat Beyblade

```tsx
// components/3d/BattleVfx.tsx
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Glitch,
  Vignette,
  ToneMapping,
} from '@react-three/postprocessing';
import { BlendFunction, GlitchMode, ToneMappingMode } from 'postprocessing';
import { useRef } from 'react';

interface BattleVfxProps {
  isCollision?: boolean; // activer le glitch lors d'un choc
  isBurst?: boolean;     // burst = effet intense
}

export function BattleVfx({ isCollision = false, isBurst = false }: BattleVfxProps) {
  return (
    <EffectComposer>
      {/* Bloom — glow sur les toupies lumineuses */}
      <Bloom
        intensity={isBurst ? 3.0 : 1.2}
        luminanceThreshold={0.6}
        luminanceSmoothing={0.4}
        mipmapBlur
      />

      {/* Glitch — choc violent entre toupies */}
      {isCollision && (
        <Glitch
          delay={[0, 0.1]}
          duration={[0.1, 0.3]}
          mode={GlitchMode.SPORADIC}
          strength={[0.1, 0.3]}
        />
      )}

      {/* Aberration chromatique — impact */}
      <ChromaticAberration
        offset={[isCollision ? 0.005 : 0.001, isCollision ? 0.005 : 0.001]}
        blendFunction={BlendFunction.NORMAL}
      />

      {/* Vignette — focus sur l'arène */}
      <Vignette eskil={false} offset={0.3} darkness={0.7} />

      {/* Tone mapping — rendu cinématique */}
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}
```

### Particules spin — effet Sparkles

```tsx
import { Sparkles, Trail } from '@react-three/drei';
import { useRef } from 'react';
import * as THREE from 'three';

export function BeybladeSpinEffect({
  color,
  spinning,
}: {
  color: string;
  spinning: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  return (
    <>
      {/* Scintillements autour de la toupie en rotation */}
      {spinning && (
        <Sparkles
          count={30}
          scale={2}
          size={0.8}
          speed={0.5}
          color={color}
          opacity={0.6}
        />
      )}

      {/* Traînée de rotation */}
      <Trail
        width={0.5}
        length={4}
        color={color}
        attenuation={(t) => t * t}
      >
        <mesh ref={meshRef} />
      </Trail>
    </>
  );
}
```

---

## 7. Animations — GSAP + Framer Motion

### GSAP — animations séquencées 3D

GSAP est la référence pour les animations complexes et séquencées, notamment les intro/transitions de scènes 3D.

```bash
bun add gsap
```

```tsx
// Animation d'entrée d'une toupie
import gsap from 'gsap';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export function useBeybladeIntro(meshRef: React.RefObject<THREE.Object3D>) {
  useEffect(() => {
    if (!meshRef.current) return;
    const mesh = meshRef.current;

    // État initial
    mesh.scale.setScalar(0);
    mesh.rotation.y = 0;

    // Timeline d'entrée
    const tl = gsap.timeline();
    tl.to(mesh.scale, {
      x: 1, y: 1, z: 1,
      duration: 0.6,
      ease: 'elastic.out(1, 0.5)',
    })
    .to(mesh.rotation, {
      y: Math.PI * 4, // 2 tours complets
      duration: 0.8,
      ease: 'power2.out',
    }, '-=0.3') // chevauchement
    .to(mesh.position, {
      y: 0,
      duration: 0.4,
      ease: 'bounce.out',
    }, '-=0.2');

    return () => { tl.kill(); };
  }, [meshRef]);
}
```

```tsx
// Animation de burst
export function playBurstAnimation(mesh: THREE.Object3D) {
  gsap.timeline()
    .to(mesh.scale, {
      x: 1.5, y: 0.3, z: 1.5,
      duration: 0.1,
      ease: 'power4.out',
    })
    .to(mesh.scale, {
      x: 0, y: 0, z: 0,
      duration: 0.3,
      ease: 'power2.in',
    })
    .to(mesh.position, {
      y: -5,
      duration: 0.5,
      ease: 'power2.in',
    }, '-=0.2');
}
```

### Framer Motion — transitions UI 3D

Framer Motion (`^12.29.0`, déjà installé) gère les transitions entre les états de l'interface.

```tsx
// Transition entre tabs de l'app page
import { motion, AnimatePresence } from 'framer-motion';

const tabVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: [0.34, 1.56, 0.64, 1] } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

<AnimatePresence mode="wait">
  <motion.div
    key={activeTab}
    variants={tabVariants}
    initial="hidden"
    animate="visible"
    exit="exit"
  >
    {tabContent}
  </motion.div>
</AnimatePresence>
```

---

## 8. Rust + wgpu (WebGPU natif)

Pour les effets visuels haute performance (simulations de particules, compute shaders), wgpu Rust compilé en WASM offre les meilleures performances.

### Quand utiliser wgpu vs Three.js

| Scénario | Three.js/R3F | wgpu Rust |
|---|---|---|
| Viewer 3D de toupies | ✅ Idéal | Overkill |
| Post-processing (Bloom, Glitch) | ✅ react-postprocessing | Overkill |
| Simulation physique (Rapier) | Via WASM | ✅ Natif Rust |
| 100k+ particules VFX | Limité | ✅ Compute shaders |
| Rendu GPU custom (shaders WGSL) | Via TSL | ✅ Direct |

### Setup Rust → WASM → Next.js

```toml
# wgpu-module/Cargo.toml
[package]
name = "rpb-gpu"
version = "0.1.0"
edition = "2024"

[lib]
crate-type = ["cdylib"]

[dependencies]
wgpu = { version = "29.0.0", features = ["webgpu"] }
wasm-bindgen = "0.2.100"
wasm-bindgen-futures = "0.4.50"
web-sys = { version = "0.3.77", features = ["HtmlCanvasElement", "Window", "Document"] }
console_error_panic_hook = "0.1.7"
console_log = "1.0.0"
```

```bash
# Build
cargo build --target wasm32-unknown-unknown
wasm-bindgen target/wasm32-unknown-unknown/release/rpb_gpu.wasm \
  --target web \
  --out-dir src/generated/gpu \
  --out-name rpb_gpu
```

```tsx
// Intégration Next.js — SSR désactivé obligatoire
import dynamic from 'next/dynamic';

const GpuEffect = dynamic(
  () => import('@/components/3d/GpuEffect'),
  { ssr: false }
);
```

### Compute shader WGSL — particules VFX

```wgsl
// shaders/particles.wgsl

struct Particle {
  position: vec2<f32>,
  velocity: vec2<f32>,
  life: f32,
  color: vec4<f32>,
}

@group(0) @binding(0) var<storage, read_write> particles: array<Particle>;
@group(0) @binding(1) var<uniform> delta: f32;

@compute @workgroup_size(64)
fn cs_update(@builtin(global_invocation_id) id: vec3<u32>) {
  let i = id.x;
  if (i >= arrayLength(&particles)) { return; }

  var p = particles[i];
  p.position += p.velocity * delta;
  p.life -= delta * 0.5;

  // Spiral motion — effet spin Beyblade
  let angle = atan2(p.velocity.y, p.velocity.x) + delta * 3.0;
  let speed = length(p.velocity) * 0.99;
  p.velocity = vec2<f32>(cos(angle), sin(angle)) * speed;

  // Reset si mort
  if (p.life <= 0.0) {
    p.position = vec2<f32>(0.0, 0.0);
    p.life = 1.0;
  }

  particles[i] = p;
}
```

---

## 9. Migration MeshViewer

Refactorisation de `ThreeCanvas` (250 lignes `useEffect`) vers R3F.

### Avant (actuel)

```tsx
// 250 lignes dans useEffect — anti-pattern
useEffect(() => {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(...);
  const renderer = new THREE.WebGLRenderer(...);
  // ... 200 lignes de setup ...
  return () => {
    // cleanup manuel de chaque objet
    renderer.dispose();
    material.dispose();
    // ...
  };
}, [meshPath, meshName, width, height, premium]);
```

### Après (R3F)

```tsx
// components/3d/BeybladeModel.tsx
'use client';

import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { OrbitControls, Environment, ContactShadows, useOBJ } from '@react-three/drei';
import { BattleVfx } from './BattleVfx';

function Model({ path, meshName }: { path: string; meshName: string }) {
  const obj = useOBJ(path);
  // Cleanup automatique à l'unmount — R3F gère dispose()
  return <primitive object={obj} />;
}

export function BeybladeViewer({
  meshPath,
  meshName,
  premium = false,
}: {
  meshPath: string;
  meshName: string;
  premium?: boolean;
}) {
  return (
    <Canvas
      camera={{ position: [2, 2.5, 5], fov: premium ? 35 : 45 }}
      gl={{ antialias: true, toneMapping: 3, toneMappingExposure: 1.4 }}
      shadows={premium}
      dpr={[1, 2]}
    >
      <Suspense fallback={null}>
        <Model path={meshPath} meshName={meshName} />

        {/* Éclairage studio 3 points */}
        <directionalLight position={[4, 8, 6]} intensity={1.5} color="#fff5e6" castShadow={premium} />
        <directionalLight position={[-6, 2, -3]} intensity={0.6} color="#88aaee" />
        <directionalLight position={[0, 3, -6]} intensity={0.8} color="#dc2626" />
        <ambientLight intensity={0.25} />
        <pointLight position={[0, -2, 0]} intensity={0.3} color="#dc2626" distance={12} />

        {premium && (
          <>
            <ContactShadows position={[0, -1.6, 0]} opacity={0.6} scale={6} blur={2} />
            <Environment preset="studio" />
          </>
        )}

        <OrbitControls
          autoRotate
          autoRotateSpeed={premium ? 1.5 : 2.5}
          enablePan={false}
          minDistance={2}
          maxDistance={15}
          dampingFactor={0.08}
          enableDamping
        />

        {premium && <BattleVfx />}
      </Suspense>
    </Canvas>
  );
}
```

**Résultat** : 250 lignes → ~60 lignes. Cleanup automatique. Suspense natif.

---

## 10. Migration BattleArena

Remplacement de Matter.js par Rapier WASM avec canvas 2D conservé.

### Architecture hybride (Canvas 2D + Rapier WASM)

Le canvas 2D de `BattleArena.tsx` peut être conservé pour le rendu — Rapier ne fait que la physique.

```tsx
// hooks/useBeybladePhysics.ts — remplace la physique Matter.js
import { useEffect, useRef, useState, useCallback } from 'react';
import { initPhysics } from '@/lib/wasm/physics';
import type RAPIER from '@dimforge/rapier2d-compat';

const ARENA_RADIUS = 220;
const CENTER = { x: 250, y: 250 };

export function useBeybladePhysics() {
  const worldRef = useRef<RAPIER.World | null>(null);
  const body1Ref = useRef<RAPIER.RigidBody | null>(null);
  const body2Ref = useRef<RAPIER.RigidBody | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let world: RAPIER.World;

    initPhysics().then((RAPIER) => {
      world = new RAPIER.World({ x: 0, y: 0 });

      // Mur de l'arène
      const segments = 64;
      for (let i = 0; i < segments; i++) {
        const a1 = (i / segments) * Math.PI * 2;
        const a2 = ((i + 1) / segments) * Math.PI * 2;
        const wallBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
        world.createCollider(
          RAPIER.ColliderDesc.segment(
            { x: CENTER.x + Math.cos(a1) * ARENA_RADIUS, y: CENTER.y + Math.sin(a1) * ARENA_RADIUS },
            { x: CENTER.x + Math.cos(a2) * ARENA_RADIUS, y: CENTER.y + Math.sin(a2) * ARENA_RADIUS }
          ).setRestitution(0.9),
          wallBody
        );
      }

      worldRef.current = world;
      setReady(true);
    });

    return () => { world?.free(); };
  }, []);

  const spawnBey = useCallback((
    pos: { x: number; y: number },
    vel: { x: number; y: number },
    type: string,
    slot: 1 | 2
  ) => {
    if (!worldRef.current) return;
    // ... création du corps Rapier selon le type
  }, []);

  const step = useCallback(() => {
    worldRef.current?.step();
  }, []);

  const getPositions = useCallback(() => ({
    bey1: body1Ref.current?.translation() ?? { x: 0, y: 0 },
    bey2: body2Ref.current?.translation() ?? { x: 0, y: 0 },
  }), []);

  return { ready, spawnBey, step, getPositions };
}
```

---

## 11. Performances & bonnes pratiques

### Règles Next.js + R3F

```tsx
// ✅ Toujours désactiver le SSR pour les composants 3D
import dynamic from 'next/dynamic';

const BeybladeViewer = dynamic(
  () => import('@/components/3d/BeybladeViewer'),
  { ssr: false, loading: () => <div>Chargement 3D...</div> }
);
```

```tsx
// ✅ Preload les assets GLTF/OBJ sur la page parente
import { useGLTF } from '@react-three/drei';
useGLTF.preload('/models/blade.glb');
```

```tsx
// ✅ PerformanceMonitor — adapter la qualité selon le GPU
import { PerformanceMonitor } from '@react-three/drei';

<Canvas>
  <PerformanceMonitor
    onDecline={() => setQuality('low')}
    onIncline={() => setQuality('high')}
  >
    <Scene quality={quality} />
  </PerformanceMonitor>
</Canvas>
```

```tsx
// ✅ Instances — N toupies identiques avec 1 seul draw call
import { Instances, Instance } from '@react-three/drei';

<Instances limit={100}>
  <circleGeometry args={[18, 32]} />
  <meshStandardMaterial color="#dc2626" />
  {beybladesData.map((bey) => (
    <Instance key={bey.id} position={[bey.x, bey.y, 0]} />
  ))}
</Instances>
```

### Limites et seuils

| Métrique | Seuil OK | Seuil critique |
|---|---|---|
| Draw calls par frame | < 100 | > 500 |
| Triangles visibles | < 500k | > 2M |
| Textures GPU | < 512 MB | > 1 GB |
| FPS cible | 60 | < 30 |
| DPR (pixel ratio) | max 2 | > 2 |

### Formats de fichiers recommandés

| Format | Usage | Taille | Notes |
|---|---|---|---|
| `.glb` | Modèles 3D | Compact | Préférer à `.obj` — tout en un fichier |
| `.ktx2` | Textures compressées | ~10x moins | Basis Universal — R3F + drei le gère |
| `.webp` | Textures couleur | ~30% moins | Déjà utilisé dans le projet |
| `.hdr` + `.exr` | HDRI lighting | Variable | Convertir en `.exr` pour les perfs |

### Optimisations Three.js

```ts
// Disposer correctement les ressources Three.js
function disposeObject(obj: THREE.Object3D) {
  obj.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose();
      if (Array.isArray(child.material)) {
        child.material.forEach(m => m.dispose());
      } else {
        child.material.dispose();
      }
    }
  });
}

// Limiter le pixel ratio — éviter les canvas énormes
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Désactiver les ombres en mode mobile
renderer.shadowMap.enabled = !isMobile;
```

---

## 12. Checklist d'installation

```bash
# 1. Installer les dépendances
bun add @react-three/fiber @react-three/drei
bun add @dimforge/rapier2d-compat
bun add @react-three/postprocessing postprocessing
bun add gsap

# 2. Types TypeScript
bun add -D @types/three
```

```ts
// 3. next.config.ts — asyncWebAssembly pour Rapier WASM
webpack(config, { isServer, dev }) {
  config.output.webassemblyModuleFilename =
    isServer && !dev
      ? '../static/wasm/[modulehash].wasm'
      : 'static/wasm/[modulehash].wasm';
  config.experiments = { ...config.experiments, asyncWebAssembly: true };
  return config;
}
```

### Ordre de migration recommandé

- [ ] **Étape 1** : Installer `@react-three/fiber` + `@react-three/drei`
- [ ] **Étape 2** : Migrer `ThreeCanvas` dans `MeshViewer.tsx` → `BeybladeViewer` R3F
- [ ] **Étape 3** : Activer `three/webgpu` dans le renderer
- [ ] **Étape 4** : Installer `@dimforge/rapier2d-compat` + activer `asyncWebAssembly`
- [ ] **Étape 5** : Migrer la physique de `BattleArena.tsx` vers Rapier
- [ ] **Étape 6** : Ajouter `@react-three/postprocessing` (Bloom, Glitch)
- [ ] **Étape 7** : Charger `beyblade_stadium.glb` (déjà dans `public/`) dans l'arène
- [ ] **Étape 8** : Optimiser avec `PerformanceMonitor` + `Instances`

---

*Sources : [`pmndrs/react-three-fiber`](https://github.com/pmndrs/react-three-fiber) · [`pmndrs/drei`](https://github.com/pmndrs/drei) · [`dimforge/rapier`](https://github.com/dimforge/rapier) · [`pmndrs/react-postprocessing`](https://github.com/pmndrs/react-postprocessing) · [`mrdoob/three.js`](https://github.com/mrdoob/three.js) · [`gfx-rs/wgpu`](https://github.com/gfx-rs/wgpu)*
