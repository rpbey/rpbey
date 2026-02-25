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
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { getPublicParts } from '@/server/actions/parts';
import { CatalogFilters } from './CatalogFilters';
import { CatalogPartCard } from './CatalogPartCard';
import { useBuilder, isCXBlade, type BuilderStep } from './BuilderContext';

const STEP_TO_TYPE: Record<BuilderStep, string> = {
  BLADE: 'BLADE',
  RATCHET: 'RATCHET',
  BIT: 'BIT',
  LOCK_CHIP: 'LOCK_CHIP',
  ASSIST_BLADE: 'ASSIST_BLADE',
};

interface TabDef {
  label: string;
  value: BuilderStep;
}

const BASE_TABS: TabDef[] = [
  { label: 'Lames', value: 'BLADE' },
  { label: 'Ratchets', value: 'RATCHET' },
  { label: 'Bits', value: 'BIT' },
];

const CX_TABS: TabDef[] = [
  { label: 'Lames', value: 'BLADE' },
  { label: 'Lock Chip', value: 'LOCK_CHIP' },
  { label: 'Assist', value: 'ASSIST_BLADE' },
  { label: 'Ratchets', value: 'RATCHET' },
  { label: 'Bits', value: 'BIT' },
];

export function PartCatalog() {
  const { state, dispatch, usedPartIds, usedPartNames } = useBuilder();
  const [parts, setParts] = useState<Part[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [systems, setSystems] = useState<string[]>([]);
  const [beyTypes, setBeyTypes] = useState<string[]>([]);
  const [spin, setSpin] = useState('ALL');
  const [isPending, startTransition] = useTransition();

  // Determine if the current active slot has a CX blade
  const activeSlot = state.beys[state.activeSlotIndex as 0 | 1 | 2];
  const showCXTabs = isCXBlade(activeSlot);
  const TABS = useMemo(() => (showCXTabs ? CX_TABS : BASE_TABS), [showCXTabs]);

  const fetchParts = useCallback(
    (p: number) => {
      startTransition(async () => {
        const result = await getPublicParts({
          type: STEP_TO_TYPE[state.activeStep] as 'BLADE' | 'RATCHET' | 'BIT' | 'LOCK_CHIP' | 'ASSIST_BLADE',
          search: search || undefined,
          systems: systems.length > 0 ? systems : undefined,
          beyTypes: beyTypes.length > 0 ? beyTypes : undefined,
          spin: spin !== 'ALL' ? spin : undefined,
          page: p,
          pageSize: 30,
        });
        setParts(result.parts);
        setTotal(result.total);
        setTotalPages(result.totalPages);
      });
    },
    [state.activeStep, search, systems, beyTypes, spin],
  );

  // Reset to page 1 and fetch when filters change
  useEffect(() => {
    setPage(1);
    fetchParts(1);
  }, [fetchParts]);

  const handleTabChange = (_: unknown, value: number) => {
    const tab = TABS[value];
    if (tab) dispatch({ type: 'SET_ACTIVE_STEP', step: tab.value });
  };

  const handlePartClick = (part: Part) => {
    dispatch({ type: 'SET_PART', part });
    dispatch({ type: 'SET_MOBILE_TAB', tab: 'deck' });
  };

  // If active step is a CX-only tab but we're not in CX mode, redirect to BLADE
  const activeTabIndex = TABS.findIndex((t) => t.value === state.activeStep);
  const resolvedTabIndex = activeTabIndex !== -1 ? activeTabIndex : 0;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
      <TextField
        placeholder="Rechercher une piece..."
        size="small"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" color="action" />
              </InputAdornment>
            ),
          },
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 2.5,
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
        value={resolvedTabIndex}
        onChange={handleTabChange}
        variant="fullWidth"
        sx={{
          minHeight: 40,
          bgcolor: (theme) => theme.palette.action.hover,
          borderRadius: 2,
          '& .MuiTab-root': {
            minHeight: 40,
            py: 0.5,
            fontWeight: 'bold',
            fontSize: '0.85rem',
            borderRadius: 2,
            textTransform: 'none',
          },
          '& .Mui-selected': {
            bgcolor: 'background.paper',
          },
          '& .MuiTabs-indicator': {
            display: 'none',
          },
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
              bgcolor: 'rgba(0,0,0,0.15)',
              zIndex: 2,
              borderRadius: 2,
              backdropFilter: 'blur(2px)',
            }}
          >
            <CircularProgress size={32} color="error" />
          </Box>
        )}

        {parts.length === 0 && !isPending ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography color="text.secondary" variant="body2">
              Aucune piece trouvee
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(auto-fill, minmax(120px, 1fr))',
                sm: 'repeat(auto-fill, minmax(140px, 1fr))',
                lg: 'repeat(auto-fill, minmax(150px, 1fr))',
              },
              gap: 1.5,
            }}
          >
            {parts.map((part) => (
              <CatalogPartCard
                key={part.id}
                part={part}
                isUsed={usedPartIds.has(part.id) || usedPartNames.has(part.name)}
                onClick={() => handlePartClick(part)}
              />
            ))}
          </Box>
        )}
      </Box>

      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1.5, pt: 1 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, p) => { setPage(p); fetchParts(p); }}
            size="small"
            siblingCount={1}
            color="standard"
          />
          <Typography variant="caption" color="text.secondary" fontWeight="bold">
            {total} pieces
          </Typography>
        </Box>
      )}
    </Box>
  );
}
