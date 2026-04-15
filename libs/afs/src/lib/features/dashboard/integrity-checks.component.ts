import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatBadgeModule } from '@angular/material/badge';
import { ApiService } from '../../core/services/api.service';
import { PeriodFilterService } from '../../core/services/period-filter.service';
import { IntegrityCheckResult, IntegrityCheck, GlDrillThroughEntry, GlDrillThroughResult } from '../../core/models/interfaces';

@Component({
  selector: 'app-integrity-checks',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatTooltipModule, MatExpansionModule,
    MatChipsModule, MatTableModule, MatBadgeModule
  ],
  templateUrl: './integrity-checks.component.html',
  styleUrl: './integrity-checks.component.css'
})
export class IntegrityChecksComponent implements OnInit {
  loading = signal(true);
  error = signal<string | null>(null);
  data = signal<IntegrityCheckResult | null>(null);
  expandedChecks = signal<Set<string>>(new Set());

  glDrillCategory = signal<string | null>(null);
  glDrillLoading = signal(false);
  glDrillResult = signal<GlDrillThroughResult | null>(null);
  private glDrillItemType: string | null = null;

  private categoryToItemType: Record<string, string> = {
    'Assets': 'IA', 'Liabilities': 'IL', 'Net Assets': 'LN',
    'Revenue': 'IR', 'Expenditure': 'IE', 'Gains and Losses': 'IZ',
  };

  categories = [
    { id: 'Balance Integrity', label: 'Balance Integrity', icon: 'balance', color: '#2563eb', tooltip: 'Validates that debits equal credits, closing balances are mathematically consistent, and the TB nets to zero — the foundation of double-entry accounting' },
    { id: 'Cross-Statement Validation', label: 'Cross-Statement Validation', icon: 'compare_arrows', color: '#7c3aed', tooltip: 'Verifies consistency between financial statements — Balance Sheet equation, Income Statement surplus links to Accumulated Surplus movement, and cash flow reconciliation' },
    { id: 'Data Quality', label: 'Data Quality', icon: 'verified', color: '#0891b2', tooltip: 'Checks for missing data, sign convention violations, duplicate entries, unusual prior year movements, and incomplete mSCOA mappings' },
    { id: 'Budget Compliance', label: 'Budget Compliance', icon: 'account_balance_wallet', color: '#059669', tooltip: 'Identifies material budget variances exceeding thresholds and unbudgeted items with significant balances — critical for MFMA compliance' },
  ];

  private static readonly REQUIRED_PERIODS = ['current_year', 'prior_year_1'];

  hasCompilationContext = signal(false);
  compilationContextLoading = signal(true);
  allPeriodsReady = signal(false);
  periodsLoading = signal(true);
  periodStatuses = signal<{ periodType: string; status: string }[]>([]);
  missingPeriods = signal<string[]>([]);

  constructor(private api: ApiService, private router: Router, private periodFilter: PeriodFilterService) {}

  ngOnInit() {
    this.checkCompilationContext();
    this.checkPeriodsReady();
  }

  private tryRunChecks(): void {
    if (this.hasCompilationContext() && this.allPeriodsReady()) {
      this.runChecks();
    }
  }

  private checkCompilationContext(): void {
    this.compilationContextLoading.set(true);
    const fyId = this.periodFilter.selectedFyId();
    this.api.get<any[]>('/compilations').subscribe({
      next: (compilations) => {
        this.hasCompilationContext.set(Array.isArray(compilations) && compilations.some(c =>
          (c.financialYearId === fyId || c.financialYear?.id === fyId) && c.status !== 'inactive'
        ));
        this.compilationContextLoading.set(false);
        this.tryRunChecks();
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
        const statuses = (batches || []).map(b => ({ periodType: b.periodType || 'unknown', status: b.status }));
        this.periodStatuses.set(statuses);
        const committedPeriods = new Set((batches || []).filter(b => b.status === 'committed').map(b => b.periodType));
        const failedRequired = (batches || []).filter(b => b.status === 'validation_failed' && IntegrityChecksComponent.REQUIRED_PERIODS.includes(b.periodType));
        const missing = IntegrityChecksComponent.REQUIRED_PERIODS.filter(p => !committedPeriods.has(p));
        this.missingPeriods.set(missing);
        this.allPeriodsReady.set(missing.length === 0 && failedRequired.length === 0);
        this.periodsLoading.set(false);
        this.tryRunChecks();
      },
      error: () => {
        this.allPeriodsReady.set(false);
        this.missingPeriods.set(IntegrityChecksComponent.REQUIRED_PERIODS);
        this.periodsLoading.set(false);
      }
    });
  }

  goToCompilations(): void {
    this.router.navigate(['/compilations']);
  }

  goToTbImport(): void {
    this.router.navigate(['/tb-import-workbench']);
  }

  runChecks() {
    this.loading.set(true);
    this.error.set(null);
    this.api.get<IntegrityCheckResult>('/reports/integrity-checks').subscribe({
      next: (result) => {
        this.data.set(result);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Failed to run integrity checks');
        this.loading.set(false);
      }
    });
  }

  getCategoryChecks(categoryId: string, status?: string): IntegrityCheck[] {
    const checks = this.data()?.checks?.filter(c => c.category === categoryId) || [];
    if (status) return checks.filter(c => c.status === status);
    return checks.sort((a, b) => {
      const order = { fail: 0, warning: 1, pass: 2 };
      return (order[a.status] ?? 2) - (order[b.status] ?? 2);
    });
  }

  toggleCheck(checkId: string) {
    const current = new Set(this.expandedChecks());
    if (current.has(checkId)) {
      current.delete(checkId);
    } else {
      current.add(checkId);
    }
    this.expandedChecks.set(current);
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'pass': return 'check_circle';
      case 'fail': return 'cancel';
      case 'warning': return 'warning';
      default: return 'help';
    }
  }

  getScoreColor(score: number): string {
    if (score >= 90) return '#16a34a';
    if (score >= 70) return '#d97706';
    return '#dc2626';
  }

  getScoreClass(score: number): string {
    if (score >= 90) return 'score-green';
    if (score >= 70) return 'score-amber';
    return 'score-red';
  }

  getScoreDash(score: number): string {
    const circumference = 2 * Math.PI * 52;
    const filled = (score / 100) * circumference;
    return `${filled} ${circumference}`;
  }

  formatCurrency(value: number): string {
    if (value === undefined || value === null) return '-';
    const abs = Math.abs(value);
    if (abs >= 1e9) return (value < 0 ? '-' : '') + 'R ' + (abs / 1e9).toFixed(2) + 'B';
    if (abs >= 1e6) return (value < 0 ? '-' : '') + 'R ' + (abs / 1e6).toFixed(2) + 'M';
    if (abs >= 1e3) return (value < 0 ? '-' : '') + 'R ' + (abs / 1e3).toFixed(1) + 'K';
    return 'R ' + value.toFixed(2);
  }

  formatTime(iso: string): string {
    if (!iso) return '-';
    const d = new Date(iso);
    return d.toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' });
  }

  truncateFile(filename: string): string {
    if (!filename) return '';
    if (filename.length > 20) return '...' + filename.slice(-18);
    return filename;
  }

  loadGlDrillThrough(category: string, page = 1, itemTypeFromDetail?: string) {
    const fyId = this.data()?.financialYear?.id;
    if (!fyId) return;
    const itemType = itemTypeFromDetail || this.glDrillItemType || this.categoryToItemType[category];
    if (!itemType) return;

    this.glDrillCategory.set(category);
    this.glDrillItemType = itemType;
    this.glDrillLoading.set(true);
    this.glDrillResult.set(null);

    this.api.get<GlDrillThroughResult>(`/reports/gl-drillthrough/${fyId}`, {
      itemType, page: page.toString(), limit: '50'
    }).subscribe({
      next: (result) => {
        this.glDrillResult.set(result);
        this.glDrillLoading.set(false);
      },
      error: () => {
        this.glDrillLoading.set(false);
      }
    });
  }

  glDrillPage(page: number) {
    const cat = this.glDrillCategory();
    if (cat) this.loadGlDrillThrough(cat, page);
  }

  closeGlDrillThrough() {
    this.glDrillCategory.set(null);
    this.glDrillResult.set(null);
    this.glDrillItemType = null;
  }
}
