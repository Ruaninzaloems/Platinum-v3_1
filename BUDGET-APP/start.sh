#!/bin/bash
cd /home/runner/workspace/PlatinumBudget.Api && dotnet run --urls "http://0.0.0.0:3001" &
API_PID=$!
sleep 3
cd /home/runner/workspace/platinum-budget-ui && npx ng serve --host 0.0.0.0 --port 5000 --proxy-config proxy.conf.json --configuration development &
NG_PID=$!
wait $API_PID $NG_PID
