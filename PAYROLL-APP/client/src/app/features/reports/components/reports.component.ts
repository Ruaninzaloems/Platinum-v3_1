import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { UiService } from '../../../core/services/ui.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, StatusBadgeComponent],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css'
})
export class ReportsComponent implements OnInit {
  activeTab = 'statutory';
  taxYear = 2026;
  taxPeriod = 1;
  periodMonths = ['March','April','May','June','July','August','September','October','November','December','January','February'];
  periods = Array.from({length: 12}, (_, i) => i + 1);

  summary: any = null;
  summaryPeriods: any[] = [];
  summaryLoading = false;

  payrollRuns: any[] = [];
  employees: any[] = [];
  payslipRunId = '';
  runEmployees: any[] = [];
  filteredRunEmployees: any[] = [];
  selectedEmployeeIds: number[] = [];
  runEmployeesLoading = false;
  empSearch = '';
  empDivisionFilter = '';
  empPayPointFilter = '';
  divisions: any[] = [];
  payPoints: any[] = [];

  letterEmployeeId = '';

  eeYear = 2026;

  constructor(private api: ApiService, private ui: UiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadTab();
  }

  switchTab(tab: string): void {
    this.activeTab = tab;
    this.loadTab();
  }

  loadTab(): void {
    switch (this.activeTab) {
      case 'statutory': this.loadStatutorySummary(); break;
      case 'payslips': this.loadPayslips(); break;
      case 'exports': this.loadEmployees(); break;
    }
  }

  loadStatutorySummary(): void {
    this.summaryLoading = true;
    this.api.get<any>(`/reports/statutory-summary/${this.taxYear}`).subscribe({
      next: (data) => {
        this.summary = data?.totals || {};
        this.summaryPeriods = data?.periods || [];
        this.summaryLoading = false;
      },
      error: () => { this.summary = null; this.summaryPeriods = []; this.summaryLoading = false; }
    });
  }

  loadPayslips(): void {
    this.api.get<any[]>('/payroll/runs', { limit: 100 }).subscribe({
      next: (data) => {
        this.payrollRuns = (data || []).filter((r: any) => ['COMPLETED','LOCKED','APPROVED'].includes(r.status));
        this.cdr.detectChanges();
      }
    });
    this.loadDivisions();
    this.loadPayPoints();
  }

  loadEmployees(): void {
    if (this.employees.length === 0) {
      this.api.get<any[]>('/employees', { limit: 100, sort_by: 'surname', sort_order: 'asc' }).subscribe({
        next: (data) => { this.employees = data || []; this.cdr.detectChanges(); }
      });
    }
  }

  loadDivisions(): void {
    if (this.divisions.length === 0) {
      this.api.get<any>('/departments/lookups/all').subscribe({
        next: (data: any) => {
          this.divisions = data?.divisions || [];
          this.cdr.detectChanges();
        },
        error: () => {}
      });
    }
  }

  loadPayPoints(): void {
    if (this.payPoints.length === 0) {
      this.api.get<any[]>('/pay-points').subscribe({
        next: (data) => { this.payPoints = data || []; this.cdr.detectChanges(); },
        error: () => {}
      });
    }
  }

  onRunChange(): void {
    this.runEmployees = [];
    this.filteredRunEmployees = [];
    this.selectedEmployeeIds = [];
    this.empSearch = '';
    this.empDivisionFilter = '';
    this.empPayPointFilter = '';
    if (!this.payslipRunId) {
      this.cdr.detectChanges();
      return;
    }
    this.runEmployeesLoading = true;
    this.cdr.detectChanges();
    this.api.get<any[]>(`/payroll/runs/${this.payslipRunId}/employees`).subscribe({
      next: (data) => {
        this.runEmployees = data || [];
        this.filteredRunEmployees = [...this.runEmployees];
        this.selectedEmployeeIds = this.runEmployees.map((e: any) => e.id);
        this.runEmployeesLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.runEmployees = [];
        this.filteredRunEmployees = [];
        this.runEmployeesLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  filterEmployees(): void {
    const q = (this.empSearch || '').toLowerCase().trim();
    const divId = this.empDivisionFilter ? Number(this.empDivisionFilter) : null;
    const ppId = this.empPayPointFilter ? Number(this.empPayPointFilter) : null;
    this.filteredRunEmployees = this.runEmployees.filter((e: any) => {
      if (q) {
        const match = `${e.employee_code} ${e.first_name} ${e.surname} ${e.id_number || ''}`.toLowerCase();
        if (!match.includes(q)) return false;
      }
      if (divId && e.division_id !== divId) return false;
      if (ppId && e.pay_point_id !== ppId) return false;
      return true;
    });
    this.cdr.detectChanges();
  }

  isEmployeeSelected(id: number): boolean {
    return this.selectedEmployeeIds.includes(id);
  }

  toggleEmployee(id: number): void {
    const idx = this.selectedEmployeeIds.indexOf(id);
    if (idx >= 0) this.selectedEmployeeIds.splice(idx, 1);
    else this.selectedEmployeeIds.push(id);
    this.cdr.detectChanges();
  }

  selectAllEmployees(): void {
    const visibleIds = this.filteredRunEmployees.map((e: any) => e.id);
    for (const id of visibleIds) {
      if (!this.selectedEmployeeIds.includes(id)) this.selectedEmployeeIds.push(id);
    }
    this.cdr.detectChanges();
  }

  deselectAllEmployees(): void {
    const visibleIds = new Set(this.filteredRunEmployees.map((e: any) => e.id));
    this.selectedEmployeeIds = this.selectedEmployeeIds.filter(id => !visibleIds.has(id));
    this.cdr.detectChanges();
  }

  formatCurrency(val: any): string {
    return 'R ' + Number(val || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 });
  }

  downloadReport(path: string, name: string): void {
    window.open(`/api/v1${path}`, '_blank');
    this.ui.toast('success', name, `Downloading ${name}`);
  }

  downloadEMP201(): void {
    this.downloadReport(`/reports/emp201/${this.taxYear}/${this.taxPeriod}`, 'EMP201 Report');
  }

  downloadEMP501(): void {
    this.downloadReport(`/reports/emp501/${this.taxYear}`, 'EMP501 Report');
  }

  downloadEasyFile(): void {
    this.downloadReport(`/reports/easyfile/${this.taxYear}`, 'e@syFile Export');
  }

  downloadIRP5Batch(): void {
    this.downloadReport(`/reports/irp5-batch/${this.taxYear}`, 'IRP5 Batch');
  }

  downloadIRP5Text(): void {
    this.downloadReport(`/reports/irp5-text/${this.taxYear}`, 'IRP5 Text');
  }

  downloadEMP201Electronic(): void {
    this.downloadReport(`/reports/emp201-electronic/${this.taxYear}/${this.taxPeriod}`, 'EMP201 Electronic');
  }

  downloadEMP501Electronic(): void {
    this.downloadReport(`/reports/emp501-electronic/${this.taxYear}`, 'EMP501 Electronic');
  }

  downloadROE(): void {
    this.downloadReport(`/reports/roe/${this.taxYear}`, 'Return of Earnings');
  }

  downloadSDL(): void {
    this.downloadReport(`/reports/sdl1/${this.taxYear}`, 'SDL Annual');
  }

  downloadWSP(): void {
    this.downloadReport(`/reports/wsp/${this.taxYear}`, 'WSP/ATR Export');
  }

  downloadPayslip(): void {
    if (!this.payslipRunId) { this.ui.toast('error', 'Error', 'Please select a payroll run'); return; }
    if (this.selectedEmployeeIds.length === 0) { this.ui.toast('error', 'Error', 'Please select at least one employee'); return; }
    if (this.selectedEmployeeIds.length === 1) {
      this.downloadReport(`/reports/payslip/${this.payslipRunId}/${this.selectedEmployeeIds[0]}`, 'Payslip');
    } else {
      const empParam = this.selectedEmployeeIds.join(',');
      this.downloadReport(`/reports/payslips-batch/${this.payslipRunId}?employees=${empParam}`, 'Batch Payslips');
    }
  }

  downloadPayslipBatch(): void {
    if (!this.payslipRunId) { this.ui.toast('error', 'Error', 'Please select a payroll run'); return; }
    if (this.selectedEmployeeIds.length > 0 && this.selectedEmployeeIds.length < this.runEmployees.length) {
      const empParam = this.selectedEmployeeIds.join(',');
      this.downloadReport(`/reports/payslips-batch/${this.payslipRunId}?employees=${empParam}`, 'Batch Payslips');
    } else {
      this.downloadReport(`/reports/payslips-batch/${this.payslipRunId}`, 'Batch Payslips');
    }
  }

  downloadEFT(): void {
    if (!this.payslipRunId) { this.ui.toast('error', 'Error', 'Please select a payroll run'); return; }
    this.downloadReport(`/reports/eft/${this.payslipRunId}`, 'EFT File');
  }

  exportPayroll(format: string): void {
    if (!this.payslipRunId) { this.ui.toast('error', 'Error', 'Please select a payroll run'); return; }
    this.downloadReport(`/reports/export/payroll/${this.payslipRunId}?format=${format}`, `Payroll ${format.toUpperCase()}`);
  }

  downloadEmployeeExport(format: string): void {
    this.downloadReport(`/reports/export/employees?format=${format}`, `Employee Register ${format.toUpperCase()}`);
  }

  downloadEmploymentLetter(): void {
    if (!this.letterEmployeeId) { this.ui.toast('error', 'Error', 'Please select an employee'); return; }
    this.downloadReport(`/reports/employment-letter/${this.letterEmployeeId}`, 'Employment Letter');
  }
}
