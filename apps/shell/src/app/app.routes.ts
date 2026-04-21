import { Routes } from '@angular/router';
import { NotFoundComponent } from './features/not-found/not-found.component';

export const routes: Routes = [
  // Login is disabled — every visitor lands directly inside the shell with
  // an auto-created local admin session. The legacy /login and
  // /supplier-login URLs redirect to the dashboard so old links keep working.
  { path: 'login', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'supplier-login', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: '',
    loadComponent: () => import('./layout/shell.component').then(m => m.ShellComponent),
    children: [
      { path: 'pos-view', redirectTo: 'pos', pathMatch: 'full' },
      { path: 'scm-view', redirectTo: 'scm', pathMatch: 'full' },
      { path: 'payroll-view', redirectTo: 'payroll', pathMatch: 'full' },
      { path: 'idp-view', redirectTo: 'idp', pathMatch: 'full' },
      { path: 'insights-view', redirectTo: 'ins', pathMatch: 'full' },
      { path: 'budget-view', redirectTo: 'budget', pathMatch: 'full' },
      { path: 'afs-view', redirectTo: 'afs', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'assets', loadChildren: () => import('@platinumv3/assets').then(m => m.ASSETS_ROUTES) },
      { path: 'scm', loadChildren: () => import('@platinumv3/scm').then(m => m.SCM_ROUTES) },
      { path: 'pos', loadChildren: () => import('@platinumv3/pos').then(m => m.POS_ROUTES) },
      { path: 'payroll', loadChildren: () => import('@platinumv3/payroll').then(m => m.PAYROLL_ROUTES) },
      { path: 'idp', loadChildren: () => import('@platinumv3/idp').then(m => m.IDP_ROUTES) },
      { path: 'budget', loadChildren: () => import('@platinumv3/budget').then(m => m.BUDGET_ROUTES) },
      { path: 'afs', loadChildren: () => import('@platinumv3/afs').then(m => m.AFS_ROUTES) },
      { path: 'ins', loadChildren: () => import('@platinumv3/ins').then(m => m.INS_ROUTES) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: '**', component: NotFoundComponent }
    ]
  },
  { path: '**', component: NotFoundComponent }
];
