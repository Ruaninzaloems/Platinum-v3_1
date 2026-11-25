import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../../core/services/api.service';
import { FinancialYear } from '../../../core/models/budget.models';

@Component({
  selector: 'app-approve-final',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule,
    MatSelectModule, MatFormFieldModule, MatInputModule,
    MatCheckboxModule, MatDatepickerModule, MatNativeDateModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './approve-final.page.html',
  styleUrls: ['./approve-final.page.scss']
})
export class ApproveFinalPage implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  financialYears: FinancialYear[] = [];
  selectedYearId: number | null = null;
  selectedYearCode = '';

  approved = false;
  selectedFile: File | null = null;
  councilApprovedDate: Date | null = null;
  versionName = '';
  comments = '';

  loading = false;
  submitting = false;
  successMsg = '';
  errorMsg = '';

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
        if (active) {
          this.selectedYearId = active.id;
          this.selectedYearCode = active.yearCode;
          this.loadVersionName(active.id, active.yearCode);
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  onYearChange(yearId: number) {
    const year = this.financialYears.find(y => y.id === yearId);
    if (year) {
      this.selectedYearCode = year.yearCode;
      this.loadVersionName(year.id, year.yearCode);
    }
    this.cdr.markForCheck();
  }

  private loadVersionName(yearId: number, yearCode: string) {
    this.api.getBudgetVersions(yearId).subscribe({
      next: versions => {
        if (versions?.length) {
          this.versionName = versions[0].versionName ?? this.deriveVersionName(yearCode);
        } else {
          this.versionName = this.deriveVersionName(yearCode);
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.versionName = this.deriveVersionName(yearCode);
        this.cdr.detectChanges();
      }
    });
  }

  private deriveVersionName(yearCode: string): string {
    return yearCode.replace('/', '') + '_ORGB001';
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] ?? null;
    this.cdr.markForCheck();
  }

  onSubmit() {
    this.submitting = true;
    this.successMsg = '';
    this.errorMsg = '';
    this.cdr.markForCheck();

    const fd = new FormData();
    fd.append('financialYear', this.selectedYearCode);
    fd.append('approved', String(this.approved));
    fd.append('versionName', this.versionName);
    fd.append('comments', this.comments);
    if (this.councilApprovedDate) {
      fd.append('councilApprovedDate', this.councilApprovedDate.toISOString());
    }
    if (this.selectedFile) fd.append('file', this.selectedFile);

    this.api.approveFinalBudget(fd).subscribe({
      next: (res: any) => {
        this.successMsg = res.message ?? 'Budget approved successfully.';
        this.submitting = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMsg = 'Submission failed. Please try again.';
        this.submitting = false;
        this.cdr.detectChanges();
      }
    });
  }

  onCancel() {
    this.approved = false;
    this.selectedFile = null;
    this.councilApprovedDate = null;
    this.comments = '';
    this.successMsg = '';
    this.errorMsg = '';
    if (this.fileInput) this.fileInput.nativeElement.value = '';
    this.cdr.markForCheck();
  }
}
