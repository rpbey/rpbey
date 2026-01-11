#!/bin/sh
set -e

echo ">>> ENTRYPOINT STARTED"
echo ">>> RUN_BOT value: '$RUN_BOT'"
echo ">>> PORT value: '$PORT'"
echo ">>> BOT_API_PORT value: '$BOT_API_PORT'"

if [ "$RUN_BOT" = "true" ]; then
  echo ">>> STARTING BOT SERVICE..."
  # Ensure we use the correct port if provided
  exec node bot/dist/index.js
else
  echo ">>> STARTING DASHBOARD SERVICE (Next.js)..."
  exec node server.js
fi
