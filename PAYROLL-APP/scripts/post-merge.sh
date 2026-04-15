#!/bin/bash
set -e

echo "=== Post-merge setup ==="

echo "Installing npm dependencies..."
npm install --no-fund --no-audit 2>&1

if [ -d "client" ]; then
  echo "Installing Angular client dependencies..."
  (cd client && npm install --no-fund --no-audit 2>&1)

  echo "Building Angular client..."
  (cd client && npx ng build 2>&1)
fi

echo "=== Post-merge setup complete ==="
