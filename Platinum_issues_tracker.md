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
