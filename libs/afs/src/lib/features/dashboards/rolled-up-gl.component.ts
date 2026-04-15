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
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatBadgeModule } from '@angular/material/badge';
import { ApiService } from '../../core/services/api.service';
import { PeriodFilterService } from '../../core/services/period-filter.service';

interface RolledUpEntry {
  accountCode: string;
  accountDescription: string;
  itemType: string;
  category: string;
  period: number;
  periodLabel: string;
  transactionCount: number;
  totalDebit: number;
  totalCredit: number;
  netAmount: number;
  distinctDocuments: number;
  distinctVotes: number;
  firstPosting: string;
  lastPosting: string;
}

interface CategoryTotal {
  itemType: string;
  category: string;
  rawTransactionCount: number;
  distinctAccounts: number;
  totalDebit: number;
  totalCredit: number;
  netAmount: number;
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
  selector: 'app-rolled-up-gl',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatTooltipModule,
    MatSelectModule, MatFormFieldModule, MatInputModule,
    MatChipsModule, MatPaginatorModule, MatBadgeModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './rolled-up-gl.component.html',
  styleUrl: './rolled-up-gl.component.css',
})
export class RolledUpGlComponent implements OnInit {
  loading = false;
  error = '';
  financialYearId = '';
  financialYears: any[] = [];

  entries: RolledUpEntry[] = [];
  categoryTotals: CategoryTotal[] = [];
  groupedEntries: Map<string, RolledUpEntry[]> = new Map();
  collapsedGroups = new Set<string>();
  stats = { rawTransactions: 0, rolledUpRows: 0, compressionRatio: 0 };
  pagination = { page: 1, limit: 100, total: 0, totalPages: 0 };
  exporting = false;

  filterPeriod = 0;
  filterItemType = '';
  filterSearch = '';
  searchDebounce: any;

  selectedReportingPeriod = 'full_year';
  reportingPeriodOptions = PeriodFilterService.PERIOD_OPTIONS;

  drillOpen = false;
  drillLoading = false;
  drillEntry: RolledUpEntry | null = null;
  drillData: DrillEntry[] = [];
  drillTotal = 0;
  drillPage = 1;
  drillLimit = 50;

  periodOptions = [
    { value: 0, label: 'All Periods' },
    { value: 1, label: 'P1 - July' }, { value: 2, label: 'P2 - August' },
    { value: 3, label: 'P3 - September' }, { value: 4, label: 'P4 - October' },
    { value: 5, label: 'P5 - November' }, { value: 6, label: 'P6 - December' },
    { value: 7, label: 'P7 - January' }, { value: 8, label: 'P8 - February' },
    { value: 9, label: 'P9 - March' }, { value: 10, label: 'P10 - April' },
    { value: 11, label: 'P11 - May' }, { value: 12, label: 'P12 - June' },
  ];

  itemTypeOptions = [
    { value: '', label: 'All Types' },
    { value: 'IA', label: 'Assets (IA)' },
    { value: 'IL', label: 'Liabilities (IL)' },
    { value: 'LN', label: 'Net Assets (LN)' },
    { value: 'IR', label: 'Revenue (IR)' },
    { value: 'IE', label: 'Expenditure (IE)' },
    { value: 'IZ', label: 'Gains & Losses (IZ)' },
  ];

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

  loadData() {
    if (!this.financialYearId) return;
    this.loading = true;
    this.error = '';
    this.cdr.markForCheck();

    const params: any = { page: this.pagination.page, limit: this.pagination.limit };
    if (this.filterPeriod > 0) params.processingMonth = this.filterPeriod;
    if (this.selectedReportingPeriod !== 'full_year') {
      const range = PeriodFilterService.periodToMonthRange(this.selectedReportingPeriod);
      params.periodFrom = range.from;
      params.periodTo = range.to;
    }
    if (this.filterItemType) params.itemType = this.filterItemType;
    if (this.filterSearch) params.search = this.filterSearch;

    const qs = Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&');

    this.api.get<any>(`/reports/rolled-up-gl/${this.financialYearId}?${qs}`).subscribe({
      next: (res) => {
        this.entries = res.entries;
        this.categoryTotals = res.categoryTotals;
        this.stats = res.stats;
        this.pagination = res.pagination;
        this.buildGroupedEntries();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load rolled-up GL';
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  buildGroupedEntries() {
    this.groupedEntries = new Map();
    for (const entry of this.entries) {
      const key = entry.category;
      if (!this.groupedEntries.has(key)) {
        this.groupedEntries.set(key, []);
      }
      this.groupedEntries.get(key)!.push(entry);
    }
  }

  toggleGroup(group: string) {
    if (this.collapsedGroups.has(group)) {
      this.collapsedGroups.delete(group);
    } else {
      this.collapsedGroups.add(group);
    }
  }

  getGroupSubtotal(group: string): { debit: number; credit: number; net: number; count: number } {
    const entries = this.groupedEntries.get(group) || [];
    return entries.reduce((acc, e) => ({
      debit: acc.debit + e.totalDebit,
      credit: acc.credit + e.totalCredit,
      net: acc.net + e.netAmount,
      count: acc.count + e.transactionCount,
    }), { debit: 0, credit: 0, net: 0, count: 0 });
  }

  onFilterChange() {
    this.pagination.page = 1;
    this.loadData();
  }

  onSearchInput() {
    clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => {
      this.pagination.page = 1;
      this.loadData();
    }, 400);
  }

  onPageChange(event: any) {
    this.pagination.page = event.pageIndex + 1;
    this.pagination.limit = event.pageSize;
    this.loadData();
  }

  openDrill(entry: RolledUpEntry) {
    this.drillOpen = true;
    this.drillEntry = entry;
    this.drillPage = 1;
    this.drillData = [];
    this.drillTotal = 0;
    this.loadDrillData();
  }

  closeDrill() {
    this.drillOpen = false;
    this.drillEntry = null;
    this.drillData = [];
    this.cdr.markForCheck();
  }

  loadDrillData() {
    if (!this.drillEntry) return;
    this.drillLoading = true;
    this.cdr.markForCheck();

    const e = this.drillEntry;
    const qs = `scoaItemCode=${encodeURIComponent(e.accountCode)}&processingMonth=${e.period}&page=${this.drillPage}&limit=${this.drillLimit}`;

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

  formatCurrency(n: number): string {
    if (n == null) return 'R 0.00';
    const abs = Math.abs(n);
    const formatted = abs.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return n < 0 ? `(R ${formatted})` : `R ${formatted}`;
  }

  formatNumber(n: number): string {
    return (n || 0).toLocaleString('en-ZA');
  }

  exportCsv() {
    if (!this.financialYearId) return;
    this.exporting = true;
    this.cdr.markForCheck();

    const params: any = { export: 'true' };
    if (this.filterPeriod > 0) params.processingMonth = this.filterPeriod;
    if (this.selectedReportingPeriod !== 'full_year') {
      const range = PeriodFilterService.periodToMonthRange(this.selectedReportingPeriod);
      params.periodFrom = range.from;
      params.periodTo = range.to;
    }
    if (this.filterItemType) params.itemType = this.filterItemType;
    if (this.filterSearch) params.search = this.filterSearch;

    const qs = Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&');

    this.api.get<any>(`/reports/rolled-up-gl/${this.financialYearId}?${qs}`).subscribe({
      next: (res) => {
        const allEntries: RolledUpEntry[] = res.entries || [];
        if (!allEntries.length) {
          this.exporting = false;
          this.cdr.markForCheck();
          return;
        }
        const headers = ['Item Type', 'Category', 'mSCOA Item Code', 'Account Description', 'Period', 'Period Label',
          'Transaction Count', 'Total Debit', 'Total Credit', 'Net Amount', 'Distinct Documents', 'First Posting', 'Last Posting'];
        const rows = allEntries.map(e => [
          e.itemType, e.category, e.accountCode, `"${(e.accountDescription || '').replace(/"/g, '""')}"`, e.period, e.periodLabel,
          e.transactionCount, e.totalDebit.toFixed(2), e.totalCredit.toFixed(2), e.netAmount.toFixed(2),
          e.distinctDocuments, e.firstPosting || '', e.lastPosting || '',
        ].join(','));
        const csv = [headers.join(','), ...rows].join('\n');
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rolled-up-gl-${this.financialYearId}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        this.exporting = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.exporting = false;
        this.cdr.markForCheck();
      },
    });
  }

  getCategoryIcon(itemType: string): string {
    const icons: Record<string, string> = {
      'IA': 'account_balance_wallet', 'IL': 'credit_card', 'LN': 'savings',
      'IR': 'trending_up', 'IE': 'trending_down', 'IZ': 'swap_vert',
    };
    return icons[itemType] || 'receipt_long';
  }

  getCategoryColor(itemType: string): string {
    const colors: Record<string, string> = {
      'IA': '#1565c0', 'IL': '#c62828', 'LN': '#6a1b9a',
      'IR': '#2e7d32', 'IE': '#e65100', 'IZ': '#00838f',
    };
    return colors[itemType] || '#546e7a';
  }

  get grandTotalDebit(): number {
    return this.categoryTotals.reduce((s, c) => s + c.totalDebit, 0);
  }

  get grandTotalCredit(): number {
    return this.categoryTotals.reduce((s, c) => s + c.totalCredit, 0);
  }

  get grandTotalNet(): number {
    return this.categoryTotals.reduce((s, c) => s + c.netAmount, 0);
  }
}
