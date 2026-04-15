#!/bin/bash

export NG_CLI_ANALYTICS=false

echo "Starting Platinum IDP..."

cd /home/runner/workspace/PlatinumIDP
dotnet run --no-launch-profile &
DOTNET_PID=$!

sleep 3

cd /home/runner/workspace/platinum-idp-client
npx ng serve --host 0.0.0.0 --port 5000 --configuration=development &
NG_PID=$!

wait $DOTNET_PID $NG_PID
