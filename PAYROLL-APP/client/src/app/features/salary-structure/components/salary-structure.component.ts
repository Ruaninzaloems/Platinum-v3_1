import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { CurrencyZarPipe } from '../../../shared/pipes/currency-zar.pipe';

@Component({
  selector: 'app-salary-structure',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, CurrencyZarPipe],
  templateUrl: './salary-structure.component.html',
  styleUrl: './salary-structure.component.css'
})
export class SalaryStructureComponent implements OnInit {
  view: 'list' | 'detail' = 'list';
  loading = false;
  error = '';
  success = '';
  varianceWarning = '';

  employees: any[] = [];
  filteredEmployees: any[] = [];
  searchTerm = '';
  filterDepartment = '';
  departments: any[] = [];

  selectedEmployee: any = null;
  structureData: any = null;
  mergedTransactions: any[] = [];
  summary: any = {};

  showAddModal = false;
  availableHeads: any[] = [];
  newTxn: any = { salary_head_id: null, amount: 0, percentage: null, included_in_package: true };

  editingTxnId: number | null = null;
  editAmount = 0;
  editPercentage: number | null = null;

  private readonly VARIANCE_TOLERANCE = 5.00;

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadEmployees();
  }

  loadEmployees() {
    this.loading = true;
    this.error = '';
    this.api.get<any>('/salary-structure/employees').subscribe({
      next: (res: any) => {
        this.employees = res || [];
        const deptSet = new Map<string, string>();
        this.employees.forEach((e: any) => {
          if (e.department_name && e.department_id) deptSet.set(e.department_id, e.department_name);
        });
        this.departments = Array.from(deptSet, ([id, name]) => ({ id, name }));
        this.applyFilters();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Failed to load salary structure data';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyFilters() {
    let result = [...this.employees];
    if (this.searchTerm) {
      const s = this.searchTerm.toLowerCase();
      result = result.filter((e: any) =>
        String(e.id || '').includes(s) ||
        (e.employee_code || '').toLowerCase().includes(s) ||
        (e.first_name || '').toLowerCase().includes(s) ||
        (e.surname || '').toLowerCase().includes(s)
      );
    }
    if (this.filterDepartment) {
      result = result.filter((e: any) => String(e.department_id) === this.filterDepartment);
    }
    result.sort((a: any, b: any) => (a.id || 0) - (b.id || 0));
    this.filteredEmployees = result;
  }

  openDetail(emp: any) {
    this.selectedEmployee = emp;
    this.view = 'detail';
    this.loadStructure(emp.id);
  }

  backToList() {
    this.view = 'list';
    this.selectedEmployee = null;
    this.structureData = null;
    this.mergedTransactions = [];
    this.summary = {};
    this.editingTxnId = null;
    this.varianceWarning = '';
    this.loadEmployees();
  }

  loadStructure(empId: number) {
    this.loading = true;
    this.error = '';
    this.varianceWarning = '';
    this.api.get<any>(`/salary-structure/employees/${empId}`).subscribe({
      next: (res: any) => {
        this.structureData = res;
        this.mergedTransactions = res.transactions || [];
        this.summary = res.summary || {};
        this.loading = false;
        this.updateVarianceWarning();
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Failed to load salary structure';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  get earnings(): any[] {
    return this.mergedTransactions.filter((t: any) => t.transaction_type === 'EARNING' || t.transaction_type === 'FRINGE_BENEFIT')
      .sort((a: any, b: any) => (a.salary_head_id || 0) - (b.salary_head_id || 0));
  }

  get deductions(): any[] {
    return this.mergedTransactions.filter((t: any) => t.transaction_type === 'DEDUCTION')
      .sort((a: any, b: any) => (a.salary_head_id || 0) - (b.salary_head_id || 0));
  }

  get companyContributions(): any[] {
    return this.mergedTransactions.filter((t: any) => t.transaction_type === 'COMPANY_CONTRIBUTION')
      .sort((a: any, b: any) => (a.salary_head_id || 0) - (b.salary_head_id || 0));
  }

  get earningsTotal(): number {
    return this.earnings.reduce((s: number, t: any) => s + (t.included_in_package ? (Number(t.amount) || 0) : 0), 0);
  }

  get companyContributionsTotal(): number {
    return this.companyContributions.reduce((s: number, t: any) => s + (t.included_in_package ? (Number(t.amount) || 0) : 0), 0);
  }

  get packageTotal(): number {
    return this.earningsTotal + this.companyContributionsTotal;
  }

  get targetPackage(): number {
    return this.summary.target_package || 0;
  }

  get variance(): number {
    return this.targetPackage - this.packageTotal;
  }

  get percentOfTarget(): number {
    return this.targetPackage > 0 ? Math.round((this.packageTotal / this.targetPackage) * 10000) / 100 : 0;
  }

  get packageStatus(): string {
    if (this.targetPackage === 0) return 'NO_TARGET';
    if (Math.abs(this.variance) <= this.VARIANCE_TOLERANCE) return 'BALANCED';
    if (this.packageTotal > this.targetPackage) return 'OVER';
    return 'UNDER';
  }

  get isVarianceWithinTolerance(): boolean {
    return Math.abs(this.variance) <= this.VARIANCE_TOLERANCE;
  }

  updateVarianceWarning() {
    if (this.targetPackage > 0 && !this.isVarianceWithinTolerance) {
      this.varianceWarning = `Package variance of ${this.formatCurrency(Math.abs(this.variance))} exceeds the R 5.00 tolerance. Adjust earnings or company contributions before saving.`;
    } else {
      this.varianceWarning = '';
    }
  }

  toggleIncludedInPackage(txn: any) {
    if (txn.source === 'INHERITED') {
      this.api.post<any>(`/salary-structure/employees/${this.selectedEmployee.id}/transactions`, {
        salary_head_id: txn.salary_head_id,
        amount: txn.amount || 0,
        percentage: txn.percentage,
        included_in_package: !txn.included_in_package
      }).subscribe({
        next: () => {
          this.loadStructure(this.selectedEmployee.id);
        },
        error: () => {
          this.error = 'Failed to update package flag';
          this.cdr.detectChanges();
        }
      });
    } else {
      this.api.put<any>(`/salary-structure/employees/${this.selectedEmployee.id}/transactions/${txn.id}/toggle-package`, {}).subscribe({
        next: () => {
          this.loadStructure(this.selectedEmployee.id);
        },
        error: () => {
          this.error = 'Failed to update package flag';
          this.cdr.detectChanges();
        }
      });
    }
  }

  editingHeadId: number | null = null;

  startEdit(txn: any) {
    this.editingHeadId = txn.salary_head_id;
    this.editingTxnId = txn.id;
    this.editAmount = Number(txn.amount) || 0;
    this.editPercentage = txn.percentage ? Number(txn.percentage) : null;
    this.cdr.detectChanges();
  }

  cancelEdit() {
    this.editingTxnId = null;
    this.editingHeadId = null;
    this.cdr.detectChanges();
  }

  resetRow(txn: any) {
    if (txn.source === 'EMPLOYEE' && txn.id) {
      (this.api as any).delete(`/salary-structure/employees/${this.selectedEmployee.id}/transactions/${txn.id}`).subscribe({
        next: () => {
          this.editingTxnId = null;
          this.editingHeadId = null;
          this.success = 'Component reset to inherited default';
          this.loadStructure(this.selectedEmployee.id);
          setTimeout(() => { this.success = ''; this.cdr.detectChanges(); }, 2000);
        },
        error: () => {
          this.error = 'Failed to reset component';
          this.cdr.detectChanges();
        }
      });
    } else {
      this.editingTxnId = null;
      this.editingHeadId = null;
      this.cdr.detectChanges();
    }
  }

  saveEdit(txn: any) {
    if (txn.source === 'INHERITED') {
      this.api.post<any>(`/salary-structure/employees/${this.selectedEmployee.id}/transactions`, {
        salary_head_id: txn.salary_head_id,
        amount: this.editAmount,
        included_in_package: txn.included_in_package !== false
      }).subscribe({
        next: () => {
          this.editingTxnId = null;
          this.editingHeadId = null;
          this.success = 'Amount set and component added to structure';
          this.loadStructure(this.selectedEmployee.id);
          setTimeout(() => { this.success = ''; this.cdr.detectChanges(); }, 2000);
        },
        error: (err: any) => {
          this.error = err?.error?.error?.message || 'Failed to set amount';
          this.cdr.detectChanges();
        }
      });
    } else {
      this.api.put<any>(`/salary-structure/employees/${this.selectedEmployee.id}/transactions/${txn.id}`, {
        amount: this.editAmount,
        percentage: this.editPercentage
      }).subscribe({
        next: () => {
          this.editingTxnId = null;
          this.editingHeadId = null;
          this.success = 'Transaction updated';
          this.loadStructure(this.selectedEmployee.id);
          setTimeout(() => { this.success = ''; this.cdr.detectChanges(); }, 2000);
        },
        error: () => {
          this.error = 'Failed to update transaction';
          this.cdr.detectChanges();
        }
      });
    }
  }

  openAddModal() {
    this.newTxn = { salary_head_id: null, amount: 0, percentage: null, included_in_package: true };
    this.api.get<any>('/salary-transactions').subscribe({
      next: (res: any) => {
        const existingIds = new Set(this.mergedTransactions.map((t: any) => t.salary_head_id));
        const allHeads = res || [];
        this.availableHeads = allHeads.filter((h: any) =>
          !existingIds.has(h.id) && h.calculation_method !== 'SYSTEM_CALCULATE' && h.enabled !== false
          && (h.transaction_type === 'EARNING' || h.transaction_type === 'FRINGE_BENEFIT' || h.transaction_type === 'COMPANY_CONTRIBUTION')
        );
        this.showAddModal = true;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Failed to load salary heads';
        this.cdr.detectChanges();
      }
    });
  }

  addTransaction() {
    if (!this.newTxn.salary_head_id) return;
    this.api.post<any>(`/salary-structure/employees/${this.selectedEmployee.id}/transactions`, this.newTxn).subscribe({
      next: () => {
        this.showAddModal = false;
        this.success = 'Transaction added';
        this.loadStructure(this.selectedEmployee.id);
        setTimeout(() => { this.success = ''; this.cdr.detectChanges(); }, 2000);
      },
      error: (err: any) => {
        this.error = err?.error?.error?.message || 'Failed to add transaction';
        this.cdr.detectChanges();
      }
    });
  }

  deleteTransaction(txn: any) {
    if (txn.source !== 'EMPLOYEE') return;
    if (!confirm(`Remove ${txn.name} from this employee's salary structure?`)) return;
    (this.api as any).delete(`/salary-structure/employees/${this.selectedEmployee.id}/transactions/${txn.id}`).subscribe({
      next: () => {
        this.success = 'Transaction removed';
        this.loadStructure(this.selectedEmployee.id);
        setTimeout(() => { this.success = ''; this.cdr.detectChanges(); }, 2000);
      },
      error: () => {
        this.error = 'Failed to remove transaction';
        this.cdr.detectChanges();
      }
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'BALANCED': return 'status-balanced';
      case 'OVER': return 'status-over';
      case 'UNDER': return 'status-under';
      default: return 'status-none';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'BALANCED': return 'Balanced';
      case 'OVER': return 'Over';
      case 'UNDER': return 'Under';
      default: return 'No Target';
    }
  }

  formatCurrency(val: any): string {
    const n = Number(val) || 0;
    return 'R ' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  valueTypeLabel(vt: string): string {
    if (!vt) return '-';
    return vt.charAt(0).toUpperCase() + vt.slice(1).toLowerCase();
  }
}
