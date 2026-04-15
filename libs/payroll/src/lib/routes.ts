import { Routes } from '@angular/router';

  export const PAYROLL_ROUTES: Routes = [
    {
      path: '',
      loadComponent: () => import('./payroll-landing.component').then(m => m.PayrollLandingComponent)
    }
  ];
  