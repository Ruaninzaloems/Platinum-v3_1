import { ChangeDetectionStrategy, Component, Inject, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTabsModule } from '@angular/material/tabs';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { catchError, finalize, of, tap } from 'rxjs';
import { ApiService } from '@ins-core/services/api.service';
import { ToastService } from '@ins-core/services/toast.service';
import { ConfirmService } from '@ins-core/services/confirm.service';
import { SdbipFieldConfigService } from '@ins-core/services/sdbip-field-config.service';
import {
  Cycle, Scorecard, ScorecardKpi, KpiQuarterTarget, KpiMonthActivity, UnitOfMeasure, SdbipFieldConfig,
} from '@ins-core/models/domain.model';
import { User } from '@ins-core/models/user.model';
import { AddKpiDialogComponent, AddKpiDialogData } from './add-kpi-dialog.component';
import { PageHeaderComponent } from '@ins-shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '@ins-shared/components/loading-spinner/loading-spinner.component';
import { StatusBadgeComponent } from '@ins-shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '@ins-shared/components/empty-state/empty-state.component';

const MONTH_NAMES: Record<number, string> = {
  1: 'January', 2: 'February', 3: 'March', 4: 'April', 5: 'May', 6: 'June',
  7: 'July', 8: 'August', 9: 'September', 10: 'October', 11: 'November', 12: 'December',
};
const QUARTER_MONTHS: Record<number, number[]> = {
  1: [7, 8, 9], 2: [10, 11, 12], 3: [1, 2, 3], 4: [4, 5, 6],
};

// ─── New SDBIP Dialog ──────────────────────────────────────────────────────
interface NewSdbipDialogData { cycleLabel: string; }

@Component({
  selector: 'app-new-sdbip-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <h2 mat-dialog-title>New SDBIP</h2>
    <form (ngSubmit)="save()" #f="ngForm">
      <mat-dialog-content class="content">
        <p class="cycle-note">Cycle: <strong>{{ data.cycleLabel }}</strong></p>
        <mat-form-field appearance="outline">
          <mat-label>SDBIP Name</mat-label>
          <input matInput [(ngModel)]="name" name="name" required placeholder="e.g. SDBIP 2025/2026" />
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Cancel</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="f.invalid">Create</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`.content { display: flex; flex-direction: column; gap: 4px; padding-top: 12px !important; min-width: 380px; } mat-form-field { width: 100%; } .cycle-note { margin: 0 0 8px; color: #64748b; font-size: 13px; }`],
})
export class NewSdbipDialogComponent {
  name = '';
  constructor(public ref: MatDialogRef<NewSdbipDialogComponent, string | null>, @Inject(MAT_DIALOG_DATA) public data: NewSdbipDialogData) {}
  save() {
    const n = this.name.trim();
    if (n) this.ref.close(n);
  }
}

@Component({
  selector: 'app-capture-sdbip',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatCheckboxModule, MatTabsModule, DragDropModule,
    PageHeaderComponent, LoadingSpinnerComponent, StatusBadgeComponent, EmptyStateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './capture-sdbip.component.html',
  styleUrls: ['./capture-sdbip.component.scss'],
})
export class CaptureSdbipComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly fieldConfigApi = inject(SdbipFieldConfigService);
  private readonly dialog = inject(MatDialog);

  // Field configuration (Scorecard Wizard)
  fieldConfig = signal<SdbipFieldConfig[]>([]);
  visibleFields = computed<SdbipFieldConfig[]>(() => SdbipFieldConfigService.visiblePrimary(this.fieldConfig()));
  customFieldDefs = computed<SdbipFieldConfig[]>(() => SdbipFieldConfigService.customFields(this.fieldConfig()));
  customForm: Record<string, string | number | boolean | null> = {};

  // Lookups
  loading = signal(true);
  cycles = signal<Cycle[]>([]);
  uoms = signal<UnitOfMeasure[]>([]);
  users = signal<User[]>([]);
  /** Active employees only, alphabetical — the choices offered in user dropdowns. */
  activeUsers = computed<User[]>(() =>
    this.users()
      .filter((u) => u.isActive !== false)
      .sort((a, b) => a.displayName.localeCompare(b.displayName)));
  selectedCycleId = signal<number | null>(null);
  effectiveCycleId = computed<number | null>(() => this.selectedCycleId() ?? this.cycles()[0]?.id ?? null);

  /** Dropdown choices: active employees, plus the currently-assigned person even
   *  if they have since been terminated (so existing assignments stay visible). */
  userOptions(selectedId: unknown): User[] {
    const base = this.activeUsers();
    const id = typeof selectedId === 'number' ? selectedId : null;
    if (id && !base.some((u) => u.id === id)) {
      const cur = this.users().find((u) => u.id === id);
      if (cur) return [...base, cur].sort((a, b) => a.displayName.localeCompare(b.displayName));
    }
    return base;
  }

  // Data
  scorecards = signal<Scorecard[]>([]);
  kpis = signal<ScorecardKpi[]>([]);
  activities = signal<KpiMonthActivity[]>([]);
  tasks = signal<KpiMonthActivity[]>([]);

  // Panel state (SDBIP Management list)
  expandedIds = signal<Set<number>>(new Set());
  kpisBySc = signal<Record<number, ScorecardKpi[]>>({});
  qtBySc = signal<Record<number, Record<number, Record<number, string>>>>({});

  // Selection
  selectedScorecardId = signal<number | null>(null);
  selectedKpiId = signal<number | null>(null);
  isNewKpi = signal(false);
  selectedQuarter = signal(1);
  activeTabIndex = signal(0);
  saving = signal(false);
  /** When the detail page is opened only for Tasks access on an editable KPI,
   *  Basic Details stays locked — edits must go through the shared dialog. */
  basicLocked = signal(false);

  selectedScorecard = computed<Scorecard | null>(() => this.scorecards().find((s) => s.id === this.selectedScorecardId()) ?? null);
  selectedKpi = computed<ScorecardKpi | null>(() => this.kpis().find((k) => k.id === this.selectedKpiId()) ?? null);
  // A KPI is editable only while it is in Draft: before the SDBIP is
  // submitted for review, or after the reviewer returns it. Submitted,
  // Reviewed and Approved KPIs are view-only for the capturer.
  isReadOnly = computed(() => {
    const sc = this.selectedScorecard();
    if (!sc || sc.status === 'Approved') return true;
    if (this.isNewKpi()) return false;
    return this.selectedKpi()?.status !== 'Draft';
  });

  // Forms
  kpiForm = this.emptyKpiForm();
  activityForm: { month: number; description: string; dueDate: string } = { month: 7, description: '', dueDate: '' };
  taskForm: { taskName: string; ownerId: number | null; quarter: number; financialTarget: string; portfolioOfEvidence: string } =
    { taskName: '', ownerId: null, quarter: 1, financialTarget: '', portfolioOfEvidence: '' };
  showNewActivity = signal(false);
  showNewTask = signal(false);

  ngOnInit() {
    this.loadAll();
    this.fieldConfigApi.load('original').pipe(
      catchError(() => of([] as SdbipFieldConfig[])),
    ).subscribe((rows) => this.fieldConfig.set(rows));
  }

  // ── Table columns driven by the Original SDBIP Scorecard Wizard config ──
  // For Approved (locked) scorecards the config snapshot frozen at approval
  // time is used, so later wizard changes never alter an approved SDBIP.
  private columnsFromConfig(cfg: SdbipFieldConfig[]): { key: string; label: string }[] {
    return cfg
      .filter((f) => f.isIncluded)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((f) => ({
        key: f.fieldKind === 'custom' ? 'custom:' + f.fieldKey : f.fieldKey,
        label: f.fieldLabel,
      }));
  }

  columnsFor(sc: Scorecard): { key: string; label: string }[] {
    const snapshot = sc.status === 'Approved' && Array.isArray(sc.fieldConfigSnapshot) && sc.fieldConfigSnapshot.length > 0
      ? sc.fieldConfigSnapshot
      : null;
    return this.columnsFromConfig(snapshot ?? this.fieldConfig());
  }

  displayKpiStatus(status: string): string {
    return status;
  }

  cellValue(sc: Scorecard, k: ScorecardKpi, key: string): string {
    if (key.startsWith('custom:')) {
      const v = k.customFields?.[key.slice(7)];
      if (v === null || v === undefined || v === '') return '—';
      if (typeof v === 'boolean') return v ? 'Yes' : 'No';
      return String(v);
    }
    if (key.length === 2 && key.startsWith('q')) {
      const v = this.qtBySc()[sc.id]?.[k.id]?.[Number(key[1])];
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

  // ── Panel expand / collapse ─────────────────────────────────────────────
  isExpanded(id: number): boolean { return this.expandedIds().has(id); }

  togglePanel(sc: Scorecard) {
    const next = new Set(this.expandedIds());
    if (next.has(sc.id)) {
      next.delete(sc.id);
    } else {
      next.add(sc.id);
      this.loadPanelData(sc.id);
    }
    this.expandedIds.set(next);
  }

  panelKpis(scId: number): ScorecardKpi[] { return this.kpisBySc()[scId] ?? []; }

  // ── KPI table pagination (per scorecard) ────────────────────────────────
  readonly kpiPageSize = 10;
  pageBySc = signal<Record<number, number>>({});

  kpiPage(scId: number): number {
    const total = this.kpiPageCount(scId);
    const p = this.pageBySc()[scId] ?? 0;
    return Math.min(p, Math.max(0, total - 1));
  }
  kpiPageCount(scId: number): number {
    return Math.max(1, Math.ceil(this.panelKpis(scId).length / this.kpiPageSize));
  }
  pagedKpis(scId: number): ScorecardKpi[] {
    const start = this.kpiPage(scId) * this.kpiPageSize;
    return this.panelKpis(scId).slice(start, start + this.kpiPageSize);
  }
  setKpiPage(scId: number, page: number) {
    const clamped = Math.min(Math.max(0, page), this.kpiPageCount(scId) - 1);
    this.pageBySc.update((m) => ({ ...m, [scId]: clamped }));
  }
  kpiPageStart(scId: number): number { return this.kpiPage(scId) * this.kpiPageSize; }
  kpiRangeLabel(scId: number): string {
    const total = this.panelKpis(scId).length;
    if (total === 0) return '';
    const start = this.kpiPageStart(scId) + 1;
    const end = Math.min(start + this.kpiPageSize - 1, total);
    return `${start}–${end} of ${total}`;
  }

  /** Drag & drop reorder of KPIs within a Draft SDBIP. Optimistic update, then persist. */
  dropKpi(sc: Scorecard, event: CdkDragDrop<ScorecardKpi[]>) {
    if (sc.status !== 'Draft' || event.previousIndex === event.currentIndex) return;
    const before = this.panelKpis(sc.id);
    let list = [...before];
    // Drag indices are relative to the visible page; convert to absolute positions.
    const offset = this.kpiPageStart(sc.id);
    moveItemInArray(list, offset + event.previousIndex, offset + event.currentIndex);
    list = list.map((k, i) => ({ ...k, kpiNumber: String(i + 1) }));
    this.kpisBySc.update((m) => ({ ...m, [sc.id]: list }));
    this.api.put<ScorecardKpi[]>(`/scorecards/${sc.id}/kpis/reorder`, { kpiIds: list.map((k) => k.id) }).pipe(
      tap((rows) => {
        if (Array.isArray(rows)) this.kpisBySc.update((m) => ({ ...m, [sc.id]: rows }));
      }),
      catchError((e) => {
        this.kpisBySc.update((m) => ({ ...m, [sc.id]: before }));
        this.toast.error('Could not reorder KPIs', e?.error?.error ?? e?.error?.message ?? e?.message);
        return of(null);
      }),
    ).subscribe();
  }

  returnedKpis(scId: number): ScorecardKpi[] {
    return this.panelKpis(scId).filter((k) => k.status === 'Draft' && !!k.returnComments);
  }

  loadPanelData(scId: number) {
    this.api.get<ScorecardKpi[]>(`/scorecards/${scId}/kpis`).pipe(
      catchError(() => of([] as ScorecardKpi[])),
      tap((r) => this.kpisBySc.update((m) => ({ ...m, [scId]: Array.isArray(r) ? r : [] }))),
    ).subscribe();
    this.api.get<KpiQuarterTarget[]>(`/scorecards/${scId}/quarter-targets`).pipe(
      catchError(() => of([] as KpiQuarterTarget[])),
      tap((rows) => {
        const byKpi: Record<number, Record<number, string>> = {};
        for (const t of (Array.isArray(rows) ? rows : [])) {
          (byKpi[t.kpiId] ??= {})[t.quarter] = t.targetValue;
        }
        this.qtBySc.update((m) => ({ ...m, [scId]: byKpi }));
      }),
    ).subscribe();
  }

  // ── Field config helpers ────────────────────────────────────────────────
  show(key: string): boolean { return SdbipFieldConfigService.isVisible(this.fieldConfig(), key); }
  req(key: string): boolean { return SdbipFieldConfigService.isRequired(this.fieldConfig(), key); }

  controlKind(f: SdbipFieldConfig): string {
    // The KPI number is server-assigned (kept sequential on add/delete/reorder).
    if (f.fieldKind === 'primary' && f.fieldKey === 'kpiNumber') return 'kpiNumberAuto';
    if (f.fieldKey === 'responsiblePostId' || f.fieldKey === 'custodianPostId') return 'userSelect';
    if (f.fieldKey === 'unitOfMeasureId') return 'uomSelect';
    if (f.fieldType === 'boolean') return 'checkbox';
    if (f.fieldType === 'number') return 'number';
    if (f.fieldType === 'percent') return 'number';
    if (f.fieldType === 'textarea') return 'textarea';
    if (f.fieldType === 'date') return 'date';
    return 'text';
  }

  fieldValue(key: string): unknown {
    return (this.kpiForm as unknown as Record<string, unknown>)[key];
  }
  setFieldValue(key: string, value: unknown) {
    (this.kpiForm as unknown as Record<string, unknown>)[key] = value;
  }

  private isEmptyValue(v: unknown): boolean {
    return v === null || v === undefined || v === '' || (typeof v === 'number' && Number.isNaN(v));
  }

  missingRequired(): string[] {
    const missing: string[] = [];
    for (const f of this.visibleFields()) {
      if (!f.isRequired || f.fieldType === 'boolean') continue;
      if (f.fieldKey === 'kpiNumber') continue; // auto-assigned by the server
      if (f.fieldKey === 'weighting' || f.fieldKey === 'annualBudgetTarget') {
        const v = this.fieldValue(f.fieldKey);
        if (this.isEmptyValue(v)) missing.push(f.fieldLabel);
        continue;
      }
      if (this.isEmptyValue(this.fieldValue(f.fieldKey))) missing.push(f.fieldLabel);
    }
    for (const f of this.customFieldDefs()) {
      if (f.isRequired && f.fieldType !== 'boolean' && this.isEmptyValue(this.customForm[f.fieldKey])) {
        missing.push(f.fieldLabel);
      }
    }
    return missing;
  }

  canSaveKpi(): boolean { return this.missingRequired().length === 0; }

  // ── Loading ─────────────────────────────────────────────────────────────
  loadAll() {
    this.loading.set(true);
    this.api.get<Cycle[]>('/cycles').pipe(
      catchError(() => of([] as Cycle[])),
      tap((cs) => this.cycles.set(Array.isArray(cs) ? cs : [])),
    ).subscribe(() => {
      this.loadLookups();
      this.loadScorecards();
    });
  }

  private loadLookups() {
    // Units of Measure come from OPMS Configuration for the active cycle;
    // only active units are offered when capturing KPIs.
    const cycleId = this.effectiveCycleId();
    this.api.get<UnitOfMeasure[]>('/units-of-measure', cycleId ? { cycleId } : undefined).pipe(
      catchError(() => of([] as UnitOfMeasure[])),
      tap((u) => this.uoms.set((Array.isArray(u) ? u : []).filter((x) => x.isActive !== false))),
    ).subscribe();
    // Open employee lookup (not the admin-only endpoint) so every capturer can
    // pick a Responsible Person; inactive users are included only so existing
    // assignments still resolve to a name.
    this.api.get<User[]>('/users/lookup', { includeInactive: 1 }).pipe(
      catchError(() => of([] as User[])),
      tap((u) => this.users.set(Array.isArray(u) ? u : [])),
    ).subscribe();
  }

  loadScorecards() {
    const cycleId = this.effectiveCycleId();
    if (!cycleId) { this.scorecards.set([]); this.loading.set(false); return; }
    this.api.get<Scorecard[]>('/scorecards', { cycleId }).pipe(
      catchError(() => of([] as Scorecard[])),
      tap((r) => {
        // Only the original organisational SDBIPs belong here; revised copies
        // are managed on the Revised SDBIP pages.
        const list = (Array.isArray(r) ? r : []).filter((s) => s.scorecardType === 'organisational');
        this.scorecards.set(list);
        // Auto-expand the first SDBIP so its KPI table is visible immediately
        if (list.length > 0 && this.expandedIds().size === 0) {
          this.expandedIds.set(new Set([list[0].id]));
          this.loadPanelData(list[0].id);
        }
      }),
      finalize(() => this.loading.set(false)),
    ).subscribe();
  }

  newSdbip() {
    const cycleId = this.effectiveCycleId();
    if (!cycleId) { this.toast.error('No cycle selected'); return; }
    const cycleLabel = this.cycles().find((c) => c.id === cycleId)?.financialYearLabel ?? '';
    this.dialog.open(NewSdbipDialogComponent, {
      data: { cycleLabel } satisfies NewSdbipDialogData,
      panelClass: 'plat-dialog',
      autoFocus: false,
    }).afterClosed().subscribe((name: string | null | undefined) => {
      if (!name) return;
      this.api.post<Scorecard>('/scorecards', { name, cycleId, scorecardType: 'organisational' }).pipe(
        tap((sc) => {
          this.toast.success('SDBIP created');
          this.loadScorecards();
          if (sc?.id) this.openScorecard(sc);
        }),
        catchError((e) => {
          this.toast.error('Create failed', e?.error?.error ?? e?.message);
          return of(null);
        }),
      ).subscribe();
    });
  }

  loadKpis(scorecardId: number) {
    this.api.get<ScorecardKpi[]>(`/scorecards/${scorecardId}/kpis`).pipe(
      catchError(() => of([] as ScorecardKpi[])),
      tap((r) => this.kpis.set(Array.isArray(r) ? r : [])),
    ).subscribe();
  }

  loadActivities(kpiId: number, quarter: number) {
    this.api.get<KpiMonthActivity[]>(`/scorecard-kpis/${kpiId}/month-activities`, { quarter }).pipe(
      catchError(() => of([] as KpiMonthActivity[])),
      tap((r) => this.activities.set(Array.isArray(r) ? r : [])),
    ).subscribe();
  }
  loadTasks(kpiId: number) {
    this.api.get<KpiMonthActivity[]>(`/scorecard-kpis/${kpiId}/month-activities`, { quarter: 5 }).pipe(
      catchError(() => of([] as KpiMonthActivity[])),
      tap((r) => this.tasks.set(Array.isArray(r) ? r : [])),
    ).subscribe();
  }

  // ── Navigation ──────────────────────────────────────────────────────────
  openScorecard(sc: Scorecard) {
    this.selectedScorecardId.set(sc.id);
    this.kpis.set([]);
    this.loadKpis(sc.id);
  }

  backToScorecards() {
    this.selectedScorecardId.set(null);
    this.selectedKpiId.set(null);
    this.isNewKpi.set(false);
    this.kpis.set([]);
  }

  /** Edit a KPI: editable KPIs open the same dialog as "Add KPI"; locked ones open
   *  the same dialog in view-only mode.
   *  A KPI stays editable only while in Draft (pre-submission, or returned by the reviewer). */
  openKpiRow(sc: Scorecard, k: ScorecardKpi) {
    this.openEditKpiFor(sc, k, !this.isKpiEditable(sc, k));
  }

  /** A KPI is editable only while in Draft (pre-submission, or returned by the reviewer). */
  isKpiEditable(sc: Scorecard, k: ScorecardKpi): boolean {
    return sc.status !== 'Approved' && k.status === 'Draft';
  }

  /** Open the full detail page (used for read-only KPIs and for Tasks access). */
  openKpiPage(sc: Scorecard, k: ScorecardKpi, tabIndex: number, lockBasic = false) {
    this.basicLocked.set(lockBasic);
    this.selectedScorecardId.set(sc.id);
    this.kpis.set(this.panelKpis(sc.id));
    this.loadKpis(sc.id);
    this.openKpiDetail(k);
    this.activeTabIndex.set(tabIndex);
  }

  /** Basic Details tab is read-only when the KPI is locked by workflow OR when
   *  the page was opened for Tasks only (editing happens in the shared dialog). */
  basicReadOnly(): boolean {
    return this.basicLocked() || this.isReadOnly();
  }

  openEditKpiFor(sc: Scorecard, k: ScorecardKpi, readOnly = false) {
    this.dialog.open(AddKpiDialogComponent, {
      data: {
        scorecardId: sc.id,
        fieldConfig: this.fieldConfig(),
        uoms: this.uoms(),
        users: this.users(),
        kpi: k,
        readOnly,
      } satisfies AddKpiDialogData,
      panelClass: 'plat-dialog',
      autoFocus: false,
      maxWidth: '92vw',
    }).afterClosed().subscribe((saved: ScorecardKpi | null | undefined) => {
      if (!saved) return;
      this.loadPanelData(sc.id);
      this.expandedIds.update((s) => new Set(s).add(sc.id));
    });
  }

  openNewKpiFor(sc: Scorecard) {
    this.dialog.open(AddKpiDialogComponent, {
      data: {
        scorecardId: sc.id,
        fieldConfig: this.fieldConfig(),
        uoms: this.uoms(),
        users: this.users(),
      } satisfies AddKpiDialogData,
      panelClass: 'plat-dialog',
      autoFocus: false,
      maxWidth: '92vw',
    }).afterClosed().subscribe((created: ScorecardKpi | null | undefined) => {
      if (!created) return;
      this.loadPanelData(sc.id);
      this.expandedIds.update((s) => new Set(s).add(sc.id));
    });
  }

  openKpiDetail(k: ScorecardKpi) {
    this.kpiForm = {
      kpiNumber: k.kpiNumber ?? '', description: k.description ?? '',
      idpReference: k.idpReference ?? '', strategicObjective: k.strategicObjective ?? '',
      programme: k.programme ?? '', baseline: k.baseline ?? '',
      annualTarget: k.annualTarget ?? '', weighting: k.weighting ?? 0,
      evidenceSource: k.evidenceSource ?? '', evidencePortfolio: k.evidencePortfolio ?? '',
      fundingSource: k.fundingSource ?? '', budgetDescription: k.budgetDescription ?? '',
      annualBudgetTarget: k.annualBudgetTarget ?? 0, isCumulative: k.isCumulative ?? false,
      unitOfMeasureId: k.unitOfMeasureId ?? null,
      responsiblePostId: k.responsiblePostId ?? null,
      custodianPostId: k.custodianPostId ?? null,
    };
    this.customForm = { ...(k.customFields ?? {}) };
    this.selectedKpiId.set(k.id);
    this.isNewKpi.set(false);
    this.activeTabIndex.set(0);
    this.loadActivities(k.id, this.selectedQuarter());
    this.loadTasks(k.id);
  }

  backToKpiList() {
    const scId = this.selectedScorecardId();
    this.selectedKpiId.set(null);
    this.isNewKpi.set(false);
    this.basicLocked.set(false);
    this.selectedScorecardId.set(null);
    if (scId) {
      this.loadPanelData(scId);
      this.expandedIds.update((s) => new Set(s).add(scId));
    }
    this.loadScorecards();
  }

  onTabChange(idx: number) {
    this.activeTabIndex.set(idx);
  }

  onQuarterChange(q: number) {
    this.selectedQuarter.set(q);
    this.activityForm = { month: QUARTER_MONTHS[q]?.[0] ?? 7, description: '', dueDate: '' };
    const kpiId = this.selectedKpiId();
    if (kpiId) this.loadActivities(kpiId, q);
  }

  // ── Mutations ───────────────────────────────────────────────────────────
  transitionScorecard(action: string, scId?: number) {
    const id = scId ?? this.selectedScorecardId();
    if (!id) return;
    this.api.post(`/scorecards/${id}/transition`, { action }).pipe(
      tap(() => { this.toast.success(`SDBIP ${action === 'submit' ? 'submitted' : action + 'd'}`); this.loadScorecards(); this.loadPanelData(id); }),
      catchError((e) => { this.toast.error('Error', e?.error?.error ?? e?.error?.message ?? e?.message); return of(null); }),
    ).subscribe();
  }

  async deleteKpi(kpiId: number, scId?: number) {
    const sc = scId ?? this.selectedScorecardId();
    const scorecard = this.scorecards().find((s) => s.id === sc);
    if (scorecard?.status !== 'Draft') return;
    const ok = await this.confirm.confirm({ title: 'Delete KPI', message: 'Delete this KPI? Its quarterly targets and monthly activities will also be removed.', destructive: true, confirmLabel: 'Delete' });
    if (!ok) return;
    this.api.delete(`/scorecard-kpis/${kpiId}`).pipe(
      tap(() => { this.toast.success('KPI deleted'); if (sc) { this.loadKpis(sc); this.loadPanelData(sc); } }),
      catchError((e) => { this.toast.error('Delete failed', e?.error?.error ?? e?.error?.message ?? e?.message); return of(null); }),
    ).subscribe();
  }

  saveKpi() {
    if (this.basicReadOnly()) return;
    const f = this.kpiForm;
    const missing = this.missingRequired();
    if (missing.length > 0) {
      this.toast.error('Missing required fields', missing.join(', '));
      return;
    }
    this.saving.set(true);
    const payload = {
      kpiNumber: f.kpiNumber, description: f.description, annualTarget: f.annualTarget,
      idpReference: f.idpReference || undefined, strategicObjective: f.strategicObjective || undefined,
      programme: f.programme || undefined, baseline: f.baseline || undefined,
      weighting: Number(f.weighting) || 0,
      evidenceSource: f.evidenceSource || undefined, evidencePortfolio: f.evidencePortfolio || undefined,
      fundingSource: f.fundingSource || undefined, budgetDescription: f.budgetDescription || undefined,
      annualBudgetTarget: f.annualBudgetTarget != null ? Number(f.annualBudgetTarget) : undefined,
      isCumulative: !!f.isCumulative,
      unitOfMeasureId: f.unitOfMeasureId ?? undefined,
      responsiblePostId: f.responsiblePostId ?? undefined,
      custodianPostId: f.custodianPostId ?? undefined,
      customFields: this.buildCustomFieldsPayload(),
    };
    if (this.isNewKpi()) {
      const sc = this.selectedScorecardId(); if (!sc) { this.saving.set(false); return; }
      this.api.post<ScorecardKpi>(`/scorecards/${sc}/kpis`, payload).pipe(
        tap((created) => {
          this.toast.success('KPI created');
          this.selectedKpiId.set(created.id);
          this.isNewKpi.set(false);
          this.loadKpis(sc);
          this.activeTabIndex.set(1);
        }),
        catchError((e) => { this.toast.error('Error saving KPI', e?.error?.message ?? e?.message); return of(null); }),
        finalize(() => this.saving.set(false)),
      ).subscribe();
    } else {
      const id = this.selectedKpiId(); if (!id) { this.saving.set(false); return; }
      this.api.patch<ScorecardKpi>(`/scorecard-kpis/${id}`, payload).pipe(
        tap(() => { this.toast.success('KPI saved'); const sc = this.selectedScorecardId(); if (sc) this.loadKpis(sc); }),
        catchError((e) => { this.toast.error('Error saving KPI', e?.error?.message ?? e?.message); return of(null); }),
        finalize(() => this.saving.set(false)),
      ).subscribe();
    }
  }

  addActivity() {
    if (this.isReadOnly()) return;
    const id = this.selectedKpiId(); if (!id || !this.activityForm.description) return;
    this.api.post(`/scorecard-kpis/${id}/month-activities`, {
      quarter: this.selectedQuarter(),
      month: this.activityForm.month,
      description: this.activityForm.description,
      dueDate: this.activityForm.dueDate || new Date().toISOString().split('T')[0],
    }).pipe(
      tap(() => {
        this.toast.success('Activity added');
        this.showNewActivity.set(false);
        this.activityForm = { month: QUARTER_MONTHS[this.selectedQuarter()]?.[0] ?? 7, description: '', dueDate: '' };
        this.loadActivities(id, this.selectedQuarter());
      }),
      catchError((e) => { this.toast.error('Error adding activity', e?.error?.message ?? e?.message); return of(null); }),
    ).subscribe();
  }

  toggleActivity(a: KpiMonthActivity) {
    if (this.isReadOnly()) return;
    const next = a.status === 'Completed' ? 'Pending' : 'Completed';
    this.api.patch(`/month-activities/${a.id}`, { status: next }).pipe(
      tap(() => { const id = this.selectedKpiId(); if (id) this.loadActivities(id, this.selectedQuarter()); }),
      catchError(() => { this.toast.error('Error'); return of(null); }),
    ).subscribe();
  }

  async deleteActivity(a: KpiMonthActivity) {
    if (this.isReadOnly()) return;
    const ok = await this.confirm.confirm({ title: 'Remove activity', message: 'Remove this activity?', destructive: true, confirmLabel: 'Remove' });
    if (!ok) return;
    this.api.delete(`/month-activities/${a.id}`).pipe(
      tap(() => { this.toast.success('Activity removed'); const id = this.selectedKpiId(); if (id) this.loadActivities(id, this.selectedQuarter()); }),
      catchError(() => { this.toast.error('Error'); return of(null); }),
    ).subscribe();
  }

  addTask() {
    if (this.isReadOnly()) return;
    const id = this.selectedKpiId(); if (!id || !this.taskForm.taskName) return;
    this.api.post(`/scorecard-kpis/${id}/month-activities`, {
      quarter: 5,
      month: this.taskForm.quarter,
      description: JSON.stringify({
        taskName: this.taskForm.taskName,
        financialTarget: this.taskForm.financialTarget,
        portfolioOfEvidence: this.taskForm.portfolioOfEvidence,
      }),
      ownerId: this.taskForm.ownerId ?? undefined,
      dueDate: 'task',
    }).pipe(
      tap(() => {
        this.toast.success('Task added');
        this.showNewTask.set(false);
        this.taskForm = { taskName: '', ownerId: null, quarter: 1, financialTarget: '', portfolioOfEvidence: '' };
        this.loadTasks(id);
      }),
      catchError((e) => { this.toast.error('Error adding task', e?.error?.message ?? e?.message); return of(null); }),
    ).subscribe();
  }

  async deleteTask(t: KpiMonthActivity) {
    if (this.isReadOnly()) return;
    const ok = await this.confirm.confirm({ title: 'Delete task', message: 'Delete this task?', destructive: true, confirmLabel: 'Delete' });
    if (!ok) return;
    this.api.delete(`/month-activities/${t.id}`).pipe(
      tap(() => { this.toast.success('Task deleted'); const id = this.selectedKpiId(); if (id) this.loadTasks(id); }),
      catchError(() => { this.toast.error('Error'); return of(null); }),
    ).subscribe();
  }

  // ── Helpers ─────────────────────────────────────────────────────────────
  parseTask(act: KpiMonthActivity): { taskName: string; financialTarget: string; portfolioOfEvidence: string; quarter: number } {
    try {
      const p = JSON.parse(act.description);
      return {
        taskName: p.taskName ?? act.description,
        financialTarget: p.financialTarget ?? '',
        portfolioOfEvidence: p.portfolioOfEvidence ?? '',
        quarter: act.month,
      };
    } catch {
      return { taskName: act.description, financialTarget: '', portfolioOfEvidence: '', quarter: act.month };
    }
  }

  customEntries(k: ScorecardKpi): { label: string; value: string }[] {
    return SdbipFieldConfigService.customDisplayEntries(this.fieldConfig(), k.customFields);
  }

  buildCustomFieldsPayload(): Record<string, string | number | boolean | null> {
    const out: Record<string, string | number | boolean | null> = { ...this.customForm };
    for (const def of this.customFieldDefs()) {
      const v = this.customForm[def.fieldKey];
      out[def.fieldKey] = v === undefined || v === '' ? null : v;
    }
    return out;
  }

  monthsForQuarter(q: number): number[] { return QUARTER_MONTHS[q] ?? []; }
  monthName(m: number): string { return MONTH_NAMES[m] ?? String(m); }

  trackById(_: number, x: { id: number }): number { return x.id; }
  trackByFieldKey(_: number, f: SdbipFieldConfig): string { return f.fieldKind + ':' + f.fieldKey; }

  private emptyKpiForm() {
    return {
      kpiNumber: '', description: '', idpReference: '', strategicObjective: '',
      programme: '', baseline: '', annualTarget: '', weighting: 0,
      evidenceSource: '', evidencePortfolio: '', fundingSource: '',
      budgetDescription: '', annualBudgetTarget: 0 as number, isCumulative: false,
      unitOfMeasureId: null as number | null,
      responsiblePostId: null as number | null,
      custodianPostId: null as number | null,
    };
  }
}
