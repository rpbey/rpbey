'use client';

import MenuIcon from '@mui/icons-material/Menu';
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Container,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
} from '@mui/material';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { signOut, useSession } from '@/lib/auth-client';
import { LOGO_VARIANTS } from '@/lib/role-colors';

const pages = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Tournois', href: '/tournaments' },
  { label: 'Classements', href: '/rankings' },
];

export function Header() {
  const { data: session } = useSession();
  const [anchorElNav, setAnchorElNav] = useState<null | HTMLElement>(null);
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);

  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleSignOut = async () => {
    await signOut();
    handleCloseUserMenu();
  };

  return (
    <AppBar position="sticky" color="default" elevation={1}>
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          {/* Logo - Desktop */}
          <Box
            component={Link}
            href="/"
            sx={{
              mr: 2,
              display: { xs: 'none', md: 'flex' },
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
          </Box>

          {/* Mobile menu */}
          <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
            <IconButton
              size="large"
              onClick={handleOpenNavMenu}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
            <Menu
              anchorEl={anchorElNav}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              sx={{ display: { xs: 'block', md: 'none' } }}
            >
              {pages.map((page) => (
                <MenuItem
                  key={page.href}
                  component={Link}
                  href={page.href}
                  onClick={handleCloseNavMenu}
                >
                  {page.label}
                </MenuItem>
              ))}
            </Menu>
          </Box>

          {/* Logo - Mobile */}
          <Box
            component={Link}
            href="/"
            sx={{
              flexGrow: 1,
              display: { xs: 'flex', md: 'none' },
              alignItems: 'center',
            }}
          >
            <Image
              src={LOGO_VARIANTS[0].src}
              alt="RPB Logo"
              width={32}
              height={32}
              style={{ objectFit: 'contain' }}
            />
          </Box>

          {/* Desktop menu */}
          <Box
            sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, gap: 1 }}
          >
            {pages.map((page) => (
              <Button
                key={page.href}
                component={Link}
                href={page.href}
                sx={{ color: 'text.primary' }}
              >
                {page.label}
              </Button>
            ))}
          </Box>

          {/* User menu */}
          <Box sx={{ flexGrow: 0 }}>
            {session?.user ? (
              <>
                <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                  <Avatar
                    alt={session.user.name || 'User'}
                    src={session.user.image || undefined}
                  />
                </IconButton>
                <Menu
                  anchorEl={anchorElUser}
                  open={Boolean(anchorElUser)}
                  onClose={handleCloseUserMenu}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                >
                  <MenuItem
                    component={Link}
                    href="/profile"
                    onClick={handleCloseUserMenu}
                  >
                    Profil
                  </MenuItem>
                  <MenuItem onClick={handleSignOut}>Déconnexion</MenuItem>
                </Menu>
              </>
            ) : (
              <Button
                component={Link}
                href="/sign-in"
                variant="contained"
                color="primary"
              >
                Connexion
              </Button>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
