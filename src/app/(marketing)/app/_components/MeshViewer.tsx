'use client';

import { Close, ThreeDRotation } from '@mui/icons-material';
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

interface MeshAsset {
  name: string;
  path: string;
  category: string;
}

const MESH_CATEGORIES = [
  { label: 'Toutes', value: 'all' },
  { label: 'Blades (Head)', value: 'blade', color: '#ef4444' },
  { label: 'Ratchets', value: 'ratchet', color: '#f59e0b' },
  { label: 'Bits', value: 'bit', color: '#3b82f6' },
  { label: 'Base', value: 'base', color: '#22c55e' },
  { label: 'Trophées', value: 'trophy', color: '#a855f7' },
  { label: 'VFX / Autre', value: 'other', color: '#6b7280' },
];

function categorizeMesh(name: string): string {
  const lower = name.toLowerCase();
  if (
    lower.startsWith('head_') ||
    lower.startsWith('auxblade') ||
    lower.includes('bladecore')
  )
    return 'blade';
  if (lower.startsWith('ratchet')) return 'ratchet';
  if (lower.startsWith('bit_')) return 'bit';
  if (lower.startsWith('base_') || lower.startsWith('headparts')) return 'base';
  if (lower.startsWith('trophy')) return 'trophy';
  return 'other';
}

function ThreeCanvas({
  meshPath,
  width,
  height,
}: {
  meshPath: string;
  width: number;
  height: number;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);
    const backLight = new THREE.DirectionalLight(0xdc2626, 0.3);
    backLight.position.set(-5, -5, -5);
    scene.add(backLight);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 2;

    // Load OBJ
    const loader = new OBJLoader();
    loader.load(
      meshPath,
      (obj) => {
        // Apply material
        const material = new THREE.MeshStandardMaterial({
          color: 0xcccccc,
          metalness: 0.7,
          roughness: 0.3,
        });
        obj.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.material = material;
          }
        });

        // Center and scale
        const box = new THREE.Box3().setFromObject(obj);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 3 / maxDim;
        obj.scale.setScalar(scale);
        obj.position.sub(center.multiplyScalar(scale));

        scene.add(obj);
        camera.position.set(0, 2, 5);
        controls.update();
      },
      undefined,
      () => {
        // Error loading — show nothing
      },
    );

    // Animation loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    cleanupRef.current = () => {
      cancelAnimationFrame(animId);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      scene.clear();
    };

    return () => {
      cleanupRef.current?.();
    };
  }, [meshPath, width, height]);

  return <div ref={mountRef} style={{ width, height }} />;
}

function MeshCard({ mesh }: { mesh: MeshAsset }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const catColor =
    MESH_CATEGORIES.find((c) => c.value === mesh.category)?.color || '#888';
  const displayName = mesh.name.replace('.obj', '').replace(/_/g, ' ');

  return (
    <>
      <Card
        variant="outlined"
        sx={{
          borderRadius: 3,
          borderColor: alpha(catColor, 0.15),
          transition: 'all 0.3s',
          '&:hover': {
            borderColor: catColor,
            transform: 'translateY(-4px)',
            boxShadow: `0 8px 24px ${alpha(catColor, 0.2)}`,
          },
        }}
      >
        <CardActionArea onClick={() => setDialogOpen(true)}>
          {/* 3D Preview */}
          <Box
            sx={{
              width: '100%',
              aspectRatio: '1',
              bgcolor: '#0a0a0a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <ThreeCanvas meshPath={mesh.path} width={200} height={200} />
            <Box
              sx={{
                position: 'absolute',
                top: 6,
                right: 6,
                bgcolor: alpha('#000', 0.5),
                borderRadius: 1,
                p: 0.3,
              }}
            >
              <ThreeDRotation sx={{ fontSize: 14, color: '#888' }} />
            </Box>
          </Box>
          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Typography
              variant="body2"
              fontWeight="900"
              noWrap
              sx={{ fontSize: '0.75rem' }}
            >
              {displayName}
            </Typography>
            <Chip
              label={mesh.category}
              size="small"
              sx={{
                height: 16,
                fontSize: '0.55rem',
                fontWeight: 900,
                mt: 0.5,
                bgcolor: alpha(catColor, 0.15),
                color: catColor,
                textTransform: 'uppercase',
              }}
            />
          </CardContent>
        </CardActionArea>
      </Card>

      {/* Full viewer dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            sx: { bgcolor: '#0a0a0a', borderRadius: 4, overflow: 'hidden' },
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#fff',
            pb: 1,
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight="900">
              {displayName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {mesh.name} — Cliquer-glisser pour tourner, molette pour zoomer
            </Typography>
          </Box>
          <IconButton
            onClick={() => setDialogOpen(false)}
            sx={{ color: '#888' }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, display: 'flex', justifyContent: 'center' }}>
          {dialogOpen && (
            <ThreeCanvas meshPath={mesh.path} width={600} height={500} />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export function MeshGallery() {
  const [meshes, setMeshes] = useState<MeshAsset[]>([]);
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/app-assets?type=meshes')
      .then((r) => r.json())
      .then((data) => {
        const assets = (data.assets || []).map(
          (a: { name: string; path: string }) => ({
            ...a,
            category: categorizeMesh(a.name),
          }),
        );
        setMeshes(assets);
        setLoading(false);
      })
      .catch(() => {
        setMeshes([]);
        setLoading(false);
      });
  }, []);

  const filtered =
    category === 'all' ? meshes : meshes.filter((m) => m.category === category);

  return (
    <Box>
      {/* Category filter */}
      <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 3 }}>
        {MESH_CATEGORIES.map((cat) => {
          const count =
            cat.value === 'all'
              ? meshes.length
              : meshes.filter((m) => m.category === cat.value).length;
          return (
            <Chip
              key={cat.value}
              label={`${cat.label} (${count})`}
              clickable
              onClick={() => setCategory(cat.value)}
              sx={{
                fontWeight: 900,
                fontSize: '0.75rem',
                borderRadius: 2,
                bgcolor:
                  category === cat.value
                    ? cat.color || 'text.primary'
                    : 'transparent',
                color: category === cat.value ? '#fff' : 'text.secondary',
                border: '1px solid',
                borderColor:
                  category === cat.value
                    ? cat.color || 'text.primary'
                    : 'divider',
              }}
            />
          );
        })}
      </Box>

      <Typography
        variant="caption"
        color="text.disabled"
        sx={{ mb: 2, display: 'block' }}
      >
        {filtered.length} modèle{filtered.length !== 1 ? 's' : ''} 3D — Chaque
        carte affiche un aperçu en rotation automatique
      </Typography>

      {loading ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography color="text.disabled">
            Chargement des modèles 3D...
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(2, 1fr)',
              sm: 'repeat(3, 1fr)',
              md: 'repeat(4, 1fr)',
              lg: 'repeat(5, 1fr)',
            },
            gap: 2,
          }}
        >
          {filtered.slice(0, 60).map((mesh) => (
            <MeshCard key={mesh.name} mesh={mesh} />
          ))}
        </Box>
      )}

      {filtered.length > 60 && (
        <Box
          sx={{
            textAlign: 'center',
            py: 3,
            mt: 2,
            borderRadius: 3,
            bgcolor: alpha('#a855f7', 0.03),
            border: '1px solid',
            borderColor: alpha('#a855f7', 0.1),
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Affichage limité à 60 modèles — {filtered.length - 60} modèles
            supplémentaires disponibles
          </Typography>
        </Box>
      )}
    </Box>
  );
}
