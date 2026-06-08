import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { UiService } from '../../../core/services/ui.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { CurrencyZarPipe } from '../../../shared/pipes/currency-zar.pipe';
import { DateInputComponent } from '../../../shared/components/date-input/date-input.component';

@Component({
  selector: 'app-benefits',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, StatusBadgeComponent, CurrencyZarPipe, DateInputComponent],
  templateUrl: './benefits.component.html',
  styleUrl: './benefits.component.css'
})
export class BenefitsComponent implements OnInit {
  activeTab = 'retirement';
  schemes: any[] = [];
  funds: any[] = [];
  employees: any[] = [];
  loading = true;

  selectedEmployee = '';
  employeeBenefitsLoading = false;
  employeeMedical: any[] = [];
  employeeRetirement: any[] = [];
  employeeGroupLife: any[] = [];
  costSplit: any = null;

  groupLifeBenefits: any[] = [];
  groupLifeLoading = false;

  dependants: any[] = [];
  dependantsLoading = false;
  dependantsMembershipId: number | null = null;

  selectedRateScheme = '';
  rateTables: any[] = [];
  rateTablesLoading = false;

  selectedLifeEventEmployee = '';
  lifeEvents: any[] = [];
  lifeEventsLoading = false;

  projectionEmployee = '';
  projectionMonths = 12;
  projSalaryIncrease = 0;
  projNewSalary = 0;
  projMedicalChange = 0;
  projRetirementChange = 0;
  projectionResult: any = null;
  projectionLoading = false;

  reportsContent: any = null;
  reportsLoading = false;
  selectedReportEmployee = '';

  showEnrolMedicalModal = false;
  showEnrolRetirementModal = false;
  showEnrolGroupLifeModal = false;
  showAddDependantModal = false;
  addDependantMembershipId = 0;

  medEnrol = { scheme_id: '', membership_number: '', join_date: '' };
  retEnrol = { fund_type_id: '', fund_number: '', join_date: '', employee_amount: 0, employer_amount: 0 };
  glEnrol = { benefit_id: '', cover_amount: 0, employee_contribution: 0, employer_contribution: 0, start_date: '', beneficiary_name: '', beneficiary_id_number: '', beneficiary_relationship: '' };
  newDependant = { first_name: '', surname: '', id_number: '', date_of_birth: '', gender: 'MALE', dependant_type: 'SPOUSE', employer_contributes: false, start_date: '' };
  glBenefitOptions: any[] = [];

  vendors: any[] = [];

  tabs = [
    { id: 'retirement', label: 'Retirement Funds', icon: 'shield' },
    { id: 'group-life', label: 'Group Life / Risk Benefits', icon: 'shield' },
    { id: 'employee-benefits', label: 'Employee Benefits', icon: 'award' },
    { id: 'rateTables', label: 'Rate Tables', icon: 'layers' },
    { id: 'lifeEvents', label: 'Life Events', icon: 'calendar' },
    { id: 'costProjection', label: 'Cost Projection', icon: 'trendingUp' },
    { id: 'reports', label: 'Reports', icon: 'fileText' },
  ];

  constructor(private api: ApiService, private ui: UiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loading = true;
    this.api.get<any>('/benefits/medical-aid-schemes').subscribe({
      next: (d) => { this.schemes = d || []; this.checkLoaded(); this.cdr.detectChanges(); },
      error: () => { this.schemes = []; this.checkLoaded(); }
    });
    this.api.get<any>('/benefits/retirement-funds').subscribe({
      next: (d) => { this.funds = d || []; this.checkLoaded(); this.cdr.detectChanges(); },
      error: () => { this.funds = []; this.checkLoaded(); }
    });
    this.api.get<any>('/employees', { limit: 200, sort_by: 'surname', sort_order: 'asc' }).subscribe({
      next: (d) => { this.employees = (d as any)?.data || d || []; this.checkLoaded(); this.cdr.detectChanges(); },
      error: () => { this.employees = []; this.checkLoaded(); }
    });
    this.api.get<any>('/benefits/ems-vendors').subscribe({
      next: (d) => { this.vendors = d || []; this.checkLoaded(); this.cdr.detectChanges(); },
      error: () => { this.vendors = []; this.checkLoaded(); }
    });
  }

  vendorName(vendorId: any): string {
    if (!vendorId) return '-';
    const v = this.vendors.find(v => v.id === vendorId || v.id === parseInt(vendorId));
    return v ? v.name : `Vendor #${vendorId}`;
  }

  private loadCount = 0;
  private checkLoaded(): void {
    this.loadCount++;
    if (this.loadCount >= 4) this.loading = false; this.cdr.detectChanges();
  }

  setTab(tab: string): void {
    this.activeTab = tab;
    if (tab === 'group-life') this.loadGroupLife();
  }

  loadGroupLife(): void {
    this.groupLifeLoading = true;
    this.api.get<any>('/benefits/group-life').subscribe({
      next: (d) => { this.groupLifeBenefits = d || []; this.groupLifeLoading = false;  this.cdr.detectChanges(); },
      error: () => { this.groupLifeBenefits = []; this.groupLifeLoading = false; }
    });
  }

  onEmployeeSelect(): void {
    if (!this.selectedEmployee) return;
    this.employeeBenefitsLoading = true;
    const empId = this.selectedEmployee;
    let loaded = 0;
    const check = () => { loaded++; if (loaded >= 4) this.employeeBenefitsLoading = false; };

    this.api.get<any>(`/benefits/employee/${empId}/medical-aid`).subscribe({
      next: (d) => { this.employeeMedical = d || []; check();  this.cdr.detectChanges(); },
      error: () => { this.employeeMedical = []; check(); }
    });
    this.api.get<any>(`/benefits/employee/${empId}/retirement-funds`).subscribe({
      next: (d) => { this.employeeRetirement = d || []; check();  this.cdr.detectChanges(); },
      error: () => { this.employeeRetirement = []; check(); }
    });
    this.api.getRaw<any>(`/benefits/employee/${empId}/group-life`).subscribe({
      next: (res) => { this.employeeGroupLife = res.data || []; check();  this.cdr.detectChanges(); },
      error: () => { this.employeeGroupLife = []; check(); }
    });
    this.api.getRaw<any>(`/benefits/cost-split/${empId}`).subscribe({
      next: (res) => { this.costSplit = res.data; check();  this.cdr.detectChanges(); },
      error: () => { this.costSplit = null; check(); }
    });
  }

  getEmployeeName(): string {
    const emp = this.employees.find(e => e.id == this.selectedEmployee);
    return emp ? `${emp.first_name} ${emp.surname}` : '';
  }

  viewDependants(membershipId: number): void {
    this.dependantsMembershipId = membershipId;
    this.dependantsLoading = true;
    this.api.get<any>(`/benefits/employee/${this.selectedEmployee}/medical-aid/${membershipId}/dependants`).subscribe({
      next: (d) => { this.dependants = d || []; this.dependantsLoading = false;  this.cdr.detectChanges(); },
      error: () => { this.dependants = []; this.dependantsLoading = false; }
    });
  }

  openEnrolMedical(): void {
    if (!this.selectedEmployee) { this.ui.toast('warning', 'Select Employee', 'Please select an employee first'); return; }
    this.medEnrol = { scheme_id: '', membership_number: '', join_date: new Date().toISOString().split('T')[0] };
    this.showEnrolMedicalModal = true;
  }

  submitMedicalEnrolment(): void {
    if (!this.medEnrol.scheme_id) { this.ui.toast('error', 'Validation', 'Please select a scheme'); return; }
    this.api.post(`/benefits/employee/${this.selectedEmployee}/medical-aid`, {
      scheme_id: parseInt(this.medEnrol.scheme_id),
      membership_number: this.medEnrol.membership_number,
      join_date: this.medEnrol.join_date,
    }).subscribe({
      next: () => { this.ui.toast('success', 'Enrolled', 'Employee enrolled on medical aid successfully'); this.showEnrolMedicalModal = false; this.onEmployeeSelect(); },
      error: (err) => this.ui.toast('error', 'Error', 'Failed to enrol')
    });
  }

  openEnrolRetirement(): void {
    if (!this.selectedEmployee) { this.ui.toast('warning', 'Select Employee', 'Please select an employee first'); return; }
    this.retEnrol = { fund_type_id: '', fund_number: '', join_date: new Date().toISOString().split('T')[0], employee_amount: 0, employer_amount: 0 };
    this.showEnrolRetirementModal = true;
  }

  submitRetirementEnrolment(): void {
    if (!this.retEnrol.fund_type_id) { this.ui.toast('error', 'Validation', 'Please select a fund'); return; }
    this.api.post(`/benefits/employee/${this.selectedEmployee}/retirement-funds`, {
      fund_type_id: parseInt(this.retEnrol.fund_type_id),
      fund_number: this.retEnrol.fund_number,
      join_date: this.retEnrol.join_date,
      employee_amount: this.retEnrol.employee_amount || 0,
      employer_amount: this.retEnrol.employer_amount || 0,
    }).subscribe({
      next: () => { this.ui.toast('success', 'Enrolled', 'Employee enrolled on retirement fund'); this.showEnrolRetirementModal = false; this.onEmployeeSelect(); },
      error: () => this.ui.toast('error', 'Error', 'Failed to enrol')
    });
  }

  async openEnrolGroupLife(): Promise<void> {
    if (!this.selectedEmployee) { this.ui.toast('warning', 'Select Employee', 'Please select an employee first'); return; }
    this.glEnrol = { benefit_id: '', cover_amount: 0, employee_contribution: 0, employer_contribution: 0, start_date: '1900-01-01', beneficiary_name: '', beneficiary_id_number: '', beneficiary_relationship: '' };
    this.api.get<any>('/benefits/group-life').subscribe({
      next: (d) => { this.glBenefitOptions = d || []; this.showEnrolGroupLifeModal = true;  this.cdr.detectChanges(); },
      error: () => { this.glBenefitOptions = []; this.showEnrolGroupLifeModal = true; }
    });
  }

  submitGroupLifeEnrolment(): void {
    if (!this.glEnrol.benefit_id) { this.ui.toast('error', 'Validation', 'Please select a benefit'); return; }
    this.api.post(`/benefits/employee/${this.selectedEmployee}/group-life`, {
      benefit_id: parseInt(this.glEnrol.benefit_id),
      cover_amount: this.glEnrol.cover_amount || 0,
      employee_contribution: this.glEnrol.employee_contribution || 0,
      employer_contribution: this.glEnrol.employer_contribution || 0,
      start_date: this.glEnrol.start_date,
      beneficiary_name: this.glEnrol.beneficiary_name || null,
      beneficiary_id_number: this.glEnrol.beneficiary_id_number || null,
      beneficiary_relationship: this.glEnrol.beneficiary_relationship || null,
    }).subscribe({
      next: () => { this.ui.toast('success', 'Enrolled', 'Employee enrolled on group life benefit'); this.showEnrolGroupLifeModal = false; this.onEmployeeSelect(); },
      error: () => this.ui.toast('error', 'Error', 'Failed to enrol')
    });
  }

  openAddDependant(membershipId: number): void {
    this.addDependantMembershipId = membershipId;
    this.newDependant = { first_name: '', surname: '', id_number: '', date_of_birth: '', gender: 'MALE', dependant_type: 'SPOUSE', employer_contributes: false, start_date: '1900-01-01' };
    this.showAddDependantModal = true;
  }

  submitAddDependant(): void {
    if (!this.newDependant.first_name || !this.newDependant.surname) { this.ui.toast('error', 'Validation', 'Name is required'); return; }
    this.api.post(`/benefits/employee/${this.selectedEmployee}/medical-aid/${this.addDependantMembershipId}/dependants`, this.newDependant).subscribe({
      next: () => { this.ui.toast('success', 'Added', 'Dependant added successfully'); this.showAddDependantModal = false; this.viewDependants(this.addDependantMembershipId); },
      error: () => this.ui.toast('error', 'Error', 'Failed to add dependant')
    });
  }

  onRateSchemeChange(): void {
    if (!this.selectedRateScheme) return;
    this.rateTablesLoading = true;
    this.api.get<any>(`/benefits/rate-tables/${this.selectedRateScheme}`).subscribe({
      next: (d) => { this.rateTables = d || []; this.rateTablesLoading = false;  this.cdr.detectChanges(); },
      error: () => { this.rateTables = []; this.rateTablesLoading = false; }
    });
  }

  onLifeEventEmployeeChange(): void {
    if (!this.selectedLifeEventEmployee) return;
    this.lifeEventsLoading = true;
    this.api.get<any>(`/benefits/life-events/${this.selectedLifeEventEmployee}`).subscribe({
      next: (d) => { this.lifeEvents = d || []; this.lifeEventsLoading = false;  this.cdr.detectChanges(); },
      error: () => { this.lifeEvents = []; this.lifeEventsLoading = false; }
    });
  }

  projectCost(): void {
    if (!this.projectionEmployee) { this.ui.toast('warning', 'Select Employee', 'Please select an employee first'); return; }
    this.projectionLoading = true;
    this.api.post('/benefits/project-cost', {
      employee_id: parseInt(this.projectionEmployee),
      projection_months: this.projectionMonths,
      salary_increase_percentage: this.projSalaryIncrease,
      new_salary: this.projNewSalary,
      medical_change: this.projMedicalChange,
      retirement_change: this.projRetirementChange,
    }).subscribe({
      next: (res: any) => {
        this.projectionResult = res;
        this.projectionLoading = false;
       this.cdr.detectChanges(); },
      error: () => { this.projectionLoading = false; this.ui.toast('error', 'Error', 'Failed to calculate projection'); }
    });
  }

  getProjectionRows(): any[] {
    if (!this.projectionResult) return [];
    const d = this.projectionResult;
    return [
      { label: 'Salary', current: d.current_salary, projected: d.projected_salary },
      { label: 'Medical Aid', current: d.current_medical, projected: d.projected_medical },
      { label: 'Retirement', current: d.current_retirement, projected: d.projected_retirement },
      { label: 'Total', current: d.current_total, projected: d.projected_total },
    ];
  }

  getDiff(cur: any, proj: any): number { return (parseFloat(proj) || 0) - (parseFloat(cur) || 0); }
  getDiffPct(cur: any, proj: any): string {
    const c = parseFloat(cur) || 0;
    const p = parseFloat(proj) || 0;
    if (c === 0) return '0.00';
    return (((p - c) / c) * 100).toFixed(2);
  }

  loadSchemeSummary(): void {
    this.reportsLoading = true;
    this.reportsContent = null;
    this.api.getRaw<any>('/benefits/reports/scheme-summary').subscribe({
      next: (res) => { this.reportsContent = { type: 'scheme', data: res.data || res }; this.reportsLoading = false; },
      error: () => { this.reportsLoading = false; this.ui.toast('error', 'Error', 'Failed to load scheme summary'); }
    });
  }

  loadEmployeeSummaryReport(): void {
    if (!this.selectedReportEmployee) { this.ui.toast('warning', 'Select Employee', 'Please select an employee first'); return; }
    this.reportsLoading = true;
    this.reportsContent = null;
    this.api.getRaw<any>(`/benefits/reports/employee-summary/${this.selectedReportEmployee}`).subscribe({
      next: (res) => { this.reportsContent = { type: 'employee', data: res.data || res }; this.reportsLoading = false; },
      error: () => { this.reportsLoading = false; this.ui.toast('error', 'Error', 'Failed to load employee summary'); }
    });
  }

  formatCurrency(v: any): string {
    const n = parseFloat(v) || 0;
    return 'R' + n.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
