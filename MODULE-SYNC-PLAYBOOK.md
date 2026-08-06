# Module Sync Playbook — Standalone (Replit) → Monorepo

Reusable process + prompt for pulling frontend/backend updates from a module's standalone repo
into `Platinum-v3_1` **without losing monorepo-only adaptations** (shared auth wiring, proxy
paths, Azure DB connections, deploy config). First used for the **Overtime** sync (2026-08-06) —
copy the pattern for every future module sync.

---

## The reusable prompt

Paste this back (filling in the brackets) whenever you want to sync a module:

```
Focus on the Platinum-v31 code. Update the [MODULE] module (frontend at libs/[module]/src/lib,
backend at [BACKEND_DIR]) with the latest code from [STANDALONE_PATH].

Follow this process:
1. Compare the standalone tree against the monorepo tree file-by-file (core/services,
   core/models, features, Controllers, Services, etc.) — build three lists: files ONLY in
   standalone (new), files ONLY in monorepo (adaptations — do not remove), and common files
   that differ (candidates to sync).
2. Do NOT copy the standalone's own auth stack — no auth.service.ts, auth.interceptor.ts,
   auth.guard.ts, role.guard.ts, login.component.ts, reset-password.component.ts, or
   session-cookie/SessionAuthFilter wiring. This module must keep reading the signed-in user +
   token from the shared @platinumv3/shared/auth AuthService (see libs/shared/auth) — never a
   module-local or standalone auth service.
3. Preserve the known monorepo-only adaptations for this module — see the checklist below for
   this module (or diff against the current monorepo file if it's not documented yet, and add it
   to this playbook once you've confirmed what's deliberate).
4. For files that ARE synced, fix import paths for the monorepo (environment.ts import depth,
   @platinumv3/shared/* references, relative paths) — do not just copy standalone paths verbatim.
5. After copying, type-check the shell (frontend: tsc --noEmit against apps/shell/tsconfig.app.json)
   and/or dotnet build (backend) to confirm everything compiles before declaring done.
6. Give me a summary: files added, files updated, files skipped (and why), and any new backend
   services/migrations that need wiring into Program.cs / module registration (using the
   non-fatal, don't-crash-if-it-fails seeding pattern already used in this repo).
7. Don't touch anything outside [MODULE]'s frontend/backend folders unless a shared file
   genuinely needs a fix — and flag that separately before changing it.
8. Update this playbook's per-module checklist with anything new you preserved or discovered,
   so the next sync doesn't have to re-derive it.
```

---

## Per-module adaptation checklists

### Overtime — done (2026-08-06)

**Frontend** (`libs/overtime`):
- `environment.ts` → stays `/overtime-app/api` (shell proxy prefix); never replace with the
  standalone's `environments/environment.ts`.
- `features/overtime/overtime.routes.ts` → uses the monorepo's `core/guards/permission.guard.ts`
  (`canAccessConfigGuard`, `canAccessCaptureGuard`, `canAccessPayrollGuard`,
  `canAccessEnquiryGuard`) — **not** the standalone's `core/guards/role.guard.ts`.
- `core/services/user-context.service.ts` → `displayName` must read the shared
  `AuthService.user()` first (real signed-in user), falling back to the module's own
  `me()`/`/auth/me` only when the shell session isn't populated yet.
- `core/services/overtime-sharepoint.service.ts` → monorepo-only file, the standalone doesn't
  have it — never delete on sync.
- Skipped entirely (standalone auth stack): `auth.service.ts`, `auth.interceptor.ts`,
  `auth.guard.ts`, `role.guard.ts`, `login.component.ts`, `reset-password.component.ts`.
- New feature pulled in: `features/overtime/pages/overtime-setup/approval-chain-organogram.component.ts`,
  wired into `overtime-setup-tabs.component.ts`.

**Backend** (`OVERTIME-API`):
- `Program.cs` → keep `DevCurrentUserService` (header-based `ICurrentUserService`) — **not** the
  standalone's `SessionCurrentUserService` / global `SessionAuthFilter` / `AddSession` /
  `AddDataProtection` session-cookie stack (those classes exist in the tree but must stay
  unwired).
- `Program.cs` → keep the **non-fatal seeding** pattern: the `RunSeeder(name, action)` try/catch
  wrapper and `Seeding:SkipOnStartup` config flag — do not switch to the standalone's fail-fast
  `if (app.Environment.IsDevelopment()) { … }` unconditional block.
- `appsettings.json` / `appsettings.Development.json` → keep the Azure Postgres connection
  string (`platinum-postgre-sql.postgres.database.azure.com`, `SslMode=Require`) — **not** the
  standalone's SQL Server localdb default.
- `appsettings.Development.json` → keep `Kestrel:Endpoints:Http:Url = http://0.0.0.0:8099`.
- New services/migrations from the standalone (`ConstPayrollCycleModeSeeder`,
  `OvertimeChainPositionBackfillService`, `OvertimeDivisionNameBackfillService`, 4 EF
  migrations) — registered as scoped services and invoked via the existing non-fatal
  `RunSeeder` calls in **both** the `skipSeeding` and normal branches, not the standalone's
  unconditional calls.
- `.csproj` → add new `PackageReference`s the standalone needs (this sync added
  `Microsoft.AspNetCore.DataProtection.EntityFrameworkCore`, required by the updated
  `OvertimeDbContext`) — but never anything that pulls in the session-auth stack.
- New `appsettings` keys added: `OvertimePermissions:CacheTtlMinutes` (both files),
  `OvertimePermissions:FailOpen: true` (Development only, so local testers aren't locked out by
  the new permission checks).

### [Next module] — fill in at sync time

Copy the two headings above (Frontend / Backend), diff the standalone against the current
monorepo file-by-file, and record here:
- Which files are monorepo-only adaptations (never overwrite).
- Which config differs deliberately (DB connection, ports, proxy prefixes).
- Whether the module has its own auth stack to skip (check for `auth.service.ts`,
  `auth.interceptor.ts`, guards, `login.component.ts` in the standalone).

---

## General principles (apply to every module, every sync)

- **Shared auth is non-negotiable.** `@platinumv3/shared/auth`'s `AuthService` is the single
  source of truth for the signed-in user + token in every module. Never reintroduce a
  module-local login flow, hardcoded user, or separate token source during a sync.
- **Non-fatal seeding only.** Monorepo .NET backends run on Azure Postgres (one DB per module,
  shared server) with try/catch-wrapped startup seeders — a seeder failing must never crash the
  app. Reject any standalone pattern that fails fast on startup seed/migration errors.
- **Dev ports and proxy prefixes are monorepo-only.** `/<module>-app/api` prefixes in
  `apps/shell/proxy.conf.json`, and each backend's dev port, are never overwritten by a sync —
  they don't exist in the standalone at all.
- **Always verify before declaring done.** Frontend: `node node_modules/typescript/bin/tsc
  --project apps/shell/tsconfig.app.json --noEmit`. Backend: `dotnet build -c Release`.
- **Never bring in a standalone's session-cookie/global-auth-filter backend pattern.** Monorepo
  module APIs are called through the shell's proxy carrying the shared POS session — they are
  not meant to run their own login/session system.
