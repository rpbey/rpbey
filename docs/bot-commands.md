# RPB Bot — Documentation des commandes

> Bot Discord de la **République Populaire du Beyblade** — Framework : DiscordX (discord.js)
> Dernière mise à jour : 31 mars 2026

---

## Table des matières

- [Beyblade X](#-beyblade-x)
- [Gacha / Economie](#-gacha--economie)
- [Duels](#-duels)
- [Jeux & Fun](#-jeux--fun)
- [Tournois](#-tournois)
- [Classement](#-classement)
- [Utilitaires](#-utilitaires)
- [Information](#-information)
- [Giveaways](#-giveaways)
- [Moderation](#-moderation)
- [Administration](#-administration)
- [Systemes automatiques](#-systemes-automatiques)

---

## 🌀 Beyblade X

### `/beys` — Bibliothèque Beyblade X
Parcourir la base de données complète des Beyblades avec filtres par type et recherche.

| Option | Description | Requis |
|--------|-------------|--------|
| `type` | Filtrer par type (Attaque/Défense/Endurance/Equilibre) | Non |
| `recherche` | Rechercher par nom | Non |

### `/meta` — Analyse Méta

| Sous-commande | Description |
|---------------|-------------|
| `/meta top` | Classement global des meilleures pièces |
| `/meta categorie` | Classement par catégorie (Blade, Ratchet, Bit) |
| `/meta combo` | Combos populaires et synergies |
| `/meta piece` | Analyse détaillée d'une pièce spécifique |

### `/produit` — Catalogue Produits

| Sous-commande | Description |
|---------------|-------------|
| `/produit rechercher` | Rechercher un produit par nom ou code |
| `/produit info` | Détails complets d'un produit |
| `/produit nouveau` | Dernières sorties par série (BX/UX/CX) |

### `/wiki` — Base de connaissances

| Sous-commande | Description |
|---------------|-------------|
| `/wiki regles` | Rechercher un point de règle WBO |
| `/wiki formats` | Formats de tournoi officiels (3on3, 1on1, Deck Limited, Round Robin) |

### `/deck` — Gestion des decks

| Sous-commande | Description |
|---------------|-------------|
| `/deck liste` | Afficher tous tes decks |
| `/deck creer` | Créer un nouveau deck vide |
| `/deck ajouter` | Ajouter des Beyblades au deck |
| `/deck modifier` | Modifier un slot du deck actif |
| `/deck activer` | Changer de deck actif |
| `/deck supprimer` | Supprimer un deck |
| `/deck piece` | Statistiques détaillées d'une pièce |

---

## 🎰 Gacha / Economie

### `/gacha` — Système de cartes à collectionner

#### Tirages

| Sous-commande | Description | Coût |
|---------------|-------------|------|
| `/gacha gacha` | Tirer une carte | 50 🪙 |
| `/gacha multi` | Tirage x10 (réduction 10%) | 450 🪙 |
| `/gacha daily` | Réclamer les pièces quotidiennes | Gratuit |

**Taux de tirage :**

| Rareté | Probabilité | Emoji | Revente |
|--------|-------------|-------|---------|
| Miss | 30% | — | — |
| Commune | 35% | ⚪ | 5 🪙 |
| Rare | 22% | 🔵 | 15 🪙 |
| Super Rare | 10% | 🟣 | 50 🪙 |
| Legendaire | 3% | 🟡 | 150 🪙 |
| Secrete | — | 🔴 | 500 🪙 |

**Systeme de pitie :** Apres 3 miss consecutifs, le prochain tirage garantit au minimum une carte Commune.

#### Collection & Inventaire

| Sous-commande | Description |
|---------------|-------------|
| `/gacha collection` | Afficher ta collection (image canvas) |
| `/gacha catalogue` | Parcourir toutes les cartes disponibles |
| `/gacha voir` | Afficher une carte en detail |
| `/gacha solde` | Profil economie (solde, streak, collection) |
| `/gacha drop` | Informations sur le drop actif |
| `/gacha taux` | Mecaniques et taux detailles |
| `/gacha aide` | Guide complet du systeme |

#### Commerce

| Sous-commande | Description |
|---------------|-------------|
| `/gacha vendre` | Vendre un doublon |
| `/gacha vendre-tout` | Vendre tous les doublons |
| `/gacha donner` | Envoyer des pieces a un ami (cooldown 12h) |
| `/gacha wish` | Ajouter/retirer une carte de ta wishlist |
| `/gacha wishlist` | Afficher ta wishlist |

#### Classements

| Sous-commande | Description |
|---------------|-------------|
| `/gacha classement` | Top collectionneurs et plus riches |
| `/gacha dette` | Consulter ta dette et les interets |

#### Elements

| Element | Emoji | Fort contre |
|---------|-------|-------------|
| Feu | 🔥 | Vent |
| Vent | 🌪️ | Terre |
| Terre | 🌍 | Eau |
| Eau | 💧 | Feu |
| Ombre | 🌑 | Lumiere |
| Lumiere | ✨ | Ombre |
| Neutre | ⚪ | — |

#### Streaks quotidiens

| Jours | Bonus |
|-------|-------|
| 3 jours | +50 🪙 |
| 7 jours | +150 🪙 |
| 14 jours | +300 🪙 |
| 30 jours | +750 🪙 |

---

## ⚔️ Duels

### `/duel` — Duel strategique Best-of-3

Defie un adversaire dans un combat de cartes tactique !

| Option | Description | Requis |
|--------|-------------|--------|
| `adversaire` | Le joueur a defier | Oui |
| `mise` | Mise en pieces (0-5000, defaut: 0) | Non |

**Deroulement :**
1. **Defi** — L'adversaire accepte ou refuse (60s)
2. **Selection** — Chaque joueur choisit 3 cartes de sa collection (90s)
3. **Combat** — 3 rounds, cartes matchees par rang de puissance
4. **Resultat** — Image canvas d'arene + recompenses

**Moteur de combat :**

| Mecanique | Effet |
|-----------|-------|
| Stats de base | ATT×1.2 + DEF×0.6 + END×0.8 + EQU×0.4 |
| Bonus rarete | Commune +0, Rare +12, SR +28, Legendaire +50, Secrete +70 |
| Avantage elementaire | ×1.5 |
| Desavantage elementaire | ×0.75 |
| Coup critique | 12% de chance → ×1.4 |
| Attaque speciale | 10% si la carte en a une → ×1.35 |
| Mur de defense | 8% si DEF > 60 → ×0.7 (absorbe) |
| Variance | ±15% aleatoire |

**Finishers :**
- ⚡ X-TREME FINISH — domination totale
- 💥 BURST FINISH — victoire ecrasante
- 🔄 OVER FINISH — victoire nette
- 🌀 SPIN FINISH — victoire serree

**Conditions :** Minimum 3 cartes en collection. Cooldown de 3 minutes entre les duels.

### `/gacha duel` — Duel rapide (1v1)

Version rapide : une carte aleatoire de chaque joueur s'affronte.

| Option | Description | Requis |
|--------|-------------|--------|
| `adversaire` | Le joueur a defier | Oui |

---

## 🎮 Jeux & Fun

### `/jeu` — Mini-jeux

| Sous-commande | Description |
|---------------|-------------|
| `/jeu combat` | Simuler un combat Beyblade X avec types, poids, burst, xtreme dash |
| `/jeu aleatoire` | Generer un combo Beyblade X aleatoire avec stats |
| `/jeu interaction` | Voir les stats de mentions mutuelles avec un membre |
| `/jeu wanted` | Generer une affiche WANTED style One Piece |
| `/jeu fun-agrandir` | Agrandir un emoji en image |

**Systeme de combat (`/jeu combat`) :**
- Types : Attaque > Endurance > Defense > Attaque
- Mecaniques : poids, burst, xtreme dash line, critiques
- Finishers : X-TREME (3pts), BURST (2pts), OVER (2pts), SPIN (1pt)
- Recompenses : vainqueur = (points × 10) 🪙, perdant = 5 🪙

---

## 🏆 Tournois

### `/inscription` — S'inscrire aux tournois

| Sous-commande | Description |
|---------------|-------------|
| `/inscription rejoindre` | S'inscrire a un tournoi (integration Challonge) |
| `/inscription quitter` | Se desinscrire d'un tournoi |
| `/inscription statut` | Verifier son statut d'inscription |

### `/challonge` — Compte Challonge

| Sous-commande | Description |
|---------------|-------------|
| `/challonge lier` | Lier ton pseudo Challonge a Discord |
| `/challonge info` | Voir les infos de ton compte lie |

### `/annonce` — Annonces tournois (Moderateurs)

| Sous-commande | Description | Permission |
|---------------|-------------|------------|
| `/annonce tournoi` | Annoncer un tournoi Challonge | Manage Messages |
| `/annonce rappel` | Envoyer un rappel de tournoi | Manage Messages |
| `/annonce resultats` | Publier les resultats d'un tournoi | Manage Messages |

### `/live` — Tournoi en direct

Affiche le statut live d'un tournoi en cours avec les standings et les stations.

### `/tournoi synchroniser` — Sync profonde (Admin)

Scrape et synchronise les donnees Challonge (15-30s).

---

## 📊 Classement

### `/classement` — Rankings

| Sous-commande | Description |
|---------------|-------------|
| `/classement profil` | Voir le profil d'un blader (carte canvas RPB ou Classic) |
| `/classement top` | Top 10 du classement (Global ou SATR) |

### Menu contextuel : **Profil Beyblade**

Clic droit sur un utilisateur → "Profil Beyblade" pour voir son profil sans commande slash.

---

## 🔧 Utilitaires

### `/utilitaire` — Outils communautaires

| Sous-commande | Description |
|---------------|-------------|
| `/utilitaire membre` | Informations detaillees d'un membre (roles, profil, gacha) |
| `/utilitaire avatar` | Afficher l'avatar en haute resolution (4096px) |
| `/utilitaire banniere` | Afficher la banniere d'un membre |
| `/utilitaire sondage` | Creer un sondage (2-5 options avec reactions) |
| `/utilitaire suggestion` | Soumettre une suggestion (avec thread + votes) |
| `/utilitaire rappel` | Programmer un rappel personnel (minutes/heures/jours, max 30j) |
| `/utilitaire embed` | Creer un embed personnalise (titre, description, couleur, image) |

### `/ping` — Latence du bot

### `/aide` — Liste de toutes les commandes

---

## ℹ️ Information

### `/info` — Infos serveur & bot

| Sous-commande | Description |
|---------------|-------------|
| `/info bot` | Stats techniques (uptime, latence, version) |
| `/info serveur` | Infos serveur (membres, boosts, creation) |
| `/info staff` | Liste de l'equipe RPB |
| `/info partenaire` | Partenaires Beyblade |
| `/info promo` | Codes promos actifs |

---

## 🎁 Giveaways

### `/tirage` — Systeme de giveaways

| Sous-commande | Description | Permission |
|---------------|-------------|------------|
| `/tirage creer` | Lancer un giveaway (prix, duree, nb gagnants) | Manage Messages |
| `/tirage fin` | Terminer un giveaway immediatement | Manage Messages |
| `/tirage liste` | Voir les giveaways en cours | Manage Messages |

Les membres rejoignent en cliquant sur le bouton 🎉.

---

## 🛡️ Moderation

### Commandes de moderation

| Commande | Description | Permission |
|----------|-------------|------------|
| `/ban` | Bannir un membre | Ban Members |
| `/unban` | Debannir un utilisateur par ID | Ban Members |
| `/kick` | Expulser un membre | Kick Members |
| `/mute` | Rendre muet (60s a 24h) | Moderate Members |
| `/unmute` | Retirer le mute | Moderate Members |
| `/warn` | Avertir un membre (sauvegarde en DB) | Moderate Members |
| `/warnings` | Voir les avertissements d'un membre | Moderate Members |
| `/unwarn` | Retirer un avertissement par ID | Moderate Members |
| `/clear` | Supprimer des messages (1-100) | Manage Messages |
| `/slowmode` | Mode lent (0s a 1h) | Manage Channels |
| `/lock` | Verrouiller un salon | Manage Channels |
| `/unlock` | Deverrouiller un salon | Manage Channels |
| `/nickname` | Changer le pseudo d'un membre | Manage Nicknames |

### `/tickets` — Systeme de support

Deploie un panneau de tickets avec bouton. Les membres ouvrent un ticket prive visible par les moderateurs. Fermeture avec transcript HTML automatique.

---

## ⚙️ Administration

### `/admin` — Commandes admin

| Sous-commande | Description | Permission |
|---------------|-------------|------------|
| `/admin synchroniser-roles` | Synchroniser les roles de paliers | Administrator |
| `/admin classement-raz` | RAZ des points de classement | Administrator |

### `/synchroniser` — Sync complete

Synchronise roles, salons et membres Discord avec la base de donnees.

### `/config-roles` — Roles reaction

Configure les panneaux de roles reaction dans le salon #roles. (Owner only)

---

## 🤖 Systemes automatiques

### Evenements detectes

| Evenement | Action |
|-----------|--------|
| Nouveau membre | Message de bienvenue (canvas) + role Blader auto |
| Depart membre | Log dans les logs avances |
| Message supprime | Log avec contenu et auteur |
| Suppression en masse | Log avec nombre et salon |
| Message modifie | Log avant/apres |
| Ban/Unban | Log avec moderateur et raison |
| Changement vocal | Log des connexions/deconnexions |
| Creation/suppression salon | Log |
| Creation/suppression role | Log |
| Modification de role | Log des permissions changees |
| Creation/suppression thread | Log |
| Creation/suppression emoji | Log |
| Changement de membre | Log (roles, pseudo, avatar) |

### Rappels programmes

Le bot verifie toutes les 30 secondes les rappels expires (`/utilitaire rappel`) et envoie une notification dans le salon d'origine.

### Mudae Roll Watcher

Surveillance automatique des rolls du bot Mudae.

---

## Statistiques

| Categorie | Nombre |
|-----------|--------|
| **Groupes de commandes** | 15 |
| **Commandes standalone** | 16 |
| **Sous-commandes** | ~70 |
| **Total commandes** | ~86 |
| **Listeners d'evenements** | 22 |
| **Menu contextuel** | 1 |

---

*Bot RPB — rpbey.fr*
