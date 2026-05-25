import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, of, switchMap } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { CycleStore } from './cycle-picker';

interface Exception { kpiNumber: string; description: string; issue: string; }
interface QtrCmp { quarter: number; achieved: number; notAchieved: number; }
interface OverviewData {
  orgSummary?: { totalKpis?: number; avgScore?: number; achievedPct?: number; };
  quarterComparison?: QtrCmp[];
  exceptions?: Exception[];
}

@Component({
  selector: 'app-overview-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bar">
      <div>
        <h2>Overview Dashboard</h2>
        <p>Organisational summary and quarterly comparison</p>
      </div>
      <select [ngModel]="cycles.cycleId()" (ngModelChange)="cycles.setCycle($event)">
        <option *ngFor="let c of cycles.cycles()" [ngValue]="c.id">{{ c.financialYearLabel }}</option>
      </select>
    </div>

    <ng-container *ngIf="cycles.cycleId(); else pick">
      <div class="kpis">
        <div class="plat-card center"><span class="material-symbols-rounded big-icon blue">track_changes</span><div class="muted">Total KPIs</div><div class="big">{{ data()?.orgSummary?.totalKpis ?? 0 }}</div></div>
        <div class="plat-card center"><span class="material-symbols-rounded big-icon green">trending_up</span><div class="muted">Average Score</div><div class="big">{{ (data()?.orgSummary?.avgScore ?? 0) | number:'1.1-1' }}%</div></div>
        <div class="plat-card center"><span class="material-symbols-rounded big-icon gold">trending_up</span><div class="muted">Achievement Rate</div><div class="big">{{ (data()?.orgSummary?.achievedPct ?? 0) | number:'1.1-1' }}%</div></div>
      </div>

      <div class="plat-card panelp">
        <h3>Quarterly Comparison</h3>
        <div class="bars" *ngIf="(data()?.quarterComparison?.length ?? 0) > 0; else noQ">
          <div class="qcol" *ngFor="let q of data()?.quarterComparison">
            <div class="qstack">
              <div class="qfill green" [style.height.%]="pct(q.achieved)" [title]="'Achieved: ' + q.achieved"></div>
              <div class="qfill red" [style.height.%]="pct(q.notAchieved)" [title]="'Not achieved: ' + q.notAchieved"></div>
            </div>
            <div class="qlabel">Q{{ q.quarter }}</div>
          </div>
        </div>
        <ng-template #noQ><p class="empty">No quarterly data</p></ng-template>
        <div class="legend"><span><span class="dot green"></span>Achieved</span><span><span class="dot red"></span>Not Achieved</span></div>
      </div>

      <div class="plat-card panelp">
        <h3><span class="material-symbols-rounded amber">warning</span> Exceptions Requiring Attention</h3>
        <div *ngIf="(data()?.exceptions?.length ?? 0) > 0; else noExc" class="exc">
          <div class="exc__row" *ngFor="let e of data()?.exceptions">
            <div><b>{{ e.kpiNumber }}</b> <span class="muted2">{{ e.description }}</span></div>
            <span class="badge b-red">{{ e.issue }}</span>
          </div>
        </div>
        <ng-template #noExc><p class="empty">No exceptions</p></ng-template>
      </div>
    </ng-container>

    <ng-template #pick><p class="empty">Select a performance cycle to view overview</p></ng-template>
  `,
  styles: [`
    :host { display:block; }
    .bar { display:flex; justify-content:space-between; align-items:flex-start; gap:16px; margin-bottom:18px; }
    .bar h2 { font-size:22px; font-weight:700; margin:0; }
    .bar p { color: var(--plat-muted); margin:4px 0 0; }
    .bar select { padding:8px 10px; border:1px solid var(--plat-border); border-radius:8px; background:#fff; }
    .kpis { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:18px; }
    .center { text-align:center; padding:24px; }
    .big-icon { font-size:32px; margin-bottom:8px; }
    .blue { color:#3b82f6; } .green { color:#16a34a; } .gold { color:#c9a84c; } .amber { color:#d97706; } .red { color:#dc2626; }
    .muted { color:var(--plat-muted); font-size:12px; text-transform:uppercase; font-weight:600; letter-spacing:.04em; }
    .muted2 { color:var(--plat-muted); }
    .big { font-size:28px; font-weight:700; margin-top:4px; }
    .panelp { padding:18px; margin-bottom:18px; }
    .panelp h3 { margin:0 0 12px; font-size:15px; font-weight:600; display:flex; align-items:center; gap:8px; }
    .bars { display:flex; align-items:flex-end; justify-content:space-around; height:240px; gap:24px; padding:0 12px; }
    .qcol { display:flex; flex-direction:column; align-items:center; gap:6px; flex:1; height:100%; }
    .qstack { width:56px; height:100%; display:flex; flex-direction:column-reverse; background:#f1f5f9; border-radius:4px; overflow:hidden; }
    .qfill.green { background:#4caf50; } .qfill.red { background:#ef5350; }
    .qlabel { font-size:12px; color:var(--plat-muted); }
    .legend { display:flex; gap:16px; justify-content:center; margin-top:8px; font-size:12px; color:var(--plat-muted); }
    .dot { display:inline-block; width:10px; height:10px; border-radius:2px; margin-right:6px; vertical-align:middle; }
    .dot.green { background:#4caf50; } .dot.red { background:#ef5350; }
    .exc { display:flex; flex-direction:column; gap:8px; }
    .exc__row { display:flex; justify-content:space-between; align-items:center; padding:10px 12px; background:#fffbeb; border:1px solid #fde68a; border-radius:8px; font-size:13px; }
    .badge { display:inline-block; padding:2px 10px; border-radius:999px; font-size:11px; font-weight:600; }
    .b-red { background:#fecaca; color:#991b1b; }
    .empty { text-align:center; color:var(--plat-muted); padding:24px; }
  `],
})
export class OverviewTabComponent {
  private readonly api = inject(ApiService);
  readonly cycles = inject(CycleStore);

  readonly data = toSignal<OverviewData | null>(
    toObservable(this.cycles.cycleId).pipe(
      switchMap((cid) => {
        if (!cid) return of(null);
        return this.api.get<OverviewData>('/dashboards/overview', { cycleId: cid })
          .pipe(catchError(() => of(null)));
      }),
    ),
    { initialValue: null },
  );

  readonly maxTotal = computed(() => {
    const list = this.data()?.quarterComparison ?? [];
    return Math.max(1, ...list.map((q) => (q.achieved || 0) + (q.notAchieved || 0)));
  });

  pct(n: number): number {
    return Math.round(((n || 0) / this.maxTotal()) * 100);
  }
}
