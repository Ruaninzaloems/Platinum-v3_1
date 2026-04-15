import { Component, ChangeDetectionStrategy, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatMenuModule } from '@angular/material/menu';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-financial-integration',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatCardModule, MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatTooltipModule, MatChipsModule, MatProgressBarModule, MatMenuModule],
  templateUrl: './financial-integration.component.html',
  styleUrl: './financial-integration.component.scss'
})
export class FinancialIntegrationComponent implements OnInit {
  private http = inject(HttpClient);

  loading = signal(false);
  notification = signal('');
  activeTab = signal('dashboard');

  dashboardData = signal<any>(null);
  postingLog = signal<any[]>([]);
  postingSummary = signal<any[]>([]);

  glView = signal<'entries' | 'trial-balance'>('entries');
  glEntries = signal<any[]>([]);
  glPage = signal(1);
  glTotalPages = signal(1);
  glSearchQuery = '';
  glFilterModule = '';
  trialBalance = signal<any>(null);

  budgetSummary = signal<any>(null);
  budgetVotes = signal<any[]>([]);

  mscoaFunctions = signal<any[]>([]);
  mscoaItems = signal<any[]>([]);
  mscoaFunds = signal<any[]>([]);
  mscoaProjects = signal<any[]>([]);
  mscoaRegions = signal<any[]>([]);
  mscoaCostings = signal<any[]>([]);
  mscoaFunctionId: number | null = null;
  mscoaItemId: number | null = null;
  mscoaFundId: number | null = null;
  mscoaProjectId: number | null = null;
  mscoaRegionId: number | null = null;
  mscoaCostingId: number | null = null;
  mscoaResult = signal<any>(null);
  inventoryMappings = signal<any[]>([]);

  periodStatus = signal<any>(null);

  mfmaSection71 = signal<any>(null);
  mfmaSection52 = signal<any>(null);
  mfmaSection65 = signal<any>(null);
  mfmaUnauthorized = signal<any>(null);

  Math = Math;

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.loading.set(true);
    this.loadDashboard();
    this.loadGlEntries();
    this.loadBudgetData();
    this.loadMscoaChart();
    this.loadPeriodStatus();
    setTimeout(() => this.loading.set(false), 600);
  }

  switchTab(tab: string): void {
    this.activeTab.set(tab);
    if (tab === 'dashboard') this.loadDashboard();
    if (tab === 'gl') this.loadGlEntries();
    if (tab === 'budget') this.loadBudgetData();
    if (tab === 'mscoa') { this.loadMscoaChart(); this.loadInventoryMappings(); }
    if (tab === 'period') this.loadPeriodStatus();
  }

  loadDashboard(): void {
    this.http.get<any>(`${environment.apiUrl}/integration/dashboard`).subscribe({
      next: (data) => this.dashboardData.set(data),
      error: () => this.dashboardData.set({ totalGlEntries: 0, todayPostings: 0, unreconciledCount: 0, currentPeriod: 'P9', budgetUtilisation: 0 })
    });
    this.http.get<any>(`${environment.apiUrl}/integration/posting-log`).subscribe({
      next: (data) => {
        const logs = Array.isArray(data) ? data : (data?.data || []);
        this.postingLog.set(logs.slice(0, 20));
        this.buildPostingSummary(logs);
      },
      error: () => { this.postingLog.set([]); this.postingSummary.set([]); }
    });
  }

  buildPostingSummary(logs: any[]): void {
    const counts: Record<string, number> = {};
    logs.forEach((l: any) => {
      const action = l.action || 'UNKNOWN';
      counts[action] = (counts[action] || 0) + 1;
    });
    this.postingSummary.set(
      Object.entries(counts).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count)
    );
  }

  loadGlEntries(): void {
    const params: any = { page: this.glPage(), pageSize: 20 };
    if (this.glSearchQuery) params.documentNumber = this.glSearchQuery;
    if (this.glFilterModule) params.sourceModule = this.glFilterModule;
    this.http.get<any>(`${environment.apiUrl}/integration/gl/entries`, { params }).subscribe({
      next: (res) => {
        this.glEntries.set(res.data || []);
        this.glTotalPages.set(res.totalPages || 1);
      },
      error: () => { this.glEntries.set([]); this.glTotalPages.set(1); }
    });
  }

  changeGlPage(page: number): void {
    this.glPage.set(page);
    this.loadGlEntries();
  }

  viewGlEntry(entry: any): void {
    const journalId = entry.NormalJournalID || entry.MultipleJournalID;
    if (journalId) {
      this.showNotification(`Viewing Journal #${journalId} for GL Entry #${entry.GenLedger_ID}`);
    }
  }

  loadTrialBalance(): void {
    this.http.get<any>(`${environment.apiUrl}/integration/gl/trial-balance`).subscribe({
      next: (data) => this.trialBalance.set(data),
      error: () => this.trialBalance.set(null)
    });
  }

  loadBudgetData(): void {
    this.http.get<any>(`${environment.apiUrl}/integration/budget/summary`).subscribe({
      next: (data) => this.budgetSummary.set(data),
      error: () => this.budgetSummary.set(null)
    });
    this.http.get<any[]>(`${environment.apiUrl}/integration/budget/vote-balances`).subscribe({
      next: (data) => this.budgetVotes.set(data || []),
      error: () => this.budgetVotes.set([])
    });
  }

  loadMscoaChart(): void {
    this.http.get<any>(`${environment.apiUrl}/integration/mscoa/chart`).subscribe({
      next: (chart) => {
        this.mscoaFunctions.set(chart.functions || []);
        this.mscoaItems.set(chart.items || []);
        this.mscoaFunds.set(chart.funds || []);
        this.mscoaProjects.set(chart.projects || []);
        this.mscoaRegions.set(chart.regions || []);
        this.mscoaCostings.set(chart.costings || []);
      },
      error: () => {}
    });
  }

  loadInventoryMappings(): void {
    this.http.get<any[]>(`${environment.apiUrl}/integration/mscoa/inventory-mappings`).subscribe({
      next: (data) => this.inventoryMappings.set(data || []),
      error: () => this.inventoryMappings.set([])
    });
  }

  validateMscoa(): void {
    const body: any = {};
    if (this.mscoaFunctionId) body.functionId = this.mscoaFunctionId;
    if (this.mscoaItemId) body.itemId = this.mscoaItemId;
    if (this.mscoaFundId) body.fundId = this.mscoaFundId;
    if (this.mscoaProjectId) body.projectId = this.mscoaProjectId;
    if (this.mscoaRegionId) body.regionId = this.mscoaRegionId;
    if (this.mscoaCostingId) body.costingId = this.mscoaCostingId;
    this.http.post<any>(`${environment.apiUrl}/integration/mscoa/validate`, body).subscribe({
      next: (result) => this.mscoaResult.set(result),
      error: () => this.mscoaResult.set({ valid: false, errors: [{ segment: 'System', error: 'Validation request failed' }] })
    });
  }

  loadPeriodStatus(): void {
    this.http.get<any>(`${environment.apiUrl}/integration/period-close/status`).subscribe({
      next: (data) => this.periodStatus.set(data),
      error: () => this.periodStatus.set(null)
    });
  }

  completeChecklistItem(itemId: number): void {
    this.http.post<any>(`${environment.apiUrl}/integration/period-close/items/${itemId}/complete`, {}).subscribe({
      next: () => {
        this.showNotification('Checklist item marked as complete');
        this.loadPeriodStatus();
      },
      error: () => this.showNotification('Failed to complete checklist item')
    });
  }

  approvePeriodClose(): void {
    this.http.post<any>(`${environment.apiUrl}/integration/period-close/approve`, {}).subscribe({
      next: (res) => {
        this.showNotification(res.message || 'Period closed successfully');
        this.loadPeriodStatus();
      },
      error: (err) => this.showNotification(err.error?.error || 'Failed to close period')
    });
  }

  loadMfmaReport(type: string): void {
    if (type === 'section71') {
      this.http.get<any>(`${environment.apiUrl}/integration/mfma/section71-report`).subscribe({
        next: (data) => this.mfmaSection71.set(data),
        error: () => this.mfmaSection71.set({ reportingPeriod: '2025/2026 P9', originalBudget: 0, adjustmentBudget: 0, ytdActual: 0, variancePercentage: 0 })
      });
    } else if (type === 'section52') {
      this.http.get<any>(`${environment.apiUrl}/integration/mfma/section52-report`).subscribe({
        next: (data) => this.mfmaSection52.set(data),
        error: () => this.mfmaSection52.set({ serviceDeliveryScore: 0, capitalProgramme: 0, revenueCollection: 0 })
      });
    } else if (type === 'section65') {
      this.http.get<any>(`${environment.apiUrl}/integration/mfma/section65-compliance`).subscribe({
        next: (data) => this.mfmaSection65.set(data),
        error: () => this.mfmaSection65.set({ complianceRate: 0, totalInvoices: 0, paidWithin30Days: 0, overdue: 0 })
      });
    } else if (type === 'unauthorized') {
      this.http.get<any>(`${environment.apiUrl}/integration/mfma/unauthorized-expenditure`).subscribe({
        next: (data) => this.mfmaUnauthorized.set(data),
        error: () => this.mfmaUnauthorized.set({ unauthorizedAmount: 0, irregularAmount: 0, fruitlessAmount: 0, totalCases: 0 })
      });
    }
  }

  showNotification(msg: string): void {
    this.notification.set(msg);
    setTimeout(() => this.notification.set(''), 4000);
  }

  formatCurrency(value: number): string {
    return 'R ' + value.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatCurrencyShort(value: number): string {
    if (value >= 1000000) return 'R ' + (value / 1000000).toFixed(1) + 'M';
    if (value >= 1000) return 'R ' + (value / 1000).toFixed(0) + 'K';
    return 'R ' + value.toFixed(2);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  formatDateTime(dateStr: string): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
  }
}
