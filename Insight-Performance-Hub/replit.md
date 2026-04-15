# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Frontend**: React 19 + Vite + Tailwind CSS v4 + Wouter + TanStack React Query
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle for API), Vite (frontend)
- **Design System**: Platinum SCM (navy #0f2b46 primary, gold #c9a84c accent, Inter font)

## Application

**Organisational Performance Management** — municipal performance management module aligned to National Treasury mSCOA minimum business requirements. Covers SDBIP, departmental/individual performance management, dashboards, and AI analytics across 4 phases.

### Phase 1 (Foundation & Configuration) — COMPLETE
- Performance cycles (financial years with Draft/Open/Closed/Archived status)
- KPI groups (hierarchical with parent/child)
- Units of measure, data types, progress statuses, scorecard types
- NKPA weightings (organisational & departmental scope, 100% validation)
- Competency requirements (weighted, 100% validation)
- Submission deadlines (quarterly, Q1–Q4)
- Report field configuration (quarterly/midYear/annual)
- Notification centre and notification config
- Audit trail (searchable, filterable)
- Dashboard with KPI summary cards and performance trend chart

### Authentication & Authorisation
- Header-based auth: `X-User` header identifies the user
- In dev mode, auto-defaults to `admin` user
- In production, `X-User` header is required
- `requirePermission()` middleware enforces RBAC on all mutating routes
- `"*"` wildcard for system_admin role
- Seed script auto-creates 11 roles + admin user on first start

### Phase 2 (Org Planning, SDBIP & Actuals) — COMPLETE
- Scorecards CRUD + KPI management (Draft→Submitted→Reviewed→Approved workflow)
- KPI fields: kpiNumber, description, idpReference, strategicObjective, programme, baseline, annualTarget, weighting, evidenceSource, evidencePortfolio, fundingSource, budgetDescription, annualBudgetTarget
- SDBIP management: full 7-state workflow (Draft→Submitted→Internal Review→Approved Baseline→In-Year Monitoring→Adjustment→Final Approved Revision)
- SDBIP revision with baseline preservation in sdbip_revisions table
- Auto-generate SDBIP items from approved scorecards
- Quarterly actuals capture with deadline enforcement and late override reason
- Evidence upload with Pending→Verified/Rejected workflow
- Corrective & remedial actions tracking (Open→In Progress→Completed)
- Quarterly targets (Q1-Q4) per KPI with cumulative/period type
- Monthly activities beneath quarterly targets

### Phase 3 (Departmental Performance, Moderation & Dashboards) — COMPLETE
- Departmental scorecards (Draft→Submitted→Approved→Locked workflow, inherit org KPIs)
- Departmental KPI management (add/remove/inherit from parent org scorecard)
- Review queue (approve/return/comment with mandatory return reason)
- Moderation panel (Confirmed/Adjusted/Rejected outcomes, score adjustment with reason)
- Period locks (lock/unlock quarters with audit trail, mandatory reopen reason)
- Executive Dashboard (weighted performance, pie chart, underperforming KPIs, department league table)
- Department Dashboard (overall score, evidence completeness, KPI heatmap by quarter, trend chart)
- Overview Dashboard (org summary, quarterly comparison bar chart, exceptions list)
- Report Centre (generate quarterly/mid-year/annual/institutional-evaluation reports)

### Phase 4 (Individual Performance, AI Analytics & Integrations) — COMPLETE
- Individual performance agreements (Draft→Submitted→Approved→Locked workflow)
- Employee KPAs (Key Performance Areas) and KPIs per agreement
- Reviewer assignments (primary/secondary, versioned, with change history)
- Competency templates and items (by post level, weighted)
- Employee competency scoring (self, reviewer, moderated)
- Individual assessment records (quarterly/mid-year/annual with KPI + competency scores)
- Individual moderation (accepted/adjusted/referred outcomes)
- AI Advisory Dashboard (at-risk KPI predictor, narrative summariser, evidence gap detector, alignment checker)
- AI insight log (tracks all generated insights)
- Integration Hub (HR sync stub, mSCOA budget pull stub, IDP objectives search)
- Integration sync log
- Workflow step configuration (approval steps, role requirements)
- Individual performance dashboard (status breakdown, department scores)

### 11 Roles
System Admin, Performance Admin, Municipal Manager, HOD, Departmental Coordinator, Responsible Post, Custodian, Reviewer, HR Admin, Audit Viewer, Council Read-only

### Navigation Modules (sidebar)
Phase 1-2: Dashboard, Configuration, Weightings, Deadlines, Notifications, Audit Trail, Org Planning (KPI Scorecards, SDBIP Overview), Actuals & Evidence (Submit Actuals, Evidence Upload, Corrective Actions)
Phase 3: Departmental (Dept Scorecards, KPI Assignments), Dashboards (Executive, Department, Overview), Moderation (Review Queue, Moderation Panel), Reports (Report Centre, Standard Reports, Custom Reports)
Phase 4: Individual (My Performance, Agreements, Reviewer Config, Competencies, Assessments), AI Insights, Integrations, Admin (User Management, Role Permissions, Workflow Config)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server
│   └── perf-app/           # React+Vite frontend (Platinum design system)
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## TypeScript & Composite Projects

Every library package uses `composite: true` with `emitDeclarationOnly`. Before typechecking api-server or perf-app, build the lib declarations first:

```bash
pnpm --filter @workspace/db exec tsc --build
pnpm --filter @workspace/api-zod exec tsc --build
pnpm --filter @workspace/api-client-react exec tsc --build
pnpm --filter @workspace/api-server exec tsc --noEmit
pnpm --filter @workspace/perf-app exec tsc --noEmit
```

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server with all Phase 1 CRUD endpoints.

- Entry: `src/index.ts` (calls seed + starts server)
- Seed: `src/seed.ts` (creates roles, permissions, admin user on first start)
- Routes: `src/routes/index.ts` mounts sub-routers (auth, cycles, kpi-config, weightings, deadlines, audit, notifications, scorecards, sdbip, actuals, month-activities, dept-scorecards, reviews, moderation, period-locks, dashboards, reports, agreements, individual-reviews, competency-templates, ai-insights, integrations, workflow-config)
- Health: `GET /api/healthz`
- Auth: `src/middleware/auth.ts` — X-User header lookup, dev-mode auto-admin
- Depends on: `@workspace/db`, `@workspace/api-zod`

### `artifacts/perf-app` (`@workspace/perf-app`)

React + Vite frontend with Platinum SCM design system.

- Layout: 240px sidebar, 56px toolbar, breadcrumb bar
- Pages: Dashboard, 6 config screens, 2 weighting screens, 2 deadline screens, notifications, notification config, audit trail, OrgKpiPlanning, SdbipOverview, ActualsCapture, EvidenceUpload, CorrectiveActions, DeptScorecards, ReviewQueue, ModerationPanel, ExecDashboard, DeptDashboard, OverviewDashboard, ReportCentre, plus placeholder pages for Phase 4+
- Uses generated React Query hooks from `@workspace/api-client-react`
- UI Components: shadcn/ui pattern (dialog, select, table, badge, card, etc.)

### `lib/db` (`@workspace/db`)

Database layer — Drizzle ORM with PostgreSQL.

Tables: users, roles, role_permissions, performance_cycles, kpi_groups, units_of_measure, kpi_data_types, progress_statuses, scorecard_types, nkpa_weightings, competency_requirements, submission_deadlines, report_fields, audit_logs, notifications, notification_configs, scorecards, scorecard_kpis, kpi_quarter_targets, kpi_month_activities, sdbip_items, sdbip_revisions, kpi_quarter_actuals, kpi_evidence_documents, kpi_variances, remedial_action_plans, constraint_register, dept_scorecards, dept_scorecard_kpis, kpi_review_submissions, kpi_moderation_outcomes, period_locks, report_runs, individual_performance_agreements, employee_kpas, employee_kpis, reviewer_assignments, competency_templates, competency_template_items, employee_competency_scores, individual_assessment_records, moderation_records_individual, ai_insight_log, integration_sync_log, workflow_step_configs

### `lib/api-spec` (`@workspace/api-spec`)

OpenAPI 3.1 spec and Orval codegen config.

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from OpenAPI. Used by api-server for request/response validation.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client from OpenAPI.

**Important**: Orval forces `title = "Api"` — do not change the spec title.

### `scripts` (`@workspace/scripts`)

Utility scripts. Run via `pnpm --filter @workspace/scripts run <script>`.
