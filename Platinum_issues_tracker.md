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
