'use client';

import { CssBaseline, ThemeProvider } from '@mui/material';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import * as React from 'react';
import 'dayjs/locale/fr';
import { ToastProvider } from '@/components/ui';
import { darkTheme, tournamentTheme } from '@/lib/theme';

export type ThemeMode = 'dark' | 'tournament';

interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
  backgroundImage: string;
}

const ThemeContext = React.createContext<ThemeContextType | undefined>(
  undefined,
);

export function useThemeMode() {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeMode must be used within a ThemeRegistry');
  }
  return context;
}

export default function ThemeRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mode, setModeState] = React.useState<ThemeMode>('dark');
  // Load theme from localStorage on mount
  React.useEffect(() => {
    const savedMode = localStorage.getItem('rpb-theme-mode') as ThemeMode;
    if (savedMode && (savedMode === 'dark' || savedMode === 'tournament')) {
      setModeState(savedMode);
    }
  }, []);

  const setTheme = React.useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem('rpb-theme-mode', newMode);
  }, []);

  const toggleTheme = React.useCallback(() => {
    const newMode = mode === 'dark' ? 'tournament' : 'dark';
    setTheme(newMode);
  }, [mode, setTheme]);

  const backgroundImage = mode === 'tournament' ? '/blue.webp' : '/red.webp';

  const activeTheme = mode === 'tournament' ? tournamentTheme : darkTheme;

  // Apply theme colors to body + CSS variables for global reach
  React.useEffect(() => {
    const p = activeTheme.palette;
    const root = document.documentElement;
    document.body.style.backgroundColor = p.background.default;
    document.body.style.color = p.text.primary;
    document.body.style.transition =
      'background-color 0.3s ease, color 0.3s ease';
    // CSS custom properties so hardcoded colors can reference the theme
    root.style.setProperty('--rpb-primary', p.primary.main);
    root.style.setProperty('--rpb-secondary', p.secondary.main);
    root.style.setProperty('--rpb-bg', p.background.default);
    root.style.setProperty('--rpb-paper', p.background.paper);
    root.style.setProperty('--rpb-text', p.text.primary);
    root.style.setProperty('--rpb-text-secondary', p.text.secondary);
  }, [activeTheme]);

  const value = React.useMemo(
    () => ({
      mode,
      toggleTheme,
      setTheme,
      backgroundImage,
    }),
    [mode, toggleTheme, setTheme, backgroundImage],
  );

  return (
    <AppRouterCacheProvider>
      <ThemeContext.Provider value={value}>
        <ThemeProvider theme={activeTheme}>
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="fr">
            <ToastProvider>
              <CssBaseline />
              {children}
            </ToastProvider>
          </LocalizationProvider>
        </ThemeProvider>
      </ThemeContext.Provider>
    </AppRouterCacheProvider>
  );
}
