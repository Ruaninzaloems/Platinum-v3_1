import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { KpiTileComponent } from '../../shared/components/kpi-tile.component';
import { TrafficLightComponent } from '../../shared/components/traffic-light.component';
import { AiInsightCardComponent, AiInsight } from '../../shared/components/ai-insight-card.component';

interface FindingsDashboardData {
  total: number;
  resolved: number;
  highRisk: number;
  repeatFindings: number;
  avgDaysToResolution: number;
  bySeverity: Record<string, number>;
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
  unresolvedList: Array<{
    id: string;
    reference: string;
    title: string;
    severity: string;
    status: string;
    category: string;
    assignedTo: string;
    financialImpact: number;
    ageDays: number;
  }>;
}

@Component({
  selector: 'app-findings-dashboard',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatTooltipModule,
    KpiTileComponent, TrafficLightComponent, AiInsightCardComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './findings-dashboard.component.html',
  styleUrl: './findings-dashboard.component.css'
})
export class FindingsDashboardComponent implements OnInit {
  data: FindingsDashboardData | null = null;
  loading = true;
  error = '';

  severityItems: Array<{ key: string; label: string; count: number; color: string }> = [];
  statusItems: Array<{ key: string; label: string; count: number; color: string }> = [];
  aiInsights: AiInsight[] = [];

  private maxSeverity = 1;
  private maxStatus = 1;

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.error = '';
    this.cdr.markForCheck();

    this.api.get<FindingsDashboardData>('/reports/findings-dashboard').subscribe({
      next: (res) => {
        this.data = res;
        this.buildCharts();
        this.buildInsights();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to load findings dashboard';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private buildCharts() {
    if (!this.data) return;

    const severityConfig: Record<string, { label: string; color: string }> = {
      material: { label: 'Material', color: '#ef5350' },
      significant: { label: 'Significant', color: '#ff9800' },
      minor: { label: 'Minor', color: '#f59e0b' },
      observation: { label: 'Observation', color: '#42a5f5' },
    };

    this.severityItems = Object.entries(severityConfig).map(([key, cfg]) => ({
      key,
      label: cfg.label,
      count: this.data!.bySeverity[key] || 0,
      color: cfg.color,
    }));
    this.maxSeverity = Math.max(1, ...this.severityItems.map(i => i.count));

    const statusConfig: Record<string, { label: string; color: string }> = {
      open: { label: 'Open', color: '#42a5f5' },
      draft: { label: 'Draft', color: '#94a3b8' },
      in_progress: { label: 'In Progress', color: '#7e57c2' },
      resolved: { label: 'Resolved', color: '#4caf50' },
      closed: { label: 'Closed', color: '#26a69a' },
    };

    this.statusItems = Object.entries(statusConfig)
      .map(([key, cfg]) => ({
        key,
        label: cfg.label,
        count: this.data!.byStatus[key] || 0,
        color: cfg.color,
      }))
      .filter(i => i.count > 0);
    this.maxStatus = Math.max(1, ...this.statusItems.map(i => i.count));
  }

  private buildInsights() {
    if (!this.data) return;
    this.aiInsights = [];

    if (this.data.highRisk > 0) {
      this.aiInsights.push({
        text: `There are ${this.data.highRisk} material finding(s) that remain unresolved. These require immediate management attention and action plans before the audit report is finalised.`,
        severity: 'critical',
        action: 'View Material Findings',
      });
    }

    const unresolved = this.data.total - this.data.resolved;
    if (unresolved > 0 && this.data.total > 0) {
      const pct = ((unresolved / this.data.total) * 100).toFixed(0);
      this.aiInsights.push({
        text: `${pct}% of all findings (${unresolved} of ${this.data.total}) remain unresolved. Average resolution time is ${this.data.avgDaysToResolution} days. Consider prioritising older findings to improve the resolution rate.`,
        severity: 'warning',
      });
    }

    if (this.data.total === 0) {
      this.aiInsights.push({
        text: 'No audit findings have been raised yet. Findings will appear here as the audit progresses.',
        severity: 'info',
      });
    } else if (this.data.highRisk === 0 && unresolved <= 2) {
      this.aiInsights.push({
        text: 'Findings are well managed with no material issues outstanding. Maintain current resolution pace to support a clean audit outcome.',
        severity: 'info',
      });
    }
  }

  getBarPercent(count: number): number {
    return (count / this.maxSeverity) * 100;
  }

  getStatusBarPercent(count: number): number {
    return (count / this.maxStatus) * 100;
  }

  formatCategory(category: string): string {
    if (!category) return '—';
    return category.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  formatStatus(status: string): string {
    if (!status) return '—';
    return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  navigate(path: string) {
    this.router.navigate([path]);
  }
}
