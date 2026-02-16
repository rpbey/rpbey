#!/bin/sh
set -e

echo ">>> ENTRYPOINT STARTED"
echo ">>> RUN_BOT value: '$RUN_BOT'"
echo ">>> PORT value: '$PORT'"
echo ">>> BOT_API_PORT value: '$BOT_API_PORT'"

# Handle Google Credentials from Env Var (for Coolify/Docker)
if [ -n "$GOOGLE_SERVICE_ACCOUNT_JSON" ]; then
  echo ">>> DETECTED GOOGLE_SERVICE_ACCOUNT_JSON"
  echo "$GOOGLE_SERVICE_ACCOUNT_JSON" > /app/google-credentials.json
  export GOOGLE_APPLICATION_CREDENTIALS="/app/google-credentials.json"
  echo ">>> Google credentials written to $GOOGLE_APPLICATION_CREDENTIALS"
fi

# Run database migrations
echo ">>> RUNNING DATABASE MIGRATIONS..."
./node_modules/.bin/prisma migrate deploy || echo ">>> WARNING: Migrations failed or not needed."

if [ "$RUN_BOT" = "true" ]; then
  echo ">>> STARTING DISCORD BOT..."
  exec node bot/dist/index.js
else
  echo ">>> STARTING DASHBOARD SERVICE (Next.js)..."
  # Clean standalone entrypoint (files are in root)
  if [ -f "server.js" ]; then
    exec node server.js
  elif [ -f ".next/standalone/server.js" ]; then
    exec node .next/standalone/server.js
  else
    echo "ERROR: server.js not found!"
    exit 1
  fi
fi
