import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, of, switchMap } from 'rxjs';
import { ApiService } from '@ins-core/services/api.service';
import { CycleStore } from './cycle-picker';
import { QuarterlyTrendComponent } from './quarterly-trend.component';

interface TrendQuarter {
  quarter: number;
  achievementRate: number;
  achieved: number;
  notAchieved: number;
  total: number;
  periodChange: number;
  score: number | null;
  target: number;
}
interface TrendData { quarters?: TrendQuarter[]; totalKpis?: number; }

@Component({
  selector: 'app-trend-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, QuarterlyTrendComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bar">
      <div>
        <h2>Performance Trend</h2>
        <p>Quarter-on-quarter KPI achievement</p>
      </div>
    </div>

    <ng-container *ngIf="cycles.cycleId(); else pick">
      <app-quarterly-trend [quarters]="quarters()" [cycleLabel]="cycleLabel()"></app-quarterly-trend>

      <div class="plat-card panelp">
        <h3>Achievement Rate by Quarter</h3>
        <div class="bars" *ngIf="hasData(); else noData">
          <div class="qcol" *ngFor="let q of quarters()">
            <div class="qval">{{ q.achievementRate | number:'1.0-1' }}%</div>
            <div class="qstack">
              <div class="qfill" [style.height.%]="q.achievementRate"></div>
            </div>
            <div class="qlabel">Q{{ q.quarter }}</div>
            <div class="qchange" *ngIf="q.periodChange !== 0"
                 [class.up]="q.periodChange > 0" [class.down]="q.periodChange < 0">
              <span class="material-symbols-rounded">{{ q.periodChange > 0 ? 'trending_up' : 'trending_down' }}</span>
              {{ q.periodChange > 0 ? '+' : '' }}{{ q.periodChange | number:'1.0-1' }}%
            </div>
          </div>
        </div>
        <ng-template #noData><p class="empty">No performance data captured yet</p></ng-template>
      </div>

      <div class="plat-card panelp" *ngIf="hasData()">
        <h3>Quarterly Detail</h3>
        <table class="tbl">
          <thead><tr><th>Quarter</th><th class="r">Achieved</th><th class="r">Not Achieved</th><th class="r">Reported</th><th class="r">Achievement Rate</th><th class="r">Change</th></tr></thead>
          <tbody>
            <tr *ngFor="let q of quarters()">
              <td><b>Q{{ q.quarter }}</b></td>
              <td class="r green">{{ q.achieved }}</td>
              <td class="r red">{{ q.notAchieved }}</td>
              <td class="r">{{ q.total }}</td>
              <td class="r"><b>{{ q.achievementRate | number:'1.0-1' }}%</b></td>
              <td class="r" [class.green]="q.periodChange > 0" [class.red]="q.periodChange < 0">
                {{ q.periodChange > 0 ? '+' : '' }}{{ q.periodChange | number:'1.0-1' }}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </ng-container>

    <ng-template #pick><p class="empty">Select a performance cycle to view the trend</p></ng-template>
  `,
  styles: [`
    :host { display:block; }
    .bar { display:flex; justify-content:space-between; align-items:flex-start; gap:16px; margin-bottom:18px; }
    .bar h2 { font-size:22px; font-weight:700; margin:0; }
    .bar p { color: var(--plat-muted); margin:4px 0 0; }
    .bar select { padding:8px 10px; border:1px solid var(--plat-border); border-radius:8px; background:#fff; }
    .panelp { padding:18px; margin-bottom:18px; }
    .panelp h3 { margin:0 0 12px; font-size:15px; font-weight:600; }
    .bars { display:flex; align-items:flex-end; justify-content:space-around; height:260px; gap:24px; padding:0 12px; }
    .qcol { display:flex; flex-direction:column; align-items:center; gap:6px; flex:1; height:100%; }
    .qval { font-size:13px; font-weight:600; }
    .qstack { width:56px; flex:1; display:flex; align-items:flex-end; background:#f1f5f9; border-radius:4px; overflow:hidden; }
    .qfill { width:100%; background:#0f2b46; }
    .qlabel { font-size:12px; color:var(--plat-muted); }
    .qchange { font-size:11px; font-weight:600; display:flex; align-items:center; gap:2px; }
    .qchange .material-symbols-rounded { font-size:14px; }
    .qchange.up { color:#16a34a; } .qchange.down { color:#dc2626; }
    .tbl { width:100%; border-collapse:collapse; font-size:13px; }
    .tbl th, .tbl td { padding:8px 10px; border-bottom:1px solid var(--plat-border); text-align:left; }
    .tbl th { font-size:11px; color:var(--plat-muted); text-transform:uppercase; }
    .tbl .r { text-align:right; }
    .green { color:#16a34a; } .red { color:#dc2626; }
    .empty { text-align:center; color:var(--plat-muted); padding:24px; }
  `],
})
export class TrendTabComponent {
  private readonly api = inject(ApiService);
  readonly cycles = inject(CycleStore);

  readonly data = toSignal<TrendData | null>(
    toObservable(this.cycles.cycleId).pipe(
      switchMap((cid) => {
        if (!cid) return of(null);
        // The trend graph always shows the full annual picture, regardless of the selected period.
        return this.api.get<TrendData>('/dashboards/trendline', { cycleId: cid, period: 'annual' })
          .pipe(catchError(() => of(null)));
      }),
    ),
    { initialValue: null },
  );

  readonly quarters = computed(() => this.data()?.quarters ?? []);
  readonly cycleLabel = computed(() => {
    const cid = this.cycles.cycleId();
    return this.cycles.cycles().find(c => c.id === cid)?.financialYearLabel ?? '';
  });
  readonly hasData = computed(() => this.quarters().some((q) => q.total > 0));
}
