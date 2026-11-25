import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../../core/services/api.service';
import { FinancialYear, BudgetVersionSummary } from '../../../core/models/budget.models';

const RESTRICTED_EXTENSIONS = ['.exe', '.dmg', '.bat', '.sh', '.cmd', '.msi'];

@Component({
  selector: 'app-approve-adjustment',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './approve-adjustment.page.html',
  styleUrl: './approve-adjustment.page.scss',
})
export class ApproveAdjustmentPage implements OnInit {
  financialYears: FinancialYear[] = [];
  selectedYearId: number | null = null;

  approveChecked = false;
  selectedFile: File | null = null;
  fileError = '';
  councilApprovedDate = '';
  versionName = '';
  comments = '';

  submitting = false;
  submitSuccess = false;
  submitError = '';
  loading = true;

  constructor(
    private api: ApiService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.api.getFinancialYears().subscribe({
      next: years => {
        this.financialYears = years;
        const active = years.find(y => y.isActive) ?? years[0];
        if (active) {
          this.selectedYearId = active.id;
          this.loadVersionName(active.id);
        }
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  onYearChange() {
    if (this.selectedYearId) this.loadVersionName(this.selectedYearId);
  }

  loadVersionName(yearId: number) {
    const year = this.financialYears.find(y => y.id === yearId);
    if (!year) return;
    this.api.getBudgetVersions(yearId, undefined, undefined).subscribe({
      next: versions => {
        const adj = versions.filter(v =>
          v.versionType?.toLowerCase().includes('adjust'),
        );
        const num = adj.length + 1;
        const seq = num.toString().padStart(3, '0');
        this.versionName = `${year.yearCode}_ADJB${seq}`;
        this.cdr.markForCheck();
      },
      error: () => {
        const year = this.financialYears.find(y => y.id === yearId);
        this.versionName = year ? `${year.yearCode}_ADJB001` : '';
        this.cdr.markForCheck();
      },
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    this.fileError = '';
    this.selectedFile = null;
    if (!input.files?.length) return;
    const file = input.files[0];
    const name = file.name.toLowerCase();
    const blocked = RESTRICTED_EXTENSIONS.some(ext => name.endsWith(ext));
    if (blocked) {
      this.fileError = `Restricted file type. Do not upload: ${RESTRICTED_EXTENSIONS.join(', ')}`;
      input.value = '';
      this.cdr.markForCheck();
      return;
    }
    this.selectedFile = file;
    this.cdr.markForCheck();
  }

  get canSubmit(): boolean {
    return (
      !this.submitting &&
      !!this.selectedYearId &&
      this.approveChecked &&
      !!this.selectedFile &&
      !!this.councilApprovedDate &&
      !!this.comments.trim()
    );
  }

  onSubmit() {
    if (!this.canSubmit) return;
    this.submitting = true;
    this.submitError = '';
    this.cdr.markForCheck();

    const formData = new FormData();
    formData.append('financialYearId', String(this.selectedYearId));
    formData.append('councilApprovedDate', this.councilApprovedDate);
    formData.append('versionName', this.versionName);
    formData.append('comments', this.comments);
    if (this.selectedFile) formData.append('file', this.selectedFile);

    this.api.approveDraftBudget(formData).subscribe({
      next: () => {
        this.submitting = false;
        this.submitSuccess = true;
        this.cdr.markForCheck();
        setTimeout(() => this.router.navigate(['/adjustments/request']), 1500);
      },
      error: (err: any) => {
        this.submitting = false;
        this.submitError =
          err?.error?.message ?? err?.message ?? 'Submission failed. Please try again.';
        this.cdr.markForCheck();
      },
    });
  }

  onCancel() {
    this.router.navigate(['/adjustments/request']);
  }
}
