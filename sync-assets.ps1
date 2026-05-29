# ============================================================
# Platinum v3.1 — Sync Assets Module from External Repo
# Run from:  C:\Repos\Platinum-v3_1
# Usage:     .\sync-assets.ps1
#
# Edit the variables below to match your assets repo URL and
# which folders you want to sync into this monorepo.
# ============================================================

# ── CONFIGURATION — edit these ────────────────────────────
$ASSETS_REPO_URL    = "https://github.com/YourOrg/assets-repo.git"   # <-- your assets repo
$ASSETS_REPO_BRANCH = "main"

# Map: source path inside the assets repo  →  destination inside Platinum-v3_1
# Add or remove rows to match your assets repo's folder structure.
$SYNC_MAP = @(
    @{ Src = "ASSETS-PSQL-API";  Dest = "ASSETS-PSQL-API"  },   # .NET backend
    @{ Src = "libs/assets";      Dest = "libs/assets"       }    # Angular frontend lib
    # @{ Src = "frontend"; Dest = "libs/assets" }               # uncomment if layout differs
)
# ──────────────────────────────────────────────────────────

$root    = $PSScriptRoot
$tmpDir  = Join-Path $env:TEMP "platinum-assets-sync-$(Get-Random)"

Write-Host "=== Platinum — Sync Assets from External Repo ===" -ForegroundColor Cyan
Write-Host "Repo  : $ASSETS_REPO_URL"
Write-Host "Branch: $ASSETS_REPO_BRANCH"
Write-Host ""

# ── 1. Clone the assets repo into a temp folder ──────────
Write-Host "[1/4] Cloning assets repo to temp..." -ForegroundColor Yellow
git clone --depth=1 --branch $ASSETS_REPO_BRANCH $ASSETS_REPO_URL $tmpDir
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: git clone failed. Check the repo URL and your access." -ForegroundColor Red
    exit 1
}
Write-Host "  Cloned to: $tmpDir" -ForegroundColor Gray

# ── 2. Show what changed in the source ───────────────────
Write-Host ""
Write-Host "[2/4] Latest commits in the assets repo:" -ForegroundColor Yellow
git -C $tmpDir log --oneline -10

# ── 3. Copy changed files into this monorepo ─────────────
Write-Host ""
Write-Host "[3/4] Syncing folders..." -ForegroundColor Yellow
foreach ($pair in $SYNC_MAP) {
    $srcPath  = Join-Path $tmpDir $pair.Src
    $destPath = Join-Path $root  $pair.Dest

    if (-not (Test-Path $srcPath)) {
        Write-Host "  WARNING: Source path not found in assets repo: $($pair.Src)" -ForegroundColor Yellow
        continue
    }

    Write-Host "  $($pair.Src)  →  $($pair.Dest)" -ForegroundColor Gray

    # Robocopy: mirror src into dest, skip .git folders
    robocopy $srcPath $destPath /MIR /XD ".git" "bin" "obj" "node_modules" ".angular" /NFL /NDL /NJH /NJS | Out-Null
    Write-Host "  Done: $($pair.Dest)" -ForegroundColor Green
}

# ── 4. Clean up temp clone ────────────────────────────────
Write-Host ""
Write-Host "[4/4] Cleaning up temp clone..." -ForegroundColor Yellow
Remove-Item $tmpDir -Recurse -Force
Write-Host "  Done." -ForegroundColor Green

# ── Summary ───────────────────────────────────────────────
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Sync complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host " Next steps:"
Write-Host "   1. Review changes:  git diff"
Write-Host "   2. Build API:       cd ASSETS-PSQL-API && dotnet build"
Write-Host "   3. Run tests:       (if any)"
Write-Host "   4. Commit:          git add . && git commit -m 'sync: update assets from upstream'"
Write-Host ""
