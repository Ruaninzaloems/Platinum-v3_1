import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { catchError, finalize, of, tap } from 'rxjs';
import { ApiService } from '@ins-core/services/api.service';
import { ToastService } from '@ins-core/services/toast.service';
import { PageHeaderComponent } from '@ins-shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '@ins-shared/components/loading-spinner/loading-spinner.component';

interface RatingThreshold {
  id: number;
  level: number;
  label: string;
  descriptor: string;
  minPct: number | null;
  maxPct: number | null;
}

const DOT_COLORS: Record<number, string> = { 5: '#22c55e', 4: '#22c55e', 3: '#3b82f6', 2: '#f59e0b', 1: '#ef4444' };

@Component({
  selector: 'app-kpi-scoring',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, PageHeaderComponent, LoadingSpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="plat-page">
      <app-page-header title="KPI Scoring &amp; Rating Thresholds" subtitle="OPMS scoring formula and the 5-point rating scale used for quarterly performance reporting." icon="calculate" tone="indigo"></app-page-header>

      <div class="plat-card">
        <h3 class="panel-title"><mat-icon class="inline">functions</mat-icon> KPI Scoring Formula</h3>
        <p class="panel-sub">Read-only — National Treasury prescribed OPMS methodology.</p>

        <div class="formula-box">
          <p class="formula-label">Performance Score per KPI</p>
          <div class="formula">Score (%) = (Actual &divide; Target) &times; 100</div>
          <p class="formula-note">Calculated per KPI per quarter. Raw score is stored; traffic lights apply the rating band thresholds configured below.</p>
        </div>

        <div class="lights">
          <div class="light">
            <span class="dot" style="background:#22c55e"></span>
            <div><div class="light-title">On / Over Target</div><div class="light-sub">Score &ge; 100%</div></div>
          </div>
          <div class="light">
            <span class="dot" style="background:#f59e0b"></span>
            <div><div class="light-title">At Risk</div><div class="light-sub">Score 50-99%</div></div>
          </div>
          <div class="light">
            <span class="dot" style="background:#ef4444"></span>
            <div><div class="light-title">Off Target</div><div class="light-sub">Score &lt; 50%</div></div>
          </div>
        </div>
      </div>

      <div class="plat-card">
        <div class="head-row">
          <div>
            <h3 class="panel-title"><mat-icon class="inline">leaderboard</mat-icon> KPI Rating Thresholds</h3>
            <p class="panel-sub">Map KPI percentage scores to the 5-point rating scale for quarterly performance reporting.</p>
          </div>
          <div class="head-actions">
            <button mat-button (click)="reset()" [disabled]="saving() || loading()"><mat-icon>restart_alt</mat-icon> Reset</button>
            <button mat-flat-button color="primary" (click)="save()" [disabled]="saving() || loading()">
              <mat-icon>save</mat-icon> {{ saving() ? 'Saving…' : 'Save' }}
            </button>
          </div>
        </div>

        <app-loading-spinner *ngIf="loading()"></app-loading-spinner>
        <table *ngIf="!loading()" class="plat-table">
          <thead>
            <tr>
              <th class="num">Rating</th><th>Level</th><th>Descriptor</th>
              <th class="pct">Min (%)</th><th class="pct">Max (%)</th><th>Band</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let r of rows(); trackBy: trackLevel">
              <td class="num"><strong>{{ r.level }}</strong></td>
              <td><strong>{{ r.label }}</strong></td>
              <td class="muted">{{ r.descriptor }}</td>
              <td class="pct">
                <input *ngIf="r.level !== 1" class="pct-input" type="number" [(ngModel)]="r.minPct" />
                <span *ngIf="r.level === 1" class="muted">&mdash;</span>
              </td>
              <td class="pct">
                <input *ngIf="r.level !== 5" class="pct-input" type="number" [(ngModel)]="r.maxPct" />
                <span *ngIf="r.level === 5" class="muted">&mdash;</span>
              </td>
              <td>
                <span class="band"><span class="dot sm" [style.background]="dot(r.level)"></span>{{ bandText(r) }}</span>
              </td>
            </tr>
          </tbody>
        </table>
        <p class="footnote"><mat-icon class="fn-icon">info</mat-icon> National Treasury default: 5&ge;151%, 4=111-150%, 3=100-110%, 2=50-99%, 1&le;50%</p>
      </div>
    </section>
  `,
  styles: [`
    .plat-page { max-width: 1100px; gap: 10px; }
    .plat-card { padding: 12px 14px; }
    .panel-title { display: flex; align-items: center; gap: 6px; margin: 0; font-size: 13.5px; font-weight: 700; color: #0f172a; }
    .panel-title .inline { font-size: 16px; width: 16px; height: 16px; color: #2563eb; }
    .panel-sub { margin: 2px 0 0; font-size: 11px; color: #64748b; }
    .formula-box { border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px; margin-top: 10px; }
    .formula-label { margin: 0 0 5px; font-size: 11px; font-weight: 700; color: #334155; }
    .formula { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px; text-align: center; font-family: monospace; font-size: 13px; font-weight: 600; color: #1d4ed8; }
    .formula-note { margin: 5px 0 0; font-size: 10.5px; color: #94a3b8; }
    .lights { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 8px; }
    @media (max-width: 800px) { .lights { grid-template-columns: 1fr; } }
    .light { display: flex; align-items: center; gap: 8px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px 10px; }
    .dot { width: 9px; height: 9px; border-radius: 50%; flex: 0 0 auto; }
    .dot.sm { width: 7px; height: 7px; }
    .light-title { font-size: 12px; font-weight: 700; color: #0f172a; }
    .light-sub { font-size: 11px; color: #64748b; }
    .head-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 8px; }
    .head-actions { display: flex; gap: 6px; align-items: center; flex: 0 0 auto; }
    .head-actions button { font-size: 12.5px; height: 32px; }
    .plat-table { font-size: 12.5px; width: 100%; }
    .plat-table th { padding: 5px 10px; font-size: 10.5px; }
    .plat-table td { padding: 4px 10px; }
    .num { width: 60px; }
    .pct { width: 100px; }
    .pct-input { width: 80px; box-sizing: border-box; border: 1px solid #cbd5e1; border-radius: 6px; padding: 4px 7px; font-size: 12.5px; font-family: inherit; }
    .band { display: inline-flex; align-items: center; gap: 5px; font-size: 11.5px; font-weight: 600; color: #334155; }
    .muted { color: #64748b; }
    .footnote { display: flex; align-items: center; gap: 5px; margin: 8px 0 0; font-size: 10.5px; color: #94a3b8; }
    .fn-icon { font-size: 13px; width: 13px; height: 13px; }
    :host ::ng-deep app-page-header .page-header { padding: 9px 14px; border-radius: 10px; }
    :host ::ng-deep app-page-header .page-header__icon { width: 30px; height: 30px; }
    :host ::ng-deep app-page-header .page-header__icon mat-icon { font-size: 17px; width: 17px; height: 17px; }
    :host ::ng-deep app-page-header h1 { font-size: 15px; }
    :host ::ng-deep app-page-header p { font-size: 12px; margin-top: 1px; }
  `],
})
export class KpiScoringComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);

  loading = signal(true);
  saving = signal(false);
  rows = signal<RatingThreshold[]>([]);

  ngOnInit() { this.load(); }

  trackLevel(_: number, r: RatingThreshold) { return r.level; }
  dot(level: number): string { return DOT_COLORS[level] ?? '#94a3b8'; }

  bandText(r: RatingThreshold): string {
    if (r.minPct != null && r.maxPct != null) return `${r.minPct}-${r.maxPct}%`;
    if (r.minPct != null) return `\u2265 ${r.minPct}%`;
    if (r.maxPct != null) return `< ${r.maxPct + 1}%`;
    return '—';
  }

  load() {
    this.loading.set(true);
    this.api.get<RatingThreshold[]>('/kpi-rating-thresholds').pipe(
      tap((d) => this.rows.set(Array.isArray(d) ? d : [])),
      catchError((e) => { this.toast.error('Failed to load thresholds', e?.error?.message ?? e?.message); this.rows.set([]); return of(null); }),
      finalize(() => this.loading.set(false)),
    ).subscribe();
  }

  save() {
    const thresholds = this.rows().map((r) => ({
      level: r.level,
      label: r.label,
      descriptor: r.descriptor,
      minPct: r.minPct === null || (r.minPct as unknown) === '' ? null : Number(r.minPct),
      maxPct: r.maxPct === null || (r.maxPct as unknown) === '' ? null : Number(r.maxPct),
    }));
    for (const t of thresholds) {
      if (t.minPct !== null && t.maxPct !== null && t.minPct > t.maxPct) {
        this.toast.error(`Level ${t.level}: Min (%) cannot exceed Max (%)`);
        return;
      }
    }
    this.saving.set(true);
    this.api.put<RatingThreshold[]>('/kpi-rating-thresholds', { thresholds }).pipe(
      tap((d) => { this.rows.set(Array.isArray(d) ? d : []); this.toast.success('Rating thresholds saved'); }),
      catchError((e) => { this.toast.error('Save failed', e?.error?.message ?? e?.message); return of(null); }),
      finalize(() => this.saving.set(false)),
    ).subscribe();
  }

  reset() {
    this.saving.set(true);
    this.api.post<RatingThreshold[]>('/kpi-rating-thresholds/reset', {}).pipe(
      tap((d) => { this.rows.set(Array.isArray(d) ? d : []); this.toast.success('Reset to National Treasury defaults'); }),
      catchError((e) => { this.toast.error('Reset failed', e?.error?.message ?? e?.message); return of(null); }),
      finalize(() => this.saving.set(false)),
    ).subscribe();
  }
}
