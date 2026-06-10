import { inject } from '@angular/core';
import { Routes, ResolveFn } from '@angular/router';
import { map, catchError, of } from 'rxjs';
import { ApiService } from './core/services/api.service';
import { PeriodFilterService } from './core/services/period-filter.service';
import { AuthService } from './core/services/auth.service';

// Monorepo adaptation: the AFS lib's standalone layout/shell.component (the only
// place that called loadFinancialYears() to populate PeriodFilterService) is NOT
// mounted in the monorepo — apps/shell provides the chrome and AFS_ROUTES is a flat
// list. As a result selectedFyId stayed '', so every compilation-gated page
// ("Data Sources (TB)", "Opening Balance Control", "Mapping Workbench",
// "Integrity Checks", …) reported "No Active Compilation". This resolver loads the
// current financial year and seeds the period filter BEFORE any AFS route activates
// (deterministic — also fixes direct navigation / reload, with no init race).
const afsContextResolver: ResolveFn<boolean> = () => {
  const pf = inject(PeriodFilterService);
  const api = inject(ApiService);
  const auth = inject(AuthService);
  // apps/shell owns login, so the AFS lib's AuthService is otherwise empty and
  // components that need user.tenantId (e.g. Mapping Workbench) fail their context
  // guard. Establish the embedded session here — mirrors auth.guard's embedded-mode
  // behaviour, but without its login redirect (which would break in the shell).
  if (!auth.isAuthenticated()) auth.setEmbeddedSession();
  if (pf.selectedFyId()) return true;
  return api.get<any[]>('/admin/financial-years').pipe(
    map((years) => {
      const list = years || [];
      const current = list.find((y: any) => y.isCurrent) || list[0];
      if (current) {
        pf.selectedFyId.set(current.id);
        pf.selectedFyLabel.set(current.label);
      }
      return true;
    }),
    catchError(() => of(true)),
  );
};

export const AFS_ROUTES: Routes = [
  {
    path: '',
    resolve: { afsContext: afsContextResolver },
    children: [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', loadComponent: () => import('./features/dashboards/dashboard-container.component').then(m => m.DashboardContainerComponent) },
  { path: 'dashboards/cfo-executive', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboards/afs-control', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboards/audit-management', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboards/rfi-management', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboards/audit-findings', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboards/financial-ratios', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'templates', loadComponent: () => import('./features/templates/templates.component').then(m => m.TemplatesComponent) },
  { path: 'templates/:id', loadComponent: () => import('./features/templates/template-detail.component').then(m => m.TemplateDetailComponent) },
  { path: 'templates/:id/style', loadComponent: () => import('./features/templates/template-style-editor.component').then(m => m.TemplateStyleEditorComponent) },
  { path: 'mappings', loadComponent: () => import('./features/mappings/mappings.component').then(m => m.MappingsComponent) },
  { path: 'compilations', loadComponent: () => import('./features/compilations/compilations.component').then(m => m.CompilationsComponent) },
  { path: 'compilations/:id', loadComponent: () => import('./features/compilations/compilation-detail.component').then(m => m.CompilationDetailComponent) },
  { path: 'compilations/:id/preview', loadComponent: () => import('./features/compilations/afs-preview.component').then(m => m.AfsPreviewComponent) },
  { path: 'compilations/:id/index', loadComponent: () => import('./features/compilations/afs-index.component').then(m => m.AfsIndexComponent) },
  { path: 'working-papers', loadComponent: () => import('./features/working-papers/working-papers.component').then(m => m.WorkingPapersComponent) },
  { path: 'rfis', loadComponent: () => import('./features/rfis/rfis.component').then(m => m.RfisComponent) },
  { path: 'findings', loadComponent: () => import('./features/findings/findings.component').then(m => m.FindingsComponent) },
  { path: 'documents', loadComponent: () => import('./features/document-management/document-management.component').then(m => m.DocumentManagementComponent) },
  { path: 'evidence', redirectTo: 'documents', pathMatch: 'full' },
  { path: 'adjustments', loadComponent: () => import('./features/adjustments/adjustments.component').then(m => m.AdjustmentsComponent) },
  { path: 'exports', loadComponent: () => import('./features/exports/exports.component').then(m => m.ExportsComponent) },
  { path: 'reports', loadComponent: () => import('./features/reports/reports.component').then(m => m.ReportsComponent) },
  { path: 'admin', loadComponent: () => import('./features/admin/admin.component').then(m => m.AdminComponent) },
  { path: 'admin/validation-rules', loadComponent: () => import('./features/admin/validation-rules.component').then(m => m.ValidationRulesComponent) },
  { path: 'mscoa', loadComponent: () => import('./features/mscoa/mscoa.component').then(m => m.MscoaComponent) },
  { path: 'general-information', loadComponent: () => import('./features/general-information/general-information.component').then(m => m.GeneralInformationComponent) },
  { path: 'abbreviations', redirectTo: 'general-information', pathMatch: 'full' },
  { path: 'mappings/fullscreen', redirectTo: 'mapping-studio', pathMatch: 'full' },
  { path: 'accounting-policies', loadComponent: () => import('./features/accounting-policies/accounting-policies.component').then(m => m.AccountingPoliciesComponent) },
  { path: 'integrity', loadComponent: () => import('./features/dashboard/integrity-checks.component').then(m => m.IntegrityChecksComponent) },
  { path: 'tb-import-workbench', loadComponent: () => import('./features/tb-import-workbench/tb-import-workbench.component').then(m => m.TbImportWorkbenchComponent) },
  { path: 'opening-balance-control', loadComponent: () => import('./features/opening-balance-control/opening-balance-control.component').then(m => m.OpeningBalanceControlComponent) },
  { path: 'mapping-workbench', loadComponent: () => import('./features/mapping-workbench/mapping-workbench.component').then(m => m.MappingWorkbenchComponent) },
  { path: 'mapping-studio', loadComponent: () => import('./features/mapping-workbench/mapping-studio-fullscreen.component').then(m => m.MappingStudioFullscreenComponent) },
  { path: 'afs-versions', loadComponent: () => import('./features/afs-versions/afs-versions.component').then(m => m.AfsVersionsComponent) },
  { path: 'review/:token', loadComponent: () => import('./features/review/external-review.component').then(m => m.ExternalReviewComponent) },
    ],
  },
];
