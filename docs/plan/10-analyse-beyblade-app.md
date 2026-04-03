# Analyse : Beyblade X App officielle (Hasbro)

Source : APK decompile (`/root/apk-analysis/`) — version 1.5.1

---

## 1. Vue d'ensemble

| Info           | Valeur                                     |
| -------------- | ------------------------------------------ |
| Package        | `com.hasbro.BeybladeX`                     |
| Version        | 1.5.1                                      |
| Moteur         | Unity 3D (IL2CPP)                          |
| Taille         | 689 Mo                                     |
| Orientation    | Paysage                                    |
| Multijoueur    | Photon Realtime (PvP temps reel)           |
| Scan physique  | OpenCV + ZXing (scan cartes/QR)            |
| Audio          | FMOD Studio                                |
| 125 ecrans UI  | Unity prefabs                              |

---

## 2. Systemes de jeu (ce qui nous interesse)

### Features principales
- **Battle** : Combat PvP temps reel (Photon), selection d'arene, resolution d'attaque
- **Collection** : BeyLocker (inventaire), 249 900 combinaisons possibles (84 blades x 35 ratchets x 85 bits)
- **Battle League** : Ligues competitives avec classement
- **Season Track** : Battle pass saisonnier avec recompenses
- **Clans** : Creation d'equipe, settings, recrutement
- **Social** : Liste d'amis, ajout ami, echange (trade)
- **Badges** : Systeme d'achievements
- **Augments** : Modificateurs combinables (combos)
- **World Events** : Evenements mondiaux temporaires
- **Shop** : Boutique avec historique de transactions
- **Video** : Lecteur video integre (Brightcove)

### 125 ecrans UI identifies
- **Combat** : ArenaSelection, AttackResolution, BeybladeSelection, DeckLoadout
- **Collection** : BadgesSelection, Inventory, BeyCollection, ItemDetail
- **Social** : AddFriend, ClanCreate, ClanSettings, FriendList
- **Progression** : EventDetail, EventMap, Challenge, League, Ranking, SeasonTrack
- **Boutique** : Shop, Store, TransactionHistory

### Types Beyblade (code couleur)
| Type       | Couleur | Element | Emoji |
| ---------- | ------- | ------- | ----- |
| Attaque    | Rouge   | Feu     | 🔴    |
| Defense    | Bleu    | Glace   | 🔵    |
| Endurance  | Vert    | Vent    | 🟢    |
| Equilibre  | Violet  | Terre   | 🟣    |

---

## 3. Design visuel (analyse des assets)

### Palette de couleurs de l'app

L'app Hasbro utilise un **light theme** (fond clair bleu-gris) contrairement a notre dark theme.

| Element              | Couleur observee                              | Usage                        |
| -------------------- | --------------------------------------------- | ---------------------------- |
| Fond panels          | Bleu-gris clair (`~#c8d8e4`)                 | Badges panel, popups         |
| Fond gradient border | Bleu sombre (`~#0d2847`) + glow bleu edges   | Conteneurs principaux        |
| Accent principal     | Vert lime (`~#8bc34a`)                        | Boutons, Battle League logo  |
| Accent secondaire    | Jaune (`~#f7d301`)                            | Prix, tickets, rewards       |
| Texte principal      | Noir/gris fonce                               | Sur fond clair               |
| Texte accents        | Blanc                                         | Sur fond colore              |
| Glow effects         | Vert lime + blanc                             | Barres, highlights           |

### Formes et composants

**Boutons** :
- Forme **trapezoidale/parallelogramme** avec coins coupes en diagonale — PAS rectangulaires, PAS pill
- Pattern: texture halftone dots visible sur le fond des boutons (style manga/comic)
- Le bouton principal (BTN-Main-ON) est vert lime avec motif X integre
- Les boutons collab sont des **hexagones coupes** (coins 45°) avec rayures diagonales

**Cards/Containers** :
- Forme **hexagonale coupee** (coins haut-gauche et bas-droit coupes a 45°) — signature visuelle
- Fond gris avec rayures diagonales en arriere-plan
- Pas de border-radius — tout est angulaire/coupe

**Popups** :
- 9-slice avec coins coupes (haut-gauche et bas-droit)
- Fond gris fonce semi-transparent
- Speed lines en arriere-plan (lignes diagonales de vitesse)

**HUD / Barres** :
- Barres de progression avec forme trapezoidale (pas rectangulaire)
- Burst meter avec glow dynamique
- Profil avec burst effect integre

**Frames portrait** :
- Collection de 30+ frames thematiques : Fire, Diamond, Electric, Crystal, Aztec, Candy, etc.
- Forme losange/diamant avec le X de Beyblade X en fond
- Chaque frame a un effet unique (flammes, eclairs, cristaux, etc.)
- Systeme de rarete/deblocage via seasons et achievements

### Effets visuels

| Effet                  | Implementation                                      | Ou                          |
| ---------------------- | --------------------------------------------------- | --------------------------- |
| Speed lines            | Lignes diagonales dans les panels                   | Popups, badges panel        |
| Glow bar               | Barre blanche avec glow vert lime diffus            | Separateurs, headers        |
| Burst sparks           | Sequence 8 frames d'etincelles                      | Ecran de combat             |
| Halftone dots          | Pattern de points demi-teinte                        | Boutons, backgrounds        |
| Arena hexagons         | Grille hexagonale cyan avec glow neon               | Fond d'arene                |
| Gradient border        | Bordure avec glow bleu diffus                       | Conteneurs principaux       |
| Splash screen          | Radial gradient blanc vers gris (vignette inversee) | Loading                     |
| Fire/Ice/Wind/Earth    | Effets elementaires par type de Beyblade            | Cutscenes d'attaque         |

### Typographie
- **Sans-serif bold** pour les titres (style Impact/condensed)
- **Italic** frequent pour le dynamisme
- Texte en **MAJUSCULES** pour les labels importants (BATTLE LEAGUE, etc.)

---

## 4. Ce qu'on prend pour RPB

### Concepts de gamification
- [x] **Season Track / Battle Pass** → Notre systeme TCG drops a deja ca
- [x] **Badges/Achievements** → A implementer dans le dashboard
- [x] **Classement / League** → Deja en place (rankings)
- [x] **Clans/Equipes** → Potentiel futur
- [x] **Frames de profil** → Excellente idee pour recompenses communautaires

### Elements de design a adapter

| Element app Hasbro         | Adaptation RPB (MD3 Expressive)                        |
| -------------------------- | ------------------------------------------------------ |
| Coins coupes 45°           | **Non** — on garde les rounded MD3 Expressive (pill/16px/28px) |
| Speed lines background     | **Oui** — deja prevu dans notre design system (conic-gradient rotatif) |
| Halftone dots pattern      | **Possible** — en subtle overlay sur les sections hero |
| Glow bars                  | **Oui** — adapte en rouge/orange au lieu de vert       |
| Burst sparks               | **Oui** — pour les moments de celebration (gacha pull, win) |
| Hexagonal arena grid       | **Oui** — en background subtil pour les sections tournois |
| Frame portraits            | **Oui** — excellent pour les profils communautaires    |
| Type color coding          | **Oui** — deja en place (ATK rouge, DEF bleu, STA vert, BAL violet) |
| Gradient border glow       | **Oui** — adapte avec glow rouge/orange               |

### Ce qu'on fait DIFFEREMMENT

| Hasbro app                    | RPB                                            | Pourquoi                            |
| ----------------------------- | ---------------------------------------------- | ----------------------------------- |
| Light theme bleu-gris         | **Dark theme gris chaud** #1d1b1b              | Plus premium, gaming-friendly       |
| Formes angulaires/coupees     | **Formes arrondies MD3 Expressive**            | Plus moderne, plus fluide           |
| Vert lime accent              | **Rouge/Orange/Jaune** #ce0c07/#e68002/#f7d301 | Identite RPB distincte              |
| Unity app native              | **Web app Next.js**                            | Accessible sans install             |
| Paysage uniquement            | **Portrait-first + responsive**                | Mobile-first web                    |
| Statique (pas d'animations spring) | **Spring physics MD3 Expressive**         | Plus vivant et premium              |
| Pas de parallax/scroll FX     | **Stagger reveals + parallax**                 | Experience immersive au scroll      |

---

## 5. Idees d'implementation inspirees de l'app

### Profile Frames System
L'app a 30+ frames portrait (Fire, Diamond, Electric, Crystal, etc.). On pourrait creer un systeme similaire :

```
Frame raretes :
- Common     : Bordure simple rouge
- Rare       : Bordure avec glow orange
- Epic       : Bordure animee gradient RPB
- Legendary  : Bordure avec particules + shimmer
```

Deblocage par :
- Participation tournois
- Rang dans le classement
- Saisons TCG
- Achievements communautaires

### Battle/Tournament Visual Language
L'image `battle-img-quickbattle.png` montre 2 toupies face a face avec sparks et energy trails au centre. On peut reproduire ce layout pour :
- La page tournoi (match preview)
- Les resultats de combat
- Le comparateur de decks

### Arena Background
L'arene hexagonale avec grille neon cyan est visuellement forte. On peut adapter :
- Grille hexagonale en overlay tres subtil sur les sections tournois
- Glow rouge au lieu de cyan pour matcher notre palette
- Animation lente de pulse sur la grille

### Halftone Dots Pattern
Le pattern manga/halftone dots sur les boutons donne un côte dynamique. Implementable en CSS :
```css
.rpb-halftone::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px);
  background-size: 6px 6px;
  pointer-events: none;
}
```

### Season XP / Reward Badges
L'app utilise des icones `200SeasonXP`, `250SeasonXP`, `500SeasonXP`. On peut creer un systeme similaire avec :
- XP communautaire (participation, events, TCG)
- Badges deblocables par palier
- Affichage sur le profil utilisateur

---

## 6. Assets reutilisables

### Deja extraits et disponibles
- **1 097 sprites** dont les icones de types (Attack/Defense/Stamina/Balance)
- **2 765 textures** PBR des pieces (blades, ratchets, bits)
- **995 modeles 3D** (OBJ) des pieces
- **51 portraits** et **30+ frames** thematiques
- **VFX sprites** (sparks, trails, glows)

### Pour le dashboard RPB
- Les icones de types sont utilisables directement
- Les textures produit peuvent enrichir les pages collection
- Les frames portrait inspirent le design de profil
- Les VFX inspirent les animations CSS

---

## 7. Resume

L'app Beyblade X Hasbro est une **app gaming complete** avec battle PvP, collection, leagues, et season pass. Son design est **angulaire/coupe** (style mecha/tech) avec un **light theme bleu-gris** et accent **vert lime**.

Notre approche RPB est **fondamentalement differente** :
- **Dark theme premium** vs light theme casual
- **Formes arrondies MD3 Expressive** vs angles coupes
- **Rouge/Orange/Jaune** vs vert lime
- **Web app communautaire** vs app gaming native
- **Spring animations** vs statique

On s'inspire de leurs **systemes** (leagues, badges, frames, season track) mais on les habille avec notre propre identite visuelle plus mature et premium.
