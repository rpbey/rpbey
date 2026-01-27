'use client';

import { Search } from '@mui/icons-material';
import FilterListIcon from '@mui/icons-material/FilterList';
import {
  Box,
  Button,
  Container,
  Drawer,
  InputAdornment,
  Grid as MuiGrid,
  Pagination,
  Tab,
  Tabs,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import type { Part, PartType } from '@prisma/client';
import { useCallback, useEffect, useState } from 'react';
import { getPublicParts } from '@/server/actions/parts';
import { type FilterState, Filters } from './Filters';
import { PartCard } from './PartCard';
import { PartDetailModal } from './PartDetailModal';

export function PartsBrowser() {
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState(0); // 0: All, 1: Blade, 2: Ratchet, 3: Bit
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);

  const [filters, setFilters] = useState<FilterState>({
    system: [],
    type: [],
    spin: 'ALL',
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const fetchParts = useCallback(async () => {
    setLoading(true);
    const typeMap: Record<number, PartType | 'ALL'> = {
      0: 'ALL',
      1: 'BLADE',
      2: 'RATCHET',
      3: 'BIT',
    };

    const { parts, totalPages } = await getPublicParts({
      search,
      type: typeMap[tab],
      systems: filters.system,
      spin: filters.spin,
      beyTypes: filters.type,
      page,
    });

    setParts(parts);
    setTotalPages(totalPages);
    setLoading(false);
  }, [search, tab, page, filters]);

  useEffect(() => {
    const timer = setTimeout(fetchParts, 300);
    return () => clearTimeout(timer);
  }, [fetchParts]);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography
          variant="h2"
          fontWeight="900"
          sx={{ mb: 2, fontSize: { xs: '2.5rem', md: '3.5rem' } }}
        >
          BEY DATA
        </Typography>
        <Typography
          variant="h6"
          color="text.secondary"
          sx={{
            maxWidth: 600,
            mx: 'auto',
            fontSize: { xs: '1rem', md: '1.25rem' },
          }}
        >
          L'encyclopédie technique de la RPB.
        </Typography>
      </Box>

      {/* Top Controls */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
          mb: 4,
        }}
      >
        <Box sx={{ display: 'flex', gap: 2, width: '100%', maxWidth: 600 }}>
          <TextField
            placeholder="Chercher une pièce..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            fullWidth
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
                sx: { borderRadius: 4 },
              },
            }}
          />
          {isMobile && (
            <Button
              variant="outlined"
              onClick={() => setMobileOpen(true)}
              sx={{ minWidth: 'auto', px: 2, borderRadius: 4 }}
            >
              <FilterListIcon />
            </Button>
          )}
        </Box>

        <Tabs
          value={tab}
          onChange={(_, v) => {
            setTab(v);
            setPage(1);
          }}
          centered
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': { fontWeight: 'bold' },
          }}
        >
          <Tab label="TOUTES" />
          <Tab label="LAMES" />
          <Tab label="RATCHETS" />
          <Tab label="POINTES (BITS)" />
        </Tabs>
      </Box>

      <MuiGrid container spacing={4}>
        {/* Sidebar Filters (Desktop) */}
        <MuiGrid size={{ md: 3 }} sx={{ display: { xs: 'none', md: 'block' } }}>
          <Box sx={{ position: 'sticky', top: 100 }}>
            <Filters filters={filters} onChange={setFilters} />
          </Box>
        </MuiGrid>

        {/* Results Grid */}
        <MuiGrid size={{ xs: 12, md: 9 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: 2,
            }}
          >
            {parts.map((part) => (
              <Box
                key={part.id}
                onClick={() => setSelectedPart(part)}
                sx={{ cursor: 'pointer' }}
              >
                <PartCard part={part} />
              </Box>
            ))}
          </Box>

          {parts.length === 0 && !loading && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary">
                Aucun résultat trouvé.
              </Typography>
              <Button
                onClick={() => {
                  setSearch('');
                  setFilters({ system: [], type: [], spin: 'ALL' });
                }}
                sx={{ mt: 2 }}
              >
                Réinitialiser les filtres
              </Button>
            </Box>
          )}

          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, p) => setPage(p)}
                color="primary"
                size="large"
              />
            </Box>
          )}
        </MuiGrid>
      </MuiGrid>

      {/* Mobile Filters Drawer */}
      <Drawer
        anchor="bottom"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            p: 2,
            maxHeight: '80vh',
          },
        }}
      >
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
          Filtres de recherche
        </Typography>
        <Filters filters={filters} onChange={setFilters} />
        <Button
          variant="contained"
          fullWidth
          onClick={() => setMobileOpen(false)}
          sx={{ mt: 3, borderRadius: 2 }}
        >
          Afficher les résultats
        </Button>
      </Drawer>

      <PartDetailModal
        part={selectedPart}
        onClose={() => setSelectedPart(null)}
      />
    </Container>
  );
}
