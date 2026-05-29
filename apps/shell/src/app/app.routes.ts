import { Routes } from '@angular/router';
import { NotFoundComponent } from './features/not-found/not-found.component';

export const routes: Routes = [
  // Login is disabled — every visitor lands directly inside the shell with
  // an auto-created local admin session. The legacy /login and
  // /supplier-login URLs redirect to the dashboard so old links keep working.
  { path: 'login', loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent) },
  // Dedicated popup redirect page for MSAL — must stay outside the shell so no
  // navigation or handleRedirectPromise() fires, allowing the main window to
  // read the auth code from the popup URL and close it automatically.
  { path: 'auth-redirect', loadComponent: () => import('./features/auth-redirect/auth-redirect.component').then(m => m.AuthRedirectComponent) },
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
      // Legacy /<module>-app/** URLs (from the old standalone-app era) → new module paths.
      // The `**` wildcard matches arbitrary remaining segments so /idp-app/foo/bar/baz redirects too.
      { path: 'pos-app', redirectTo: 'pos', pathMatch: 'full' },
      { path: 'pos-app/**', redirectTo: 'pos' },
      { path: 'scm-app', redirectTo: 'scm', pathMatch: 'full' },
      { path: 'scm-app/**', redirectTo: 'scm' },
      { path: 'payroll-app', redirectTo: 'payroll', pathMatch: 'full' },
      { path: 'payroll-app/**', redirectTo: 'payroll' },
      { path: 'idp-app', redirectTo: 'idp', pathMatch: 'full' },
      { path: 'idp-app/**', redirectTo: 'idp' },
      { path: 'insights-app', redirectTo: 'ins', pathMatch: 'full' },
      { path: 'insights-app/**', redirectTo: 'ins' },
      { path: 'budget-app', redirectTo: 'budget', pathMatch: 'full' },
      { path: 'budget-app/**', redirectTo: 'budget' },
      { path: 'afs-app', redirectTo: 'afs', pathMatch: 'full' },
      { path: 'afs-app/**', redirectTo: 'afs' },
      { path: 'overtime-app', redirectTo: 'overtime', pathMatch: 'full' },
      { path: 'overtime-app/**', redirectTo: 'overtime' },
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'assets', loadChildren: () => import('@platinumv3/assets').then(m => m.ASSETS_ROUTES) },
      { path: 'scm', loadChildren: () => import('@platinumv3/scm').then(m => m.SCM_ROUTES) },
      { path: 'pos', loadChildren: () => import('@platinumv3/pos').then(m => m.POS_ROUTES) },
      { path: 'payroll', loadChildren: () => import('@platinumv3/payroll').then(m => m.PAYROLL_ROUTES) },
      { path: 'idp', loadChildren: () => import('@platinumv3/idp').then(m => m.IDP_ROUTES) },
      { path: 'budget', loadChildren: () => import('@platinumv3/budget').then(m => m.BUDGET_ROUTES) },
      { path: 'afs', loadChildren: () => import('@platinumv3/afs').then(m => m.AFS_ROUTES) },
      { path: 'ins', loadChildren: () => import('@platinumv3/ins').then(m => m.INS_ROUTES) },
      { path: 'overtime', loadChildren: () => import('@platinumv3/overtime').then(m => m.OVERTIME_ROUTES) },
      { path: 'sharepoint', loadComponent: () => import('./features/sharepoint/sharepoint.component').then(m => m.SharepointComponent) },
      { path: 'sharepoint/uat-assets', loadComponent: () => import('./features/sharepoint/uat-assets.component').then(m => m.UatAssetsComponent) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: '**', component: NotFoundComponent }
    ]
  },
  { path: '**', component: NotFoundComponent }
];
