import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { catchError, finalize, of, tap } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { ToastService } from '@core/services/toast.service';
import { Cycle, Scorecard, ScorecardKpi, KpiQuarterTarget } from '@core/models/domain.model';
import { User } from '@core/models/user.model';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-return-reason-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <h2 mat-dialog-title>Return Scorecard to Draft</h2>
    <mat-dialog-content class="content">
      <mat-form-field appearance="outline">
        <mat-label>Reason for Return *</mat-label>
        <textarea matInput rows="4" [(ngModel)]="reason" placeholder="Explain what needs to be corrected..."></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="warn" [disabled]="!reason.trim()" (click)="ref.close(reason.trim())">Return to Draft</button>
    </mat-dialog-actions>
  `,
  styles: [`.content { min-width: 460px; padding-top: 12px !important; } mat-form-field { width: 100%; }`],
})
export class ReturnReasonDialogComponent {
  reason = '';
  constructor(public ref: MatDialogRef<ReturnReasonDialogComponent, string | null>) {}
}

@Component({
  selector: 'app-review-sdbip',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatDialogModule,
    PageHeaderComponent, LoadingSpinnerComponent, StatusBadgeComponent, EmptyStateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './review-sdbip.component.html',
  styleUrls: ['./review-sdbip.component.scss'],
})
export class ReviewSdbipComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(MatDialog);

  loading = signal(true);
  cycles = signal<Cycle[]>([]);
  users = signal<User[]>([]);
  selectedCycleId = signal<number | null>(null);
  effectiveCycleId = computed<number | null>(() => this.selectedCycleId() ?? this.cycles()[0]?.id ?? null);

  allScorecards = signal<Scorecard[]>([]);
  scorecards = computed(() => this.allScorecards().filter((s) => s.status === 'Submitted' || s.status === 'Reviewed'));
  selectedScorecardId = signal<number | null>(null);
  selectedScorecard = computed(() => this.allScorecards().find((s) => s.id === this.selectedScorecardId()) ?? null);

  kpis = signal<ScorecardKpi[]>([]);
  expanded = signal<Record<number, boolean>>({});
  kpiTargets = signal<Record<number, KpiQuarterTarget[]>>({});
  kpiComments: Record<number, string> = {};
  reviewComments = '';
  isProcessing = signal(false);

  submittedKpis = computed(() => this.kpis().filter((k) => k.status === 'Submitted'));
  reviewedKpis = computed(() => this.kpis().filter((k) => k.status === 'Reviewed'));
  allKpisReviewed = computed(() => {
    const list = this.kpis();
    return list.length > 0 && list.every((k) => k.status === 'Reviewed');
  });

  ngOnInit() {
    this.api.get<Cycle[]>('/cycles').pipe(
      catchError(() => of([] as Cycle[])),
      tap((c) => this.cycles.set(Array.isArray(c) ? c : [])),
    ).subscribe(() => this.loadScorecards());
    this.api.get<User[]>('/auth/users').pipe(
      catchError(() => of([] as User[])),
      tap((u) => this.users.set(Array.isArray(u) ? u : [])),
    ).subscribe();
  }

  loadScorecards() {
    const cycleId = this.effectiveCycleId();
    if (!cycleId) { this.allScorecards.set([]); this.loading.set(false); return; }
    this.loading.set(true);
    this.api.get<Scorecard[]>('/scorecards', { cycleId }).pipe(
      catchError(() => of([] as Scorecard[])),
      tap((r) => this.allScorecards.set(Array.isArray(r) ? r : [])),
      finalize(() => this.loading.set(false)),
    ).subscribe();
  }

  selectCycle(id: number) { this.selectedCycleId.set(id); this.loadScorecards(); }

  openScorecard(sc: Scorecard) {
    this.selectedScorecardId.set(sc.id);
    this.expanded.set({});
    this.kpiTargets.set({});
    this.kpiComments = {};
    this.reviewComments = '';
    this.kpis.set([]);
    this.api.get<ScorecardKpi[]>(`/scorecards/${sc.id}/kpis`).pipe(
      catchError(() => of([] as ScorecardKpi[])),
      tap((r) => this.kpis.set(Array.isArray(r) ? r : [])),
    ).subscribe();
  }

  back() {
    this.selectedScorecardId.set(null);
    this.kpis.set([]);
    this.reviewComments = '';
  }

  toggleExpand(kpi: ScorecardKpi) {
    const cur = this.expanded();
    const next = { ...cur, [kpi.id]: !cur[kpi.id] };
    this.expanded.set(next);
    if (next[kpi.id] && !this.kpiTargets()[kpi.id]) {
      this.api.get<KpiQuarterTarget[]>(`/scorecard-kpis/${kpi.id}/quarter-targets`).pipe(
        catchError(() => of([] as KpiQuarterTarget[])),
        tap((r) => this.kpiTargets.set({ ...this.kpiTargets(), [kpi.id]: Array.isArray(r) ? r : [] })),
      ).subscribe();
    }
  }

  setComment(kpiId: number, value: string) { this.kpiComments[kpiId] = value; }

  reviewKpi(kpiId: number, action: 'review' | 'return') {
    this.isProcessing.set(true);
    this.api.post(`/scorecard-kpis/${kpiId}/transition`, { action, comments: this.kpiComments[kpiId] || '' }).pipe(
      tap(() => {
        this.toast.success(action === 'review' ? 'KPI marked as Reviewed' : 'KPI returned to Draft');
        const sc = this.selectedScorecardId();
        if (sc) this.api.get<ScorecardKpi[]>(`/scorecards/${sc}/kpis`).pipe(
          catchError(() => of([] as ScorecardKpi[])),
          tap((r) => this.kpis.set(Array.isArray(r) ? r : [])),
        ).subscribe();
      }),
      catchError((e) => { this.toast.error('Error', e?.error?.message ?? 'Failed to transition KPI'); return of(null); }),
      finalize(() => this.isProcessing.set(false)),
    ).subscribe();
  }

  reviewScorecard() {
    const id = this.selectedScorecardId();
    if (!id || !this.allKpisReviewed()) return;
    this.isProcessing.set(true);
    this.api.post(`/scorecards/${id}/transition`, { action: 'review', comments: this.reviewComments }).pipe(
      tap(() => {
        this.toast.success('SDBIP marked as Reviewed', 'Ready for PMS Director approval.');
        this.back();
        this.loadScorecards();
      }),
      catchError((e) => { this.toast.error('Error', e?.error?.message ?? 'Failed to review scorecard'); return of(null); }),
      finalize(() => this.isProcessing.set(false)),
    ).subscribe();
  }

  returnScorecard() {
    const id = this.selectedScorecardId(); if (!id) return;
    this.dialog.open(ReturnReasonDialogComponent, { panelClass: 'plat-dialog' })
      .afterClosed().subscribe((reason) => {
        if (!reason) return;
        this.isProcessing.set(true);
        this.api.post(`/scorecards/${id}/transition`, { action: 'return', comments: reason }).pipe(
          tap(() => {
            this.toast.success('SDBIP returned', 'Returned to Draft for corrections.');
            this.back();
            this.loadScorecards();
          }),
          catchError((e) => { this.toast.error('Error', e?.error?.message ?? 'Failed to return scorecard'); return of(null); }),
          finalize(() => this.isProcessing.set(false)),
        ).subscribe();
      });
  }

  userName(id: number | null | undefined): string {
    if (!id) return '—';
    const u = this.users().find((x) => x.id === id);
    return u ? u.displayName : `User #${id}`;
  }

  formatDate(s: string | null | undefined): string {
    if (!s) return '';
    try { return new Date(s).toLocaleDateString(); } catch { return s; }
  }

  targetForQuarter(kpiId: number, q: number): KpiQuarterTarget | undefined {
    return this.kpiTargets()[kpiId]?.find((t) => t.quarter === q);
  }

  trackById(_: number, x: { id: number }): number { return x.id; }
}
