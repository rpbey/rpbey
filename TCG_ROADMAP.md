# RPB TCG — Roadmap pour un système parfait

## Commandes existantes

| Commande | Coût | Description | Canvas |
|---|---|---|---|
| `/gacha aide` | - | Guide complet du système TCG (embeds multi-pages) | Non |
| `/gacha daily` | - | Réclame tes pièces quotidiennes (80-1500🪙, 5 tiers, cooldown 20h, streaks) | Non |
| `/gacha gacha` | 50🪙 | Tirage x1 (30% miss, 35% commun, 22% rare, 10% SR, 3% légendaire) | **generateGachaCard** |
| `/gacha multi` | 450🪙 | Tirage x10 avec économie de 50🪙 | **generateMultiPullCard** |
| `/gacha wish <nom>` | - | Ajoute/retire une carte de ta wishlist (embed doré si drop) | Non |
| `/gacha wishlist` | - | Affiche ta wishlist avec status ✅/❌ | Non |
| `/gacha solde` | - | Profil économie : coins, streak, collection%, badges | **generateEconomyProfileCard** |
| `/gacha collection` | - | Grille visuelle de toutes tes cartes possédées | **generateCollectionCard** |
| `/gacha catalogue [série]` | - | Liste toutes les cartes disponibles, filtrable par série | Non (embed) |
| `/gacha vendre` | - | Vend 1 doublon (prix selon rareté) | Non |
| `/gacha vendre-tout` | - | Vend TOUS les doublons d'un coup | Non |
| `/gacha classement` | - | Top collectionneurs + top richesses | **generateGachaLeaderboardCard** |
| `/gacha taux` | - | Affiche les taux et mécaniques | Non (embed) |
| `/gacha duel @user` | - | Combat de cartes aléatoire 1v1 (finish message + coins) | **generateGachaDuelCard** |
| `/gacha dette` | - | Consulte ta dette et intérêts (15% daily si < 0) | Non |
| `/gacha parier <mise>` | variable | Quitte ou double (45% x2, 15% x3, 5% x5, 35% perdu) | Non |
| `/gacha admin-give @user <n>` | - | [ADMIN] Donner/retirer des pièces | Non |

**API Dashboard** : `GET /api/gacha/card?id=<id>` — génère l'image d'une carte (version legacy, pas encore alignée v4)

---

## Ce qui est fait (cette session)

- [x] Canvas carte TCG v4 : header bar + élément + HP, art window, type strip, attack box avec coût énergie, barres de stats horizontales, weakness/resistance, footer avec numérotation
- [x] Battle Edge : 6 losanges colorés en haut (signature Beyblade TCG)
- [x] Effet holographique foil : conic gradient arc-en-ciel sur SR+/Legendary/Secret
- [x] Full-art bleed : cartes SECRET avec art plein fond + overlay sombre
- [x] Holo seal : sceau circulaire arc-en-ciel "RPB" pour Rare+
- [x] Miss card : style "BURST OUT" avec cracks
- [x] Multi-pull : fond table de jeu + mini cartes TCG
- [x] Couleurs adaptatives Secret (texte blanc sur fond sombre)

---

## Plan pour rendre le TCG parfait

### Phase 1 — Contenu Drop 1 (priorité haute)

#### 1.1 Créer les 32 cartes du Drop 1
- [ ] Définir la liste des 16 personnages avec Berserk :
  - OG : Takao, Kai, Rei, Max
  - Metal : Gingka, Kyoya, Kenta, Tsubasa
  - Burst : Valt, Shu, Rantaro, Ken
  - X : Ekusu, Bird, Multi kawaii, Multi élégant
- [ ] Pour chaque perso : trouver/créer 1 image PNG officielle
- [ ] Pour chaque perso : commander 1 illustration artiste RPB
- [ ] Assigner les raretés (16C + 10R + 4SR + 2L = 32)
- [ ] Remplir les stats ATK/DEF/SPD/HP (max 142) pour chaque carte
- [ ] Assigner les éléments (FEU/EAU/TERRE/VENT/OMBRE/LUMIERE)
- [ ] Écrire les special moves et descriptions
- [ ] Seed la DB avec `prisma db seed` ou script dédié

#### 1.2 Activer le système de Drops
- [ ] Créer le GachaDrop "Personnages Principaux" en DB (season=1, dates, isActive)
- [ ] Lier les 32 cartes au drop via `dropId`
- [ ] Implémenter le numéro de carte dynamique (#001/032) dans le canvas au lieu de `#???/032`
- [ ] Ajouter la commande `/gacha drop` pour voir le drop actif (bannière, thème, timer de fin, progression)

#### 1.3 Script de seed des cartes
- [ ] Créer `scripts/seed-drop1.ts` avec toutes les cartes, stats, images
- [ ] Ajouter les images des personnages dans `bot/assets/cards/drop1/`
- [ ] Tester le rendu de chaque carte via l'API `/api/gacha/card`

---

### Phase 2 — Amélioration du gameplay (priorité haute)

#### 2.1 Duel v2 — Combat stratégique avec stats
Le duel actuel est un simple random pondéré par rareté. Il faut utiliser les vrais stats TCG :
- [ ] Utiliser ATK/DEF/SPD/HP au lieu du random rarity-based
- [ ] Tour par tour : le plus rapide (SPD) attaque en premier
- [ ] Dégâts = ATK attaquant - DEF défenseur (min 1)
- [ ] Premier à 0 HP perd
- [ ] Bonus élémentaire x1.25 si avantage (cycle feu>vent>terre>eau>feu)
- [ ] Canvas de duel amélioré : montrer les 2 cartes face à face avec barres HP animées
- [ ] Permettre au joueur de **choisir** sa carte au lieu d'aléatoire
- [ ] Mise optionnelle de coins (le gagnant prend tout)

#### 2.2 Échanges entre joueurs
- [ ] Nouveau modèle `CardTrade` dans le schema Prisma :
  ```
  CardTrade { id, fromUserId, toUserId, offeredCardId, requestedCardId, status (PENDING/ACCEPTED/DECLINED), createdAt }
  ```
- [ ] `/gacha echange @user <ta_carte> <sa_carte>` — proposer un échange
- [ ] Boutons Discord Accept/Decline pour confirmer
- [ ] Historique des échanges dans le profil
- [ ] Protection : pas d'échange de la dernière copie d'une carte

#### 2.3 Système de fusion / upgrade
- [ ] Fusionner 3 cartes identiques → upgrade la rareté (Common→Rare→SR→Legendary)
- [ ] `/gacha fusion <carte>` — fusionne 3 exemplaires
- [ ] Canvas spécial de fusion (les 3 cartes qui se combinent + animation sparkle)
- [ ] La carte fusionnée garde un marqueur "FUSION" visible sur le canvas

---

### Phase 3 — Canvas et visuels (priorité moyenne)

#### 3.1 Mettre à jour l'API Dashboard
- [ ] Synchroniser `/api/gacha/card/route.ts` avec le design v4 du bot (actuellement c'est l'ancien design v1)
- [ ] Réutiliser `generateGachaCard` du bot via un package partagé ou import cross-project

#### 3.2 Canvas Duel v2
- [ ] Redesign `generateGachaDuelCard` pour afficher les 2 mini cartes TCG face à face
- [ ] Barres HP visuelles
- [ ] Effet "VS" central avec sparks
- [ ] Afficher le type de finish (Burst/Xtreme/Over/Spin)

#### 3.3 Canvas Collection v2
- [ ] Redesign `generateCollectionCard` : chaque mini-carte utilise le style TCG (frame rarity, mini art)
- [ ] Ajouter un filtre par rareté/série/élément
- [ ] Pagination si > 30 cartes

#### 3.4 Canvas Profil v2
- [ ] Redesign `generateEconomyProfileCard` : style TCG avec breakdown par rareté, graphe de progression
- [ ] Montrer la carte la plus rare possédée en mini

#### 3.5 Animation de reveal
- [ ] Pour les cartes SR+ : envoyer une animation GIF/APNG de "pack opening" avant la carte
- [ ] Utiliser les VFX sprites de `/public/app-assets/vfx/` (lightning, sparkle sheets)
- [ ] Ou simplement un embed de suspense suivi de la carte

---

### Phase 4 — Économie et engagement (priorité moyenne)

#### 4.1 Boutique
- [ ] `/gacha boutique` — acheter des items spéciaux avec des coins :
  - Ticket garanti Rare+ (200🪙)
  - Ticket garanti SR+ (800🪙)
  - Pack de 5 tirages garantis sans miss (300🪙)
  - Changeur d'élément (500🪙) — change l'élément d'une carte
- [ ] Modèle `ShopItem` en DB ou config hardcodée

#### 4.2 Quêtes quotidiennes/hebdo
- [ ] `/gacha quetes` — 3 quêtes quotidiennes rotatives :
  - "Fais 3 tirages" → 50🪙
  - "Gagne 1 duel" → 100🪙
  - "Vends 2 doublons" → 30🪙
- [ ] Modèle `Quest` + `QuestProgress` en DB
- [ ] Récompenses bonus pour compléter les 3

#### 4.3 Événements limités
- [ ] Système d'événement temporaire (weekend double drop, happy hour -50% prix)
- [ ] `/gacha event` pour voir l'événement en cours
- [ ] Cron job pour activer/désactiver les événements

#### 4.4 Classement saisonnier
- [ ] Reset du classement chaque saison (=drop)
- [ ] Top 3 reçoivent des cartes exclusives ou badges spéciaux
- [ ] Historique des saisons passées

---

### Phase 5 — Dashboard web (priorité basse)

#### 5.1 Page Collection web
- [ ] Route `/dashboard/gacha` — voir sa collection dans le navigateur
- [ ] Grille de cartes interactives (hover pour zoom, click pour détails)
- [ ] Filtres par rareté/série/élément/possédé
- [ ] Statistiques de collection

#### 5.2 Page Catalogue web
- [ ] Route `/dashboard/gacha/catalogue` — toutes les cartes du drop actif
- [ ] Preview de chaque carte en grand format
- [ ] Marquer les cartes possédées vs manquantes

#### 5.3 Page Classement web
- [ ] Route `/dashboard/gacha/leaderboard` — top collectionneurs avec leurs raretés

#### 5.4 Album / Pokédex
- [ ] Vue "album" type Pokédex : silhouette noire pour les cartes non possédées
- [ ] Progression par série/rareté/élément
- [ ] Achievements et récompenses pour les complétionnistes

---

### Phase 6 — Technique et qualité (continu)

- [ ] Tests unitaires pour `pullCard()`, `rollRarity()`, `checkBadges()`
- [ ] Rate limiting sur les commandes gacha (anti-spam)
- [ ] Logs et analytics : tracking des tirages, taux réels vs théoriques
- [ ] Cache des images canvas (Redis ou mémoire) pour éviter de re-render les mêmes cartes
- [ ] Optimisation perf : les multi-pull chargent 10 images en parallèle (actuellement séquentiel)
- [ ] Partager le code canvas entre le bot et l'API dashboard (package interne ou symlink)
- [ ] Backup/export de la collection d'un joueur (JSON)

---

## Modèles DB à ajouter

```prisma
model CardTrade {
  id              String   @id @default(cuid())
  fromUserId      String
  toUserId        String
  offeredCardId   String
  requestedCardId String
  status          TradeStatus @default(PENDING)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([fromUserId])
  @@index([toUserId])
  @@map("card_trades")
}

enum TradeStatus {
  PENDING
  ACCEPTED
  DECLINED
  CANCELLED
}

model Quest {
  id          String   @id @default(cuid())
  type        String   // DAILY, WEEKLY
  title       String
  description String
  goal        Int      // nombre d'actions requises
  reward      Int      // coins reward
  createdAt   DateTime @default(now())

  @@map("quests")
}

model QuestProgress {
  id        String   @id @default(cuid())
  userId    String
  questId   String
  progress  Int      @default(0)
  completed Boolean  @default(false)
  claimedAt DateTime?
  date      DateTime @default(now()) // pour reset daily

  @@unique([userId, questId, date])
  @@map("quest_progress")
}
```

---

## Priorités suggérées

| Ordre | Tâche | Impact | Effort |
|---|---|---|---|
| 1 | Seed les 32 cartes Drop 1 | Critique — sans contenu le TCG n'existe pas | Moyen |
| 2 | Numéro de carte dynamique (#001/032) | Petit polish | Faible |
| 3 | Commande `/gacha drop` | Engagement — voir le timer et la progression | Faible |
| 4 | Duel v2 avec stats | Gameplay — rend les stats utiles | Moyen |
| 5 | Échanges entre joueurs | Social — crée de l'interaction | Moyen |
| 6 | Synchro API dashboard avec canvas v4 | Cohérence visuelle web/bot | Faible |
| 7 | Canvas Collection/Profil v2 | Polish visuel | Moyen |
| 8 | Boutique | Économie — sink de coins | Moyen |
| 9 | Quêtes quotidiennes | Rétention — raison de revenir chaque jour | Moyen |
| 10 | Fusion de cartes | Depth — progression long terme | Moyen |
| 11 | Dashboard web collection | Reach — accessibilité hors Discord | Élevé |
| 12 | Animation de reveal | Wow factor | Moyen |
