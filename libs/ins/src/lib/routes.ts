import { Routes } from '@angular/router';
import { InsDashboardComponent } from './features/dashboard/dashboard.component';

// All Performance routes render the embedded React perf-app iframe.
// The PerfFrame component reads the current URL after `/ins` and points the
// iframe at `/perf-app/<rest>?embedded=1`, so the existing shell sidebar drives
// navigation while the React app provides every page.
export const INS_ROUTES: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: '**', component: InsDashboardComponent },
];
