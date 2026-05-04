import { Routes } from '@angular/router';

export const OVERTIME_ROUTES: Routes = [
  { path: '', redirectTo: 'capture', pathMatch: 'full' },
  {
    path: 'setup',
    loadComponent: () =>
      import('./features/overtime/pages/overtime-setup/overtime-setup-tabs.component')
        .then(m => m.OvertimeSetupTabsComponent)
  },
  {
    path: 'capture',
    loadComponent: () =>
      import('./features/overtime/pages/overtime-capture/overtime-capture.component')
        .then(m => m.OvertimeCaptureComponent)
  },
  {
    path: 'capture/new',
    loadComponent: () =>
      import('./features/overtime/pages/overtime-capture-form/overtime-capture-form.component')
        .then(m => m.OvertimeCaptureFormComponent)
  },
  {
    path: 'capture/:id',
    loadComponent: () =>
      import('./features/overtime/pages/overtime-capture-form/overtime-capture-form.component')
        .then(m => m.OvertimeCaptureFormComponent)
  },
  {
    path: 'enquiry',
    loadComponent: () =>
      import('./features/overtime/pages/overtime-enquiry/overtime-enquiry.component')
        .then(m => m.OvertimeEnquiryComponent)
  },
  {
    path: 'payroll-processing',
    loadComponent: () =>
      import('./features/overtime/pages/overtime-payroll-processing/overtime-payroll-processing.component')
        .then(m => m.OvertimePayrollProcessingComponent)
  },
  {
    path: 'positions',
    loadComponent: () =>
      import('./features/overtime/pages/position-approval-setup/position-approval-setup.component')
        .then(m => m.PositionApprovalSetupComponent)
  },
  {
    path: 'access-denied',
    loadComponent: () =>
      import('./features/overtime/pages/access-denied/access-denied.component')
        .then(m => m.AccessDeniedComponent)
  }
];
