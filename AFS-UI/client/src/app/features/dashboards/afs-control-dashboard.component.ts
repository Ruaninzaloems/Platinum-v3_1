import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { PeriodFilterService } from '../../core/services/period-filter.service';
import { DashboardData } from '../../core/models/interfaces';
import { KpiTileComponent } from '../../shared/components/kpi-tile.component';
import { ProgressRingComponent } from '../../shared/components/progress-ring.component';
import { TrafficLightComponent } from '../../shared/components/traffic-light.component';

@Component({
  selector: 'app-afs-control-dashboard',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatButtonModule, MatIconModule,
    MatProgressBarModule, MatProgressSpinnerModule, MatTooltipModule,
    MatSelectModule, MatFormFieldModule,
    KpiTileComponent, ProgressRingComponent, TrafficLightComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './afs-control-dashboard.component.html',
  styleUrl: './afs-control-dashboard.component.css'
})
export class AfsControlDashboardComponent implements OnInit {
  loading = true;
  error = '';
  data: DashboardData | null = null;
  recentComps: any[] = [];
  incompleteWps: any[] = [];
  missingDisclosures: any[] = [];
  teamWorkload: { name: string; count: number }[] = [];
  maxWorkload = 1;

  selectedPeriod = 'full_year';
  periodOptions = PeriodFilterService.PERIOD_OPTIONS;

  private periodFilter = inject(PeriodFilterService);
  private initialLoadDone = false;

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {
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
    this.loading = true;
    this.error = '';
    this.cdr.markForCheck();

    const url = PeriodFilterService.appendPeriodToUrl('/reports/dashboard', this.selectedPeriod);
    this.api.get<DashboardData>(url).subscribe({
      next: (data) => {
        this.data = data;
        this.extractComps();
        this.extractWorkingPapers();
        this.extractDisclosures();
        this.buildTeamWorkload();
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

  private extractComps() {
    if (!this.data) return;
    const activity = this.data.recentActivity || [];
    const compActivities = activity
      .filter((a: any) => a.type === 'compilation')
      .slice(0, 10);

    this.api.get<any[]>('/compilations').subscribe({
      next: (comps) => {
        this.recentComps = comps || [];
        this.buildTeamWorkload();
        this.cdr.markForCheck();
      },
      error: () => {
        this.recentComps = [];
        this.cdr.markForCheck();
      }
    });
  }

  private extractWorkingPapers() {
    this.api.get<any[]>('/working-papers').subscribe({
      next: (wps) => {
        this.incompleteWps = (wps || [])
          .filter((wp: any) => wp.status !== 'signed_off' && wp.status !== 'completed')
          .slice(0, 8);
        this.cdr.markForCheck();
      },
      error: () => {
        this.incompleteWps = [];
        this.cdr.markForCheck();
      }
    });
  }

  private extractDisclosures() {
    this.api.get<any>('/reports/integrity-checks').subscribe({
      next: (result) => {
        const checks = result?.checks || [];
        this.missingDisclosures = checks
          .filter((c: any) => c.status === 'fail' || c.status === 'warning')
          .slice(0, 6);
        this.cdr.markForCheck();
      },
      error: () => {
        this.missingDisclosures = [];
        this.cdr.markForCheck();
      }
    });
  }

  private buildTeamWorkload() {
    const counts: Record<string, number> = {};
    for (const comp of this.recentComps) {
      const name = comp.preparedBy || 'Unassigned';
      counts[name] = (counts[name] || 0) + 1;
    }
    this.teamWorkload = Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
    this.maxWorkload = Math.max(...this.teamWorkload.map(t => t.count), 1);
  }

  statusCount(status: string): number {
    return this.data?.compilationsByStatus?.[status] || 0;
  }

  formatStatus(status: string): string {
    return (status || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  getCompletenessColor(value: number): string {
    if (value >= 80) return '#4caf50';
    if (value >= 50) return '#f59e0b';
    return '#ef5350';
  }

  getWpTrafficLight(status: string): 'green' | 'amber' | 'red' {
    if (status === 'signed_off' || status === 'completed') return 'green';
    if (status === 'in_progress' || status === 'in_review') return 'amber';
    return 'red';
  }

  getBarPercent(count: number): number {
    return (count / this.maxWorkload) * 100;
  }

  getBarColor(count: number): string {
    const colors = ['#3b82f6', '#8b5cf6', '#06b6d4', '#f59e0b', '#ec4899', '#10b981'];
    const idx = count % colors.length;
    return colors[idx];
  }

  navigate(path: string) {
    this.router.navigate([path]);
  }
}
