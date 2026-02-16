#!/bin/bash
set -e

echo ">>> 🛑 STOPPING EXTERNAL SERVICES..."
# Stop the systemd bot service
systemctl stop rpb-bot.service || true
systemctl disable rpb-bot.service || true

# Stop Coolify Proxy (Traefik) to free up ports 80/443
echo ">>> 🛑 STOPPING COOLIFY PROXY..."
docker stop coolify-proxy || true
docker rm coolify-proxy || true

# Stop the standalone DB we made earlier (to avoid conflicts with the new compose stack)
echo ">>> 🛑 STOPPING STANDALONE DB..."
docker stop rpb-db-standalone || true
docker rm rpb-db-standalone || true

# Ensure proper permissions for uploads
echo ">>> 🔧 FIXING PERMISSIONS..."
mkdir -p public/uploads
chmod -R 775 public/uploads
chown -R 1001:1001 public/uploads # NextJS user ID

echo ">>> 🔐 INITIALIZING SSL..."
./scripts/init-ssl.sh

echo ">>> 🚀 STARTING FULL STACK..."
docker compose -f docker-compose.prod.yml up -d --build --remove-orphans

echo ">>> ✅ MIGRATION COMPLETE!"
echo "Status:"
docker compose -f docker-compose.prod.yml ps
