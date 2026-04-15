import { Routes } from '@angular/router';

  export const SCM_ROUTES: Routes = [
    {
      path: '',
      loadComponent: () => import('./scm-landing.component').then(m => m.ScmLandingComponent)
    }
  ];
  