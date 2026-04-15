import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent) },
  {
    path: '',
    loadComponent: () => import('./layout/shell.component').then(m => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'dashboards/executive', loadComponent: () => import('./features/dashboard/executive-dashboard.component').then(m => m.ExecutiveDashboardComponent) },
      { path: 'dashboards/department', loadComponent: () => import('./features/dashboard/department-dashboard.component').then(m => m.DepartmentDashboardComponent) },
      { path: 'dashboards/overview', loadComponent: () => import('./features/dashboard/overview-dashboard.component').then(m => m.OverviewDashboardComponent) },

      { path: 'config/cycles', loadComponent: () => import('./features/config/cycles.component').then(m => m.CyclesComponent) },
      { path: 'config/kpi-groups', loadComponent: () => import('./features/config/kpi-groups.component').then(m => m.KpiGroupsComponent) },
      { path: 'config/units', loadComponent: () => import('./features/config/units.component').then(m => m.UnitsComponent) },
      { path: 'config/data-types', loadComponent: () => import('./features/config/data-types.component').then(m => m.DataTypesComponent) },
      { path: 'config/statuses', loadComponent: () => import('./features/config/statuses.component').then(m => m.StatusesComponent) },
      { path: 'config/scorecard-types', loadComponent: () => import('./features/config/scorecard-types.component').then(m => m.ScorecardTypesComponent) },

      { path: 'org-planning/scorecards', loadComponent: () => import('./features/sdbip/org-kpi-planning.component').then(m => m.OrgKpiPlanningComponent) },
      { path: 'org-planning/review-sdbip', loadComponent: () => import('./features/sdbip/review-sdbip.component').then(m => m.ReviewSdbipComponent) },
      { path: 'org-planning/approve-sdbip', loadComponent: () => import('./features/sdbip/approve-sdbip.component').then(m => m.ApproveSdbipComponent) },
      { path: 'org-planning/quarterly-targets', loadComponent: () => import('./features/sdbip/quarterly-targets.component').then(m => m.QuarterlyTargetsComponent) },
      { path: 'revised-sdbip/capture', loadComponent: () => import('./features/sdbip/revise-sdbip-capture.component').then(m => m.ReviseSdbipCaptureComponent) },
      { path: 'revised-sdbip/review', loadComponent: () => import('./features/sdbip/revise-sdbip-review.component').then(m => m.ReviseSdbipReviewComponent) },
      { path: 'revised-sdbip/approve', loadComponent: () => import('./features/sdbip/revise-sdbip-approve.component').then(m => m.ReviseSdbipApproveComponent) },
      { path: 'sdbip/overview', loadComponent: () => import('./features/sdbip/sdbip-overview.component').then(m => m.SdbipOverviewComponent) },

      { path: 'actuals/submit', loadComponent: () => import('./features/actuals/actuals-capture.component').then(m => m.ActualsCaptureComponent) },
      { path: 'actuals/review-line-manager', loadComponent: () => import('./features/actuals/review-line-manager.component').then(m => m.ReviewLineManagerComponent) },
      { path: 'actuals/review-director', loadComponent: () => import('./features/actuals/review-director.component').then(m => m.ReviewDirectorComponent) },
      { path: 'actuals/review-pms-manager', loadComponent: () => import('./features/actuals/review-pms-manager.component').then(m => m.ReviewPmsManagerComponent) },
      { path: 'actuals/review-pms-director', loadComponent: () => import('./features/actuals/review-pms-director.component').then(m => m.ReviewPmsDirectorComponent) },
      { path: 'actuals/review-internal-audit', loadComponent: () => import('./features/actuals/review-internal-audit.component').then(m => m.ReviewInternalAuditComponent) },
      { path: 'actuals/corrective-actions', loadComponent: () => import('./features/actuals/corrective-actions.component').then(m => m.CorrectiveActionsComponent) },

      { path: 'individual/my-performance', loadComponent: () => import('./features/individual/my-performance.component').then(m => m.MyPerformanceComponent) },
      { path: 'individual/agreements', loadComponent: () => import('./features/individual/agreements.component').then(m => m.AgreementsComponent) },
      { path: 'individual/reviewers', loadComponent: () => import('./features/individual/reviewers.component').then(m => m.ReviewersComponent) },
      { path: 'individual/competencies', loadComponent: () => import('./features/individual/competencies.component').then(m => m.CompetenciesComponent) },
      { path: 'individual/assessments', loadComponent: () => import('./features/individual/assessments.component').then(m => m.AssessmentsComponent) },

      { path: 'weightings/nkpa', loadComponent: () => import('./features/weightings/nkpa-weightings.component').then(m => m.NkpaWeightingsComponent) },
      { path: 'weightings/competencies', loadComponent: () => import('./features/weightings/competency-requirements.component').then(m => m.CompetencyRequirementsComponent) },
      { path: 'deadlines/submissions', loadComponent: () => import('./features/config/submission-deadlines.component').then(m => m.SubmissionDeadlinesComponent) },
      { path: 'deadlines/report-fields', loadComponent: () => import('./features/config/report-fields.component').then(m => m.ReportFieldsComponent) },

      { path: 'moderation/queue', loadComponent: () => import('./features/moderation/review-queue.component').then(m => m.ReviewQueueComponent) },
      { path: 'moderation/panel', loadComponent: () => import('./features/moderation/moderation-panel.component').then(m => m.ModerationPanelComponent) },

      { path: 'reports/centre', loadComponent: () => import('./features/reports/report-centre.component').then(m => m.ReportCentreComponent) },
      { path: 'notifications', loadComponent: () => import('./features/notifications/notification-centre.component').then(m => m.NotificationCentreComponent) },
      { path: 'notifications/config', loadComponent: () => import('./features/notifications/notification-config.component').then(m => m.NotificationConfigComponent) },
      { path: 'audit-trail', loadComponent: () => import('./features/audit-trail/audit-trail.component').then(m => m.AuditTrailComponent) },
      { path: 'ai-insights', loadComponent: () => import('./features/ai-insights/ai-insights.component').then(m => m.AiInsightsComponent) },
      { path: 'integrations', loadComponent: () => import('./features/integrations/integration-hub.component').then(m => m.IntegrationHubComponent) },
      { path: 'admin/workflows', loadComponent: () => import('./features/admin/workflow-config.component').then(m => m.WorkflowConfigComponent) },

      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
