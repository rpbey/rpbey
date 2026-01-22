'use client';

import {
  Article,
  BarChart,
  Cloud,
  Code,
  Dashboard,
  Inventory2,
  Leaderboard,
  Logout,
  Menu as MenuIcon,
  People,
  Person,
  Settings,
  SmartToy,
  Terminal,
} from '@mui/icons-material';
import {
  AppBar,
  Avatar,
  alpha,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { TrophyIcon } from '@/components/ui/Icons';
import { RpbLogo } from '@/components/ui/RpbLogo';
import { signOut, useSession } from '@/lib/auth-client';

const RAIL_WIDTH = 280; // Expanded to full drawer width for native feel

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  // User Links
  {
    label: 'Mon Profil',
    icon: Person,
    path: '/dashboard/profile',
  },
  {
    label: 'Mes Decks',
    icon: Inventory2,
    path: '/dashboard/deck',
  },
  {
    label: 'Classement',
    icon: Leaderboard,
    path: '/dashboard/leaderboard',
  },
  // Admin Links
  { label: "Vue d'ensemble", path: '/admin', icon: Dashboard, adminOnly: true },
  {
    label: 'Bot Discord',
    path: '/admin/discord',
    icon: SmartToy,
    adminOnly: true,
  },
  { label: 'Statut du Bot', path: '/admin/bot', icon: Code, adminOnly: true },
  {
    label: 'Logs du Bot',
    path: '/admin/bot/logs',
    icon: Terminal,
    adminOnly: true,
  },
  { label: 'Contenu', path: '/admin/content', icon: Article, adminOnly: true },
  { label: 'Drive', path: '/admin/drive', icon: Cloud, adminOnly: true },
  {
    label: 'Tournois',
    path: '/admin/tournaments',
    icon: TrophyIcon,
    adminOnly: true,
  },
  { label: 'Équipe', path: '/admin/staff', icon: People, adminOnly: true },
  {
    label: 'Utilisateurs',
    path: '/admin/users',
    icon: People,
    adminOnly: true,
  },
  {
    label: 'Statistiques',
    path: '/admin/stats',
    icon: BarChart,
    adminOnly: true,
  },
  {
    label: 'Paramètres',
    path: '/admin/settings',
    icon: Settings,
    adminOnly: true,
  },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);

  const isAdmin =
    session?.user?.role === 'admin' || session?.user?.role === 'superadmin';

  // Filter items based on role
  const visibleItems = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  // Split items for sidebar grouping
  const userItems = visibleItems.filter((item) => !item.adminOnly);
  const adminItems = visibleItems.filter((item) => item.adminOnly);

  const activeNavItem = visibleItems.find((item) =>
    item.path !== '/admin'
      ? pathname.startsWith(item.path)
      : pathname === '/admin',
  );
  const bottomNavValue = activeNavItem?.path || '';

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

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

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <RpbLogo size={32} />
        <Typography variant="h6" fontWeight="800" letterSpacing="-0.02em">
          RPB Dashboard
        </Typography>
      </Box>

      {session?.user && (
        <Box sx={{ px: 3, pb: 2 }}>
          <Box
            sx={{
              p: 2,
              borderRadius: 3,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Avatar
              alt={session.user.name || 'User'}
              src={session.user.image || undefined}
              sx={{ width: 40, height: 40, borderRadius: 2 }}
            />
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle2" fontWeight="bold" noWrap>
                {session.user.name}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                noWrap
                display="block"
              >
                {isAdmin ? 'Administrateur' : 'Blader'}
              </Typography>
            </Box>
          </Box>
        </Box>
      )}

      <Box sx={{ flex: 1, overflowY: 'auto', py: 2 }}>
        <List
          disablePadding
          subheader={
            <Typography
              variant="caption"
              fontWeight="bold"
              color="text.secondary"
              sx={{
                px: 3,
                mb: 1,
                display: 'block',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
            >
              Menu Principal
            </Typography>
          }
        >
          {userItems.map((item) => {
            const isActive = pathname.startsWith(item.path);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const Icon = item.icon as any;
            return (
              <ListItem key={item.path} disablePadding>
                <ListItemButton
                  component={Link}
                  href={item.path}
                  selected={isActive}
                  onClick={() => setMobileOpen(false)}
                  sx={{
                    mx: 1.5,
                    mb: 0.5,
                    px: 3,
                    py: 1.5,
                    minHeight: 56, // M3 Spec: 56dp height
                    borderRadius: '28px', // M3 Spec: Stadium shape (height/2)
                    gap: 1.5, // M3 Spec: 12dp gap between icon and text
                    bgcolor: isActive
                      ? alpha(theme.palette.primary.main, 0.12)
                      : 'transparent',
                    color: isActive ? 'primary.main' : 'text.primary',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                    },
                    '&.Mui-selected': {
                      bgcolor: alpha(theme.palette.primary.main, 0.12),
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.16),
                      },
                    },
                    transition:
                      'background-color 200ms cubic-bezier(0.2, 0, 0, 1), color 200ms cubic-bezier(0.2, 0, 0, 1)',
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 'auto',
                      color: isActive ? 'primary.main' : 'text.secondary',
                    }}
                  >
                    <Icon fontSize="24px" />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontSize: '0.9rem',
                      fontWeight: isActive ? 700 : 500,
                      letterSpacing: '0.01em',
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>

        {isAdmin && adminItems.length > 0 && (
          <>
            <Divider sx={{ my: 2, opacity: 0.5 }} />
            <List
              disablePadding
              subheader={
                <Typography
                  variant="caption"
                  fontWeight="bold"
                  color="text.secondary"
                  sx={{
                    px: 3,
                    mb: 1,
                    display: 'block',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                  }}
                >
                  Administration
                </Typography>
              }
            >
              {adminItems.map((item) => {
                const isActive =
                  item.path === '/admin'
                    ? pathname === '/admin'
                    : pathname.startsWith(item.path);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const Icon = item.icon as any;
                return (
                  <ListItem key={item.path} disablePadding>
                    <ListItemButton
                      component={Link}
                      href={item.path}
                      selected={isActive}
                      onClick={() => setMobileOpen(false)}
                      sx={{
                        mx: 1.5,
                        mb: 0.5,
                        px: 3,
                        py: 1.5,
                        minHeight: 56, // M3 Spec: 56dp
                        borderRadius: '28px', // M3 Spec: Stadium
                        gap: 1.5, // M3 Spec: 12dp gap
                        bgcolor: isActive
                          ? alpha(theme.palette.secondary.main, 0.12)
                          : 'transparent',
                        color: isActive ? 'secondary.main' : 'text.primary',
                        '&:hover': {
                          bgcolor: alpha(theme.palette.secondary.main, 0.08),
                        },
                        '&.Mui-selected': {
                          bgcolor: alpha(theme.palette.secondary.main, 0.12),
                          '&:hover': {
                            bgcolor: alpha(theme.palette.secondary.main, 0.16),
                          },
                        },
                        transition:
                          'background-color 200ms cubic-bezier(0.2, 0, 0, 1), color 200ms cubic-bezier(0.2, 0, 0, 1)',
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 'auto',
                          color: isActive ? 'secondary.main' : 'text.secondary',
                        }}
                      >
                        <Icon fontSize="24px" />
                      </ListItemIcon>
                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{
                          fontSize: '0.9rem',
                          fontWeight: isActive ? 700 : 500,
                          letterSpacing: '0.01em',
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </>
        )}
      </Box>

      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <ListItemButton
          onClick={handleSignOut}
          sx={{
            borderRadius: 2,
            color: 'error.main',
            py: 1.5,
            px: 2,
            '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.05) },
          }}
        >
          <ListItemIcon sx={{ minWidth: 40, color: 'error.main' }}>
            <Logout fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="Déconnexion"
            primaryTypographyProps={{ fontWeight: 600 }}
          />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        bgcolor: 'background.default',
      }}
    >
      {/* Desktop Sidebar */}
      <Box
        component="nav"
        sx={{
          width: { md: RAIL_WIDTH },
          flexShrink: { md: 0 },
          display: { xs: 'none', md: 'block' },
        }}
      >
        <Drawer
          variant="permanent"
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: RAIL_WIDTH,
              bgcolor: 'background.paper', // Changed to paper for distinction
              borderRight: '1px dashed', // Lighter, dashed border for modern look
              borderColor: 'divider',
            },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: RAIL_WIDTH,
            bgcolor: 'background.paper',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${RAIL_WIDTH}px)` },
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          pb: { xs: 'calc(80px + env(safe-area-inset-bottom))', md: 0 }, // Space for bottom nav
        }}
      >
        {/* Header App Bar */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            bgcolor: 'background.default', // M3: Matches surface color
            borderBottom: 'none', // M3: No border, separation via color/scrolling (or subtle tonal change if implemented)
            color: 'text.primary',
            // In a real M3 app, we might use useScrollTrigger to change color to 'surfaceContainer' on scroll.
            // For now, flat surface is cleaner.
          }}
        >
          <Toolbar>
            {/* Mobile Menu Button */}
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>

            {/* Mobile Logo */}
            <Box
              sx={{
                display: { xs: 'flex', md: 'none' },
                alignItems: 'center',
                gap: 1,
              }}
            >
              <RpbLogo size={24} />
              <Typography variant="h6" fontWeight="bold">
                RPB
              </Typography>
            </Box>

            {/* Desktop Page Title (Placeholder for now, could be dynamic) */}
            <Box
              sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}
            >
              <Typography variant="h6" fontWeight="700" color="text.primary">
                {/* We could map pathname to title here or use a context */}
                Dashboard
              </Typography>
            </Box>

            <Box sx={{ flexGrow: 1 }} />

            {/* User Actions (Desktop & Mobile) */}
            <Stack direction="row" spacing={1} alignItems="center">
              {/* Add notification bell here later? */}
              <IconButton onClick={handleOpenUserMenu}>
                <Avatar
                  src={session?.user?.image || undefined}
                  sx={{ width: 32, height: 32 }}
                />
              </IconButton>
            </Stack>
          </Toolbar>
        </AppBar>

        <Box
          sx={{
            p: { xs: 2, md: 4 },
            width: '100%',
          }}
        >
          {children}
        </Box>
      </Box>

      {/* Mobile Bottom Nav */}
      {isMobile && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1100,
            borderTop: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            pb: 'env(safe-area-inset-bottom)',
          }}
        >
          <BottomNavigation
            showLabels
            value={bottomNavValue}
            onChange={(_, newValue) => router.push(newValue)}
          >
            {userItems.slice(0, 3).map((item) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const Icon = item.icon as any;
              return (
                <BottomNavigationAction
                  key={item.path}
                  label={item.label}
                  value={item.path}
                  icon={<Icon />}
                />
              );
            })}
            {isAdmin && (
              <BottomNavigationAction
                label="Admin"
                value="/admin"
                icon={<Settings />}
              />
            )}
          </BottomNavigation>
        </Box>
      )}

      {/* User Menu */}
      <Menu
        sx={{ mt: '45px' }}
        id="menu-appbar"
        anchorEl={anchorElUser}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        keepMounted
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        open={Boolean(anchorElUser)}
        onClose={handleCloseUserMenu}
      >
        <MenuItem onClick={handleSignOut}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          <Typography>Déconnexion</Typography>
        </MenuItem>
      </Menu>
    </Box>
  );
}
