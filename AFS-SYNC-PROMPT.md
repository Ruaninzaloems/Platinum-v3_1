# AFS Module — Sync Prompt (ready to use)

Paste the block below into a new chat to sync / re-sync the **AFS** module from its
source repo into the Platinum-v3_1 monorepo. It is pre-filled with AFS's real values.

> Secrets: the DB password and ART credentials live in the repo root `.env` — they're
> shown masked here. Replace `••••` only if you intend to paste real values.

---

## PROMPT — copy from here ↓

```
Sync the latest AFS code from its source repo into the Platinum-v3_1 monorepo.
Focus ONLY on the AFS module — do not touch any other module.

CONTEXT
- SOURCE REPO:    C:\Repos\Platinum-AFS
- MONOREPO LIB:   libs/afs/src/lib
- ROUTE:          /afs   (AFS_ROUTES, mounted in apps/shell/src/app/app.routes.ts)
- API PREFIX:     /afs-app   (proxy.conf.json → http://localhost:9000, rewrite → /api)
- BACKEND (dev):  AFS-UI/api   (Node/Express run via `npx tsx index.ts`, port 9000)
- ENV:            libs/afs/src/lib/environment.ts → { apiPrefix: '/afs-app' }

DATABASE (AFS database, read by AFS-UI/api/db.ts via AZURE_POSTGRES_URL):
  Host=platinum-postgre-sql.postgres.database.azure.com;Port=5432;Database=AFS;Username=Admin_Dev;Password=••••;SslMode=Require;CommandTimeout=600;Timeout=30

EXTERNAL APIs used by AFS (root .env):
  ART_API_URL      : https://platinum-art-api-ftd9ejdaefcpdrg0.southafricanorth-01.azurewebsites.net
  ART_API_USER     : admin
  ART_API_PASS     : ••••              (HTTP Basic for the ART proxy)
  PLATINUM_API_URL : https://platinum-afs.azurewebsites.net
  JWT_SECRET (AFS) : pltfm-afs-…       (NOT used in the monorepo — the shell handles auth;
                                        do NOT overwrite the global JWT_SECRET, which is Payroll's)

RULES

1) MARKER CHECK FIRST
   Confirm Platinum-AFS actually contains the feature(s) I name before diffing. Report
   the source git HEAD (commit + date). If the source is older than the live app, STOP
   and tell me to push first.

2) DIFF FIRST (exclude the SKIP list, item 3)
   List MISSING (in source, absent in libs/afs) and DIFFERENT files. For each DIFFERENT,
   say whether it's a real source change or a known monorepo adaptation. Note: the
   following DIFFERENTs are EXPECTED adaptations, not source changes — leave them:
     • core/services/api.service.ts        → baseUrl = (environment.apiPrefix||'') + '/api'
     • core/services/art-api.service.ts    → baseUrl = (environment.apiPrefix||'') + '/api/art'
     • core/services/platinum-api.service.ts → baseUrl = (environment.apiPrefix||'') + '/api/platinum'
     • core/guards/auth.guard.ts, core/services/auth.service.ts  → SKIP (auth)

3) SKIP — never sync (the monorepo provides these)
   auth/login/role-guard/auth-interceptor/auth.service; app.ts/app.config.ts/app.routes.ts/
   app.html/app.scss; layout/main-layout; the lib's own layout/shell.component;
   the standalone module.routes.ts (keep libs/afs/src/lib/routes.ts). Do NOT sync login/auth.

4) SYNC features (components/services/models/shared/utils) PRESERVING adaptations
   • Keep environment.ts apiPrefix '/afs-app'. Any newly-synced service that calls the
     backend must prepend environment.apiPrefix (do not hardcode '/api', '/api/art',
     '/api/platinum').

5) ROUTE PREFIXES
   Prefix internal absolute navigations with `/afs` (anchored to routing contexts only).
   Don't double-prefix; don't touch external URLs.

6) NEW FEATURES
   Copy files into libs/afs, add the route to libs/afs/src/lib/routes.ts, and add the
   nav link in apps/shell/src/app/layout/shell.component.ts (AFS sidebar).

7) BACKEND — AFS-UI/api (port 9000)
   The monorepo AFS backend is a simplified Express API. If the frontend calls endpoints
   it doesn't implement, port the source NestJS logic into these modules (keep the pattern):
     • art.ts      → /api/art/*        proxy to ART_API_URL (Basic auth, 30s cache); exports `art` client
     • platinum.ts → /api/platinum/*   TB / GL reads → PLATINUM_API_URL (host-path helpers)
     • ratios.ts   → /api/reports/ratios/:fyId   TB baseline (trial_balance_entries) + EMS enrichment via `art`
   Mount new routes in index.ts. Wire any new env vars into root .env.

8) KNOWN AFS PITFALLS (already fixed — keep them)
   • Global CSS leak: libs/payroll/_payroll-global.css ships unscoped `.tab-content{display:none}`
     (global in apps/shell/angular.json). AFS dashboard uses `.afs-tab-content`; other AFS
     tabbed pages use a scoped `display` override. Do NOT reintroduce a bare `.tab-content`
     that renders without an `.active` class.
   • Financial-year context: the AFS lib's standalone shell.component is NOT mounted, so
     libs/afs/src/lib/routes.ts wraps all routes in a pathless parent with `afsContextResolver`
     that loads the current FY into PeriodFilterService before any route activates. Keep it —
     without it, compilation-gated pages (Data Sources / Opening Balance / Mapping Workbench /
     Integrity Checks) show "No Active Compilation".
   • Zoneless change detection — signals + markForCheck(); don't rely on Zone.

9) VERIFY
   • Type-check:  node node_modules/typescript/bin/tsc --project apps/shell/tsconfig.app.json --noEmit
   • Backend type-check (bundler res):  cd AFS-UI/api && npx tsc --noEmit --module esnext --moduleResolution bundler --target es2022 --lib es2023,dom --types node --skipLibCheck index.ts art.ts platinum.ts ratios.ts
   • Run:  AFS API → cd AFS-UI/api && npx tsx index.ts ;  Shell → cd apps/shell && npx ng serve --port 5000 --host 0.0.0.0 --proxy-config proxy.conf.json
   • Smoke:  curl http://localhost:9000/api/health  (expect db.ok:true) ;
             curl http://localhost:5000/afs-app/api/reports/dashboard ;
             curl http://localhost:5000/afs-app/api/reports/ratios/<fyId>
   • If DB times out (db.ok:false): whitelist the current outbound IP in the Azure
     Postgres firewall (Networking → Firewall rules). Re-check ~60s later.

OUTPUT
  Marker-check + source HEAD; MISSING/DIFFERENT lists with interpretation; exact files
  changed; verification results. Keep ALL changes inside the AFS module.
```

## PROMPT — copy to here ↑

---

## AFS quick facts (for reference)

| Item              | Value                                                                 |
|-------------------|-----------------------------------------------------------------------|
| Source repo       | `C:\Repos\Platinum-AFS` (NestJS server + Angular client)              |
| Monorepo lib      | `libs/afs/src/lib`                                                     |
| Route / prefix    | `/afs`  ·  apiPrefix `/afs-app`                                        |
| Backend           | `AFS-UI/api` (Express, `tsx`) — **port 9000**                          |
| Backend files     | `index.ts`, `db.ts`, `demo.ts`, `art.ts`, `platinum.ts`, `ratios.ts`  |
| Database          | `AFS` on `platinum-postgre-sql.postgres.database.azure.com` (`AZURE_POSTGRES_URL`) |
| ART proxy         | `/api/art/*` → `ART_API_URL` (Basic `ART_API_USER`/`ART_API_PASS`)    |
| Platinum proxy    | `/api/platinum/*` → `PLATINUM_API_URL`                                |
| Ratios endpoint   | `/api/reports/ratios/:financialYearId`                                |
| Auth              | Handled by the shell — AFS login/auth files are SKIPPED               |

> Full architecture & run details: `MASTER.md`. Generic multi-module version: `MODULE-SYNC-PROMPT.md`.
