# PerformanceSync — Standalone → Monorepo Sync Playbook (Performance module)

Reusable process + prompt for pulling updates from the Performance module's standalone repo into
`Platinum-v3_1`. Modeled on `BudgetSync.md`. First formal sync via `Platinum-v3-sync`'s dashboard —
this module had no dedicated doc before. Dashboard key: `Performance` (renamed from `Insights` on
2026-08-25 to match the product-facing name — the standalone repo, `/ins` route, and
`/insights-app` proxy prefix still say "Insight(s)", only the dashboard label changed).

**Standalone source:** `C:\Repos\Insight-Performance-Hub`
**Monorepo frontend target (as of Pass 3, 2026-08-26):** `libs/ins/src/lib` — real ported
components, reimplemented into the shell like every other module. `Insight-Performance-Hub/` at
the repo root is still vendored and still the **sync source** for future passes, but nothing in
the shell renders it directly anymore (see Pass 3 below for why this changed).
**Monorepo backend target:** `Insight-Performance-Hub/artifacts/api-server` (unchanged — this was
never iframed, only the frontend was).

---

## Architecture

**Current (Pass 3+): reimplemented, like every other module.** `libs/ins/src/lib` contains real
ported Angular components (`core/`, `shared/`, `features/`) mounted directly into the shell's
router via `libs/ins/src/lib/routes.ts`, exactly like Overtime/Budget/AFS/Payroll. No iframe, one
sidebar, one Angular app. See "Pass 3" below for the full port detail and the two import-alias
mechanisms (`@ins-core/*`, `@ins-shared/*`, `environment.apiBaseUrl`) that make ported code work
without every file needing rewritten relative paths.

**Historical (Pass 1–2): vendored wholesale + iframed — no longer how this module runs, kept here
for context.** Performance originally vendored the standalone's own separate Angular app wholesale
into `Insight-Performance-Hub/artifacts/perf-app` (a full standalone app with its own
routing/Material, `ng serve`, default port 18156) and embedded it into the shell via an
`InsDashboardComponent` that pointed an `<iframe>` at `` /perf-app${path}?embedded=1 ``. This
produced two independent sets of chrome on screen (the shell's sidebar/topbar plus perf-app's own,
since perf-app never had an embedded/chromeless display mode) — Pass 3 exists specifically to fix
that. The backend, `Insight-Performance-Hub/artifacts/api-server` (Express + TypeScript, Drizzle
ORM, monorepo dev port 8080), was never iframed and is unaffected by this change. See
`prompts/performance.md` for the original full detail (now partially superseded by Pass 3, kept
for its non-architecture content — DB config, env vars, etc.).

---

## Pass 1 (2026-08-25): confirmed and fixed the suspected bare-`/api` routing bug; scope limited to that + 2 stale comments — the large frontend/backend feature gap not touched

### Bug confirmed and fixed: `apiBaseUrl: '/api'` → `/insights-app/api`

`prompts/performance.md` flagged this as unverified going in. Neither `perf-app` (:18156) nor
`api-server` (:8080) were running locally, and there's no existing dev workflow to start them
(confirmed — `.replit`'s workflow config has no entry for either, despite `start-apis.js`'s comment
claiming they're "managed as dedicated Replit workflows"; `node_modules` was never installed
anywhere under the vendored `Insight-Performance-Hub/` tree either). A full browser click-through
wasn't possible without standing up a whole new local dev setup for a Node/Angular stack this
session hadn't touched before, which felt like the wrong scope for this pass.

Instead, traced the mechanics precisely: the shell's Angular dev server serves the outer `/ins`
page and proxies `/perf-app/*` to `:18156` (`proxy.conf.json`). The browser only ever sees requests
it made to the shell's own origin — the proxy-through to `:18156` is server-side and invisible to
the browser. So the iframe's *effective* origin for resolving further requests is the shell's
origin, not perf-app's real dev server. When perf-app's own code calls `fetch(environment.apiBaseUrl
+ '/...')` with a bare `'/api'`, that root-relative URL resolves against the shell's origin, hits
the shell's **default** `/api` proxy rule, and lands on **Assets** (`:3000`) — not this module's own
`api-server` (`:8080`). This is a deterministic fact about root-relative URL resolution + dev-proxy
transparency, not something that needed a live test to be sure of (same reasoning class as
confirming Postgres has no `GETDATE()` function during the Assets sync — a settled fact, not an
empirical unknown).

**Fixed**: `Insight-Performance-Hub/artifacts/perf-app/src/environments/environment.ts`'s
`apiBaseUrl` changed from `'/api'` to `'/insights-app/api'`, mirroring every other module's
`environment.ts` convention (documented inline with the reasoning above so the next person doesn't
have to re-derive it).

**Deliberately NOT changed**: `environment.prod.ts` (also bare `/api`). Unlike every other module,
`perf-app` is a genuinely separate deployable app with its own prod build — no
`web.config`/`staticwebapp.config.json` was found in either the standalone or monorepo copy, so
there's no visibility into how production actually routes requests. The dev-routing reasoning above
doesn't necessarily transfer to a production deployment topology this session doesn't understand.
Flagged for investigation, not guessed at.

### Two stale comments fixed

`libs/ins/src/lib/routes.ts` and `apps/shell/src/app/layout/shell.component.ts` (the
`insightsNav` array, ~line 1102) both called `perf-app` "React" and referenced a `.tsx` sidebar
file. `perf-app` is Angular (confirmed via `package.json`); the real current sidebar is
`artifacts/perf-app/src/app/layout/sidebar/sidebar.component.ts`. Comments updated to match, and
the shell's comment now also notes the nav-vs-vendor gap below so the next reader doesn't have to
rediscover it.

### Significant finding, not acted on: the shell's nav array is already ahead of the vendored code

Read `perf-app`'s current `sidebar.component.ts` (13 top-level groups, extensively nested) and
compared it against the shell's `insightsNav` array item-by-item — **they match exactly**,
including a "Revised SDBIP" group. But the standalone-vs-vendored diff (below) shows
`features/revised-sdbip/*` exists **only in standalone**, not yet in the monorepo's vendored
`perf-app` copy. That means the shell nav's "Revise SDBIP" / "Review Revised SDBIP" / "Approve
Revised SDBIP" links currently point at routes that don't exist in the vendored perf-app's own
router — clicking them would 404 or blank inside the iframe. This is the opposite of the usual
"nav array lags the code" gap documented in `BudgetSync.md` — here the nav was kept current
(probably manually, watching the standalone) while the vendored code fell behind it.

### Diff summary (standalone vs. monorepo vendored copy) — cataloged, not resolved this pass

Comparing `C:\Repos\Insight-Performance-Hub` against `Platinum-v3_1\Insight-Performance-Hub`
(excluding `node_modules`, `.git`, `artifacts/mockup-sandbox` (prototype, not live), and
`attached_assets`) found roughly 100 standalone-only files — **substantially more real feature
work than expected** going into this pass (the prompt anticipated "near-exact mirror," which was
wrong). Highlights:

- **A whole new backend package never vendored at all**: `lib/integrations-openai-ai-server`
  (OpenAI client wrapper — audio, batch, image endpoints).
- **New `perf-app` feature area**: `features/revised-sdbip/*` (capture/review/approve — already
  linked from the shell nav, see above).
- **New dashboard tabs**: `directorate-heatmap`, `milestones-tab`, `municipal-health`,
  `org-status-tab`, `performance-gauge`, `quarterly-trend`, `tables-tab`, `trend-tab`, plus a
  `dashboard-nav.store.ts`.
- **New admin/config pages**: `admin/departments`, `admin/employees`, `config/config-home`,
  `config/kpi-scoring`, `config/national-kpas`, `config/scorecards-config`,
  `config/sdbip-compliance`.
- **New `api-server` controllers**: `departments`, `kpi-rating-thresholds`, `scorecard-export`,
  `sdbip-field-configs`; new helpers (`assessment`, `effective-kpis`, `mfma-calendar`); new services
  (`email`, `mfma-reminders`); new object-storage lib (`objectAcl`, `objectStorage`).
- **New generated Zod types** (`lib/api-zod/src/generated/types/*`, ~25 files) tracking the new
  API surface above.
- **New `azure-sync/` folder** with a README and `perf-app-full-sync.sql` — worth reading before
  the next pass, may itself describe the intended sync process for this module.
- **Two monorepo-only source files with no standalone equivalent**: `dashboard/tabs/executive-tab.component.ts`,
  `dashboard/tabs/nkpa-tab.component.ts`, and `weightings/nkpa-weightings.component.ts`. Given the
  standalone has replaced these with the newer per-tab structure above, these are most likely
  **stale vendored files from an earlier standalone shape**, not intentional monorepo adaptations —
  needs confirming, not assumed, before deleting.

None of the above was pulled in, triaged, or deleted this pass — cataloged only.

### Verification performed

- Traced the routing bug mechanics as described above (no live test — see rationale).
- `tsc --noEmit -p apps/shell/tsconfig.app.json` — clean (the only build tooling actually available
  this session; `perf-app`/`api-server` have no `node_modules` installed anywhere under the vendored
  tree, so their own typecheck couldn't be run without a full `pnpm install` for an entire new
  workspace — judged too heavy for this pass given how much else remains).
- Read `environment.ts` back after editing to confirm the object-literal edit is syntactically
  intact (couldn't run perf-app's own `tsc`).

## Pass 2 (2026-08-26): vendored the full standalone-only diff; fixed a second routing bug (base href); stood up local dev tooling; first live verification

Read `azure-sync/README.md` first as Pass 1 recommended — it's a **database** sync doc
(`perf-app-full-sync.sql` brings the Azure `Performance` DB's schema+data up to date from a
`pg_dump`), not a code-sync process. **Destructive** (replaces all existing Performance DB data)
— not run. Not directly relevant to vendoring the app code, but explains the `USE_REPLIT_BUILTIN_DB`
flag's own comment (see below).

### Vendored the ~100-file diff via wholesale mirror, not file-by-file

Given the architecture (§ above — this module vendors the standalone app wholesale, it isn't
reimplemented into `libs/ins`), the safe approach was a directory-level mirror rather than
Budget/AFS-style file-by-file triage:

```
robocopy C:\Repos\Insight-Performance-Hub Platinum-v3_1\Insight-Performance-Hub /MIR ^
  /XD node_modules .git .agents .canvas .angular mockup-sandbox attached_assets ^
  /XF .replit .replitignore
```

This copied all standalone-only files (revised-sdbip feature, 8 new dashboard tabs, new admin/config
pages, new api-server controllers, `lib/integrations-openai-ai-server`, generated Zod types, DB
schema files) in one shot, and **purged** the 3 monorepo-only files Pass 1 flagged as suspected stale
leftovers (`executive-tab.component.ts`, `nkpa-tab.component.ts`, `nkpa-weightings.component.ts`) —
confirmed correct: standalone had genuinely replaced them with the newer per-tab dashboard structure.

Reapplied the one known monorepo-only adaptation the mirror necessarily overwrites:
`perf-app/src/environments/environment.ts`'s `apiBaseUrl` back to `/insights-app/api` (comment
explaining why is now inline in the file itself, not just here).

### Database: flipped `USE_REPLIT_BUILTIN_DB`, no migration needed

`lib/db/src/index.ts`'s `USE_REPLIT_BUILTIN_DB` flag flipped `true` → `false` (per its own comment
and `azure-sync/README.md`'s step 1) so it reads `APP_DATABASE_URL` against Azure Postgres, same as
every other module. The `Performance` database on `platinum-postgre-sql` **already existed with all
51 tables migrated**, including the newer schema for the vendored features (`departments`,
`kpi_rating_thresholds`, `sdbip_field_configs`, etc.) — no `drizzle-kit push` was needed this pass.

### Second routing bug found and fixed: `<base href="/">` breaks the iframe embed

Beyond the `apiBaseUrl` bug Pass 1 fixed, a second, more fundamental one: `perf-app/src/index.html`
has a hardcoded `<base href="/" />`. When `ng serve` runs standalone (port 18156 directly), that's
correct. But when proxied through the shell at `/perf-app/...`, the `<base>` tag makes **every**
relative asset URL in the served HTML (main.js, chunks, etc.) resolve against the shell's own origin
root — so the iframe ended up loading and bootstrapping the **shell's own Angular app**, not
perf-app's, while still displaying inside the `/ins/dashboard` iframe (very confusing symptom: the
iframe rendered *something* that looked plausible — the shell's own "Page not found" component,
complete with the shell's own sidebar — which could easily be mistaken for perf-app's own error page
if you didn't know to check `iframe.src` vs what actually loaded).

The obvious fix, `ng serve --base-href=/perf-app/`, **does not exist** on the modern
`@angular/build:dev-server` builder used here (`Error: Unknown argument: base-href`). Fixed instead
via `angular.json`: added `"baseHref": "/perf-app/"` to the **`development`** build configuration
only (what `ng serve` uses by default) — `production` (perf-app's own separate real deployment,
served at its own root) is untouched. This is the same class of "monorepo-dev-only override,
standalone/prod value preserved" pattern as `environment.ts`'s `apiPrefix`, just expressed via a
build config instead of a source file.

### Local dev tooling stood up

- `pnpm install` at the `Insight-Performance-Hub` workspace root (853 packages, clean — no lockfile
  conflicts despite the DB/env changes above).
- `api-server`: `APP_DATABASE_URL=<Performance DB Azure connection string> PORT=8080 NODE_ENV=development npx tsx ./src/index.ts` from `artifacts/api-server`.
- `perf-app`: `npx ng serve --host=0.0.0.0 --port=18156` from `artifacts/perf-app` (baseHref now comes
  from `angular.json`, no CLI flag needed).
- Both are now part of the standard "run the Platinum v3 app" set alongside the other 5 services —
  see `MASTER.md` §7.

### Live verification (the thing Pass 1 explicitly could not do)

- Shell `tsc --noEmit` clean.
- `/ins/dashboard`'s iframe genuinely renders **perf-app's own UI**, not the shell's — confirmed by
  reading `iframe.contentDocument` directly, not just checking `iframe.src` (the earlier bug's
  symptom looked plausible enough at a glance that `src` alone wouldn't have caught it).
- Real data rendering: 66.7% average organisational performance, Directorate Heat Map, 96%
  Municipal Health Score — the new dashboard tabs work end-to-end, not just compile.
- Network log confirms `/insights-app/api/dashboards/{overview,executive,directorate-heatmap,
  municipal-health}` all resolve to `:8080` (not `:3000`) — the original Pass 1 bug's fix confirmed
  live, not just reasoned about.
- The specific bug Pass 1 flagged and left unresolved — shell nav linking to `Revised SDBIP` before
  the feature was vendored — is now fixed as a side effect of the wholesale vendor: navigated the
  iframe directly to `/perf-app/revised-sdbip/capture` and got real content (`SDBIP 2025/2026,
  Approved on Jul 9, 2026, Revision: Submitted`), not a 404/blank.

### Still not done / still flagged

- **`environment.prod.ts` / production routing topology** — still unresolved, still not guessed at.
  Untouched again this pass.
- **`lib/integrations-openai-ai-server`** — vendored as part of the wholesale mirror, but not
  exercised live. No OpenAI secret was invented; its env vars are simply unset and it degrades
  rather than blocking startup, same as SMTP/object-storage.
- **`azure-sync/perf-app-full-sync.sql`** — read, understood, deliberately not run (destructive).
- No live check yet of the AI Insights tab, Reports, Bulk Upload, or the admin/config pages — the
  verification above focused on the specific bugs from Pass 1, not a full click-through of every
  feature.

## Pass 3 (2026-08-26): dropped the iframe entirely — native reimplementation into libs/ins

User feedback after Pass 2: the module worked, but showed two independent apps stacked on
screen — the shell's own sidebar/topbar plus perf-app's own full chrome rendered inside the
iframe (perf-app was never given an "embedded" mode; the `?embedded=1` query param on the iframe
src was vestigial, referenced nowhere in perf-app's layout). Asked to match every other module's
architecture exactly: no iframe boundary, one single Angular app, one sidebar.

**This changes the architecture note at the top of this file** — Performance is no longer
"vendored wholesale + iframed." As of this pass it follows the same pattern as
Overtime/Budget/AFS/Payroll: perf-app's real feature components, ported and adapted, live
natively in `libs/ins/src/lib`, mounted directly into the shell's router. `perf-app` itself
(`Insight-Performance-Hub/artifacts/perf-app`) remains only as the **sync source** for future
passes — it is no longer what renders in the browser.

### What was ported

Copied `perf-app/src/app/{core,shared,features}` into `libs/ins/src/lib/{core,shared,features}`
wholesale (~85 files), replacing the previous `libs/ins/src/lib/features/*` — which turned out to
be **inert placeholder stubs** from an earlier, abandoned attempt (real-looking filenames like
`revise-sdbip-capture.component.ts`, but literally 50-line "Connected to Insights API at ..."
cards, and `routes.ts` never actually routed to any of them — every real URL matched a single
`**: InsDashboardComponent` catch-all, the iframe wrapper). Deleted 27 of these once confirmed
they had no counterpart in the real perf-app source.

**Deliberately NOT ported** (shell/shared-auth provide these instead, matching every other
module): `layout/{app-layout,sidebar,topbar}` (shell chrome), `features/_shared/login.component.ts`
(shell's own login), `core/interceptors/{auth,error}.interceptor.ts` (superseded — see identity
bridge below), `app.component.ts` / `app.config.ts` / `app.routes.ts` (shell's own bootstrap
already exists).

**Kept**: `core/guards/auth.guard.ts`'s `accessGuard` (role-based section visibility within the
module — legitimate Performance-specific authorization logic, analogous to Overtime's
`canAccessCapture`-style flags) and `core/services/auth.service.ts` (role/section access +
`/auth/me` hydration, with its own `allowDevAuthFallback` safety net if that call fails).

### Import-path fixes

- `'../../../environments/environment'` (perf-app's actual path, one universal pattern across
  every file that used it) → `'../../environment'` (`libs/ins/src/lib/environment.ts` is a single
  flat file, not a sibling `environments/` folder).
- `@core/*` / `@shared/*` (perf-app's own tsconfig path aliases) don't exist in the monorepo.
  Rather than rewrite ~40 files' worth of relative-depth imports by hand, added two new,
  deliberately-namespaced aliases to `tsconfig.base.json` — `@ins-core/*` →
  `libs/ins/src/lib/core/*`, `@ins-shared/*` → `libs/ins/src/lib/shared/*` (namespaced, not bare
  `@core`/`@shared`, so a future module wanting generic-sounding aliases of its own never
  collides) — then a global `@core/` → `@ins-core/`, `@shared/` → `@ins-shared/` rename across the
  ported files.
- `libs/ins/src/lib/environment.ts` only had `apiPrefix` before; the ported code calls
  `environment.apiBaseUrl` everywhere (perf-app's own convention). Added `apiBaseUrl:
  '/insights-app/api'` as a derived alias alongside `apiPrefix` rather than rewriting every call
  site — also added `appName`, `version`, `demoUser`, `allowDevAuthFallback` (all referenced by
  the ported `AuthService`/guard).

### Identity bridge (matches Overtime's exact pattern)

perf-app's own `auth.interceptor.ts` hardcoded `x-user: environment.demoUser` ('admin') on every
API call — api-server's `authMiddleware` looks up `req.headers['x-user']` against its own `users`
table and 401s hard (`User 'X' not found`) if there's no match, no soft fallback. Now that this is
native shell code, bridged the shell's real POS-authenticated username in via the **shared**
`libs/shared/auth/src/lib/auth.interceptor.ts` (not a second, competing local interceptor) —
added `/insights-app/api/` to `PERFORMANCE_PREFIXES`, sending `x-user: auth.user()?.userName` when
present. Also replaced the stale `/perf-app/api/` entry in `FIRST_PARTY_API_PREFIXES` (dead since
the iframe is gone) with `/insights-app/api/`. Verified live: `/insights-app/api/auth/me`
returned 200, not a 401 — the shell's current session username does resolve against Performance's
`users` table.

### Routes and shell nav

New `libs/ins/src/lib/routes.ts` mounts every real perf-app route directly (no more single
`**` catch-all to an iframe) under one `canActivateChild: [accessGuard]` parent, matching
perf-app's own `app.routes.ts` path-for-path (minus the `AppLayoutComponent`/`authGuard`
wrapper, since the shell's `moduleGuard('insights')` already gates the whole `/ins` tree before
these routes are ever reached).

Cross-checking `apps/shell/src/app/layout/shell.component.ts`'s `insightsNav` against these real
routes (the exact "shell nav is its own sync surface" class of check from `BudgetSync.md`) found
**two real mismatches**, both fixed:
- `/departmental/kpi-assignments` → no such route; real route is `/departmental/review`
  (relabeled "Review Departmental Scorecards" to match).
- `/weightings/nkpa` ("NKPA Weightings") → removed entirely. No such route or feature exists in
  the current standalone source at all — this nav entry pointed at the same
  `nkpa-weightings.component.ts` file Pass 2 already confirmed was a stale pre-refactor leftover
  with no standalone equivalent.

Also removed the now-dead `/perf-app` proxy rule from `apps/shell/proxy.conf.json` (the iframe's
own asset-serving rule — nothing hits it anymore).

### Verification

- `tsc --noEmit` on the shell: clean, 0 errors, first attempt after the alias fix (the ~150
  `Cannot find module '@core/...'` / cascading `Property 'x' does not exist on type 'unknown'`
  errors from the initial copy all resolved once `@ins-core`/`@ins-shared` were wired up).
- Restarted the shell dev server (tsconfig path-alias changes need a fresh start, not just HMR).
- Live browser check: `document.querySelector('iframe')` on `/ins/dashboard` → `null`. Single
  `navigation` sidebar confirmed via the accessibility tree (Dashboard, Original SDBIP, Revised
  SDBIP, Departmental, Individual, Actuals & Evidence, Moderation, Reports, AI Insights,
  Integrations, Audit Trail, Configuration, Admin) — no second "PLATINUM PERFORMANCE" chrome.
- Real data renders natively: Overview dashboard (66.7% avg performance, 96% municipal health
  score, directorate heat map) and Revised SDBIP capture ("SDBIP 2025/2026, Approved on Jul 9,
  2026, Revision: Submitted") both match exactly what Pass 2's iframe showed, now with zero iframe
  boundary. `/insights-app/api/*` calls confirmed hitting `:8080` correctly (network log).

### Not done / still flagged (unchanged from Pass 2, still applies)

- `environment.prod.ts` / production routing topology still unverified.
- No full click-through yet of AI Insights, Reports, Bulk Upload, or every admin/config page —
  routing and imports are wired for all of them, but only Dashboard and Revised SDBIP Capture got
  a real data-driven live check this pass.
- `azure-sync/perf-app-full-sync.sql` still deliberately not run (destructive).
- The standalone `perf-app`/`api-server` dev servers (`:18156`/`:8080`) are left running as the
  sync source for future passes, but nothing in the shell points at them anymore.

## Pass 4 (2026-08-26): the shell's nav had drifted into a fictional, more-elaborate-than-real menu — replaced it with a byte-for-byte mirror of the real sidebar

User reported "a lot of things missing" comparing our app against the live production site
(`platinum-performance-ui.azurewebsites.net`), including a blank FIN YEAR dropdown. Investigated
both separately:

**FIN YEAR was a transient issue, not a bug.** `CycleStore` (`libs/ins/src/lib/features/dashboard/tabs/cycle-picker.ts`)
subscribes to `GET /cycles` exactly once via `toSignal` with `catchError(() => of([]))` — if that
one request fails (a Postgres firewall blip mid-request, the same recurring theme all session), the
signal is stuck empty forever with no retry, and only a full page reload fixes it. Confirmed via a
plain reload: FIN YEAR populated correctly (`2025/2026`) once the request succeeded. Fixed at the
root — `ApiService.get()` now retries transient failures automatically (`retry({ count: 2, delay:
... })`, backed off 500ms/1000ms) so every read call in this module gets the same protection, not
just `CycleStore`. `POST`/`PATCH`/`PUT`/`DELETE` deliberately NOT given automatic retry (not
idempotent — a retried write could double-submit).

**The nav gap was real, and was the opposite of what "missing" suggested.** Compared
`apps/shell/src/app/layout/shell.component.ts`'s `insightsNav` against perf-app's actual, current
`sidebar.component.ts` (`NAV` array) directly — not against `libs/ins/src/lib/routes.ts`, which
was misleading here since a route existing doesn't mean the real product's nav links to it. Also
cross-checked against the live production site by clicking through it directly (confirming
`/annual/capture` there shows the exact same "Migration in progress... being ported from the
previous React build" placeholder our own port shows — proving the local standalone source and
the deployed production app are in sync, not stale relative to each other).

Our `insightsNav` had accumulated a much larger, partly-aspirational menu across earlier
passes/sessions: "Individual" (5 items), "Moderation" (2 items), standalone "AI Insights" /
"Integrations" / "Audit Trail" links, an "Approve SDBIP" link, "Targets & Activities", "SDBIP
Overview", "Corrective Actions", a 13-item "Configuration" submenu, and a separate "Admin" group
with "Role Permissions" / "Workflow Config" — **none of which exist in perf-app's real sidebar**.
The real sidebar (confirmed against both the local source and the live site) is dramatically
simpler: Dashboard; SDBIP / Revised SDBIP / Departmental SDBIP (2 items each: Compile, Review);
Quarterly Actuals / Mid-Year / Annual (4 items each: Capture, Manager Review, PMS Review, Internal
Audit); flat links for Reports, Bulk Upload, Departments, Employees, Configuration.

Replaced `insightsNav` entirely with a byte-for-byte mirror of the real `NAV` array (labels, icons,
grouping, order). The underlying routes/components for the removed items (Individual, Moderation,
AI Insights, etc.) are untouched in `libs/ins` — they're real, working, ported code, just correctly
unlinked from nav now, matching the real product exactly. Whether to delete that unlinked code
outright is a separate future decision, not made this pass.

**Verified**: `tsc --noEmit` clean; live browser check confirmed the new nav renders exactly
("Dashboard, SDBIP, Revised SDBIP, Departmental SDBIP, Quarterly Actuals, Mid-Year, Annual,
Reports, Bulk Upload, Departments, Employees, Configuration" via `nav.innerText`); dashboard still
renders full real data (66.7% avg performance, 96% municipal health score) with FIN YEAR correctly
populated after a reload.

## Pass 5 (2026-08-26): missing icon font — ligature text rendering literally instead of glyphs

User screenshot showed literal text ("bar_chart", "trending_up", "table_chart", "assignment",
"assignment_ind", "flag", "monitoring") next to every dashboard tab label instead of icons.

Root cause: the dashboard/tab components (12 files, ~78 occurrences) render icons via a raw
`<span class="material-symbols-rounded">bar_chart</span>` ligature-font pattern — perf-app's own
convention, distinct from the rest of the monorepo's `<mat-icon>` (Angular Material component,
"Material Icons" font). Two things were missing, both defined in perf-app's own
`app.component`-level bootstrap files that Pass 3 correctly did NOT port (they're
app-shell/bootstrap concerns, not feature code):
- The Google Fonts `<link>` for "Material Symbols Rounded" (perf-app's `src/index.html`) — the
  shell's `index.html` only loaded "Material Icons".
- The `.material-symbols-rounded` CSS class itself (perf-app's `src/styles.scss`) — Google's
  `css2` font endpoint doesn't auto-provide a utility class the way the older `icon?family=`
  endpoint does; the consuming app must define it.

Fixed by adding both to the shell's global files (`apps/shell/src/index.html`'s `<head>`,
`apps/shell/src/styles.css`) rather than rewriting 78 call sites to `<mat-icon>` — one addition
covers every current and future use of the ligature pattern in this module.

**Lesson**: when porting a module that previously ran as its own separate Angular app (own
`index.html`/`styles.scss`/`app.component`), those excluded bootstrap files can still carry global
CSS classes or font `<link>` tags that ported feature code silently depends on. A clean `tsc
--noEmit` doesn't catch this — TypeScript has no way to know a CSS class or font is missing, only a
live visual check does. Diff the standalone's `index.html`/`styles.scss` against the shell's
equivalents as an explicit step, not just the feature-code diff.

## Remaining work (next passes)

1. Full click-through of every admin/config page under the real, simplified nav — routing and
   imports exist but haven't all had a real data-driven live check yet.
2. Decide whether to delete the now-fully-unlinked Individual/Moderation/AI Insights/Integrations/
   Audit Trail/etc. code in `libs/ins`, or leave it as dormant-but-correct for a future real launch
   of those features (they were real ported code, just never linked from the real product's nav).
3. Investigate production routing for `perf-app` before touching `environment.prod.ts`.
4. Decide whether `azure-sync/perf-app-full-sync.sql` should ever be run against this environment,
   and if so, who owns that decision (it replaces all existing Performance DB data).
