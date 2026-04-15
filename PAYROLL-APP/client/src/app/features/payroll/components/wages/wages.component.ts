import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { UiService } from '../../../../core/services/ui.service';
import { IconComponent } from '../../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-wages',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './wages.component.html',
  styleUrl: './wages.component.css'
})
export class WagesComponent implements OnInit {
  cycles: any[] = [];
  selectedCycleId = '';
  currentPeriod: any = null;
  currentCycle: any = null;

  employees: any[] = [];
  employeesLoading = false;

  transactions: any[] = [];
  txLoading = false;
  salaryHeads: any[] = [];

  addForm: any = this.resetAddForm();
  addLoading = false;
  selectedEmployee: any = null;
  employeeSalaryHeads: any[] = [];
  employeeSalaryHeadsLoading = false;

  employeeSearchText = '';
  employeeDropdownOpen = false;
  filteredEmployees: any[] = [];

  showEditModal = false;
  editForm: any = {};
  editLoading = false;
  editingTx: any = null;
  editEmployeeSalaryHeads: any[] = [];

  statusFilter = '';

  Math = Math;

  constructor(private api: ApiService, private ui: UiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadCycles();
    this.loadSalaryHeads();
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
      error: () => { this.salaryHeads = []; }
    });
  }

  onCycleChange(): void {
    this.currentPeriod = null;
    this.currentCycle = null;
    this.employees = [];
    this.transactions = [];
    this.selectedEmployee = null;
    this.addForm = this.resetAddForm();
    if (this.selectedCycleId) {
      this.loadEmployees();
    }
    this.cdr.detectChanges();
  }

  loadEmployees(): void {
    if (!this.selectedCycleId) return;
    this.employeesLoading = true;

    this.api.getRaw<any>('/payroll/wages/employees', { cycle_id: this.selectedCycleId }).subscribe({
      next: (res: any) => {
        this.employees = res.data || [];
        this.currentPeriod = res.period;
        this.currentCycle = res.cycle;
        this.employeesLoading = false;
        if (this.currentPeriod) this.loadTransactions();
        this.cdr.detectChanges();
      },
      error: () => {
        this.employees = [];
        this.employeesLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadTransactions(): void {
    if (!this.currentPeriod) return;
    this.txLoading = true;
    const params: any = { period_id: this.currentPeriod.id, cycle_id: this.selectedCycleId };
    if (this.statusFilter) params.status = this.statusFilter;

    this.api.getRaw<any>('/payroll/wages/transactions', params).subscribe({
      next: (res: any) => {
        this.transactions = res.data || [];
        this.txLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.transactions = [];
        this.txLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onEmployeeSearchFocus(): void {
    this.employeeDropdownOpen = true;
    this.filterEmployees();
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

  filterEmployees(): void {
    const q = (this.employeeSearchText || '').toLowerCase().trim();
    if (!q) {
      this.filteredEmployees = this.employees.slice(0, 50);
    } else {
      this.filteredEmployees = this.employees.filter(e =>
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
    this.filterEmployees();
  }

  selectEmployee(emp: any): void {
    this.selectedEmployee = emp;
    this.addForm.employee_id = emp.id;
    this.employeeSearchText = `${emp.id} - ${emp.first_name} ${emp.surname}`;
    this.employeeDropdownOpen = false;
    this.addForm.salary_head_id = '';
    this.employeeSalaryHeads = [];
    this.loadEmployeeSalaryHeads(emp.id);
    this.cdr.detectChanges();
  }

  onEmployeeSelect(): void {
    const empId = parseInt(this.addForm.employee_id);
    this.selectedEmployee = this.employees.find(e => e.id === empId) || null;
    this.addForm.salary_head_id = '';
    this.employeeSalaryHeads = [];
    if (this.selectedEmployee) {
      this.loadEmployeeSalaryHeads(empId);
    }
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

  get editUnitLabel(): string {
    if (!this.editingTx) return 'Unit';
    const emp = this.employees.find(e => e.id === this.editingTx.employee_id);
    const sbo = emp?.salary_based_on || 'CAPTURED_VALUE';
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

    this.addLoading = true;
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
        this.ui.toast('success', 'Added', 'Wage transaction added');
        this.addForm = this.resetAddForm();
        this.selectedEmployee = null;
        this.employeeSearchText = '';
        this.employeeSalaryHeads = [];
        this.addLoading = false;
        this.loadTransactions();
        this.cdr.detectChanges();
      },
      error: () => {
        this.ui.toast('error', 'Error', 'Failed to add transaction');
        this.addLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  cancelAdd(): void {
    this.addForm = this.resetAddForm();
    this.selectedEmployee = null;
    this.employeeSearchText = '';
    this.employeeSalaryHeads = [];
    this.cdr.detectChanges();
  }

  openEditTransaction(tx: any): void {
    if (tx.status !== 'PENDING') return;
    this.editingTx = tx;
    const emp = this.employees.find(e => e.id === tx.employee_id);
    const sbo = emp?.salary_based_on || 'CAPTURED_VALUE';
    let unit = 0;
    if (sbo === 'RATE_PER_HOUR') unit = parseFloat(tx.hours) || 0;
    else if (sbo === 'RATE_PER_DAY') unit = parseFloat(tx.days) || 0;
    else unit = parseFloat(tx.amount) || parseFloat(tx.hours) || parseFloat(tx.days) || 0;

    this.editForm = {
      salary_head_id: tx.salary_head_id,
      unit,
      reference_no: tx.reference_no || '',
      notes: tx.notes || ''
    };
    this.editEmployeeSalaryHeads = [];
    this.api.get<any[]>(`/payroll/wages/employee-salary-transactions/${tx.employee_id}`).subscribe({
      next: (data) => { this.editEmployeeSalaryHeads = data || []; this.cdr.detectChanges(); },
      error: () => { this.editEmployeeSalaryHeads = []; this.cdr.detectChanges(); }
    });
    this.showEditModal = true;
    this.cdr.detectChanges();
  }

  get editRate(): number {
    if (!this.editingTx) return 0;
    const emp = this.employees.find(e => e.id === this.editingTx.employee_id);
    return parseFloat(emp?.wage_rate) || 0;
  }

  get editTotal(): number {
    const unit = parseFloat(this.editForm.unit) || 0;
    return parseFloat((unit * this.editRate).toFixed(2));
  }

  get editRateLabel(): string {
    if (!this.editingTx) return 'Rate';
    const emp = this.employees.find(e => e.id === this.editingTx.employee_id);
    const sbo = emp?.salary_based_on || 'CAPTURED_VALUE';
    if (sbo === 'RATE_PER_HOUR') return 'Rate Per Hour';
    if (sbo === 'RATE_PER_DAY') return 'Rate Per Day';
    return 'Rate';
  }

  getTxRate(tx: any): number {
    return parseFloat(tx.rate) || 0;
  }

  getTxTotal(tx: any): number {
    return parseFloat(tx.amount) || 0;
  }

  submitEdit(): void {
    if (!this.editingTx) return;
    const unit = parseFloat(this.editForm.unit) || 0;
    if (unit <= 0) {
      this.ui.toast('warning', 'Validation', 'Unit must be greater than 0');
      return;
    }

    const emp = this.employees.find(e => e.id === this.editingTx.employee_id);
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

    this.editLoading = true;
    this.api.put(`/payroll/wages/transactions/${this.editingTx.id}`, {
      salary_head_id: parseInt(this.editForm.salary_head_id),
      hours, days, rate, amount,
      reference_no: this.editForm.reference_no,
      notes: this.editForm.notes
    }).subscribe({
      next: () => {
        this.ui.toast('success', 'Updated', 'Wage transaction updated');
        this.showEditModal = false;
        this.editLoading = false;
        this.editingTx = null;
        this.loadTransactions();
        this.cdr.detectChanges();
      },
      error: () => {
        this.ui.toast('error', 'Error', 'Failed to update transaction');
        this.editLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editingTx = null;
    this.cdr.detectChanges();
  }

  approveSelected(): void {
    const pending = this.transactions.filter(t => t.status === 'PENDING' && t._selected);
    if (pending.length === 0) {
      this.ui.toast('warning', 'Selection', 'Select pending transactions to approve');
      return;
    }
    this.api.post('/payroll/wages/transactions/approve', { ids: pending.map(t => t.id) }).subscribe({
      next: (res: any) => {
        this.ui.toast('success', 'Approved', `${res?.count || pending.length} transactions approved`);
        this.loadTransactions();
      },
      error: () => { this.ui.toast('error', 'Error', 'Failed to approve'); }
    });
  }

  rejectSelected(): void {
    const pending = this.transactions.filter(t => t.status === 'PENDING' && t._selected);
    if (pending.length === 0) {
      this.ui.toast('warning', 'Selection', 'Select pending transactions to reject');
      return;
    }
    this.api.post('/payroll/wages/transactions/reject', { ids: pending.map(t => t.id) }).subscribe({
      next: (res: any) => {
        this.ui.toast('success', 'Rejected', `${res?.count || pending.length} transactions rejected`);
        this.loadTransactions();
      },
      error: () => { this.ui.toast('error', 'Error', 'Failed to reject'); }
    });
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
        this.loadTransactions();
      },
      error: () => { this.ui.toast('error', 'Error', 'Failed to delete'); this.cdr.detectChanges(); }
    });
  }

  toggleSelectAll(event: any): void {
    const checked = event.target.checked;
    this.transactions.forEach(t => { if (t.status === 'PENDING') t._selected = checked; });
    this.cdr.detectChanges();
  }

  get pendingCount(): number {
    return this.transactions.filter(t => t.status === 'PENDING').length;
  }

  get approvedCount(): number {
    return this.transactions.filter(t => t.status === 'APPROVED').length;
  }

  get selectedCount(): number {
    return this.transactions.filter(t => t._selected).length;
  }

  get totalAmount(): number {
    return this.transactions.reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
  }

  getPeriodLabel(): string {
    if (!this.currentPeriod) return '';
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const d = new Date(this.currentPeriod.start_date);
    return `${months[d.getMonth()]} ${d.getFullYear()} (Period ${this.currentPeriod.period_number})`;
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      'PENDING': 'status-pending',
      'APPROVED': 'status-approved',
      'REJECTED': 'status-rejected',
      'PROCESSED': 'status-processed'
    };
    return map[status] || '';
  }

  getTxUnit(tx: any): number {
    const h = parseFloat(tx.hours) || 0;
    const d = parseFloat(tx.days) || 0;
    return h > 0 ? h : d;
  }

  getHeadName(headId: number): string {
    const h = this.salaryHeads.find(s => s.id === headId);
    return h ? `${h.code} - ${h.name}` : '';
  }

  earningHeads(): any[] {
    return this.salaryHeads.filter(h => h.transaction_type === 'EARNING');
  }

  deductionHeads(): any[] {
    return this.salaryHeads.filter(h => h.transaction_type === 'DEDUCTION');
  }
}
