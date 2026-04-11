#!/bin/bash

# RPB Dashboard - Master Maintenance Script
# This script is intended to be run via cron (e.g., daily at 8:00 AM)

# Navigate to project directory
cd /root/rpb-dashboard

echo "--- Starting RPB Maintenance: $(date) ---"

# 1. Sync Staff from Discord
echo "[1/4] Syncing Staff..."
bun scripts/sync-staff-db.ts

# 2. Sync YouTube (BeyTube)
echo "[2/4] Syncing BeyTube Videos..."
bun scripts/sync-youtube-beytube.ts

# 3. Recalculate Rankings
echo "[3/4] Recalculating Rankings..."
# Use a custom script that handles the logic without Next.js overhead
bun scripts/cron-recalculate.ts

# 4. Daily Briefing to Discord
echo "[4/4] Sending Daily Briefing..."
bun scripts/daily-briefing.ts

echo "--- Maintenance Complete: $(date) ---"
