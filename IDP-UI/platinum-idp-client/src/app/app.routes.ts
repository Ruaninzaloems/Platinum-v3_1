import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard').then(m => m.DashboardComponent) },
      { path: 'cycles', loadComponent: () => import('./features/cycles/cycles').then(m => m.CyclesComponent) },
      { path: 'process-plan', loadComponent: () => import('./features/process-plan/process-plan').then(m => m.ProcessPlanComponent) },
      { path: 'objectives', loadComponent: () => import('./features/objectives/objectives').then(m => m.ObjectivesComponent) },
      { path: 'projects', loadComponent: () => import('./features/projects/projects').then(m => m.ProjectsComponent) },
      { path: 'spatial-report', loadComponent: () => import('./features/spatial-report/spatial-report').then(m => m.SpatialReportComponent) },
      { path: 'comments', loadComponent: () => import('./features/comments/comments').then(m => m.CommentsComponent) },
      { path: 'draft-idp', loadComponent: () => import('./features/draft-idp/draft-idp').then(m => m.DraftIdpComponent) },
      { path: 'approvals', loadComponent: () => import('./features/approvals/approvals').then(m => m.ApprovalsComponent) },
      { path: 'final-idp', loadComponent: () => import('./features/final-idp/final-idp').then(m => m.FinalIdpComponent) },
      { path: 'gomuni', loadComponent: () => import('./features/gomuni/gomuni').then(m => m.GoMuniComponent) },
      { path: 'priority-config', loadComponent: () => import('./features/priority-config/priority-config').then(m => m.PriorityConfigComponent) },
      { path: 'prioritisation', loadComponent: () => import('./features/prioritisation/prioritisation').then(m => m.PrioritisationComponent) },
    ]
  },
];
