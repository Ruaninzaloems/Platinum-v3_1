import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../../core/services/api.service';
import { FinancialYear } from '../../../core/models/budget.models';

export interface ImportSummaryRow {
  batchId: number;
  totalProjectsImported: number;
  totalBudgetY1: number;
  totalBudgetY2: number;
  totalBudgetY3: number;
  errorRecords: number;
  fileName: string;
  status: string;
}

@Component({
  selector: 'app-import-projects',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatSelectModule, MatFormFieldModule, MatInputModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './import-projects.page.html',
  styleUrls: ['./import-projects.page.scss']
})
export class ImportProjectsPage implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  step = 0;

  financialYears: FinancialYear[] = [];
  importTypes = ['Original Budget', 'Adjustment Budget'];

  selectedYear = '';
  selectedImportType = '';
  selectedFile: File | null = null;

  loading = false;
  uploading = false;
  registering = false;
  done = false;

  batchId: number | null = null;
  summaryRow: ImportSummaryRow | null = null;
  uploadErrors: string[] = [];

  versionNumber = '';
  versionName = '';
  comments = '';
  registerErrors: string[] = [];

  constructor(
    private api: ApiService,
    private router: Router,
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

  get canUpload(): boolean {
    return !!this.selectedYear && !!this.selectedImportType && !!this.selectedFile;
  }

  get canFinish(): boolean {
    return !!this.versionName.trim() && !!this.comments.trim();
  }

  onUpload() {
    const fd = new FormData();
    fd.append('financialYear', this.selectedYear);
    fd.append('importType', this.selectedImportType);
    fd.append('file', this.selectedFile!);

    this.uploading = true;
    this.uploadErrors = [];
    this.cdr.markForCheck();

    this.api.uploadProjectImport(fd).subscribe({
      next: result => {
        this.batchId = result.batchId;
        this.uploadErrors = result.errors ?? [];
        this.summaryRow = {
          batchId: result.batchId,
          totalProjectsImported: result.totalProjectsImported,
          totalBudgetY1: result.totalBudgetY1,
          totalBudgetY2: result.totalBudgetY2,
          totalBudgetY3: result.totalBudgetY3,
          errorRecords: result.errorRecords,
          fileName: result.fileName,
          status: result.status
        };
        this.versionNumber = `${this.selectedYear}_B${String(result.batchId).padStart(3, '0')}`;
        this.uploading = false;
        this.step = 1;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.uploadErrors = [err?.error?.error ?? 'Upload failed. Please try again.'];
        this.uploading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onGoToRegister() {
    this.step = 2;
    this.cdr.markForCheck();
  }

  onFinish() {
    this.registering = true;
    this.registerErrors = [];
    this.cdr.markForCheck();

    this.api.registerProjectImport(this.batchId!, this.versionNumber, this.versionName, this.comments).subscribe({
      next: () => {
        this.registering = false;
        this.done = true;
        this.cdr.detectChanges();
        setTimeout(() => this.router.navigate(['/projects']), 2000);
      },
      error: () => {
        this.registerErrors = ['Registration failed. Please try again.'];
        this.registering = false;
        this.cdr.detectChanges();
      }
    });
  }

  onDownload() {
    if (!this.batchId) return;
    window.open(this.api.downloadProjectImport(this.batchId), '_blank');
  }

  formatAmount(v: number): string {
    if (!v) return '0.00';
    return v.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  statusLabel(s: string): string {
    if (s === 'Staged') return 'Ready';
    if (s === 'StagedWithErrors') return 'Errors Found';
    if (s === 'Registered') return 'Registered';
    return s;
  }
}
