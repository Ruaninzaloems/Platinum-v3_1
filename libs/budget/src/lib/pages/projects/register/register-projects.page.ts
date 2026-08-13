import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../../core/services/api.service';

export interface ImportBatch {
  id: number;
  fileName: string;
  importDate: string;
  financialYear: string;
  importType: string;
  projectsImported: number;
  totalBudgetY1: number;
  totalBudgetY2: number;
  totalBudgetY3: number;
  registrationStatus: string;
  createdBy: string;
  selected: boolean;
}

@Component({
  selector: 'app-register-projects',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './register-projects.page.html',
  styleUrls: ['./register-projects.page.scss']
})
export class RegisterProjectsPage implements OnInit {
  batches: ImportBatch[] = [];
  loading = false;
  submitting = false;

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadBatches();
  }

  loadBatches() {
    this.loading = true;
    this.cdr.markForCheck();
    this.api.getImportBatches().subscribe({
      next: data => {
        this.batches = data.map((b: any) => ({ ...b, selected: false }));
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  get allSelected(): boolean {
    return this.batches.length > 0 && this.batches.every(b => b.selected);
  }

  toggleAll(checked: boolean) {
    this.batches.forEach(b => b.selected = checked);
    this.cdr.markForCheck();
  }

  get hasSelection(): boolean {
    return this.batches.some(b => b.selected);
  }

  onSubmit() {
    const ids = this.batches.filter(b => b.selected).map(b => b.id);
    if (!ids.length) return;
    this.submitting = true;
    this.cdr.markForCheck();
    this.api.registerBatches(ids).subscribe({
      next: () => {
        this.submitting = false;
        this.loadBatches();
      },
      error: () => { this.submitting = false; this.cdr.detectChanges(); }
    });
  }

  onCancel() {
    this.batches.forEach(b => b.selected = false);
    this.cdr.markForCheck();
  }

  onDownload(id: number) {
    window.open(this.api.downloadProjectImport(id), '_blank');
  }

  formatAmount(v: number): string {
    if (!v && v !== 0) return '0.00';
    return v.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatDate(d: string): string {
    if (!d) return '';
    const dt = new Date(d);
    return dt.toLocaleDateString('en-ZA', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
}
