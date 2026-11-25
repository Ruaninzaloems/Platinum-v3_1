#!/usr/bin/env bash
# Start (or restart) every Platinum v3 service for local development.
# Run from Git Bash:   ./start-local.sh          stop anything running, start all, health-check
#                      ./start-local.sh stop     stop everything
#                      ./start-local.sh status   health-check only
# Logs go to logs/<service>.log (gitignored). Settings come from the root .env.

set -u
ROOT="$(cd "$(dirname "$0")" && pwd)"
LOGS="$ROOT/logs"
PORTS=(3000 3001 3002 3003 5000 6000 8008 8080 8099 9000)

stop_all() {
  echo "Stopping services..."
  for p in "${PORTS[@]}"; do
    for pid in $(netstat -ano | awk -v p=":$p" '$4 == "LISTENING" && $2 ~ p"$" {print $5}' | sort -u); do
      taskkill //PID "$pid" //T //F >/dev/null 2>&1
    done
  done
  sleep 2
}

# start <name> <dir> <command>
start() {
  (cd "$ROOT/$2" && nohup bash -c "$3" > "$LOGS/$1.log" 2>&1 &)
}

is_up() { (exec 3<>"/dev/tcp/127.0.0.1/$1") 2>/dev/null; }

start_all() {
  mkdir -p "$LOGS"
  echo "Starting services (logs in logs/)..."
  start pos-api     POS-API                                   'PORT=3003 NODE_ENV=development npx tsx index.ts'
  start scm-api     SCM-API                                   'ASPNETCORE_ENVIRONMENT=Development dotnet run'
  start overtime    OVERTIME-API                              'ASPNETCORE_ENVIRONMENT=Development dotnet run'
  start payroll     PAYROLL-APP                               'PORT=6000 NODE_ENV=development node index.js'
  start budget      BUDGET-APP/PlatinumBudget.Api             'ASPNETCORE_ENVIRONMENT=Development dotnet run --urls http://0.0.0.0:3001'
  start afs         AFS-UI/api                                'PORT=9000 npm start'
  start performance Insight-Performance-Hub/artifacts/api-server \
    'NODE_ENV=development PORT=8080 npx tsx --env-file-if-exists=../../../.env ./src/index.ts'
  # Assets: SKIP_DB_INIT avoids the Schema.sql "Asset_UploadType.Type" crash on an existing database.
  start assets      ASSETS-PSQL-API                           'SKIP_DB_INIT=true ASPNETCORE_ENVIRONMENT=Development dotnet run --urls http://0.0.0.0:3000'
  # IDP looks for .env one folder up, but lives two deep, so pass its database URL in directly.
  start idp         IDP-UI/PlatinumIDP \
    'IDP_DATABASE_URL="$(grep "^IDP_DATABASE_URL=" ../../.env | cut -d= -f2-)" ASPNETCORE_ENVIRONMENT=Development dotnet run --urls http://0.0.0.0:8008'
  start shell       apps/shell                                'npx ng serve --port 5000 --host 0.0.0.0 --proxy-config proxy.conf.json'

  echo -n "Waiting for ports"
  local retried_assets=0
  for _ in $(seq 1 240); do
    local up=0
    for p in "${PORTS[@]}"; do is_up "$p" && up=$((up + 1)); done
    [ "$up" -eq "${#PORTS[@]}" ] && break
    # Assets doesn't retry its first Azure Postgres connection; give it one more go.
    if [ "$retried_assets" -eq 0 ] && grep -q "Unhandled exception" "$LOGS/assets.log" 2>/dev/null; then
      retried_assets=1
      echo -n " (retrying Assets)"
      start assets ASSETS-PSQL-API 'SKIP_DB_INIT=true ASPNETCORE_ENVIRONMENT=Development dotnet run --urls http://0.0.0.0:3000'
    fi
    echo -n "."
    sleep 1
  done
  echo
}

status() {
  code() { curl -s -o /dev/null -w "%{http_code}" --max-time 60 "$1"; }
  row()  { printf "  %-12s %-5s %s\n" "$1" "$2" "$3"; }
  echo "Health checks (401 = up, needs a login):"
  row Assets      3000 "$(code http://localhost:5000/api/settings)"
  row Budget      3001 "$(code http://localhost:3001/swagger/index.html)"
  row SCM-API     3002 "$(code http://localhost:3002/swagger/index.html)"
  row POS-API     3003 "$(code http://localhost:3003/api/sites)"
  row Shell       5000 "$(code http://localhost:5000)"
  row Payroll     6000 "$(code http://localhost:6000/api/v1/employees)"
  row IDP         8008 "$(code http://localhost:5000/idp-app/api/Audit)"
  row Performance 8080 "$(code http://localhost:5000/insights-app/api/healthz)"
  # Overtime's first SQL Server connection can time out; one retry.
  local ot; ot="$(code http://localhost:8099/api/me)"; [ "$ot" = "200" ] || ot="$(code http://localhost:8099/api/me)"
  row Overtime    8099 "$ot"
  row AFS         9000 "$(curl -s --max-time 30 http://localhost:9000/api/health | grep -o '"db":{"ok":[a-z]*}' || echo down)"
  echo
  echo "Open http://localhost:5000"
}

case "${1:-start}" in
  stop)   stop_all ;;
  status) status ;;
  start)  stop_all; start_all; status ;;
  *)      echo "Usage: $0 [start|stop|status]"; exit 1 ;;
esac
