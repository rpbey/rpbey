'use client';

import { ExpandMore, Search } from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
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
import { BoosterTab } from './BoosterTab';
import { CombatTab } from './CombatTab';
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

const GAME_TABS = [
  { label: 'Boosters', icon: '/bbx-icons/orangeStar.webp', color: '#f59e0b' },
  {
    label: 'Collection',
    icon: '/bbx-icons/home-icon-2beylocker-on.webp',
    color: '#3b82f6',
  },
  { label: 'Atelier 3D', icon: '/bbx-icons/icon-scan.webp', color: '#22c55e' },
  { label: 'Combat', icon: '/bbx-icons/btn-battle.webp', color: '#ef4444' },
];

const RESOURCE_TABS = [
  { label: 'Textures & Sprites' },
  { label: 'Modèles 3D' },
  { label: 'Animations VFX' },
  { label: 'Produits & Codes' },
];

const TYPE_FILTERS = [
  { label: 'Tous', value: 'ALL' },
  { label: 'Attaque', value: 'ATTACK', color: '#ef4444' },
  { label: 'Défense', value: 'DEFENSE', color: '#3b82f6' },
  { label: 'Endurance', value: 'STAMINA', color: '#22c55e' },
  { label: 'Équilibre', value: 'BALANCE', color: '#a855f7' },
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
  const [gameTab, setGameTab] = useState(0);
  const [resourceTab, setResourceTab] = useState(0);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [resourcesOpen, setResourcesOpen] = useState(false);

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
      return matchSearch && matchType;
    });
  };

  const activeColor = GAME_TABS[gameTab]?.color ?? '#fff';

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 1, md: 2 } }}>
      {/* ── Game Tabs Top Bar ── */}
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
          value={gameTab}
          onChange={(_, v) => setGameTab(v)}
          variant="fullWidth"
          sx={{
            minHeight: 72,
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0',
              background: activeColor,
              boxShadow: `0 0 12px ${activeColor}`,
            },
            '& .MuiTab-root': {
              minHeight: 72,
              textTransform: 'none',
              fontWeight: 800,
              fontSize: { xs: '0.8rem', sm: '0.85rem', md: '0.95rem' },
              color: alpha('#fff', 0.45),
              transition: 'all 0.2s ease',
              '&.Mui-selected': {
                color: '#fff',
              },
              '&:hover': {
                color: alpha('#fff', 0.7),
                bgcolor: alpha('#fff', 0.03),
              },
            },
          }}
        >
          {GAME_TABS.map((tab, i) => (
            <Tab
              key={tab.label}
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
                      width: 32,
                      height: 32,
                      position: 'relative',
                      filter:
                        gameTab === i
                          ? `drop-shadow(0 0 8px ${tab.color})`
                          : 'grayscale(0.7) opacity(0.5)',
                      transition: 'filter 0.2s ease',
                    }}
                  >
                    <Box
                      component="img"
                      src={tab.icon}
                      alt={tab.label}
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                      }}
                    />
                  </Box>
                  <span>{tab.label}</span>
                </Box>
              }
            />
          ))}
        </Tabs>
      </Paper>

      {/* ── Game Tab Content ── */}
      <Box sx={{ minHeight: 400 }}>
        {/* Boosters */}
        {gameTab === 0 && <BoosterTab allParts={allParts} />}

        {/* Collection */}
        {gameTab === 1 && (
          <Box>
            {/* Search & type filters */}
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

        {/* Atelier 3D */}
        {gameTab === 2 && <MeshGallery />}

        {/* Combat */}
        {gameTab === 3 && (
          <CombatTab blades={blades} ratchets={ratchets} bits={bits} />
        )}
      </Box>

      {/* ── Ressources extraites (collapsible) ── */}
      <Box sx={{ mt: 6 }}>
        <Accordion
          expanded={resourcesOpen}
          onChange={() => setResourcesOpen(!resourcesOpen)}
          disableGutters
          elevation={0}
          sx={{
            borderRadius: '16px !important',
            overflow: 'hidden',
            border: '1px solid',
            borderColor: alpha('#fff', 0.08),
            bgcolor: alpha('#0f172a', 0.5),
            '&::before': { display: 'none' },
          }}
        >
          <AccordionSummary
            expandIcon={
              <ExpandMore sx={{ color: alpha('#fff', 0.4), fontSize: 28 }} />
            }
            sx={{
              minHeight: 64,
              px: 3,
              '& .MuiAccordionSummary-content': {
                alignItems: 'center',
                gap: 2,
              },
            }}
          >
            <Box
              component="img"
              src="/bbx-icons/icon-scan.webp"
              sx={{ width: 24, height: 24, opacity: 0.7 }}
            />
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 800,
                color: alpha('#fff', 0.7),
                letterSpacing: 0.5,
              }}
            >
              Ressources extraites
            </Typography>
            <Chip
              label="4 861 assets"
              size="small"
              sx={{
                height: 22,
                fontSize: '0.7rem',
                fontWeight: 700,
                bgcolor: alpha('#dc2626', 0.1),
                color: '#dc2626',
              }}
            />
          </AccordionSummary>

          <AccordionDetails sx={{ px: 3, pb: 3 }}>
            <Tabs
              value={resourceTab}
              onChange={(_, v) => setResourceTab(v)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                mb: 3,
                '& .MuiTab-root': {
                  fontWeight: 900,
                  fontSize: '0.8rem',
                  textTransform: 'none',
                },
              }}
            >
              {RESOURCE_TABS.map((tab) => (
                <Tab key={tab.label} label={tab.label} />
              ))}
            </Tabs>

            {resourceTab === 0 && <AssetGallery />}
            {resourceTab === 1 && <MeshGallery />}
            {resourceTab === 2 && <VfxGallery />}
            {resourceTab === 3 && <ProductCatalog products={products} />}
          </AccordionDetails>
        </Accordion>
      </Box>
    </Container>
  );
}
