import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { UiService } from '../../../../core/services/ui.service';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { CurrencyZarPipe } from '../../../../shared/pipes/currency-zar.pipe';

@Component({
  selector: 'app-employee-payslip-view',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, CurrencyZarPipe],
  templateUrl: './employee-payslip-view.component.html',
  styleUrl: './employee-payslip-view.component.css'
})
export class EmployeePayslipViewComponent implements OnInit {
  cycles: any[] = [];
  selectedCycleId = '';
  currentPeriod: any = null;

  employees: any[] = [];
  employeesLoading = false;
  employeeSearch = '';
  employeePagination = { page: 1, limit: 50, total: 0, totalPages: 0 };
  sortBy = 'id';
  sortOrder: 'asc' | 'desc' = 'asc';

  selectedEmployee: any = null;
  selectedEmployeeIndex = -1;
  payslipData: any = null;
  payslipLoading = false;

  showPayslip = false;
  activeTab: 'earnings' | 'deductions' | 'company' | 'fringe' = 'earnings';

  showPayeModal = false;
  payeBreakdown: any = null;
  payeLoading = false;

  showAddTxModal = false;
  addTxSection = 'EARNING';
  availableTransactions: any[] = [];
  addTxForm: any = { salary_head_id: '', amount: 0, entry_date: '', reference_no: '', every_month: false };
  addTxLoading = false;
  existingTransactions: any[] = [];
  existingTxLoading = false;
  editingTxId: number | null = null;

  goToInput = '';

  Math = Math;

  constructor(private api: ApiService, private ui: UiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadCycles();
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

  onCycleChange(): void {
    this.showPayslip = false;
    this.selectedEmployee = null;
    this.payslipData = null;
    this.currentPeriod = null;
    if (this.selectedCycleId) {
      this.loadEmployees();
    } else {
      this.employees = [];
    }
  }

  loadEmployees(): void {
    if (!this.selectedCycleId) return;
    this.employeesLoading = true;
    const params: any = {
      cycle_id: this.selectedCycleId,
      page: this.employeePagination.page,
      limit: this.employeePagination.limit,
      sort_by: this.sortBy,
      sort_order: this.sortOrder,
    };
    if (this.employeeSearch) params.search = this.employeeSearch;

    this.api.getRaw<any>('/payroll/payslip-view/employees', params).subscribe({
      next: (res: any) => {
        this.employees = res.data || [];
        this.currentPeriod = res.period;
        this.employeePagination.total = res.meta?.total || 0;
        this.employeePagination.totalPages = res.meta?.totalPages || 0;
        this.employeesLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.employees = [];
        this.employeesLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onSearchChange(): void {
    this.employeePagination.page = 1;
    this.loadEmployees();
  }

  toggleSort(col: string): void {
    if (this.sortBy === col) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = col;
      this.sortOrder = 'asc';
    }
    this.employeePagination.page = 1;
    this.loadEmployees();
  }

  sortIcon(col: string): string {
    if (this.sortBy !== col) return '↕';
    return this.sortOrder === 'asc' ? '▲' : '▼';
  }

  goToEmployeePage(page: number): void {
    if (page < 1 || page > this.employeePagination.totalPages) return;
    this.employeePagination.page = page;
    this.loadEmployees();
  }

  selectEmployee(emp: any, index: number): void {
    this.selectedEmployee = emp;
    this.selectedEmployeeIndex = index;
    this.showPayslip = true;
    this.activeTab = 'earnings';
    this.loadPayslip(emp.id);
  }

  loadPayslip(employeeId: number): void {
    if (!this.currentPeriod) return;
    this.payslipLoading = true;
    this.api.getRaw<any>(`/payroll/payslip-view/employee/${employeeId}/calculate`, {
      period_id: this.currentPeriod.id,
      cycle_id: this.selectedCycleId
    }).subscribe({
      next: (res: any) => {
        this.payslipData = res.data;
        this.payslipLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.payslipData = null;
        this.payslipLoading = false;
        this.ui.toast('error', 'Error', 'Failed to calculate payslip');
        this.cdr.detectChanges();
      }
    });
  }

  backToList(): void {
    this.showPayslip = false;
    this.selectedEmployee = null;
    this.payslipData = null;
    this.activeTab = 'earnings';
  }

  switchTab(tab: 'earnings' | 'deductions' | 'company' | 'fringe'): void {
    this.activeTab = tab;
    this.cdr.detectChanges();
  }

  navigateEmployee(direction: number): void {
    const newIndex = this.selectedEmployeeIndex + direction;
    if (newIndex < 0 || newIndex >= this.employees.length) return;
    this.selectEmployee(this.employees[newIndex], newIndex);
  }

  goToEmployee(): void {
    if (!this.goToInput || !this.selectedCycleId) return;
    const search = this.goToInput.trim();

    const localFound = this.employees.find((e: any) =>
      e.employee_code?.toLowerCase() === search.toLowerCase() || String(e.id) === search
    );
    if (localFound) {
      const idx = this.employees.indexOf(localFound);
      this.selectEmployee(localFound, idx);
      this.goToInput = '';
      return;
    }

    this.api.getRaw<any>('/payroll/payslip-view/employee-lookup', {
      cycle_id: this.selectedCycleId,
      code: search
    }).subscribe({
      next: (res: any) => {
        if (res.data) {
          this.selectedEmployee = res.data;
          this.selectedEmployeeIndex = -1;
          this.showPayslip = true;
          this.activeTab = 'earnings';
          this.loadPayslip(res.data.id);
          this.goToInput = '';
          this.cdr.detectChanges();
        }
      },
      error: () => {
        this.ui.toast('warning', 'Not Found', 'Employee not found in this payroll cycle');
        this.cdr.detectChanges();
      }
    });
  }

  openPayeBreakdown(): void {
    if (!this.selectedEmployee || !this.currentPeriod) return;
    this.showPayeModal = true;
    this.payeLoading = true;
    this.cdr.detectChanges();
    this.api.getRaw<any>(`/payroll/payslip-view/employee/${this.selectedEmployee.id}/paye-breakdown`, {
      period_id: this.currentPeriod.id,
      cycle_id: this.selectedCycleId
    }).subscribe({
      next: (res: any) => {
        this.payeBreakdown = res.data;
        this.payeLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.payeBreakdown = null;
        this.payeLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  closePayeModal(): void {
    this.showPayeModal = false;
    this.cdr.detectChanges();
  }

  openAddTransaction(section: string): void {
    this.addTxSection = section;
    this.addTxForm = {
      salary_head_id: '',
      amount: 0,
      entry_date: this.currentPeriod?.end_date?.split('T')[0] || '',
      reference_no: '',
      every_month: false
    };
    this.editingTxId = null;
    this.existingTransactions = [];
    this.showAddTxModal = true;
    this.cdr.detectChanges();
    this.loadAvailableTransactions();
  }

  onSalaryHeadChange(): void {
    this.editingTxId = null;
    this.addTxForm.amount = 0;
    this.addTxForm.reference_no = '';
    this.addTxForm.every_month = false;
    this.addTxForm.entry_date = this.currentPeriod?.end_date?.split('T')[0] || '';
    if (this.addTxForm.salary_head_id) {
      this.loadExistingTransactions();
    } else {
      this.existingTransactions = [];
      this.cdr.detectChanges();
    }
  }

  loadExistingTransactions(): void {
    if (!this.selectedEmployee || !this.addTxForm.salary_head_id) return;
    this.existingTxLoading = true;
    this.cdr.detectChanges();
    this.api.getRaw<any>(`/payroll/payslip-view/employee/${this.selectedEmployee.id}/transactions-by-head/${this.addTxForm.salary_head_id}`, {}).subscribe({
      next: (res: any) => {
        this.existingTransactions = res.data || [];
        this.existingTxLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.existingTransactions = [];
        this.existingTxLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  editExistingTx(tx: any): void {
    this.editingTxId = tx.id;
    this.addTxForm.amount = parseFloat(tx.captured_amount) || 0;
    this.addTxForm.entry_date = tx.entry_date?.split('T')[0] || '';
    this.addTxForm.reference_no = tx.reference_no || '';
    this.addTxForm.every_month = tx.every_month || false;
    this.cdr.detectChanges();
  }

  cancelEdit(): void {
    this.editingTxId = null;
    this.addTxForm.amount = 0;
    this.addTxForm.reference_no = '';
    this.addTxForm.every_month = false;
    this.addTxForm.entry_date = this.currentPeriod?.end_date?.split('T')[0] || '';
    this.cdr.detectChanges();
  }

  async deleteExistingTx(tx: any): Promise<void> {
    const confirmed = await this.ui.confirm({
      title: 'Delete Transaction',
      message: `Delete this transaction (R${(parseFloat(tx.captured_amount) || 0).toFixed(2)})?`,
      danger: true
    });
    if (!confirmed) return;
    this.api.delete(`/payroll/payslip-view/employee/${this.selectedEmployee.id}/transactions/${tx.id}`).subscribe({
      next: () => {
        this.ui.toast('success', 'Deleted', 'Transaction deleted');
        this.loadExistingTransactions();
        this.loadPayslip(this.selectedEmployee.id);
      },
      error: () => { this.ui.toast('error', 'Error', 'Failed to delete transaction'); this.cdr.detectChanges(); }
    });
  }

  loadAvailableTransactions(): void {
    if (!this.selectedEmployee) return;
    this.addTxLoading = true;
    this.api.getRaw<any>(`/payroll/payslip-view/employee/${this.selectedEmployee.id}/available-transactions`, {
      period_end_date: this.currentPeriod?.end_date?.split('T')[0] || '',
      transaction_type: this.addTxSection || ''
    }).subscribe({
      next: (res: any) => {
        this.availableTransactions = res.data || [];
        this.addTxLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.availableTransactions = [];
        this.addTxLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  submitAddTransaction(): void {
    if (!this.addTxForm.salary_head_id || !this.addTxForm.amount) {
      this.ui.toast('warning', 'Validation', 'Please select a transaction and enter an amount');
      return;
    }

    if (this.editingTxId) {
      this.api.put<any>(`/payroll/payslip-view/employee/${this.selectedEmployee.id}/transactions/${this.editingTxId}`, {
        amount: parseFloat(String(this.addTxForm.amount)),
        entry_date: this.addTxForm.entry_date,
        reference_no: this.addTxForm.reference_no,
        every_month: this.addTxForm.every_month,
        period_end_date: this.currentPeriod?.end_date?.split('T')[0] || ''
      }).subscribe({
        next: () => {
          this.ui.toast('success', 'Transaction Updated', 'Transaction updated successfully');
          this.editingTxId = null;
          this.closeAddTxModal();
          this.loadPayslip(this.selectedEmployee.id);
        },
        error: () => { this.ui.toast('error', 'Error', 'Failed to update transaction'); this.cdr.detectChanges(); }
      });
      return;
    }

    this.api.post<any>(`/payroll/payslip-view/employee/${this.selectedEmployee.id}/transactions`, {
      salary_head_id: parseInt(this.addTxForm.salary_head_id),
      amount: parseFloat(String(this.addTxForm.amount)),
      entry_date: this.addTxForm.entry_date,
      reference_no: this.addTxForm.reference_no,
      every_month: this.addTxForm.every_month,
      period_end_date: this.currentPeriod?.end_date?.split('T')[0] || '',
      cycle_id: this.selectedCycleId
    }).subscribe({
      next: () => {
        this.ui.toast('success', 'Transaction Added', 'Transaction added and payslip recalculated');
        this.closeAddTxModal();
        this.loadPayslip(this.selectedEmployee.id);
      },
      error: () => { this.ui.toast('error', 'Error', 'Failed to add transaction'); this.cdr.detectChanges(); }
    });
  }

  async removeTransaction(tx: any): Promise<void> {
    if (tx.is_system) {
      this.ui.toast('warning', 'System Transaction', 'System-calculated transactions cannot be removed');
      return;
    }
    const txId = tx.ept_id;
    if (!txId) {
      this.ui.toast('warning', 'Cannot Remove', 'This transaction is auto-generated from the salary structure and cannot be removed from the payslip');
      return;
    }
    const confirmed = await this.ui.confirm({
      title: 'Remove Transaction',
      message: `Remove "${tx.head_name}" (R${tx.amount?.toFixed(2)}) from this payslip?`,
      danger: true
    });
    if (!confirmed) return;
    this.api.delete(`/payroll/payslip-view/employee/${this.selectedEmployee.id}/transactions/${txId}`).subscribe({
      next: () => {
        this.ui.toast('success', 'Removed', 'Transaction removed and payslip recalculated');
        this.loadPayslip(this.selectedEmployee.id);
      },
      error: () => { this.ui.toast('error', 'Error', 'Failed to remove transaction'); this.cdr.detectChanges(); }
    });
  }

  closeAddTxModal(): void {
    this.showAddTxModal = false;
    this.editingTxId = null;
    this.existingTransactions = [];
    this.cdr.detectChanges();
  }

  formatCurrency(val: any): string {
    const n = parseFloat(val) || 0;
    return 'R ' + n.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  getPeriodLabel(): string {
    if (!this.currentPeriod) return '';
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const startDate = new Date(this.currentPeriod.start_date);
    return `${months[startDate.getMonth()]} ${startDate.getFullYear()} ${this.currentPeriod.status === 'TRIAL' ? '(Trial)' : ''}`;
  }

  getVisiblePages(): number[] {
    const total = this.employeePagination.totalPages;
    const current = this.employeePagination.page;
    const pages: number[] = [];
    const start = Math.max(1, current - 2);
    const end = Math.min(total, current + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  getFringeBenefitTotal(): number {
    if (!this.payslipData?.fringe_benefits) return 0;
    return this.payslipData.fringe_benefits.reduce((sum: number, item: any) => sum + (parseFloat(item.amount) || 0), 0);
  }
}
