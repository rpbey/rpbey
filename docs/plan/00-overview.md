# Migration MUI -> shadcn/ui : Vue d'ensemble

## Decision

**shadcn/ui** est le choix retenu pour remplacer Material UI (MUI).

## Pourquoi pas Base UI seul ?

| Critere           | Base UI                          | shadcn/ui                              |
| ----------------- | -------------------------------- | -------------------------------------- |
| Composants        | 35 primitives headless           | 50+ composants complets                |
| Charts            | Non (besoin MUI X)               | Oui (Recharts integre)                 |
| DataGrid          | Non (besoin MUI X)               | Oui (TanStack Table)                   |
| DatePicker        | Non (besoin MUI X)               | Oui (react-day-picker)                 |
| Icons             | Non                              | Lucide (tree-shakeable)                |
| Theming           | Roll your own                    | CSS variables + Tailwind               |
| Bundle            | ~4 KB gzip (primitives)          | 0 KB runtime (code source copie)       |
| RSC               | Client Components only           | Partiel (display = RSC)                |
| Tailwind          | Compatible mais pas natif        | 100% natif                             |
| Communaute        | 8.6M dl/mois                     | 11M dl/mois, 110K GH stars            |
| Primitives        | Propre implementation            | Radix UI ou Base UI au choix           |

**Point cle** : Depuis janvier 2026, shadcn/ui supporte Base UI comme couche primitive.
On obtient donc le meilleur des deux mondes.

## Etat actuel du projet

| Metrique                       | Valeur   |
| ------------------------------ | -------- |
| Fichiers avec imports MUI      | 207      |
| Composants MUI utilises        | 60+      |
| Fichiers utilisant `sx` prop   | 198      |
| Icons MUI                      | 80+      |
| Packages MUI X                 | 3        |
| Tailwind CSS installe          | Non      |
| `@emotion/*` (runtime CSS-in-JS) | 3 pkgs |

## Packages MUI a supprimer

```
@mui/material           ^7.3.6
@mui/icons-material     ^7.3.6
@mui/x-charts           ^8.23.0
@mui/x-data-grid        ^8.26.0
@mui/x-date-pickers     ^8.23.0
@mui/material-nextjs    ^7.3.6
@emotion/react          ^11.14.0
@emotion/styled         ^11.14.1
@emotion/cache          ^11.14.0
@fontsource/roboto      ^5.2.9
react-hook-form-mui     ^8.2.0
mui-tiptap              ^1.29.0
```

## Packages a installer

```
tailwindcss             ^4.x
@tailwindcss/postcss
postcss
autoprefixer
class-variance-authority
clsx
tailwind-merge
lucide-react
@radix-ui/*             (via shadcn CLI)
@tanstack/react-table   (remplace DataGrid)
recharts                (remplace x-charts)
react-day-picker        (remplace x-date-pickers)
dayjs                   (deja installe)
```

## Phases de migration

| Phase | Scope                              | Fichiers | Effort |
| ----- | ---------------------------------- | -------- | ------ |
| 0     | Setup Tailwind + shadcn + theme    | ~5       | Faible |
| 1     | Composants simples (Button, Card..)| ~80      | Moyen  |
| 2     | Layouts (Box, Stack, Grid, sx)     | ~198     | Eleve  |
| 3     | MUI X (Charts, DataGrid, DatePicker)| ~15     | Eleve  |
| 4     | Cleanup & suppression MUI          | ~10      | Faible |

## Nouvelle direction design

**Style** : Material Design 3 Expressive — formes pill/arrondies, animations spring avec rebond, typographie bold.

**Univers** : Beyblade X — speed lines, glows, energie, impact.

**Couleurs** :
- Rouge : `#ce0c07` (primary)
- Orange : `#e68002` (secondary)
- Jaune : `#f7d301` (tertiary / or)
- Fond : `#1d1b1b` (gris fonce chaud, PAS de noir pur)

**Shapes** : Boutons pill (border-radius: 9999px), cards 16px, dialogs 28px, hero cards 48px.

**Motion** : Spring physics avec overshoot (cubic-bezier(0.42, 1.85, 0.21, 0.90)), stagger reveals, page transitions fluides.

> Voir `08-design-system.md` pour le design system complet.

## Risques

1. **Le `sx` prop est partout (198 fichiers)** - Chaque usage doit etre converti en classes Tailwind
2. **Le dual theme (red/blue)** - Le systeme de theming custom doit etre reconstruit en CSS variables Tailwind
3. **MUI X n'a pas d'equivalent drop-in** - TanStack Table et Recharts ont des APIs completement differentes
4. **`useTheme` / `useMediaQuery`** (40+ fichiers) - Doivent etre remplaces par des hooks custom ou des classes Tailwind responsive
5. **`react-hook-form-mui` et `mui-tiptap`** - Integrations tierces a remplacer
