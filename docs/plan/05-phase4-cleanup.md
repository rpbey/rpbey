# Phase 4 : Cleanup et suppression MUI

## Objectif

Supprimer toutes les dependances MUI, Emotion, et les fichiers de configuration associes.

## Etapes

### 1. Verification pre-cleanup

```bash
# Verifier qu'aucun import MUI ne reste
grep -r "@mui" src/ bot/ --include="*.ts" --include="*.tsx" -l
grep -r "@emotion" src/ --include="*.ts" --include="*.tsx" -l
grep -r "react-hook-form-mui" src/ --include="*.ts" --include="*.tsx" -l
grep -r "mui-tiptap" src/ --include="*.ts" --include="*.tsx" -l
```

Si des fichiers sont trouves, les migrer d'abord.

### 2. Supprimer les packages MUI

```bash
pnpm remove \
  @mui/material \
  @mui/icons-material \
  @mui/x-charts \
  @mui/x-data-grid \
  @mui/x-date-pickers \
  @mui/material-nextjs \
  @emotion/react \
  @emotion/styled \
  @emotion/cache \
  @fontsource/roboto \
  react-hook-form-mui \
  mui-tiptap
```

### 3. Supprimer les fichiers MUI

- `src/lib/theme.ts` - Ancien systeme de theming (406 lignes)
- `src/components/theme/ThemeRegistry.tsx` - Ancien wrapper MUI

### 4. Nettoyer les fichiers de config

- Retirer les references MUI de `next.config.ts` (transpilePackages, etc.)
- Retirer Roboto font des imports
- Nettoyer `src/app/layout.tsx` (retirer AppRouterCacheProvider, CssBaseline)

### 5. Mettre a jour le layout racine

```tsx
// Avant (MUI)
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter'
import { CssBaseline } from '@mui/material'
import { ThemeRegistry } from '@/components/theme/ThemeRegistry'

<AppRouterCacheProvider>
  <ThemeRegistry>
    <CssBaseline />
    {children}
  </ThemeRegistry>
</AppRouterCacheProvider>

// Apres (shadcn)
import { ThemeProvider } from '@/components/theme/ThemeProvider'

<ThemeProvider>
  {children}
</ThemeProvider>
```

### 6. Nettoyer globals.css

- Retirer les anciens CSS variables `--rpb-*` (remplacees par le systeme shadcn)
- Retirer les styles MUI custom
- Garder uniquement les imports Tailwind et les CSS variables shadcn

### 7. Remplacer react-hook-form-mui

```bash
pnpm add @hookform/resolvers
```

Les champs de formulaire MUI sont remplaces par les composants shadcn :
- `TextFieldElement` -> `<Input>` avec `register()`
- `SelectElement` -> `<Select>` avec `Controller`
- `CheckboxElement` -> `<Checkbox>` avec `Controller`

### 8. Remplacer mui-tiptap

Le rich text editor utilise `mui-tiptap`. Alternatives :
- `@tiptap/react` directement avec des styles Tailwind
- Le composant TipTap existe deja, il suffit de retirer le wrapper MUI

### 9. Build final et verification

```bash
pnpm build
pnpm lint
pnpm check
```

### 10. Audit du bundle

```bash
# Comparer la taille du bundle avant/apres
pnpm build 2>&1 | grep "Size"
```

Gains attendus :
- Suppression de `@emotion/*` runtime (~15 KB gzip)
- Suppression de `@mui/material` (~32 KB gzip)
- Suppression de `@mui/icons-material` (~variable, depends on tree-shaking)
- Suppression de `@fontsource/roboto` (~60 KB)
- **Total estime : -100 KB+ gzip**

## Validation finale

- [ ] Zero imports `@mui/*` dans le projet
- [ ] Zero imports `@emotion/*` dans le projet
- [ ] `pnpm build` passe sans erreurs
- [ ] `pnpm lint` passe
- [ ] Toutes les pages fonctionnent
- [ ] Theme dual (red/blue) fonctionne
- [ ] Responsive fonctionne
- [ ] Charts, DataTable, DatePicker fonctionnent
- [ ] Formulaires fonctionnent
- [ ] Rich text editor fonctionne
- [ ] Bundle size reduit
