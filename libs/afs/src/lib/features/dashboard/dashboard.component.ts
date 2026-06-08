import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatMenuModule } from '@angular/material/menu';
import { ApiService } from '../../core/services/api.service';
import { PeriodFilterService } from '../../core/services/period-filter.service';
import { DashboardData } from '../../core/models/interfaces';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatButtonModule, MatIconModule,
    MatProgressBarModule, MatChipsModule, MatProgressSpinnerModule,
    MatTooltipModule, MatSelectModule, MatFormFieldModule, MatMenuModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  data: DashboardData | null = null;
  loading = true;
  error: string | null = null;

  skeletonCards = [1, 2, 3, 4, 5, 6, 7];
  skeletonKpis = [1, 2, 3, 4, 5, 6];
  skeletonRows = [1, 2, 3, 4];

  retryCount = 0;
  private maxAutoRetries = 8;

  selectedPeriod = 'full_year';
  periodOptions = PeriodFilterService.PERIOD_OPTIONS;

  private periodFilter = inject(PeriodFilterService);
  private initialLoadDone = false;

  constructor(private api: ApiService, private router: Router, private cdr: ChangeDetectorRef) {
    effect(() => {
      const _fy = this.periodFilter.selectedFyId();
      if (this.initialLoadDone) {
        this.loadDashboard();
      }
    });
  }

  ngOnInit() {
    this.retryCount = 0;
    this.api.waitForBackend().subscribe({
      next: (ready) => {
        if (ready) {
          this.initialLoadDone = true;
          this.loadDashboard();
        } else {
          this.autoRetryWithDelay();
        }
      },
      error: () => this.autoRetryWithDelay(),
    });
  }

  private autoRetryWithDelay() {
    if (this.retryCount < this.maxAutoRetries) {
      this.retryCount++;
      this.error = null;
      this.loading = true;
      this.cdr.markForCheck();
      const delay = Math.min(3000 + (this.retryCount * 1000), 8000);
      setTimeout(() => this.loadDashboard(), delay);
    } else {
      this.error = 'Server is still starting up. Click Retry to try again.';
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  loadDashboard() {
    this.loading = true;
    this.error = null;
    this.cdr.markForCheck();
    const url = PeriodFilterService.appendPeriodToUrl('/reports/dashboard', this.selectedPeriod);
    this.api.get<DashboardData>(url, undefined, { timeout: 60000 }).subscribe({
      next: (data) => {
        this.data = data;
        this.loading = false;
        this.retryCount = 0;
        this.cdr.markForCheck();
      },
      error: (err) => {
        void err;
        const status = err?.status;

        if (status === 401 || status === 403) {
          this.router.navigate(['/login']);
          return;
        }

        if (this.retryCount < this.maxAutoRetries && (status === 0 || status === 500 || status === 502 || status === 503 || status === 504 || err?.name === 'TimeoutError')) {
          this.autoRetryWithDelay();
        } else {
          if (status === 0 || status === 502 || status === 503 || status === 504) {
            this.error = 'Server is unavailable. It may be restarting — click Retry in a moment.';
          } else if (status === 500) {
            this.error = 'Server encountered an error loading dashboard data. Click Retry to try again.';
          } else if (err?.name === 'TimeoutError') {
            this.error = 'Request timed out. The server may be under heavy load — click Retry.';
          } else {
            this.error = 'Could not load dashboard data. Please check your connection and try again.';
          }
          this.loading = false;
          this.cdr.markForCheck();
        }
      }
    });
  }

  onPeriodChange() {
    this.loadDashboard();
  }

  navigate(path: string) {
    this.router.navigate([path]);
  }

  formatCurrency(value: number | null | undefined): string {
    if (value === null || value === undefined) return 'R 0';
    const abs = Math.abs(value);
    const sign = value < 0 ? '-' : '';
    if (abs >= 1_000_000_000) return `${sign}R ${(abs / 1_000_000_000).toFixed(2)}B`;
    if (abs >= 1_000_000) return `${sign}R ${(abs / 1_000_000).toFixed(2)}M`;
    if (abs >= 1_000) return `${sign}R ${(abs / 1_000).toFixed(1)}K`;
    return `${sign}R ${abs.toFixed(2)}`;
  }

  revenueCollectionRate(): number {
    if (!this.data?.tbSummary) return 0;
    const budget = Math.abs(this.data.tbSummary.totalBudgetRevenue);
    const actual = Math.abs(this.data.tbSummary.totalRevenue);
    return budget > 0 ? (actual / budget) * 100 : 0;
  }

  expenditureRate(): number {
    if (!this.data?.tbSummary) return 0;
    const budget = Math.abs(this.data.tbSummary.totalBudgetExpenditure);
    const actual = Math.abs(this.data.tbSummary.totalExpenditure);
    return budget > 0 ? (actual / budget) * 100 : 0;
  }

  getUtilisation(actual: number, budget: number): number {
    if (!budget || budget === 0) return 0;
    return Math.min(Math.abs(actual / budget) * 100, 150);
  }

  getBarWidth(actual: number, budget: number): number {
    if (!budget || budget === 0) return 0;
    return Math.min((actual / budget) * 100, 100);
  }

  getItemName(fullDesc: string): string {
    if (!fullDesc) return '';
    const parts = fullDesc.split(':');
    return parts[parts.length - 1]?.trim() || fullDesc;
  }

  isGlBalanced(): boolean {
    if (!this.data?.glSummary) return false;
    const rawTotal = this.data.glSummary.rawGrandTotal ?? this.data.glSummary.grandTotal;
    return Math.abs(rawTotal) < 1;
  }

  getGlCatIcon(itemType: string): string {
    const icons: Record<string, string> = {
      IA: 'domain', IL: 'account_balance_wallet', LN: 'savings',
      IR: 'trending_up', IE: 'trending_down', IZ: 'swap_vert'
    };
    return icons[itemType] || 'category';
  }

  getActivityIcon(type: string): string {
    const icons: Record<string, string> = {
      compilation: 'description',
      rfi: 'question_answer',
      finding: 'flag',
      evidence: 'attach_file',
      adjustment: 'tune',
      export: 'download',
      approval: 'check_circle'
    };
    return icons[type] || 'info';
  }
}
