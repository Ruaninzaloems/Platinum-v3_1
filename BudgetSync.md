# BudgetSync — Standalone → Monorepo Sync Playbook (Budget module)

Reusable process + prompt for pulling frontend/backend updates from the Budget module's
standalone repo into `Platinum-v3_1` **without losing monorepo-only adaptations** (shared auth
wiring, proxy paths, Azure DB connections, deploy config). Adapted from the general playbook
first used for the Overtime sync — this version is focused on **Budget** as the active module.

**Standalone source:** `C:\Repos\Budget-Management`
**Monorepo frontend:** `libs/budget/src/lib`
**Monorepo backend (deployed):** `BUDGET-APP/PlatinumBudget.Api`

---

## Known structure (verified 2026-08-07)

| | Standalone | Monorepo |
|---|---|---|
| Frontend source | `Budget-Management/platinum-budget-ui/src/app` | `libs/budget/src/lib` |
| Backend source | `Budget-Management/PlatinumBudget.Api` | `BUDGET-APP/PlatinumBudget.Api` |
| API base config | `platinum-budget-ui/src/app/api-base-url.interceptor.ts` reads `environment.apiBaseUrl`, prepends it to any `/api`-prefixed request | `libs/budget/src/lib/environment.ts` → `{ production: false, apiPrefix: '/budget-app' }` (services prepend `apiPrefix` manually — the standard monorepo `apiPrefix` convention, see `MASTER.md`) |
| Auth stack | **None found** — no `auth.service.ts`, guard, or login component under `platinum-budget-ui/src/app` | None (rides on the shell's shared `@platinumv3/shared/auth`, same as every other module) |

⚠️ **Important caveat — a second frontend copy exists in the monorepo.** `BUDGET-APP/platinum-budget-ui`
is a full standalone-style Angular app checked into the monorepo (its own `angular.json`,
`proxy.conf.json`, etc.) — it is **not** what the shell actually serves. Per `MASTER.md`: *"the
`*-UI` / `*-APP` folders at the repo root are the original standalone apps... The live monorepo UI
is `apps/shell` + `libs/*`."* So:
- **Sync target for frontend logic = `libs/budget/src/lib`** (this is what `apps/shell` lazy-loads).
- `BUDGET-APP/platinum-budget-ui` is a legacy/reference copy — do not treat changes there as "the
  monorepo state" when diffing; if it's genuinely stale/unused, flag it for cleanup rather than
  silently syncing into it.
- **Backend sync target = `BUDGET-APP/PlatinumBudget.Api`** — this one IS live; it's what
  `azure-pipelines.yml`'s `Budget_API` job publishes to `Platinum-V3-Budget-Postgres-API`.

**Good news vs. Overtime:** Budget has **no standalone auth stack to skip** — there's no
`auth.service.ts`/guard/login component in the standalone frontend at all, so step 2 of the
general process (skip the standalone's own auth stack) is a non-issue for this module. Just
confirm that hasn't changed before syncing (a search for `auth`/`guard`/`login` files should still
come back empty).

---

## The reusable prompt (Budget-filled)

Paste this back when you want to run the sync:

```
Focus on the Platinum-v31 code. Update the Budget module (frontend at libs/budget/src/lib,
backend at BUDGET-APP/PlatinumBudget.Api) with the latest code from
C:\Repos\Budget-Management (frontend: platinum-budget-ui/src/app, backend: PlatinumBudget.Api).

Follow this process:
1. Compare the standalone tree against the monorepo tree file-by-file (core/services,
   models, pages, Controllers, Services, Data, DTOs, etc.) — build three lists: files ONLY in
   standalone (new), files ONLY in monorepo (adaptations — do not remove), and common files
   that differ (candidates to sync).
2. Confirm the standalone frontend still has no auth stack of its own (search for
   auth.service.ts / guard / login component under platinum-budget-ui/src/app). If one now
   exists, do NOT copy it — this module must keep reading the signed-in user + token from the
   shared @platinumv3/shared/auth AuthService, never a module-local or standalone auth service.
3. Preserve known monorepo-only adaptations — see the checklist below (fill in as discovered
   this sync), especially:
   - libs/budget/src/lib/environment.ts (`apiPrefix: '/budget-app'`) — do not replace with the
     standalone's environment.ts / apiBaseUrlInterceptor pattern.
   - BUDGET-APP/PlatinumBudget.Api's appsettings (Azure Postgres connection) — do not overwrite
     with the standalone's local/dev connection string.
   - Any non-fatal startup-seeding pattern already in Program.cs — do not switch to a fail-fast
     equivalent from the standalone.
4. For files that ARE synced, fix import paths for the monorepo (environment.ts import depth,
   @platinumv3/shared/* references, relative paths) — do not just copy standalone paths verbatim.
5. After copying, type-check the shell (frontend: tsc --noEmit against
   apps/shell/tsconfig.app.json) and dotnet build BUDGET-APP/PlatinumBudget.Api (backend) to
   confirm everything compiles before declaring done. Then ALSO grep for bare, no-trailing-slash
   API base URLs (e.g. `grep -rn "'/api'" libs/budget/src/lib` — exact string, not `'/api/`) —
   these compile fine but silently route to the wrong backend at runtime and won't be caught by
   tsc/dotnet build. Finally, spot-check at least one data-bearing page end-to-end: curl a backend
   endpoint directly, then confirm the same data renders in the browser through the shell proxy.
   A clean build is necessary but not sufficient.
6. Give me a summary: files added, files updated, files skipped (and why), and any new backend
   services/migrations that need wiring into Program.cs / module registration (using a
   non-fatal, don't-crash-if-it-fails seeding pattern, matching the rest of this repo).
7. Don't touch anything outside Budget's frontend/backend folders unless a shared file
   genuinely needs a fix — and flag that separately before changing it. Do NOT sync into
   BUDGET-APP/platinum-budget-ui — that copy is not what the shell serves (see caveat above);
   flag it for cleanup instead if it looks stale.
8. Update this file's checklist with anything new you preserved or discovered, so the next
   Budget sync doesn't have to re-derive it.
```

---

## Budget adaptation checklist — fill in as each sync happens

### First sync — completed 2026-08-12

**Frontend** (39 new page files, 95 refreshed common files — models/services/pages):
- Confirmed: standalone still has no auth stack. Nothing skipped for that reason.
- New features pulled in: `adjustments/{request,capture,approve}`, `budget-approval/{approve-draft,approve-final}`,
  `virement-approval-levels`, `virement-approvals`, `budget-strings/virement-string`,
  `projects/{export-original-budget,export-adjustment-budget,import,register,zero-budget,grid}` (+
  `projects/grid/project-capture-dialog.component.ts`, a dialog not a route), `core/services/active-year.service.ts`.
- `routes.ts` — repointed 7 routes that were placeholders (`ProjectsPlaceholderPage`) to the real
  new pages (`projects/export-original-budget`, `projects/export-adjustment-budget`, `projects/import`,
  `projects/register`, `projects/zero-budget`, `budget-approval/approve-draft`, `budget-approval/approve-final`),
  and added new routes for `projects/grid`, `virement-approval-levels`, `virement-approvals`,
  `budget-strings/virement`, `adjustments/request|approve|capture|capture/:id`. Left `projects/cp3-sync`
  on the placeholder — standalone has no such feature.
- **Import-path convention confirmed and applied**: standalone's flat `services/`, `models/` map to
  monorepo's `core/services/`, `core/models/`. When applying this via a blind regex sub across the whole
  tree, files that are THEMSELVES inside `core/services/`/`core/models/` (i.e. `api.service.ts`,
  `active-year.service.ts`) get a bogus double `core/` prefix on their sibling imports (`../core/models/...`
  instead of `../models/...`) — the regex can't tell "am I already inside core/". **Always grep
  `from '../core/(services|models)/'` inside `core/services/` and `core/models/` after a bulk sync and
  fix those specific files** (only 2 affected this time: `api.service.ts`, `active-year.service.ts`).
- **Raw `/api/...` HTTP calls**: several files call `this.http.get/post('/api/...')` directly instead of
  through `ApiService`/`ConstantsApiService` (found in `active-year.service.ts`, `constants-api.service.ts`,
  `adjustment-capture.page.ts`, `project-capture.page.ts`, `project-budgets-grid.page.ts`,
  `project-capture-dialog.component.ts`, `projects-list.page.ts`). The standalone relies on its own
  `api-base-url.interceptor.ts` (not present in the monorepo) to rewrite these at runtime. **Always
  `grep -rE "\.(get|post|put|delete)<.*>\('/api/"` across changed/new files and rewrite the literal prefix
  to `/budget-app/api/`** — otherwise the call silently hits the shell's `/api` prefix (routed to the
  Assets backend) instead of Budget's.
- ⚠️ **`core/services/api.service.ts` itself had `private base = '/api';`** (no trailing slash) — this is
  the base URL used by **nearly every API call in the entire Budget module** (financial years, dashboard,
  budget versions, tariffs, creditors, HR/payroll — everything routed through `ApiService`). It came from
  the standalone verbatim (same reliance on its interceptor). **The grep pattern above (`'/api/` with a
  trailing slash) does NOT catch this** — `'/api'` has no trailing slash since it's a bare prefix
  concatenated later via template literals (`` `${this.base}/dashboard/cfo` ``). This one slipped through
  the entire first sync undetected because `dotnet build` and `tsc --noEmit` both pass clean regardless —
  it's a pure runtime routing bug, not a compile error. **Symptom:** every page in the module silently
  shows "no data available" even though the backend has complete, correct data (confirmed by curling the
  backend directly and getting real results while the UI showed nothing). **Always additionally
  `grep -rn "'/api'" libs/budget/src/lib` (exact string, no trailing slash) after every sync** — fix to
  `'/budget-app/api'`. This class of bug (a bare/no-slash base-URL literal) is worth checking in every
  module sync, not just Budget's.
- `BUDGET-APP/platinum-budget-ui` — **confirmed stale, not synced into**. Left untouched; flagging again
  for a future cleanup decision (delete vs. keep as historical reference) — not resolved this sync.

**Backend** (`BUDGET-APP/PlatinumBudget.Api`):
- 10 new files copied wholesale: `Controllers/{BudgetApprovalController,BudgetUsersController,
  DiagnosticsController,ProjectImportController,VirementApprovalLevelsController,
  VirementApprovalsController,VirementPolicyVersionController,ZeroBudgetImportController}.cs`,
  `Models/{CouncilBudgetApproval,ProjectImportBatch}.cs`.
- 16 changed files copied wholesale (no monorepo-specific content found in any of them):
  8 controllers, 2 DTOs, 6 models (`BillingBudget`, `BudgetString`, `CreditorsBudget`, `EmsConst`,
  `Project`, `VirementRequest`).
- **`Models/EmsPlan.cs`** — standalone RENAMED/REDESIGNED `Plan_ProjectFunctions` → `Plan_ProjectScoaFunds`,
  `Plan_ProjectFund` → `Plan_ProjectScoaRegions`, `Plan_ProjectFundYear` → `Plan_ProjectScoaItem` (different
  schemas, not just renames), and dropped `Plan_ProjectRegions` entirely. The monorepo-only
  `Controllers/ProjectFundingController.cs` depends on the OLD 4 classes — **took standalone's file as the
  base (brings in all new classes) and re-appended the 4 old classes at the end**, marked with a
  "monorepo-only, do not remove" comment. Same treatment needed for `Data/BudgetDbContext.cs` (re-added the
  4 matching `DbSet<>` lines) and `Program.cs` (re-added the matching `CREATE TABLE IF NOT EXISTS` blocks).
- **`Program.cs`** — the single highest-risk file in this sync (monorepo 3487 lines / standalone 5180
  lines, almost entirely inline SQL schema/seed). Monorepo carries THREE deploy-critical adaptations that
  must survive every future sync, none of which exist in the standalone:
  1. **Async background init** (`_ = Task.Run(async () => { try { ... } catch { ... } });` wrapping the
     entire schema/seed block) instead of a synchronous `using (var scope = ...) { ... }` at startup —
     fixes an Azure 503 "Application Error" caused by the health-probe timing out before EnsureCreated +
     164MB seed finished. **Never let a sync revert this to a synchronous block.**
  2. **Connection-string parsing**: `Uri.UnescapeDataString(...)`, `Split(':', 2)`, and 5 SSL modes incl.
     `Trust Server Certificate=true` — more robust than the standalone's simpler unescaped/2-mode version.
     **Keep the monorepo's version.**
  3. **Dynamic port binding** at the very end: `WEBSITE_SITE_NAME` check → `PORT` env → `8080`
     (Azure)/`3001` (local) — replaces the standalone's hardcoded `app.Run("http://0.0.0.0:5000")`.
     **Never take the standalone's hardcoded port.**
  Also monorepo-only and preserved: `app.MapGet("/api/health/db", ...)` (not in standalone at all).
  Merge technique used: spliced monorepo's head (through the first identical `ALTER TABLE Projects ADD
  COLUMN IsRegistered` line) + standalone's body from its next line through `await SeedData.SeedAsync(db);`
  + monorepo's tail (from `Console.WriteLine("...complete")` to EOF) — then re-inserted the 4
  `Plan_ProjectFunctions/Fund/FundYear/Regions` `CREATE TABLE` blocks (extracted verbatim from the old
  monorepo file) next to their standalone-schema neighbours. Verified via `dotnet build` (0 errors) —
  **always rebuild after touching this file, do not trust a visual read alone.**
- **`.csproj`** — kept the existing `SeedSystemConstants.sql` publish-exclusion (164MB file, comment
  explains why); added the 3 new *small* seed files (`SeedConstDepartment.sql` 3.5KB,
  `SeedConstDivision.sql` 55KB, `SeedConstProjectItem.sql` 1.2MB) as normal `Content` items — small enough
  to ship in publish, no exclusion needed. Added `Microsoft.Data.SqlClient` package (needed by the new
  `DiagnosticsController`, which tests connectivity to an external SQL Server "MBM" system).
- **`appsettings.json`** — kept the existing Azure Postgres logging config; added
  `ConnectionStrings:MBM` (external SQL Server diagnostic target for `DiagnosticsController`'s
  `/api/diagnostics/mbm-connection` — read-only, lists table names, no writes). Note: this embeds a
  plaintext credential in source, consistent with this repo's existing convention (e.g. `ems-db.ts`
  defaults) — not a new practice introduced by this sync, but worth flagging if the convention ever changes.
- Copied the 3 new seed `.sql` files into `Data/`.
- Verified: `dotnet build -c Release` → 0 errors.

**Verification commands used** (repeat every sync):
```
dotnet build -c Release --nologo   # from BUDGET-APP/PlatinumBudget.Api
node node_modules/typescript/bin/tsc --project apps/shell/tsconfig.app.json --noEmit
```

### Post-sync fixes discovered running against a genuinely fresh/empty Azure Postgres `Budget` DB

Two real bugs found in the standalone's own inline SQL schema/seed block (not introduced by the
sync — confirmed present verbatim in `C:\Repos\Budget-Management`'s own `Program.cs` too), fixed
directly in the monorepo's `Program.cs`:
1. `CREATE TABLE ""User_UserDetail""` was declared ~600 lines AFTER other tables that
   `REFERENCES ""User_UserDetail""(...)` via FK — moved the whole table block earlier, immediately
   before its first referencing table (`Const_VirementApprovalRangeHeader`).
2. A bootstrap `INSERT INTO ""Const_VirementApprovalRangeHeader""` hardcodes `CapturerID = 2`,
   assuming a `User_UserDetail` row with that ID already exists — it never does on a fresh DB (real
   users come from the EMS/POS integration, not this script). Added an idempotent
   `INSERT INTO ""User_UserDetail""` seeding two placeholder system rows (so auto-increment lands on
   IDs 1 and 2) right after the table is created.

**A full topological-order audit found 91 total FK-ordering violations** across the ~1300-line
Const_/Payroll_ mirror-table section (lines ~3700–5000) — only the 2 above were fixed (they were
blocking startup); the rest were **not** fixed, by the user's explicit choice (2026-08-12): don't
chase the standalone's bootstrap-script bugs further, don't restore the standalone's real
`pg_dump` exports (`Budget_export_20260409_125328.sql`, `platinum_budget_dump.sql.gz` — both exist
in `C:\Repos\Budget-Management` and contain the standalone's actual seeded data matching its live
dashboard) into the shared Azure `Budget` DB either. **Net effect: on a truly empty DB, the
background schema/seed init will still hit one of the remaining 91 ordering bugs and stop partway
through — non-fatally (the app stays up per the Task.Run/try-catch pattern), but most Const_/Payroll_
mirror tables and dashboard data will be missing.** If a future session needs this data, the fastest
fix is almost certainly restoring the more recent dump (`platinum_budget_dump.sql.gz`, Jun 24) into
the Budget DB rather than continuing to hand-patch the ordering bugs — ask the user first, it's a
write to shared Azure infrastructure.

**Connection config**: Budget's `Program.cs` reads `Environment.GetEnvironmentVariable("DATABASE_URL")`
first, now falls back to `builder.Configuration.GetConnectionString("BudgetDb")` (added this sync,
mirrors Overtime's pattern) — so `appsettings.Development.json` now has a `ConnectionStrings:BudgetDb`
key with the Azure `Budget` DB's connection string, and Budget no longer needs a manually-exported
`DATABASE_URL` for local runs. Production/Azure deploy is unaffected (still gets `DATABASE_URL` from
the App Service's own Application Settings, which takes priority).

### The real root cause of "dashboard shows no data" — `api.service.ts`'s bare `/api` base

After all of the above, the dashboard **still** showed "No data available" everywhere. Root-caused by
comparing the backend directly (`curl http://127.0.0.1:3001/api/dashboard/cfo` → full correct data,
R353.5M total budget etc., matching the standalone's live dashboard exactly) against the browser (empty).
This proved the DB/seed state was a red herring for this specific symptom — the actual bug was the
`core/services/api.service.ts` bare-`/api`-base issue described above in the Frontend section. Fixed by
changing `private base = '/api';` → `private base = '/budget-app/api';`. **This was the single highest-
impact bug in the whole sync** — it silently broke every page in the module while `dotnet build` and
`tsc --noEmit` both stayed green, and would have been very easy to miss without directly diffing a
backend curl response against what the UI rendered.

**Lesson for every future module sync**: passing `tsc --noEmit`/`dotnet build` proves the code compiles,
**not** that it's wired to the right backend at runtime. After a sync, always spot-check at least one
data-bearing page end-to-end (curl the backend endpoint directly, then confirm the same data renders in
the browser through the shell proxy) — don't stop at "it builds."

### Second gap found (2026-08-14): shell sidebar nav silently drops items even when routes/pages/backend are fully synced

Found via a user screenshot of the standalone's sidebar: 4 nav items under a **"Virements"** sub-group
(`Virement Approval Levels`, `Virement Policy`, `Virements`, `Virement Approvals`) were missing from the
monorepo's Budget sidebar. Investigation showed this was **not** a sync gap in the module itself —
`libs/budget/src/lib/routes.ts`, all 4 `pages/virement-*` components, and all 4
`BUDGET-APP/PlatinumBudget.Api/Controllers/Virement*Controller.cs` backend controllers were already fully
synced and correct. The only gap was `apps/shell/src/app/layout/shell.component.ts`'s `budgetNavGroups`
array — 2 of the 4 items (`Virement Approval Levels`, `Virement Approvals`) were never added as nav
entries at all, and the other 2 (`Virements`, `Virement Policy`) were added as flat top-level `items`
instead of being nested under a `"Virements"` `subGroup`, unlike the standalone's collapsible sub-panel
structure (`platinum-budget-ui/src/app/app.html`, `mat-expansion-panel` nested inside the outer panel).

**Why this is easy to miss**: the shell's nav config lives entirely OUTSIDE `libs/budget` — in
`apps/shell/src/app/layout/shell.component.ts`, a monorepo-only file with no standalone equivalent to
diff against directly. A sync that only walks `libs/budget/**` and `BUDGET-APP/**` (routes, pages,
controllers) will report 100% complete while whole nav sections are invisible in the UI. `tsc --noEmit`
also stays green — a route/page/controller can be fully correct and unreachable from the sidebar.

**Checklist addition for every future Budget sync (and every module sync in general)**: after confirming
routes/pages/controllers are synced, always diff the **standalone's nav/menu template** (for Budget:
`platinum-budget-ui/src/app/app.html`) against `apps/shell/src/app/layout/shell.component.ts`'s
`budgetNavGroups` (or the equivalent nav array for other modules) item-by-item — including nesting
structure (flat `items` vs `subGroups.children`), not just "does a route exist for this label." A route
existing is necessary but not sufficient for a user to ever reach the page.

### Third pass (2026-08-14): full nav audit found 3 more gaps in "Budget Management" — none in the other 4 groups

After fixing Virements, a full group-by-group diff of every `budgetNavGroups` entry against
`platinum-budget-ui/src/app/app.html` found the "Budget Management" group still had 3 more gaps (all
inside its `subGroups`, none in its flat `items`). **"Billing Budgeting", "Creditors Budgeting", "HR &
Payroll Budgeting", and "Monitoring" all matched the standalone exactly** — the nav-drift problem was
concentrated entirely in "Budget Management", likely because it's the group that grew the most `subGroups`
nesting during the original sync.

1. **"Project Budgets Grid" missing from the `Projects` subGroup** — route `/projects/grid` and
   `ProjectBudgetsGridPage` already existed (`routes.ts` L17); pure nav-wiring gap, fixed by adding the
   item (icon `grid_on`, matching standalone).
2. **Entire "Adjustments" subGroup missing** (`Request Adjustment` → `/adjustments/request`,
   `Approve Adjustment Budget` → `/adjustments/approve`) — both routes/pages already existed; pure
   nav-wiring gap, fixed by adding the subGroup. Note: `routes.ts` also has unused
   `adjustments/capture` / `adjustments/capture/:id` routes with no nav entry in either app — left
   as-is (not in standalone's nav either, so not a gap, just an unlinked page — leave alone unless a
   future standalone diff shows it should be reachable).
3. **"mSCOA Strings" was a flat single item** (`/budget-strings`) instead of the standalone's 7-child
   sub-panel (Tabled Budget, Original Budget, Tabled IDP, Original IDP, Adjustment Budget, Adjustment
   IDP, Virement). Initially looked like a deeper gap (6 of the 7 sub-routes didn't exist in
   `routes.ts`), but turned out to be trivial: `StringsListPage`
   (`libs/budget/src/lib/pages/budget-strings/strings-list.page.ts`) already derives which mSCOA string
   type to show from **the last URL segment** (`STRING_TYPE_MAP` keyed by `tabled-budget`,
   `original-budget`, etc. — `ngOnInit` reads `this.router.url.split('/')` L166-168), so it's a fully
   generic single component. Fixed by adding 6 more `routes.ts` entries that all point at the same
   `StringsListPage` with different path segments, then nesting all 7 under an `mSCOA Strings` subGroup
   in the shell nav (removing the old flat `/budget-strings` item, which resolved to a useless
   `STRING_TYPE_MAP` fallback since `'budget-strings'` isn't a key in that map).
   **Lesson**: before concluding "page doesn't exist, needs to be built," check whether an existing page
   already reads a route param / URL segment generically — the standalone's per-item routes and the
   monorepo's consolidated component aren't necessarily in conflict.

**Verification for this pass**: `tsc --noEmit` (0 errors) + live browser check — expanded each fixed
subGroup via `document.querySelector('nav')` and confirmed all labels render, then clicked into
"Tabled IDP (PRTA)" and confirmed the page renders `National Treasury - NT SCOA String (Tabled IDP
(PRTA))` (i.e. `STRING_TYPE_MAP` resolved the new route segment correctly, not just "route exists").

---

## General principles (apply to every module, every sync — carried over from the general playbook)

- **Shared auth is non-negotiable.** `@platinumv3/shared/auth`'s `AuthService` is the single
  source of truth for the signed-in user + token in every module. Never reintroduce a
  module-local login flow, hardcoded user, or separate token source during a sync.
- **Non-fatal seeding only.** Monorepo backends run on Azure Postgres (one DB per module,
  shared server) — a seeder/migration step failing at startup must never crash the app. Reject
  any standalone pattern that fails fast on startup seed/migration errors.
- **Dev ports and proxy prefixes are monorepo-only.** `/<module>-app/api` prefixes in
  `apps/shell/proxy.conf.json`, and each backend's dev port, are never overwritten by a sync —
  they don't exist in the standalone at all.
- **Always verify before declaring done.** Frontend: `node node_modules/typescript/bin/tsc
  --project apps/shell/tsconfig.app.json --noEmit`. Backend: `dotnet build -c Release`.
- **Never bring in a standalone's session-cookie/global-auth-filter backend pattern**, if one
  is ever introduced upstream. Monorepo module APIs are called through the shell's proxy
  carrying the shared POS session — they are not meant to run their own login/session system.
- **The shell's nav config is a separate sync surface from the module itself.** Routes, pages,
  and backend controllers living inside `libs/<module>` / `<MODULE>-APP` can be 100% synced
  while `apps/shell/src/app/layout/shell.component.ts`'s nav array is still missing items or
  has the wrong nesting — there's no standalone file at that path to diff against automatically,
  so it must be checked explicitly. Always diff the standalone's nav/menu template against the
  shell's nav array item-by-item (including flat-vs-nested structure) as part of every sync.

---

## Prior module reference: Overtime (completed 2026-08-06)

The Overtime sync followed this same process and is fully documented (frontend + backend
adaptation checklist, including its standalone auth stack that had to be skipped and its
non-fatal seeder wiring) in git history — see the commit `overtime sync: pull latest module
code from standalone repo` and its parent commits for the full checklist if a future Overtime
re-sync needs it.
