import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'employees', loadComponent: () => import('./features/employees/components/employee-list.component').then(m => m.EmployeeListComponent) },
      { path: 'employees/:id', loadComponent: () => import('./features/employees/components/employee-detail.component').then(m => m.EmployeeDetailComponent) },
      { path: 'organogram', loadComponent: () => import('./features/organogram/components/organogram.component').then(m => m.OrganogramComponent) },
      { path: 'job-profiles', loadComponent: () => import('./features/jobprofiles/components/job-profiles.component').then(m => m.JobProfilesComponent) },
      { path: 'positions', loadComponent: () => import('./features/positions/components/positions.component').then(m => m.PositionsComponent) },

      { path: 'salary-structure', loadComponent: () => import('./features/salary-structure/components/salary-structure.component').then(m => m.SalaryStructureComponent) },
      { path: 'payroll/payslip-view', loadComponent: () => import('./features/payroll/components/employee-payslip-view/employee-payslip-view.component').then(m => m.EmployeePayslipViewComponent) },
      { path: 'payroll/wages', loadComponent: () => import('./features/payroll/components/wages/wages.component').then(m => m.WagesComponent) },
      { path: 'payroll/claims', loadComponent: () => import('./features/payroll/components/claims/claims.component').then(m => m.ClaimsComponent) },
      { path: 'payroll/run', loadComponent: () => import('./features/payroll/components/payroll-run/payroll-run.component').then(m => m.PayrollRunComponent) },
      { path: 'payroll', pathMatch: 'full', loadComponent: () => import('./features/payroll/components/payroll.component').then(m => m.PayrollComponent) },
      { path: 'leave', loadComponent: () => import('./features/leave/components/leave.component').then(m => m.LeaveComponent) },
      { path: 'benefits', loadComponent: () => import('./features/benefits/components/benefits.component').then(m => m.BenefitsComponent) },
      { path: 'medical-aid-schemes', loadComponent: () => import('./features/medical-aid-schemes/components/medical-aid-schemes.component').then(m => m.MedicalAidSchemesComponent) },
      { path: 'retirement-funds', loadComponent: () => import('./features/retirement-funds/components/retirement-funds.component').then(m => m.RetirementFundsComponent) },
      { path: 'trade-unions', loadComponent: () => import('./features/trade-unions/components/trade-unions.component').then(m => m.TradeUnionsComponent) },
      { path: 'pay-points', loadComponent: () => import('./features/pay-points/components/pay-points.component').then(m => m.PayPointsComponent) },
      { path: 'time', loadComponent: () => import('./features/time/components/time.component').then(m => m.TimeComponent) },
      { path: 'performance', loadComponent: () => import('./features/performance/components/performance.component').then(m => m.PerformanceComponent) },
      { path: 'reports', loadComponent: () => import('./features/reports/components/reports.component').then(m => m.ReportsComponent) },
      { path: 'disciplinary', loadComponent: () => import('./features/disciplinary/components/disciplinary.component').then(m => m.DisciplinaryComponent) },
      { path: 'skills', loadComponent: () => import('./features/skills/components/skills.component').then(m => m.SkillsComponent) },
      { path: 'recruitment', loadComponent: () => import('./features/recruitment/components/recruitment.component').then(m => m.RecruitmentComponent) },
      { path: 'ess', loadComponent: () => import('./features/ess/components/ess.component').then(m => m.EssComponent) },
      {
        path: 'settings',
        children: [
          { path: '', redirectTo: 'municipality', pathMatch: 'full' },
          { path: 'municipality', loadComponent: () => import('./features/settings/components/municipality.component').then(m => m.MunicipalityComponent) },
          { path: 'constants', loadComponent: () => import('./features/settings/components/constants.component').then(m => m.ConstantsComponent) },
          { path: 'employee-types', loadComponent: () => import('./features/settings/components/employee-types.component').then(m => m.EmployeeTypesComponent) },
          { path: 'task-grades', loadComponent: () => import('./features/settings/components/task-grades.component').then(m => m.TaskGradesComponent) },
          { path: 'conditions', loadComponent: () => import('./features/settings/components/conditions.component').then(m => m.ConditionsComponent) },
          { path: 'tax', loadComponent: () => import('./features/settings/components/tax-tables.component').then(m => m.TaxTablesComponent) },
          { path: 'irp5-source-codes', loadComponent: () => import('./features/settings/components/irp5-source-codes.component').then(m => m.Irp5SourceCodesComponent) },
          { path: 'leave-types', loadComponent: () => import('./features/settings/components/leave-types.component').then(m => m.LeaveTypesSettingsComponent) },
          { path: 'salary-heads', loadComponent: () => import('./features/settings/components/salary-heads.component').then(m => m.SalaryHeadsComponent) },
          { path: 'salary-trans-groups', loadComponent: () => import('./features/settings/components/salary-trans-groups.component').then(m => m.SalaryTransGroupsComponent) },
          { path: 'upper-limits', loadComponent: () => import('./features/settings/components/upper-limits.component').then(m => m.UpperLimitsComponent) },
          { path: 'leave-policies', loadComponent: () => import('./features/settings/components/leave-policies.component').then(m => m.LeavePoliciesComponent) },
          { path: 'claim-rates', loadComponent: () => import('./features/settings/components/claim-rates.component').then(m => m.ClaimRatesComponent) },
          { path: 'claim-configurations', loadComponent: () => import('./features/settings/components/claim-configurations.component').then(m => m.ClaimConfigurationsComponent) },
          { path: 'gl-integration', loadComponent: () => import('./features/settings/components/gl-integration.component').then(m => m.GlIntegrationComponent) },
          { path: 'bank', loadComponent: () => import('./features/settings/components/bank.component').then(m => m.BankComponent) },
          { path: 'security', loadComponent: () => import('./features/settings/components/security.component').then(m => m.SecurityComponent) },
          { path: 'workflows', loadComponent: () => import('./features/settings/components/workflows.component').then(m => m.WorkflowsComponent) },
          { path: 'payroll-cycles', loadComponent: () => import('./features/settings/components/payroll-cycles.component').then(m => m.PayrollCyclesComponent) },
          { path: 'tax-year-setup', loadComponent: () => import('./features/settings/components/tax-year-setup.component').then(m => m.TaxYearSetupComponent) },
          { path: 'employment-changes', loadComponent: () => import('./features/employment-changes/components/employment-changes.component').then(m => m.EmploymentChangesComponent) },
          { path: 'data-conversion', loadComponent: () => import('./features/settings/components/data-conversion.component').then(m => m.DataConversionComponent) },
        ]
      },
    ]
  },
  { path: '**', redirectTo: '' }
];
