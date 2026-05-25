# deploy.ps1 - Run from the root of Insight-Performance-Hub
# Usage: .\deploy.ps1              (deploys both)
#        .\deploy.ps1 -ApiOnly     (deploys API only)
#        .\deploy.ps1 -UiOnly      (deploys UI only)
# WARNING: Reset both publish profiles in Azure Portal after deployment.

param(
    [switch]$ApiOnly,
    [switch]$UiOnly
)

$ErrorActionPreference = "Stop"

$apiUser    = '$Platinum-Performance-API'
$apiPass    = 'Tcm2ibhoSbvReSLHbxTcJ1SXYxn2GT57ulfgPme9siarKbuzh5ddkvL2Mw0x'
$apiZipUrl  = 'https://platinum-performance-api.scm.azurewebsites.net/api/zipdeploy'

$uiUser     = '$Platinum-Performance-UI'
$uiPass     = 'LFH0sMkKE6JrPQLcyaBpuZcaJtkh4eZcRqJtKyj4K854y3BgBeythiTrCmYs'
$uiZipUrl   = 'https://platinum-performance-ui.scm.azurewebsites.net/api/zipdeploy'

function Deploy-Zip($zipPath, $deployUrl, $user, $pass) {
    $base64 = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${user}:${pass}"))
    $headers = @{ Authorization = "Basic $base64" }
    Write-Host "  Uploading $zipPath ..."
    Invoke-RestMethod -Uri $deployUrl -Method POST -Headers $headers `
        -InFile (Resolve-Path $zipPath).Path -ContentType 'application/zip'
    Write-Host "  Done."
}

# ── Install pnpm if missing ────────────────────────────────────────────────────
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Host "Installing pnpm globally..."
    npm install -g pnpm
}

# ── Install workspace dependencies ────────────────────────────────────────────
Write-Host "`nInstalling dependencies..."
pnpm install --frozen-lockfile

# ═════════════════════════════════════════════════════════════════════════════
# API
# ═════════════════════════════════════════════════════════════════════════════
if (-not $UiOnly) {
    Write-Host "`n[API] Building..."
    pnpm --filter @workspace/api-server run build

    $apiDistFile = "artifacts\api-server\dist\index.cjs"
    if (-not (Test-Path $apiDistFile)) {
        Write-Error "API build output not found at $apiDistFile"
        exit 1
    }

    Write-Host "[API] Creating deployment zip..."
    $apiStaging = "deploy-api-staging"
    $apiZip     = "deploy-api.zip"

    Remove-Item -Recurse -Force $apiStaging -ErrorAction SilentlyContinue
    Remove-Item -Force $apiZip              -ErrorAction SilentlyContinue

    New-Item -ItemType Directory -Force -Path "$apiStaging\artifacts\api-server\dist" | Out-Null
    Copy-Item $apiDistFile "$apiStaging\artifacts\api-server\dist\index.cjs"
    Compress-Archive -Path "$apiStaging\*" -DestinationPath $apiZip
    Remove-Item -Recurse -Force $apiStaging

    Write-Host "[API] Deploying to Platinum-Performance-API..."
    Deploy-Zip $apiZip $apiZipUrl $apiUser $apiPass
    Remove-Item -Force $apiZip
}

# ═════════════════════════════════════════════════════════════════════════════
# UI
# ═════════════════════════════════════════════════════════════════════════════
if (-not $ApiOnly) {
    Write-Host "`n[UI] Building Angular app..."
    pnpm --filter @workspace/perf-app run build

    $uiBrowserDir = "artifacts\perf-app\dist\perf-app\browser"
    if (-not (Test-Path $uiBrowserDir)) {
        Write-Error "Angular build output not found at $uiBrowserDir"
        exit 1
    }

    Write-Host "[UI] Creating deployment zip..."
    $uiStaging = "deploy-ui-staging"
    $uiZip     = "deploy-ui.zip"

    Remove-Item -Recurse -Force $uiStaging -ErrorAction SilentlyContinue
    Remove-Item -Force $uiZip              -ErrorAction SilentlyContinue

    $uiStagingDest = "$uiStaging\artifacts\perf-app\dist\perf-app"
    New-Item -ItemType Directory -Force -Path $uiStagingDest | Out-Null
    Copy-Item -Recurse "$uiBrowserDir" "$uiStagingDest\browser"
    Compress-Archive -Path "$uiStaging\*" -DestinationPath $uiZip
    Remove-Item -Recurse -Force $uiStaging

    Write-Host "[UI] Deploying to Platinum-Performance-UI..."
    Deploy-Zip $uiZip $uiZipUrl $uiUser $uiPass
    Remove-Item -Force $uiZip
}

Write-Host "`nDeployment complete!"
Write-Host "  API: https://platinum-performance-api.azurewebsites.net"
Write-Host "  UI:  https://platinum-performance-ui.azurewebsites.net"
Write-Host "`nRemember to reset your publish profiles in the Azure Portal."
