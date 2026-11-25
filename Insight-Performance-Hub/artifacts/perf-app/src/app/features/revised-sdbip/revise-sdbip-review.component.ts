import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { catchError, finalize, forkJoin, of } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { ToastService } from '@core/services/toast.service';
import { Cycle, KpiQuarterTarget, Scorecard, ScorecardKpi } from '@core/models/domain.model';
import { User } from '@core/models/user.model';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';

const STATUS_TONE: Record<string, string> = {
  Draft: 'tone-slate',
  Submitted: 'tone-blue',
  Reviewed: 'tone-amber',
  Approved: 'tone-green',
};

const REVISION_TYPE_LABELS: Record<string, string> = {
  scorecard_reopened: 'Scorecard Reopened',
  kpi_added: 'New KPI Added',
  kpi_deleted: 'KPI Deleted',
  target_revised: 'Target Revised',
  annual_target_revised: 'Annual Target Revised',
  kpi_updated: 'KPI Updated',
  revision_submitted: 'Revision Submitted',
  revision_reviewed: 'Revision Reviewed',
  revision_approved: 'Revision Approved',
};

interface RevisionLog {
  id: number;
  scorecardId: number;
  kpiId: number | null;
  revisionType: string;
  fieldName?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  revisionReason?: string | null;
  quarter?: number | null;
  userName: string;
  createdAt: string;
}

interface QuarterTarget extends KpiQuarterTarget {
  baselineTargetValue?: string | null;
  revisionReason?: string | null;
}

// ─── Return reason dialog ──────────────────────────────────────────────────
@Component({
  selector: 'app-revise-return-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <h2 mat-dialog-title>Return Revised Scorecard to Draft</h2>
    <mat-dialog-content class="content">
      <mat-form-field appearance="outline">
        <mat-label>Reason for Return *</mat-label>
        <textarea matInput rows="4" [(ngModel)]="reason" name="r" placeholder="Explain what needs correction..."></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" mat-dialog-close>Cancel</button>
      <button mat-flat-button color="warn" type="button" [disabled]="!reason.trim()" (click)="ref.close(reason.trim())">Return to Draft</button>
    </mat-dialog-actions>
  `,
  styles: [`.content { min-width: 480px; padding-top: 12px !important; } mat-form-field { width: 100%; }`],
})
export class ReviseReturnDialogComponent {
  reason = '';
  constructor(public ref: MatDialogRef<ReviseReturnDialogComponent, string | null>) {}
}

// ─── KPI review card (lazy-loads quarter targets on expand) ─────────────────
@Component({
  selector: 'app-revision-kpi-review-card',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="review-card">
      <div class="rc-head">
        <div class="rc-main">
          <div class="rc-tags">
            <span class="rc-num">{{ kpi().kpiNumber }}</span>
            <span class="badge" [ngClass]="statusTone[kpi().status] || 'tone-slate'">{{ kpi().status }}</span>
          </div>
          <p class="rc-desc">{{ kpi().description }}</p>
          <div class="rc-meta">
            <span>Weight: {{ kpi().weighting }}%</span>
            <span>Annual Target: {{ kpi().annualTarget }}</span>
            <span>Responsible: {{ responsibleName() }}</span>
          </div>
        </div>
        <button mat-button type="button" (click)="toggle()">{{ expanded() ? 'Collapse' : 'Expand' }}</button>
      </div>

      <div class="rc-expand" *ngIf="expanded()">
        <div class="target-grid" *ngIf="targets().length">
          <div *ngFor="let q of [1,2,3,4]" class="tg" [class.rev]="hasRevision(q)">
            <div class="q">Q{{ q }}</div>
            <div class="val">{{ targetFor(q)?.targetValue ?? '—' }}</div>
            <ng-container *ngIf="hasRevision(q)">
              <div class="was">Was: {{ targetFor(q)?.baselineTargetValue }}</div>
              <div class="reason" *ngIf="targetFor(q)?.revisionReason">Reason: {{ targetFor(q)?.revisionReason }}</div>
            </ng-container>
          </div>
        </div>

        <div *ngIf="kpi().status === 'Submitted'" class="rc-comment">
          <mat-form-field appearance="outline">
            <mat-label>Review comments</mat-label>
            <textarea matInput rows="2" [ngModel]="comment()" (ngModelChange)="comment.set($event)" placeholder="Review comments..."></textarea>
          </mat-form-field>
          <div class="rc-actions">
            <button mat-flat-button color="primary" type="button" [disabled]="processing()" (click)="review.emit(comment())">
              <mat-icon>check_circle</mat-icon> Mark Reviewed
            </button>
            <button mat-stroked-button color="warn" type="button" [disabled]="processing()" (click)="return.emit(comment())">
              <mat-icon>cancel</mat-icon> Return
            </button>
          </div>
        </div>
        <div *ngIf="kpi().status === 'Reviewed'" class="status-ok amber"><mat-icon>check_circle</mat-icon> Reviewed</div>
        <div *ngIf="kpi().status === 'Approved'" class="status-ok green"><mat-icon>check_circle</mat-icon> Approved</div>
      </div>
    </div>
  `,
  styleUrls: ['./revised-sdbip.shared.scss'],
})
export class RevisionKpiReviewCardComponent {
  private readonly api = inject(ApiService);
  readonly statusTone = STATUS_TONE;

  kpi = input.required<ScorecardKpi>();
  responsibleName = input<string>('—');
  processing = input<boolean>(false);

  expanded = signal(false);
  comment = signal('');
  targets = signal<QuarterTarget[]>([]);

  review = output<string>();
  return = output<string>();

  toggle() {
    const next = !this.expanded();
    this.expanded.set(next);
    if (next && !this.targets().length) {
      this.api.get<QuarterTarget[]>(`/scorecard-kpis/${this.kpi().id}/quarter-targets`).pipe(
        catchError(() => of([] as QuarterTarget[])),
      ).subscribe((r) => this.targets.set(Array.isArray(r) ? r : []));
    }
  }

  targetFor(q: number): QuarterTarget | undefined {
    return this.targets().find((t) => t.quarter === q);
  }

  hasRevision(q: number): boolean {
    const t = this.targetFor(q);
    return !!(t?.isApprovedBaseline && t?.baselineTargetValue && t.targetValue !== t.baselineTargetValue);
  }
}

// ─── Main Review Page ──────────────────────────────────────────────────────
@Component({
  selector: 'app-revise-sdbip-review',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatTabsModule,
    PageHeaderComponent, RevisionKpiReviewCardComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './revise-sdbip-review.component.html',
  styleUrls: ['./revised-sdbip.shared.scss'],
})
export class ReviseSdbipReviewComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(MatDialog);

  readonly statusTone = STATUS_TONE;
  readonly revisionLabels = REVISION_TYPE_LABELS;

  cycles = signal<Cycle[]>([]);
  users = signal<User[]>([]);
  allScorecards = signal<Scorecard[]>([]);
  kpis = signal<ScorecardKpi[]>([]);
  revisionLogs = signal<RevisionLog[]>([]);

  selectedCycleId = signal<number | null>(null);
  selectedScorecardId = signal<number | null>(null);
  reviewComments = signal('');
  processing = signal(false);
  tabIndex = signal(0);
  exporting = signal(false);

  // ── KPI list filters (mirrors the compile page) ──────────────────────────
  filterQ = signal('');
  filterDept = signal<string | null>(null);
  filterResp = signal<number | null>(null);

  effectiveCycleId = computed<number | null>(() => this.selectedCycleId() ?? this.cycles()[0]?.id ?? null);

  scorecards = computed<Scorecard[]>(() =>
    this.allScorecards().filter((s) => s.scorecardType === 'revised' && (s.status === 'Submitted' || s.status === 'Reviewed')));

  selectedScorecard = computed<Scorecard | undefined>(() =>
    this.allScorecards().find((s) => s.id === this.selectedScorecardId()));

  submittedKpis = computed<ScorecardKpi[]>(() => this.kpis().filter((k) => k.status === 'Submitted'));
  reviewedKpis = computed<ScorecardKpi[]>(() => this.kpis().filter((k) => k.status === 'Reviewed'));
  allKpisReviewed = computed<boolean>(() => this.kpis().length > 0 && this.kpis().every((k) => k.status === 'Reviewed'));

  // ── KPI list filters ──────────────────────────────────────────────────────
  deptOptions = computed<string[]>(() => {
    const set = new Set<string>();
    for (const k of this.kpis()) {
      const d = this.deptOf(k);
      if (d) set.add(d);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  });

  respOptions = computed<User[]>(() => {
    const ids = new Set<number>();
    for (const k of this.kpis()) if (k.responsiblePostId) ids.add(k.responsiblePostId);
    return this.users().filter((u) => ids.has(u.id));
  });

  filteredKpis = computed<ScorecardKpi[]>(() => {
    const q = this.filterQ().trim().toLowerCase();
    const dept = this.filterDept();
    const resp = this.filterResp();
    return this.kpis().filter((k) =>
      (!q || (k.description ?? '').toLowerCase().includes(q)) &&
      (!dept || this.deptOf(k) === dept) &&
      (!resp || k.responsiblePostId === resp),
    );
  });

  // ── Revision audit trail (mirrors the compile page) ──────────────────────
  /** KPI-level change types shown in the structured audit table. */
  private static readonly KPI_CHANGE_TYPES = new Set([
    'kpi_added', 'kpi_deleted', 'target_revised', 'annual_target_revised', 'kpi_updated',
  ]);

  /** Sequential revision number within the parent SDBIP (Rev 1, Rev 2, ...). */
  revisionNo = computed<number>(() => {
    const sc = this.selectedScorecard();
    if (!sc) return 1;
    const siblings = this.allScorecards()
      .filter((s) => s.scorecardType === 'revised' && s.parentScorecardId === sc.parentScorecardId)
      .sort((a, b) => a.id - b.id);
    const idx = siblings.findIndex((s) => s.id === sc.id);
    return idx >= 0 ? idx + 1 : 1;
  });

  /** User who submitted this revision for review (latest submission event). */
  submittedBy = computed<string>(() => {
    const log = this.revisionLogs().find((l) => l.revisionType === 'revision_submitted');
    return log?.userName ?? '';
  });

  approvedByName = computed<string>(() => {
    const sc = this.selectedScorecard();
    if (sc?.approvedById) return this.getUserName(sc.approvedById);
    const log = this.revisionLogs().find((l) => l.revisionType === 'revision_approved');
    return log?.userName ?? '';
  });

  /** Workflow status in audit-trail vocabulary. */
  auditStatus = computed<string>(() => {
    const status = this.selectedScorecard()?.status ?? 'Draft';
    if (status === 'Submitted' || status === 'Reviewed') return 'Pending Approval';
    if (status === 'Returned') return 'Rejected';
    return status;
  });

  /** One row per KPI-level field change, newest first. */
  auditRows = computed(() => {
    const kpiById = new Map(this.kpis().map((k) => [k.id, k]));
    return this.revisionLogs()
      .filter((l) => ReviseSdbipReviewComponent.KPI_CHANGE_TYPES.has(l.revisionType))
      .map((l) => {
        const kpi = l.kpiId != null ? kpiById.get(l.kpiId) : undefined;
        const added = l.revisionType === 'kpi_added';
        const deleted = l.revisionType === 'kpi_deleted';
        return {
          id: l.id,
          kpiRef: kpi ? String(kpi.kpiNumber ?? kpi.id) : '—',
          kpiDesc: kpi?.description ?? (added || deleted ? (l.newValue ?? l.oldValue ?? '—') : '—'),
          field: l.fieldName ?? (added ? 'New KPI' : deleted ? 'KPI removed' : '—'),
          oldValue: added ? '—' : (l.oldValue ?? '—'),
          newValue: deleted ? '—' : (l.newValue ?? '—'),
          changeType: added ? 'Added' : deleted ? 'Deleted' : 'Modified',
          reason: l.revisionReason ?? '',
          changedBy: l.userName,
          changedAt: l.createdAt,
        };
      });
  });

  /** Scorecard-level workflow events for the timeline under the table. */
  workflowLogs = computed<RevisionLog[]>(() =>
    this.revisionLogs().filter((l) => !ReviseSdbipReviewComponent.KPI_CHANGE_TYPES.has(l.revisionType)));

  ngOnInit() {
    forkJoin({
      cycles: this.api.get<Cycle[]>('/cycles').pipe(catchError(() => of([] as Cycle[]))),
      users: this.api.get<User[]>('/auth/users').pipe(catchError(() => of([] as User[]))),
    }).subscribe(({ cycles, users }) => {
      this.cycles.set(Array.isArray(cycles) ? cycles : []);
      this.users.set(Array.isArray(users) ? users : []);
      this.loadScorecards();
      // Deep link: /revised-sdbip/review?sc=<id> opens that revision directly.
      const scParam = Number(this.route.snapshot.queryParamMap.get('sc'));
      if (scParam) { this.selectedScorecardId.set(scParam); this.loadKpis(scParam); }
      if (this.route.snapshot.queryParamMap.get('tab') === 'audit') this.tabIndex.set(1);
    });
  }

  onCycle(id: number) {
    this.selectedCycleId.set(id);
    this.loadScorecards();
  }

  loadScorecards() {
    const cycleId = this.effectiveCycleId();
    if (!cycleId) { this.allScorecards.set([]); return; }
    this.api.get<Scorecard[]>('/scorecards', { cycleId }).pipe(
      catchError(() => of([] as Scorecard[])),
    ).subscribe((r) => this.allScorecards.set(Array.isArray(r) ? r : []));
  }

  loadKpis(scorecardId: number) {
    this.api.get<ScorecardKpi[]>(`/scorecards/${scorecardId}/kpis`).pipe(
      catchError(() => of([] as ScorecardKpi[])),
    ).subscribe((r) => this.kpis.set(Array.isArray(r) ? r : []));
    this.api.get<RevisionLog[]>(`/scorecards/${scorecardId}/revision-logs`).pipe(
      catchError(() => of([] as RevisionLog[])),
    ).subscribe((r) => this.revisionLogs.set(Array.isArray(r) ? r : []));
  }

  deptOf(k: ScorecardKpi): string {
    const v = k.customFields?.['cf_department'];
    return v == null ? '' : String(v).trim();
  }

  respTriggerLabel(): string {
    const id = this.filterResp();
    if (!id) return '';
    const u = this.users().find((x) => x.id === id);
    return u?.displayName ?? '';
  }

  /** Download the revision audit trail as Excel, PDF, or Word. */
  exportAudit(format: 'xlsx' | 'pdf' | 'docx') {
    const sc = this.selectedScorecard();
    if (!sc || this.exporting()) return;
    this.exporting.set(true);
    this.api.getBlob(`/scorecards/${sc.id}/revision-logs/export`, { format }).pipe(
      catchError(() => {
        this.toast.error('Export failed. Please try again.');
        return of(null);
      }),
    ).subscribe((blob) => {
      this.exporting.set(false);
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${sc.name} Revision Audit Trail.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  getUserName(id: number | null | undefined): string {
    if (!id) return '—';
    const u = this.users().find((x) => x.id === id);
    return u ? u.displayName : `User #${id}`;
  }

  openScorecard(sc: Scorecard) {
    this.selectedScorecardId.set(sc.id);
    this.reviewComments.set('');
    this.tabIndex.set(0);
    this.filterQ.set('');
    this.filterDept.set(null);
    this.filterResp.set(null);
    this.kpis.set([]);
    this.revisionLogs.set([]);
    this.loadKpis(sc.id);
  }

  back() {
    this.selectedScorecardId.set(null);
    this.reviewComments.set('');
    this.kpis.set([]);
    this.revisionLogs.set([]);
    this.loadScorecards();
  }

  reviewKpi(kpiId: number, action: 'review' | 'return', comments: string) {
    this.processing.set(true);
    this.api.post(`/scorecard-kpis/${kpiId}/transition`, { action, comments: comments || '' }).pipe(
      catchError((e) => { this.toast.error('Error', e?.error?.error ?? e?.error?.message ?? 'Failed to transition KPI'); return of(null); }),
      finalize(() => this.processing.set(false)),
    ).subscribe((res) => {
      if (res !== null) {
        this.toast.success(action === 'review' ? 'KPI marked as Reviewed' : 'KPI returned to Draft');
        const id = this.selectedScorecardId();
        if (id) this.loadKpis(id);
      }
    });
  }

  reviewScorecard() {
    const id = this.selectedScorecardId();
    if (!id) return;
    this.processing.set(true);
    this.api.post(`/scorecards/${id}/transition`, { action: 'review', comments: this.reviewComments() }).pipe(
      catchError((e) => { this.toast.error('Error', e?.error?.error ?? e?.error?.message ?? 'Failed to review'); return of(null); }),
      finalize(() => this.processing.set(false)),
    ).subscribe((res) => {
      if (res !== null) { this.toast.success('Revised SDBIP marked as Reviewed'); this.back(); }
    });
  }

  openReturnDialog() {
    this.dialog.open(ReviseReturnDialogComponent, { panelClass: 'plat-dialog', autoFocus: true })
      .afterClosed().subscribe((reason) => { if (reason) this.returnScorecard(reason); });
  }

  private returnScorecard(reason: string) {
    const id = this.selectedScorecardId();
    if (!id) return;
    this.processing.set(true);
    this.api.post(`/scorecards/${id}/transition`, { action: 'return', comments: reason }).pipe(
      catchError((e) => { this.toast.error('Error', e?.error?.error ?? e?.error?.message ?? 'Failed to return'); return of(null); }),
      finalize(() => this.processing.set(false)),
    ).subscribe((res) => {
      if (res !== null) { this.toast.success('Revised SDBIP returned to Draft'); this.back(); }
    });
  }

  trackById(_: number, x: { id: number }): number { return x.id; }
}
