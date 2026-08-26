import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, of, switchMap } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { CycleStore, PeriodStore } from './cycle-picker';

interface ExecInsights {
  totalKpis: number;
  capturedRecords: number;
  capturedKpis: number;
  notCaptured: number;
  avgScore: number;
  fullyAchieved: number;
  partiallyAchieved: number;
  notAchieved: number;
  withEvidence: number;
  openCorrectiveActions: number;
  agreementCount: number;
}

@Component({
  selector: 'app-ai-tab',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-container *ngIf="cycles.cycleId(); else pick">
      <div class="plat-card wrap">
        <div class="head">
          <h2><span class="material-symbols-rounded">analytics</span> Executive Performance Insights</h2>
          <p class="sub">Derived from {{ d()?.capturedRecords ?? 0 }} captured records across {{ d()?.totalKpis ?? 0 }} KPIs in the system</p>
        </div>

        <div class="grid" *ngIf="d() as v">
          <div class="card c-indigo">
            <div class="t"><span class="material-symbols-rounded">flag</span> Overall Narrative</div>
            <p>{{ overallNarrative(v) }}</p>
          </div>
          <div class="card c-green">
            <div class="t"><span class="material-symbols-rounded">check_circle</span> Key Achievements</div>
            <p>{{ keyAchievements(v) }}</p>
          </div>
          <div class="card c-amber">
            <div class="t"><span class="material-symbols-rounded">warning</span> Areas of Concern</div>
            <p>{{ areasOfConcern(v) }}</p>
          </div>
          <div class="card c-red">
            <div class="t"><span class="material-symbols-rounded">report</span> Service Delivery Risks</div>
            <p>{{ deliveryRisks(v) }}</p>
          </div>
          <div class="card c-purple">
            <div class="t"><span class="material-symbols-rounded">build_circle</span> Corrective Actions</div>
            <p>{{ correctiveActions(v) }}</p>
          </div>
          <div class="card c-blue">
            <div class="t"><span class="material-symbols-rounded">groups</span> IPMS Status</div>
            <p>{{ ipmsStatus(v) }}</p>
          </div>
        </div>
      </div>
    </ng-container>

    <ng-template #pick>
      <div class="plat-card empty-card">
        <span class="material-symbols-rounded big-icon">analytics</span>
        <p>Select a performance cycle to view insights</p>
      </div>
    </ng-template>
  `,
  styles: [`
    :host { display:block; }
    .wrap { padding:18px 20px; }
    .head h2 { font-size:16px; font-weight:700; margin:0; display:flex; align-items:center; gap:8px; color:#0f172a; }
    .head h2 .material-symbols-rounded { font-size:20px; color:#475569; }
    .sub { color:var(--plat-muted); font-size:12px; margin:4px 0 16px; }
    .grid { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; }
    @media (max-width: 1100px) { .grid { grid-template-columns:repeat(2,1fr); } }
    @media (max-width: 720px) { .grid { grid-template-columns:1fr; } }
    .card { border-radius:10px; padding:14px 16px; border:1px solid; font-size:13px; }
    .card p { margin:8px 0 0; line-height:1.55; color:#334155; }
    .t { display:flex; align-items:center; gap:6px; font-weight:700; font-size:12.5px; color:#0f172a; }
    .t .material-symbols-rounded { font-size:17px; }
    .c-indigo { background:#eef2ff; border-color:#c7d2fe; }
    .c-indigo .t .material-symbols-rounded { color:#4f46e5; }
    .c-green { background:#f0fdf4; border-color:#bbf7d0; }
    .c-green .t .material-symbols-rounded { color:#16a34a; }
    .c-amber { background:#fffbeb; border-color:#fde68a; }
    .c-amber .t .material-symbols-rounded { color:#d97706; }
    .c-red { background:#fef2f2; border-color:#fecaca; }
    .c-red .t .material-symbols-rounded { color:#dc2626; }
    .c-purple { background:#faf5ff; border-color:#e9d5ff; }
    .c-purple .t .material-symbols-rounded { color:#9333ea; }
    .c-blue { background:#eff6ff; border-color:#bfdbfe; }
    .c-blue .t .material-symbols-rounded { color:#2563eb; }
    .empty-card { padding:48px; text-align:center; color:var(--plat-muted); }
    .big-icon { font-size:48px; display:block; margin:0 auto 12px; color:#cbd5e1; }
  `],
})
export class AiTabComponent {
  private readonly api = inject(ApiService);
  readonly cycles = inject(CycleStore);
  readonly periods = inject(PeriodStore);

  private readonly cycleObs = toObservable(computed(() => ({ cycleId: this.cycles.cycleId(), period: this.periods.period() })));

  readonly d = toSignal<ExecInsights | null>(
    this.cycleObs.pipe(
      switchMap(({ cycleId, period }) => {
        if (!cycleId) return of(null);
        const params: Record<string, string | number> = { cycleId };
        if (period) params['period'] = period;
        return this.api.get<ExecInsights>('/dashboards/executive-insights', params).pipe(catchError(() => of(null)));
      }),
    ),
    { initialValue: null },
  );

  private plural(n: number, one: string, many: string): string {
    return n === 1 ? one : many;
  }

  overallNarrative(v: ExecInsights): string {
    const level = v.avgScore >= 80 ? 'strong' : v.avgScore >= 50 ? 'moderate' : 'low';
    const pct = v.totalKpis > 0 ? Math.round((v.capturedKpis / v.totalKpis) * 100) : 0;
    return `Organisational performance stands at ${v.avgScore}%, which is ${level}. ` +
      `${pct}% of KPIs (${v.capturedKpis} of ${v.totalKpis}) have been captured for the current reporting period. ` +
      `${v.notCaptured} ${this.plural(v.notCaptured, 'KPI is', 'KPIs are')} yet to be reported.`;
  }

  keyAchievements(v: ExecInsights): string {
    const first = v.fullyAchieved > 0
      ? `${v.fullyAchieved} ${this.plural(v.fullyAchieved, 'KPI has', 'KPIs have')} been fully achieved (100% score).`
      : 'No KPIs have been fully achieved yet.';
    const second = v.capturedKpis > 0
      ? ` ${v.withEvidence} of ${v.capturedKpis} applicable KPIs have evidence documentation attached.`
      : '';
    return first + second;
  }

  areasOfConcern(v: ExecInsights): string {
    if (v.capturedKpis === 0) return 'No actuals have been captured yet, so performance concerns cannot be assessed.';
    const parts: string[] = [];
    if (v.partiallyAchieved > 0 || v.notAchieved > 0) {
      const seg: string[] = [];
      if (v.partiallyAchieved > 0) seg.push(`${v.partiallyAchieved} ${this.plural(v.partiallyAchieved, 'KPI is', 'KPIs are')} partially achieved`);
      if (v.notAchieved > 0) seg.push(v.partiallyAchieved > 0 ? `${v.notAchieved} ${this.plural(v.notAchieved, 'is', 'are')} not achieved` : `${v.notAchieved} ${this.plural(v.notAchieved, 'KPI is', 'KPIs are')} not achieved`);
      parts.push(seg.join(' and ') + '.');
    } else {
      parts.push('No underperforming KPIs identified.');
    }
    const missing = v.capturedKpis - v.withEvidence;
    parts.push(missing <= 0
      ? 'All captured KPIs have evidence attached.'
      : `${missing} captured ${this.plural(missing, 'KPI is', 'KPIs are')} missing evidence.`);
    return parts.join(' ');
  }

  deliveryRisks(v: ExecInsights): string {
    if (v.notCaptured === 0) return 'All KPIs are captured. Reporting completeness risk is low.';
    const pct = v.totalKpis > 0 ? Math.round((v.notCaptured / v.totalKpis) * 100) : 0;
    const level = pct >= 50 ? 'high' : pct >= 20 ? 'moderate' : 'low';
    return `${v.notCaptured} ${this.plural(v.notCaptured, 'KPI has', 'KPIs have')} not been captured yet. Reporting completeness risk is ${level}.`;
  }

  correctiveActions(v: ExecInsights): string {
    if (v.openCorrectiveActions === 0) return 'No corrective actions currently required — all records are up to date.';
    return `${v.openCorrectiveActions} corrective ${this.plural(v.openCorrectiveActions, 'action is', 'actions are')} open and ${this.plural(v.openCorrectiveActions, 'requires', 'require')} attention.`;
  }

  ipmsStatus(v: ExecInsights): string {
    if (v.agreementCount === 0) {
      return 'Individual Performance Management data has not yet been captured. Performance agreements should be created and linked to employees.';
    }
    return `${v.agreementCount} performance ${this.plural(v.agreementCount, 'agreement is', 'agreements are')} in place and linked to employees.`;
  }
}
