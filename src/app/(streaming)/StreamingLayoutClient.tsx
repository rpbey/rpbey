'use client'

import { ReactNode } from 'react'
import Box from '@mui/material/Box'
import { IconNav, MobileNav, IconFooter, ICON_NAV_WIDTH } from '@/components/layout'

interface StreamingLayoutClientProps {
  children: ReactNode
}

export function StreamingLayoutClient({ children }: StreamingLayoutClientProps) {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Desktop: Left icon navigation */}
      <IconNav />
      
      {/* Main content */}
      <Box
        component="main"
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          ml: { xs: 0, md: `${ICON_NAV_WIDTH + 16}px` },
          pb: { xs: '72px', md: 0 },
          minHeight: '100vh',
          bgcolor: 'background.default',
        }}
      >
        <Box sx={{ flex: 1 }}>
          {children}
        </Box>
        <IconFooter />
      </Box>
      
      {/* Mobile: Bottom navigation */}
      <MobileNav />
    </Box>
  )
}
