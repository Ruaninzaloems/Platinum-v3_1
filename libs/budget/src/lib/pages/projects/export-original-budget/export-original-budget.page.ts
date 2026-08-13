import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../../core/services/api.service';
import { ConstantsApiService } from '../../../core/services/constants-api.service';
import { FinancialYear, BudgetVersionSummary } from '../../../core/models/budget.models';

@Component({
  selector: 'app-export-original-budget',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule,
    MatSelectModule, MatFormFieldModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule
  ],
  templateUrl: './export-original-budget.page.html',
  styleUrls: ['./export-original-budget.page.scss']
})
export class ExportOriginalBudgetPage implements OnInit {
  financialYears: FinancialYear[] = [];
  budgetVersions: BudgetVersionSummary[] = [];
  projectStatuses: any[] = [];
  budgetTypes: any[] = [];

  selectedFyId: number | null = null;
  selectedVersionId: number | null = null;
  selectedStatusId: number | string = 'ALL';
  selectedBudgetTypes: number[] = [];
  selectedFileType = 'CSV';

  loading = false;
  submitting = false;

  constructor(
    private api: ApiService,
    private constants: ConstantsApiService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadDropdowns();
  }

  loadDropdowns() {
    this.loading = true;
    this.cdr.markForCheck();

    this.api.getFinancialYears().subscribe({
      next: fys => {
        this.financialYears = fys;
        const active = fys.find(f => f.isActive);
        if (active) {
          this.selectedFyId = active.id;
          this.loadBudgetVersions(active.id);
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });

    this.constants.getStatuses('ProjectRegister').subscribe({
      next: s => { this.projectStatuses = s; this.cdr.markForCheck(); },
      error: () => {}
    });

    this.constants.getPlanCapitalOperationalTypes().subscribe({
      next: t => {
        this.budgetTypes = t;
        this.selectedBudgetTypes = t.map((x: any) => x.typeValue);
        this.cdr.markForCheck();
      },
      error: () => {}
    });
  }

  onFyChange() {
    this.selectedVersionId = null;
    if (this.selectedFyId) {
      this.loadBudgetVersions(this.selectedFyId);
    }
  }

  loadBudgetVersions(fyId: number) {
    this.api.getBudgetVersions(fyId).subscribe({
      next: v => { this.budgetVersions = v; this.cdr.markForCheck(); },
      error: () => {}
    });
  }

  get budgetTypeLabel(): string {
    if (!this.selectedBudgetTypes.length) return 'None selected';
    if (this.selectedBudgetTypes.length === this.budgetTypes.length) {
      return `Capital Operational Types (${this.budgetTypes.length})`;
    }
    return `${this.selectedBudgetTypes.length} type(s) selected`;
  }

  onSubmit() {
    this.submitting = true;
    this.cdr.markForCheck();
    setTimeout(() => {
      this.submitting = false;
      this.cdr.detectChanges();
      alert('Export initiated. The file will be downloaded shortly.');
    }, 1200);
  }

  onCancel() {
    this.router.navigate(['/projects']);
  }
}
