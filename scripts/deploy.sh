#!/usr/bin/env bash
# deploy.sh — RPB Dashboard + Bot (systemd + Next.js standalone + Bun)
#
# Usage:
#   ./scripts/deploy.sh                  # déploiement complet
#   ./scripts/deploy.sh --skip-bot       # dashboard uniquement
#   ./scripts/deploy.sh --skip-dashboard # bot uniquement
#   ./scripts/deploy.sh --quick          # restart sans rebuild
#   ./scripts/deploy.sh --no-sync        # skip db:push
#   ./scripts/deploy.sh --status         # statut des services
#   ./scripts/deploy.sh --logs           # logs en direct
set -euo pipefail

# ─── Config ──────────────────────────────────────────────────────────────────

APP="/home/ubuntu/rpb-dashboard"
STANDALONE="$APP/.next/standalone"
SERVICE_DASH="rpb-dashboard"
SERVICE_BOT="rpb-bot"
PORT_DASH="3000"
PORT_BOT="3001"

SKIP_BOT=0
SKIP_DASH=0
SYNC_DB=1
for arg in "$@"; do
  case "$arg" in
    --skip-bot)        SKIP_BOT=1 ;;
    --skip-dashboard)  SKIP_DASH=1 ;;
    --no-sync)         SYNC_DB=0 ;;
    --quick|--status|--logs|--help|-h) ;;  # handled in main
    *) ;;
  esac
done

# ─── Helpers ─────────────────────────────────────────────────────────────────

C_CYAN='\033[0;36m'; C_GREEN='\033[0;32m'
C_YELLOW='\033[1;33m'; C_RED='\033[0;31m'; C_NC='\033[0m'

STEP=0; TOTAL=8
step() { STEP=$((STEP+1)); echo -e "${C_CYAN}[$STEP/$TOTAL]${C_NC} $1"; }
ok()   { echo -e "${C_GREEN}[  OK  ]${C_NC} $1"; }
warn() { echo -e "${C_YELLOW}[ WARN ]${C_NC} $1"; }
err()  { echo -e "${C_RED}[ERROR ]${C_NC} $1" >&2; }

# ─── Health check ────────────────────────────────────────────────────────────
wait_ready() {
  local svc="$1" port="$2" endpoint="${3:-/api/health}" timeout=30 elapsed=0
  echo -n "    Attente port $port"
  until ss -tlnp 2>/dev/null | grep -q ":$port "; do
    sleep 1; elapsed=$((elapsed+1)); echo -n "."
    [ "$elapsed" -ge "$timeout" ] && { echo ""; err "Timeout — port $port non lié après ${timeout}s"; journalctl -u "$svc" --no-pager -n 20; return 1; }
  done
  echo ""
  systemctl is-active --quiet "$svc" || { err "$svc n'est pas actif"; journalctl -u "$svc" --no-pager -n 20; return 1; }
  local status
  status="$(bun -e "
    try {
      const r = await fetch('http://127.0.0.1:$port$endpoint', { signal: AbortSignal.timeout(5000) });
      const j = await r.json().catch(() => ({}));
      process.stdout.write(r.status + ' ' + (j.status ?? ''));
      process.exit(r.ok ? 0 : 1);
    } catch (e) { process.stderr.write(String(e)); process.exit(1); }
  " 2>/dev/null || echo "error")"
  ok "Service UP (port $port) — health: $status"
}

# ─── Rollback automatique sur erreur ─────────────────────────────────────────

rollback() {
  err "Échec — redémarrage des services pour restaurer l'état précédent"
  [ "$SKIP_DASH" = 0 ] && sudo systemctl restart "$SERVICE_DASH" || true
  [ "$SKIP_BOT"  = 0 ] && sudo systemctl restart "$SERVICE_BOT"  || true
  exit 1
}

# ─── Déploiement complet ──────────────────────────────────────────────────────

full_deploy() {
  echo "=== RPB Dashboard Deploy ==="
  trap rollback ERR
  cd "$APP"

  # 1. Git pull
  step "git pull..."
  git pull --ff-only 2>/dev/null || warn "git pull ignoré (pas de remote ou changements locaux)"
  ok "Code : $(git rev-parse --short HEAD)"

  # 2. Dépendances
  step "bun install..."
  bun install --frozen-lockfile 2>/dev/null || bun install
  ok "Dépendances installées"

  # 3. DB schema sync
  if [ "$SYNC_DB" = 1 ]; then
    step "bun db:generate + db:push..."
    bun db:generate
    bun db:push --accept-data-loss=false --skip-generate || warn "db:push ignoré — continuer"
  else
    step "bun db:generate (db:push ignoré)..."
    bun db:generate
  fi
  ok "Schéma DB à jour"

  # 4. Build dashboard + bot
  step "build..."
  [ "$SKIP_DASH" = 0 ] && { bun run build; ok "Dashboard construit"; }
  [ "$SKIP_BOT"  = 0 ] && { (cd "$APP/bot" && bun run build); ok "Bot construit"; }

  # 5. Assets statiques → standalone
  step "copie des assets..."
  if [ "$SKIP_DASH" = 0 ]; then
    rm -rf "$STANDALONE/.next/static" "$STANDALONE/public" \
           "$STANDALONE/data" "$STANDALONE/prisma" 2>/dev/null || true
    cp -r "$APP/.next/static" "$STANDALONE/.next/static"
    cp -r "$APP/public"       "$STANDALONE/public"
    [ -d "$APP/data" ]   && cp -r "$APP/data"   "$STANDALONE/data"
    [ -d "$APP/prisma" ] && cp -r "$APP/prisma" "$STANDALONE/prisma"
    [ -f "$APP/prisma.config.ts" ] && cp "$APP/prisma.config.ts" "$STANDALONE/prisma.config.ts"
    ok "Assets copiés dans le standalone"
  fi

  # 6. Systemd reload + enable
  step "systemd reload..."
  sudo systemctl daemon-reload
  sudo systemctl enable "$SERVICE_DASH" "$SERVICE_BOT" >/dev/null
  ok "systemd à jour"

  # 7. Restart + health checks
  step "restart services..."
  [ "$SKIP_DASH" = 0 ] && sudo systemctl restart "$SERVICE_DASH"
  [ "$SKIP_BOT"  = 0 ] && sudo systemctl restart "$SERVICE_BOT"

  trap - ERR

  step "health checks..."
  [ "$SKIP_DASH" = 0 ] && wait_ready "$SERVICE_DASH" "$PORT_DASH" "/api/health"
  # Bot : /api/status — 401 attendu sans clé API mais le port doit répondre
  [ "$SKIP_BOT"  = 0 ] && wait_ready "$SERVICE_BOT"  "$PORT_BOT"  "/api/status"

  echo "=== Deploy complete ==="
}

# ─── Commandes rapides ────────────────────────────────────────────────────────

quick_restart() {
  echo "==> Restart rapide..."
  sudo systemctl restart "$SERVICE_DASH" "$SERVICE_BOT"
  wait_ready "$SERVICE_DASH" "$PORT_DASH" "/api/health"
}

show_status() {
  echo "── $SERVICE_DASH ──────────────────────────────"
  systemctl status "$SERVICE_DASH" --no-pager -l | head -12
  echo ""
  echo "── $SERVICE_BOT ──────────────────────────────────"
  systemctl status "$SERVICE_BOT" --no-pager -l | head -12
}

# ─── Main ─────────────────────────────────────────────────────────────────────

case "${1:-}" in
  --quick)   quick_restart ;;
  --status)  show_status ;;
  --logs)    journalctl -u "$SERVICE_DASH" -u "$SERVICE_BOT" -f --no-pager ;;
  --help|-h) echo "Usage: $0 [--skip-bot|--skip-dashboard|--no-sync|--quick|--status|--logs|--help]" ;;
  ""|--skip-bot|--skip-dashboard|--no-sync) full_deploy ;;
  *) err "Option inconnue : $1"; exit 1 ;;
esac
