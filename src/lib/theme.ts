"use client";

import { createTheme } from "@mui/material/styles";

// RPB Colors
const RPB_RED = "#dc2626";
const RPB_GOLD = "#fbbf24";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: RPB_RED,
      light: "#ef4444",
      dark: "#b91c1c",
    },
    secondary: {
      main: RPB_GOLD,
      light: "#fcd34d",
      dark: "#d97706",
    },
    background: {
      default: "#0a0a0a",
      paper: "#171717",
    },
    text: {
      primary: "#ffffff",
      secondary: "#a3a3a3",
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 600,
    },
    h3: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
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
});

export default theme;
