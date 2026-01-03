'use client'

import * as React from 'react'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import 'dayjs/locale/fr'
import { getTheme, type ThemeMode } from '@/lib/theme'

interface ThemeContextType {
  mode: ThemeMode
  toggleTheme: () => void
  setTheme: (mode: ThemeMode) => void
  backgroundImage: string
}

export const ThemeContext = React.createContext<ThemeContextType>({
  mode: 'rpb',
  toggleTheme: () => {},
  setTheme: () => {},
  backgroundImage: '/red.jpeg',
})

export const useThemeMode = () => React.useContext(ThemeContext)

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = React.useState<ThemeMode>('rpb')

  // Load saved theme from local storage on mount
  React.useEffect(() => {
    const savedMode = localStorage.getItem('themeMode') as ThemeMode
    if (savedMode && (savedMode === 'rpb' || savedMode === 'tournament')) {
      setMode(savedMode)
    }
  }, [])

  const toggleTheme = React.useCallback(() => {
    setMode((prev) => {
      const newMode = prev === 'rpb' ? 'tournament' : 'rpb'
      localStorage.setItem('themeMode', newMode)
      return newMode
    })
  }, [])

  const setTheme = React.useCallback((newMode: ThemeMode) => {
    setMode(newMode)
    localStorage.setItem('themeMode', newMode)
  }, [])

  const theme = React.useMemo(() => getTheme(mode), [mode])

  const backgroundImage = mode === 'tournament' ? '/blue.jpeg' : '/red.jpeg'

  const contextValue = React.useMemo(
    () => ({
      mode,
      toggleTheme,
      setTheme,
      backgroundImage,
    }),
    [mode, toggleTheme, setTheme, backgroundImage]
  )

  return (
    <AppRouterCacheProvider>
      <ThemeContext.Provider value={contextValue}>
        <ThemeProvider theme={theme}>
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="fr">
            <CssBaseline />
            {children}
          </LocalizationProvider>
        </ThemeProvider>
      </ThemeContext.Provider>
    </AppRouterCacheProvider>
  )
}
