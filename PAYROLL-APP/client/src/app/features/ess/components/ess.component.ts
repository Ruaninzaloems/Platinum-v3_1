import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { UiService } from '../../../core/services/ui.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-ess',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './ess.component.html',
  styleUrl: './ess.component.css'
})
export class EssComponent implements OnInit {
  employees: any[] = [];
  employeeSearch = '';
  selectedEmployeeId: number | null = null;

  loading = false;
  profile: any = null;
  payslips: any[] = [];
  latestPayslip: any = null;
  latestPayslipEarnings: any[] = [];
  latestPayslipDeductions: any[] = [];
  leaveBalances: any[] = [];
  benefits: any = { medical_aid: [], retirement_funds: [] };
  dependants: any[] = [];

  activeTab = 'overview';

  constructor(
    private api: ApiService,
    private ui: UiService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadEmployees();
  }

  loadEmployees(): void {
    this.api.get<any>('/employees', { limit: 5000, sort_by: 'id', sort_order: 'asc' }).subscribe({
      next: (data) => {
        this.employees = data || [];
        this.cdr.detectChanges();
      },
      error: () => {
        this.employees = [];
        this.cdr.detectChanges();
      }
    });
  }

  get filteredEmployees(): any[] {
    if (!this.employeeSearch) return this.employees;
    const s = this.employeeSearch.toLowerCase();
    return this.employees.filter((e: any) =>
      String(e.id || '').includes(s) ||
      (e.surname || '').toLowerCase().includes(s) ||
      (e.first_name || '').toLowerCase().includes(s) ||
      (e.employee_code || '').toLowerCase().includes(s)
    );
  }

  selectEmployee(): void {
    if (!this.selectedEmployeeId) {
      this.profile = null;
      this.payslips = [];
      this.latestPayslip = null;
      this.latestPayslipEarnings = [];
      this.latestPayslipDeductions = [];
      this.leaveBalances = [];
      this.benefits = { medical_aid: [], retirement_funds: [] };
      this.dependants = [];
      return;
    }
    this.loading = true;
    this.activeTab = 'overview';

    this.api.get<any>(`/ess/profile/${this.selectedEmployeeId}`).subscribe({
      next: (data) => {
        this.profile = data;
        this.loading = false;
        this.cdr.detectChanges();
        this.loadAllData();
      },
      error: () => {
        this.profile = null;
        this.loading = false;
        this.ui.toast('error', 'Error', 'Failed to load employee profile');
        this.cdr.detectChanges();
      }
    });
  }

  loadAllData(): void {
    if (!this.selectedEmployeeId) return;
    this.loadPayslips();
    this.loadLeaveBalances();
    this.loadBenefits();
    this.loadDependants();
  }

  loadPayslips(): void {
    this.api.get<any[]>(`/ess/payslips/${this.selectedEmployeeId}`).subscribe({
      next: (data) => {
        this.payslips = data || [];
        this.latestPayslip = this.payslips.length > 0 ? this.payslips[0] : null;
        this.cdr.detectChanges();
        if (this.latestPayslip) {
          this.loadPayslipDetail(this.latestPayslip.run_id);
        }
      },
      error: () => {
        this.payslips = [];
        this.latestPayslip = null;
        this.latestPayslipEarnings = [];
        this.latestPayslipDeductions = [];
        this.cdr.detectChanges();
      }
    });
  }

  loadPayslipDetail(runId: number): void {
    this.api.get<any[]>(`/ess/payslip-detail/${this.selectedEmployeeId}/${runId}`).subscribe({
      next: (data) => {
        const items = data || [];
        this.latestPayslipEarnings = items.filter((t: any) => t.transaction_type === 'EARNING');
        this.latestPayslipDeductions = items.filter((t: any) => t.transaction_type === 'DEDUCTION');
        this.cdr.detectChanges();
      },
      error: () => {
        this.latestPayslipEarnings = [];
        this.latestPayslipDeductions = [];
        this.cdr.detectChanges();
      }
    });
  }

  loadLeaveBalances(): void {
    this.api.get<any[]>(`/ess/leave-balances/${this.selectedEmployeeId}`).subscribe({
      next: (data) => {
        this.leaveBalances = data || [];
        this.cdr.detectChanges();
      },
      error: () => {
        this.leaveBalances = [];
        this.cdr.detectChanges();
      }
    });
  }

  loadBenefits(): void {
    this.api.get<any>(`/ess/benefits/${this.selectedEmployeeId}`).subscribe({
      next: (data) => {
        this.benefits = data || { medical_aid: [], retirement_funds: [] };
        this.cdr.detectChanges();
      },
      error: () => {
        this.benefits = { medical_aid: [], retirement_funds: [] };
        this.cdr.detectChanges();
      }
    });
  }

  loadDependants(): void {
    this.api.get<any[]>(`/ess/dependants/${this.selectedEmployeeId}`).subscribe({
      next: (data) => {
        this.dependants = data || [];
        this.cdr.detectChanges();
      },
      error: () => {
        this.dependants = [];
        this.cdr.detectChanges();
      }
    });
  }

  switchTab(tab: string): void {
    this.activeTab = tab;
    this.cdr.detectChanges();
  }

  goToLeave(): void {
    this.router.navigate(['/leave']);
  }

  goToPayslipHistory(): void {
    this.activeTab = 'payslips';
    this.cdr.detectChanges();
  }

  downloadLatestPayslip(): void {
    if (!this.latestPayslip || !this.selectedEmployeeId) return;
    window.open(`/api/v1/reports/payslip/${this.latestPayslip.run_id}/${this.selectedEmployeeId}`, '_blank');
  }

  getStatusClass(status: string): string {
    if (!status) return '';
    const s = status.toUpperCase();
    if (s === 'ACTIVE' || s === 'COMPLETED' || s === 'APPROVED') return 'status-success';
    if (s === 'INACTIVE' || s === 'TERMINATED' || s === 'SUSPENDED') return 'status-danger';
    if (s === 'PENDING' || s === 'TRIAL') return 'status-warning';
    return 'status-info';
  }

  getInitials(): string {
    if (!this.profile) return '?';
    const f = (this.profile.first_name || '').charAt(0);
    const s = (this.profile.surname || '').charAt(0);
    return (f + s).toUpperCase();
  }

  maskAccountNumber(acc: string): string {
    if (!acc || acc.length < 4) return acc || '-';
    return '****' + acc.slice(-4);
  }

  getLeavePercentage(balance: any): number {
    const total = (parseFloat(balance.accrued) || 0) + (parseFloat(balance.taken) || 0) + (parseFloat(balance.forfeited) || 0);
    if (total === 0) return 0;
    const remaining = parseFloat(balance.balance) || 0;
    return Math.min(100, Math.max(0, (remaining / total) * 100));
  }

  getLeaveBarColor(balance: any): string {
    const pct = this.getLeavePercentage(balance);
    if (pct >= 60) return 'var(--platinum-success)';
    if (pct >= 30) return 'var(--platinum-warning)';
    return 'var(--platinum-danger)';
  }

  formatDate(d: string): string {
    if (!d) return '-';
    try {
      return new Date(d).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch { return '-'; }
  }

  formatCurrency(v: any): string {
    const n = parseFloat(v) || 0;
    return 'R ' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  viewPayslip(runId: number): void {
    window.open(`/api/v1/reports/payslip/${runId}/${this.selectedEmployeeId}`, '_blank');
  }

  getPeriodLabel(payslip: any): string {
    if (!payslip) return '-';
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const periodNum = parseInt(payslip.period_number) || 0;
    const monthIdx = ((periodNum - 1 + 2) % 12);
    return `${months[monthIdx]} ${payslip.tax_year}`;
  }
}
