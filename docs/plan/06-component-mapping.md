# Mapping complet MUI -> shadcn/ui

## Composants core

| MUI Component              | shadcn/ui Equivalent             | Notes                                    |
| -------------------------- | -------------------------------- | ---------------------------------------- |
| `Button`                   | `Button`                         | variants: default, outline, ghost, link  |
| `IconButton`               | `Button variant="ghost" size="icon"` | Avec icone Lucide                   |
| `ButtonGroup`              | `div className="flex gap-1"`     | Ou ButtonGroup shadcn (extension)        |
| `ToggleButton`             | `Toggle`                         | `npx shadcn add toggle`                  |
| `ToggleButtonGroup`        | `ToggleGroup`                    | `npx shadcn add toggle-group`            |
| `Fab`                      | `Button size="icon" className="rounded-full"` | Custom styling            |

## Cards & Surfaces

| MUI Component              | shadcn/ui Equivalent             | Notes                                    |
| -------------------------- | -------------------------------- | ---------------------------------------- |
| `Card`                     | `Card`                           | Composant identique                      |
| `CardContent`              | `CardContent`                    | Idem                                     |
| `CardHeader`               | `CardHeader` + `CardTitle`       | Separe titre et description              |
| `CardActions`              | `CardFooter`                     | Renomme                                  |
| `CardActionArea`           | `Card` + `className="cursor-pointer hover:bg-accent"` | Custom        |
| `CardMedia`                | `img` + Tailwind                 | Pas d'equivalent direct                  |
| `Paper`                    | `div className="rounded-lg bg-card shadow"` | Pas de composant dedie          |

## Overlays & Modals

| MUI Component              | shadcn/ui Equivalent             | Notes                                    |
| -------------------------- | -------------------------------- | ---------------------------------------- |
| `Dialog`                   | `Dialog`                         | Pattern Trigger different                |
| `DialogTitle`              | `DialogHeader` + `DialogTitle`   | Wrapper supplementaire                   |
| `DialogContent`            | `DialogContent`                  | Idem                                     |
| `DialogActions`            | `DialogFooter`                   | Renomme                                  |
| `DialogContentText`        | `DialogDescription`              | Renomme                                  |
| `Menu`                     | `DropdownMenu`                   | Pattern Trigger different                |
| `MenuItem`                 | `DropdownMenuItem`               | Idem                                     |
| `Tooltip`                  | `Tooltip` + `TooltipProvider`    | Besoin d'un Provider                     |
| `Popover`                  | `Popover`                        | Similaire                                |

## Formulaires

| MUI Component              | shadcn/ui Equivalent             | Notes                                    |
| -------------------------- | -------------------------------- | ---------------------------------------- |
| `TextField`                | `Input` + `Label`                | Separes en 2 composants                  |
| `Select`                   | `Select` + `SelectContent`       | Pattern Trigger                          |
| `MenuItem` (in Select)     | `SelectItem`                     | Renomme                                  |
| `Checkbox`                 | `Checkbox`                       | Similaire                                |
| `Switch`                   | `Switch`                         | Similaire                                |
| `Slider`                   | `Slider`                         | Similaire                                |
| `FormControl`              | `div` + structure custom         | Pas d'equivalent direct                  |
| `FormControlLabel`         | `Label` + composant              | Pattern different                        |
| `InputLabel`               | `Label`                          | Renomme                                  |
| `InputAdornment`           | Custom avec `relative` + `absolute` | Pas d'equivalent direct               |

## Data Display

| MUI Component              | shadcn/ui Equivalent             | Notes                                    |
| -------------------------- | -------------------------------- | ---------------------------------------- |
| `Typography`               | HTML natif (`h1`-`h6`, `p`, `span`) + Tailwind | Pas de composant, classes CSS  |
| `Table`                    | `Table`                          | Similaire                                |
| `TableContainer`           | `div className="overflow-auto"`  | Wrapper simple                           |
| `TableHead`                | `TableHeader`                    | Renomme                                  |
| `TableBody`                | `TableBody`                      | Idem                                     |
| `TableRow`                 | `TableRow`                       | Idem                                     |
| `TableCell`                | `TableHead` / `TableCell`        | 2 composants distincts                   |
| `TablePagination`          | Custom avec `Button`             | Pas d'equivalent direct                  |
| `TableSortLabel`           | Custom avec `ArrowUpDown` icon   | Via TanStack Table                       |
| `Pagination`               | `Pagination` (shadcn)            | `npx shadcn add pagination`             |
| `List`                     | `ul` / `ol` + Tailwind           | Pas de composant dedie                   |
| `ListItem`                 | `li` + Tailwind                  | Pas de composant dedie                   |
| `ListItemText`             | `span` / `p` + Tailwind          | Pas de composant dedie                   |

## Feedback

| MUI Component              | shadcn/ui Equivalent             | Notes                                    |
| -------------------------- | -------------------------------- | ---------------------------------------- |
| `Alert`                    | `Alert` + `AlertDescription`     | Similaire                                |
| `Chip`                     | `Badge`                          | Renomme, moins de features               |
| `Badge`                    | `Badge` (ou custom)              | MUI Badge = notification dot             |
| `LinearProgress`           | `Progress`                       | `npx shadcn add progress`               |
| `CircularProgress`         | `Spinner` (custom ou Lucide `Loader2`) | Pas d'equivalent direct           |
| `Skeleton`                 | `Skeleton`                       | Similaire                                |

## Navigation

| MUI Component              | shadcn/ui Equivalent             | Notes                                    |
| -------------------------- | -------------------------------- | ---------------------------------------- |
| `AppBar`                   | `header` + Tailwind              | Custom layout                            |
| `Toolbar`                  | `div className="flex items-center"` | Simple flex container                |
| `BottomNavigation`         | Custom avec Tailwind             | Pas d'equivalent direct                  |
| `Tabs`                     | `Tabs` + `TabsList` + `TabsTrigger` + `TabsContent` | Pattern different        |
| `Breadcrumbs`              | `Breadcrumb` (shadcn)            | `npx shadcn add breadcrumb`             |
| `Link`                     | `next/link` + Tailwind           | Pas de composant shadcn                  |
| `Drawer`                   | `Sheet`                          | `npx shadcn add sheet`                  |

## Layout

| MUI Component              | shadcn/ui Equivalent             | Notes                                    |
| -------------------------- | -------------------------------- | ---------------------------------------- |
| `Box`                      | `div` + Tailwind                 | Le plus courant                          |
| `Stack`                    | `div className="flex flex-col gap-*"` | Flex container                    |
| `Grid`                     | `div className="grid grid-cols-*"` | CSS Grid                              |
| `Container`                | `div className="mx-auto max-w-*"` | Container responsive                  |
| `Divider`                  | `Separator`                      | `npx shadcn add separator`              |

## Utilitaires & Hooks

| MUI Utility                | Remplacement                     | Notes                                    |
| -------------------------- | -------------------------------- | ---------------------------------------- |
| `useTheme()`               | `useThemeMode()` custom          | Voir Phase 0                             |
| `useMediaQuery()`          | Tailwind responsive ou hook custom | Voir Phase 2                           |
| `alpha()`                  | `bg-primary/10` (Tailwind opacity) | Syntaxe native Tailwind               |
| `styled()`                 | `cva()` ou `cn()`               | class-variance-authority                 |
| `createSvgIcon()`          | Composant SVG React              | Import direct                            |
| `ThemeProvider`             | `ThemeProvider` custom           | Voir Phase 0                             |
| `CssBaseline`              | Tailwind `@layer base`           | Integre dans globals.css                 |

## MUI X -> Alternatives

| MUI X Component            | Alternative                      | Package                                  |
| -------------------------- | -------------------------------- | ---------------------------------------- |
| `DataGrid`                 | TanStack Table + shadcn Table    | `@tanstack/react-table`                 |
| `DatePicker`               | Calendar + Popover               | `react-day-picker` (via shadcn)          |
| `BarChart`                 | Recharts BarChart                | `recharts`                               |
| `LineChart`                | Recharts LineChart               | `recharts`                               |
| `PieChart`                 | Recharts PieChart                | `recharts`                               |
| `ScatterChart`             | Recharts ScatterChart            | `recharts`                               |

## Icons MUI -> Lucide (complet)

| MUI Icon                   | Lucide Icon          |
| -------------------------- | -------------------- |
| `Add`                      | `Plus`               |
| `ArrowBack`                | `ArrowLeft`          |
| `ArrowForward`             | `ArrowRight`         |
| `Check`                    | `Check`              |
| `CheckCircle`              | `CheckCircle`        |
| `ChevronLeft`              | `ChevronLeft`        |
| `ChevronRight`             | `ChevronRight`       |
| `Close`                    | `X`                  |
| `CloudSync`                | `CloudCog`           |
| `Collections`              | `Images`             |
| `CompareArrows`            | `ArrowLeftRight`     |
| `ContentCopy`              | `Copy`               |
| `Dashboard`                | `LayoutDashboard`    |
| `Delete`                   | `Trash2`             |
| `Download`                 | `Download`           |
| `Edit`                     | `Pencil`             |
| `EmojiEvents`              | `Trophy`             |
| `ExpandMore`               | `ChevronDown`        |
| `FilterList`               | `Filter`             |
| `Fullscreen`               | `Maximize`           |
| `GitHub`                   | `Github`             |
| `History`                  | `History`            |
| `Home`                     | `Home`               |
| `Info`                     | `Info`               |
| `InfoOutlined`             | `Info`               |
| `Instagram`                | `Instagram`          |
| `Leaderboard`              | `BarChart3`          |
| `Menu`                     | `Menu`               |
| `NavigateNext`             | `ChevronRight`       |
| `Notifications`            | `Bell`               |
| `OpenInNew`                | `ExternalLink`       |
| `Pause`                    | `Pause`              |
| `Person`                   | `User`               |
| `PlayArrow`                | `Play`               |
| `Refresh`                  | `RefreshCw`          |
| `Save`                     | `Save`               |
| `Search`                   | `Search`             |
| `Settings`                 | `Settings`           |
| `Share`                    | `Share2`             |
| `SkipNext`                 | `SkipForward`        |
| `SkipPrevious`             | `SkipBack`           |
| `Sort`                     | `ArrowUpDown`        |
| `SportsMma`                | `Swords`             |
| `Star`                     | `Star`               |
| `Stop`                     | `Square`             |
| `Sync`                     | `RefreshCw`          |
| `TrendingUp`               | `TrendingUp`         |
| `Twitter`                  | `Twitter`            |
| `Upload`                   | `Upload`             |
| `Visibility`               | `Eye`                |
| `VisibilityOff`            | `EyeOff`             |
| `VolumeUp`                 | `Volume2`            |
| `VolumeMute`               | `VolumeX`            |
| `WarningAmber`             | `AlertTriangle`      |
| `YouTube`                  | `Youtube`            |
| `ViewModule`               | `LayoutGrid`         |
| `ViewList`                 | `List`               |
