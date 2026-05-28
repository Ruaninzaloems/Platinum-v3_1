# ============================================================
# Platinum v3.1 — Azure Deployment Script (Windows PowerShell)
# Run from:  C:\Repos\Platinum-v3_1
# Usage:     .\deploy-azure.ps1
#
# Prerequisites:
#   1. Azure CLI installed  (winget install Microsoft.AzureCLI)
#   2. Logged in:           az login
#   3. .env file filled in
# ============================================================

# ── CONFIGURATION — edit these ────────────────────────────
$RESOURCE_GROUP  = "platinum-rg"
$LOCATION        = "southafricanorth"   # or "westeurope", "eastus", etc.
$APP_PLAN        = "platinum-plan"
$APP_PLAN_SKU    = "B2"                 # B1=cheapest, B2=recommended, P1V2=prod
$PREFIX          = "platinum"           # all web app names start with this
$DATABASE_URL    = "postgresql://Admin_Dev:NOP%40ssword_123@platinum-postgre-sql.postgres.database.azure.com:5432/PlatinumV3_db?sslmode=verify-full"
$SESSION_SECRET  = "platinum-local-dev-session-secret-change-in-prod-32c"
$JWT_SECRET      = "platinum-local-dev-jwt-secret-change-in-production"
$SCM_CONN_STRING = ""                   # <-- SQL Server connection string for SCM-API
# ──────────────────────────────────────────────────────────

if (-not $DATABASE_URL) {
    Write-Host "ERROR: Set DATABASE_URL in this script before running." -ForegroundColor Red
    exit 1
}

$root = $PSScriptRoot

Write-Host "=== Platinum Azure Deployment ===" -ForegroundColor Cyan
Write-Host "Resource Group : $RESOURCE_GROUP"
Write-Host "Location       : $LOCATION"
Write-Host "App Plan       : $APP_PLAN ($APP_PLAN_SKU)"
Write-Host ""

# ── 1. Login check ────────────────────────────────────────
Write-Host "[1/10] Checking Azure login..." -ForegroundColor Yellow
az account show --output none 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Not logged in. Running az login..." -ForegroundColor Yellow
    az login
}

# ── 2. Resource Group ─────────────────────────────────────
Write-Host "[2/10] Creating resource group..." -ForegroundColor Yellow
az group create --name $RESOURCE_GROUP --location $LOCATION --output none

# ── 3. App Service Plan ───────────────────────────────────
Write-Host "[3/10] Creating App Service Plan (Linux)..." -ForegroundColor Yellow
az appservice plan create `
    --resource-group $RESOURCE_GROUP `
    --name $APP_PLAN `
    --is-linux `
    --sku $APP_PLAN_SKU `
    --output none

# ── Helper: create web app ────────────────────────────────
function New-WebApp($name, $runtime) {
    Write-Host "  Creating Web App: $name ($runtime)..." -ForegroundColor Gray
    az webapp create `
        --resource-group $RESOURCE_GROUP `
        --plan $APP_PLAN `
        --name $name `
        --runtime $runtime `
        --output none 2>&1 | Out-Null
}

# ── 4. Create all Web Apps ────────────────────────────────
Write-Host "[4/10] Creating Web Apps..." -ForegroundColor Yellow
New-WebApp "$PREFIX-shell"       "NODE|20-lts"
New-WebApp "$PREFIX-assets-api"  "DOTNETCORE|10.0"
New-WebApp "$PREFIX-pos-api"     "NODE|20-lts"
New-WebApp "$PREFIX-payroll-api" "NODE|20-lts"
New-WebApp "$PREFIX-afs-api"     "NODE|20-lts"
New-WebApp "$PREFIX-budget-api"  "DOTNETCORE|10.0"
New-WebApp "$PREFIX-idp-api"     "DOTNETCORE|10.0"
New-WebApp "$PREFIX-scm-api"     "DOTNETCORE|10.0"
New-WebApp "$PREFIX-overtime-api" "DOTNETCORE|10.0"

# ── 5. Configure App Settings ─────────────────────────────
Write-Host "[5/10] Configuring environment variables..." -ForegroundColor Yellow

# Shell — backend URLs
az webapp config appsettings set `
    --resource-group $RESOURCE_GROUP --name "$PREFIX-shell" `
    --settings `
    ASSETS_API_URL="https://$PREFIX-assets-api.azurewebsites.net" `
    POS_API_URL="https://$PREFIX-pos-api.azurewebsites.net" `
    AFS_API_URL="https://$PREFIX-afs-api.azurewebsites.net" `
    PAYROLL_API_URL="https://$PREFIX-payroll-api.azurewebsites.net" `
    IDP_API_URL="https://$PREFIX-idp-api.azurewebsites.net" `
    BUDGET_API_URL="https://$PREFIX-budget-api.azurewebsites.net" `
    SCM_API_URL="https://$PREFIX-scm-api.azurewebsites.net" `
    INSIGHTS_API_URL="https://$PREFIX-insights-api.azurewebsites.net" `
    OVERTIME_API_URL="https://$PREFIX-overtime-api.azurewebsites.net" `
    WEBSITES_PORT=8080 `
    --output none

$shellUrl = "https://$PREFIX-shell.azurewebsites.net"

# ASSETS-PSQL-API
az webapp config appsettings set `
    --resource-group $RESOURCE_GROUP --name "$PREFIX-assets-api" `
    --settings `
    DATABASE_URL="$DATABASE_URL" `
    ASPNETCORE_ENVIRONMENT="Production" `
    CORS_ALLOWED_ORIGINS="$shellUrl" `
    --output none

# POS-API
az webapp config appsettings set `
    --resource-group $RESOURCE_GROUP --name "$PREFIX-pos-api" `
    --settings `
    DATABASE_URL="$DATABASE_URL" `
    SESSION_SECRET="$SESSION_SECRET" `
    NODE_ENV="production" `
    CORS_ALLOWED_ORIGINS="$shellUrl" `
    --output none

# PAYROLL-API
az webapp config appsettings set `
    --resource-group $RESOURCE_GROUP --name "$PREFIX-payroll-api" `
    --settings `
    DATABASE_URL="$DATABASE_URL" `
    JWT_SECRET="$JWT_SECRET" `
    NODE_ENV="production" `
    CORS_ALLOWED_ORIGINS="$shellUrl" `
    --output none

# AFS-API (Node)
az webapp config appsettings set `
    --resource-group $RESOURCE_GROUP --name "$PREFIX-afs-api" `
    --settings `
    DATABASE_URL="$DATABASE_URL" `
    NODE_ENV="production" `
    CORS_ALLOWED_ORIGINS="$shellUrl" `
    --output none

# BUDGET-API
az webapp config appsettings set `
    --resource-group $RESOURCE_GROUP --name "$PREFIX-budget-api" `
    --settings `
    DATABASE_URL="$DATABASE_URL" `
    ASPNETCORE_ENVIRONMENT="Production" `
    CORS_ALLOWED_ORIGINS="$shellUrl" `
    --output none

# IDP-API
az webapp config appsettings set `
    --resource-group $RESOURCE_GROUP --name "$PREFIX-idp-api" `
    --settings `
    DATABASE_URL="$DATABASE_URL" `
    ASPNETCORE_ENVIRONMENT="Production" `
    CORS_ALLOWED_ORIGINS="$shellUrl" `
    --output none

# SCM-API (SQL Server)
az webapp config appsettings set `
    --resource-group $RESOURCE_GROUP --name "$PREFIX-scm-api" `
    --settings `
    "ConnectionStrings__DefaultConnection=$SCM_CONN_STRING" `
    ASPNETCORE_ENVIRONMENT="Production" `
    CORS_ALLOWED_ORIGINS="$shellUrl" `
    --output none

# OVERTIME-API
az webapp config appsettings set `
    --resource-group $RESOURCE_GROUP --name "$PREFIX-overtime-api" `
    --settings `
    DATABASE_URL="$DATABASE_URL" `
    ASPNETCORE_ENVIRONMENT="Production" `
    CORS_ALLOWED_ORIGINS="$shellUrl" `
    --output none

Write-Host "[5/10] Done." -ForegroundColor Green

# ── 6. Build & Deploy ASSETS-PSQL-API ────────────────────
Write-Host "[6/10] Building & deploying ASSETS-PSQL-API..." -ForegroundColor Yellow
Set-Location "$root\ASSETS-PSQL-API"
dotnet publish -c Release -o ./publish --nologo -v quiet
Compress-Archive -Path "./publish/*" -DestinationPath "$root\platinum-assets-api.zip" -Force
az webapp deploy --resource-group $RESOURCE_GROUP --name "$PREFIX-assets-api" `
    --src-path "$root\platinum-assets-api.zip" --type zip --output none
Write-Host "  ASSETS-PSQL-API deployed." -ForegroundColor Green

# ── 7. Build & Deploy .NET APIs ───────────────────────────
Write-Host "[7/10] Building & deploying remaining .NET APIs..." -ForegroundColor Yellow

foreach ($svc in @(
    @{ name="$PREFIX-budget-api"; dir="BUDGET-APP\PlatinumBudget.Api"; zip="platinum-budget-api.zip" },
    @{ name="$PREFIX-idp-api";    dir="IDP-UI\PlatinumIDP";            zip="platinum-idp-api.zip" },
    @{ name="$PREFIX-scm-api";    dir="SCM-API";                       zip="platinum-scm-api.zip" },
    @{ name="$PREFIX-overtime-api"; dir="OVERTIME-API";                zip="platinum-overtime-api.zip" }
)) {
    Write-Host "  Building $($svc.name)..." -ForegroundColor Gray
    Set-Location "$root\$($svc.dir)"
    dotnet publish -c Release -o ./publish --nologo -v quiet
    Compress-Archive -Path "./publish/*" -DestinationPath "$root\$($svc.zip)" -Force
    az webapp deploy --resource-group $RESOURCE_GROUP --name $svc.name `
        --src-path "$root\$($svc.zip)" --type zip --output none
    Write-Host "  $($svc.name) deployed." -ForegroundColor Green
}

# ── 8. Build & Deploy Node.js APIs ───────────────────────
Write-Host "[8/10] Building & deploying Node.js APIs..." -ForegroundColor Yellow

# POS-API
Set-Location "$root\POS-API"
Write-Host "  Building POS-API..." -ForegroundColor Gray
npm install --silent
npm run build 2>&1 | Out-Null
Compress-Archive -Force -DestinationPath "$root\platinum-pos-api.zip" `
    -Path "$root\POS-API\dist", "$root\POS-API\package.json", "$root\POS-API\package-lock.json"
az webapp deploy --resource-group $RESOURCE_GROUP --name "$PREFIX-pos-api" `
    --src-path "$root\platinum-pos-api.zip" --type zip --output none
az webapp config set --resource-group $RESOURCE_GROUP --name "$PREFIX-pos-api" `
    --startup-file "npm install && node dist/index.cjs" --output none
Write-Host "  POS-API deployed." -ForegroundColor Green

# PAYROLL-APP
Set-Location "$root\PAYROLL-APP"
Write-Host "  Packaging PAYROLL-APP..." -ForegroundColor Gray
Compress-Archive -Force -DestinationPath "$root\platinum-payroll-api.zip" `
    -Path "$root\PAYROLL-APP\src", "$root\PAYROLL-APP\package.json", "$root\PAYROLL-APP\package-lock.json"
az webapp deploy --resource-group $RESOURCE_GROUP --name "$PREFIX-payroll-api" `
    --src-path "$root\platinum-payroll-api.zip" --type zip --output none
az webapp config set --resource-group $RESOURCE_GROUP --name "$PREFIX-payroll-api" `
    --startup-file "npm install && node src/server/index.js" --output none
Write-Host "  PAYROLL-API deployed." -ForegroundColor Green

# AFS-UI/api
Set-Location "$root\AFS-UI\api"
Write-Host "  Packaging AFS-API..." -ForegroundColor Gray
Compress-Archive -Force -DestinationPath "$root\platinum-afs-api.zip" `
    -Path "$root\AFS-UI\api"
az webapp deploy --resource-group $RESOURCE_GROUP --name "$PREFIX-afs-api" `
    --src-path "$root\platinum-afs-api.zip" --type zip --output none
az webapp config set --resource-group $RESOURCE_GROUP --name "$PREFIX-afs-api" `
    --startup-file "npm install && npx tsx index.ts" --output none
Write-Host "  AFS-API deployed." -ForegroundColor Green

# ── 9. Build & Deploy Angular Shell ───────────────────────
Write-Host "[9/10] Building & deploying Angular Shell..." -ForegroundColor Yellow
Set-Location "$root"
Write-Host "  Running: npm install + ng build shell (production)..." -ForegroundColor Gray
npm install --silent
$env:NG_CLI_ANALYTICS = "false"
# Angular CLI lives at the root; the app lives in apps/shell with its own angular.json
Set-Location "$root\apps\shell"
npx --prefix "$root" ng build --configuration=production 2>&1 | Tee-Object -Variable buildOutput
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Angular build failed. Check output above." -ForegroundColor Red
    exit 1
}
Set-Location "$root"

# Output goes to dist/shell (matches angular.json outputPath: "../../dist/shell")
$browserSrc = "$root\dist\shell\browser"
if (-not (Test-Path $browserSrc)) { $browserSrc = "$root\dist\shell" }
$browserDest = "$root\apps\shell\browser"
if (Test-Path $browserDest) { Remove-Item $browserDest -Recurse -Force }
Copy-Item $browserSrc $browserDest -Recurse

# Package shell (server.js + package.json + browser/)
Compress-Archive -Force -DestinationPath "$root\platinum-shell.zip" -Path `
    "$root\apps\shell\server.js", `
    "$root\apps\shell\package.json", `
    "$root\apps\shell\browser"

az webapp deploy --resource-group $RESOURCE_GROUP --name "$PREFIX-shell" `
    --src-path "$root\platinum-shell.zip" --type zip --output none
az webapp config set --resource-group $RESOURCE_GROUP --name "$PREFIX-shell" `
    --startup-file "node server.js" --output none
Write-Host "  Shell deployed." -ForegroundColor Green

# ── 10. Summary ───────────────────────────────────────────
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host " Shell URL:    https://$PREFIX-shell.azurewebsites.net"
Write-Host " Assets API:   https://$PREFIX-assets-api.azurewebsites.net/swagger"
Write-Host " POS API:      https://$PREFIX-pos-api.azurewebsites.net/api/health"
Write-Host " Budget API:   https://$PREFIX-budget-api.azurewebsites.net/swagger"
Write-Host ""
Write-Host " Open the shell URL in your browser to verify." -ForegroundColor Yellow
Write-Host ""

Set-Location $root
