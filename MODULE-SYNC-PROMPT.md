# Module Sync Prompt (reusable)

Use this to **sync / re-sync** a module's code from its standalone source repo into
the **Platinum-v3_1** Nx monorepo — the same process used for Assets, AFS, Overtime,
and Payroll.

How to use:
1. Copy the **PROMPT TEMPLATE** below into a new chat.
2. Fill in the `<<…>>` placeholders for the module you're syncing.
3. Delete any optional sections that don't apply (backend proxy / SharePoint / DB).

---

## PROMPT TEMPLATE — copy from here ↓

```
Sync the latest <<MODULE>> code from its source repo into the Platinum-v3_1 monorepo.
Focus ONLY on the <<MODULE>> module — do not touch any other module.

CONTEXT
- SOURCE REPO:        <<C:\Repos\Platinum-XXXX>>            (standalone app to sync FROM)
- MONOREPO LIB:       libs/<<module>>/src/lib               (sync INTO)
- ROUTE:              /<<module>>   (mounted in apps/shell/src/app/app.routes.ts as <<MODULE>>_ROUTES)
- API PREFIX:         /<<module>>-app    (proxied in apps/shell/proxy.conf.json → backend)
- BACKEND (dev):      localhost:<<PORT>>    (<<backend folder, e.g. XXXX-API>>)

DB CONFIG (only if this module owns a database):
  <<Host=platinum-postgre-sql.postgres.database.azure.com;Port=5432;Database=<<DB>>;Username=Admin_Dev;Password=...;SslMode=Require>>

APIs / SECRETS used by the module (only if applicable):
  <<API_NAME_URL : https://...>>
  <<API_USER / API_PASS or JWT_SECRET : ...>>

RULES

1) MARKER CHECK FIRST (avoid syncing stale code)
   Before diffing, confirm the SOURCE actually contains the feature(s) I expect to
   see (name a page/string from the live app). If the source repo is OLDER than the
   live/deployed app (the feature/string is missing), STOP and tell me — I must push
   the source first. Report the source git HEAD (commit + date).

2) DIFF FIRST — do not copy blindly
   List, before changing anything:
     • MISSING files  (in source, absent in monorepo lib)
     • DIFFERENT files (exist in both, content differs)
     • Exclude the SKIP list (item 3) from both lists.
   Then state which DIFFERENTs are real source changes vs. known monorepo adaptations.

3) SKIP — never sync these (monorepo provides them)
   • auth / login / role-guard / auth-interceptor / auth.service
   • app.ts / app.config.ts / app.routes.ts / app.html / app.scss
   • layout / main-layout / the lib's own shell.component
   • the standalone module.routes.ts root wiring (keep the monorepo's lib routes file)
   Do NOT sync login/auth.

4) SYNC — feature components / services / models / shared / utils
   Copy real source changes BUT preserve the monorepo adaptations:
     • Environment: keep `environment.ts` (`apiPrefix: '/<<module>>-app'`); services must
       prepend `environment.apiPrefix` to their base URL (do NOT revert to hardcoded
       '/api'). Adapt any newly-synced service the same way.
     • Keep monorepo baseUrl/proxy wiring; don't reintroduce standalone absolute URLs.

5) ROUTE PREFIXES
   Prefix internal absolute navigations with `/<<module>>` (router links, navigateByUrl),
   anchored to routing contexts only. Don't double-prefix; don't touch external URLs.

6) NEW FEATURES (a page that doesn't exist in the monorepo yet)
   • Copy the component/service files into libs/<<module>>.
   • Add its route to the lib routes file.
   • Add the nav link (in apps/shell/src/app/layout/shell.component.ts for this module's
     sidebar) so it's reachable.

7) BACKEND (only if the module's backend lives in the monorepo and needs new endpoints)
   If the frontend calls endpoints the monorepo backend doesn't implement, port the
   source backend logic into the monorepo backend (adapt NestJS/TypeORM → the monorepo
   backend's style; read config from env/localStorage; keep it scoped to this module).
   Wire any new env vars into root `.env` and the proxy/Admin config.

8) AVOID KNOWN MONOREPO PITFALLS
   • Zoneless change detection — use signals + markForCheck(); don't rely on Zone.
   • Global CSS leaks — do NOT introduce unscoped global class names; if a generic
     class (e.g. `.tab-content`) is hidden/broken by another module's global CSS,
     rename it module-uniquely or add a scoped `display` override (see AFS).
   • If the module relied on its standalone shell.component to seed shared state
     (e.g. selected financial year / tenant), that shell is NOT mounted here — add a
     route resolver in the lib routes to seed that state before any page activates
     (see AFS `afsContextResolver`).

9) VERIFY
   • Type-check: `node node_modules/typescript/bin/tsc --project apps/shell/tsconfig.app.json --noEmit`
   • Run the app and confirm the affected pages render and load data:
       Shell: cd apps/shell && npx ng serve --port 5000 --host 0.0.0.0 --proxy-config proxy.conf.json
       Backend (if any): start it on port <<PORT>>
   • Health/endpoint checks through the proxy path (/<<module>>-app/api/...).

OUTPUT
  Give me: the marker-check result + source HEAD, the MISSING/DIFFERENT lists with my
  interpretation, the exact files changed, and the verification results. Keep all
  changes inside the <<MODULE>> module.
```

## PROMPT TEMPLATE — copy to here ↑

---

## Quick fill-in reference (per module)

| Module   | Route       | API prefix          | Backend (dev)         | Owns DB?            |
|----------|-------------|---------------------|-----------------------|---------------------|
| assets   | `/assets`   | `/api`,`/ASSETS-API`| `localhost:3000` + Azure | `PlatinumV3_db`  |
| scm      | `/scm`      | `/scm-app/api`      | `localhost:3002`      | —                   |
| pos      | `/pos`      | `/pos-app/api`      | `localhost:3003`      | —                   |
| payroll  | `/payroll`  | `/payroll-app/api`  | `localhost:6000` (`/api/v1`) | `Payroll`     |
| idp      | `/idp`      | `/idp-app/api`      | `localhost:8008`      | —                   |
| budget   | `/budget`   | `/budget-app/api`   | `localhost:3001`      | —                   |
| afs      | `/afs`      | `/afs-app/api`      | `localhost:9000` (`AFS-UI/api`) | `AFS`     |
| ins      | `/ins`      | `/insights-app/api` | `localhost:8080`      | —                   |
| overtime | `/overtime` | `/overtime-app/api` | `localhost:8099` (`OVERTIME-API`) | `Overtime` |

> See `MASTER.md` for the full architecture, configuration, and run instructions.

---

## Optional add-on: SharePoint document storage for a module

Append this block to the prompt when the module should store documents in SharePoint
(as done for Assets and Overtime):

```
SHAREPOINT (optional)
- Add a SharePoint config card to Admin → <<Module>> (apps/shell admin-settings.component.ts),
  mirroring Assets: toggle + Site URL + Document Library Name, persisted to localStorage
  key `platinum_module_config` (<<module>>SharePoint{Enabled,SiteUrl,Library}).
- Create a <<Module>>SharePointService (libs/<<module>>/core) mirroring the Assets
  SharePointConfigService, using @platinumv3/shared/graph, keyed by a <<Module>>ID
  metadata column (+ any extra columns like Employee).
- In the upload flow: when enabled, upload the file to the configured SharePoint
  library (tag with <<Module>>ID); otherwise keep the existing local upload.
- (Optional) Add a pinned library page under /sharepoint (clone uat-assets.component →
  uat-<<module>>.component, set LIBRARY, add route + sidebar item).
- MSAL/Graph is already app-wide (apps/shell/app.config.ts) — no extra auth setup.
```
