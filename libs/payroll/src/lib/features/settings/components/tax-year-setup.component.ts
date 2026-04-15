import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { UiService } from '../../../core/services/ui.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { DateInputComponent } from '../../../shared/components/date-input/date-input.component';
import { DateSaPipe } from '../../../shared/pipes/date-sa.pipe';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-tax-year-setup',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, DateInputComponent, DateSaPipe, StatusBadgeComponent],
  templateUrl: './tax-year-setup.component.html',
  styleUrl: './tax-year-setup.component.css'
})
export class TaxYearSetupComponent implements OnInit {
  cycles: any[] = [];
  periods: any[] = [];
  loading = true;
  generating = false;

  selectedTaxYear = '';
  selectedCycleId: number | null = null;
  startDate = '';
  endDate = '';
  taxYearOpen = true;

  taxYears: string[] = [];
  viewTaxYear = '';
  viewCycleId: number | null = null;

  get processedCount(): number { return this.periods.filter(p => p.status === 'CLOSED').length; }
  get currentPeriodNumber(): number | null {
    const openPeriods = this.periods.filter(p => p.status === 'OPEN');
    if (openPeriods.length === 0) return null;
    return Math.min(...openPeriods.map(p => p.period_number));
  }
  get pendingCount(): number {
    const current = this.currentPeriodNumber;
    if (current === null) return 0;
    return this.periods.filter(p => p.status === 'OPEN' && p.period_number > current).length;
  }
  get hasCurrentPeriod(): boolean { return this.currentPeriodNumber !== null; }

  getDisplayStatus(period: any): string {
    if (period.status === 'CLOSED') return 'Processed';
    if (period.period_number === this.currentPeriodNumber) return 'Current';
    return 'Pending';
  }

  constructor(public api: ApiService, private ui: UiService, public cdr: ChangeDetectorRef) {}

  onCycleChange(): void {
    this.viewCycleId = this.selectedCycleId;
    this.loadPeriods();
  }

  ngOnInit(): void {
    this.generateTaxYearOptions();
    this.loadCycles();
  }

  generateTaxYearOptions(): void {
    const now = new Date();
    const currentYear = now.getFullYear();
    const month = now.getMonth();
    const activeStartYear = month >= 2 ? currentYear : currentYear - 1;
    const activeTaxYear = `${activeStartYear}/${activeStartYear + 1}`;
    for (let y = currentYear - 2; y <= currentYear + 3; y++) {
      this.taxYears.push(`${y}/${y + 1}`);
    }
    this.selectedTaxYear = activeTaxYear;
    this.viewTaxYear = activeTaxYear;
  }

  getTaxYearInt(ty: string): number {
    return parseInt(ty.split('/')[1]);
  }

  onTaxYearChange(): void {
    const parts = this.selectedTaxYear.split('/');
    const startYear = parseInt(parts[0]);
    const endYear = startYear + 1;
    this.startDate = `${startYear}-03-01`;
    const isLeap = (endYear % 4 === 0 && endYear % 100 !== 0) || endYear % 400 === 0;
    this.endDate = `${endYear}-02-${isLeap ? '29' : '28'}`;
    this.cdr.detectChanges();
  }

  loadCycles(): void {
    this.api.get<any[]>('/payroll/cycles').subscribe({
      next: (data) => {
        this.cycles = data || [];
        this.loading = false;
        if (this.cycles.length > 0 && !this.selectedCycleId) {
          this.selectedCycleId = this.cycles[0].id;
          this.viewCycleId = this.cycles[0].id;
        }
        this.onTaxYearChange();
        this.loadPeriods();
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  loadPeriods(): void {
    if (!this.viewCycleId || !this.viewTaxYear) { this.periods = []; this.cdr.detectChanges(); return; }
    const taxYear = this.getTaxYearInt(this.viewTaxYear);
    this.api.get<any[]>('/payroll/periods', { cycle_id: this.viewCycleId, tax_year: taxYear }).subscribe({
      next: (data) => { this.periods = data || []; this.cdr.detectChanges(); },
      error: () => { this.periods = []; this.cdr.detectChanges(); }
    });
  }

  generate(): void {
    if (!this.selectedTaxYear) { this.ui.toast('warning', 'Validation', 'Select a tax year'); return; }
    if (!this.selectedCycleId) { this.ui.toast('warning', 'Validation', 'Select a cycle'); return; }
    if (!this.startDate) { this.ui.toast('warning', 'Validation', 'Start date is required'); return; }
    if (!this.endDate) { this.ui.toast('warning', 'Validation', 'End date is required'); return; }

    this.generating = true;
    this.cdr.detectChanges();

    this.api.post<any>('/payroll/periods/generate', {
      tax_year: this.getTaxYearInt(this.selectedTaxYear),
      cycle_id: this.selectedCycleId,
      start_date: this.startDate,
      end_date: this.endDate,
      tax_year_open: this.taxYearOpen
    }).subscribe({
      next: (data) => {
        this.generating = false;
        this.ui.toast('success', 'Generated', data?.message || `${data?.periods_created} periods created`);
        this.viewTaxYear = this.selectedTaxYear;
        this.viewCycleId = this.selectedCycleId;
        this.loadPeriods();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.generating = false;
        this.ui.toast('error', 'Error', err?.error?.message || 'Failed to generate periods');
        this.cdr.detectChanges();
      }
    });
  }

  deletePeriods(): void {
    if (!this.viewCycleId || !this.viewTaxYear) return;
    const cycleName = this.cycles.find(c => c.id === this.viewCycleId)?.name || '';
    if (!confirm(`Delete all periods for ${this.viewTaxYear} - ${cycleName}? This cannot be undone.`)) return;

    const taxYear = this.getTaxYearInt(this.viewTaxYear);
    this.api.delete(`/payroll/periods/tax-year?tax_year=${taxYear}&cycle_id=${this.viewCycleId}`).subscribe({
      next: () => {
        this.ui.toast('success', 'Deleted', 'Periods deleted');
        this.loadPeriods();
      },
      error: (err: any) => {
        this.ui.toast('error', 'Error', err?.error?.message || 'Failed to delete');
        this.cdr.detectChanges();
      }
    });
  }

  getSelectedCycleName(): string {
    return this.cycles.find(c => c.id === this.selectedCycleId)?.name || '';
  }

  getSelectedCycleType(): string {
    return this.cycles.find(c => c.id === this.selectedCycleId)?.cycle_type || '';
  }
}
