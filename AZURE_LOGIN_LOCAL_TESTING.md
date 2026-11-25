# Azure AD (MSAL) Login — Local Testing Guide

How to run and test the "Sign in with Microsoft" login that resolves / creates
the user directly in the EMS (`ems_v3`) Azure SQL database.

## What was built

**Front-end (`apps/shell` + `libs/shared/auth`)**
- `libs/shared/auth/src/lib/auth.service.ts` — `loginAzure({ azureUid, email, username }, siteId)`
  posts the MSAL claims to POS-API and applies the returned session.
- `apps/shell/src/app/features/login/login.component.ts` — the "Sign in with
  Microsoft" button now calls `loginAzure(...)` (previously it faked a local
  admin session).

**Backend (`POS-API`)**
- `POS-API/ems-db.ts` — `mssql` connection pool to the EMS Azure SQL database.
- `POS-API/ems-azure-auth.ts` — find-or-create + link provisioning logic
  (`user_azure_link` ↔ `User_UserDetail`).
- `POS-API/routes/auth.routes.ts` — `POST /api/auth/createTokenAzure`.

**Module access control (`POS-API` + `apps/shell`)** — see the dedicated section below.
- `POS-API/sql/module-access.sql`, `POS-API/ems-modules.ts`,
  `POS-API/routes/modules.routes.ts` — roles / modules schema + endpoints.
- The login payload (`user.modules`) and a route guard drive which side-nav
  modules each user can see.

## Databases (two connections)

| Table | Database | Connection |
|-------|----------|------------|
| `user_azure_link` | `ems_v3` (the `V2Connection`) | `EMS_V3_*` |
| `User_UserDetail` | the **tenant DB** named by `user_azure_link.user_db` (e.g. George / Site02) | tenant pool — reuses the `EMS_V3_*` server + credentials, switching only the catalog (override with `EMS_TENANT_*`) |

## Flow

```
[Login page :5000] --Sign in with Microsoft--> MSAL popup
   -> oid / preferred_username / name
   -> POST /pos-app/api/auth/createTokenAzure  (proxied to POS-API :3003)
        -> ems_v3:    find user_azure_link by oid + user_db
        -> tenant DB: (George/Site02) resolve User_UserDetail
             found    -> load user
             orphaned -> re-match by email / create, repoint link (in ems_v3)
             no link  -> match by email (1 link / 0 create / >1 error), link
        -> create cookie session, return { success, user, site }
   -> navigate to /dashboard
```

---

## Prerequisites

1. **Postgres for POS-API.** POS-API stores sessions in Postgres
   (`connect-pg-simple`) and imports `db.ts`, which throws on boot if
   `DATABASE_URL` is unset. Use the same Postgres URL used on Replit
   (`DATABASE_URL` / `AZURE_DATABASE_URL`).

2. **Firewall access to both SQL servers.**
   - `ems_v3` on `emsfunctions.database.windows.net` (Azure SQL) must allow your
     local public IP: Azure Portal → SQL server → Networking → *Add client IPv4
     address*.
   - The tenant DB server (e.g. `110.238.76.98:3342`) must be reachable from your
     machine — that port open / your IP allowed on its firewall.

3. **Azure AD redirect URIs** (only needed for the actual Microsoft popup, not
   the curl test). The app registration `183c6d74-…` must list these as
   **SPA** redirect URIs:
   - `http://localhost:5000`
   - `http://localhost:5000/auth-redirect`

4. **Root dependencies installed** (one time, from the repo root):
   ```powershell
   npm install --legacy-peer-deps
   ```
   > Plain `npm install` fails on the `@nx/angular` ↔ Angular 21 peer conflict —
   > `--legacy-peer-deps` is required.

---

## Environment variables (POS-API)

| Variable               | Required | Default                                | Purpose                                              |
|------------------------|----------|----------------------------------------|------------------------------------------------------|
| `EMS_V3_USER`          | yes      | —                                      | EMS SQL login (from old `V2Connection`)              |
| `EMS_V3_PASSWORD`      | yes      | —                                      | EMS SQL password                                     |
| `EMS_V3_SERVER`        | no       | `emsfunctions.database.windows.net`    | Server hosting `ems_v3` (and, by default, tenant DBs)|
| `EMS_V3_NAME`          | no       | `ems_v3`                               | DB holding `user_azure_link`                         |
| `EMS_V3_PORT`          | no       | `1433`                                 | EMS SQL port                                          |
| `EMS_V3_ENCRYPT`       | no       | on (set `false` to disable)            | TLS — Azure SQL needs it on                          |
| `EMS_V3_TRUST_CERT`    | no       | off (`true` to trust self-signed)      | On-prem only                                         |
| `EMS_TENANT_SERVER`    | no       | same as `EMS_V3_SERVER`                | Tenant DB host (e.g. `110.238.76.98`) — often a *different* server |
| `EMS_TENANT_PORT`      | no       | same as `EMS_V3_PORT`                  | Tenant DB port (e.g. `3342`)                         |
| `EMS_TENANT_USER`      | no       | same as `EMS_V3_USER`                  | Tenant SQL login                                     |
| `EMS_TENANT_PASSWORD`  | no       | same as `EMS_V3_PASSWORD`              | Tenant SQL password                                  |
| `EMS_TENANT_ENCRYPT`   | no       | inherit (`false` to disable TLS)       | `System.Data.SqlClient` defaults to no encryption    |
| `EMS_TENANT_TRUST_CERT`| no       | inherit (`true` to trust self-signed)  | Matches `TrustServerCertificate=true`                |
| `EMS_TENANT_NAME`      | no       | —                                      | Pin a single tenant catalog (e.g. `EMS_Training`), ignoring the `user_db` label |
| `EMS_TENANT_DB_MAP`    | no       | —                                      | Per-tenant catalog map, e.g. `George=GeorgeDb;Site02=Site02Db` |
| `EMS_USER_DB`          | no       | the selected site's db name            | Pin the `user_db` value (else from `siteId`)         |
| `DATABASE_URL`         | no\*     | —                                      | Postgres (sessions + drizzle). \*Optional locally — auto-falls back to in-memory sessions **only when absent**; if set, Postgres is always used. |
| `PORT`                 | yes (3003)| `5000`                                | Must be `3003` (the shell proxy target)              |

> Do **not** set `NODE_ENV=production` locally — that makes the session cookie
> `secure`-only, so it won't be sent over HTTP `localhost` and login will appear
> to silently fail.

---

## Run it

### Terminal 1 — POS-API (port 3003)

`ems_v3` (link table) and the tenant DB (`User_UserDetail`) are on different
servers, so both connections are configured. Leave `DATABASE_URL` unset locally
to use in-memory sessions; set it (and Postgres is always used) when you have it.

PowerShell:
```powershell
cd POS-API
$env:PORT=3003
# ems_v3 (user_azure_link) — Azure SQL:
$env:EMS_V3_USER="<v2-user>"
$env:EMS_V3_PASSWORD="<v2-pass>"
# tenant DB (User_UserDetail) — e.g. EMS_Training on 110.238.76.98,3342:
$env:EMS_TENANT_SERVER="110.238.76.98"
$env:EMS_TENANT_PORT="3342"
$env:EMS_TENANT_NAME="EMS_Training"
$env:EMS_TENANT_USER="<tenant-user>"
$env:EMS_TENANT_PASSWORD="<tenant-pass>"
$env:EMS_TENANT_TRUST_CERT="true"
$env:EMS_TENANT_ENCRYPT="false"   # System.Data.SqlClient default; try "true" if connect fails
npx tsx index.ts
```

Bash:
```bash
cd POS-API
PORT=3003 \
  EMS_V3_USER="<v2-user>" EMS_V3_PASSWORD="<v2-pass>" \
  EMS_TENANT_SERVER="110.238.76.98" EMS_TENANT_PORT="3342" EMS_TENANT_NAME="EMS_Training" \
  EMS_TENANT_USER="<tenant-user>" EMS_TENANT_PASSWORD="<tenant-pass>" \
  EMS_TENANT_TRUST_CERT="true" EMS_TENANT_ENCRYPT="false" \
  npx tsx index.ts
```

> Add `DATABASE_URL="<postgres-url>"` once you have the Platinum POS Postgres
> connection string — Postgres is then used automatically (closer to production).

### Terminal 2 — Shell (port 5000)

> `nx serve shell` does **not** work in this workspace (Nx detects no projects;
> `@nx/angular` is incompatible with Angular 21). Use the Angular CLI directly
> from `apps/shell` — `angular.json` there already wires the port + proxy.

```powershell
cd apps/shell
npx ng serve --port 5000
```

Then open `http://localhost:5000/login` and click **Sign in with Microsoft**.

---

## Test the EMS logic in isolation first (recommended)

Validate DB connectivity, schema, and find/create **without** MSAL/Azure AD, by
posting a fake GUID + a real EMS email:

```bash
curl -i -X POST http://localhost:3003/api/auth/createTokenAzure \
  -H "Content-Type: application/json" \
  -d '{"azureUid":"11111111-1111-1111-1111-111111111111","email":"you@municipality.gov.za","username":"Your Name","siteId":"george"}'
```

PowerShell:
```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:3003/api/auth/createTokenAzure `
  -ContentType "application/json" `
  -Body '{"azureUid":"11111111-1111-1111-1111-111111111111","email":"you@municipality.gov.za","username":"Your Name","siteId":"george"}'
```

In the POS-API console, watch for:
- `[EmsAzure] Schema: {...}` — one-time dump confirming the real column names.
- `[EmsAzure] Linked Azure id …` or `[EmsAzure] Created EMS user …`
- `[Auth] Azure login — <name> (user_ID: …)`

A `200` with `{"success":true,...}` means the entire DB path works; after that,
the Microsoft button is just the front-end layer on top.

---

## Module access control (side-nav authorization)

Role-based access decides which modules appear in the shell side nav and which
module routes a user may open. It builds on the same login flow and the same
`ems_v3` connection above.

**Where the data lives** (all in `ems_v3`, the `EMS_V3_*` connection):

| Table | Purpose |
|-------|---------|
| `modules` | catalogue of shell modules (`ModuleCode` is the stable key) |
| `roles` | `Administrator` (`IsAdmin`), `Base User` (`IsBase`), one role per module |
| `role_modules` | role → modules |
| `user_roles` | user → role, per tenant (`DbName`) |
| `user_module_access` | optional direct per-user grants, unioned in |

The admin **user list** (`GET /api/users`) reads `User_UserDetail` from the
**tenant** DB, so it needs the `EMS_TENANT_*` connection just like the login flow.

**Effective modules for a user:** `superUser` **or** an assigned `IsAdmin` role →
all modules; otherwise Base-role modules ∪ assigned-role modules ∪ direct grants,
with `dashboard` always included.

**No extra setup** — `ensureModuleSchema()` creates + seeds all tables on the
first call to `/api/modules`, `/api/roles`, or any login. To pre-apply by hand:
```powershell
sqlcmd -S emsfunctions.database.windows.net -d ems_v3 -U <v2-user> -P <v2-pass> -i POS-API\sql\module-access.sql
```

### Verify the API layer

```powershell
Invoke-RestMethod http://localhost:3003/api/modules   # catalogue (seeds on first call)
Invoke-RestMethod http://localhost:3003/api/roles

# log in a non-super EMS user, keeping the session cookie:
$r = Invoke-RestMethod -Method Post -Uri http://localhost:3003/api/auth/createTokenAzure `
  -ContentType "application/json" -SessionVariable sess `
  -Body '{"azureUid":"11111111-1111-1111-1111-111111111111","email":"you@municipality.gov.za","username":"Your Name","siteId":"george"}'
$r.user.modules                                        # effective module codes
Invoke-RestMethod -Uri http://localhost:3003/api/auth/my-modules -WebSession $sess
```
A base user with no roles returns `["dashboard"]`; a `superUser` returns everything.

### Verify in the UI

- **Note:** "Continue as Administrator" and the auto-created local session are
  `superUser: true`, so they see **every** chip — they don't demonstrate
  filtering. Use **Sign in with Microsoft** (or a legacy non-super user).
- Base user → only **Dashboard** in the side nav; typing `/assets` redirects to
  `/dashboard` (route guard).
- As an admin, open **Admin → Access Management**, tick the **Assets** role for
  that user and save. Sign back in as them → the **Assets** chip and `/assets`
  route become available. (Effective modules are attached at login, so sign
  out/in — or a page reload, via `loadMyModules()` — to pick up new grants.)

## Troubleshooting

| Symptom | Likely cause / fix |
|---------|--------------------|
| `NX Cannot find project 'shell'` | Don't use Nx — run `npx ng serve` from `apps/shell`. |
| POS-API exits on boot: `DATABASE_URL must be set` | Set `DATABASE_URL` to a Postgres connection string. |
| `503 EMS database is not configured` | Set `EMS_V3_USER` and `EMS_V3_PASSWORD`. |
| `Login failed for user '…'. The account is disabled.` | The EMS SQL login is disabled — `ALTER LOGIN [user] ENABLE;` on master, or use an enabled login. |
| `Invalid object name 'User_UserDetail'` | The tenant DB / catalog is wrong. `User_UserDetail` lives in the George/Site02 DB, not `ems_v3`. Check `user_db` resolves to the right catalog; set `EMS_TENANT_DB_MAP` / `EMS_TENANT_SERVER` if needed. |
| `Cannot open database "…" requested by the login` | The tenant catalog name is wrong or the login lacks access to it — fix `EMS_TENANT_DB_MAP` or grant access. |
| EMS connect timeout / login fails | Add your local IP to the Azure SQL server firewall. |
| Login "succeeds" but bounces back to /login | `NODE_ENV=production` set locally → cookie is `secure`-only over HTTP. Unset it. |
| `409 Multiple users with the same email…` | More than one `User_UserDetail` row shares that email (ambiguous). |
| MSAL popup error: redirect URI mismatch | Add `http://localhost:5000` and `http://localhost:5000/auth-redirect` as SPA redirect URIs on the app registration. |
| `[EmsAzure] Schema` shows different column names | The EMS schema differs from the port — tell the dev to adjust the constants at the top of `POS-API/ems-azure-auth.ts`. |
| `503 Access-control database is not configured` (Access Management) | Module tables need the `ems_v3` connection — set `EMS_V3_USER` / `EMS_V3_PASSWORD`. |
| Non-super user still sees every side-nav chip | They're actually a `superUser`, or you're on the local auto-admin session (`superUser: true`). Sign in as a real non-super EMS user. |
| Access Management user list is empty / errors | `GET /api/users` reads `User_UserDetail` from the tenant DB — same cause as `Invalid object name 'User_UserDetail'` above (fix the `EMS_TENANT_*` connection). |
| Chips don't change after assigning a role | Effective modules are attached at **login** — sign out/in, or reload so `loadMyModules()` refreshes. |

---

## Notes / known scope

- EMS-direct sessions use a **synthetic token** (no upstream Platinum bearer),
  so downstream POS/billing API calls for these users still authenticate via the
  existing `PLATINUM_API_*` path.
- EMS module-access provisioning **is** now implemented (see "Module access
  control" above): roles/modules live in `ems_v3` and drive the shell side nav.
  A new Azure user starts with the **Base User** role (Dashboard only) until an
  admin assigns further roles in **Admin → Access Management**.
- `User_UserDetail.UserId` is an identity column — the insert relies on
  `OUTPUT INSERTED.UserId`.
