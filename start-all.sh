#!/bin/bash
echo "Starting AFS API on port 3004..."
PORT=3004 AFS-UI/api/node_modules/.bin/tsx AFS-UI/api/index.ts &

echo "Starting POS API on port 3003..."
cd POS-API && PORT=3003 npx tsx index.ts &
cd /home/runner/workspace

echo "Starting Payroll API on port 6000..."
cd PAYROLL-APP && PORT=6000 node src/server/index.js &
cd /home/runner/workspace

echo "Starting IDP API on port 8008..."
cd IDP-UI/PlatinumIDP && dotnet run &
cd /home/runner/workspace

echo "Starting AFS UI on port 8000..."
cd AFS-UI/client && NG_CLI_ANALYTICS=false npx ng serve --host 0.0.0.0 --port 8000 --proxy-config proxy.conf.json --serve-path /afs-app/ &
cd /home/runner/workspace

echo "Starting SCM UI on port 4200..."
cd SCM-UI && NG_CLI_ANALYTICS=false npx ng serve --host 0.0.0.0 --port 4200 --proxy-config proxy.conf.json --serve-path /scm-app/ &
cd /home/runner/workspace

echo "Starting ASSETS-UI main shell on port 5000..."
cd ASSETS-UI && NG_CLI_ANALYTICS=false npx ng serve --host 0.0.0.0 --port 5000 --proxy-config proxy.conf.json
