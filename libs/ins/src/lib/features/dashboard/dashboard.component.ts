import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { environment } from '../../environment';

interface OrgSummary { totalKpis: number; avgScore: number; achievedPct: number; }
interface QuarterRow { quarter: number; achieved: number; notAchieved: number; score: number; }
interface TrendRow { period?: string; label?: string; score?: number; value?: number; }
interface ExceptionRow { kpiName?: string; name?: string; owner?: string; department?: string; score?: number; status?: string; }
interface Overview {
  orgSummary: OrgSummary;
  quarterComparison: QuarterRow[];
  annualTrend: TrendRow[];
  exceptions: ExceptionRow[];
}

@Component({
  selector: 'app-ins-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <div class="page">
      <div class="page-header">
        <mat-icon class="page-icon">dashboard</mat-icon>
        <div class="header-text">
          <h2>Performance Dashboard</h2>
          <p class="sub">Performance Management System (SDBIP)</p>
        </div>
        <button mat-stroked-button (click)="load()" class="refresh-btn" [disabled]="loading()">
          <mat-icon>refresh</mat-icon> Refresh
        </button>
      </div>

      @if (loading()) {
        <div class="state">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Loading performance data…</p>
        </div>
      } @else if (error()) {
        <mat-card class="state-card error-card">
          <mat-card-content>
            <mat-icon class="big-icon error-icon">cloud_off</mat-icon>
            <h3>Performance service unavailable</h3>
            <p class="muted">{{ error() }}</p>
            <p class="muted small">API endpoint: {{ apiBase }}</p>
            <button mat-stroked-button (click)="load()">
              <mat-icon>refresh</mat-icon> Retry
            </button>
          </mat-card-content>
        </mat-card>
      } @else if (data(); as d) {
        <!-- KPI summary tiles -->
        <div class="kpi-grid">
          <mat-card class="kpi-card kpi-blue">
            <mat-card-content>
              <div class="kpi-icon"><mat-icon>flag</mat-icon></div>
              <div class="kpi-value">{{ d.orgSummary.totalKpis }}</div>
              <div class="kpi-label">Total KPIs</div>
            </mat-card-content>
          </mat-card>
          <mat-card class="kpi-card kpi-violet">
            <mat-card-content>
              <div class="kpi-icon"><mat-icon>trending_up</mat-icon></div>
              <div class="kpi-value">{{ formatNum(d.orgSummary.avgScore) }}</div>
              <div class="kpi-label">Average Score</div>
            </mat-card-content>
          </mat-card>
          <mat-card class="kpi-card" [class]="achievedClass(d.orgSummary.achievedPct)">
            <mat-card-content>
              <div class="kpi-icon"><mat-icon>verified</mat-icon></div>
              <div class="kpi-value">{{ formatNum(d.orgSummary.achievedPct) }}%</div>
              <div class="kpi-label">Achieved</div>
            </mat-card-content>
          </mat-card>
          <mat-card class="kpi-card kpi-amber">
            <mat-card-content>
              <div class="kpi-icon"><mat-icon>report_problem</mat-icon></div>
              <div class="kpi-value">{{ d.exceptions.length }}</div>
              <div class="kpi-label">Exceptions</div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Quarterly comparison -->
        <mat-card class="panel">
          <mat-card-content>
            <h3 class="panel-title"><mat-icon>bar_chart</mat-icon> Quarterly Performance</h3>
            @if (hasQuarterData()) {
              <div class="quarter-grid">
                @for (q of d.quarterComparison; track q.quarter) {
                  <div class="quarter">
                    <div class="quarter-label">Q{{ q.quarter }}</div>
                    <div class="bar-row">
                      <div class="bar-track">
                        <div class="bar-fill achieved" [style.width.%]="pctOf(q.achieved, q.achieved + q.notAchieved)"></div>
                      </div>
                      <span class="bar-num">{{ q.achieved }}/{{ q.achieved + q.notAchieved }}</span>
                    </div>
                    <div class="quarter-score">Score: <strong>{{ formatNum(q.score) }}</strong></div>
                  </div>
                }
              </div>
            } @else {
              <p class="empty"><mat-icon>info</mat-icon> No quarterly data captured yet.</p>
            }
          </mat-card-content>
        </mat-card>

        <!-- Annual trend -->
        @if (d.annualTrend.length > 0) {
          <mat-card class="panel">
            <mat-card-content>
              <h3 class="panel-title"><mat-icon>show_chart</mat-icon> Annual Trend</h3>
              <div class="trend-grid">
                @for (t of d.annualTrend; track $index) {
                  <div class="trend-cell">
                    <div class="trend-label">{{ t.period || t.label || ('P' + ($index + 1)) }}</div>
                    <div class="trend-value">{{ formatNum(t.score ?? t.value ?? 0) }}</div>
                  </div>
                }
              </div>
            </mat-card-content>
          </mat-card>
        }

        <!-- Exceptions -->
        <mat-card class="panel">
          <mat-card-content>
            <h3 class="panel-title"><mat-icon>warning</mat-icon> Exceptions</h3>
            @if (d.exceptions.length > 0) {
              <table class="exception-table">
                <thead>
                  <tr><th>KPI</th><th>Owner</th><th>Score</th><th>Status</th></tr>
                </thead>
                <tbody>
                  @for (e of d.exceptions; track $index) {
                    <tr>
                      <td>{{ e.kpiName || e.name || '—' }}</td>
                      <td>{{ e.owner || e.department || '—' }}</td>
                      <td>{{ e.score != null ? formatNum(e.score) : '—' }}</td>
                      <td><span class="status-pill" [class]="statusClass(e.status)">{{ e.status || 'Pending' }}</span></td>
                    </tr>
                  }
                </tbody>
              </table>
            } @else {
              <p class="empty success"><mat-icon>check_circle</mat-icon> No exceptions — all KPIs on track.</p>
            }
          </mat-card-content>
        </mat-card>

        <p class="footer-note">Connected to Insights API at <code>{{ apiBase }}</code> · Cycle <strong>{{ activeCycleLabel() }}</strong></p>
      }
    </div>
  `,
  styles: [`
    .page { padding: 1.5rem; max-width: 1400px; margin: 0 auto; }
    .page-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; }
    .page-icon { font-size: 32px; width: 32px; height: 32px; color: #311b92; }
    .header-text { flex: 1; }
    h2 { font-size: 1.4rem; font-weight: 700; margin: 0; color: #1e293b; }
    .sub { color: #64748b; font-size: 0.85rem; margin: 0; }
    .refresh-btn { white-space: nowrap; }

    .state { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 4rem; color: #64748b; }
    .state-card { max-width: 640px; margin: 0 auto; }
    .state-card mat-card-content { text-align: center; padding: 2.5rem 1.5rem; }
    .big-icon { font-size: 64px; width: 64px; height: 64px; opacity: .35; margin-bottom: 1rem; }
    .error-icon { color: #ef4444; }
    .error-card { border-left: 4px solid #ef4444; }

    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
    .kpi-card { border-radius: 12px; transition: transform .15s ease, box-shadow .15s ease; }
    .kpi-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,.08); }
    .kpi-card mat-card-content { padding: 1.25rem; position: relative; }
    .kpi-icon { position: absolute; top: 1rem; right: 1rem; opacity: .25; }
    .kpi-icon mat-icon { font-size: 36px; width: 36px; height: 36px; }
    .kpi-value { font-size: 2rem; font-weight: 700; line-height: 1; margin-bottom: .35rem; }
    .kpi-label { font-size: .8rem; text-transform: uppercase; letter-spacing: .05em; color: #64748b; font-weight: 600; }
    .kpi-blue { background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-left: 4px solid #3b82f6; }
    .kpi-blue .kpi-value, .kpi-blue .kpi-icon { color: #1d4ed8; }
    .kpi-violet { background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%); border-left: 4px solid #8b5cf6; }
    .kpi-violet .kpi-value, .kpi-violet .kpi-icon { color: #6d28d9; }
    .kpi-green { background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-left: 4px solid #10b981; }
    .kpi-green .kpi-value, .kpi-green .kpi-icon { color: #047857; }
    .kpi-amber { background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border-left: 4px solid #f59e0b; }
    .kpi-amber .kpi-value, .kpi-amber .kpi-icon { color: #b45309; }
    .kpi-red { background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border-left: 4px solid #ef4444; }
    .kpi-red .kpi-value, .kpi-red .kpi-icon { color: #b91c1c; }

    .panel { margin-bottom: 1rem; border-radius: 12px; }
    .panel-title { display: flex; align-items: center; gap: .5rem; margin: 0 0 1rem; font-size: 1.05rem; font-weight: 600; color: #1e293b; }
    .panel-title mat-icon { color: #6366f1; }

    .quarter-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; }
    .quarter { padding: .75rem; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
    .quarter-label { font-weight: 700; color: #1e293b; margin-bottom: .5rem; }
    .bar-row { display: flex; align-items: center; gap: .5rem; margin-bottom: .5rem; }
    .bar-track { flex: 1; height: 8px; background: #e2e8f0; border-radius: 999px; overflow: hidden; }
    .bar-fill { height: 100%; transition: width .4s ease; }
    .bar-fill.achieved { background: linear-gradient(90deg, #10b981, #34d399); }
    .bar-num { font-size: .8rem; color: #475569; font-weight: 600; min-width: 50px; text-align: right; }
    .quarter-score { font-size: .85rem; color: #64748b; }
    .quarter-score strong { color: #311b92; }

    .trend-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: .75rem; }
    .trend-cell { padding: .75rem; background: #f8fafc; border-radius: 8px; text-align: center; border: 1px solid #e2e8f0; }
    .trend-label { font-size: .75rem; color: #64748b; text-transform: uppercase; letter-spacing: .05em; margin-bottom: .25rem; }
    .trend-value { font-size: 1.25rem; font-weight: 700; color: #311b92; }

    .exception-table { width: 100%; border-collapse: collapse; }
    .exception-table th, .exception-table td { text-align: left; padding: .75rem; border-bottom: 1px solid #e2e8f0; font-size: .9rem; }
    .exception-table th { background: #f8fafc; color: #475569; font-weight: 600; text-transform: uppercase; font-size: .75rem; letter-spacing: .05em; }
    .exception-table tbody tr:hover { background: #f8fafc; }

    .status-pill { display: inline-block; padding: .15rem .6rem; border-radius: 999px; font-size: .75rem; font-weight: 600; background: #e2e8f0; color: #475569; }
    .status-pill.status-critical { background: #fee2e2; color: #b91c1c; }
    .status-pill.status-warning { background: #fef3c7; color: #b45309; }
    .status-pill.status-ok { background: #dcfce7; color: #047857; }

    .empty { display: flex; align-items: center; justify-content: center; gap: .5rem; padding: 2rem; color: #94a3b8; font-style: italic; }
    .empty.success { color: #10b981; font-style: normal; }

    .footer-note { text-align: center; color: #94a3b8; font-size: .8rem; margin-top: 1.5rem; }
    .footer-note code { background: #f1f5f9; padding: .15rem .4rem; border-radius: 4px; font-size: .8rem; }
    .muted { color: #64748b; }
    .small { font-size: .8rem; font-family: monospace; }
  `]
})
export class InsDashboardComponent implements OnInit {
  private http = inject(HttpClient);
  loading = signal(false);
  error = signal<string | null>(null);
  data = signal<Overview | null>(null);
  activeCycleLabel = signal<string>('—');
  apiBase = environment.apiPrefix + '/api';

  hasQuarterData = computed(() => {
    const d = this.data();
    if (!d) return false;
    return d.quarterComparison.some(q => (q.achieved + q.notAchieved) > 0 || q.score > 0);
  });

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.error.set(null);
    this.http.get<Array<{ id: number; status: string; financialYearLabel?: string }>>(`${this.apiBase}/cycles`).subscribe({
      next: (cycles) => {
        const active = cycles.find(c => c.status === 'Open') ?? cycles[0];
        if (!active) {
          this.error.set('No performance cycles configured.');
          this.loading.set(false);
          return;
        }
        this.activeCycleLabel.set(active.financialYearLabel || `#${active.id}`);
        this.http.get<Overview>(`${this.apiBase}/dashboards/overview`, { params: { cycleId: active.id } }).subscribe({
          next: (data) => { this.data.set(data); this.loading.set(false); },
          error: (err: HttpErrorResponse) => this.handleError(err)
        });
      },
      error: (err: HttpErrorResponse) => this.handleError(err)
    });
  }

  formatNum(n: number): string {
    if (n == null || isNaN(n)) return '0';
    return Number.isInteger(n) ? String(n) : n.toFixed(1);
  }

  pctOf(n: number, total: number): number {
    if (!total) return 0;
    return Math.max(0, Math.min(100, (n / total) * 100));
  }

  achievedClass(pct: number): string {
    if (pct >= 75) return 'kpi-green';
    if (pct >= 50) return 'kpi-amber';
    return 'kpi-red';
  }

  statusClass(s?: string): string {
    const v = (s || '').toLowerCase();
    if (v.includes('critical') || v.includes('fail')) return 'status-critical';
    if (v.includes('warn') || v.includes('risk')) return 'status-warning';
    if (v.includes('ok') || v.includes('achieved')) return 'status-ok';
    return '';
  }

  private handleError(err: HttpErrorResponse) {
    this.error.set(err.status === 0
      ? 'Cannot reach the Performance API. The service may be offline.'
      : `${err.status} ${err.statusText || 'Request failed'}`);
    this.loading.set(false);
  }
}
