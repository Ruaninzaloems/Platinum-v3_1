# SCMSync — Standalone → Monorepo Sync Playbook (SCM module)

Reusable process + prompt for pulling updates from the SCM module's standalone repo into
`Platinum-v3_1`. Modeled on `BudgetSync.md`/`AssetsSync.md`. First formal sync via
`Platinum-v3-sync`'s dashboard — this module had no dedicated doc before, and had not been synced
since a 2026-07-13 commit ("create global auth and update Auth on all modules").

**Standalone source:** `C:\Repos\Platinum-SCM-v1`
**Monorepo frontend target:** `libs/scm/src/lib`
**Monorepo backend target:** `SCM-API` (SQL Server — standalone's other backend, `SCM-PSQL-API`
(Postgres), is NOT what the monorepo uses; see `prompts/scm.md` for why not to switch this without
a separate explicit decision)

See `prompts/scm.md` for the full architecture notes (dual backend, the frontend's two ways of
reaching its API, the missing `SCM_API` pipeline job) — not duplicated here.

## Pass 1 (2026-08-31): confirmed scale, fixed one real routing bug, verified nav is currently consistent

### Scale confirmed by direct comparison, not estimated

Standalone `SCM-UI/src/app/features` has 55 subfolders; monorepo `libs/scm/src/lib/features` has
29. ~25 entirely missing feature areas (informal tender scoring, cessions, contracts-register,
land/water inventory reports, creditors, declaration-of-interest-report, and more — full list in
`prompts/scm.md`). This is the largest sync scope of any module in this project. None of that
~25-area gap was touched this pass — by design, matching this module's own prompt's pass-by-pass
recommendation.

### Bug found and fixed: double `/api/api/` prefix on one endpoint call

`libs/scm/src/lib/core/services/inventory.service.ts`'s `getStorePermissions()` called
`this.api.apiGet('/api/inventory-settings/store-permissions', params)`. Every other `apiGet`/`apiPost`/etc.
call in the entire `libs/scm` tree (checked via `grep -rn "apiGet\|apiPost..." | grep "'/api"` —
this was the only hit) passes a path *without* a leading `/api`, because
`BaseApiService.apiGet()` already does `${this.baseUrl}${endpoint}` where `baseUrl = environment.apiUrl`
and `environment.ts`'s `apiUrl` already ends in `/api`. Confirmed via source (`base-api.service.ts`
line 11 + 22), not inferred from the pattern alone. This one call would have resolved to
`.../api/api/inventory-settings/store-permissions` — a 404 against the real backend route.

Confirmed the *resource path itself* was correct before fixing (traced to
`SCM-API/Controllers/InventorySettingsController.cs`, route prefix `api/inventory-settings`, a
generic `[HttpGet("{settingType}")]` handler — `InventorySettingsService.cs`'s switch statement
confirms `"store-permissions"` is a valid `settingType` value). So the fix was purely removing the
redundant leading `/api`, not changing the resource path:

```diff
- return this.api.apiGet<any[]>('/api/inventory-settings/store-permissions', params);
+ return this.api.apiGet<any[]>('/inventory-settings/store-permissions', params);
```

(There is a *separate* `InventoryController.cs` with its own unrelated `store-permissions/{userId}`
routes at `api/Inventory/store-permissions/...` — don't confuse the two controllers if this area is
touched again; `InventorySettingsController`'s generic `{settingType}` route is the one this
specific frontend call actually needs.)

### Nav check: clean, no bugs found (worth recording as a real check, not skipped)

Compared `apps/shell/src/app/layout/shell.component.ts`'s `scmNavGroups` against standalone's real,
current nav (`SCM-UI/src/app/core/services/navigation-config.service.ts` — a data-driven config,
not a template) at the leaf-route level (grouping/ordering differs cosmetically between the two and
wasn't treated as a mismatch). Every route in standalone's nav that's *missing* from `scmNavGroups`
correctly corresponds to a feature folder that hasn't been ported yet (confirmed against the ~25
missing-folder list above) — e.g. `/contract-call-offs`, `/cessions`, `/sundry-invoices`,
`/retention-invoices`, `/guarantee-invoices`, `/creditors`, `/declaration-of-interest-report` are
all real standalone nav entries with no monorepo feature folder *or* nav entry, consistently absent
on both sides. No case was found of a route/component that's already ported but simply forgotten
in nav (the specific bug class that's hit Budget, Assets, and Performance each at least once) —
this pass's nav is internally consistent with what's actually built. One cosmetic-only difference
noted: standalone's `/reports-list` vs the monorepo's `/reports` — both correctly wired to their
own side's real Reports feature, just a route-name difference, not a defect.

### Verification performed

- `tsc --noEmit -p apps/shell/tsconfig.app.json` — clean, 0 errors.
- Re-grepped `libs/scm` for the same double-`/api`-prefix pattern after the fix — zero remaining
  instances.
- Backend (`SCM-API`) was not touched this pass, so no `dotnet build` was needed — noted here
  explicitly rather than silently skipped, since "no backend files changed" is the actual reason,
  not an oversight.

### Not done this pass (explicitly, not silently)

- No feature-area diffing/porting of the ~25 missing areas — next passes' job, one or a few areas
  at a time per `prompts/scm.md`'s own recommendation.
- No triage of the ~26 feature areas that *do* exist on both sides for file-level drift since the
  2026-07-13 baseline (only the one specific bug above was found and fixed; a full diff of all 26
  wasn't attempted this pass).
- The Informal Tenders (`informal-tenders`) area exists on both sides already — given
  `IFT-CROSS-BACKEND-PARITY.md`'s own recent hardening work (Task #401, regressions found and
  fixed there), this is a good candidate to diff carefully in an early future pass rather than
  treating it as routine.
- No decision made about the missing `SCM_API` pipeline job — flagged in `prompts/scm.md`, real
  infra gap, not something a sync pass can fix unilaterally.

## Pass 2 (2026-08-31): extensive due diligence on "small" candidates — all turned out non-trivial; one open question fully resolved; two clean mechanical checks

Attempted to port one or more of the "small, self-contained" feature areas per Pass 1's suggested
order (`profile`, `module-hub`, `notifications-admin`). Every one turned out to have a real,
non-trivial reason not to rush it — recording this precisely so a future pass doesn't repeat the
same investigation:

- **`profile`** (1 file) — the frontend is small, but it calls
  `GET/PUT .../auth/users/{id}/notification-preferences`, which **does not exist anywhere in the
  monorepo's `SCM-API`** (confirmed via grep — zero hits for `NotificationPreferences` outside
  standalone). Porting the frontend alone would ship a page that loads with silent defaults and
  fails every save with a visible "Failed to update preference" error. Needs real backend work
  (model + controller/repository additions), not a routine sync.
- **`module-hub`** (1 file) — turned out to be layout/navigation-shell code, not a business
  feature: it renders `NavigationConfigService.visibleNavGroups()` as a group-landing page,
  reached when a user clicks a top-level nav *group* in standalone's own sidebar. The monorepo
  shell has no equivalent interaction (its flat `scmNavGroups` links straight to leaf routes, no
  intermediate hub page anywhere in the whole project). This is standalone's own layout pattern,
  analogous to the `layout/{app-layout,sidebar,topbar}` every module's port correctly excludes
  (see Performance's Pass 3) — porting it would also require porting the entire 479-line
  `navigation-config.service.ts` it depends on, for a UI pattern the monorepo doesn't use anywhere
  else. **Recommendation: don't port this one at all**, not just "not yet."
- **`notifications-admin`** (4 files) — calls `.../notifications/digest/dropped`. Checked **both**
  monorepo and standalone backends — this endpoint doesn't exist in *either* `SCM-API`, nor in
  `SCM-PSQL-API`. This is standalone's own frontend-ahead-of-backend drift, not something this
  sync can complete by porting (there's no source implementation to port from).
- **`commitments-register`** (210 lines, looked ideal — single file, clear scope) — its backend
  (`CommitmentsReportController`/`CommitmentsReportService`, 239 lines total, real and complete in
  standalone) turned out to have a transitive dependency on `IContractsReportService`
  (`ContractsReportService.cs`, 582 lines) — a full contract-value/variation/payment aggregation
  engine that **also doesn't exist in the monorepo**. Deliberately did not port an 800+ line
  unverified financial-calculation chain with no live database connection available in this
  session to check the computed figures (contract values, VAT splits, outstanding commitments)
  against real data. This needs its own dedicated, carefully-verified pass — see remaining work.
- **`quotations`** (drifted to 4 standalone files vs 1 monorepo file since 2026-07-13) — the new
  files are a buyer-assignment sub-feature. Checked its 4 backend calls individually: 2 already
  exist in the monorepo (`GET /quotations/buyers`, `POST /requisitions/{id}/return`), 1 exists at a
  **different shape** (monorepo has `POST /quotations/{id}/assign-buyer` and
  `POST /tenders/{id}/assign-buyer`, both per-entity; standalone's new frontend calls a generic
  `POST /requisitions/assign-buyer` with the ID in the body instead), and 1 is missing entirely
  (`GET /requisitions/awaiting-buyer`). This is a real but cross-cutting workflow change touching
  three controllers (Quotation, Tender, Requisition) — not a simple "add the missing bit" fix.
- **`tenders`** — the single most significant finding this pass, even though nothing was ported:
  standalone has grown this to **~38+ files** (a full tabbed tender-detail workflow — BAC/BEC/BSC
  tabs, scoring grid, award/briefing/subcontracting/documents tabs, dedicated state stores, dozens
  of task-numbered regression specs) while the monorepo still has the original **single 1807-line
  component**. Given `IFT-CROSS-BACKEND-PARITY.md`'s documented recent hardening work on the
  sibling `informal-tenders` feature, this domain has clearly seen heavy, careful engineering
  investment in standalone recently. This is not a "port a feature area" task, it's comparable in
  scope to porting most of a whole module — **flagging as the highest-value, highest-effort target
  for a dedicated future pass of its own**, not something to fold into routine SCM sync work.

### One previously-open question, now fully resolved: `libs/scm/src/lib/features/auth`

Pass 1 flagged this per the standard "don't assume, verify" rule. Now resolved with direct
evidence, not inference:
- `features/auth/login/login.component.ts` is not exported from `libs/scm/src/index.ts` and not
  referenced by any route anywhere — zero consumers.
- `features/auth/supplier-login/supplier-login.component.ts` **is** exported from `index.ts`, but
  `apps/shell/src/app/app.routes.ts` has `{ path: 'supplier-login', redirectTo: 'dashboard',
  pathMatch: 'full' }` with the comment *"/supplier-login URLs redirect to the dashboard so old
  links keep working"* — an explicit, deliberate historical retirement, not an oversight. The
  actual `/login` route in the shell loads a completely different component
  (`apps/shell/src/app/features/login/login.component.ts`), unrelated to this one despite the
  same folder name.

Both are confirmed dead code, safe to delete — **not deleted this pass** (auth-adjacent code
warrants an explicit go-ahead even when provably unreachable, matching how this project has
handled similar dead-code findings elsewhere, e.g. Assets' Pass 1 duplicate services/models
folders). Flagged as a clean, low-risk, ready-to-execute cleanup for whoever picks this up next.

### Two clean mechanical checks (no bugs found, worth recording as checked)

- Re-ran the same class of check that found Pass 1's bug across all of `libs/scm`: no leftover
  `environments/environment` (standalone's 3-levels-up import path) anywhere in already-ported
  code, and no hardcoded `azurewebsites.net`/`localhost:` URLs outside `environment.ts` itself.

### Verification performed

No code changes this pass, so no build/typecheck was run — every finding above was confirmed via
direct source reading and grep (backend endpoint existence, route wiring, git log, export
surfaces), not assumed from file/folder names.

## Remaining work (next passes)

Reordered after Pass 2's due diligence — the original "start small" plan didn't survive contact
with the actual codebase; this ordering reflects what's actually tractable vs. what needs dedicated
scoping.

1. **Ready to execute, no further investigation needed:** delete
   `libs/scm/src/lib/features/auth/{login,supplier-login}` (confirmed dead, see Pass 2) — remove
   the folder, its export line in `libs/scm/src/index.ts`, and re-run `tsc --noEmit` to confirm
   nothing else referenced it. Lowest-risk, highest-confidence item on this whole list.
2. **`contracts-register` + `ContractsReportService`** (~682 lines backend) should be tackled as
   its own dedicated pass, *before* `commitments-register` (which depends on it) or any other
   report page that turns out to share the same dependency. Needs a live DB connection to verify
   the computed financial figures (contract value/variation/payments/outstanding-commitment) are
   correct against real data — do not port and verify by compile-check alone, per Pass 2's
   reasoning for not rushing this.
3. **`tenders`** — the single largest gap found (standalone ~38+ files / full tabbed workflow vs.
   monorepo's one 1807-line component). Comparable in scope to porting most of a module on its
   own; needs its own multi-pass treatment, ideally starting with a proper file-by-file structural
   diff (not attempted yet) before any porting begins.
4. Smaller candidates that need real backend work first, not routine sync: `profile` (notification
   preferences endpoints don't exist), `quotations`' buyer-assignment sub-feature (cross-cutting
   change across Quotation/Tender/Requisition controllers, one endpoint shape mismatch + one
   missing entirely). `notifications-admin` and `module-hub` are **not recommended for porting** —
   see Pass 2 for why (frontend-ahead-of-backend drift with no source to port from; standalone
   layout-shell code with no monorepo equivalent, respectively).
5. Triage the remaining already-ported feature areas for file-level drift since 2026-07-13 (Pass 1
   checked API-prefix bugs and nav; Pass 2 checked import paths and hardcoded URLs — none of these
   passes did a full per-file diff of the ~26 areas that exist on both sides).
6. `informal-tenders` specifically — cross-check against `IFT-CROSS-BACKEND-PARITY.md`'s documented
   regressions before assuming the ported version is current.
7. Someone needs to add an `SCM_API` job to `azure-pipelines.yml` (mirroring `Performance_API`'s
   shape) before any of this sync work has a live deployment target — currently code changes here
   only ever land in the local working tree.
