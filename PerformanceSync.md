# PerformanceSync — Standalone → Monorepo Sync Playbook (Performance module)

Reusable process + prompt for pulling updates from the Performance module's standalone repo into
`Platinum-v3_1`. Modeled on `BudgetSync.md`. First formal sync via `Platinum-v3-sync`'s dashboard —
this module had no dedicated doc before. Dashboard key: `Performance` (renamed from `Insights` on
2026-08-25 to match the product-facing name — the standalone repo, `/ins` route, and
`/insights-app` proxy prefix still say "Insight(s)", only the dashboard label changed).

**Standalone source:** `C:\Repos\Insight-Performance-Hub`
**Monorepo target:** `Insight-Performance-Hub/` (vendored wholesale at the repo root — **not**
`libs/ins/src/lib`, which is a thin iframe wrapper, not a reimplementation)

---

## Architecture (read this before touching anything — different from every other module)

Every other synced module (Overtime, Budget, AFS, Payroll) got its standalone Angular pages
**reimplemented** into `libs/<module>/src/lib` inside the shell's single Angular app. Performance
instead **vendors the standalone's own separate Angular app wholesale** into
`Insight-Performance-Hub/artifacts/perf-app` (a full standalone app with its own routing/Material,
`ng serve`, default port 18156) and embeds it into the shell via `libs/ins/src/lib`'s ~20-line
`InsDashboardComponent`, which just points an `<iframe>` at `` /perf-app${path}?embedded=1 ``. The
backend, `Insight-Performance-Hub/artifacts/api-server`, is Express + TypeScript (Drizzle ORM),
monorepo dev port 8080. See `prompts/performance.md` for the full detail.

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

## Remaining work (next passes)

1. Full click-through of the remaining features listed above (AI Insights, Reports, Bulk Upload,
   admin/config pages) — not yet live-verified even though the code is now vendored.
2. Investigate production routing for `perf-app` before touching `environment.prod.ts`.
3. Decide whether `azure-sync/perf-app-full-sync.sql` should ever be run against this environment,
   and if so, who owns that decision (it replaces all existing Performance DB data).
