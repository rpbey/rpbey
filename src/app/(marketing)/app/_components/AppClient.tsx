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
import { HeroBanner } from './HeroBanner';
import { PartGrid } from './PartGrid';
import { StatsOverview } from './StatsOverview';

interface AppClientProps {
  blades: Part[];
  ratchets: Part[];
  bits: Part[];
  totalParts: number;
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
  totalParts,
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

  const sections = useMemo(
    () => [
      { label: 'Blades', parts: filterParts(blades), icon: '⚔️' },
      { label: 'Ratchets', parts: filterParts(ratchets), icon: '⚙️' },
      { label: 'Bits', parts: filterParts(bits), icon: '🔩' },
      { label: 'Galerie', parts: [], icon: '🖼️' },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [blades, ratchets, bits, filterParts],
  );

  return (
    <Box>
      <HeroBanner totalParts={totalParts} />

      <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }}>
        {/* Stats Overview */}
        <StatsOverview
          bladeCount={blades.length}
          ratchetCount={ratchets.length}
          bitCount={bits.length}
          totalCombinations={blades.length * ratchets.length * bits.length}
        />

        {/* Navigation Tabs */}
        <Box
          sx={{
            mt: 4,
            mb: 3,
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                fontWeight: 900,
                fontSize: '0.9rem',
                textTransform: 'none',
                minHeight: 56,
              },
            }}
          >
            {sections.map((section, i) => (
              <Tab
                key={section.label}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>{section.label}</span>
                    {i < 3 && (
                      <Chip
                        label={section.parts.length}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.7rem',
                          fontWeight: 900,
                        }}
                      />
                    )}
                  </Box>
                }
              />
            ))}
          </Tabs>
        </Box>

        {/* Search & Filters (for parts tabs) */}
        {activeTab < 3 && (
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

            <Typography
              variant="caption"
              color="text.disabled"
              sx={{ ml: 'auto', fontWeight: 600 }}
            >
              {sections[activeTab]?.parts.length ?? 0} résultat
              {(sections[activeTab]?.parts.length ?? 0) !== 1 ? 's' : ''}
            </Typography>
          </Box>
        )}

        {/* Content */}
        {activeTab < 3 ? (
          <PartGrid parts={sections[activeTab]?.parts ?? []} />
        ) : (
          <AssetGallery />
        )}
      </Container>
    </Box>
  );
}
