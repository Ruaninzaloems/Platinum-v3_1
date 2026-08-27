import { Routes } from '@angular/router';
import { accessGuard } from './core/guards/auth.guard';

// Performance is native shell code as of 2026-08-26 (PerformanceSync.md Pass 3) --
// it used to vendor perf-app wholesale and embed it via an <iframe>, which produced
// a double sidebar/topbar (the shell's own chrome plus perf-app's own). Every route
// below is a real ported Angular component under features/, reachable directly
// through the shell's own router and sidebar (see shell.component.ts's
// `insightsNav`) -- there is no iframe boundary left in this module.
//
// The standalone `perf-app` (Insight-Performance-Hub/artifacts/perf-app) is still
// the SOURCE for future syncs -- see PerformanceSync.md -- but it is no longer
// what's rendered here. Its own layout/login/auth-guard/interceptor are
// deliberately NOT ported: the shell provides chrome and the shared
// @platinumv3/shared/auth AuthService provides identity, same as every other
// module. `accessGuard` below is the one piece of perf-app-specific logic kept --
// role-based section visibility within the module, analogous to Overtime's
// canAccessCapture-style permission flags.

const placeholder = (title: string) => ({
  loadComponent: () =>
    import('./features/_shared/placeholder.component').then((m) => m.PlaceholderComponent),
  data: { title },
});

export const INS_ROUTES: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: '',
    canActivateChild: [accessGuard],
    children: [
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent), data: { title: 'Dashboard' } },

      // Configuration
      { path: 'config', loadComponent: () => import('./features/config/config-home.component').then((m) => m.ConfigHomeComponent), data: { title: 'Configuration' } },
      { path: 'config/cycles', loadComponent: () => import('./features/config/performance-cycles.component').then((m) => m.PerformanceCyclesComponent), data: { title: 'Performance Cycles' } },
      { path: 'config/kpi-groups', loadComponent: () => import('./features/config/kpi-groups.component').then((m) => m.KpiGroupsComponent), data: { title: 'KPI Groups' } },
      { path: 'config/national-kpas', loadComponent: () => import('./features/config/national-kpas.component').then((m) => m.NationalKpasComponent), data: { title: 'National KPAs' } },
      { path: 'config/units', loadComponent: () => import('./features/config/units-of-measure.component').then((m) => m.UnitsOfMeasureComponent), data: { title: 'Units of Measure' } },
      { path: 'config/data-types', loadComponent: () => import('./features/config/data-types.component').then((m) => m.DataTypesComponent), data: { title: 'Data Types' } },
      { path: 'config/statuses', loadComponent: () => import('./features/config/progress-statuses.component').then((m) => m.ProgressStatusesComponent), data: { title: 'Progress Statuses' } },
      { path: 'config/scorecards', loadComponent: () => import('./features/config/scorecards-config.component').then((m) => m.ScorecardsConfigComponent), data: { title: 'Scorecards' } },
      { path: 'config/scorecard-types', loadComponent: () => import('./features/config/scorecard-types.component').then((m) => m.ScorecardTypesComponent), data: { title: 'Scorecard Types' } },
      { path: 'config/indicator-descriptions', ...placeholder('Indicator Technical Descriptions') },
      { path: 'config/kpi-scoring', loadComponent: () => import('./features/config/kpi-scoring.component').then((m) => m.KpiScoringComponent), data: { title: 'KPI Scoring & Rating Thresholds' } },
      { path: 'config/sdbip-compliance', loadComponent: () => import('./features/config/sdbip-compliance.component').then((m) => m.SdbipComplianceComponent), data: { title: 'SDBIP Compliance Reference' } },

      // Weightings
      { path: 'weightings/competencies', loadComponent: () => import('./features/weightings/competency-requirements.component').then((m) => m.CompetencyRequirementsComponent), data: { title: 'Competency Requirements' } },

      // Deadlines
      { path: 'deadlines/submissions', loadComponent: () => import('./features/deadlines/submission-deadlines.component').then((m) => m.SubmissionDeadlinesComponent), data: { title: 'Submission Deadlines' } },
      { path: 'deadlines/report-fields', loadComponent: () => import('./features/deadlines/report-fields.component').then((m) => m.ReportFieldsComponent), data: { title: 'Report Fields' } },

      // Notifications + Audit
      { path: 'notifications', loadComponent: () => import('./features/notifications/notification-centre.component').then((m) => m.NotificationCentreComponent), data: { title: 'Notification Centre' } },
      { path: 'notifications/config', loadComponent: () => import('./features/notifications/notification-config.component').then((m) => m.NotificationConfigComponent), data: { title: 'Notification Settings' } },
      { path: 'audit-trail', loadComponent: () => import('./features/audit/audit-trail.component').then((m) => m.AuditTrailComponent), data: { title: 'Audit Trail' } },

      // Org Planning / SDBIP / Revised SDBIP
      { path: 'org-planning/scorecards', loadComponent: () => import('./features/org-planning/capture-sdbip.component').then((m) => m.CaptureSdbipComponent), data: { title: 'Compile SDBIP' } },
      { path: 'org-planning/review-sdbip', loadComponent: () => import('./features/org-planning/review-sdbip.component').then((m) => m.ReviewSdbipComponent), data: { title: 'SDBIP Review' } },
      { path: 'org-planning/approve-sdbip', loadComponent: () => import('./features/org-planning/approve-sdbip.component').then((m) => m.ApproveSdbipComponent), data: { title: 'Approve SDBIP' } },
      { path: 'org-planning/quarterly-targets', loadComponent: () => import('./features/org-planning/quarterly-targets.component').then((m) => m.QuarterlyTargetsComponent), data: { title: 'Targets & Activities' } },
      { path: 'revised-sdbip/capture', loadComponent: () => import('./features/revised-sdbip/revise-sdbip-capture.component').then((m) => m.ReviseSdbipCaptureComponent), data: { title: 'Revise SDBIP' } },
      { path: 'revised-sdbip/review', loadComponent: () => import('./features/revised-sdbip/revise-sdbip-review.component').then((m) => m.ReviseSdbipReviewComponent), data: { title: 'Review Revised SDBIP' } },
      { path: 'revised-sdbip/approve', loadComponent: () => import('./features/revised-sdbip/revise-sdbip-approve.component').then((m) => m.ReviseSdbipApproveComponent), data: { title: 'Approve Revised SDBIP' } },
      { path: 'sdbip/overview', loadComponent: () => import('./features/sdbip/sdbip-overview.component').then((m) => m.SdbipOverviewComponent), data: { title: 'SDBIP Overview' } },

      // Departmental
      { path: 'departmental/scorecards', loadComponent: () => import('./features/departmental/dept-scorecards.component').then((m) => m.DeptScorecardsComponent), data: { title: 'Departmental Scorecards' } },
      { path: 'departmental/review', loadComponent: () => import('./features/departmental/dept-review.component').then((m) => m.DeptReviewComponent), data: { title: 'Review Departmental Scorecards' } },

      // Individual
      { path: 'individual/my-performance', loadComponent: () => import('./features/individual/individual-agreements.component').then((m) => m.IndividualAgreementsComponent), data: { title: 'My Performance' } },
      { path: 'individual/agreements', loadComponent: () => import('./features/individual/individual-agreements.component').then((m) => m.IndividualAgreementsComponent), data: { title: 'Individual Agreements' } },
      { path: 'individual/reviewers', loadComponent: () => import('./features/individual/reviewer-config.component').then((m) => m.ReviewerConfigComponent), data: { title: 'Reviewer Configuration' } },
      { path: 'individual/competencies', loadComponent: () => import('./features/individual/competency-templates.component').then((m) => m.CompetencyTemplatesComponent), data: { title: 'Competency Templates' } },
      { path: 'individual/assessments', loadComponent: () => import('./features/individual/individual-assessment.component').then((m) => m.IndividualAssessmentComponent), data: { title: 'Individual Assessment' } },

      // Actuals
      { path: 'actuals/submit', loadComponent: () => import('./features/actuals/submit-actuals.component').then((m) => m.SubmitActualsComponent), data: { title: 'Submit Actuals' } },
      { path: 'actuals/assess/:kpiId', loadComponent: () => import('./features/actuals/assess-actual.component').then((m) => m.AssessActualComponent), data: { title: 'Assessment' } },
      { path: 'actuals/review-line-manager', loadComponent: () => import('./features/actuals/actuals-review.component').then((m) => m.ActualsReviewComponent), data: { title: 'Manager Review', reviewLevels: ['line_manager'], description: 'Review, approve or return KPI performance assessments submitted by administrators' } },
      { path: 'actuals/review-director', redirectTo: 'actuals/review-line-manager' },
      { path: 'actuals/review-pms-manager', loadComponent: () => import('./features/actuals/actuals-review.component').then((m) => m.ActualsReviewComponent), data: { title: 'PMS Review', reviewLevels: ['pms_manager'], description: 'Review actuals at the PMS Review stage. Approve to progress to Internal Audit or return with comments.' } },
      { path: 'actuals/review-pms-director', redirectTo: 'actuals/review-pms-manager' },
      { path: 'actuals/review-internal-audit', loadComponent: () => import('./features/actuals/actuals-review.component').then((m) => m.ActualsReviewComponent), data: { title: 'Internal Audit', reviewLevels: ['internal_audit'], description: 'Final audit review of actuals before approval. This is the last review level.' } },
      { path: 'actuals/corrective-actions', loadComponent: () => import('./features/actuals/corrective-actions.component').then((m) => m.CorrectiveActionsComponent), data: { title: 'Corrective Actions' } },

      // Mid-Year / Annual / Bulk Upload
      { path: 'mid-year/capture', loadComponent: () => import('./features/actuals/submit-actuals.component').then((m) => m.SubmitActualsComponent), data: { title: 'Mid-Year — Capture', periodType: 'mid_year' } },
      { path: 'mid-year/manager-review', loadComponent: () => import('./features/actuals/actuals-review.component').then((m) => m.ActualsReviewComponent), data: { title: 'Mid-Year — Manager Review', periodType: 'mid_year', reviewLevels: ['line_manager'], description: 'Review, approve or return mid-year KPI performance assessments submitted by administrators.' } },
      { path: 'mid-year/pms-review', loadComponent: () => import('./features/actuals/actuals-review.component').then((m) => m.ActualsReviewComponent), data: { title: 'Mid-Year — PMS Review', periodType: 'mid_year', reviewLevels: ['pms_manager'], description: 'Review mid-year actuals at the PMS Review stage. Approve to progress to Internal Audit or return with comments.' } },
      { path: 'mid-year/internal-audit', loadComponent: () => import('./features/actuals/actuals-review.component').then((m) => m.ActualsReviewComponent), data: { title: 'Mid-Year — Internal Audit', periodType: 'mid_year', reviewLevels: ['internal_audit'], description: 'Final audit review of mid-year actuals before approval. This is the last review level.' } },
      { path: 'annual/capture', ...placeholder('Annual — Capture') },
      { path: 'annual/manager-review', ...placeholder('Annual — Manager Review') },
      { path: 'annual/pms-review', ...placeholder('Annual — PMS Review') },
      { path: 'annual/internal-audit', ...placeholder('Annual — Internal Audit') },
      { path: 'bulk-upload', ...placeholder('Bulk Upload') },

      // Moderation
      { path: 'moderation/queue', loadComponent: () => import('./features/moderation/review-queue.component').then((m) => m.ReviewQueueComponent), data: { title: 'Review Queue' } },
      { path: 'moderation/panel', loadComponent: () => import('./features/moderation/moderation-panel.component').then((m) => m.ModerationPanelComponent), data: { title: 'Moderation Panel' } },

      // Dashboards / Reports / AI / Integrations
      { path: 'dashboards/executive', loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent), data: { title: 'Executive Dashboard' } },
      { path: 'dashboards/department', loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent), data: { title: 'Department Dashboard' } },
      { path: 'dashboards/overview', loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent), data: { title: 'Overview Dashboard' } },
      { path: 'reports/centre', loadComponent: () => import('./features/reports/report-centre.component').then((m) => m.ReportCentreComponent), data: { title: 'OPMS Reports' } },
      { path: 'reports/standard', ...placeholder('Standard Reports') },
      { path: 'reports/custom', ...placeholder('Custom Reports') },
      { path: 'ai-insights', loadComponent: () => import('./features/ai/ai-insights.component').then((m) => m.AiInsightsComponent), data: { title: 'AI Insights' } },
      { path: 'integrations', loadComponent: () => import('./features/integrations/integration-hub.component').then((m) => m.IntegrationHubComponent), data: { title: 'Integration Hub' } },

      // Admin
      { path: 'admin/users', loadComponent: () => import('./features/admin/employees.component').then((m) => m.EmployeesComponent), data: { title: 'Employees' } },
      { path: 'admin/departments', loadComponent: () => import('./features/admin/departments.component').then((m) => m.DepartmentsComponent), data: { title: 'Departments' } },
      { path: 'admin/roles', ...placeholder('Role Permissions') },
      { path: 'admin/workflows', loadComponent: () => import('./features/admin/workflow-config.component').then((m) => m.WorkflowConfigComponent), data: { title: 'Workflow Configuration' } },

      // Access denied
      { path: 'access-denied', loadComponent: () => import('./features/_shared/access-denied.component').then((m) => m.AccessDeniedComponent), data: { title: 'Access Denied' } },
    ],
  },
  { path: '**', loadComponent: () => import('./features/_shared/not-found.component').then((m) => m.NotFoundComponent) },
];
