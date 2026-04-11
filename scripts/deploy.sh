#!/usr/bin/env bash
# deploy.sh — Deploy RPB Dashboard sans Docker (Vercel-like)
# Usage: ./scripts/deploy.sh
set -euo pipefail

APP="/home/ubuntu/rpb-dashboard"
STANDALONE="$APP/.next/standalone"

echo "=== RPB Dashboard Deploy ==="
cd "$APP"

# 0. Stop Docker dashboard if running (migration vers systemd)
if sudo docker ps --format '{{.Names}}' | grep -q rpb-dashboard; then
    echo "[0] stopping Docker rpb-dashboard container..."
    sudo docker stop rpb-dashboard
    sudo docker rm rpb-dashboard 2>/dev/null || true
fi

# 1. Pull latest
echo "[1/6] git pull..."
git pull --ff-only 2>/dev/null || echo "skip git pull (pas de remote ou changements locaux)"

# 2. Install deps
echo "[2/6] bun install..."
bun install --frozen-lockfile 2>/dev/null || bun install

# 3. Generate Prisma client + build
echo "[3/6] prisma generate + build dashboard + bot..."
bun db:generate
bun run build
cd "$APP/bot" && bun run build && cd "$APP"

# 4. Copy static assets into standalone
echo "[4/6] copy static assets..."
cp -r "$APP/.next/static" "$STANDALONE/.next/static"
cp -r "$APP/public" "$STANDALONE/public"
[ -d "$APP/data" ] && cp -r "$APP/data" "$STANDALONE/data"
[ -d "$APP/prisma" ] && cp -r "$APP/prisma" "$STANDALONE/prisma"
[ -f "$APP/prisma.config.ts" ] && cp "$APP/prisma.config.ts" "$STANDALONE/prisma.config.ts"

# 5. Systemd reload + enable
echo "[5/7] systemd reload..."
sudo systemctl daemon-reload
sudo systemctl enable rpb-dashboard rpb-bot

# 6. Restart dashboard
echo "[6/7] restart rpb-dashboard..."
sudo systemctl restart rpb-dashboard

# 7. Restart bot
echo "[7/7] restart rpb-bot..."
sudo systemctl restart rpb-bot

# Wait for startup
sleep 2

# Health checks
echo "--- Health checks ---"
if curl -sf -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/api/health | grep -q "200\|304"; then
    echo "Dashboard UP (port 3000)"
else
    echo "WARN: dashboard health check failed"
    journalctl -u rpb-dashboard --no-pager -n 10
fi

if curl -sf -o /dev/null -w "%{http_code}" http://127.0.0.1:3001/api/status | grep -q "200\|304"; then
    echo "Bot UP (port 3001)"
else
    echo "WARN: bot health check failed"
    journalctl -u rpb-bot --no-pager -n 10
fi

echo "=== Deploy complete ==="
