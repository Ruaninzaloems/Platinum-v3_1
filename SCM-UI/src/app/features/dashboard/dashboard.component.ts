import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService, ExecutiveDashboard, ComplianceDashboard, OperationalDashboard, AiInsight, KpiCard, PipelineStage, TurnaroundMetric, ComplianceComponent, Bottleneck, WorkloadItem, BudgetCommitment, RecentTransaction, ControlTowerDashboard, AttentionTile, BlockingEntry, FunnelStage, Escalation } from '../../core/services/dashboard.service';
import { DrillThroughService } from '../../core/services/drill-through.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCardModule,
    MatIconModule,
    MatTabsModule,
    MatProgressBarModule,
    MatChipsModule,
    MatBadgeModule,
    MatDividerModule,
    MatTooltipModule,
    MatButtonModule,
    DatePipe,
    DecimalPipe
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  drillThrough = inject(DrillThroughService);
  private authService = inject(AuthService);
  private http = inject(HttpClient);

  activeTab = signal<'executive' | 'compliance' | 'operational' | 'control-tower' | 'invoices'>('executive');
  loading = signal(true);
  loadError = signal<string | null>(null);

  executiveData = signal<ExecutiveDashboard | null>(null);
  complianceData = signal<ComplianceDashboard | null>(null);
  operationalData = signal<OperationalDashboard | null>(null);
  aiInsights = signal<AiInsight[]>([]);
  complianceAiInsights = signal<AiInsight[]>([]);
  operationalAiInsights = signal<AiInsight[]>([]);
  controlTowerAiInsights = signal<AiInsight[]>([]);
  invoicePaymentAiInsights = signal<AiInsight[]>([]);
  controlTowerData = signal<ControlTowerDashboard | null>(null);
  
  invoiceSummary = signal<any>(null);
  paymentSummary = signal<any>(null);
  mfmaData = signal<any>(null);
  invoicePipeline = signal<any>(null);
  touchlessData = signal<any>(null);

  today = new Date();

  canViewCompliance = computed(() => {
    return this.authService.hasRole('cfo', 'municipal_manager', 'scm_manager', 'internal_auditor', 'system_admin');
  });

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    this.loadError.set(null);
    this.dashboardService.getExecutiveDashboard().subscribe({
      next: data => {
        this.executiveData.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Dashboard load error:', err);
        this.loadError.set(err?.message || 'Failed to load dashboard data. Please try refreshing.');
        this.loading.set(false);
      }
    });
    this.dashboardService.getAiInsights().subscribe({
      next: d => this.aiInsights.set(d.insights),
      error: () => {}
    });
  }

  switchTab(tab: 'executive' | 'compliance' | 'operational' | 'control-tower' | 'invoices') {
    this.activeTab.set(tab);
    if (tab === 'compliance' && !this.complianceData()) {
      this.dashboardService.getComplianceDashboard().subscribe({
        next: d => this.complianceData.set(d),
        error: err => console.error('Compliance load error:', err)
      });
    }
    if (tab === 'compliance' && this.complianceAiInsights().length === 0) {
      this.dashboardService.getComplianceAiInsights().subscribe({
        next: d => this.complianceAiInsights.set(d.insights || []),
        error: () => {}
      });
    }
    if (tab === 'operational' && !this.operationalData()) {
      this.dashboardService.getOperationalDashboard().subscribe({
        next: d => this.operationalData.set(d),
        error: err => console.error('Operational load error:', err)
      });
    }
    if (tab === 'operational' && this.operationalAiInsights().length === 0) {
      this.dashboardService.getOperationalAiInsights().subscribe({
        next: d => this.operationalAiInsights.set(d.insights || []),
        error: () => {}
      });
    }
    if (tab === 'control-tower' && !this.controlTowerData()) {
      this.dashboardService.getControlTowerDashboard().subscribe({
        next: d => this.controlTowerData.set(d),
        error: err => console.error('Control tower load error:', err)
      });
    }
    if (tab === 'control-tower' && this.controlTowerAiInsights().length === 0) {
      this.dashboardService.getControlTowerAiInsights().subscribe({
        next: d => this.controlTowerAiInsights.set(d.insights || []),
        error: () => {}
      });
    }
    if (tab === 'invoices' && !this.invoiceSummary()) {
      this.loadInvoicePaymentData();
    }
    if (tab === 'invoices' && this.invoicePaymentAiInsights().length === 0) {
      this.dashboardService.getInvoicePaymentAiInsights().subscribe({
        next: d => this.invoicePaymentAiInsights.set(d.insights || []),
        error: () => {}
      });
    }
  }

  loadInvoicePaymentData() {
    const unwrap = (res: any) => res && typeof res === 'object' && 'data' in res ? res.data : res;

    this.http.get<any>(`${environment.apiUrl}/invoices/dashboard/summary`).subscribe({
      next: data => this.invoiceSummary.set(unwrap(data)),
      error: err => console.error('Error loading invoice summary:', err)
    });

    this.http.get<any>(`${environment.apiUrl}/payments/dashboard/summary`).subscribe({
      next: data => this.paymentSummary.set(unwrap(data)),
      error: err => console.error('Error loading payment summary:', err)
    });

    this.http.get<any>(`${environment.apiUrl}/invoices/mfma-compliance`).subscribe({
      next: data => this.mfmaData.set(unwrap(data)),
      error: err => console.error('Error loading MFMA data:', err)
    });

    this.http.get<any>(`${environment.apiUrl}/invoices/pipeline`).subscribe({
      next: data => this.invoicePipeline.set(unwrap(data)),
      error: err => console.error('Error loading invoice pipeline:', err)
    });

    this.http.get<any>(`${environment.apiUrl}/invoices/touchless-rate`).subscribe({
      next: data => this.touchlessData.set(unwrap(data)),
      error: err => console.error('Error loading touchless data:', err)
    });
  }

  onKpiClick(kpi: KpiCard) {
    this.drillThrough.navigate(this.drillThrough.kpiToRoute(kpi.id));
  }

  onPipelineClick(stage: PipelineStage) {
    const stageMap: Record<string, string> = {
      'Demand': '/demand',
      'Requisition': '/requisitions',
      'Sourcing': '/tenders',
      'PO': '/orders',
      'Delivery': '/grn',
      'Invoice': '/invoices',
      'Payment': '/payments'
    };
    this.drillThrough.navigate(stageMap[stage.stage] || '/dashboard');
  }

  onTransactionClick(txn: RecentTransaction) {
    this.drillThrough.navigate(txn.route, txn.params);
  }

  onBottleneckClick(b: Bottleneck) {
    this.drillThrough.navigate(b.route, b.params);
  }

  onWorkloadItemClick(item: WorkloadItem) {
    this.drillThrough.navigate(item.route, item.params);
  }

  formatCurrency(value: number): string {
    if (value == null) return 'R 0';
    return 'R ' + value.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  formatCompact(value: number): string {
    if (value >= 1_000_000) return 'R ' + (value / 1_000_000).toFixed(1) + 'M';
    if (value >= 1_000) return 'R ' + (value / 1_000).toFixed(0) + 'K';
    return 'R ' + value.toLocaleString('en-ZA');
  }

  getKpiIcon(id: string): string {
    const map: Record<string, string> = {
      requisitions: 'description',
      orders: 'shopping_cart',
      payments: 'payments',
      commitments: 'pending_actions',
      budget: 'account_balance',
      invoices: 'receipt_long',
      compliance: 'verified'
    };
    return map[id] || 'bar_chart';
  }

  getKpiIconColor(id: string): string {
    const map: Record<string, string> = {
      requisitions: 'icon-blue',
      orders: 'icon-teal',
      payments: 'icon-green',
      commitments: 'icon-amber',
      budget: 'icon-purple',
      invoices: 'icon-red',
      compliance: 'icon-teal'
    };
    return map[id] || 'icon-blue';
  }

  getStageStatus(stage: PipelineStage): string {
    const ratio = stage.avgDays / stage.targetDays;
    if (ratio <= 0.75) return 'on-track';
    if (ratio <= 1) return 'near-target';
    return 'exceeding';
  }

  getOldestItem(stage: PipelineStage): number {
    if (!stage.items || stage.items.length === 0) return 0;
    return Math.max(...stage.items.map(i => i.days));
  }

  getTurnaroundStatus(metric: TurnaroundMetric): string {
    const ratio = metric.actual / metric.target;
    if (ratio < 0.75) return 'on-track';
    if (ratio < 1) return 'near-target';
    return 'exceeding';
  }

  getBulletWidth(metric: TurnaroundMetric): number {
    const max = Math.max(metric.actual, metric.target) * 1.2;
    return (metric.actual / max) * 100;
  }

  getTargetLinePos(metric: TurnaroundMetric): number {
    const max = Math.max(metric.actual, metric.target) * 1.2;
    return (metric.target / max) * 100;
  }

  getTurnaroundDelta(metric: TurnaroundMetric): string {
    const diff = ((metric.target - metric.actual) / metric.target) * 100;
    if (diff > 0) return Math.abs(diff).toFixed(0) + '% faster than target';
    if (diff < 0) return Math.abs(diff).toFixed(0) + '% slower than target';
    return 'On target';
  }

  getComplianceRingColor(score: number): string {
    if (score > 90) return 'var(--platinum-success)';
    if (score >= 70) return 'var(--platinum-warning)';
    return 'var(--platinum-danger)';
  }

  getComplianceDash(score: number): string {
    const circumference = 2 * Math.PI * 52;
    const filled = (score / 100) * circumference;
    return `${filled} ${circumference}`;
  }

  getCompBarColor(score: number): string {
    if (score > 90) return 'comp-green';
    if (score >= 70) return 'comp-amber';
    return 'comp-red';
  }

  getTooltipForKpi(kpi: KpiCard): string {
    if (!kpi.breakdown) return '';
    return Object.entries(kpi.breakdown).map(([k, v]) => `${k}: ${v}`).join(' | ');
  }

  getRelativeTime(timestamp: string): string {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    return `${diffDay}d ago`;
  }

  getUifwTooltip(category: { amount: number; count: number; status: string; items?: Array<{ description: string }> }): string {
    if (category.items && category.items.length > 0) return category.items[0].description;
    return category.status;
  }

  getUifwColor(category: { amount: number; status: string }): string {
    if (category.amount === 0) return 'uifw-green';
    if (category.status?.toLowerCase().includes('investigation')) return 'uifw-amber';
    return 'uifw-red';
  }

  getWorkloadIcon(type: string): string {
    const map: Record<string, string> = {
      approval: 'check_circle',
      requisition: 'description',
      grn: 'inventory_2',
      invoice: 'receipt_long',
      order: 'shopping_cart',
      contract: 'gavel'
    };
    return map[type?.toLowerCase()] || 'task';
  }

  getBottleneckWidth(b: Bottleneck): number {
    return Math.min((b.avgDays / (b.targetDays * 2)) * 100, 100);
  }

  getScoreColor(score: number): string {
    if (score >= 80) return 'score-green';
    if (score >= 60) return 'score-amber';
    return 'score-red';
  }

  getBudgetColor(utilisation: number): string {
    if (utilisation > 100) return 'budget-dark-red';
    if (utilisation > 90) return 'budget-red';
    if (utilisation > 75) return 'budget-amber';
    return 'budget-green';
  }

  getActualPct(vote: BudgetCommitment): number {
    if (!vote.budget) return 0;
    return Math.min((vote.actual / vote.budget) * 100, 100);
  }

  getCommittedPct(vote: BudgetCommitment): number {
    if (!vote.budget) return 0;
    return Math.min((vote.committed / vote.budget) * 100, 100 - this.getActualPct(vote));
  }

  getHeatmapColor(value: number, bucketIndex: number): string {
    if (value === 0) return 'hm-empty';
    if (bucketIndex >= 3 && value > 0) return 'hm-critical';
    if (bucketIndex >= 2 && value > 0) return 'hm-warning';
    if (value > 5) return 'hm-moderate';
    return 'hm-low';
  }

  getFunnelColor(fs: FunnelStage): string {
    if (fs.avgDaysInStage > fs.targetDays) return 'funnel-red';
    if (fs.avgDaysInStage > fs.targetDays * 0.75) return 'funnel-amber';
    return 'funnel-green';
  }

  getFunnelWidth(fs: FunnelStage): number {
    return Math.min((fs.avgDaysInStage / (fs.targetDays * 1.5)) * 100, 100);
  }
}
