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
| DB startup behavior | `Database.Migrate()` + dev-only seeders, no try/catch (crashes on any failure, gated `IsDevelopment()`) | `Database.Migrate()` unprotected (still crashes — see `MASTER.md` §4.2, deliberate), but all seeders/backfills run unconditionally wrapped in a non-fatal `RunSeeder` helper, gated by `Seeding:SkipOnStartup` config instead of environment |
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

---

## General principles (apply to every module, every sync — see also `BudgetSync.md`)

- **Shared auth is non-negotiable.** `@platinumv3/shared/auth`'s `AuthService` is the single
  source of truth for the signed-in user + token. Never reintroduce Overtime's own login flow,
  session cookie, or `auth.interceptor.ts`.
- **The identity bridge is Overtime-specific and load-bearing.** `X-Username` header →
  `DevCurrentUserService.FindByUserName` → `Sys_RolePermission`/`User_UserRoles` lookup is what
  makes nav/permission checks reflect the real signed-in user instead of an arbitrary default.
  Never let a sync revert `ICurrentUserService` registration back to `SessionCurrentUserService`.
- **`Database.Migrate()` is deliberately NOT wrapped non-fatally** (unlike Budget/AFS) — see
  `MASTER.md` §4.2. Don't "fix" this as an incidental side effect of a sync; it's a known,
  accepted asymmetry, not a bug.
- **Always verify before declaring done.** Frontend: `tsc --project apps/shell/tsconfig.app.json
  --noEmit`. Backend: `dotnet build -c Release` (build to `-o <scratch>` if the normal output is
  locked by a running instance rather than killing someone else's process). Also grep for bare
  `'/api'` string literals and diff the shell's nav array item-by-item — a clean build catches
  neither.
