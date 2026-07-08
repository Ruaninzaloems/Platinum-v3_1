#!/usr/bin/env bash
# Launch POS-API. The EMS/tenant config set is selected by the EMS_PROFILE env var
# and loaded from ./env/<profile>.env by load-profile.ts (imported first in index.ts).
#
#   ./run.sh grguat            # George UAT   (EMS_GeorgeUAT @ 159.138.171.219)
#   ./run.sh localtest         # on-prem test (EMS_Training  @ 110.238.76.98)
#   EMS_PROFILE=grguat ./run.sh
#
# On Azure App Service there is no CLI arg — set EMS_PROFILE as an Application Setting
# and start with `npm start` (tsx index.ts); load-profile.ts reads EMS_PROFILE the same way.
set -euo pipefail
cd "$(dirname "$0")"
export EMS_PROFILE="${1:-${EMS_PROFILE:-grguat}}"
echo "[run] EMS_PROFILE=$EMS_PROFILE"
exec npx tsx index.ts
