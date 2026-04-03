# Phase 0 : Setup Tailwind + shadcn/ui

## Objectif

Installer Tailwind CSS v4, initialiser shadcn/ui, et porter le systeme de theme dual (red/blue).

## Etapes

### 1. Installer Tailwind CSS v4

```bash
pnpm add -D tailwindcss @tailwindcss/postcss postcss autoprefixer
```

Creer `postcss.config.mjs` :
```js
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
```

Ajouter dans `src/app/globals.css` :
```css
@import "tailwindcss";
```

### 2. Initialiser shadcn/ui

```bash
npx shadcn@latest init -t next -b base
```

Options :
- Template : `next`
- Base : `base` (utilise Base UI comme primitives, plus proche de MUI)
- CSS variables : oui
- Base color : slate (dark mode)
- RSC : oui

Cela cree :
- `components.json` - Configuration shadcn
- `src/lib/utils.ts` - Utilitaire `cn()` avec `tailwind-merge`
- CSS variables dans `globals.css`

### 3. Installer les dependances shadcn

```bash
pnpm add class-variance-authority clsx tailwind-merge
pnpm add lucide-react
```

### 4. Mettre a jour `cn()` utility

Fichier actuel : `src/lib/utils.ts` utilise seulement `clsx`.

Nouveau :
```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### 5. Porter le theme dual (red/blue)

Le theme actuel est dans `src/lib/theme.ts` (406 lignes) avec :
- `redTheme` : primary #dc2626, secondary #fbbf24
- `blueTheme` : primary #60A5FA, secondary #93c5fd
- Surface palette custom (5 niveaux)
- CSS variables custom `--rpb-*`

Nouveau systeme en CSS variables Tailwind dans `globals.css` :

```css
/* Theme RPB Rouge (defaut) */
:root, .theme-red {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --primary: oklch(0.577 0.245 27.325);       /* #dc2626 */
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.795 0.155 85);          /* #fbbf24 */
  --secondary-foreground: oklch(0.145 0 0);
  --card: oklch(0.205 0 0);
  --card-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.577 0.245 27.325);
  --destructive: oklch(0.577 0.245 27.325);

  /* Surface palette (5 niveaux) */
  --surface-lowest: oklch(0.13 0.01 15);
  --surface-low: oklch(0.17 0.01 15);
  --surface-main: oklch(0.21 0.01 15);
  --surface-high: oklch(0.25 0.01 15);
  --surface-highest: oklch(0.30 0.01 15);

  /* Charts */
  --chart-1: oklch(0.577 0.245 27.325);
  --chart-2: oklch(0.795 0.155 85);
  --chart-3: oklch(0.6 0.118 184.704);
  --chart-4: oklch(0.828 0.189 84.429);
  --chart-5: oklch(0.769 0.188 70.08);
}

/* Theme RPB Bleu (tournois) */
.theme-blue {
  --primary: oklch(0.707 0.165 254.624);       /* #60A5FA */
  --primary-foreground: oklch(0.145 0 0);
  --secondary: oklch(0.787 0.126 254);          /* #93c5fd */
  --secondary-foreground: oklch(0.145 0 0);
  --ring: oklch(0.707 0.165 254.624);

  --chart-1: oklch(0.707 0.165 254.624);
  --chart-2: oklch(0.787 0.126 254);
  --chart-3: oklch(0.6 0.118 184.704);
  --chart-4: oklch(0.828 0.189 84.429);
  --chart-5: oklch(0.769 0.188 70.08);
}
```

### 6. Creer le ThemeProvider shadcn

Nouveau `src/components/theme/ThemeProvider.tsx` :

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
    const saved = localStorage.getItem("rpb-theme") as ThemeMode
    if (saved) setMode(saved)
  }, [])

  useEffect(() => {
    document.documentElement.classList.remove("theme-red", "theme-blue")
    document.documentElement.classList.add(`theme-${mode}`)
    localStorage.setItem("rpb-theme", mode)
  }, [mode])

  const toggleTheme = () => setMode(m => m === "red" ? "blue" : "red")

  return (
    <ThemeContext value={{ mode, toggleTheme, setTheme: setMode }}>
      {children}
    </ThemeContext>
  )
}

export const useThemeMode = () => {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useThemeMode must be used within ThemeProvider")
  return ctx
}
```

### 7. Coexistence MUI + Tailwind

Pendant la migration, les deux systemes coexistent :
- MUI ThemeRegistry reste en place
- Tailwind est disponible pour les nouveaux composants
- Les composants sont migres un par un
- Quand tous les composants MUI sont remplaces, on supprime ThemeRegistry

## Validation

- [ ] `pnpm build` passe sans erreurs
- [ ] Tailwind classes fonctionnent dans un composant test
- [ ] Theme toggle red/blue fonctionne
- [ ] Aucune regression visuelle sur les pages existantes
