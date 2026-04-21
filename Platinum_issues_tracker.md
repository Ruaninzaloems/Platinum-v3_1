# PLATINUM — Issues & Pending Work Tracker

_Last updated: 2026-04-21 (POS auth unification)_

Status legend: 🔴 Open · 🟡 In progress · 🟢 Resolved · ⚪ Deferred

---

## Build & Infrastructure

| ID | Status | Severity | Title | Notes |
|----|--------|----------|-------|-------|
| BUILD-001 | 🔴 | High | esbuild deadlocks on cold start of Platinum Shell (10+ min hangs) | Stale `esbuild`/`ng serve` processes accumulate on workflow restart. Workaround: `pkill -9 -f esbuild` then restart workflow. Needs permanent fix (concurrency cap, or move to webpack, or pre-warm cache). |
| BUILD-002 | 🔴 | Medium | Build-in-progress causes lazy chunks to 404 → all modules redirect to `/dashboard` | Wildcard route catches the 404. Cosmetic but confusing. Could add a "build in progress" splash. |
| BUILD-003 | ⚪ | Low | Old per-module Angular apps (`ASSETS-UI/`, `SCM-UI/`, `POS-UI/`, etc.) still live in workspace | Source-of-truth references; not yet archived. T006 cleanup pending. |

## Backend APIs

| ID | Status | Severity | Title | Notes |
|----|--------|----------|-------|-------|
| API-001 | 🔴 | High | IDP API (port 8008) returns 404 on `/api/cycles` | Service starts but routes missing or misregistered. IDP dashboard now shows graceful "service unavailable" panel (FIX-008). |
| API-002 | 🔴 | High | Budget API port collision on 3001 (shared with ASSETS-API legacy) | Proxy ambiguity. Move Budget API to a free port (e.g. 3005) and update `proxy.conf.json`. |
| API-003 | 🟢 | Medium | POS authentication model not finalized | RESOLVED 2026-04-21: POS-API designated as system-wide identity provider. Shared `AuthService` rewritten to POS shape (AuthUser/SiteInfo, session-cookie via `/pos-app/api/auth/login` with withCredentials). Interceptor scoped to first-party API prefixes only; SCM JWT bearer scoped to `rep-scm-api.azurewebsites.net`. Guard runs `/auth/status` once per app load. Login page shows Site dropdown. End-to-end verified: sites/login/status/logout. |
| API-005 | 🔴 | **CRITICAL** | POS-API `/api/auth/login` grants demo session BEFORE validating credentials | `POS-API/routes/auth.routes.ts:19-37` returns `success:true` with a synthetic admin user immediately, then attempts the live Azure validation in the background. Practically: any username/password combination authenticates. Acceptable for dev demo but MUST be gated behind an explicit `NODE_ENV !== 'production'` flag (or removed entirely) before any non-dev deployment. |
| API-004 | ⚪ | Low | Several AFS endpoints not yet wired in `AFS-UI/api/index.ts` | Working papers, RFI attachments, finding evidence upload still TODO. |

## Module Frontend (Nx libs)

| ID | Status | Severity | Title | Notes |
|----|--------|----------|-------|-------|
| UI-001 | 🟢 | High | IDP dashboard rendered blank when API failed (previous-page bleed-through) | Fixed: rewrote template to 3 explicit states (loading / error / data) in `libs/idp/src/lib/features/dashboard/dashboard.ts`. |
| UI-002 | 🔴 | High | Other module dashboards still use `*ngIf="data() as d"` pattern with no error fallback | Apply IDP fix pattern to assets, scm, pos, payroll, budget, afs, ins dashboards. |
| UI-003 | 🟡 | Medium | Sidebar (shell.component.ts) only links to 12 routes — modules have 339 routes total | Most submenu navigation lives inside each module's own page. Audit whether top-level shell sidebar should expose deeper links. |
| UI-004 | 🔴 | Medium | 30+ SCM components call `HttpClient` directly instead of feature services | Inconsistent error handling, no shared interceptor benefit. Mechanical refactor. |
| UI-005 | 🔴 | Medium | Module-level `_*-global.{scss,css}` files are not namespaced | Risk of style bleed across lazy-loaded modules. Wrap each in a module-scoped class selector. |
| UI-006 | ⚪ | Low | Source-of-truth drift: original `*-UI/` repos may have newer components than migrated libs | One-time re-sync audit needed before archiving the source repos. |

## Cross-cutting

| ID | Status | Severity | Title | Notes |
|----|--------|----------|-------|-------|
| X-001 | 🟢 | High | SCM Azure auth integration (interceptor, bootstrap guard, login bridge) | Completed. Posts to Azure `/api/auth/login` on shell login; interceptor handles 401→redirect. |
| X-002 | 🔴 | Medium | No global error boundary on shell `<router-outlet>` | An uncaught error in any lazy module breaks the whole shell. Add an `ErrorHandler` provider that logs and shows a recoverable error page. |
| X-003 | ⚪ | Low | No automated tests configured per lib | Nx scaffold exists but no specs run in CI. |

## Session-plan tasks (carry-over)

| ID | Status | Title |
|----|--------|-------|
| T006 | 🔴 | Verify and clean up — archive old `*-UI/` source repos once libs confirmed stable |
| FIX-008 | 🟢 | IDP dashboard loading/error states |
| FIX-009 | 🟢 | Shell→SCM JWT bridge |
| FIX-010 | 🟢 | scm-bootstrap.guard silent admin login |
| FIX-011 | 🟢 | POS sidebar 10-group / 51-item rebuild |
| FIX-012 | 🟢 | POS auth unification — shared AuthService + scoped interceptor + Site selector login |

---

## Module health snapshot

| Module | Routes | TS files | Backend | Backend status | Dashboard error-state |
|--------|--------|----------|---------|----------------|------------------------|
| Assets   | 65 | 93  | ASSETS-PSQL-API :3000 | 🟢 running         | 🔴 needs fix |
| SCM      | 30 | 106 | Azure (rep-scm-api)   | 🟢 running         | 🔴 needs fix |
| POS      | 59 | 108 | POS-API :3003         | 🟡 auth issue      | 🔴 needs fix |
| Payroll  | 49 | 69  | Express :6000         | 🟢 running         | 🔴 needs fix |
| IDP      | 14 | 21  | .NET :8008            | 🔴 /api/cycles 404 | 🟢 done       |
| Budget   | 39 | 39  | .NET :3001            | 🔴 port collision  | 🔴 needs fix |
| AFS      | 38 | 89  | Express :9000         | 🟢 running         | 🔴 needs fix |
| Insights | 44 | 46  | Express :6800         | 🟢 running         | 🔴 needs fix |

**Total: 338 routes / 571 TS files across 8 feature libs.**
