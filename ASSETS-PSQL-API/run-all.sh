#!/bin/bash
cd /home/runner/workspace

PORT=3004 AFS-UI/api/node_modules/.bin/tsx AFS-UI/api/index.ts &
(cd POS-API && PORT=3003 npx tsx index.ts) &
(cd PAYROLL-APP && PORT=6000 node src/server/index.js) &
(cd IDP-UI/PlatinumIDP && dotnet run) &
(cd SCM-UI && NG_CLI_ANALYTICS=false npx ng serve --host 0.0.0.0 --port 4200 --proxy-config proxy.conf.json --serve-path /scm-app/) &
(cd AFS-UI/client && NG_CLI_ANALYTICS=false npx ng serve --host 0.0.0.0 --port 8000 --proxy-config proxy.conf.json --serve-path /afs-app/) &

cd ASSETS-PSQL-API && dotnet run
