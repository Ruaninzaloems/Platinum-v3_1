import { Routes } from '@angular/router';

  export const IDP_ROUTES: Routes = [
    {
      path: '',
      loadComponent: () => import('./idp-landing.component').then(m => m.IdpLandingComponent)
    }
  ];
  