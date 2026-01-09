'use client';

import { CssBaseline, ThemeProvider } from '@mui/material';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import * as React from 'react';
import 'dayjs/locale/fr';
import { ToastProvider } from '@/components/ui';
import { theme } from '@/lib/theme';

export type ThemeMode = 'dark' | 'tournament';

export function useThemeMode() {
  // Temporary mock since cssVariables are disabled to fix build crash
  const mode = 'dark' as ThemeMode;

  const toggleTheme = React.useCallback(() => {
    console.log('Theme toggling is temporarily disabled');
  }, []);

  const setTheme = React.useCallback((_newMode: ThemeMode) => {
    console.log('Theme setting is temporarily disabled');
  }, []);

  const backgroundImage = mode === 'tournament' ? '/blue.jpeg' : '/red.jpeg';

  return {
    mode,
    toggleTheme,
    setTheme,
    backgroundImage,
  };
}

export default function ThemeRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="fr">
          <ToastProvider>
            <CssBaseline />
            {children}
          </ToastProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
