import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ApiService } from '../../core/services/api.service';
import { PeriodFilterService } from '../../core/services/period-filter.service';

interface AuditSamplingAccount {
  scoaItemCode: string;
  accountDescription: string;
  itemType: string;
  category: string;
  riskScore: number;
  riskLevel: 'high' | 'medium' | 'low';
  transactionCount: number;
  totalDebit: number;
  totalCredit: number;
  netAmount: number;
  distinctDocuments: number;
  activeMonths: number;
  activePeriods: number[];
  periodSpread: { period: number; label: string }[];
  firstPosting: string;
  lastPosting: string;
  riskFactors: { materiality: number; volume: number; concentration: number };
}

interface AuditSamplingSummary {
  totalAccounts: number;
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
}

interface DrillEntry {
  id: string;
  postingDate: string;
  documentNumber: string;
  documentType: string;
  transactionDescription: string;
  amount: number;
  glDebit: number;
  glCredit: number;
  voteNumber: string;
  voteDescription: string;
  capturedBy: string;
  referenceNumber: string;
  scoaFunctionShortDesc: string;
  scoaFundShortDesc: string;
  scoaProjectShortDesc: string;
}

@Component({
  selector: 'app-audit-sampling',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatTooltipModule,
    MatSelectModule, MatFormFieldModule, MatInputModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './audit-sampling.component.html',
  styleUrl: './audit-sampling.component.css',
})
export class AuditSamplingComponent implements OnInit {
  Math = Math;

  loading = false;
  error = '';
  financialYearId = '';
  financialYears: any[] = [];

  accounts: AuditSamplingAccount[] = [];
  filteredAccounts: AuditSamplingAccount[] = [];
  summary: AuditSamplingSummary = { totalAccounts: 0, highRisk: 0, mediumRisk: 0, lowRisk: 0 };

  filterRisk = '';
  filterItemType = '';
  filterSearch = '';

  allPeriods = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  itemTypeOptions = [
    { value: '', label: 'All Types' },
    { value: 'IA', label: 'Assets (IA)' },
    { value: 'IL', label: 'Liabilities (IL)' },
    { value: 'LN', label: 'Net Assets (LN)' },
    { value: 'IR', label: 'Revenue (IR)' },
    { value: 'IE', label: 'Expenditure (IE)' },
    { value: 'IZ', label: 'Gains & Losses (IZ)' },
  ];

  drillOpen = false;
  drillLoading = false;
  drillAccount: AuditSamplingAccount | null = null;
  drillData: DrillEntry[] = [];
  drillTotal = 0;
  drillPage = 1;
  drillLimit = 50;

  selectedPeriod = 'full_year';
  reportingPeriodOptions = PeriodFilterService.PERIOD_OPTIONS;

  private periodFilter = inject(PeriodFilterService);
  private initialLoadDone = false;

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {
    effect(() => {
      const _f = this.periodFilter.selectedFyId();
      if (this.initialLoadDone) {
        this.loadData();
      }
    });
  }

  ngOnInit() {
    this.loadFinancialYears();
  }

  loadFinancialYears() {
    this.api.get<any[]>('/admin/financial-years').subscribe({
      next: (years) => {
        this.financialYears = years;
        const current = years.find((y: any) => y.isCurrent);
        if (current) {
          this.financialYearId = current.id;
          this.initialLoadDone = true;
          this.loadData();
        }
        this.cdr.markForCheck();
      },
    });
  }

  onFilterChange() {
    this.loadData();
  }

  onReportingPeriodChange() {
    this.loadData();
  }

  loadData() {
    if (!this.financialYearId) return;
    this.loading = true;
    this.error = '';
    this.cdr.markForCheck();

    const url = PeriodFilterService.appendPeriodToUrl(`/reports/audit-sampling/${this.financialYearId}`, this.selectedPeriod);
    this.api.get<any>(url).subscribe({
      next: (res) => {
        this.accounts = res.accounts;
        this.summary = res.summary;
        this.applyFilter();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load audit sampling data';
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  applyFilter() {
    let filtered = [...this.accounts];
    if (this.filterRisk) {
      filtered = filtered.filter(a => a.riskLevel === this.filterRisk);
    }
    if (this.filterItemType) {
      filtered = filtered.filter(a => a.itemType === this.filterItemType);
    }
    if (this.filterSearch) {
      const s = this.filterSearch.toLowerCase();
      filtered = filtered.filter(a =>
        a.scoaItemCode.toLowerCase().includes(s) ||
        a.accountDescription.toLowerCase().includes(s)
      );
    }
    this.filteredAccounts = filtered;
    this.cdr.markForCheck();
  }

  getRiskIcon(level: string): string {
    switch (level) {
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'check_circle';
      default: return 'help';
    }
  }

  getCategoryColor(itemType: string): string {
    const colors: Record<string, string> = {
      'IA': '#1565c0', 'IL': '#c62828', 'LN': '#6a1b9a',
      'IR': '#2e7d32', 'IE': '#e65100', 'IZ': '#00838f',
    };
    return colors[itemType] || '#546e7a';
  }

  formatCurrency(n: number): string {
    if (n == null) return 'R 0.00';
    const abs = Math.abs(n);
    const formatted = abs.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return n < 0 ? `(R ${formatted})` : `R ${formatted}`;
  }

  formatNumber(n: number): string {
    return (n || 0).toLocaleString('en-ZA');
  }

  openDrill(account: AuditSamplingAccount) {
    this.drillOpen = true;
    this.drillAccount = account;
    this.drillPage = 1;
    this.drillData = [];
    this.drillTotal = 0;
    this.loadDrillData();
  }

  closeDrill() {
    this.drillOpen = false;
    this.drillAccount = null;
    this.drillData = [];
    this.cdr.markForCheck();
  }

  loadDrillData() {
    if (!this.drillAccount) return;
    this.drillLoading = true;
    this.cdr.markForCheck();

    const qs = `scoaItemCode=${encodeURIComponent(this.drillAccount.scoaItemCode)}&page=${this.drillPage}&limit=${this.drillLimit}`;

    this.api.get<any>(`/reports/gl-drillthrough/${this.financialYearId}?${qs}`).subscribe({
      next: (res) => {
        this.drillData = res.entries;
        this.drillTotal = res.total;
        this.drillLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.drillLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  drillPageChange(delta: number) {
    this.drillPage += delta;
    this.loadDrillData();
  }

  exportCsv() {
    if (!this.filteredAccounts.length) return;
    const headers = ['Risk Level', 'Risk Score', 'mSCOA Item Code', 'Account Description', 'Item Type', 'Category',
      'Transaction Count', 'Total Debit', 'Total Credit', 'Net Amount', 'Active Months', 'Active Periods'];
    const rows = this.filteredAccounts.map(a => [
      a.riskLevel, a.riskScore, a.scoaItemCode, `"${a.accountDescription}"`, a.itemType, a.category,
      a.transactionCount, a.totalDebit.toFixed(2), a.totalCredit.toFixed(2), a.netAmount.toFixed(2),
      a.activeMonths, `"${a.activePeriods.join(',')}"`,
    ].join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-sampling-${this.financialYearId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
