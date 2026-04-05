# Guide de Migration VPS — RPB Dashboard

> Dernière mise à jour : 2026-04-05

Ce document détaille la procédure complète pour migrer l'infrastructure RPB (dashboard + bot + base de données) vers un nouveau VPS.

---

## Table des matières

1. [Vue d'ensemble de l'infrastructure](#1-vue-densemble-de-linfrastructure)
2. [État de la base de données](#2-état-de-la-base-de-données)
3. [Pré-requis sur le nouveau VPS](#3-pré-requis-sur-le-nouveau-vps)
4. [Étape 1 — Backup de la base de données](#4-étape-1--backup-de-la-base-de-données)
5. [Étape 2 — Transfert des fichiers](#5-étape-2--transfert-des-fichiers)
6. [Étape 3 — Configuration du nouveau VPS](#6-étape-3--configuration-du-nouveau-vps)
7. [Étape 4 — Déploiement](#7-étape-4--déploiement)
8. [Étape 5 — Restauration de la DB](#8-étape-5--restauration-de-la-db)
9. [Étape 6 — SSL et DNS](#9-étape-6--ssl-et-dns)
10. [Étape 7 — Discord Bot](#10-étape-7--discord-bot)
11. [Vérification post-migration](#11-vérification-post-migration)
12. [Rollback en cas de problème](#12-rollback-en-cas-de-problème)
13. [Annexes](#13-annexes)

---

## 1. Vue d'ensemble de l'infrastructure

### Architecture actuelle

| Composant | Technologie | Déploiement | Port |
|-----------|------------|-------------|------|
| Dashboard | Next.js 16 | Docker (docker-compose) | 3000 |
| Base de données | PostgreSQL 17.8 (Alpine) | Docker (volume externe) | 5432 |
| Reverse proxy | Nginx (Alpine) | Docker | 80/443 |
| SSL | Let's Encrypt (Certbot) | Docker (one-shot) | — |
| Discord Bot | Node.js + Sapphire | systemd (`rpb-bot.service`) | 3001 |

### Dépendances système du bot (hors Docker)

- Node.js 24+
- pnpm 10.27+
- Chromium (pour Puppeteer/canvas)
- Bibliothèques natives : libcairo2, libpango, libjpeg, libgif, librsvg2

### Volumes et données persistantes

| Donnée | Emplacement | Taille | Critique |
|--------|-------------|--------|----------|
| Base PostgreSQL | Volume Docker `rpb-db` | 72 MB (16 MB de données) | **Oui** |
| Uploads utilisateurs | `./public/uploads/` | ~250 KB | Oui |
| Data fichiers | `./data/` | 177 MB | Oui (classements, knowledge base) |
| Certificats SSL | `./certbot/conf/` | ~100 KB | Non (regénérables) |
| Logs | `./logs/` | Variable | Non |

---

## 2. État de la base de données

### Résumé

| Propriété | Valeur |
|-----------|--------|
| Version PostgreSQL | 17.8 (Alpine) |
| Image Docker | `postgres:17-alpine` |
| Taille DB | **16 MB** |
| Taille dump compressé | **~426 KB** |
| Volume disque (avec WAL) | 72 MB |
| Nombre de tables | 45 |
| Nombre de migrations Prisma | 4 |
| Extensions custom | **0** (aucune) |
| Triggers custom | **0** |
| Encoding | UTF8 / en_US.utf8 |
| User unique | `postgres` |

### Score de portabilité : 10/10

Raisons :
- Aucune extension PostgreSQL custom (pas de PostGIS, pgvector, etc.)
- Aucun trigger ou rule custom
- Schema entièrement géré par Prisma (reproductible via `prisma migrate deploy`)
- 16 MB de données — dump/restore en secondes
- Image Docker standard `postgres:17-alpine`

### Tables et volumes de données

| Table | Lignes | Description |
|-------|--------|-------------|
| currency_transactions | 2 642 | Transactions monnaie virtuelle (gacha) |
| anime_episode_sources | 1 967 | Sources d'épisodes anime |
| card_inventory | 1 075 | Inventaire cartes TCG des joueurs |
| anime_episodes | 747 | Épisodes anime |
| parts | 437 | Pièces Beyblade X |
| satr_rankings | 289 | Classements SATR |
| wb_rankings | 213 | Classements WB |
| wb_bladers | 159 | Joueurs WB |
| gacha_cards | 126 | Cartes gacha disponibles |
| global_rankings | 93 | Classement global |
| users | 71 | Utilisateurs |
| profiles | 44 | Profils bladers |
| sessions | 36 | Sessions actives |
| *autres tables* | <50 | Decks, tournois, etc. |

### Enums PostgreSQL (créés par Prisma)

| Enum | Valeurs |
|------|---------|
| BeyType | ATTACK, DEFENSE, STAMINA, BALANCE |
| PartType | BLADE, RATCHET, BIT, LOCK_CHIP, ASSIST_BLADE, OVER_BLADE |
| TournamentStatus | UPCOMING, REGISTRATION_OPEN, REGISTRATION_CLOSED, CHECKIN, UNDERWAY, COMPLETE, CANCELLED, ARCHIVED |
| CardRarity | COMMON, RARE, SUPER_RARE, LEGENDARY, SECRET |
| CardType | PNG, ARTIST |
| ProductLine | BX, UX, CX |
| ProductType | STARTER, BOOSTER, RANDOM_BOOSTER, SET, DOUBLE_STARTER, TOOL, COLOR_CHOICE |
| TransactionType | DAILY_CLAIM, GACHA_PULL, ADMIN_GIVE, ADMIN_TAKE, TOURNAMENT_REWARD, SELL_CARD, STREAK_BONUS, MULTI_PULL, BADGE_REWARD, DUEL_REWARD |
| ExperienceLevel | BEGINNER, INTERMEDIATE, ADVANCED, EXPERT, LEGEND |
| AnimeGeneration | ORIGINAL, METAL, BURST, X |
| EpisodeSourceType | YOUTUBE, DAILYMOTION, MP4, HLS, IFRAME |
| WatchStatus | NOT_STARTED, IN_PROGRESS, COMPLETED |

---

## 3. Pré-requis sur le nouveau VPS

### Système

- **OS** : Ubuntu 22.04+ ou Debian 12+ (recommandé)
- **RAM** : 4 GB minimum (8 GB recommandé)
- **Disque** : 20 GB minimum
- **CPU** : 2 cores minimum

### Logiciels à installer

```bash
# Docker + Docker Compose
curl -fsSL https://get.docker.com | sh
sudo systemctl enable docker

# Node.js 24 (pour le bot)
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs

# pnpm
corepack enable && corepack prepare pnpm@10.27.0 --activate

# Dépendances natives du bot (canvas, puppeteer)
sudo apt-get install -y \
  chromium-browser \
  libcairo2-dev \
  libpango1.0-dev \
  libjpeg-dev \
  libgif-dev \
  librsvg2-dev \
  pkg-config \
  build-essential \
  python3
```

---

## 4. Étape 1 — Backup de la base de données

### Sur le VPS actuel

```bash
# Dump compressé (format custom, ~426 KB)
docker exec rpb-db pg_dump -U postgres -Fc rpb_dashboard > /root/rpb_backup.dump

# Vérifier le dump
ls -lh /root/rpb_backup.dump
# Attendu : ~426 KB
```

### Alternative — dump SQL lisible

```bash
docker exec rpb-db pg_dump -U postgres rpb_dashboard > /root/rpb_backup.sql
```

### Alternative — via Prisma (schema seul, sans données)

Si les données ne sont pas nécessaires (environnement de staging) :

```bash
# Sur le nouveau VPS, après configuration
pnpm db:push    # Crée le schema
pnpm db:seed    # Seed les données de base
```

---

## 5. Étape 2 — Transfert des fichiers

### Fichiers à transférer

```bash
# Depuis le VPS actuel vers le nouveau
NEW_VPS="root@xxx.xxx.xxx.xxx"

# 1. Code source (ou git clone)
rsync -avz --exclude=node_modules --exclude=.next --exclude=bot/dist \
  /root/rpb-dashboard/ $NEW_VPS:/root/rpb-dashboard/

# 2. Backup de la DB
scp /root/rpb_backup.dump $NEW_VPS:/root/rpb_backup.dump

# 3. Fichier .env (CRITIQUE — contient tous les secrets)
scp /root/rpb-dashboard/.env $NEW_VPS:/root/rpb-dashboard/.env

# 4. Uploads utilisateurs
rsync -avz /root/rpb-dashboard/public/uploads/ $NEW_VPS:/root/rpb-dashboard/public/uploads/

# 5. Data directory
rsync -avz /root/rpb-dashboard/data/ $NEW_VPS:/root/rpb-dashboard/data/
```

### Alternative — via git

```bash
# Sur le nouveau VPS
git clone <repo-url> /root/rpb-dashboard
cd /root/rpb-dashboard
pnpm install
```

> **Attention** : les fichiers `.env`, `public/uploads/` et `data/` ne sont PAS dans git.
> Il faut les transférer séparément.

---

## 6. Étape 3 — Configuration du nouveau VPS

### Créer le volume Docker externe

```bash
docker volume create rpb-db
```

> **Important** : le `docker-compose.prod.yml` déclare le volume comme `external: true`.
> Sans cette commande, `docker compose up` échouera.

### Mettre à jour le `.env`

Vérifier et adapter si nécessaire :

```bash
# Variables qui pourraient changer selon le VPS
BOT_API_URL=http://host.docker.internal:3001  # OK si bot sur le même VPS
NEXT_PUBLIC_APP_URL=https://rpbey.fr           # OK si même domaine
DATABASE_URL=postgresql://postgres:rpb_password@db:5432/rpb_dashboard  # OK (interne Docker)
```

### Fichiers à ne PAS transférer

| Fichier/Dossier | Raison |
|-----------------|--------|
| `node_modules/` | Réinstallé via `pnpm install` |
| `.next/` | Reconstruit au build Docker |
| `bot/dist/` | Reconstruit via `pnpm bot:build` |
| `certbot/conf/` | Regénéré par `init-ssl.sh` |
| `logs/` | Runtime, non nécessaire |
| `bey-library-mirror/` | Cache regénérable |

---

## 7. Étape 4 — Déploiement

### Lancer les services Docker

```bash
cd /root/rpb-dashboard

# Build et lancement
docker compose -f docker-compose.prod.yml build dashboard --no-cache
docker compose -f docker-compose.prod.yml up -d db

# Attendre que PostgreSQL soit ready
docker compose -f docker-compose.prod.yml logs -f db
# Attendre "database system is ready to accept connections"
```

---

## 8. Étape 5 — Restauration de la DB

### Restaurer le dump

```bash
# Restore depuis le dump compressé
docker exec -i rpb-db pg_restore \
  -U postgres \
  -d rpb_dashboard \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  < /root/rpb_backup.dump
```

### Vérifier la restauration

```bash
# Compter les tables
docker exec rpb-db psql -U postgres -d rpb_dashboard -c "\dt" | tail -2
# Attendu : (45 rows)

# Vérifier les données critiques
docker exec rpb-db psql -U postgres -d rpb_dashboard -c "SELECT count(*) FROM users;"
# Attendu : 71

docker exec rpb-db psql -U postgres -d rpb_dashboard -c "SELECT count(*) FROM parts;"
# Attendu : 437

# Vérifier la taille
docker exec rpb-db psql -U postgres -d rpb_dashboard -c "SELECT pg_size_pretty(pg_database_size('rpb_dashboard'));"
# Attendu : ~16 MB
```

### Lancer le dashboard

```bash
docker compose -f docker-compose.prod.yml up -d dashboard nginx
docker compose -f docker-compose.prod.yml logs -f dashboard
# Vérifier : ">>> RPB Dashboard starting..." puis "Ready"
```

---

## 9. Étape 6 — SSL et DNS

### Mettre à jour le DNS

Chez votre registrar (ou Cloudflare), mettre à jour les enregistrements :

```
rpbey.fr.       A    <nouvelle-IP>
www.rpbey.fr.   A    <nouvelle-IP>
```

> **TTL** : Baisser le TTL à 300s (5 min) quelques heures avant la migration pour une propagation rapide.

### Générer le certificat SSL

```bash
# Lancer Nginx temporairement sans SSL pour le challenge ACME
# (adapter le default.conf si nécessaire pour écouter en HTTP seul)

# Puis générer le certificat
docker compose -f docker-compose.prod.yml run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  -d rpbey.fr \
  -d www.rpbey.fr \
  --email votre@email.com \
  --agree-tos \
  --no-eff-email

# Ou utiliser le script existant
bash scripts/init-ssl.sh
```

### Redémarrer Nginx avec SSL

```bash
docker compose -f docker-compose.prod.yml restart nginx
```

---

## 10. Étape 7 — Discord Bot

Le bot tourne via **systemd**, pas Docker.

### Installer les dépendances

```bash
cd /root/rpb-dashboard
pnpm install
pnpm bot:build
```

### Configurer le service systemd

```bash
cat > /etc/systemd/system/rpb-bot.service << 'EOF'
[Unit]
Description=RPB Discord Bot
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/rpb-dashboard
ExecStart=/usr/bin/node bot/dist/index.js
Environment=NODE_OPTIONS=--max-old-space-size=2048
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable rpb-bot
systemctl start rpb-bot
```

### Vérifier

```bash
systemctl status rpb-bot
journalctl -u rpb-bot -f
# Attendu : "Logged in as RPB Bot#xxxx"
```

> **Note** : Le bot se connecte à la DB via `DATABASE_URL` dans `.env`.
> Sur le nouveau VPS, la DB est accessible en `localhost:5432` (port exposé par Docker).

---

## 11. Vérification post-migration

### Checklist

```
[ ] Dashboard accessible sur https://rpbey.fr
[ ] Certificat SSL valide (cadenas vert)
[ ] Login Discord OAuth fonctionne
[ ] Profils utilisateurs affichés correctement
[ ] Classements chargent avec les bonnes données
[ ] Bot Discord en ligne et répond aux commandes
[ ] Bot API accessible (http://localhost:3001/api/status)
[ ] Dashboard → Bot communication OK (/admin)
[ ] Uploads d'avatars fonctionnels
[ ] Données TCG (cartes, inventaires) intactes
```

### Tests rapides

```bash
# Health check dashboard
curl -s https://rpbey.fr/api/health | head -20

# Health check bot
curl -s http://localhost:3001/api/status

# DB intégrité
docker exec rpb-db psql -U postgres -d rpb_dashboard \
  -c "SELECT count(*) AS users FROM users; SELECT count(*) AS parts FROM parts; SELECT count(*) AS cards FROM gacha_cards;"
```

---

## 12. Rollback en cas de problème

### Revenir sur l'ancien VPS

1. Remettre le DNS vers l'ancienne IP
2. L'ancien VPS est toujours opérationnel (on n'a rien supprimé)
3. Le TTL bas permet une propagation en ~5 minutes

### Restaurer un backup sur l'ancien VPS

```bash
# Si la DB de l'ancien VPS a été corrompue
docker exec -i rpb-db pg_restore \
  -U postgres -d rpb_dashboard \
  --clean --if-exists \
  < /root/rpb_backup.dump
```

---

## 13. Annexes

### A. Estimation du downtime

| Étape | Durée estimée |
|-------|---------------|
| Dump DB (16 MB) | ~1 seconde |
| Transfert fichiers (rsync) | ~2-5 minutes |
| Build Docker image | ~5-10 minutes |
| Restore DB | ~2 secondes |
| Propagation DNS (TTL 300s) | ~5 minutes |
| Tests et vérifications | ~5 minutes |
| **Total** | **~15-25 minutes** |

### B. Procédure de migration "zero-downtime"

Pour minimiser le downtime :

1. Préparer le nouveau VPS à l'avance (Docker, Node.js, pnpm)
2. Cloner le repo et build l'image Docker
3. Faire un premier rsync des données
4. Le jour J :
   - Mettre le dashboard en maintenance
   - Dump final de la DB
   - rsync incrémental (delta seulement)
   - Restore du dump
   - Basculer le DNS
   - Démarrer les services
5. Downtime réel : **~2-5 minutes** (temps du dump final + DNS)

### C. Script de migration automatisé

```bash
#!/bin/bash
# migrate.sh — À exécuter sur le VPS ACTUEL
set -e

NEW_VPS="root@xxx.xxx.xxx.xxx"
BACKUP_FILE="/root/rpb_backup_$(date +%Y%m%d_%H%M%S).dump"

echo "=== RPB Migration Script ==="

echo "1. Dump de la base de données..."
docker exec rpb-db pg_dump -U postgres -Fc rpb_dashboard > "$BACKUP_FILE"
echo "   Dump créé : $(ls -lh $BACKUP_FILE | awk '{print $5}')"

echo "2. Transfert du backup..."
scp "$BACKUP_FILE" "$NEW_VPS:/root/rpb_backup.dump"

echo "3. Transfert du .env..."
scp /root/rpb-dashboard/.env "$NEW_VPS:/root/rpb-dashboard/.env"

echo "4. Sync des uploads..."
rsync -avz /root/rpb-dashboard/public/uploads/ "$NEW_VPS:/root/rpb-dashboard/public/uploads/"

echo "5. Sync du dossier data..."
rsync -avz /root/rpb-dashboard/data/ "$NEW_VPS:/root/rpb-dashboard/data/"

echo "=== Transfert terminé ==="
echo "Sur le nouveau VPS, exécuter :"
echo "  docker volume create rpb-db"
echo "  docker compose -f docker-compose.prod.yml up -d db"
echo "  docker exec -i rpb-db pg_restore -U postgres -d rpb_dashboard --clean --if-exists < /root/rpb_backup.dump"
echo "  docker compose -f docker-compose.prod.yml up -d"
```

### D. Backups automatiques recommandés

Après migration, mettre en place un cron de backup :

```bash
# /etc/cron.d/rpb-backup
# Backup quotidien à 4h du matin
0 4 * * * root docker exec rpb-db pg_dump -U postgres -Fc rpb_dashboard > /root/backups/rpb_$(date +\%Y\%m\%d).dump && find /root/backups -name "rpb_*.dump" -mtime +7 -delete
```

Cela garde les 7 derniers jours de backups et supprime automatiquement les plus anciens.
