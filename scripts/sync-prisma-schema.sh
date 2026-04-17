#!/usr/bin/env bash
# Sync bot/prisma/schema.prisma from the dashboard schema (source of truth).
#
# Usage:
#   scripts/sync-prisma-schema.sh         # copy dashboard → bot
#   scripts/sync-prisma-schema.sh --check # exit 1 if drift detected (CI use)
set -euo pipefail

SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/prisma/schema.prisma"
DST="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/bot/prisma/schema.prisma"

if [[ ! -f "$SRC" ]]; then
  echo "ERROR: source schema not found at $SRC" >&2
  exit 2
fi

if [[ "${1:-}" == "--check" ]]; then
  if ! diff -q "$SRC" "$DST" >/dev/null 2>&1; then
    echo "ERROR: $DST is out of sync with $SRC" >&2
    echo "Run 'scripts/sync-prisma-schema.sh' to reconcile." >&2
    diff -u "$SRC" "$DST" | head -40 >&2 || true
    exit 1
  fi
  echo "✓ Prisma schema in sync"
  exit 0
fi

cp "$SRC" "$DST"
echo "✓ Copied $SRC → $DST"
