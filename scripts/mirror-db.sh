#!/bin/bash

# Configuration
CONTAINER_PROD="rpb-db"
CONTAINER_LOCAL="rpb-db-local"
DB_NAME="rpb_dashboard"
USER="postgres"

echo ">>> Exporting data from production container..."
docker exec $CONTAINER_PROD pg_dump -U $USER $DB_NAME > dump.sql

echo ">>> Importing data into local container..."
cat dump.sql | docker exec -i $CONTAINER_LOCAL psql -U $USER $DB_NAME

echo ">>> Cleaning up..."
rm dump.sql

echo ">>> Mirroring complete!"
