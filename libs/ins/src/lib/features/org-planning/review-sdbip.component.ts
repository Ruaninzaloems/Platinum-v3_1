import { ChangeDetectionStrategy, Component, Inject, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { catchError, concatMap, finalize, from, of, switchMap, tap, toArray } from 'rxjs';
import { ApiService } from '@ins-core/services/api.service';
import { ToastService } from '@ins-core/services/toast.service';
import { SdbipFieldConfigService } from '@ins-core/services/sdbip-field-config.service';
import { Cycle, Scorecard, ScorecardKpi, SdbipFieldConfig, UnitOfMeasure } from '@ins-core/models/domain.model';
import { User } from '@ins-core/models/user.model';
import { PageHeaderComponent } from '@ins-shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '@ins-shared/components/loading-spinner/loading-spinner.component';
import { StatusBadgeComponent } from '@ins-shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '@ins-shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-return-reason-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <h2 mat-dialog-title>{{ title }}</h2>
    <mat-dialog-content class="content">
      <mat-form-field appearance="outline">
        <mat-label>Reason *</mat-label>
        <textarea matInput rows="4" [(ngModel)]="reason" placeholder="Explain what needs to be corrected..."></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="warn" [disabled]="!reason.trim()" (click)="ref.close(reason.trim())">{{ confirmLabel }}</button>
    </mat-dialog-actions>
  `,
  styles: [`.content { min-width: 460px; padding-top: 12px !important; } mat-form-field { width: 100%; }`],
})
export class ReturnReasonDialogComponent {
  reason = '';
  title = 'Return Scorecard to Draft';
  confirmLabel = 'Return to Draft';
  constructor(
    public ref: MatDialogRef<ReturnReasonDialogComponent, string | null>,
    @Inject(MAT_DIALOG_DATA) data: { title?: string; confirmLabel?: string } | null,
  ) {
    if (data?.title) this.title = data.title;
    if (data?.confirmLabel) this.confirmLabel = data.confirmLabel;
  }
}

export interface KpiViewDialogData {
  kpi: ScorecardKpi;
  fields: SdbipFieldConfig[];
  users: User[];
  uoms: UnitOfMeasure[];
  canReview: boolean;
}

@Component({
  selector: 'app-kpi-view-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, StatusBadgeComponent],
  template: `
    <div class="dlg-header">
      <div class="head-left">
        <div class="head-icon"><mat-icon>flag</mat-icon></div>
        <div class="head-text">
          <div class="head-eyebrow">KPI {{ data.kpi.kpiNumber }}</div>
          <h2 class="head-title">{{ data.kpi.description }}</h2>
        </div>
      </div>
      <app-status-badge [status]="displayStatus()"></app-status-badge>
    </div>
    <mat-dialog-content class="content">
      <div class="section">
        <div class="section-label">KPI Details</div>
        <div class="detail-grid">
          <div class="detail-item" *ngFor="let e of entries()" [class.full]="isLong(e.value)">
            <div class="lbl">{{ e.label }}</div>
            <div class="val">{{ e.value || '—' }}</div>
          </div>
        </div>
      </div>
      <div class="section">
        <div class="section-label">Quarterly Targets</div>
        <div class="q-grid">
          <div class="qcell" *ngFor="let q of [1, 2, 3, 4]">
            <div class="qlbl">Q{{ q }}</div>
            <div class="qval">{{ quarterTarget(q) || '—' }}</div>
            <div class="qpoe" *ngIf="quarterPoe(q)" [title]="quarterPoe(q)">{{ quarterPoe(q) }}</div>
          </div>
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions class="dlg-footer">
      <button mat-stroked-button mat-dialog-close>Close</button>
      <span class="spacer"></span>
      <ng-container *ngIf="data.canReview">
        <button mat-flat-button class="reject-btn" (click)="ref.close('reject')"><mat-icon>cancel</mat-icon> Reject</button>
        <button mat-flat-button class="approve-btn" (click)="ref.close('approve')"><mat-icon>check_circle</mat-icon> Approve</button>
      </ng-container>
    </mat-dialog-actions>
  `,
  styles: [`
    .dlg-header {
      display: flex; align-items: flex-start; justify-content: space-between; gap: 16px;
      padding: 20px 24px 16px; border-bottom: 1px solid #e2e8f0;
    }
    .head-left { display: flex; align-items: flex-start; gap: 12px; min-width: 0; }
    .head-icon {
      flex-shrink: 0; width: 38px; height: 38px; border-radius: 10px;
      background: #eff6ff; color: #1d4ed8; display: flex; align-items: center; justify-content: center;
      mat-icon { font-size: 20px; width: 20px; height: 20px; }
    }
    .head-eyebrow { font-size: 11px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: #64748b; }
    .head-title { margin: 2px 0 0; font-size: 16px; font-weight: 700; color: #0f172a; line-height: 1.35; }
    .content { min-width: 580px; max-width: 700px; padding: 18px 24px !important; }
    .section + .section { margin-top: 18px; }
    .section-label {
      font-size: 11px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase;
      color: #94a3b8; margin-bottom: 10px;
    }
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 18px; }
    .detail-item { min-width: 0; }
    .detail-item.full { grid-column: 1 / -1; }
    .lbl { font-size: 11px; color: #64748b; margin-bottom: 1px; }
    .val { font-size: 13px; color: #0f172a; font-weight: 500; overflow-wrap: break-word; }
    .q-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
    .qcell {
      background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;
      padding: 10px 8px; text-align: center; font-size: 12px; min-width: 0;
    }
    .qlbl { font-size: 10.5px; font-weight: 700; letter-spacing: .05em; color: #64748b; }
    .qval { color: #0f172a; font-size: 16px; font-weight: 700; margin-top: 2px; }
    .qpoe {
      color: #94a3b8; font-size: 10px; margin-top: 4px; line-height: 1.3;
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
    }
    .dlg-footer { padding: 12px 24px 16px; border-top: 1px solid #e2e8f0; gap: 8px; }
    .spacer { flex: 1; }
    .approve-btn { background: #16a34a; color: #fff; }
    .reject-btn { background: #dc2626; color: #fff; }
  `],
})
export class KpiViewDialogComponent {
  constructor(
    public ref: MatDialogRef<KpiViewDialogComponent, 'approve' | 'reject' | undefined>,
    @Inject(MAT_DIALOG_DATA) public data: KpiViewDialogData,
  ) {}

  displayStatus(): string {
    return this.data.kpi.status === 'Submitted' ? 'Pending' : String(this.data.kpi.status);
  }

  quarterTarget(q: number): string {
    const v = this.data.kpi.customFields?.[`cf_quarter_${q}_target`];
    return v == null ? '' : String(v);
  }

  isLong(v: string): boolean { return (v ?? '').length > 60; }

  quarterPoe(q: number): string {
    const v = this.data.kpi.customFields?.[`cf_quarter_${q}_poe`];
    return v == null ? '' : String(v);
  }

  entries(): { label: string; value: string }[] {
    const k = this.data.kpi;
    const out: { label: string; value: string }[] = [];
    for (const f of this.data.fields) {
      if (!f.isIncluded) continue;
      if (f.fieldKey === 'description') continue;
      if (/^cf_quarter_\d_(target|poe)$/.test(f.fieldKey)) continue;
      let value = '';
      if (f.fieldKind === 'custom') {
        const v = k.customFields?.[f.fieldKey];
        value = v == null ? '' : String(v);
      } else if (f.fieldKey === 'unitOfMeasureId') {
        const u = this.data.uoms.find((x) => x.id === k.unitOfMeasureId);
        value = u ? u.name : '';
      } else if (f.fieldKey === 'responsiblePostId' || f.fieldKey === 'custodianPostId') {
        const id = f.fieldKey === 'responsiblePostId' ? k.responsiblePostId : k.custodianPostId;
        const u = this.data.users.find((x) => x.id === id);
        value = u ? (u.jobTitle ? `${u.displayName} (${u.jobTitle})` : u.displayName) : '';
      } else {
        const v = (k as unknown as Record<string, unknown>)[f.fieldKey];
        value = v == null ? '' : String(v);
      }
      out.push({ label: f.fieldKey === 'kpiNumber' ? 'Number' : f.fieldLabel, value });
    }
    return out;
  }
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
  private readonly router = inject(Router);
  private readonly fieldConfigSvc = inject(SdbipFieldConfigService);

  loading = signal(true);
  cycles = signal<Cycle[]>([]);
  users = signal<User[]>([]);
  uoms = signal<UnitOfMeasure[]>([]);
  fieldConfig = signal<SdbipFieldConfig[]>([]);
  selectedCycleId = signal<number | null>(null);
  effectiveCycleId = computed<number | null>(() => this.selectedCycleId() ?? this.cycles()[0]?.id ?? null);

  allScorecards = signal<Scorecard[]>([]);
  // Revised copies are reviewed on the Revised SDBIP pages, not here.
  scorecards = computed(() => this.allScorecards().filter((s) =>
    s.scorecardType === 'organisational' && (s.status === 'Submitted' || s.status === 'Reviewed' || s.status === 'Approved')));
  selectedScorecardId = signal<number | null>(null);
  selectedScorecard = computed(() => this.allScorecards().find((s) => s.id === this.selectedScorecardId()) ?? null);
  isLocked = computed(() => this.selectedScorecard()?.status === 'Approved');
  collapsed = signal(false);

  kpis = signal<ScorecardKpi[]>([]);
  filterQ = signal('');
  filterDept = signal<string | null>(null);
  filterResp = signal<number | null>(null);
  filterStatus = signal<string | null>(null);
  isProcessing = signal(false);

  submittedKpis = computed(() => this.kpis().filter((k) => k.status === 'Submitted'));
  reviewedKpis = computed(() => this.kpis().filter((k) => k.status === 'Reviewed'));
  approvedKpis = computed(() => this.kpis().filter((k) => k.status === 'Approved'));
  allKpisReviewed = computed(() => {
    const list = this.kpis();
    return list.length > 0 && list.every((k) => k.status === 'Reviewed');
  });

  deptOptions = computed(() => {
    const set = new Set<string>();
    for (const k of this.kpis()) {
      const d = this.deptOf(k);
      if (d) set.add(d);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  });

  respOptions = computed(() => {
    const ids = new Set<number>();
    for (const k of this.kpis()) if (k.responsiblePostId) ids.add(k.responsiblePostId);
    return this.users().filter((u) => ids.has(u.id));
  });

  statusOptions = computed(() => {
    const set = new Set<string>();
    for (const k of this.kpis()) set.add(String(k.status));
    return Array.from(set).sort();
  });

  filteredKpis = computed(() => {
    const q = this.filterQ().trim().toLowerCase();
    const dept = this.filterDept();
    const resp = this.filterResp();
    const status = this.filterStatus();
    return this.kpis().filter((k) =>
      (!q || k.description.toLowerCase().includes(q)) &&
      (!dept || this.deptOf(k) === dept) &&
      (!resp || k.responsiblePostId === resp) &&
      (!status || String(k.status) === status),
    );
  });

  ngOnInit() {
    this.api.get<Cycle[]>('/cycles').pipe(
      catchError(() => of([] as Cycle[])),
      tap((c) => this.cycles.set(Array.isArray(c) ? c : [])),
    ).subscribe(() => this.loadScorecards());
    this.api.get<User[]>('/users/lookup').pipe(
      catchError(() => of([] as User[])),
      tap((u) => this.users.set(Array.isArray(u) ? u : [])),
    ).subscribe();
    this.fieldConfigSvc.load('original').pipe(catchError(() => of([] as SdbipFieldConfig[])))
      .subscribe((f) => this.fieldConfig.set(f));
  }

  loadScorecards() {
    const cycleId = this.effectiveCycleId();
    if (!cycleId) { this.allScorecards.set([]); this.loading.set(false); return; }
    this.loading.set(true);
    this.api.get<UnitOfMeasure[]>('/units-of-measure', { cycleId }).pipe(catchError(() => of([] as UnitOfMeasure[])))
      .subscribe((u) => this.uoms.set(Array.isArray(u) ? u : []));
    this.api.get<Scorecard[]>('/scorecards', { cycleId }).pipe(
      catchError(() => of([] as Scorecard[])),
      tap((r) => this.allScorecards.set(Array.isArray(r) ? r : [])),
      finalize(() => this.loading.set(false)),
    ).subscribe();
  }

  selectCycle(id: number) { this.selectedCycleId.set(id); this.loadScorecards(); }

  openScorecard(sc: Scorecard) {
    this.selectedScorecardId.set(sc.id);
    this.collapsed.set(false);
    this.filterQ.set('');
    this.filterDept.set(null);
    this.filterResp.set(null);
    this.filterStatus.set(null);
    this.kpis.set([]);
    this.reloadKpis(sc.id);
  }

  private reloadKpis(scorecardId: number, checkCompletion = false) {
    this.api.get<ScorecardKpi[]>(`/scorecards/${scorecardId}/kpis`).pipe(
      catchError(() => of([] as ScorecardKpi[])),
      tap((r) => this.kpis.set(Array.isArray(r) ? r : [])),
    ).subscribe(() => { if (checkCompletion) this.maybeCompleteScorecard(); });
  }

  back() {
    this.selectedScorecardId.set(null);
    this.kpis.set([]);
  }

  cycleLabel(): string {
    const c = this.cycles().find((x) => x.id === this.effectiveCycleId());
    return c?.financialYearLabel ?? '';
  }

  cfVal(k: ScorecardKpi, key: string): string {
    const v = k.customFields?.[key];
    return v == null ? '' : String(v);
  }

  kpaOf(k: ScorecardKpi): string { return this.cfVal(k, 'cf_nkpa'); }
  deptOf(k: ScorecardKpi): string { return this.cfVal(k, 'cf_department').trim(); }
  qTarget(k: ScorecardKpi, q: number): string { return this.cfVal(k, `cf_quarter_${q}_target`); }

  uomAbbr(id: number | null | undefined): string {
    if (!id) return '';
    const u = this.uoms().find((x) => x.id === id);
    return u ? u.name : '';
  }

  statusLabel(s: string): string { return s === 'Submitted' ? 'Pending' : s; }

  respTriggerLabel(): string {
    const id = this.filterResp();
    if (!id) return '';
    const u = this.users().find((x) => x.id === id);
    return u?.displayName ?? '';
  }

  canReviewKpi(k: ScorecardKpi): boolean { return k.status === 'Submitted'; }

  viewKpi(k: ScorecardKpi) {
    this.dialog.open<KpiViewDialogComponent, KpiViewDialogData, 'approve' | 'reject' | undefined>(KpiViewDialogComponent, {
      panelClass: 'plat-dialog',
      data: { kpi: k, fields: this.fieldConfig(), users: this.users(), uoms: this.uoms(), canReview: this.canReviewKpi(k) },
    }).afterClosed().subscribe((action) => {
      if (action === 'approve') this.approveKpi(k);
      else if (action === 'reject') this.rejectKpi(k);
    });
  }

  approveKpi(k: ScorecardKpi) {
    this.transitionKpi(k.id, 'review', '', 'KPI approved');
  }

  rejectKpi(k: ScorecardKpi) {
    this.dialog.open(ReturnReasonDialogComponent, {
      panelClass: 'plat-dialog',
      data: { title: `Reject KPI ${k.kpiNumber}`, confirmLabel: 'Reject' },
    }).afterClosed().subscribe((reason) => {
      if (!reason) return;
      this.transitionKpi(k.id, 'return', reason, 'KPI rejected and returned to Draft');
    });
  }

  private transitionKpi(kpiId: number, action: 'review' | 'return', comments: string, successMsg: string) {
    this.isProcessing.set(true);
    this.api.post(`/scorecard-kpis/${kpiId}/transition`, { action, comments }).pipe(
      tap(() => {
        this.toast.success(successMsg);
        const sc = this.selectedScorecardId();
        if (sc) this.reloadKpis(sc, action === 'review');
      }),
      catchError((e) => { this.toast.error('Error', e?.error?.message ?? 'Failed to transition KPI'); return of(null); }),
      finalize(() => this.isProcessing.set(false)),
    ).subscribe();
  }

  approveScorecard(sc: Scorecard) {
    this.isProcessing.set(true);
    // Approve any remaining Reviewed KPIs first, then approve the SDBIP itself.
    this.api.get<ScorecardKpi[]>(`/scorecards/${sc.id}/kpis`).pipe(
      catchError(() => of([] as ScorecardKpi[])),
      switchMap((kpis) => {
        const pending = (Array.isArray(kpis) ? kpis : []).filter((k) => k.status === 'Reviewed');
        if (!pending.length) return of([] as unknown[]);
        return from(pending).pipe(
          concatMap((k) => this.api.post(`/scorecard-kpis/${k.id}/transition`, { action: 'approve', comments: '' })),
          toArray(),
        );
      }),
      switchMap(() => this.api.post(`/scorecards/${sc.id}/transition`, { action: 'approve', comments: '' })),
      tap(() => {
        this.toast.success('SDBIP approved', `${sc.name} has been approved.`);
        this.loadScorecards();
      }),
      catchError((e) => { this.toast.error('Error', e?.error?.error ?? e?.error?.message ?? 'Failed to approve SDBIP'); return of(null); }),
      finalize(() => this.isProcessing.set(false)),
    ).subscribe();
  }

  reopenForRevision() {
    const sc = this.selectedScorecard();
    if (!sc || sc.status !== 'Approved') return;
    // Approved SDBIPs are immutable: reopening creates (or resumes) a separate
    // revised Draft copy — the original stays approved and read-only.
    this.isProcessing.set(true);
    this.api.post(`/scorecards/${sc.id}/revise`, {}).pipe(
      tap(() => {
        this.toast.success('Revision started', `${sc.name} stays approved. Changes are captured on a revised copy under Revised SDBIP.`);
        this.router.navigate(['/revised-sdbip/capture']);
      }),
      catchError((e) => { this.toast.error('Error', e?.error?.error ?? e?.error?.message ?? 'Failed to start revision'); return of(null); }),
      finalize(() => this.isProcessing.set(false)),
    ).subscribe();
  }

  private maybeCompleteScorecard() {
    const sc = this.selectedScorecard();
    if (!sc || sc.status !== 'Submitted' || !this.allKpisReviewed()) return;
    this.api.post(`/scorecards/${sc.id}/transition`, { action: 'review', comments: '' }).pipe(
      tap(() => {
        this.toast.success('All KPIs approved', 'SDBIP marked as Reviewed and ready for approval.');
        this.loadScorecards();
      }),
      catchError((e) => { this.toast.error('Error', e?.error?.message ?? 'Failed to mark scorecard as Reviewed'); return of(null); }),
    ).subscribe();
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

  trackById(_: number, x: { id: number }): number { return x.id; }
}
