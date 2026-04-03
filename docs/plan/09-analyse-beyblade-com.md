# Analyse : beyblade.com/fr — Ce qu'on garde, ce qu'on fait mieux

## Apercu du site officiel

**Stack** : Astro (SSG), Swiper.js, WebP, Intersection Observer, Google Analytics
**Style** : Gaming premium, anime cinematique, dark theme immersif
**Mood** : AAA game landing page — visuels > texte, storytelling progressif

---

## 1. Layout

### Ce qu'ils font
- **Hero plein ecran** avec background cinematique + logo + 1 seul CTA
- **Sections empilees** : Intro > Personnages > Episodes > Toupies > Videos
- **Navigation sticky** : Logo + menu horizontal + selecteur langue/saison
- **Carousels** partout (Swiper.js) pour personnages et toupies
- **Footer minimaliste** : liens legaux + logos partenaires
- **Responsive** : images doubles (desktop `.webp` + mobile `-sp.webp`)

### Ce qu'on prend pour RPB
- Hero plein ecran immersif avec gradient/glow comme premiere impression
- Sections a defilement narratif (scroll storytelling)
- Navigation sticky avec glass effect (backdrop-filter)

### Ce qu'on fait mieux
- **Pas de carousel basique** → Grilles interactives avec hover effects spring
- **Plus d'interactivite** → Animations au scroll (stagger reveals, parallax subtil)
- **Dashboard integre** → Le site officiel est purement vitrine, nous c'est aussi une app
- **Bottom nav mobile** → Beyblade.com n'a pas de nav mobile optimisee, nous oui (MD3 Expressive pill indicator)

---

## 2. Couleurs

### Ce qu'ils utilisent
- **Fond** : Noir/charcoal profond (images de fond + overlays sombres)
- **Texte** : Blanc pur
- **Accents** : Couleurs des equipes/personnages (varies par section)
- **Pas de couleur de marque fixe** — chaque section a son identite chromatique via les visuels

### Notre approche (superieure)
- **Fond gris chaud** `#1d1b1b` → Plus chaleureux, moins fatigant que le noir pur
- **Palette de marque coherente** : rouge `#ce0c07` / orange `#e68002` / jaune `#f7d301`
- **Gradient signature** `red → orange → yellow` → Identite forte et reconnaissable
- **Tonal surfaces** (6 niveaux) → Profondeur et hierarchie que beyblade.com n'a pas
- **CSS variables** → Theme cohérent et switchable (red/blue pour les tournois)

---

## 3. Typographie

### Ce qu'ils font
- Sans-serif moderne (probablement custom ou systeme)
- Hierarchie simple : gros titres + body text
- Pas de typographie audacieuse — assez generique

### Notre approche
- **MD3 Expressive typography** avec 15 tokens + 15 variantes emphasized
- **Variable font** avec `fontVariationSettings` pour weight/optical-size dynamiques
- **Gradient text** anime sur les titres hero → Plus impactant que le texte blanc statique
- **Letter-spacing et weight adaptes** au dark theme (lighter pour eviter le "halation")

---

## 4. Composants

### Ce qu'ils ont
- Carousel Swiper basique (fleches gauche/droite)
- Cards personnages (image + texte + equipe)
- Boutons simples (CTA textuel, pas tres stylise)
- Navigation dropdown pour langue/saison
- **Pas de composants interactifs complexes** (pas de formulaires, tables, dashboards)

### Nos composants MD3 Expressive
| Composant        | Beyblade.com        | RPB (notre design)                            |
| ---------------- | ------------------- | --------------------------------------------- |
| Boutons          | Rectangulaires, plats| **Pill shape**, glow hover, spring press      |
| Cards            | Rectangulaires      | **16px radius**, hover lift + glow, variants  |
| Navigation       | Menu basique        | **Glass header** + pill bottom nav            |
| Carousel         | Swiper basique      | Grid + hover expand ou Swiper ameliore        |
| Dialogs          | Aucun               | **28px radius**, spring open, blur backdrop   |
| Badges/Chips     | Aucun               | **Pill shape**, gradient backgrounds          |
| DataTable        | Aucun               | TanStack Table avec tri/filtre/pagination     |
| Charts           | Aucun               | Recharts avec couleurs du theme               |
| Forms            | Aucun               | Inputs 8px radius, filled style               |

---

## 5. Animations

### Ce qu'ils font
- **Swiper transitions** : ease-out, fade
- **Lazy loading** : Intersection Observer
- **Minimal** : Pas de scroll animations, pas de spring physics, pas de parallax
- Site essentiellement **statique visuellement** — le mouvement vient des carousels

### Notre approche (bien superieure)
| Effet                | Beyblade.com | RPB                                                |
| -------------------- | ------------ | -------------------------------------------------- |
| Scroll reveal        | Non          | **Stagger reveals** avec spring (chaque card apparait en sequence) |
| Hover effects        | Basique      | **Scale + glow + shadow** avec spring bounce       |
| Page transitions     | Aucune       | **Fade + slide + blur** avec ease spatial           |
| Ambient effects      | Non          | **Arena glow**, speed lines rotatifs, pulse         |
| Press feedback       | Non          | **Scale down 0.97** sur boutons avec spring         |
| Loading states       | Non          | **Shimmer** gradient anime rouge/orange/jaune       |
| Hero animations      | Non          | **Gradient text anime** + particle effects possibles|
| List animations      | Non          | **Layout animations** Framer Motion pour reordering |

---

## 6. Images / Assets

### Ce qu'ils font bien
- **WebP** partout (compression moderne)
- **Responsive images** : 2 versions (desktop + smartphone)
- **Rendus 3D** des toupies haute qualite, multi-angles
- **Character renders** cinematiques avec eclairage dramatique
- **Overlays sombres** sur backgrounds pour lisibilite texte

### Ce qu'on reprend
- Format **WebP** (deja en place)
- **Overlays gradient** sur les images hero
- **Rendus produits** haute qualite quand disponibles

### Ce qu'on ajoute
- **Clip-path** et formes dynamiques pour decoupe d'images
- **Hover zoom** avec overflow hidden et scale
- **Image shimmer** loading state
- **Holo/foil effects** sur les cartes TCG (deja commence avec kyoya)

---

## 7. Ce qui manque sur beyblade.com (nos opportunites)

1. **Zero interactivite** — C'est une brochure, pas une app. Nous on a un dashboard complet.
2. **Pas de communaute** — Pas de profils, classements, tournois. C'est notre coeur.
3. **Pas de personnalisation** — Pas de theme, pas de preferences. Nous on a le switch red/blue.
4. **Pas de gamification** — Pas de systeme de cartes, gacha, recompenses. Nous on a le TCG.
5. **Animations pauvres** — Le site est visuellement beau mais **statique**. Notre MD3 Expressive + Framer Motion sera bien plus vivant.
6. **Pas de dark mode intelligent** — Juste du noir avec des images. Notre palette tonale avec 6 niveaux de surface est plus sophistiquee.
7. **Mobile basique** — Pas de bottom nav, pas d'experience app-like. Notre bottom nav pill MD3 sera superieure.

---

## 8. Elements de design a integrer dans RPB

### Inspirations directes
- [x] Hero section plein ecran comme premiere impression
- [x] Storytelling par sections au scroll
- [x] Background images cinematiques avec overlay
- [x] Focus sur les visuels produits (toupies, personnages)

### Ameliorations
- [ ] Ajouter des **speed lines** CSS en arriere-plan des sections battle
- [ ] Ajouter un **arena glow** radial sur les sections tournois
- [ ] Utiliser le **gradient RPB** (red→orange→yellow) comme element signature
- [ ] **Gradient text anime** pour les titres principaux
- [ ] **Spring animations** sur toutes les interactions (MD3 Expressive)
- [ ] **Stagger reveal** au scroll pour les grilles de cards
- [ ] **Glass header** avec backdrop-filter blur
- [ ] **Pill bottom nav** avec indicator anime
- [ ] **Shimmer loading** sur les images et les cartes
- [ ] **Particle effects** optionnels sur la section hero (tsParticles)

---

## 9. Resume comparatif

| Aspect              | beyblade.com        | RPB (cible)           | Avantage          |
| ------------------- | ------------------- | --------------------- | ----------------- |
| Type                | Site vitrine        | App communautaire     | RPB               |
| Stack               | Astro (SSG)         | Next.js 16 (SSR/RSC) | RPB (dynamique)   |
| Design system       | Aucun (ad-hoc)      | MD3 Expressive        | RPB               |
| Animations          | Minimales           | Spring + Beyblade FX  | RPB               |
| Couleurs            | Noir + varies       | Palette tonale chaude | RPB               |
| Composants          | Basiques            | 50+ shadcn/ui         | RPB               |
| Interactivite       | Carousels           | Dashboard complet     | RPB               |
| Mobile              | Responsive basique  | App-like + bottom nav | RPB               |
| Performance         | Bonne (Astro)       | Bonne (Next.js RSC)   | Egal              |
| Contenu             | Officiel Takara     | Communautaire + TCG   | Complementaire    |

**Conclusion** : Le site officiel est une belle vitrine statique. RPB sera une **experience interactive** qui va bien au-dela, avec un design system plus avance, des animations plus riches, et de vraies features communautaires. On s'inspire de leur esthetique cinematique dark, mais on l'eleve avec MD3 Expressive et l'interactivite.
