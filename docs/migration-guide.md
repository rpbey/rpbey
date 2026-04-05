# Guide de Migration VPS — RPB Dashboard

> Dernière mise à jour : 2026-04-05

Ce document détaille la procédure complète pour migrer l'infrastructure RPB (dashboard + bot + base de données) vers un nouveau VPS.

---

## Table des matières

1. [Vue d'ensemble de l'infrastructure](#1-vue-densemble-de-linfrastructure)
2. [État de la base de données](#2-état-de-la-base-de-données)
3. [Redis](#3-redis)
4. [Tâches de fond (cron + systemd)](#4-tâches-de-fond-cron--systemd)
5. [Volumes Docker](#5-volumes-docker)
6. [Pré-requis sur le nouveau VPS](#6-pré-requis-sur-le-nouveau-vps)
7. [Étape 1 — Backup complet](#7-étape-1--backup-complet)
8. [Étape 2 — Transfert des fichiers](#8-étape-2--transfert-des-fichiers)
9. [Étape 3 — Configuration du nouveau VPS](#9-étape-3--configuration-du-nouveau-vps)
10. [Étape 4 — Déploiement Docker](#10-étape-4--déploiement-docker)
11. [Étape 5 — Restauration des données](#11-étape-5--restauration-des-données)
12. [Étape 6 — Redis](#12-étape-6--redis)
13. [Étape 7 — SSL et DNS](#13-étape-7--ssl-et-dns)
14. [Étape 8 — Discord Bot + Crontab](#14-étape-8--discord-bot--crontab)
15. [Vérification post-migration](#15-vérification-post-migration)
16. [Rollback en cas de problème](#16-rollback-en-cas-de-problème)
17. [Annexes](#17-annexes)

---

## 1. Vue d'ensemble de l'infrastructure

### Architecture actuelle

| Composant | Technologie | Déploiement | Port |
|-----------|------------|-------------|------|
| Dashboard | Next.js 16 | Docker (docker-compose) | 3000 |
| Base de données | PostgreSQL 17.8 (Alpine) | Docker (volume externe) | 5432 |
| Redis | Redis 7+ (server natif) | systemd (`redis-server.service`) | 6379 |
| Reverse proxy | Nginx (Alpine) | Docker | 80/443 |
| SSL | Let's Encrypt (Certbot) | Docker (one-shot) | — |
| Discord Bot | Node.js + Sapphire | systemd (`rpb-bot.service`) | 3001 |

### Dépendances système du bot (hors Docker)

- Node.js 24+ (VPS actuel : installé via **nvm** dans `/root/.nvm/versions/node/v24.12.0/`)
- pnpm 10.27+
- Redis server (utilisé par le bot pour les mentions Discord)
- Chromium (pour Puppeteer/canvas)
- Bibliothèques natives : libcairo2, libpango, libjpeg, libgif, librsvg2

### Volumes et données persistantes

| Donnée | Emplacement | Taille | Critique |
|--------|-------------|--------|----------|
| Base PostgreSQL | Volume Docker `rpb-db` | 72 MB (16 MB de données) | **Oui** |
| Redis | `/var/lib/redis/dump.rdb` (host) | 65 KB (1.12 MB en RAM) | Oui (mentions) |
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

## 3. Redis

### Résumé

| Propriété | Valeur |
|-----------|--------|
| Service | `redis-server` via systemd (sur le host, **PAS Docker**) |
| Port | `127.0.0.1:6379` |
| Authentification | **Aucune** (pas de mot de passe configuré) |
| Clés en base | 2 (`rpb:mentions`, `rpb:mentions:meta`) |
| RAM utilisée | 1.12 MB (297 KB de données utiles) |
| Taille dump RDB | **65 KB** |

> **Note** : Le `.env` contient `REDIS_HOST="10.0.1.5"` et `REDIS_PASSWORD="..."` mais le bot
> se connecte en dur à `127.0.0.1:6379` sans mot de passe (`bot/src/lib/redis.ts:16`).
> Ces variables `.env` sont ignorées.

### Usage par le bot

Redis est utilisé **uniquement** par le bot Discord pour :
- **`rpb:mentions`** — Hash comptant combien de fois chaque membre mentionne chaque autre membre
- **`rpb:mentions:meta`** — Métadonnées du dernier scan (nombre de channels/messages scannés, date)

Fichiers concernés :
- `bot/src/lib/redis.ts` — Client Redis + fonctions CRUD mentions
- `bot/src/cron/tasks/MentionsScan.ts` — Tâche cron qui scanne les channels
- `bot/src/commands/General/GameGroup.ts` — Commande utilisant les données de mentions

### Données Redis (contenu)

```
rpb:mentions       → Hash { "userId1:userId2": count, ... }
rpb:mentions:meta  → Hash { channelsScanned, messagesScanned, lastScan }
```

Ces données sont **regénérables** via un re-scan complet des channels Discord, mais le scan prend du temps. Mieux vaut restaurer le dump.

---

## 4. Tâches de fond (cron + systemd)

### Crontab (root)

3 tâches cron à reproduire sur le nouveau VPS :

| Fréquence | Script | Description |
|-----------|--------|-------------|
| `* * * * *` (chaque minute) | `scripts/sync-bts2.ts` | Sync tournoi BTS en temps réel |
| `0 * * * *` (chaque heure) | `scripts/sync-youtube-beytube.ts` | Sync nouvelles vidéos YouTube BeyTube |
| `0 8 * * *` (tous les jours 8h) | `scripts/maintenance.sh` | Maintenance quotidienne |

#### Contenu du crontab à reproduire

```cron
* * * * * cd /root/rpb-dashboard && ./node_modules/.bin/tsx scripts/sync-bts2.ts >> logs/cron-bts2.log 2>&1
0 * * * * cd /root/rpb-dashboard && ./node_modules/.bin/tsx scripts/sync-youtube-beytube.ts >> logs/cron-youtube.log 2>&1
0 8 * * * /root/rpb-dashboard/scripts/maintenance.sh >> /root/rpb-dashboard/logs/maintenance.log 2>&1
```

#### Détail de `maintenance.sh` (exécuté quotidiennement à 8h)

1. Sync staff Discord → DB (`scripts/sync-staff-db.ts`)
2. Sync vidéos YouTube BeyTube (`scripts/sync-youtube-beytube.ts`)
3. Recalcul des classements (`scripts/cron-recalculate.ts`)
4. Envoi du briefing quotidien Discord (`scripts/daily-briefing.ts`)

### Services systemd

| Service | Description | Status |
|---------|-------------|--------|
| `rpb-bot.service` | Discord Bot (Sapphire) | **actif** |
| `redis-server.service` | Redis server | **actif** |

#### `rpb-bot.service` — Configuration actuelle

```ini
[Unit]
Description=RPB Discord Bot
After=network.target postgresql.service

[Service]
Type=simple
User=root
WorkingDirectory=/root/rpb-dashboard
ExecStart=/root/.nvm/versions/node/v24.12.0/bin/node bot/dist/index.js
Restart=always
RestartSec=10
EnvironmentFile=/root/rpb-dashboard/.env
Environment=NODE_ENV=production
Environment=NODE_OPTIONS=--max-old-space-size=2048

[Install]
WantedBy=multi-user.target
```

> **ATTENTION** : Le `ExecStart` utilise le chemin NVM `/root/.nvm/versions/node/v24.12.0/bin/node`.
> Sur le nouveau VPS, adapter au chemin réel de Node.js (ex: `/usr/bin/node` si installé via apt).

---

## 5. Volumes Docker

### Inventaire complet

| Volume | Taille | Status | Action migration |
|--------|--------|--------|-----------------|
| `rpb-db` | 72 MB | **Actif** — DB principale | Transféré via pg_dump |
| `postgres-data-b0o4000oo8g80cws8gsoogk4` | 64 MB | **Orphelin** — ancienne DB | Ne pas transférer |
| `redis-data-s84ookwsck84wk8gkoc0g4ck` | 52 MB | **Orphelin** — ancien Redis Docker | Ne pas transférer |
| `4a384df8...` (anonyme) | 4 KB | **Orphelin** — vide | Ne pas transférer |
| `e51c3a5c...` (anonyme) | 4 KB | **Orphelin** — vide | Ne pas transférer |

### Nettoyage des volumes orphelins (VPS actuel)

Après migration réussie, on peut libérer ~120 MB :

```bash
docker volume rm \
  postgres-data-b0o4000oo8g80cws8gsoogk4 \
  redis-data-s84ookwsck84wk8gkoc0g4ck \
  4a384df8bfd71e5f357d5932aa2f1a36534833c0efdf32f7feb0af0246d567bf \
  e51c3a5c103ee6f25fc1869be87d7dad4aee3293869112fbbff811675de423fc
```

### Volume requis sur le nouveau VPS

Seul `rpb-db` doit être créé :

```bash
docker volume create rpb-db
```

---

## 6. Pré-requis sur le nouveau VPS

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

# Redis (utilisé par le bot pour les mentions Discord)
sudo apt-get install -y redis-server
sudo systemctl enable redis-server

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

## 7. Étape 1 — Backup complet

### PostgreSQL

```bash
# Dump compressé (format custom, ~426 KB)
docker exec rpb-db pg_dump -U postgres -Fc rpb_dashboard > /root/rpb_backup.dump

# Vérifier le dump
ls -lh /root/rpb_backup.dump
# Attendu : ~426 KB
```

### Redis

```bash
# Export du dump RDB (~65 KB)
redis-cli --rdb /root/rpb_redis.rdb

# Vérifier
ls -lh /root/rpb_redis.rdb
# Attendu : ~65 KB
```

### Alternative — via Prisma (schema seul, sans données)

Si les données ne sont pas nécessaires (environnement de staging) :

```bash
# Sur le nouveau VPS, après configuration
pnpm db:push    # Crée le schema
pnpm db:seed    # Seed les données de base
# Redis se remplira automatiquement au prochain scan de mentions
```

---

## 8. Étape 2 — Transfert des fichiers

### Fichiers à transférer

```bash
# Depuis le VPS actuel vers le nouveau
NEW_VPS="root@xxx.xxx.xxx.xxx"

# 1. Code source (ou git clone)
rsync -avz --exclude=node_modules --exclude=.next --exclude=bot/dist \
  /root/rpb-dashboard/ $NEW_VPS:/root/rpb-dashboard/

# 2. Backup PostgreSQL
scp /root/rpb_backup.dump $NEW_VPS:/root/rpb_backup.dump

# 3. Backup Redis
scp /root/rpb_redis.rdb $NEW_VPS:/root/rpb_redis.rdb

# 4. Fichier .env (CRITIQUE — contient tous les secrets)
scp /root/rpb-dashboard/.env $NEW_VPS:/root/rpb-dashboard/.env

# 5. Uploads utilisateurs
rsync -avz /root/rpb-dashboard/public/uploads/ $NEW_VPS:/root/rpb-dashboard/public/uploads/

# 6. Data directory
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

## 9. Étape 3 — Configuration du nouveau VPS

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

## 10. Étape 4 — Déploiement Docker

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

## 11. Étape 5 — Restauration des données

### PostgreSQL — Restaurer le dump

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

## 12. Étape 6 — Redis

### Installer et configurer Redis

```bash
# Installer Redis
sudo apt-get install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Vérifier que Redis tourne
redis-cli ping
# Attendu : PONG
```

### Restaurer les données Redis

```bash
# Arrêter Redis
sudo systemctl stop redis-server

# Copier le dump RDB
sudo cp /root/rpb_redis.rdb /var/lib/redis/dump.rdb
sudo chown redis:redis /var/lib/redis/dump.rdb

# Redémarrer Redis (charge automatiquement le dump)
sudo systemctl start redis-server

# Vérifier les données restaurées
redis-cli dbsize
# Attendu : (integer) 2

redis-cli keys '*'
# Attendu : rpb:mentions, rpb:mentions:meta
```

> **Note** : Redis écoute sur `127.0.0.1:6379` sans mot de passe.
> Le bot se connecte en dur à cette adresse (`bot/src/lib/redis.ts:16`).
> Pas besoin de configurer l'authentification Redis.

---

## 13. Étape 7 — SSL et DNS

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

## 14. Étape 8 — Discord Bot + Crontab

Le bot tourne via **systemd**, pas Docker.

### Installer les dépendances

```bash
cd /root/rpb-dashboard
pnpm install
pnpm bot:build
```

### Configurer le service systemd

> **IMPORTANT** : Adapter le chemin `ExecStart` selon l'installation Node.js.
> - Si Node.js via **apt** (nodesource) : `/usr/bin/node`
> - Si Node.js via **nvm** : `/root/.nvm/versions/node/v24.x.x/bin/node`
> - Vérifier avec : `which node`

```bash
NODE_PATH=$(which node)

cat > /etc/systemd/system/rpb-bot.service << EOF
[Unit]
Description=RPB Discord Bot
After=network.target postgresql.service redis-server.service

[Service]
Type=simple
User=root
WorkingDirectory=/root/rpb-dashboard
ExecStart=${NODE_PATH} bot/dist/index.js
Restart=always
RestartSec=10
EnvironmentFile=/root/rpb-dashboard/.env
Environment=NODE_ENV=production
Environment=NODE_OPTIONS=--max-old-space-size=2048

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable rpb-bot
systemctl start rpb-bot
```

### Vérifier le bot

```bash
systemctl status rpb-bot
journalctl -u rpb-bot -f
# Attendu : "Logged in as RPB Bot#xxxx"
```

> **Note** : Le bot se connecte à la DB via `DATABASE_URL` dans `.env` (`localhost:5432`).
> Il se connecte à Redis en dur sur `127.0.0.1:6379`.

### Configurer le crontab

```bash
# Créer le dossier logs
mkdir -p /root/rpb-dashboard/logs

# Installer le crontab
crontab -l 2>/dev/null > /tmp/rpb_cron || true
cat >> /tmp/rpb_cron << 'EOF'

# RPB — Sync tournoi BTS (chaque minute)
* * * * * cd /root/rpb-dashboard && ./node_modules/.bin/tsx scripts/sync-bts2.ts >> logs/cron-bts2.log 2>&1

# RPB — Sync YouTube BeyTube (chaque heure)
0 * * * * cd /root/rpb-dashboard && ./node_modules/.bin/tsx scripts/sync-youtube-beytube.ts >> logs/cron-youtube.log 2>&1

# RPB — Maintenance quotidienne (8h UTC)
0 8 * * * /root/rpb-dashboard/scripts/maintenance.sh >> /root/rpb-dashboard/logs/maintenance.log 2>&1
EOF
crontab /tmp/rpb_cron
rm /tmp/rpb_cron
```

### Vérifier le crontab

```bash
crontab -l
# Attendu : 3 entrées RPB

# Tester manuellement le script de maintenance
bash /root/rpb-dashboard/scripts/maintenance.sh
```

---

## 15. Vérification post-migration

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
[ ] Redis opérationnel (redis-cli ping → PONG)
[ ] Données mentions Redis restaurées (redis-cli dbsize → 2)
[ ] Crontab actif (crontab -l → 3 entrées RPB)
[ ] Logs cron se remplissent (tail -f logs/cron-bts2.log)
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

# Redis intégrité
redis-cli dbsize
redis-cli hlen rpb:mentions

# Cron actif
crontab -l | grep -c rpb
# Attendu : 3
```

---

## 16. Rollback en cas de problème

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

## 17. Annexes

### A. Estimation du downtime

| Étape | Durée estimée |
|-------|---------------|
| Dump DB + Redis | ~2 secondes |
| Transfert fichiers (rsync) | ~2-5 minutes |
| Build Docker image | ~5-10 minutes |
| Restore DB + Redis | ~5 secondes |
| Configuration crontab + systemd | ~2 minutes |
| Propagation DNS (TTL 300s) | ~5 minutes |
| Tests et vérifications | ~5 minutes |
| **Total** | **~20-30 minutes** |

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
REDIS_FILE="/root/rpb_redis.rdb"

echo "=== RPB Migration Script ==="

echo "1. Dump PostgreSQL..."
docker exec rpb-db pg_dump -U postgres -Fc rpb_dashboard > "$BACKUP_FILE"
echo "   Dump créé : $(ls -lh $BACKUP_FILE | awk '{print $5}')"

echo "2. Dump Redis..."
redis-cli --rdb "$REDIS_FILE"
echo "   Redis dump : $(ls -lh $REDIS_FILE | awk '{print $5}')"

echo "3. Transfert des backups..."
scp "$BACKUP_FILE" "$NEW_VPS:/root/rpb_backup.dump"
scp "$REDIS_FILE" "$NEW_VPS:/root/rpb_redis.rdb"

echo "4. Transfert du .env..."
scp /root/rpb-dashboard/.env "$NEW_VPS:/root/rpb-dashboard/.env"

echo "5. Sync des uploads..."
rsync -avz /root/rpb-dashboard/public/uploads/ "$NEW_VPS:/root/rpb-dashboard/public/uploads/"

echo "6. Sync du dossier data..."
rsync -avz /root/rpb-dashboard/data/ "$NEW_VPS:/root/rpb-dashboard/data/"

echo "7. Export du crontab..."
crontab -l > /tmp/rpb_crontab_export.txt
scp /tmp/rpb_crontab_export.txt "$NEW_VPS:/root/rpb_crontab_export.txt"

echo "=== Transfert terminé ==="
echo ""
echo "Sur le nouveau VPS, exécuter :"
echo "  # Docker + DB"
echo "  docker volume create rpb-db"
echo "  docker compose -f docker-compose.prod.yml up -d db"
echo "  docker exec -i rpb-db pg_restore -U postgres -d rpb_dashboard --clean --if-exists < /root/rpb_backup.dump"
echo "  docker compose -f docker-compose.prod.yml up -d"
echo ""
echo "  # Redis"
echo "  sudo systemctl stop redis-server"
echo "  sudo cp /root/rpb_redis.rdb /var/lib/redis/dump.rdb"
echo "  sudo chown redis:redis /var/lib/redis/dump.rdb"
echo "  sudo systemctl start redis-server"
echo ""
echo "  # Crontab"
echo "  crontab /root/rpb_crontab_export.txt"
echo ""
echo "  # Bot"
echo "  cd /root/rpb-dashboard && pnpm install && pnpm bot:build"
echo "  systemctl enable rpb-bot && systemctl start rpb-bot"
```

### D. Backups automatiques recommandés

Après migration, mettre en place un cron de backup :

```bash
# /etc/cron.d/rpb-backup
# Backup quotidien à 4h du matin
0 4 * * * root docker exec rpb-db pg_dump -U postgres -Fc rpb_dashboard > /root/backups/rpb_$(date +\%Y\%m\%d).dump && find /root/backups -name "rpb_*.dump" -mtime +7 -delete
```

Cela garde les 7 derniers jours de backups et supprime automatiquement les plus anciens.
