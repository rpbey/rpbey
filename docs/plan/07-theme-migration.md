# Migration du systeme de theme

## Theme actuel (MUI)

### Fichiers
- `src/lib/theme.ts` (406 lignes) - Definition des themes
- `src/components/theme/ThemeRegistry.tsx` (135 lignes) - Provider + hook

### Structure
- 2 themes : `redTheme` (RPB) et `blueTheme` (tournois)
- Dark mode uniquement (pas de light mode)
- Palette custom avec 5 niveaux de surface
- CSS variables `--rpb-*` injectees via le ThemeRegistry
- Type augmentations TypeScript pour les palettes custom
- Stockage localStorage

### CSS Variables actuelles (MUI)
```css
--rpb-primary
--rpb-primary-rgb
--rpb-secondary
--rpb-secondary-rgb
--rpb-bg
--rpb-paper
--rpb-text
--rpb-text-secondary
--rpb-divider
--rpb-surface-lowest
--rpb-surface-low
--rpb-surface-main
--rpb-surface-high
--rpb-surface-highest
--rpb-primary-container
--rpb-primary-on-container
```

### Couleurs Red Theme (NOUVELLES COULEURS)
| Token             | Hex       | Usage                    |
| ----------------- | --------- | ------------------------ |
| rpb-red           | #ce0c07   | Primary, CTAs            |
| rpb-orange        | #e68002   | Secondary, highlights    |
| rpb-yellow        | #f7d301   | Tertiary, or, rewards    |
| background        | #141111   | Fond principal (pas de noir pur) |
| surface-lowest    | #1d1b1b   | Surface de base          |
| surface-low       | #252222   | Cards, panels            |
| surface           | #2d2929   | Cards elevees            |
| surface-high      | #383333   | Menus, popovers          |
| surface-highest   | #433d3d   | Tooltips, top layer      |
| text.primary      | #f5f0f0   | Texte principal          |
| text.secondary    | #a89999   | Texte secondaire         |

### Couleurs Blue Theme
| Token             | Hex       | Usage                    |
| ----------------- | --------- | ------------------------ |
| primary           | #60A5FA   | Boutons, liens, accents  |
| secondary         | #93c5fd   | Highlights               |
| background        | #0f1420   | Fond bleu sombre         |

> Voir `08-design-system.md` pour le design system complet avec MD3 Expressive, motion, shapes, et animations Beyblade.

## Theme cible (shadcn/ui + Tailwind)

### Fichiers
- `src/app/globals.css` - CSS variables
- `src/components/theme/ThemeProvider.tsx` - Provider + hook

### Structure CSS

```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

/* ── Tokens shadcn/ui mappees vers le theme ────────────────── */
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);

  /* Surface tokens custom RPB */
  --color-surface-lowest: var(--surface-lowest);
  --color-surface-low: var(--surface-low);
  --color-surface: var(--surface-main);
  --color-surface-high: var(--surface-high);
  --color-surface-highest: var(--surface-highest);

  /* Radius */
  --radius-sm: calc(var(--radius) * 0.6);
  --radius-md: calc(var(--radius) * 0.8);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) * 1.4);
}

/* ── Theme RPB Rouge (defaut) ──────────────────────────────── */
:root, .theme-red {
  --radius: 0.625rem;

  /* Core */
  --background: oklch(0.10 0.005 15);          /* #0f0f0f */
  --foreground: oklch(0.985 0 0);              /* #ffffff */

  /* Primary = RPB Red */
  --primary: oklch(0.577 0.245 27.325);        /* #dc2626 */
  --primary-foreground: oklch(0.985 0 0);

  /* Secondary = RPB Gold */
  --secondary: oklch(0.795 0.155 85);          /* #fbbf24 */
  --secondary-foreground: oklch(0.145 0 0);

  /* Cards / Surfaces */
  --card: oklch(0.16 0.005 15);                /* #1a1a1a */
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.16 0.005 15);
  --popover-foreground: oklch(0.985 0 0);

  /* Muted */
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.65 0 0);         /* #a0a0a0 */

  /* Accent */
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);

  /* Destructive */
  --destructive: oklch(0.577 0.245 27.325);

  /* Borders */
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.577 0.245 27.325);

  /* Surface palette (5 niveaux) */
  --surface-lowest: oklch(0.11 0.005 15);      /* #121215 */
  --surface-low: oklch(0.15 0.005 15);         /* #1a1a1f */
  --surface-main: oklch(0.19 0.005 15);        /* #222228 */
  --surface-high: oklch(0.23 0.005 15);        /* #2a2a32 */
  --surface-highest: oklch(0.27 0.005 15);     /* #333340 */

  /* Charts */
  --chart-1: oklch(0.577 0.245 27.325);        /* Red */
  --chart-2: oklch(0.795 0.155 85);            /* Gold */
  --chart-3: oklch(0.6 0.118 184.704);         /* Teal */
  --chart-4: oklch(0.828 0.189 84.429);        /* Yellow */
  --chart-5: oklch(0.769 0.188 70.08);         /* Orange */
}

/* ── Theme RPB Bleu (tournois) ─────────────────────────────── */
.theme-blue {
  /* Primary = Sky Blue */
  --primary: oklch(0.707 0.165 254.624);       /* #60A5FA */
  --primary-foreground: oklch(0.145 0 0);

  /* Secondary = Light Blue */
  --secondary: oklch(0.787 0.126 254);         /* #93c5fd */
  --secondary-foreground: oklch(0.145 0 0);

  /* Ring */
  --ring: oklch(0.707 0.165 254.624);

  /* Charts */
  --chart-1: oklch(0.707 0.165 254.624);       /* Blue */
  --chart-2: oklch(0.787 0.126 254);           /* Light Blue */
  --chart-3: oklch(0.6 0.118 184.704);         /* Teal */
  --chart-4: oklch(0.828 0.189 84.429);        /* Yellow */
  --chart-5: oklch(0.769 0.188 70.08);         /* Orange */
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

### Mapping ancien -> nouveau

| Ancien (`--rpb-*`)         | Nouveau (shadcn)            | Tailwind class        |
| -------------------------- | --------------------------- | --------------------- |
| `--rpb-primary`            | `--primary`                 | `text-primary`        |
| `--rpb-secondary`          | `--secondary`               | `text-secondary`      |
| `--rpb-bg`                 | `--background`              | `bg-background`       |
| `--rpb-paper`              | `--card`                    | `bg-card`             |
| `--rpb-text`               | `--foreground`              | `text-foreground`     |
| `--rpb-text-secondary`     | `--muted-foreground`        | `text-muted-foreground` |
| `--rpb-divider`            | `--border`                  | `border-border`       |
| `--rpb-surface-lowest`     | `--surface-lowest`          | `bg-surface-lowest`   |
| `--rpb-surface-low`        | `--surface-low`             | `bg-surface-low`      |
| `--rpb-surface-main`       | `--surface-main`            | `bg-surface`          |
| `--rpb-surface-high`       | `--surface-high`            | `bg-surface-high`     |
| `--rpb-surface-highest`    | `--surface-highest`         | `bg-surface-highest`  |

### ThemeProvider

```typescript
"use client"

import { createContext, useContext, useEffect, useState } from "react"

type ThemeMode = "red" | "blue"

interface ThemeContextType {
  mode: ThemeMode
  toggleTheme: () => void
  setTheme: (mode: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>("red")

  useEffect(() => {
    const saved = localStorage.getItem("rpb-theme") as ThemeMode | null
    if (saved === "red" || saved === "blue") setMode(saved)
  }, [])

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove("theme-red", "theme-blue")
    root.classList.add(`theme-${mode}`)
    localStorage.setItem("rpb-theme", mode)
  }, [mode])

  const toggleTheme = () => setMode(prev => prev === "red" ? "blue" : "red")

  return (
    <ThemeContext value={{ mode, toggleTheme, setTheme: setMode }}>
      {children}
    </ThemeContext>
  )
}

export function useThemeMode() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useThemeMode must be used within ThemeProvider")
  return ctx
}
```

### Migration des usages

1. Remplacer `var(--rpb-primary)` par `var(--primary)` dans tout le CSS custom
2. Remplacer `theme.palette.primary.main` par `text-primary` ou `var(--primary)`
3. Remplacer `theme.palette.surface.*` par `bg-surface-*`
4. Supprimer toutes les augmentations de type MUI dans `theme.ts`
5. Le hook `useThemeMode()` garde la meme API (mode, toggleTheme, setTheme)
