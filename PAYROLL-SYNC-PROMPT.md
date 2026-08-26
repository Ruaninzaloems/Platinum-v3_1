# Payroll Module — Sync Prompt (ready to use)

Paste the block below into a new chat to sync / re-sync the **Payroll** module from its
source repo into the Platinum-v3_1 monorepo. It is pre-filled with Payroll's real values.

> ⚠️ At last check (2026-06-16) the source repo `C:\Repos\Platinum-Payroll-1` was a
> **partial checkout**: `api` was a 0-byte placeholder file and no Angular UI was present —
> only docs, `attached_assets/`, `.agents/`, `.canvas/`. **Pull/clone the source properly
> first** so the real UI + backend code is on disk, otherwise the marker check (Rule 1) will
> (correctly) stop the sync.
>
> Secrets: the Payroll DB connection lives in the repo root `.env` as `AZURE_DATABASE_URL` —
> shown masked here. Replace `••••` only if you intend to paste a real value.

---

## PROMPT — copy from here ↓

```
Sync the latest Payroll code from its source repo into the Platinum-v3_1 monorepo, and
get it running end-to-end. Focus ONLY on the Payroll module — do not touch any other module.

CONTEXT
- SOURCE REPO:        C:\Repos\Platinum-Payroll-Dev   (Replit project: Node/Express api + Angular client; the COMPLETE codebase — use this, NOT Platinum-Payroll-1 whose HEAD stripped the code)
- SOURCE ANGULAR UI:  client/src/app (confirmed 2026-08-25 — core/, features/, layout/, shared/,
                      matching libs/payroll/src/lib's own top-level structure 1:1, no path
                      remapping needed)
- SOURCE BACKEND:     src/server (confirmed 2026-08-25 — NOT the top-level `api` file, which is
                      a 0-byte leftover placeholder in BOTH the standalone and the monorepo copy;
                      the real entry is `require('./src/server/index.js')` from root index.js)
- MONOREPO LIB:       libs/payroll/src/lib   (core/services/: api.service.ts,
                      notification.service.ts, ui.service.ts; plus core/models/, features/,
                      layout/, shared/)
- ROUTE:              /payroll   (PAYROLL_ROUTES in apps/shell/src/app/app.routes.ts)
- API PREFIX:         /payroll-app   (proxy.conf.json → http://localhost:6000,
                      pathRewrite → /api/v1   ← note: v1, not /api)
- MONOREPO BACKEND:   PAYROLL-APP   (Node, entry index.js; reads AZURE_DATABASE_URL;
                      serves locally on :6000 under /api/v1)
- ENV (frontend):     libs/payroll/src/lib/environment.ts → { apiPrefix: '/payroll-app' }

DATABASE
  The Payroll backend (PAYROLL-APP, Node) reads its connection from AZURE_DATABASE_URL
  (the Payroll database) in the repo root .env. Use the ADO-style string:
    AZURE_DATABASE_URL=Host=platinum-postgre-sql.postgres.database.azure.com;Port=5432;Database=<PayrollDb>;Username=Admin_Dev;Password=••••;SslMode=Require;CommandTimeout=600;Timeout=30
  ⚠️ Do NOT touch the root .env DATABASE_URL (that one is Assets' PlatinumV3_db). Payroll uses
     AZURE_DATABASE_URL. Confirm the exact Database= name from PAYROLL-APP before running.
     (Azure Postgres firewall must allow the current outbound IP — Networking → Firewall rules.)

RULES

1) MARKER CHECK FIRST  (⚠️ the source may be a partial checkout — see header note)
   First confirm the source actually contains real code: the Angular UI folder exists with
   .component.ts files AND the backend has real source (not a 0-byte `api` placeholder).
   If the UI or backend is missing/empty, STOP and tell me to pull/clone the source first.
   Then confirm the source contains the feature/string I name before diffing:
   <<name a Payroll page or UI string from the live app, e.g. "Manage Leave" / "Pay Points">>.
   Report the source git HEAD (commit + date). If the live/deployed Payroll app has features
   the source lacks (marker missing), STOP and tell me to push the source first — do NOT sync
   stale code over newer monorepo code.

2) DIFF FIRST — and MAP THE STRUCTURE
   Source layout may differ from the lib (core/services/, features/, layout/, shared/).
   First produce a path map: which source file corresponds to which libs/payroll file. Then
   list MISSING and DIFFERENT (by mapped path), excluding the SKIP list (Rule 3).
   For EACH different file decide direction explicitly — it is NOT always "source wins":
     • Compare mono-only vs source-only line counts.
     • If mono has substantial extra content/enhancements the source lacks → MONO IS AHEAD → skip.
     • If source has the new feature and mono only has superseded/adaptation lines → sync source.
   Expected adaptations (leave the adaptation, but still sync any NEW logic in the same file):
     • core/services/api.service.ts → baseUrl = (environment.apiPrefix || '') + '/api'
       (currently inlined as '/payroll-app/api'; the proxy rewrites /payroll-app/api → /api/v1).
       Do NOT revert to a hardcoded '/api' or '/api/v1'.

3) SKIP — never sync (the monorepo provides these)
   auth/login/role-guard/auth-interceptor/auth.service; app.ts/app.config.ts/app.routes.ts/
   app.html/app.scss; layout/main-layout; the lib's own layout/shell.component;
   the standalone routes wiring (keep libs/payroll/src/lib/routes.ts). Do NOT sync login/auth.

4) SYNC features PRESERVING monorepo adaptations
   • Keep environment.ts → { apiPrefix: '/payroll-app' }.
   • Services reach the backend via api.service (baseUrl already has the apiPrefix) — fine.
   • ANY direct/href URL or hardcoded '/api' or '/api/v1' in a component MUST be prefixed with
     environment.apiPrefix (e.g. file download/view links, export endpoints).

5) ROUTE PREFIXES
   Prefix internal absolute navigations with `/payroll` (lowercase). Don't double-prefix;
   don't touch external URLs.

6) NEW FEATURES
   Copy files into libs/payroll, add the route to libs/payroll/src/lib/routes.ts, and add the
   nav link in apps/shell/src/app/layout/shell.component.ts (Payroll sidebar).
   Existing feature folders (diff against these): benefits, dashboard, disciplinary, employees,
   employment-changes, ess, jobprofiles, leave, medical-aid-schemes, organogram, pay-points,
   payroll, performance, positions, recruitment, reports, retirement-funds, salary-structure,
   settings, skills, time, trade-unions.

7) AVOID KNOWN MONOREPO PITFALLS  (the source documents these in .agents/memory/*.md — READ THEM)
   • Zoneless change detection — signals + markForCheck(); don't rely on Zone.
     (source: .agents/memory/zoneless-change-detection.md)
   • Global CSS leak: libs/payroll/src/lib/_payroll-global.css is shipped UNSCOPED in
     apps/shell/angular.json and leaks into every module (e.g. a bare `.tab-content{display:none}`
     hid AFS content). Keep Payroll's generic classes scoped; do NOT add bare generic selectors
     that other modules could match.  (source: .agents/memory/global-css-opacity-trap.md)
   • Unified API path convention — keep the single /payroll-app prefix.
     (source: .agents/memory/payroll-unified-path.md)
   • Date format standard + external-API resilience + Azure PG migration notes also live in
     .agents/memory/ — apply them when syncing the relevant code.
   • If Payroll relied on its standalone shell.component to seed shared state (selected period /
     cycle), that shell is NOT mounted here — add a route resolver in libs/payroll/src/lib/routes.ts
     to seed it before any page activates. (Skip if N/A.)

8) BUILD-VERIFY
   • Type-check: node node_modules/typescript/bin/tsc --project apps/shell/tsconfig.app.json --noEmit

9) RUN THE BACKEND (Node) — required for the module to work
   Confirm the start command in PAYROLL-APP/package.json. Start it in its own persistent terminal:
     cd PAYROLL-APP
     # ensure AZURE_DATABASE_URL is set (root .env or exported) then:
     node index.js          # (or `npm start` — confirm)
   It should listen on :6000 and serve under /api/v1, running Postgres queries against the
   Payroll database. (Azure Postgres firewall must allow the current outbound IP.)

10) RUN THE SHELL + SMOKE TEST
   • Shell: cd apps/shell && npx ng serve --port 5000 --host 0.0.0.0 --proxy-config proxy.conf.json
   • Verify:
       curl http://localhost:6000/api/v1/<known-payroll-endpoint>           → 200 (direct)
       curl http://localhost:5000/payroll-app/api/<known-payroll-endpoint>  → 200 (via proxy)
       load /payroll pages → they render real data, not a "service unavailable" error.
   • Click through the main Payroll pages and confirm data + any file/export links work.

OUTPUT
   Marker-check (incl. "is the source fully checked out?") + source HEAD; the source→lib path
   map; MISSING/DIFFERENT lists with per-file direction (sync vs skip vs leave) and reasoning;
   exact files changed; the adaptations applied (apiPrefix URLs, any CSS scope fix, new api
   methods); backend start confirmation; and smoke-test results. Keep ALL changes inside the
   Payroll module (libs/payroll) — the only thing outside is RUNNING the PAYROLL-APP backend.
```

## PROMPT — copy to here ↑

---

## Payroll quick facts (for reference)

| Item              | Value                                                                      |
|-------------------|----------------------------------------------------------------------------|
| Source repo       | `C:\Repos\Platinum-Payroll-Dev` (Replit: Node/Express api + Angular client) |
| Source UI path    | `client/src/app` → maps to `libs/payroll/src/lib`                           |
| Monorepo lib      | `libs/payroll/src/lib`                                                      |
| Route / prefix    | `/payroll`  ·  apiPrefix `/payroll-app`                                     |
| Proxy rewrite     | `/payroll-app/api` → **`/api/v1`** (not `/api`) — local target `:6000`      |
| Monorepo backend  | `PAYROLL-APP` (Node, `index.js`) — **port 6000**, serves `/api/v1`          |
| Backend DB env    | `AZURE_DATABASE_URL` (root `.env`) — Payroll DB on `platinum-postgre-sql…`  |
| api.service base  | `/payroll-app/api` (inlined adaptation; proxy → `/api/v1`)                  |
| Core services     | `api.service.ts`, `notification.service.ts`, `ui.service.ts`               |
| Auth              | Handled by the shell — Payroll login/auth files are SKIPPED                 |
| Pitfall notes     | source `.agents/memory/*.md` (zoneless, global-css trap, unified path, …)   |

> Full architecture & run details: `MASTER.md`. Generic multi-module version: `MODULE-SYNC-PROMPT.md`.
> Sibling examples: `AFS-SYNC-PROMPT.md`.
