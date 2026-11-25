# ============================================================
# Platinum v3.1 — Local Development Startup Script (Windows)
# Run from:  C:\Repos\Platinum-v3_1
# Usage:     .\start-local.ps1
# ============================================================

$root = $PSScriptRoot

# Load .env file if it exists
$envFile = Join-Path $root ".env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match "^\s*([^#][^=]+)=(.*)$") {
            [System.Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), "Process")
        }
    }
    Write-Host "[startup] Loaded .env" -ForegroundColor Green
} else {
    Write-Host "[startup] WARNING: No .env file found. Copy .env.example to .env and fill in values." -ForegroundColor Yellow
    exit 1
}

function Start-Service($name, $cmd, $args, $dir, $extraEnv = @{}) {
    Write-Host "[startup] Starting $name..." -ForegroundColor Cyan
    $envBlock = [System.Collections.Hashtable]::new()
    foreach ($key in $extraEnv.Keys) { $envBlock[$key] = $extraEnv[$key] }
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$dir'; $cmd $args" -WindowStyle Normal
}

# ── .NET APIs ─────────────────────────────────────────────
Start-Process powershell -ArgumentList "-NoExit", "-Command", `
    "Set-Location '$root\ASSETS-PSQL-API'; `$env:DATABASE_URL='$env:DATABASE_URL'; dotnet run" `
    -WindowStyle Normal

Start-Process powershell -ArgumentList "-NoExit", "-Command", `
    "Set-Location '$root\BUDGET-APP\PlatinumBudget.Api'; `$env:DATABASE_URL='$env:DATABASE_URL'; dotnet run" `
    -WindowStyle Normal

Start-Process powershell -ArgumentList "-NoExit", "-Command", `
    "Set-Location '$root\IDP-UI\PlatinumIDP'; `$env:DATABASE_URL='$env:DATABASE_URL'; dotnet run" `
    -WindowStyle Normal

Start-Process powershell -ArgumentList "-NoExit", "-Command", `
    "Set-Location '$root\SCM-API'; dotnet run" `
    -WindowStyle Normal

Start-Process powershell -ArgumentList "-NoExit", "-Command", `
    "Set-Location '$root\OVERTIME-API'; `$env:ASPNETCORE_URLS='http://0.0.0.0:8099'; `$env:DATABASE_URL='$env:DATABASE_URL'; dotnet run" `
    -WindowStyle Normal

# ── Node.js APIs ───────────────────────────────────────────
Start-Process powershell -ArgumentList "-NoExit", "-Command", `
    "Set-Location '$root\POS-API'; `$env:DATABASE_URL='$env:DATABASE_URL'; `$env:SESSION_SECRET='$env:SESSION_SECRET'; `$env:PORT='3003'; npx tsx index.ts" `
    -WindowStyle Normal

Start-Process powershell -ArgumentList "-NoExit", "-Command", `
    "Set-Location '$root\PAYROLL-APP'; `$env:DATABASE_URL='$env:DATABASE_URL'; `$env:JWT_SECRET='$env:JWT_SECRET'; `$env:PORT='6000'; node src/server/index.js" `
    -WindowStyle Normal

Start-Process powershell -ArgumentList "-NoExit", "-Command", `
    "Set-Location '$root\AFS-UI\api'; `$env:DATABASE_URL='$env:DATABASE_URL'; `$env:PORT='9000'; npx tsx index.ts" `
    -WindowStyle Normal

# ── Angular Shell (main entry point) ──────────────────────
Write-Host ""
Write-Host "[startup] Starting Angular shell on http://localhost:5000 ..." -ForegroundColor Green
Write-Host "[startup] All other services started in separate windows." -ForegroundColor Green
Write-Host ""
Set-Location "$root\apps\shell"
$env:NG_CLI_ANALYTICS = "false"
# Angular CLI serve — port/host/proxy come from apps/shell/angular.json
npx --prefix "$root" ng serve
