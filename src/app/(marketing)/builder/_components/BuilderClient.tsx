'use client';

import { Box, Container } from '@mui/material';
import { BuilderProvider, useBuilder } from './BuilderContext';
import { BuilderHeader } from './BuilderHeader';
import { DeckComposition } from './DeckComposition';
import { MobileTabSwitcher } from './MobileTabSwitcher';
import { PartCatalog } from './PartCatalog';

function BuilderLayout() {
  const { state } = useBuilder();

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <BuilderHeader />

      <MobileTabSwitcher />

      {/* Desktop: 2-panel layout */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          gap: 3,
          mt: 3,
          alignItems: 'flex-start',
        }}
      >
        {/* Left: Catalog */}
        <Box sx={{ flex: 3, minWidth: 0 }}>
          <PartCatalog />
        </Box>

        {/* Right: Deck composition (sticky) */}
        <Box
          sx={{
            flex: 2,
            position: 'sticky',
            top: 16,
            maxHeight: 'calc(100vh - 32px)',
            overflowY: 'auto',
            '&::-webkit-scrollbar': { width: 4 },
            '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: 2 },
          }}
        >
          <DeckComposition />
        </Box>
      </Box>

      {/* Mobile: tabbed layout */}
      <Box sx={{ display: { xs: 'block', md: 'none' }, mt: 2, pb: 12 }}>
        {state.mobileTab === 'catalog' ? (
          <PartCatalog />
        ) : (
          <DeckComposition />
        )}
      </Box>
    </Container>
  );
}

export function BuilderClient() {
  return (
    <BuilderProvider>
      <BuilderLayout />
    </BuilderProvider>
  );
}
