import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { ApiService } from '../../core/services/api.service';
import { PeriodFilterService } from '../../core/services/period-filter.service';

@Component({
  selector: 'app-opening-balance-control',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatChipsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatSnackBarModule,
    MatDividerModule,
    MatPaginatorModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './opening-balance-control.component.html',
  styleUrl: './opening-balance-control.component.css',
})
export class OpeningBalanceControlComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);
  private periodFilter = inject(PeriodFilterService);
  private snackBar = inject(MatSnackBar);

  private static readonly REQUIRED_PERIODS = ['current_year', 'prior_year_1'];

  hasCompilationContext = signal(false);
  compilationContextLoading = signal(true);
  compilationId = signal<string | null>(null);
  financialYearId = signal<string>('');

  allPeriodsReady = signal(false);
  periodsLoading = signal(true);

  baseline = signal<any>(null);
  exceptions = signal<any[]>([]);
  exceptionsTotal = signal(0);
  baselineLoading = signal(false);
  generateLoading = signal(false);
  confirmLoading = signal(false);

  exceptionsPage = 1;
  exceptionsLimit = 50;
  exceptionsFilter = '';

  selectedExceptionId = signal<string | null>(null);
  acknowledgeReason = '';
  acknowledgeCategory = '';
  acknowledgeLoading = signal(false);

  reasonCategories = [
    { value: 'reclassification', label: 'Reclassification' },
    { value: 'prior_period_error', label: 'Prior-Period Error' },
    { value: 'first_year_adoption', label: 'First-Year Adoption' },
    { value: 'other', label: 'Other' },
  ];

  ngOnInit() {
    this.financialYearId.set(this.periodFilter.selectedFyId());
    this.checkCompilationContext();
    this.checkPeriodsReady();
  }

  private checkCompilationContext(): void {
    this.compilationContextLoading.set(true);
    const fyId = this.periodFilter.selectedFyId();
    this.api.get<any[]>('/compilations').subscribe({
      next: (compilations) => {
        const activeComp = Array.isArray(compilations) && compilations.find(c =>
          (c.financialYearId === fyId || c.financialYear?.id === fyId) && c.status !== 'inactive'
        );
        this.hasCompilationContext.set(!!activeComp);
        this.compilationId.set(activeComp?.id || null);
        this.compilationContextLoading.set(false);
        if (activeComp) {
          this.loadBaseline();
        }
      },
      error: () => {
        this.hasCompilationContext.set(false);
        this.compilationContextLoading.set(false);
      }
    });
  }

  private checkPeriodsReady(): void {
    this.periodsLoading.set(true);
    const fyId = this.periodFilter.selectedFyId();
    if (!fyId) {
      this.allPeriodsReady.set(false);
      this.periodsLoading.set(false);
      return;
    }
    this.api.get<any[]>(`/platinum/tb-import-batches/history/${fyId}`).subscribe({
      next: (batches) => {
        const committedPeriods = new Set((batches || []).filter(b => b.status === 'committed').map(b => b.periodType));
        const missing = OpeningBalanceControlComponent.REQUIRED_PERIODS.filter(p => !committedPeriods.has(p));
        this.allPeriodsReady.set(missing.length === 0);
        this.periodsLoading.set(false);
      },
      error: () => {
        this.allPeriodsReady.set(false);
        this.periodsLoading.set(false);
      }
    });
  }

  loadBaseline(): void {
    const compId = this.compilationId();
    if (!compId) return;
    this.baselineLoading.set(true);
    this.api.get<any>(`/opening-balance/${compId}`).subscribe({
      next: (result) => {
        this.baseline.set(result?.baseline || null);
        this.exceptions.set(result?.exceptions || []);
        this.exceptionsTotal.set(result?.exceptions?.length || 0);
        this.baselineLoading.set(false);
      },
      error: () => {
        this.baseline.set(null);
        this.exceptions.set([]);
        this.baselineLoading.set(false);
      }
    });
  }

  generateComparison(): void {
    const compId = this.compilationId();
    if (!compId) return;
    this.generateLoading.set(true);
    this.api.post(`/opening-balance/generate/${compId}`, {
      financialYearId: this.financialYearId(),
    }).subscribe({
      next: () => {
        this.generateLoading.set(false);
        this.loadBaseline();
        this.showSuccess('Opening balance comparison generated — review and confirm the baseline');
      },
      error: (err) => {
        this.generateLoading.set(false);
        this.showError(err.error?.message || 'Failed to generate comparison');
      }
    });
  }

  confirmBaseline(): void {
    const bl = this.baseline();
    if (!bl) return;
    this.confirmLoading.set(true);
    this.api.post(`/opening-balance/${bl.id}/confirm`, {}).subscribe({
      next: () => {
        this.confirmLoading.set(false);
        this.loadBaseline();
        this.showSuccess('Opening balance baseline confirmed');
      },
      error: (err) => {
        this.confirmLoading.set(false);
        this.showError(err.error?.message || 'Failed to confirm baseline');
      }
    });
  }

  selectException(exceptionId: string): void {
    this.selectedExceptionId.set(
      this.selectedExceptionId() === exceptionId ? null : exceptionId
    );
    this.acknowledgeReason = '';
    this.acknowledgeCategory = '';
  }

  acknowledgeException(exceptionId: string): void {
    if (!this.acknowledgeReason || !this.acknowledgeCategory) {
      this.showError('Please provide a reason and category');
      return;
    }
    this.acknowledgeLoading.set(true);
    this.api.patch(`/opening-balance/exceptions/${exceptionId}/acknowledge`, {
      reason: this.acknowledgeReason,
      reasonCategory: this.acknowledgeCategory,
    }).subscribe({
      next: () => {
        this.acknowledgeLoading.set(false);
        this.acknowledgeReason = '';
        this.acknowledgeCategory = '';
        this.selectedExceptionId.set(null);
        this.loadBaseline();
        this.showSuccess('Exception acknowledged');
      },
      error: (err) => {
        this.acknowledgeLoading.set(false);
        this.showError(err.error?.message || 'Failed to acknowledge exception');
      }
    });
  }

  get canConfirm(): boolean {
    const bl = this.baseline();
    if (!bl) return false;
    if (bl.status === 'continuity_matched_confirmed' || bl.status === 'confirmed_with_exception') return false;
    if (bl.status === 'superseded' || bl.status === 'not_established') return false;
    if (bl.status === 'continuity_matched_unconfirmed') return true;
    if (bl.status === 'continuity_exception') {
      const unacknowledged = this.exceptions().filter(e => !e.acknowledged);
      return unacknowledged.length === 0;
    }
    if (bl.status === 'baseline_selected') {
      const unacknowledged = this.exceptions().filter(e => !e.acknowledged);
      return unacknowledged.length === 0;
    }
    return false;
  }

  get isConfirmed(): boolean {
    const bl = this.baseline();
    return bl?.status === 'continuity_matched_confirmed' || bl?.status === 'confirmed_with_exception';
  }

  get isSuperseded(): boolean {
    return this.baseline()?.status === 'superseded';
  }

  get unacknowledgedCount(): number {
    return this.exceptions().filter(e => !e.acknowledged).length;
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'not_established': return 'Not Established';
      case 'baseline_selected': return 'Baseline Selected — Exceptions Pending';
      case 'continuity_matched_unconfirmed': return 'All Items Matched — Awaiting Confirmation';
      case 'continuity_exception': return 'Exceptions Acknowledged — Awaiting Confirmation';
      case 'continuity_matched_confirmed': return 'Continuity Matched — Confirmed';
      case 'confirmed_with_exception': return 'Confirmed with Exception';
      case 'superseded': return 'Superseded';
      default: return status;
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'continuity_matched_confirmed':
      case 'confirmed_with_exception':
        return '#4caf50';
      case 'continuity_matched_unconfirmed':
        return '#2196f3';
      case 'baseline_selected':
        return '#ff9800';
      case 'continuity_exception':
        return '#ff9800';
      case 'superseded':
        return '#f44336';
      default:
        return '#9e9e9e';
    }
  }

  getExceptionTypeLabel(type: string): string {
    switch (type) {
      case 'difference': return 'Balance Difference';
      case 'new_account': return 'New mSCOA Item';
      case 'closed_account': return 'Closed mSCOA Item';
      default: return type;
    }
  }

  formatRand(value: number): string {
    if (value == null) return 'R 0.00';
    const abs = Math.abs(value);
    const formatted = abs.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return value < 0 ? `(R ${formatted})` : `R ${formatted}`;
  }

  goToCompilations(): void {
    this.router.navigate(['/compilations']);
  }

  goToDataSources(): void {
    this.router.navigate(['/tb-import-workbench']);
  }

  private showSuccess(msg: string): void {
    this.snackBar.open(msg, 'OK', { duration: 3000 });
  }

  private showError(msg: string): void {
    this.snackBar.open(msg, 'Close', { duration: 6000, panelClass: ['snack-error'] });
  }
}
