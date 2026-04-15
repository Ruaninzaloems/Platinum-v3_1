#!/bin/bash
cd AFS-UI/api && PORT=3004 npx tsx index.ts &
cd AFS-UI/client && NG_CLI_ANALYTICS=false npx ng serve --host 0.0.0.0 --port 8000 --proxy-config proxy.conf.json --serve-path /afs-app/
