import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';
import { UiService } from '../../../../core/services/ui.service';
import { IconComponent } from '../../../../shared/components/icon/icon.component';

interface PeriodOpt {
  id: number; cycle_id: number; tax_year: number; period_number: number;
  processing_month: string; status: string; start_date: string; end_date: string;
}

@Component({
  selector: 'app-payroll-totals',
  standalone: true,
  host: { 'data-accent': 'reports' },
  imports: [CommonModule, FormsModule, RouterLink, IconComponent],
  templateUrl: './payroll-totals.component.html',
  styleUrl: './payroll-totals.component.css'
})
export class PayrollTotalsComponent implements OnInit {
  taxYears: number[] = [];
  cycles: any[] = [];
  allPeriods: PeriodOpt[] = [];
  filteredPeriods: PeriodOpt[] = [];
  departments: any[] = [];
  employees: any[] = [];

  taxYear: number | null = null;
  cycleId: number | null = null;
  periodId: number | null = null;
  employeeId: number | null = null;
  departmentId: number | null = null;
  includeTrial = false;

  employeeQuery = '';
  employeeMatches: any[] = [];
  showEmployeeSuggest = false;

  loading = false;
  generated = false;
  report: any = null;
  errorMsg = '';

  constructor(private api: ApiService, private ui: UiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.api.get<any>('/payroll/cycles').subscribe({
      next: (res: any) => {
        this.cycles = res?.data || res || [];
        if (!this.cycleId && this.cycles.length) {
          this.cycleId = this.cycles[0].id;
        }
        this.refreshPeriods();
      }
    });
    this.api.get<any>('/settings/tax-years').subscribe({
      next: (res: any) => {
        const list = res?.data || res || [];
        this.taxYears = list.map((t: any) => t.tax_year || t.year || t).filter((x: any) => !!x);
        if (this.taxYears.length === 0) {
          const cur = new Date().getFullYear();
          this.taxYears = [cur + 1, cur, cur - 1];
        }
        this.api.get<any>('/settings/active-tax-year').subscribe({
          next: (act: any) => {
            const ay = act?.data?.tax_year || act?.tax_year || act?.data?.year || null;
            this.taxYear = ay || (list.find((t: any) => t.is_active || t.active)?.tax_year) || this.taxYears[0];
            this.refreshPeriods();
          },
          error: () => {
            const active = (list.find((t: any) => t.is_active || t.active) || {});
            this.taxYear = active.tax_year || this.taxYears[0];
            this.refreshPeriods();
          }
        });
      },
      error: () => {
        const cur = new Date().getFullYear();
        this.taxYears = [cur + 1, cur, cur - 1];
        this.taxYear = this.taxYears[0];
        this.refreshPeriods();
      }
    });
    this.api.get<any>('/departments/lookups/all').subscribe({
      next: (res: any) => { this.departments = res?.departments || res?.data?.departments || []; this.cdr.detectChanges(); }
    });
    this.api.get<any[]>('/employees', { limit: 500, sort_by: 'surname', sort_order: 'asc' }).subscribe({
      next: (data: any) => { this.employees = data || []; this.cdr.detectChanges(); }
    });
  }

  refreshPeriods(): void {
    if (!this.cycleId || !this.taxYear) return;
    this.api.get<any>('/payroll/periods', { cycle_id: this.cycleId, tax_year: this.taxYear }).subscribe({
      next: (res: any) => {
        const list = res?.data || res || [];
        this.allPeriods = list;
        this.filteredPeriods = [...list].reverse();
        const closed = this.filteredPeriods.find(p => p.status === 'CLOSED' || p.status === 'FINALISED');
        this.periodId = (closed?.id) || (this.filteredPeriods[0]?.id) || null;
        this.cdr.detectChanges();
      }
    });
  }

  onCycleChange(): void { this.refreshPeriods(); }
  onTaxYearChange(): void { this.refreshPeriods(); }

  generate(): void {
    if (!this.cycleId || !this.periodId) {
      this.ui.toast('error', 'Missing parameters', 'Please choose a cycle and period');
      return;
    }
    this.loading = true;
    this.errorMsg = '';
    const params: any = {
      cycle_id: this.cycleId,
      period_id: this.periodId,
      include_trial: this.includeTrial,
    };
    if (this.employeeId) params.employee_id = this.employeeId;
    if (this.departmentId) params.department_id = this.departmentId;

    this.api.get<any>('/reports/payroll-totals', params).subscribe({
      next: (res: any) => {
        this.report = res?.data || res;
        this.generated = true;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.errorMsg = err?.error?.message || err?.message || 'Failed to generate report';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  reset(): void {
    this.employeeId = null;
    this.departmentId = null;
    this.employeeQuery = '';
    this.selectedDisplay = '';
    this.employeeMatches = [];
    this.showEmployeeSuggest = false;
    this.includeTrial = false;
    this.generated = false;
    this.report = null;
  }

  private selectedDisplay = '';

  onEmployeeInput(): void {
    const q = (this.employeeQuery || '').trim();
    if (this.employeeId && q !== this.selectedDisplay) {
      this.employeeId = null;
    }
    const ql = q.toLowerCase();
    if (ql.length < 2) {
      this.employeeMatches = [];
      this.showEmployeeSuggest = false;
      return;
    }
    this.employeeMatches = this.employees.filter((e: any) => {
      const code = String(e.employee_code || '').toLowerCase();
      const name = `${e.first_name || ''} ${e.surname || ''}`.toLowerCase();
      return code.includes(ql) || name.includes(ql);
    }).slice(0, 8);
    this.showEmployeeSuggest = this.employeeMatches.length > 0 && this.employeeId === null;
  }

  pickEmployee(e: any): void {
    this.employeeId = e.id;
    this.employeeQuery = `${e.employee_code} – ${e.first_name} ${e.surname}`;
    this.selectedDisplay = this.employeeQuery;
    this.employeeMatches = [];
    this.showEmployeeSuggest = false;
  }

  clearEmployee(): void {
    this.employeeId = null;
    this.employeeQuery = '';
    this.selectedDisplay = '';
    this.employeeMatches = [];
    this.showEmployeeSuggest = false;
  }

  hideEmployeeSuggest(): void {
    setTimeout(() => { this.showEmployeeSuggest = false; this.cdr.detectChanges(); }, 150);
  }

  muniInitials(): string {
    const n = (this.report?.municipality_name || '').trim();
    if (!n) return 'M';
    const parts = n.split(/\s+/).filter(Boolean);
    return (parts[0]?.[0] || '').toUpperCase() + (parts[1]?.[0] || '').toUpperCase();
  }

  formatCurrency(v: any): string {
    return 'R ' + Number(v || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  today(): string {
    return new Date().toLocaleString('en-ZA');
  }

  formatNumber(v: any): string {
    return Number(v || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  download(format: 'pdf' | 'xlsx' | 'csv'): void {
    if (!this.cycleId || !this.periodId) {
      this.ui.toast('error', 'Missing parameters', 'Please generate the report first');
      return;
    }
    const qp = new URLSearchParams();
    qp.set('cycle_id', String(this.cycleId));
    qp.set('period_id', String(this.periodId));
    qp.set('include_trial', String(this.includeTrial));
    qp.set('format', format);
    if (this.employeeId) qp.set('employee_id', String(this.employeeId));
    if (this.departmentId) qp.set('department_id', String(this.departmentId));
    window.open(`/payroll-app/api/reports/payroll-totals?${qp.toString()}`, '_blank');
    this.ui.toast('success', 'Export started', `Downloading ${format.toUpperCase()}`);
  }
}
