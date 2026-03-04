'use client';

import {
  Article,
  Dashboard,
  Hub,
  Launch,
  Leaderboard,
  Link as LinkIcon,
  Logout,
  Menu as MenuIcon,
  People,
  SmartToy,
  WorkspacePremium,
} from '@mui/icons-material';
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Chip, // Added
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSocket } from '@/components/providers/SocketProvider';
import { CacheBuster } from '@/components/system/CacheBuster';
import { useToast } from '@/components/ui';
import { TrophyIcon } from '@/components/ui/Icons';
import { PageTransition } from '@/components/ui/PageTransition';
import { RpbLogo } from '@/components/ui/RpbLogo';
import { signOut, useSession } from '@/lib/auth-client';

const RAIL_WIDTH = 280;

const ADMIN_NAV_ITEMS = [
  { label: "Vue d'ensemble", path: '/admin', icon: Dashboard },
  { label: 'Bot Discord', path: '/admin/bot', icon: SmartToy },
  { label: 'Maintenance', path: '/admin/maintenance', icon: Hub },
  { label: 'Liaison Comptes', path: '/admin/link', icon: LinkIcon },
  { label: 'Meta', path: '/admin/meta', icon: Hub },
  { label: 'Contenu', path: '/admin/content', icon: Article },
  { label: 'Gestion SATR', path: '/admin/satr', icon: WorkspacePremium },
  { label: 'Tournois', path: '/admin/tournaments', icon: TrophyIcon },
  { label: 'Classements', path: '/admin/rankings', icon: Leaderboard },
  { label: 'Équipe', path: '/admin/staff', icon: People },
  { label: 'Utilisateurs', path: '/admin/users', icon: People },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [ping, setPing] = useState<number | null>(null);
  const { socket } = useSocket();
  const { showToast } = useToast();

  // Global Admin Notifications & Ping
  useEffect(() => {
    if (!socket) return;

    const handleStatus = (status: { ping: number }) => {
      setPing(status.ping);
    };

    socket.on('status_update', handleStatus);

    return () => {
      socket.off('status_update', handleStatus);
    };
  }, [socket]);
  useEffect(() => {
    if (!socket) return;

    const handleSystemMessage = (msg: { type: string; message: string }) => {
      if (msg.type === 'error') {
        showToast(msg.message, 'error');
      } else {
        showToast(msg.message, 'info');
      }
    };

    const handleLog = (log: { level: string; message: string }) => {
      // Alert admins on critical errors instantly
      if (log.level === 'ERROR') {
        showToast(`Bot Error: ${log.message}`, 'error');
      }
    };

    socket.on('system_message', handleSystemMessage);
    socket.on('log_new', handleLog);

    return () => {
      socket.off('system_message', handleSystemMessage);
      socket.off('log_new', handleLog);
    };
  }, [socket, showToast]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const drawerContent = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        color: 'text.primary',
      }}
    >
      {/* Header Sidebar */}
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            textDecoration: 'none',
            color: 'inherit',
          }}
        >
          <RpbLogo size={32} animated />
          <Box>
            <Typography variant="h6" fontWeight="800" letterSpacing="-0.02em">
              RPB Admin
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.7 }}>
              v1.0.0
            </Typography>
          </Box>
        </Link>
      </Box>

      {/* User Info */}
      {session?.user && (
        <Box sx={{ px: 3, pb: 2 }}>
          <Box
            sx={{
              p: 2,
              borderRadius: 3,
              bgcolor: 'rgba(255,255,255,0.05)',
              border: '1px solid',
              borderColor: 'rgba(255,255,255,0.1)',
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
                sx={{ opacity: 0.7 }}
                noWrap
                display="block"
              >
                Super Admin
              </Typography>
            </Box>
          </Box>
        </Box>
      )}

      {/* Navigation */}
      <Box sx={{ flex: 1, overflowY: 'auto', py: 2 }}>
        <List disablePadding>
          {ADMIN_NAV_ITEMS.map((item) => {
            const isActive =
              item.path === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(item.path);

            const Icon = item.icon;

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
                    minHeight: 48,
                    borderRadius: '12px',
                    gap: 1.5,
                    color: isActive ? '#fbbf24' : 'rgba(255,255,255,0.7)', // RPB Gold for active
                    bgcolor: isActive
                      ? 'rgba(251, 191, 36, 0.1)'
                      : 'transparent',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.05)',
                      color: 'white',
                    },
                    '&.Mui-selected': {
                      bgcolor: 'rgba(251, 191, 36, 0.15)',
                      '&:hover': {
                        bgcolor: 'rgba(251, 191, 36, 0.2)',
                      },
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 'auto',
                      color: 'inherit',
                    }}
                  >
                    <Icon sx={{ fontSize: 20 }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontSize: '0.9rem',
                      fontWeight: isActive ? 700 : 500,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      {/* Logout */}
      <Box
        sx={{
          p: 2,
          borderTop: '1px solid',
          borderColor: 'rgba(255,255,255,0.1)',
        }}
      >
        <ListItemButton
          onClick={handleSignOut}
          sx={{
            borderRadius: 2,
            color: '#ef4444', // Red-500
            py: 1.5,
            px: 2,
            '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.1)' },
          }}
        >
          <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
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
        color: 'text.primary',
      }}
    >
      <CacheBuster />

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
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: RAIL_WIDTH,
              bgcolor: 'background.paper',
              borderRight: '1px solid',
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
        onClose={() => setMobileOpen(false)}
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

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 0, // Reset padding here, handled inside
          width: { md: `calc(100% - ${RAIL_WIDTH}px)` },
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            bgcolor: 'background.paper',
            borderBottom: '1px solid',
            borderColor: 'divider',
            color: 'text.primary',
          }}
        >
          <Toolbar sx={{ px: { xs: 2, md: 3 } }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={() => setMobileOpen(!mobileOpen)}
              sx={{ mr: 2, display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>

            <Typography
              variant="h6"
              fontWeight="800"
              color="text.primary"
              sx={{
                flexGrow: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              Administration
              {ping !== null && (
                <Chip
                  label={`${Math.round(ping)}ms`}
                  size="small"
                  color={
                    ping < 100 ? 'success' : ping < 300 ? 'warning' : 'error'
                  }
                  variant="outlined"
                  sx={{
                    height: 20,
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    borderColor:
                      ping < 100
                        ? 'success.main'
                        : ping < 300
                          ? 'warning.main'
                          : 'error.main',
                    bgcolor:
                      ping < 100 ? 'rgba(34, 197, 94, 0.1)' : 'transparent',
                  }}
                />
              )}
            </Typography>

            <Stack direction="row" spacing={2} alignItems="center">
              <Button
                component={Link}
                href="/dashboard"
                variant="outlined"
                size="small"
                startIcon={<Launch fontSize="small" />}
                sx={{
                  fontWeight: 600,
                  borderRadius: 2,
                  textTransform: 'none',
                }}
              >
                Dashboard Public
              </Button>
            </Stack>
          </Toolbar>
        </AppBar>

        {/* Content */}
        <Box
          sx={{
            p: { xs: 2, md: 4 },
            width: '100%',
            maxWidth: 1600,
            mx: 'auto',
          }}
        >
          <PageTransition>{children}</PageTransition>
        </Box>
      </Box>
    </Box>
  );
}
