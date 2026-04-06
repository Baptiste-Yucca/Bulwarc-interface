#!/bin/sh
set -e

echo "=== Starting BulwArc ==="

# Start nginx in background
nginx -g "daemon on;"
echo "Nginx started on :80"

# Start backend (foreground)
cd /app/backend
exec npx tsx src/index.ts
