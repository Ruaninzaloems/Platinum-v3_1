import { Routes } from '@angular/router';
import { canAccessConfigGuard, canAccessCaptureGuard, canAccessPayrollGuard, canAccessEnquiryGuard } from '../../core/guards/permission.guard';

export const OVERTIME_ROUTES: Routes = [
  {
    path: 'setup',
    canActivate: [canAccessConfigGuard],
    loadComponent: () =>
      import('./pages/overtime-setup/overtime-setup-tabs.component')
        .then(m => m.OvertimeSetupTabsComponent)
  },
  {
    path: 'capture',
    canActivate: [canAccessCaptureGuard],
    loadComponent: () =>
      import('./pages/overtime-capture/overtime-capture.component')
        .then(m => m.OvertimeCaptureComponent)
  },
  {
    path: 'capture/new',
    canActivate: [canAccessCaptureGuard],
    loadComponent: () =>
      import('./pages/overtime-capture-form/overtime-capture-form.component')
        .then(m => m.OvertimeCaptureFormComponent)
  },
  {
    path: 'capture/:id',
    canActivate: [canAccessCaptureGuard],
    loadComponent: () =>
      import('./pages/overtime-capture-form/overtime-capture-form.component')
        .then(m => m.OvertimeCaptureFormComponent)
  },
  {
    path: 'enquiry',
    canActivate: [canAccessEnquiryGuard],
    loadComponent: () =>
      import('./pages/overtime-enquiry/overtime-enquiry.component')
        .then(m => m.OvertimeEnquiryComponent)
  },
  {
    path: 'payroll-processing',
    canActivate: [canAccessPayrollGuard],
    loadComponent: () =>
      import('./pages/overtime-payroll-processing/overtime-payroll-processing.component')
        .then(m => m.OvertimePayrollProcessingComponent)
  },
  {
    path: 'access-denied',
    loadComponent: () =>
      import('./pages/access-denied/access-denied.component')
        .then(m => m.AccessDeniedComponent)
  },
  { path: '', pathMatch: 'full', redirectTo: 'capture' }
];
