import { Component, OnInit, ChangeDetectorRef, effect, Injector } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { UiService } from '../../../../core/services/ui.service';
import { CurrentUserService } from '../../../../core/services/current-user.service';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { DateTimeSaPipe } from '../../../../shared/pipes/date-time-sa.pipe';
@Component({
  selector: 'app-wages',
  standalone: true,
  host: { 'data-accent': 'payroll' },
  imports: [CommonModule, FormsModule, IconComponent, StatusBadgeComponent, PaginationComponent, DateTimeSaPipe],
  templateUrl: './wages.component.html',
  styleUrl: './wages.component.css'
})
export class WagesComponent implements OnInit {
  view: 'list' | 'form' | 'detail' = 'list';
  activeTab: 'current' | 'processed' = 'current';
  loading = true;

  allTransactions: any[] = [];
  transactions: any[] = [];
  page = 1;
  limit = 25;
  total = 0;

  processedWages: any[] = [];
  processedLoading = false;
  processedPage = 1;
  processedLimit = 25;
  processedTotal = 0;
  processedEmployeeFilterId: number | null = null;
  processedFilterEmployeeSearch = '';
  processedFilterEmployees: any[] = [];
  processedCycleFilter = '';

  detailWage: any = null;
  wageHistory: any[] = [];
  historyLoading = false;

  showReturnModal = false;
  returnComment = '';
  returnTarget: any = null;
  returnIsBulk = false;

  showRejectModal = false;
  rejectComment = '';
  rejectTarget: any = null;
  rejectIsBulk = false;

  showFailedModal = false;
  failedModalTitle = '';
  failedTransactions: any[] = [];

  selectedWageIds: Set<number> = new Set();
  bulkProcessing = false;

  statusFilter = '';
  cycleFilter = '';
  departmentFilter = '';
  divisionFilter = '';
  departments: any[] = [];
  filteredDivisions: any[] = [];
  employeeFilterId: number | null = null;
  filterEmployeeSearch = '';
  filterEmployees: any[] = [];

  cycles: any[] = [];
  salaryHeads: any[] = [];

  formLoading = false;
  editingWageId: number | null = null;

  selectedCycleId = '';
  currentPeriod: any = null;
  currentCycle: any = null;

  rateBasedEmployees: any[] = [];
  employeesLoading = false;

  employeeSearchText = '';
  employeeDropdownOpen = false;
  filteredEmployees: any[] = [];
  selectedEmployee: any = null;

  employeeSalaryHeads: any[] = [];
  employeeSalaryHeadsLoading = false;

  addForm: any = this.resetAddForm();

  Math = Math;
  formIsLocked = false;

  private injector: Injector;

  constructor(private api: ApiService, private ui: UiService, private cdr: ChangeDetectorRef, private currentUser: CurrentUserService, injector: Injector) {
    this.injector = injector;
    let firstRun = true;
    effect(() => {
      const _user = this.currentUser.currentUser();
      if (firstRun) { firstRun = false; return; }
      this.loadCanApprove();
      this.loadWages();
    }, { injector: this.injector });
  }

  canApprove = true;

  listCycleId = '';
  listPeriodId = '';
  listCycles: any[] = [];

  ngOnInit(): void {
    this.loadCanApprove();
    this.loadCycles();
    this.loadSalaryHeads();
    this.loadDepartments();
    this.initCurrentTab();
  }

  loadCanApprove(): void {
    this.api.getRaw<any>('/payroll/wages/can-approve').subscribe({
      next: (res: any) => {
        this.canApprove = res?.data?.canApprove === true;
        this.cdr.detectChanges();
      },
      error: () => {
        this.canApprove = true;
        this.cdr.detectChanges();
      }
    });
  }

  resetAddForm(): any {
    return {
      employee_id: '',
      salary_head_id: '',
      unit: 0,
      reference_no: '',
      notes: ''
    };
  }

  initCurrentTab(): void {
    this.loading = true;
    this.api.get<any[]>('/payroll/cycles').subscribe({
      next: (data) => {
        this.listCycles = (data || []).filter((c: any) => c.enabled);
        this.listCycleId = '';
        this.listPeriodId = '';
        this.loadWages();
      },
      error: () => {
        this.listCycles = [];
        this.loading = false;
        this.transactions = [];
        this.cdr.detectChanges();
      }
    });
  }

  resolveListPeriodAndLoad(): void {
    if (!this.listCycleId) {
      this.listPeriodId = '';
      this.loadWages();
      return;
    }
    this.api.getRaw<any>('/payroll/wages/employees', { cycle_id: this.listCycleId }).subscribe({
      next: (res: any) => {
        const period = res.period;
        if (period) {
          this.listPeriodId = String(period.id);
        } else {
          this.listPeriodId = '';
        }
        this.loadWages();
      },
      error: () => {
        this.listPeriodId = '';
        this.loading = false;
        this.transactions = [];
        this.cdr.detectChanges();
      }
    });
  }

  loadCycles(): void {
    this.api.get<any[]>('/payroll/cycles').subscribe({
      next: (data) => {
        this.cycles = (data || []).filter((c: any) => c.enabled);
        this.cdr.detectChanges();
      },
      error: () => { this.cycles = []; this.cdr.detectChanges(); }
    });
  }

  loadSalaryHeads(): void {
    this.api.get<any>('/payroll/wages/salary-heads').subscribe({
      next: (d) => { this.salaryHeads = d || []; this.cdr.detectChanges(); },
      error: () => { this.salaryHeads = []; this.cdr.detectChanges(); }
    });
  }

  loadDepartments(): void {
    this.api.get<any>('/departments').subscribe({
      next: (data: any) => {
        this.departments = data || [];
        this.cdr.detectChanges();
      },
      error: () => { this.departments = []; this.cdr.detectChanges(); }
    });
  }

  switchTab(tab: 'current' | 'processed'): void {
    if (this.activeTab === tab) return;
    this.activeTab = tab;
    if (tab === 'processed') {
      this.loadProcessedWages();
    } else {
      this.loadWages();
    }
    this.cdr.detectChanges();
  }

  loadWages(): void {
    this.loading = true;
    const params: any = {};
    if (this.listCycleId) params.cycle_id = this.listCycleId;
    if (this.listPeriodId) params.period_id = this.listPeriodId;
    if (this.statusFilter) params.status = this.statusFilter;
    if (this.employeeFilterId) params.employee_id = this.employeeFilterId;

    this.api.getRaw<any>('/payroll/wages/transactions', params).subscribe({
      next: (res: any) => {
        this.allTransactions = res.data || [];
        this.loading = false;
        this.selectedWageIds.clear();
        this.applyClientFiltersAndPaginate();
      },
      error: () => {
        this.allTransactions = [];
        this.transactions = [];
        this.total = 0;
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyClientFiltersAndPaginate(): void {
    let filtered = this.allTransactions;

    if (this.departmentFilter) {
      filtered = filtered.filter(t => String(t.department_id) === this.departmentFilter);
    }
    if (this.divisionFilter) {
      filtered = filtered.filter(t => String(t.division_id) === this.divisionFilter);
    }

    this.total = filtered.length;
    const start = (this.page - 1) * this.limit;
    this.transactions = filtered.slice(start, start + this.limit);
    this.cdr.detectChanges();
  }

  onListCycleChange(): void {
    this.page = 1;
    this.selectedWageIds.clear();
    if (this.listCycleId) {
      this.resolveListPeriodAndLoad();
    } else {
      this.listPeriodId = '';
      this.allTransactions = [];
      this.transactions = [];
      this.total = 0;
      this.cdr.detectChanges();
    }
  }

  loadProcessedWages(): void {
    this.processedLoading = true;
    const params: any = { tab: 'processed', page: this.processedPage, limit: this.processedLimit };
    if (this.processedEmployeeFilterId) params.employee_id = this.processedEmployeeFilterId;
    if (this.processedCycleFilter) params.cycle_id = this.processedCycleFilter;

    this.api.getRaw<any>('/payroll/wages/transactions', params).subscribe({
      next: (res: any) => {
        this.processedWages = res.data || [];
        this.processedTotal = res.meta?.total || 0;
        this.processedLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.processedWages = [];
        this.processedLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onPageChange(p: number): void {
    this.page = p;
    this.applyClientFiltersAndPaginate();
  }

  onProcessedPageChange(p: number): void {
    this.processedPage = p;
    this.loadProcessedWages();
  }

  onFilterChange(): void {
    this.page = 1;
    this.loadWages();
  }

  onClientFilterChange(): void {
    this.page = 1;
    this.selectedWageIds.clear();
    this.applyClientFiltersAndPaginate();
  }

  onDepartmentFilterChange(): void {
    this.divisionFilter = '';
    if (this.departmentFilter) {
      this.api.get<any>(`/departments/${this.departmentFilter}/divisions`).subscribe({
        next: (data: any) => {
          this.filteredDivisions = data || [];
          this.cdr.detectChanges();
        },
        error: () => { this.filteredDivisions = []; this.cdr.detectChanges(); }
      });
    } else {
      this.filteredDivisions = [];
    }
    this.onClientFilterChange();
  }

  onProcessedFilterChange(): void {
    this.processedPage = 1;
    this.loadProcessedWages();
  }

  searchFilterEmployees(): void {
    if (!this.filterEmployeeSearch || this.filterEmployeeSearch.length < 2) {
      this.filterEmployees = [];
      this.cdr.detectChanges();
      return;
    }
    this.api.getPaginated<any>('/employees', { search: this.filterEmployeeSearch, limit: 20 }).subscribe({
      next: (res: any) => {
        this.filterEmployees = res.data || [];
        this.cdr.detectChanges();
      },
      error: () => {
        this.filterEmployees = [];
        this.cdr.detectChanges();
      }
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

  searchProcessedFilterEmployees(): void {
    if (!this.processedFilterEmployeeSearch || this.processedFilterEmployeeSearch.length < 2) {
      this.processedFilterEmployees = [];
      this.cdr.detectChanges();
      return;
    }
    this.api.getPaginated<any>('/employees', { search: this.processedFilterEmployeeSearch, limit: 20 }).subscribe({
      next: (res: any) => {
        this.processedFilterEmployees = res.data || [];
        this.cdr.detectChanges();
      },
      error: () => {
        this.processedFilterEmployees = [];
        this.cdr.detectChanges();
      }
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

  openAddForm(): void {
    this.addForm = this.resetAddForm();
    this.selectedEmployee = null;
    this.employeeSearchText = '';
    this.filteredEmployees = [];
    this.employeeSalaryHeads = [];
    this.editingWageId = null;
    this.selectedCycleId = '';
    this.currentPeriod = null;
    this.currentCycle = null;
    this.rateBasedEmployees = [];
    this.view = 'form';
    this.cdr.detectChanges();
  }

  backToList(): void {
    this.view = 'list';
    this.editingWageId = null;
    if (this.activeTab === 'processed') {
      this.loadProcessedWages();
    } else {
      this.loadWages();
    }
  }

  onCycleChange(): void {
    this.currentPeriod = null;
    this.currentCycle = null;
    this.rateBasedEmployees = [];
    this.selectedEmployee = null;
    this.employeeSearchText = '';
    this.addForm.employee_id = '';
    this.addForm.salary_head_id = '';
    this.employeeSalaryHeads = [];
    if (this.selectedCycleId) {
      this.loadRateBasedEmployees();
      this.checkFormLockStatus(this.selectedCycleId);
    } else {
      this.formIsLocked = false;
    }
    this.cdr.detectChanges();
  }

  checkFormLockStatus(cycleId: any): void {
    if (!cycleId) { this.formIsLocked = false; this.cdr.detectChanges(); return; }
    this.api.getRaw<any>('/payroll/lock-status', { cycle_id: cycleId }).subscribe({
      next: (res: any) => { this.formIsLocked = res?.data?.locked === true; this.cdr.detectChanges(); },
      error: () => { this.formIsLocked = false; this.cdr.detectChanges(); }
    });
  }

  loadRateBasedEmployees(): void {
    if (!this.selectedCycleId) return;
    this.employeesLoading = true;
    this.api.getRaw<any>('/payroll/wages/employees', { cycle_id: this.selectedCycleId }).subscribe({
      next: (res: any) => {
        this.rateBasedEmployees = res.data || [];
        this.currentPeriod = res.period;
        this.currentCycle = res.cycle;
        this.employeesLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.rateBasedEmployees = [];
        this.employeesLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onEmployeeSearchFocus(): void {
    this.employeeDropdownOpen = true;
    this.filterFormEmployees();
    this.cdr.detectChanges();
  }

  onEmployeeSearchBlur(): void {
    setTimeout(() => {
      this.employeeDropdownOpen = false;
      if (!this.selectedEmployee) {
        this.employeeSearchText = '';
      }
      this.cdr.detectChanges();
    }, 200);
  }

  filterFormEmployees(): void {
    const q = (this.employeeSearchText || '').toLowerCase().trim();
    if (!q) {
      this.filteredEmployees = this.rateBasedEmployees.slice(0, 50);
    } else {
      this.filteredEmployees = this.rateBasedEmployees.filter(e =>
        String(e.id).includes(q) ||
        (e.employee_code || '').toLowerCase().includes(q) ||
        (e.first_name || '').toLowerCase().includes(q) ||
        (e.surname || '').toLowerCase().includes(q) ||
        `${e.first_name} ${e.surname}`.toLowerCase().includes(q)
      ).slice(0, 50);
    }
    this.cdr.detectChanges();
  }

  onEmployeeSearchInput(): void {
    if (this.selectedEmployee) {
      this.selectedEmployee = null;
      this.addForm.employee_id = '';
      this.addForm.salary_head_id = '';
      this.employeeSalaryHeads = [];
    }
    this.employeeDropdownOpen = true;
    this.filterFormEmployees();
  }

  selectFormEmployee(emp: any): void {
    this.selectedEmployee = emp;
    this.addForm.employee_id = emp.id;
    this.employeeSearchText = `${emp.id} | ${emp.employee_code} - ${emp.first_name} ${emp.surname}`;
    this.employeeDropdownOpen = false;
    this.addForm.salary_head_id = '';
    this.employeeSalaryHeads = [];
    this.loadEmployeeSalaryHeads(emp.id);
    this.cdr.detectChanges();
  }

  clearFormEmployee(): void {
    this.selectedEmployee = null;
    this.addForm.employee_id = '';
    this.employeeSearchText = '';
    this.employeeSalaryHeads = [];
    this.addForm.salary_head_id = '';
    this.cdr.detectChanges();
  }

  loadEmployeeSalaryHeads(employeeId: number): void {
    this.employeeSalaryHeadsLoading = true;
    this.api.get<any[]>(`/payroll/wages/employee-salary-transactions/${employeeId}`).subscribe({
      next: (data) => {
        this.employeeSalaryHeads = data || [];
        this.employeeSalaryHeadsLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.employeeSalaryHeads = [];
        this.employeeSalaryHeadsLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  get addRateLabel(): string {
    if (!this.selectedEmployee) return 'Rate';
    const sbo = this.selectedEmployee.salary_based_on;
    if (sbo === 'RATE_PER_HOUR') return 'Rate Per Hour';
    if (sbo === 'RATE_PER_DAY') return 'Rate Per Day';
    return 'Rate';
  }

  get addRate(): number {
    return parseFloat(this.selectedEmployee?.wage_rate) || 0;
  }

  get addTotal(): number {
    const unit = parseFloat(this.addForm.unit) || 0;
    return parseFloat((unit * this.addRate).toFixed(2));
  }

  get unitLabel(): string {
    if (!this.selectedEmployee) return 'Unit';
    const sbo = this.selectedEmployee.salary_based_on;
    if (sbo === 'RATE_PER_HOUR') return 'Hours';
    if (sbo === 'RATE_PER_DAY') return 'Days';
    return 'Unit';
  }

  submitAdd(): void {
    if (!this.addForm.employee_id || !this.addForm.salary_head_id) {
      this.ui.toast('warning', 'Validation', 'Select an employee and salary transaction');
      return;
    }
    const unit = parseFloat(this.addForm.unit) || 0;
    if (unit <= 0) {
      this.ui.toast('warning', 'Validation', 'Unit must be greater than 0');
      return;
    }
    if (!this.currentPeriod) {
      this.ui.toast('warning', 'Validation', 'No open period found for this cycle');
      return;
    }

    const emp = this.selectedEmployee;
    const sbo = emp?.salary_based_on || 'CAPTURED_VALUE';
    const rate = parseFloat(emp?.wage_rate) || 0;
    let hours = 0, days = 0, amount = 0;
    if (sbo === 'RATE_PER_HOUR') {
      hours = unit;
      amount = parseFloat((hours * rate).toFixed(2));
    } else if (sbo === 'RATE_PER_DAY') {
      days = unit;
      amount = parseFloat((days * rate).toFixed(2));
    } else {
      hours = unit;
      amount = unit;
    }

    this.formLoading = true;

    if (this.editingWageId) {
      this.api.put(`/payroll/wages/transactions/${this.editingWageId}`, {
        salary_head_id: parseInt(this.addForm.salary_head_id),
        hours, days, rate, amount,
        reference_no: this.addForm.reference_no,
        notes: this.addForm.notes
      }).subscribe({
        next: () => {
          this.ui.toast('success', 'Updated', 'Wage transaction updated');
          this.formLoading = false;
          this.editingWageId = null;
          this.backToList();
        },
        error: () => {
          this.ui.toast('error', 'Error', 'Failed to update transaction');
          this.formLoading = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      this.api.post('/payroll/wages/transactions', {
        employee_id: parseInt(this.addForm.employee_id),
        salary_head_id: parseInt(this.addForm.salary_head_id),
        period_id: this.currentPeriod.id,
        cycle_id: parseInt(this.selectedCycleId),
        hours, days, rate, amount,
        reference_no: this.addForm.reference_no,
        notes: this.addForm.notes
      }).subscribe({
        next: () => {
          this.ui.toast('success', 'Submitted', 'Wage transaction submitted');
          this.formLoading = false;
          this.backToList();
        },
        error: (err: any) => {
          const msg = err?.error?.message || err?.message || 'Failed to add transaction';
          this.ui.toast('error', 'Error', msg);
          this.formLoading = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  viewWage(tx: any): void {
    this.detailWage = tx;
    this.wageHistory = [];
    this.view = 'detail';
    this.loadWageHistory(tx.id);
    this.cdr.detectChanges();
  }

  loadWageHistory(id: number): void {
    this.historyLoading = true;
    this.api.getRaw<any>(`/payroll/wages/transactions/${id}/history`).subscribe({
      next: (res: any) => {
        this.wageHistory = res?.data || [];
        this.historyLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.wageHistory = [];
        this.historyLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  editWage(tx: any): void {
    this.editingWageId = tx.id;
    this.selectedCycleId = String(tx.cycle_id || '');
    this.currentPeriod = tx.period_id ? { id: tx.period_id } : null;
    this.currentCycle = { name: tx.cycle_name || '' };

    this.addForm = {
      employee_id: tx.employee_id,
      salary_head_id: String(tx.salary_head_id),
      unit: this.getTxUnit(tx),
      reference_no: tx.reference_no || '',
      notes: tx.notes || ''
    };

    this.selectedEmployee = {
      id: tx.employee_id,
      employee_code: tx.employee_code,
      first_name: tx.first_name,
      surname: tx.surname,
      salary_based_on: tx.salary_based_on || 'CAPTURED_VALUE',
      wage_rate: tx.rate
    };
    this.employeeSearchText = `${tx.employee_id} | ${tx.employee_code || ''} - ${tx.first_name} ${tx.surname}`;

    this.employeeSalaryHeads = [];
    this.loadEmployeeSalaryHeads(tx.employee_id);

    if (this.selectedCycleId) {
      this.loadRateBasedEmployees();
    }

    this.checkFormLockStatus(tx.cycle_id);
    this.view = 'form';
    this.cdr.detectChanges();
  }

  editAndResubmit(tx: any): void {
    this.editWage(tx);
  }

  async deleteTx(tx: any): Promise<void> {
    if (tx.status !== 'PENDING') {
      this.ui.toast('warning', 'Cannot Delete', 'Only pending transactions can be deleted');
      return;
    }
    const confirmed = await this.ui.confirm({
      title: 'Delete Transaction',
      message: `Delete wage transaction for ${tx.first_name} ${tx.surname} - ${tx.head_name}?`,
      danger: true
    });
    if (!confirmed) return;
    this.api.delete(`/payroll/wages/transactions/${tx.id}`).subscribe({
      next: () => {
        this.ui.toast('success', 'Deleted', 'Transaction removed');
        this.loadWages();
      },
      error: () => { this.ui.toast('error', 'Error', 'Failed to delete'); this.cdr.detectChanges(); }
    });
  }

  async approveWage(tx: any): Promise<void> {
    const confirmed = await this.ui.confirm({
      title: 'Approve Wage',
      message: `Approve wage transaction for ${tx.first_name} ${tx.surname} - ${this.formatCurrency(parseFloat(tx.amount) || 0)}?`
    });
    if (!confirmed) return;

    this.api.postRaw('/payroll/wages/transactions/approve', { ids: [tx.id] }).subscribe({
      next: (res: any) => {
        const msg = res?.message || 'Wage transaction approved';
        const title = res?.finalApproval ? 'Fully Approved' : 'Step Approved';
        this.ui.toast('success', title, msg);
        if (this.view === 'detail') {
          this.detailWage.status = res?.finalApproval ? 'APPROVED' : this.detailWage.status;
          this.loadWageHistory(tx.id);
          this.cdr.detectChanges();
        }
        this.loadWages();
      },
      error: (err: any) => {
        const msg = err?.error?.error?.message || err?.error?.message || 'Failed to approve';
        this.ui.toast('error', err.status === 403 ? 'Unauthorized' : 'Error', msg);
        this.cdr.detectChanges();
      }
    });
  }

  rejectWage(tx: any): void {
    this.rejectComment = '';
    this.rejectTarget = tx;
    this.rejectIsBulk = false;
    this.showRejectModal = true;
    this.cdr.detectChanges();
  }

  confirmReject(): void {
    if (!this.rejectComment.trim()) {
      this.ui.toast('error', 'Required', 'Please provide a reason for rejection');
      return;
    }
    this.showRejectModal = false;
    this.cdr.detectChanges();

    if (this.rejectIsBulk) {
      const ids = Array.from(this.selectedWageIds);
      this.bulkProcessing = true;
      this.cdr.detectChanges();
      this.api.postRaw('/payroll/wages/transactions/reject', { ids, comments: this.rejectComment.trim() }).subscribe({
        next: (res: any) => {
          const data = res?.data || {};
          const rejected = data.rejected ?? data.count ?? ids.length;
          const failed = data.failed ?? 0;
          const failedIds: number[] = data.failedIds || [];
          if (failed > 0 && failedIds.length > 0) {
            this.ui.toast('warning', 'Partial Rejection', `${rejected} transaction(s) rejected, ${failed} failed`);
            this.showFailedTransactions('Rejection Failures', failedIds);
          } else if (failed > 0) {
            this.ui.toast('warning', 'Partial Rejection', `${rejected} transaction(s) rejected, ${failed} failed`);
          } else {
            this.ui.toast('success', 'Bulk Rejected', `${rejected} transaction(s) rejected`);
          }
          this.bulkProcessing = false;
          this.selectedWageIds.clear();
          this.loadWages();
        },
        error: () => {
          this.ui.toast('error', 'Error', 'Failed to bulk reject');
          this.bulkProcessing = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      const tx = this.rejectTarget;
      this.api.postRaw('/payroll/wages/transactions/reject', { ids: [tx.id], comments: this.rejectComment.trim() }).subscribe({
        next: (res: any) => {
          this.ui.toast('success', 'Rejected', res?.message || 'Wage transaction rejected.');
          if (this.view === 'detail') {
            this.detailWage.status = 'REJECTED';
            this.loadWageHistory(tx.id);
            this.cdr.detectChanges();
          }
          this.loadWages();
        },
        error: (err: any) => {
          const msg = err?.error?.error?.message || err?.error?.message || 'Failed to reject';
          this.ui.toast('error', err.status === 403 ? 'Unauthorized' : 'Error', msg);
          this.cdr.detectChanges();
        }
      });
    }
  }

  cancelReject(): void {
    this.showRejectModal = false;
    this.rejectTarget = null;
    this.rejectComment = '';
    this.rejectIsBulk = false;
    this.cdr.detectChanges();
  }

  returnWage(tx: any): void {
    this.returnComment = '';
    this.returnTarget = tx;
    this.returnIsBulk = false;
    this.showReturnModal = true;
    this.cdr.detectChanges();
  }

  confirmReturn(): void {
    if (!this.returnComment.trim()) {
      this.ui.toast('error', 'Required', 'Please provide a reason for returning the transaction');
      return;
    }
    this.showReturnModal = false;
    this.cdr.detectChanges();

    if (this.returnIsBulk) {
      const ids = Array.from(this.selectedWageIds);
      if (ids.length === 0) {
        this.ui.toast('warning', 'No Selection', 'No transactions selected for return');
        return;
      }
      this.bulkProcessing = true;
      this.cdr.detectChanges();
      this.api.postRaw('/payroll/wages/transactions/return', { ids, comments: this.returnComment.trim() }).subscribe({
        next: (res: any) => {
          const data = res?.data || {};
          const returned = data.returned ?? data.count ?? ids.length;
          const failed = data.failed ?? 0;
          const failedIds: number[] = data.failedIds || [];
          if (failed > 0 && failedIds.length > 0) {
            this.ui.toast('warning', 'Partial Return', `${returned} transaction(s) returned, ${failed} failed`);
            this.showFailedTransactions('Return Failures', failedIds);
          } else if (failed > 0) {
            this.ui.toast('warning', 'Partial Return', `${returned} transaction(s) returned, ${failed} failed`);
          } else {
            this.ui.toast('success', 'Bulk Returned', `${returned} transaction(s) returned for correction`);
          }
          this.bulkProcessing = false;
          this.returnIsBulk = false;
          this.selectedWageIds.clear();
          this.loadWages();
        },
        error: () => {
          this.ui.toast('error', 'Error', 'Failed to bulk return');
          this.bulkProcessing = false;
          this.returnIsBulk = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      const tx = this.returnTarget;
      if (!tx) return;
      this.api.postRaw('/payroll/wages/transactions/return', { ids: [tx.id], comments: this.returnComment.trim() }).subscribe({
        next: (res: any) => {
          this.ui.toast('success', 'Returned', res?.message || 'Wage transaction returned for correction.');
          if (this.view === 'detail') {
            this.detailWage.status = 'RETURNED';
            this.loadWageHistory(tx.id);
            this.cdr.detectChanges();
          }
          this.loadWages();
        },
        error: (err: any) => {
          const msg = err?.error?.error?.message || err?.error?.message || 'Failed to return transaction';
          this.ui.toast('error', 'Error', msg);
          this.cdr.detectChanges();
        }
      });
    }
  }

  cancelReturn(): void {
    this.showReturnModal = false;
    this.returnTarget = null;
    this.returnComment = '';
    this.returnIsBulk = false;
    this.cdr.detectChanges();
  }

  bulkReturn(): void {
    this.returnComment = '';
    this.returnTarget = null;
    this.returnIsBulk = true;
    this.showReturnModal = true;
    this.cdr.detectChanges();
  }

  get pendingWages(): any[] {
    return this.transactions.filter(t => t.status === 'PENDING');
  }

  get allPendingSelected(): boolean {
    const pending = this.pendingWages;
    return pending.length > 0 && pending.every(t => this.selectedWageIds.has(t.id));
  }

  get selectedCount(): number {
    return this.selectedWageIds.size;
  }

  get selectedTotal(): number {
    return this.allTransactions
      .filter(t => this.selectedWageIds.has(t.id))
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
  }

  toggleSelectAll(): void {
    const pending = this.pendingWages;
    if (this.allPendingSelected) {
      pending.forEach(t => this.selectedWageIds.delete(t.id));
    } else {
      pending.forEach(t => this.selectedWageIds.add(t.id));
    }
    this.cdr.detectChanges();
  }

  toggleWageSelection(id: number): void {
    if (this.selectedWageIds.has(id)) {
      this.selectedWageIds.delete(id);
    } else {
      this.selectedWageIds.add(id);
    }
    this.cdr.detectChanges();
  }

  async bulkApprove(): Promise<void> {
    const ids = Array.from(this.selectedWageIds);
    const confirmed = await this.ui.confirm({
      title: 'Bulk Approve Wages',
      message: `Approve ${ids.length} wage transaction(s) totalling ${this.formatCurrency(this.selectedTotal)}?`
    });
    if (!confirmed) return;

    this.bulkProcessing = true;
    this.cdr.detectChanges();
    this.api.postRaw('/payroll/wages/transactions/approve', { ids }).subscribe({
      next: (res: any) => {
        const data = res?.data || {};
        const failed = data.failed ?? 0;
        const count = data.count ?? 0;
        const skipReasons = data.skipReasons || {};
        const reasonList = Object.keys(skipReasons);
        const reasonText = reasonList.length === 1 ? reasonList[0] : reasonList.map(r => `${skipReasons[r]}x: ${r}`).join('; ');
        if (count === 0 && failed > 0) {
          this.ui.toast('warning', 'None Approved', `${failed} transaction(s) skipped: ${reasonText}`);
        } else if (failed > 0) {
          this.ui.toast('warning', 'Partial Approval', `${count} transaction(s) approved, ${failed} skipped: ${reasonText}`);
        } else {
          this.ui.toast('success', 'Bulk Approved', `${count} transaction(s) approved`);
        }
        this.bulkProcessing = false;
        this.selectedWageIds.clear();
        this.loadWages();
      },
      error: () => {
        this.ui.toast('error', 'Error', 'Failed to bulk approve');
        this.bulkProcessing = false;
        this.cdr.detectChanges();
      }
    });
  }

  bulkReject(): void {
    this.rejectComment = '';
    this.rejectTarget = null;
    this.rejectIsBulk = true;
    this.showRejectModal = true;
    this.cdr.detectChanges();
  }

  getTxUnit(tx: any): number {
    const h = parseFloat(tx.hours) || 0;
    const d = parseFloat(tx.days) || 0;
    return h > 0 ? h : d;
  }

  getTxRate(tx: any): number {
    return parseFloat(tx.rate) || 0;
  }

  getTxTotal(tx: any): number {
    return parseFloat(tx.amount) || 0;
  }

  getHeadName(headId: number): string {
    const h = this.salaryHeads.find(s => s.id === headId);
    return h ? `${h.code} - ${h.name}` : '';
  }

  getPeriodLabel(): string {
    if (!this.currentPeriod) return '';
    if (!this.currentPeriod.start_date) {
      return this.currentPeriod.period_number ? `Period ${this.currentPeriod.period_number}` : `Period #${this.currentPeriod.id}`;
    }
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const d = new Date(this.currentPeriod.start_date);
    if (isNaN(d.getTime())) return `Period #${this.currentPeriod.id}`;
    return `${months[d.getMonth()]} ${d.getFullYear()} (Period ${this.currentPeriod.period_number || this.currentPeriod.id})`;
  }

  getProcessedPeriodLabel(tx: any): string {
    if (!tx.period_start_date) return '-';
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const d = new Date(tx.period_start_date);
    return `${months[d.getMonth()]} ${d.getFullYear()} (Period ${tx.period_number})`;
  }

  getTxPeriodLabel(tx: any): string {
    if (tx.period_start_date) return this.getProcessedPeriodLabel(tx);
    if (tx.period_number) {
      return `Period ${tx.period_number}`;
    }
    return '-';
  }

  getActionIcon(action: string): string {
    switch (action) {
      case 'SUBMITTED': return 'plus';
      case 'APPROVED': return 'check';
      case 'REJECTED': return 'x';
      case 'RETURNED': return 'chevronLeft';
      case 'PAID': return 'dollar';
      default: return 'clock';
    }
  }

  getActionColor(action: string): string {
    switch (action) {
      case 'SUBMITTED': return '#3b82f6';
      case 'APPROVED': return '#16a34a';
      case 'REJECTED': return '#ef4444';
      case 'RETURNED': return '#f59e0b';
      case 'PAID': return '#8b5cf6';
      default: return '#64748b';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'PENDING': return 'clock';
      case 'APPROVED': return 'check';
      case 'REJECTED': return 'x';
      case 'RETURNED': return 'chevronLeft';
      case 'PROCESSED': return 'dollar';
      default: return 'clock';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'PENDING': return '#f59e0b';
      case 'APPROVED': return '#16a34a';
      case 'REJECTED': return '#ef4444';
      case 'RETURNED': return '#d97706';
      case 'PROCESSED': return '#8b5cf6';
      default: return '#64748b';
    }
  }

  showFailedTransactions(title: string, failedIds: number[]): void {
    this.failedModalTitle = title;
    this.failedTransactions = failedIds.map(id => {
      const tx = this.allTransactions.find(t => t.id === id);
      return tx
        ? { id, employee_name: `${tx.first_name} ${tx.surname}`, employee_code: tx.employee_code, head_name: tx.head_name, amount: parseFloat(tx.amount) || 0, _tx: tx }
        : { id, employee_name: 'Unknown', employee_code: '', head_name: '', amount: 0, _tx: null };
    });
    this.showFailedModal = true;
    this.cdr.detectChanges();
  }

  closeFailedModal(): void {
    this.showFailedModal = false;
    this.failedTransactions = [];
    this.failedModalTitle = '';
    this.cdr.detectChanges();
  }

  viewFailedTransaction(ft: any): void {
    if (ft._tx) {
      this.closeFailedModal();
      this.viewWage(ft._tx);
    }
  }

  formatCurrency(value: number): string {
    const whole = Math.floor(Math.abs(value)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    const dec = Math.abs(value).toFixed(2).split('.')[1];
    return `R ${value < 0 ? '-' : ''}${whole}.${dec}`;
  }
}
