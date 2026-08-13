import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatRadioModule } from '@angular/material/radio';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../../core/services/api.service';
import { FinancialYear } from '../../../core/models/budget.models';

@Component({
  selector: 'app-approve-draft',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatSelectModule, MatFormFieldModule, MatRadioModule, MatProgressSpinnerModule],
  templateUrl: './approve-draft.page.html',
  styleUrls: ['./approve-draft.page.scss']
})
export class ApproveDraftPage implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  financialYears: FinancialYear[] = [];
  selectedYear = '';
  action: 'Approve' | 'Reject' = 'Approve';
  selectedFile: File | null = null;

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
        if (active) this.selectedYear = active.yearCode;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  get idpPeriod(): string {
    if (!this.selectedYear) return '';
    const parts = this.selectedYear.split('/');
    const endYear = parts.length > 1 ? parseInt(parts[1]) : parseInt(parts[0]) + 1;
    return `${endYear} - ${endYear + 4}`;
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
    fd.append('financialYear', this.selectedYear);
    fd.append('action', this.action);
    if (this.selectedFile) fd.append('file', this.selectedFile);

    this.api.approveDraftBudget(fd).subscribe({
      next: (res: any) => {
        this.successMsg = res.message ?? 'Submitted successfully.';
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
    this.action = 'Approve';
    this.selectedFile = null;
    this.successMsg = '';
    this.errorMsg = '';
    if (this.fileInput) this.fileInput.nativeElement.value = '';
    this.cdr.markForCheck();
  }
}
