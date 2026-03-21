'use client';

import { FilterList, Search } from '@mui/icons-material';
import {
  Box,
  Chip,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material';
import type { GachaCard } from '@prisma/client';
import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { GachaCardDisplay } from './GachaCardDisplay';

const RARITY_OPTIONS = [
  { value: 'ALL', label: 'Toutes', color: '#9ca3af' },
  { value: 'COMMON', label: 'Commune', color: '#9ca3af' },
  { value: 'RARE', label: 'Rare', color: '#3b82f6' },
  { value: 'EPIC', label: 'Épique', color: '#8b5cf6' },
  { value: 'LEGENDARY', label: 'Légendaire', color: '#fbbf24' },
  { value: 'SECRET', label: 'Secrète', color: '#ef4444' },
];

const SERIES_NAMES: Record<string, string> = {
  METAL_MASTERS: 'Metal Masters',
  METAL_FURY: 'Metal Fury',
  METAL_FUSION: 'Metal Fusion',
  SHOGUN_STEEL: 'Shogun Steel',
  BURST: 'Burst',
  BEYBLADE_X: 'Beyblade X',
  BAKUTEN: 'Bakuten',
};

const ELEMENT_OPTIONS = [
  { value: 'ALL', label: 'Tous', emoji: '⚡' },
  { value: 'FEU', label: 'Feu', emoji: '🔥' },
  { value: 'EAU', label: 'Eau', emoji: '💧' },
  { value: 'TERRE', label: 'Terre', emoji: '🌿' },
  { value: 'VENT', label: 'Vent', emoji: '🌪️' },
  { value: 'OMBRE', label: 'Ombre', emoji: '🌑' },
  { value: 'LUMIERE', label: 'Lumière', emoji: '✨' },
  { value: 'NEUTRAL', label: 'Neutre', emoji: '⚡' },
];

interface GachaCatalogueProps {
  cards: GachaCard[];
}

export function GachaCatalogue({ cards }: GachaCatalogueProps) {
  const [search, setSearch] = useState('');
  const [selectedRarity, setSelectedRarity] = useState('ALL');
  const [selectedSeries, setSelectedSeries] = useState('ALL');
  const [selectedElement, setSelectedElement] = useState('ALL');
  const [showFilters, setShowFilters] = useState(false);

  const seriesOptions = useMemo(() => {
    const unique = [...new Set(cards.map((c) => c.series))].sort();
    return [
      { value: 'ALL', label: 'Toutes' },
      ...unique.map((s) => ({ value: s, label: SERIES_NAMES[s] || s })),
    ];
  }, [cards]);

  const filtered = useMemo(() => {
    return cards.filter((card) => {
      if (selectedRarity !== 'ALL' && card.rarity !== selectedRarity)
        return false;
      if (selectedSeries !== 'ALL' && card.series !== selectedSeries)
        return false;
      if (selectedElement !== 'ALL' && card.element !== selectedElement)
        return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          card.name.toLowerCase().includes(q) ||
          card.nameJp?.toLowerCase().includes(q) ||
          card.beyblade?.toLowerCase().includes(q) ||
          card.series.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [cards, search, selectedRarity, selectedSeries, selectedElement]);

  return (
    <Box id="catalogue" sx={{ px: { xs: 2, md: 6 }, mb: 6 }}>
      {/* Section header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 3,
        }}
      >
        <Box>
          <Typography
            variant="h5"
            fontWeight={800}
            sx={{
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            🃏 Catalogue des cartes
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: 'rgba(255,255,255,0.5)', mt: 0.5 }}
          >
            {filtered.length} carte{filtered.length > 1 ? 's' : ''} sur{' '}
            {cards.length}
          </Typography>
        </Box>
        <IconButton
          onClick={() => setShowFilters(!showFilters)}
          sx={{
            color: showFilters ? '#8b5cf6' : 'rgba(255,255,255,0.5)',
            bgcolor: showFilters ? 'rgba(139,92,246,0.15)' : 'transparent',
          }}
        >
          <FilterList />
        </IconButton>
      </Box>

      {/* Search */}
      <TextField
        fullWidth
        size="small"
        placeholder="Rechercher un blader, une toupie..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 20 }} />
              </InputAdornment>
            ),
          },
        }}
        sx={{
          mb: 2,
          '& .MuiOutlinedInput-root': {
            borderRadius: 3,
            bgcolor: 'rgba(255,255,255,0.03)',
            color: 'white',
            fontSize: '0.85rem',
            '& fieldset': { borderColor: 'rgba(255,255,255,0.08)' },
            '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.15)' },
            '&.Mui-focused fieldset': { borderColor: '#8b5cf6' },
          },
        }}
      />

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <Box
            component={motion.div}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            sx={{ overflow: 'hidden', mb: 3 }}
          >
            {/* Rarity filter */}
            <Box sx={{ mb: 1.5 }}>
              <Typography
                variant="caption"
                sx={{
                  color: 'rgba(255,255,255,0.4)',
                  mb: 1,
                  display: 'block',
                  fontSize: '0.7rem',
                }}
              >
                Rareté
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                {RARITY_OPTIONS.map((opt) => (
                  <Chip
                    key={opt.value}
                    label={opt.label}
                    size="small"
                    onClick={() => setSelectedRarity(opt.value)}
                    sx={{
                      bgcolor:
                        selectedRarity === opt.value
                          ? `${opt.color}25`
                          : 'rgba(255,255,255,0.05)',
                      color:
                        selectedRarity === opt.value
                          ? opt.color
                          : 'rgba(255,255,255,0.5)',
                      border:
                        selectedRarity === opt.value
                          ? `1px solid ${opt.color}50`
                          : '1px solid transparent',
                      fontWeight: 600,
                      fontSize: '0.7rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': { bgcolor: `${opt.color}15` },
                    }}
                  />
                ))}
              </Box>
            </Box>

            {/* Series filter */}
            <Box sx={{ mb: 1.5 }}>
              <Typography
                variant="caption"
                sx={{
                  color: 'rgba(255,255,255,0.4)',
                  mb: 1,
                  display: 'block',
                  fontSize: '0.7rem',
                }}
              >
                Série
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                {seriesOptions.map((opt) => (
                  <Chip
                    key={opt.value}
                    label={opt.label}
                    size="small"
                    onClick={() => setSelectedSeries(opt.value)}
                    sx={{
                      bgcolor:
                        selectedSeries === opt.value
                          ? 'rgba(139,92,246,0.2)'
                          : 'rgba(255,255,255,0.05)',
                      color:
                        selectedSeries === opt.value
                          ? '#a78bfa'
                          : 'rgba(255,255,255,0.5)',
                      border:
                        selectedSeries === opt.value
                          ? '1px solid rgba(139,92,246,0.4)'
                          : '1px solid transparent',
                      fontWeight: 600,
                      fontSize: '0.7rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': { bgcolor: 'rgba(139,92,246,0.1)' },
                    }}
                  />
                ))}
              </Box>
            </Box>

            {/* Element filter */}
            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: 'rgba(255,255,255,0.4)',
                  mb: 1,
                  display: 'block',
                  fontSize: '0.7rem',
                }}
              >
                Élément
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                {ELEMENT_OPTIONS.map((opt) => (
                  <Chip
                    key={opt.value}
                    label={`${opt.emoji} ${opt.label}`}
                    size="small"
                    onClick={() => setSelectedElement(opt.value)}
                    sx={{
                      bgcolor:
                        selectedElement === opt.value
                          ? 'rgba(251,191,36,0.15)'
                          : 'rgba(255,255,255,0.05)',
                      color:
                        selectedElement === opt.value
                          ? '#fbbf24'
                          : 'rgba(255,255,255,0.5)',
                      border:
                        selectedElement === opt.value
                          ? '1px solid rgba(251,191,36,0.3)'
                          : '1px solid transparent',
                      fontWeight: 600,
                      fontSize: '0.7rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': { bgcolor: 'rgba(251,191,36,0.1)' },
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        )}
      </AnimatePresence>

      {/* Cards grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(2, 1fr)',
            sm: 'repeat(3, 1fr)',
            md: 'repeat(4, 1fr)',
            lg: 'repeat(5, 1fr)',
            xl: 'repeat(6, 1fr)',
          },
          gap: { xs: 1.5, md: 2.5 },
        }}
      >
        <AnimatePresence mode="popLayout">
          {filtered.map((card, i) => (
            <Box
              key={card.id}
              component={motion.div}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: Math.min(i * 0.02, 0.5) }}
              layout
            >
              <GachaCardDisplay card={card} />
            </Box>
          ))}
        </AnimatePresence>
      </Box>

      {filtered.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography
            sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '3rem', mb: 2 }}
          >
            🔍
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.4)' }}>
            Aucune carte trouvée
          </Typography>
        </Box>
      )}
    </Box>
  );
}
