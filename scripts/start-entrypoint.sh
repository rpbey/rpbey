#!/bin/sh
set -e

echo ">>> RPB Dashboard starting..."

# Handle Google Credentials from Env Var
if [ -n "$GOOGLE_SERVICE_ACCOUNT_JSON" ]; then
  echo "$GOOGLE_SERVICE_ACCOUNT_JSON" > /app/google-credentials.json
  export GOOGLE_APPLICATION_CREDENTIALS="/app/google-credentials.json"
fi

# Run database migrations
echo ">>> Running database migrations..."
./node_modules/.bin/prisma migrate deploy || echo ">>> WARNING: Migrations failed or not needed."

echo ">>> Starting Next.js dashboard..."
export NODE_OPTIONS="--max-old-space-size=1024"

if [ -f "server.js" ]; then
  exec node server.js
elif [ -f ".next/standalone/server.js" ]; then
  exec node .next/standalone/server.js
else
  echo "ERROR: server.js not found!"
  exit 1
fi
