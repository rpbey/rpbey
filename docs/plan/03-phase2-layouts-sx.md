# Phase 2 : Migration des layouts et du `sx` prop

## Objectif

Convertir les composants de layout MUI (Box, Stack, Grid, Paper, Container) et les 198 fichiers utilisant le `sx` prop en classes Tailwind.

## Composants de layout

### Box -> div + Tailwind

Le composant `Box` est le plus utilise (quasi tous les fichiers). C'est un simple wrapper `div`.

```tsx
// MUI
<Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 3 }}>

// Tailwind
<div className="flex items-center gap-4 p-6">
```

### Stack -> div + flex

```tsx
// MUI
<Stack direction="row" spacing={2} alignItems="center">

// Tailwind
<div className="flex flex-row gap-4 items-center">

// MUI vertical (default)
<Stack spacing={1}>

// Tailwind
<div className="flex flex-col gap-2">
```

### Grid -> CSS Grid ou Flex

```tsx
// MUI
<Grid container spacing={3}>
  <Grid item xs={12} md={6}>

// Tailwind
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  <div>
```

### Paper -> div avec bg

```tsx
// MUI
<Paper elevation={3} sx={{ p: 2 }}>

// Tailwind
<div className="rounded-lg bg-card p-4 shadow-md">
```

### Container -> div avec max-width

```tsx
// MUI
<Container maxWidth="lg">

// Tailwind
<div className="mx-auto max-w-screen-lg px-4">
```

### Divider -> hr ou separator

```tsx
// MUI
<Divider />

// shadcn
<Separator />

// ou simplement
<hr className="border-border" />
```

## Conversion du `sx` prop

### Mapping spacing MUI -> Tailwind

MUI utilise un facteur de 8px par defaut :

| MUI `sx`   | Valeur  | Tailwind      |
| ---------- | ------- | ------------- |
| `p: 1`     | 8px     | `p-2`         |
| `p: 2`     | 16px    | `p-4`         |
| `p: 3`     | 24px    | `p-6`         |
| `p: 4`     | 32px    | `p-8`         |
| `px: 2`    | 16px    | `px-4`        |
| `py: 1`    | 8px     | `py-2`        |
| `m: 2`     | 16px    | `m-4`         |
| `mt: 3`    | 24px    | `mt-6`        |
| `mb: 1`    | 8px     | `mb-2`        |
| `gap: 2`   | 16px    | `gap-4`       |

### Mapping display/flex

| MUI `sx`                        | Tailwind                    |
| ------------------------------- | --------------------------- |
| `display: 'flex'`              | `flex`                      |
| `display: 'grid'`             | `grid`                      |
| `display: 'none'`             | `hidden`                    |
| `flexDirection: 'column'`     | `flex-col`                  |
| `flexDirection: 'row'`        | `flex-row`                  |
| `alignItems: 'center'`        | `items-center`              |
| `justifyContent: 'center'`    | `justify-center`            |
| `justifyContent: 'space-between'` | `justify-between`       |
| `flexWrap: 'wrap'`            | `flex-wrap`                 |
| `flex: 1`                     | `flex-1`                    |
| `flexGrow: 1`                 | `grow`                      |
| `flexShrink: 0`               | `shrink-0`                  |

### Mapping dimensions

| MUI `sx`                | Tailwind              |
| ----------------------- | --------------------- |
| `width: '100%'`        | `w-full`              |
| `height: '100%'`       | `h-full`              |
| `minWidth: 0`          | `min-w-0`             |
| `maxWidth: 600`        | `max-w-[600px]`       |
| `width: 40`            | `w-10`                |
| `height: 40`           | `h-10`                |
| `borderRadius: 2`      | `rounded-lg`          |
| `overflow: 'hidden'`   | `overflow-hidden`     |
| `overflowY: 'auto'`   | `overflow-y-auto`     |

### Mapping responsive (breakpoints)

MUI :
```tsx
sx={{ p: { xs: 2, md: 3 } }}
sx={{ display: { xs: 'none', md: 'block' } }}
```

Tailwind :
```tsx
className="p-4 md:p-6"
className="hidden md:block"
```

### Mapping couleurs

| MUI `sx`                          | Tailwind                   |
| --------------------------------- | -------------------------- |
| `color: 'primary.main'`         | `text-primary`             |
| `color: 'text.secondary'`       | `text-muted-foreground`    |
| `bgcolor: 'background.paper'`   | `bg-card`                  |
| `bgcolor: 'primary.main'`       | `bg-primary`               |
| `borderColor: 'divider'`        | `border-border`            |

### Mapping typographie

| MUI `sx`                    | Tailwind              |
| --------------------------- | --------------------- |
| `fontSize: 14`             | `text-sm`             |
| `fontSize: 16`             | `text-base`           |
| `fontSize: 20`             | `text-xl`             |
| `fontWeight: 'bold'`       | `font-bold`           |
| `fontWeight: 500`          | `font-medium`         |
| `textAlign: 'center'`     | `text-center`         |
| `textTransform: 'uppercase'` | `uppercase`        |
| `lineHeight: 1.5`         | `leading-normal`      |

## Remplacement de `useTheme` et `useMediaQuery`

### useMediaQuery -> Tailwind responsive

```tsx
// MUI
const theme = useTheme()
const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
return isMobile ? <MobileView /> : <DesktopView />

// Tailwind - pas besoin de hook
return (
  <>
    <div className="block sm:hidden"><MobileView /></div>
    <div className="hidden sm:block"><DesktopView /></div>
  </>
)
```

Pour les cas ou un hook est vraiment necessaire (logique JS, pas juste CSS) :
```tsx
// Hook custom leget
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)')
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return isMobile
}
```

### useTheme -> useThemeMode custom

Le hook `useTheme()` MUI est utilise dans 41 fichiers, principalement pour :
1. Acceder aux couleurs du theme -> Remplacer par CSS variables (`var(--primary)`)
2. Acceder aux breakpoints -> Remplacer par Tailwind responsive
3. Acceder a la palette custom -> Remplacer par CSS variables

```tsx
// MUI
const theme = useTheme()
<Box sx={{ color: theme.palette.primary.main }}>

// Tailwind
<div className="text-primary">
```

### alpha() -> Tailwind opacity

```tsx
// MUI
import { alpha } from '@mui/material/styles'
sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}

// Tailwind
className="bg-primary/10"
```

## Strategie de migration

1. Creer un script de detection qui liste tous les fichiers par nombre d'usages `sx`
2. Commencer par les fichiers avec peu de `sx` (1-3 usages)
3. Monter progressivement vers les fichiers complexes
4. Les composants dans `src/components/ui/` en premier (wrappers MUI)
5. Puis les pages et composants metier

## Validation

- [ ] Aucun `sx` prop restant dans les fichiers migres
- [ ] Aucun import de `Box`, `Stack`, `Grid` de MUI
- [ ] `useTheme` et `useMediaQuery` remplaces partout
- [ ] Responsive fonctionne identiquement
- [ ] `pnpm build` passe
