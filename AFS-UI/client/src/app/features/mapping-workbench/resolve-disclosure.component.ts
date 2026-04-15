import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MappingWorkbenchService } from './mapping-workbench.service';

@Component({
  selector: 'app-resolve-disclosure',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatChipsModule, MatProgressBarModule, MatSnackBarModule,
    MatTooltipModule, MatCheckboxModule, MatExpansionModule,
    MatDividerModule, MatInputModule, MatFormFieldModule,
    MatSelectModule,
  ],
  templateUrl: './resolve-disclosure.component.html',
  styleUrls: ['./resolve-disclosure.component.scss'],
})
export class ResolveDisclosureComponent implements OnChanges {
  @Input() runId = '';
  @Input() disclosureId = '';
  @Input() runStatus = '';
  @Output() closed = new EventEmitter<void>();
  @Output() applied = new EventEmitter<void>();

  loading = false;
  preview: any = null;

  bulkApplyPreview: any = null;
  bulkApplyLoading = false;
  bulkApplyReason = '';
  bulkApplyConfirmLarge = false;
  bulkApplyAckLow = false;
  showBulkConfirm = false;
  selectedTargetId = '';
  selectedTargetLabel = '';
  selectedConfidence = '';
  selectedRowIds: string[] = [];
  showManualPicker = false;
  manualPickerRowIds: string[] = [];

  lastBulkResult: any = null;
  undoing = false;

  constructor(
    private workbenchService: MappingWorkbenchService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['disclosureId'] || changes['runId']) {
      if (this.runId && this.disclosureId) {
        this.loadPreview();
      }
    }
  }

  loadPreview(preserveBulkResult = false): void {
    this.loading = true;
    if (!preserveBulkResult) {
      this.lastBulkResult = null;
    }
    this.workbenchService.getResolvePreview(this.runId, this.disclosureId).subscribe({
      next: (data) => {
        this.preview = data;
        this.loading = false;
      },
      error: (err) => {
        this.showError(err.error?.message || 'Failed to load resolve preview');
        this.loading = false;
      },
    });
  }

  get isDraft(): boolean {
    return this.runStatus === 'draft';
  }

  getConfidenceColor(conf: string): string {
    switch (conf) {
      case 'HIGH': return '#4caf50';
      case 'MEDIUM': return '#ff9800';
      case 'LOW': return '#f44336';
      default: return '#9e9e9e';
    }
  }

  getConfidenceIcon(conf: string): string {
    switch (conf) {
      case 'HIGH': return 'verified';
      case 'MEDIUM': return 'help_outline';
      case 'LOW': return 'warning';
      default: return 'circle';
    }
  }

  getProgressColor(pct: number): string {
    if (pct >= 80) return 'primary';
    if (pct >= 50) return 'accent';
    return 'warn';
  }

  selectSuggestion(suggestion: any): void {
    this.selectedTargetId = suggestion.disclosureId;
    this.selectedTargetLabel = suggestion.label;
    this.selectedConfidence = suggestion.confidenceScore;
    this.selectedRowIds = [...suggestion.matchedRowIds];
    this.showManualPicker = false;

    if (suggestion.confidenceScore === 'HIGH') {
      this.bulkApplyReason = `Auto-suggested (HIGH confidence): ${suggestion.rationale}`;
      this.loadBulkApplyPreview();
    } else if (suggestion.confidenceScore === 'MEDIUM') {
      this.bulkApplyReason = `Suggested (MEDIUM confidence): ${suggestion.rationale}`;
      this.loadBulkApplyPreview();
    } else if (suggestion.confidenceScore === 'LOW') {
      this.bulkApplyReason = '';
      this.showManualPicker = true;
      this.manualPickerRowIds = [...suggestion.matchedRowIds];
    } else {
      this.bulkApplyReason = '';
      this.showManualPicker = true;
      this.manualPickerRowIds = [];
    }
  }

  openFullPicker(rows: any[]): void {
    this.showManualPicker = true;
    this.manualPickerRowIds = rows.map((r: any) => r.id);
    this.selectedTargetId = '';
    this.selectedTargetLabel = '';
    this.selectedConfidence = 'NONE';
    this.bulkApplyReason = '';
  }

  confirmManualPick(targetId: string, targetLabel: string): void {
    this.selectedTargetId = targetId;
    this.selectedTargetLabel = targetLabel;
    this.selectedRowIds = [...this.manualPickerRowIds];
    this.showManualPicker = false;

    if (!this.bulkApplyReason) {
      this.bulkApplyReason = `Manual selection: ${targetLabel}`;
    }
    this.loadBulkApplyPreview();
  }

  toggleManualRow(rowId: string): void {
    const idx = this.manualPickerRowIds.indexOf(rowId);
    if (idx >= 0) {
      this.manualPickerRowIds.splice(idx, 1);
    } else {
      this.manualPickerRowIds.push(rowId);
    }
  }

  isRowSelected(rowId: string): boolean {
    return this.manualPickerRowIds.includes(rowId);
  }

  selectMscoaGroup(group: any, targetId: string, targetLabel: string): void {
    this.selectedTargetId = targetId;
    this.selectedTargetLabel = targetLabel;
    this.selectedConfidence = 'MEDIUM';
    this.selectedRowIds = group.rows.map((r: any) => r.id);
    this.bulkApplyReason = `Manual group selection: mSCOA "${group.mscoaText}" → ${targetLabel}`;
    this.loadBulkApplyPreview();
  }

  loadBulkApplyPreview(): void {
    if (!this.selectedTargetId || this.selectedRowIds.length === 0) return;
    this.bulkApplyLoading = true;
    this.workbenchService.getBulkApplyPreview(this.runId, this.disclosureId, {
      targetDisclosureId: this.selectedTargetId,
      rowIds: this.selectedRowIds,
    }).subscribe({
      next: (data) => {
        this.bulkApplyPreview = data;
        this.bulkApplyLoading = false;
        this.showBulkConfirm = true;
      },
      error: (err) => {
        this.showError(err.error?.message || 'Failed to load bulk apply preview');
        this.bulkApplyLoading = false;
      },
    });
  }

  executeBulkApply(): void {
    if (!this.bulkApplyReason.trim()) {
      this.showError('Reason is required for bulk apply');
      return;
    }
    this.bulkApplyLoading = true;
    this.workbenchService.executeBulkApply(this.runId, this.disclosureId, {
      targetDisclosureId: this.selectedTargetId,
      rowIds: this.selectedRowIds,
      reason: this.bulkApplyReason,
      confidenceScore: this.selectedConfidence,
      confirmLargeBatch: this.bulkApplyConfirmLarge,
      acknowledgeLowConfidence: this.bulkApplyAckLow,
    }).subscribe({
      next: (result) => {
        this.lastBulkResult = result;
        this.showBulkConfirm = false;
        this.bulkApplyPreview = null;
        this.bulkApplyLoading = false;
        this.snackBar.open(
          `Applied ${result.applied} rows to ${this.selectedTargetLabel}`,
          'Close', { duration: 4000, panelClass: 'snack-success' },
        );
        this.loadPreview(true);
        this.applied.emit();
      },
      error: (err) => {
        const msg = err.error?.message || 'Bulk apply failed';
        if (msg.includes('LARGE_BATCH')) {
          this.bulkApplyConfirmLarge = false;
        }
        this.showError(msg);
        this.bulkApplyLoading = false;
      },
    });
  }

  undoLastBulk(): void {
    this.undoing = true;
    this.workbenchService.undoLastBulkApply(this.runId).subscribe({
      next: (result) => {
        this.snackBar.open(
          `Undone ${result.undone} rows (batch: ${result.batchCorrelationId})`,
          'Close', { duration: 4000, panelClass: 'snack-success' },
        );
        this.lastBulkResult = null;
        this.undoing = false;
        this.loadPreview();
        this.applied.emit();
      },
      error: (err) => {
        this.showError(err.error?.message || 'Undo failed');
        this.undoing = false;
      },
    });
  }

  cancelBulkApply(): void {
    this.showBulkConfirm = false;
    this.bulkApplyPreview = null;
    this.selectedTargetId = '';
    this.selectedRowIds = [];
    this.bulkApplyReason = '';
  }

  formatRand(value: number): string {
    if (value == null) return 'R 0';
    const abs = Math.abs(value);
    const formatted = abs.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return value < 0 ? `(R ${formatted})` : `R ${formatted}`;
  }

  close(): void {
    this.closed.emit();
  }

  private showError(msg: string): void {
    this.snackBar.open(msg, 'Close', { duration: 6000, panelClass: 'snack-error' });
  }
}
