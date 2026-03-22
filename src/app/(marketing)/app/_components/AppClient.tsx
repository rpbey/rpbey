'use client';

import { Search } from '@mui/icons-material';
import {
  Box,
  Chip,
  Container,
  InputAdornment,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import type { Part } from '@prisma/client';
import { useMemo, useState } from 'react';
import { AssetGallery } from './AssetGallery';
import { PartGrid } from './PartGrid';
import { ProductCatalog } from './ProductCatalog';
import { VfxGallery } from './VfxGallery';

interface ProductEntry {
  code: string;
  name: string;
  date: string;
}

interface AppClientProps {
  blades: Part[];
  ratchets: Part[];
  bits: Part[];
  products: ProductEntry[];
}

const TYPE_FILTERS = [
  { label: 'Tous', value: 'ALL' },
  { label: 'Attaque', value: 'ATTACK', color: '#ef4444' },
  { label: 'Défense', value: 'DEFENSE', color: '#3b82f6' },
  { label: 'Endurance', value: 'STAMINA', color: '#22c55e' },
  { label: 'Équilibre', value: 'BALANCE', color: '#a855f7' },
];

export function AppClient({
  blades,
  ratchets,
  bits,
  products,
}: AppClientProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

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

  const tabs = useMemo(() => {
    const filteredBlades = filterParts(blades);
    const filteredRatchets = filterParts(ratchets);
    const filteredBits = filterParts(bits);
    return [
      { label: 'Textures & Sprites', count: null },
      { label: 'Animations VFX', count: null },
      { label: 'Blades', count: filteredBlades.length },
      { label: 'Ratchets', count: filteredRatchets.length },
      { label: 'Bits', count: filteredBits.length },
      { label: 'Produits & Codes', count: products.length },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blades, ratchets, bits, products, filterParts]);

  const isPartTab = activeTab >= 2 && activeTab <= 4;

  const getActiveParts = (): Part[] => {
    if (activeTab === 2) return filterParts(blades);
    if (activeTab === 3) return filterParts(ratchets);
    if (activeTab === 4) return filterParts(bits);
    return [];
  };

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 1.5, md: 3 } }}>
      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              fontWeight: 900,
              fontSize: '0.85rem',
              textTransform: 'none',
              minHeight: 52,
            },
          }}
        >
          {tabs.map((tab) => (
            <Tab
              key={tab.label}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>{tab.label}</span>
                  {tab.count !== null && (
                    <Chip
                      label={tab.count}
                      size="small"
                      sx={{ height: 20, fontSize: '0.7rem', fontWeight: 900 }}
                    />
                  )}
                </Box>
              }
            />
          ))}
        </Tabs>
      </Box>

      {/* Search & type filter for part tabs */}
      {isPartTab && (
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
              minWidth: 280,
              '& .MuiOutlinedInput-root': { borderRadius: 3, fontWeight: 600 },
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
          <Typography
            variant="caption"
            color="text.disabled"
            sx={{ ml: 'auto', fontWeight: 600 }}
          >
            {getActiveParts().length} résultat
            {getActiveParts().length !== 1 ? 's' : ''}
          </Typography>
        </Box>
      )}

      {/* Content */}
      {activeTab === 0 && <AssetGallery />}
      {activeTab === 1 && <VfxGallery />}
      {isPartTab && <PartGrid parts={getActiveParts()} />}
      {activeTab === 5 && <ProductCatalog products={products} />}
    </Container>
  );
}
