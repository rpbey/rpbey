'use client';

import { Box } from '@mui/material';
import { useState } from 'react';
import {
  ADMIN_DRAWER_WIDTH,
  AdminMobileHeader,
  AdminSidebar,
} from '@/components/layout/AdminSidebar';

export function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        bgcolor: 'background.default',
      }}
    >
      <AdminSidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 0,
          width: { md: `calc(100% - ${ADMIN_DRAWER_WIDTH}px)` },
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <AdminMobileHeader onMenuClick={handleDrawerToggle} />
        {children}
      </Box>
    </Box>
  );
}
