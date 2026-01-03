'use client'

import { useState, type ReactNode } from 'react'
import Box from '@mui/material/Box'
import { AdminSidebar, AdminMobileHeader, ADMIN_DRAWER_WIDTH } from '@/components/layout/AdminSidebar'

interface AdminLayoutClientProps {
  children: ReactNode
}

export function AdminLayoutClient({ children }: AdminLayoutClientProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleMobileClose = () => {
    setMobileOpen(false)
  }

  const handleMobileToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AdminSidebar mobileOpen={mobileOpen} onMobileClose={handleMobileClose} />
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${ADMIN_DRAWER_WIDTH}px)` },
          minHeight: '100vh',
          bgcolor: 'background.default',
        }}
      >
        <AdminMobileHeader onMenuClick={handleMobileToggle} />
        {children}
      </Box>
    </Box>
  )
}
