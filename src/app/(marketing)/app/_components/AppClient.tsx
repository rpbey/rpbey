'use client';

import { Search } from '@mui/icons-material';
import {
  Box,
  Chip,
  Container,
  InputAdornment,
  Paper,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import type { Part } from '@prisma/client';
import { useMemo, useState } from 'react';
import { AssetGallery } from './AssetGallery';
import { MeshGallery } from './MeshViewer';
import { PartGrid } from './PartGrid';
import { ProductCatalog } from './ProductCatalog';
import { VfxGallery } from './VfxGallery';

/* ─── Types ─── */

interface ProductEntry {
  code: string;
  name: string;
  date: string;
}

interface AppClientProps {
  blades: Part[];
  ratchets: Part[];
  bits: Part[];
  lockChips: Part[];
  assistBlades: Part[];
  products: ProductEntry[];
}

/* ─── Constants ─── */

const APP_TABS = [
  {
    label: 'Collection',
    icon: '/bbx-icons/home-icon-2beylocker-on.webp',
    color: '#3b82f6',
  },
  {
    label: 'Textures & Sprites',
    icon: '/bbx-icons/icon-scan.webp',
    color: '#22c55e',
  },
  {
    label: 'Modèles 3D',
    icon: '/bbx-icons/icon-scan.webp',
    color: '#a855f7',
  },
  {
    label: 'Animations VFX',
    icon: '/bbx-icons/orangeStar.webp',
    color: '#f59e0b',
  },
  {
    label: 'Produits',
    icon: '/bbx-icons/btn-battle.webp',
    color: '#ef4444',
  },
];

const TYPE_FILTERS = [
  { label: 'Tous', value: 'ALL' },
  { label: 'Attaque', value: 'ATTACK', color: '#ef4444' },
  { label: 'Défense', value: 'DEFENSE', color: '#3b82f6' },
  { label: 'Endurance', value: 'STAMINA', color: '#22c55e' },
  { label: 'Équilibre', value: 'BALANCE', color: '#a855f7' },
];

const SYSTEM_FILTERS = [
  { label: 'Tous', value: 'ALL' },
  { label: 'BX', value: 'BX', color: '#ef4444' },
  { label: 'UX', value: 'UX', color: '#3b82f6' },
  { label: 'CX', value: 'CX', color: '#a855f7' },
];

/* ─── Main Component ─── */

export function AppClient({
  blades,
  ratchets,
  bits,
  lockChips,
  assistBlades,
  products,
}: AppClientProps) {
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [systemFilter, setSystemFilter] = useState('ALL');

  const allParts = useMemo(
    () => [...blades, ...ratchets, ...bits, ...lockChips, ...assistBlades],
    [blades, ratchets, bits, lockChips, assistBlades],
  );

  const filterParts = (parts: Part[]) => {
    return parts.filter((p) => {
      const matchSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.externalId.toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === 'ALL' || p.beyType === typeFilter;
      const matchSystem = systemFilter === 'ALL' || p.system === systemFilter;
      return matchSearch && matchType && matchSystem;
    });
  };

  const activeColor = APP_TABS[tab]?.color ?? '#fff';

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 1, md: 2 } }}>
      {/* ── Header ── */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box
          component="img"
          src="/bbx-icons/app_icon_round.webp"
          alt="Beyblade X App"
          sx={{ width: 40, height: 40 }}
        />
        <Box>
          <Typography variant="h5" fontWeight="900" sx={{ lineHeight: 1.2 }}>
            BEYBLADE X APP
          </Typography>
          <Typography variant="caption" color="text.secondary" fontWeight="600">
            {allParts.length} pièces · {products.length} produits · Ressources
            extraites de l'application officielle
          </Typography>
        </Box>
      </Box>

      {/* ── Tab Bar ── */}
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          borderRadius: 3,
          overflow: 'hidden',
          background:
            'linear-gradient(180deg, rgba(15,23,42,0.95) 0%, rgba(15,23,42,0.8) 100%)',
          border: '1px solid',
          borderColor: alpha('#fff', 0.08),
          backdropFilter: 'blur(12px)',
        }}
      >
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            minHeight: 64,
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0',
              background: activeColor,
              boxShadow: `0 0 12px ${activeColor}`,
            },
            '& .MuiTab-root': {
              minHeight: 64,
              textTransform: 'none',
              fontWeight: 800,
              fontSize: { xs: '0.75rem', sm: '0.85rem' },
              color: alpha('#fff', 0.45),
              transition: 'all 0.2s ease',
              '&.Mui-selected': { color: '#fff' },
              '&:hover': {
                color: alpha('#fff', 0.7),
                bgcolor: alpha('#fff', 0.03),
              },
            },
          }}
        >
          {APP_TABS.map((t, i) => (
            <Tab
              key={t.label}
              label={
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 0.5,
                  }}
                >
                  <Box
                    sx={{
                      width: 26,
                      height: 26,
                      filter:
                        tab === i
                          ? `drop-shadow(0 0 6px ${t.color})`
                          : 'grayscale(0.7) opacity(0.5)',
                      transition: 'filter 0.2s ease',
                    }}
                  >
                    <Box
                      component="img"
                      src={t.icon}
                      alt={t.label}
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                      }}
                    />
                  </Box>
                  <span>{t.label}</span>
                </Box>
              }
            />
          ))}
        </Tabs>
      </Paper>

      {/* ── Tab Content ── */}
      <Box sx={{ minHeight: 400 }}>
        {/* Collection */}
        {tab === 0 && (
          <Box>
            {/* Search & filters */}
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 2,
                mb: 3,
                alignItems: 'center',
              }}
            >
              <TextField
                placeholder="Rechercher une pièce..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                size="small"
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search sx={{ color: 'text.disabled' }} />
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{
                  minWidth: { xs: 0, sm: 280 },
                  width: { xs: '100%', sm: 'auto' },
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    fontWeight: 600,
                  },
                }}
              />
              <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                {TYPE_FILTERS.map((f) => (
                  <Chip
                    key={f.value}
                    label={f.label}
                    clickable
                    onClick={() => setTypeFilter(f.value)}
                    sx={{
                      fontWeight: 900,
                      fontSize: '0.75rem',
                      borderRadius: 2,
                      bgcolor:
                        typeFilter === f.value
                          ? f.color || 'text.primary'
                          : 'transparent',
                      color: typeFilter === f.value ? '#fff' : 'text.secondary',
                      border: '1px solid',
                      borderColor:
                        typeFilter === f.value
                          ? f.color || 'text.primary'
                          : 'divider',
                      '&:hover': {
                        bgcolor: f.color
                          ? alpha(f.color, typeFilter === f.value ? 1 : 0.15)
                          : undefined,
                      },
                    }}
                  />
                ))}
                {SYSTEM_FILTERS.map((f) => (
                  <Chip
                    key={`sys-${f.value}`}
                    label={f.label}
                    clickable
                    onClick={() => setSystemFilter(f.value)}
                    size="small"
                    sx={{
                      fontWeight: 800,
                      fontSize: '0.65rem',
                      borderRadius: 2,
                      bgcolor:
                        systemFilter === f.value
                          ? f.color || 'text.primary'
                          : 'transparent',
                      color:
                        systemFilter === f.value ? '#fff' : 'text.disabled',
                      border: '1px solid',
                      borderColor:
                        systemFilter === f.value
                          ? f.color || 'text.primary'
                          : alpha('#fff', 0.08),
                    }}
                  />
                ))}
              </Box>
            </Box>

            {/* Blades */}
            <Typography variant="h6" fontWeight="900" sx={{ mb: 2 }}>
              Blades ({filterParts(blades).length})
            </Typography>
            <PartGrid parts={filterParts(blades)} />

            <Box sx={{ my: 3 }} />

            {/* Ratchets */}
            <Typography variant="h6" fontWeight="900" sx={{ mb: 2 }}>
              Ratchets ({filterParts(ratchets).length})
            </Typography>
            <PartGrid parts={filterParts(ratchets)} />

            <Box sx={{ my: 3 }} />

            {/* Bits */}
            <Typography variant="h6" fontWeight="900" sx={{ mb: 2 }}>
              Bits ({filterParts(bits).length})
            </Typography>
            <PartGrid parts={filterParts(bits)} />

            {/* Assist Blades (CX) */}
            {assistBlades.length > 0 && (
              <>
                <Box sx={{ my: 3 }} />
                <Typography variant="h6" fontWeight="900" sx={{ mb: 2 }}>
                  Assist Blades ({filterParts(assistBlades).length})
                </Typography>
                <PartGrid parts={filterParts(assistBlades)} />
              </>
            )}

            {/* Lock Chips (CX) */}
            {lockChips.length > 0 && (
              <>
                <Box sx={{ my: 3 }} />
                <Typography variant="h6" fontWeight="900" sx={{ mb: 2 }}>
                  Lock Chips ({filterParts(lockChips).length})
                </Typography>
                <PartGrid parts={filterParts(lockChips)} />
              </>
            )}
          </Box>
        )}

        {/* Textures & Sprites */}
        {tab === 1 && <AssetGallery />}

        {/* Modèles 3D */}
        {tab === 2 && <MeshGallery />}

        {/* Animations VFX */}
        {tab === 3 && <VfxGallery />}

        {/* Produits */}
        {tab === 4 && <ProductCatalog products={products} />}
      </Box>
    </Container>
  );
}
