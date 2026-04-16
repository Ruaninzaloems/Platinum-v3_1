import { Routes } from '@angular/router';
import { authGuard } from '@platinumv3/shared/auth';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent) },
  {
    path: '',
    loadComponent: () => import('./layout/shell.component').then(m => m.ShellComponent),
    canActivate: [authGuard],
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
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
