'use client';

import { Search } from '@mui/icons-material';
import {
  Box,
  CircularProgress,
  InputAdornment,
  Pagination,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import type { Part } from '@prisma/client';
import { useCallback, useEffect, useState, useTransition } from 'react';
import { getPublicParts } from '@/server/actions/parts';
import { CatalogFilters } from './CatalogFilters';
import { CatalogPartCard } from './CatalogPartCard';
import { useBuilder, type BuilderStep } from './BuilderContext';

const STEP_TO_TYPE: Record<BuilderStep, string> = {
  BLADE: 'BLADE',
  RATCHET: 'RATCHET',
  BIT: 'BIT',
};

const TABS: { label: string; value: BuilderStep }[] = [
  { label: 'Lames', value: 'BLADE' },
  { label: 'Ratchets', value: 'RATCHET' },
  { label: 'Bits', value: 'BIT' },
];

export function PartCatalog() {
  const { state, dispatch, usedPartIds } = useBuilder();
  const [parts, setParts] = useState<Part[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [systems, setSystems] = useState<string[]>([]);
  const [beyTypes, setBeyTypes] = useState<string[]>([]);
  const [spin, setSpin] = useState('ALL');
  const [isPending, startTransition] = useTransition();

  const fetchParts = useCallback(() => {
    startTransition(async () => {
      const result = await getPublicParts({
        type: STEP_TO_TYPE[state.activeStep] as 'BLADE' | 'RATCHET' | 'BIT',
        search: search || undefined,
        systems: systems.length > 0 ? systems : undefined,
        beyTypes: beyTypes.length > 0 ? beyTypes : undefined,
        spin: spin !== 'ALL' ? spin : undefined,
        page,
        pageSize: 30,
      });
      setParts(result.parts);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    });
  }, [state.activeStep, search, systems, beyTypes, spin, page]);

  useEffect(() => {
    setPage(1);
  }, [state.activeStep, search, systems, beyTypes, spin]);

  useEffect(() => {
    fetchParts();
  }, [fetchParts]);

  const handleTabChange = (_: unknown, value: number) => {
    const tab = TABS[value];
    if (tab) dispatch({ type: 'SET_ACTIVE_STEP', step: tab.value });
  };

  const handlePartClick = (part: Part) => {
    dispatch({ type: 'SET_PART', part });
    dispatch({ type: 'SET_MOBILE_TAB', tab: 'deck' });
  };

  const activeTabIndex = TABS.findIndex((t) => t.value === state.activeStep);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, height: '100%' }}>
      <TextField
        placeholder="Rechercher une pièce..."
        size="small"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            ),
          },
        }}
        fullWidth
      />

      <CatalogFilters
        systems={systems}
        onSystemsChange={setSystems}
        beyTypes={beyTypes}
        onBeyTypesChange={setBeyTypes}
        spin={spin}
        onSpinChange={setSpin}
      />

      <Tabs
        value={activeTabIndex}
        onChange={handleTabChange}
        variant="fullWidth"
        sx={{
          minHeight: 36,
          '& .MuiTab-root': { minHeight: 36, py: 0.5, fontWeight: 'bold', fontSize: '0.8rem' },
        }}
      >
        {TABS.map((tab) => (
          <Tab key={tab.value} label={tab.label} />
        ))}
      </Tabs>

      <Box sx={{ position: 'relative', flex: 1, minHeight: 0 }}>
        {isPending && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(0,0,0,0.2)',
              zIndex: 2,
              borderRadius: 1,
            }}
          >
            <CircularProgress size={32} />
          </Box>
        )}

        {parts.length === 0 && !isPending ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography color="text.secondary">Aucune pièce trouvée</Typography>
          </Box>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: 1.5,
            }}
          >
            {parts.map((part) => (
              <CatalogPartCard
                key={part.id}
                part={part}
                isUsed={usedPartIds.has(part.id)}
                onClick={() => handlePartClick(part)}
              />
            ))}
          </Box>
        )}
      </Box>

      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1, pt: 1 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, p) => setPage(p)}
            size="small"
            siblingCount={1}
          />
          <Typography variant="caption" color="text.secondary">
            {total} pièces
          </Typography>
        </Box>
      )}
    </Box>
  );
}
