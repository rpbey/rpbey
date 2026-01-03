'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  AppBar,
  Box,
  Button,
  Container,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Toolbar,
  Typography,
  useScrollTrigger,
} from '@mui/material'
import { Menu as MenuIcon, Close } from '@mui/icons-material'
import { useSession } from '@/lib/auth-client'

const navItems = [
  { label: 'Accueil', href: '/' },
  { label: 'TV', href: '/tv' },
  { label: 'Tournois', href: '/tournaments' },
  { label: 'À Propos', href: '/a-propos' },
  { label: 'Classements', href: '/rankings' },
  { label: 'Discord', href: 'https://discord.gg/twdVfesrRj', external: true },
]

export function MarketingHeader() {
  const { data: session } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)
  
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 50,
  })

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  return (
    <>
      <AppBar
        position="fixed"
        elevation={trigger ? 4 : 0}
        sx={{
          bgcolor: trigger ? 'background.paper' : 'transparent',
          borderBottom: trigger ? 1 : 0,
          borderColor: 'divider',
          transition: 'all 0.3s ease',
        }}
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ gap: 2 }}>
            {/* Logo */}
            <Typography
              variant="h5"
              component={Link}
              href="/"
              sx={{
                fontWeight: 800,
                color: 'primary.main',
                textDecoration: 'none',
                letterSpacing: '-0.02em',
              }}
            >
              RPB
            </Typography>

            {/* Desktop nav */}
            <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, gap: 1, ml: 4 }}>
              {navItems.map((item) => (
                <Button
                  key={item.href}
                  component={item.external ? 'a' : Link}
                  href={item.href}
                  target={item.external ? '_blank' : undefined}
                  rel={item.external ? 'noopener noreferrer' : undefined}
                  sx={{
                    color: 'text.primary',
                    fontWeight: 500,
                    '&:hover': {
                      color: 'primary.main',
                      bgcolor: 'transparent',
                    },
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Box>

            {/* Auth buttons */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
              {session?.user ? (
                <Button
                  component={Link}
                  href="/admin"
                  variant="contained"
                  sx={{ borderRadius: 2 }}
                >
                  Admin
                </Button>
              ) : (
                <>
                  <Button
                    component={Link}
                    href="/sign-in"
                    variant="outlined"
                    sx={{ borderRadius: 2 }}
                  >
                    Connexion
                  </Button>
                  <Button
                    component={Link}
                    href="/sign-up"
                    variant="contained"
                    sx={{ borderRadius: 2 }}
                  >
                    Inscription
                  </Button>
                </>
              )}
            </Box>

            {/* Mobile menu button */}
            <IconButton
              color="inherit"
              onClick={handleDrawerToggle}
              sx={{ display: { md: 'none' }, ml: 'auto' }}
            >
              <MenuIcon />
            </IconButton>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Mobile drawer */}
      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        sx={{
          display: { md: 'none' },
          '& .MuiDrawer-paper': {
            width: 280,
            bgcolor: 'background.paper',
          },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight="bold" color="primary.main">
            RPB
          </Typography>
          <IconButton onClick={handleDrawerToggle}>
            <Close />
          </IconButton>
        </Box>
        <List>
          {navItems.map((item) => (
            <ListItem key={item.href} disablePadding>
              <ListItemButton
                component={item.external ? 'a' : Link}
                href={item.href}
                target={item.external ? '_blank' : undefined}
                onClick={handleDrawerToggle}
              >
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Box sx={{ p: 2, mt: 'auto' }}>
          {session?.user ? (
            <Button
              component={Link}
              href="/admin"
              variant="contained"
              fullWidth
              sx={{ borderRadius: 2 }}
            >
              Admin
            </Button>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button
                component={Link}
                href="/sign-in"
                variant="outlined"
                fullWidth
                sx={{ borderRadius: 2 }}
              >
                Connexion
              </Button>
              <Button
                component={Link}
                href="/sign-up"
                variant="contained"
                fullWidth
                sx={{ borderRadius: 2 }}
              >
                Inscription
              </Button>
            </Box>
          )}
        </Box>
      </Drawer>

      {/* Toolbar spacer */}
      <Toolbar />
    </>
  )
}
