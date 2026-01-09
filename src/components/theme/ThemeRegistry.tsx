'use client';

import { CssBaseline, ThemeProvider } from '@mui/material';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import { useColorScheme } from '@mui/material/styles';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import * as React from 'react';
import 'dayjs/locale/fr';
import { ToastProvider } from '@/components/ui';
import { theme } from '@/lib/theme';

export type ThemeMode = 'dark' | 'tournament';

export function useThemeMode() {
  const { colorScheme, setColorScheme } = useColorScheme();

  const mode = (colorScheme as ThemeMode) || 'dark';

  const toggleTheme = React.useCallback(() => {
    setColorScheme(mode === 'dark' ? 'tournament' : 'dark');
  }, [mode, setColorScheme]);

  const setTheme = React.useCallback(
    (newMode: ThemeMode) => {
      setColorScheme(newMode);
    },
    [setColorScheme],
  );

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
      <ThemeProvider theme={theme} defaultMode="dark">
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
