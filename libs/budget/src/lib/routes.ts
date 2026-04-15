import { Routes } from '@angular/router';

  export const BUDGET_ROUTES: Routes = [
    {
      path: '',
      loadComponent: () => import('./budget-landing.component').then(m => m.BudgetLandingComponent)
    }
  ];
  