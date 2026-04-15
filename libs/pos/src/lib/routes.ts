import { Routes } from '@angular/router';

  export const POS_ROUTES: Routes = [
    {
      path: '',
      loadComponent: () => import('./pos-landing.component').then(m => m.PosLandingComponent)
    }
  ];
  