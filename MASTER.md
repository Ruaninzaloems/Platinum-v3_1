# Platinum v3.1 — Master Project Reference

A single authoritative reference for the **Platinum v3.1** municipal ERP platform:
architecture, modules, ports, configuration, integrations, how to run, and the
conventions/gotchas that matter when working in this repo.

> Audience: developers and operators. Keep this file updated when modules, ports,
> or integrations change.

---

## 1. What this is

Platinum v3.1 is an **Nx monorepo** that consolidates several previously-standalone
municipal applications into **one Angular shell** with lazy-loaded feature
libraries. Each business domain (Assets, SCM, POS, Payroll, IDP, Budget, AFS,
Insights, Overtime) is an Nx **library** mounted as a route in the shell, and most
talk to their **own backend API** (proxied in dev, env-var-driven in prod).

- **Frontend:** Angular 21, standalone components, **signals**, **zoneless** change
  detection (`provideZonelessChangeDetection()`), Angular Material.
- **Monorepo:** Nx. The shell app lives in `apps/shell`; domain code lives in `libs/*`.
- **Auth/Chrome:** the shell (`apps/shell`) provides login, the top bar, the module
  switcher, and each module's secondary sidebar nav.

---

## 2. Repository layout

```
Platinum-v3_1/
├─ apps/
│  └─ shell/                  # the Angular host app (port 5000 in dev)
│     ├─ src/app/app.routes.ts        # module mounting (loadChildren)
│     ├─ src/app/app.config.ts        # providers incl. MSAL/Graph
│     ├─ src/app/layout/shell.component.ts   # top bar + per-module sidebar nav
│     ├─ src/app/features/admin/admin-settings.component.ts  # Admin → API/DB/SharePoint config
│     ├─ src/app/features/sharepoint/      # SharePoint Document Browser + library pages
│     ├─ proxy.conf.json               # dev proxy → per-module backends
│     ├─ server.js                     # prod static server + env-driven proxy
│     └─ angular.json                  # project "shell" (serve port 5000, proxyConfig)
├─ libs/
│  ├─ afs/        @platinumv3/afs        → AFS_ROUTES
│  ├─ assets/     @platinumv3/assets     → ASSETS_ROUTES (+ SharePointConfigService)
│  ├─ budget/     @platinumv3/budget     → BUDGET_ROUTES
│  ├─ idp/        @platinumv3/idp        → IDP_ROUTES
│  ├─ ins/        @platinumv3/ins        → INS_ROUTES (Insights)
│  ├─ overtime/   @platinumv3/overtime   → OVERTIME_ROUTES (+ OvertimeSharePointService)
│  ├─ payroll/    @platinumv3/payroll    → PAYROLL_ROUTES (owns _payroll-global.css)
│  ├─ pos/        @platinumv3/pos        → POS_ROUTES
│  ├─ scm/        @platinumv3/scm        → SCM_ROUTES
│  └─ shared/     graph (MS Graph), auth (MSAL), etc.
├─ AFS-UI/api/    # AFS backend (Node/Express, tsx) — port 9000
├─ OVERTIME-API/  # Overtime backend (.NET) — port 8099
├─ PAYROLL-APP/   # Payroll backend — port 6000 (/api/v1)
├─ SCM-API/ POS-API/ BUDGET-APP/ IDP-UI/ ... # other module backends
├─ .env           # local environment (DB URLs, API URLs, secrets)
└─ MASTER.md      # this file
```

> Note: the `*-UI` / `*-APP` folders at the repo root are the **original standalone
> apps**. The live monorepo UI is `apps/shell` + `libs/*`. The standalone copies are
> kept as the sync source / backend hosts (e.g. `AFS-UI/api` is the live AFS backend).

---

## 3. Modules, routes, proxies & backend ports

The shell mounts each module under a route and proxies its API calls. Frontend
services prepend an **`apiPrefix`** (e.g. `/afs-app`) so requests route through the
shell proxy to the right backend.

| Module     | Route        | Library              | Dev API prefix      | Backend (dev)                          |
|------------|--------------|----------------------|---------------------|----------------------------------------|
| Assets     | `/assets`    | `@platinumv3/assets` | `/api`, `/ASSETS-API` | `localhost:3000` (PSQL API) + Azure ASSETS-API |
| SCM        | `/scm`       | `@platinumv3/scm`    | `/scm-app/api`      | `localhost:3002`                       |
| POS        | `/pos`       | `@platinumv3/pos`    | `/pos-app/api`      | `localhost:3003`                       |
| Payroll    | `/payroll`   | `@platinumv3/payroll`| `/payroll-app/api`  | `localhost:6000` (→ `/api/v1`)         |
| IDP        | `/idp`       | `@platinumv3/idp`    | `/idp-app/api`      | `localhost:8008`                       |
| Budget     | `/budget`    | `@platinumv3/budget` | `/budget-app/api`   | `localhost:3001`                       |
| AFS        | `/afs`       | `@platinumv3/afs`    | `/afs-app/api`      | `localhost:9000` (`AFS-UI/api`, tsx)   |
| Insights   | `/ins`       | `@platinumv3/ins`    | `/insights-app/api` | `localhost:8080`                       |
| Overtime   | `/overtime`  | `@platinumv3/overtime`| `/overtime-app/api` | `localhost:8099` (`OVERTIME-API`, .NET)|
| SharePoint | `/sharepoint`| shell feature        | — (MS Graph)        | Microsoft 365 / Graph                  |
| Admin      | `/admin-settings/:module` | shell feature | — (localStorage)    | n/a                                    |

Dev proxy mappings live in `apps/shell/proxy.conf.json` (each `^/<x>-app/api/(.*)$`
rewrites to `/api` on the target). The shell dev server runs on **port 5000**.

---

## 4. Configuration

### 4.1 `.env` (repo root)
Loaded by Node backends (e.g. `AFS-UI/api/db.ts` loads the root `.env`).

| Variable               | Used by                              | Points to                         |
|------------------------|--------------------------------------|-----------------------------------|
| `DATABASE_URL` / `POSTGRES_URL` | Assets PSQL API             | `PlatinumV3_db`                   |
| `AZURE_POSTGRES_URL`   | AFS API (`AFS-UI/api`)               | `AFS` database (ADO-style string) |
| `AZURE_DATABASE_URL`   | Payroll backend                      | `Payroll` database                |
| `ART_API_URL`          | AFS API ART proxy (`art.ts`)         | external ART/EMS API              |
| `ART_API_USER` / `ART_API_PASS` | AFS ART proxy (HTTP Basic)  | ART credentials                   |
| `PLATINUM_API_URL`     | AFS API Platinum proxy (`platinum.ts`)| Platinum core financials API     |
| `EMS_API_BASE_URL`     | Payroll EMS lookups                  | live EMS/Platinum core API        |
| `JWT_SECRET`           | Payroll API                          | (Payroll JWT — **not** AFS)       |

> **Secrets:** real credentials live in `.env` only — do not commit them elsewhere.
> All databases are on `platinum-postgre-sql.postgres.database.azure.com`
> (user `Admin_Dev`), one database per module: `PlatinumV3_db` (Assets), `AFS`,
> `Payroll`, `Overtime`.

### 4.2 Azure PostgreSQL firewall ⚠️
The Azure DB only accepts whitelisted client IPs. If DB-backed endpoints time out
(`Connection terminated due to connection timeout`, `/api/health` → `db.ok:false`):
add your **current outbound IP** to the server's firewall rules in the Azure Portal
(Networking → Firewall rules). The AFS API re-checks the DB every 60s, so no restart
is needed once the IP is allowed.

### 4.3 Admin → Settings (`/admin-settings/:module`)
A shell page (`admin-settings.component.ts`) that stores per-module config in
`localStorage` under key `platinum_module_config`. Tabs: **Assets, Overtime, AFS,
Payroll**. Provides:
- API URLs per module.
- **Database** config cards (AFS / Overtime / Payroll → connection-string preview + validate).
- **SharePoint** config cards for **Assets** and **Overtime** (toggle + Site URL +
  Document Library Name + Test Connection). Keys:
  `assetsSharePoint{Enabled,SiteUrl,Library}`, `overtimeSharePoint{Enabled,SiteUrl,Library}`.

---

## 5. AFS backend (`AFS-UI/api`, port 9000)

A simplified **Express** API (run with `tsx`) that backs the AFS module. Files:

| File          | Responsibility                                                                 |
|---------------|--------------------------------------------------------------------------------|
| `index.ts`    | Express app, routes, `isDbDown()` guard (demo fallback), health, dashboard, reports |
| `db.ts`       | Postgres pool; loads root `.env`; parses ADO-style `AZURE_POSTGRES_URL`         |
| `demo.ts`     | Demo data returned when the DB is unreachable                                   |
| `art.ts`      | **ART proxy** — `/api/art/*` → `ART_API_URL` (HTTP Basic, 30s cache). Exposes `art` client |
| `platinum.ts` | **Platinum proxy** — `/api/platinum/*` (TB / GL reads) → `PLATINUM_API_URL`     |
| `ratios.ts`   | **Financial ratios** — `/api/reports/ratios/:fyId`                              |

### Key endpoints
- `GET /api/health` → `{ db: { ok } }`
- `GET /api/reports/dashboard` → KPIs + TB summary (demo fallback if DB down)
- `GET /api/reports/ratios/:financialYearId` → 32 NT-mandated ratios (see below)
- `GET /api/art/*` → ART/EMS source-system data (status, assets, payroll, billing, SCM…)
- `GET /api/platinum/*` → Platinum trial-balance / general-ledger reads
- `GET /api/admin/financial-years`, `/api/compilations`, etc.

### Financial Ratios (two-layer)
Ported from the AFS source `ratios.service.ts`:
1. **Layer 1 — Trial Balance baseline:** aggregates `trial_balance_entries`
   (bucketed by keyword on `sortDesc`/`scoaItemShortDesc`).
2. **Layer 2 — EMS enrichment:** when ART is configured, real EMS figures (payroll,
   assets, billing, budget via `art.ts`) overwrite TB guesses → `emsEnriched: true`
   (drives the green "EMS-Enriched" banner). `N/A` ratios = inputs not resolvable
   from either source for that period.

---

## 6. SharePoint document storage (Assets & Overtime)

Documents can be stored in **SharePoint** (Microsoft Graph) instead of a module's
local file storage, controlled from **Admin → <module> → SharePoint**.

- **Auth:** MSAL is configured app-wide in `apps/shell/app.config.ts`; the shared
  `GraphService` (`@platinumv3/shared/graph`) performs site/drive/file operations.
- **Assets:** `libs/assets/.../sharepoint-config.service.ts` — tags docs with an
  **`AssetsID`** column; consumed by the asset document panel.
- **Overtime:** `libs/overtime/.../overtime-sharepoint.service.ts` — tags docs with
  **`OvertimeID`** + **`Employee`** (`"Full Name (#empNo)"`) columns. Wired into the
  Capture/Edit Overtime form: when enabled, the supporting PDF uploads to the
  configured library; the edit form lists/views/removes the SharePoint doc.
- **SharePoint module** (`/sharepoint`): a Document Browser with pinned site
  (Sebata2) and dedicated **pinned library** pages in the sidebar:
  **UatAssets** (`/sharepoint/uat-assets`) and **UatOvertime** (`/sharepoint/uat-overtime`).
  Library columns are discovered dynamically.

> The target SharePoint libraries should have the metadata columns the tagging
> writes to (`AssetsID`; `OvertimeID`, `Employee`) for filtering/identification.

---

## 7. Running the project locally

The dev server is Angular's `ng serve`. The Nx project is named **`shell`** and lives
in `apps/shell/angular.json`.

### Shell (UI) — port 5000
```bash
# from repo root (uses nx):
npm run serve            # → nx serve shell --port=5000 --host=0.0.0.0
# or directly (reliable if nx can't resolve the project):
cd apps/shell
npx ng serve --port 5000 --host 0.0.0.0 --proxy-config proxy.conf.json
```

### AFS backend — port 9000
```bash
cd AFS-UI/api
npx tsx index.ts
```

### Other module backends
Start the relevant `*-API` / `*-APP` on its port (see §3) only for modules you're
testing. Run long-lived servers in their **own persistent terminals**.

### Health checks
```bash
curl http://localhost:5000/                                   # shell → 200
curl http://localhost:9000/api/health                         # AFS API → {db:{ok}}
curl http://localhost:5000/afs-app/api/reports/dashboard      # proxy path → data
```

---

## 8. Conventions & gotchas

- **Zoneless change detection:** use signals + `markForCheck()`; DOM updates after a
  programmatic event flush on a microtask (don't read the DOM synchronously right
  after a `.click()` in tests).
- **`apiPrefix` adaptation:** monorepo services prepend `environment.apiPrefix`
  (e.g. AFS `/afs-app`) to their base URL so requests hit the shell proxy. When
  porting a standalone service that hardcoded `/api`, adapt it (see AFS
  `api.service.ts`, `art-api.service.ts`, `platinum-api.service.ts`).
- **Global CSS leak:** `libs/payroll/src/lib/_payroll-global.css` is registered as a
  **global** style in `apps/shell/angular.json` and ships unscoped selectors (e.g.
  `.tab-content { display:none }`). This can hide other modules' elements. AFS works
  around it (renamed `.afs-tab-content` on the dashboard container; scoped
  `display` overrides elsewhere). Prefer module-unique class names.
- **AFS financial-year context:** the AFS lib's standalone `layout/shell.component`
  is **not** mounted in the monorepo, so `AFS_ROUTES` uses a **resolver**
  (`afsContextResolver`) to load the current FY into `PeriodFilterService` before any
  AFS route activates. Without it, compilation-gated pages show "No Active Compilation".
- **Nx project resolution:** `nx serve shell` may fail to resolve in some
  environments (angular.json is nested in `apps/shell`); falling back to
  `cd apps/shell && npx ng serve …` always works.
- **Background processes:** `(cmd &)` inside one-shot shells does not survive across
  steps — run servers in persistent terminals (or a process manager).

---

## 9. Change log (recent integrations)

- **AFS sync:** UI synced from source; added **ART proxy** (`art.ts`), **Platinum
  proxy** (`platinum.ts`), and **Ratios** endpoint (`ratios.ts`) to `AFS-UI/api`;
  wired `ART_API_URL/USER/PASS`, `PLATINUM_API_URL`, `AZURE_POSTGRES_URL` in `.env`.
- **AFS dashboard fix:** resolved the `.tab-content` global-CSS leak that hid the
  dashboard/tab content.
- **AFS nav fix:** added the financial-year resolver so AFS Builder pages
  (Data Sources, Opening Balance, Mapping Workbench, Integrity Checks) load.
- **Overtime SharePoint:** Admin → Overtime SharePoint config card +
  `OvertimeSharePointService`; Capture/Edit Overtime upload PDFs to SharePoint
  (tagged `OvertimeID` + `Employee`) when enabled.
- **SharePoint module:** added the **UatOvertime** pinned library page alongside
  **UatAssets**.
