import { Routes } from '@angular/router';
import { AppLayoutComponent } from './layout/app-layout/app-layout.component';
import { authGuard, accessGuard } from './core/guards/auth.guard';

const placeholder = (title: string) => ({
  loadComponent: () =>
    import('./features/_shared/placeholder.component').then((m) => m.PlaceholderComponent),
  data: { title },
});

export const APP_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/_shared/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    component: AppLayoutComponent,
    canActivate: [authGuard],
    canActivateChild: [accessGuard],
    children: [
      // Dashboard
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
        data: { title: 'Dashboard' },
      },

      // Configuration
      { path: 'config/cycles', loadComponent: () => import('./features/config/performance-cycles.component').then((m) => m.PerformanceCyclesComponent), data: { title: 'Performance Cycles' } },
      { path: 'config/kpi-groups', loadComponent: () => import('./features/config/kpi-groups.component').then((m) => m.KpiGroupsComponent), data: { title: 'KPI Groups' } },
      { path: 'config/units', loadComponent: () => import('./features/config/units-of-measure.component').then((m) => m.UnitsOfMeasureComponent), data: { title: 'Units of Measure' } },
      { path: 'config/data-types', loadComponent: () => import('./features/config/data-types.component').then((m) => m.DataTypesComponent), data: { title: 'Data Types' } },
      { path: 'config/statuses', loadComponent: () => import('./features/config/progress-statuses.component').then((m) => m.ProgressStatusesComponent), data: { title: 'Progress Statuses' } },
      { path: 'config/scorecard-types', loadComponent: () => import('./features/config/scorecard-types.component').then((m) => m.ScorecardTypesComponent), data: { title: 'Scorecard Types' } },
      { path: 'config/indicator-descriptions', ...placeholder('Indicator Technical Descriptions') },

      // Weightings
      { path: 'weightings/nkpa', loadComponent: () => import('./features/weightings/nkpa-weightings.component').then((m) => m.NkpaWeightingsComponent), data: { title: 'NKPA Weightings' } },
      { path: 'weightings/competencies', loadComponent: () => import('./features/weightings/competency-requirements.component').then((m) => m.CompetencyRequirementsComponent), data: { title: 'Competency Requirements' } },

      // Deadlines
      { path: 'deadlines/submissions', loadComponent: () => import('./features/deadlines/submission-deadlines.component').then((m) => m.SubmissionDeadlinesComponent), data: { title: 'Submission Deadlines' } },
      { path: 'deadlines/report-fields', loadComponent: () => import('./features/deadlines/report-fields.component').then((m) => m.ReportFieldsComponent), data: { title: 'Report Fields' } },

      // Notifications + Audit
      { path: 'notifications', loadComponent: () => import('./features/notifications/notification-centre.component').then((m) => m.NotificationCentreComponent), data: { title: 'Notification Centre' } },
      { path: 'notifications/config', loadComponent: () => import('./features/notifications/notification-config.component').then((m) => m.NotificationConfigComponent), data: { title: 'Notification Settings' } },
      { path: 'audit-trail', loadComponent: () => import('./features/audit/audit-trail.component').then((m) => m.AuditTrailComponent), data: { title: 'Audit Trail' } },

      // Org Planning
      { path: 'org-planning/scorecards', loadComponent: () => import('./features/org-planning/capture-sdbip.component').then((m) => m.CaptureSdbipComponent), data: { title: 'Capture SDBIP' } },
      { path: 'org-planning/review-sdbip', loadComponent: () => import('./features/org-planning/review-sdbip.component').then((m) => m.ReviewSdbipComponent), data: { title: 'Review SDBIP' } },
      { path: 'org-planning/approve-sdbip', loadComponent: () => import('./features/org-planning/approve-sdbip.component').then((m) => m.ApproveSdbipComponent), data: { title: 'Approve SDBIP' } },
      { path: 'org-planning/quarterly-targets', loadComponent: () => import('./features/org-planning/quarterly-targets.component').then((m) => m.QuarterlyTargetsComponent), data: { title: 'Targets & Activities' } },
      { path: 'revised-sdbip/capture', ...placeholder('Revise SDBIP') },
      { path: 'revised-sdbip/review', ...placeholder('Review Revised SDBIP') },
      { path: 'revised-sdbip/approve', ...placeholder('Approve Revised SDBIP') },
      { path: 'sdbip/overview', loadComponent: () => import('./features/sdbip/sdbip-overview.component').then((m) => m.SdbipOverviewComponent), data: { title: 'SDBIP Overview' } },

      // Departmental
      { path: 'departmental/scorecards', ...placeholder('Departmental Scorecards') },
      { path: 'departmental/kpi-assignments', ...placeholder('KPI Assignments') },

      // Individual
      { path: 'individual/my-performance', ...placeholder('My Performance') },
      { path: 'individual/agreements', ...placeholder('Individual Agreements') },
      { path: 'individual/reviewers', loadComponent: () => import('./features/individual/reviewer-config.component').then((m) => m.ReviewerConfigComponent), data: { title: 'Reviewer Configuration' } },
      { path: 'individual/competencies', ...placeholder('Competency Templates') },
      { path: 'individual/assessments', ...placeholder('Individual Assessment') },

      // Actuals
      { path: 'actuals/submit', ...placeholder('Submit Actuals') },
      { path: 'actuals/review-line-manager', ...placeholder('Review — Line Manager') },
      { path: 'actuals/review-director', ...placeholder('Review — Director') },
      { path: 'actuals/review-pms-manager', ...placeholder('Review — PMS Manager') },
      { path: 'actuals/review-pms-director', ...placeholder('Review — PMS Director') },
      { path: 'actuals/review-internal-audit', ...placeholder('Review — Internal Audit') },
      { path: 'actuals/corrective-actions', ...placeholder('Corrective Actions') },

      // Moderation
      { path: 'moderation/queue', loadComponent: () => import('./features/moderation/review-queue.component').then((m) => m.ReviewQueueComponent), data: { title: 'Review Queue' } },
      { path: 'moderation/panel', loadComponent: () => import('./features/moderation/moderation-panel.component').then((m) => m.ModerationPanelComponent), data: { title: 'Moderation Panel' } },

      // Dashboards / Reports / AI / Integrations
      { path: 'dashboards/executive', loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent), data: { title: 'Executive Dashboard' } },
      { path: 'dashboards/department', loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent), data: { title: 'Department Dashboard' } },
      { path: 'dashboards/overview', loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent), data: { title: 'Overview Dashboard' } },
      { path: 'reports/centre', loadComponent: () => import('./features/reports/report-centre.component').then((m) => m.ReportCentreComponent), data: { title: 'Report Centre' } },
      { path: 'reports/standard', ...placeholder('Standard Reports') },
      { path: 'reports/custom', ...placeholder('Custom Reports') },
      { path: 'ai-insights', loadComponent: () => import('./features/ai/ai-insights.component').then((m) => m.AiInsightsComponent), data: { title: 'AI Insights' } },
      { path: 'integrations', loadComponent: () => import('./features/integrations/integration-hub.component').then((m) => m.IntegrationHubComponent), data: { title: 'Integration Hub' } },

      // Admin
      { path: 'admin/users', ...placeholder('User Management') },
      { path: 'admin/roles', ...placeholder('Role Permissions') },
      { path: 'admin/workflows', loadComponent: () => import('./features/admin/workflow-config.component').then((m) => m.WorkflowConfigComponent), data: { title: 'Workflow Configuration' } },

      // Access denied
      { path: 'access-denied', loadComponent: () => import('./features/_shared/access-denied.component').then((m) => m.AccessDeniedComponent), data: { title: 'Access Denied' } },

      // Fallback
      { path: '**', loadComponent: () => import('./features/_shared/not-found.component').then((m) => m.NotFoundComponent) },
    ],
  },
];
