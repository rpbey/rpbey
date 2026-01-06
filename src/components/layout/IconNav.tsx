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
  Newspaper,
  BarChart,
} from '@mui/icons-material'
import { useSession, signOut } from '@/lib/auth-client'
import { DiscordIcon, TrophyIcon } from '@/components/ui/Icons'
import { ThemeSwitcher } from '@/components/theme/ThemeSwitcher'
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
        top: 16,
        left: 16,
        zIndex: 1200,
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        gap: 1,
        p: 1,
        borderRadius: 4,
        bgcolor: (theme) => alpha(theme.palette.background.paper, 0.8),
        backdropFilter: 'blur(12px)',
        boxShadow: (theme) => theme.shadows[4],
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      {/* Logo */}
      <Tooltip title="RPB" placement="right">
        <Link href="/" style={{ display: 'block' }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'scale(1.1)',
              },
            }}
          >
            <Image
              src="/logo.png"
              alt="RPB Logo"
              width={48}
              height={48}
              style={{ objectFit: 'contain' }}
              priority
            />
          </Box>
        </Link>
      </Tooltip>

      <Box sx={{ my: 1, borderBottom: '1px solid', borderColor: 'divider' }} />

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
                width: 48,
                height: 48,
                color: isActive ? 'primary.main' : 'text.secondary',
                bgcolor: isActive ? (theme) => alpha(theme.palette.primary.main, 0.15) : 'transparent',
                '&:hover': {
                  color: 'primary.main',
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                },
              }}
            >
              <Icon />
            </IconButton>
          </Tooltip>
        )
      })}

      {/* Discord */}
      <Tooltip title="Discord" placement="right">
        <IconButton
          component="a"
          href="https://discord.gg/twdVfesrRj"
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            width: 48,
            height: 48,
            color: 'text.secondary',
            '&:hover': {
              color: '#5865F2',
              bgcolor: (theme) => alpha('#5865F2', 0.1),
            },
          }}
        >
          <DiscordIcon />
        </IconButton>
      </Tooltip>

      <ThemeSwitcher />

      <Box sx={{ my: 1, borderBottom: '1px solid', borderColor: 'divider' }} />

      {/* Auth Menu */}
      <Tooltip title="Compte" placement="right">
        <IconButton
          onClick={handleMenuOpen}
          sx={{
            width: 48,
            height: 48,
            color: session?.user ? 'primary.main' : 'text.secondary',
            bgcolor: session?.user ? (theme) => alpha(theme.palette.primary.main, 0.15) : 'transparent',
            '&:hover': {
              color: 'primary.main',
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
            },
          }}
        >
          <AccountCircle />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        onClick={handleMenuClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
            ml: 1,
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
          },
        }}
        transformOrigin={{ horizontal: 'left', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
      >
        {session?.user ? [
          <MenuItem key="profile" component={Link} href="/profile">
            <ListItemIcon>
              <AccountCircle fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Mon Profil" />
          </MenuItem>,
          <Divider key="divider-profile" />,
          (session.user.role === 'admin' || (session.user as any).role === 'superadmin') && (
            <MenuItem key="admin" component={Link} href="/admin">
              <ListItemIcon>
                <AdminPanelSettings fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Admin" />
            </MenuItem>
          ),
          (session.user.role === 'admin' || (session.user as any).role === 'superadmin') && (
            <Divider key="divider-admin" />
          ),
          <MenuItem key="logout" onClick={handleLogout}>
            <ListItemIcon>
              <Logout fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Déconnexion" />
          </MenuItem>
        ].filter(Boolean) : [
          <MenuItem key="login" component={Link} href="/sign-in">
            <ListItemIcon>
              <Login fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Se connecter" />
          </MenuItem>,
          <MenuItem key="register" component={Link} href="/sign-up">
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

// Mobile bottom navigation with modern look
export function MobileNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const trigger = useScrollTrigger()

  const isAdmin = session?.user?.role === 'admin' || (session?.user as any)?.role === 'superadmin'

  return (
    <Slide appear={false} direction="up" in={!trigger}>
      <Paper
        elevation={0}
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1200,
          display: { xs: 'block', md: 'none' },
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: (theme) => alpha(theme.palette.background.paper, 0.95),
          backdropFilter: 'blur(16px)',
          pb: 'env(safe-area-inset-bottom)',
          borderRadius: '20px 20px 0 0',
          boxShadow: '0 -8px 20px rgba(0,0,0,0.1)',
        }}
      >
        <BottomNavigation
          showLabels
          value={pathname === '/' ? '/' : `/${pathname.split('/')[1]}`}
          onChange={(_, newValue) => router.push(newValue)}
          sx={{ 
            height: 72,
            bgcolor: 'transparent',
            '& .MuiBottomNavigationAction-root': {
              minWidth: 0,
              padding: '12px 0',
              color: 'text.secondary',
              '&.Mui-selected': {
                color: 'primary.main',
                '& .MuiSvgIcon-root': {
                  transform: 'scale(1.2) translateY(-2px)',
                  transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                }
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
            label={isAdmin ? 'Admin' : (session?.user ? 'Profil' : 'Connexion')}
            value={isAdmin ? '/admin' : (session?.user ? '/profile' : '/sign-in')}
            icon={isAdmin ? <AdminPanelSettings /> : (session?.user ? <AccountCircle /> : <Login />)}
          />
        </BottomNavigation>
      </Paper>
    </Slide>
  )
}
