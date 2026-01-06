"use client";

import { createTheme, type ThemeOptions } from "@mui/material/styles";
import { fontFamily } from "./fonts";

// RPB Colors - Extracted from Image
const RPB_RED = "#E31C25"; // Rouge vif du logo RPB (Licorne/Texte)
const RPB_YELLOW = "#FFD700"; // Jaune/Or de la crinière
const TOURNAMENT_SKY = "#60A5FA"; // Bleu ciel du fond (Sky 400 approx)
const TOURNAMENT_WHITE = "#FFFFFF"; // Blanc du texte

// M3 Surface tones (dark theme with warm tint)
const surfaceContainerLowest = "#0F0F0F";
const surfaceContainerLow = "#1D1B1B";
const surfaceContainer = "#211F1F";
const surfaceContainerHigh = "#2B2929";
const surfaceContainerHighest = "#363434";

const commonOptions: ThemeOptions = {
  typography: {
    fontFamily,
    // M3 Expressive Type Scale
    h1: {
      fontSize: "4rem",
      fontWeight: 800,
      lineHeight: 1.1,
      letterSpacing: "-0.03em",
      fontVariationSettings: '"wght" 800, "opsz" 48, "wdth" 100',
    },
    h2: {
      fontSize: "3.25rem",
      fontWeight: 700,
      lineHeight: 1.15,
      letterSpacing: "-0.02em",
      fontVariationSettings: '"wght" 700, "opsz" 40, "wdth" 100',
    },
    h3: {
      fontSize: "2.5rem",
      fontWeight: 600,
      lineHeight: 1.2,
      fontVariationSettings: '"wght" 600, "opsz" 32',
    },
    h4: {
      fontSize: "2rem",
      fontWeight: 600,
      lineHeight: 1.25,
      fontVariationSettings: '"wght" 600, "opsz" 28',
    },
    h5: {
      fontSize: "1.5rem",
      fontWeight: 500,
      lineHeight: 1.3,
      fontVariationSettings: '"wght" 500, "opsz" 24',
    },
    h6: {
      fontSize: "1.25rem",
      fontWeight: 500,
      lineHeight: 1.4,
      fontVariationSettings: '"wght" 500, "opsz" 20',
    },
    subtitle1: {
      fontSize: "1rem",
      fontWeight: 500,
      lineHeight: 1.5,
      fontVariationSettings: '"wght" 500, "opsz" 16',
    },
    subtitle2: {
      fontSize: "0.875rem",
      fontWeight: 500,
      lineHeight: 1.5,
      fontVariationSettings: '"wght" 500, "opsz" 14',
    },
    body1: {
      fontSize: "1rem",
      fontWeight: 400,
      lineHeight: 1.6,
      fontVariationSettings: '"wght" 400, "opsz" 14',
    },
    body2: {
      fontSize: "0.875rem",
      fontWeight: 400,
      lineHeight: 1.6,
      fontVariationSettings: '"wght" 400, "opsz" 12',
    },
    button: {
      fontSize: "0.875rem",
      fontWeight: 600,
      lineHeight: 1.5,
      letterSpacing: "0.04em",
      textTransform: "none",
      fontVariationSettings: '"wght" 600, "opsz" 14',
    },
    caption: {
      fontSize: "0.75rem",
      fontWeight: 400,
      lineHeight: 1.5,
      fontVariationSettings: '"wght" 400, "opsz" 12',
    },
    overline: {
      fontSize: "0.75rem",
      fontWeight: 600,
      lineHeight: 1.5,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      fontVariationSettings: '"wght" 600, "opsz" 12',
    },
  },
  shape: {
    borderRadius: 16, // Default for M3 Medium rounded
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 24, // M3 Pill shape for buttons
          padding: "10px 24px",
          fontWeight: 600,
        },
        contained: {
          boxShadow: "none",
          "&:hover": {
            boxShadow: "0px 1px 3px rgba(0,0,0,0.2)",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 28, // M3 Extra Large rounding
          backgroundImage: "none",
          backgroundColor: surfaceContainer,
          border: "1px solid rgba(255, 255, 255, 0.05)",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(15, 15, 15, 0.8)",
          backdropFilter: "blur(20px)",
          boxShadow: "none",
          borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
        },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          backgroundColor: surfaceContainer,
          height: 80,
          borderRadius: "24px 24px 0 0",
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: "filled",
      },
    },
  },
};

export const rpbTheme = createTheme({
  ...commonOptions,
  palette: {
    mode: "dark",
    primary: {
      main: RPB_RED,
      container: "#8C0009", // M3 Primary Container
      onContainer: "#FFDAD9", // M3 On Primary Container
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: RPB_YELLOW,
      container: "#534600",
      onContainer: "#FFE135",
      contrastText: "#000000",
    },
    background: {
      default: surfaceContainerLowest,
      paper: surfaceContainer,
    },
    surface: {
      lowest: surfaceContainerLowest,
      low: surfaceContainerLow,
      main: surfaceContainer,
      high: surfaceContainerHigh,
      highest: surfaceContainerHighest,
    },
    text: {
      primary: "#F5F2F2",
      secondary: "#D1C4C4",
    },
    divider: "rgba(255, 255, 255, 0.08)",
  },
} as any); // Type cast for M3 custom palette extensions

export const tournamentTheme = createTheme({
  ...commonOptions,
  palette: {
    mode: "dark",
    primary: {
      main: TOURNAMENT_SKY,
      light: "#93c5fd",
      dark: "#2563eb",
      contrastText: "#000000",
    },
    secondary: {
      main: TOURNAMENT_WHITE,
      light: "#ffffff",
      dark: "#cccccc",
      contrastText: "#000000",
    },
    background: {
      default: "#0f172a", // Slate 900 for tournament feel
      paper: "#1e293b", // Slate 800
    },
    text: {
      primary: TOURNAMENT_WHITE,
      secondary: "#94a3b8", // Slate 400
    },
    divider: "rgba(255, 255, 255, 0.1)",
  },
});

export type ThemeMode = 'rpb' | 'tournament';

export const getTheme = (mode: ThemeMode) => {
  return mode === 'tournament' ? tournamentTheme : rpbTheme;
};

export default rpbTheme;
