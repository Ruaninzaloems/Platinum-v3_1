import { Component, OnInit, ChangeDetectionStrategy, signal, computed } from '@angular/core';
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
import { ProgressRingComponent } from '../../shared/components/progress-ring.component';

interface RfiDashboardData {
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  open: number;
  overdue: number;
  overdueList: Array<{
    id: string;
    reference: string;
    subject: string;
    priority: string;
    dueDate: string;
    status: string;
    assignedTo: string;
    daysOverdue: number;
  }>;
  avgResponseDays: number;
  slaCompliance: number;
  monthlyTrend: Array<{ month: string; count: number }>;
  pipeline: {
    open: number;
    in_progress: number;
    responded: number;
    under_review: number;
    closed: number;
    reopened: number;
  };
}

@Component({
  selector: 'app-rfi-dashboard',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatTooltipModule,
    KpiTileComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './rfi-dashboard.component.html',
  styleUrl: './rfi-dashboard.component.css'
})
export class RfiDashboardComponent implements OnInit {
  data = signal<RfiDashboardData | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  pipelineStages = computed(() => {
    const d = this.data();
    if (!d) return [];
    const pipeline = d.pipeline;
    const max = Math.max(1, ...Object.values(pipeline));
    return [
      { key: 'open', label: 'Open', count: pipeline.open, pct: (pipeline.open / max) * 100 },
      { key: 'in_progress', label: 'In Progress', count: pipeline.in_progress, pct: (pipeline.in_progress / max) * 100 },
      { key: 'responded', label: 'Responded', count: pipeline.responded, pct: (pipeline.responded / max) * 100 },
      { key: 'under_review', label: 'Under Review', count: pipeline.under_review, pct: (pipeline.under_review / max) * 100 },
      { key: 'closed', label: 'Closed', count: pipeline.closed, pct: (pipeline.closed / max) * 100 },
      { key: 'reopened', label: 'Reopened', count: pipeline.reopened, pct: (pipeline.reopened / max) * 100 },
    ];
  });

  prioritySegments = computed(() => {
    const d = this.data();
    if (!d || d.total === 0) return [];
    const circumference = 2 * Math.PI * 60;
    const colors: Record<string, string> = {
      critical: '#ef4444',
      high: '#f59e0b',
      medium: '#3b82f6',
      low: '#10b981',
    };
    const priorities = ['critical', 'high', 'medium', 'low'];
    let offset = 0;
    return priorities
      .filter(p => (d.byPriority[p] || 0) > 0)
      .map(p => {
        const count = d.byPriority[p] || 0;
        const pct = count / d.total;
        const dashLen = pct * circumference;
        const gapLen = circumference - dashLen;
        const seg = {
          key: p,
          label: p,
          count,
          color: colors[p] || '#94a3b8',
          dashArray: `${dashLen} ${gapLen}`,
          dashOffset: `${-offset}`,
        };
        offset += dashLen;
        return seg;
      });
  });

  statusBars = computed(() => {
    const d = this.data();
    if (!d) return [];
    const colors: Record<string, string> = {
      open: '#3b82f6',
      in_progress: '#f59e0b',
      responded: '#8b5cf6',
      under_review: '#06b6d4',
      closed: '#10b981',
      reopened: '#ef4444',
    };
    const entries = Object.entries(d.byStatus);
    const max = Math.max(1, ...entries.map(([, v]) => v));
    return entries.map(([key, count]) => ({
      key,
      label: key.replace(/_/g, ' '),
      count,
      pct: (count / max) * 100,
      color: colors[key] || '#94a3b8',
    }));
  });

  private maxTrend = 0;

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    this.error.set(null);
    this.api.get<RfiDashboardData>('/reports/rfi-dashboard').subscribe({
      next: (d) => {
        this.data.set(d);
        this.maxTrend = Math.max(1, ...d.monthlyTrend.map(m => m.count));
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Failed to load RFI dashboard data');
        this.loading.set(false);
      },
    });
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
  }

  getTrendBarHeight(count: number): number {
    return this.maxTrend > 0 ? (count / this.maxTrend) * 85 : 0;
  }

  formatMonth(ym: string): string {
    const [, month] = ym.split('-');
    const months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[parseInt(month)] || month;
  }
}
