#!/usr/bin/env bash
# deploy.sh — Deploy RPB Dashboard + Bot via systemd/Bun
# Usage: ./scripts/deploy.sh [--skip-bot|--skip-dashboard|--no-sync]
set -euo pipefail

APP="/home/ubuntu/rpb-dashboard"
STANDALONE="$APP/.next/standalone"

SKIP_BOT=0
SKIP_DASHBOARD=0
SYNC_DB=1
for arg in "$@"; do
  case "$arg" in
    --skip-bot)        SKIP_BOT=1 ;;
    --skip-dashboard)  SKIP_DASHBOARD=1 ;;
    --no-sync)         SYNC_DB=0 ;;
    -h|--help)
      echo "Usage: $0 [--skip-bot|--skip-dashboard|--no-sync]"
      exit 0 ;;
    *) echo "Unknown option: $arg"; exit 1 ;;
  esac
done

# Colors
C_CYAN='\033[0;36m'; C_GREEN='\033[0;32m'; C_YELLOW='\033[1;33m'
C_RED='\033[0;31m'; C_NC='\033[0m'
log()  { echo -e "${C_CYAN}[$1]${C_NC} $2"; }
ok()   { echo -e "${C_GREEN}[ OK ]${C_NC} $1"; }
warn() { echo -e "${C_YELLOW}[WARN]${C_NC} $1"; }
err()  { echo -e "${C_RED}[ERR ]${C_NC} $1" >&2; }

STEP=0
TOTAL=8
next() { STEP=$((STEP + 1)); log "$STEP/$TOTAL" "$1"; }

rollback() {
  err "Deploy failed — attempting rollback of recently restarted services"
  [ "$SKIP_DASHBOARD" = 0 ] && sudo systemctl restart rpb-dashboard || true
  [ "$SKIP_BOT" = 0 ]       && sudo systemctl restart rpb-bot || true
  exit 1
}
trap rollback ERR

echo "=== RPB Dashboard Deploy ==="
cd "$APP"

# 1. Git pull
next "git pull --ff-only"
git pull --ff-only || warn "git pull skipped (no remote or local changes)"

# 2. Install deps (don't silence failures)
next "bun install"
if ! bun install --frozen-lockfile; then
  warn "frozen-lockfile failed, retrying without lock"
  bun install
fi

# 3. Sync DB schema (optional, skippable via --no-sync)
if [ "$SYNC_DB" = 1 ]; then
  next "bun db:generate + db:push"
  bun db:generate
  bun db:push --accept-data-loss=false --skip-generate || warn "db:push failed — continuing"
else
  next "bun db:generate (skipped db:push)"
  bun db:generate
fi

# 4. Build dashboard + bot
next "build dashboard + bot"
if [ "$SKIP_DASHBOARD" = 0 ]; then
  bun run build
fi
if [ "$SKIP_BOT" = 0 ]; then
  (cd "$APP/bot" && bun run build)
fi

# 5. Copy static assets into standalone
next "copy assets into standalone"
if [ "$SKIP_DASHBOARD" = 0 ]; then
  rm -rf "$STANDALONE/.next/static" "$STANDALONE/public" "$STANDALONE/data" "$STANDALONE/prisma" 2>/dev/null || true
  cp -r "$APP/.next/static" "$STANDALONE/.next/static"
  cp -r "$APP/public" "$STANDALONE/public"
  [ -d "$APP/data" ]   && cp -r "$APP/data"   "$STANDALONE/data"
  [ -d "$APP/prisma" ] && cp -r "$APP/prisma" "$STANDALONE/prisma"
  [ -f "$APP/prisma.config.ts" ] && cp "$APP/prisma.config.ts" "$STANDALONE/prisma.config.ts"
fi

# 6. Systemd reload + enable
next "systemd daemon-reload + enable"
sudo systemctl daemon-reload
sudo systemctl enable rpb-dashboard rpb-bot >/dev/null

# 7. Restart services
next "restart services"
if [ "$SKIP_DASHBOARD" = 0 ]; then
  sudo systemctl restart rpb-dashboard
  ok "rpb-dashboard restarted"
fi
if [ "$SKIP_BOT" = 0 ]; then
  sudo systemctl restart rpb-bot
  ok "rpb-bot restarted"
fi

# Allow startup
sleep 2

# 8. Health checks — disable trap (no more deploy actions to roll back)
trap - ERR
next "health checks"

dashboard_ok=1
bot_ok=1

if [ "$SKIP_DASHBOARD" = 0 ]; then
  code=$(curl -sf -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/api/health || echo "000")
  if [[ "$code" =~ ^(200|304)$ ]]; then
    ok "dashboard UP (port 3000, HTTP $code)"
  else
    err "dashboard health check failed (HTTP $code)"
    journalctl -u rpb-dashboard --no-pager -n 15
    dashboard_ok=0
  fi
fi

if [ "$SKIP_BOT" = 0 ]; then
  # 401 is expected without API key — bot is up but auth-protected
  code=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3001/api/status || echo "000")
  if [[ "$code" =~ ^(200|304|401)$ ]]; then
    ok "bot UP (port 3001, HTTP $code)"
  else
    err "bot health check failed (HTTP $code)"
    journalctl -u rpb-bot --no-pager -n 15
    bot_ok=0
  fi
fi

if [ "$dashboard_ok" = 0 ] || [ "$bot_ok" = 0 ]; then
  err "Deploy completed with health-check failures — inspect logs above"
  exit 2
fi

echo "=== Deploy complete ==="
