import {
  AfterViewInit, Component, DestroyRef, OnInit, ViewChild, computed, inject, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl, FormArray, FormBuilder, FormControl, FormGroup,
  ReactiveFormsModule, ValidationErrors, Validators
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort, SortDirection } from '@angular/material/sort';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import {
  Subject, debounceTime, distinctUntilChanged, switchMap, tap
} from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LookupService } from '../../../../core/services/lookup.service';
import { PositionApprovalService } from '../../../../core/services/position-approval.service';
import { OvertimeConfigService } from '../../../../core/services/overtime-config.service';
import {
  ActingAppointment, EmployeeLookup, ImportRowError, ImportValidationResult,
  PositionApprovalConfig, PositionListItem, PositionLookup, PositionStatusFilter,
  PositionsSummary, ReportingRelationship
} from '../../../../core/models/position-approval.model';

interface ReportingRelationshipForm {
  reportsToPositionId: FormControl<string>;
  reportsToPositionDescription: FormControl<string>;
  startDate: FormControl<Date | null>;
  endDate: FormControl<Date | null>;
}

interface ActingAppointmentForm {
  actingEmployeeId: FormControl<string>;
  actingEmployeeName: FormControl<string>;
  actingInPositionId: FormControl<string>;
  actingInPositionDescription: FormControl<string>;
  startDate: FormControl<Date | null>;
  endDate: FormControl<Date | null>;
}

interface PositionApprovalForm {
  isOvertimeRecommender: FormControl<boolean>;
  isOvertimeApprover: FormControl<boolean>;
  isDepartmentExcessOvertimeApprover: FormControl<boolean>;
  reportingRelationships: FormArray<FormGroup<ReportingRelationshipForm>>;
  actingAppointments: FormArray<FormGroup<ActingAppointmentForm>>;
}

@Component({
  selector: 'app-position-approval-setup',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatAutocompleteModule,
    MatCheckboxModule, MatButtonModule, MatIconModule, MatTableModule,
    MatPaginatorModule, MatSortModule, MatDatepickerModule, MatNativeDateModule,
    MatSnackBarModule, MatProgressBarModule, MatProgressSpinnerModule,
    MatTooltipModule, MatDividerModule
  ],
  templateUrl: './position-approval-setup.component.html',
  styleUrls: ['./position-approval-setup.component.scss']
})
export class PositionApprovalSetupComponent implements OnInit, AfterViewInit {
  private fb = inject(FormBuilder);
  private lookups = inject(LookupService);
  private svc = inject(PositionApprovalService);
  private cfgSvc = inject(OvertimeConfigService);
  private snack = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  // Module-level gating flag (Business Rule #1).
  multipleApprovalEnabled = signal<boolean>(false);
  loadingConfig = signal<boolean>(true);

  // ---------- list view state ----------
  summary = signal<PositionsSummary>({ total: 0, configured: 0, notConfigured: 0 });
  rows = signal<PositionListItem[]>([]);
  totalRows = signal<number>(0);
  loadingList = signal<boolean>(false);

  searchTerm = signal<string>('');
  statusFilter = signal<PositionStatusFilter>('all');
  pageIndex = signal<number>(0);
  pageSize = signal<number>(25);

  // Active sort column / direction. Empty direction means "no sort applied"
  // and the server will fall back to its default description-asc order.
  sortActive = signal<string>('');
  sortDirection = signal<SortDirection>('');

  displayedColumns = ['id', 'description', 'departmentName', 'divisionCode', 'employeeId', 'employeeCode', 'employeeFirstName', 'employeeSurname', 'reportsTo', 'status', 'actions'];

  // Inputs into the list query pipeline. We drive loadList through a single
  // switchMap so rapid changes (typing in search, switching chips, paging)
  // cancel the previous in-flight request instead of racing it.
  private searchInput$ = new Subject<string>();
  private query$ = new Subject<void>();

  @ViewChild(MatPaginator) paginator?: MatPaginator;

  // ---------- configure form state ----------
  selectedPosition = signal<PositionListItem | PositionLookup | null>(null);
  saving = signal(false);
  loadingConfigure = signal(false);

  // ---------- report export state ----------
  exportingReport = signal(false);

  // ---------- import state ----------
  importLoading = signal(false);
  importDialogOpen = signal(false);
  importValidation = signal<ImportValidationResult | null>(null);
  importConfirming = signal(false);
  importErrorsExpanded = signal(false);

  allPositions = signal<PositionLookup[]>([]);
  allEmployees = signal<EmployeeLookup[]>([]);

  reportingDisplayedColumns = ['reportsToPosition', 'empId', 'empCode', 'empFirstName', 'empSurname', 'startDate', 'endDate', 'actions'];

  // O(1) lookup: positionId → PositionLookup (with employee fields).
  // Rebuilt only when allPositions changes (single computed pass).
  positionMap = computed(() => {
    const m = new Map<string, PositionLookup>();
    for (const p of this.allPositions()) m.set(p.id, p);
    return m;
  });
  actingDisplayedColumns = ['employee', 'position', 'startDate', 'endDate', 'actions'];

  form: FormGroup<PositionApprovalForm> = this.fb.group<PositionApprovalForm>({
    isOvertimeRecommender: this.fb.nonNullable.control(false),
    isOvertimeApprover: this.fb.nonNullable.control(false),
    isDepartmentExcessOvertimeApprover: this.fb.nonNullable.control(false),
    reportingRelationships: this.fb.array<FormGroup<ReportingRelationshipForm>>([]),
    actingAppointments: this.fb.array<FormGroup<ActingAppointmentForm>>([])
  });

  // FormArray.controls is a plain JS array — mutating it does not notify any
  // signal. We bump a tick counter on add/remove so the computed re-runs and
  // returns a fresh array reference, which forces mat-table to re-render.
  private reportingRowsTick = signal(0);
  private actingRowsTick = signal(0);
  reportingRows = computed(() => {
    this.reportingRowsTick();
    return [...this.reportingRelationships.controls];
  });
  actingRows = computed(() => {
    this.actingRowsTick();
    return [...this.actingAppointments.controls];
  });

  get reportingRelationships(): FormArray<FormGroup<ReportingRelationshipForm>> {
    return this.form.controls.reportingRelationships;
  }
  get actingAppointments(): FormArray<FormGroup<ActingAppointmentForm>> {
    return this.form.controls.actingAppointments;
  }

  constructor() {
    // Single query pipeline: any change pushes to `query$`, switchMap cancels
    // the previous request, so stale responses never clobber newer state.
    this.query$.pipe(
      tap(() => this.loadingList.set(true)),
      switchMap(() => this.svc.list({
        search: this.searchTerm() || undefined,
        status: this.statusFilter(),
        page: this.pageIndex() + 1,
        pageSize: this.pageSize(),
        sort: this.sortActive() || undefined,
        direction: this.sortDirection() || undefined
      })),
      takeUntilDestroyed()
    ).subscribe({
      next: page => {
        this.rows.set(page.items);
        this.totalRows.set(page.total);
        this.loadingList.set(false);
      },
      error: () => {
        this.loadingList.set(false);
        this.snack.open('Failed to load positions', 'Dismiss', { duration: 3000 });
      }
    });
  }

  ngOnInit(): void {
    this.cfgSvc.get().subscribe({
      next: cfg => {
        this.multipleApprovalEnabled.set(!!cfg.allowOvertimeMultipleApproval);
        this.loadingConfig.set(false);
        if (this.multipleApprovalEnabled()) {
          this.refreshSummary();
          this.loadList();
        }
      },
      error: () => {
        this.loadingConfig.set(false);
        this.snack.open('Failed to load module configuration', 'Dismiss', { duration: 3000 });
      }
    });

    // Pre-load lookup pools used by the inline reporting / acting row pickers.
    this.lookups.positions().subscribe({
      next: p => this.allPositions.set(p),
      error: () => this.allPositions.set([])
    });
    this.lookups.employees().subscribe({
      next: e => this.allEmployees.set(e),
      error: () => this.allEmployees.set([])
    });

    // Debounced server-side search box above the grid (~300ms).
    this.searchInput$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(term => {
      this.pageIndex.set(0);
      this.searchTerm.set(term.trim());
      this.loadList();
    });
  }

  ngAfterViewInit(): void { /* paginator wired via template */ }

  // ---------- list view ----------
  refreshSummary(): void {
    this.svc.summary().subscribe({
      next: s => this.summary.set(s),
      error: () => { /* leave previous values */ }
    });
  }

  loadList(): void {
    // Funnels through the switchMap pipeline in the constructor so that
    // concurrent requests are cancelled (avoids stale-response races).
    this.query$.next();
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value ?? '';
    this.searchInput$.next(value);
  }

  clearSearch(): void {
    // Route through the debounced stream so any in-flight keystroke does
    // not reapply after the user clicks the clear button.
    this.searchInput$.next('');
  }

  onStatusFilterChange(filter: PositionStatusFilter): void {
    if (this.statusFilter() === filter) return;
    this.pageIndex.set(0);
    this.statusFilter.set(filter);
    this.loadList();
  }

  onStatusTabKeydown(event: KeyboardEvent): void {
    const key = event.key;
    if (key !== 'ArrowLeft' && key !== 'ArrowRight') return;
    event.preventDefault();
    const tabs: PositionStatusFilter[] = ['all', 'configured', 'notconfigured'];
    const currentIndex = tabs.indexOf(this.statusFilter());
    const nextIndex = key === 'ArrowRight'
      ? (currentIndex + 1) % tabs.length
      : (currentIndex - 1 + tabs.length) % tabs.length;
    const next = tabs[nextIndex];
    this.onStatusFilterChange(next);
    queueMicrotask(() => {
      const el = document.getElementById('status-tab-' + next) as HTMLElement | null;
      el?.focus();
    });
  }

  onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadList();
  }

  onSortChange(sort: Sort): void {
    // Reset to first page so the user lands at the top of the new ordering
    // rather than mid-way through the previous one.
    this.pageIndex.set(0);
    this.sortActive.set(sort.active ?? '');
    this.sortDirection.set(sort.direction);
    this.loadList();
  }

  // ---------- configure form ----------
  openConfigure(position: PositionListItem | PositionLookup): void {
    this.selectedPosition.set(position);
    this.reportingRelationships.clear();
    this.actingAppointments.clear();
    this.reportingRowsTick.update(v => v + 1);
    this.actingRowsTick.update(v => v + 1);
    this.form.reset({
      isOvertimeRecommender: false,
      isOvertimeApprover: false,
      isDepartmentExcessOvertimeApprover: false
    });

    this.loadingConfigure.set(true);
    this.svc.get(position.id).subscribe({
      next: (cfg: PositionApprovalConfig) => {
        this.form.patchValue({
          isOvertimeRecommender: cfg.isOvertimeRecommender,
          isOvertimeApprover: cfg.isOvertimeApprover,
          isDepartmentExcessOvertimeApprover: cfg.isDepartmentExcessOvertimeApprover
        });
        cfg.reportingRelationships?.forEach(r =>
          this.reportingRelationships.push(this.buildReportingRow(r)));
        cfg.actingAppointments?.forEach(a =>
          this.actingAppointments.push(this.buildActingRow(a)));
        this.reportingRowsTick.update(v => v + 1);
        this.actingRowsTick.update(v => v + 1);
        this.loadingConfigure.set(false);
      },
      error: () => {
        this.loadingConfigure.set(false);
        this.snack.open('Failed to load position config', 'Dismiss', { duration: 3000 });
      }
    });
  }

  backToList(): void {
    this.selectedPosition.set(null);
  }

  selectedPositionDescription(): string {
    const p = this.selectedPosition();
    if (!p) return '';
    return (p as PositionListItem).description
      ?? (p as PositionLookup).description ?? '';
  }

  selectedPositionCode(): string {
    const p = this.selectedPosition();
    if (!p) return '';
    return (p as PositionListItem).positionCode
      ?? (p as PositionLookup).positionCode ?? '';
  }

  // ---------- shared display helpers (used by inline row pickers) ----------
  /**
   * Strip the noise that the legacy Payroll_Position descriptions ship with:
   *   - leading/trailing whitespace and collapsed runs of spaces
   *   - one or more trailing " (NULL)" markers
   *   - one or more trailing " (<id>)" markers that duplicate the position id
   * Returns just the readable description (e.g. "Admin Support (Casual)").
   */
  cleanDescription(id: string | number | null | undefined, description: string | null | undefined): string {
    let s = (description ?? '').replace(/\s+/g, ' ').trim();
    const idStr = id == null ? '' : String(id).trim();
    // Repeatedly strip trailing "(NULL)" or "(<id>)" suffixes.
    while (true) {
      const next = s
        .replace(/\s*\(NULL\)\s*$/i, '')
        .replace(idStr ? new RegExp(`\\s*\\(${idStr}\\)\\s*$`) : /(?!)/, '');
      if (next === s) break;
      s = next.trim();
    }
    return s;
  }

  /** "{id} — {clean description}" used by the inline reporting / acting row pickers. */
  formatPositionLabel(p: PositionLookup | { id: string | number; description: string } | null | undefined): string {
    if (!p) return '';
    return `${p.id} — ${this.cleanDescription(p.id, p.description)}`;
  }

  // ---------- form rows ----------
  /**
   * Open-ended sentinel: rows that should never expire are displayed in the
   * End picker as 9999/12/31. Construct a fresh Date each time so form
   * controls do not share a mutable instance across rows.
   */
  static openEndedSentinel(): Date {
    return new Date(9999, 11, 31);
  }

  /**
   * True when the given date represents the open-ended sentinel. We compare
   * year only because timezone shifts on toISOString round-trips can move the
   * day off 12/31 in UTC, but no real-world end date will ever land in
   * year 9999.
   */
  static isOpenEndedSentinel(d: Date | null | undefined): boolean {
    return !!d && d.getFullYear() === 9999;
  }

  private buildReportingRow(r?: ReportingRelationship): FormGroup<ReportingRelationshipForm> {
    return this.fb.group<ReportingRelationshipForm>({
      reportsToPositionId: this.fb.nonNullable.control(r?.reportsToPositionId ?? '', Validators.required),
      reportsToPositionDescription: this.fb.nonNullable.control(r?.reportsToPositionDescription ?? ''),
      startDate: this.fb.control<Date | null>(r?.startDate ? new Date(r.startDate) : new Date(), Validators.required),
      // Open-ended end: blank from API (null) shows as 9999/12/31, and Add
      // also pre-fills the sentinel so the row reads as "no end" by default.
      endDate: this.fb.control<Date | null>(
        r?.endDate ? new Date(r.endDate) : PositionApprovalSetupComponent.openEndedSentinel())
    }, { validators: [PositionApprovalSetupComponent.dateRangeOrder] });
  }

  private buildActingRow(a?: ActingAppointment): FormGroup<ActingAppointmentForm> {
    return this.fb.group<ActingAppointmentForm>({
      actingEmployeeId: this.fb.nonNullable.control(a?.actingEmployeeId ?? '', Validators.required),
      actingEmployeeName: this.fb.nonNullable.control(a?.actingEmployeeName ?? ''),
      actingInPositionId: this.fb.nonNullable.control(a?.actingInPositionId ?? '', Validators.required),
      actingInPositionDescription: this.fb.nonNullable.control(a?.actingInPositionDescription ?? ''),
      startDate: this.fb.control<Date | null>(a?.startDate ? new Date(a.startDate) : new Date(), Validators.required),
      // Acting endDate is required by the API; default Add (and any null
      // from the API) to the open-ended sentinel instead of today.
      endDate: this.fb.control<Date | null>(
        a?.endDate ? new Date(a.endDate) : PositionApprovalSetupComponent.openEndedSentinel(),
        Validators.required)
    }, { validators: [PositionApprovalSetupComponent.dateRangeOrder] });
  }

  static dateRangeOrder(group: AbstractControl): ValidationErrors | null {
    const start = group.get('startDate')?.value as Date | null;
    const end = group.get('endDate')?.value as Date | null;
    if (start && end && start.getTime() > end.getTime()) {
      return { dateRangeInvalid: true };
    }
    return null;
  }

  addReporting(): void {
    this.reportingRelationships.push(this.buildReportingRow());
    this.reportingRowsTick.update(v => v + 1);
  }
  removeReporting(i: number): void {
    this.reportingRelationships.removeAt(i);
    this.reportingRowsTick.update(v => v + 1);
  }
  addActing(): void {
    this.actingAppointments.push(this.buildActingRow());
    this.actingRowsTick.update(v => v + 1);
  }
  removeActing(i: number): void {
    this.actingAppointments.removeAt(i);
    this.actingRowsTick.update(v => v + 1);
  }

  onReportingPositionInput(event: Event, row: FormGroup<ReportingRelationshipForm>): void {
    const target = event.target as HTMLInputElement;
    row.controls.reportsToPositionDescription.setValue(target.value);
  }
  onActingEmployeeInput(event: Event, row: FormGroup<ActingAppointmentForm>): void {
    const target = event.target as HTMLInputElement;
    row.controls.actingEmployeeName.setValue(target.value);
  }
  onActingPositionInput(event: Event, row: FormGroup<ActingAppointmentForm>): void {
    const target = event.target as HTMLInputElement;
    row.controls.actingInPositionDescription.setValue(target.value);
  }

  filterPositions(query: string | null | undefined): PositionLookup[] {
    const q = (query ?? '').toLowerCase();
    if (!q) return this.allPositions();
    return this.allPositions().filter(p =>
      p.description.toLowerCase().includes(q)
      || p.positionCode.toLowerCase().includes(q)
      || String(p.id).includes(q));
  }
  filterEmployees(query: string | null | undefined): EmployeeLookup[] {
    const q = (query ?? '').toLowerCase();
    if (!q) return this.allEmployees();
    return this.allEmployees().filter(e =>
      e.fullName.toLowerCase().includes(q) ||
      e.employeeNumber.toLowerCase().includes(q) ||
      (e.id ?? '').toLowerCase().includes(q) ||
      (e.positionDescription ?? '').toLowerCase().includes(q));
  }

  setReportingPosition(row: FormGroup<ReportingRelationshipForm>, p: PositionLookup): void {
    row.patchValue({ reportsToPositionId: p.id, reportsToPositionDescription: p.description });
  }
  setActingEmployee(row: FormGroup<ActingAppointmentForm>, e: EmployeeLookup): void {
    row.patchValue({ actingEmployeeId: e.id, actingEmployeeName: e.fullName });
  }
  setActingPosition(row: FormGroup<ActingAppointmentForm>, p: PositionLookup): void {
    row.patchValue({ actingInPositionId: p.id, actingInPositionDescription: p.description });
  }

  save(): void {
    const pos = this.selectedPosition();
    if (!pos || this.form.invalid) return;
    const v = this.form.getRawValue();
    this.saving.set(true);

    const payload: PositionApprovalConfig = {
      positionId: pos.id,
      positionDescription: this.selectedPositionDescription(),
      isOvertimeRecommender: v.isOvertimeRecommender,
      isOvertimeApprover: v.isOvertimeApprover,
      isDepartmentExcessOvertimeApprover: v.isDepartmentExcessOvertimeApprover,
      reportingRelationships: v.reportingRelationships.map((r): ReportingRelationship => ({
        reportsToPositionId: r.reportsToPositionId,
        reportsToPositionDescription: r.reportsToPositionDescription,
        startDate: r.startDate ? r.startDate.toISOString() : new Date().toISOString(),
        // Reporting endDate is nullable on the API. Open-ended sentinel
        // (9999/12/31) maps to null so the round-trip stays stable
        // (load null → display sentinel → save null).
        endDate: r.endDate && !PositionApprovalSetupComponent.isOpenEndedSentinel(r.endDate)
          ? r.endDate.toISOString()
          : null
      })),
      actingAppointments: v.actingAppointments.map((a): ActingAppointment => ({
        actingEmployeeId: a.actingEmployeeId,
        actingEmployeeName: a.actingEmployeeName,
        actingInPositionId: a.actingInPositionId,
        actingInPositionDescription: a.actingInPositionDescription,
        startDate: a.startDate ? a.startDate.toISOString() : new Date().toISOString(),
        // Acting endDate is required on the API. The open-ended sentinel
        // is sent as the sentinel ISO so it round-trips unchanged.
        endDate: a.endDate
          ? a.endDate.toISOString()
          : PositionApprovalSetupComponent.openEndedSentinel().toISOString()
      }))
    };

    this.svc.upsert(pos.id, payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.snack.open('Saved', 'Dismiss', { duration: 2500 });
        this.rows.update(list => list.map(r =>
          r.id === pos.id ? { ...r, isConfigured: true } : r));
        this.refreshSummary();
        this.loadList();
        this.backToList();
      },
      error: err => {
        this.saving.set(false);
        const message = (err?.error?.message as string | undefined) ?? 'Save failed';
        this.snack.open(message, 'Dismiss', { duration: 4000 });
      }
    });
  }

  // ---------- import ----------

  downloadTemplate(): void {
    this.svc.downloadTemplate().subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `PositionApprovalConfig_Template_${new Date().toISOString().slice(0, 10)}.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => this.snack.open('Failed to download template', 'Dismiss', { duration: 3000 })
    });
  }

  exportReport(): void {
    if (this.exportingReport()) return;
    this.exportingReport.set(true);
    this.svc.downloadReport().subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const d = new Date();
        const stamp = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;
        a.download = `PositionRelationshipsReport_${stamp}.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
        this.exportingReport.set(false);
      },
      error: () => {
        this.exportingReport.set(false);
        this.snack.open('Failed to generate report', 'Dismiss', { duration: 3000 });
      }
    });
  }

  openImportFilePicker(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      this.importLoading.set(true);
      this.svc.validateImport(file).subscribe({
        next: result => {
          this.importLoading.set(false);
          this.importValidation.set(result);
          this.importDialogOpen.set(true);
          this.importErrorsExpanded.set(false);
        },
        error: err => {
          this.importLoading.set(false);
          const message = (err?.error?.message as string | undefined) ?? 'Failed to parse import file';
          this.snack.open(message, 'Dismiss', { duration: 4000 });
        }
      });
    };
    input.click();
  }

  closeImportDialog(): void {
    this.importDialogOpen.set(false);
    this.importValidation.set(null);
  }

  toggleImportErrors(): void {
    this.importErrorsExpanded.update(v => !v);
  }

  confirmImport(): void {
    const v = this.importValidation();
    if (!v) return;
    this.importConfirming.set(true);
    this.svc.confirmImport({
      positionConfigChanges: v.positionConfigChanges,
      reportingRelationshipChanges: v.reportingRelationshipChanges,
      actingAppointmentChanges: v.actingAppointmentChanges
    }).subscribe({
      next: result => {
        this.importConfirming.set(false);
        this.closeImportDialog();
        this.snack.open(
          `Import complete: ${result.positionsUpdated} positions, ${result.reportingRelationshipsApplied} reporting relationships, ${result.actingAppointmentsApplied} acting appointments updated.`,
          'Dismiss',
          { duration: 6000 }
        );
        this.refreshSummary();
        this.loadList();
      },
      error: err => {
        this.importConfirming.set(false);
        const message = (err?.error?.message as string | undefined) ?? 'Import failed';
        this.snack.open(message, 'Dismiss', { duration: 4000 });
      }
    });
  }

  importErrorTrackBy(_: number, err: ImportRowError): string {
    return `${err.sheet}-${err.row}-${err.error}`;
  }
}
