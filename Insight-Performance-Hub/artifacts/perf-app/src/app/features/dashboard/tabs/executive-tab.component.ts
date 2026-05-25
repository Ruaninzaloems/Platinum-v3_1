import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, of, switchMap } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { CycleStore } from './cycle-picker';

interface UnderperformingKpi {
  kpiNumber: string; description: string;
  targetValue: number | string; actualValue: number | string;
  variance?: number;
}
interface DeptScore { departmentName: string; score: number; }
interface ExecData {
  totalKpis?: number; achieved?: number; notAchieved?: number; atRisk?: number; onHold?: number;
  weightedPerformance?: number;
  overdueSubmissions?: number; unresolvedCorrectiveActions?: number;
  evidenceOutstanding?: number; budgetRiskKpis?: number;
  topUnderperforming?: UnderperformingKpi[];
  departmentScores?: DeptScore[];
}

@Component({
  selector: 'app-executive-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bar">
      <div class="bar__title">
        <h2>Executive Dashboard</h2>
        <p>Performance overview for leadership and oversight</p>
      </div>
      <div class="bar__ctrl">
        <select [ngModel]="cycles.cycleId()" (ngModelChange)="cycles.setCycle($event)">
          <option *ngFor="let c of cycles.cycles()" [ngValue]="c.id">{{ c.financialYearLabel }}</option>
        </select>
        <select [ngModel]="quarter()" (ngModelChange)="quarter.set($event)">
          <option [ngValue]="null">All Quarters</option>
          <option *ngFor="let q of [1,2,3,4]" [ngValue]="q">Q{{ q }}</option>
        </select>
      </div>
    </div>

    <ng-container *ngIf="cycles.cycleId(); else pickCycle">
      <div class="kpis">
        <div class="kpi plat-card"><div class="kpi__icon i-blue"><span class="material-symbols-rounded">track_changes</span></div><div><div class="kpi__l">Total KPIs</div><div class="kpi__v">{{ data()?.totalKpis ?? 0 }}</div></div></div>
        <div class="kpi plat-card"><div class="kpi__icon i-green"><span class="material-symbols-rounded">check_circle</span></div><div><div class="kpi__l">Achieved</div><div class="kpi__v">{{ data()?.achieved ?? 0 }}</div></div></div>
        <div class="kpi plat-card"><div class="kpi__icon i-red"><span class="material-symbols-rounded">cancel</span></div><div><div class="kpi__l">Not Achieved</div><div class="kpi__v">{{ data()?.notAchieved ?? 0 }}</div></div></div>
        <div class="kpi plat-card"><div class="kpi__icon i-amber"><span class="material-symbols-rounded">warning</span></div><div><div class="kpi__l">At Risk</div><div class="kpi__v">{{ data()?.atRisk ?? 0 }}</div></div></div>
        <div class="kpi plat-card"><div class="kpi__icon i-gray"><span class="material-symbols-rounded">pause_circle</span></div><div><div class="kpi__l">On Hold</div><div class="kpi__v">{{ data()?.onHold ?? 0 }}</div></div></div>
      </div>

      <div class="row">
        <div class="plat-card panel">
          <h3>Weighted Performance</h3>
          <div class="big" [style.color]="perfColor()">{{ (data()?.weightedPerformance ?? 0).toFixed(1) }}%</div>
          <div class="muted">Overall Achievement</div>
        </div>
        <div class="plat-card panel">
          <h3>KPI Status Distribution</h3>
          <div class="legend">
            <div><span class="dot" style="background:#4caf50"></span>Achieved <b>{{ data()?.achieved ?? 0 }}</b></div>
            <div><span class="dot" style="background:#ef5350"></span>Not Achieved <b>{{ data()?.notAchieved ?? 0 }}</b></div>
            <div><span class="dot" style="background:#f59e0b"></span>At Risk <b>{{ data()?.atRisk ?? 0 }}</b></div>
            <div><span class="dot" style="background:#94a3b8"></span>On Hold <b>{{ data()?.onHold ?? 0 }}</b></div>
          </div>
        </div>
      </div>

      <div class="metrics">
        <div class="plat-card metric"><span class="material-symbols-rounded">schedule</span><div><div class="muted">Overdue Submissions</div><b>{{ data()?.overdueSubmissions ?? 0 }}</b></div></div>
        <div class="plat-card metric"><span class="material-symbols-rounded">shield</span><div><div class="muted">Unresolved Actions</div><b>{{ data()?.unresolvedCorrectiveActions ?? 0 }}</b></div></div>
        <div class="plat-card metric"><span class="material-symbols-rounded">description</span><div><div class="muted">Evidence Outstanding</div><b>{{ data()?.evidenceOutstanding ?? 0 }}</b></div></div>
        <div class="plat-card metric"><span class="material-symbols-rounded">attach_money</span><div><div class="muted">Budget Risk KPIs</div><b>{{ data()?.budgetRiskKpis ?? 0 }}</b></div></div>
      </div>

      <div class="plat-card panelp">
        <h3 class="panel__title">Top 10 Underperforming KPIs</h3>
        <table class="tbl" *ngIf="(data()?.topUnderperforming?.length ?? 0) > 0; else noUnder">
          <thead><tr><th>KPI</th><th>Description</th><th class="r">Target</th><th class="r">Actual</th><th class="r">Variance</th></tr></thead>
          <tbody>
            <tr *ngFor="let k of data()?.topUnderperforming">
              <td><b>{{ k.kpiNumber }}</b></td><td>{{ k.description }}</td>
              <td class="r">{{ k.targetValue }}</td><td class="r">{{ k.actualValue }}</td>
              <td class="r red">{{ k.variance?.toFixed(1) }}%</td>
            </tr>
          </tbody>
        </table>
        <ng-template #noUnder><p class="empty">No underperforming KPIs</p></ng-template>
      </div>

      <div class="plat-card panelp" *ngIf="(data()?.departmentScores?.length ?? 0) > 0">
        <h3 class="panel__title">Department League Table</h3>
        <div class="hbars">
          <div class="hbar" *ngFor="let d of data()?.departmentScores">
            <div class="hbar__name">{{ d.departmentName }}</div>
            <div class="hbar__track"><div class="hbar__fill" [style.width.%]="d.score"></div></div>
            <div class="hbar__val">{{ d.score | number:'1.1-1' }}%</div>
          </div>
        </div>
      </div>
    </ng-container>

    <ng-template #pickCycle><p class="empty">Select a performance cycle to view dashboard</p></ng-template>
  `,
  styles: [`
    :host { display:block; }
    .bar { display:flex; justify-content:space-between; align-items:flex-start; gap:16px; margin-bottom:18px; }
    .bar h2 { font-size:22px; font-weight:700; margin:0; }
    .bar p { color: var(--plat-muted); margin:4px 0 0; }
    .bar__ctrl { display:flex; gap:10px; }
    .bar__ctrl select { padding:8px 10px; border:1px solid var(--plat-border); border-radius:8px; background:#fff; }
    .kpis { display:grid; grid-template-columns:repeat(5,1fr); gap:12px; margin-bottom:18px; }
    .kpi { display:flex; gap:12px; align-items:center; padding:16px; }
    .kpi__icon { width:40px; height:40px; border-radius:10px; display:grid; place-items:center; }
    .i-blue{background:#eff6ff;color:#2563eb}.i-green{background:#ecfdf5;color:#16a34a}.i-red{background:#fef2f2;color:#dc2626}.i-amber{background:#fffbeb;color:#d97706}.i-gray{background:#f1f5f9;color:#64748b}
    .kpi__l { font-size:11px; color:var(--plat-muted); text-transform:uppercase; letter-spacing:.04em; font-weight:600; }
    .kpi__v { font-size:22px; font-weight:700; }
    .row { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:18px; }
    .panel { padding:20px; text-align:center; }
    .panel h3, .panel__title { margin:0 0 12px; font-size:15px; font-weight:600; }
    .panelp { padding:20px; margin-bottom:18px; }
    .big { font-size:48px; font-weight:700; }
    .muted { color:var(--plat-muted); font-size:13px; }
    .legend { display:grid; grid-template-columns:1fr 1fr; gap:10px; text-align:left; }
    .legend > div { display:flex; align-items:center; gap:8px; font-size:13px; }
    .dot { width:10px; height:10px; border-radius:2px; display:inline-block; }
    .metrics { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:18px; }
    .metric { display:flex; gap:12px; align-items:center; padding:14px; }
    .metric span.material-symbols-rounded { color:#94a3b8; }
    .metric b { font-size:18px; }
    .tbl { width:100%; border-collapse:collapse; font-size:13px; }
    .tbl th, .tbl td { padding:8px 10px; border-bottom:1px solid var(--plat-border); text-align:left; }
    .tbl th { font-size:11px; color:var(--plat-muted); text-transform:uppercase; }
    .tbl .r { text-align:right; }
    .red { color:#dc2626; }
    .empty { text-align:center; color:var(--plat-muted); padding:24px; }
    .hbars { display:flex; flex-direction:column; gap:8px; }
    .hbar { display:grid; grid-template-columns:180px 1fr 60px; gap:10px; align-items:center; font-size:13px; }
    .hbar__track { height:18px; background:#f1f5f9; border-radius:4px; overflow:hidden; }
    .hbar__fill { height:100%; background:#0f2b46; }
    .hbar__val { text-align:right; font-weight:600; }
  `],
})
export class ExecutiveTabComponent {
  private readonly api = inject(ApiService);
  readonly cycles = inject(CycleStore);
  readonly quarter = signal<number | null>(null);

  private readonly params = computed(() => ({ cycleId: this.cycles.cycleId(), quarter: this.quarter() }));

  readonly data = toSignal<ExecData | null>(
    toObservable(this.params).pipe(
      switchMap(({ cycleId, quarter }) => {
        if (!cycleId) return of(null);
        return this.api.get<ExecData>('/dashboards/executive', {
          cycleId, ...(quarter ? { quarter } : {}),
        }).pipe(catchError(() => of(null)));
      }),
    ),
    { initialValue: null },
  );

  readonly perfColor = computed(() => {
    const v = this.data()?.weightedPerformance ?? 0;
    return v >= 70 ? '#16a34a' : v >= 50 ? '#d97706' : '#dc2626';
  });
}
