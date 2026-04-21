import { Routes } from '@angular/router';
import { authGuard } from '@platinumv3/shared/auth';
import { LoginComponent } from './features/login/login.component';
import { NotFoundComponent } from './features/not-found/not-found.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  // Supplier-login is lazy via deep file path — keeps SCM_ROUTES/guards out
  // of the initial bundle AND prevents its Material deps (stepper, form-field,
  // input, button, icon, select, checkbox, progress-bar, divider) from being
  // pulled into /login, which was saturating the browser's 6-connection HTTP/1.1
  // limit and queueing the login POST behind the chunk waterfall.
  {
    path: 'supplier-login',
    loadComponent: () =>
      import('../../../../libs/scm/src/lib/features/auth/supplier-login/supplier-login.component')
        .then(m => m.SupplierLoginComponent)
  },
  {
    path: '',
    // canMatch (not canActivate) so the shell + dashboard chunks are NEVER
    // requested for unauthenticated users — the guard redirects to /login
    // before any feature code is fetched. Feature modules below remain
    // loadChildren so each module is only downloaded the first time the
    // user navigates to it after logging in.
    canMatch: [authGuard],
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
