# Platinum ERP — Issue Tracker

Running log of issues found during the Nx monorepo migration, with status. Newest at the top.

Status legend: ✅ Resolved · 🟡 Open · ⏸ Blocked (waiting on user/external) · 📝 Tech debt

---

## Open / Pending

### #4 — AFS API uses SQL Server, not PostgreSQL
- **Status:** ⏸ Blocked — awaiting user decision
- **Found:** Asked to point AFS dashboard at Azure PostgreSQL `AFS` DB.
- **Detail:** `AFS-UI/dotnet-apis/PlatinumAFS.Api` uses EF Core `Microsoft.EntityFrameworkCore.SqlServer` and a SQL Server connection string. Switching to PostgreSQL requires:
  1. Swap NuGet package: `Microsoft.EntityFrameworkCore.SqlServer` → `Npgsql.EntityFrameworkCore.PostgreSQL`
  2. `Program.cs`: `UseSqlServer(...)` → `UseNpgsql(...)`
  3. Rewrite connection strings in `appsettings.json`, `appsettings.Development.json`, `appsettings.Production.json` to Npgsql format
  4. Audit `Models/` and `Data/PlatinumDbContext.cs` for SQL-Server-specific annotations / column types
  5. Verify schema in the Azure `AFS` database matches EF model expectations
- **Next step:** Confirm with user whether to proceed with full provider swap.

### #3 — Azure Postgres unreachable from Replit (firewall)
- **Status:** ⏸ Blocked — requires user action in Azure portal
- **Found:** TCP connect to `platinum-postgre-sql.postgres.database.azure.com:5432` times out.
- **Cause:** Azure Postgres firewall rejects all inbound by default; Replit's outbound IP range is not whitelisted.
- **Next step:** User to add a firewall rule in Azure portal → `platinum-postgre-sql` → Networking → Firewall rules. Re-test once added.

### #2 — Cross-app global CSS leakage
- **Status:** 📝 Tech debt
- **Found:** While debugging issue #1.
- **Detail:** `libs/payroll/src/lib/_payroll-global.css` and `libs/afs/src/lib/_afs-global.scss` are loaded as **global** stylesheets in `apps/shell/angular.json`. Their unscoped selectors (`.main-content`, `.sidebar`, etc.) leak across all modules and silently affect unrelated pages.
- **Next step:** Scope each global file under a module-specific root class (e.g. `.payroll-app .main-content`), or move only shared design tokens to global and keep layout rules inside component styles.

---

## Resolved

### #1 — Empty 240px strip on `/assets/dashboard` (and every other shell route)
- **Status:** ✅ Resolved (commit `5fc9c93`)
- **Symptom:** Empty cream/peach strip between sidebar and main content.
- **Root cause:** `libs/payroll/src/lib/_payroll-global.css` defines a global `.main-content { margin-left: 240px; }` rule (legacy from when payroll's standalone app used a `position: fixed` sidebar). Loaded globally, it pushed the shell's `.main-content` 240px to the right even though the shell already lays out `.app-sidenav` and `.main-content` as flex siblings.
- **Fix:** Added override in `apps/shell/src/styles.css`:
  ```css
  .shell > .main-content { margin-left: 0 !important; }
  ```
- **Verified:** Screenshot before/after confirms the gap is gone; KPI cards now render 5-across.
- **Related follow-up:** Issue #2 (root-cause cleanup).

---

## Earlier session work (already completed before this tracker)

These are summarised here so we have one place to look.

- ✅ POS module sync — 107 TS files synced from Municipal-Receipting-POS-2; build clean.
- ✅ POS navigation — all sidebar/home links prefixed with `/pos` to work under the lazy-loaded route mount.
- ✅ POS auth bridge — `libs/pos/src/lib/core/services/auth.service.ts` now wraps `@platinumv3/shared/auth` so ~30 POS components keep working unchanged.
- ✅ All 11 shell routes (`/`, `/login`, `/dashboard`, `/assets`, `/scm`, `/pos`, `/payroll`, `/idp`, `/budget`, `/afs`, `/ins`) return HTTP 200; build has 0 errors.
