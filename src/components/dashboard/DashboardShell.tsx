'use client';

import {
  AdminPanelSettings,
  Inventory2,
  Leaderboard,
  Logout,
  Menu as MenuIcon,
  Person,
} from '@mui/icons-material';
import {
  AppBar,
  Avatar,
  Box,
  CircularProgress,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
  Zoom,
} from '@mui/material';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useThemeMode } from '@/components/theme/ThemeRegistry';
import { signOut, useSession } from '@/lib/auth-client';
import { RpbLogo } from '@/components/ui/RpbLogo';

const DRAWER_WIDTH = 280;
const RAIL_WIDTH = 80;

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Mon Profil',
    icon: <Person />,
    path: '/dashboard/profile',
  },
  {
    label: 'Mes Decks',
    icon: <Inventory2 />,
    path: '/dashboard/deck',
  },
  {
    label: 'Classement',
    icon: <Leaderboard />,
    path: '/dashboard/leaderboard',
  },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const { toggleTheme, mode } = useThemeMode();

  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);

  // Auth Guard
  useEffect(() => {
    if (!isPending && !session) {
      router.replace('/sign-in');
    }
  }, [session, isPending, router]);

  if (isPending) {
    return (
      <Box
        sx={{
          display: 'flex',
          height: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!session) {
    return null; // Will redirect
  }

  // Derive active tab from pathname
  // For BottomNav (Mobile)
  const activeNavIndex = NAV_ITEMS.findIndex((item) =>
    pathname.startsWith(item.path),
  );
  const bottomNavValue = activeNavIndex !== -1 ? activeNavIndex : 0;

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleSignOut = async () => {
    handleCloseUserMenu();
    await signOut();
    router.push('/');
  };

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        bgcolor: 'background.default',
      }}
    >
      {/* Desktop Navigation Rail / Drawer */}
      {!isMobile && (
        <Box
          component="nav"
          sx={{
            width: RAIL_WIDTH,
            flexShrink: 0,
            borderRight: '1px solid',
            borderColor: 'divider',
            bgcolor: 'surface.main',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            py: 3,
            position: 'fixed',
            height: '100vh',
            zIndex: 1200,
          }}
        >
          <Box sx={{ mb: 4 }}>
            <RpbLogo size={40} />
          </Box>

          <List
            sx={{
              width: '100%',
              px: 1,
              gap: 2,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {NAV_ITEMS.map((item) => {
              const isActive = pathname.startsWith(item.path);
              return (
                <ListItem key={item.path} disablePadding>
                  <Tooltip title={item.label} placement="right" arrow>
                    <ListItemButton
                      component={Link}
                      href={item.path}
                      sx={{
                        justifyContent: 'center',
                        borderRadius: 4,
                        py: 1.5,
                        minHeight: 56,
                        flexDirection: 'column',
                        gap: 0.5,
                        bgcolor: isActive
                          ? 'secondary.container'
                          : 'transparent',
                        color: isActive
                          ? 'secondary.onContainer'
                          : 'text.secondary',
                        '&:hover': {
                          bgcolor: isActive
                            ? 'secondary.container'
                            : 'action.hover',
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 0,
                          color: 'inherit',
                          '& .MuiSvgIcon-root': { fontSize: 24 },
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: isActive ? 700 : 500,
                          fontSize: '0.7rem',
                          textAlign: 'center',
                          lineHeight: 1,
                        }}
                      >
                        {item.label}
                      </Typography>
                    </ListItemButton>
                  </Tooltip>
                </ListItem>
              );
            })}
          </List>

          <Box
            sx={{
              mt: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              alignItems: 'center',
            }}
          >
            {/* User Avatar / Menu */}
            <Tooltip title="Paramètres">
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                <Avatar
                  alt={session?.user?.name || 'User'}
                  src={session?.user?.image || undefined}
                  sx={{ width: 40, height: 40 }}
                />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      )}

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          ml: { md: `${RAIL_WIDTH}px` },
          width: { md: `calc(100% - ${RAIL_WIDTH}px)` },
          display: 'flex',
          flexDirection: 'column',
          pb: { xs: '80px', md: 0 }, // Space for BottomNav on mobile
        }}
      >
        {/* Mobile Top Bar */}
        {isMobile && (
          <AppBar
            position="sticky"
            color="transparent"
            elevation={0}
            sx={{
              bgcolor: 'rgba(15, 15, 15, 0.8)',
              backdropFilter: 'blur(10px)',
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Toolbar>
              <RpbLogo size={32} />
              <Typography
                variant="h6"
                component="div"
                sx={{ flexGrow: 1, ml: 2, fontWeight: 700 }}
              >
                RPB Dashboard
              </Typography>
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                <Avatar
                  alt={session?.user?.name || 'User'}
                  src={session?.user?.image || undefined}
                  sx={{ width: 32, height: 32 }}
                />
              </IconButton>
            </Toolbar>
          </AppBar>
        )}

        {/* Page Content */}
        <Box
          sx={{
            p: { xs: 2, md: 4 },
            maxWidth: 1200,
            mx: 'auto',
            width: '100%',
          }}
        >
          {children}
        </Box>
      </Box>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1100,
            pb: 'env(safe-area-inset-bottom)',
            bgcolor: 'surface.main',
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          <BottomNavigation
            showLabels
            value={bottomNavValue}
            onChange={(_, newValue) => {
              router.push(NAV_ITEMS[newValue].path);
            }}
            sx={{
              height: 64, // MD3 specs usually 80, but 64 is often better for space
              bgcolor: 'transparent',
            }}
          >
            {NAV_ITEMS.map((item) => (
              <BottomNavigationAction
                key={item.path}
                label={item.label}
                icon={item.icon}
                sx={{
                  color: 'text.secondary',
                  '&.Mui-selected': {
                    color: 'primary.main',
                  },
                }}
              />
            ))}
          </BottomNavigation>
        </Box>
      )}

      {/* User Menu */}
      <Menu
        sx={{ mt: '45px' }}
        id="menu-appbar"
        anchorEl={anchorElUser}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        keepMounted
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        open={Boolean(anchorElUser)}
        onClose={handleCloseUserMenu}
      >
        {session?.user?.role === 'admin' && (
          <MenuItem onClick={() => router.push('/admin')}>
            <ListItemIcon>
              <AdminPanelSettings fontSize="small" />
            </ListItemIcon>
            <Typography textAlign="center">Admin</Typography>
          </MenuItem>
        )}
        <MenuItem onClick={handleSignOut}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          <Typography textAlign="center">Déconnexion</Typography>
        </MenuItem>
      </Menu>
    </Box>
  );
}
