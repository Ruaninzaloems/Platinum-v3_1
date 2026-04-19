import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import { DayEndReportService } from '../../core/services/dayend-report.service';
import { DateInputComponent } from '../../shared/components/date-input.component';
import { firstValueFrom } from 'rxjs';

interface CashierShift {
  id: string;
  userId: number | null;
  posCashierId: number | null;
  cashierName: string;
  cashOffice: string;
  cashOfficeId: number | null;
  groupCashiers: boolean;
  startTime: string;
  status: 'NOT_SUBMITTED' | 'SUBMITTED' | 'VERIFIED' | 'RETURNED' | 'COMPLETED' | 'APPROVED';
  statusId?: number;
  systemTotals: { cash: number; card: number; cheque: number; postal: number; total: number };
  declaredTotals?: { cash: number; card: number; cheque: number; postal: number; total: number };
  shortage: number;
  surplus: number;
  variance: number;
  transactionCount: number;
  reconcileId: number | null;
  returnReason?: string | null;
  hasActiveSession: boolean;
  rawData?: any;
}

interface PendingCancelRequest {
  id: string;
  receiptId: number;
  receiptNo: string;
  accountNumber: string;
  amount: number;
  cashierName: string;
  cashierId: number;
  reason: string;
  requestDate: string;
  paymentType: string;
  status: string;
  isMiscPayment: boolean;
}

interface ReviewData {
  details: any;
  reconcile: any;
  cashReceipts: any[];
  cardReceipts: any[];
  chequeReceipts: any[];
  postalReceipts: any[];
  dropboxReceipts: any[];
  offlineReceipts: any[];
  systemVsCashier: any[];
  cancelledReceipts: any[];
}

interface OfficeConfig {
  groupCashiers: boolean;
  cashOfficeDesc: string;
  cashOnHandLimit: number | null;
}

@Component({
  selector: 'app-supervisor-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, DateInputComponent],
  templateUrl: './supervisor-dashboard.component.html',
  styleUrl: './supervisor-dashboard.component.css'
})
export class SupervisorDashboardComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private reportService = inject(DayEndReportService);

  Math = Math;
  loading = signal(false);
  error = signal('');
  activeTab = signal<'day-end' | 'cancellations'>('day-end');
  reconMode = signal<'PER_CASHIER' | 'CASH_OFFICE'>('PER_CASHIER');

  shifts = signal<CashierShift[]>([]);
  isLoadingShifts = signal(false);
  filterOffice = signal('All');
  filterStatus = signal('ACTIONABLE');
  searchQuery = signal('');
  filterDateFrom = signal('');
  filterDateTo = signal('');

  selectedShift = signal<CashierShift | null>(null);
  reviewLoading = signal(false);
  reviewData = signal<ReviewData | null>(null);
  reviewTab = signal('cash');
  actionLoading = signal<'return' | 'approve' | ''>('');
  returnReason = signal('');
  reviewApiPrefix = signal<'auth-day-end' | 'auth-day-end-per-office'>('auth-day-end');
  receiptValidationError = signal<string>('');

  recentlyApprovedIds = new Set<string>();
  recentlyApprovedNames = new Set<string>();

  pendingCancelRequests = signal<PendingCancelRequest[]>([]);
  cancelRequestsLoading = signal(false);
  cancelActionLoading = signal<string | null>(null);

  perOfficeList = signal<any[]>([]);
  perOfficeListLoading = signal(false);
  perOfficeSelectedId = signal<number | null>(null);
  perOfficeData = signal<any>(null);
  perOfficeLoading = signal(false);
  perOfficeSubmitting = signal(false);
  perOfficeVerifying = signal<number | null>(null);
  perOfficeStaged = signal(false);
  perOfficeCashierStatuses = signal<Record<number, any>>({});

  approvalCashReportUrl = signal<string | null>(null);
  approvalDepositSlipUrl = signal<string | null>(null);
  generatingApprovalPdfs = signal(false);

  posCashierData = signal<any[]>([]);

  directCancelId = signal<number | null>(null);
  directCancelReason = signal('');
  directCancelProcessing = signal(false);
  reportGenerating = signal<string | null>(null);

  receiptPage = signal(1);
  receiptPageSize = signal(25);
  receiptSearchQuery = signal('');
  receiptSortCol = signal<string>('');
  receiptSortDir = signal<'asc' | 'desc'>('asc');

  private getTabRawList(data: any, tab: string): any[] {
    if (tab === 'cash') return data.cashReceipts || [];
    if (tab === 'card') return data.cardReceipts || [];
    if (tab === 'cheque') return data.chequeReceipts || [];
    if (tab === 'postal') return data.postalReceipts || [];
    if (tab === 'dropbox') return data.dropboxReceipts || [];
    if (tab === 'offline') return data.offlineReceipts || [];
    return [];
  }

  private filterReceiptsBySearch(list: any[], query: string): any[] {
    if (!query.trim()) return list;
    const q = query.trim().toLowerCase();
    return list.filter((r: any) => {
      const receiptNo = String(r.receiptNo || r.receipt_No || r.serialNo || '').toLowerCase();
      const accountNo = String(r.accountNo || r.account_No || r.accountNumber || '').toLowerCase();
      const holderName = String(r.accHolderName || r.accountHolderName || r.name || '').toLowerCase();
      return receiptNo.includes(q) || accountNo.includes(q) || holderName.includes(q);
    });
  }

  private sortFieldMap: Record<string, (r: any) => any> = {
    'receiptNo': (r) => String(r.receiptNo || r.receipt_No || r.serialNo || ''),
    'account': (r) => String(r.accountNo || r.account_No || r.accountNumber || ''),
    'holder': (r) => String(r.accHolderName || r.accountHolderName || r.name || '').toLowerCase(),
    'paid': (r) => Number(r.paidAmount || r.paymentAmount || r.amount || 0),
    'tendered': (r) => Number(r.tenderAmount || r.tenderedAmount || 0),
    'change': (r) => Number(r.changeAmount || 0),
    'date': (r) => String(r.dateCaptured || r.receiptDate || ''),
    'status': (r) => r.isCancelled === 1 || r.isCancelled === true ? 1 : 0,
    'cardNo': (r) => String(r.cardNo || r.cardNumber || ''),
    'expiry': (r) => String(r.cardExpiryDate || r.expiryDate || ''),
    'chequeNo': (r) => String(r.chequeNo || r.chequeNumber || ''),
    'branch': (r) => String(r.bankBranch || r.bankBrachCode || ''),
  };

  toggleReceiptSort(col: string): void {
    if (this.receiptSortCol() === col) {
      this.receiptSortDir.set(this.receiptSortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.receiptSortCol.set(col);
      this.receiptSortDir.set('asc');
    }
    this.receiptPage.set(1);
  }

  private sortReceiptList(list: any[]): any[] {
    const col = this.receiptSortCol();
    const dir = this.receiptSortDir();
    if (!col) return list;
    const getter = this.sortFieldMap[col];
    if (!getter) return list;
    const sorted = [...list].sort((a, b) => {
      const va = getter(a);
      const vb = getter(b);
      if (typeof va === 'number' && typeof vb === 'number') return va - vb;
      return String(va).localeCompare(String(vb), undefined, { numeric: true });
    });
    return dir === 'desc' ? sorted.reverse() : sorted;
  }

  receiptFullList = computed(() => {
    const data = this.reviewData();
    if (!data) return [];
    const tab = this.reviewTab();
    const raw = this.getTabRawList(data, tab);
    const filtered = this.filterReceiptsBySearch(raw, this.receiptSearchQuery());
    const _col = this.receiptSortCol();
    const _dir = this.receiptSortDir();
    return this.sortReceiptList(filtered);
  });

  receiptPaged = computed(() => {
    const list = this.receiptFullList();
    const page = this.receiptPage();
    const size = this.receiptPageSize();
    return list.slice((page - 1) * size, page * size);
  });

  receiptTotalPages = computed(() => Math.max(1, Math.ceil(this.receiptFullList().length / this.receiptPageSize())));

  receiptPageNumbers = computed(() => {
    const total = this.receiptTotalPages();
    const current = this.receiptPage();
    const pages: (number | string)[] = [];
    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3) pages.push('...');
      for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
      if (current < total - 2) pages.push('...');
      pages.push(total);
    }
    return pages;
  });

  officeConfigs = signal<Record<string, OfficeConfig>>({});

  historicReconciles = signal<any[]>([]);
  historicLoading = signal(false);
  historicExpanded = signal(false);
  historicSearch = signal('');
  historicDateFrom = signal('');
  historicDateTo = signal('');
  historicPage = signal(1);
  historicPageSize = signal(25);
  historicSortCol = signal<string>('reconcileDate');
  historicSortDir = signal<'asc' | 'desc'>('desc');
  historicVarianceFilter = signal<'all' | 'shortage' | 'surplus' | 'balanced'>('all');

  historicFiltered = computed(() => {
    let items = this.historicReconciles();
    const search = this.historicSearch().toLowerCase().trim();
    if (search) {
      items = items.filter(r =>
        (r.cashierName || '').toLowerCase().includes(search) ||
        (r.reviewerName || '').toLowerCase().includes(search) ||
        String(r.totalAmt || '').includes(search) ||
        String(r.posCashierId || '').includes(search)
      );
    }
    const vf = this.historicVarianceFilter();
    if (vf === 'shortage') items = items.filter((r: any) => (r.shortageAmt || 0) > 0);
    else if (vf === 'surplus') items = items.filter((r: any) => (r.surplusAmt || 0) > 0);
    else if (vf === 'balanced') items = items.filter((r: any) => (r.shortageAmt || 0) === 0 && (r.surplusAmt || 0) === 0);
    const from = this.historicDateFrom();
    if (from) {
      items = items.filter(r => (r.reconcileDate || '') >= from);
    }
    const to = this.historicDateTo();
    if (to) {
      items = items.filter(r => (r.reconcileDate || '').substring(0, 10) <= to);
    }
    const col = this.historicSortCol();
    const dir = this.historicSortDir();
    items = [...items].sort((a, b) => {
      let va = a[col], vb = b[col];
      if (typeof va === 'number' && typeof vb === 'number') return dir === 'asc' ? va - vb : vb - va;
      va = String(va || ''); vb = String(vb || '');
      return dir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    });
    return items;
  });

  historicTotalPages = computed(() => Math.max(1, Math.ceil(this.historicFiltered().length / this.historicPageSize())));

  historicPaged = computed(() => {
    const page = this.historicPage();
    const size = this.historicPageSize();
    return this.historicFiltered().slice((page - 1) * size, page * size);
  });

  historicTotals = computed(() => {
    const items = this.historicFiltered();
    const shortageAmt = items.reduce((s, r) => s + (r.shortageAmt || 0), 0);
    const surplusAmt = items.reduce((s, r) => s + (r.surplusAmt || 0), 0);
    const totalAmt = items.reduce((s, r) => s + (r.totalAmt || 0), 0);
    return {
      totalAmt,
      systemTotal: items.reduce((s, r) => s + (r.systemTotal || r.totalAmt + (r.shortageAmt || 0) - (r.surplusAmt || 0)), 0),
      variance: surplusAmt - shortageAmt,
      totalCashAmt: items.reduce((s, r) => s + (r.totalCashAmt || 0), 0),
      totalCreditAmt: items.reduce((s, r) => s + (r.totalCreditAmt || 0), 0),
      totalChequeAmt: items.reduce((s, r) => s + (r.totalChequeAmt || 0), 0),
      totalPostalAmt: items.reduce((s, r) => s + (r.totalPostalAmt || 0), 0),
      shortageAmt,
      surplusAmt,
      shortageCount: items.filter(r => (r.shortageAmt || 0) > 0).length,
      surplusCount: items.filter(r => (r.surplusAmt || 0) > 0).length,
      balancedCount: items.filter(r => (r.shortageAmt || 0) === 0 && (r.surplusAmt || 0) === 0).length,
    };
  });

  historicPageNumbers = computed(() => {
    const total = this.historicTotalPages();
    const current = this.historicPage();
    const pages: (number | string)[] = [];
    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3) pages.push('...');
      for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
      if (current < total - 2) pages.push('...');
      pages.push(total);
    }
    return pages;
  });

  private readonly API_PAGE_SIZE = 2000;

  historicSort(col: string): void {
    if (this.historicSortCol() === col) {
      this.historicSortDir.set(this.historicSortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.historicSortCol.set(col);
      this.historicSortDir.set(col === 'cashierName' || col === 'reviewerName' ? 'asc' : 'desc');
    }
    this.historicPage.set(1);
  }

  historicGoPage(p: number | string): void {
    if (typeof p === 'number' && p >= 1 && p <= this.historicTotalPages()) {
      this.historicPage.set(p);
    }
  }

  historicChangePageSize(size: number): void {
    this.historicPageSize.set(size);
    this.historicPage.set(1);
  }

  historicClearFilters(): void {
    this.historicSearch.set('');
    this.historicDateFrom.set('');
    this.historicDateTo.set('');
    this.historicVarianceFilter.set('all');
    this.historicPage.set(1);
  }

  exportHistoricCsv(): void {
    const items = this.historicFiltered();
    if (!items.length) return;
    const headers = ['Cashier', 'Status', 'System Total', 'Declared Total', 'Cash', 'Card', 'Cheque', 'Postal', 'Shortage', 'Surplus', 'Variance', 'Date Captured', 'Reviewed By', 'Review Date'];
    const rows = items.map(r => [
      r.cashierName, r.status || 'VERIFIED',
      r.systemTotal || (r.totalAmt + (r.shortageAmt || 0) - (r.surplusAmt || 0)),
      r.totalAmt, r.totalCashAmt, r.totalCreditAmt, r.totalChequeAmt, r.totalPostalAmt,
      r.shortageAmt, r.surplusAmt, (r.surplusAmt || 0) - (r.shortageAmt || 0),
      this.formatDate(r.reconcileDate), r.reviewerName || '', this.formatDate(r.reviewDate)
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map((v: any) => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `historic-reconciles-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  uniqueOffices = computed(() => {
    const offices = new Set(this.shifts().map(s => s.cashOffice).filter(Boolean));
    return Array.from(offices);
  });

  activeShifts = computed(() => {
    return this.shifts();
  });

  filteredShifts = computed(() => {
    const status = this.filterStatus();
    const dateFrom = this.filterDateFrom();
    const dateTo = this.filterDateTo();
    return this.activeShifts().filter(s => {
      if (s.status === 'VERIFIED') return false;
      const matchesOffice = this.filterOffice() === 'All' || s.cashOffice === this.filterOffice();
      const matchesSearch = (s.cashierName || '').toLowerCase().includes(this.searchQuery().toLowerCase());
      let matchesStatus = false;
      if (status === 'All') {
        matchesStatus = true;
      } else if (status === 'ACTIONABLE') {
        matchesStatus = s.status === 'SUBMITTED' || s.status === 'RETURNED';
      } else {
        matchesStatus = s.status === status;
      }
      let matchesDate = true;
      if (dateFrom || dateTo) {
        const shiftDate = s.startTime ? new Date(s.startTime).toISOString().split('T')[0] : '';
        if (dateFrom && shiftDate < dateFrom) matchesDate = false;
        if (dateTo && shiftDate > dateTo) matchesDate = false;
      }
      return matchesOffice && matchesSearch && matchesStatus && matchesDate;
    });
  });

  pendingCount = computed(() => this.activeShifts().filter(s => s.status === 'SUBMITTED').length);
  varianceCount = computed(() => this.activeShifts().filter(s => s.variance !== 0 && s.status === 'SUBMITTED').length);
  totalPosted = computed(() => this.activeShifts().filter(s => s.status === 'COMPLETED' || s.status === 'APPROVED').reduce((sum, s) => sum + s.systemTotals.total, 0));
  totalSystemRevenue = computed(() => this.activeShifts().reduce((sum, s) => sum + s.systemTotals.total, 0));

  ngOnInit(): void {
    this.loadCashierList();
    this.loadPendingCancelRequests();
    this.loadPosCashierData();
  }

  formatCurrency(amount: number): string {
    return `R ${amount.toFixed(2)}`;
  }

  receiptListTotal(list: any[], field: string): number {
    return list.reduce((sum: number, r: any) => sum + (Number(r[field]) || 0), 0);
  }

  private extractItems(data: any): any[] {
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') {
      return data.items || data.value || data.results || data.data || data.rows || [];
    }
    return [];
  }

  private mapCashierToShift(c: any, index: number): CashierShift {
    const id = String(c.id || c.cashierId || c.cashier_ID || c.cashier_id || index);
    const name = c.cashierName || c.name || c.userName || c.cashier_name || `Cashier ${id}`;
    const office = c.cashOfficeName || c.cashOffice || c.cash_office || c.officeName || c.office || '';
    const officeId = Number(c.cashOfficeId || c.cashOffice_ID || c.cash_office_id || c.officeId || c.office_id || 0) || null;
    const rawUserId = Number(c.user_Id || c.userId || c.user_id || c.capturerId || 0) || null;
    const rawPosCashierId = Number(c.posCashierId || c.pos_cashier_id || 0) || null;
    const rawReconcileId = Number(c.cashierReconcile_Id || c.reconcileId || c.reconcile_id || c.cashierReconcileId || 0) || null;
    const systemTotal = Number(c.totalAmount || c.totalAmt || c.total || c.systemTotal || 0);
    const declaredTotal = Number(c.declaredTotal || c.declaredAmount || c.cashierTotal || c.totalDeclared || 0);
    const declaredCash = Number(c.declaredCash || c.cashAmount || c.cashTotal || c.totalCashAmt || 0);
    const declaredCard = Number(c.declaredCard || c.cardAmount || c.cardTotal || c.totalCreditAmt || 0);
    const declaredCheque = Number(c.chequeAmount || c.totalChequeAmt || 0);
    const declaredPostal = Number(c.postalAmount || c.totalPostalAmt || 0);
    const shortage = Number(c.shortage || 0);
    const surplus = Number(c.surplus || 0);
    const varianceTotal = Number(c.variance || c.varianceAmount || c.totalVariance || 0);
    const txCount = Number(c.transactionCount || c.receiptCount || c.txCount || c.count || 0);

    const officeConfig = officeId && this.officeConfigs() ? this.officeConfigs()[String(officeId)] : undefined;
    const groupCashiers = officeConfig?.groupCashiers ?? c.groupCashiers ?? false;

    let status: CashierShift['status'] = 'NOT_SUBMITTED';
    const numericStatus = Number(c.status);
    const rawStatusId = Number(c.statusId || c.status_Id || c.status_id || c.reconcileStatusId || (!isNaN(numericStatus) && numericStatus >= 170 ? c.status : 0) || 0);
    const rawStatus = String(c.statusDescription || c.statusDesc || (isNaN(numericStatus) || numericStatus < 170 ? c.status : '') || c.reconcileStatus || c.dayEndStatus || '').toLowerCase().trim();

    if (rawStatusId === 174) {
      status = 'SUBMITTED';
    } else if (rawStatusId === 175) {
      status = 'VERIFIED';
    } else if (rawStatusId === 176) {
      status = 'RETURNED';
    } else if (rawStatusId === 177 || rawStatusId === 178) {
      status = 'COMPLETED';
    } else if (rawStatus.includes('not yet submitted') || rawStatus.includes('not submitted') || rawStatus.includes('not_submitted') || rawStatus === 'not submitted') {
      status = 'NOT_SUBMITTED';
    } else if (rawStatus.includes('return')) {
      status = 'RETURNED';
    } else if (rawStatus.includes('complet') || rawStatus.includes('post') || rawStatus.includes('finish') || rawStatus.includes('approved')) {
      status = 'COMPLETED';
    } else if (rawStatus.includes('verified')) {
      status = 'VERIFIED';
    } else if (rawStatus.includes('submit') || rawStatus.includes('pending') || rawStatus.includes('awaiting')) {
      status = 'SUBMITTED';
    } else if (rawStatus.includes('not') || rawStatus.includes('open') || rawStatus === '') {
      status = 'NOT_SUBMITTED';
    } else if (rawReconcileId && rawReconcileId > 0) {
      status = 'SUBMITTED';
    }

    const returnReason = c.returnReason || c.reason || c.returnedReason || c.comments || null;

    return {
      id, userId: rawUserId, posCashierId: rawPosCashierId, cashierName: name,
      cashOffice: officeConfig?.cashOfficeDesc || office,
      cashOfficeId: officeId,
      groupCashiers,
      startTime: c.startTime || c.reconcileDate || c.date || c.createdDate || new Date().toISOString(),
      status,
      statusId: rawStatusId,
      systemTotals: { cash: declaredCash, card: declaredCard, cheque: declaredCheque, postal: declaredPostal, total: systemTotal || (declaredCash + declaredCard + declaredCheque + declaredPostal) },
      declaredTotals: declaredTotal > 0 || declaredCash > 0 ? { cash: declaredCash, card: declaredCard, cheque: declaredCheque, postal: declaredPostal, total: declaredTotal || (declaredCash + declaredCard + declaredCheque + declaredPostal) } : undefined,
      shortage,
      surplus,
      variance: varianceTotal !== 0 ? varianceTotal : (surplus - shortage),
      transactionCount: txCount,
      reconcileId: rawReconcileId,
      returnReason,
      hasActiveSession: c.isActive === true,
      rawData: c,
    };
  }

  async loadCashierList(): Promise<void> {
    this.isLoadingShifts.set(true);
    try {
      const data: any = await firstValueFrom(this.api.get('/api/platinum/auth-day-end/cashier-list'));
      let items: any[];
      if (data && data.cashiers) {
        items = this.extractItems(data.cashiers);
        if (data.offices && typeof data.offices === 'object') {
          this.officeConfigs.set(data.offices);
        }
      } else {
        items = this.extractItems(data);
      }
      let mapped = items.map((c: any, i: number) => this.mapCashierToShift(c, i));

      if (this.recentlyApprovedIds.size > 0 || this.recentlyApprovedNames.size > 0) {
        mapped = mapped.map(s => {
          const nameKey = (s.cashierName || '').trim().toLowerCase();
          const isRecentlyApproved = this.recentlyApprovedIds.has(s.id) || (nameKey && this.recentlyApprovedNames.has(nameKey));
          if (isRecentlyApproved && s.status !== 'VERIFIED' && s.status !== 'COMPLETED') {
            return { ...s, status: 'VERIFIED' as any, statusId: 175 };
          }
          return s;
        });
      }

      this.shifts.set(mapped);

      const hasGrouped = mapped.some(s => s.groupCashiers);
      const hasIndividual = mapped.some(s => !s.groupCashiers);
      if (hasGrouped && !hasIndividual) this.reconMode.set('CASH_OFFICE');
      else if (!hasGrouped && hasIndividual) this.reconMode.set('PER_CASHIER');
    } catch (e: any) {
      this.toast.error('Failed to load cashier list: ' + (e?.message || 'Unknown error'));
    } finally {
      this.isLoadingShifts.set(false);
    }
  }

  async loadPendingCancelRequests(): Promise<void> {
    this.cancelRequestsLoading.set(true);
    try {
      const data: any = await firstValueFrom(this.api.get('/api/platinum/auth-day-end/pending-cancel-requests'));
      const items = Array.isArray(data) ? data : (data?.items || data?.value || data?.data || data?.results || []);
      this.pendingCancelRequests.set(items.map((item: any, idx: number) => ({
        id: String(item.id || item.receiptId || item.receipt_id || idx),
        receiptId: Number(item.receiptId || item.receipt_id || item.id || 0),
        receiptNo: String(item.receiptNo || item.receipt_no || item.receiptNumber || ''),
        accountNumber: String(item.accountNumber || item.accountNo || item.account_number || ''),
        amount: Number(item.amount || item.totalAmount || item.receiptAmount || 0),
        cashierName: item.cashierName || item.cashier_name || item.requestedBy || '',
        cashierId: Number(item.cashierId || item.cashier_id || item.userId || 0),
        reason: item.reason || item.cancellationReason || item.returnReason || item.cancelReason || '',
        requestDate: item.requestDate || item.requestedDate || item.createdDate || item.date || '',
        paymentType: item.paymentType || item.payMode || '',
        status: item.status || 'PENDING',
        isMiscPayment: item.isMiscPayment === true || item.isMiscPayment === 1 || item.is_misc_payment === true,
      })));
    } catch (e: any) {
      this.toast.error('Failed to load cancellation requests: ' + (e?.message || 'Unknown error'));
      this.pendingCancelRequests.set([]);
    } finally {
      this.cancelRequestsLoading.set(false);
    }
  }

  async loadHistoricReconciles(): Promise<void> {
    this.historicLoading.set(true);
    try {
      const data: any = await firstValueFrom(this.api.get('/api/platinum/auth-day-end/historic-reconciles'));
      const items = data?.historic || [];
      this.historicReconciles.set(items);
      this.historicExpanded.set(true);
    } catch (e: any) {
      this.toast.error('Failed to load historic reconciles: ' + (e?.message || 'Unknown error'));
    } finally {
      this.historicLoading.set(false);
    }
  }

  toggleHistoric(): void {
    if (!this.historicExpanded() && this.historicReconciles().length === 0) {
      this.loadHistoricReconciles();
    } else {
      this.historicExpanded.set(!this.historicExpanded());
    }
  }

  private async fetchReceiptList(endpoint: string, id: string, fallbackId?: string): Promise<any[]> {
    const prefix = this.reviewApiPrefix();
    const body = { pageNumber: 1, pageSize: this.API_PAGE_SIZE, query: '', orderBy: '' };
    try {
      const res: any = await firstValueFrom(this.api.post(`/api/platinum/${prefix}/${endpoint}?id=${id}`, body));
      const items = this.extractItems(res);
      if (items.length > 0) return items;
      if (res?.validationResult?.errors?.length > 0 && !this.receiptValidationError()) {
        const errMsg = res.validationResult.errors[0];
        if (!/active cashier|not found|no.*session/i.test(errMsg)) {
          this.receiptValidationError.set(errMsg);
        }
      }
    } catch {}
    if (fallbackId && fallbackId !== id) {
      try {
        const res2: any = await firstValueFrom(this.api.post(`/api/platinum/${prefix}/${endpoint}?id=${fallbackId}`, body));
        const items2 = this.extractItems(res2);
        if (items2.length > 0) return items2;
      } catch {}
    }
    return [];
  }

  private async fetchCancelledReceipts(cashierId: string): Promise<any[]> {
    try {
      const res: any = await firstValueFrom(this.api.get('/api/platinum/auth-day-end/cashier-cancelled-receipt-list', { cashierId, pageNumber: '1', pageSize: String(this.API_PAGE_SIZE) }));
      return this.extractItems(res);
    } catch {
      return [];
    }
  }


  setReceiptTab(tab: string): void {
    this.reviewTab.set(tab);
    this.receiptPage.set(1);
    this.receiptSearchQuery.set('');
    this.receiptSortCol.set('');
    this.receiptSortDir.set('asc');
  }

  setReceiptPageSize(size: number): void {
    this.receiptPageSize.set(size);
    this.receiptPage.set(1);
  }

  private async enrichAccountHolderNames(...receiptLists: any[][]): Promise<void> {
    const allReceipts = receiptLists.flat();
    const uniqueAccounts = [...new Set(allReceipts.map(r => r.accountNumber).filter(Boolean))];
    if (uniqueAccounts.length === 0) return;
    const nameMap: Record<string, string> = {};
    const batchSize = 5;
    for (let i = 0; i < uniqueAccounts.length; i += batchSize) {
      const batch = uniqueAccounts.slice(i, i + batchSize);
      await Promise.all(batch.map(async (accNum: string) => {
        try {
          const accId = String(parseInt(accNum, 10));
          const detail: any = await firstValueFrom(this.api.get('/api/platinum/billing-enquiry/basic-account-details', { AccountId: accId }));
          if (detail?.fullNAME) nameMap[accNum] = detail.fullNAME;
        } catch {}
      }));
    }
    if (Object.keys(nameMap).length > 0) {
      for (const r of allReceipts) {
        if ((!r.accHolderName || r.accHolderName === '') && r.accountNumber && nameMap[r.accountNumber]) {
          r.accHolderName = nameMap[r.accountNumber];
        }
      }
      const current = this.reviewData();
      if (current) {
        this.reviewData.set({ ...current });
      }
    }
  }

  async handleReview(shift: CashierShift): Promise<void> {
    this.reviewApiPrefix.set('auth-day-end');
    this.receiptValidationError.set('');
    this.selectedShift.set(shift);
    this.returnReason.set('');
    this.reviewLoading.set(true);
    this.reviewData.set(null);
    this.reviewTab.set('cash');
    this.receiptPage.set(1);
    this.receiptPageSize.set(25);
    try {
      const shiftIdStr = String(shift.id);
      const posCashierIdStr = shift.posCashierId ? String(shift.posCashierId) : undefined;
      const cashierId = posCashierIdStr || shiftIdStr;
      const fallbackId = posCashierIdStr && posCashierIdStr !== shiftIdStr ? shiftIdStr : undefined;

      const [details, reconcile, cashReceipts, cardReceipts, chequeReceipts, postalReceipts, dropboxReceipts, offlineReceipts, systemVsCashier, cancelledReceipts] = await Promise.all([
        firstValueFrom(this.api.get('/api/platinum/auth-day-end/cashier-details', { id: cashierId })).catch(() => null),
        firstValueFrom(this.api.get('/api/platinum/auth-day-end/cashier-reconcile-by-cashierid', { cashierId })).catch(() => null),
        this.fetchReceiptList('cashier-receipt-cash-list', cashierId, fallbackId),
        this.fetchReceiptList('cashier-receipt-card-list', cashierId, fallbackId),
        this.fetchReceiptList('cashier-receipt-cheque-list', cashierId, fallbackId),
        this.fetchReceiptList('cashier-receipt-postal-order-list', cashierId, fallbackId),
        this.fetchReceiptList('cashier-receipt-drop-box-list', cashierId, fallbackId),
        this.fetchReceiptList('cashier-receipt-offline-data-list', cashierId, fallbackId),
        this.fetchReceiptList('system-vs-cashier-data-list', cashierId, fallbackId),
        this.fetchCancelledReceipts(cashierId),
      ]);

      let finalReconcile = reconcile;
      if ((!finalReconcile || !finalReconcile.cashierReconcile_Id) && fallbackId) {
        try {
          finalReconcile = await firstValueFrom(this.api.get('/api/platinum/auth-day-end/cashier-reconcile-by-cashierid', { cashierId: fallbackId }));
        } catch {}
      }

      this.reviewData.set({
        details, reconcile: finalReconcile,
        cashReceipts, cardReceipts, chequeReceipts,
        postalReceipts, dropboxReceipts, offlineReceipts, systemVsCashier, cancelledReceipts,
      });

      this.enrichAccountHolderNames(cashReceipts, cardReceipts, chequeReceipts, postalReceipts, dropboxReceipts, offlineReceipts, cancelledReceipts);

      if (finalReconcile && (finalReconcile.cashierReconcile_Id || finalReconcile.id || finalReconcile.reconcileId)) {
        const sumReceipts = (list: any[]) => list.reduce((s, r) => {
          if (r.isCancelled === 1 || r.isCancelled === true) return s;
          return s + Number(r.paidAmount || r.amount || r.totalAmount || r.receiptAmount || 0);
        }, 0);
        const receiptCash = sumReceipts(cashReceipts);
        const receiptCard = sumReceipts(cardReceipts);
        const receiptCheque = sumReceipts(chequeReceipts);
        const receiptPostal = sumReceipts(postalReceipts);
        const receiptTotal = receiptCash + receiptCard + receiptCheque + receiptPostal;

        const declCash = Number(finalReconcile.totalCashAmt || 0);
        const declCard = Number(finalReconcile.totalCreditAmt || 0);
        const declCheque = Number(finalReconcile.totalChequeAmt || 0);
        const declPostal = Number(finalReconcile.totalPostalAmt || 0);
        const declTotal = Number(finalReconcile.totalAmt || 0);
        const shortageAmt = Number(finalReconcile.shortageAmt || 0);
        const surplusAmt = Number(finalReconcile.surplusAmt || 0);
        const sysTotal = declTotal + shortageAmt - surplusAmt;
        const computedSystemTotal = receiptTotal > 0 ? receiptTotal : sysTotal;

        const updatedShift: CashierShift = {
          ...shift,
          systemTotals: {
            cash: receiptCash > 0 ? receiptCash : declCash,
            card: receiptCard > 0 ? receiptCard : declCard,
            cheque: receiptCheque > 0 ? receiptCheque : declCheque,
            postal: receiptPostal > 0 ? receiptPostal : declPostal,
            total: computedSystemTotal,
          },
          declaredTotals: declTotal > 0 || declCash > 0 ? { cash: declCash, card: declCard, cheque: declCheque, postal: declPostal, total: declTotal || (declCash + declCard + declCheque + declPostal) } : undefined,
          shortage: shortageAmt,
          surplus: surplusAmt,
          variance: surplusAmt - shortageAmt,
          transactionCount: cashReceipts.length + cardReceipts.length + chequeReceipts.length + postalReceipts.length + dropboxReceipts.length + offlineReceipts.length,
        };
        this.selectedShift.set(updatedShift);
      }

      const validationMsg = this.receiptValidationError();
      if (validationMsg && validationMsg.toLowerCase().includes('returned')) {
        const correctedShift: CashierShift = {
          ...this.selectedShift()!,
          status: 'RETURNED',
        };
        this.selectedShift.set(correctedShift);

        const currentShifts = this.shifts();
        const idx = currentShifts.findIndex((s: CashierShift) => s.id === shift.id);
        if (idx >= 0) {
          const updated = [...currentShifts];
          updated[idx] = { ...updated[idx], status: 'RETURNED' };
          this.shifts.set(updated);
        }
      }

      const totalReceipts = cashReceipts.length + cardReceipts.length + chequeReceipts.length + postalReceipts.length;
      if (totalReceipts === 0 && shift.transactionCount > 0) {
        this.toast.warning(`Transaction data may be loading — the API returned 0 receipts but ${shift.transactionCount} transactions were expected`);
      }
    } catch (e: any) {
      this.toast.error('Failed to load review data: ' + (e?.message || 'Unknown error'));
    } finally {
      this.reviewLoading.set(false);
    }
  }

  async handleApprove(): Promise<void> {
    if (this.actionLoading()) return;
    this.actionLoading.set('approve');
    try {
      const shift = this.selectedShift();
      const details = this.reviewData()?.details;
      const reconcile = this.reviewData()?.reconcile;

      const resolvedCashierId = this.resolveShiftCashierId();

      if (!resolvedCashierId) {
        this.toast.error('Cannot approve — no valid cashier ID found. The cashier may not have a POS session.');
        return;
      }

      const cashOfficeId = Number(
        reconcile?.cashOfficeId || reconcile?.cashOffice_Id || reconcile?.cashierOfficeId
        || shift?.cashOfficeId
        || details?.cashierOfficeId || details?.cashOfficeId
        || 0
      );
      const cashBookId = Number(
        reconcile?.cashBookId || reconcile?.cashBook_Id || reconcile?.cashbookId
        || details?.cashBookId || details?.cashbookId
        || 0
      );

      // Supervisor approval flow: verify-cashier-reconcile (per-office endpoint)
      // This moves the reconciliation from Submitted (174) to Verified (175).
      // The cashier's submit-day-auth-reconcile is NOT the correct endpoint here.
      try { await firstValueFrom(this.api.post('/api/platinum/auth-day-end-per-office/add-stage')); } catch {}
      try { await firstValueFrom(this.api.post('/api/platinum/auth-day-end-per-office/process-staging-payments', { cashOfficeId })); } catch {}

      const verifyResp: any = await firstValueFrom(this.api.post('/api/platinum/auth-day-end-per-office/verify-cashier-reconcile', {
        cashierId: resolvedCashierId, cashOfficeId, cashBookId
      }));
      if (verifyResp?.isSuccess === false || verifyResp?._error || verifyResp?.success === false) {
        let errors: string[] | null = null;
        try { errors = verifyResp?.detail ? JSON.parse(verifyResp.detail)?.errors : null; } catch {}
        const apiMsg = (errors && errors.length ? errors.join('; ') : '') || verifyResp?.message || verifyResp?.detail || verifyResp?.statusText || 'Unknown API error';
        this.toast.error('Approve failed — ' + apiMsg);
        return;
      }

      // Optional ledger posting after successful supervisor verification
      try {
        const ledgerResp: any = await firstValueFrom(this.api.post('/api/platinum/auth-day-end/post-to-ledger', {
          cashierId: resolvedCashierId, cashBookId, cashierOfficeId: cashOfficeId
        }));
        if (ledgerResp?.isSuccess === false || ledgerResp?._error || ledgerResp?.success === false) {
          const apiMsg = ledgerResp?.message || ledgerResp?.detail || ledgerResp?.statusText || 'Unknown API error';
          this.toast.warning('Approved but ledger posting failed — ' + apiMsg);
        }
      } catch {}

      this.toast.success('Day-end reconciliation approved successfully.');

      if (shift) {
        this.selectedShift.set({ ...shift, status: 'VERIFIED' as any, statusId: 175 });
        const shifts = this.shifts();
        const updatedShifts = shifts.map(s =>
          s.id === shift.id ? { ...s, status: 'VERIFIED' as any, statusId: 175 } : s
        );
        this.shifts.set(updatedShifts);
        this.recentlyApprovedIds.add(shift.id);
        if (shift.cashierName) this.recentlyApprovedNames.add(shift.cashierName.trim().toLowerCase());
      }
      await new Promise(resolve => setTimeout(resolve, 1500));
      this.loadCashierList();

      // Auto-generate both approval PDFs after successful verification
      const printPrefix = this.reviewApiPrefix();
      const cashierName = shift?.cashierName || 'Cashier';
      const reconcileDate = new Date().toISOString().split('T')[0];
      this.generateApprovalPdfs(resolvedCashierId, cashierName, reconcileDate, printPrefix);
    } catch (e: any) {
      const errMsg = e?.error?.message || e?.error?.detail || e?.message || 'Unknown error';
      this.toast.error('Approve failed: ' + errMsg);
    } finally {
      this.actionLoading.set('');
    }
  }

  async handleReturn(): Promise<void> {
    if (this.actionLoading()) return;
    const shift = this.selectedShift();
    if (!shift || !this.returnReason()) return;
    this.actionLoading.set('return');
    try {
      const reconcile = this.reviewData()?.reconcile;
      const cashierId = reconcile?.cashierId || shift.posCashierId || Number(shift.id);
      const prefix = this.reviewApiPrefix();
      const url = `/api/platinum/${prefix}/return-day-end-reconcile`;
      console.log(`[handleReturn] Using ${prefix} endpoint: ${url}, cashierId=${cashierId} (reconcile.cashierId=${reconcile?.cashierId}, shift.posCashierId=${shift.posCashierId})`);
      const resp: any = await firstValueFrom(this.api.post(url, {
        id: cashierId,
        returnReason: this.returnReason(),
      }));

      if (resp?.success === false || resp?.isSuccess === false || resp?._error) {
        const apiMsg = resp?.message || resp?.detail || resp?.statusText || 'Platinum API did not update the status';
        this.toast.error('Return failed — Platinum API: ' + apiMsg);
        return;
      }

      this.toast.success('Day-end reconciliation returned to cashier.');
      const currentShifts = this.shifts();
      const updatedShifts = currentShifts.map(s =>
        s.id === shift.id ? { ...s, status: 'RETURNED' as const, returnReason: this.returnReason() } : s
      );
      this.shifts.set(updatedShifts);
      this.selectedShift.set(null);
      this.returnReason.set('');
      this.loadCashierList();
    } catch (e: any) {
      const errMsg = e?.error?.message || e?.error?.detail || e?.message || 'Unknown error';
      this.toast.error('Return failed: ' + errMsg);
    } finally {
      this.actionLoading.set('');
    }
  }

  async handleApproveCancelRequest(req: PendingCancelRequest): Promise<void> {
    this.cancelActionLoading.set(req.id);
    try {
      await firstValueFrom(this.api.post('/api/platinum/auth-day-end/approve-cancel-receipt', {
        receiptId: req.receiptId, reason: req.reason || 'Approved by supervisor', isMiscPayment: req.isMiscPayment
      }));
      this.toast.success(`Receipt ${req.receiptNo || req.receiptId} has been voided.`);
      this.pendingCancelRequests.update(prev => prev.filter(r => r.id !== req.id));
      this.loadPendingCancelRequests();
    } catch (e: any) {
      this.toast.error('Approve failed: ' + (e?.message || 'Unknown error'));
    } finally {
      this.cancelActionLoading.set(null);
    }
  }

  async handleDeclineCancelRequest(req: PendingCancelRequest): Promise<void> {
    this.cancelActionLoading.set(req.id);
    try {
      await firstValueFrom(this.api.post('/api/platinum/auth-day-end/decline-cancel-receipt', {
        receiptId: req.receiptId, reason: req.reason || 'Declined by supervisor', isMiscPayment: req.isMiscPayment
      }));
      this.toast.success(`Receipt ${req.receiptNo || req.receiptId} cancellation was rejected.`);
      this.pendingCancelRequests.update(prev => prev.filter(r => r.id !== req.id));
      this.loadPendingCancelRequests();
    } catch (e: any) {
      this.toast.error('Decline failed: ' + (e?.message || 'Unknown error'));
    } finally {
      this.cancelActionLoading.set(null);
    }
  }

  async handleDirectCancel(receiptId: number, reason: string): Promise<void> {
    if (this.directCancelProcessing()) return;
    this.directCancelProcessing.set(true);
    try {
      await firstValueFrom(this.api.post('/api/platinum/auth-day-end/cancel-receipt', {
        id: receiptId, returnReason: reason, userId: this.auth.user()?.user_ID || 0
      }));
      this.toast.success(`Receipt ${receiptId} has been cancelled. Refreshing data...`);
      this.directCancelId.set(null);
      this.directCancelReason.set('');

      const shift = this.selectedShift();
      if (shift) {
        for (let attempt = 1; attempt <= 3; attempt++) {
          await new Promise(resolve => setTimeout(resolve, attempt * 1500));
          await this.handleReview(shift);
          const data = this.reviewData();
          if (data) {
            const allReceipts = [
              ...data.cashReceipts, ...data.cardReceipts, ...data.chequeReceipts,
              ...data.postalReceipts, ...data.dropboxReceipts, ...data.offlineReceipts,
            ];
            const target = allReceipts.find((r: any) => (r.id || r.receiptId) === receiptId);
            if (target && (target.isCancelled === 1 || target.isCancelled === true)) {
              this.toast.success(`Receipt ${receiptId} confirmed as cancelled.`);
              break;
            }
            if (attempt < 3) {
              this.toast.info(`Waiting for Platinum to process cancellation (attempt ${attempt + 1}/3)...`);
            } else {
              this.toast.info('Platinum API has not yet reflected the cancellation in the receipt list. The shortage amount has been updated. You may need to refresh again.');
            }
          }
        }
      }
    } catch (e: any) {
      this.toast.error('Direct cancel failed: ' + (e?.message || 'Unknown error'));
    } finally {
      this.directCancelProcessing.set(false);
    }
  }

  private resolveShiftCashierId(): number {
    const shift = this.selectedShift();
    const reconcile = this.reviewData()?.reconcile;
    const details = this.reviewData()?.details;
    return Number(
      shift?.posCashierId
      || reconcile?.cashierId || reconcile?.cashier_Id || reconcile?.cashier_ID
      || details?.cashierId || details?.cashier_Id
      || shift?.id || 0
    );
  }

  async handlePrintCashReport(): Promise<void> {
    try {
      this.toast.info('Preparing cash report...');
      const cashierId = this.resolveShiftCashierId();
      const cashierName = this.selectedShift()?.cashierName || 'Cashier';
      const reconcileDate = new Date().toISOString().split('T')[0];
      const result: any = await firstValueFrom(this.api.post('/api/platinum/auth-day-end/print-cash-report', {
        cashierId, cashierName, reconcileDate
      }));
      this.openPdfFromResult(result);
    } catch (e: any) {
      this.toast.error('Failed to generate cash report: ' + (e?.message || 'Unknown error'));
    }
  }

  async handlePrintDepositSlip(): Promise<void> {
    try {
      this.toast.info('Preparing deposit slip...');
      const cashierId = this.resolveShiftCashierId();
      const cashierName = this.selectedShift()?.cashierName || 'Cashier';
      const reconcileDate = new Date().toISOString().split('T')[0];
      const result: any = await firstValueFrom(this.api.post('/api/platinum/auth-day-end/print-deposit-slip', {
        cashierId, cashierName, reconcileDate
      }));
      this.openPdfFromResult(result);
    } catch (e: any) {
      this.toast.error('Failed to generate deposit slip: ' + (e?.message || 'Unknown error'));
    }
  }

  private base64ToBlobUrl(result: any): string | null {
    const b64 = typeof result === 'string' ? result : (result?.fileContents || result?.base64);
    if (!b64) return null;
    const byteChars = atob(b64);
    const byteArr = new Uint8Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) byteArr[i] = byteChars.charCodeAt(i);
    return URL.createObjectURL(new Blob([byteArr], { type: 'application/pdf' }));
  }

  async generateApprovalPdfs(cashierId: number, cashierName: string, reconcileDate: string, prefix: string): Promise<void> {
    this.generatingApprovalPdfs.set(true);
    this.approvalCashReportUrl.set(null);
    this.approvalDepositSlipUrl.set(null);
    try {
      const payload = { cashierId, cashierName, reconcileDate };
      const [cashReportRes, depositSlipRes]: any[] = await Promise.allSettled([
        firstValueFrom(this.api.post(`/api/platinum/${prefix}/print-cash-report`, payload)),
        firstValueFrom(this.api.post(`/api/platinum/${prefix}/print-deposit-slip`, payload)),
      ]);
      if (cashReportRes.status === 'fulfilled') {
        const url = this.base64ToBlobUrl(cashReportRes.value);
        if (url) this.approvalCashReportUrl.set(url);
      }
      if (depositSlipRes.status === 'fulfilled') {
        const url = this.base64ToBlobUrl(depositSlipRes.value);
        if (url) this.approvalDepositSlipUrl.set(url);
      }
      if (!this.approvalCashReportUrl() && !this.approvalDepositSlipUrl()) {
        this.toast.warning('Reports could not be generated — the report service may be temporarily unavailable.');
      }
    } catch {
    } finally {
      this.generatingApprovalPdfs.set(false);
    }
  }

  private openPdfFromResult(result: any): void {
    const b64 = typeof result === 'string' ? result : (result?.fileContents || result?.base64);
    if (b64) {
      const url = this.base64ToBlobUrl(b64);
      if (url) window.open(url, '_blank');
    } else {
      this.toast.success('Report generated.');
    }
  }

  async printCashReport(rec: any): Promise<void> {
    const key = rec.posCashierId + '-cash';
    this.reportGenerating.set(key);
    try {
      const prefix = rec.isPerOffice ? 'auth-day-end-per-office' : 'auth-day-end';
      const result: any = await firstValueFrom(this.api.post(`/api/platinum/${prefix}/print-cash-report`, {
        cashierId: rec.posCashierId,
        cashierName: rec.cashierName,
        reconcileDate: rec.reconcileDate ? rec.reconcileDate.split('T')[0] : undefined
      }));
      this.openPdfFromResult(result);
      this.toast.success('Cash report generated.');
    } catch (e: any) {
      const msg = e?.error?.detail || e?.error?.message || e?.message || '';
      if (msg.includes('500') || msg.includes('Internal Server Error')) {
        this.toast.error('Cash report not available — the Platinum report service may be temporarily unavailable.');
      } else {
        this.toast.error('Failed to generate cash report: ' + msg);
      }
    } finally {
      this.reportGenerating.set(null);
    }
  }

  async printDepositSlip(rec: any): Promise<void> {
    const key = rec.posCashierId + '-deposit';
    this.reportGenerating.set(key);
    try {
      const prefix = rec.isPerOffice ? 'auth-day-end-per-office' : 'auth-day-end';
      const result: any = await firstValueFrom(this.api.post(`/api/platinum/${prefix}/print-deposit-slip`, {
        cashierId: rec.posCashierId,
        cashierName: rec.cashierName,
        reconcileDate: rec.reconcileDate ? rec.reconcileDate.split('T')[0] : undefined
      }));
      this.openPdfFromResult(result);
      this.toast.success('Deposit slip generated.');
    } catch (e: any) {
      const msg = e?.error?.detail || e?.error?.message || e?.message || '';
      if (msg.includes('500') || msg.includes('Internal Server Error')) {
        this.toast.error('Deposit slip not available — the Platinum report service may be temporarily unavailable.');
      } else {
        this.toast.error('Failed to generate deposit slip: ' + msg);
      }
    } finally {
      this.reportGenerating.set(null);
    }
  }

  async generateCustomCashReport(): Promise<void> {
    const shift = this.selectedShift();
    const data = this.reviewData();
    if (!shift || !data) { this.toast.error('No data available for report'); return; }
    this.reportGenerating.set('custom-cash');
    try {
      const isOffice = this.reviewApiPrefix() === 'auth-day-end-per-office';
      if (isOffice) {
        const allShifts = this.getOfficeShifts();
        const consolidated = await this.fetchConsolidatedOfficeData(allShifts);
        if (this.isReviewDataEmpty(consolidated)) {
          this.toast.warning('No receipt data found across office cashiers. Report may be incomplete.');
        }
        await this.reportService.generateOfficeCashReport(shift, consolidated, allShifts);
      } else {
        if (this.isReviewDataEmpty(data)) {
          this.toast.warning('No receipt data found. Report may be incomplete.');
        }
        await this.reportService.generateCashierCashReport(shift, data);
      }
      this.toast.success('Cash report downloaded.');
    } catch (e: any) {
      this.toast.error('Failed to generate cash report: ' + (e?.message || 'Unknown error'));
    } finally {
      this.reportGenerating.set(null);
    }
  }

  async generateCustomDepositSlip(): Promise<void> {
    const shift = this.selectedShift();
    const data = this.reviewData();
    if (!shift || !data) { this.toast.error('No data available for report'); return; }
    this.reportGenerating.set('custom-deposit');
    try {
      const isOffice = this.reviewApiPrefix() === 'auth-day-end-per-office';
      if (isOffice) {
        const allShifts = this.getOfficeShifts();
        const consolidated = await this.fetchConsolidatedOfficeData(allShifts);
        if (this.isReviewDataEmpty(consolidated)) {
          this.toast.warning('No receipt data found across office cashiers. Report may be incomplete.');
        }
        await this.reportService.generateOfficeDepositSlip(shift, consolidated, allShifts);
      } else {
        if (this.isReviewDataEmpty(data)) {
          this.toast.warning('No receipt data found. Report may be incomplete.');
        }
        await this.reportService.generateCashierDepositSlip(shift, data);
      }
      this.toast.success('Deposit slip downloaded.');
    } catch (e: any) {
      this.toast.error('Failed to generate deposit slip: ' + (e?.message || 'Unknown error'));
    } finally {
      this.reportGenerating.set(null);
    }
  }

  async generateCustomCashReportForRec(rec: any): Promise<void> {
    const key = rec.posCashierId + '-custom-cash';
    this.reportGenerating.set(key);
    try {
      const isOffice = !!rec.isPerOffice;
      if (isOffice) {
        const officeShifts = this.buildOfficeShiftsFromHistoric(rec);
        const consolidated = await this.fetchConsolidatedOfficeData(officeShifts);
        if (this.isReviewDataEmpty(consolidated)) {
          this.toast.warning('No receipt data found across office cashiers. Report may be incomplete.');
        }
        const shift = this.buildShiftFromRec(rec);
        await this.reportService.generateOfficeCashReport(shift, consolidated, officeShifts);
      } else {
        const cashierId = String(rec.posCashierId);
        const reviewData = await this.fetchReviewDataForReport(cashierId, false);
        if (this.isReviewDataEmpty(reviewData)) {
          this.toast.warning('No receipt data found for this reconciliation period. Report may be incomplete.');
        }
        const shift = this.buildShiftFromRec(rec);
        await this.reportService.generateCashierCashReport(shift, reviewData);
      }
      this.toast.success('Cash report downloaded.');
    } catch (e: any) {
      this.toast.error('Failed to generate report: ' + (e?.message || 'Unknown error'));
    } finally {
      this.reportGenerating.set(null);
    }
  }

  async generateCustomDepositSlipForRec(rec: any): Promise<void> {
    const key = rec.posCashierId + '-custom-deposit';
    this.reportGenerating.set(key);
    try {
      const isOffice = !!rec.isPerOffice;
      if (isOffice) {
        const officeShifts = this.buildOfficeShiftsFromHistoric(rec);
        const consolidated = await this.fetchConsolidatedOfficeData(officeShifts);
        if (this.isReviewDataEmpty(consolidated)) {
          this.toast.warning('No receipt data found across office cashiers. Report may be incomplete.');
        }
        const shift = this.buildShiftFromRec(rec);
        await this.reportService.generateOfficeDepositSlip(shift, consolidated, officeShifts);
      } else {
        const cashierId = String(rec.posCashierId);
        const reviewData = await this.fetchReviewDataForReport(cashierId, false);
        if (this.isReviewDataEmpty(reviewData)) {
          this.toast.warning('No receipt data found for this reconciliation period. Report may be incomplete.');
        }
        const shift = this.buildShiftFromRec(rec);
        await this.reportService.generateCashierDepositSlip(shift, reviewData);
      }
      this.toast.success('Deposit slip downloaded.');
    } catch (e: any) {
      this.toast.error('Failed to generate report: ' + (e?.message || 'Unknown error'));
    } finally {
      this.reportGenerating.set(null);
    }
  }

  private buildShiftFromRec(rec: any): any {
    return {
      id: String(rec.posCashierId || rec.cashierId || ''),
      posCashierId: rec.posCashierId || rec.cashierId || null,
      cashierName: rec.cashierName || `Cashier ${rec.posCashierId}`,
      cashOffice: rec.cashOffice || rec.cashOfficeName || '-',
      startTime: rec.reconcileDate || new Date().toISOString(),
      systemTotals: {
        cash: this.toNum(rec.totalCashAmt),
        card: this.toNum(rec.totalCreditAmt),
        cheque: this.toNum(rec.totalChequeAmt),
        postal: this.toNum(rec.totalPostalAmt),
        total: this.toNum(rec.totalAmt),
      },
      declaredTotals: rec.declaredTotal > 0 || rec.declaredCash > 0 ? {
        cash: this.toNum(rec.declaredCash || rec.cashAmount || 0),
        card: this.toNum(rec.declaredCard || rec.cardAmount || 0),
        cheque: this.toNum(rec.declaredCheque || rec.chequeAmount || 0),
        postal: this.toNum(rec.declaredPostal || rec.postalAmount || 0),
        total: this.toNum(rec.declaredTotal || rec.declaredAmt || 0),
      } : undefined,
      shortage: this.toNum(rec.shortageAmt),
      surplus: this.toNum(rec.surplusAmt),
      transactionCount: this.toNum(rec.transactionCount),
      reconcileStatus: rec.reconcileStatus || rec.status || '',
      statusId: this.toNum(rec.statusId || rec.status_ID || 0),
    };
  }

  private async fetchReviewDataForReport(cashierId: string, isOffice: boolean): Promise<any> {
    const prefix = isOffice ? 'auth-day-end-per-office' : 'auth-day-end';
    const body = { pageNumber: 1, pageSize: 5000, query: '', orderBy: '' };
    const [cashReceipts, cardReceipts, chequeReceipts, postalReceipts, dropboxReceipts, offlineReceipts, cancelledReceipts, systemVsCashier] = await Promise.all([
      this.fetchReceiptListDirect(prefix, 'cashier-receipt-cash-list', cashierId, body),
      this.fetchReceiptListDirect(prefix, 'cashier-receipt-card-list', cashierId, body),
      this.fetchReceiptListDirect(prefix, 'cashier-receipt-cheque-list', cashierId, body),
      this.fetchReceiptListDirect(prefix, 'cashier-receipt-postal-order-list', cashierId, body),
      this.fetchReceiptListDirect(prefix, 'cashier-receipt-drop-box-list', cashierId, body),
      this.fetchReceiptListDirect(prefix, 'cashier-receipt-offline-data-list', cashierId, body),
      this.fetchCancelledReceipts(cashierId),
      this.fetchReceiptListDirect(prefix, 'system-vs-cashier-data-list', cashierId, body),
    ]);
    return { cashReceipts, cardReceipts, chequeReceipts, postalReceipts, dropboxReceipts, offlineReceipts, cancelledReceipts, systemVsCashier, reconcile: null };
  }

  private async fetchReceiptListDirect(prefix: string, endpoint: string, id: string, body: any): Promise<any[]> {
    try {
      const res: any = await firstValueFrom(this.api.post(`/api/platinum/${prefix}/${endpoint}?id=${id}`, body));
      return this.extractItems(res);
    } catch { return []; }
  }

  private getOfficeShifts(): any[] {
    return this.shifts().filter(s => s.cashOffice === this.selectedShift()?.cashOffice);
  }

  private async fetchConsolidatedOfficeData(allShifts: any[]): Promise<any> {
    const cashierIds = allShifts
      .map(s => String(s.posCashierId || s.id || ''))
      .filter(id => id && id !== '0');
    const uniqueIds = [...new Set(cashierIds)];
    if (uniqueIds.length === 0) {
      return { cashReceipts: [], cardReceipts: [], chequeReceipts: [], postalReceipts: [], dropboxReceipts: [], offlineReceipts: [], cancelledReceipts: [], systemVsCashier: [], reconcile: null };
    }
    const allData = await Promise.all(
      uniqueIds.map(id => this.fetchReviewDataForReport(id, true))
    );
    const merged: any = { cashReceipts: [], cardReceipts: [], chequeReceipts: [], postalReceipts: [], dropboxReceipts: [], offlineReceipts: [], cancelledReceipts: [], systemVsCashier: [], reconcile: null };
    for (const d of allData) {
      merged.cashReceipts.push(...(d.cashReceipts || []));
      merged.cardReceipts.push(...(d.cardReceipts || []));
      merged.chequeReceipts.push(...(d.chequeReceipts || []));
      merged.postalReceipts.push(...(d.postalReceipts || []));
      merged.dropboxReceipts.push(...(d.dropboxReceipts || []));
      merged.offlineReceipts.push(...(d.offlineReceipts || []));
      merged.cancelledReceipts.push(...(d.cancelledReceipts || []));
      merged.systemVsCashier.push(...(d.systemVsCashier || []));
    }
    return merged;
  }

  private isReviewDataEmpty(data: any): boolean {
    if (!data) return true;
    const total = (data.cashReceipts?.length || 0) + (data.cardReceipts?.length || 0) +
      (data.chequeReceipts?.length || 0) + (data.postalReceipts?.length || 0) +
      (data.dropboxReceipts?.length || 0) + (data.offlineReceipts?.length || 0);
    return total === 0;
  }

  private buildOfficeShiftsFromHistoric(rec: any): any[] {
    const officeName = rec.cashOffice || rec.cashOfficeName || '';
    const recDate = rec.reconcileDate ? rec.reconcileDate.substring(0, 10) : '';
    if (!officeName || !recDate) return [this.buildShiftFromRec(rec)];
    const siblings = this.historicReconciles().filter((r: any) => {
      const rOffice = r.cashOffice || r.cashOfficeName || '';
      const rDate = r.reconcileDate ? r.reconcileDate.substring(0, 10) : '';
      return rOffice === officeName && rDate === recDate;
    });
    if (siblings.length <= 1) return [this.buildShiftFromRec(rec)];
    return siblings.map((r: any) => this.buildShiftFromRec(r));
  }

  closeReview(): void {
    this.selectedShift.set(null);
    this.reviewData.set(null);
    this.approvalCashReportUrl.set(null);
    this.approvalDepositSlipUrl.set(null);
    this.generatingApprovalPdfs.set(false);
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'SUBMITTED': return 'badge-warning';
      case 'VERIFIED': return 'badge-info';
      case 'APPROVED': return 'badge-success';
      case 'COMPLETED': return 'badge-success';
      case 'RETURNED': return 'badge-danger';
      default: return 'badge-default';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'SUBMITTED': return 'Submitted';
      case 'VERIFIED': return 'Verified';
      case 'APPROVED': return 'Approved';
      case 'COMPLETED': return 'Completed';
      case 'RETURNED': return 'Returned';
      case 'NOT_SUBMITTED': return 'Not Submitted';
      default: return status;
    }
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
    } catch { return dateStr; }
  }

  private fileDate(iso: string): string {
    if (!iso) return 'unknown';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return 'unknown';
    return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
  }

  async loadPerOfficeList(): Promise<void> {
    this.perOfficeListLoading.set(true);
    try {
      const data: any = await firstValueFrom(this.api.get('/api/platinum/auth-day-end-per-office/cash-office-list'));
      this.perOfficeList.set(Array.isArray(data) ? data : (data?.items || []));
    } catch (e: any) {
      this.toast.error('Failed to load cash office list: ' + (e?.message || 'Unknown error'));
      this.perOfficeList.set([]);
    } finally {
      this.perOfficeListLoading.set(false);
    }
  }

  async handlePerOfficeSelect(cashOfficeId: number): Promise<void> {
    this.perOfficeSelectedId.set(cashOfficeId);
    this.perOfficeData.set(null);
    this.perOfficeLoading.set(true);
    this.perOfficeStaged.set(false);
    try {
      const data: any = await firstValueFrom(this.api.get('/api/platinum/auth-day-end-per-office/cash-office-selection', { cashOfficeId: String(cashOfficeId) }));
      this.perOfficeData.set({
        cashBookId: data?.cashBookId || data?.cashbookId || 0,
        cashBookName: data?.cashBookName || data?.cashbookName || '',
        cashierSummary: Array.isArray(data?.cashierSummary) ? data.cashierSummary : this.extractItems(data?.cashierSummary),
        completionStatus: data?.completionStatus || '',
        allVerified: data?.allVerified === true,
        validationResult: data?.validationResult,
      });
      this.loadAllPerOfficeCashierStatuses();
    } catch (e: any) {
      this.toast.error('Failed to load office data: ' + (e?.message || ''));
    } finally {
      this.perOfficeLoading.set(false);
    }
  }

  async refreshPerOfficeSummary(): Promise<void> {
    if (!this.perOfficeSelectedId()) return;
    try {
      const data: any = await firstValueFrom(this.api.get('/api/platinum/auth-day-end-per-office/cashier-summary-by-office', { cashOfficeId: String(this.perOfficeSelectedId()) }));
      const items = data?.data || data?.cashierSummary || (Array.isArray(data) ? data : []);
      const prev = this.perOfficeData();
      if (prev) {
        this.perOfficeData.set({
          ...prev,
          cashierSummary: items,
          completionStatus: data?.completionStatus || prev.completionStatus,
          allVerified: data?.allVerified === true,
          validationResult: data?.validationResult || prev.validationResult,
        });
      }
    } catch {
    }
  }

  async handlePerOfficeVerifyCashier(cashierId: number): Promise<void> {
    if (!this.perOfficeSelectedId() || !this.perOfficeData()) return;
    this.perOfficeVerifying.set(cashierId);
    try {
      try { await firstValueFrom(this.api.post('/api/platinum/auth-day-end-per-office/add-stage')); } catch {}
      try { await firstValueFrom(this.api.post('/api/platinum/auth-day-end-per-office/process-staging-payments', { cashOfficeId: this.perOfficeSelectedId() })); } catch {}

      const result: any = await firstValueFrom(this.api.post('/api/platinum/auth-day-end-per-office/verify-cashier-reconcile', {
        cashierId, cashOfficeId: this.perOfficeSelectedId(), cashBookId: this.perOfficeData().cashBookId,
      }));
      if (result?.isSuccess === false) {
        this.toast.error(result.message || 'Cashier verification failed.');
      } else {
        this.toast.success(`Cashier ${cashierId} verified successfully.`);
      }
      await this.refreshPerOfficeSummary();
    } catch (e: any) {
      this.toast.error('Verification failed: ' + (e?.message || ''));
    } finally {
      this.perOfficeVerifying.set(null);
    }
  }

  async handlePerOfficeSubmitAll(): Promise<void> {
    if (!this.perOfficeSelectedId() || !this.perOfficeData()) return;
    this.perOfficeSubmitting.set(true);
    try {
      const result: any = await firstValueFrom(this.api.post('/api/platinum/auth-day-end-per-office/submit-reconcile-per-office', {
        cashOfficeId: this.perOfficeSelectedId(), cashBookId: this.perOfficeData().cashBookId,
      }));
      if (result?.isSuccess === false) {
        this.toast.error(result.message || 'Office reconciliation submission failed.');
      } else {
        this.toast.success('All cashiers in this office have been fully reconciled.');
      }
      try { await firstValueFrom(this.api.post('/api/platinum/auth-day-end-per-office/finish-stage')); } catch {}
      await this.refreshPerOfficeSummary();
      this.loadCashierList();
    } catch (e: any) {
      this.toast.error('Office submission failed: ' + (e?.message || ''));
      try { await firstValueFrom(this.api.post('/api/platinum/auth-day-end-per-office/finish-stage')); } catch {}
    } finally {
      this.perOfficeSubmitting.set(false);
    }
  }

  async handlePerOfficeReturn(cashierReconcileId: number, reason: string): Promise<void> {
    try {
      const resp: any = await firstValueFrom(this.api.post('/api/platinum/auth-day-end-per-office/return-day-end-reconcile', { id: cashierReconcileId, returnReason: reason }));
      if (resp?.success === false) {
        this.toast.error('Return failed: ' + (resp?.message || 'Platinum API did not update the status'));
      } else {
        this.toast.success('Cashier reconcile returned for correction.');
      }
      try { await firstValueFrom(this.api.post('/api/platinum/auth-day-end-per-office/finish-stage')); } catch {}
      await this.refreshPerOfficeSummary();
    } catch (e: any) {
      const errMsg = e?.error?.message || e?.message || 'Unknown error';
      this.toast.error('Return failed: ' + errMsg);
      try { await firstValueFrom(this.api.post('/api/platinum/auth-day-end-per-office/finish-stage')); } catch {}
    }
  }

  async handlePerOfficeCancelReceipt(receiptId: number, reason: string): Promise<void> {
    try {
      await firstValueFrom(this.api.post('/api/platinum/auth-day-end-per-office/cancel-day-auth-reconcile-receipt', { id: receiptId, returnReason: reason }));
      this.toast.success(`Receipt ${receiptId} cancelled.`);
      await this.refreshPerOfficeSummary();
    } catch (e: any) {
      this.toast.error('Cancel receipt failed: ' + (e?.message || ''));
    }
  }

  async loadPosCashierData(): Promise<void> {
    try {
      const data: any = await firstValueFrom(this.api.get('/api/platinum/auth-day-end/pos-cashier'));
      const items = this.extractItems(data);
      this.posCashierData.set(items);
    } catch (e: any) {
      this.posCashierData.set([]);
    }
  }

  async handlePerOfficeReview(cashierSummary: any): Promise<void> {
    const cashierId = cashierSummary.cashierId || cashierSummary.id || cashierSummary.cashier_ID;
    if (!cashierId) return;
    this.reviewApiPrefix.set('auth-day-end-per-office');
    this.receiptValidationError.set('');
    const shift: CashierShift = {
      id: String(cashierId),
      userId: null,
      posCashierId: cashierId,
      cashierName: cashierSummary.cashierName || cashierSummary.name || cashierSummary.fullName || `Cashier ${cashierId}`,
      cashOffice: this.perOfficeData()?.cashBookName || '',
      cashOfficeId: this.perOfficeSelectedId(),
      groupCashiers: false,
      startTime: '',
      status: 'SUBMITTED',
      systemTotals: { cash: 0, card: 0, cheque: 0, postal: 0, total: Number(cashierSummary.totalAmount || cashierSummary.total || 0) },
      declaredTotals: { cash: 0, card: 0, cheque: 0, postal: 0, total: 0 },
      shortage: 0,
      surplus: 0,
      variance: 0,
      transactionCount: 0,
      reconcileId: null,
      hasActiveSession: false,
      rawData: cashierSummary,
    };
    this.selectedShift.set(shift);
    this.returnReason.set('');
    this.reviewLoading.set(true);
    this.reviewData.set(null);
    this.reviewTab.set('cash');
    try {
      const cashierIdStr = String(cashierId);
      const [details, reconcile, cashReceipts, cardReceipts, chequeReceipts, postalReceipts, dropboxReceipts, offlineReceipts, systemVsCashier, cancelledReceipts] = await Promise.all([
        firstValueFrom(this.api.get('/api/platinum/auth-day-end/cashier-details', { id: cashierIdStr })).catch(() => null),
        firstValueFrom(this.api.get('/api/platinum/auth-day-end/cashier-reconcile-by-cashierid', { cashierId: cashierIdStr })).catch(() => null),
        this.fetchReceiptList('cashier-receipt-cash-list', cashierIdStr),
        this.fetchReceiptList('cashier-receipt-card-list', cashierIdStr),
        this.fetchReceiptList('cashier-receipt-cheque-list', cashierIdStr),
        this.fetchReceiptList('cashier-receipt-postal-order-list', cashierIdStr),
        this.fetchReceiptList('cashier-receipt-drop-box-list', cashierIdStr),
        this.fetchReceiptList('cashier-receipt-offline-data-list', cashierIdStr),
        this.fetchReceiptList('system-vs-cashier-data-list', cashierIdStr),
        this.fetchCancelledReceipts(cashierIdStr),
      ]);
      this.reviewData.set({
        details, reconcile,
        cashReceipts, cardReceipts, chequeReceipts,
        postalReceipts, dropboxReceipts, offlineReceipts, systemVsCashier, cancelledReceipts,
      });

      if (reconcile && (reconcile.cashierReconcile_Id || reconcile.id || reconcile.reconcileId)) {
        const sumReceipts = (list: any[]) => list.reduce((s, r) => {
          if (r.isCancelled === 1 || r.isCancelled === true) return s;
          return s + Number(r.paidAmount || r.amount || r.totalAmount || r.receiptAmount || 0);
        }, 0);
        const receiptCash = sumReceipts(cashReceipts);
        const receiptCard = sumReceipts(cardReceipts);
        const receiptCheque = sumReceipts(chequeReceipts);
        const receiptPostal = sumReceipts(postalReceipts);
        const receiptTotal = receiptCash + receiptCard + receiptCheque + receiptPostal;
        const declCash = Number(reconcile.totalCashAmt || 0);
        const declCard = Number(reconcile.totalCreditAmt || 0);
        const declCheque = Number(reconcile.totalChequeAmt || 0);
        const declPostal = Number(reconcile.totalPostalAmt || 0);
        const declTotal = Number(reconcile.totalAmt || 0);
        const shortageAmt = Number(reconcile.shortageAmt || 0);
        const surplusAmt = Number(reconcile.surplusAmt || 0);
        const sysTotal = declTotal + shortageAmt - surplusAmt;
        const computedSystemTotal = receiptTotal > 0 ? receiptTotal : sysTotal;
        this.selectedShift.set({
          ...shift,
          systemTotals: {
            cash: receiptCash > 0 ? receiptCash : declCash,
            card: receiptCard > 0 ? receiptCard : declCard,
            cheque: receiptCheque > 0 ? receiptCheque : declCheque,
            postal: receiptPostal > 0 ? receiptPostal : declPostal,
            total: computedSystemTotal,
          },
          declaredTotals: declTotal > 0 || declCash > 0 ? { cash: declCash, card: declCard, cheque: declCheque, postal: declPostal, total: declTotal || (declCash + declCard + declCheque + declPostal) } : undefined,
          shortage: shortageAmt,
          surplus: surplusAmt,
          variance: surplusAmt - shortageAmt,
          transactionCount: cashReceipts.length + cardReceipts.length + chequeReceipts.length + postalReceipts.length + dropboxReceipts.length + offlineReceipts.length,
        });
      }
    } catch (e: any) {
      this.toast.show('Failed to load cashier review data', 'error');
    } finally {
      this.reviewLoading.set(false);
    }
  }

  async loadPerOfficeCashierReconcileStatus(cashierId: number, cashOfficeId: number): Promise<any> {
    try {
      const data: any = await firstValueFrom(this.api.get('/api/platinum/auth-day-end-per-office/cashier-reconcile-status', {
        cashierId: String(cashierId),
        cashOfficeId: String(cashOfficeId),
      }));
      this.perOfficeCashierStatuses.update(prev => ({ ...prev, [cashierId]: data }));
      return data;
    } catch (e: any) {
      return null;
    }
  }

  async loadAllPerOfficeCashierStatuses(): Promise<void> {
    const officeId = this.perOfficeSelectedId();
    const summary = this.perOfficeData()?.cashierSummary || [];
    if (!officeId || summary.length === 0) return;
    const results: Record<number, any> = {};
    await Promise.all(summary.map(async (cs: any) => {
      const cid = cs.cashierId || cs.id || cs.cashier_ID;
      if (!cid) return;
      try {
        const data: any = await firstValueFrom(this.api.get('/api/platinum/auth-day-end-per-office/cashier-reconcile-status', {
          cashierId: String(cid),
          cashOfficeId: String(officeId),
        }));
        results[cid] = data;
      } catch {}
    }));
    this.perOfficeCashierStatuses.set(results);
  }

  switchReconMode(mode: 'PER_CASHIER' | 'CASH_OFFICE'): void {
    this.reconMode.set(mode);
    if (mode === 'CASH_OFFICE') this.loadPerOfficeList();
  }

  getTabLabel(tab: string): string {
    const labels: Record<string, string> = {
      cash: 'Cash', card: 'Card', cheque: 'Cheque', postal: 'Postal Order',
      dropbox: 'Drop Box', offline: 'Offline', 'system-vs-cashier': 'System vs Cashier', cancelled: 'Cancelled'
    };
    return labels[tab] || tab;
  }

  async exportReceiptsToExcel(): Promise<void> {
    const shift = this.selectedShift();
    const tab = this.reviewTab();
    const data = this.reviewData();
    if (!shift || !data) return;
    const list = this.getReceiptListByTab(tab, data);
    if (list.length === 0) { this.toast.error('No data to export'); return; }
    const label = this.getTabLabel(tab);
    try {
      const XLSX = await import('xlsx');
      const rows = this.buildExportRows(list, tab);
      const ws = XLSX.utils.json_to_sheet([]);
      const headerRows = [
        ['Day-End Receipt Report'],
        ['Cashier:', shift.cashierName, '', 'Office:', shift.cashOffice || '-'],
        ['Date:', this.formatDate(shift.startTime), '', 'Status:', this.getStatusLabel(shift.status)],
        ['Payment Type:', label, '', 'Total Receipts:', String(list.length)],
        ['System Total:', this.formatCurrency(shift.systemTotals.total), '', 'Declared Total:', shift.declaredTotals ? this.formatCurrency(shift.declaredTotals.total) : '-'],
        []
      ];
      XLSX.utils.sheet_add_aoa(ws, headerRows, { origin: 'A1' });
      XLSX.utils.sheet_add_json(ws, rows, { origin: `A${headerRows.length + 1}`, skipHeader: false });
      const totalRow = headerRows.length + rows.length + 1;
      const totals = this.buildExcelTotalRow(list, tab);
      XLSX.utils.sheet_add_aoa(ws, [totals], { origin: `A${totalRow + 1}` });
      ws['!cols'] = [{ wch: 5 }, { wch: 20 }, { wch: 18 }, { wch: 28 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 12 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `${label} Receipts`);
      const filename = `${shift.cashierName.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '')}_${label}_${this.fileDate(shift.startTime)}.xlsx`;
      XLSX.writeFile(wb, filename);
      this.toast.success(`${label} receipts exported to Excel`);
    } catch (e: any) {
      this.toast.error('Failed to export to Excel: ' + (e?.message || 'Unknown error'));
    }
  }

  async exportReceiptsToPdf(): Promise<void> {
    const shift = this.selectedShift();
    const tab = this.reviewTab();
    const data = this.reviewData();
    if (!shift || !data) return;
    const list = this.getReceiptListByTab(tab, data);
    if (list.length === 0) { this.toast.error('No data to export'); return; }
    const label = this.getTabLabel(tab);
    try {
      const jsPDFModule = await import('jspdf');
      const jsPDF = jsPDFModule.default || jsPDFModule.jsPDF;
      const autoTableModule = await import('jspdf-autotable');
      const autoTable: any = (autoTableModule as any);
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      doc.setFontSize(16);
      doc.setTextColor(15, 43, 70);
      doc.text('Day-End Receipt Report', 14, 15);
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`Cashier: ${shift.cashierName}`, 14, 22);
      doc.text(`Office: ${shift.cashOffice || '-'}`, 14, 27);
      doc.text(`Date: ${this.formatDate(shift.startTime)}`, 120, 22);
      doc.text(`Status: ${this.getStatusLabel(shift.status)}`, 120, 27);
      doc.text(`Payment Type: ${label}`, 200, 22);
      doc.text(`Total Receipts: ${list.length}`, 200, 27);
      doc.setDrawColor(201, 168, 76);
      doc.setLineWidth(0.5);
      doc.line(14, 30, 283, 30);
      const rows = this.buildExportRows(list, tab);
      const columns = Object.keys(rows[0] || {});
      const body = rows.map(r => columns.map(c => (r as any)[c]));
      body.push(this.buildPdfTotalRow(list, columns, tab));
      (autoTable as any)(doc, {
        head: [columns],
        body: body,
        startY: 33,
        styles: { fontSize: 7, cellPadding: 1.5, lineColor: [220, 220, 220], lineWidth: 0.1 },
        headStyles: { fillColor: [15, 43, 70], textColor: 255, fontStyle: 'bold', fontSize: 7 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        footStyles: { fillColor: [241, 245, 249], textColor: [15, 43, 70], fontStyle: 'bold' },
        margin: { left: 14, right: 14 },
        didParseCell: (cellData: any) => {
          if (cellData.row.index === body.length - 1) {
            cellData.cell.styles.fillColor = [241, 245, 249];
            cellData.cell.styles.fontStyle = 'bold';
            cellData.cell.styles.textColor = [15, 43, 70];
          }
        }
      });
      const pageCount = doc.getNumberOfPages();
      const now = new Date();
      const genDate = this.formatDate(now.toISOString()) + ' ' + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(150);
        doc.text(`Generated: ${genDate} | Page ${i} of ${pageCount}`, 14, doc.internal.pageSize.height - 5);
      }
      const filename = `${shift.cashierName.replace(/\s+/g, '_')}_${label}_${this.formatDate(shift.startTime).replace(/\//g, '-')}.pdf`;
      doc.save(filename);
      this.toast.success(`${label} receipts exported to PDF`);
    } catch (e: any) {
      this.toast.error('Failed to export to PDF: ' + (e?.message || 'Unknown error'));
    }
  }

  private getReceiptListByTab(tab: string, data: ReviewData): any[] {
    if (tab === 'cash') return data.cashReceipts;
    if (tab === 'card') return data.cardReceipts;
    if (tab === 'cheque') return data.chequeReceipts;
    if (tab === 'postal') return data.postalReceipts;
    if (tab === 'dropbox') return data.dropboxReceipts;
    if (tab === 'offline') return data.offlineReceipts;
    if (tab === 'system-vs-cashier') return data.systemVsCashier;
    if (tab === 'cancelled') return data.cancelledReceipts;
    return [];
  }

  private buildExportRows(list: any[], tab: string): Record<string, string>[] {
    if (tab === 'system-vs-cashier') {
      return list.map((r, i) => ({
        '#': String(i + 1),
        'Description': r.title || r.description || r.paymentType || '-',
        'System Amount': this.toNum(r.systemTotal ?? r.systemAmount ?? 0).toFixed(2),
        'Cashier Amount': this.toNum(r.cashierTotal ?? r.cashierAmount ?? 0).toFixed(2),
        'Variance': this.toNum(r.totalDifference ?? r.variance ?? 0).toFixed(2),
      }));
    }
    if (tab === 'cancelled') {
      return list.map((r, i) => ({
        '#': String(i + 1),
        'Receipt No': r.receiptNo || '-',
        'Account': r.accountId || '-',
        'Account Holder': r.accHolderName || '-',
        'Amount': this.toNum(r.paidAmount || 0).toFixed(2),
        'Captured': this.formatDate(r.dateCaptured || ''),
        'Cancelled': this.formatDate(r.canceledDate || ''),
        'Reason': r.reasonForCancel || '-',
      }));
    }
    return list.map((r, i) => {
      const row: Record<string, string> = {
        '#': String(i + 1),
        'Receipt No': r.receiptNo || r.receipt_no || r.receiptNumber || '-',
        'Account': r.accountNumber || r.accountNo || r.accountId || '-',
        'Account Holder': r.accHolderName || r.accountName || r.name || '-',
        'Paid': this.toNum(r.paidAmount ?? r.amount ?? r.totalAmount ?? 0).toFixed(2),
        'Tendered': this.toNum(r.tenderAmount ?? 0).toFixed(2),
        'Change': this.toNum(r.changeAmount ?? 0).toFixed(2),
      };
      if (tab === 'card') {
        row['Card No'] = r.cardNo ? '****' + r.cardNo.slice(-4) : '-';
        row['Expiry'] = r.cardExpiryDate || '-';
      }
      if (tab === 'cheque') {
        row['Cheque No'] = r.chequeNo || '-';
        row['Bank Branch'] = r.bankBranch || r.bankBrachCode || '-';
      }
      row['Date'] = this.formatDate(r.dateCaptured || r.receiptDate || r.date || '');
      row['Status'] = (r.isCancelled === true || r.isCancelled === 1) ? 'Voided' : 'Valid';
      return row;
    });
  }

  private toNum(v: any): number {
    const n = Number(v);
    return isNaN(n) ? 0 : n;
  }

  private sumReceiptField(list: any[], ...fields: string[]): number {
    return list.reduce((s: number, r: any) => {
      for (const f of fields) { if (r[f] != null) return s + this.toNum(r[f]); }
      return s;
    }, 0);
  }

  private buildExcelTotalRow(list: any[], tab: string): string[] {
    if (tab === 'system-vs-cashier') {
      return ['', 'TOTALS',
        this.sumReceiptField(list, 'systemTotal', 'systemAmount').toFixed(2),
        this.sumReceiptField(list, 'cashierTotal', 'cashierAmount').toFixed(2),
        this.sumReceiptField(list, 'totalDifference', 'variance').toFixed(2)];
    }
    if (tab === 'cancelled') {
      return ['', '', '', 'TOTALS', this.sumReceiptField(list, 'paidAmount').toFixed(2)];
    }
    const row = ['', '', '', 'TOTALS',
      this.sumReceiptField(list, 'paidAmount', 'amount', 'totalAmount').toFixed(2),
      this.sumReceiptField(list, 'tenderAmount').toFixed(2),
      this.sumReceiptField(list, 'changeAmount').toFixed(2)];
    if (tab === 'card') { row.push('', ''); }
    if (tab === 'cheque') { row.push('', ''); }
    return row;
  }

  private buildPdfTotalRow(list: any[], columns: string[], tab: string): string[] {
    return columns.map(c => {
      if (c === '#') return '';
      if (c === 'Receipt No' || c === 'Description') return 'TOTALS';
      if (c === 'Paid') return this.sumReceiptField(list, 'paidAmount', 'amount', 'totalAmount').toFixed(2);
      if (c === 'Amount') return this.sumReceiptField(list, 'paidAmount').toFixed(2);
      if (c === 'Tendered') return this.sumReceiptField(list, 'tenderAmount').toFixed(2);
      if (c === 'Change') return this.sumReceiptField(list, 'changeAmount').toFixed(2);
      if (c === 'System Amount') return this.sumReceiptField(list, 'systemTotal', 'systemAmount').toFixed(2);
      if (c === 'Cashier Amount') return this.sumReceiptField(list, 'cashierTotal', 'cashierAmount').toFixed(2);
      if (c === 'Variance') return this.sumReceiptField(list, 'totalDifference', 'variance').toFixed(2);
      return '';
    });
  }

  async exportConsolidatedPdf(): Promise<void> {
    const shift = this.selectedShift();
    const data = this.reviewData();
    if (!shift || !data) return;
    this.reportGenerating.set('consolidated');
    try {
      const jsPDFModule = await import('jspdf');
      const jsPDF = jsPDFModule.default || jsPDFModule.jsPDF;
      const autoTableModule = await import('jspdf-autotable');
      const autoTable: any = (autoTableModule as any);
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const navy: [number, number, number] = [15, 43, 70];
      const gold: [number, number, number] = [201, 168, 76];
      const pageW = 297;
      const margin = 14;

      doc.setFillColor(navy[0], navy[1], navy[2]);
      doc.rect(0, 0, pageW, 32, 'F');
      doc.setFontSize(18);
      doc.setTextColor(255, 255, 255);
      doc.text('Consolidated Day-End Reconciliation Report', margin, 14);
      doc.setFontSize(9);
      doc.text(`Cashier: ${shift.cashierName}    |    Office: ${shift.cashOffice || '-'}    |    Date: ${this.formatDate(shift.startTime)}    |    Status: ${this.getStatusLabel(shift.status)}`, margin, 22);
      const now = new Date();
      doc.text(`Generated: ${this.formatDate(now.toISOString())} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`, margin, 28);

      let y = 38;

      doc.setFontSize(11);
      doc.setTextColor(navy[0], navy[1], navy[2]);
      doc.text('Session Summary', margin, y);
      y += 2;
      doc.setDrawColor(gold[0], gold[1], gold[2]);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageW - margin, y);
      y += 4;

      const validCash = data.cashReceipts.filter((r: any) => !(r.isCancelled === 1 || r.isCancelled === true));
      const validCard = data.cardReceipts.filter((r: any) => !(r.isCancelled === 1 || r.isCancelled === true));
      const validCheque = data.chequeReceipts.filter((r: any) => !(r.isCancelled === 1 || r.isCancelled === true));
      const validPostal = data.postalReceipts.filter((r: any) => !(r.isCancelled === 1 || r.isCancelled === true));
      const cancelledInCash = data.cashReceipts.filter((r: any) => r.isCancelled === 1 || r.isCancelled === true);
      const cancelledInCard = data.cardReceipts.filter((r: any) => r.isCancelled === 1 || r.isCancelled === true);
      const sumValid = (list: any[]) => list.reduce((s: number, r: any) => s + this.toNum(r.paidAmount || r.amount || r.totalAmount || 0), 0);

      const summaryData = [
        ['Cash Receipts', String(validCash.length), this.formatCurrency(sumValid(validCash))],
        ['Card Receipts', String(validCard.length), this.formatCurrency(sumValid(validCard))],
        ['Cheque Receipts', String(validCheque.length), this.formatCurrency(sumValid(validCheque))],
        ['Postal Receipts', String(validPostal.length), this.formatCurrency(sumValid(validPostal))],
        ['Drop Box Receipts', String(data.dropboxReceipts.length), this.formatCurrency(sumValid(data.dropboxReceipts))],
        ['Offline Receipts', String(data.offlineReceipts.length), this.formatCurrency(sumValid(data.offlineReceipts))],
        ['Cancelled Receipts', String(cancelledInCash.length + cancelledInCard.length + data.cancelledReceipts.length), this.formatCurrency(sumValid(cancelledInCash) + sumValid(cancelledInCard) + sumValid(data.cancelledReceipts))],
      ];
      const totalValid = sumValid(validCash) + sumValid(validCard) + sumValid(validCheque) + sumValid(validPostal) + sumValid(data.dropboxReceipts) + sumValid(data.offlineReceipts);
      summaryData.push(['TOTAL (Valid)', '', this.formatCurrency(totalValid)]);

      (autoTable as any)(doc, {
        startY: y,
        head: [['Category', 'Count', 'Amount']],
        body: summaryData,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: navy, textColor: 255, fontStyle: 'bold' },
        columnStyles: { 0: { cellWidth: 80 }, 1: { halign: 'center', cellWidth: 30 }, 2: { halign: 'right', cellWidth: 50 } },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: margin, right: margin },
        tableWidth: 160,
        didParseCell: (cellData: any) => {
          if (cellData.row.index === summaryData.length - 1) {
            cellData.cell.styles.fillColor = [241, 245, 249];
            cellData.cell.styles.fontStyle = 'bold';
          }
        }
      });
      y = (doc as any).lastAutoTable.finalY + 6;

      if (shift.declaredTotals || shift.shortage > 0 || shift.surplus > 0) {
        doc.setFontSize(11);
        doc.setTextColor(navy[0], navy[1], navy[2]);
        doc.text('Reconciliation Summary', margin, y);
        y += 2;
        doc.setDrawColor(gold[0], gold[1], gold[2]);
        doc.line(margin, y, pageW - margin, y);
        y += 4;
        const reconData = [
          ['System Total', this.formatCurrency(shift.systemTotals.total)],
          ['Declared Total', shift.declaredTotals ? this.formatCurrency(shift.declaredTotals.total) : '-'],
          ['Shortage', shift.shortage > 0 ? this.formatCurrency(shift.shortage) : '-'],
          ['Surplus', shift.surplus > 0 ? this.formatCurrency(shift.surplus) : '-'],
        ];
        (autoTable as any)(doc, {
          startY: y,
          head: [['Item', 'Amount']],
          body: reconData,
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: navy, textColor: 255, fontStyle: 'bold' },
          columnStyles: { 0: { cellWidth: 80 }, 1: { halign: 'right', cellWidth: 50 } },
          margin: { left: margin, right: margin },
          tableWidth: 130,
        });
        y = (doc as any).lastAutoTable.finalY + 6;
      }

      if (data.systemVsCashier.length > 0) {
        doc.setFontSize(11);
        doc.setTextColor(navy[0], navy[1], navy[2]);
        doc.text('System vs Cashier Comparison', margin, y);
        y += 2;
        doc.setDrawColor(gold[0], gold[1], gold[2]);
        doc.line(margin, y, pageW - margin, y);
        y += 4;
        const svcRows = this.buildExportRows(data.systemVsCashier, 'system-vs-cashier');
        const svcCols = Object.keys(svcRows[0] || {});
        const svcBody = svcRows.map(r => svcCols.map(c => (r as any)[c]));
        svcBody.push(this.buildPdfTotalRow(data.systemVsCashier, svcCols, 'system-vs-cashier'));
        (autoTable as any)(doc, {
          startY: y,
          head: [svcCols],
          body: svcBody,
          styles: { fontSize: 7, cellPadding: 1.5 },
          headStyles: { fillColor: navy, textColor: 255, fontStyle: 'bold', fontSize: 7 },
          alternateRowStyles: { fillColor: [248, 250, 252] },
          margin: { left: margin, right: margin },
          didParseCell: (cellData: any) => {
            if (cellData.row.index === svcBody.length - 1) {
              cellData.cell.styles.fillColor = [241, 245, 249];
              cellData.cell.styles.fontStyle = 'bold';
            }
          }
        });
        y = (doc as any).lastAutoTable.finalY + 8;
      }

      const sections: { label: string; tab: string; list: any[] }[] = [
        { label: 'Cash', tab: 'cash', list: data.cashReceipts },
        { label: 'Card', tab: 'card', list: data.cardReceipts },
        { label: 'Cheque', tab: 'cheque', list: data.chequeReceipts },
        { label: 'Postal', tab: 'postal', list: data.postalReceipts },
        { label: 'Drop Box', tab: 'dropbox', list: data.dropboxReceipts },
        { label: 'Offline', tab: 'offline', list: data.offlineReceipts },
      ];

      for (const section of sections) {
        if (section.list.length === 0) continue;
        if (y > 170) { doc.addPage(); y = 15; }
        doc.setFontSize(11);
        doc.setTextColor(navy[0], navy[1], navy[2]);
        doc.text(`${section.label} Receipts (${section.list.length})`, margin, y);
        y += 2;
        doc.setDrawColor(gold[0], gold[1], gold[2]);
        doc.line(margin, y, pageW - margin, y);
        y += 4;
        const rows = this.buildExportRows(section.list, section.tab);
        const cols = Object.keys(rows[0] || {});
        const body = rows.map(r => cols.map(c => (r as any)[c]));
        body.push(this.buildPdfTotalRow(section.list, cols, section.tab));
        (autoTable as any)(doc, {
          startY: y,
          head: [cols],
          body: body,
          styles: { fontSize: 6.5, cellPadding: 1.2, lineColor: [220, 220, 220], lineWidth: 0.1 },
          headStyles: { fillColor: navy, textColor: 255, fontStyle: 'bold', fontSize: 6.5 },
          alternateRowStyles: { fillColor: [248, 250, 252] },
          margin: { left: margin, right: margin },
          didParseCell: (cellData: any) => {
            if (cellData.row.index === body.length - 1) {
              cellData.cell.styles.fillColor = [241, 245, 249];
              cellData.cell.styles.fontStyle = 'bold';
              cellData.cell.styles.textColor = navy;
            }
            if (cellData.column.dataKey !== undefined) {
              const val = String(cellData.cell.raw || '');
              if (val === 'Voided') { cellData.cell.styles.textColor = [153, 27, 27]; cellData.cell.styles.fontStyle = 'bold'; }
            }
          }
        });
        y = (doc as any).lastAutoTable.finalY + 8;
      }

      if (data.cancelledReceipts.length > 0) {
        if (y > 170) { doc.addPage(); y = 15; }
        doc.setFontSize(11);
        doc.setTextColor(153, 27, 27);
        doc.text(`Cancelled Receipts (${data.cancelledReceipts.length})`, margin, y);
        y += 2;
        doc.setDrawColor(220, 38, 38);
        doc.line(margin, y, pageW - margin, y);
        y += 4;
        const cRows = this.buildExportRows(data.cancelledReceipts, 'cancelled');
        const cCols = Object.keys(cRows[0] || {});
        const cBody = cRows.map(r => cCols.map(c => (r as any)[c]));
        cBody.push(this.buildPdfTotalRow(data.cancelledReceipts, cCols, 'cancelled'));
        (autoTable as any)(doc, {
          startY: y,
          head: [cCols],
          body: cBody,
          styles: { fontSize: 6.5, cellPadding: 1.2 },
          headStyles: { fillColor: [153, 27, 27], textColor: 255, fontStyle: 'bold', fontSize: 6.5 },
          alternateRowStyles: { fillColor: [254, 242, 242] },
          margin: { left: margin, right: margin },
          didParseCell: (cellData: any) => {
            if (cellData.row.index === cBody.length - 1) {
              cellData.cell.styles.fillColor = [254, 226, 226];
              cellData.cell.styles.fontStyle = 'bold';
            }
          }
        });
      }

      const pageCount = doc.getNumberOfPages();
      const genDate = this.formatDate(now.toISOString()) + ' ' + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(150);
        doc.text(`Generated: ${genDate}`, margin, 205);
        doc.text(`Page ${i} of ${pageCount}`, pageW - margin - 25, 205);
        doc.setDrawColor(gold[0], gold[1], gold[2]);
        doc.setLineWidth(0.3);
        doc.line(margin, 203, pageW - margin, 203);
      }

      const safeName = (shift.cashierName || 'Report').replace(/[^a-zA-Z0-9]/g, '_');
      const dateStr = this.fileDate(shift.startTime);
      doc.save(`${safeName}_Consolidated_Report_${dateStr}.pdf`);
      this.toast.success('Consolidated report downloaded.');
    } catch (e: any) {
      this.toast.error('Failed to generate consolidated report: ' + (e?.message || 'Unknown error'));
    } finally {
      this.reportGenerating.set(null);
    }
  }
}
