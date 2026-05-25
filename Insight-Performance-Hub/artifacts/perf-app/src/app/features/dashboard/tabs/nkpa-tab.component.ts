import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, of, switchMap } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { CycleStore } from './cycle-picker';

interface NkpaRow {
  nkpaName: string; nkpaWeight: number;
  totalKpis: number; achievedKpis: number;
  achievementRate: number; weightedScore: number;
}
interface DeptRow { departmentName: string; achievementRate: number; }
interface NkpaData { byNkpa?: NkpaRow[]; byDepartment?: DeptRow[]; }

@Component({
  selector: 'app-nkpa-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bar">
      <div>
        <h2>NKPA Performance</h2>
        <p>Performance breakdown by NKPA category and department</p>
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

    <ng-container *ngIf="cycles.cycleId(); else pick">
      <div class="plat-card panelp">
        <h3>Performance by NKPA Category</h3>
        <div class="grouped" *ngIf="(data()?.byNkpa?.length ?? 0) > 0; else noN">
          <div class="ggrp" *ngFor="let n of data()?.byNkpa">
            <div class="ggrp__label">{{ n.nkpaName }}</div>
            <div class="ggrp__pair">
              <div class="gbar"><div class="gbar__fill green" [style.height.%]="n.achievementRate"></div></div>
              <div class="gbar"><div class="gbar__fill navy" [style.height.%]="n.weightedScore"></div></div>
            </div>
            <div class="ggrp__vals"><span class="green">{{ n.achievementRate }}%</span> · <span class="navy">{{ n.weightedScore }}%</span></div>
          </div>
        </div>
        <ng-template #noN><p class="empty">No NKPA data available</p></ng-template>
        <div class="legend"><span><span class="dot green"></span>Achievement %</span><span><span class="dot navy"></span>Weighted Score %</span></div>
      </div>

      <div class="plat-card panelp">
        <h3>NKPA Details</h3>
        <table class="tbl" *ngIf="(data()?.byNkpa?.length ?? 0) > 0; else noN2">
          <thead><tr><th>NKPA</th><th class="r">Weight</th><th class="r">Total KPIs</th><th class="r">Achieved</th><th class="r">Achievement %</th><th class="r">Weighted Score</th></tr></thead>
          <tbody>
            <tr *ngFor="let n of data()?.byNkpa">
              <td><b>{{ n.nkpaName }}</b></td>
              <td class="r">{{ n.nkpaWeight }}%</td>
              <td class="r">{{ n.totalKpis }}</td>
              <td class="r">{{ n.achievedKpis }}</td>
              <td class="r green"><b>{{ n.achievementRate }}%</b></td>
              <td class="r"><b>{{ n.weightedScore }}%</b></td>
            </tr>
          </tbody>
        </table>
        <ng-template #noN2><p class="empty">No data</p></ng-template>
      </div>

      <div class="plat-card panelp">
        <h3>Department Breakdown</h3>
        <div class="hbars" *ngIf="(data()?.byDepartment?.length ?? 0) > 0; else noD">
          <div class="hbar" *ngFor="let d of data()?.byDepartment">
            <div class="hbar__name">{{ d.departmentName }}</div>
            <div class="hbar__track"><div class="hbar__fill navy" [style.width.%]="d.achievementRate"></div></div>
            <div class="hbar__val">{{ d.achievementRate }}%</div>
          </div>
        </div>
        <ng-template #noD><p class="empty">No department data</p></ng-template>
      </div>
    </ng-container>

    <ng-template #pick><p class="empty">Select a performance cycle to view NKPA performance</p></ng-template>
  `,
  styles: [`
    :host { display:block; }
    .bar { display:flex; justify-content:space-between; align-items:flex-start; gap:16px; margin-bottom:18px; }
    .bar h2 { font-size:22px; font-weight:700; margin:0; }
    .bar p { color: var(--plat-muted); margin:4px 0 0; }
    .bar__ctrl { display:flex; gap:10px; }
    .bar__ctrl select { padding:8px 10px; border:1px solid var(--plat-border); border-radius:8px; background:#fff; }
    .panelp { padding:18px; margin-bottom:18px; }
    .panelp h3 { margin:0 0 12px; font-size:15px; font-weight:600; }
    .grouped { display:flex; align-items:flex-end; gap:20px; height:260px; padding:0 12px; }
    .ggrp { flex:1; display:flex; flex-direction:column; align-items:center; gap:6px; height:100%; }
    .ggrp__pair { display:flex; gap:6px; align-items:flex-end; height:100%; width:100%; justify-content:center; }
    .gbar { width:28px; height:100%; background:#f1f5f9; border-radius:4px; overflow:hidden; display:flex; align-items:flex-end; }
    .gbar__fill { width:100%; }
    .gbar__fill.green { background:#4caf50; }
    .gbar__fill.navy { background:#0f2b46; }
    .ggrp__label { font-size:11px; color:var(--plat-muted); text-align:center; }
    .ggrp__vals { font-size:11px; }
    .green { color:#16a34a; } .navy { color:#0f2b46; }
    .legend { display:flex; gap:16px; justify-content:center; margin-top:8px; font-size:12px; color:var(--plat-muted); }
    .dot { display:inline-block; width:10px; height:10px; border-radius:2px; margin-right:6px; vertical-align:middle; }
    .dot.green { background:#4caf50; } .dot.navy { background:#0f2b46; }
    .tbl { width:100%; border-collapse:collapse; font-size:13px; }
    .tbl th, .tbl td { padding:8px 10px; border-bottom:1px solid var(--plat-border); text-align:left; }
    .tbl th { font-size:11px; color:var(--plat-muted); text-transform:uppercase; }
    .tbl .r { text-align:right; }
    .hbars { display:flex; flex-direction:column; gap:8px; }
    .hbar { display:grid; grid-template-columns:180px 1fr 60px; gap:10px; align-items:center; font-size:13px; }
    .hbar__track { height:18px; background:#f1f5f9; border-radius:4px; overflow:hidden; }
    .hbar__fill { height:100%; }
    .hbar__fill.navy { background:#0f2b46; }
    .hbar__val { text-align:right; font-weight:600; }
    .empty { text-align:center; color:var(--plat-muted); padding:24px; }
  `],
})
export class NkpaTabComponent {
  private readonly api = inject(ApiService);
  readonly cycles = inject(CycleStore);
  readonly quarter = signal<number | null>(null);

  private readonly params = computed(() => ({ cycleId: this.cycles.cycleId(), quarter: this.quarter() }));

  readonly data = toSignal<NkpaData | null>(
    toObservable(this.params).pipe(
      switchMap(({ cycleId, quarter }) => {
        if (!cycleId) return of(null);
        return this.api.get<NkpaData>('/dashboards/nkpa-performance', {
          cycleId, ...(quarter ? { quarter } : {}),
        }).pipe(catchError(() => of(null)));
      }),
    ),
    { initialValue: null },
  );
}
