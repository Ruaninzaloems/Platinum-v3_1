import { Routes } from '@angular/router';

  export const ASSETS_ROUTES: Routes = [
    {
      path: '',
      loadComponent: () => import('./assets-landing.component').then(m => m.AssetsLandingComponent)
    }
  ];
  