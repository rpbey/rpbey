'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Divider,
  Avatar,
  useMediaQuery,
  useTheme,
  Chip,
} from '@mui/material'
import {
  Menu as MenuIcon,
  Dashboard,
  SmartToy,
  People,
  Settings,
  BarChart,
  Logout,
  LiveTv,
} from '@mui/icons-material'
import { signOut, useSession } from '@/lib/auth-client'
import { TrophyIcon } from '@/components/ui/Icons'

const DRAWER_WIDTH = 260

const navItems = [
  { label: 'Vue d\'ensemble', href: '/admin', icon: Dashboard },
  { label: 'Bot Discord', href: '/admin/discord', icon: SmartToy },
  { label: 'Twitch', href: '/admin/twitch', icon: LiveTv },
  { label: 'Tournois', href: '/admin/tournaments', icon: TrophyIcon },
  { label: 'Utilisateurs', href: '/admin/users', icon: People },
  { label: 'Statistiques', href: '/admin/stats', icon: BarChart },
  { label: 'Paramètres', href: '/admin/settings', icon: Settings },
]

interface AdminSidebarProps {
  mobileOpen: boolean
  onMobileClose: () => void
}

export function AdminSidebar({ mobileOpen, onMobileClose }: AdminSidebarProps) {
  const pathname = usePathname()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const { data: session } = useSession()

  const handleSignOut = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = '/'
        },
      },
    })
  }

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ gap: 1, px: 2 }}>
        <Typography variant="h6" fontWeight="bold" color="primary.main">
          RPB Admin
        </Typography>
        <Chip label="v1.0" size="small" variant="outlined" />
      </Toolbar>
      <Divider />

      {/* User info */}
      {session?.user && (
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            src={session.user.image ?? undefined}
            alt={session.user.name ?? 'User'}
            sx={{ width: 40, height: 40 }}
          />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight="bold" noWrap>
              {session.user.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              Administrateur
            </Typography>
          </Box>
        </Box>
      )}
      <Divider />

      <List sx={{ flex: 1, px: 1 }}>
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || 
            (item.href !== '/admin' && pathname.startsWith(item.href))

          return (
            <ListItem key={item.href} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={Link}
                href={item.href}
                selected={isActive}
                onClick={isMobile ? onMobileClose : undefined}
                sx={{
                  borderRadius: 2,
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    '&:hover': {
                      bgcolor: 'primary.dark',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'inherit',
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Icon />
                </ListItemIcon>
                <ListItemText 
                  primary={item.label}
                  primaryTypographyProps={{ fontWeight: isActive ? 600 : 400 }}
                />
              </ListItemButton>
            </ListItem>
          )
        })}
      </List>

      <Divider />
      <List sx={{ px: 1, pb: 1 }}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={handleSignOut}
            sx={{
              borderRadius: 2,
              color: 'error.main',
              '&:hover': {
                bgcolor: 'error.dark',
                color: 'error.contrastText',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
              <Logout />
            </ListItemIcon>
            <ListItemText primary="Déconnexion" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  )

  return (
    <Box
      component="nav"
      sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
    >
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: DRAWER_WIDTH,
            bgcolor: 'background.paper',
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: DRAWER_WIDTH,
            bgcolor: 'background.paper',
            borderRight: 1,
            borderColor: 'divider',
          },
        }}
        open
      >
        {drawer}
      </Drawer>
    </Box>
  )
}

export function AdminMobileHeader({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <Box
      sx={{
        display: { xs: 'flex', md: 'none' },
        alignItems: 'center',
        gap: 1,
        p: 1,
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <IconButton onClick={onMenuClick}>
        <MenuIcon />
      </IconButton>
      <Typography variant="h6" fontWeight="bold" color="primary.main">
        RPB Admin
      </Typography>
    </Box>
  )
}

export const ADMIN_DRAWER_WIDTH = DRAWER_WIDTH
