import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { catchError, finalize, of, tap } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { ToastService } from '@core/services/toast.service';
import { ConfirmService } from '@core/services/confirm.service';
import { Cycle, Scorecard, ScorecardKpi, KpiQuarterTarget, KpiMonthActivity } from '@core/models/domain.model';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';

const MONTH_NAMES: Record<number, string> = {
  1: 'Jan', 2: 'Feb', 3: 'Mar', 4: 'Apr', 5: 'May', 6: 'Jun',
  7: 'Jul', 8: 'Aug', 9: 'Sep', 10: 'Oct', 11: 'Nov', 12: 'Dec',
};
const QUARTER_MONTHS: Record<number, number[]> = {
  1: [7, 8, 9], 2: [10, 11, 12], 3: [1, 2, 3], 4: [4, 5, 6],
};

@Component({
  selector: 'app-quarter-targets-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule],
  template: `
    <h2 mat-dialog-title>Quarterly Targets</h2>
    <mat-dialog-content class="content">
      <mat-form-field *ngFor="let q of [1,2,3,4]" appearance="outline">
        <mat-label>Q{{ q }} Target</mat-label>
        <input matInput [(ngModel)]="targets['q' + q]" placeholder="Target value" />
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" (click)="ref.close(targets)"><mat-icon>save</mat-icon> Save Targets</button>
    </mat-dialog-actions>
  `,
  styles: [`.content { min-width: 460px; padding-top: 12px !important; display: flex; flex-direction: column; gap: 6px; } mat-form-field { width: 100%; }`],
})
export class QuarterTargetsDialogComponent {
  targets: Record<string, string>;
  constructor(public ref: MatDialogRef<QuarterTargetsDialogComponent, Record<string, string> | null>) {
    this.targets = { q1: '', q2: '', q3: '', q4: '' };
  }
}

@Component({
  selector: 'app-new-activity-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <h2 mat-dialog-title>Add Monthly Activity</h2>
    <mat-dialog-content class="content">
      <mat-form-field appearance="outline">
        <mat-label>Month</mat-label>
        <mat-select [(ngModel)]="form.month">
          <mat-option *ngFor="let m of months" [value]="m">{{ monthName(m) }} (Month {{ m }})</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Activity Description *</mat-label>
        <textarea matInput rows="3" [(ngModel)]="form.description"></textarea>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Due Date</mat-label>
        <input matInput type="date" [(ngModel)]="form.dueDate" />
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" [disabled]="!form.description.trim()" (click)="ref.close(form)">Create</button>
    </mat-dialog-actions>
  `,
  styles: [`.content { min-width: 460px; padding-top: 12px !important; display: flex; flex-direction: column; gap: 6px; } mat-form-field { width: 100%; }`],
})
export class NewActivityDialogComponent {
  months: number[] = [];
  form: { month: number; description: string; dueDate: string } = { month: 7, description: '', dueDate: '' };
  constructor(public ref: MatDialogRef<NewActivityDialogComponent, { month: number; description: string; dueDate: string } | null>) {}
  monthName(m: number): string { return MONTH_NAMES[m] ?? String(m); }
}

@Component({
  selector: 'app-quarterly-targets',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatCheckboxModule, MatDialogModule,
    PageHeaderComponent, LoadingSpinnerComponent, StatusBadgeComponent, EmptyStateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './quarterly-targets.component.html',
  styleUrls: ['./quarterly-targets.component.scss'],
})
export class QuarterlyTargetsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly dialog = inject(MatDialog);

  loading = signal(true);
  cycles = signal<Cycle[]>([]);
  scorecards = signal<Scorecard[]>([]);
  kpis = signal<ScorecardKpi[]>([]);
  targets = signal<KpiQuarterTarget[]>([]);
  activities = signal<KpiMonthActivity[]>([]);

  selectedCycleId = signal<number | null>(null);
  selectedScorecardId = signal<number | null>(null);
  selectedKpiId = signal<number | null>(null);
  selectedQuarter = signal(1);

  effectiveCycleId = computed<number | null>(() => this.selectedCycleId() ?? this.cycles()[0]?.id ?? null);
  selectedKpi = computed<ScorecardKpi | null>(() => this.kpis().find((k) => k.id === this.selectedKpiId()) ?? null);

  ngOnInit() {
    this.api.get<Cycle[]>('/cycles').pipe(
      catchError(() => of([] as Cycle[])),
      tap((c) => this.cycles.set(Array.isArray(c) ? c : [])),
    ).subscribe(() => this.loadScorecards());
  }

  loadScorecards() {
    const cycleId = this.effectiveCycleId();
    if (!cycleId) { this.scorecards.set([]); this.loading.set(false); return; }
    this.loading.set(true);
    this.api.get<Scorecard[]>('/scorecards', { cycleId }).pipe(
      catchError(() => of([] as Scorecard[])),
      tap((r) => this.scorecards.set(Array.isArray(r) ? r : [])),
      finalize(() => this.loading.set(false)),
    ).subscribe();
  }

  selectCycle(id: number) {
    this.selectedCycleId.set(id);
    this.selectedScorecardId.set(null); this.selectedKpiId.set(null);
    this.kpis.set([]); this.targets.set([]); this.activities.set([]);
    this.loadScorecards();
  }

  selectScorecard(id: number) {
    this.selectedScorecardId.set(id);
    this.selectedKpiId.set(null);
    this.kpis.set([]); this.targets.set([]); this.activities.set([]);
    this.api.get<ScorecardKpi[]>(`/scorecards/${id}/kpis`).pipe(
      catchError(() => of([] as ScorecardKpi[])),
      tap((r) => this.kpis.set(Array.isArray(r) ? r : [])),
    ).subscribe();
  }

  selectKpi(id: number) {
    this.selectedKpiId.set(id);
    this.selectedQuarter.set(1);
    this.loadTargets();
    this.loadActivities();
  }

  selectQuarter(q: number) { this.selectedQuarter.set(q); this.loadActivities(); }

  loadTargets() {
    const id = this.selectedKpiId(); if (!id) return;
    this.api.get<KpiQuarterTarget[]>(`/scorecard-kpis/${id}/quarter-targets`).pipe(
      catchError(() => of([] as KpiQuarterTarget[])),
      tap((r) => this.targets.set(Array.isArray(r) ? r : [])),
    ).subscribe();
  }

  loadActivities() {
    const id = this.selectedKpiId(); if (!id) return;
    this.api.get<KpiMonthActivity[]>(`/scorecard-kpis/${id}/month-activities`, { quarter: this.selectedQuarter() }).pipe(
      catchError(() => of([] as KpiMonthActivity[])),
      tap((r) => this.activities.set(Array.isArray(r) ? r : [])),
    ).subscribe();
  }

  openTargetDialog() {
    const id = this.selectedKpiId(); if (!id) return;
    const ref = this.dialog.open(QuarterTargetsDialogComponent, { panelClass: 'plat-dialog' });
    const inst = ref.componentInstance;
    const byQ: Record<number, string> = {};
    this.targets().forEach((t) => (byQ[t.quarter] = t.targetValue));
    inst.targets = { q1: byQ[1] ?? '', q2: byQ[2] ?? '', q3: byQ[3] ?? '', q4: byQ[4] ?? '' };
    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      const payload = [1, 2, 3, 4]
        .map((q) => ({ quarter: q, targetValue: result[`q${q}`] }))
        .filter((t) => t.targetValue);
      this.api.put(`/scorecard-kpis/${id}/quarter-targets`, { targets: payload }).pipe(
        tap(() => { this.toast.success('Quarterly targets saved'); this.loadTargets(); }),
        catchError((e) => { this.toast.error('Save failed', e?.error?.message); return of(null); }),
      ).subscribe();
    });
  }

  openNewActivityDialog() {
    const id = this.selectedKpiId(); if (!id) return;
    const months = QUARTER_MONTHS[this.selectedQuarter()] ?? [];
    const ref = this.dialog.open(NewActivityDialogComponent, { panelClass: 'plat-dialog' });
    const inst = ref.componentInstance;
    inst.months = months;
    inst.form = { month: months[0] ?? 7, description: '', dueDate: '' };
    ref.afterClosed().subscribe((form) => {
      if (!form) return;
      this.api.post(`/scorecard-kpis/${id}/month-activities`, {
        quarter: this.selectedQuarter(),
        month: form.month,
        description: form.description,
        dueDate: form.dueDate || new Date().toISOString().split('T')[0],
      }).pipe(
        tap(() => { this.toast.success('Activity created'); this.loadActivities(); }),
        catchError(() => { this.toast.error('Error creating activity'); return of(null); }),
      ).subscribe();
    });
  }

  toggleComplete(a: KpiMonthActivity) {
    const next = a.status === 'Completed' ? 'Pending' : 'Completed';
    this.api.patch(`/month-activities/${a.id}`, { status: next }).pipe(
      tap(() => this.loadActivities()),
      catchError(() => { this.toast.error('Error'); return of(null); }),
    ).subscribe();
  }

  async deleteActivity(a: KpiMonthActivity) {
    const ok = await this.confirm.confirm({ title: 'Delete activity', message: 'Delete this activity?', destructive: true, confirmLabel: 'Delete' });
    if (!ok) return;
    this.api.delete(`/month-activities/${a.id}`).pipe(
      tap(() => { this.toast.success('Activity deleted'); this.loadActivities(); }),
      catchError(() => { this.toast.error('Error'); return of(null); }),
    ).subscribe();
  }

  monthName(m: number): string { return MONTH_NAMES[m] ?? String(m); }
  targetForQuarter(q: number): KpiQuarterTarget | undefined { return this.targets().find((t) => t.quarter === q); }
  trackById(_: number, x: { id: number }): number { return x.id; }
}
