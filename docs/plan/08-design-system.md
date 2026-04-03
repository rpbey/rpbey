# Design System RPB — MD3 Expressive x Beyblade

## Direction artistique

**Style** : Material Design 3 Expressive — formes arrondies genereuses, animations spring avec rebond, typographie bold, surfaces tonales elevees.

**Univers** : Beyblade X — energie, vitesse, impact. Speed lines, glows, rotations, sparks.

**Mood** : Premium gaming dark UI. Pas de noir pur. Fond gris chaud sombre avec accents rouge/orange/jaune intenses.

---

## Palette de couleurs

### Couleurs principales

| Token          | Hex       | oklch                            | Usage                          |
| -------------- | --------- | -------------------------------- | ------------------------------ |
| `--rpb-red`    | #ce0c07   | `oklch(0.50 0.23 27)`           | Primary, CTAs, accents forts   |
| `--rpb-orange` | #e68002   | `oklch(0.68 0.18 60)`           | Secondary, highlights chauds   |
| `--rpb-yellow` | #f7d301   | `oklch(0.87 0.19 95)`           | Tertiary, or, recompenses      |
| `--rpb-dark`   | #1d1b1b   | `oklch(0.17 0.005 15)`          | Surface de base                |

### Surface Tonal Scale (gris chauds rouges)

Pas de noir pur (#000). Le fond le plus sombre est #141111 (gris chaud rouge).

| Token              | Hex       | oklch                    | Elevation |
| ------------------ | --------- | ------------------------ | --------- |
| `--surface-dim`    | #141111   | `oklch(0.13 0.01 15)`   | Arriere-plan profond     |
| `--surface-lowest` | #1d1b1b   | `oklch(0.17 0.005 15)`  | Background par defaut    |
| `--surface-low`    | #252222   | `oklch(0.21 0.007 15)`  | Cards, panels            |
| `--surface`        | #2d2929   | `oklch(0.25 0.008 15)`  | Cards elevees            |
| `--surface-high`   | #383333   | `oklch(0.29 0.01 15)`   | Menus, popovers          |
| `--surface-highest`| #433d3d   | `oklch(0.33 0.01 15)`   | Tooltips, top layer      |

### Couleurs derivees

| Token                    | Valeur                            | Usage                       |
| ------------------------ | --------------------------------- | --------------------------- |
| `--primary`              | `--rpb-red` #ce0c07               | Boutons filled, liens       |
| `--primary-foreground`   | #ffffff                           | Texte sur primary           |
| `--primary-container`    | `oklch(0.30 0.10 27)` ~#5c1a15   | Badge bg, chip bg           |
| `--primary-on-container` | `oklch(0.90 0.08 27)` ~#ffd5d2   | Texte sur container         |
| `--secondary`            | `--rpb-orange` #e68002            | Boutons tonal, accents      |
| `--secondary-foreground` | #000000                           | Texte sur secondary         |
| `--tertiary`             | `--rpb-yellow` #f7d301            | Or, badges, recompenses     |
| `--tertiary-foreground`  | #000000                           | Texte sur tertiary          |
| `--foreground`           | #f5f0f0                           | Texte principal             |
| `--muted-foreground`     | #a89999                           | Texte secondaire            |
| `--border`               | rgba(255,255,255,0.08)            | Bordures subtiles           |
| `--input`                | rgba(255,255,255,0.12)            | Champs de saisie            |
| `--ring`                 | `--rpb-red`                       | Focus ring                  |
| `--destructive`          | #ef4444                           | Erreurs (rouge + clair)     |

### Accessibilite contraste (sur #1d1b1b)

| Couleur       | Ratio  | AA normal | AA large | Usage recommande              |
| ------------- | ------ | --------- | -------- | ----------------------------- |
| #ce0c07 rouge | ~3.7:1 | Non       | Oui      | Icons, gros texte, boutons    |
| #e68002 orange| ~5.8:1 | Oui       | Oui      | Texte, highlights             |
| #f7d301 jaune | ~11:1  | Oui       | Oui      | Badges, titres, emphasis      |
| #f5f0f0 texte | ~16:1  | Oui       | Oui      | Body text                     |
| #a89999 muted | ~5.2:1 | Oui       | Oui      | Texte secondaire              |

> **Note** : Le rouge #ce0c07 ne passe pas AA pour le texte normal. L'utiliser pour gros texte (18px+ bold), icons, bordures, glows, et boutons filled (avec texte blanc).

### Gradients signature

```css
/* Gradient principal RPB — rouge vers orange vers jaune */
--gradient-rpb: linear-gradient(135deg, #ce0c07, #e68002, #f7d301);

/* Gradient chaud subtil pour cards hover */
--gradient-warm: linear-gradient(135deg, rgba(206,12,7,0.08), rgba(230,128,2,0.05));

/* Gradient radial pour glow d'arene */
--gradient-arena: radial-gradient(ellipse at center, rgba(206,12,7,0.12) 0%, transparent 60%);

/* Gradient pour texte hero */
--gradient-text: linear-gradient(90deg, #ce0c07, #e68002, #f7d301);
```

---

## Shapes — MD3 Expressive

MD3 Expressive utilise des formes **tres arrondies** (pill shapes, large corners). Fini les angles droits.

### Shape Scale (design tokens)

```css
--radius-none: 0;
--radius-xs: 4px;      /* Chips petits */
--radius-sm: 8px;      /* Inputs, petits boutons */
--radius-md: 12px;     /* Cards, dialogs */
--radius-lg: 16px;     /* Cards larges, panels */
--radius-lg-inc: 20px; /* FAB, menus */
--radius-xl: 28px;     /* Navigation bar, modals */
--radius-xl-inc: 32px; /* Sheets, bottom drawers */
--radius-2xl: 48px;    /* Hero cards, banners */
--radius-full: 9999px; /* Boutons pill, badges, chips */
```

### Application par composant

| Composant            | Radius             | MD3 Expressive                    |
| -------------------- | ------------------ | --------------------------------- |
| Button (filled)      | `--radius-full`    | Pill shape (totalement arrondi)   |
| Button (outlined)    | `--radius-full`    | Pill shape                        |
| Button (icon)        | `--radius-full`    | Cercle                            |
| FAB                  | `--radius-lg-inc`  | 20px (Medium), 28px (Large)       |
| Card                 | `--radius-lg`      | 16px corners                      |
| Card (hero)          | `--radius-2xl`     | 48px corners                      |
| Dialog               | `--radius-xl`      | 28px corners                      |
| Chip                 | `--radius-full`    | Pill shape                        |
| Badge                | `--radius-full`    | Pill shape                        |
| Input / TextField    | `--radius-sm`      | 8px subtil                        |
| Menu / Dropdown      | `--radius-lg-inc`  | 20px                              |
| Tooltip              | `--radius-sm`      | 8px                               |
| Bottom Sheet         | `--radius-xl-inc`  | 32px (top corners only)           |
| Navigation Bar       | `--radius-xl`      | 28px (active indicator = pill)    |
| Avatar               | `--radius-full`    | Cercle                            |
| Progress bar         | `--radius-full`    | Pill (track et indicateur)        |
| Image thumbnail      | `--radius-md`      | 12px                              |
| Tab indicator        | `--radius-full`    | Pill shape                        |

---

## Motion — MD3 Expressive Spring

### Easing Curves (cubic-bezier)

Le coeur de MD3 Expressive : des courbes **avec overshoot** (rebond) pour le spatial.

```css
/* ── Spatial (position, scale, rotation) ── */
--ease-spatial-fast:    cubic-bezier(0.42, 1.85, 0.21, 0.90);  /* 350ms — rebond prononce */
--ease-spatial-default: cubic-bezier(0.38, 1.21, 0.22, 1.00);  /* 500ms — rebond subtil */
--ease-spatial-slow:    cubic-bezier(0.39, 1.29, 0.35, 0.98);  /* 650ms — entree douce */

/* ── Effects (opacity, color, blur) ── */
--ease-effects-fast:    cubic-bezier(0.31, 0.94, 0.34, 1.00);  /* 150ms */
--ease-effects-default: cubic-bezier(0.34, 0.80, 0.34, 1.00);  /* 200ms */
--ease-effects-slow:    cubic-bezier(0.34, 0.88, 0.34, 1.00);  /* 300ms */

/* ── Durations ── */
--duration-fast: 150ms;
--duration-default: 300ms;
--duration-slow: 500ms;
--duration-enter: 350ms;
--duration-exit: 200ms;
```

### Framer Motion presets

```typescript
// Spring presets pour Framer Motion
export const springs = {
  // Rebond rapide et snappy (boutons, toggles)
  snappy: { type: 'spring', stiffness: 400, damping: 25, mass: 0.8 },

  // Rebond standard (cards, menus, modals)
  default: { type: 'spring', stiffness: 200, damping: 20, mass: 1 },

  // Rebond lent et fluide (page transitions, hero sections)
  gentle: { type: 'spring', stiffness: 100, damping: 15, mass: 1.2 },

  // Rebond lourd (grosses cards, panels)
  heavy: { type: 'spring', stiffness: 80, damping: 18, mass: 2 },

  // Rebond joueur/exagere (celebrite, recompenses, impact Beyblade)
  bouncy: { type: 'spring', stiffness: 300, damping: 12, mass: 0.8 },
} as const

// Variants pour stagger (listes, grilles)
export const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
}

export const staggerItem = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springs.default,
  },
}
```

### Animations par interaction

| Action               | Animation                                          | Duree  | Curve                   |
| -------------------- | -------------------------------------------------- | ------ | ----------------------- |
| Bouton press         | scale(0.95) -> scale(1)                            | 150ms  | spatial-fast            |
| Bouton hover         | scale(1.02) + glow                                 | 200ms  | effects-default         |
| Card hover           | translateY(-4px) + shadow + glow subtil             | 350ms  | spatial-fast            |
| Card enter (scroll)  | opacity 0->1, y 30->0, scale 0.95->1              | 500ms  | spatial-default         |
| Dialog open          | scale 0.9->1, opacity 0->1                        | 350ms  | spatial-fast (overshoot)|
| Dialog close         | scale 1->0.95, opacity 1->0                       | 200ms  | effects-fast            |
| Menu open            | scaleY 0.8->1, opacity 0->1                       | 300ms  | spatial-fast            |
| Tab switch           | Indicator slide + spring                            | 350ms  | spatial-fast            |
| Page transition      | fade + slide 20px                                  | 500ms  | spatial-default         |
| Toast enter          | translateY(100%) -> 0, scale 0.9->1                | 400ms  | spatial-fast            |
| Skeleton shimmer     | translateX(-100% -> 100%)                          | 1.5s   | linear, infinite        |
| List stagger         | Chaque item y 20->0, opacity 0->1                 | 500ms  | spatial-default + stagger 60ms |

---

## Animations Beyblade

### Ambient effects (arriere-plan)

```css
/* Glow radial rouge ambiant sur les sections hero */
.rpb-arena-glow {
  position: relative;
}
.rpb-arena-glow::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 50% 50%,
    rgba(206, 12, 7, 0.08) 0%,
    rgba(230, 128, 2, 0.04) 30%,
    transparent 60%
  );
  pointer-events: none;
  z-index: 0;
}

/* Speed lines conic qui tournent lentement */
@property --arena-angle {
  syntax: "<angle>";
  initial-value: 0deg;
  inherits: false;
}
.rpb-speed-lines::after {
  content: '';
  position: absolute;
  inset: -50%;
  background: repeating-conic-gradient(
    from var(--arena-angle),
    transparent 0deg,
    transparent 8deg,
    rgba(206, 12, 7, 0.02) 8deg,
    rgba(206, 12, 7, 0.02) 10deg
  );
  animation: arena-rotate 30s linear infinite;
  pointer-events: none;
}
@keyframes arena-rotate {
  to { --arena-angle: 360deg; }
}

/* Pulse glow sur les elements importants */
@keyframes rpb-pulse {
  0%, 100% { box-shadow: 0 0 20px rgba(206, 12, 7, 0.3); }
  50% { box-shadow: 0 0 40px rgba(206, 12, 7, 0.5), 0 0 80px rgba(206, 12, 7, 0.2); }
}
.rpb-pulse {
  animation: rpb-pulse 3s ease-in-out infinite;
}
```

### Interaction effects

```css
/* Spin animation (icones, loaders) */
@keyframes rpb-spin {
  to { transform: rotate(360deg); }
}
.rpb-spin { animation: rpb-spin 2s linear infinite; }
.rpb-spin-slow { animation: rpb-spin 8s linear infinite; }

/* Impact burst (on click, on achievement) */
@keyframes rpb-burst {
  0% { transform: scale(0.5); opacity: 1; }
  50% { transform: scale(1.5); opacity: 0.6; }
  100% { transform: scale(2); opacity: 0; }
}

/* Shimmer gradient pour les cartes TCG / rewards */
@keyframes rpb-shimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}
.rpb-shimmer {
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(247, 211, 1, 0.1) 25%,
    rgba(230, 128, 2, 0.15) 50%,
    rgba(247, 211, 1, 0.1) 75%,
    transparent 100%
  );
  background-size: 200% 100%;
  animation: rpb-shimmer 3s ease-in-out infinite;
}

/* Energy trail pour les transitions de page */
@keyframes rpb-trail {
  0% { clip-path: inset(0 100% 0 0); }
  100% { clip-path: inset(0 0 0 0); }
}

/* Gradient text anime pour les titres hero */
@keyframes rpb-gradient-shift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
.rpb-gradient-text {
  background: linear-gradient(90deg, #ce0c07, #e68002, #f7d301, #e68002, #ce0c07);
  background-size: 300% 100%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: rpb-gradient-shift 6s ease-in-out infinite;
}
```

---

## Typography — MD3 Expressive

### Font

Conserver la font variable actuelle du projet (Google Sans Flex ou equivalent).

### Scale avec variantes emphasized

| Token             | Size | Weight | Line Height | Usage                        |
| ----------------- | ---- | ------ | ----------- | ---------------------------- |
| `display-lg`      | 57px | 800    | 64px        | Hero titles                  |
| `display-md`      | 45px | 700    | 52px        | Section titles               |
| `display-sm`      | 36px | 600    | 44px        | Card feature titles          |
| `headline-lg`     | 32px | 600    | 40px        | Page titles                  |
| `headline-md`     | 28px | 600    | 36px        | Panel titles                 |
| `headline-sm`     | 24px | 500    | 32px        | Sub-sections                 |
| `title-lg`        | 22px | 600    | 28px        | Card titles                  |
| `title-md`        | 16px | 600    | 24px        | List items, nav              |
| `title-sm`        | 14px | 600    | 20px        | Captions titrees             |
| `body-lg`         | 16px | 400    | 24px        | Paragraphes                  |
| `body-md`         | 14px | 400    | 20px        | Body standard                |
| `body-sm`         | 12px | 400    | 16px        | Small body                   |
| `label-lg`        | 14px | 600    | 20px        | Boutons, labels              |
| `label-md`        | 12px | 600    | 16px        | Chips, badges                |
| `label-sm`        | 11px | 600    | 16px        | Captions                     |

**Emphasized** : Chaque token a une variante emphasized avec +100 weight et letterSpacing tighter. Utilisee pour les etats actifs, les selections, et les moments d'attention.

---

## Composants — Style MD3 Expressive

### Button

```css
/* Filled button — pill shape, glow on hover */
.btn-filled {
  border-radius: 9999px;
  padding: 12px 28px;
  font-weight: 600;
  font-size: 14px;
  letter-spacing: 0.02em;
  background: var(--primary);
  color: var(--primary-foreground);
  transition: transform 150ms var(--ease-spatial-fast),
              box-shadow 200ms var(--ease-effects-default);
}
.btn-filled:hover {
  transform: scale(1.02);
  box-shadow: 0 0 20px rgba(206, 12, 7, 0.4);
}
.btn-filled:active {
  transform: scale(0.97);
}

/* Tonal button — secondary color, moins intense */
.btn-tonal {
  border-radius: 9999px;
  background: var(--primary-container);
  color: var(--primary-on-container);
}

/* Outlined button */
.btn-outlined {
  border-radius: 9999px;
  border: 1.5px solid var(--border);
  background: transparent;
}
```

### Card

```css
/* Card standard — MD3 Expressive rounded */
.card {
  border-radius: 16px;
  background: var(--surface-low);
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: transform 350ms var(--ease-spatial-fast),
              box-shadow 200ms var(--ease-effects-default);
}
.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3),
              0 0 0 1px rgba(206, 12, 7, 0.1);
}

/* Card hero — extra arrondie avec gradient glow */
.card-hero {
  border-radius: 48px;
  background: linear-gradient(135deg, var(--surface-low), var(--surface));
  position: relative;
  overflow: hidden;
}
.card-hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--gradient-warm);
  opacity: 0;
  transition: opacity 300ms var(--ease-effects-default);
}
.card-hero:hover::before {
  opacity: 1;
}
```

### Navigation Bar

```css
/* Bottom nav — MD3 Expressive avec pill indicator */
.nav-bar {
  background: var(--surface);
  backdrop-filter: blur(20px);
  border-radius: 28px 28px 0 0;
  padding: 8px 16px env(safe-area-inset-bottom);
}
.nav-item-active .nav-indicator {
  background: var(--primary-container);
  border-radius: 9999px;
  padding: 4px 20px;
  transition: all 350ms var(--ease-spatial-fast);
}
```

### AppBar / Header

```css
.app-bar {
  background: color-mix(in srgb, var(--surface-lowest) 85%, transparent);
  backdrop-filter: blur(24px) saturate(1.5);
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}
```

---

## Page Transitions

```typescript
// Layout avec AnimatePresence pour transitions entre pages
import { motion, AnimatePresence } from 'framer-motion'

const pageVariants = {
  initial: { opacity: 0, y: 16, filter: 'blur(4px)' },
  animate: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.5,
      ease: [0.38, 1.21, 0.22, 1.00], // spatial-default
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    filter: 'blur(2px)',
    transition: {
      duration: 0.2,
      ease: [0.31, 0.94, 0.34, 1.00], // effects-fast
    },
  },
}
```

---

## Recapitulatif des tokens CSS

```css
:root, .theme-red {
  /* ── Brand ── */
  --rpb-red: #ce0c07;
  --rpb-orange: #e68002;
  --rpb-yellow: #f7d301;

  /* ── Primary ── */
  --primary: #ce0c07;
  --primary-foreground: #ffffff;
  --primary-container: oklch(0.30 0.10 27);
  --primary-on-container: oklch(0.90 0.08 27);

  /* ── Secondary ── */
  --secondary: #e68002;
  --secondary-foreground: #000000;

  /* ── Tertiary ── */
  --tertiary: #f7d301;
  --tertiary-foreground: #000000;

  /* ── Surfaces ── */
  --background: #141111;
  --foreground: #f5f0f0;
  --card: #252222;
  --card-foreground: #f5f0f0;
  --popover: #383333;
  --popover-foreground: #f5f0f0;
  --muted: #2d2929;
  --muted-foreground: #a89999;
  --accent: #2d2929;
  --accent-foreground: #f5f0f0;

  /* ── Surface scale ── */
  --surface-dim: #141111;
  --surface-lowest: #1d1b1b;
  --surface-low: #252222;
  --surface: #2d2929;
  --surface-high: #383333;
  --surface-highest: #433d3d;

  /* ── Utility ── */
  --border: rgba(255, 255, 255, 0.08);
  --input: rgba(255, 255, 255, 0.12);
  --ring: #ce0c07;
  --destructive: #ef4444;
  --destructive-foreground: #ffffff;

  /* ── Charts ── */
  --chart-1: #ce0c07;
  --chart-2: #e68002;
  --chart-3: #f7d301;
  --chart-4: oklch(0.6 0.118 184.704);
  --chart-5: oklch(0.65 0.15 300);

  /* ── Gradients ── */
  --gradient-rpb: linear-gradient(135deg, #ce0c07, #e68002, #f7d301);

  /* ── Shapes (MD3 Expressive) ── */
  --radius: 16px;
  --radius-xs: 4px;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 28px;
  --radius-2xl: 48px;
  --radius-full: 9999px;

  /* ── Motion (MD3 Expressive) ── */
  --ease-spatial-fast: cubic-bezier(0.42, 1.85, 0.21, 0.90);
  --ease-spatial-default: cubic-bezier(0.38, 1.21, 0.22, 1.00);
  --ease-spatial-slow: cubic-bezier(0.39, 1.29, 0.35, 0.98);
  --ease-effects-fast: cubic-bezier(0.31, 0.94, 0.34, 1.00);
  --ease-effects-default: cubic-bezier(0.34, 0.80, 0.34, 1.00);
  --ease-effects-slow: cubic-bezier(0.34, 0.88, 0.34, 1.00);
  --duration-fast: 150ms;
  --duration-default: 300ms;
  --duration-slow: 500ms;
}

/* ── Theme Bleu (tournois) ── */
.theme-blue {
  --primary: #60a5fa;
  --primary-foreground: #000000;
  --primary-container: oklch(0.30 0.10 260);
  --primary-on-container: oklch(0.90 0.08 260);
  --secondary: #93c5fd;
  --secondary-foreground: #000000;
  --tertiary: #a5b4fc;
  --tertiary-foreground: #000000;
  --ring: #60a5fa;
  --background: #0f1420;
  --surface-dim: #0a0e18;
  --surface-lowest: #0f1420;
  --surface-low: #1a2236;
  --surface: #24304a;
  --surface-high: #334160;
  --surface-highest: #435275;
  --card: #1a2236;
  --chart-1: #60a5fa;
  --chart-2: #93c5fd;
  --chart-3: #a5b4fc;
  --chart-4: oklch(0.6 0.118 184.704);
  --chart-5: oklch(0.65 0.15 300);
}
```
