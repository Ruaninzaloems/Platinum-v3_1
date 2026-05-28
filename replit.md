# PLATINUM - Mnquma Local Municipality Management System

## Overview
Comprehensive municipal management system (mSCOA/GRAP/CIDMS/MFMA compliant) for Mnquma Local Municipality. Combines 9 feature modules under a single Angular 21 Nx monorepo shell with lazy-loaded routing. No login required — every visitor is auto-authenticated as admin.

## Architecture — Nx Monorepo (Single Process, Single Port)

```
apps/shell/ (port 5000) — Auto-auth · Sidebar Nav · Router outlet
  └── Lazy-loaded feature libraries
      ├── libs/assets/    — Asset Management (65 routes)
      ├── libs/scm/       — Supply Chain Management (30 routes)
      ├── libs/pos/       — Municipal Receipting/POS (60+ routes)
      ├── libs/payroll/   — Payroll Management (50 routes)
      ├── libs/idp/       — Integrated Development Plan (14 routes)
      ├── libs/budget/    — MFMA Budget Management (39 routes)
      ├── libs/afs/       — Annual Financial Statements (30 routes)
      ├── libs/ins/       — Performance/Insights (50+ routes)
      └── libs/overtime/  — Overtime Management (8 routes)
  └── Shared libraries
      ├── libs/shared/auth/ — AuthService, AuthGuard, AuthInterceptor
      ├── libs/shared/core/ — ApiService, AppStateService, LookupService
      └── libs/shared/ui/   — PageHeader, StatusBadge, SearchInput, ConfirmDialog
```

Total: 500+ TypeScript files, 320+ routes across 9 modules + shell.

### Key Files
- `apps/shell/src/app/app.routes.ts` — lazy routes for all 9 modules
- `apps/shell/src/app/layout/shell.component.ts` — sidebar with module chips + nav items
- `apps/shell/proxy.conf.json` — backend API proxy entries
- `tsconfig.base.json` — path aliases (@platinumv3/*)
- `start-apis.js` — spawns AFS API (9000), POS API (3003), Overtime API (8099)

### Authentication
Login is bypassed. `AuthService` in `libs/shared/auth/` auto-creates an admin session on app init:
- Sets `platinum_token` = `'local-session-token'` in localStorage
- Sets `platinum_user` = `{ superUser: true, role: 'admin', ... }` in localStorage
- All modules check for this token; SCM's `scmBootstrapGuard` accepts both JWTs and local admin sessions

## Ports

| Port | Service | Technology |
|------|---------|------------|
| 5000 | Shell (Angular frontend) | Angular 21 / Nx |
| 3000 | Assets API | .NET 10 / PostgreSQL |
| 3001 | Budget API | .NET / PostgreSQL |
| 3002 | SCM API | .NET (Azure: rep-scm-api.azurewebsites.net) |
| 3003 | POS API | Express / PostgreSQL |
| 6000 | Payroll API | Express / Node.js |
| 8008 | IDP API | .NET 10 / PostgreSQL |
| 8080 | IPH API server (artifact) | Express / tsx |
| 8081 | IPH Mockup sandbox (artifact) | Vite / React |
| 18156 | IPH Perf app (artifact) | Angular 21 |
| 8099 | Overtime API | .NET / EF Core / PostgreSQL |
| 9000 | AFS API | Express / PostgreSQL |

### Proxy Configuration (`apps/shell/proxy.conf.json`)
- `/api/*` → Assets API (3000)
- `/scm-api/*` → SCM API (3002)
- `/pos-api/*` → POS API (3003)
- `/payroll-api/*` → Payroll API (6000, rewrite → /api/v1)
- `/idp-api/*` → IDP API (8008)
- `/budget-api/*` → Budget API (3001)
- `/afs-api/*` → AFS API (9000)
- `/insights-api/*` → IPH API (8080)
- `/perf-app/*` → IPH Perf app (18156)
- `/overtime-app/api/*` → Overtime API (8099, rewrite → /api)

## Workflows (9 configured, 10 max)
1. **Platinum Shell** — `cd apps/shell && npx ng serve --host 0.0.0.0 --port 5000 --proxy-config proxy.conf.json`
2. **Backend API** — `cd ASSETS-PSQL-API && dotnet run` (port 3000)
3. **Budget API** — `cd BUDGET-APP/PlatinumBudget.Api && dotnet run` (port 3001)
4. **IDP API** — `cd IDP-UI/PlatinumIDP && dotnet run` (port 8008)
5. **SCM API** — `cd SCM-API && dotnet run` (port 3002)
6. **Payroll API** — `cd PAYROLL-APP && node index.js` (port 6000)
7. **Sibling APIs** — `node start-apis.js` (spawns AFS API 9000, POS API 3003, Overtime API 8099, plus the 3 IPH artifacts: api-server 8080, mockup-sandbox 8081, perf-app 18156)

The 3 Insight-Performance-Hub artifacts no longer have dedicated Replit workflows — the platform workflow slot quota was exhausted, so they are launched as child processes by `start-apis.js`. To pick up upstream pulls, restart the **Sibling APIs** workflow.

## Database
- **Azure PostgreSQL (active, 2026-05-28):** `platinum-postgre-sql.postgres.database.azure.com:5432 / PlatinumV3_db` — all APIs repointed via `AZURE_DATABASE_URL` env var (postgresql:// form with `?sslmode=require`). AFS uses `AZURE_POSTGRES_URL` (ADO format) + `AFS_DB_NAME=PlatinumV3_db`. Replit IPs whitelisted on Azure firewall: `136.109.111.153`, `35.230.88.79`. Replit's outbound IP can rotate — if all .NET APIs start failing with `Failed to connect to <azure-ip>:5432 ... Timeout`, check `curl https://api.ipify.org` and add the new IP to the Azure Postgres firewall.
- All 6 APIs that previously read `DATABASE_URL` were patched to prefer `AZURE_DATABASE_URL` when set, with fallback to `DATABASE_URL` (no workflow command changes needed): ASSETS-PSQL-API (DbConnectionFactory.cs), BUDGET-APP/PlatinumBudget.Api (Program.cs), IDP-UI/PlatinumIDP (Program.cs), OVERTIME-API (Program.cs), POS-API (db.ts), PAYROLL-APP (src/server/config/database.js). .NET URL parsers updated to URL-decode username/password (Uri.UnescapeDataString) so URL-encoded `%40` → `@` works.
- Migration: 633 tables, 345 sequences, 904 indexes, 408 FKs, 10 app functions copied via chunked pg_restore TOC (37 chunks × 120 entries, --jobs=16). Only skipped: uuid-ossp extension (blocked by Azure; zero usage confirmed).
- Local Replit built-in PostgreSQL via `DATABASE_URL` still configured as fallback (unused by default).
- Assets schema: `ASSETS-PSQL-API/Data/Schema.sql` (131 tables)
- IDP tables: prefixed `idp_*`, `mscoa_*`, `priority_*`
- Budget tables: `BudgetVersions`, `BudgetStrings`, `FinancialYears`, `Projects`, etc.
- Overtime tables: `OvertimeRequests`, `OvertimePolicies`, `OvertimeRates`, etc.
- POS uses Drizzle ORM (`POS-API/shared/schema.ts`)
- `SKIP_DB_INIT=true` — schema was applied at import time

## Module Features

### Assets (libs/assets/)
Asset lifecycle (acquisitions, transfers, disposals, revaluations), financial accounting (depreciation, prior-year adjustments, GL outbox), verification & maintenance tracking.

**Azure cutover fixes (2026-05-28):** Same `"Enabled" = 1` boolean-vs-integer pattern previously fixed in TrackingController/AssetConfigMscoaController also fixed in `SharedLookupsController.cs`. Schema is mixed: `Const_Department`, `Const_Division`, `Payroll_Employee` have BOOLEAN `"Enabled"` (use `= TRUE`); `Const_Town/Suburb/Ward/Street/Building/Floor/Room` have SMALLINT `"Enabled"` (use `= 1`). The controller now uses the correct comparison per table.

**Upstream sync (2026-05-26):** ASSETS-PSQL-API/ synced from https://github.com/Ruaninzaloems/Platinum-Asset-Management.git (commit ece46e8). Added: EmailService, LedGeneralLedgerService, EmailLog/EmailSettings/EmailTemplates/DocumentType controllers, Filters/, Helpers/, new SQL seeds (SeedConfigSettings, SeedSCMGRNDocuments, MigratePlannedMaintenance, MigrateWorkOrderSpec). Program.cs adds SPAWN_SIBLING_SERVICES-gated child-process spawner (unset by default — no-op). The Angular ASSETS-UI/ was NOT merged — already refactored into libs/assets/ in the Nx monorepo. Preserved locally: Properties/launchSettings.json (0.0.0.0:3000 binding for Replit proxy), run-all.sh, Uploads/. Post-sync DB migrations applied manually (because SKIP_DB_INIT=true bypasses Schema.sql): created Asset_DocumentType, Asset_EmailSettings, Asset_EmailTemplates, Asset_EmailLog, Asset_ClearingAccounts, SCM_GRNDocuments; added asset_register_item_id + transaction_type columns to Asset_Documents. Fixed two boolean-vs-integer Postgres bugs in upstream code (boolean columns compared to literal `1`): TrackingController.cs GetZones (`"is_active" = 1` → `= TRUE`) and AssetConfigMscoaController GetDepartments/GetDivisions (`COALESCE("Enabled", 1) = 1` → `COALESCE("Enabled", TRUE) = TRUE`). Also fixed two table-name mismatches in AssetConfigMscoaController: `Asset_Department`/`Asset_Division` → `Const_Department`/`Const_Division` (the real table names in this DB). Verified: 107/107 Assets API endpoints return 200, 16/16 Shell /assets/* routes render.

### SCM (libs/scm/)
Procurement (Demand, Requisitions, Quotations, Tenders, POs), Receiving & Payments, Inventory & Stores, Vendor Management, Compliance (IFW Register, Audit Trail), Reports. Uses Azure-hosted API.

### POS (libs/pos/)
POS Terminal, Direct Deposits, Third Party payments, Enquiries, Debt Management (Section 129, Handover, Risk Scoring), Legal, Analytics, Consumer & Indigent management.

### Payroll (libs/payroll/)
Employee management, salary processing, deductions & benefits, leave management, tax & SARS compliance, time & attendance, organogram, salary structure, trade unions.

### IDP (libs/idp/)
IDP Cycle management, Process Plan, Strategic Objectives & KPIs, Project management with mSCOA alignment, Public Participation, Priority Framework with AI scoring, Document management, GoMuni submission.

### Budget (libs/budget/)
MFMA budget versions, budget strings with mSCOA codes, financial year management, tariffs, projects, validation, virements, LGDRS submissions.

### AFS (libs/afs/)
AFS Builder (compilations, templates, trial balance, mSCOA mappings), Audit Collaboration (working papers, RFIs, findings), dashboards (CFO, Compliance, Findings, RFI, Audit Management).

### Performance/INS (libs/ins/)
KPI dashboards, performance scorecards, strategic alignment, ward-level reporting. Connected to Insights API on port 8080.

### Overtime (libs/overtime/)
Overtime request management, policy configuration, rate management, approval workflows, reporting, settings. .NET/EF Core API on port 8099.

**Upstream sync (2026-05-26):** OVERTIME-API/ synced from https://github.com/Ruaninzaloems/Platinum-Overtime.git (commit 5b8c1b4). Added: AdminController, AuthController, DashboardController, SessionAuthFilter middleware (global session auth + `[SkipSessionAuth]` opt-out), DashboardSummaryDto, EmployeeDataSeeder, UserUserRoleSeeder, OADateJsonConverter, run-api.sh, appsettings.Production.json. Removed: OrgChartSeeder.cs. Preserved locally: appsettings.json (Postgres provider), appsettings.Development.json (Replit DB config + `Seeding:SkipOnStartup=true`), Properties/launchSettings.json, App_Data/. Program.cs patched so all dev seeders honour `Seeding:SkipOnStartup` (the upstream EmployeeDataSeeder unconditionally inserts 3,550 Payroll_Employee rows and crashes on null IdNo without this guard). The Sibling APIs workflow now uses `dotnet run --project PlatinumOvertime-API.csproj` instead of running a prebuilt .dll, so source changes are picked up on workflow restart. The Angular UI side (PlatinumOvertime-UI in upstream) was NOT merged — libs/overtime/ has already been refactored into the Nx monorepo and a wholesale copy would undo that work.

## Technical Notes
- Angular 21 with zoneless change detection (`provideZonelessChangeDetection()`)
- Standalone components throughout (no NgModules)
- Shell auto-recompiles in watch mode on file changes
- SCM API uses Azure endpoint — 401 errors expected without real JWT auth
- NG8011 warning in AFS rolled-up-gl.component is cosmetic (Material content projection)
- Insight-Performance-Hub is a separate pnpm workspace, NOT part of the Angular Nx monorepo
  - `artifacts/api-server` — Express + tsx (port 8080)
  - `artifacts/mockup-sandbox` — Vite + React (port 8081, requires `BASE_PATH` env)
  - `artifacts/perf-app` — **Angular 21** (port 18156, `ng serve`) — upstream changed this from React/Vite in commit 90c1eed (2026-05-19); any iframe/proxy integration in `libs/ins/` that assumed Vite/React must be re-validated

## Dependencies
- Angular 21.2, Angular Material, Tailwind CSS
- .NET 10, EF Core, Dapper, Npgsql
- Express 5, Drizzle ORM, tsx
- Chart.js, Leaflet, jspdf, exceljs, qrcode, quill
- pnpm (Insight-Performance-Hub), npm (everything else)
