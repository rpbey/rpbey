'use client';

import { Dashboard, ViewList } from '@mui/icons-material';
import { Box, Tab, Tabs } from '@mui/material';
import { useBuilder } from './BuilderContext';

export function MobileTabSwitcher() {
  const { state, dispatch } = useBuilder();

  return (
    <Box
      sx={{
        display: { xs: 'block', md: 'none' },
        position: 'sticky',
        top: 0,
        zIndex: 10,
        bgcolor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Tabs
        value={state.mobileTab === 'catalog' ? 0 : 1}
        onChange={(_, v) => dispatch({ type: 'SET_MOBILE_TAB', tab: v === 0 ? 'catalog' : 'deck' })}
        variant="fullWidth"
        sx={{
          minHeight: 44,
          '& .MuiTab-root': { minHeight: 44, fontWeight: 'bold', fontSize: '0.85rem' },
        }}
      >
        <Tab icon={<ViewList sx={{ fontSize: 18 }} />} iconPosition="start" label="Catalogue" />
        <Tab icon={<Dashboard sx={{ fontSize: 18 }} />} iconPosition="start" label="Mon Deck" />
      </Tabs>
    </Box>
  );
}
