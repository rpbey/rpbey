# Phase 3 : Migration MUI X (Charts, DataGrid, DatePicker)

## Objectif

Remplacer les 3 packages MUI X par des alternatives open-source compatibles shadcn/ui.

## 1. Charts : @mui/x-charts -> Recharts

### Fichiers concernes

- `src/components/ui/DynamicCharts.tsx` - Wrapper principal
- `src/components/ui/Chart.tsx` - Wrapper secondaire
- `src/components/admin/StatsCharts.tsx`
- `src/components/rankings/SatrCharts.tsx`
- `src/components/rankings/WbCharts.tsx`
- `src/components/rankings/SatrAnalysis.tsx`

### Installation

```bash
pnpm add recharts
npx shadcn@latest add chart
```

shadcn/ui fournit un composant `Chart` pre-configure avec Recharts et le theming CSS variables.

### Mapping des composants

| MUI x-charts          | Recharts                      |
| ---------------------- | ----------------------------- |
| `BarChart`            | `BarChart` + `Bar`            |
| `LineChart`           | `LineChart` + `Line`          |
| `PieChart`            | `PieChart` + `Pie` + `Cell`   |
| `ScatterChart`        | `ScatterChart` + `Scatter`    |
| `ChartsTooltip`       | `Tooltip`                     |
| `ChartsLegend`        | `Legend`                       |
| `ChartsXAxis`         | `XAxis`                       |
| `ChartsYAxis`         | `YAxis`                       |

### Exemple de conversion

```tsx
// MUI x-charts
import { BarChart } from '@mui/x-charts/BarChart'

<BarChart
  xAxis={[{ data: labels, scaleType: 'band' }]}
  series={[{ data: values, color: theme.palette.primary.main }]}
  height={300}
/>

// Recharts
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

<ResponsiveContainer width="100%" height={300}>
  <BarChart data={chartData}>
    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
    <XAxis dataKey="name" stroke="var(--muted-foreground)" />
    <YAxis stroke="var(--muted-foreground)" />
    <Tooltip
      contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    />
    <Bar dataKey="value" fill="var(--primary)" radius={[4, 4, 0, 0]} />
  </BarChart>
</ResponsiveContainer>
```

### RadarChart (StatRadar.tsx)

Le fichier utilise deja `recharts` pour le RadarChart ! Pas de migration necessaire pour celui-ci.

### Points d'attention

- Recharts utilise un pattern declaratif different (composants enfants vs props)
- `ResponsiveContainer` est obligatoire pour le responsive
- Les couleurs doivent utiliser les CSS variables du theme
- Les tooltips custom doivent etre restyled en Tailwind

## 2. DataGrid : @mui/x-data-grid -> TanStack Table

### Fichiers concernes

- `src/components/ui/DataTable.tsx` - Wrapper principal (deja un wrapper custom)
- Pages admin utilisant DataGrid directement

### Installation

```bash
pnpm add @tanstack/react-table
npx shadcn@latest add table
```

### Architecture cible

shadcn/ui fournit un composant `DataTable` base sur TanStack Table avec :
- Sorting (tri par colonnes)
- Filtering (filtrage par colonne)
- Pagination
- Column visibility
- Row selection

```tsx
"use client"

import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
```

### Mapping des features

| MUI DataGrid feature     | TanStack Table equivalent              |
| ------------------------ | -------------------------------------- |
| `columns` prop           | `ColumnDef[]`                          |
| `rows` prop              | `data` prop                            |
| `sortModel`              | `SortingState` + `getSortedRowModel`   |
| `filterModel`            | `ColumnFiltersState` + `getFilteredRowModel` |
| `paginationModel`        | `PaginationState` + `getPaginationRowModel`  |
| `checkboxSelection`      | Row selection avec `Checkbox`          |
| `onRowClick`             | Custom via `row.original`              |
| `loading`                | Custom loading state                   |
| `slots.toolbar`          | Custom toolbar component               |
| `getRowId`               | `getRowId` option                      |
| `columnVisibilityModel`  | `VisibilityState`                      |

### Points d'attention

- TanStack Table est headless : pas de UI pre-faite, juste la logique
- shadcn/ui fournit le styling via les composants `Table`
- La pagination server-side necessite `manualPagination: true`
- Le tri server-side necessite `manualSorting: true`

## 3. DatePicker : @mui/x-date-pickers -> react-day-picker

### Fichiers concernes

- `src/components/ui/DatePicker.tsx` - Wrapper actuel

### Installation

```bash
pnpm add react-day-picker
npx shadcn@latest add calendar popover
```

### Mapping

```tsx
// MUI
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'

<LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="fr">
  <DatePicker value={date} onChange={setDate} label="Date" />
</LocalizationProvider>

// shadcn/ui
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline" className="w-full justify-start text-left">
      <CalendarIcon className="mr-2 h-4 w-4" />
      {date ? format(date, "PPP", { locale: fr }) : "Choisir une date"}
    </Button>
  </PopoverTrigger>
  <PopoverContent className="w-auto p-0">
    <Calendar
      mode="single"
      selected={date}
      onSelect={setDate}
      locale={fr}
    />
  </PopoverContent>
</Popover>
```

### Points d'attention

- `react-day-picker` utilise `Date` natif, pas `dayjs`
- Pour conserver `dayjs` : utiliser un adaptateur ou convertir aux frontieres
- La locale francaise vient de `date-fns/locale`
- Le composant Calendar de shadcn est deja style

## Validation

- [ ] Tous les graphiques rendent correctement avec Recharts
- [ ] DataTable supporte tri, filtrage, pagination
- [ ] DatePicker fonctionne en francais
- [ ] Theming (red/blue) applique aux charts
- [ ] `pnpm build` passe
- [ ] Aucun import de `@mui/x-*` restant
