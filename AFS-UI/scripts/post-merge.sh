#!/bin/bash
set -e

echo "=== Post-merge setup ==="

echo "Installing server dependencies..."
cd server && npm install --no-audit --no-fund 2>&1 && cd ..

echo "Installing client dependencies..."
cd client && npm install --no-audit --no-fund 2>&1 && cd ..

echo "Running pending SQL migrations..."
DB_URL="${DATABASE_URL:-postgresql://postgres:password@helium/heliumdb?sslmode=disable}"
for f in server/src/migrations/*.sql; do
  echo "  Applying: $(basename $f)"
  psql "$DB_URL" -f "$f" 2>&1
done

echo "=== Post-merge setup complete ==="
