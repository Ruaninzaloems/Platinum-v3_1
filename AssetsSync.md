# AssetsSync — Standalone → Monorepo Sync Playbook (Assets module)

Reusable process + prompt for pulling frontend/backend updates from the Assets module's
standalone repo into `Platinum-v3_1` **without losing monorepo-only adaptations**. Modeled on
`BudgetSync.md`. This is the largest module by far (~232 files in `libs/assets/src/lib` alone) and
had 17 prior ad-hoc sync commits in git history but no dedicated doc — this file replaces that.

**Standalone source:** `C:\Repos\Platinum-Asset-Management`
**Monorepo frontend:** `libs/assets/src/lib`
**Monorepo backend:** `ASSETS-PSQL-API`

---

## Known structure (verified 2026-08-25)

| | Standalone | Monorepo |
|---|---|---|
| Frontend source | `Platinum-Asset-Management/ASSETS-UI/src/app` | `libs/assets/src/lib` |
| Backend source (live) | `Platinum-Asset-Management/ASSETS-PSQL-API` | `ASSETS-PSQL-API` |
| Backend source (do NOT use) | `Platinum-Asset-Management/ASSETS-API` (legacy SQL-Server-era parallel backend) | — not present in monorepo, correctly absent |
| API base config | Standalone frontend calls bare `/api/...` throughout | **Assets owns the shell's default `/api` proxy prefix** (routed to `localhost:3000`) — unlike every other module, it does NOT need an `/assets-app` prefix. This is the one module where a bare `/api/...` call is *correct*, not a missed-prefix bug. |
| Auth | Standalone has its own `ASSETS-UI/src/app/core/auth.service.ts` | `libs/assets/src/lib/features/auth/login.component.ts` exists (unique among modules) — **not yet investigated**, see below |

⚠️ **`ASSETS-PSQL-API` is the Azure-deployed backend** despite the Azure resource itself being named
`ASSETS-API` (a legacy naming holdover) — confirmed against `MASTER.md` §3. Don't let the resource
name send a future sync to diff against the wrong standalone folder.

---

## Pass 1 (2026-08-25): critical Postgres/SQL-Server syntax bug found and fixed; scope limited to backend, frontend not yet started

Given the module's scale (232 frontend files across ~25 feature areas, 238 backend files), this
first pass focused on the **backend only**, following this doc's own recommendation (see
`prompts/assets.md`) to work in passes rather than rush a single mega-diff. **The frontend
(`libs/assets/src/lib`) was not touched this pass** — see "Remaining work" below.

### Critical bug found and fixed: `GETDATE()` instead of `NOW()`

**131 occurrences across 41 files** in `ASSETS-PSQL-API/Controllers/*.cs` (plus 1 in
`Data/Schema.sql`) used `GETDATE()` — SQL Server/T-SQL syntax — inside raw SQL strings executed
against **PostgreSQL** via Npgsql/Dapper. **PostgreSQL has no `GETDATE()` function**; every
Create/Update endpoint using it (asset types, categories, classes, CIDMS lookups, disposals,
impairments, revaluations, workflow approvals, fleet, tracking, and more — essentially every
lookup/config controller in the module, plus several core transaction controllers) would throw a
runtime SQL error (`function getdate() does not exist`) the moment it executed.

Confirmed this was a **monorepo-only regression, not an upstream bug**: the standalone repo (which
also targets Postgres for this API) has `NOW()` in all the same locations — only 1 stray
`GETDATE()` in its `Data/Schema.sql`, vs. 131 in the monorepo copy. The most likely explanation,
given the standalone also maintains a legacy SQL-Server-era `ASSETS-API` alongside the live
`ASSETS-PSQL-API`, is that a past sync pass pulled controller code from the wrong backend folder,
or a bulk find-replace ran in the wrong direction, for these specific files.

**Fix**: mechanical `GETDATE()` → `NOW()` replacement across all 41 files. Verified safe first —
grepped for `DATEADD`/`DATEDIFF` (SQL-Server date-arithmetic functions that would need different
handling) and found none; every occurrence was a simple niladic current-timestamp call used
identically to how `NOW()` is used everywhere else in this codebase. No live database write test
was performed to "prove" the bug (would have meant writing test rows into a real shared DB) — the
fix is a settled fact about PostgreSQL syntax, not something that needs runtime proof, and a clean
`dotnet build` after the change is sufficient confirmation the fix itself didn't break anything.

### Other backend findings (not fixed this pass — flagged)

- **14 new standalone files not yet in the monorepo** (real feature work, not adaptations):
  `Controllers/{AssetSplitCombineController, AssetSubCategoryGroupController,
  AssetSubCategoryGroupLinkController, BalanceStructureController, MetadataUpdateController,
  PendingApprovalsController, ReversalsController, RulAdjustmentIndicatorController}.cs`,
  `Models/{AssetSubCategoryGroup, RulAdjustmentIndicator}.cs`,
  `Services/ApprovalProgressSeedService.cs` (registered via
  `builder.Services.AddHostedService<...>()` in standalone's `Program.cs` — monorepo's `Program.cs`
  is missing that registration too, consistent with the file itself being absent), plus 2 SQL
  migration scripts (`Data/MigrateDecimal8dp.sql`, `Data/MigrateTransactionReversals.sql`) and
  `AnalyticsSqlConstants.cs`. Per standalone's git log, the Reversals/depreciation-accuracy work
  is from late June–early July 2026 — real, ~2-month-old feature work, not noise. **Not pulled in
  this pass** — needs its own careful review pass (new DB objects, new endpoints, cross-checking
  against `Data/Schema.sql` for matching table definitions) rather than a blind copy.
- **Common backend files with large diffs, not yet fully triaged**: `Controllers/BulkTransactionController.cs`
  (2776 diff lines), `Controllers/ReportsController.cs` (1817), `Controllers/BulkUploadController.cs`
  (1467), `Data/Schema.sql` (1374, beyond the 1 `GETDATE()` line already fixed),
  `Data/DbConnectionFactory.cs` (1190), `Services/TransactionService.cs` (475), plus ~15 more
  controllers with diffs in the tens-to-hundreds of lines. **None of these have been categorized
  yet** as "real upstream change" vs. "monorepo-only adaptation" — that triage is the next pass.
- **`Program.cs`**: only differs by the missing `ApprovalProgressSeedService` registration (see
  above — consistent with that file not existing yet, not a separate issue).
- **`Properties/launchSettings.json`**: differs only in `0.0.0.0` vs `localhost` binding — this is
  the standard monorepo/container adaptation seen in every other module, correctly left as-is.
- **Auth**: `libs/assets/src/lib/features/auth/login.component.ts` — **still not investigated**.
  Per the shared-auth convention (`@platinumv3/shared/auth`) every other module follows, a
  module-local login component is unusual. Needs its own investigation pass (check references,
  git history) before deciding whether it's dead code or a legitimate exception — see
  `prompts/assets.md` for the reasoning.

### Verification performed

- `dotnet build -c Release ASSETS-PSQL-API` — 0 errors (48 pre-existing nullable-reference
  warnings, unrelated to this pass's change), built to a scratch directory since the normal output
  was locked by an already-running dev instance.
- `tsc --noEmit -p apps/shell/tsconfig.app.json` — clean (expected: zero frontend files touched
  this pass).
- `grep -rn "assets-app" libs/assets/src/lib` — no hits, confirming nothing accidentally introduced
  a proxy prefix Assets doesn't use (the inverse of the Budget bare-`/api` bug — see
  `prompts/assets.md`).
- Did **not** do a live runtime check (curl before/after) the way the Overtime and Budget syncs
  did — the running dev instance still has the pre-fix binary loaded (restarting it requires
  killing a process outside this session's permitted actions), and a live write-test against the
  fix would have meant writing test rows into a real shared database, which felt like the wrong
  tradeoff for confirming a fact about PostgreSQL syntax that's already certain from a clean build
  + code inspection.

## Remaining work (next passes)

1. **Frontend (`libs/assets/src/lib`, 232 files, ~25 feature areas)** — not started at all this
   pass. Recommend going area-by-area per `prompts/assets.md`'s scale warning, starting with
   whichever areas the 14 new backend files correspond to (likely `acquisitions`/`assets` for
   split/combine and sub-category-groups, `reconciliation` or a new area for reversals).
2. **Triage the ~15 large common-backend-file diffs** listed above — categorize each as upstream
   change to pull vs. monorepo adaptation to leave, the same way the `GETDATE()` bug was resolved
   by understanding *why* it differed rather than picking a side blindly.
3. **Review and integrate the 14 new backend files** — new DB objects need their `Data/Schema.sql`
   entries reconciled, new endpoints need controller review, `ApprovalProgressSeedService`
   needs its `Program.cs` registration added alongside the file itself.
4. **Investigate the `features/auth/login.component.ts` situation** (see above).
5. **Diff the shell's Assets nav array** against the standalone's nav/menu template item-by-item —
   not done this pass since no frontend work happened; per every other module's experience, this
   is a separate sync surface from the module's own files and needs its own explicit check.
6. Add a line to `MASTER.md` §4.2 documenting Assets' non-fatal-DB-startup behavior (currently
   documented for AFS/Budget/Overtime but not Assets) — noted as a gap in `prompts/assets.md`,
   still open.

---

## General principles (apply to every module, every sync — see also `BudgetSync.md`)

- **Shared auth is non-negotiable** — see the auth investigation item above; don't resolve it by
  assumption.
- **Assets owns bare `/api`** — never add an `/assets-app` prefix rule; that would break it, not
  fix it. This is the one module where the Budget-style "bare /api is a bug" lesson runs backwards.
- **Always verify before declaring done** — `dotnet build -c Release ASSETS-PSQL-API`,
  `tsc --noEmit -p apps/shell/tsconfig.app.json`, and (once frontend work starts) the nav-array
  diff and a live data-bearing page check.
- **A partial pass, honestly reported, beats a rushed full pass** — this doc's own first entry is
  the example: one critical bug fixed and verified thoroughly, rather than 232 files touched
  superficially.
