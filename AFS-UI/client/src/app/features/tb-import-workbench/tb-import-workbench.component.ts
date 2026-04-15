import { Component, OnInit, OnDestroy, NgZone, ChangeDetectionStrategy, ChangeDetectorRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatStepperModule } from '@angular/material/stepper';
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
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { Router } from '@angular/router';
import { HttpEventType } from '@angular/common/http';
import { TbImportWorkbenchService } from './tb-import-workbench.service';
import { AuthService } from '../../core/services/auth.service';
import { PeriodFilterService } from '../../core/services/period-filter.service';
import { ApiService } from '../../core/services/api.service';

export interface ErrorPanel {
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  dismissible: boolean;
  actions?: { label: string; icon?: string; callback: () => void }[];
}

@Component({
  selector: 'app-tb-import-workbench',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatButtonModule, MatIconModule, MatStepperModule,
    MatTableModule, MatSelectModule, MatInputModule, MatFormFieldModule,
    MatChipsModule, MatProgressBarModule, MatSnackBarModule, MatDialogModule,
    MatTooltipModule, MatBadgeModule, MatRadioModule, MatCheckboxModule,
    MatTabsModule, MatDividerModule, MatExpansionModule, MatAutocompleteModule,
  ],
  templateUrl: './tb-import-workbench.component.html',
  styleUrls: ['./tb-import-workbench.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TbImportWorkbenchComponent implements OnInit, OnDestroy {
  currentStep = 0;
  loading = false;
  batchId: string | null = null;

  uploadResult: any = null;
  headers: string[] = [];
  selectedHeaderRow: number = 0;
  previewRows: { lineNumber: number; cells: string[] }[] = [];
  importMode: string = 'signed_balance';
  signConvention: string = 'positive_debit';
  periodType: string = 'current_year';

  mappingSuggestions: any[] = [];
  columnMapping: Record<string, any> = {};
  mappingValidation: any = null;

  normalizationResult: any = null;
  validationSummary: any = null;
  validationResults: any[] = [];

  commitResult: any = null;
  batchHistory: any[] = [];

  batchDetail: any = null;
  rawRows: any[] = [];
  normalizedRows: any[] = [];

  overrideReason = '';
  selectedWarningRuleId = '';
  candidateTotalRows: any[] = [];

  hasCompilationContext = false;
  compilationContextLoading = true;

  compilations: any[] = [];
  selectedCompilation: any = null;
  compilationId: string | null = null;
  multipleCompilations = false;

  errorPanel: ErrorPanel | null = null;

  uploading = false;
  uploadElapsedSeconds = 0;
  uploadProgress = 0;
  uploadPhase: 'uploading' | 'processing' = 'uploading';
  private uploadTimerInterval: any = null;

  selectedFile: File | null = null;
  selectedFileInfo: { name: string; size: string } | null = null;
  showConfirmDialog = false;

  stuckBatch: any = null;

  successBanner: string | null = null;

  normValidateProgress = 0;
  normValidatePhase: 'idle' | 'normalizing' | 'validating' | 'complete' = 'idle';
  private progressInterval: any = null;

  sampleDataCache: Record<string, any> = {};
  sampleDataLoading: Record<string, boolean> = {};
  expandedRules: Record<string, boolean> = {};

  highestStepReached = 0;

  readonly stepLabels = ['Upload', 'Preview & Header', 'Column Mapping', 'Validation', 'Commit', 'Complete'];

  mappingFilterText: Record<string, string> = {};

  constructor(
    private workbenchService: TbImportWorkbenchService,
    private snackBar: MatSnackBar,
    private auth: AuthService,
    private periodFilter: PeriodFilterService,
    private router: Router,
    private api: ApiService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
  ) {
    effect(() => {
      const fyId = this.periodFilter.selectedFyId();
      if (fyId) {
        this.loadBatchHistory();
        this.checkCompilationContext(fyId);
      }
    });
  }

  get tenantId(): string {
    return this.auth.user()?.tenantId || '';
  }

  get financialYearId(): string {
    return this.periodFilter.selectedFyId() || '';
  }

  get userEmail(): string {
    return this.auth.user()?.email || 'system';
  }

  ngOnDestroy(): void {
    this.stopUploadTimer();
    this.stopProgressSimulation();
  }

  ngOnInit(): void {
    this.loadBatchHistory();
    const fyId = this.periodFilter.selectedFyId();
    if (fyId) {
      this.checkCompilationContext(fyId);
    } else {
      this.hasCompilationContext = false;
      this.compilationContextLoading = false;
    }
  }

  private checkCompilationContext(fyId: string): void {
    this.compilationContextLoading = true;
    this.api.get<any[]>('/compilations').subscribe({
      next: (compilations) => {
        const eligible = (Array.isArray(compilations) ? compilations : []).filter(c =>
          (c.financialYearId === fyId || c.financialYear?.id === fyId) &&
          c.status !== 'inactive' && c.isActive !== false
        );

        this.compilations = eligible;

        if (eligible.length === 0) {
          this.hasCompilationContext = false;
          this.selectedCompilation = null;
          this.compilationId = null;
          this.multipleCompilations = false;
        } else if (eligible.length === 1) {
          this.hasCompilationContext = true;
          this.selectedCompilation = eligible[0];
          this.compilationId = eligible[0].id;
          this.multipleCompilations = false;
        } else {
          this.hasCompilationContext = true;
          this.multipleCompilations = true;
          this.selectedCompilation = null;
          this.compilationId = null;
        }
        this.compilationContextLoading = false;
        this.checkForStuckBatch();
        this.cdr.markForCheck();
      },
      error: () => {
        this.hasCompilationContext = false;
        this.compilationContextLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  onCompilationSelected(compilationId: string): void {
    this.selectedCompilation = this.compilations.find(c => c.id === compilationId) || null;
    this.compilationId = compilationId;
    this.checkForStuckBatch();
  }

  get compilationResolved(): boolean {
    return !!this.compilationId && !!this.selectedCompilation;
  }

  goToCompilations(): void {
    this.router.navigate(['/compilations']);
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  getPeriodLabel(periodType: string): string {
    const labels: Record<string, string> = {
      current_year: 'Current Year',
      prior_year_1: 'Prior Year 1',
      prior_year_2: 'Prior Year 2',
      prior_year_3: 'Prior Year 3',
    };
    return labels[periodType] || periodType;
  }

  private checkForStuckBatch(): void {
    if (!this.financialYearId || !this.tenantId) return;
    this.workbenchService.getTenantBatches(this.tenantId, this.financialYearId).subscribe({
      next: (result) => {
        const activeStates = ['uploaded', 'parsed', 'mapping_in_progress', 'validation_failed', 'validation_passed'];
        const batches = result.batches || [];
        const stuck = batches.find((b: any) =>
          activeStates.includes(b.status) &&
          b.periodType === this.periodType &&
          (!this.compilationId || b.compilationId === this.compilationId)
        );
        this.stuckBatch = stuck || null;
        this.cdr.markForCheck();
      },
    });
  }

  onPeriodTypeChanged(): void {
    this.checkForStuckBatch();
  }

  resumeStuckBatch(): void {
    if (!this.stuckBatch) return;
    this.batchId = this.stuckBatch.id;
    this.uploadResult = this.stuckBatch;
    const statusStepMap: Record<string, number> = {
      uploaded: 0,
      parsed: 1,
      mapping_in_progress: 2,
      validation_failed: 3,
      validation_passed: 4,
    };
    const step = statusStepMap[this.stuckBatch.status] ?? 0;
    this.setStep(step);
    this.stuckBatch = null;
    this.errorPanel = null;
    if (this.currentStep === 1) {
      this.loadPreviewRows();
    }
  }

  abandonStuckBatch(): void {
    if (!this.stuckBatch) return;
    this.workbenchService.abandon(this.stuckBatch.id).subscribe({
      next: () => {
        this.snackBar.open('Batch abandoned successfully', 'OK', { duration: 3000 });
        this.stuckBatch = null;
        this.errorPanel = null;
        this.loadBatchHistory();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.showError('error', 'Abandon Failed', err.error?.message || 'Failed to abandon batch', true);
        this.cdr.markForCheck();
      },
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    this.selectedFile = file;
    this.selectedFileInfo = {
      name: file.name,
      size: this.formatFileSize(file.size),
    };
    this.showConfirmDialog = true;
    input.value = '';
  }

  cancelUpload(): void {
    this.selectedFile = null;
    this.selectedFileInfo = null;
    this.showConfirmDialog = false;
  }

  confirmAndUpload(): void {
    if (!this.selectedFile) return;
    this.showConfirmDialog = false;

    const file = this.selectedFile;
    this.uploading = true;
    this.uploadElapsedSeconds = 0;
    this.uploadProgress = 0;
    this.uploadPhase = 'uploading';
    this.errorPanel = null;
    this.successBanner = null;

    this.ngZone.runOutsideAngular(() => {
      this.uploadTimerInterval = setInterval(() => {
        this.ngZone.run(() => {
          this.uploadElapsedSeconds++;
          this.cdr.markForCheck();
        });
      }, 1000);
    });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('financialYearId', this.financialYearId);
    formData.append('periodType', this.periodType);
    if (this.compilationId) {
      formData.append('compilationId', this.compilationId);
    }

    this.workbenchService.uploadFileWithProgress(formData).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress) {
          if (event.total) {
            this.uploadProgress = Math.round((event.loaded / event.total) * 100);
          }
          if (this.uploadProgress >= 100) {
            this.uploadPhase = 'processing';
          }
          this.cdr.markForCheck();
        } else if (event.type === HttpEventType.Response) {
          const result = event.body;
          this.stopUploadTimer();
          this.uploading = false;
          this.uploadProgress = 100;
          this.selectedFile = null;
          this.selectedFileInfo = null;
          this.uploadResult = result;
          this.batchId = result.batchId;
          this.headers = result.headers || [];
          this.selectedHeaderRow = result.detectedHeaderRow ?? 0;

          if (result.rawRowsInserted === 0) {
            this.showError('warning', 'Zero Data Rows',
              'The file was uploaded but produced zero data rows. The file may be empty, incorrectly formatted, or contain only headers.',
              true,
              [{ label: 'Upload a different file', icon: 'upload_file', callback: () => this.dismissError() }]
            );
          } else {
            this.setStep(1);
            this.successBanner = `File uploaded successfully — ${result.rawRowsInserted} rows parsed in ${this.uploadElapsedFormatted}. Confirm the header row below.`;
            this.loadPreviewRows();
          }

          if (result.duplicateWarning) {
            this.snackBar.open(result.duplicateWarning, 'Dismiss', { duration: 8000 });
          }

          this.loadBatchHistory();
          this.cdr.markForCheck();
        }
      },
      error: (err) => {
        this.stopUploadTimer();
        this.uploading = false;
        this.selectedFile = null;
        this.selectedFileInfo = null;

        const msg = err.error?.message || err.message || 'Upload failed';
        if (msg.includes('active import is already in progress')) {
          this.showError('warning', 'Active Batch Block',
            'An in-progress import is blocking new uploads for this period.',
            false);
          this.checkForStuckBatch();
        } else if (msg.includes('Binary duplicate') || msg.includes('V-HF11')) {
          this.showError('error', 'Duplicate File',
            'This exact file has already been committed for this compilation and period.',
            true,
            [{ label: 'Upload a different file', icon: 'upload_file', callback: () => this.dismissError() }]
          );
        } else if (msg.includes('Failed to parse')) {
          this.showError('error', 'Parse Failure', msg, true,
            [{ label: 'Upload a different file', icon: 'upload_file', callback: () => this.dismissError() }]
          );
        } else if (msg.includes('Only CSV and Excel')) {
          this.showError('error', 'Invalid File Type',
            'Only CSV and Excel (.xlsx, .xls) files are supported.',
            true);
        } else if (msg.includes('File too large') || msg.includes('fileSize')) {
          this.showError('error', 'File Too Large',
            'File exceeds the 50MB maximum size.',
            true);
        } else {
          this.showError('error', 'Upload Error', msg, true,
            [{ label: 'Try Again', icon: 'refresh', callback: () => this.dismissError() }]
          );
        }
        this.cdr.markForCheck();
      },
    });
  }

  private stopUploadTimer(): void {
    if (this.uploadTimerInterval) {
      clearInterval(this.uploadTimerInterval);
      this.uploadTimerInterval = null;
    }
  }

  get uploadElapsedFormatted(): string {
    const m = Math.floor(this.uploadElapsedSeconds / 60);
    const s = this.uploadElapsedSeconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  showError(type: ErrorPanel['type'], title: string, message: string, dismissible: boolean, actions?: ErrorPanel['actions']): void {
    this.errorPanel = { type, title, message, dismissible, actions };
  }

  dismissError(): void {
    this.errorPanel = null;
  }

  confirmHeader(): void {
    if (!this.batchId) return;
    this.loading = true;
    this.successBanner = null;

    this.workbenchService.confirmHeader(this.batchId, this.selectedHeaderRow).subscribe({
      next: (result: any) => {
        if (result.headers?.length) {
          this.headers = result.headers;
        }
        if (result.reclassified > 0) {
          this.snackBar.open(`Header confirmed at row ${this.selectedHeaderRow}. ${result.reclassified} rows reclassified.`, 'OK', { duration: 4000 });
        }
        this.loading = false;
        this.setStep(2);
        this.suggestMappings();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loading = false;
        this.snackBar.open(err.error?.message || 'Failed to confirm header', 'OK', { duration: 5000 });
        this.cdr.markForCheck();
      },
    });
  }

  onHeaderRowChanged(): void {
    const row = this.previewRows.find(r => r.lineNumber === this.selectedHeaderRow);
    if (row) {
      this.headers = row.cells;
    }
  }

  loadPreviewRows(): void {
    if (!this.batchId) return;
    this.workbenchService.getRawRows(this.batchId).subscribe({
      next: (response: any) => {
        const rows = response?.rows || response || [];
        if (!Array.isArray(rows)) return;
        const headerRef = Math.max(this.selectedHeaderRow, this.uploadResult?.detectedHeaderRow ?? 0);
        this.previewRows = rows
          .filter((r: any) => r.sourceLineNumber <= Math.max(headerRef + 10, 15))
          .map((r: any) => {
            const vals = r.rawValues || {};
            const maxIdx = Math.max(...Object.keys(vals).map(Number).filter((n: number) => !isNaN(n)), 0);
            const cells: string[] = [];
            for (let j = 0; j <= maxIdx; j++) cells.push(vals[String(j)] || '');
            return { lineNumber: r.sourceLineNumber, cells, classification: r.rowClassification };
          });
        this.cdr.markForCheck();
      },
    });
  }

  suggestMappings(): void {
    if (!this.batchId) return;
    this.loading = true;

    this.workbenchService.suggestMapping(this.batchId, this.importMode).subscribe({
      next: (result) => {
        this.mappingSuggestions = result.suggestions || [];
        this.buildColumnMappingFromSuggestions();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loading = false;
        this.snackBar.open(err.error?.message || 'Failed to suggest mappings', 'OK', { duration: 5000 });
        this.cdr.markForCheck();
      },
    });
  }

  private buildColumnMappingFromSuggestions(): void {
    this.columnMapping = {};
    this.mappingFilterText = {};
    for (const s of this.mappingSuggestions) {
      if (s.sourceIndex !== null && s.confidence >= 70) {
        this.columnMapping[s.targetField] = {
          sourceIndex: s.sourceIndex,
          sourceHeader: s.sourceHeader,
          confidence: s.confidence,
          confirmed: true,
        };
        this.mappingFilterText[s.targetField] = this.headers[s.sourceIndex] || 'Column ' + s.sourceIndex;
      }
    }
    this.rebuildSampleCache();
  }

  onImportModeChanged(): void {
    this.suggestMappings();
  }

  updateMappingField(targetField: string, sourceIndex: number | null): void {
    if (sourceIndex === null || sourceIndex === -1) {
      delete this.columnMapping[targetField];
    } else {
      this.columnMapping[targetField] = {
        sourceIndex,
        sourceHeader: this.headers[sourceIndex] || `Column ${sourceIndex}`,
        confidence: 100,
        confirmed: true,
      };
    }
    this.rebuildSampleCache();
  }

  saveMapping(): void {
    if (!this.batchId) return;
    this.loading = true;

    this.workbenchService.saveMapping(this.batchId, this.importMode, this.columnMapping, this.signConvention).subscribe({
      next: (result) => {
        this.loading = false;
        this.mappingValidation = result;
        if (result.valid) {
          this.snackBar.open(`Mapping saved. Identity: ${result.identityMode}`, 'OK', { duration: 4000 });
          if (result.warnings?.length) {
            for (const w of result.warnings) {
              this.snackBar.open(w, 'Dismiss', { duration: 8000 });
            }
          }
          this.setStep(3);
        } else {
          this.snackBar.open('Mapping invalid: ' + result.errors?.join('; '), 'OK', { duration: 8000 });
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loading = false;
        this.snackBar.open(err.error?.message || 'Failed to save mapping', 'OK', { duration: 5000 });
        this.cdr.markForCheck();
      },
    });
  }

  runNormalizeAndValidate(): void {
    if (!this.batchId) return;
    this.loading = true;
    this.normValidatePhase = 'normalizing';
    this.normValidateProgress = 0;
    this.sampleDataCache = {};
    this.expandedRules = {};

    this.startProgressSimulation();

    this.workbenchService.normalizeAndValidate(this.batchId).subscribe({
      next: (result) => {
        this.stopProgressSimulation();
        this.normValidateProgress = 100;
        this.normValidatePhase = 'complete';
        this.loading = false;
        this.normalizationResult = result.normalization;
        this.validationSummary = result.validation;
        this.validationResults = result.validation?.results || [];
        this.loadCandidateTotalRows();

        if (result.status === 'validation_passed') {
          this.setStep(4);
          this.snackBar.open('Validation passed — ready to commit', 'OK', { duration: 4000 });
        } else {
          this.snackBar.open(`Validation failed: ${result.validation?.hardFails || 0} hard fails`, 'OK', { duration: 5000 });
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.stopProgressSimulation();
        this.normValidatePhase = 'idle';
        this.normValidateProgress = 0;
        this.loading = false;
        this.snackBar.open(err.error?.message || 'Normalization/validation failed', 'OK', { duration: 5000 });
        this.cdr.markForCheck();
      },
    });
  }

  private startProgressSimulation(): void {
    this.stopProgressSimulation();
    const start = Date.now();
    this.ngZone.runOutsideAngular(() => {
      this.progressInterval = setInterval(() => {
        const elapsed = (Date.now() - start) / 1000;
        let newProgress: number;
        let newPhase: 'normalizing' | 'validating';
        if (elapsed < 3) {
          newProgress = Math.min(45, elapsed * 15);
          newPhase = 'normalizing';
        } else {
          newProgress = Math.min(90, 45 + (elapsed - 3) * 5);
          newPhase = 'validating';
        }
        this.ngZone.run(() => {
          this.normValidateProgress = newProgress;
          this.normValidatePhase = newPhase;
          this.cdr.markForCheck();
        });
      }, 500);
    });
  }

  private stopProgressSimulation(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  toggleSampleData(ruleId: string): void {
    this.expandedRules[ruleId] = !this.expandedRules[ruleId];
    if (this.expandedRules[ruleId] && !this.sampleDataCache[ruleId] && !this.sampleDataLoading[ruleId]) {
      this.loadSampleData(ruleId);
    }
  }

  private loadSampleData(ruleId: string): void {
    if (!this.batchId) return;
    this.sampleDataLoading[ruleId] = true;
    this.workbenchService.getValidationSamples(this.batchId, ruleId).subscribe({
      next: (result) => {
        this.sampleDataCache[ruleId] = result;
        this.sampleDataLoading[ruleId] = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.sampleDataLoading[ruleId] = false;
        this.cdr.markForCheck();
      },
    });
  }

  goBackToMapping(): void {
    this.currentStep = 2;
    this.normalizationResult = null;
    this.validationSummary = null;
    this.validationResults = [];
    this.normValidatePhase = 'idle';
    this.normValidateProgress = 0;
  }

  loadCandidateTotalRows(): void {
    if (!this.batchId) return;
    this.workbenchService.getRawRows(this.batchId, 'candidate_total').subscribe({
      next: (response: any) => {
        const rows = response?.rows || response || [];
        if (!Array.isArray(rows)) return;
        this.candidateTotalRows = rows.map((r: any) => {
          const vals = r.rawValues || {};
          const maxIdx = Math.max(...Object.keys(vals).map(Number).filter((n: number) => !isNaN(n)), 0);
          const cells: string[] = [];
          for (let j = 0; j <= maxIdx; j++) cells.push(vals[String(j)] || '');
          return { ...r, cells };
        });
        this.cdr.markForCheck();
      },
    });
  }

  reclassifyRow(rowId: string, newClassification: string): void {
    if (!this.batchId) return;
    this.workbenchService.updateRowClassification(
      this.batchId, rowId, newClassification,
    ).subscribe({
      next: () => {
        this.snackBar.open(`Row reclassified as ${newClassification}`, 'OK', { duration: 3000 });
        this.loadCandidateTotalRows();
        this.cdr.markForCheck();
      },
    });
  }

  overrideWarning(): void {
    if (!this.batchId || !this.selectedWarningRuleId) return;
    this.loading = true;

    const overriddenRuleId = this.selectedWarningRuleId;

    this.workbenchService.overrideWarning(
      this.batchId,
      this.selectedWarningRuleId,
      this.overrideReason,
    ).subscribe({
      next: (result) => {
        this.loading = false;
        this.snackBar.open(`Warning ${overriddenRuleId} overridden`, 'OK', { duration: 3000 });
        this.overrideReason = '';
        this.selectedWarningRuleId = '';

        const idx = this.validationResults.findIndex((r: any) => r.ruleId === overriddenRuleId);
        if (idx >= 0) {
          this.validationResults[idx] = { ...this.validationResults[idx], status: 'pass', overridden: true };
        }

        if (result.allWarningsOverridden && this.validationSummary) {
          this.validationSummary = { ...this.validationSummary, overallStatus: 'validation_passed' };
          this.setStep(4);
          this.snackBar.open('All warnings overridden — ready to commit', 'OK', { duration: 4000 });
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loading = false;
        this.snackBar.open(err.error?.message || 'Override failed', 'OK', { duration: 5000 });
        this.cdr.markForCheck();
      },
    });
  }

  commitBatch(): void {
    if (!this.batchId) return;
    this.loading = true;

    this.workbenchService.commit(this.batchId).subscribe({
      next: (result) => {
        this.loading = false;
        this.commitResult = result;
        this.setStep(5);
        this.snackBar.open(`Committed ${result.rowsCommitted} rows`, 'OK', { duration: 5000 });
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loading = false;
        this.snackBar.open(err.error?.message || 'Commit failed', 'OK', { duration: 5000 });
        this.cdr.markForCheck();
      },
    });
  }

  abandonBatch(): void {
    if (!this.batchId) return;

    this.workbenchService.abandon(this.batchId).subscribe({
      next: () => {
        this.snackBar.open('Batch abandoned', 'OK', { duration: 3000 });
        this.resetWorkbench();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Abandon failed', 'OK', { duration: 5000 });
        this.cdr.markForCheck();
      },
    });
  }

  resetWorkbench(): void {
    this.currentStep = 0;
    this.highestStepReached = 0;
    this.batchId = null;
    this.uploadResult = null;
    this.headers = [];
    this.mappingSuggestions = [];
    this.columnMapping = {};
    this.mappingValidation = null;
    this.normalizationResult = null;
    this.validationSummary = null;
    this.validationResults = [];
    this.commitResult = null;
    this.errorPanel = null;
    this.successBanner = null;
    this.selectedFile = null;
    this.selectedFileInfo = null;
    this.showConfirmDialog = false;
    this.uploading = false;
    this.stuckBatch = null;
    this.mappingFilterText = {};
    this.loadBatchHistory();
    this.checkForStuckBatch();
  }

  loadBatchHistory(): void {
    this.workbenchService.getTenantBatches(this.tenantId, this.financialYearId).subscribe({
      next: (result) => {
        this.batchHistory = result.batches || [];
        this.cdr.markForCheck();
      },
    });
  }

  viewBatch(batchId: string): void {
    this.workbenchService.getBatch(batchId).subscribe({
      next: (result) => {
        this.batchDetail = result;
        this.cdr.markForCheck();
      },
    });
  }

  refreshValidation(): void {
    if (!this.batchId) return;
    this.workbenchService.getValidation(this.batchId).subscribe({
      next: (result) => {
        this.validationResults = result.results || [];
        if (result.overallStatus) {
          this.validationSummary = { ...this.validationSummary, ...result };
        }
        this.cdr.markForCheck();
      },
    });
  }

  setStep(step: number): void {
    this.currentStep = step;
    if (step > this.highestStepReached) {
      this.highestStepReached = step;
    }
  }

  navigateToStep(step: number): void {
    if (step > this.highestStepReached || step === this.currentStep) return;
    this.currentStep = step;
    if (step === 1 && this.batchId) {
      this.loadPreviewRows();
    } else if (step === 2 && this.batchId) {
      if (!this.mappingSuggestions.length) {
        this.suggestMappings();
      }
    }
    this.cdr.markForCheck();
  }

  canNavigateToStep(step: number): boolean {
    return step <= this.highestStepReached && step !== this.currentStep;
  }

  getFilteredHeaders(targetField: string): { index: number; label: string }[] {
    const filter = (this.mappingFilterText[targetField] || '').toLowerCase().trim();
    const items = this.headers.map((h, i) => ({ index: i, label: h || 'Column ' + i }));
    if (!filter) return items;
    return items.filter(item => item.label.toLowerCase().includes(filter));
  }

  onMappingFilterInput(targetField: string, value: string): void {
    this.mappingFilterText[targetField] = value;
  }

  onMappingSelected(targetField: string, selectedIndex: number): void {
    if (selectedIndex >= 0 && selectedIndex < this.headers.length) {
      this.updateMappingField(targetField, selectedIndex);
      this.mappingFilterText[targetField] = this.headers[selectedIndex] || 'Column ' + selectedIndex;
      this.cdr.markForCheck();
    }
  }

  clearMapping(targetField: string): void {
    this.updateMappingField(targetField, null);
    this.mappingFilterText[targetField] = '';
    this.cdr.markForCheck();
  }

  getMappingDisplayText(targetField: string): string {
    if (this.mappingFilterText[targetField] !== undefined && this.mappingFilterText[targetField] !== null) {
      return this.mappingFilterText[targetField];
    }
    const mapping = this.columnMapping[targetField];
    if (!mapping) return '';
    return this.headers[mapping.sourceIndex] || 'Column ' + mapping.sourceIndex;
  }

  resetMappingFilterText(targetField: string): void {
    const mapping = this.columnMapping[targetField];
    if (mapping) {
      this.mappingFilterText[targetField] = this.headers[mapping.sourceIndex] || 'Column ' + mapping.sourceIndex;
    } else {
      this.mappingFilterText[targetField] = '';
    }
  }

  get warningResults(): any[] {
    return this.validationResults.filter((r: any) => r.status === 'warning');
  }

  get hardFailResults(): any[] {
    return this.validationResults.filter((r: any) => r.severity === 'hard_fail' && r.status === 'fail');
  }

  get passedResults(): any[] {
    return this.validationResults.filter((r: any) => r.status === 'pass');
  }

  get identityModeLabel(): string {
    const mode = this.mappingValidation?.identityMode || this.validationSummary?.identityMode;
    const labels: Record<string, string> = {
      scoa_item: 'SCOA Item Code',
      scoa_guid: 'SCOA GUID',
      source_account_code: 'Source Account Code',
      description_fallback: 'Description Fallback (weaker identity)',
    };
    return labels[mode] || mode || 'Not set';
  }

  getMappedField(targetField: string): number {
    return this.columnMapping[targetField]?.sourceIndex ?? -1;
  }

  cachedSampleRows: { lineNumber: number; cells: string[] }[] = [];
  cachedSampleValues: Record<string, [string, string]> = {};

  private rebuildSampleCache(): void {
    const headerLine = this.selectedHeaderRow || this.uploadResult?.detectedHeaderRow || 1;
    const excluded = new Set(['header', 'blank', 'candidate_total', 'ignored']);
    this.cachedSampleRows = this.previewRows
      .filter(r => r.lineNumber > headerLine && !excluded.has((r as any).classification || ''))
      .slice(0, 2);
    this.cachedSampleValues = {};
    for (const [targetField, mapping] of Object.entries(this.columnMapping)) {
      const colIdx = mapping?.sourceIndex;
      if (colIdx == null || colIdx < 0) continue;
      const v0 = this.cachedSampleRows[0]?.cells[colIdx] || '';
      const v1 = this.cachedSampleRows[1]?.cells[colIdx] || '';
      this.cachedSampleValues[targetField] = [
        v0.length > 40 ? v0.substring(0, 37) + '...' : v0,
        v1.length > 40 ? v1.substring(0, 37) + '...' : v1,
      ];
    }
  }

  fieldDescriptions: Record<string, string> = {
    scoaItemCode: 'The mSCOA item account code (e.g. IE019001000000000000000000000000000000)',
    scoaItemGuid: 'The unique GUID identifier for the SCOA item',
    sourceAccountCode: 'Your municipality\'s own internal GL account number (e.g. 1001, GL-4520, ACC/REV/001). Map this if your file has an account number separate from the SCOA code.',
    sortDesc: 'The line description or account name (e.g. "Rates and Taxes", "Water Sales")',
    scoaItemDescription: 'The full SCOA item description from the chart of accounts',
    closingBalance: 'The closing balance amount for the period',
    debit: 'The debit amount column',
    credit: 'The credit amount column',
    openingBalance: 'Opening balance at start of period',
    budgetOriginal: 'Original approved budget amount',
    budgetAdjusted: 'Adjusted budget amount after mid-year adjustments',
    budgetActual: 'Actual year-to-date expenditure/revenue amount',
    priorYearClosing: 'Previous financial year closing balance',
  };

  getStepLabel(step: number): string {
    return this.stepLabels[step] || '';
  }

  getSampleColumns(ruleId: string): string[] {
    const data = this.sampleDataCache[ruleId];
    if (!data?.samples?.length) return [];
    return Object.keys(data.samples[0]);
  }

  getSeverityColor(severity: string, status: string): string {
    if (status === 'pass') return 'green';
    if (severity === 'hard_fail') return 'red';
    return 'orange';
  }

  getBatchAction(batch: any): string {
    const activeStates = ['uploaded', 'parsed', 'mapping_in_progress', 'validation_failed', 'validation_passed'];
    if (activeStates.includes(batch.status)) return 'Resume';
    if (batch.status === 'committed') return 'View';
    return '';
  }

  onBatchAction(batch: any): void {
    const action = this.getBatchAction(batch);
    if (action === 'Resume') {
      this.batchId = batch.id;
      this.uploadResult = batch;
      const statusStepMap: Record<string, number> = {
        uploaded: 0, parsed: 1, mapping_in_progress: 2,
        validation_failed: 3, validation_passed: 4,
      };
      const step = statusStepMap[batch.status] ?? 0;
      this.setStep(step);
      this.stuckBatch = null;
      if (this.currentStep === 1) this.loadPreviewRows();
    } else if (action === 'View') {
      this.viewBatch(batch.id);
    }
  }

  goToMapping(): void {
    const qp: any = { financialYearId: this.financialYearId };
    if (this.compilationId) {
      qp.compilationId = this.compilationId;
    }
    this.router.navigate(['/mapping-workbench'], { queryParams: qp });
  }
}
