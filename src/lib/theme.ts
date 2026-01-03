"use client";

import { createTheme, type ThemeOptions } from "@mui/material/styles";
import { fontFamily } from "./fonts";

// RPB Colors - Extracted from Image
const RPB_RED = "#E31C25"; // Rouge vif du logo RPB (Licorne/Texte)
const RPB_YELLOW = "#FFD700"; // Jaune/Or de la crinière
const TOURNAMENT_SKY = "#60A5FA"; // Bleu ciel du fond (Sky 400 approx)
const TOURNAMENT_WHITE = "#FFFFFF"; // Blanc du texte

// M3 Surface tones (dark theme with warm tint)
const surfaceContainerLowest = "#0a0a0a";
const surfaceContainerLow = "#141212";
const surfaceContainer = "#1a1717";
const surfaceContainerHigh = "#242020";
const surfaceContainerHighest = "#2e2a2a";

const commonOptions: ThemeOptions = {
  typography: {
    fontFamily,
    // M3 Expressive Type Scale
    h1: {
      fontSize: "3.5rem",
      fontWeight: 700,
      lineHeight: 1.12,
      letterSpacing: "-0.02em",
      fontVariationSettings: '"wght" 700, "ROND" 0',
    },
    h2: {
      fontSize: "2.75rem",
      fontWeight: 600,
      lineHeight: 1.16,
      letterSpacing: "-0.01em",
      fontVariationSettings: '"wght" 600',
    },
    h3: {
      fontSize: "2rem",
      fontWeight: 600,
      lineHeight: 1.2,
      fontVariationSettings: '"wght" 600',
    },
    h4: {
      fontSize: "1.5rem",
      fontWeight: 600,
      lineHeight: 1.25,
      fontVariationSettings: '"wght" 600',
    },
    h5: {
      fontSize: "1.25rem",
      fontWeight: 600,
      lineHeight: 1.3,
      fontVariationSettings: '"wght" 600',
    },
    h6: {
      fontSize: "1.125rem",
      fontWeight: 600,
      lineHeight: 1.4,
      fontVariationSettings: '"wght" 600',
    },
    subtitle1: {
      fontSize: "1rem",
      fontWeight: 500,
      lineHeight: 1.5,
      fontVariationSettings: '"wght" 500',
    },
    subtitle2: {
      fontSize: "0.875rem",
      fontWeight: 500,
      lineHeight: 1.5,
      fontVariationSettings: '"wght" 500',
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
      letterSpacing: "0.02em",
      fontVariationSettings: '"wght" 600',
    },
    caption: {
      fontSize: "0.75rem",
      fontWeight: 400,
      lineHeight: 1.5,
      fontVariationSettings: '"wght" 400, "opsz" 9',
    },
    overline: {
      fontSize: "0.75rem",
      fontWeight: 500,
      lineHeight: 1.5,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      fontVariationSettings: '"wght" 500',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
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
      light: "#ff5f52",
      dark: "#a60000",
      contrastText: "#ffffff",
    },
    secondary: {
      main: RPB_YELLOW,
      light: "#ffe57f",
      dark: "#c79a00",
      contrastText: "#000000",
    },
    background: {
      default: surfaceContainerLowest,
      paper: surfaceContainer,
    },
    text: {
      primary: "#ffffff",
      secondary: "#a3a3a3",
    },
    divider: "rgba(255, 255, 255, 0.08)",
  },
});

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
