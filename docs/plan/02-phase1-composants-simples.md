# Phase 1 : Migration des composants simples

## Objectif

Remplacer les composants MUI de base par leurs equivalents shadcn/ui. ~80 fichiers concernes.

## Ordre de migration

Migrer d'abord les composants les plus utilises pour maximiser l'impact.

### 1. Button (~30 fichiers)

**MUI** :
```tsx
import { Button, IconButton, ButtonGroup } from '@mui/material'
<Button variant="contained" color="primary" startIcon={<SaveIcon />}>
```

**shadcn/ui** :
```tsx
import { Button } from '@/components/ui/button'
import { Save } from 'lucide-react'
<Button variant="default"><Save className="mr-2 h-4 w-4" /> Sauvegarder</Button>
```

Mapping des variants :
| MUI variant      | shadcn variant  |
| ---------------- | --------------- |
| `contained`      | `default`       |
| `outlined`       | `outline`       |
| `text`           | `ghost`         |
| `IconButton`     | `variant="ghost" size="icon"` |

### 2. Card (~25 fichiers)

**MUI** :
```tsx
import { Card, CardContent, CardHeader, CardActions } from '@mui/material'
```

**shadcn/ui** :
```tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
```

### 3. Dialog (~15 fichiers)

**MUI** :
```tsx
import { Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material'
```

**shadcn/ui** :
```tsx
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
```

Note : shadcn Dialog utilise un pattern `DialogTrigger` au lieu de `open` prop.

### 4. Alert (~8 fichiers)

**MUI** :
```tsx
<Alert severity="error">Message</Alert>
```

**shadcn/ui** :
```tsx
<Alert variant="destructive"><AlertDescription>Message</AlertDescription></Alert>
```

### 5. Tabs (~6 fichiers)

**MUI** :
```tsx
<Tabs value={tab} onChange={(_, v) => setTab(v)}>
  <Tab label="Tab 1" />
</Tabs>
```

**shadcn/ui** :
```tsx
<Tabs value={tab} onValueChange={setTab}>
  <TabsList><TabsTrigger value="tab1">Tab 1</TabsTrigger></TabsList>
  <TabsContent value="tab1">...</TabsContent>
</Tabs>
```

### 6. Tooltip (~10 fichiers)

**MUI** :
```tsx
<Tooltip title="Info"><IconButton>...</IconButton></Tooltip>
```

**shadcn/ui** :
```tsx
<TooltipProvider>
  <Tooltip><TooltipTrigger>...</TooltipTrigger><TooltipContent>Info</TooltipContent></Tooltip>
</TooltipProvider>
```

### 7. Badge / Chip (~12 fichiers)

**MUI Chip** → **shadcn Badge** :
```tsx
// MUI
<Chip label="Actif" color="success" size="small" />

// shadcn
<Badge variant="default" className="bg-green-600">Actif</Badge>
```

### 8. Skeleton (~5 fichiers)

**MUI** :
```tsx
<Skeleton variant="rectangular" width={210} height={118} />
```

**shadcn/ui** :
```tsx
<Skeleton className="h-[118px] w-[210px] rounded-md" />
```

### 9. Select / Menu (~10 fichiers)

**MUI** :
```tsx
<Select value={v} onChange={e => setV(e.target.value)}>
  <MenuItem value="a">Option A</MenuItem>
</Select>
```

**shadcn/ui** :
```tsx
<Select value={v} onValueChange={setV}>
  <SelectTrigger><SelectValue /></SelectTrigger>
  <SelectContent><SelectItem value="a">Option A</SelectItem></SelectContent>
</Select>
```

### 10. TextField / Input (~20 fichiers)

**MUI** :
```tsx
<TextField label="Nom" variant="filled" value={v} onChange={e => setV(e.target.value)} />
```

**shadcn/ui** :
```tsx
<div className="space-y-2">
  <Label htmlFor="nom">Nom</Label>
  <Input id="nom" value={v} onChange={e => setV(e.target.value)} />
</div>
```

## Installation des composants shadcn

```bash
npx shadcn@latest add button card dialog alert tabs tooltip badge skeleton select input label dropdown-menu checkbox switch slider separator avatar popover
```

## Icons : MUI -> Lucide

Installer :
```bash
pnpm add lucide-react
```

Mapping courant (80+ icons) — exemples :
| MUI Icon              | Lucide Icon        |
| --------------------- | ------------------ |
| `CloseIcon`           | `X`                |
| `SearchIcon`          | `Search`           |
| `SaveIcon`            | `Save`             |
| `EditIcon`            | `Pencil`           |
| `DeleteIcon`          | `Trash2`           |
| `DownloadIcon`        | `Download`         |
| `ExpandMoreIcon`      | `ChevronDown`      |
| `PlayArrowIcon`       | `Play`             |
| `EmojiEventsIcon`     | `Trophy`           |
| `PersonIcon`          | `User`             |
| `MenuIcon`            | `Menu`             |
| `RefreshIcon`         | `RefreshCw`        |
| `OpenInNewIcon`       | `ExternalLink`     |
| `CompareArrowsIcon`   | `ArrowLeftRight`   |
| `LeaderboardIcon`     | `BarChart3`        |
| `TrendingUpIcon`      | `TrendingUp`       |
| `WarningAmber`        | `AlertTriangle`    |
| `InfoOutlined`        | `Info`             |
| `CheckCircleIcon`     | `CheckCircle`      |
| `History`             | `History`          |
| `TwitterIcon`         | `Twitter`          |
| `YouTubeIcon`         | `Youtube`          |
| `GitHub`              | `Github`           |

## Strategie par fichier

1. Ouvrir le fichier
2. Identifier tous les imports MUI
3. Remplacer les imports par les equivalents shadcn + Lucide
4. Convertir le JSX (props, patterns)
5. Convertir les `sx` props en classes Tailwind (voir Phase 2)
6. Tester visuellement
7. Passer au fichier suivant

## Validation

- [ ] Chaque composant migre est visuellement identique
- [ ] `pnpm build` passe apres chaque batch
- [ ] Pas de regression sur les pages existantes
- [ ] Les textes francais sont preserves
