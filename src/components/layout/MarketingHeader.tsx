'use client';

import { Close, Menu as MenuIcon } from '@mui/icons-material';
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
} from '@mui/material';
import { motion, useMotionValueEvent, useScroll } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useSession } from '@/lib/auth-client';
import { LOGO_VARIANTS } from '@/lib/role-colors';

const navItems: { label: string; href: string; external?: boolean }[] = [
  { label: 'Accueil', href: '/' },
  { label: 'TV', href: '/tv' },
  { label: 'Tournois', href: '/tournaments' },
  { label: 'À Propos', href: '/a-propos' },
  { label: 'Classements', href: '/rankings' },
];

export function MarketingHeader() {
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    if (latest > previous && latest > 150) {
      setHidden(true);
    } else {
      setHidden(false);
    }
    setScrolled(latest > 20);
  });

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <>
      <AppBar
        component={motion.header}
        variants={{
          visible: { y: 0 },
          hidden: { y: '-100%' },
        }}
        animate={hidden ? 'hidden' : 'visible'}
        transition={{ duration: 0.35, ease: 'easeInOut' }}
        position="fixed"
        elevation={0}
        sx={{
          bgcolor: scrolled ? 'rgba(255, 255, 255, 0.8)' : 'transparent',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
          borderBottom: 1,
          borderColor: scrolled ? 'divider' : 'transparent',
          color: scrolled ? 'text.primary' : 'text.primary', // Keep text readable
        }}
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ gap: 2 }}>
            {/* Logo */}
            <Box
              component={Link}
              href="/"
              sx={{
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Image
                src={LOGO_VARIANTS[0].src}
                alt="RPB Logo"
                width={48}
                height={48}
                style={{ objectFit: 'contain' }}
              />
            </Box>

            {/* Desktop nav */}
            <Box
              sx={{
                flexGrow: 1,
                display: { xs: 'none', md: 'flex' },
                gap: 1,
                ml: 4,
              }}
            >
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
        <Box
          sx={{
            p: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Image
            src={LOGO_VARIANTS[0].src}
            alt="RPB Logo"
            width={40}
            height={40}
            style={{ objectFit: 'contain' }}
          />
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
  );
}
