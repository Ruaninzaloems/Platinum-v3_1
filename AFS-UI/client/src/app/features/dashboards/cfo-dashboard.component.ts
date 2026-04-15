import { Component, OnInit, ChangeDetectionStrategy, signal, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import { PeriodFilterService } from '../../core/services/period-filter.service';
import { ArtApiService } from '../../core/services/art-api.service';
import { KpiTileComponent } from '../../shared/components/kpi-tile.component';
import { GaugeChartComponent } from '../../shared/components/gauge-chart.component';
import { TrafficLightComponent } from '../../shared/components/traffic-light.component';
import { AiInsightCardComponent, AiInsight } from '../../shared/components/ai-insight-card.component';
import { SparklineComponent } from '../../shared/components/sparkline.component';
import { ProgressRingComponent } from '../../shared/components/progress-ring.component';

@Component({
  selector: 'app-cfo-dashboard',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatButtonModule, MatIconModule,
    MatProgressBarModule, MatChipsModule, MatTooltipModule, MatDividerModule,
    MatSelectModule, MatFormFieldModule,
    KpiTileComponent, GaugeChartComponent, TrafficLightComponent,
    AiInsightCardComponent, SparklineComponent, ProgressRingComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cfo-dashboard.component.html',
  styleUrl: './cfo-dashboard.component.css',
})
export class CfoDashboardComponent implements OnInit {
  Math = Math;
  loading = signal(true);
  dashData = signal<any>(null);
  ratiosData = signal<any>(null);

  healthThresholds = [
    { value: 40, color: '#ef4444' },
    { value: 70, color: '#f59e0b' },
    { value: 100, color: '#22c55e' },
  ];

  emsStatus = signal<'unknown' | 'connected' | 'disconnected'>('unknown');
  emsStats = signal<{ assetCount: number | null; vendorCount: number | null; activePayroll: number | null } | null>(null);

  selectedPeriod = 'full_year';
  periodOptions = PeriodFilterService.PERIOD_OPTIONS;

  private periodFilter = inject(PeriodFilterService);
  private initialLoadDone = false;

  constructor(private api: ApiService, private artApi: ArtApiService, private router: Router) {
    effect(() => {
      const _f = this.periodFilter.selectedFyId();
      if (this.initialLoadDone) {
        this.loadData();
      }
    });
  }

  ngOnInit() {
    this.initialLoadDone = true;
    this.loadData();
  }

  onPeriodChange() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    const url = PeriodFilterService.appendPeriodToUrl('/reports/dashboard', this.selectedPeriod);
    this.api.get<any>(url).subscribe({
      next: (data) => {
        this.dashData.set(data);
        if (data.financialYear?.id) {
          this.api.get<any>(`/reports/ratios/${data.financialYear.id}`).subscribe({
            next: (ratios) => { this.ratiosData.set(ratios); this.loading.set(false); },
            error: () => this.loading.set(false),
          });
        } else {
          this.loading.set(false);
        }
      },
      error: () => this.loading.set(false),
    });
    this.loadEmsStatus();
  }

  private loadEmsStatus() {
    this.artApi.getStatus().pipe(
      catchError(() => of({ connected: false, configured: false }))
    ).subscribe((status: any) => {
      this.emsStatus.set(status.connected ? 'connected' : 'disconnected');
      if (status.connected) {
        this.loadEmsStats();
      }
    });
  }

  private loadEmsStats() {
    forkJoin({
      assets: this.artApi.getAssetSummary().pipe(catchError(() => of(null))),
      payroll: this.artApi.getPayrollSummary().pipe(catchError(() => of(null))),
      summary: this.artApi.getSummary().pipe(catchError(() => of(null))),
    }).subscribe(({ assets, payroll, summary }) => {
      this.emsStats.set({
        assetCount: (assets as any)?.totalAssets ?? (summary as any)?.assets?.count ?? null,
        vendorCount: (summary as any)?.scm?.vendorCount ?? (summary as any)?.vendors?.count ?? null,
        activePayroll: (payroll as any)?.totalEmployees ?? (summary as any)?.payroll?.count ?? null,
      });
    });
  }

  surplus = computed(() => {
    const tb = this.dashData()?.tbSummary;
    return tb ? tb.surplus : 0;
  });

  surplusLabel = computed(() => {
    const s = this.surplus();
    return s >= 0 ? 'Operating surplus' : 'Operating deficit';
  });

  surplusPercent = computed(() => {
    const tb = this.dashData()?.tbSummary;
    if (!tb || tb.totalRevenue === 0) return '0%';
    return ((tb.surplus / Math.abs(tb.totalRevenue)) * 100).toFixed(1) + '%';
  });

  overallHealthScore = computed(() => {
    return this.ratiosData()?.overallScore || 0;
  });

  aiInsights = computed((): AiInsight[] => {
    const insights: AiInsight[] = [];
    const d = this.dashData();
    const r = this.ratiosData();
    if (!d) return insights;

    if (d.kpis.overdueRfis > 0) {
      insights.push({
        text: `${d.kpis.overdueRfis} RFIs are overdue. Timely response is critical to avoid audit escalation.`,
        severity: d.kpis.overdueRfis > 5 ? 'critical' : 'warning',
        action: 'View RFIs',
        reference: '/rfis',
      });
    }
    if (d.findingsBySeverity?.material > 0) {
      insights.push({
        text: `${d.findingsBySeverity.material} material finding(s) require immediate attention to prevent qualification.`,
        severity: 'critical',
        action: 'View Findings',
        reference: '/findings',
      });
    }
    if (r) {
      const redRatios = r.ratios?.filter((x: any) => x.status === 'red') || [];
      if (redRatios.length > 0) {
        insights.push({
          text: `${redRatios.length} financial ratio(s) are outside acceptable norms: ${redRatios.slice(0, 3).map((x: any) => x.name).join(', ')}.`,
          severity: 'warning',
          action: 'View Ratios',
          reference: '/dashboards/financial-ratios',
        });
      }
    }
    if (d.kpis.avgCompleteness < 80) {
      insights.push({
        text: `AFS completion is at ${d.kpis.avgCompleteness}%. Target 100% before submission deadline.`,
        severity: 'info',
        action: 'View Compilations',
        reference: '/compilations',
      });
    }
    return insights;
  });

  topRisks = computed(() => {
    const risks: any[] = [];
    const r = this.ratiosData();
    if (!r?.ratios) return risks;

    const redRatios = r.ratios.filter((x: any) => x.status === 'red');
    const amberRatios = r.ratios.filter((x: any) => x.status === 'amber');

    for (const ratio of [...redRatios, ...amberRatios].slice(0, 5)) {
      risks.push({
        area: ratio.category,
        status: ratio.status,
        metric: ratio.name,
        value: ratio.displayValue,
      });
    }

    if (risks.length < 5) {
      const d = this.dashData();
      if (d?.kpis.overdueRfis > 0) {
        risks.push({ area: 'Audit Compliance', status: 'amber', metric: 'Overdue RFIs', value: String(d.kpis.overdueRfis) });
      }
      if (d?.findingsBySeverity?.material > 0) {
        risks.push({ area: 'Audit Findings', status: 'red', metric: 'Material Findings', value: String(d.findingsBySeverity.material) });
      }
    }

    return risks.slice(0, 5);
  });

  formatCurrency(value: number): string {
    if (value == null || isNaN(value)) return 'R 0';
    const abs = Math.abs(value);
    let formatted: string;
    if (abs >= 1e9) formatted = (abs / 1e9).toFixed(2) + 'B';
    else if (abs >= 1e6) formatted = (abs / 1e6).toFixed(1) + 'M';
    else if (abs >= 1e3) formatted = (abs / 1e3).toFixed(0) + 'K';
    else formatted = abs.toFixed(0);
    return (value < 0 ? '(R ' : 'R ') + formatted + (value < 0 ? ')' : '');
  }

  barWidth(value: number, max: number): number {
    return max > 0 ? Math.min((Math.abs(value) / max) * 100, 100) : 0;
  }

  maxBudgetActual = computed(() => {
    const bva = this.dashData()?.budgetVsActual || [];
    let max = 0;
    for (const item of bva) {
      max = Math.max(max, Math.abs(item.actual), Math.abs(item.budget));
    }
    return max;
  });

  ratioValue(name: string): string {
    const r = this.ratiosData()?.ratios?.find((x: any) => x.name === name);
    return r?.displayValue || 'N/A';
  }

  ratioNorm(name: string): string {
    const r = this.ratiosData()?.ratios?.find((x: any) => x.name === name);
    return r ? `Norm: ${r.norm}` : '';
  }

  ratioTrend(name: string): 'up' | 'down' | 'neutral' {
    const r = this.ratiosData()?.ratios?.find((x: any) => x.name === name);
    return r?.status === 'green' ? 'up' : r?.status === 'red' ? 'down' : 'neutral';
  }

  ratioColor(name: string): 'primary' | 'success' | 'warning' | 'danger' | 'info' {
    const r = this.ratiosData()?.ratios?.find((x: any) => x.name === name);
    if (!r) return 'info';
    return r.status === 'green' ? 'success' : r.status === 'red' ? 'danger' : 'warning';
  }

  onInsightAction(insight: AiInsight) {
    if (insight.reference) this.router.navigateByUrl(insight.reference);
  }
}
