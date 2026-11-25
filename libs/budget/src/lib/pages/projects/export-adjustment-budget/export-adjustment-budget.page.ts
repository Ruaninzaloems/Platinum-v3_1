import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../../core/services/api.service';
import { BudgetVersionSummary } from '../../../core/models/budget.models';

@Component({
  selector: 'app-export-adjustment-budget',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './export-adjustment-budget.page.html',
  styleUrls: ['./export-adjustment-budget.page.scss']
})
export class ExportAdjustmentBudgetPage implements OnInit {
  records: BudgetVersionSummary[] = [];
  loading = false;

  constructor(
    private api: ApiService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.cdr.markForCheck();
    this.api.getBudgetVersions().subscribe({
      next: versions => {
        this.records = versions;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  approverName(r: BudgetVersionSummary): string {
    return r.lockedBy || r.createdBy || '—';
  }

  approvalDate(r: BudgetVersionSummary): string | null {
    return r.councilAdoptionDate || r.lockedOn || r.createdOn;
  }

  formatAmount(v: number): string {
    if (!v) return '0.00';
    return v.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  download(r: BudgetVersionSummary) {
    const rows = [
      ['Approver Name', 'Fin Year', 'Approval Date', 'Total Budget Y1', 'Total Budget Y2', 'Total Budget Y3'],
      [this.approverName(r), r.financialYear, this.approvalDate(r) ?? '', r.totalYear1, r.totalYear2, r.totalYear3]
    ];
    const csv = rows.map(row => row.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AdjustmentBudget_${r.financialYear}_${r.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  onCancel() {
    this.router.navigate(['/projects']);
  }
}
