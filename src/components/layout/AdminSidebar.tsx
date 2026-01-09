'use client';

import {
  Article,
  BarChart,
  Cloud,
  Code,
  Dashboard,
  Logout,
  Menu as MenuIcon,
  People,
  Settings,
  SmartToy,
  Terminal,
} from '@mui/icons-material';
import {
  Avatar,
  alpha,
  Box,
  Chip,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TrophyIcon } from '@/components/ui/Icons';
import { signOut, useSession } from '@/lib/auth-client';

const DRAWER_WIDTH = 260;

const navItems = [
  { label: "Vue d'ensemble", href: '/admin', icon: Dashboard },
  { label: 'Bot Discord', href: '/admin/discord', icon: SmartToy },
  { label: 'Statut du Bot', href: '/admin/bot', icon: Code },
  { label: 'Logs du Bot', href: '/admin/bot/logs', icon: Terminal },
  { label: 'Contenu du Site', href: '/admin/content', icon: Article },
  { label: 'Google Drive', href: '/admin/drive', icon: Cloud },
  { label: 'Tournois', href: '/admin/tournaments', icon: TrophyIcon },
  { label: 'Équipe', href: '/admin/staff', icon: People },
  { label: 'Utilisateurs', href: '/admin/users', icon: People },
  { label: 'Statistiques', href: '/admin/stats', icon: BarChart },
  { label: 'Paramètres', href: '/admin/settings', icon: Settings },
];

interface AdminSidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function AdminSidebar({ mobileOpen, onMobileClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { data: session } = useSession();

  const handleSignOut = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = '/';
        },
      },
    });
  };

  const drawer = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        pb: 'env(safe-area-inset-bottom)',
        pl: 'env(safe-area-inset-left)',
      }}
    >
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
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== '/admin' && pathname.startsWith(item.href));

          return (
            <ListItem key={item.href} disablePadding sx={{ mb: 1, px: 2 }}>
              <ListItemButton
                component={Link}
                href={item.href}
                selected={isActive}
                onClick={isMobile ? onMobileClose : undefined}
                sx={{
                  borderRadius: 2, // Reduced from 32
                  height: 48, // Reduced height slightly
                  px: 2,
                  '&.Mui-selected': {
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                    color: 'primary.main',
                    '&:hover': {
                      bgcolor: (theme) =>
                        alpha(theme.palette.primary.main, 0.2),
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'primary.main',
                    },
                  },
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 44,
                    color: isActive ? 'primary.main' : 'text.secondary',
                  }}
                >
                  <Icon />
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '0.875rem',
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
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
  );

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
            width: DRAWER_WIDTH - 32, // Accommodate margin
            m: 2,
            height: 'calc(100% - 32px)',
            borderRadius: 3, // Reduced from 6 (24px) to 3 (12px)
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          },
        }}
        open
      >
        {drawer}
      </Drawer>
    </Box>
  );
}

export function AdminMobileHeader({
  onMenuClick,
}: {
  onMenuClick: () => void;
}) {
  return (
    <Box
      sx={{
        display: { xs: 'flex', md: 'none' },
        alignItems: 'center',
        gap: 1.5,
        p: 2,
        pt: 'calc(16px + env(safe-area-inset-top))',
        pl: 'calc(16px + env(safe-area-inset-left))',
        pr: 'calc(16px + env(safe-area-inset-right))',
        position: 'sticky',
        top: 0,
        zIndex: 1100,
        bgcolor: 'rgba(15, 15, 15, 0.8)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <IconButton
        onClick={onMenuClick}
        sx={{
          bgcolor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: 3,
        }}
      >
        <MenuIcon />
      </IconButton>
      <Typography
        variant="h6"
        fontWeight="800"
        color="primary.main"
        letterSpacing="-0.02em"
      >
        RPB Admin
      </Typography>
    </Box>
  );
}

export const ADMIN_DRAWER_WIDTH = DRAWER_WIDTH;
