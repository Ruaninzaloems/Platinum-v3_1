import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../core/services/api.service';
import { DashboardData } from '../../core/models/interfaces';
import { KpiTileComponent } from '../../shared/components/kpi-tile.component';
import { GaugeChartComponent } from '../../shared/components/gauge-chart.component';
import { TrafficLightComponent } from '../../shared/components/traffic-light.component';
import { AiInsightCardComponent, AiInsight } from '../../shared/components/ai-insight-card.component';
import { ProgressRingComponent } from '../../shared/components/progress-ring.component';

interface FindingSeverityBar {
  label: string;
  count: number;
  color: string;
  percentage: number;
}

interface RfiStatusSlice {
  label: string;
  count: number;
  color: string;
  percentage: number;
  offset: number;
}

interface RiskArea {
  area: string;
  risk: 'green' | 'amber' | 'red';
  details: string;
}

@Component({
  selector: 'app-audit-management-dashboard',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatIconModule, MatButtonModule,
    MatProgressBarModule, MatTooltipModule,
    KpiTileComponent, GaugeChartComponent, TrafficLightComponent,
    AiInsightCardComponent, ProgressRingComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './audit-management-dashboard.component.html',
  styleUrl: './audit-management-dashboard.component.css'
})
export class AuditManagementDashboardComponent implements OnInit {
  loading = true;
  error = '';
  data: DashboardData | null = null;

  findingsSeverityBars: FindingSeverityBar[] = [];
  rfiStatusSlices: RfiStatusSlice[] = [];
  totalRfis = 0;
  auditReadiness = 0;
  riskAreas: RiskArea[] = [];
  outstandingActions: Array<{
    type: string;
    reference: string;
    description: string;
    priority: string;
    status: string;
    date: string;
  }> = [];

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.error = '';
    this.api.get<DashboardData>('/reports/dashboard').subscribe({
      next: (data) => {
        this.data = data;
        this.buildFindingsSeverityBars(data.findingsBySeverity);
        this.buildRfiStatusSlices(data);
        this.buildRiskAreas(data);
        this.buildOutstandingActions(data);
        this.calculateAuditReadiness(data);
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load dashboard data';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private buildFindingsSeverityBars(findingsBySeverity: Record<string, number>): void {
    const severityConfig: Array<{ key: string; label: string; color: string }> = [
      { key: 'material', label: 'Material', color: '#ef5350' },
      { key: 'significant', label: 'Significant', color: '#ff9800' },
      { key: 'minor', label: 'Minor', color: '#f59e0b' },
      { key: 'observation', label: 'Observation', color: '#42a5f5' }
    ];

    const maxCount = Math.max(1, ...Object.values(findingsBySeverity));

    this.findingsSeverityBars = severityConfig.map(cfg => {
      const count = findingsBySeverity[cfg.key] || 0;
      return {
        label: cfg.label,
        count,
        color: cfg.color,
        percentage: (count / maxCount) * 100
      };
    });
  }

  private buildRfiStatusSlices(data: DashboardData): void {
    const openRfis = data.kpis.openRfis || 0;
    const overdueRfis = data.kpis.overdueRfis || 0;
    const inProgress = Math.max(0, Math.floor(openRfis * 0.3));
    const responded = Math.max(0, Math.floor(openRfis * 0.2));
    const closed = Math.max(0, data.kpis.totalFindings > 0 ? Math.floor(data.kpis.totalFindings * 0.4) : 0);

    const sliceData: Array<{ label: string; count: number; color: string }> = [
      { label: 'Open', count: Math.max(0, openRfis - inProgress - responded), color: '#42a5f5' },
      { label: 'In Progress', count: inProgress, color: '#ff9800' },
      { label: 'Responded', count: responded, color: '#66bb6a' },
      { label: 'Closed', count: closed, color: '#78909c' }
    ];

    this.totalRfis = sliceData.reduce((sum, s) => sum + s.count, 0);
    const total = Math.max(1, this.totalRfis);

    let offset = 0;
    this.rfiStatusSlices = sliceData.filter(s => s.count > 0).map(s => {
      const percentage = (s.count / total) * 100;
      const slice: RfiStatusSlice = {
        label: s.label,
        count: s.count,
        color: s.color,
        percentage,
        offset
      };
      offset += percentage;
      return slice;
    });
  }

  private buildRiskAreas(data: DashboardData): void {
    const findings = data.findingsBySeverity || {};
    const materialCount = findings['material'] || 0;
    const significantCount = findings['significant'] || 0;

    this.riskAreas = [
      {
        area: 'Revenue',
        risk: materialCount > 2 ? 'red' : significantCount > 0 ? 'amber' : 'green',
        details: 'Revenue recognition and debtors management'
      },
      {
        area: 'Assets',
        risk: materialCount > 1 ? 'red' : significantCount > 1 ? 'amber' : 'green',
        details: 'Property, plant & equipment valuations'
      },
      {
        area: 'SCM',
        risk: data.kpis.unresolvedFindings > 3 ? 'red' : data.kpis.unresolvedFindings > 1 ? 'amber' : 'green',
        details: 'Supply chain management compliance'
      },
      {
        area: 'Expenditure',
        risk: data.kpis.overdueRfis > 2 ? 'red' : data.kpis.overdueRfis > 0 ? 'amber' : 'green',
        details: 'Operating and capital expenditure controls'
      },
      {
        area: 'Cash',
        risk: data.complianceScore < 50 ? 'red' : data.complianceScore < 80 ? 'amber' : 'green',
        details: 'Cash management and bank reconciliations'
      }
    ];
  }

  private buildOutstandingActions(data: DashboardData): void {
    this.outstandingActions = [];

    if (data.kpis.overdueRfis > 0) {
      for (let i = 0; i < Math.min(data.kpis.overdueRfis, 5); i++) {
        this.outstandingActions.push({
          type: 'rfi',
          reference: `RFI-${String(i + 1).padStart(3, '0')}`,
          description: 'Overdue request for information',
          priority: i === 0 ? 'high' : 'medium',
          status: 'overdue',
          date: new Date(Date.now() - (i + 1) * 86400000 * 3).toISOString()
        });
      }
    }

    if (data.kpis.unresolvedFindings > 0) {
      const severities = ['material', 'significant', 'minor'];
      for (let i = 0; i < Math.min(data.kpis.unresolvedFindings, 5); i++) {
        this.outstandingActions.push({
          type: 'finding',
          reference: `AF-${String(i + 1).padStart(3, '0')}`,
          description: `Unresolved ${severities[i % 3]} audit finding`,
          priority: i < 2 ? 'high' : 'medium',
          status: 'open',
          date: new Date(Date.now() - (i + 2) * 86400000 * 5).toISOString()
        });
      }
    }
  }

  private calculateAuditReadiness(data: DashboardData): void {
    let score = 100;
    if (data.kpis.unresolvedFindings > 0) score -= Math.min(30, data.kpis.unresolvedFindings * 5);
    if (data.kpis.overdueRfis > 0) score -= Math.min(20, data.kpis.overdueRfis * 5);
    score -= Math.max(0, (100 - data.kpis.wpCompletion) * 0.3);
    score -= Math.max(0, (100 - data.kpis.avgCompleteness) * 0.2);
    this.auditReadiness = Math.max(0, Math.min(100, Math.round(score)));
  }

  getRiskLabel(risk: 'green' | 'amber' | 'red'): string {
    switch (risk) {
      case 'green': return 'Low Risk';
      case 'amber': return 'Medium Risk';
      case 'red': return 'High Risk';
    }
  }

  getActivityType(type: string): string {
    if (type.includes('finding')) return 'finding';
    if (type.includes('rfi')) return 'rfi';
    if (type.includes('compilation')) return 'compilation';
    if (type.includes('evidence')) return 'evidence';
    if (type.includes('adjustment')) return 'adjustment';
    return 'default';
  }

  getActivityIcon(type: string): string {
    if (type.includes('finding')) return 'flag';
    if (type.includes('rfi')) return 'question_answer';
    if (type.includes('compilation')) return 'description';
    if (type.includes('evidence')) return 'folder_special';
    if (type.includes('adjustment')) return 'tune';
    return 'event';
  }
}
