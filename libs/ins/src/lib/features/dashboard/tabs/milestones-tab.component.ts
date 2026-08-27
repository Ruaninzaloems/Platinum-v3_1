import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, of, switchMap } from 'rxjs';
import { ApiService } from '@ins-core/services/api.service';
import { CycleStore } from './cycle-picker';

interface MfmaMilestone {
  key: string; title: string; description: string; icon: string;
  dueDate: string; daysRemaining: number; status: string;
}
interface MfmaCalendarData {
  financialYearLabel?: string;
  items?: MfmaMilestone[];
}

@Component({
  selector: 'app-milestones-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bar">
      <div class="ctrl">
      </div>
    </div>

    <ng-container *ngIf="cycles.cycleId(); else pick">
      <div class="plat-card mfma" *ngIf="mfmaItems().length > 0">
        <div class="mfma-head">
          <span class="material-symbols-rounded ring">schedule</span>
          <div>
            <h3>Upcoming Milestones</h3>
            <p>Key performance and compliance deadlines</p>
          </div>
        </div>
        <table class="tbl mfma-tbl">
          <thead><tr><th>Milestone</th><th>Due Date</th><th>Days Remaining</th></tr></thead>
          <tbody>
            <tr *ngFor="let m of mfmaItems()">
              <td>
                <div class="ms">
                  <span class="dot" [style.background]="dotColor(m.daysRemaining)"></span>
                  <span class="material-symbols-rounded ms-ic">{{ m.icon }}</span>
                  <div>
                    <div class="ms-title">{{ m.title }}</div>
                    <div class="ms-sub">{{ m.description }}</div>
                  </div>
                </div>
              </td>
              <td class="due">
                <span class="material-symbols-rounded cal-ic">calendar_today</span>
                <span>
                  <div class="due-date">{{ m.dueDate | date:'yyyy-MM-dd' }}</div>
                  <div class="due-day">{{ m.dueDate | date:'EEEE' }}</div>
                </span>
              </td>
              <td>
                <span class="days" [ngClass]="daysCls(m.daysRemaining)">
                  {{ m.daysRemaining < 0 ? (-m.daysRemaining) + ' days ago' : m.daysRemaining + ' days' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </ng-container>

    <ng-template #pick><p class="empty">Select a performance cycle to view milestones</p></ng-template>
  `,
  styles: [`
    :host { display:block; }
    .bar { display:flex; justify-content:flex-end; align-items:flex-start; gap:16px; margin-bottom:18px; }
    .ctrl { display:flex; gap:10px; }
    .ctrl select { padding:8px 10px; border:1px solid var(--plat-border); border-radius:8px; background:#fff; }
    .tbl { width:100%; border-collapse:collapse; font-size:13px; }
    .tbl th, .tbl td { padding:8px 10px; border-bottom:1px solid var(--plat-border); text-align:left; }
    .tbl th { font-size:11px; color:var(--plat-muted); text-transform:uppercase; }
    .empty { text-align:center; color:var(--plat-muted); padding:24px; }
    .mfma { padding:0; margin-bottom:18px; overflow:hidden; }
    .mfma-head { display:flex; align-items:center; gap:12px; padding:16px 18px; border-bottom:1px solid var(--plat-border); }
    .mfma-head .ring { font-size:20px; color:#2563eb; background:#eff6ff; border-radius:999px; padding:6px; }
    .mfma-head h3 { margin:0; font-size:15px; font-weight:600; }
    .mfma-head p { margin:2px 0 0; font-size:12px; color:var(--plat-muted); }
    .mfma-tbl { margin:0; }
    .mfma-tbl th { padding:10px 18px; }
    .mfma-tbl td { padding:12px 18px; vertical-align:middle; }
    .ms { display:flex; align-items:center; gap:10px; }
    .dot { width:7px; height:7px; border-radius:999px; flex-shrink:0; }
    .ms-ic { font-size:18px; color:#2563eb; }
    .ms-title { font-weight:600; font-size:13px; }
    .ms-sub { font-size:12px; color:var(--plat-muted); margin-top:1px; }
    .due { white-space:nowrap; }
    .due .cal-ic { font-size:15px; color:#94a3b8; vertical-align:top; margin-right:6px; }
    .due > span:last-child { display:inline-block; }
    .due-date { font-size:13px; font-weight:600; }
    .due-day { font-size:11px; color:var(--plat-muted); }
    .days { display:inline-block; padding:3px 10px; border-radius:999px; font-size:11px; font-weight:700; white-space:nowrap; }
    .d-over { background:#fecaca; color:#991b1b; }
    .d-soon { background:#ffedd5; color:#c2410c; }
    .d-mid { background:#dbeafe; color:#1d4ed8; }
    .d-far { background:#f3e8ff; color:#7e22ce; }
    .d-vfar { background:#dcfce7; color:#15803d; }
  `],
})
export class MilestonesTabComponent {
  private readonly api = inject(ApiService);
  readonly cycles = inject(CycleStore);

  readonly mfmaData = toSignal<MfmaCalendarData | null>(
    toObservable(this.cycles.cycleId).pipe(
      switchMap(cycleId => {
        if (!cycleId) return of(null);
        return this.api.get<MfmaCalendarData>('/dashboards/mfma-calendar', { cycleId })
          .pipe(catchError(() => of(null)));
      }),
    ),
    { initialValue: null },
  );

  readonly mfmaItems = computed(() => {
    const items = this.mfmaData()?.items ?? [];
    // Show upcoming milestones plus anything elapsed within the last 60 days
    return items.filter(m => m.daysRemaining >= -60);
  });

  dotColor(days: number): string {
    if (days < 0) return '#dc2626';
    if (days <= 30) return '#f97316';
    if (days <= 60) return '#3b82f6';
    if (days <= 120) return '#a855f7';
    return '#10b981';
  }

  daysCls(days: number): string {
    if (days < 0) return 'd-over';
    if (days <= 30) return 'd-soon';
    if (days <= 60) return 'd-mid';
    if (days <= 120) return 'd-far';
    return 'd-vfar';
  }
}
