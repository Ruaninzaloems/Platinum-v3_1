import { Routes } from '@angular/router';

  export const AFS_ROUTES: Routes = [
    {
      path: '',
      loadComponent: () => import('./afs-landing.component').then(m => m.AfsLandingComponent)
    }
  ];
  