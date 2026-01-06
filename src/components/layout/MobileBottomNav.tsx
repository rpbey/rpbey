'use client'

import * as React from 'react'
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Box,
  useScrollTrigger,
  Slide,
} from '@mui/material'
import {
  Home,
  EmojiEvents,
  Leaderboard,
  Person,
  Search,
} from '@mui/icons-material'
import { usePathname, useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth-client'

export function MobileBottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const trigger = useScrollTrigger()

  const [value, setValue] = React.useState(pathname)

  React.useEffect(() => {
    setValue(pathname)
  }, [pathname])

  // Don't show on desktop
  const isMobile = true // We handle visibility via SX

  return (
    <Box sx={{ display: { xs: 'block', md: 'none' } }}>
      <Slide appear={false} direction="up" in={!trigger}>
        <Paper
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1100,
            pb: 'env(safe-area-inset-bottom)', // Support for notch phones
            borderTop: 1,
            borderColor: 'divider',
            borderRadius: '16px 16px 0 0',
            overflow: 'hidden',
            boxShadow: '0 -4px 16px rgba(0,0,0,0.08)',
          }}
          elevation={0}
        >
          <BottomNavigation
            showLabels
            value={value}
            onChange={(_, newValue) => {
              setValue(newValue)
              router.push(newValue)
            }}
            sx={{ height: 64 }}
          >
            <BottomNavigationAction
              label="Accueil"
              value="/"
              icon={<Home />}
            />
            <BottomNavigationAction
              label="Tournois"
              value="/tournaments"
              icon={<EmojiEvents />}
            />
             <BottomNavigationAction
              label="Classement"
              value="/rankings"
              icon={<Leaderboard />}
            />
            <BottomNavigationAction
              label={session ? 'Profil' : 'Connexion'}
              value={session ? '/dashboard' : '/sign-in'}
              icon={<Person />}
            />
          </BottomNavigation>
        </Paper>
      </Slide>
      {/* Spacer to prevent content from being hidden behind nav */}
      <Box sx={{ height: 80 }} />
    </Box>
  )
}
