import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { catchError, forkJoin, of, tap } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { ToastService } from '@core/services/toast.service';
import { ConfirmService } from '@core/services/confirm.service';
import { SdbipFieldConfigService } from '@core/services/sdbip-field-config.service';
import { Cycle, KpiQuarterTarget, Scorecard, ScorecardKpi, SdbipFieldConfig, UnitOfMeasure } from '@core/models/domain.model';
import { User } from '@core/models/user.model';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { AddKpiDialogComponent, AddKpiDialogData } from '../org-planning/add-kpi-dialog.component';

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
}

/**
 * Revised SDBIP capture (copy-on-reopen).
 *
 * "Reopen for Revision" no longer mutates the approved SDBIP: the API creates a
 * separate 'revised' Draft scorecard with deep-copied KPIs whose quarterly
 * targets are frozen as approved baselines. The original stays Approved and
 * read-only. All KPI editing goes through the shared AddKpiDialog in revision
 * mode, where per-target revision reasons are optional notes; the required
 * overall revision reason is captured when the revision is submitted.
 */
@Component({
  selector: 'app-revise-sdbip-capture',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatTabsModule,
    PageHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './revise-sdbip-capture.component.html',
  styleUrls: ['./revised-sdbip.shared.scss'],
})
export class ReviseSdbipCaptureComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly fieldConfigApi = inject(SdbipFieldConfigService);
  private readonly dialog = inject(MatDialog);

  readonly statusTone = STATUS_TONE;
  readonly revisionLabels = REVISION_TYPE_LABELS;

  /** Fallback wizard config ('original') for revisions without a frozen snapshot. */
  fieldConfig = signal<SdbipFieldConfig[]>([]);

  cycles = signal<Cycle[]>([]);
  uoms = signal<UnitOfMeasure[]>([]);
  users = signal<User[]>([]);
  allScorecards = signal<Scorecard[]>([]);
  kpis = signal<ScorecardKpi[]>([]);
  revisionLogs = signal<RevisionLog[]>([]);
  /** Quarter targets for the open revision, keyed by KPI id then quarter. */
  qtByKpi = signal<Record<number, Record<number, QuarterTarget>>>({});

  selectedCycleId = signal<number | null>(null);
  /** Selected tab index; ?tab=audit deep-links to the audit trail tab. */
  tabIndex = signal(0);
  selectedScorecardId = signal<number | null>(null);
  reopening = signal<number | null>(null);
  exporting = signal(false);

  // ── KPI table filters (municipalities have many KPIs across departments) ──
  filterQ = signal('');
  filterDept = signal<string | null>(null);
  filterResp = signal<number | null>(null);

  effectiveCycleId = computed<number | null>(() => this.selectedCycleId() ?? this.cycles()[0]?.id ?? null);

  /** Approved organisational SDBIPs — candidates for (or parents of) a revision. */
  originals = computed<Scorecard[]>(() =>
    this.allScorecards().filter((s) => s.scorecardType === 'organisational' && s.status === 'Approved'));

  /** Existing revisions keyed by their parent scorecard id. */
  private revisionsByParent = computed<Map<number, Scorecard>>(() => {
    const map = new Map<number, Scorecard>();
    for (const s of this.allScorecards()) {
      if (s.scorecardType === 'revised' && s.parentScorecardId) map.set(s.parentScorecardId, s);
    }
    return map;
  });

  detailScorecard = computed<Scorecard | null>(() =>
    this.selectedScorecardId()
      ? (this.allScorecards().find((s) => s.id === this.selectedScorecardId()) ?? null)
      : null);

  isDraft = computed<boolean>(() => this.detailScorecard()?.status === 'Draft');

  totalWeighting = computed<number>(() => this.kpis().reduce((sum, k) => sum + (k.weighting ?? 0), 0));

  // ── Revision audit trail table ────────────────────────────────────────────
  /** KPI-level change types shown in the structured audit table. */
  private static readonly KPI_CHANGE_TYPES = new Set([
    'kpi_added', 'kpi_deleted', 'target_revised', 'annual_target_revised', 'kpi_updated',
  ]);

  /** Sequential revision number within the parent SDBIP (Rev 1, Rev 2, ...). */
  revisionNo = computed<number>(() => {
    const sc = this.detailScorecard();
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
    const sc = this.detailScorecard();
    if (sc?.approvedById) return this.getUserName(sc.approvedById);
    const log = this.revisionLogs().find((l) => l.revisionType === 'revision_approved');
    return log?.userName ?? '';
  });

  /** Workflow status in audit-trail vocabulary. */
  auditStatus = computed<string>(() => {
    const status = this.detailScorecard()?.status ?? 'Draft';
    if (status === 'Submitted' || status === 'Reviewed') return 'Pending Approval';
    if (status === 'Returned') return 'Rejected';
    return status;
  });

  /** One row per KPI-level field change, newest first. */
  auditRows = computed(() => {
    const kpiById = new Map(this.kpis().map((k) => [k.id, k]));
    return this.revisionLogs()
      .filter((l) => ReviseSdbipCaptureComponent.KPI_CHANGE_TYPES.has(l.revisionType))
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
    this.revisionLogs().filter((l) => !ReviseSdbipCaptureComponent.KPI_CHANGE_TYPES.has(l.revisionType)));

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

  /** Table columns follow the original SDBIP's frozen wizard config so the
   *  revision table matches the Original compile table exactly. */
  columns = computed<{ key: string; label: string }[]>(() => {
    const sc = this.detailScorecard();
    const snapshot = sc && Array.isArray(sc.fieldConfigSnapshot) && sc.fieldConfigSnapshot.length > 0
      ? sc.fieldConfigSnapshot
      : null;
    return (snapshot ?? this.fieldConfig())
      .filter((f) => f.isIncluded)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((f) => ({
        key: f.fieldKind === 'custom' ? 'custom:' + f.fieldKey : f.fieldKey,
        label: f.fieldLabel,
      }));
  });

  ngOnInit() {
    forkJoin({
      cycles: this.api.get<Cycle[]>('/cycles').pipe(catchError(() => of([] as Cycle[]))),
      uoms: this.api.get<UnitOfMeasure[]>('/units-of-measure').pipe(catchError(() => of([] as UnitOfMeasure[]))),
      // Open employee lookup (not the admin-only endpoint) so every capturer can
      // pick a Responsible Person; inactive users included only for name resolution.
      users: this.api.get<User[]>('/users/lookup', { includeInactive: 1 }).pipe(catchError(() => of([] as User[]))),
    }).subscribe(({ cycles, uoms, users }) => {
      this.cycles.set(Array.isArray(cycles) ? cycles : []);
      this.uoms.set((Array.isArray(uoms) ? uoms : []).filter((x) => x.isActive !== false));
      this.users.set(Array.isArray(users) ? users : []);
      this.loadScorecards();
      // Deep link: /revised-sdbip/capture?sc=<id> opens that revision directly.
      const scParam = Number(this.route.snapshot.queryParamMap.get('sc'));
      if (scParam) { this.selectedScorecardId.set(scParam); this.loadDetail(scParam); }
      if (this.route.snapshot.queryParamMap.get('tab') === 'audit') this.tabIndex.set(1);
    });
    this.fieldConfigApi.load('original').pipe(
      catchError(() => of([] as SdbipFieldConfig[])),
    ).subscribe((rows) => this.fieldConfig.set(rows));
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

  revisionFor(original: Scorecard): Scorecard | undefined {
    return this.revisionsByParent().get(original.id);
  }

  getUserName(id: number | null | undefined): string {
    if (!id) return '—';
    const u = this.users().find((x) => x.id === id);
    return u ? u.displayName : `User #${id}`;
  }

  // ── Reopen (copy-on-reopen) ─────────────────────────────────────────────
  confirmReopen(sc: Scorecard) {
    this.confirm.confirm({
      title: 'New Revision',
      message: `This creates a separate revised SDBIP copied from "${sc.name}". The original stays approved and read-only; all changes are captured on the revision, and one overall revision reason is captured when the revision is submitted for review.`,
      confirmLabel: 'Create Revision',
    }).then((ok) => { if (ok) this.handleReopen(sc); });
  }

  private handleReopen(sc: Scorecard) {
    this.reopening.set(sc.id);
    this.api.post<Scorecard>(`/scorecards/${sc.id}/revise`, {}).pipe(
      tap((revision) => {
        this.toast.success('Revised SDBIP created', 'The original stays approved; make your changes on the revision.');
        this.allScorecards.update((list) =>
          list.some((s) => s.id === revision.id) ? list : [...list, revision]);
        this.openScorecard(revision);
        this.loadScorecards();
      }),
      catchError((e) => {
        this.toast.error('Could not reopen for revision', e?.error?.error ?? e?.error?.message ?? e?.message);
        return of(null);
      }),
      tap(() => this.reopening.set(null)),
    ).subscribe();
  }

  // ── Navigation ──────────────────────────────────────────────────────────
  openScorecard(sc: Scorecard) {
    this.selectedScorecardId.set(sc.id);
    this.filterQ.set('');
    this.filterDept.set(null);
    this.filterResp.set(null);
    this.loadDetail(sc.id);
  }

  backToList() {
    this.selectedScorecardId.set(null);
    this.kpis.set([]);
    this.qtByKpi.set({});
    this.revisionLogs.set([]);
    this.loadScorecards();
  }

  private loadDetail(scorecardId: number) {
    this.api.get<ScorecardKpi[]>(`/scorecards/${scorecardId}/kpis`).pipe(
      catchError(() => of([] as ScorecardKpi[])),
    ).subscribe((r) => this.kpis.set(Array.isArray(r) ? r : []));
    this.api.get<QuarterTarget[]>(`/scorecards/${scorecardId}/quarter-targets`).pipe(
      catchError(() => of([] as QuarterTarget[])),
    ).subscribe((rows) => {
      const byKpi: Record<number, Record<number, QuarterTarget>> = {};
      for (const t of (Array.isArray(rows) ? rows : [])) {
        (byKpi[t.kpiId] ??= {})[t.quarter] = t;
      }
      this.qtByKpi.set(byKpi);
    });
    this.api.get<RevisionLog[]>(`/scorecards/${scorecardId}/revision-logs`).pipe(
      catchError(() => of([] as RevisionLog[])),
    ).subscribe((r) => this.revisionLogs.set(Array.isArray(r) ? r : []));
  }

  // ── KPI table (mirrors the Original compile table) ──────────────────────
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

  cellValue(k: ScorecardKpi, key: string): string {
    if (key.startsWith('custom:')) {
      const v = k.customFields?.[key.slice(7)];
      if (v === null || v === undefined || v === '') return '—';
      if (typeof v === 'boolean') return v ? 'Yes' : 'No';
      return String(v);
    }
    if (key.length === 2 && key.startsWith('q')) {
      const v = this.qtByKpi()[k.id]?.[Number(key[1])]?.targetValue;
      return v || '—';
    }
    if (key === 'unitOfMeasureId') {
      const u = this.uoms().find((x) => x.id === k.unitOfMeasureId);
      return u ? u.name : '—';
    }
    if (key === 'responsiblePostId') {
      const u = this.users().find((x) => x.id === k.responsiblePostId);
      return u?.displayName ?? '—';
    }
    if (key === 'isCumulative') return k.isCumulative ? 'Yes' : 'No';
    const v = (k as unknown as Record<string, unknown>)[key];
    return v === null || v === undefined || v === '' ? '—' : String(v);
  }

  /** A copied KPI whose targets deviate from the approved baseline. */
  isRevisedKpi(k: ScorecardKpi): boolean {
    const rows = Object.values(this.qtByKpi()[k.id] ?? {});
    return rows.some((t) => t.isApprovedBaseline && (t.baselineTargetValue ?? '') !== t.targetValue);
  }

  /** A KPI added during the revision — it has no approved-baseline targets. */
  isNewKpi(k: ScorecardKpi): boolean {
    const rows = Object.values(this.qtByKpi()[k.id] ?? {});
    return !rows.some((t) => t.isApprovedBaseline);
  }

  // ── KPI editing via the shared dialog ───────────────────────────────────
  private dialogFieldConfig(): SdbipFieldConfig[] {
    const sc = this.detailScorecard();
    const snapshot = sc && Array.isArray(sc.fieldConfigSnapshot) && sc.fieldConfigSnapshot.length > 0
      ? sc.fieldConfigSnapshot
      : null;
    return snapshot ?? this.fieldConfig();
  }

  openKpi(k: ScorecardKpi) {
    const sc = this.detailScorecard();
    if (!sc) return;
    this.dialog.open(AddKpiDialogComponent, {
      data: {
        scorecardId: sc.id,
        fieldConfig: this.dialogFieldConfig(),
        uoms: this.uoms(),
        users: this.users(),
        kpi: k,
        readOnly: !this.isDraft() || k.status !== 'Draft',
        revision: true,
      } satisfies AddKpiDialogData,
      panelClass: 'plat-dialog',
      autoFocus: false,
      maxWidth: '92vw',
    }).afterClosed().subscribe((saved: ScorecardKpi | null | undefined) => {
      if (saved) this.loadDetail(sc.id);
    });
  }

  openNewKpi() {
    const sc = this.detailScorecard();
    if (!sc || !this.isDraft()) return;
    this.dialog.open(AddKpiDialogComponent, {
      data: {
        scorecardId: sc.id,
        fieldConfig: this.dialogFieldConfig(),
        uoms: this.uoms(),
        users: this.users(),
        revision: true,
      } satisfies AddKpiDialogData,
      panelClass: 'plat-dialog',
      autoFocus: false,
      maxWidth: '92vw',
    }).afterClosed().subscribe((created: ScorecardKpi | null | undefined) => {
      if (created) this.loadDetail(sc.id);
    });
  }

  // ── Submit for review ───────────────────────────────────────────────────
  handleSubmitForReview() {
    const scorecardId = this.selectedScorecardId();
    if (!scorecardId) return;
    this.confirm.prompt({
      title: 'Submit Revised SDBIP',
      message: 'This submits the complete revised SDBIP for review. Provide the overall reason for this revision — it is recorded in the revision log.',
      inputLabel: 'Revision Reason',
      inputPlaceholder: 'e.g. Mid-year budget adjustment approved by Council',
      confirmLabel: 'Submit for Review',
    }).then((reason) => {
      if (reason === null) return;
      this.api.post(`/scorecards/${scorecardId}/transition`, { action: 'submit', comments: reason }).pipe(
        tap(() => {
          this.toast.success('Revised SDBIP submitted for review');
          this.backToList();
        }),
        catchError((e) => { this.toast.error('Error', e?.error?.error ?? e?.error?.message ?? 'Failed to submit'); return of(null); }),
      ).subscribe();
    });
  }

  trackById(_: number, x: { id: number }): number { return x.id; }

  /** Download the revision audit trail as Excel, PDF, or Word. */
  exportAudit(format: 'xlsx' | 'pdf' | 'docx') {
    const sc = this.detailScorecard();
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
  trackByKey(_: number, c: { key: string }): string { return c.key; }
}
