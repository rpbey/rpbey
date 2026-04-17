#!/bin/bash
set -euo pipefail

# ─────────────────────────────────────────────
# RPB Dashboard — Script de déploiement Docker
# ─────────────────────────────────────────────

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
COMPOSE_FILE="$PROJECT_DIR/docker-compose.prod.yml"
DASHBOARD_CONTAINER="rpb-dashboard"
DB_CONTAINER="rpb-db"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()   { echo -e "${CYAN}[DEPLOY]${NC} $1"; }
ok()    { echo -e "${GREEN}[  OK  ]${NC} $1"; }
warn()  { echo -e "${YELLOW}[ WARN ]${NC} $1"; }
error() { echo -e "${RED}[ERROR ]${NC} $1"; exit 1; }

usage() {
  echo "Usage: $0 [OPTION]"
  echo ""
  echo "Options:"
  echo "  (aucune)      Déploiement complet (pull, build, restart)"
  echo "  --quick       Redémarrage rapide sans rebuild"
  echo "  --build-only  Build l'image sans redémarrer"
  echo "  --logs        Afficher les logs du dashboard"
  echo "  --status      Afficher le statut des services"
  echo "  --down        Arrêter tous les services"
  echo "  --db-only     Démarrer uniquement la base de données"
  echo "  --help        Afficher cette aide"
  exit 0
}

# ─── Vérifications ───

check_requirements() {
  command -v docker >/dev/null 2>&1 || error "Docker n'est pas installé"
  docker info >/dev/null 2>&1 || error "Le daemon Docker n'est pas accessible"
  [ -f "$COMPOSE_FILE" ] || error "docker-compose.prod.yml introuvable"
  [ -f "$PROJECT_DIR/.env" ] || error "Fichier .env introuvable"
}

# ─── Fonctions ───

pull_latest() {
  log "Pull des dernières modifications..."
  cd "$PROJECT_DIR"
  git pull --rebase origin main || warn "Git pull échoué — on continue avec le code local"
  ok "Code à jour"
}

ensure_db_volume() {
  if ! docker volume inspect rpb-db >/dev/null 2>&1; then
    log "Création du volume rpb-db..."
    docker volume create rpb-db
    ok "Volume rpb-db créé"
  fi
}

start_db() {
  log "Démarrage de la base de données..."
  docker compose -f "$COMPOSE_FILE" up -d db
  log "Attente du healthcheck PostgreSQL..."
  local retries=30
  while [ $retries -gt 0 ]; do
    if docker inspect --format='{{.State.Health.Status}}' "$DB_CONTAINER" 2>/dev/null | grep -q healthy; then
      ok "PostgreSQL est prêt"
      return
    fi
    retries=$((retries - 1))
    sleep 1
  done
  error "PostgreSQL n'a pas démarré dans les temps"
}

build_dashboard() {
  log "Build de l'image dashboard (cela peut prendre quelques minutes)..."
  docker compose -f "$COMPOSE_FILE" build dashboard --no-cache
  ok "Image dashboard construite"
}

deploy_dashboard() {
  log "Déploiement du dashboard..."
  docker compose -f "$COMPOSE_FILE" up -d dashboard
  ok "Dashboard démarré"
}

wait_healthy() {
  log "Vérification du healthcheck dashboard..."
  local retries=60
  while [ $retries -gt 0 ]; do
    local status
    status=$(docker inspect --format='{{.State.Health.Status}}' "$DASHBOARD_CONTAINER" 2>/dev/null || echo "unknown")
    case "$status" in
      healthy)
        ok "Dashboard opérationnel sur le port 3000"
        return
        ;;
      unhealthy)
        warn "Dashboard unhealthy — vérifiez les logs avec: $0 --logs"
        return
        ;;
    esac
    retries=$((retries - 1))
    sleep 2
  done
  warn "Timeout healthcheck — le dashboard démarre peut-être encore"
}

show_status() {
  echo ""
  log "Statut des services :"
  echo "────────────────────────────────────────"
  docker compose -f "$COMPOSE_FILE" ps
  echo "────────────────────────────────────────"
  echo ""
  local dash_status db_status
  dash_status=$(docker inspect --format='{{.State.Health.Status}}' "$DASHBOARD_CONTAINER" 2>/dev/null || echo "arrêté")
  db_status=$(docker inspect --format='{{.State.Health.Status}}' "$DB_CONTAINER" 2>/dev/null || echo "arrêté")
  echo -e "  PostgreSQL : ${db_status}"
  echo -e "  Dashboard  : ${dash_status}"
  echo ""
}

cleanup_old_images() {
  local dangling
  dangling=$(docker images -f "dangling=true" -q 2>/dev/null | wc -l)
  if [ "$dangling" -gt 0 ]; then
    log "Nettoyage de $dangling image(s) orpheline(s)..."
    docker image prune -f >/dev/null 2>&1
    ok "Images nettoyées"
  fi
}

# ─── Commandes ───

full_deploy() {
  log "Déploiement complet de RPB Dashboard"
  echo "════════════════════════════════════════"
  check_requirements
  pull_latest
  ensure_db_volume
  start_db
  build_dashboard
  deploy_dashboard
  wait_healthy
  cleanup_old_images
  show_status
  ok "Déploiement terminé !"
}

quick_restart() {
  log "Redémarrage rapide (sans rebuild)..."
  check_requirements
  ensure_db_volume
  docker compose -f "$COMPOSE_FILE" up -d
  wait_healthy
  show_status
  ok "Redémarrage terminé"
}

# ─── Main ───

case "${1:-}" in
  --quick)      quick_restart ;;
  --build-only) check_requirements && build_dashboard ;;
  --logs)       docker compose -f "$COMPOSE_FILE" logs -f dashboard ;;
  --status)     check_requirements && show_status ;;
  --down)       docker compose -f "$COMPOSE_FILE" down && ok "Services arrêtés" ;;
  --db-only)    check_requirements && ensure_db_volume && start_db ;;
  --help|-h)    usage ;;
  "")           full_deploy ;;
  *)            error "Option inconnue: $1 — utilisez --help" ;;
esac
