# Deep Dive : Beyblade X Takara Tomy — IL2CPP Dump

Source : global-metadata.dat (14 Mo) + Unity bundles decompiles

---

## 1. Metadata IL2CPP

| Metrique                    | Valeur   |
| --------------------------- | -------- |
| Strings totales             | 114 718  |
| Strings liees au jeu        | 20 502   |
| Classes de jeu identifiees  | 3 569    |
| Ecrans UI identifies        | 159      |
| Systeme de battle            | 588 strings |
| Systeme de collection       | 598 strings |
| Systeme de rewards/points   | 304 strings |
| Systeme de scan/BeyCode     | 167 strings |
| Systeme de customisation    | 92 strings |
| Systeme de ranking          | 48 strings |
| Systeme MassPro/RareBey     | 14 strings |
| Systeme social              | 21 strings |

---

## 2. Architecture des ecrans (159 scenes)

### Flow principal

```
AppLauncher
  ├── SplashScreen
  ├── FTUE (First Time User Experience) / Tutorial
  └── Home
       ├── Battle
       │   ├── EventBattle (Evenements)
       │   │   ├── DeckSelect
       │   │   ├── EnemyDescription
       │   │   ├── Entry
       │   │   ├── Menu
       │   │   ├── ResultList
       │   │   ├── ResultPoint
       │   │   └── ResultSelect
       │   ├── RankBattle (Classement)
       │   │   ├── DeckSelect
       │   │   ├── Entry / EntryEnd
       │   │   ├── Menu
       │   │   ├── ResultList
       │   │   ├── ResultPoint
       │   │   └── ResultSelect
       │   ├── SimBattle (Simulation)
       │   │   └── SimBattleEvList
       │   ├── CloudMatch (PvP en ligne)
       │   │   └── GetReward
       │   └── RareBeyGetBattle (Obtention de toupies rares)
       │       ├── RareBeyGetBattleRenda
       │       └── RareBeyGetBattleShoot
       │
       ├── Collection
       │   ├── BeybladeCollection (par type: BX, UX, CX, Convention, Reprint, Other)
       │   ├── BeyCustomize
       │   │   ├── HeadParts / BaseParts / BitParts
       │   │   └── DeckCustomize
       │   └── CxBladeCustomize
       │
       ├── Scan / BeyCode
       │   ├── BarCodeScanner
       │   ├── BeyQR / BeyQRSample
       │   ├── BeyCodeRead
       │   └── BattlePassScan (scan quotidien)
       │
       ├── BattlePass
       │   ├── ConnectKill / DataConnecting / DataLoad
       │   ├── LoadSelect / LoadTop
       │   ├── OldRegistered / Registered
       │   └── WaitingDoubleClick
       │
       ├── Ranking
       │   ├── GlobalRanking / PlaceRanking
       │   ├── RankingShop (boutique de rang)
       │   └── RankingState
       │
       ├── Profile (Blader)
       │   ├── BladerNameRegistration
       │   ├── ChangeBladersName
       │   └── Badge
       │
       └── Settings
           ├── Enquete (sondages)
           ├── PIICollection (donnees perso)
           └── TransferOrCreate (transfert de compte)
```

---

## 3. Systeme de Battle (588 strings)

### 4 modes de combat

| Mode               | Description                                        | Ecrans                     |
| ------------------ | -------------------------------------------------- | -------------------------- |
| **EventBattle**    | Evenements temporaires avec enemies scriptes        | 7 scenes (deck, entry, result) |
| **RankBattle**     | Combats classes, affecte le ranking                 | 7 scenes                   |
| **SimBattle**      | Simulation de combat (IA vs IA ou test)             | Via SimBattleEvList        |
| **CloudMatch**     | PvP en ligne (gRPC)                                 | Match + GetReward          |
| **RareBeyGetBattle** | Combat special pour obtenir une toupie rare       | Renda + Shoot              |

### Donnees de combat

```
BattleId, BattleIndex, BattleAt, BattleExecAt
BattleDate, BattleDateDisplay, BattleDayOfWeekDisplay
BattleEnable, BattleEndAt, BattleExpiresDate
BattleFinish, BattleLogic
BattleResults, BackgroundBattle
BackgroundBattleWin, BackgroundBattleAnimeWin
BackgroundBattleBeybladerWin, BackgroundBattleChampion
BackgroundBattleThroughPreliminaries
```

> **Observation** : Le systeme de battle est tres structure avec des dates de debut/fin, des index, et des backgrounds dynamiques par resultat. RPB pourrait s'inspirer de cette granularite pour les tournois.

---

## 4. Systeme de Scan / BeyCode (167 strings)

### 3 methodes de scan

| Methode          | Classe                    | Description                            |
| ---------------- | ------------------------- | -------------------------------------- |
| **BLE/NFC**      | UnityBluetoothLE          | Lecture puce NFC dans la toupie physique |
| **BeyCode QR**   | BeyQR, BarCodeScanner     | Scan QR code sur l'emballage            |
| **BeyCode texte**| BeyCodeRead               | Saisie manuelle du code produit         |

### Flow de scan

```
OnTapScanButton
  ├── StartScanRequest
  ├── BeyCodeRead (lecture code)
  │   ├── BeyCodeRead > ConnectionCompleteDialog
  │   ├── BeyCodeRead > DataLoadDialog
  │   └── BeyCodeRead > ShowResultDialog
  ├── BattlePassScan (scan quotidien pour XP)
  └── OnTapReadBeyCodeLaterButton (reporter)
```

### BeyCode = identifiant unique

Chaque toupie Takara a un **BeyCode** — un identifiant unique lie au produit physique. L'app lit ce code (NFC, QR ou manuel) pour :
1. Enregistrer la toupie dans la collection
2. Debloquer les stats reelles
3. Activer le BattlePass scan quotidien
4. Gagner des BeyPoints

> **Pour RPB** : On pourrait implementer un systeme similaire avec QR codes sur les cartes TCG ou un code de collection lie a chaque profil.

---

## 5. Systeme de Collection (types)

```
BeybladeCollectionType:
  ├── AllProducts    — Toutes les toupies
  ├── Bx             — Serie BX (Beyblade Xtreme)
  ├── Ux             — Serie UX (Ultimate Xtreme)
  ├── Cx             — Serie CX (Custom Xtreme)
  ├── Convention     — Exclusives evenements
  ├── Reprint        — Reexemplaires
  ├── Other          — Autres
  ├── Customize      — Customisees par l'utilisateur
  └── Display        — Mode d'affichage
```

La collection distingue les **series officielles** (BX, UX, CX) des **customisees** et **exclusives**. Le PullDownController suggere un dropdown de filtre par type.

---

## 6. Systeme de Customisation (92 strings)

### Pieces customisables

```
CustomizeHeadParts    — Blade (tete)
CustomizeBaseParts    — Ratchet (base)
CustomizeBitParts     — Bit (pointe)
CustomizeDeck         — Deck complet

CxBladeCustomize      — Customisation speciale CX (overlay blade)
ConvertCxBladeToCustomizedBlade — Conversion CX vers custom
```

### Modele 3D

```
BeyModel
  ├── BeyModelBitSet      — Assemblage du bit
  ├── BeyModelBox         — Boite/conteneur
  ├── BeyModelContainer   — Conteneur de modele
  ├── BeyModelPlace       — Placement dans la scene
  ├── ModelBitAngleOffset  — Offset angulaire du bit
  ├── ModelBladeAngleOffset — Offset angulaire du blade
  └── ModelBladeYOffset    — Offset vertical du blade
```

> La customisation Takara est **3D en temps reel** — l'utilisateur assemble les pieces et voit le rendu. Notre builder de deck fait ca en 2D, on pourrait envisager un rendu 3D futur avec les modeles OBJ extraits de la version Hasbro.

---

## 7. Systeme de Rewards / Economie (304 strings)

### Monnaies

| Monnaie          | Usage                                              |
| ---------------- | -------------------------------------------------- |
| **BeyPoints**    | Monnaie principale, gagnee par scan et combat      |
| **Tickets**      | Acces aux evenements speciaux                      |
| **Coupons**      | Reduction pour RareBeyGetBattle                    |

### Sources de BeyPoints

```
BeyPointGet                    — Gain generique
BeyPointsEarned                — Points gagnes (affichage)
BeyPointsEarnedTimesInThisWeek — Compteur hebdomadaire
ChargingBeyPoints              — Chargement/achat de points
BattlePassPoint                — Points via BattlePass
BattlePassPointGet             — Gain via BattlePass
```

### BattlePass / Scan quotidien

```
BattlePassScan                 — Scan quotidien de toupie
BattlepassScanDailyLimit       — Limite quotidienne de scans
BattlepassScanLimit            — Limite totale
DailyScanCount                 — Compteur quotidien
```

> Le BattlePass Takara est lie au **scan physique quotidien** — scanner sa toupie chaque jour donne des points. C'est une mecanique de retention geniale.

### Rewards

```
CallReceiveRewards             — Recevoir les recompenses
AutoReceivedRewardsDescription — Description auto
BonusRewards                   — Bonus
ChallengeRewards               — Recompenses de defi
CallCloudmatchGetReward        — Recompense PvP
CallMessageGetReward           — Recompense message
```

---

## 8. Systeme RareBey (14 strings dedies)

```
RareBey                        — Systeme de toupies rares
RareBeyAttention               — Avertissement
RareBeyHowToPlay               — Comment jouer
RareBeyRuby                    — Monnaie/ressource rare
RareBeyToggle                  — Activation

ExecRareBeyGetBattle           — Executer un combat rare
StartRareBeyGetBattle          — Demarrer (normal)
StartMyRareBeyGetBattle        — Demarrer (perso)
StartRareBeyGetBattleGlobal    — Demarrer (global)

RareBeyGetBattleRenda          — Phase de rendu (animation)
RareBeyGetBattleShoot          — Phase de tir (gameplay)

ExchangeTargetOfRareBeyBladeName — Echange de toupie rare
ShowRareBeyExchangeResult      — Resultat d'echange
NoRegisteredRareBey            — Pas de rare enregistree
```

> **RareBey = Gacha Takara** — c'est un systeme de combat special ou le joueur affronte un ennemi pour "gagner" une toupie rare. Les 37 videos dans le bundle sont les animations de deballage/obtention. C'est exactement comme notre systeme TCG gacha.

---

## 9. Systeme de Ranking (48 strings)

```
Ranking
  ├── GlobalRanking         — Classement mondial
  ├── PlaceRanking          — Classement par lieu/region
  ├── OwnRankingData        — Ses propres donnees
  ├── ParticipateRanking    — Participer au ranking
  ├── SetRanking            — Definir le rang
  └── CallUpdateRanking     — Mettre a jour

RankingShop
  ├── RankingShopItem       — Articles du shop de rang
  └── RankingState          — Etat du ranking
```

> Takara a un **RankingShop** — les joueurs peuvent acheter des items avec des points de classement. C'est une mecanique de motivation supplementaire que RPB pourrait integrer.

---

## 10. Donnees exploitables pour RPB

### Ce qu'on apprend sur l'architecture Takara

1. **4 modes de combat** structures avec dates, index, et resultats granulaires
2. **BeyCode** comme identifiant unique physique-numerique
3. **BattlePass lie au scan quotidien** — retention par habitude physique
4. **Collection filtrable par serie** (BX/UX/CX/Convention/Custom)
5. **Customisation 3D temps reel** avec offsets angulaires
6. **RareBey = gacha via combat** (pas un tirage aleatoire)
7. **RankingShop** — boutique accessible avec points de classement
8. **BeyPoints comme economie unifiee** (scan + combat + battlepass)
9. **Enquetes integrees** pour feedback utilisateur
10. **Systeme de transfert de compte** (TransferOrCreate)

### Fonctionnalites a adapter pour RPB

| Concept Takara                | Implementation RPB proposee                           |
| ----------------------------- | ----------------------------------------------------- |
| BeyCode scan quotidien        | Check-in quotidien Discord/web pour XP                |
| BeyPoints (economie)          | Points RPB (participation tournoi, TCG, check-in)     |
| RareBeyGetBattle              | Gacha TCG avec animation de deballage                 |
| RankingShop                   | Boutique de rang (frames, badges, titres)             |
| 4 modes de combat             | Tournois officiels, amicaux, events, simulation       |
| Collection par serie          | Collection par generation (BX, UX, CX)                |
| BattlePass saisonnier         | Saisons TCG avec pass de progression                  |
| GlobalRanking + PlaceRanking  | Ranking national + ranking par region/ville           |
| Enquetes                      | Sondages communautaires integres                      |
| Transfert de compte           | Sync Discord <-> profil web (deja en place)           |
