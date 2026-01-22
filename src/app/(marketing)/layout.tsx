import Box from '@mui/material/Box';
import type { Metadata } from 'next';
import {
  ICON_NAV_WIDTH,
  IconFooter,
  IconNav,
  MobileNav,
} from '@/components/layout';
import { SponsorBanner } from '@/components/marketing';

export const metadata: Metadata = {
  title: {
    default: 'RPB - République Populaire du Beyblade',
    template: '%s | RPB',
  },
  description:
    'La communauté française de Beyblade. Tournois, classements et plus encore.',
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
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
          ml: { xs: 0, md: `${ICON_NAV_WIDTH}px` },
          pb: { xs: 'calc(100px + env(safe-area-inset-bottom))', md: 0 },
          minHeight: '100vh',
          bgcolor: 'background.default',
        }}
      >
        <SponsorBanner />
        <Box sx={{ flex: 1 }}>{children}</Box>
        <IconFooter />
      </Box>

      {/* Mobile: Bottom navigation */}
      <MobileNav />
    </Box>
  );
}
