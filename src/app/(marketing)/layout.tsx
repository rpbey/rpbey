import type { Metadata } from 'next'
import Box from '@mui/material/Box'
import { IconNav, MobileNav, IconFooter, ICON_NAV_WIDTH } from '@/components/layout'

export const metadata: Metadata = {
  title: {
    default: 'RPB - République Populaire du Beyblade',
    template: '%s | RPB',
  },
  description: 'La communauté française de Beyblade. Tournois, streaming, classements et plus encore.',
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
