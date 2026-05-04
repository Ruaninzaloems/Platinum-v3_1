import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { UiService } from '../../../core/services/ui.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { DateInputComponent } from '../../../shared/components/date-input/date-input.component';
import { Employee } from '../../../core/models';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, IconComponent, StatusBadgeComponent, PaginationComponent, DateInputComponent],
  templateUrl: './employee-list.component.html',
  styleUrl: './employee-list.component.css'
})
export class EmployeeListComponent implements OnInit, OnDestroy {
  employees: Employee[] = [];
  loading = true;
  search = '';
  statusFilter = '';
  cycleFilter = '';
  cycles: any[] = [];
  page = 1;
  limit = 20;
  total = 0;
  activeCount = 0;
  terminatedCount = 0;
  sortBy = 'id';
  sortOrder = 'asc';
  showAddModal = false;
  showEditModal = false;
  showTerminateModal = false;
  showImportModal = false;
  newEmployee: any = {};
  editEmployee: any = {};
  terminateEmployee: any = {};
  departments: any[] = [];
  positions: any[] = [];
  taskGrades: any[] = [];
  employeeTypes: any[] = [];
  probationAlerts: any[] = [];
  wizardStep = 1;
  wizardState: any = {};
  calculatedAmounts: any = null;
  terminationTypes = [
    { value: 'RESIGNATION', label: 'Resignation' },
    { value: 'DISMISSAL', label: 'Dismissal' },
    { value: 'RETRENCHMENT', label: 'Retrenchment' },
    { value: 'CONTRACT_END', label: 'End of Contract' },
    { value: 'RETIREMENT', label: 'Retirement' },
    { value: 'DEATH', label: 'Death' },
    { value: 'ABSCONDED', label: 'Absconded' },
    { value: 'MUTUAL', label: 'Mutual Agreement' },
  ];
  titleOptions: any[] = [];
  raceOptions: any[] = [];
  genderOptions: any[] = [];
  maritalOptions = ['Single', 'Married', 'Divorced', 'Widowed', 'Civil Union'];
  bankTypeOptions = ['Cheque/Current', 'Savings', 'Transmission'];
  provinceOptions = ['Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo', 'Mpumalanga', 'Northern Cape', 'North West', 'Western Cape'];
  importFile: File | null = null;
  importFileName = '';
  importing = false;

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(private api: ApiService, private ui: UiService, private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadEmployees();
    this.loadLookups();
    this.loadProbationAlerts();
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.page = 1;
      this.loadEmployees();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadEmployees(): void {
    this.loading = true;
    const params: any = {
      page: this.page,
      limit: this.limit,
      sort_by: this.sortBy,
      sort_order: this.sortOrder
    };
    if (this.search) params.search = this.search;
    if (this.cycleFilter) params.cycle_id = this.cycleFilter;
    if (this.statusFilter) params.status = this.statusFilter;

    this.api.getPaginated<Employee>('/employees', params).subscribe({
      next: (res: any) => {
        this.employees = res.data || [];
        this.total = res.pagination?.total || 0;
        if (res.counts) {
          this.activeCount = res.counts.active || 0;
          this.terminatedCount = res.counts.terminated || 0;
        }
        this.loading = false; this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false; this.cdr.detectChanges();
        this.ui.toast('error', 'Error', 'Failed to load employees');
      }
    });
  }

  loadLookups(): void {
    this.api.get<any[]>('/payroll/cycles').subscribe({ next: (d) => { this.cycles = d || []; this.cdr.detectChanges(); } });
    this.api.get<any[]>('/departments').subscribe({ next: (d) => this.departments = d || [] });
    this.api.get<any[]>('/positions/task-grades').subscribe({
      next: (d) => this.taskGrades = d || [],
      error: () => this.api.get<any[]>('/settings/task-grades').subscribe({ next: (d) => this.taskGrades = d || [] })
    });
    this.api.get<any[]>('/settings/employee-types').subscribe({ next: (d) => this.employeeTypes = d || [] });
    this.api.get<any[]>('/settings/titles').subscribe({
      next: (d) => { this.titleOptions = d || []; this.cdr.detectChanges(); },
      error: () => { this.titleOptions = [
        { id: 11, name: 'Mister', abbreviation: 'Mr' },
        { id: 8, name: 'Mrs', abbreviation: 'Mrs' },
        { id: 9, name: 'Ms', abbreviation: 'Ms' },
        { id: 3, name: 'Doctor', abbreviation: 'Dr' },
        { id: 13, name: 'Professor', abbreviation: 'Prof' },
        { id: 14, name: 'Reverend', abbreviation: 'Rev' }
      ]; this.cdr.detectChanges(); }
    });
    this.api.get<any[]>('/settings/ethnic-groups').subscribe({
      next: (d) => { this.raceOptions = d || []; this.cdr.detectChanges(); },
      error: () => { this.raceOptions = [
        { id: 2, name: 'African' }, { id: 4, name: 'Coloured' },
        { id: 6, name: 'Indian' }, { id: 3, name: 'White' },
        { id: 1, name: 'Foreign National' }
      ]; this.cdr.detectChanges(); }
    });
    this.api.get<any[]>('/settings/genders').subscribe({
      next: (d) => { this.genderOptions = d || []; this.cdr.detectChanges(); },
      error: () => { this.genderOptions = [
        { id: 1, name: 'Female' }, { id: 2, name: 'Male' }
      ]; this.cdr.detectChanges(); }
    });
  }

  loadProbationAlerts(): void {
    this.api.get<any[]>('/employees/probation-alerts').subscribe({
      next: (d) => this.probationAlerts = d || [],
      error: () => {
        this.probationAlerts = this.employees.filter(e => {
          if (e.status !== 'ACTIVE') return false;
          const probEnd = (e as any).probation_end_date || (e as any).probation_end;
          if (!probEnd) return false;
          const end = new Date(probEnd);
          const now = new Date();
          return !isNaN(end.getTime()) && end >= now && Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) <= 30;
        });
      }
    });
  }

  onSearchInput(): void {
    this.searchSubject.next(this.search);
  }

  onFilterChange(): void {
    this.page = 1;
    this.loadEmployees();
  }

  exportToExcel(): void {
    const params: string[] = [];
    if (this.search) params.push(`search=${encodeURIComponent(this.search)}`);
    if (this.cycleFilter) params.push(`cycle_id=${this.cycleFilter}`);
    if (this.statusFilter) params.push(`status=${this.statusFilter}`);
    const qs = params.length > 0 ? '?' + params.join('&') : '';
    window.open(`/api/v1/employees/export${qs}`, '_blank');
  }

  onPageChange(p: number): void {
    this.page = p;
    this.loadEmployees();
  }

  viewEmployee(id: number): void {
    this.router.navigate(['/employees', id]);
  }

  get stats() {
    return {
      total: this.total,
      active: this.activeCount,
      terminated: this.terminatedCount,
    };
  }

  formatCurrency(val: any): string {
    const n = parseFloat(val) || 0;
    return 'R' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  getProbationBadge(emp: any): string {
    if (!emp || emp.status !== 'ACTIVE') return '';
    if (emp.probation_status === 'ON_PROBATION') {
      const probEnd = emp.probation_end_date || emp.probation_end;
      if (probEnd) {
        const end = new Date(probEnd);
        const now = new Date();
        if (!isNaN(end.getTime()) && end >= now) {
          const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          return daysLeft <= 30 ? `On Probation (${daysLeft}d)` : 'On Probation';
        }
      }
      return 'On Probation';
    }
    const probEnd = emp.probation_end_date || emp.probation_end;
    if (!probEnd) return '';
    const end = new Date(probEnd);
    const now = new Date();
    if (isNaN(end.getTime()) || end < now) return '';
    const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 30) return `On Probation (${daysLeft}d)`;
    if (daysLeft <= 90) return 'On Probation';
    return '';
  }

  getProbationDaysLeft(emp: any): number | null {
    const probEnd = emp.probation_end_date || emp.probation_end;
    if (!probEnd) return null;
    const end = new Date(probEnd);
    const now = new Date();
    if (isNaN(end.getTime()) || end < now) return null;
    return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  openAddModal(): void {
    this.newEmployee = {
      title: 'Mr', gender: 'Male', marital_status: 'Single',
      status: 'Active', nationality: 'South African', race: 'African',
      disability_status: 'None', payment_type: 'Monthly', dependants: 0
    };
    this.showAddModal = true;
  }

  validateSAID(idNumber: string): { valid: boolean; dob?: string; gender?: string; message?: string } {
    if (!idNumber || idNumber.length !== 13) return { valid: false, message: 'SA ID must be 13 digits' };
    if (!/^\d{13}$/.test(idNumber)) return { valid: false, message: 'SA ID must contain only digits' };
    const year = parseInt(idNumber.substring(0, 2));
    const month = parseInt(idNumber.substring(2, 4));
    const day = parseInt(idNumber.substring(4, 6));
    if (month < 1 || month > 12) return { valid: false, message: 'Invalid month in ID number' };
    if (day < 1 || day > 31) return { valid: false, message: 'Invalid day in ID number' };
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      let digit = parseInt(idNumber[i]);
      if (i % 2 !== 0) { digit *= 2; if (digit > 9) digit -= 9; }
      sum += digit;
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    if (checkDigit !== parseInt(idNumber[12])) return { valid: false, message: 'Invalid ID number (checksum failed)' };
    const fullYear = year >= 0 && year <= 25 ? 2000 + year : 1900 + year;
    const gender = parseInt(idNumber.substring(6, 10)) >= 5000 ? 'Male' : 'Female';
    const dob = `${fullYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return { valid: true, dob, gender };
  }

  onIdNumberBlur(): void {
    if (this.newEmployee.id_number) {
      const result = this.validateSAID(this.newEmployee.id_number);
      if (result.valid) {
        if (result.dob) this.newEmployee.date_of_birth = result.dob;
        if (result.gender) this.newEmployee.gender = result.gender;
      }
    }
  }

  onEditIdNumberBlur(): void {
    if (this.editEmployee.id_number) {
      const result = this.validateSAID(this.editEmployee.id_number);
      if (result.valid) {
        if (result.dob) this.editEmployee.date_of_birth = result.dob;
        if (result.gender) this.editEmployee.gender = result.gender;
      }
    }
  }

  saveEmployee(): void {
    if (!this.newEmployee.first_name || !this.newEmployee.surname || !this.newEmployee.id_number) {
      this.ui.toast('warning', 'Validation', 'First name, surname, and ID number are required');
      return;
    }
    const idValidation = this.validateSAID(this.newEmployee.id_number);
    if (!idValidation.valid) {
      this.ui.toast('error', 'Validation Error', idValidation.message || 'Invalid ID number');
      return;
    }
    this.api.post<Employee>('/employees', this.newEmployee).subscribe({
      next: () => {
        this.ui.toast('success', 'Employee Created', `${this.newEmployee.first_name} ${this.newEmployee.surname} has been added successfully`);
        this.showAddModal = false;
        this.loadEmployees();
      },
      error: () => this.ui.toast('error', 'Error', 'Failed to create employee')
    });
  }

  openEditModal(emp: Employee): void {
    this.api.get<any>(`/employees/${emp.id}`).subscribe({
      next: (data) => {
        this.editEmployee = { ...data };
        this.cdr.detectChanges();
        this.showEditModal = true;
      },
      error: () => this.ui.toast('error', 'Error', 'Failed to load employee')
    });
  }

  updateEmployee(): void {
    if (!this.editEmployee.first_name || !this.editEmployee.surname) {
      this.ui.toast('warning', 'Validation', 'First name and surname are required');
      return;
    }
    this.api.put(`/employees/${this.editEmployee.id}`, this.editEmployee).subscribe({
      next: () => {
        this.ui.toast('success', 'Employee Updated', 'Employee details have been updated successfully');
        this.showEditModal = false;
        this.loadEmployees();
      },
      error: () => this.ui.toast('error', 'Error', 'Failed to update employee')
    });
  }

  openTerminateModal(emp: Employee): void {
    this.api.get<any>(`/employees/${emp.id}`).subscribe({
      next: (data) => {
        this.terminateEmployee = data;
        this.wizardStep = 1;
        this.calculatedAmounts = null;
        this.wizardState = {
          termination_type: '',
          reason: '',
          last_working_date: '',
          checklist_equipment: false,
          checklist_exit_interview: false,
          checklist_access: false,
          checklist_assets: false,
          checklist_payslip: false,
          exit_interview_notes: '',
        };
        this.showTerminateModal = true;
      },
      error: () => this.ui.toast('error', 'Error', 'Failed to load employee details')
    });
  }

  wizardNext(): void {
    if (this.wizardStep === 1) {
      if (!this.wizardState.termination_type) { this.ui.toast('error', 'Required', 'Please select a termination type'); return; }
      if (!this.wizardState.last_working_date) { this.ui.toast('error', 'Required', 'Please select a last working date'); return; }
      this.api.post<any>(`/employees/${this.terminateEmployee.id}/termination/calculate`, {
        termination_type: this.wizardState.termination_type,
        termination_date: this.wizardState.last_working_date,
      }).subscribe({
        next: (data) => { this.calculatedAmounts = data || {}; this.wizardStep = 2; },
        error: () => { this.calculatedAmounts = { notice_pay: 0, severance_pay: 0, leave_payout: 0, pro_rata_bonus: 0, total_payout: 0 }; this.wizardStep = 2; }
      });
    } else if (this.wizardStep === 2) {
      this.wizardStep = 3;
    } else if (this.wizardStep === 3) {
      this.wizardStep = 4;
    }
  }

  wizardPrev(): void {
    if (this.wizardStep > 1) this.wizardStep--;
  }

  getTermLabel(): string {
    return this.terminationTypes.find(t => t.value === this.wizardState.termination_type)?.label || this.wizardState.termination_type;
  }

  finaliseTermination(): void {
    this.api.post<any>(`/employees/${this.terminateEmployee.id}/termination/finalise`, {
      termination_type: this.wizardState.termination_type,
      termination_date: this.wizardState.last_working_date,
      reason: this.wizardState.reason,
      checklist_equipment_returned: this.wizardState.checklist_equipment,
      checklist_exit_interview: this.wizardState.checklist_exit_interview,
      checklist_access_revoked: this.wizardState.checklist_access,
      checklist_assets_returned: this.wizardState.checklist_assets,
      checklist_final_payslip: this.wizardState.checklist_payslip,
      exit_interview_notes: this.wizardState.exit_interview_notes,
    }).subscribe({
      next: () => {
        this.showTerminateModal = false;
        this.ui.toast('success', 'Terminated', `${this.terminateEmployee.first_name} ${this.terminateEmployee.surname} has been terminated`);
        this.loadEmployees();
      },
      error: () => this.ui.toast('error', 'Error', 'Failed to process termination')
    });
  }

  openImportModal(): void {
    this.importFile = null;
    this.importFileName = '';
    this.importing = false;
    this.showImportModal = true;
  }

  onImportFileSelect(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const ext = file.name.split('.').pop().toLowerCase();
      if (!['csv', 'xlsx'].includes(ext)) {
        this.ui.toast('error', 'Invalid File', 'Please select a CSV or XLSX file');
        return;
      }
      this.importFile = file;
      this.importFileName = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
    }
  }

  doImport(): void {
    if (!this.importFile) return;
    this.importing = true;
    const formData = new FormData();
    formData.append('file', this.importFile);
    fetch('/api/v1/employees/import', { method: 'POST', body: formData })
      .then(r => r.json())
      .then(result => {
        const imported = result.data?.imported || result.imported || 0;
        const errors = result.data?.errors || result.errors || [];
        this.showImportModal = false;
        this.importing = false;
        if (errors.length > 0) {
          this.ui.toast('warning', 'Import Completed', `${imported} employees imported, ${errors.length} rows had errors`);
        } else {
          this.ui.toast('success', 'Import Successful', `${imported} employees imported successfully`);
        }
        this.loadEmployees();
      })
      .catch(err => {
        this.importing = false;
        this.ui.toast('error', 'Import Failed', err.message);
      });
  }

  async deleteEmployee(emp: Employee): Promise<void> {
    const confirmed = await this.ui.confirm({
      title: 'Delete Employee',
      message: `Are you sure you want to delete ${emp.first_name} ${emp.surname}?`,
      danger: true
    });
    if (confirmed) {
      this.api.delete(`/employees/${emp.id}`).subscribe({
        next: () => {
          this.ui.toast('success', 'Deleted', 'Employee removed');
          this.loadEmployees();
        },
        error: () => this.ui.toast('error', 'Error', 'Failed to delete employee')
      });
    }
  }
}
