# PLATINUM - Asset Management, Supply Chain Management, Municipal POS, Payroll, IDP & AFS System

## Overview
A comprehensive Asset Management, Supply Chain Management (SCM), Municipal Receipting (POS), Payroll, Integrated Development Plan (IDP), Insight Performance Hub, Budget Management, and Annual Financial Statements (AFS) System for South African municipal/governmental contexts (mSCOA/GRAP/CIDMS/MFMA compliant). Built for Mnquma Local Municipality. Combines eight modules unified under a single sidebar toggle.

## Architecture

### Components
- **ASSETS-UI/** - Angular 19 frontend (Asset Management), served on port 5000
- **ASSETS-PSQL-API/** - .NET 10 Web API for PostgreSQL, served on port 3000
- **ASSETS-API/** - .NET 10 Web API for SQL Server (legacy), served on port 3001
- **SCM-UI/** - Angular 21 frontend (Supply Chain Management), served on port 4200
- **SCM-API/** - .NET Web API for SCM backend, served on port 3002
- **POS-UI/** - Angular 21 frontend (Municipal Receipting/POS), served on port 8080
- **POS-API/** - Express/TypeScript API for POS backend, served on port 3003
- **PAYROLL-APP/client/** - Angular 21 frontend (Payroll), served on port 8099
- **IDP-UI/platinum-idp-client/** - Angular 21 frontend (IDP), served on port 9000
- **IDP-UI/PlatinumIDP/** - .NET 10 Web API for IDP backend, served on port 8008
- **Insight-Performance-Hub/artifacts/perf-app/** - Vite/React frontend (Insights), served on port 5173
- **Insight-Performance-Hub/artifacts/api-server/** - Express API (Insights), served on port 6800
- **BUDGET-APP/platinum-budget-ui/** - Angular 21 frontend (Budget), served on port 4201
- **BUDGET-APP/PlatinumBudget.Api/** - .NET Web API for Budget backend, served on port 3001
- **AFS-UI/client/** - Angular 21 frontend (Annual Financial Statements), served on port 8000
- **AFS-UI/api/** - Express/TypeScript API for AFS backend, served on port 3004

### Workflows
- **Backend API** - Runs the PostgreSQL .NET API (`dotnet run`, port 3000) AND launches all background services via `Program.cs` process spawning: AFS API (port 3004), POS API (port 3003), Payroll API (port 6000), IDP API (port 8008), SCM UI (port 4200), AFS UI (port 8000), ASSETS-UI main shell (port 5000)
- **POS UI** - Serves the POS-UI Angular frontend (`ng serve`, port 8080)
- **IDP UI** - Serves the IDP Angular frontend (`ng serve`, port 9000, serve-path `/idp-app/`)
- **Payroll UI** - Serves the Payroll Angular frontend (`ng serve`, port 8099, serve-path `/payroll-app/`)
- **Performance Hub** - Insight Hub artifacts (api-server, perf-app, mockup-sandbox)

### Request Flow (External → Internal)
- External port 80 → POS API (port 3003) → proxies all requests to Angular dev server (port 5000)
- Angular dev server (port 5000) proxies `/api` → Backend API (port 3000), `/scm-app` → SCM UI (port 4200), `/pos-app` → POS UI (port 8080), `/idp-app` → IDP UI (port 9000), etc.
- POS API's own `/api/...` routes are handled first; unmatched `/api` requests fall through to the Angular proxy chain

### Ports
- `5000` → ASSETS-UI Frontend (Angular 19)
- `4200` → SCM-UI Frontend (Angular 21)
- `8080` → POS-UI Frontend (Angular 21)
- `9000` → IDP-UI Frontend (Angular 21)
- `3000` → PostgreSQL API (Assets)
- `3001` → SQL Server API (Assets legacy)
- `3002` → SCM API (proxied to Azure: https://rep-scm-api.azurewebsites.net)
- `6000` → Payroll API (Express/Node.js)
- `8099` → Payroll UI Frontend (Angular 21)
- `3003` → POS API (Express/TypeScript) — mapped to external port 80
- `8008` → IDP API (.NET 10)
- `5173` → Insights UI (Vite/React)
- `6800` → Insights API (Express)
- `4201` → Budget UI (Angular 21)
- `3001` → Budget API (.NET)
- `8000` → AFS-UI Frontend (Angular 21)
- `3004` → AFS API (Express/TypeScript)

## Database
- Uses Replit's built-in PostgreSQL (via `DATABASE_URL` environment variable)
- Schema is in `ASSETS-PSQL-API/Data/Schema.sql` (131 tables)
- Seed data is in `ASSETS-PSQL-API/Data/Seed.sql`
- `SKIP_DB_INIT=true` is set in `.replit` — schema was applied manually at import time
- SCM-API uses Entity Framework Core + SQL Server (connection string in `SCM-API/appsettings.json`)
- POS-API uses Drizzle ORM + PostgreSQL (shared schema in `POS-API/shared/schema.ts`)
- IDP API uses Entity Framework Core + PostgreSQL (shared `DATABASE_URL`), tables prefixed `idp_*`, `mscoa_*`, `priority_*`, `project_objective_links_ef`
- Budget API uses Entity Framework Core + PostgreSQL (shared `DATABASE_URL`), tables include `BudgetVersions`, `BudgetStrings`, `FinancialYears`, `Projects`, `Tariffs`, `ServiceCategories`, `ExpenditureCategories`, `PostEstablishments`, `ScoaItems`, `Const_Department`, `Const_SCOA_Structure`, `Plan_Project`, and many EMS `Plan_*`/`Const_*` tables

## Frontend Proxy
`ASSETS-UI/proxy.conf.json` routes:
- `/api/*` → `http://localhost:3000` (PostgreSQL API)
- `/ASSETS-API/*` → `http://localhost:3001` (SQL Server API, path rewritten to `/api`)
- `/SCM-API/*` → `http://localhost:3002` (SCM API, path rewritten to `/api`)
- `/scm-app/api/*` → `http://localhost:3002` (SCM API via iframe, path rewritten to `/api`)
- `/scm-app/*` → `http://localhost:4200` (SCM-UI dev server, proxied with WebSocket support)
- `/pos-app/api/*` → `http://localhost:3003` (POS API via iframe, path rewritten to `/api`)
- `/pos-app/*` → `http://localhost:8080` (POS-UI dev server, proxied with WebSocket support)
- `/payroll-app/api/*` → `http://localhost:6000` (Payroll API, path rewritten to `/api/v1`)
- `/payroll-app/*` → `http://localhost:8099` (Payroll UI dev server, proxied with WebSocket support)
- `/idp-app/api/*` → `http://localhost:8008` (IDP API via iframe, path rewritten to `/api`)
- `/idp-app/*` → `http://localhost:9000` (IDP UI dev server, proxied with WebSocket support)
- `/insights-app/api/*` → `http://localhost:6800` (Insights API via iframe, path rewritten to `/api`)
- `/insights-app/*` → `http://localhost:5173` (Insights UI dev server, proxied with WebSocket support)
- `/budget-app/api/*` → `http://localhost:3001` (Budget API via iframe, path rewritten to `/api`)
- `/budget-app/*` → `http://localhost:4201` (Budget UI dev server, proxied with WebSocket support)
- `/afs-app/api/*` → `http://localhost:3004` (AFS API via iframe, path rewritten to `/api`)
- `/afs-app/*` → `http://localhost:8000` (AFS-UI dev server, proxied with WebSocket support)

`SCM-UI/src/environments/environment.ts` sets `apiUrl: '/scm-app/api'` so that API calls from the iframe are routed through the ASSETS-UI proxy `/scm-app/api` rule to port 3002 (SCM API) instead of the Assets `/api` rule on port 3000.

`POS-UI/src/environments/environment.ts` sets `apiPrefix: '/pos-app'` so that API calls from the iframe (e.g. `/pos-app/api/auth/status`) are routed through the ASSETS-UI proxy `/pos-app/api` rule to port 3003 (POS API). The POS `ApiService` automatically prefixes `/api` calls with this prefix.

`IDP-UI/platinum-idp-client/src/environments/environment.ts` sets `apiPrefix: '/idp-app'` so that API calls from the iframe (e.g. `/idp-app/api/cycles`) are routed through the ASSETS-UI proxy `/idp-app/api` rule to port 8008 (IDP API). The IDP `ApiService` prefixes `/api` calls with this prefix.

## Loading Screens
All apps have branded preloaders that show during Angular/React bootstrap (pulsing shield icon + shimmer bar). These auto-dismiss once the app renders, with a 15-second fallback timeout.
- **ASSETS-UI** `index.html` — "Loading PLATINUM" preloader
- **SCM-UI** `index.html` — "Loading SCM" preloader
- **POS-UI** `index.html` — "Loading POS" preloader
- **IDP-UI** `index.html` — "Loading IDP" preloader
- **Performance Hub** — Uses its own `PageLoader` component (shimmer in `index.css`)
- **Shell iframe overlays** — `shell.component.ts` shows branded overlay (shield + shimmer + label) on module iframe containers while iframes load; cleared by iframe `load` event via `iframeLoading` signal.

## Module System
The app has an eight-module layout with a toggle in the sidebar header:
- **Assets** — The full asset management module (default, runs in ASSETS-UI)
- **SCM** — Supply Chain Management module (runs as separate Angular 21 app via iframe)
- **POS** — Municipal Receipting/Point of Sale module (runs as separate Angular 21 app via iframe)
- **Payroll** — Payroll Management module (runs as separate Angular 21 app via iframe, API via external ngrok)
- **IDP** — Integrated Development Plan module (runs as separate Angular 21 app via iframe)
- **Performance** — Performance Hub module (runs as Vite/React app via iframe)
- **Budget** — MFMA Budget Management module (runs as separate Angular 21 app via iframe, .NET API on port 3001)
- **AFS** — Annual Financial Statements module (runs as separate Angular 21 app via iframe, Express API on port 3004)

The module toggle is in `ASSETS-UI/src/app/layout/shell.component.ts`. When "SCM" is selected, the ASSETS-UI sidebar shows the full SCM navigation menu (Dashboard, Procurement, Receiving & Payments, Inventory & Stores, Vendor Management, Compliance, Reports, Settings) with expandable group sections. The SCM-UI app loads in an iframe alongside the sidebar. CSS is injected into the iframe to hide the SCM app's own sidebar (preventing duplicate sidebars). Clicking a SCM menu item navigates the iframe to the corresponding route. A MutationObserver re-injects styles when the iframe DOM changes (e.g., after login).

When "POS" is selected, the sidebar shows POS navigation groups: Home, Point of Sale, Direct Deposits, Third Party, Enquiries, Debt Management, Legal, Analytics, Administration. The POS-UI app loads in an iframe. The POS layout component (`pos-layout.component.ts`) detects iframe context via `window.self !== window.top` and sets `isEmbedded()` signal to hide its own sidebar, toolbar, and breadcrumbs via `.embedded-mode` CSS class. This is more reliable than the shell's `injectEmbedStyles` approach (which still runs as backup).

When "Payroll" is selected, the sidebar shows Payroll navigation groups: Dashboard, Employee Management, Salary Processing, Deductions & Benefits, Leave Management, Tax & Compliance, Banking & Payments, Reports, Settings. The PAYROLL-UI app loads in an iframe. Same CSS injection/MutationObserver pattern as SCM/POS.

When "IDP" is selected, the sidebar shows IDP navigation with grouped sections: Dashboard and IDP Cycles as top-level links, then collapsible groups matching the IDP app's internal sidebar (Planning: Process Plan/Strategic Objectives/Projects/Spatial Report; Participation: Public Participation; Prioritisation: Framework Config/Project Scoring; Documents: Draft IDP/Final IDP; Governance: Approvals/GoMuni Submission). The IDP-UI app loads in an iframe. Same CSS injection/MutationObserver pattern as SCM/POS/Payroll.

When "AFS" is selected, the sidebar shows AFS navigation groups: AFS Builder (Dashboard, Compilations, Templates, Trial Balance Import, mSCOA Mappings, General Information, AFS Preview, AFS Versions, Exports), Reference Data (Chart of Accounts, mSCOA Segments, Mapping Rules), Audit Collaboration (Working Papers, RFIs, Findings, Document Management), System (Admin Settings, Users & Roles, Audit Trail). The AFS-UI app loads in an iframe. The AFS shell component (`AFS-UI/client/src/app/layout/shell.component.ts`) detects iframe context via `isEmbedded()` signal (same pattern as POS) to hide its own sidebar and toolbar.

`AFS-UI/client/src/environments/environment.ts` sets `apiPrefix: '/afs-app'` so that API calls from the iframe are routed through the ASSETS-UI proxy `/afs-app/api` rule to port 3004 (AFS API).

When "Assets" is selected, the normal Assets layout with router-outlet and flat nav list is shown.

The SCM-UI serves under the `/scm-app/` path prefix. The POS-UI serves under the `/pos-app/` path prefix (configured via `servePath: /pos-app/` in `POS-UI/angular.json`). The IDP-UI serves under the `/idp-app/` path prefix (configured via `servePath: /idp-app/` in `IDP-UI/platinum-idp-client/angular.json`). All allow proxying through port 5000 and rendering inside iframes without cross-origin issues.

## Nx Monorepo (ACTIVE — One Process, One Port)
A single Angular 21 shell on port 5000 with 8 lazy-loaded feature libraries:

### Architecture
```
SHELL (apps/shell/) — Login · Auth · Nav · Router outlet · port 5000
  └── Lazy-loaded routes
      ├── AFS        (libs/afs/)
      ├── ASSETS     (libs/assets/)
      ├── IDP        (libs/idp/)
      ├── POS        (libs/pos/)
      ├── SCM        (libs/scm/)
      ├── BUDGET     (libs/budget/)
      ├── PAYROLL    (libs/payroll/)
      └── INS        (libs/ins/)
  └── Shared libs (one copy, all modules use)
      ├── Auth Lib   (libs/shared/auth/) — AuthService, AuthGuard, AuthInterceptor (JWT)
      ├── Core Svcs  (libs/shared/core/) — ApiService, AppStateService, LookupService
      └── Shared UI  (libs/shared/ui/)  — PageHeader, StatusBadge, SearchInput, ConfirmDialog, etc.
  └── Backend APIs unchanged
      ├── ASSETS-API  (port 3000, .NET/PostgreSQL)
      ├── POS-API     (port 3003, Express)
      ├── SCM-API     (port 3002, .NET)
      ├── AFS-API     (port 3004, Express)
      ├── Payroll-API (port 6000, Express)
      ├── IDP-API     (port 8008, .NET)
      ├── Budget-API  (port 3001, .NET)
      └── Insights-API(port 6800, Express)
```

### What This Solves
- 1 Replit workflow · 1 port (5000)
- All modules share login session
- Add modules = add a folder + route
- APIs remain independent (correct)

### Key Files
- `apps/shell/src/app/app.routes.ts` — lazy routes for all 8 modules
- `apps/shell/src/app/layout/shell.component.ts` — sidebar with nav items
- `apps/shell/proxy.conf.json` — 9 backend API proxy entries
- `tsconfig.base.json` — 11 path aliases (@platinumv3/*)
- `libs/shared/auth/src/index.ts` — exports AuthService, authGuard, authInterceptor
- `libs/shared/core/src/index.ts` — exports ApiService, AppStateService, LookupService
- `libs/shared/ui/src/index.ts` — exports 7 reusable UI components

### Workflow
- **Platinum Shell**: `cd apps/shell && npx ng serve --host 0.0.0.0 --port 5000 --proxy-config proxy.conf.json`
- **Backend API**: Runs .NET API + spawns AFS/POS/Payroll/IDP APIs
- Total: 500+ TS files, 320+ routes across 8 modules + shell
- Uses zoneless change detection (`provideZonelessChangeDetection()`)
- NOT included: Insight-Performance-Hub React app (stays as separate workspace)

## Important Notes
- SCM-UI and POS-UI use Angular 21.2 (incompatible with ASSETS-UI Angular 19) — must run as separate apps
- IDP-UI uses Angular 21.2 — same constraint as SCM/POS
- Do NOT modify SCM repo code (SCM-UI/SCM-API) — only minimal port config changes allowed
- npm install in ASSETS-UI, SCM-UI, POS-UI, and IDP-UI requires `--legacy-peer-deps`
- POS-API requires `drizzle-zod` and shared schema at `POS-API/shared/schema.ts`
- POS-API OpenAI integration is optional — server starts without `OPENAI_API_KEY`
- POS app depends on external Platinum Inzalo EMS API for business data
- Performance Hub (API + UI) spawns as child processes from POS API `index.ts` (same pattern as Budget API/UI) because the Replit artifact system assigns port 8080 to the API server, which conflicts with POS UI
- Performance Hub API hardcodes port 6800 in `index.ts` (ignores PORT env var) to avoid port conflicts
- Performance Hub UI (perf-app) hardcodes port 5173 and basePath `/insights-app` in `vite.config.ts`

## Key Features
### Asset Management
- Asset lifecycle management (acquisitions, transfers, disposals, revaluations)
- Financial accounting (depreciation, prior-year adjustments, GL outbox)
- Verification & maintenance tracking
- Dual backend support (PostgreSQL primary, SQL Server legacy)
- Runtime DB toggle via `DatabaseToggleService`

### Supply Chain Management
- Procurement (Demand, Requisitions, Quotations, Tenders, Purchase Orders)
- Receiving & Payments (Goods Receipt, Returns, Invoices, Payments)
- Inventory & Stores (Inventory, Water Inventory, Land Inventory)
- Vendor Management (Vendors, Supplier Performance, Contracts)
- Compliance (IFW Register, Audit Trail, Delegations)
- Reports & Analytics

### Municipal Receipting (POS)
- POS Terminal for cashier operations
- Direct Deposits (Manual & Auto allocation)
- Third Party payment processing
- Enquiries & Communications
- Debt Management (Section 129, Handover, Risk Scoring)
- Legal (Rules, Audit Trail, Evidence Bundle)
- Analytics (Executive Dashboard, Predictive Forecasting, Geographic Mapping)
- Supervisor & Settings administration

### Integrated Development Plan (IDP)
- IDP Cycle management (multi-year planning)
- Process Plan (phases, milestones, timelines)
- Strategic Objectives & KPIs
- Project management with mSCOA alignment
- Spatial reporting (ward-based, map visualization)
- Public Participation (comments, community engagement)
- Priority Framework configuration with AI-assisted scoring
- Project Scoring & Rankings
- Draft IDP & Final IDP document management
- Approval workflows
- GoMuni submission integration

## Important Configuration Notes
- IDP-UI uses Angular 21 **zoneless** change detection (`provideZonelessChangeDetection()` in `app.config.ts`) — do NOT add zone.js polyfills
- IDP-UI `cycle-state.service.ts` uses `environment.apiPrefix` for API base URL (was hardcoded to `/api/cycles`, fixed to route through proxy)
- Budget-UI uses zone.js polyfills (standard Angular change detection)

## Dependencies
- Angular 19.2 (ASSETS-UI) with Angular Material, Chart.js, Leaflet, xlsx
- Angular 21.2 (SCM-UI, POS-UI, IDP-UI) with Angular Material, Tailwind CSS
- .NET 10, Dapper ORM, Npgsql, ClosedXML, Swagger
- Express 5, TypeScript, Drizzle ORM, tsx (POS-API)
- Install ASSETS-UI deps: `cd ASSETS-UI && npm install --legacy-peer-deps`
- Install SCM-UI deps: `cd SCM-UI && npm install --legacy-peer-deps`
- Install POS-UI deps: `cd POS-UI && npm install --legacy-peer-deps`
- Install POS-API deps: `cd POS-API && npm install --legacy-peer-deps`
- Install IDP-UI deps: `cd IDP-UI/platinum-idp-client && npm install --legacy-peer-deps`
- Install IDP-API deps: `cd IDP-UI/PlatinumIDP && dotnet restore`
- Install AFS-UI deps: `cd AFS-UI/client && npm install --legacy-peer-deps`
- Install AFS-API deps: `cd AFS-UI/api && npm install`
