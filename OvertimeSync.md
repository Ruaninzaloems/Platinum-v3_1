# OvertimeSync — Standalone → Monorepo Sync Playbook (Overtime module)

Reusable process + prompt for pulling frontend/backend updates from the Overtime module's
standalone repo into `Platinum-v3_1` **without losing monorepo-only adaptations** (identity
bridge, non-fatal seeding, Azure Postgres connection, proxy paths). Modeled on `BudgetSync.md`.
Previously this only existed as git-log archaeology (commit `overtime sync: pull latest module
code from standalone repo` and parents) — this file replaces that as the source of truth going
forward, per that commit's own todo.

**Standalone source:** `C:\Repos\Platinum-Overtime\PlatinumOvertime`
**Monorepo frontend:** `libs/overtime/src/lib`
**Monorepo backend:** `OVERTIME-API`

---

## Known structure (verified 2026-08-25)

| | Standalone | Monorepo |
|---|---|---|
| Frontend source | `PlatinumOvertime-UI/src/app` | `libs/overtime/src/lib` |
| Backend source | `PlatinumOvertime-API` | `OVERTIME-API` |
| API base config | `src/environments/environment.ts` → plain `apiBaseUrl` | `libs/overtime/src/lib/environment.ts` → `apiPrefix: '/overtime-app'` (services prepend it manually, standard monorepo convention) |
| Auth stack | **Has its own** — `core/services/auth.service.ts`, `core/interceptors/auth.interceptor.ts`, `core/guards/{auth,role}.guard.ts`, `features/login`, `features/reset-password`, session-cookie backend (`SessionCurrentUserService`, `SessionAuthFilter`, ASP.NET session/DataProtection) | **None of the above.** Rides on the shell's shared `@platinumv3/shared/auth`. Backend identity comes from `DevCurrentUserService` bridged to the shell's real POS user via an `X-Username` header — see `MASTER.md` §13.4 "Overtime identity bridge". `SessionCurrentUserService` is kept only as a second `ICurrentUserService` implementation so the project compiles; it is never registered/used. |
| Permission source | Standalone: its own `role.guard.ts` reading standalone `/auth/me` flags | Monorepo: `permission.guard.ts`'s `canAccess{Config,Capture,Payroll,Enquiry}Guard` functions, reading the same `MeDto` flags via the identity-bridged `GET /overtime-app/api/auth/me` |
| DB startup behavior | `Database.Migrate()` + dev-only seeders, no try/catch (crashes on any failure, gated `IsDevelopment()`) | **(superseded 2026-09-03 — see `prompts/overtime.md`)** `Database.Migrate()` is now wrapped in try/catch that logs a warning (local dev only; `EMS_GeorgeUAT`'s `__EFMigrationsHistory` doesn't match this project's migrations 1:1). Seeders/backfills run in a non-fatal `RunSeeder` helper gated by `Seeding:SkipOnStartup` (now `true`). Dev DB is the real shared `EMS_GeorgeUAT` SQL Server, `OvertimePermissions:FailOpen=false`. The SqlServer `AddDbContext` also carries the `PendingModelChangesWarning` suppression. |
| SQL Server support | Plain hardcoded SSL mode in connection-string builder | Adds `sslmode` query-param parsing (disable/require/prefer/verify-full/verify-ca → Npgsql SSL Mode) — a monorepo-only Azure-firewall-driven improvement, not present in standalone |
| Diagnostics | None | `GET /api/health/db` — added directly in monorepo to debug the Azure Postgres firewall-IP issue (`MASTER.md` §4.2) |

---

## The reusable prompt

This is `prompts/overtime.md` in `Platinum-v3-sync` verbatim — paste it back (or say "sync
Overtime" to a Claude session in that project) to run this again:

```
Focus on the Platinum-v3_1 code. Update the Overtime module (frontend at
libs/overtime/src/lib, backend at OVERTIME-API) with the latest code from
C:\Repos\Platinum-Overtime.
```
(see `Platinum-v3-sync/prompts/overtime.md` for the full version with the process/verification
steps spelled out)

---

## Overtime adaptation checklist — fill in as each sync happens

### 2026-08-06 — first sync (completed, documented only in git history until now)

Not re-derived this run — see commit `5cdb795` ("overtime sync: pull latest module code from
standalone repo") for the full frontend/backend file list. Summary from that commit message:
added the Approval Chain Organogram feature, chain-position/division-name backfill services +
migrations, `ConstPayrollCycleModeSeeder`; kept `environment.ts`, `permission.guard`-based
routes, `overtime-sharepoint.service.ts`, and the shared-auth overlay in
`user-context.service.ts`; kept `DevCurrentUserService`, Azure Postgres connection strings, and
the `:8099` dev binding; did not bring in the standalone's session-cookie auth stack.

### 2026-08-25 — second sync

**Diff result: standalone has not materially changed since the 2026-08-06 sync.** Every file
that differs between the two trees (10 of 29 common frontend files, 8 of 165 common backend
files) is exactly the already-correct, already-documented adaptation surface above — confirmed
line-by-line, not just by filename. Zero new/changed business logic found on either side. This
makes sense in hindsight: most of what changed between the two syncs happened *in the monorepo*
(the 2026-08-14 identity bridge), not in the standalone source.

**Frontend:** no files touched. All 10 flagged diffs were either the `environment.ts` import-path
adaptation (`'../../../environments/environment'` → `'../../environment'`, monorepo is one
directory shallower) or the identity-bridge/permission-guard adaptation already in place.

**Backend — 2 small fixes:**
- **`Scripts/CreateTables_SqlServer.sql` was stale** — missed by the 2026-08-06 sync (that
  commit only updated the EF Postgres migrations/snapshot, not this manually-maintained SQL
  Server DDL reference script). It was missing `IsExcessApproved`, `IsPayrollCaptured`,
  `RecommenderChainPositionId/Name`, `ApproverChainPositionId/Name`, `LegacyDepartmentId/Name`,
  `LegacyDivisionId/Name` — all added by the chain-position/division-name/legacy-backfill work in
  that same sync. Copied standalone's current version wholesale (this file has no monorepo-only
  content — it's a plain DBA reference script, not executed by the running app). **Worth checking
  again on the next sync**, since it's easy to forget precisely because nothing breaks at build
  time when it drifts.
- **Program.cs** — ported one small addition from standalone: a background `Task.Run` that warms
  up `DevUserDirectory` at startup (try/catch-wrapped, non-critical) so the first `/api/me`
  request doesn't pay its ~200ms lazy-init cost. Everything else that differs in `Program.cs`
  (session/cookie stack, `ForwardedHeaders`, PORT env var handling, seeder registration order) is
  the standalone's own skipped auth stack or Replit/Azure-App-Service deploy plumbing that
  doesn't apply here — left alone.

**Verification performed:**
- `dotnet build -c Release OVERTIME-API` — the normal in-place build hit `MSB3027`/file-lock
  errors because `OVERTIME-API.exe`/`.dll` were held open by an already-running instance (PID
  13184 — another session's dev process, not mine to kill). Rebuilt with `-o` to a scratch
  directory instead: **0 errors**, 2 pre-existing NU1903 warnings (unrelated).
- `tsc --noEmit -p apps/shell/tsconfig.app.json` — clean (expected: 0 frontend files changed).
- `grep -rn "'/api'" libs/overtime/src/lib` — no bare non-prefixed base URLs found.
- Nav array: `shell.component.ts`'s `overtimeNavItems` (5 items) vs. standalone's
  `main-layout.component.ts` nav template (5 items) — routes and permission flags match 1:1 in
  order. Two icons differ (Dashboard: `dashboard` vs standalone's `home`; Enquiry: `search` vs
  standalone's `manage_search`) — cosmetic Material-icon choices, not a functional mismatch, not
  changed.
- Runtime spot-check: the already-running `OVERTIME-API` instance (the same one holding the build
  lock) answered live: `GET /api/health/db` → `{"status":"ok","db":"Overtime","connected":true}`,
  and `GET /api/auth/me` (with `X-User-Id: 1`) → a real `MeDto` payload with live permission
  flags. **Did not** complete the "through the shell proxy" leg of this check — no shell dev
  server (`apps/shell`, normally :4200) was running, and starting one felt like unnecessary risk
  of colliding with whatever the other active session (holding the OVERTIME-API lock) is doing in
  this same repo. Since zero frontend files changed this sync, the proxy path itself is
  unmodified from its last-verified state — low risk to leave unexercised this round, but flag it
  for the next sync if the frontend is untouched two syncs in a row.

**Needs a human decision:** none. This was a near-no-op sync; nothing here changes runtime
behavior for end users.

> ⚠️ **Correction (2026-11-25): the "near-no-op" conclusion above was wrong.** That run compared the
> two trees and judged every differing file to be monorepo adaptation. The third sync (below)
> found the monorepo was in fact *missing* real upstream work from before this date — the
> server-side filtering/pagination/export in `OvertimeTransactionsService`, the `EmployeeId`
> assignee fallback in `WorkflowService`, the vacancy guard in `AssigneeResolverService`.
> **Comparing trees cannot distinguish "monorepo adaptation" from "monorepo is behind"** — both
> look like a difference. Use the 3-way method in the next section instead.

---

## 2026-11-25 — third sync: a real one (17 files merged, 5 added), and a method change

### Method: 3-way merge from the last-synced standalone commit — do not diff trees

For each file the standalone changed since the last sync, merge it into the monorepo copy with
`git merge-file` (base = standalone at the last-synced commit, ours = monorepo file, theirs =
standalone HEAD). Files the standalone didn't change are never touched, so every monorepo-only
adaptation (`Program.cs`, `appsettings*`, `JwtCurrentUserService`, the `FindByUserName` bridge
member, `environment.ts`, `permission.guard.ts`, …) is preserved by construction, and no
judgment call per file is needed. Normalise CRLF to LF for the merge and restore each file's
original line endings afterwards (the monorepo copies are CRLF).

```
cd C:\Repos\Platinum-Overtime
git diff --name-status --no-renames <LAST_SYNCED> HEAD -- PlatinumOvertime/PlatinumOvertime-UI/src/app PlatinumOvertime/PlatinumOvertime-API
# per file:  git show <LAST_SYNCED>:<p> > base ; monorepo file > ours ; git show HEAD:<p> > theirs
#            git merge-file -p ours base theirs
```

Then audit: after the merge, every touched file must be **byte-identical to standalone HEAD
(ignoring CR)** except the known import-path adaptation (`'../../../environments/environment'` →
`'../../environment'`, 2 files this time). Anything else remaining is either a real adaptation to
document or a regression to fix.

**Last-synced standalone commit after this run: `c35ec39` (2026-10-15).** Use it as `<LAST_SYNCED>`
next time. Files that differ from upstream but were *not* touched this run (the adaptation set):
`Program.cs`, `PlatinumOvertime-API.csproj` (JwtBearer package ref), `appsettings*.json`,
`DevCurrentUserService.cs`, `SessionCurrentUserService.cs` + `ICurrentUserService.cs` (the
`FindByUserName` / `UserName` bridge members), `Properties/launchSettings.json` (port), the
`Data/SeedData`/`SeedData` JSON files.

### 🛑 Pitfall hit this run: picking the wrong base silently *reverts* work

The first attempt used `374c485` (standalone, 2026-08-05, "the last commit before the 08-06
sync") as the base. That commit **added** the vacancy guard to `AssigneeResolverService`
("position has the right role flag but is vacant — skip and keep walking"), but the monorepo's
08-06 sync (14:57 +0200) had missed it. With that base, "base has it, monorepo lacks it, upstream
has it" resolves as *"monorepo deliberately removed it"* — so the merge reported **clean** while
keeping the regression. It was caught only because upstream's own test
`ResolveAsync_VacantPosition_DoesNotUseStaleEmployee_AndContinuesUpward` failed. A clean merge
proves nothing about base choice. Two safeguards, use both:
1. Run the byte-identical-to-upstream audit above — it catches this class of error immediately.
2. Run upstream's unit tests (next section).

The true base for that run was `8759464` (parent of `374c485`). The 08-06 sync's snapshot
predated the two 08-05 commits at ~11:40–11:58 UTC (the guard, and `da42f3c` "Seed payroll
employee data").

### What came in (upstream changes since the last real sync, 2026-08-05 → 2026-10-15)

**Backend (`OVERTIME-API`)**
- **Workflow identity compatibility** — new `WorkflowAssigneeIdentity` helper: assignee/capturer
  matching now accepts either the canonical `User_id` **or** the linked payroll `EmployeeId`
  (legacy rows stored the latter). Used by `WorkflowService`, `OvertimeTransactionsService`,
  `DashboardController`, `MeController`, `AuthController` (login response now also carries
  `ActingForUserIds`, matching `/auth/me`).
- **`AssigneeResolverService`** — primary seat is filled only by the employee currently on
  `Payroll_Position.EmployeeID` (stale `Payroll_Employee.PositionID` no longer resurrects a former
  employee into a vacant seat), plus the vacancy guard above.
- **`OvertimeTransactionsService`** — server-side filters (employee search, status, salary head,
  department, division), page/pageSize clamping, `current/export` + `processed/export`
  (no-pagination) endpoints, and edits preserve historical classification labels unless explicitly
  changed (`ResolveClassificationUpdateAsync`).
- **Payroll processing** — new `PayrollOrganisationResolver`; rows now carry
  `DepartmentId/Name` + `DivisionId/Name` resolved from captured labels first, then master data;
  the department/division filter runs *after* resolution (previously filtered in SQL on legacy IDs
  that ordinary captures never set, silently dropping valid rows).
- `Scripts/PlatinumOvertime_SqlServer_FullSchema.sql` (new, reference DDL — not executed by the app).

**Frontend (`libs/overtime`)** — capture/enquiry components + `overtime-transactions.service.ts`
(server-side filtering/export wiring), payroll-processing component (CSV logic extracted to new
`payroll-csv.ts`), `overtime-workflow.model.ts` (new DTO fields).

### Verification performed (and what was not)

- `tsc --noEmit -p apps/shell/tsconfig.app.json` — clean.
- `dotnet build -c Release OVERTIME-API` (to a scratch `-o` dir) — **0 errors**.
- **Upstream's own unit tests run against the merged code: 82/82 pass.** The monorepo carries no
  test project, so this is done in a scratch copy: copy `OVERTIME-API` (minus `bin`/`obj`) and
  `PlatinumOvertime-API.Tests` into a scratch dir and run `dotnet test` there (never reference the
  monorepo project directly — that rewrites its **tracked** `bin/obj` files). Two scratch-only
  changes were needed: give `ICurrentUserService.FindByUserName` a default body (`=> null`) so the
  upstream test stubs compile (the monorepo's identity-bridge member isn't in their interface).
  **Do this every sync** — it is the only check that caught the wrong-base regression.
- Live API (built output run on a spare port, `ASPNETCORE_ENVIRONMENT=Development`, **from the
  build directory** — `dotnet x.dll` takes its content root from the cwd, so launching it from
  elsewhere fails with "Database connection string is not configured"): `/api/health/db` → 200
  connected; `/api/dashboard/summary`, `/api/overtime-transactions/current?…&employeeSearch=…`
  (returned real rows), `/processed`, `/current/export`, `/api/payroll-processing/search` all 200;
  `/enquiry` and payroll search correctly 403 for a user lacking permissions 3201/3202.
- Nav: unchanged upstream (no layout/routes file in the delta); 5 items match the standalone 1:1.
- Grep: no bare `'/api'`, no leftover conflict markers, no secrets in the new SQL script.
- **Not verified:** (a) the shell-proxy/browser leg — no shell dev server was started, so the
  changed capture/enquiry/payroll pages were type-checked but never rendered; (b) the new
  payroll-division resolver on real rows — the UAT DB had **zero** "Approved for Payment"
  transactions, so `payroll-processing/search` returned empty; that logic is covered only by
  upstream's unit tests (`PayrollProcessingDivisionTests`, which pass).

### Left alone — needs a human decision

- `Data/SeedData/payroll_employees.json` is stale vs upstream (upstream `da42f3c`, 2026-08-05;
  ~694 KB vs ~459 KB here). Not synced: the monorepo runs with `Seeding:SkipOnStartup=true`
  against the real `EMS_GeorgeUAT` data, so the seed is inert, and it is a large file of employee
  records. Sync it only if someone actually needs seeding.
- The 23 "files changed, not committed" the Platinum-v3-sync dashboard showed before this run
  were all **tracked `OVERTIME-API/bin/**` and `obj/**` build output**, not source. They keep
  showing as dirty on every build. Untracking them (`git rm -r --cached` + `.gitignore`) would make
  the dashboard's per-module change count meaningful — a separate cleanup, not done here.

---

## General principles (apply to every module, every sync — see also `BudgetSync.md`)

- **Shared auth is non-negotiable.** `@platinumv3/shared/auth`'s `AuthService` is the single
  source of truth for the signed-in user + token. Never reintroduce Overtime's own login flow,
  session cookie, or `auth.interceptor.ts`.
- **The identity bridge is Overtime-specific and load-bearing.** `X-Username` header →
  `DevCurrentUserService.FindByUserName` → `Sys_RolePermission`/`User_UserRoles` lookup is what
  makes nav/permission checks reflect the real signed-in user instead of an arbitrary default.
  Never let a sync revert `ICurrentUserService` registration back to `SessionCurrentUserService`.
- **`Database.Migrate()` IS now wrapped non-fatally for local dev (since 2026-09-03)** — this
  reverses the older "deliberately not wrapped" rule that used to be here; see the DB-startup row
  above and `prompts/overtime.md`. Don't revert it, and don't remove the SqlServer
  `ConfigureWarnings(...PendingModelChangesWarning)` call, unless the underlying migration-history
  mismatch has actually been root-caused first.
- **Identity is JWT-first now (since 2026-09-09):** `ICurrentUserService` is `JwtCurrentUserService`
  (verifies POS-API's global JWT), falling back to the old unsigned `X-User-Id`/`X-Username`
  headers; `DevCurrentUserService` + `Auth:UseLegacyHeaderBridge` remain as an instant rollback.
  The "identity bridge" bullet above describes the fallback path — don't delete any of these.
- **Sync by 3-way merge from the last-synced commit, never by comparing trees** (see the
  2026-11-25 section), and **run upstream's unit tests** against the result.
- **Always verify before declaring done.** Frontend: `tsc --project apps/shell/tsconfig.app.json
  --noEmit`. Backend: `dotnet build -c Release` (build to `-o <scratch>` if the normal output is
  locked by a running instance rather than killing someone else's process). Also grep for bare
  `'/api'` string literals and diff the shell's nav array item-by-item — a clean build catches
  neither.
