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
- **AFS:** `libs/afs/.../core/services/afs-sharepoint.service.ts` supports **two** libraries
  (Admin → AFS → SharePoint Config), each with its own toggle:
  - **UatAFS** — working papers / general AFS docs, entity-link column **`AFSID`**.
  - **UatAFSAdjustments1** — adjustment documents, entity-link column **`ADJID`** (note the URL
    segment `…Adjustments1`; the drive is matched by URL segment, not display title).
  Columns written: link column + `Description`, `Classification`, `Category`, `Tags`,
  `DocumentType`, `AccessLevel`. Metadata is written resiliently (bulk PATCH, then field-by-field
  fallback). **Adjustments → Link Existing** copies a UatAFS working paper into the Adjustments
  library, re-tagged with the adjustment title in `ADJID`. Internal column names can differ from the
  display name (e.g. `Adj-id` → `Adj_x002d_id`); the uploader tries several candidate names.
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

## 9. Deployed Azure web apps & App Settings

The monorepo deploys to a set of Azure App Services. Frontend is one web app; each module API is its own.

| Role | Azure App Service | Deployed by pipeline | Public URL (referenced in code) |
|---|---|---|---|
| **Shell / frontend** | `Platinum-V3-UI` | ✅ | — (the site itself) |
| POS / identity | `Platinum-V3-POS-API` | ✅ | `platinum-pos-api.azurewebsites.net` |
| AFS | `Platinum-V3-AFS-Postgres-API` | ✅ | `platinum-afs-api.azurewebsites.net` |
| IDP | `Platinum-V3-IDP-Postgres-API` | ✅ | `platinum-idp-api.azurewebsites.net` |
| Budget | `Platinum-V3-Budget-Postgres-API` | ✅ | `platinum-budget-api.azurewebsites.net` |
| Overtime | `Platinum-V3-Overtime-Postgres-API` | ✅ | `platinum-overtime-api.azurewebsites.net` |
| Payroll | `Platinum-V3-Payroll-Postgres-API` | ✅ | `platinum-payroll-api.azurewebsites.net` |
| Assets | _(referenced / deployed separately)_ | — | `platinum-assets-api.azurewebsites.net` |
| SCM | _(external backend, own JWT)_ | — | `rep-scm-api.azurewebsites.net` |
| Insights | _(referenced / deployed separately)_ | — | `platinum-insights-api.azurewebsites.net` |

### App Settings by web app

**`Platinum-V3-UI` (shell / `server.js`)** — reverse-proxy targets + browser runtime config:

| Setting | Purpose |
|---|---|
| `ASSETS_API_URL`, `POS_API_URL`, `AFS_API_URL`, `PAYROLL_API_URL`, `IDP_API_URL`, `BUDGET_API_URL`, `SCM_API_URL`, `INSIGHTS_API_URL`, `OVERTIME_API_URL` | Per-module proxy targets |
| `SCM_API_URL` | **Also injected to the browser** as `window.__PLATINUM_ENV__.SCM_API_URL`; the SCM module + auth interceptor read it (default `https://rep-scm-api.azurewebsites.net`). Lets the SCM host be changed without a redeploy. |

**`Platinum-V3-POS-API`** — reads `process.env` directly (no dotenv); see §11 for profiles:

| Setting | Purpose |
|---|---|
| `EMS_PROFILE` | Selects the EMS/tenant config set (`grguat` / `localtest`), loaded by `load-profile.ts` |
| `PLATINUM_API_URL` | George Platinum API (login/user-details); also drives the `george` site's `apiUrl` |
| `PLATINUM_API_USERNAME` / `PLATINUM_API_PASSWORD` / `PLATINUM_API_DBNAME` | George API service creds / default DB |
| `EMS_V3_*` (`SERVER`/`NAME`/`USER`/`PASSWORD`/`PORT`/`ENCRYPT`/`TRUST_CERT`) | `ems_v3` catalogue DB |
| `EMS_TENANT_*` (`SERVER`/`PORT`/`USER`/`PASSWORD`/`NAME`/`ENCRYPT`/`TRUST_CERT`/`DB_MAP`) | Tenant `User_UserDetail` DB |
| `PORT`, `DATABASE_URL`, `SESSION_SECRET` | Port, optional Postgres session store, session secret |

> A real App Setting always wins over a profile-file value — pick a profile and still override single keys.

---

## 10. Deployment pipeline (`azure-pipelines.yml`)

| Job | App Service | Build |
|---|---|---|
| `Shell_UI` | `Platinum-V3-UI` | Angular prod build → served by `server.js` |
| `POS_API` | `Platinum-V3-POS-API` | Source-only + Oryx `npm install`, `npm start` |
| `AFS_API` | `Platinum-V3-AFS-Postgres-API` | Source-only + Oryx |
| `IDP_API` / `Budget_API` / `Overtime_API` / `Payroll_API` | `Platinum-V3-*-Postgres-API` | `dotnet publish` |

**Azure Linux/Oryx notes:** the built-in .NET stack listens on `:8080` (ignores `WEBSITES_PORT`); large
Node apps deploy source-only and let Oryx install. Set `SCM_DO_BUILD_DURING_DEPLOYMENT=true` where Oryx builds.

---

## 11. POS-API identity, EMS databases & profiles

POS-API is the **identity provider** and the Access-Management backend. It uses **MS SQL (EMS)**, not Postgres.

### Login flow
1. `POST /pos-app/api/auth/login` → POS-API authenticates against the **George Platinum API**
   (`{PLATINUM_API_URL}/auth/createToken`, or `/auth/createTokenAzure` for Microsoft sign-in) and fetches the
   profile from `{PLATINUM_API_URL}/api/User`.
2. Returns `{ user, site, token }`; `AuthService` stores it. Dashboard shows `firstName lastName`; header shows the site.
3. Sites (`SITE_CONFIGS` in `platinum-auth.ts`): `george` (apiUrl/dbName from `PLATINUM_API_URL`/`PLATINUM_API_DBNAME`), `site02`.

### EMS databases
- **`ems_v3` catalogue** (`emsfunctions.database.windows.net`) — `dbo.roles`, `dbo.modules`, `dbo.role_modules`,
  `dbo.user_roles`. Accessed via `getEmsPool()`.
- **Tenant DB** (`User_UserDetail`) — per municipality, on the on-prem / UAT SQL box. Accessed via
  `getTenantPool(dbName)`; `dbName` resolves from the session's site config (or pinned by `EMS_TENANT_NAME`).

### EMS profiles (`POS-API/env/<profile>.env`, selected by `EMS_PROFILE`)
`load-profile.ts` (imported first in `index.ts`) applies the file at startup; `run.sh <profile>` is a local launcher.

| Profile | ems_v3 | Tenant DB (`User_UserDetail`) |
|---|---|---|
| **grguat** (default) | `PlatinumV3User` @ `emsfunctions…/ems_v3` | `emsv2User` @ `159.138.171.219:3342` / `EMS_GeorgeUAT` (encrypt off) |
| **localtest** | same | `emsv2User` @ `110.238.76.98:3342` / `EMS_Training` (encrypt off) |

> Credentials live in the profile files / `ems-db.ts` defaults _(secret)_ — not duplicated here.
> `EMS SQL 18456 "Login failed"` = wrong credentials/permissions or wrong server, **not** a firewall timeout.

---

## 12. Access Management (Settings → Access Management)

`/settings/access-management` (top-level **Settings** module) and `/admin-settings/access-management`.
Backed by POS-API:

| Endpoint | Source |
|---|---|
| `GET /pos-app/api/roles` | `ems_v3` role catalogue (no auth) |
| `GET /pos-app/api/users` | tenant `User_UserDetail` + `ems_v3.user_roles` (needs a valid POS session) |
| `PUT /pos-app/api/user-roles/:userId` | writes `ems_v3.dbo.user_roles` |

Routes: `POS-API/routes/modules.routes.ts`; data access: `POS-API/ems-modules.ts`. UI:
`apps/shell/.../admin/access-management.component.ts` (+ `.service.ts`).

---

## 13. Shared auth — the single source of identity & token

**Package `@platinumv3/shared/auth` (`libs/shared/auth`) is the one auth authority.** Every module reads
the signed-in user and the token from its `AuthService`; no module defines its own login or hardcodes a user.

> A standalone integration contract for this (for Replit / out-of-repo module work, so auth merges back
> without conflicts) is kept as **`Platinum-Auth-Config.docx`** at the repo root. Update it alongside this
> section when the auth surface changes.

### 13.1 `AuthService` public surface
- **Signals:** `user()` (`AuthUser`: `user_ID`, `userName`, `firstName`, `lastName`, `eMail`, `superUser`,
  `modules?`), `site()`, `isAuthenticated()`/`authenticated()`, `checked()`, `userRoles()`, `allowedModules()`.
- **Methods:** `getToken()` (the POS `platinum_token` — the single token source), `canAccessModule(code)`,
  `loadMyModules()`, `checkAuth()`, `login(username,password,siteId='george')`, `loginAzure(claims,siteId)`,
  `loadSites()`, `handleLoginSuccess()`, `setLocalSession()`, `logout(persist=true)`, `hasRole()`.
- **Storage keys:** `platinum_user`, `platinum_site`, `platinum_token`, `platinum_logged_out`.
- **Backend:** `POS_AUTH_BASE = '/pos-app/api'` → POS-API (`/auth/login`, `/auth/createTokenAzure`,
  `/auth/status`, `/auth/my-modules`, `/sites`, `/auth/logout`). See §11 for the login → George API flow.
- **Also exported:** `authInterceptor`, `authGuard`, `MsAuthService` (`getGraphToken()`, `getApiToken(scopes)`).

### 13.2 Interceptor (`auth.interceptor.ts`)
- `withCredentials` **only** for first-party `/<module>-app/api/` calls (POS-API session cookie).
- `Authorization: Bearer getToken()` **only** for the **SCM** host (`SCM_API_URL`) and the **George** API.
- A `401` tears down the session and redirects to `/login` — **except** for SCM, George, and `/auth/`
  calls (their 401 means their own token is invalid, not that the app session expired). This is why the
  SCM nav no longer bounces the user to login.

### 13.3 Module identity unification
Modules keep their own role/permission logic but source the **displayed user** and the **token** from the
shared `AuthService` (overlay the shell user's name/email; token from `getToken()`). Done for **overtime,
afs, payroll, scm** (was: "Karools", hardcoded "System Admin", `DEV_USERS`, `rep-scm-api` user). **assets,
budget, idp, ins** don't render a user name; **pos** is the identity provider itself.

Pattern:
```ts
import { AuthService as ShellAuthService } from '@platinumv3/shared/auth';
private shell = inject(ShellAuthService);
readonly displayName = computed(() => {
  const u = this.shell.user();
  return u ? (`${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.userName) : (fallback);
});
getToken() { return this.shell.getToken(); }
```

> **SCM caveat:** SCM uses `rep-scm-api` with its own JWT; the app session token is not valid there, so SCM
> *data* still needs a valid SCM token/bootstrap even though the nav no longer logs you out.
> **Boundary:** this unifies the **frontend** identity/token; each module **backend** still validates its own
> auth (full backend token-trust / SSO is a separate, not-yet-done change).

---

## 14. Change log (recent integrations)

- **Unified module auth:** overtime/afs/payroll/scm now source the displayed user + token from the shared
  `@platinumv3/shared/auth` `AuthService` instead of hardcoded/module-local identities (see §13.3). Added
  `Platinum-Auth-Config.docx` (standalone integration contract).
- **AFS Adjustments SharePoint:** second AFS library (**UatAFSAdjustments1**, `ADJID`); Upload + Link-Existing
  copy into it with full metadata (`DocumentType`/`AccessLevel` added); resilient field-by-field metadata write.
- **Access Management:** Settings → Access Management wired to POS-API (`/users`, `/roles`, `/user-roles/:id`)
  over `ems_v3` + tenant `User_UserDetail`; new top-level **Settings** module chip.
- **POS-API config:** `EMS_PROFILE` profile loader (`env/*.env`, `load-profile.ts`, `run.sh`); `PLATINUM_API_URL`
  now drives the `george` site config; profiles **grguat** / **localtest**.
- **SCM fix:** `SCM_API_URL` is a `Platinum-V3-UI` App Setting injected to the browser (`window.__PLATINUM_ENV__`);
  auth interceptor no longer logs the user out on SCM/George `401`s (stops the SCM→login bounce).
- **Dashboard:** added the **Overtime** tile and a "No access granted" state when the user has no modules.
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
