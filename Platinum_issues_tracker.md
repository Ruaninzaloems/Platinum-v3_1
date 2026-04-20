# PLATINUM Issues Tracker

## Legend
- **FIXED** - Issue resolved
- **OPEN** - Issue still present
- **WORKAROUND** - Issue mitigated but not fully resolved
- **WON'T FIX** - By design or not applicable in this environment

---

## FIXED Issues

### FIX-001: POS UI base href incorrect
- **Module**: POS-UI
- **Date Fixed**: 2025 (prior session)
- **Description**: POS Angular app had `<base href="/">` which broke routing when served under `/pos-app/` iframe path.
- **Fix**: Changed to `<base href="/pos-app/">` in `POS-UI/src/index.html`.
- **Files**: `POS-UI/src/index.html`

### FIX-002: POS API authentication failure (external server unreachable)
- **Module**: POS-API
- **Date Fixed**: 2025 (prior session)
- **Description**: POS login calls `georgeplatinumuatapi.azurewebsites.net` which is unreachable from this environment, causing login to hang indefinitely.
- **Fix**: Added 5-second timeout + demo user fallback in `POS-API/routes/auth.routes.ts`. If the real Platinum server times out or errors, a demo session with `superUser:true` is created automatically.
- **Files**: `POS-API/routes/auth.routes.ts`
- **Note**: Dev environment only — not production-safe.

### FIX-003: POS auto-login missing
- **Module**: POS-UI
- **Date Fixed**: 2025 (prior session)
- **Description**: POS app required manual login each time, unlike SCM which had auto-login.
- **Fix**: Added auto-login with fallback to auth guard, matching SCM pattern.
- **Files**: `POS-UI/src/app/core/guards/auth.guard.ts`

### FIX-004: Payroll API route mismatch (404 errors)
- **Module**: Payroll
- **Date Fixed**: 2025-04-14
- **Description**: Payroll UI client calls `/payroll-app/api/settings/active-tax-year` etc. The proxy rewrote `/payroll-app/api` to `/api`, but Payroll API server registers all routes under `/api/v1/...`, resulting in 404 errors for every API call.
- **Fix**: Updated proxy `pathRewrite` from `"/api"` to `"/api/v1"` in both `ASSETS-UI/proxy.conf.json` and `PAYROLL-APP/client/proxy.conf.json`.
- **Files**: `ASSETS-UI/proxy.conf.json`, `PAYROLL-APP/client/proxy.conf.json`

### FIX-005: "Return to Cashbook" feature ported from GitHub
- **Module**: POS-UI
- **Date Fixed**: 2025-04-14
- **Description**: Feature from GitHub repo commit `978d60fb` — adds "Return to Cashbook" buttons in the allocate-transaction component for direct deposits.
- **Fix**: Applied CSS classes (`badge-orange`, `btn-return-cashbook`), HTML buttons (empty-lines state and submit bar), `returnToCashbook()` method, and CASHBOOK badge label update.
- **Files**: `POS-UI/src/app/features/direct-deposits/manual/allocate-transaction.component.css`, `.html`, `.ts`

### FIX-006: POS iframe blank white page in shell
- **Module**: POS-UI, ASSETS-UI
- **Date Fixed**: 2026-04-14
- **Description**: POS module rendered as blank white page when loaded inside the shell iframe at `/pos-view`. Root causes: (1) Shell embed styles injected via `injectEmbedStyles` had timing issues and were overly broad (hiding all `<aside>` elements), (2) iframe CSS used `height: 100%` instead of `flex: 1` which could fail in flex containers, (3) POS layout's `display: flex` on `.app-sidenav` overrode the `[hidden]` attribute.
- **Fix**: Added `isEmbedded()` signal to POS layout that detects iframe context via `window.self !== window.top`. When embedded, sidebar and toolbar are hidden via CSS class `.embedded-mode` with `!important` overrides. Shell iframe CSS changed to `flex: 1` for proper sizing. Shell embed styles refined to target specific classes.
- **Files**: `POS-UI/src/app/shared/layout/pos-layout.component.ts`, `POS-UI/src/app/shared/layout/pos-layout.component.html`, `POS-UI/src/app/shared/layout/pos-layout.component.css`, `ASSETS-UI/src/app/layout/shell.component.ts`

---

## OPEN Issues

### OPEN-001: Payroll dashboard external API errors (500s)
- **Module**: Payroll
- **Description**: Some Payroll dashboard API calls return 500 errors with message "External API error: 404". The Payroll API server proxies certain requests to an external API that is unreachable in this environment (similar to POS external server issue).
- **Impact**: Some dashboard stats (Total Employees, Annual COE Budget) show as 0 or R0. Core payroll cycle data loads fine.
- **Endpoints Affected**: `/api/v1/dashboard/summary`, `/api/v1/notifications`

### OPEN-002: Payroll UI Angular NG0100 ExpressionChangedAfterItHasBeenChecked
- **Module**: Payroll UI
- **Description**: `TopbarComponent` throws `NG0100` error in dev mode — expression value changes from `-1` to `18` between change detection cycles. This is a common Angular dev-mode-only warning and does not affect production.
- **Impact**: Console error only; UI renders correctly.

### OPEN-003: External Platinum server slow/unreliable auth
- **Module**: POS-API
- **Description**: `georgeplatinumuatapi.azurewebsites.net` (POS billing server) auth returns 401 for "admin" user. Login falls back to cached user data or demo mode. Timeout reduced from 5s to 2s for faster fallback.
- **Impact**: POS billing queries, real account lookups, and payment processing may fail. Demo/cached fallback is active. Loading indicator added to prevent blank page during auth wait.

### OPEN-004: SCM API proxied to Azure
- **Module**: SCM-UI
- **Description**: SCM API is proxied to `https://rep-scm-api.azurewebsites.net`. If this external server is down, SCM data operations will fail.
- **Impact**: SCM module depends on external Azure-hosted API.

---

## WORKAROUNDS

### WA-001: SCM auto-login
- **Module**: SCM-UI
- **Description**: `auth.guard.ts` automatically calls `authService.login('admin', 'admin123')` silently to bypass login screen.
- **Files**: `SCM-UI/src/app/core/guards/auth.guard.ts`

### WA-002: POS auto-login with demo fallback
- **Module**: POS-UI / POS-API
- **Description**: Auth guard auto-logs in. If external auth server is unreachable (>2s timeout), POS API creates a demo session with `superUser:true`. Loading overlay with animated shimmer shown during auth wait.
- **Files**: `POS-UI/src/app/core/guards/auth.guard.ts`, `POS-API/routes/auth.routes.ts`, `POS-UI/src/app/app.ts`, `POS-UI/src/app/app.html`, `POS-UI/src/app/app.css`

### WA-003: SKIP_DB_INIT=true
- **Module**: System-wide
- **Description**: Database initialization is skipped on startup (`SKIP_DB_INIT=true` in `.replit`). Schema was applied manually at import time. Budget tables use PascalCase with quoted identifiers.

---

### FIX-009: POS module sync from upstream (Municipal-Receipting-POS-2)
- **Module**: POS (Nx lib `libs/pos`)
- **Date Fixed**: 2026-04-19
- **Description**: POS module in the Nx monorepo was out of date relative to the Municipal-Receipting-POS-2 upstream repo. Missing consumer / indigent module code and ~30 component files; build was producing errors and stale UI.
- **Fix**: Synced 107 TypeScript files from `Municipal-Receipting-POS-2` into `libs/pos/src`, including the new consumer and indigent modules. Build now compiles with 0 errors and only benign deprecation warnings.
- **Files**: 107 files under `libs/pos/src/lib/**`

### FIX-010: POS navigation links bypass lazy-loaded mount point
- **Module**: POS (Nx lib `libs/pos`)
- **Date Fixed**: 2026-04-19
- **Description**: ~50 sidebar links and 8 home-page cards in the POS module used absolute paths (e.g. `/cashier/sessions`, `/direct-deposits`) which bypassed the `/pos` lazy-loaded route mount in the shell. Clicking any link took the user out of the POS module to a 404.
- **Fix**: Prefixed every internal navigation route with `/pos` (or refactored to relative paths) in the POS layout and home component. All POS links now stay within the lazy-loaded module.
- **Files**: `libs/pos/src/lib/shared/layout/pos-layout.component.ts`, `libs/pos/src/lib/shared/layout/pos-layout.component.html`, `libs/pos/src/lib/features/home/home.component.ts`

### FIX-011: POS auth bridged to shared shell AuthService
- **Module**: POS (Nx lib `libs/pos`), shared/auth
- **Date Fixed**: 2026-04-19
- **Description**: POS still had its own legacy `AuthService` that maintained a separate session, login screen, and user state. Inside the unified shell this conflicted with the shared `@platinumv3/shared/auth` ShellAuthService — POS components either saw an unauthenticated state or required a second login.
- **Fix**: Rewrote `libs/pos/src/lib/core/services/auth.service.ts` as a thin wrapper around the shared ShellAuthService. Maps the shell's `User` shape to POS's `AuthUser` interface (`user_ID`, `userName`, `superUser` derived from roles, `firstName`, `cashFloat`, `finYear`, `site()`, `isSite02`, `authenticated()` etc.) so all ~30 POS components keep working unchanged. `login()` is a no-op (shell handles login); `logout()` delegates to the shell.
- **Files**: `libs/pos/src/lib/core/services/auth.service.ts`
- **Note**: Other modules (assets, scm, afs) still keep their own independent AuthServices — untouched. Only POS was bridged.

### FIX-012: Shell route health verification — all 11 modules HTTP 200
- **Module**: Shell (Nx monorepo)
- **Date Fixed**: 2026-04-19
- **Description**: After POS sync (FIX-009) and auth bridge (FIX-011), needed to confirm no regressions across the unified shell.
- **Result**: All 11 routes (`/`, `/login`, `/dashboard`, `/assets`, `/scm`, `/pos`, `/payroll`, `/idp`, `/budget`, `/afs`, `/ins`) return HTTP 200. Build clean with 0 errors.

---

### FIX-008: Empty 240px gap between sidebar and main content (every shell route)
- **Module**: Shell (Nx monorepo) — visible on `/assets/dashboard` and all other module routes
- **Date Fixed**: 2026-04-19
- **Description**: A peach/cream empty strip ~240px wide appeared between the sidebar (`.app-sidenav`) and main content (`.main-content`) on every route inside the Nx shell. Bounding-rect debug confirmed `.app-sidenav` at x=0/w=240 and `.main-content` at x=480/w=800 — a 240px gap with no element occupying it.
- **Root cause**: `libs/payroll/src/lib/_payroll-global.css` is loaded as a **global** stylesheet via `apps/shell/angular.json` and contains an unscoped rule `.main-content { margin-left: 240px; }` (legacy from when payroll's standalone app used a `position: fixed` sidebar). It leaked into the shell, where `.main-content` is already a flex sibling of `.app-sidenav`, so the margin pushed the content 240px to the right.
- **Fix**: Added override in `apps/shell/src/styles.css`:
  ```css
  .shell > .main-content { margin-left: 0 !important; }
  ```
- **Files**: `apps/shell/src/styles.css`
- **Commit**: `5fc9c93`
- **Related**: OPEN-005 (root-cause cleanup of cross-app global CSS leakage).

---

## (additional) OPEN Issues — added 2026-04-19

### OPEN-005: Cross-app global CSS leakage (payroll, afs)
- **Module**: Shell (Nx monorepo)
- **Description**: `libs/payroll/src/lib/_payroll-global.css` and `libs/afs/src/lib/_afs-global.scss` are registered as global stylesheets in `apps/shell/angular.json`. They contain unscoped selectors (`.main-content`, `.sidebar`, etc.) that leak across every module and silently affect unrelated pages. FIX-008 was a targeted override; the underlying leak still exists.
- **Impact**: Future visual bugs whenever an unscoped class name collides with the shell or another module.
- **Recommended fix**: Scope each global file under a module-specific root class (e.g. `.payroll-app .main-content`, `.afs-app .sidebar`), or move only shared design tokens to the global bundle and keep layout rules inside component styles.
- **Files**: `libs/payroll/src/lib/_payroll-global.css`, `libs/afs/src/lib/_afs-global.scss`, `apps/shell/angular.json`

### OPEN-006: Azure Postgres unreachable from Replit (firewall)
- **Module**: Environment / AFS DB connectivity
- **Description**: TCP connect to `platinum-postgre-sql.postgres.database.azure.com:5432` times out from the Replit container. Azure Postgres firewall rejects all inbound by default; Replit's outbound IP range is not whitelisted.
- **Impact**: Blocks any backend service in this environment from talking to the Azure-hosted `AFS` (and any other Azure PG) database.
- **Action required (user)**: In the Azure portal → `platinum-postgre-sql` server → Networking → Firewall rules, add a rule allowing the Replit outbound IP (or "Allow public access from any Azure service…" as a temporary unblock).

### FIX-008: AFS dashboard empty body — global CSS leakage from Payroll
- **Module**: AFS (`libs/afs/src/lib/features/dashboards/dashboard-container.component.css`) + global styles
- **Date Fixed**: 2026-04-20
- **Symptom**: `/afs/dashboard` rendered the header bar and tab strip, but the entire body below was blank — even though the API returned data successfully and the component's `ngOnInit` / `loadDashboard` logs confirmed `data` arrived.
- **Root cause**: `libs/payroll/src/lib/_payroll-global.css:645` declares `.tab-content { display: none; }` (a payroll-specific tab-toggle pattern). Because `apps/shell/angular.json` loads all module `_*-global.{scss,css}` files **globally**, this rule cascaded onto AFS's own `.tab-content` div in `dashboard-container.component`, hiding every `<app-dashboard>` (and every other tab body) at all times. The DashboardComponent was being instantiated and populated, but its host `.tab-content` parent had `display: none`, so nothing rendered.
- **Fix**: Added `display: block !important` (plus `min-height: calc(100vh - 240px)` and `overflow-y: visible`) to AFS's `.tab-content` rule in `dashboard-container.component.css`, and `:host { display: block; min-height: 100% }` to give the container a defined box. Also switched the data callback from `cdr.markForCheck()` to `cdr.detectChanges()` for reliability under `provideZonelessChangeDetection()`.
- **Follow-up (broader OPEN-005 instance)**: All `_*-global.{scss,css}` files in `apps/shell/angular.json` are unscoped. Other generic class names (e.g. `.kpi-row`, `.page-container`, `.modal-overlay`) likely collide too. Long-term fix: wrap each module's global rules under a module-scoped parent class (e.g. `.payroll-scope .tab-content`) or move them into per-component styles.

### OPEN-008: AFS dashboard crashes — `Cannot read properties of undefined (reading 'totalCompilations')`
- **Module**: AFS (`libs/afs/src/lib/features/dashboard/dashboard.component.html`)
- **Date Found**: 2026-04-19
- **Description**: When loading `/afs/dashboard` in the shell, the page renders the header bar and tab strip ("Overview / CFO / AFS Control / Ratios / …") but the entire body below is blank. The browser console throws a hard runtime error:
  ```
  ERROR TypeError: Cannot read properties of undefined (reading 'totalCompilations')
      at DashboardComponent_Conditional_2_Template (chunk-CNBJOUEX.js)
  ```
- **Root cause**: The dashboard template binds to `data.kpis.totalCompilations` (and ~6 other `data.kpis.*` fields) without guarding `data.kpis`. When the underlying API call fails (see OPEN-009), `data` is set to a partial object, `data.kpis` is `undefined`, and the `.totalCompilations` access throws.
- **Affected templates** (same unguarded pattern):
  - `libs/afs/src/lib/features/dashboard/dashboard.component.html:211`
  - `libs/afs/src/lib/features/dashboards/afs-control-dashboard.component.html:62`
  - `libs/afs/src/lib/features/dashboards/cfo-dashboard.component.html:79`
  - `libs/afs/src/lib/features/reports/reports.component.html:16`
- **Recommended fix**: Use the safe-navigation operator (`data?.kpis?.totalCompilations`) or wrap each KPI block in an `@if (data?.kpis)` guard, and have `loadDashboard()` set a sensible default object (with zeros) on API failure so the UI degrades gracefully.
- **Related**: OPEN-009 (the failing fetch that exposes this bug).

### FIX-011: POS module — internal back/forward navigation broken (same migration pattern as FIX-010)
- **Module**: POS (`libs/pos/src/lib/**`)
- **Date Fixed**: 2026-04-20
- **Symptom**: After landing on a POS page (e.g. Indigent Management Dashboard, Section 129, Direct Deposits, Cashier setup, Supervisor) any "Back", "Cancel", row-click navigation or programmatic redirect either landed on the wrong page or fell through to the home tile screen — sidebar nav links worked but inner workflows could not return to their parent screen.
- **Root cause**: Same as FIX-010 but for POS. The original POS-UI was mounted at `/`, so internal navigations used absolute paths like `router.navigate(['/debt/section129'])`, `router.navigate(['/indigent/dashboard'])`, `router.navigate(['/direct-deposits/manual'])`, `router.navigate(['/pos'])`, `router.navigate(['/supervisor'])`. After the Nx migration these need a `/pos` prefix.
- **Fix**: Mass-rewrote 16 files under `libs/pos/src/lib/**` to prefix every absolute internal path with `/pos`. Special handling for the POS workflow page itself (originally `/pos` in standalone meant the workflow component; now `/pos/pos`), and the sidebar layout brand/breadcrumb home link (kept at `/pos` to point at the POS landing/home).
- **Files touched** (16): `features/cashier/cashier-setup.component.ts`, `features/debt/{batch/batch-processing,documents/document-templates,monitoring/process-monitoring,section129/section129-trial-review,signatures/digital-signatures}.component.ts`, `features/direct-deposits/manual/{allocate-transaction,allocation-history,unmatched-queue}.component.ts`, `features/indigent/{indigent-application,indigent-bulk-upload,indigent-scan,indigent-termination}.component.ts`, `features/pos/{pos-workflow,pos}.component.ts`, `shared/layout/pos-layout.component.html`.
- **Note**: The sidebar nav data (`pos-layout.component.ts`) was already correctly prefixed during the migration; only the per-feature programmatic navigations and the layout template were missed.

### FIX-010: Assets module — all internal links broken (clicking asset row went to dashboard)
- **Module**: Assets (`libs/assets/src/lib/**`)
- **Date Fixed**: 2026-04-20
- **Symptom**: Clicking any row in the Asset Register sent the user to the Assets *dashboard* instead of the asset detail page (the "Unpaved Road / Asset ID 1" page with Details / Cost Movement / Depreciation / Revaluation Reserve / Impairment / Disposal / Location / Funding Sources / Documents / Audit History tabs). Same problem affected WIP rows, Maintenance request rows, Verification register/plan rows, Bulk Upload tabs, and most internal back/cancel buttons.
- **Root cause**: The original ASSETS-UI app was mounted at the root URL (`/`), so its templates used absolute `routerLink="/wip"`, `routerLink="/verification/register"`, `router.navigate(['/assets', id])`, etc. After the Nx migration the assets lib is now lazy-loaded under `/assets/...`, so every absolute path needed to be prefixed with `/assets`. Without the prefix, e.g. `routerLink="/assets" + ['/assets', 1]` produced URL `/assets/1`, which doesn't match any assets-module child route and fell through to the empty-path redirect → `/assets/dashboard`.
- **Fix**: Mass-rewrote 24 template/TS files under `libs/assets/src/lib/features/**` to prefix every absolute internal path. Paths fixed: `/assets`, `/wip`, `/maintenance`, `/verification`, `/transactions`, `/reports`, `/reconciliation`, `/config`, `/admin`, `/workflows`, `/fleet`, `/acquisitions`, `/bulk-upload`, `/prior-year-adjustments`, `/prior-period-adjustments`, `/map` — all now `/assets/<path>`.
- **Files touched** (24): `acquisitions.component.{html,ts}`, `admin/config/asset-project-statuses.component.html`, `admin/upload-errors.component.ts`, `admin/upload-jobs.component.ts`, `assets/asset-detail/asset-detail.component.html`, `assets/asset-list/asset-list.component.{html,ts}`, `bulk-upload/bulk-upload.component.ts`, `bulk-upload/wip-transfers/wip-transfers.component.ts`, `maintenance/{request-detail,request-list}/*.component.ts`, `verification/{plan-create,plan-detail,plan-list,register-create,register-detail,register-list}/*.component.ts`, `wip/{wip-detail/wip-detail.component.{html,ts},wip-list.component.{html,ts},wip-unbundling/wip-unbundling{,-detail}.component.ts}`.
- **Note**: The legacy `libs/assets/src/lib/layout/shell.component.ts` (the old internal AFS-style shell) is no longer imported by anything in the unified shell (`apps/shell/`), so was left untouched.

### FIX-009: AFS dashboard now reads real data from Azure PostgreSQL
- **Module**: AFS API (`AFS-UI/api/index.ts` + new `AFS-UI/api/db.ts`)
- **Date Fixed**: 2026-04-20
- **Symptom (was OPEN-009)**: `loadDashboard()` hit endpoints that returned 404, leaving the AFS dashboard with no data and triggering OPEN-008's null-deref crash.
- **Resolution**: Replaced the in-memory stub with a real Express backend wired to Azure PostgreSQL.
  - **DB module** (`AFS-UI/api/db.ts`): parses `AZURE_POSTGRES_URL` (ADO `Host=…;Port=…;Username=…;Password=…` format), overrides database to `AFS`, and exposes a pooled `pg` client with SSL.
  - **Endpoints implemented against the live AFS schema (177 tables)**:
    - `GET /api/health` — now reports DB connectivity (`{db:{ok:true,db:'AFS'}}`)
    - `GET /api/admin/financial-years` — pulls from `public.financial_years`
    - `GET /api/reports/dashboard?period=…&fyId=…` — aggregates compilations, afs_versions, rfi_requests, audit_findings, adjustments, evidence_documents, working_papers, trial_balance_entries, general_ledger_entries, budget_cache. Returns the full `DashboardData` shape (KPIs, status counts, severity breakdown, compliance score, recent activity, adjustment summary, TB summary, TB category breakdown, top revenue/expenditure items, budget-vs-actual, GL summary).
    - `GET /api/compilations` — pulls from `public.compilations`.
  - **Auth/notifications stubs** preserved (shell auth is the source of truth in this monorepo, AFS auth doesn't need to duplicate).
  - **Verified data live**: 18 compilations across statuses (3 draft, 6 calculated, 9 compiled_with_exceptions), 1 published AFS version, 22,811 trial-balance entries for FY 2025/26, debit total R50.0B vs credit total R50.5B, top revenue item "Opening Balance — IA001001001001002001000000000000000000" R1.87B, budget-vs-actual variance for top 6 SCOA categories.
- **Prerequisite**: Azure PostgreSQL firewall must whitelist the environment's outbound IP. Dev IP `35.227.191.68` was added; deploy IP will need its own rule (or enable "Allow Azure services" toggle).
- **Files**: `AFS-UI/api/db.ts` (new), `AFS-UI/api/index.ts` (rewritten), `AFS-UI/api/package.json` (+`pg`, `@types/pg`).
- **Pending follow-ups for full feature parity** (each is one more block of endpoints against the same DB):
  - `/api/compilations/:id`, `/api/afs-versions/...`, `/api/rfis`, `/api/findings`, `/api/adjustments`, `/api/mappings/...`, `/api/tb-import-workbench`, `/api/general-information/...`, `/api/validation-rules`, `/api/exports/...`, `/api/admin/users|roles|sharepoint|email-config`, `/api/platinum/...`. The same DB pool is reused; each endpoint becomes a thin SQL query against the relevant table(s) listed in the schema dump.

### OPEN-009: AFS dashboard data fetch returns 404 — RESOLVED by FIX-009
- **Module**: AFS API / proxy (`/afs-app/api/...`)
- **Date Found**: 2026-04-19
- **Description**: When loading `/afs/dashboard`, the browser console reports `Failed to load resource: the server responded with a status of 404 (Not Found)`. The AFS dashboard's `loadDashboard()` call hits an endpoint on the AFS API (port 3004 stub from FIX-007) that doesn't exist, leaving the component with no data and triggering OPEN-008.
- **Impact**: AFS dashboard is non-functional — no KPIs, no charts, no compilations data.
- **Next step**: Identify the exact endpoint the dashboard requests, then either (a) add the route to the lightweight Express stub at `AFS-UI/api/index.ts`, or (b) replace the stub with the real .NET AFS API once OPEN-007 (provider migration) and OPEN-006 (firewall) are resolved.

### OPEN-007: AFS API uses SQL Server, not PostgreSQL
- **Module**: AFS API (`AFS-UI/dotnet-apis/PlatinumAFS.Api`)
- **Description**: User asked to point the AFS dashboard at the Azure PostgreSQL `AFS` database. Current AFS .NET API uses EF Core `Microsoft.EntityFrameworkCore.SqlServer` with a SQL Server connection string (`Server=...;TrustServerCertificate=True;MultipleActiveResultSets=True;...`). Switching to PostgreSQL is a provider migration, not a config tweak.
- **Required steps**:
  1. Replace NuGet `Microsoft.EntityFrameworkCore.SqlServer` → `Npgsql.EntityFrameworkCore.PostgreSQL`
  2. `Program.cs`: `options.UseSqlServer(...)` → `options.UseNpgsql(...)`
  3. Rewrite connection strings in `appsettings.json`, `appsettings.Development.json`, `appsettings.Production.json` to Npgsql format (`Host=platinum-postgre-sql.postgres.database.azure.com;Port=5432;Database=AFS;Username=Admin_Dev;Password=...;SSL Mode=Require;Trust Server Certificate=true`)
  4. Audit `Models/` and `Data/PlatinumDbContext.cs` for SQL-Server-specific annotations / column types
  5. Verify schema in the Azure `AFS` database matches EF model expectations (cannot validate until OPEN-006 is resolved)
- **Status**: Awaiting user go-ahead before making the swap.
- **Files** (to be touched): `AFS-UI/dotnet-apis/PlatinumAFS.Api/PlatinumAFS.Api.csproj`, `AFS-UI/dotnet-apis/PlatinumAFS.Api/Program.cs`, `AFS-UI/dotnet-apis/PlatinumAFS.Api/appsettings*.json`
- **Note**: The AFS module currently in the running shell is served by the lightweight Express stub at `AFS-UI/api/index.ts` (port 3004), not the .NET API. Decide whether to replace the stub with the .NET API or to also point the stub at the Azure PG DB.

---

### FIX-007: AFS Module Integration
- **Module**: AFS-UI, ASSETS-UI
- **Date Fixed**: 2026-04-14
- **Description**: Integrated the 8th module (Annual Financial Statements) into the PLATINUM shell. Cloned from Platinum-AFS GitHub repo (dev branch). Created lightweight Express API (port 3004) as substitute for original .NET/SQL Server API. Added AFS module chip, sidebar nav groups, iframe section, embedded mode detection in AFS shell.
- **Files**: `AFS-UI/client/angular.json`, `AFS-UI/client/src/app/layout/shell.component.ts`, `AFS-UI/client/src/app/layout/shell.component.html`, `AFS-UI/client/src/app/layout/shell.component.css`, `AFS-UI/client/src/environments/environment.ts`, `AFS-UI/client/src/app/core/services/api.service.ts`, `AFS-UI/client/proxy.conf.json`, `AFS-UI/api/index.ts`, `ASSETS-UI/proxy.conf.json`, `ASSETS-UI/src/app/layout/shell.component.ts`, `ASSETS-UI/src/app/features/auth/login.component.ts`, `ASSETS-PSQL-API/Program.cs`
- **Key changes**:
  - AFS-UI port: 8000, AFS API port: 3004
  - `isEmbedded()` signal hides AFS sidebar/toolbar when in iframe (same pattern as POS)
  - `environment.apiPrefix: '/afs-app'` routes API calls through main proxy
  - Backend API `Program.cs` spawns all background services (AFS API, POS API, Payroll API, IDP API, SCM UI, AFS UI, ASSETS-UI)
  - Login page updated: "Eight Integrated Modules" with AFS badge

## Environment Notes

| App | Port | Status | Notes |
|-----|------|--------|-------|
| ASSETS-UI | 5000 | Running | Angular 19, main shell + reverse proxy |
| SCM-UI | 4200 | Running | Angular 21, served at `/scm-app/` |
| POS-UI | 8080 | Running | Angular 21, served at `/pos-app/` |
| IDP-UI | 9000 | Running | Angular 21, served at `/idp-app/` |
| Payroll UI | 8099 | Running | Angular 21, served at `/payroll-app/`, hash routing |
| Insights UI | 18156 | Running | Vite/React, served at `/insights-app/` |
| AFS-UI | 8000 | Running | Angular 21, served at `/afs-app/` |
| Backend API | 3000 | Running | .NET 10, PostgreSQL |
| POS API | 3003 | Running | Express/TypeScript |
| Payroll API | 6000 | Running | Express/Node.js |
| IDP API | 8008 | Running | .NET 10 |
| Insights API | 6800 | Running | Express |
| AFS API | 3004 | Running | Express/TypeScript, lightweight stub |

- **Unified Login**: admin / admin123 — default landing page
- **Angular install**: Use `npm install --legacy-peer-deps` for all Angular apps
- **IDP config**: Uses `provideZonelessChangeDetection()` + `provideAnimationsAsync()`
- **Backend API launches all services**: The Backend API workflow's `Program.cs` spawns ASSETS-UI (port 5000), SCM-UI (port 4200), AFS-UI (port 8000), AFS API (port 3004), POS API (port 3003), Payroll API (port 6000), IDP API (port 8008) as child processes
