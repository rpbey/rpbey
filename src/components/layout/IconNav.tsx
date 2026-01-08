'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Box, IconButton, Tooltip, alpha, Menu, MenuItem, ListItemIcon, ListItemText, Divider } from '@mui/material'
import {
  Home,
  Login,
  PersonAdd,
  AdminPanelSettings,
  AccountCircle,
  Logout,
  People,
  BarChart,
  Settings,
} from '@mui/icons-material'
import { useSession, signOut } from '@/lib/auth-client'
import { TrophyIcon } from '@/components/ui/Icons'
import { ThemeSwitcher } from '@/components/theme/ThemeSwitcher'
import { motion } from 'framer-motion'
import { BottomNavigation, BottomNavigationAction, Paper, Slide, useScrollTrigger } from '@mui/material'
import { useRouter } from 'next/navigation'

// Width of the icon navigation sidebar (48px icon + 16px padding each side)
export const ICON_NAV_WIDTH = 80

const navItems = [
  { icon: Home, label: 'Accueil', href: '/' },
  { icon: TrophyIcon, label: 'Tournois', href: '/tournaments' },
  { icon: People, label: 'Notre Équipe', href: '/notre-equipe' },
]

export function IconNav() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = async () => {
    handleMenuClose()
    await signOut()
  }

  return (
    <Box
      component="nav"
      sx={{
        position: 'fixed',
        top: 'calc(16px + env(safe-area-inset-top))',
        left: 'calc(16px + env(safe-area-inset-left))',
        bottom: 'calc(16px + env(safe-area-inset-bottom))',
        zIndex: 1200,
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1.5,
        p: 1.5,
        borderRadius: 8, // 32px - Extra large M3
        bgcolor: (theme) => alpha(theme.palette.background.paper, 0.9),
        backdropFilter: 'blur(20px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        border: '1px solid',
        borderColor: 'divider',
        width: 80,
      }}
    >
      {/* Logo */}
      <Tooltip title="RPB" placement="right">
        <Link href="/" style={{ display: 'block', marginBottom: 12 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              '&:hover': {
                transform: 'scale(1.15) rotate(5deg)',
              },
            }}
          >
            <Image
              src="/logo.png"
              alt="RPB Logo"
              width={56}
              height={56}
              style={{ objectFit: 'contain' }}
              priority
            />
          </Box>
        </Link>
      </Tooltip>

      <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 1 }}>
        {/* Nav items */}
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname.startsWith(item.href))

          return (
            <Tooltip key={item.href} title={item.label} placement="right">
              <IconButton
                component={Link}
                href={item.href}
                sx={{
                  width: 56,
                  height: 48,
                  borderRadius: 24, // Pill shape
                  position: 'relative',
                  color: isActive ? 'primary.main' : 'text.secondary',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    color: 'primary.main',
                    bgcolor: 'rgba(255,255,255,0.05)',
                  },
                }}
              >
                {/* M3 Active Indicator */}
                {isActive && (
                  <Box
                    component={motion.div}
                    layoutId="desktop-nav-active"
                    sx={{
                      position: 'absolute',
                      top: 4,
                      left: 4,
                      right: 4,
                      bottom: 4,
                      bgcolor: (theme) => alpha(theme.palette.primary.main, 0.15),
                      borderRadius: 20,
                      zIndex: -1,
                    }}
                  />
                )}
                <Icon sx={{ fontSize: 26 }} />
              </IconButton>
            </Tooltip>
          )
        })}
      </Box>

      <Box sx={{ flexGrow: 1 }} />

      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, width: '100%' }}>
        <ThemeSwitcher />

        {/* Auth Menu */}
        <Tooltip title="Compte" placement="right">
          <IconButton
            onClick={handleMenuOpen}
            sx={{
              width: 56,
              height: 56,
              borderRadius: 28,
              color: session?.user ? 'primary.main' : 'text.secondary',
              bgcolor: session?.user ? (theme) => alpha(theme.palette.primary.main, 0.1) : 'transparent',
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.15),
              },
            }}
          >
            <AccountCircle sx={{ fontSize: 32 }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Menu remains same but with M3 Paper */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        onClick={handleMenuClose}
        PaperProps={{
          elevation: 0,
          sx: {
            borderRadius: 6, // 24px
            minWidth: 200,
            overflow: 'visible',
            mt: 1.5,
            ml: 2,
            bgcolor: 'surface.high',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            border: '1px solid',
            borderColor: 'divider',
          },
        }}
        transformOrigin={{ horizontal: 'left', vertical: 'bottom' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {session?.user ? [
          <MenuItem key="profile" component={Link} href={`/dashboard/profile/${session.user.id}`} sx={{ borderRadius: 1.5, m: 0.5 }}>
            <ListItemIcon>
              <AccountCircle fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Mon Profil" />
          </MenuItem>,
          <MenuItem key="settings" component={Link} href="/profile" sx={{ borderRadius: 1.5, m: 0.5 }}>
            <ListItemIcon>
              <Settings fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Paramètres" />
          </MenuItem>,
          <Divider key="divider-profile" sx={{ my: 0.5 }} />,
          (session.user.role === 'admin' || (session.user as { role: string }).role === 'superadmin') && (
            <MenuItem key="admin" component={Link} href="/admin" sx={{ borderRadius: 1.5, m: 0.5 }}>
              <ListItemIcon>
                <AdminPanelSettings fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Admin" />
            </MenuItem>
          ),
          (session.user.role === 'admin' || (session.user as { role: string }).role === 'superadmin') && (
            <Divider key="divider-admin" sx={{ my: 0.5 }} />
          ),
          <MenuItem key="logout" onClick={handleLogout} sx={{ borderRadius: 1.5, m: 0.5, color: 'error.main' }}>
            <ListItemIcon>
              <Logout fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText primary="Déconnexion" />
          </MenuItem>
        ].filter(Boolean) : [
          <MenuItem key="login" component={Link} href="/sign-in" sx={{ borderRadius: 1.5, m: 0.5 }}>
            <ListItemIcon>
              <Login fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Se connecter" />
          </MenuItem>,
          <MenuItem key="register" component={Link} href="/sign-up" sx={{ borderRadius: 1.5, m: 0.5 }}>
            <ListItemIcon>
              <PersonAdd fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="S'inscrire" />
          </MenuItem>
        ]}
      </Menu>
    </Box>
  )
}

// Mobile bottom navigation with M3 Expressive look
export function MobileNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const trigger = useScrollTrigger()

  const isAdmin = session?.user?.role === 'admin' || (session?.user as { role: string } | undefined)?.role === 'superadmin'
  const activeValue = pathname === '/' ? '/' : `/${pathname.split('/')[1]}`

  return (
    <Slide appear={false} direction="up" in={!trigger}>
      <Paper
        elevation={0}
        sx={{
          position: 'fixed',
          bottom: 'calc(16px + env(safe-area-inset-bottom))',
          left: 'calc(16px + env(safe-area-inset-left))',
          right: 'calc(16px + env(safe-area-inset-right))',
          zIndex: 1200,
          display: { xs: 'block', md: 'none' },
          borderRadius: 8, // Pill/Rounded container
          bgcolor: (theme) => alpha(theme.palette.background.paper, 0.85),
          backdropFilter: 'blur(24px)',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          overflow: 'hidden',
          transition: 'all 0.3s ease',
        }}
      >
        <BottomNavigation
          showLabels
          value={activeValue}
          onChange={(_, newValue) => router.push(newValue)}
          sx={{ 
            height: 80, // M3 Navigation Bar Height
            bgcolor: 'transparent',
            '& .MuiBottomNavigationAction-root': {
              minWidth: 0,
              color: 'text.secondary',
              position: 'relative',
              '&.Mui-selected': {
                color: 'primary.main',
                '& .MuiSvgIcon-root': {
                  zIndex: 2,
                },
                '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 64,
                    height: 32,
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.2),
                    borderRadius: 16,
                    zIndex: 1,
                }
              },
              '& .MuiBottomNavigationAction-label': {
                mt: 0.5,
                fontWeight: 600,
                fontSize: '0.75rem',
              }
            }
          }}
        >
          <BottomNavigationAction
            label="Home"
            value="/"
            icon={<Home />}
          />
          <BottomNavigationAction
            label="Tournois"
            value="/tournaments"
            icon={<TrophyIcon />}
          />
           <BottomNavigationAction
            label="Stats"
            value="/rankings"
            icon={<BarChart />}
          />
          <BottomNavigationAction
            label={isAdmin ? 'Admin' : (session?.user ? 'Profil' : 'Compte')}
            value={isAdmin ? '/admin' : (session?.user ? `/dashboard/profile/${session.user.id}` : '/sign-in')}
            icon={isAdmin ? <AdminPanelSettings /> : (session?.user ? <AccountCircle /> : <Login />)}
          />
        </BottomNavigation>
      </Paper>
    </Slide>
  )
}
