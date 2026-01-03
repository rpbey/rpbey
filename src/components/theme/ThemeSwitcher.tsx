'use client'

import { IconButton, Tooltip, alpha } from '@mui/material'
import { Palette, SportsEsports } from '@mui/icons-material'
import { useThemeMode } from './ThemeRegistry'

export function ThemeSwitcher() {
  const { mode, toggleTheme } = useThemeMode()

  return (
    <Tooltip title={mode === 'rpb' ? 'Mode Tournoi' : 'Mode RPB'} placement="right">
      <IconButton
        onClick={toggleTheme}
        sx={{
          width: 48,
          height: 48,
          color: mode === 'rpb' ? 'primary.main' : 'secondary.main',
          bgcolor: (theme) => alpha(theme.palette.background.paper, 0.5),
          '&:hover': {
            bgcolor: (theme) => alpha(theme.palette.action.active, 0.1),
          },
        }}
      >
        {mode === 'rpb' ? <Palette /> : <SportsEsports />}
      </IconButton>
    </Tooltip>
  )
}
