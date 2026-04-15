#!/bin/bash
PORT=6000 node /home/runner/workspace/PAYROLL-APP/index.js &
API_PID=$!
echo "Payroll API started (PID $API_PID) on port 6000"

cd /home/runner/workspace/PAYROLL-APP/client
NG_CLI_ANALYTICS=false npx ng serve --host 0.0.0.0 --port 8099 --serve-path /payroll-app/ &
CLIENT_PID=$!
echo "Payroll Client started (PID $CLIENT_PID) on port 8099"

wait $API_PID $CLIENT_PID
