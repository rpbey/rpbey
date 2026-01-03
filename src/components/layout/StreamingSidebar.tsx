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
  Collapse,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import {
  Menu as MenuIcon,
  Home,
  ExpandLess,
  ExpandMore,
  PlayCircle,
  Tv,
} from '@mui/icons-material'

const DRAWER_WIDTH = 280

const series = [
  {
    id: 'x',
    name: 'Beyblade X',
    years: '2023-présent',
    color: '#dc2626',
    seasons: [
      { id: 'season-1', name: 'Saison 1', episodes: 52 },
      { id: 'season-2', name: 'Saison 2', episodes: 26 },
    ],
  },
  {
    id: 'burst',
    name: 'Beyblade Burst',
    years: '2016-2023',
    color: '#3b82f6',
    seasons: [
      { id: 'burst', name: 'Burst', episodes: 51 },
      { id: 'evolution', name: 'Evolution', episodes: 51 },
      { id: 'turbo', name: 'Turbo', episodes: 52 },
      { id: 'rise', name: 'Rise', episodes: 52 },
      { id: 'surge', name: 'Surge', episodes: 52 },
      { id: 'quadstrike', name: 'QuadStrike', episodes: 26 },
    ],
  },
  {
    id: 'metal',
    name: 'Beyblade Metal',
    years: '2009-2012',
    color: '#a855f7',
    seasons: [
      { id: 'fusion', name: 'Metal Fusion', episodes: 51 },
      { id: 'masters', name: 'Metal Masters', episodes: 51 },
      { id: 'fury', name: 'Metal Fury', episodes: 39 },
      { id: 'zero-g', name: 'Zero-G', episodes: 38 },
    ],
  },
  {
    id: 'original',
    name: 'Beyblade Original',
    years: '2001-2003',
    color: '#22c55e',
    seasons: [
      { id: 'season-1', name: 'Saison 1', episodes: 51 },
      { id: 'v-force', name: 'V-Force', episodes: 51 },
      { id: 'g-revolution', name: 'G-Revolution', episodes: 52 },
    ],
  },
]

interface StreamingSidebarProps {
  mobileOpen: boolean
  onMobileClose: () => void
}

export function StreamingSidebar({ mobileOpen, onMobileClose }: StreamingSidebarProps) {
  const pathname = usePathname()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [expandedSeries, setExpandedSeries] = useState<string | null>('x')

  const handleSeriesClick = (seriesId: string) => {
    setExpandedSeries(expandedSeries === seriesId ? null : seriesId)
  }

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ gap: 1, px: 2 }}>
        <Tv sx={{ color: 'primary.main' }} />
        <Typography variant="h6" fontWeight="bold" color="primary.main">
          RPB TV
        </Typography>
      </Toolbar>
      <Divider />

      <List sx={{ flex: 1, overflow: 'auto' }}>
        <ListItem disablePadding>
          <ListItemButton
            component={Link}
            href="/tv"
            selected={pathname === '/tv'}
            onClick={isMobile ? onMobileClose : undefined}
          >
            <ListItemIcon>
              <Home />
            </ListItemIcon>
            <ListItemText primary="Accueil" />
          </ListItemButton>
        </ListItem>

        <Divider sx={{ my: 1 }} />

        <Typography
          variant="overline"
          sx={{ px: 2, py: 1, display: 'block', color: 'text.secondary' }}
        >
          Séries
        </Typography>

        {series.map((s) => (
          <Box key={s.id}>
            <ListItemButton onClick={() => handleSeriesClick(s.id)}>
              <ListItemIcon>
                <PlayCircle sx={{ color: s.color }} />
              </ListItemIcon>
              <ListItemText
                primary={s.name}
                secondary={s.years}
                primaryTypographyProps={{ fontWeight: 500 }}
                secondaryTypographyProps={{ variant: 'caption' }}
              />
              {expandedSeries === s.id ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>

            <Collapse in={expandedSeries === s.id} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {s.seasons.map((season) => (
                  <ListItemButton
                    key={season.id}
                    component={Link}
                    href={`/tv/${s.id}/${season.id}`}
                    selected={pathname === `/tv/${s.id}/${season.id}`}
                    onClick={isMobile ? onMobileClose : undefined}
                    sx={{ pl: 4 }}
                  >
                    <ListItemText
                      primary={season.name}
                      secondary={`${season.episodes} épisodes`}
                      primaryTypographyProps={{ variant: 'body2' }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItemButton>
                ))}
              </List>
            </Collapse>
          </Box>
        ))}
      </List>

      <Divider />
      <Box sx={{ p: 2 }}>
        <Typography variant="caption" color="text.secondary" textAlign="center" display="block">
          © RPB - République Populaire du Beyblade
        </Typography>
      </Box>
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

export function StreamingMobileHeader({ onMenuClick }: { onMenuClick: () => void }) {
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
      <Tv sx={{ color: 'primary.main' }} />
      <Typography variant="h6" fontWeight="bold" color="primary.main">
        RPB TV
      </Typography>
    </Box>
  )
}

export const STREAMING_DRAWER_WIDTH = DRAWER_WIDTH
