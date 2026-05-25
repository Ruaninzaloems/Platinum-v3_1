import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, of, switchMap } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { CycleStore } from './cycle-picker';

interface Dept { departmentId: number; departmentName: string; }
interface HeatRow { kpiNumber: string; description: string; q1Status?: string; q2Status?: string; q3Status?: string; q4Status?: string; }
interface TrendPoint { quarter: number; score: number; }
interface DeptData {
  overallScore?: number; evidenceCompleteness?: number;
  delayedActivities?: number; unresolvedConstraints?: number;
  kpiHeatmap?: HeatRow[]; quarterTrend?: TrendPoint[];
}

@Component({
  selector: 'app-department-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bar">
      <div class="bar__title">
        <h2>Department Dashboard</h2>
        <p>Departmental performance overview</p>
      </div>
      <div class="bar__ctrl">
        <select [ngModel]="cycles.cycleId()" (ngModelChange)="cycles.setCycle($event)">
          <option *ngFor="let c of cycles.cycles()" [ngValue]="c.id">{{ c.financialYearLabel }}</option>
        </select>
        <select [ngModel]="deptId()" (ngModelChange)="deptId.set($event)">
          <option [ngValue]="null">Select Department</option>
          <option *ngFor="let d of departments()" [ngValue]="d.departmentId">{{ d.departmentName }}</option>
        </select>
      </div>
    </div>

    <ng-container *ngIf="cycles.cycleId() && deptId(); else picker">
      <div class="kpis">
        <div class="plat-card kpi center"><div class="muted">Overall Score</div><div class="big">{{ (data()?.overallScore ?? 0) | number:'1.1-1' }}%</div></div>
        <div class="plat-card kpi"><span class="material-symbols-rounded blue">description</span><div><div class="muted">Evidence</div><b>{{ (data()?.evidenceCompleteness ?? 0) | number:'1.0-0' }}%</b></div></div>
        <div class="plat-card kpi"><span class="material-symbols-rounded amber">schedule</span><div><div class="muted">Delayed Activities</div><b>{{ data()?.delayedActivities ?? 0 }}</b></div></div>
        <div class="plat-card kpi"><span class="material-symbols-rounded red">warning</span><div><div class="muted">Constraints</div><b>{{ data()?.unresolvedConstraints ?? 0 }}</b></div></div>
      </div>

      <div class="plat-card panelp">
        <h3>KPI Heatmap by Quarter</h3>
        <table class="tbl" *ngIf="(data()?.kpiHeatmap?.length ?? 0) > 0; else noHeat">
          <thead><tr><th>KPI</th><th>Description</th><th class="c">Q1</th><th class="c">Q2</th><th class="c">Q3</th><th class="c">Q4</th></tr></thead>
          <tbody>
            <tr *ngFor="let k of data()?.kpiHeatmap">
              <td><b>{{ k.kpiNumber }}</b></td>
              <td class="trunc">{{ k.description }}</td>
              <td class="c"><span class="badge" [ngClass]="cls(k.q1Status)">{{ k.q1Status || 'N/A' }}</span></td>
              <td class="c"><span class="badge" [ngClass]="cls(k.q2Status)">{{ k.q2Status || 'N/A' }}</span></td>
              <td class="c"><span class="badge" [ngClass]="cls(k.q3Status)">{{ k.q3Status || 'N/A' }}</span></td>
              <td class="c"><span class="badge" [ngClass]="cls(k.q4Status)">{{ k.q4Status || 'N/A' }}</span></td>
            </tr>
          </tbody>
        </table>
        <ng-template #noHeat><p class="empty">No KPI data</p></ng-template>
      </div>

      <div class="plat-card panelp">
        <h3>Quarter-on-Quarter Trend</h3>
        <div class="bars" *ngIf="(data()?.quarterTrend?.length ?? 0) > 0; else noTrend">
          <div class="bar2" *ngFor="let p of data()?.quarterTrend">
            <div class="bar2__stack"><div class="bar2__fill" [style.height.%]="p.score"></div></div>
            <div class="bar2__l">Q{{ p.quarter }}</div>
            <div class="bar2__v">{{ p.score | number:'1.1-1' }}%</div>
          </div>
        </div>
        <ng-template #noTrend><p class="empty">No trend data</p></ng-template>
      </div>
    </ng-container>

    <ng-template #picker><p class="empty">Select a cycle and department to view dashboard</p></ng-template>
  `,
  styles: [`
    :host { display:block; }
    .bar { display:flex; justify-content:space-between; align-items:flex-start; gap:16px; margin-bottom:18px; }
    .bar h2 { font-size:22px; font-weight:700; margin:0; }
    .bar p { color: var(--plat-muted); margin:4px 0 0; }
    .bar__ctrl { display:flex; gap:10px; }
    .bar__ctrl select { padding:8px 10px; border:1px solid var(--plat-border); border-radius:8px; background:#fff; }
    .kpis { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:18px; }
    .kpi { display:flex; align-items:center; gap:12px; padding:18px; }
    .kpi.center { flex-direction:column; text-align:center; gap:4px; }
    .big { font-size:32px; font-weight:700; color:#0f2b46; }
    .muted { color:var(--plat-muted); font-size:12px; text-transform:uppercase; font-weight:600; letter-spacing:.04em; }
    .blue { color:#3b82f6; } .amber { color:#d97706; } .red { color:#dc2626; }
    .kpi b { font-size:18px; }
    .panelp { padding:18px; margin-bottom:18px; }
    .panelp h3 { margin:0 0 12px; font-size:15px; font-weight:600; }
    .tbl { width:100%; border-collapse:collapse; font-size:13px; }
    .tbl th, .tbl td { padding:8px 10px; border-bottom:1px solid var(--plat-border); text-align:left; }
    .tbl th { font-size:11px; color:var(--plat-muted); text-transform:uppercase; }
    .tbl .c { text-align:center; }
    .trunc { max-width:280px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:#475569; }
    .badge { display:inline-block; padding:2px 8px; border-radius:999px; font-size:11px; font-weight:600; }
    .b-ach { background:#bbf7d0; color:#166534; }
    .b-not { background:#fecaca; color:#991b1b; }
    .b-risk { background:#fde68a; color:#92400e; }
    .b-na { background:#f1f5f9; color:#64748b; }
    .empty { text-align:center; color:var(--plat-muted); padding:24px; }
    .bars { display:flex; align-items:flex-end; justify-content:space-around; height:240px; gap:24px; padding:0 12px; }
    .bar2 { display:flex; flex-direction:column; align-items:center; gap:6px; flex:1; height:100%; }
    .bar2__stack { width:56px; height:100%; display:flex; align-items:flex-end; background:#f1f5f9; border-radius:4px; overflow:hidden; }
    .bar2__fill { width:100%; background:#0f2b46; }
    .bar2__l { font-size:12px; color:var(--plat-muted); }
    .bar2__v { font-size:12px; font-weight:600; }
  `],
})
export class DepartmentTabComponent {
  private readonly api = inject(ApiService);
  readonly cycles = inject(CycleStore);
  readonly deptId = signal<number | null>(null);

  private readonly cycleObs = toObservable(this.cycles.cycleId);
  readonly departments = toSignal(
    this.cycleObs.pipe(
      switchMap((cid) => {
        if (!cid) return of<Dept[]>([]);
        return this.api.get<Dept[]>('/dept-scorecards', { cycleId: cid })
          .pipe(catchError(() => of<Dept[]>([])));
      }),
    ),
    { initialValue: [] as Dept[] },
  );

  private readonly params = computed(() => ({ cycleId: this.cycles.cycleId(), deptId: this.deptId() }));

  readonly data = toSignal<DeptData | null>(
    toObservable(this.params).pipe(
      switchMap(({ cycleId, deptId }) => {
        if (!cycleId || !deptId) return of(null);
        return this.api.get<DeptData>(`/dashboards/department/${deptId}`, { cycleId })
          .pipe(catchError(() => of(null)));
      }),
    ),
    { initialValue: null },
  );

  cls(status?: string): string {
    switch (status) {
      case 'Achieved': return 'b-ach';
      case 'Not Achieved': return 'b-not';
      case 'At Risk': return 'b-risk';
      default: return 'b-na';
    }
  }
}
