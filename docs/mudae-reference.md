# Mudae — Référence complète des mécaniques

> Documentation de référence du bot Discord **Mudae** (par Saya), utilisée comme inspiration pour le système gacha RPB.

---

## 1. Vue d'ensemble

Mudae est un bot Discord de **gacha de personnages** : les joueurs lancent des roulettes pour obtenir des personnages d'anime/manga/jeux vidéo, les clament via réactions emoji, et construisent un "harem" (collection). L'économie tourne autour des **kakera** (cristaux monétaires) et des **clés** (niveaux de loyauté).

---

## 2. Commandes de roll

Les personnages sont divisés en deux roulettes (**Animanga** et **Games**) et deux genres (**Waifu/female** et **Husbando/male**) :

| Commande | Slash | Description |
|----------|-------|-------------|
| `$w` / `$waifu` | `/wx` | Waifu aléatoire (toutes sources) |
| `$wa` | `/wa` | Waifu animanga uniquement |
| `$wg` | `/wg` | Waifu jeux uniquement |
| `$h` / `$husbando` | `/hx` | Husbando aléatoire (toutes sources) |
| `$ha` | `/ha` | Husbando animanga uniquement |
| `$hg` | `/hg` | Husbando jeux uniquement |
| `$m` / `$marry` | `/mx` | Personnage aléatoire (tout genre, toutes sources) |
| `$ma` | `/ma` | Tout personnage animanga |
| `$mg` | `/mg` | Tout personnage jeux |
| `$mk` | `/mk` | Roll un personnage claimé avec kakera garanti (+30%). **Premium only.** |

> Les slash commands ne peuvent pas être d'une seule lettre, d'où le `x` pour les rolls combinés (`/wx`, `/hx`, `/mx`).

---

## 3. Mécanique de claim

- Quand un personnage est rollé, les joueurs doivent **réagir avec un emoji cœur** (ou emoji custom via `$claimreact`) dans un temps limité.
- **Temps de réaction** par défaut : **30 secondes** (configurable via `$settimer`, range 10-45s).
- Les slash commands donnent **2× le temps de réaction** (ex: 60s par défaut).
- Chaque joueur a **1 claim par intervalle de 3 heures** par défaut (configurable via `$setclaim`, range 60-600 min).
- `$marryup` (`$mu`) montre le temps restant avant le prochain claim.

### Snipe Protection (`$togglesnipe`)

| Mode | Comportement |
|------|-------------|
| 0 | Aucune restriction (tout le monde peut claim sur n'importe quel roll) |
| 1 | Les personnages wished ne peuvent pas être snipés pendant 8s |
| 2 | Tous les personnages protégés pendant 8s |
| 3-6 | Variantes basées sur les wishes |

### Claim Reset (`$resetclaimtimer` / `$rt`)

Débloqué par le badge **Emerald I**. Permet de claim à nouveau avant l'expiration du timer normal.

| Niveau Emerald | Cooldown $rt |
|----------------|-------------|
| I | 50 heures |
| II | 40 heures |
| III | 30 heures |
| IV | 20 heures |

Réductible davantage via Kakera Loots.

---

## 4. Limites de rolls et resets

### Rolls de base par heure

| Gamemode | Sans Premium | Server Premium I | Server Premium II |
|----------|-------------|-------------------|---------------------|
| Mode 2 | 8 | 10 | 13 |
| Mode 1 (nouveaux serveurs) | 10 | 15 | 18 |
| Mode 1 (anciens serveurs) | 13 | 15 | 18 |

### Rolls supplémentaires (par joueur)

| Source | Bonus |
|--------|-------|
| Sapphire I-IV | +1 par niveau (+4 total) |
| Ruby IV | +2 |
| Kakera Tower Perk 11 | +1 par niveau (jusqu'à +10) |
| Kakera Loots | Infini (de plus en plus rare) |
| Player Premium I | +8 |
| Player Premium II | +2 de plus (+10 total) |

### Resets de rolls

- `$rolls` — Utilise un reset stocké pour récupérer tous les rolls de l'heure.
- `$daily` — Collecte un reset (utilisable toutes les 20h, nécessite 5+ personnages en likelist).
- `$vote` — Vote sur top.gg pour gagner des resets.

---

## 5. Système Kakera (économie/monnaie)

Les kakera sont des cristaux colorés servant de monnaie dans Mudae.

### 5.1 Gagner des Kakera

#### Daily Kakera (`$dk` / `$dailykakera`)

Toutes les 20 heures (10h avec Premium I/II, 7h avec Premium III).

| Tier | Valeur | Fréquence |
|------|--------|-----------|
| Tier 1 | 150-270 | ~80.7% |
| Tier 2 | 300-419 | ~15.5% |
| Tier 3 | 700-820 | ~3.0% |
| Tier 4 | 1000-1299 | ~0.7% |

#### Réactions Kakera (sur les rolls)

Quand un personnage claimé est rollé, un cristal kakera peut apparaître. Les joueurs réagissent pour le collecter.

| Couleur | Valeur |
|---------|--------|
| Violet | 100 (gratuit, pas de coût en power) |
| Bleu | 101-150 |
| Turquoise | 171-220 |
| Vert | 251-300 |
| Jaune | 401-500 |
| Orange | 701-800 |
| Rouge | 1401-1601 |
| Arc-en-ciel | 3001-3100 |
| Lumière | Se divise en 3-4 kakera séparés |
| Sombre | Chance égale de devenir n'importe quelle couleur |
| Chaos | Récompenses variées : kakera, orosphères, rolls, bonus |

- Réagir aux kakera coûte du **power** (sauf Violet). Le power se régénère à 10% par 30 minutes.
- **Sapphire IV** : Tous les kakera bleus deviennent jaunes.
- **Silver Key (3+ clés)** : Tous les kakera turquoise et verts deviennent orange.

#### Autres sources

- **Divorcer** un personnage retourne sa valeur kakera.
- **Bronze IV** : +500 kakera quand tu claim ton wish.
- **Silver IV** : +200 kakera quand quelqu'un d'autre claim ton wish.
- **Emerald IV** : Claimer n'importe quel personnage donne sa valeur kakera.
- **Gold Keys (6+)** : Roller ton propre personnage avec gold key donne sa valeur kakera (cap 4500/3h).

### 5.2 Dépenser des Kakera

#### Badges Kakera (7 types, 4 niveaux chacun)

| Badge | Coût base (x) | Effet résumé |
|-------|---------------|--------------|
| Bronze | x=1000 | +1 slot wishlist/niveau ; IV: +500 kakera sur wish claim |
| Silver | x=2000 | +25% taux d'apparition wish/niveau ; IV: +200 kakera quand autres clament ton wish |
| Gold | x=3000 | -10% coût power kakera/niveau ; IV: `$dk` restaure le power |
| Sapphire | x=5000 | +1 roll/niveau ; IV: Bleu → Jaune |
| Ruby | x=7000 | I: +2 wish slots, II: +50% wish, III: -20% power +2 rolls, IV: -25% prix badges |
| Emerald | x=9000 | Débloque `$rt` ; -10h cooldown/niveau ; IV: claims donnent kakera |
| Diamond | x=12000 | +1 `$ouroharvest`/niveau ; IV: +1 `$ourochest`/jour |

Coût total d'un badge (niveaux I-IV) : **10x** (1x + 2x + 3x + 4x).

#### Kakera Tower (`$kt`)

Étages infinis avec coût croissant. Chaque étage choisit un perk parmi :

1. +2 slots wishlist
2. +50% chance starwish spawn (rendements décroissants)
3. Plus de slots disablelist / meilleurs limites limroul
4. Double chance de clé sur personnages wished
5. Révèle 2 boutons aléatoires pour `$oh`
6. +30 sphères au claim
7. Augmente le max kakera power au-delà de 100%
8. Diminue le coût power des réactions kakera
9. Augmente le cap kakera gold/chaos key
10. Plus de kakera des réactions Light
11. +1 roll par heure (jusqu'à +10)
12. Débloque `$colormm` et `$colorpr`

Peut être détruit (`$destroy`) pour remboursement total.

#### Kakera Loots (`$kl`)

Lootboxes aléatoires achetées avec du kakera. Récompenses : rolls bonus, kakera, meilleur cooldown `$rt`, plus de capacité disablelist, rolls permanents, slots wishlist, niveaux wishprotect, mudapins.

---

## 6. Wishlist

### Commandes

| Commande | Description |
|----------|-------------|
| `$wish <personnage>` | Ajouter un wish |
| `$wishd` | Wish + auto-suppression du message |
| `$wishl` | Wish verrouillé (immune à `$wishpurge`) |
| `$wishk` | Wish pour kakera extra (désactive les pings) |
| `$starwish` / `$sw` | Wish spécial avec taux de spawn boosté |
| `$wishseries` / `$ws` | Wish pour une série entière (Premium only) |

### Slots de base : **7**

| Source | Bonus |
|--------|-------|
| Bronze I-IV | +1 par niveau (+4) |
| Ruby I | +2 |
| Kakera Tower Perk 1 | +2 par niveau (infini) |
| Player Premium I | +18 |
| Player Premium II | +5 de plus (+23 total) |

### Taux de spawn wish

| Source | Bonus |
|--------|-------|
| Silver I-IV | +25% par niveau (+100% total) |
| Ruby II | +50% |
| Slash commands | +10% |
| Kakera Tower Perk 2 | +50% (premier étage), rendements décroissants |
| Boostwish | +20%/+15%/+10%/+5%/+1% (tiers par nombre de rolls) |

Taux de base : **1/pool** (pool = nombre de personnages rollables). Désactiver des personnages réduit le pool, boostant les taux de wish.

---

## 7. Clés et Soulmates

### Gagner des clés

Roller un personnage que tu possèdes déjà = +1 clé.

### Niveaux de clés

| Niveau | Couleur | Récompense |
|--------|---------|-----------|
| 1 | Bronze | Débloque `$embedcolor` |
| 2 | Bronze | +10% valeur kakera |
| 3 | Silver | Turquoise/Vert kakera → Orange |
| 4-5 | Silver | +10% valeur kakera chacun |
| 6 | Gold | Roller le personnage donne sa valeur kakera (cap 4500/3h) |
| 7-9 | Gold | +10% valeur kakera chacun |
| 10 | Chaos | Réactions kakera coûtent moitié power. Personnage devient **Soulmate**. |
| 25 | Chaos | 25% chance de 2ème réaction kakera |
| 50 | Chaos | Purple/Red/Rainbow réactions donnent +75% kakera |
| 100 | Chaos | 50% chance de 2ème réaction kakera |
| 500 | Chaos | 100% chance de 2ème réaction kakera |

---

## 8. Commandes timer / cooldown

| Commande | Slash | Description |
|----------|-------|-------------|
| `$mu` / `$marryup` | `/rollsutil marryup` | Temps avant prochain claim |
| `$ru` / `$rollsup` | `/rollsutil rollsup` | Rolls restants avant reset |
| `$tu` / `$timersup` | `/rollsutil timersup` | Tous les timers fusionnés |
| `$ku` / `$kakeraup` | — | Temps avant régénération power kakera |
| `$dk` / `$dailykakera` | `/dk` | Daily kakera (20h cooldown) |
| `$rt` / `$resetclaimtimer` | — | Reset claim timer |

---

## 9. Gestion du harem

| Commande | Description |
|----------|-------------|
| `$mm` / `$mymarry` | Voir son harem (jusqu'à 12000 personnages) |
| `$fm` / `$firstmarry` | Définir son personnage favori |
| `$sm` / `$sortmarry` | Trier le harem |
| `$divorce` | Divorcer un personnage (récupère kakera) |
| `$divorceseries` | Divorcer tous les personnages d'une série |
| `$divorceall` | Divorcer tout le harem |
| `$note` | Ajouter une note à un personnage |
| `$changeimg` / `$c` | Changer l'image affichée |
| `$alias` / `$a` | Changer le nom affiché |
| `$like` / `$l` | Ajouter à la like list |
| `$likelist` / `$ll` | Voir la like list (5+ = débloque `$daily`) |
| `$pr` / `$profile` | Voir ses stats personnelles |

---

## 10. Échanges et dons

| Commande | Description |
|----------|-------------|
| `$marryexchange` / `$trade` | Échanger des personnages (peut inclure kakera) |
| `$give` | Donner un personnage |
| `$givekakera` / `$givek` | Donner des kakera |

### Enhanced Multitrade

Débloqué après avoir dépensé 8000 kakera en badges :
- Supprime les limites de dons
- Permet les échanges inégaux
- Permet d'échanger personnages contre kakera

Sans multitrade : les destinataires ne peuvent recevoir qu'un don gratuit toutes les 12h.

> Les personnages échangés/donnés ne peuvent pas gagner de clés pendant 3 heures (anti-alt-farming).

---

## 11. Bonus des slash commands

Les slash commands (`/wx`, `/mx`, etc.) donnent :
- **+10% kakera** gagnés des réactions, Bronze IV, et Emerald IV
- **+10% taux de spawn wish** (additif)
- **2× temps de réaction** (tant que personne ne flood entre les rolls)

---

## 12. Configuration serveur (Admin)

| Commande | Description |
|----------|-------------|
| `$setrare` | Rareté d'apparition des personnages claimés (1-10, max 4 sans premium) |
| `$settimer` | Temps de réaction claim (10-45 secondes) |
| `$setrolls` | Nombre de rolls serveur |
| `$setclaim` | Intervalle de claim (60-600 minutes) |
| `$shifthour` | Décaler l'heure de reset claim (0-2) |
| `$haremlimit` | Taille max du harem (15-8100) |
| `$gamemode` | Mode 1 (défaut) vs Mode 2 (pool limité) |
| `$togglesnipe` | Restrictions de snipe (7 modes) |
| `$togglehentai` | Désactiver les séries hentai |
| `$serverdisable` / `$sd` | Désactiver des séries spécifiques |
| `$badgevalue` | Changer les prix des badges |
| `$towervalue` | Changer le coût de base des étages de la tour (5000-50000) |

---

## 13. Calcul de la valeur kakera

La valeur kakera d'un personnage dépend de :

1. **Claim rank** — popularité par nombre de claims
2. **Like rank** — nombre de `$like`s reçus
3. **Nombre de clés** — investissement du propriétaire
4. **Total de personnages claimés** sur le serveur — inflation (plus = valeurs plus hautes)

---

## 14. Premium

### Player Premium (Patreon)

| Tier | Avantages |
|------|-----------|
| Premium I | +8 rolls, +18 wish slots, +5 wishseries, +1 `$mk`, `$dk` toutes les 10h (stackable 2×) |
| Premium II | +2 rolls, +5 wish slots, +5 wishseries, +1 `$mk` |
| Premium III | `$dk` toutes les 7h (stackable 3×) |

### Server Premium

| Tier | Avantages |
|------|-----------|
| Premium I | Plus de rolls de base, `$setclaim` min 120 min |
| Premium II | Encore plus de rolls, `$setclaim` min 60 min, +1 `$mk` pour tous |
| Premium III | +3 `$mk` pour tous |

---

## Leçons clés pour le gacha RPB

### Ce qui rend Mudae addictif

1. **Timers et cooldowns** — Les joueurs reviennent régulièrement (claims toutes les 3h, daily toutes les 20h)
2. **Wishlist avec notifications** — L'excitation quand ton wish apparaît
3. **Économie multicouche** — Kakera, clés, badges, tower = progression longue durée
4. **Échanges sociaux** — Trading, dons, et compétition entre joueurs
5. **Pity system implicite** — Le pool se réduit à mesure que tu claims, augmentant les chances
6. **Investissement émotionnel** — Les clés récompensent la fidélité à un personnage
7. **Progression visible** — Badges, niveaux, profil stats

### Mécaniques à adapter pour RPB

- [x] Daily avec tiers de récompense
- [x] Wishlist avec embed spécial
- [x] Système de badges/milestones
- [x] Streak quotidien
- [ ] **Échanges entre joueurs** (trade cards + currency)
- [ ] **Pity system** (garantie après N ratés)
- [ ] **Cooldown sur les pulls** (comme les rolls limités par heure)
- [ ] **Vue détaillée d'une carte** (comme `$im` de Mudae)
- [ ] **Drop info** (info sur le drop actif)
- [ ] **Clés / loyauté** (rolls de doublons = progression sur la carte)
