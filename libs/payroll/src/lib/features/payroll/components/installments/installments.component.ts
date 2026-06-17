import { Component, OnInit, ChangeDetectorRef, effect, Injector } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { UiService } from '../../../../core/services/ui.service';
import { CurrentUserService } from '../../../../core/services/current-user.service';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { CurrencyZarPipe } from '../../../../shared/pipes/currency-zar.pipe';
import { DateSaPipe } from '../../../../shared/pipes/date-sa.pipe';
import { DateTimeSaPipe } from '../../../../shared/pipes/date-time-sa.pipe';
import { DateInputComponent } from '../../../../shared/components/date-input/date-input.component';

@Component({
  selector: 'app-installments',
  standalone: true,
  host: { 'data-accent': 'payroll' },
  imports: [CommonModule, FormsModule, IconComponent, StatusBadgeComponent, PaginationComponent, CurrencyZarPipe, DateSaPipe, DateTimeSaPipe, DateInputComponent],
  templateUrl: './installments.component.html',
  styleUrl: './installments.component.css'
})
export class InstallmentsComponent implements OnInit {
  view: 'list' | 'form' | 'detail' = 'list';
  activeTab: 'current' | 'processed' = 'current';
  loading = true;
  records: any[] = [];

  processedRecords: any[] = [];
  processedLoading = false;
  processedPage = 1;
  processedTotal = 0;
  processedHeadFilter = '';
  processedEmployeeFilterId: number | null = null;
  processedFilterEmployeeSearch = '';
  processedFilterEmployees: any[] = [];

  detailRecord: any = null;
  recordHistory: any[] = [];
  historyLoading = false;

  showReturnModal = false;
  returnComment = '';
  returnTarget: any = null;
  returnIsBulk = false;

  showFailedModal = false;
  failedModalTitle = '';
  failedRecords: any[] = [];

  showRejectModal = false;
  rejectComment = '';
  rejectTarget: any = null;
  rejectIsBulk = false;

  selectedIds: Set<number> = new Set();
  bulkProcessing = false;

  statusFilter = '';
  headFilter = '';
  departmentFilter = '';
  divisionFilter = '';
  departments: any[] = [];
  filteredDivisions: any[] = [];
  employeeFilterId: number | null = null;
  filterEmployeeSearch = '';
  filterEmployees: any[] = [];

  page = 1;
  limit = 25;
  total = 0;

  formLoading = false;
  cycles: any[] = [];
  form: any = {};
  editingId: number | null = null;
  editingReturnedId: number | null = null;

  employees: any[] = [];
  employeeSearch = '';
  employeeLoading = false;
  selectedEmployee: any = null;

  salaryHeads: any[] = [];
  employeeSalaryHeads: any[] = [];
  selectedHead: any = null;

  canApprove = true;
  formIsLocked = false;

  constructor(private api: ApiService, private ui: UiService, private cdr: ChangeDetectorRef, private currentUser: CurrentUserService, private injector: Injector) {
    let firstRun = true;
    effect(() => {
      const _user = this.currentUser.currentUser();
      if (firstRun) { firstRun = false; return; }
      this.loadCanApprove();
      this.loadRecords();
    }, { injector: this.injector });
  }

  get currentUserId(): number {
    return this.currentUser.getCurrentUser().userId;
  }

  ngOnInit(): void {
    this.loadCanApprove();
    this.loadRecords();
    this.loadDepartments();
    this.loadSalaryHeads();
    this.loadCycles();
  }

  loadCycles(): void {
    this.api.getRaw<any>('/payroll/cycles').subscribe({
      next: (res: any) => { this.cycles = res?.data || []; this.cdr.detectChanges(); },
      error: () => { this.cycles = []; }
    });
  }

  loadCanApprove(): void {
    this.api.getRaw<any>('/installments/can-approve').subscribe({
      next: (res: any) => {
        this.canApprove = res?.data?.canApprove === true;
        this.cdr.detectChanges();
      },
      error: () => { this.canApprove = true; this.cdr.detectChanges(); }
    });
  }

  loadSalaryHeads(): void {
    this.api.getRaw<any>('/installments/salary-heads').subscribe({
      next: (res: any) => { this.salaryHeads = res?.data || []; this.cdr.detectChanges(); },
      error: () => { this.salaryHeads = []; }
    });
  }

  switchTab(tab: 'current' | 'processed'): void {
    if (this.activeTab === tab) return;
    this.activeTab = tab;
    if (tab === 'processed') this.loadProcessedRecords();
    this.cdr.detectChanges();
  }

  loadRecords(): void {
    this.loading = true;
    const params: any = { page: this.page, limit: this.limit, tab: 'current' };
    if (this.statusFilter) params.status = this.statusFilter;
    if (this.headFilter) params.salary_head_id = this.headFilter;
    if (this.employeeFilterId) params.employee_id = this.employeeFilterId;
    if (this.departmentFilter) params.department_id = this.departmentFilter;
    if (this.divisionFilter) params.division_id = this.divisionFilter;

    this.api.getPaginated<any>('/installments', params).subscribe({
      next: (res: any) => {
        this.records = res.data || [];
        this.total = res.meta?.total || 0;
        this.loading = false;
        this.selectedIds.clear();
        this.cdr.detectChanges();
      },
      error: () => { this.records = []; this.loading = false; this.cdr.detectChanges(); }
    });
  }

  loadProcessedRecords(): void {
    this.processedLoading = true;
    const params: any = { page: this.processedPage, limit: this.limit, tab: 'processed' };
    if (this.processedHeadFilter) params.salary_head_id = this.processedHeadFilter;
    if (this.processedEmployeeFilterId) params.employee_id = this.processedEmployeeFilterId;

    this.api.getPaginated<any>('/installments', params).subscribe({
      next: (res: any) => {
        this.processedRecords = res.data || [];
        this.processedTotal = res.meta?.total || 0;
        this.processedLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.processedRecords = []; this.processedLoading = false; this.cdr.detectChanges(); }
    });
  }

  onPageChange(p: number): void { this.page = p; this.loadRecords(); }
  onProcessedPageChange(p: number): void { this.processedPage = p; this.loadProcessedRecords(); }

  loadDepartments(): void {
    this.api.get<any>('/departments').subscribe({
      next: (data: any) => { this.departments = data || []; this.cdr.detectChanges(); },
      error: () => { this.departments = []; }
    });
  }

  onDepartmentFilterChange(): void {
    this.divisionFilter = '';
    if (this.departmentFilter) {
      this.api.get<any>(`/departments/${this.departmentFilter}/divisions`).subscribe({
        next: (data: any) => { this.filteredDivisions = data || []; this.cdr.detectChanges(); },
        error: () => { this.filteredDivisions = []; this.cdr.detectChanges(); }
      });
    } else {
      this.filteredDivisions = [];
    }
    this.onFilterChange();
  }

  onFilterChange(): void { this.page = 1; this.loadRecords(); }
  onProcessedFilterChange(): void { this.processedPage = 1; this.loadProcessedRecords(); }

  searchProcessedFilterEmployees(): void {
    if (!this.processedFilterEmployeeSearch || this.processedFilterEmployeeSearch.length < 2) {
      this.processedFilterEmployees = []; this.cdr.detectChanges(); return;
    }
    this.api.getPaginated<any>('/employees', { search: this.processedFilterEmployeeSearch, limit: 20 }).subscribe({
      next: (res: any) => { this.processedFilterEmployees = res.data || []; this.cdr.detectChanges(); },
      error: () => { this.processedFilterEmployees = []; this.cdr.detectChanges(); }
    });
  }

  selectProcessedFilterEmployee(emp: any): void {
    this.processedEmployeeFilterId = emp.id;
    this.processedFilterEmployeeSearch = emp.id + ' | ' + emp.employee_code + ' - ' + emp.first_name + ' ' + emp.surname;
    this.processedFilterEmployees = [];
    this.onProcessedFilterChange();
  }

  clearProcessedEmployeeFilter(): void {
    this.processedEmployeeFilterId = null;
    this.processedFilterEmployeeSearch = '';
    this.processedFilterEmployees = [];
    this.onProcessedFilterChange();
  }

  searchFilterEmployees(): void {
    if (!this.filterEmployeeSearch || this.filterEmployeeSearch.length < 2) {
      this.filterEmployees = []; this.cdr.detectChanges(); return;
    }
    this.api.getPaginated<any>('/employees', { search: this.filterEmployeeSearch, limit: 20 }).subscribe({
      next: (res: any) => { this.filterEmployees = res.data || []; this.cdr.detectChanges(); },
      error: () => { this.filterEmployees = []; this.cdr.detectChanges(); }
    });
  }

  selectFilterEmployee(emp: any): void {
    this.employeeFilterId = emp.id;
    this.filterEmployeeSearch = emp.id + ' | ' + emp.employee_code + ' - ' + emp.first_name + ' ' + emp.surname;
    this.filterEmployees = [];
    this.onFilterChange();
  }

  clearEmployeeFilter(): void {
    this.employeeFilterId = null;
    this.filterEmployeeSearch = '';
    this.filterEmployees = [];
    this.onFilterChange();
  }

  openAddForm(): void {
    this.form = {
      employee_id: null,
      salary_head_id: '',
      description: '',
      total_amount: null,
      monthly_instalment: null,
      period_months: null,
      start_date: '',
      end_date: '',
      vendor_name: '',
      reference_number: '',
      notes: ''
    };
    this.selectedEmployee = null;
    this.selectedHead = null;
    this.employees = [];
    this.employeeSearch = '';
    this.editingId = null;
    this.editingReturnedId = null;
    this.formIsLocked = false;
    this.view = 'form';
    this.cdr.detectChanges();
  }

  backToList(): void {
    this.view = 'list';
    this.editingId = null;
    this.editingReturnedId = null;
    if (this.activeTab === 'processed') this.loadProcessedRecords(); else this.loadRecords();
  }

  searchEmployees(): void {
    if (!this.employeeSearch || this.employeeSearch.length < 2) {
      this.employees = []; this.cdr.detectChanges(); return;
    }
    this.employeeLoading = true;
    this.api.getPaginated<any>('/employees', { search: this.employeeSearch, limit: 20 }).subscribe({
      next: (res: any) => { this.employees = res.data || []; this.employeeLoading = false; this.cdr.detectChanges(); },
      error: () => { this.employees = []; this.employeeLoading = false; this.cdr.detectChanges(); }
    });
  }

  selectEmployee(emp: any): void {
    this.selectedEmployee = emp;
    this.form.employee_id = emp.id;
    this.employeeSearch = emp.id + ' | ' + emp.employee_code + ' - ' + emp.first_name + ' ' + emp.surname;
    this.employees = [];
    this.form.salary_head_id = '';
    this.selectedHead = null;
    this.loadEmployeeSalaryHeads(emp.id);
    const effectiveCycle = this.form.cycle_id ?? emp.payroll_cycle_id;
    if (effectiveCycle) this.checkFormLockStatus(effectiveCycle);
    this.cdr.detectChanges();
  }

  onFormCycleChange(): void {
    const effectiveCycle = this.form.cycle_id ?? this.selectedEmployee?.payroll_cycle_id;
    if (effectiveCycle) {
      this.checkFormLockStatus(effectiveCycle);
    } else {
      this.formIsLocked = false;
      this.cdr.detectChanges();
    }
  }

  clearEmployee(): void {
    this.selectedEmployee = null;
    this.form.employee_id = null;
    this.form.salary_head_id = '';
    this.selectedHead = null;
    this.employeeSearch = '';
    this.employees = [];
    this.employeeSalaryHeads = [];
    this.formIsLocked = false;
    this.cdr.detectChanges();
  }

  checkFormLockStatus(cycleId: any): void {
    if (!cycleId) { this.formIsLocked = false; this.cdr.detectChanges(); return; }
    this.api.getRaw<any>('/payroll/lock-status', { cycle_id: cycleId }).subscribe({
      next: (res: any) => { this.formIsLocked = res?.data?.locked === true; this.cdr.detectChanges(); },
      error: () => { this.formIsLocked = false; this.cdr.detectChanges(); }
    });
  }

  loadEmployeeSalaryHeads(employeeId: number): void {
    this.api.getRaw<any>(`/installments/employee-salary-heads/${employeeId}`).subscribe({
      next: (res: any) => {
        const data = res?.data || {};
        this.employeeSalaryHeads = data.salaryHeads || [];
        if (this.form.salary_head_id) {
          const headId = parseInt(this.form.salary_head_id, 10);
          this.selectedHead = this.employeeSalaryHeads.find((h: any) => h.id === headId) || null;
        }
        this.cdr.detectChanges();
      },
      error: () => { this.employeeSalaryHeads = []; this.cdr.detectChanges(); }
    });
  }

  onHeadChange(): void {
    if (this.form.salary_head_id) {
      const headId = parseInt(this.form.salary_head_id, 10);
      this.selectedHead = this.employeeSalaryHeads.find((h: any) => h.id === headId) || null;
    } else {
      this.selectedHead = null;
    }
    this.cdr.detectChanges();
  }

  recomputeMonthly(): void {
    const total = parseFloat(this.form.total_amount);
    const months = parseInt(this.form.period_months, 10);
    if (total > 0 && months > 0) {
      this.form.monthly_instalment = parseFloat((total / months).toFixed(2));
    }
  }

  submitInstallment(): void {
    if (!this.form.employee_id) { this.ui.toast('error', 'Validation', 'Please select an employee'); return; }
    if (!this.form.salary_head_id) { this.ui.toast('error', 'Validation', 'Please select a deduction salary head'); return; }
    if (!this.form.total_amount || parseFloat(this.form.total_amount) <= 0) { this.ui.toast('error', 'Validation', 'Total amount must be greater than 0'); return; }
    if (!this.form.period_months || parseInt(this.form.period_months, 10) <= 0) { this.ui.toast('error', 'Validation', 'Period (months) must be greater than 0'); return; }
    if (!this.form.monthly_instalment || parseFloat(this.form.monthly_instalment) <= 0) { this.ui.toast('error', 'Validation', 'Monthly instalment must be greater than 0'); return; }
    if (!this.form.start_date) { this.ui.toast('error', 'Validation', 'Start date is required'); return; }

    this.formLoading = true;
    const body: any = {
      employee_id: this.form.employee_id,
      salary_head_id: parseInt(this.form.salary_head_id, 10),
      description: this.form.description || null,
      total_amount: parseFloat(this.form.total_amount),
      monthly_instalment: parseFloat(this.form.monthly_instalment),
      period_months: parseInt(this.form.period_months, 10),
      start_date: this.form.start_date,
      end_date: this.form.end_date || null,
      vendor_name: this.form.vendor_name || null,
      reference_number: this.form.reference_number || null,
      notes: this.form.notes || null,
      cycle_id: this.form.cycle_id || null
    };

    if (this.editingReturnedId) {
      this.api.put<any>(`/installments/${this.editingReturnedId}`, body).subscribe({
        next: () => {
          this.ui.toast('success', 'Resubmitted', 'Instalment corrected and resubmitted');
          this.formLoading = false; this.editingReturnedId = null; this.backToList();
        },
        error: (err: any) => { this.ui.toast('error', 'Error', err?.error?.error?.message || 'Failed to resubmit instalment'); this.formLoading = false; this.cdr.detectChanges(); }
      });
    } else if (this.editingId) {
      this.api.put<any>(`/installments/${this.editingId}`, body).subscribe({
        next: () => {
          this.ui.toast('success', 'Updated', 'Instalment updated successfully');
          this.formLoading = false; this.editingId = null; this.backToList();
        },
        error: (err: any) => { this.ui.toast('error', 'Error', err?.error?.error?.message || 'Failed to update instalment'); this.formLoading = false; this.cdr.detectChanges(); }
      });
    } else {
      this.api.postRaw<any>('/installments', body).subscribe({
        next: () => {
          this.ui.toast('success', 'Submitted', 'Instalment submitted successfully');
          this.formLoading = false; this.backToList();
        },
        error: (err: any) => { this.ui.toast('error', 'Error', err?.error?.error?.message || 'Failed to submit instalment'); this.formLoading = false; this.cdr.detectChanges(); }
      });
    }
  }

  viewRecord(record: any): void {
    this.detailRecord = record;
    this.recordHistory = [];
    this.historyLoading = true;
    this.view = 'detail';
    this.cdr.detectChanges();

    this.api.getRaw<any>(`/installments/${record.id}/history`).subscribe({
      next: (res: any) => { this.recordHistory = res?.data || []; this.historyLoading = false; this.cdr.detectChanges(); },
      error: () => { this.recordHistory = []; this.historyLoading = false; this.cdr.detectChanges(); }
    });
  }

  get isPrivileged(): boolean {
    const user: any = this.currentUser.getCurrentUser() || {};
    const norm = (s: any) => String(s || '').toLowerCase().replace(/[\s_-]+/g, '_');
    const PRIV = new Set(['admin', 'hr_mgr', 'hr_manager', 'payroll_admin']);
    if (PRIV.has(norm(user.role))) return true;
    const roles: any[] = user.roles || [];
    return roles.some((r: any) => PRIV.has(norm(r)));
  }

  async cancelRecord(record: any): Promise<void> {
    const confirmed = await this.ui.confirm({
      title: 'Cancel Instalment',
      message: `Cancel ${record.salary_head_name} instalment for ${record.first_name} ${record.surname}? Future payroll deductions will stop. Remaining balance: R${parseFloat(record.balance).toFixed(2)}.`
    });
    if (!confirmed) return;
    this.api.patchRaw(`/installments/${record.id}/cancel`, {}).subscribe({
      next: (res: any) => {
        this.ui.toast('success', 'Cancelled', res?.message || 'Instalment cancelled.');
        this.loadRecords();
      },
      error: (err: any) => {
        const msg = err?.error?.error?.message || err?.error?.message || 'Failed to cancel instalment';
        this.ui.toast('error', 'Cancel Failed', msg);
      }
    });
  }

  async approveRecord(record: any): Promise<void> {
    const confirmed = await this.ui.confirm({
      title: 'Approve Instalment',
      message: `Approve ${record.salary_head_name} instalment for ${record.first_name} ${record.surname} - R${parseFloat(record.total_amount).toFixed(2)} over ${record.period_months} months?`
    });
    if (!confirmed) return;

    this.api.patchRaw(`/installments/${record.id}/approve`, {}).subscribe({
      next: (res: any) => {
        const msg = res?.message || 'Instalment approved';
        const title = res?.finalApproval ? 'Fully Approved' : 'Step Approved';
        this.ui.toast('success', title, msg);
        this.loadRecords();
      },
      error: (err: any) => {
        const msg = err?.error?.error?.message || err?.error?.message || 'Failed to approve instalment';
        this.ui.toast('error', err.status === 403 ? 'Unauthorized' : 'Error', msg);
      }
    });
  }

  rejectRecord(record: any): void {
    this.rejectComment = ''; this.rejectTarget = record; this.rejectIsBulk = false; this.showRejectModal = true; this.cdr.detectChanges();
  }

  confirmReject(): void {
    if (!this.rejectComment.trim()) { this.ui.toast('error', 'Required', 'Please provide a reason for rejection'); return; }
    this.showRejectModal = false;

    if (this.rejectIsBulk) {
      const ids = Array.from(this.selectedIds);
      this.bulkProcessing = true; this.cdr.detectChanges();
      this.api.postRaw<any>('/installments/bulk-reject', { ids, comments: this.rejectComment.trim() }).subscribe({
        next: (res: any) => {
          const data = res?.data || res || {};
          this.ui.toast('success', 'Bulk Rejected', `${data.rejected ?? ids.length} instalment(s) rejected${data.failed ? ', ' + data.failed + ' failed' : ''}`);
          this.bulkProcessing = false; this.selectedIds.clear(); this.loadRecords();
        },
        error: () => { this.ui.toast('error', 'Error', 'Failed to bulk reject'); this.bulkProcessing = false; this.cdr.detectChanges(); }
      });
    } else {
      const record = this.rejectTarget;
      this.api.patchRaw(`/installments/${record.id}/reject`, { comments: this.rejectComment.trim() }).subscribe({
        next: (res: any) => { this.ui.toast('success', 'Rejected', res?.message || 'Instalment rejected.'); this.loadRecords(); },
        error: (err: any) => { const msg = err?.error?.error?.message || err?.error?.message || 'Failed to reject instalment'; this.ui.toast('error', err.status === 403 ? 'Unauthorized' : 'Error', msg); }
      });
    }
  }

  cancelReject(): void { this.showRejectModal = false; this.rejectTarget = null; this.rejectComment = ''; this.rejectIsBulk = false; this.cdr.detectChanges(); }

  returnRecord(record: any): void {
    this.returnComment = ''; this.returnTarget = record; this.returnIsBulk = false; this.showReturnModal = true; this.cdr.detectChanges();
  }

  confirmReturn(): void {
    if (!this.returnComment.trim()) { this.ui.toast('error', 'Required', 'Please provide a reason for returning the instalment'); return; }
    this.showReturnModal = false; this.cdr.detectChanges();

    if (this.returnIsBulk) {
      const ids = Array.from(this.selectedIds);
      if (ids.length === 0) { this.ui.toast('warning', 'No Selection', 'No records selected for return'); return; }
      this.bulkProcessing = true; this.cdr.detectChanges();
      this.api.postRaw<any>('/installments/bulk-return', { ids, comments: this.returnComment.trim() }).subscribe({
        next: (res: any) => {
          const data = res?.data || res || {};
          const returned = data.returned ?? ids.length; const failed = data.failed ?? 0;
          if (failed > 0) this.ui.toast('warning', 'Partial Return', `${returned} instalment(s) returned, ${failed} failed`);
          else this.ui.toast('success', 'Bulk Returned', `${returned} instalment(s) returned for correction`);
          this.bulkProcessing = false; this.returnIsBulk = false; this.selectedIds.clear(); this.loadRecords();
        },
        error: () => { this.ui.toast('error', 'Error', 'Failed to bulk return'); this.bulkProcessing = false; this.returnIsBulk = false; this.cdr.detectChanges(); }
      });
    } else {
      const record = this.returnTarget; if (!record) return;
      this.api.patchRaw(`/installments/${record.id}/return`, { comments: this.returnComment.trim() }).subscribe({
        next: (res: any) => { this.ui.toast('success', 'Returned', res?.message || 'Instalment returned for correction.'); this.loadRecords(); },
        error: (err: any) => { const msg = err?.error?.error?.message || err?.error?.message || 'Failed to return instalment'; this.ui.toast('error', err.status === 403 ? 'Unauthorized' : 'Error', msg); }
      });
    }
  }

  cancelReturn(): void { this.showReturnModal = false; this.returnTarget = null; this.returnComment = ''; this.returnIsBulk = false; this.cdr.detectChanges(); }

  bulkReturn(): void { this.returnComment = ''; this.returnTarget = null; this.returnIsBulk = true; this.showReturnModal = true; this.cdr.detectChanges(); }

  editPendingRecord(record: any): void { this.editingId = record.id; this.editingReturnedId = null; this.prefillForm(record); }
  editAndResubmit(record: any): void { this.editingReturnedId = record.id; this.editingId = null; this.prefillForm(record); }

  private prefillForm(record: any): void {
    this.form = {
      employee_id: record.employee_id,
      salary_head_id: String(record.salary_head_id),
      description: record.description || '',
      total_amount: parseFloat(record.total_amount) || null,
      monthly_instalment: parseFloat(record.monthly_instalment) || null,
      period_months: record.period_months || null,
      start_date: record.start_date ? record.start_date.substring(0, 10) : '',
      end_date: record.end_date ? record.end_date.substring(0, 10) : '',
      vendor_name: record.vendor_name || '',
      reference_number: record.reference_number || '',
      notes: record.notes || ''
    };
    this.selectedEmployee = { id: record.employee_id, first_name: record.first_name, surname: record.surname, employee_code: record.employee_code };
    this.employeeSearch = record.employee_id + ' | ' + (record.employee_code || '') + ' - ' + record.first_name + ' ' + record.surname;
    this.employees = [];
    this.checkFormLockStatus(record.cycle_id ?? null);
    this.view = 'form';
    this.loadEmployeeSalaryHeads(record.employee_id);
    this.cdr.detectChanges();
  }

  getActionIcon(action: string): string {
    switch (action) {
      case 'SUBMITTED': return 'plus';
      case 'APPROVED': return 'check';
      case 'REJECTED': return 'x';
      case 'RETURNED': return 'chevronLeft';
      case 'ACTIVATED': return 'dollar';
      case 'COMPLETED': return 'check';
      default: return 'clock';
    }
  }

  getActionColor(action: string): string {
    switch (action) {
      case 'SUBMITTED': return '#3b82f6';
      case 'APPROVED': return '#16a34a';
      case 'REJECTED': return '#ef4444';
      case 'RETURNED': return '#f59e0b';
      case 'ACTIVATED': return '#8b5cf6';
      case 'COMPLETED': return '#16a34a';
      default: return '#64748b';
    }
  }

  get pendingRecords(): any[] { return this.records.filter(r => r.status === 'PENDING'); }
  get allPendingSelected(): boolean { const pending = this.pendingRecords; return pending.length > 0 && pending.every(r => this.selectedIds.has(r.id)); }
  get selectedCount(): number { return this.selectedIds.size; }
  get selectedTotal(): number { return this.records.filter(r => this.selectedIds.has(r.id)).reduce((sum, r) => sum + (parseFloat(r.total_amount) || 0), 0); }

  toggleSelectAll(): void {
    const pending = this.pendingRecords;
    if (this.allPendingSelected) pending.forEach(r => this.selectedIds.delete(r.id));
    else pending.forEach(r => this.selectedIds.add(r.id));
    this.cdr.detectChanges();
  }

  toggleSelection(id: number): void {
    if (this.selectedIds.has(id)) this.selectedIds.delete(id); else this.selectedIds.add(id);
    this.cdr.detectChanges();
  }

  async bulkApprove(): Promise<void> {
    const ids = Array.from(this.selectedIds);
    const confirmed = await this.ui.confirm({
      title: 'Bulk Approve Instalments',
      message: `Approve ${ids.length} instalment(s) totalling R${this.selectedTotal.toFixed(2)}?`
    });
    if (!confirmed) return;

    this.bulkProcessing = true; this.cdr.detectChanges();
    this.api.postRaw<any>('/installments/bulk-approve', { ids }).subscribe({
      next: (res: any) => {
        const data = res?.data || res || {};
        const approved = data.approved ?? 0;
        const stepped = data.stepped ?? 0;
        const skipped = data.failed ?? 0;
        const skipReasons = data.skipReasons || {};
        const reasonList = Object.keys(skipReasons);
        if (approved + stepped === 0 && skipped > 0) {
          const reasonText = reasonList.length === 1 ? reasonList[0] : reasonList.map(r => `${skipReasons[r]}x: ${r}`).join('; ');
          this.ui.toast('warning', 'None Approved', `${skipped} instalment(s) skipped: ${reasonText}`);
        } else if (skipped > 0) {
          const reasonText = reasonList.length === 1 ? reasonList[0] : reasonList.map(r => `${skipReasons[r]}x: ${r}`).join('; ');
          this.ui.toast('warning', 'Partial Approval', `${approved + stepped} instalment(s) approved, ${skipped} skipped: ${reasonText}`);
        } else if (stepped > 0 && approved === 0) {
          this.ui.toast('success', 'Bulk Approved', `${stepped} instalment(s) advanced to next approval level`);
        } else {
          this.ui.toast('success', 'Bulk Approved', `${approved} instalment(s) fully approved${stepped ? ', ' + stepped + ' advanced to next level' : ''}`);
        }
        this.bulkProcessing = false; this.selectedIds.clear(); this.loadRecords();
      },
      error: () => { this.ui.toast('error', 'Error', 'Failed to bulk approve'); this.bulkProcessing = false; this.cdr.detectChanges(); }
    });
  }

  bulkReject(): void { this.rejectComment = ''; this.rejectTarget = null; this.rejectIsBulk = true; this.showRejectModal = true; this.cdr.detectChanges(); }

  showFailedDetails(title: string, failedIds: number[]): void {
    this.failedModalTitle = title;
    this.failedRecords = failedIds.map(id => {
      const r = this.records.find(rec => rec.id === id);
      return r
        ? { id, employee_name: `${r.first_name} ${r.surname}`, employee_code: r.employee_code, salary_head_name: r.salary_head_name, amount: parseFloat(r.total_amount) || 0 }
        : { id, employee_name: 'Unknown', employee_code: '', salary_head_name: '', amount: 0 };
    });
    this.showFailedModal = true; this.cdr.detectChanges();
  }

  closeFailedModal(): void { this.showFailedModal = false; this.failedRecords = []; this.failedModalTitle = ''; this.cdr.detectChanges(); }
}
