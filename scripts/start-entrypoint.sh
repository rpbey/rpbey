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

if [ "$RUN_BOT" = "true" ]; then
  echo ">>> STARTING BOT SERVICE..."
  # Ensure we use the correct port if provided
  exec node bot/dist/index.js
else
  echo ">>> STARTING DASHBOARD SERVICE (Next.js)..."
  exec node server.js
fi
