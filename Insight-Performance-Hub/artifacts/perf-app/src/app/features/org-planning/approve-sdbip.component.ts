import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { catchError, concatMap, finalize, from, of, tap, toArray } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { ToastService } from '@core/services/toast.service';
import { Cycle, Scorecard, ScorecardKpi, KpiQuarterTarget } from '@core/models/domain.model';
import { User } from '@core/models/user.model';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { ReturnReasonDialogComponent } from './review-sdbip.component';

@Component({
  selector: 'app-approve-sdbip',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatDialogModule,
    PageHeaderComponent, LoadingSpinnerComponent, StatusBadgeComponent, EmptyStateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './approve-sdbip.component.html',
  styleUrls: ['./approve-sdbip.component.scss'],
})
export class ApproveSdbipComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(MatDialog);

  loading = signal(true);
  cycles = signal<Cycle[]>([]);
  users = signal<User[]>([]);
  selectedCycleId = signal<number | null>(null);
  effectiveCycleId = computed<number | null>(() => this.selectedCycleId() ?? this.cycles()[0]?.id ?? null);

  allScorecards = signal<Scorecard[]>([]);
  scorecards = computed(() => this.allScorecards().filter((s) => s.status === 'Reviewed'));
  selectedScorecardId = signal<number | null>(null);
  selectedScorecard = computed(() => this.allScorecards().find((s) => s.id === this.selectedScorecardId()) ?? null);

  kpis = signal<ScorecardKpi[]>([]);
  expanded = signal<Record<number, boolean>>({});
  kpiTargets = signal<Record<number, KpiQuarterTarget[]>>({});
  approvalComments = '';
  isProcessing = signal(false);

  approvedKpis = computed(() => this.kpis().filter((k) => k.status === 'Approved'));
  reviewedKpis = computed(() => this.kpis().filter((k) => k.status === 'Reviewed'));
  allKpisApproved = computed(() => {
    const list = this.kpis();
    return list.length > 0 && list.every((k) => k.status === 'Approved');
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
    this.approvalComments = '';
    this.kpis.set([]);
    this.reloadKpis();
  }

  back() {
    this.selectedScorecardId.set(null);
    this.kpis.set([]);
    this.approvalComments = '';
  }

  private reloadKpis() {
    const sc = this.selectedScorecardId();
    if (!sc) return;
    this.api.get<ScorecardKpi[]>(`/scorecards/${sc}/kpis`).pipe(
      catchError(() => of([] as ScorecardKpi[])),
      tap((r) => this.kpis.set(Array.isArray(r) ? r : [])),
    ).subscribe();
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

  approveKpi(kpiId: number) {
    this.isProcessing.set(true);
    this.api.post(`/scorecard-kpis/${kpiId}/transition`, { action: 'approve', comments: '' }).pipe(
      tap(() => { this.toast.success('KPI Approved'); this.reloadKpis(); }),
      catchError((e) => { this.toast.error('Error', e?.error?.message ?? 'Failed to approve KPI'); return of(null); }),
      finalize(() => this.isProcessing.set(false)),
    ).subscribe();
  }

  approveAll() {
    const pending = this.reviewedKpis();
    if (pending.length === 0) return;
    this.isProcessing.set(true);
    from(pending).pipe(
      concatMap((k) => this.api.post(`/scorecard-kpis/${k.id}/transition`, { action: 'approve', comments: '' }).pipe(
        catchError(() => of({ __error: true } as const)),
      )),
      toArray(),
      tap((results) => {
        const failed = results.filter((r): r is { __error: true } => !!r && (r as { __error?: boolean }).__error === true).length;
        const ok = results.length - failed;
        if (failed === 0) this.toast.success(`${ok} KPI(s) approved`);
        else if (ok === 0) this.toast.error('Approval failed', `Could not approve ${failed} KPI(s).`);
        else this.toast.error('Partial success', `${ok} approved, ${failed} failed.`);
        this.reloadKpis();
      }),
      finalize(() => this.isProcessing.set(false)),
    ).subscribe();
  }

  approveScorecard() {
    const id = this.selectedScorecardId();
    if (!id || !this.allKpisApproved()) return;
    this.isProcessing.set(true);
    this.api.post(`/scorecards/${id}/transition`, { action: 'approve', comments: this.approvalComments }).pipe(
      tap(() => {
        this.toast.success('SDBIP Approved', 'Quarter targets are now baselined.');
        this.back();
        this.loadScorecards();
      }),
      catchError((e) => { this.toast.error('Error', e?.error?.message ?? 'Failed to approve scorecard'); return of(null); }),
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
