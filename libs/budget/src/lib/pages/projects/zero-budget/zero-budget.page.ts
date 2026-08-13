import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../../core/services/api.service';
import { FinancialYear } from '../../../core/models/budget.models';

export interface ZeroBudgetSummaryRow {
  batchId: number;
  totalItemsImported: number;
  errorRecords: number;
  fileName: string;
  status: string;
}

@Component({
  selector: 'app-zero-budget',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatSelectModule, MatFormFieldModule, MatInputModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './zero-budget.page.html',
  styleUrls: ['./zero-budget.page.scss']
})
export class ZeroBudgetPage implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  step = 0;

  financialYears: FinancialYear[] = [];
  selectedYear = '';
  selectedFile: File | null = null;

  loading = false;
  uploading = false;

  batchId: number | null = null;
  summaryRow: ZeroBudgetSummaryRow | null = null;

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loading = true;
    this.cdr.markForCheck();
    this.api.getFinancialYears().subscribe({
      next: years => {
        this.financialYears = years;
        const active = years.find(y => y.isActive);
        if (active) this.selectedYear = active.yearCode;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] ?? null;
    this.cdr.markForCheck();
  }

  onUpload() {
    const fd = new FormData();
    fd.append('financialYear', this.selectedYear);
    fd.append('file', this.selectedFile!);

    this.uploading = true;
    this.cdr.markForCheck();

    this.api.uploadZeroBudgetImport(fd).subscribe({
      next: result => {
        this.batchId = result.batchId;
        this.summaryRow = {
          batchId: result.batchId,
          totalItemsImported: result.totalItemsImported,
          errorRecords: result.errorRecords,
          fileName: result.fileName,
          status: result.status
        };
        this.uploading = false;
        this.step = 1;
        this.cdr.detectChanges();
      },
      error: () => {
        this.uploading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onDownload() {
    if (!this.batchId) return;
    window.open(this.api.downloadZeroBudgetImport(this.batchId), '_blank');
  }

  onDownloadTemplate() {
    window.open(this.api.zeroBudgetTemplate(), '_blank');
  }

  onDownloadTemplateSample() {
    window.open(this.api.zeroBudgetTemplateSample(), '_blank');
  }

  statusLabel(s: string): string {
    if (s === 'Staged') return 'Ready';
    if (s === 'StagedWithErrors') return 'Errors Found';
    return s;
  }
}
