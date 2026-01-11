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

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined);

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
  const [mounted, setMounted] = React.useState(false);

  // Load theme from localStorage on mount
  React.useEffect(() => {
    const savedMode = localStorage.getItem('rpb-theme-mode') as ThemeMode;
    if (savedMode && (savedMode === 'dark' || savedMode === 'tournament')) {
      setModeState(savedMode);
    }
    setMounted(true);
  }, []);

  const setTheme = React.useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem('rpb-theme-mode', newMode);
  }, []);

  const toggleTheme = React.useCallback(() => {
    const newMode = mode === 'dark' ? 'tournament' : 'dark';
    setTheme(newMode);
  }, [mode, setTheme]);

  const backgroundImage = mode === 'tournament' ? '/blue.jpeg' : '/red.jpeg';

  const activeTheme = mode === 'tournament' ? tournamentTheme : darkTheme;

  const value = React.useMemo(
    () => ({
      mode,
      toggleTheme,
      setTheme,
      backgroundImage,
    }),
    [mode, toggleTheme, setTheme, backgroundImage]
  );

  // Prevent hydration mismatch by rendering a basic wrapper until mounted
  if (!mounted) {
    return (
      <AppRouterCacheProvider>
        <ThemeContext.Provider
          value={{
            mode: 'dark',
            toggleTheme: () => {},
            setTheme: () => {},
            backgroundImage: '/red.jpeg',
          }}
        >
          <ThemeProvider theme={darkTheme}>
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="fr">
              <ToastProvider>
                <CssBaseline />
                <Box sx={{ visibility: 'hidden' }}>{children}</Box>
              </ToastProvider>
            </LocalizationProvider>
          </ThemeProvider>
        </ThemeContext.Provider>
      </AppRouterCacheProvider>
    );
  }

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

// Internal helper for the loading state
function Box({ children, sx }: { children: React.ReactNode, sx?: any }) {
    return <div style={sx}>{children}</div>;
}