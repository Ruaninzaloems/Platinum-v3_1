import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { ActivatedRoute, Router } from '@angular/router';
import { MappingWorkbenchService } from './mapping-workbench.service';
import { ResolveDisclosureComponent } from './resolve-disclosure.component';
import { AdvancedMappingComponent } from './advanced-mapping.component';
import { AuthService } from '../../core/services/auth.service';
import { PeriodFilterService } from '../../core/services/period-filter.service';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-mapping-workbench',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatTableModule, MatSelectModule, MatInputModule, MatFormFieldModule,
    MatChipsModule, MatProgressBarModule, MatSnackBarModule, MatDialogModule,
    MatTooltipModule, MatBadgeModule, MatCheckboxModule,
    MatTabsModule, MatDividerModule, MatExpansionModule, MatPaginatorModule,
    ResolveDisclosureComponent,
    AdvancedMappingComponent,
  ],
  templateUrl: './mapping-workbench.component.html',
  styleUrls: ['./mapping-workbench.component.scss'],
})
export class MappingWorkbenchComponent implements OnInit {
  loading = false;
  runs: any[] = [];
  selectedRun: any = null;
  rows: any[] = [];
  rowsTotal = 0;
  rowsPage = 1;
  rowsLimit = 100;
  disclosureTotals: any[] = [];
  reconciliationControls: any[] = [];
  decisions: any[] = [];

  activeTab = 0;
  matchStatusFilter = '';
  reviewStatusFilter = '';

  tenantId = '';
  financialYearId = '';

  compilations: any[] = [];
  selectedCompilationId = '';
  eligibleBatchesLoading = false;
  eligibleBatchesData: any = null;
  selectedCurrentYearBatchId = '';
  selectedPriorYear1BatchId = '';

  decisionReason = '';
  decisionDisclosureId = '';
  decisionType = '';
  unmappedClassification = '';
  selectedRowIds: Set<string> = new Set();

  rejectReason = '';
  abandonReason = '';
  reopenReason = '';

  rc09Acknowledged = false;
  rc09Reason = '';
  rc11Acknowledged = false;
  rc11Reason = '';
  sfpHighRiskAcknowledged = false;
  sfpMaterialExceptionAcknowledged = false;

  sfpValidation: any = null;
  sfpOverrides: any[] = [];
  sfpValidationLoading = false;

  overrideDialogOpen = false;
  overrideFinding: any = null;
  overrideReason = '';
  overrideReasonCategory = '';
  overrideSupportingNote = '';
  overrideSupportingReference = '';
  overrideAggregateAcknowledged = false;
  overrideHighRiskAcknowledged = false;

  revokeDialogOpen = false;
  revokeFindingCode = '';
  revokeReason = '';

  diagnostics: any[] = [];
  diagnosticsLoading = false;
  selectedDiagnostic: any = null;
  diagnosticDetailLoading = false;

  resolveDisclosureId = '';
  resolutionProgress: any = null;
  resolutionLoading = false;

  hasCompilationContext = false;
  compilationContextLoading = true;
  private static readonly REQUIRED_PERIODS = ['current_year', 'prior_year_1'];
  hasCurrentYearCommitted = false;
  hasPriorYearCommitted = false;
  tbBatchesLoading = true;
  tbBatchStatuses: { periodType: string; status: string }[] = [];
  hasStaleRuns = false;

  openingBalanceStatus = '';
  openingBalanceLoading = true;

  auditReport: any = null;
  auditReportLoading = false;
  auditStatementFilter = '';
  auditStatusFilter = '';
  filteredDisclosureSummaries: any[] = [];
  expandedAuditDisclosure = '';
  expandedAuditDisclosureLabel = '';
  expandedAuditDetailRows: any[] = [];
  auditSummaryCols = ['statementGroup', 'disclosureId', 'disclosureLineLabel', 'sourceRowCount', 'currentYearTotal', 'priorYearTotal', 'budgetTotal', 'statusBreakdown', 'expand'];
  auditDetailCols = ['auditStatus', 'mappingMethod', 'scoaItemCode', 'sortDesc', 'currentYearAmount', 'priorYearAmount', 'budgetAmount', 'matchConfidence', 'matchReason', 'matchedRuleId', 'latestDecisionType', 'latestDecisionBy'];

  constructor(
    private workbenchService: MappingWorkbenchService,
    private authService: AuthService,
    private periodFilter: PeriodFilterService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private api: ApiService,
  ) {}

  ngOnInit(): void {
    const user = this.authService.user();
    if (user) {
      this.tenantId = user.tenantId;
    }
    const qpFyId = this.activatedRoute.snapshot.queryParamMap.get('financialYearId');
    if (qpFyId) {
      this.periodFilter.selectedFyId.set(qpFyId);
    }
    const qpCompilationId = this.activatedRoute.snapshot.queryParamMap.get('compilationId');
    this.financialYearId = this.periodFilter.selectedFyId();
    if (this.tenantId && this.financialYearId) {
      this.loadRuns();
      this.loadCompilations(this.financialYearId, qpCompilationId);
      this.checkTbBatches(this.financialYearId);
      this.checkOpeningBalanceStatus(this.financialYearId);
    } else {
      this.hasCompilationContext = false;
      this.compilationContextLoading = false;
      this.hasCurrentYearCommitted = false;
      this.hasPriorYearCommitted = false;
      this.tbBatchesLoading = false;
      this.openingBalanceLoading = false;
    }
  }

  private loadCompilations(fyId: string, preselectedId: string | null): void {
    this.compilationContextLoading = true;
    this.api.get<any[]>('/compilations').subscribe({
      next: (compilations) => {
        const active = (compilations || []).filter(c =>
          (c.financialYearId === fyId || c.financialYear?.id === fyId) && c.status !== 'inactive'
        );
        this.compilations = active;
        this.hasCompilationContext = active.length > 0;
        this.compilationContextLoading = false;

        if (preselectedId && active.some(c => c.id === preselectedId)) {
          this.selectedCompilationId = preselectedId;
          this.onCompilationChange();
        } else if (active.length === 1) {
          this.selectedCompilationId = active[0].id;
          this.onCompilationChange();
        }
      },
      error: () => {
        this.compilations = [];
        this.hasCompilationContext = false;
        this.compilationContextLoading = false;
      }
    });
  }

  onCompilationChange(): void {
    if (!this.selectedCompilationId) {
      this.eligibleBatchesData = null;
      this.selectedCurrentYearBatchId = '';
      this.selectedPriorYear1BatchId = '';
      this.loadRuns();
      return;
    }
    this.eligibleBatchesLoading = true;
    this.eligibleBatchesData = null;
    this.selectedCurrentYearBatchId = '';
    this.selectedPriorYear1BatchId = '';
    this.loadRuns();
    this.workbenchService.getEligibleBatches(this.selectedCompilationId).subscribe({
      next: (data) => {
        this.eligibleBatchesData = data;
        const cyBatches = data.batches?.current_year || [];
        const pyBatches = data.batches?.prior_year_1 || [];
        if (cyBatches.length === 1) {
          this.selectedCurrentYearBatchId = cyBatches[0].id;
        }
        if (pyBatches.length === 1) {
          this.selectedPriorYear1BatchId = pyBatches[0].id;
        }
        this.eligibleBatchesLoading = false;
      },
      error: () => {
        this.eligibleBatchesData = null;
        this.eligibleBatchesLoading = false;
        this.showError('Failed to load eligible TB batches');
      }
    });
  }

  get currentYearBatches(): any[] {
    return this.eligibleBatchesData?.batches?.current_year || [];
  }

  get priorYear1Batches(): any[] {
    return this.eligibleBatchesData?.batches?.prior_year_1 || [];
  }

  get activeRunForSelectedBatch(): any {
    if (!this.selectedCurrentYearBatchId || !this.eligibleBatchesData?.activeRunsByBatch) {
      return null;
    }
    return this.eligibleBatchesData.activeRunsByBatch[this.selectedCurrentYearBatchId] || null;
  }

  get hasActiveRunForScope(): boolean {
    return !!this.activeRunForSelectedBatch;
  }

  get activeRunInfo(): any {
    return this.activeRunForSelectedBatch;
  }

  get canCreateRun(): boolean {
    return !!this.selectedCompilationId
      && !!this.selectedCurrentYearBatchId
      && !this.hasActiveRunForScope
      && !this.loading
      && !this.eligibleBatchesLoading;
  }

  formatBatchLabel(batch: any): string {
    const date = batch.completedAt ? new Date(batch.completedAt).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }) : 'unknown date';
    return `${batch.sourceFileName || 'Unknown file'} — committed ${date}`;
  }

  private checkTbBatches(fyId: string): void {
    this.tbBatchesLoading = true;
    this.api.get<any[]>(`/platinum/tb-import-batches/history/${fyId}`).subscribe({
      next: (batches) => {
        const batchList = batches || [];
        const batchMap = new Map(batchList.map(b => [b.periodType, b.status]));
        const synthesized: { periodType: string; status: string }[] = [];
        for (const p of MappingWorkbenchComponent.REQUIRED_PERIODS) {
          synthesized.push({ periodType: p, status: batchMap.get(p) || 'not_loaded' });
        }
        for (const b of batchList) {
          if (!MappingWorkbenchComponent.REQUIRED_PERIODS.includes(b.periodType)) {
            synthesized.push({ periodType: b.periodType || 'unknown', status: b.status });
          }
        }
        this.tbBatchStatuses = synthesized;
        this.hasCurrentYearCommitted = batchList.some(b => b.periodType === 'current_year' && b.status === 'committed');
        this.hasPriorYearCommitted = batchList.some(b => b.periodType === 'prior_year_1' && b.status === 'committed');
        this.tbBatchesLoading = false;
      },
      error: () => {
        this.tbBatchStatuses = MappingWorkbenchComponent.REQUIRED_PERIODS.map(p => ({ periodType: p, status: 'not_loaded' }));
        this.hasCurrentYearCommitted = false;
        this.hasPriorYearCommitted = false;
        this.tbBatchesLoading = false;
      }
    });
  }

  private checkOpeningBalanceStatus(fyId: string): void {
    this.openingBalanceLoading = true;
    this.api.get<any[]>('/compilations').subscribe({
      next: (compilations) => {
        const activeComp = Array.isArray(compilations) && compilations.find(c =>
          (c.financialYearId === fyId || c.financialYear?.id === fyId) && c.status !== 'inactive'
        );
        if (!activeComp) {
          this.openingBalanceStatus = 'not_established';
          this.openingBalanceLoading = false;
          return;
        }
        this.api.get<any>(`/opening-balance/${activeComp.id}/status`).subscribe({
          next: (result) => {
            this.openingBalanceStatus = result?.status || 'not_established';
            this.openingBalanceLoading = false;
          },
          error: () => {
            this.openingBalanceStatus = 'unknown';
            this.openingBalanceLoading = false;
          }
        });
      },
      error: () => {
        this.openingBalanceStatus = 'unknown';
        this.openingBalanceLoading = false;
      }
    });
  }

  get showPriorYearWarning(): boolean {
    if (this.tbBatchesLoading) return false;
    return this.hasCurrentYearCommitted && !this.hasPriorYearCommitted;
  }

  get showOpeningBalanceWarning(): boolean {
    if (this.openingBalanceLoading) return false;
    if (this.isOpeningBalanceConfirmed) return false;
    return this.openingBalanceStatus === 'not_established'
      || this.openingBalanceStatus === 'baseline_selected'
      || this.openingBalanceStatus === 'continuity_matched_unconfirmed'
      || this.openingBalanceStatus === 'continuity_exception'
      || this.openingBalanceStatus === 'superseded'
      || this.openingBalanceStatus === 'unknown';
  }

  get obWarningStyle(): 'amber' | 'blue' | 'red' {
    if (this.openingBalanceStatus === 'unknown') return 'red';
    return this.openingBalanceStatus === 'not_established' || this.openingBalanceStatus === 'superseded'
      ? 'amber' : 'blue';
  }

  get obWarningMessage(): string {
    switch (this.openingBalanceStatus) {
      case 'not_established':
        return 'Opening balance continuity has not yet been established. Mapping review may continue, but final AFS output remains control-pending until the opening balance baseline is generated and confirmed.';
      case 'superseded':
        return 'The opening balance baseline has been superseded by a newer TB import. Re-generate the comparison in Opening Balance Control.';
      case 'unknown':
        return 'Opening balance status could not be determined. Verify the opening balance status in Opening Balance Control before proceeding with final output.';
      default:
        return 'Opening balance baseline has been generated but is not yet confirmed. You may continue mapping. Final AFS export requires confirmation.';
    }
  }

  get obWarningAction(): string {
    return this.openingBalanceStatus === 'baseline_selected'
      || this.openingBalanceStatus === 'continuity_matched_unconfirmed'
      || this.openingBalanceStatus === 'continuity_exception'
      ? 'Review Opening Balance' : 'Go to Opening Balance Control';
  }

  get obChipText(): string {
    switch (this.openingBalanceStatus) {
      case 'not_established': return 'OB: Not Established';
      case 'baseline_selected': return 'OB: Awaiting Confirmation';
      case 'continuity_matched_unconfirmed': return 'OB: Awaiting Confirmation';
      case 'continuity_exception': return 'OB: Exceptions Pending';
      case 'superseded': return 'OB: Baseline Superseded';
      case 'continuity_matched_confirmed': return 'OB: Confirmed';
      case 'confirmed_with_exception': return 'OB: Confirmed (exceptions)';
      case 'unknown': return 'OB: Status Unavailable';
      default: return '';
    }
  }

  get obChipColor(): string {
    switch (this.openingBalanceStatus) {
      case 'not_established': return '#e65100';
      case 'baseline_selected': return '#1565c0';
      case 'continuity_matched_unconfirmed': return '#1565c0';
      case 'continuity_exception': return '#ef6c00';
      case 'superseded': return '#c62828';
      case 'continuity_matched_confirmed': return '#2e7d32';
      case 'confirmed_with_exception': return '#2e7d32';
      case 'unknown': return '#b71c1c';
      default: return '#757575';
    }
  }

  get showObChip(): boolean {
    return !this.openingBalanceLoading && !!this.obChipText;
  }

  get isOpeningBalanceConfirmed(): boolean {
    if (this.openingBalanceLoading) return false;
    return this.openingBalanceStatus === 'continuity_matched_confirmed'
      || this.openingBalanceStatus === 'confirmed_with_exception';
  }

  goToOpeningBalanceControl(): void {
    this.router.navigate(['/opening-balance-control']);
  }

  goToCompilations(): void {
    this.router.navigate(['/compilations']);
  }

  goToTbImport(): void {
    this.router.navigate(['/tb-import-workbench']);
  }

  loadRuns(): void {
    this.loading = true;
    this.workbenchService.listRuns(this.tenantId, this.financialYearId).subscribe({
      next: (runs) => {
        if (this.selectedCompilationId) {
          this.runs = runs.filter((r: any) => r.compilationId === this.selectedCompilationId);
        } else {
          this.runs = runs;
        }
        this.hasStaleRuns = this.runs.some((r: any) => r.isStale === true);
        this.loading = false;
      },
      error: (err) => {
        this.showError('Failed to load mapping runs');
        this.loading = false;
      },
    });
  }

  createRun(): void {
    if (!this.selectedCompilationId || !this.selectedCurrentYearBatchId) {
      this.showError('Please select a compilation and current-year TB source');
      return;
    }
    this.loading = true;
    this.workbenchService.createRun({
      tenantId: this.tenantId,
      financialYearId: this.financialYearId,
      compilationId: this.selectedCompilationId,
      currentYearBatchId: this.selectedCurrentYearBatchId,
      priorYear1BatchId: this.selectedPriorYear1BatchId || undefined,
    }).subscribe({
      next: (run) => {
        this.runs.unshift(run);
        this.selectedRun = run;
        this.showSuccess('Mapping run created');
        this.loading = false;
        this.onCompilationChange();
      },
      error: (err) => {
        this.showError(err.error?.message || 'Failed to create run');
        this.loading = false;
      },
    });
  }

  selectRun(run: any): void {
    this.selectedRun = run;
    this.loadRunDetails();
  }

  loadRunDetails(): void {
    if (!this.selectedRun) return;
    this.loadLiveStats();
    this.loadRows();
    this.loadDisclosureTotals();
    this.loadReconciliation();
    this.loadDecisions();
    this.loadSfpValidation();
    this.loadDiagnostics();
    this.loadResolutionProgress();
  }

  loadLiveStats(): void {
    this.workbenchService.getRunLiveStats(this.selectedRun.id).subscribe({
      next: (stats) => {
        this.selectedRun.totalTbRows = stats.totalTbRows;
        this.selectedRun.matchedRows = stats.matchedRows;
        this.selectedRun.unmatchedRows = stats.unmatchedRows;
        this.selectedRun.ambiguousRows = stats.ambiguousRows;
        this.selectedRun.excludedRows = stats.excludedRows;
        this.selectedRun.coveragePercent = stats.coveragePercent;
      },
    });
  }

  loadRows(): void {
    const filters: any = { page: this.rowsPage, limit: this.rowsLimit };
    if (this.matchStatusFilter) filters.matchStatus = this.matchStatusFilter;
    if (this.reviewStatusFilter) filters.reviewStatus = this.reviewStatusFilter;

    this.workbenchService.getRows(this.selectedRun.id, filters).subscribe({
      next: (result) => {
        this.rows = result.items;
        this.rowsTotal = result.total;
      },
      error: () => this.showError('Failed to load rows'),
    });
  }

  loadDisclosureTotals(): void {
    this.workbenchService.getDisclosureTotals(this.selectedRun.id).subscribe({
      next: (totals) => this.disclosureTotals = totals,
      error: () => {},
    });
  }

  loadReconciliation(): void {
    this.workbenchService.getReconciliation(this.selectedRun.id).subscribe({
      next: (controls) => this.reconciliationControls = controls,
      error: () => {},
    });
  }

  loadDecisions(): void {
    this.workbenchService.getDecisions(this.selectedRun.id).subscribe({
      next: (decisions) => this.decisions = decisions,
      error: () => {},
    });
  }

  goToCompilation(): void {
    if (this.selectedRun?.compilationId) {
      this.router.navigate(['/compilations', this.selectedRun.compilationId]);
    } else {
      this.router.navigate(['/compilations']);
    }
  }

  executeMapping(): void {
    this.loading = true;
    this.workbenchService.executeMapping(this.selectedRun.id).subscribe({
      next: (run) => {
        this.selectedRun = run;
        this.activeTab = 1;
        this.loadRunDetails();
        this.showSuccess(`Mapping executed: ${run.matchedRows} matched, ${run.unmatchedRows} unmatched`);
        this.loading = false;
      },
      error: (err) => {
        this.showError(err.error?.message || 'Mapping execution failed');
        this.loading = false;
      },
    });
  }

  runReconciliation(): void {
    this.loading = true;
    this.workbenchService.runReconciliation(this.selectedRun.id).subscribe({
      next: (controls) => {
        this.reconciliationControls = controls;
        this.showSuccess('Reconciliation controls computed');
        this.loading = false;
      },
      error: (err) => {
        this.showError(err.error?.message || 'Reconciliation failed');
        this.loading = false;
      },
    });
  }

  submitForReview(): void {
    this.loading = true;
    this.workbenchService.submitForReview(this.selectedRun.id).subscribe({
      next: (run) => {
        this.selectedRun = run;
        this.showSuccess('Mapping run submitted for review');
        this.loading = false;
      },
      error: (err) => {
        const failures = err.error?.failures || [];
        const msg = failures.length > 0
          ? `Submission blocked:\n${failures.join('\n')}`
          : (err.error?.message || 'Submission failed');
        this.showError(msg);
        this.loading = false;
      },
    });
  }

  approve(): void {
    this.loading = true;
    this.workbenchService.approve(this.selectedRun.id, {
      rc09Acknowledged: this.rc09Acknowledged,
      rc09Reason: this.rc09Reason,
      rc11Acknowledged: this.rc11Acknowledged,
      rc11Reason: this.rc11Reason,
      sfpHighRiskAcknowledged: this.sfpHighRiskAcknowledged,
      sfpMaterialExceptionAcknowledged: this.sfpMaterialExceptionAcknowledged,
    }).subscribe({
      next: (run) => {
        this.selectedRun = run;
        this.loadRuns();
        this.showSuccess('Mapping run approved');
        this.loading = false;
      },
      error: (err) => {
        const failures = err.error?.failures || [];
        const msg = failures.length > 0
          ? `Approval blocked:\n${failures.join('\n')}`
          : (err.error?.message || 'Approval failed');
        this.showError(msg);
        this.loading = false;
      },
    });
  }

  reject(): void {
    if (!this.rejectReason) {
      this.showError('Rejection reason is required');
      return;
    }
    this.loading = true;
    this.workbenchService.reject(this.selectedRun.id, this.rejectReason).subscribe({
      next: (run) => {
        this.selectedRun = run;
        this.rejectReason = '';
        this.showSuccess('Mapping run rejected — returned to draft');
        this.loading = false;
      },
      error: (err) => {
        this.showError(err.error?.message || 'Rejection failed');
        this.loading = false;
      },
    });
  }

  abandonRun(): void {
    if (!this.abandonReason) {
      this.showError('Abandon reason is required');
      return;
    }
    this.loading = true;
    this.workbenchService.abandon(this.selectedRun.id, this.abandonReason).subscribe({
      next: (run) => {
        this.selectedRun = run;
        this.abandonReason = '';
        this.loadRuns();
        this.showSuccess('Mapping run abandoned');
        this.loading = false;
      },
      error: (err) => {
        this.showError(err.error?.message || 'Abandon failed');
        this.loading = false;
      },
    });
  }

  reopenRun(): void {
    if (!this.reopenReason) {
      this.showError('Reopen reason is required');
      return;
    }
    this.loading = true;
    this.workbenchService.reopen(this.selectedRun.id, this.reopenReason).subscribe({
      next: (run) => {
        this.selectedRun = run;
        this.reopenReason = '';
        this.showSuccess('Mapping run reopened');
        this.loading = false;
      },
      error: (err) => {
        this.showError(err.error?.message || 'Reopen failed');
        this.loading = false;
      },
    });
  }

  applyDecision(rowId: string): void {
    if (!this.decisionReason) {
      this.showError('Decision reason is required');
      return;
    }
    this.loading = true;
    this.workbenchService.applyDecision(this.selectedRun.id, {
      mappingRunRowId: rowId,
      decisionType: this.decisionType,
      newDisclosureId: this.decisionDisclosureId || undefined,
      reason: this.decisionReason,
      unmappedClassification: this.unmappedClassification || undefined,
    }).subscribe({
      next: () => {
        this.decisionReason = '';
        this.decisionDisclosureId = '';
        this.loadRows();
        this.showSuccess('Decision applied');
        this.loading = false;
      },
      error: (err) => {
        this.showError(err.error?.message || 'Decision failed');
        this.loading = false;
      },
    });
  }

  applyBatchDecision(): void {
    if (this.selectedRowIds.size === 0) {
      this.showError('Select at least one row');
      return;
    }
    if (!this.decisionReason) {
      this.showError('Decision reason is required');
      return;
    }
    this.loading = true;
    this.workbenchService.applyBatchDecisions(this.selectedRun.id, {
      rowIds: Array.from(this.selectedRowIds),
      decisionType: this.decisionType,
      newDisclosureId: this.decisionDisclosureId || undefined,
      reason: this.decisionReason,
      unmappedClassification: this.unmappedClassification || undefined,
    }).subscribe({
      next: () => {
        this.selectedRowIds.clear();
        this.decisionReason = '';
        this.loadRows();
        this.showSuccess('Batch decisions applied');
        this.loading = false;
      },
      error: (err) => {
        this.showError(err.error?.message || 'Batch decision failed');
        this.loading = false;
      },
    });
  }

  toggleRowSelection(rowId: string): void {
    if (this.selectedRowIds.has(rowId)) {
      this.selectedRowIds.delete(rowId);
    } else {
      this.selectedRowIds.add(rowId);
    }
  }

  onPageChange(event: PageEvent): void {
    this.rowsPage = event.pageIndex + 1;
    this.rowsLimit = event.pageSize;
    this.loadRows();
  }

  onFilterChange(): void {
    this.rowsPage = 1;
    this.loadRows();
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'draft': return 'accent';
      case 'in_review': return 'primary';
      case 'approved': return 'primary';
      case 'superseded': return 'warn';
      case 'abandoned': return 'warn';
      case 'source_invalidated': return 'warn';
      default: return '';
    }
  }

  getMatchStatusIcon(status: string): string {
    switch (status) {
      case 'matched': return 'check_circle';
      case 'manually_mapped': return 'edit';
      case 'unmatched': return 'warning';
      case 'ambiguous': return 'help';
      case 'excluded': return 'block';
      default: return 'circle';
    }
  }

  getControlStatusIcon(status: string): string {
    switch (status) {
      case 'pass': return 'check_circle';
      case 'fail': return 'error';
      case 'warning': return 'warning';
      default: return 'help';
    }
  }

  getControlStatusColor(status: string): string {
    switch (status) {
      case 'pass': return '#4caf50';
      case 'fail': return '#f44336';
      case 'warning': return '#ff9800';
      default: return '#9e9e9e';
    }
  }

  loadSfpValidation(): void {
    this.sfpValidationLoading = true;
    this.workbenchService.getSfpValidation(this.selectedRun.id).subscribe({
      next: (result) => {
        this.sfpValidation = result;
        this.sfpValidationLoading = false;
      },
      error: () => {
        this.sfpValidation = null;
        this.sfpValidationLoading = false;
      },
    });
    this.workbenchService.listSfpOverrides(this.selectedRun.id).subscribe({
      next: (overrides) => this.sfpOverrides = overrides || [],
      error: () => this.sfpOverrides = [],
    });
  }

  getSfpFindings(): any[] {
    return this.sfpValidation?.findings || [];
  }

  getSfpUnresolvedCount(): number {
    return this.getSfpFindings().filter((f: any) => f.status === 'UNRESOLVED').length;
  }

  getSfpOverriddenCount(): number {
    return this.getSfpFindings().filter((f: any) => f.status === 'OVERRIDDEN').length;
  }

  getSfpPassCount(): number {
    return this.getSfpFindings().filter((f: any) => f.status === 'PASS').length;
  }

  getSeverityColor(severity: string): string {
    switch (severity) {
      case 'BLOCK': return '#d32f2f';
      case 'ERROR': return '#f44336';
      case 'WARNING': return '#ff9800';
      case 'INFO': return '#2196f3';
      default: return '#9e9e9e';
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'UNRESOLVED': return 'sfp-status-unresolved';
      case 'OVERRIDDEN': return 'sfp-status-overridden';
      case 'PASS': return 'sfp-status-pass';
      default: return '';
    }
  }

  openOverrideDialog(finding: any): void {
    this.overrideFinding = finding;
    this.overrideReason = '';
    this.overrideReasonCategory = '';
    this.overrideSupportingNote = '';
    this.overrideSupportingReference = '';
    this.overrideAggregateAcknowledged = false;
    this.overrideHighRiskAcknowledged = false;
    this.overrideDialogOpen = true;
  }

  closeOverrideDialog(): void {
    this.overrideDialogOpen = false;
    this.overrideFinding = null;
  }

  submitOverride(): void {
    if (!this.overrideFinding || !this.overrideReason || !this.overrideReasonCategory) return;
    this.loading = true;
    this.workbenchService.createSfpOverride(this.selectedRun.id, {
      findingCode: this.overrideFinding.code,
      findingTitle: this.overrideFinding.title,
      affectedAmount: this.overrideFinding.actualValue || 0,
      overrideReason: this.overrideReason,
      reasonCategory: this.overrideReasonCategory,
      supportingNote: this.overrideSupportingNote || undefined,
      supportingReference: this.overrideSupportingReference || undefined,
      aggregateConfirmationAcknowledged: this.overrideAggregateAcknowledged,
      highRiskAcknowledged: this.overrideHighRiskAcknowledged,
    }).subscribe({
      next: () => {
        this.closeOverrideDialog();
        this.loadSfpValidation();
        this.showSuccess('Override created successfully');
        this.loading = false;
      },
      error: (err) => {
        this.showError(err.error?.message || 'Failed to create override');
        this.loading = false;
      },
    });
  }

  openRevokeDialog(findingCode: string): void {
    this.revokeFindingCode = findingCode;
    this.revokeReason = '';
    this.revokeDialogOpen = true;
  }

  closeRevokeDialog(): void {
    this.revokeDialogOpen = false;
    this.revokeFindingCode = '';
  }

  submitRevoke(): void {
    if (!this.revokeFindingCode || !this.revokeReason) return;
    this.loading = true;
    this.workbenchService.revokeSfpOverride(this.selectedRun.id, this.revokeFindingCode, this.revokeReason).subscribe({
      next: () => {
        this.closeRevokeDialog();
        this.loadSfpValidation();
        this.showSuccess('Override revoked');
        this.loading = false;
      },
      error: (err) => {
        this.showError(err.error?.message || 'Failed to revoke override');
        this.loading = false;
      },
    });
  }

  formatRand(value: number): string {
    if (value == null) return 'R 0';
    const abs = Math.abs(value);
    const formatted = abs.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return value < 0 ? `(R ${formatted})` : `R ${formatted}`;
  }

  backToList(): void {
    this.selectedRun = null;
    this.rows = [];
    this.disclosureTotals = [];
    this.reconciliationControls = [];
    this.decisions = [];
    this.sfpValidation = null;
    this.sfpOverrides = [];
    this.diagnostics = [];
    this.selectedDiagnostic = null;
    this.resolveDisclosureId = '';
    this.resolutionProgress = null;
    this.auditReport = null;
    this.auditReportLoading = false;
  }

  loadDiagnostics(): void {
    if (!this.selectedRun) return;
    this.diagnosticsLoading = true;
    this.workbenchService.getDiagnostics(this.selectedRun.id).subscribe({
      next: (diagnostics) => {
        this.diagnostics = diagnostics || [];
        this.diagnosticsLoading = false;
      },
      error: () => {
        this.diagnostics = [];
        this.diagnosticsLoading = false;
      },
    });
  }

  loadDiagnosticForFinding(findingCode: string): void {
    if (!this.selectedRun) return;
    this.diagnosticDetailLoading = true;
    this.workbenchService.getDiagnosticForFinding(this.selectedRun.id, findingCode).subscribe({
      next: (diagnostic) => {
        this.selectedDiagnostic = diagnostic;
        this.diagnosticDetailLoading = false;
      },
      error: () => {
        this.selectedDiagnostic = null;
        this.diagnosticDetailLoading = false;
      },
    });
  }

  closeDiagnosticDetail(): void {
    this.selectedDiagnostic = null;
  }

  getDiagnosticTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'SFP_IMBALANCE': 'SFP Imbalance',
      'IE_LN_TRANSFER': 'IE/LN Transfer',
      'MISCLASSIFICATION': 'Misclassification',
      'OVERRIDE_CONCENTRATION': 'Override Concentration',
      'UNMATCHED_POPULATION': 'Unmatched Population',
    };
    return labels[type] || type;
  }

  objectKeys(obj: any): string[] {
    return obj ? Object.keys(obj) : [];
  }

  navigateToContributor(contributor: any): void {
    if (!contributor.mappingRunRowId) return;
    const scoaPrefix = contributor.scoaItemCode?.substring(0, 5) || '';
    this.activeTab = 1;
    this.matchStatusFilter = contributor.matchStatus || '';
    this.reviewStatusFilter = '';
    this.rowsPage = 1;

    const filters: any = { page: 1, limit: 100 };
    if (contributor.matchStatus) filters.matchStatus = contributor.matchStatus;
    if (scoaPrefix) filters.backbone = scoaPrefix;

    this.workbenchService.getRows(this.selectedRun.id, filters).subscribe({
      next: (result) => {
        this.rows = result.items;
        this.rowsTotal = result.total;
        const idx = this.rows.findIndex(r => r.id === contributor.mappingRunRowId);
        if (idx >= 0) {
          this.showSuccess(`Navigated to row: ${contributor.scoaItemCode}`);
        } else {
          this.showSuccess(`Showing ${result.total} rows near ${contributor.scoaItemCode}`);
        }
      },
      error: () => this.showError('Failed to navigate to row'),
    });
  }

  navigateToAction(action: any): void {
    if (!action.targetType || !action.targetFilter) return;
    const filter = action.targetFilter;
    const diagnosticType = filter.diagnosticType || '';

    if (action.targetType === 'OVERRIDES') {
      this.activeTab = 4;
      this.loadSfpValidation();
      return;
    }

    if (action.targetType === 'DISCLOSURE') {
      this.activeTab = 2;
      this.loadDisclosureTotals();
      return;
    }

    if (action.targetType === 'RULE') {
      this.activeTab = 1;
      this.matchStatusFilter = '';
      this.rowsPage = 1;
      this.workbenchService.getDiagnosticRows(this.selectedRun.id, diagnosticType || 'MISCLASSIFICATION', {
        page: 1,
        limit: 100,
      }).subscribe({
        next: (result) => {
          this.rows = result.items;
          this.rowsTotal = result.total;
          this.showSuccess(`Rule-affected rows: ${result.total} rows`);
        },
        error: () => this.showError('Failed to load rule-affected rows'),
      });
      return;
    }

    if (action.targetType === 'MAPPING_ROWS' || action.targetType === 'TB_ROWS') {
      this.activeTab = 1;
      this.matchStatusFilter = filter.matchStatus || '';
      this.rowsPage = 1;

      const endpointFilters: any = { page: 1, limit: 100 };
      if (filter.matchStatus) endpointFilters.matchStatus = filter.matchStatus;
      if (filter.scoaPrefix) endpointFilters.scoaPrefix = filter.scoaPrefix;
      if (filter.segment) endpointFilters.segment = filter.segment;
      if (filter.disclosureId) endpointFilters.disclosureId = filter.disclosureId;
      if (filter.unmatchedReasonCode) endpointFilters.unmatchedReasonCode = filter.unmatchedReasonCode;

      if (diagnosticType) {
        this.workbenchService.getDiagnosticRows(this.selectedRun.id, diagnosticType, endpointFilters).subscribe({
          next: (result) => {
            this.rows = result.items;
            this.rowsTotal = result.total;
            this.showSuccess(`Filtered view: ${result.total} rows`);
          },
          error: () => {
            this.workbenchService.getRows(this.selectedRun.id, endpointFilters).subscribe({
              next: (result) => {
                this.rows = result.items;
                this.rowsTotal = result.total;
                this.showSuccess(`Filtered view: ${result.total} rows`);
              },
              error: () => this.showError('Failed to load filtered rows'),
            });
          },
        });
      } else {
        this.workbenchService.getRows(this.selectedRun.id, endpointFilters).subscribe({
          next: (result) => {
            this.rows = result.items;
            this.rowsTotal = result.total;
            this.showSuccess(`Filtered view: ${result.total} rows`);
          },
          error: () => this.showError('Failed to load filtered rows'),
        });
      }
      return;
    }
  }

  private readonly DISCLOSURE_CONTROL_MAP: Record<string, string[]> = {
    'DISC-0002': ['SFP_BALANCE_CHECK'],
    'DISC-0003': ['SFP_BALANCE_CHECK'],
    'DISC-0004': ['SFP_BALANCE_CHECK'],
    'DISC-0005': ['SFP_BALANCE_CHECK'],
    'DISC-0006': ['SFP_BALANCE_CHECK', 'SFP_SCNA_EQUITY_LINK'],
    'DISC-0012': ['SFPE_SCNA_LINK'],
    'DISC-0013': ['SFP_SCNA_EQUITY_LINK'],
    'DISC-0014': ['SFP_SCNA_EQUITY_LINK'],
    'DISC-0015': ['SFPE_SCNA_LINK', 'SFP_SCNA_EQUITY_LINK'],
    'DISC-0016': ['CFS_CASH_RECONCILIATION'],
    'DISC-0017': ['CFS_CASH_RECONCILIATION'],
    'DISC-0018': ['CFS_CASH_RECONCILIATION'],
    'DISC-0019': ['CFS_CASH_RECONCILIATION'],
  };

  getDisclosuresForControl(controlId: string): string[] {
    const result: string[] = [];
    for (const [discId, controls] of Object.entries(this.DISCLOSURE_CONTROL_MAP)) {
      if (controls.includes(controlId)) {
        result.push(discId);
      }
    }
    return result;
  }

  openResolveDisclosure(disclosureId: string): void {
    this.resolveDisclosureId = disclosureId;
  }

  closeResolveDisclosure(): void {
    this.resolveDisclosureId = '';
  }

  onBulkApplyCompleted(): void {
    this.activeTab = 2;
    this.loadLiveStats();
    this.loadDisclosureTotals();
    this.loadRows();
    this.loadResolutionProgress();
  }

  onAdvancedMappingApplied(): void {
    this.loadLiveStats();
    this.loadRows();
    this.loadDisclosureTotals();
    this.loadResolutionProgress();
  }

  loadResolutionProgress(): void {
    if (!this.selectedRun) return;
    this.resolutionLoading = true;
    this.workbenchService.getResolutionProgress(this.selectedRun.id).subscribe({
      next: (progress) => {
        this.resolutionProgress = progress;
        this.resolutionLoading = false;
      },
      error: () => {
        this.resolutionProgress = null;
        this.resolutionLoading = false;
      },
    });
  }

  getDiagnosticSeverityColor(severity: string): string {
    switch (severity) {
      case 'BLOCK': return '#d32f2f';
      case 'ERROR': return '#f44336';
      case 'WARNING': return '#ff9800';
      case 'INFO': return '#2196f3';
      default: return '#9e9e9e';
    }
  }

  private showSuccess(msg: string): void {
    this.snackBar.open(msg, 'Close', { duration: 4000, panelClass: 'snack-success' });
  }

  private showError(msg: string): void {
    this.snackBar.open(msg, 'Close', { duration: 6000, panelClass: 'snack-error' });
  }

  loadAuditReport(): void {
    if (!this.selectedRun) return;
    this.auditReportLoading = true;
    this.auditReport = null;
    this.expandedAuditDisclosure = '';
    this.expandedAuditDetailRows = [];
    this.workbenchService.getDisclosureReport(this.selectedRun.id).subscribe({
      next: (report) => {
        this.auditReport = report;
        this.applyAuditFilters();
        this.auditReportLoading = false;
      },
      error: (err) => {
        this.showError(err.error?.message || 'Failed to generate audit report');
        this.auditReportLoading = false;
      },
    });
  }

  exportAuditReport(): void {
    if (!this.selectedRun) return;
    this.workbenchService.exportDisclosureReport(this.selectedRun.id);
  }

  applyAuditFilters(): void {
    if (!this.auditReport) {
      this.filteredDisclosureSummaries = [];
      return;
    }
    let summaries = this.auditReport.disclosureSummaries || [];
    if (this.auditStatementFilter) {
      summaries = summaries.filter((d: any) => d.statementGroup === this.auditStatementFilter);
    }
    if (this.auditStatusFilter) {
      const statusKey = this.auditStatusFilter.toLowerCase() + 'Count';
      summaries = summaries.filter((d: any) => d[statusKey] > 0);
    }
    this.filteredDisclosureSummaries = summaries;
    if (this.expandedAuditDisclosure) {
      this.refreshExpandedAuditRows();
    }
  }

  private refreshExpandedAuditRows(): void {
    const disclosureId = this.expandedAuditDisclosure;
    if (!disclosureId || !this.auditReport) return;
    const stillVisible = this.filteredDisclosureSummaries.some((d: any) => d.disclosureId === disclosureId);
    if (!stillVisible) {
      this.expandedAuditDisclosure = '';
      this.expandedAuditDetailRows = [];
      this.expandedAuditDisclosureLabel = '';
      return;
    }
    let rows = (this.auditReport.detailRows || []).filter((r: any) =>
      (r.matchedDisclosureId || '__UNMAPPED__') === disclosureId,
    );
    if (this.auditStatusFilter) {
      rows = rows.filter((r: any) => r.auditStatus === this.auditStatusFilter);
    }
    this.expandedAuditDetailRows = rows;
  }

  toggleAuditDisclosure(disclosureId: string): void {
    if (this.expandedAuditDisclosure === disclosureId) {
      this.expandedAuditDisclosure = '';
      this.expandedAuditDetailRows = [];
      this.expandedAuditDisclosureLabel = '';
      return;
    }
    this.expandedAuditDisclosure = disclosureId;
    const summary = this.filteredDisclosureSummaries.find((d: any) => d.disclosureId === disclosureId);
    this.expandedAuditDisclosureLabel = summary?.disclosureLineLabel || disclosureId;

    let rows = (this.auditReport?.detailRows || []).filter((r: any) =>
      (r.matchedDisclosureId || '__UNMAPPED__') === disclosureId,
    );
    if (this.auditStatusFilter) {
      rows = rows.filter((r: any) => r.auditStatus === this.auditStatusFilter);
    }
    this.expandedAuditDetailRows = rows;
  }

  getAuditStatusColor(status: string): string {
    switch (status) {
      case 'SUGGESTED': return '#1565c0';
      case 'ACCEPTED': return '#2e7d32';
      case 'OVERRIDDEN': return '#6a1b9a';
      case 'UNMAPPED': return '#e65100';
      case 'CONFLICT': return '#c62828';
      case 'EXCLUDED': return '#757575';
      default: return '#424242';
    }
  }
}
