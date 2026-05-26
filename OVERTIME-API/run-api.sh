#!/bin/bash
set -e

if [ -n "${REPLIT_DEPLOYMENT}" ]; then
    export ASPNETCORE_ENVIRONMENT=Production
else
    export ASPNETCORE_ENVIRONMENT=Development
fi

export ASPNETCORE_URLS=http://0.0.0.0:5000
exec dotnet bin/Release/net10.0/PlatinumOvertime-API.dll
