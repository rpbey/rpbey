'use client'

import { useState, type ReactNode } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { usePathname } from 'next/navigation'
import { AdminSidebar, AdminMobileHeader, ADMIN_DRAWER_WIDTH } from '@/components/layout/AdminSidebar'

interface AdminLayoutClientProps {
  children: ReactNode
}

const getPageTitle = (pathname: string) => {
  if (pathname === '/admin') return 'Vue d\'ensemble'
  if (pathname.startsWith('/admin/discord')) return 'Bot Discord'
  if (pathname.startsWith('/admin/bot')) return 'Statut du Bot'
  if (pathname.startsWith('/admin/content')) return 'Contenu du Site'
  if (pathname.startsWith('/admin/tournaments')) return 'Tournois'
  if (pathname.startsWith('/admin/staff')) return 'Équipe'
  if (pathname.startsWith('/admin/users')) return 'Utilisateurs'
  if (pathname.startsWith('/admin/stats')) return 'Statistiques'
  if (pathname.startsWith('/admin/settings')) return 'Paramètres'
  return 'Admin'
}

export function AdminLayoutClient({ children }: AdminLayoutClientProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const title = getPageTitle(pathname)

  const handleMobileClose = () => {
    setMobileOpen(false)
  }

  const handleMobileToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AdminSidebar mobileOpen={mobileOpen} onMobileClose={handleMobileClose} />
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${ADMIN_DRAWER_WIDTH}px)` },
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <AdminMobileHeader onMenuClick={handleMobileToggle} />
        
        {/* Desktop Header */}
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 4,
            py: 3,
            position: 'sticky',
            top: 0,
            zIndex: 10,
            bgcolor: 'rgba(15, 15, 15, 0.8)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <Typography variant="h5" fontWeight="800" letterSpacing="-0.02em">
            {title}
          </Typography>
        </Box>

        <Box sx={{ flexGrow: 1, px: { xs: 2, md: 4 }, pb: 4 }}>
          {children}
        </Box>
      </Box>
    </Box>
  )
}
