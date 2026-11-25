import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ApiService } from '../../core/services/api.service';
import { FinancialYear } from '../../core/models/budget.models';

interface VirementRow {
  id: number;
  virementNumber: string;
  fromLegacyRef: string;
  toLegacyRef: string;
  fromProject: string;
  toProject: string;
  fromScoaProject: string;
  toScoaProject: string;
  fromScoaFunction: string;
  toScoaFunction: string;
  fromDivision: string;
  toDivision: string;
  fromScoaRegion: string;
  toScoaRegion: string;
  fromScoaItem: string;
  toScoaItem: string;
  fromScoaFund: string;
  toScoaFund: string;
  fromVirementAmount: number;
  toVirementAmount: number;
  _action: '' | 'Approve' | 'Reject';
  _rejectReason: string;
}

@Component({
  selector: 'app-virement-approvals',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatSelectModule, MatFormFieldModule],
  templateUrl: './virement-approvals.page.html',
  styleUrls: ['./virement-approvals.page.scss']
})
export class VirementApprovalsPage implements OnInit {
  financialYears: FinancialYear[] = [];
  selectedYearId: number | null = null;
  selectedProjectId: number | null = null;
  projects: { id: number; label: string }[] = [];

  rows: VirementRow[] = [];
  filteredRows: VirementRow[] = [];

  filters = {
    fromLegacyRef: '',
    toLegacyRef: '',
    fromProject: '',
    toProject: '',
    fromScoaProject: '',
    toScoaProject: '',
    fromScoaFunction: '',
    toScoaFunction: '',
    fromDivision: '',
    toDivision: '',
    fromScoaRegion: '',
    toScoaRegion: '',
    fromScoaItem: '',
    toScoaItem: '',
    fromScoaFund: '',
    toScoaFund: '',
    fromVirementAmount: '',
    toVirementAmount: ''
  };

  showSearchParams = true;
  loading = false;
  submitting = false;
  successMsg = '';
  errorMsg = '';

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.api.getFinancialYears().subscribe({
      next: years => {
        this.financialYears = years;
        const active = years.find(y => y.isActive);
        if (active) this.selectedYearId = active.id;
        this.loadProjects();
        this.cdr.detectChanges();
      }
    });
  }

  loadProjects() {
    this.api.getVirementApprovalProjects(this.selectedYearId ?? undefined).subscribe({
      next: p => { this.projects = p; this.cdr.detectChanges(); }
    });
  }

  onSearch() {
    this.loading = true;
    this.successMsg = '';
    this.errorMsg = '';
    this.cdr.markForCheck();
    this.api.getVirementApprovals(this.selectedYearId ?? undefined, this.selectedProjectId ?? undefined).subscribe({
      next: (data: any[]) => {
        this.rows = data.map(r => ({ ...r, _action: '', _rejectReason: '' }));
        this.applyFilters();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  onClear() {
    const active = this.financialYears.find(y => y.isActive);
    this.selectedYearId = active?.id ?? null;
    this.selectedProjectId = null;
    this.rows = [];
    this.filteredRows = [];
    this.filters = { fromLegacyRef: '', toLegacyRef: '', fromProject: '', toProject: '', fromScoaProject: '', toScoaProject: '', fromScoaFunction: '', toScoaFunction: '', fromDivision: '', toDivision: '', fromScoaRegion: '', toScoaRegion: '', fromScoaItem: '', toScoaItem: '', fromScoaFund: '', toScoaFund: '', fromVirementAmount: '', toVirementAmount: '' };
    this.successMsg = '';
    this.errorMsg = '';
    this.cdr.markForCheck();
  }

  applyFilters() {
    const f = this.filters;
    this.filteredRows = this.rows.filter(r =>
      contains(r.fromLegacyRef, f.fromLegacyRef) &&
      contains(r.toLegacyRef, f.toLegacyRef) &&
      contains(r.fromProject, f.fromProject) &&
      contains(r.toProject, f.toProject) &&
      contains(r.fromScoaProject, f.fromScoaProject) &&
      contains(r.toScoaProject, f.toScoaProject) &&
      contains(r.fromScoaFunction, f.fromScoaFunction) &&
      contains(r.toScoaFunction, f.toScoaFunction) &&
      contains(r.fromDivision, f.fromDivision) &&
      contains(r.toDivision, f.toDivision) &&
      contains(r.fromScoaRegion, f.fromScoaRegion) &&
      contains(r.toScoaRegion, f.toScoaRegion) &&
      contains(r.fromScoaItem, f.fromScoaItem) &&
      contains(r.toScoaItem, f.toScoaItem) &&
      contains(r.fromScoaFund, f.fromScoaFund) &&
      contains(r.toScoaFund, f.toScoaFund) &&
      contains(String(r.fromVirementAmount), f.fromVirementAmount) &&
      contains(String(r.toVirementAmount), f.toVirementAmount)
    );
    this.cdr.markForCheck();
  }

  onSubmit() {
    const decisions = this.rows
      .filter(r => r._action !== '')
      .map(r => ({ id: r.id, action: r._action, rejectReason: r._rejectReason }));

    if (!decisions.length) {
      this.errorMsg = 'Please select Approve or Reject for at least one row.';
      this.cdr.markForCheck();
      return;
    }

    this.submitting = true;
    this.successMsg = '';
    this.errorMsg = '';
    this.cdr.markForCheck();

    this.api.submitVirementApprovals(decisions).subscribe({
      next: (res: any) => {
        this.successMsg = res.message ?? 'Decisions submitted successfully.';
        this.submitting = false;
        this.onSearch();
      },
      error: () => {
        this.errorMsg = 'Submission failed. Please try again.';
        this.submitting = false;
        this.cdr.detectChanges();
      }
    });
  }

  onCancel() {
    this.rows.forEach(r => { r._action = ''; r._rejectReason = ''; });
    this.successMsg = '';
    this.errorMsg = '';
    this.cdr.markForCheck();
  }

  get totalItems(): number { return this.filteredRows.length; }
  get totalPages(): number { return Math.max(1, Math.ceil(this.filteredRows.length / 50)); }
}

function contains(value: string, filter: string): boolean {
  return !filter || (value ?? '').toLowerCase().includes(filter.toLowerCase());
}
