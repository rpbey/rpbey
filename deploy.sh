#!/usr/bin/env bash
# Redirige vers scripts/deploy.sh (point d'entrée principal)
exec "$(dirname "$0")/scripts/deploy.sh" "$@"
