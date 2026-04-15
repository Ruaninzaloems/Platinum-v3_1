import { Component, ChangeDetectionStrategy, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { environment } from '../../environment';

@Component({
  selector: 'app-interest-charges',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatCardModule, MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatDatepickerModule, MatNativeDateModule, MatSelectModule, MatMenuModule, MatTooltipModule, MatTabsModule, MatChipsModule, MatBadgeModule],
  templateUrl: './interest-charges.component.html',
  styleUrl: './interest-charges.component.scss'
})
export class InterestChargesComponent implements OnInit {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  currentView = signal<string>('dashboard');
  charges = signal<any[]>([]);
  selectedCharge = signal<any>(null);
  summaryData = signal<any>({});
  configData = signal<any>({});
  reconData = signal<any[]>([]);
  ageData = signal<any>({});
  outstandingData = signal<any>({});
  suppliers = signal<any[]>([]);
  notification = signal<string>('');
  loading = signal(false);
  saving = signal(false);
  showVoidDialog = signal(false);
  totalCharges = signal(0);
  totalPages = signal(1);
  currentPage = signal(1);
  pageSize = signal(20);
  pageSizeValue = 20;

  outCurrentPage = signal(1);
  outPageSizeValue = 20;

  filterStatus = '';
  filterSupplierId = '';
  filterDateFrom = '';
  filterDateTo = '';
  searchQuery = '';

  reconSupplierId = '';
  reconDateFrom = '';
  reconDateTo = '';

  ageFilterYear = '';
  ageFilterDate = '';

  outFilterYear = '';
  outFilterMinAmount: number | null = null;

  voidReason = '';
  voidChargeId = '';

  newCharge: any = {
    supplierId: '', invoiceNumber: '', invoiceAmount: 0,
    invoiceDate: '', dueDate: '', paymentDate: '', comments: ''
  };

  private allCharges: any[] = [];

  pageStart = computed(() => {
    const total = this.totalCharges();
    if (total === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize() + 1;
  });

  pageEnd = computed(() => Math.min(this.currentPage() * this.pageSize(), this.totalCharges()));

  overdueCount = computed(() => {
    return this.allCharges.filter(c => c.status !== 'paid' && c.status !== 'voided' && c.daysOverdue > 30).length;
  });

  avgDaysOverdue = computed(() => {
    const active = this.allCharges.filter(c => c.status !== 'voided');
    if (active.length === 0) return 0;
    return Math.round(active.reduce((sum: number, c: any) => sum + (c.daysOverdue || 0), 0) / active.length);
  });

  complianceScore = computed(() => {
    const all = this.allCharges.filter(c => c.status !== 'voided');
    if (all.length === 0) return 100;
    const onTime = all.filter(c => c.daysOverdue <= 30).length;
    return Math.round((onTime / all.length) * 100);
  });

  topCreditors = computed(() => {
    const grouped: any = {};
    this.allCharges.filter(c => c.status !== 'voided').forEach(c => {
      if (!grouped[c.supplierId]) {
        grouped[c.supplierId] = { supplierId: c.supplierId, supplierName: c.supplierName, totalInterest: 0 };
      }
      grouped[c.supplierId].totalInterest += c.interestAmount?.amount || 0;
    });
    return Object.values(grouped).sort((a: any, b: any) => b.totalInterest - a.totalInterest).slice(0, 10) as any[];
  });

  monthlyTrend = computed(() => {
    const months: any = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    this.allCharges.filter(c => c.status !== 'voided').forEach(c => {
      const d = new Date(c.capturedDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!months[key]) months[key] = { label: `${monthNames[d.getMonth()]} ${d.getFullYear()}`, shortLabel: monthNames[d.getMonth()], amount: 0 };
      months[key].amount += c.interestAmount?.amount || 0;
    });
    return Object.values(months).sort((a: any, b: any) => a.label.localeCompare(b.label)).slice(-6) as any[];
  });

  calcPreview = computed(() => {
    if (!this.newCharge.invoiceAmount || !this.newCharge.dueDate) return { daysOverdue: 0, interest: 0, formula: '' };
    const endDate = this.newCharge.paymentDate ? new Date(this.newCharge.paymentDate) : new Date();
    const dueDate = new Date(this.newCharge.dueDate);
    const daysOverdue = Math.ceil((endDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysOverdue <= 0) return { daysOverdue: 0, interest: 0, formula: '' };
    const rate = this.configData().currentRate || 10.75;
    const interest = Math.round((this.newCharge.invoiceAmount * rate / 100 * daysOverdue / 365) * 100) / 100;
    return {
      daysOverdue,
      interest,
      formula: `R${this.formatNumber(this.newCharge.invoiceAmount)} x ${rate}% x ${daysOverdue} / 365 = R${this.formatNumber(interest)}`
    };
  });

  outTotalPages = computed(() => {
    const creditors = this.outstandingData().creditors || [];
    return Math.max(1, Math.ceil(creditors.length / this.outPageSizeValue));
  });

  paginatedOutstanding = computed(() => {
    const creditors = this.outstandingData().creditors || [];
    const filtered = this.outFilterMinAmount ? creditors.filter((c: any) => c.totalInterest >= (this.outFilterMinAmount || 0)) : creditors;
    const start = (this.outCurrentPage() - 1) * this.outPageSizeValue;
    return filtered.slice(start, start + this.outPageSizeValue);
  });

  outPageStart = computed(() => {
    const total = (this.outstandingData().creditors || []).length;
    if (total === 0) return 0;
    return (this.outCurrentPage() - 1) * this.outPageSizeValue + 1;
  });

  outPageEnd = computed(() => Math.min(this.outCurrentPage() * this.outPageSizeValue, (this.outstandingData().creditors || []).length));

  ngOnInit() {
    this.loadDashboard();
  }

  loadDashboard() {
    this.loadConfig();
    this.loadAllCharges();
    this.loadSuppliers();
  }

  loadConfig() {
    this.http.get<any>(`${this.apiUrl}/interest-charges/config`).subscribe({
      next: (data) => this.configData.set(data),
      error: () => this.configData.set({})
    });
  }

  loadSuppliers() {
    this.http.get<any>(`${this.apiUrl}/suppliers`, { params: { pageSize: '200' } }).subscribe({
      next: (data) => this.suppliers.set(data.data || []),
      error: () => this.suppliers.set([])
    });
  }

  loadAllCharges() {
    this.http.get<any>(`${this.apiUrl}/interest-charges`, { params: { pageSize: '1000' } }).subscribe({
      next: (data) => {
        this.allCharges = data.data || [];
        this.summaryData.set(data.summary || {});
      },
      error: () => { this.allCharges = []; this.summaryData.set({}); }
    });
  }

  loadCharges() {
    this.loading.set(true);
    const params: any = {
      page: this.currentPage().toString(),
      pageSize: this.pageSize().toString()
    };
    if (this.filterStatus) params.status = this.filterStatus;
    if (this.filterSupplierId) params.supplierId = this.filterSupplierId;
    if (this.searchQuery) params.search = this.searchQuery;

    this.http.get<any>(`${this.apiUrl}/interest-charges`, { params }).subscribe({
      next: (data) => {
        this.charges.set(data.data || []);
        this.totalCharges.set(data.total || 0);
        this.totalPages.set(data.totalPages || 1);
        this.summaryData.set(data.summary || {});
        this.loading.set(false);
      },
      error: () => {
        this.charges.set([]);
        this.loading.set(false);
      }
    });
  }

  loadReconciliation() {
    this.loading.set(true);
    const params: any = {};
    if (this.reconSupplierId) params.supplierId = this.reconSupplierId;
    if (this.reconDateFrom) params.fromDate = this.reconDateFrom;
    if (this.reconDateTo) params.toDate = this.reconDateTo;

    this.http.get<any>(`${this.apiUrl}/interest-charges/reports/creditor-reconciliation`, { params }).subscribe({
      next: (data) => {
        this.reconData.set(data.reconciliations || []);
        this.loading.set(false);
      },
      error: () => {
        this.reconData.set([]);
        this.loading.set(false);
      }
    });
  }

  loadAgeAnalysis() {
    this.loading.set(true);
    const params: any = {};
    if (this.ageFilterYear) params.financialYear = this.ageFilterYear;
    if (this.ageFilterDate) params.agingAsAt = this.ageFilterDate;

    this.http.get<any>(`${this.apiUrl}/interest-charges/reports/invoice-age-analysis`, { params }).subscribe({
      next: (data) => {
        this.ageData.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.ageData.set({});
        this.loading.set(false);
      }
    });
  }

  loadOutstandingPayments() {
    this.loading.set(true);
    const params: any = {};
    if (this.outFilterYear) params.financialYear = this.outFilterYear;

    this.http.get<any>(`${this.apiUrl}/interest-charges/reports/outstanding-payments`, { params }).subscribe({
      next: (data) => {
        this.outstandingData.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.outstandingData.set({});
        this.loading.set(false);
      }
    });
  }

  navigateTo(view: string) {
    this.currentView.set(view);
    if (view === 'dashboard') {
      this.loadDashboard();
    } else if (view === 'list') {
      this.loadCharges();
      this.loadAllCharges();
    } else if (view === 'create') {
      this.resetNewCharge();
    } else if (view === 'reconciliation') {
      this.loadReconciliation();
    } else if (view === 'ageAnalysis') {
      this.loadAgeAnalysis();
    } else if (view === 'outstanding') {
      this.loadOutstandingPayments();
    }
  }

  viewCharge(charge: any) {
    this.loading.set(true);
    this.http.get<any>(`${this.apiUrl}/interest-charges/${charge.id}`).subscribe({
      next: (data) => {
        this.selectedCharge.set(data);
        this.currentView.set('detail');
        this.loading.set(false);
      },
      error: () => {
        this.notify('Failed to load charge details');
        this.loading.set(false);
      }
    });
  }

  createCharge() {
    this.saving.set(true);
    const supplier = this.suppliers().find((s: any) => s.id === this.newCharge.supplierId);
    const body: any = {
      supplierId: this.newCharge.supplierId,
      invoiceNumber: this.newCharge.invoiceNumber,
      invoiceAmount: this.newCharge.invoiceAmount,
      invoiceDate: this.newCharge.invoiceDate,
      dueDate: this.newCharge.dueDate,
      paymentDate: this.newCharge.paymentDate || null,
      comments: this.newCharge.comments
    };

    this.http.post<any>(`${this.apiUrl}/interest-charges`, body).subscribe({
      next: (data) => {
        this.notify('Interest charge created successfully');
        this.saving.set(false);
        this.navigateTo('list');
      },
      error: (err) => {
        this.notify('Error: ' + (err.error?.error || 'Failed to create charge'));
        this.saving.set(false);
      }
    });
  }

  submitCharge(id: string) {
    this.http.post<any>(`${this.apiUrl}/interest-charges/${id}/submit`, {}).subscribe({
      next: () => {
        this.notify('Interest charge submitted for approval');
        this.refreshCurrentView();
      },
      error: (err) => this.notify('Error: ' + (err.error?.error || 'Failed to submit'))
    });
  }

  approveCharge(id: string) {
    this.http.post<any>(`${this.apiUrl}/interest-charges/${id}/approve`, { action: 'approve' }).subscribe({
      next: () => {
        this.notify('Interest charge approved');
        this.refreshCurrentView();
      },
      error: (err) => this.notify('Error: ' + (err.error?.error || 'Failed to approve'))
    });
  }

  promptVoid(id: string) {
    this.voidChargeId = id;
    this.voidReason = '';
    this.showVoidDialog.set(true);
  }

  confirmVoid() {
    this.http.post<any>(`${this.apiUrl}/interest-charges/${this.voidChargeId}/void`, { voidReason: this.voidReason }).subscribe({
      next: () => {
        this.notify('Interest charge voided');
        this.showVoidDialog.set(false);
        this.refreshCurrentView();
      },
      error: (err) => this.notify('Error: ' + (err.error?.error || 'Failed to void'))
    });
  }

  filterByStatus(status: string) {
    this.filterStatus = status;
    this.currentPage.set(1);
    this.navigateTo('list');
  }

  clearFilters() {
    this.filterStatus = '';
    this.filterSupplierId = '';
    this.filterDateFrom = '';
    this.filterDateTo = '';
    this.searchQuery = '';
    this.currentPage.set(1);
    this.loadCharges();
  }

  changePage(page: number) {
    this.currentPage.set(page);
    this.loadCharges();
  }

  onPageSizeChange() {
    this.pageSize.set(this.pageSizeValue);
    this.currentPage.set(1);
    this.loadCharges();
  }

  onSupplierSelect() {}

  recalcInterest() {}

  resetNewCharge() {
    this.newCharge = {
      supplierId: '', invoiceNumber: '', invoiceAmount: 0,
      invoiceDate: '', dueDate: '', paymentDate: '', comments: ''
    };
  }

  refreshCurrentView() {
    const view = this.currentView();
    if (view === 'list') {
      this.loadCharges();
      this.loadAllCharges();
    } else if (view === 'detail' && this.selectedCharge()) {
      this.viewCharge(this.selectedCharge());
    } else if (view === 'dashboard') {
      this.loadDashboard();
    }
  }

  printRecon() {
    window.print();
  }

  getStatusLabel(status: string): string {
    const labels: any = {
      draft: 'Draft', submitted: 'Submitted', approved: 'Approved',
      paid: 'Paid', voided: 'Voided', rejected: 'Rejected'
    };
    return labels[status] || status;
  }

  getTxnTypeLabel(type: string): string {
    const labels: any = {
      invoice: 'Invoice', payment: 'Payment', credit_note: 'Credit Note', interest: 'Interest'
    };
    return labels[type] || type;
  }

  getMfmaRisk(creditor: any): string {
    const maxDays = Math.max(...creditor.charges.map((c: any) => c.daysOverdue || 0));
    if (maxDays > 90) return 'critical_90';
    if (maxDays > 60) return 'breach_60';
    if (maxDays > 30) return 'warning_30';
    return 'on_time';
  }

  getMfmaRiskLabel(creditor: any): string {
    const risk = this.getMfmaRisk(creditor);
    const labels: any = {
      on_time: 'On Time', warning_30: 'Warning (30d)', breach_60: 'Breach (60d)', critical_90: 'Critical (90d)'
    };
    return labels[risk] || risk;
  }

  getCreditorBarWidth(cred: any): number {
    const max = this.topCreditors().length > 0 ? Math.max(...this.topCreditors().map(c => c.totalInterest)) : 1;
    return max > 0 ? (cred.totalInterest / max) * 100 : 0;
  }

  getTrendBarHeight(month: any): number {
    const max = this.monthlyTrend().length > 0 ? Math.max(...this.monthlyTrend().map(m => m.amount)) : 1;
    return max > 0 ? Math.max(5, (month.amount / max) * 100) : 5;
  }

  getAgeBucketHeight(bucket: string): number {
    const aging = this.ageData().aging;
    if (!aging) return 5;
    const amounts = [
      aging.current?.amount?.amount || 0,
      aging['31-60']?.amount?.amount || 0,
      aging['61-90']?.amount?.amount || 0,
      aging['91-120']?.amount?.amount || 0,
      aging['120+']?.amount?.amount || 0
    ];
    const max = Math.max(...amounts);
    const val = aging[bucket]?.amount?.amount || 0;
    return max > 0 ? Math.max(5, (val / max) * 100) : 5;
  }

  getOverduePercent(): number {
    const aging = this.ageData().aging;
    const total = this.ageData().total?.count || 0;
    if (!aging || total === 0) return 0;
    const overdue = (aging['31-60']?.count || 0) + (aging['61-90']?.count || 0) + (aging['91-120']?.count || 0) + (aging['120+']?.count || 0);
    return Math.round((overdue / total) * 100);
  }

  getHighestCreditor(): string {
    const details = this.ageData().details || [];
    if (details.length === 0) return '-';
    const grouped: any = {};
    details.forEach((d: any) => {
      if (!grouped[d.supplierName]) grouped[d.supplierName] = 0;
      grouped[d.supplierName] += d.interestAmount?.amount || 0;
    });
    const sorted = Object.entries(grouped).sort((a: any, b: any) => b[1] - a[1]);
    return sorted.length > 0 ? sorted[0][0] as string : '-';
  }

  formatCurrency(amount: number): string {
    if (amount >= 1000000) return 'R' + (amount / 1000000).toFixed(1) + 'M';
    if (amount >= 1000) return 'R' + (amount / 1000).toFixed(1) + 'K';
    return 'R' + amount.toFixed(2);
  }

  formatCurrencyFull(amount: number): string {
    return 'R ' + this.formatNumber(amount);
  }

  formatNumber(num: number): string {
    return num.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  notify(message: string) {
    this.notification.set(message);
    setTimeout(() => this.notification.set(''), 4000);
  }
}
