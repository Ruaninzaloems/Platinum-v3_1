import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, of, switchMap } from 'rxjs';
import { ApiService } from '@ins-core/services/api.service';
import { PageHeaderComponent } from '@ins-shared/components/page-header/page-header.component';
import { CycleStore } from '../dashboard/tabs/cycle-picker';

interface ReferenceMilestone { key: string; title: string; dueDate: string; }
interface ReferenceRow { label: string; value: string; milestones: ReferenceMilestone[]; }
interface ReferenceData { financialYearLabel: string | null; rows: ReferenceRow[]; }

@Component({
  selector: 'app-sdbip-compliance',
  standalone: true,
  imports: [CommonModule, MatIconModule, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="plat-page">
      <app-page-header title="SDBIP Compliance Reference"
        subtitle="Read-only — MFMA legislative requirements for OPMS."
        icon="description" tone="indigo"></app-page-header>

      <div class="plat-card ref-card" *ngIf="data() as d">
        <div class="ref-head" *ngIf="d.financialYearLabel">
          <mat-icon class="ref-ic">event</mat-icon>
          <p class="muted xs m0">Statutory due dates shown for {{ d.financialYearLabel }} — the same dates as the dashboard milestones.</p>
        </div>
        <div class="ref-grid">
          <div class="ref-row" *ngFor="let r of d.rows">
            <span class="ref-label">{{ r.label }}</span>
            <span class="ref-value">
              {{ r.value }}
              <span class="ref-dates" *ngIf="r.milestones.length">
                <span class="date-chip" *ngFor="let m of r.milestones" [title]="m.title">
                  <mat-icon class="chip-ic">event</mat-icon>{{ m.dueDate | date:'dd MMM yyyy' }}
                </span>
              </span>
            </span>
          </div>
        </div>
      </div>
      <p class="empty" *ngIf="!data()">Unable to load the compliance reference. Please try again.</p>
    </section>
  `,
  styles: [`
    .ref-card { margin-top: 12px; padding: 0; overflow: hidden; }
    .ref-head { display: flex; align-items: center; gap: 6px; padding: 8px 14px; border-bottom: 1px solid var(--plat-border); background: #f8fafc; }
    .ref-ic { color: #4f46e5; font-size: 15px; width: 15px; height: 15px; }
    .ref-grid { display: grid; grid-template-columns: 1fr 1fr; }
    .ref-row { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; padding: 6px 14px; border-bottom: 1px solid #f1f5f9; }
    .ref-label { font-size: 11.5px; color: #64748b; white-space: nowrap; }
    .ref-value { font-size: 12px; font-weight: 600; color: #0f172a; text-align: right; }
    .ref-dates { display: inline-flex; flex-wrap: wrap; gap: 3px; margin-left: 6px; vertical-align: middle; }
    .date-chip { display: inline-flex; align-items: center; gap: 3px; background: #eef2ff; color: #4338ca; border-radius: 999px; padding: 0 7px; font-size: 10px; font-weight: 700; white-space: nowrap; }
    .chip-ic { font-size: 11px; width: 11px; height: 11px; }
    .muted { color: #64748b; } .xs { font-size: 11px; } .m0 { margin: 0; }
    .empty { text-align: center; color: #64748b; padding: 24px; font-size: 13px; }
    @media (max-width: 900px) { .ref-grid { grid-template-columns: 1fr; } }
  `],
})
export class SdbipComplianceComponent {
  private readonly api = inject(ApiService);
  private readonly cycles = inject(CycleStore);

  readonly data = toSignal<ReferenceData | null>(
    toObservable(this.cycles.cycleId).pipe(
      switchMap(cycleId =>
        this.api.get<ReferenceData>('/dashboards/sdbip-compliance-reference', cycleId ? { cycleId } : undefined)
          .pipe(catchError(() => of(null))),
      ),
    ),
    { initialValue: null },
  );

  readonly hasData = computed(() => (this.data()?.rows?.length ?? 0) > 0);
}
