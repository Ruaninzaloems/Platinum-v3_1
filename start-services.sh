#!/bin/bash
PORT=3004 AFS-UI/api/node_modules/.bin/tsx AFS-UI/api/index.ts &

cd /home/runner/workspace/POS-API && PORT=3003 npx tsx index.ts &
cd /home/runner/workspace/PAYROLL-APP && PORT=6000 node src/server/index.js &
cd /home/runner/workspace/IDP-UI/PlatinumIDP && dotnet run &
cd /home/runner/workspace/SCM-UI && NG_CLI_ANALYTICS=false npx ng serve --host 0.0.0.0 --port 4200 --proxy-config proxy.conf.json --serve-path /scm-app/ &
cd /home/runner/workspace/AFS-UI/client && NG_CLI_ANALYTICS=false npx ng serve --host 0.0.0.0 --port 8000 --proxy-config proxy.conf.json --serve-path /afs-app/ &

cd /home/runner/workspace/ASSETS-PSQL-API && dotnet run
