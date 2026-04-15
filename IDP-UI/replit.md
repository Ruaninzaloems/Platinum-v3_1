# Platinum ERP - IDP Management Module

## Overview
Comprehensive Integrated Development Plan (IDP) module for Platinum ERP, targeting George Municipality following the MSCOA minimum business process specification (Sections 5.1–5.9, 6, 7). Features full IDP lifecycle management from cycle creation through GoMuni submission, with auditable workflow state machines, Configurable Project Prioritisation Framework, and Platinum branding.

## Architecture
- **Frontend**: Angular 21 (standalone components, signal-based state, lazy-loaded routes)
- **Backend**: .NET Core 10 Web API (EF Core + Npgsql)
- **Database**: PostgreSQL (provisioned via Replit)
- **Design System**: Platinum branding (Navy #0f2b46, Gold #c9a84c), Inter font, Material Icons

## MSCOA Spec Coverage
| Section | Feature | Component |
|---------|---------|-----------|
| 5.1 | IDP Cycle Management | CyclesComponent — Draft→In Review→Approved for Distribution→Adopted→Revised |
| 5.2 | Process Plan | ProcessPlanComponent — 5 phases, milestones, evidence, validation |
| 5.3 | Strategic Objectives & Projects | ObjectivesComponent + ProjectsComponent — KPIs, baselines, funding |
| 5.4 | Public Participation | CommentsComponent — 5 statuses, responses, escalation |
| 5.5 | Draft IDP Compilation | DraftIdpComponent — generation, content viewer, submit for review |
| 5.6 | Draft Approval | ApprovalsComponent — sequential approval chain |
| 5.7 | Final IDP | FinalIdpComponent — resolution metadata, version stamp, lock |
| 5.8 | Final Approval | ApprovalsComponent — adoption workflow |
| 5.9 | GoMuni Submission | GoMuniComponent — upload, validation checklist, reference tracking |
| 6 | Data Model | All 19 entity models with audit fields |
| 7 | Workflow State Machines | WorkflowController — Draft/Final IDP state machines |
| — | Project Prioritisation | PriorityConfigComponent + PrioritisationComponent — weighted criteria, AI blending, drag-rank, budget simulator |

## Project Structure
```
PlatinumIDP/                     # .NET Web API backend (port 3000)
  Program.cs                     # App entry, DB setup, CORS
  Data/
    IdpDbContext.cs               # EF Core context, 17 table mappings
    SeedData.cs                   # George Municipality seed data (incl. priority framework)
  Models/                        # 19 entity models with audit fields
    IdpCycle.cs                  # RevisionNumber, IsLocked, status workflow
    IdpProcessPhase.cs           # 5 required phases
    IdpMilestone.cs              # IsMandatory, EvidenceUrl
    IdpStrategicObjective.cs     # NDP/Provincial alignment
    IdpProject.cs                # Classification, FundingSourceSummary, PriorityRanking, OverrideRank, MSCOA segments, GPS
    MscoaSegment.cs              # MSCOA chart of accounts (Project/Fund/Region segments)
    ProjectObjectiveLink.cs      # Many-to-many project-objective % allocation
    IdpProjectIndicator.cs       # Baseline, Y1-Y5 targets, ResponsibleOfficial
    IdpPublicComment.cs          # LinkedProjectId, LinkedObjectiveId, 5 statuses
    IdpCommentResponse.cs        # Response with official attribution
    IdpDocumentVersion.cs        # ContentJson, ResolutionMetadata, lock
    IdpWorkflowTask.cs           # Sequential approval chain
    IdpSubmissionLog.cs          # GoMuni file metadata, validation
    IdpAuditLog.cs               # Entity audit trail
    PriorityFramework.cs         # Version-controlled framework definitions, AI mode/weights
    PriorityCriteria.cs          # Configurable criteria with categories and weights
    PriorityScoringScale.cs      # Configurable scoring scale labels (3/5/10-point)
    PriorityProjectScore.cs      # Per-project per-criteria scores (human + AI + blended)
    PriorityFrameworkAudit.cs    # Framework configuration change audit trail
  Controllers/                   # 13 REST API controllers
    CyclesController.cs          # CRUD + status transitions + dashboard
    PhasesController.cs          # Phase progress validation
    MilestonesController.cs      # Status with evidence validation
    ObjectivesController.cs      # CRUD with project links
    ProjectsController.cs        # CRUD + KPI validation + objective-links endpoints
    IndicatorsController.cs      # CRUD for project KPIs
    MscoaController.cs           # MSCOA segment CRUD (Project/Fund/Region hierarchies)
    CommentsController.cs        # Status workflow + responses
    DocumentsController.cs       # Draft/Final generation + lock
    WorkflowController.cs        # Submit/approve/reject tasks
    SubmissionsController.cs     # GoMuni submission CRUD
    AuditController.cs           # Audit log queries
    PriorityController.cs        # Framework CRUD, criteria, scale, AI config, weight validation, audit
    PriorityScoresController.cs  # Score projects, composite calc, AI recommendations, rankings, budget simulation

platinum-idp-client/             # Angular 21 SPA frontend (port 5000)
  src/
    app/
      core/
        models/idp.models.ts     # 20 TypeScript interfaces matching .NET models
        services/api.service.ts  # 55+ HTTP methods for all endpoints (incl. prioritisation)
        services/cycle-state.service.ts  # Signal-based active cycle state
      layout/layout.ts           # 240px sidebar + 56px toolbar, nav groups (incl. PRIORITISATION)
      features/
        dashboard/dashboard.ts   # 5 KPI cards, process pipeline, participation summary, framework card, top ranked, quick actions, audit trail
        cycles/cycles.ts         # Cycle CRUD, status workflow buttons, lock indicator
        process-plan/process-plan.ts  # Phase stepper, milestone CRUD, progress validation
        objectives/objectives.ts # Card grid, NDP tags, linked projects
        projects/projects.ts     # KPI strip, data table, indicator management, validation
        spatial-report/spatial-report.ts  # Leaflet map with project markers
        comments/comments.ts     # Filter chips, comment cards, response workflow
        draft-idp/draft-idp.ts   # Generate, content viewer, submit for review
        approvals/approvals.ts   # Workflow stepper, approve/reject actions
        final-idp/final-idp.ts   # Resolution metadata, generate final, lock
        gomuni/gomuni.ts         # Upload checklist, submission history, ref tracking
        priority-config/priority-config.ts  # Framework CRUD, criteria management, weight sliders, scale config, AI config, audit trail
        prioritisation/prioritisation.ts    # Scoring board, drag-and-rank, budget simulator, AI recommendations
    styles.scss                  # Global Platinum CSS variables and shared styles
    index.html                   # Material Icons + Inter font + Leaflet CDN
  proxy.conf.json               # Dev proxy: /api -> http://127.0.0.1:3000
  angular.json                  # allowedHosts: true

start.sh                        # Startup script (runs both servers)
```

## Running
- `start.sh` launches .NET backend on port 3000 and Angular dev server on port 5000
- Angular proxies `/api/*` requests to the .NET backend
- Webview is configured on port 5000

## Database
- **Dual-provider support**: PostgreSQL (Replit/dev) and SQL Server (production)
- Provider auto-detected from `DATABASE_URL` format, or forced via `DB_PROVIDER` env var (`postgres` or `sqlserver`)
- PostgreSQL tables: `idp_cycles_ef`, `priority_frameworks_ef`, etc. (no prefix)
- SQL Server tables: `tbl_idp_cycles_ef`, `tbl_priority_frameworks_ef`, etc. (`tbl_` prefix)
- SQL Server DDL script: `Database/mssql_create_tables.sql`
- SQL Server cascade-path restrictions handled: some FKs use `NO ACTION` instead of `CASCADE`/`SET NULL`
- Uses auto-incrementing integer primary keys (INT IDENTITY on SQL Server, serial on PostgreSQL)
- All foreign key columns are INT (NOT NULL or NULL depending on relationship)
- All user-reference fields (CreatedBy, ModifiedBy, PerformedBy, ScoredBy, ChangedBy, CompletedBy, LockedBy) are INT NULL
- All models have audit fields: CreatedBy, CreatedDate, ModifiedBy, ModifiedDate, VersionNo, Status
- `EnsureCreated()` on startup — creates tables only if they don't exist; data is preserved across restarts; no EF migrations
- Seed data: George Municipality with 5 phases, 10 milestones, 5 objectives, 6 projects, 6 KPIs, 7 comments, 62 MSCOA segments, 10 project-objective links, 1 priority framework with 7 criteria, 6-point scale, 21 project scores

## Prioritisation Framework
- **Composite Formula**: `sum(criteriaWeight × blendedScore) / 100`
- **Blended Score**: `(humanScore × humanWeight + aiScore × aiWeight) / 100`
- **Weight Validation**: Active criteria weights MUST sum to exactly 100% — save blocked if not
- **Default 7 Treasury Criteria**: Strategic Alignment (25%), Service Delivery Impact (20%), Community Need (15%), Legislative Compliance (10%), Financial Feasibility (15%), Implementation Readiness (10%), Delivery Risk (5%)
- **AI Modes**: Disabled (human-only), Advisory (show AI recommendations), Blended (weighted mix)
- **Budget Simulator**: Rank-ordered projects with threshold slider for funding cut-off analysis
- **Override Rank**: Manual drag-rank override persisted on IdpProject.OverrideRank

## Key Design Decisions
- Standalone Angular components with ViewEncapsulation.None for global style access
- Signal-based state management (no NgRx)
- Lazy-loaded feature routes
- Material Icons via CSS class `.material-icon` (not Angular Material)
- All CSS variables use `--platinum-*` prefix
- Component-specific styles use `app-component-name` selector prefix
- Dynamic data-testid uses `[attr.data-testid]` binding
- Leaflet 1.9.4 loaded via CDN with `declare var L: any`
- GPS coordinates (double precision) on IdpProject for spatial mapping

## Status Values (PascalCase)
- **Cycles**: Draft, In Review, Approved for Distribution, Adopted, Revised
- **Comments**: Received, Under Review, Responded, Closed, Escalated
- **Milestones**: Not Started, In Progress, Completed
- **Documents**: Draft, Generated, In Review, Approved, Approved for Distribution, Approved for Adoption, Adopted, Locked, Rejected
- **Workflow Tasks**: Pending, Approved, Rejected
- **Submissions**: Draft, Submitted, Validated, Rejected
- **Priority Frameworks**: Draft, Active, Archived

## SQL Server DDL
- `Database/mssql_create_tables.sql` — Complete MS SQL Server CREATE TABLE script for all 19 tables
- Idempotent (`IF NOT EXISTS` checks), ordered by FK dependency, compatible with SQL Server 2016+
- Uses `INT IDENTITY(1,1)` PKs, `INT` FKs, `NVARCHAR`, `DATETIME2`, `DECIMAL`, `FLOAT`, `BIT`
