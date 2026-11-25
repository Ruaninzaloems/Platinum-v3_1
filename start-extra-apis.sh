#!/bin/bash
cd /home/runner/workspace/AFS-UI/api && PORT=9000 npx tsx index.ts &
cd /home/runner/workspace/POS-API && PORT=3003 npx tsx index.ts &
cd /home/runner/workspace/OVERTIME-API && ASPNETCORE_URLS=http://0.0.0.0:8099 ASPNETCORE_ENVIRONMENT=Development dotnet bin/Debug/net10.0/PlatinumOvertime-API.dll &
wait
