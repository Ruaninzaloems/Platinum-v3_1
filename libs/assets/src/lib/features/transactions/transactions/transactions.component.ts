import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../../core/api.service';
import { PriorYearAdjustmentsComponent } from '../../prior-year-adjustments/prior-year-adjustments.component';
import { PriorPeriodAdjustmentsComponent } from '../../prior-period-adjustments/prior-period-adjustments.component';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule, MatButtonModule, MatTabsModule, MatProgressSpinnerModule, PriorYearAdjustmentsComponent, PriorPeriodAdjustmentsComponent],
  templateUrl: './transactions.component.html',
  styleUrl: './transactions.component.scss'
})
export class TransactionsComponent implements OnInit {
  settingsData = signal<any>(null);
  approvalMethod = signal<string>('Manual');
  monthEndFilters: { finYear: string; period: number } = { finYear: '', period: 1 };
  monthEndStatus = signal<any>(null);
  monthEndResult = signal<any>(null);
  monthEndRunning = signal(false);
  monthEndChecking = signal(false);
  categories = signal<any[]>([]);
  departments = signal<any[]>([]);
  locations = signal<any[]>([]);
  recentTransactions = signal<any[]>([]);
  lastDepreciationDate = signal<string>('');
  globalMinTransactionDate = signal<string>('');
  todayDate = new Date().toISOString().split('T')[0];

  depRunning = signal(false);
  depRunStep = signal<number>(0);
  depRunModalVisible = signal(false);
  depPreviewing = signal(false);
  depRunResult = signal<any>(null);
  depPreviewData = signal<any>(null);
  depRunToDate = '';
  depSelectedFinYear = '';
  depSelectedPeriod = 0;
  depCompletedPeriods = signal<number[]>([]);
  depDetailScheduleId = signal<number>(0);
  depDetailExpanded = signal<Record<number, boolean>>({});
  depScheduleItems = signal<any[]>([]);
  depScheduleItemsLoading = signal(false);
  depItemDetails = signal<Record<number, any[]>>({});
  depItemDetailsLoading = signal<Record<number, boolean>>({});
  depItemExpanded = signal<Record<number, boolean>>({});

  submittingReval = signal(false);
  revalSuccess = signal(false);
  submittingImpair = signal(false);
  impairSuccess = signal(false);
  submittingTransfer = signal(false);
  transferSuccess = signal(false);
  submittingDisposal = signal(false);
  disposalSuccess = signal(false);
  disposalError = signal('');

  glValidating = signal(false);
  glValidationErrors = signal<any[]>([]);
  glValidationVisible = signal(false);
  glValidationTxnType = signal('');

  revalSearchTerm = '';
  revalShowDropdown = false;
  revalSelectedAsset = signal<any>(null);
  revalFilteredAssets = signal<any[]>([]);
  revalCatchupDep = signal<any>(null);
  revalCatchupLoading = signal(false);

  impairSearchTerm = '';
  impairShowDropdown = false;
  impairSelectedAsset = signal<any>(null);
  impairFilteredAssets = signal<any[]>([]);
  impairCatchupDep = signal<any>(null);
  impairCatchupLoading = signal(false);
  impairAssetMinDate = signal<string>('');

  reversalSearchTerm = '';
  reversalShowDropdown = false;
  reversalSelectedAsset = signal<any>(null);
  reversalFilteredAssets = signal<any[]>([]);
  reversalCatchupDep = signal<any>(null);
  reversalCatchupLoading = signal(false);
  reversalAssetMinDate = signal<string>('');
  reversalOriginalBasis = signal<{ originalPnL: number; originalReserve: number } | null>(null);
  reversalBasisError = signal<string | null>(null);

  transferSearchTerm = '';
  transferShowDropdown = false;
  transferSelectedAsset = signal<any>(null);
  transferFilteredAssets = signal<any[]>([]);

  disposalSearchTerm = '';
  disposalShowDropdown = false;
  disposalSelectedAsset = signal<any>(null);
  disposalFilteredAssets = signal<any[]>([]);
  disposalCatchupDep = signal<any>(null);
  disposalCatchupLoading = signal(false);
  disposalAssetLastDepDate = signal<string>('');

  refurbSearchTerm = '';
  refurbShowDropdown = false;
  refurbSelectedAsset = signal<any>(null);
  refurbFilteredAssets = signal<any[]>([]);
  refurbCatchupDep = signal<any>(null);
  refurbCatchupLoading = signal(false);
  submittingRefurb = signal(false);
  refurbSuccess = signal(false);
  refurbError = signal('');
  refurbDateError = signal<string>('');
  pendingRefurbishments = signal<any[]>([]);
  refurbForm: any = { refurb_date: '', refurb_dt: null, refurb_ct: null, refurb_depreciation: null, refurb_revaluation: null, refurb_impairment: null, debitPlanProjectItemId: null, creditPlanProjectItemId: null };
  refurbDtProjects: any[] = [];
  refurbDtScoaItems: any[] = [];
  refurbDtProjectId: string = '';
  refurbDtScoaItemId: string = '';
  refurbCtProjects: any[] = [];
  refurbCtScoaItems: any[] = [];
  refurbCtProjectId: string = '';
  refurbCtScoaItemId: string = '';

  revalForm: any = { revaluation_date: '', market_value: null, valuation_module: -1, dep_adjustment: null };
  revalError = signal<string>('');
  pendingRevaluations = signal<any[]>([]);
  impairForm: any = { impairment_type: 'non_cash_generating', recoverable_amount: null, value_in_use: null, reason: '', transaction_date: '' };
  impairError = signal<string>('');
  reversalForm: any = { recoverable_amount: null, value_in_use: null, reason: '', transaction_date: '' };
  reversalError = signal<string>('');
  submittingReversal = signal(false);
  reversalSuccess = signal(false);
  reversalDateError = signal<string>('');
  pendingReversals = signal<any[]>([]);
  transferForm: any = { to_department: '', to_location: '', transfer_date: '', reason: '' };
  disposalForm: any = { method: '', value: null, disposal_date: '', reason: '' };

  revalDateError = signal<string>('');
  impairDateError = signal<string>('');
  transferDateError = signal<string>('');
  disposalDateError = signal<string>('');
  depRunDateError = signal<string>('');
  nextRunCutoff = signal<string>('');

  pendingImpairments = signal<any[]>([]);
  pendingDisposals = signal<any[]>([]);
  pendingSchedules = signal<any[]>([]);
  approvingId = signal<number>(0);
  approveError = signal<string>('');
  depApproveVisible = signal(false);
  depApproveStep = signal<number>(0);

  txVerifyOpen = signal(false);
  txVerifyReval = signal(false);
  txVerifyImp = signal(false);
  txVerifyReversal = signal(false);
  txVerifyDisposal = signal(false);
  txVerifySubmitting = signal(false);
  txVerifyError = signal('');
  monthEndApprovalExists = signal(false);

  periodMonths = [
    { value: 1, label: 'July' }, { value: 2, label: 'August' }, { value: 3, label: 'September' },
    { value: 4, label: 'October' }, { value: 5, label: 'November' }, { value: 6, label: 'December' },
    { value: 7, label: 'January' }, { value: 8, label: 'February' }, { value: 9, label: 'March' },
    { value: 10, label: 'April' }, { value: 11, label: 'May' }, { value: 12, label: 'June' },
  ];

  transactionStats = computed(() => {
    var txns = this.recentTransactions();
    var pendingCount = this.pendingRevaluations().length + this.pendingImpairments().length +
      this.pendingReversals().length + this.pendingDisposals().length + this.pendingSchedules().length +
      this.pendingRefurbishments().length;
    var approved = this.countByStatus(txns, 'approved');
    var rejected = this.countByStatus(txns, 'rejected');
    var depRuns = this.countByType(txns, 'depreciation_run');
    var total = txns.length;
    return [
      { label: 'Total Transactions', value: total, color: '#3b82f6' },
      { label: 'Pending Approval', value: pendingCount, color: '#f59e0b' },
      { label: 'Approved', value: approved, color: '#10b981' },
      { label: 'Rejected', value: rejected, color: '#ef4444' },
      { label: 'Depreciation Runs', value: depRuns, color: '#8b5cf6' },
    ];
  });

  constructor(private api: ApiService) {}

  private searchDebounceTimer: any = null;

  ngOnInit() {
    this.depRunToDate = this.todayDate;
    this.api.getSettings().subscribe({
      next: function(this: TransactionsComponent, s: any) {
        this.settingsData.set(s);
        this.approvalMethod.set(s?.approval_method || 'Manual');
        var fy = this.getCurrentFinYear();
        this.depSelectedFinYear = fy;
        this.depSelectedPeriod = this.getCurrentPeriod();
        this.monthEndFilters.finYear = fy;
        this.monthEndFilters.period = this.getCurrentPeriod();
        this.loadCompletedPeriods(fy);
        this.api.checkMonthlyApproval(fy, this.getCurrentPeriod()).subscribe({
          next: function(this: TransactionsComponent, res: any) {
            this.monthEndApprovalExists.set(res?.exists === true);
          }.bind(this),
          error: function() {}
        });
        this.loadRefurbProjects();
      }.bind(this)
    });
    this.api.getCategories().subscribe({ next: c => this.categories.set(c) });
    this.api.getDepartments().subscribe({ next: d => this.departments.set(d) });
    this.api.getLocations().subscribe({ next: l => this.locations.set(l) });
    this.api.getAllWorkflows().subscribe({
      next: w => this.recentTransactions.set(w),
      error: function() {}
    });
    this.api.getLastDepreciationDate().subscribe({
      next: function(this: TransactionsComponent, resp: any) {
        var d = resp?.lastDepreciationDate || '';
        this.lastDepreciationDate.set(d ? d.split('T')[0] : '');
      }.bind(this),
      error: function() {}
    });
    this.api.getMinTransactionDate().subscribe({
      next: function(this: TransactionsComponent, resp: any) {
        var d = resp?.minTransactionDate || '';
        this.globalMinTransactionDate.set(d ? d.split('T')[0] : '');
      }.bind(this),
      error: function() {}
    });
    this.loadPendingItems();
    this.api.getNextRunCutoff().subscribe({
      next: function(this: TransactionsComponent, res: any) {
        if (res?.cutoffDate) this.nextRunCutoff.set(res.cutoffDate);
      }.bind(this),
      error: function() {}
    });
  }

  loadRefurbProjects() {
    var self = this;
    var fy = this.getCurrentFinYear();
    this.api.getPlanProjects(fy).subscribe({
      next: function(data: any[]) {
        self.refurbDtProjects = data;
        self.refurbCtProjects = data;
      }
    });
  }

  onRefurbDtProjectChange() {
    this.refurbDtScoaItemId = '';
    this.refurbDtScoaItems = [];
    this.refurbForm.debitPlanProjectItemId = null;
    if (this.refurbDtProjectId) {
      var self = this;
      this.api.getPlanProjectItems(Number(this.refurbDtProjectId)).subscribe({
        next: function(data: any[]) {
          self.refurbDtScoaItems = data;
        }
      });
    }
  }

  onRefurbDtScoaItemChange() {
    this.refurbForm.debitPlanProjectItemId = this.refurbDtScoaItemId ? Number(this.refurbDtScoaItemId) : null;
  }

  onRefurbCtProjectChange() {
    this.refurbCtScoaItemId = '';
    this.refurbCtScoaItems = [];
    this.refurbForm.creditPlanProjectItemId = null;
    if (this.refurbCtProjectId) {
      var self = this;
      this.api.getPlanProjectItems(Number(this.refurbCtProjectId)).subscribe({
        next: function(data: any[]) {
          self.refurbCtScoaItems = data;
        }
      });
    }
  }

  onRefurbCtScoaItemChange() {
    this.refurbForm.creditPlanProjectItemId = this.refurbCtScoaItemId ? Number(this.refurbCtScoaItemId) : null;
  }

  loadPendingItems() {
    this.api.getImpairments({ finYear: '' }).subscribe({
      next: function(this: TransactionsComponent, items: any[]) {
        var pendingImp: any[] = [];
        var pendingRev: any[] = [];
        for (var i = 0; i < items.length; i++) {
          var item = items[i];
          var isApproved = item.approved || item.Approved;
          var isRejected = item.isRejected || item.IsRejected;
          if (!isApproved && !isRejected) {
            var reversal = item.isReversal || item.IsReversal || 0;
            if (reversal === 1 || reversal === true) {
              pendingRev.push(item);
            } else {
              pendingImp.push(item);
            }
          }
        }
        this.pendingImpairments.set(pendingImp);
        this.pendingReversals.set(pendingRev);
      }.bind(this),
      error: function() {}
    });
    this.api.getRevaluations({}).subscribe({
      next: function(this: TransactionsComponent, items: any[]) {
        var pending: any[] = [];
        for (var i = 0; i < items.length; i++) {
          var item = items[i];
          var approved = item.Approved != null ? item.Approved : item.approved;
          if (approved === null || approved === undefined || approved === false) {
            var hasPostDateTime = item.PostDateTime || item.postDateTime;
            if (!hasPostDateTime) {
              pending.push(item);
            }
          }
        }
        this.pendingRevaluations.set(pending);
      }.bind(this),
      error: function() {}
    });
    this.api.getDisposals({}).subscribe({
      next: function(this: TransactionsComponent, items: any[]) {
        var pending: any[] = [];
        for (var i = 0; i < items.length; i++) {
          var s = (items[i].status || '').toLowerCase();
          if (s === 'pending' || s === 'submitted') pending.push(items[i]);
        }
        this.pendingDisposals.set(pending);
      }.bind(this),
      error: function() {}
    });
    this.api.getDepreciationSchedules().subscribe({
      next: function(this: TransactionsComponent, items: any[]) {
        var pending: any[] = [];
        for (var i = 0; i < items.length; i++) {
          var sid = items[i].statusID || items[i].runStatus_ID || 0;
          if (sid !== 13 && sid !== 3) pending.push(items[i]);
        }
        this.pendingSchedules.set(pending);
      }.bind(this),
      error: function() {}
    });
    this.api.getRefurbishments({}).subscribe({
      next: function(this: TransactionsComponent, items: any[]) {
        var pending: any[] = [];
        for (var i = 0; i < items.length; i++) {
          var item = items[i];
          if (item.isApproved === null || item.isApproved === undefined || item.isApproved === false) {
            pending.push(item);
          }
        }
        this.pendingRefurbishments.set(pending);
      }.bind(this),
      error: function() {}
    });
  }


  searchAssetsFromApi(term: string, targetSignal: any) {
    if (!term || term.length < 1) {
      targetSignal.set([]);
      return;
    }
    if (this.searchDebounceTimer) clearTimeout(this.searchDebounceTimer);
    this.searchDebounceTimer = setTimeout(() => {
      this.api.getAssets({ search: term, pageSize: 20 }).subscribe({
        next: (resp: any) => {
          const items = resp?.data || resp || [];
          targetSignal.set(Array.isArray(items) ? items : []);
        },
        error: () => targetSignal.set([])
      });
    }, 250);
  }

  countByStatus(txns: any[], status: string): number {
    let count = 0;
    for (const t of txns) { if (t.status === status) count++; }
    return count;
  }

  countByType(txns: any[], type: string): number {
    let count = 0;
    for (const t of txns) { if (t.entity_type === type) count++; }
    return count;
  }

  getDateBasedPeriod(): number {
    const month = new Date().getMonth() + 1;
    return month >= 7 ? month - 6 : month + 6;
  }

  getDateBasedFinYear(): string {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    if (month >= 7) { return year + '/' + (year + 1); }
    return (year - 1) + '/' + year;
  }

  getCurrentPeriod(): number {
    const s = this.settingsData();
    return s?.settings?.current_period_month || s?.current_period_month || this.getDateBasedPeriod();
  }

  getCurrentPeriodName(): string {
    const month = this.getCurrentPeriod();
    const found = this.periodMonths.find(p => p.value === month);
    return found ? found.label : 'Unknown';
  }

  formatAmount(n: number): string {
    if (!n) return '0';
    if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K';
    return n.toLocaleString();
  }

  formatCurrency(n: number | null | undefined): string {
    if (n === null || n === undefined) return 'R 0.00';
    return 'R ' + Number(n).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  getCurrentFinYear(): string {
    var s = this.settingsData();
    if (s?.financial_year) return String(s.financial_year);
    var startMonth = s?.financial_year_start_month || 7;
    var now = new Date();
    var year = now.getFullYear();
    if (now.getMonth() + 1 < startMonth) {
      year = year - 1;
    }
    return year + '/' + (year + 1);
  }

  toIsoDate(dateStr: string): string {
    if (!dateStr) return '';
    var parts = dateStr.split(/[\/\-\.]/);
    if (parts.length === 3) {
      var y = parts[0];
      var m = parts[1];
      var dPart = parts[2];
      if (y.length === 4) {
        return y + '-' + ('0' + m).slice(-2) + '-' + ('0' + dPart).slice(-2);
      }
    }
    var d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    var yyyy = d.getFullYear();
    var mm = ('0' + (d.getMonth() + 1)).slice(-2);
    var dd = ('0' + d.getDate()).slice(-2);
    return yyyy + '-' + mm + '-' + dd;
  }

  effectiveMinDate(assetMin: string): string {
    var global = this.globalMinTransactionDate();
    if (!assetMin && !global) return '';
    if (!assetMin) return global;
    if (!global) return assetMin;
    return assetMin > global ? assetMin : global;
  }

  validateTransactionDate(dateStr: string): string {
    if (!dateStr) return 'Transaction date is required';
    const txDate = new Date(dateStr);
    const today = new Date(this.todayDate);
    if (txDate > today) return 'Transaction date cannot be in the future';
    var globalMin = this.globalMinTransactionDate();
    if (globalMin && dateStr < globalMin) return 'This period is closed. The earliest allowed transaction date is ' + globalMin + '.';
    var lastDepStr = this.lastDepreciationDate();
    if (lastDepStr) {
      var lastDep = new Date(lastDepStr);
      if (txDate < lastDep) return 'Transaction date cannot be before the last approved depreciation run (' + lastDepStr + ')';
    }
    var cutoff = this.nextRunCutoff();
    if (cutoff && dateStr > cutoff) return 'Transaction date exceeds the next scheduled run\'s month-end date of ' + cutoff + '. Please capture a date on or before this cutoff.';
    return '';
  }

  getAdjustedCarryingAmount(catchupDep: any, asset: any): number {
    if (catchupDep) {
      return catchupDep.carryingAmountAfter;
    }
    return asset?.carryingAmount || 0;
  }

  getImpairmentBasis(): number {
    var recoverableAmt = Number(this.impairForm.recoverable_amount) || 0;
    var valueInUse = Number(this.impairForm.value_in_use) || 0;
    return recoverableAmt > valueInUse ? recoverableAmt : valueInUse;
  }

  calculateTotalImpairment(): number {
    const catchup = this.impairCatchupDep();
    const asset = this.impairSelectedAsset();
    const adjustedCarrying = this.getAdjustedCarryingAmount(catchup, asset);
    const basis = this.getImpairmentBasis();
    var total = adjustedCarrying - basis;
    return total > 0 ? total : 0;
  }

  getCatchupDepreciationOffset(catchup: any): number {
    if (!catchup) return 0;
    return Number(catchup.depreciationOffset) || 0;
  }

  getEffectiveRevaluationReserve(): number {
    const asset = this.impairSelectedAsset();
    if (!asset) return 0;
    var reserve = Number(asset.revaluationReserveClosingBalance) || 0;
    if (reserve <= 0) return 0;
    const catchup = this.impairCatchupDep();
    if (catchup) {
      var offset = this.getCatchupDepreciationOffset(catchup);
      reserve = reserve - offset;
      if (reserve < 0) reserve = 0;
    }
    return reserve;
  }

  calculateImpairmentRevaluationReserve(): number {
    const revaluationReserve = this.getEffectiveRevaluationReserve();
    if (revaluationReserve <= 0) return 0;
    const total = this.calculateTotalImpairment();
    return revaluationReserve < total ? revaluationReserve : total;
  }

  calculateImpairmentLoss(): number {
    const total = this.calculateTotalImpairment();
    const reserveUsed = this.calculateImpairmentRevaluationReserve();
    return total - reserveUsed;
  }

  calculateDisposalProfitLoss(): number {
    const catchup = this.disposalCatchupDep();
    const asset = this.disposalSelectedAsset();
    const adjustedCarrying = this.getAdjustedCarryingAmount(catchup, asset);
    const proceeds = Number(this.disposalForm.value) || 0;
    return proceeds - adjustedCarrying;
  }

  getDisposalProfitLossLabel(): string {
    const pl = this.calculateDisposalProfitLoss();
    if (pl > 0) return 'Profit on Disposal';
    if (pl < 0) return 'Loss on Disposal';
    return 'Profit / Loss on Disposal';
  }

  getDisposalProfitLossColor(): string {
    const pl = this.calculateDisposalProfitLoss();
    if (pl > 0) return '#16a34a';
    if (pl < 0) return '#ef4444';
    return '#64748b';
  }

  getRevalFairValueAdjustment(): number {
    const catchup = this.revalCatchupDep();
    const asset = this.revalSelectedAsset();
    const adjustedCarrying = this.getAdjustedCarryingAmount(catchup, asset);
    var marketValue = Number(this.revalForm.market_value) || 0;
    var depAdj = Number(this.revalForm.dep_adjustment) || 0;
    return marketValue - adjustedCarrying;
  }

  getRevalSurplusDeficit(): number {
    return this.getRevalFairValueAdjustment();
  }

  getRevalSurplusAmount(): number {
    var fvAdj = this.getRevalFairValueAdjustment();
    var depAdj = Number(this.revalForm.dep_adjustment) || 0;
    return fvAdj - depAdj;
  }

  getRevalSurplusColor(): string {
    const sd = this.getRevalFairValueAdjustment();
    if (sd > 0) return '#16a34a';
    if (sd < 0) return '#ef4444';
    return '#64748b';
  }

  getRevalReserveBalance(): number {
    const asset = this.revalSelectedAsset();
    if (!asset) return 0;
    var reserve = Number(asset.revaluationReserveClosingBalance) || 0;
    var catchup = this.revalCatchupDep();
    if (catchup) {
      var offset = this.getCatchupDepreciationOffset(catchup);
      reserve = reserve - offset;
    }
    return reserve + this.getRevalSurplusAmount();
  }

  validateDisposalDate(dateStr: string): string {
    if (!dateStr) return 'Transaction date is required';
    const txDate = new Date(dateStr);
    const today = new Date(this.todayDate);
    if (txDate > today) return 'Transaction date cannot be in the future';
    var globalMin = this.globalMinTransactionDate();
    if (globalMin && dateStr < globalMin) return 'This period is closed. The earliest allowed transaction date is ' + globalMin + '.';
    var assetLastDep = this.disposalAssetLastDepDate();
    if (assetLastDep) {
      var lastDep = new Date(assetLastDep);
      if (txDate < lastDep) return 'Transaction date cannot be before the last approved depreciation run for this asset (' + assetLastDep + ')';
    }
    var cutoff = this.nextRunCutoff();
    if (cutoff && dateStr > cutoff) return 'Transaction date exceeds the next scheduled run\'s month-end date of ' + cutoff + '. Please capture a date on or before this cutoff.';
    return '';
  }

  loadCatchupDepreciation(assetId: string, dateStr: string, targetSignal: any, loadingSignal: any, errorSignal: any, fromDateOverride?: string) {
    const err = fromDateOverride ? '' : this.validateTransactionDate(dateStr);
    if (err) {
      errorSignal.set(err);
      targetSignal.set(null);
      return;
    }
    errorSignal.set('');
    loadingSignal.set(true);
    this.api.getDepreciationByDays({
      assetId: assetId,
      fromDate: fromDateOverride || this.lastDepreciationDate(),
      toDate: dateStr
    }).subscribe({
      next: (resp: any) => {
        targetSignal.set(resp);
        loadingSignal.set(false);
      },
      error: () => {
        targetSignal.set(null);
        loadingSignal.set(false);
      }
    });
  }

  onRevalDateChange() {
    const asset = this.revalSelectedAsset();
    if (asset && this.revalForm.revaluation_date) {
      this.loadCatchupDepreciation(asset.assetId, this.revalForm.revaluation_date, this.revalCatchupDep, this.revalCatchupLoading, this.revalDateError);
    } else {
      this.revalDateError.set(this.validateTransactionDate(this.revalForm.revaluation_date));
    }
  }

  onImpairDateChange(dateStr: string) {
    const asset = this.impairSelectedAsset();
    this.impairForm.transaction_date = dateStr;
    if (asset && dateStr) {
      this.loadCatchupDepreciation(asset.assetId, dateStr, this.impairCatchupDep, this.impairCatchupLoading, this.impairDateError, this.impairAssetMinDate() || undefined);
    } else {
      this.impairDateError.set(this.validateTransactionDate(dateStr));
    }
  }

  onDisposalDateChange() {
    const asset = this.disposalSelectedAsset();
    if (asset && this.disposalForm.disposal_date) {
      const err = this.validateDisposalDate(this.disposalForm.disposal_date);
      if (err) {
        this.disposalDateError.set(err);
        this.disposalCatchupDep.set(null);
        return;
      }
      this.loadCatchupDepreciation(asset.assetId, this.disposalForm.disposal_date, this.disposalCatchupDep, this.disposalCatchupLoading, this.disposalDateError, this.disposalAssetLastDepDate());
    } else {
      this.disposalDateError.set(this.validateDisposalDate(this.disposalForm.disposal_date));
    }
  }

  onTransferDateChange(dateStr: string) {
    this.transferForm.transfer_date = dateStr;
    const err = this.validateTransactionDate(dateStr);
    this.transferDateError.set(err);
  }

  validateDepRunDate(): string {
    if (!this.depRunToDate) return 'Depreciation run date is required';
    var runDate = new Date(this.depRunToDate);
    var today = new Date(this.todayDate);
    if (runDate > today) return 'Run date cannot be in the future';
    return '';
  }

  getScheduledDateForPeriod(): string {
    if (!this.depSelectedFinYear || !this.depSelectedPeriod) return '';
    var parts = this.depSelectedFinYear.split('/');
    if (parts.length !== 2) return '';
    var startYear = parseInt(parts[0], 10);
    var periodMonth = this.depSelectedPeriod;
    var calendarMonth = ((periodMonth + 5) % 12) + 1;
    var year = calendarMonth >= 7 ? startYear : startYear + 1;
    var lastDay = new Date(year, calendarMonth, 0).getDate();
    var mm = ('0' + calendarMonth).slice(-2);
    var dd = ('0' + lastDay).slice(-2);
    return year + '-' + mm + '-' + dd;
  }

  getPeriodLabel(period: number): string {
    for (var i = 0; i < this.periodMonths.length; i++) {
      if (this.periodMonths[i].value === period) return this.periodMonths[i].label;
    }
    return 'Period ' + period;
  }

  getAvailableFinYears(): string[] {
    var fy = this.getCurrentFinYear();
    var parts = fy.split('/');
    if (parts.length !== 2) return [fy];
    var startYear = parseInt(parts[0], 10);
    return [
      (startYear - 1) + '/' + startYear,
      fy,
      (startYear + 1) + '/' + (startYear + 2)
    ];
  }

  checkMonthEnd() {
    var finYear = this.monthEndFilters.finYear;
    var period = this.monthEndFilters.period;
    if (!finYear || !period) return;
    this.monthEndChecking.set(true);
    this.monthEndStatus.set(null);
    this.api.checkMonthEnd(finYear, period).subscribe({
      next: function(this: TransactionsComponent, res: any) {
        this.monthEndStatus.set(res);
        this.monthEndChecking.set(false);
      }.bind(this),
      error: function(this: TransactionsComponent) {
        this.monthEndChecking.set(false);
      }.bind(this)
    });
  }

  onMonthEndFilterChange() {
    this.monthEndStatus.set(null);
    this.monthEndResult.set(null);
    this.monthEndApprovalExists.set(false);
    var finYear = this.monthEndFilters.finYear;
    var period = this.monthEndFilters.period;
    if (finYear && period) {
      this.api.checkMonthlyApproval(finYear, period).subscribe({
        next: function(this: TransactionsComponent, res: any) {
          this.monthEndApprovalExists.set(res?.exists === true);
        }.bind(this),
        error: function() {}
      });
    }
  }

  openTxVerifyMonthEnd() {
    this.txVerifyReval.set(false);
    this.txVerifyImp.set(false);
    this.txVerifyReversal.set(false);
    this.txVerifyDisposal.set(false);
    this.txVerifyError.set('');
    this.txVerifyOpen.set(true);
  }

  setTxVerifyReval(e: Event) { this.txVerifyReval.set((e.target as HTMLInputElement).checked); }
  setTxVerifyImp(e: Event) { this.txVerifyImp.set((e.target as HTMLInputElement).checked); }
  setTxVerifyReversal(e: Event) { this.txVerifyReversal.set((e.target as HTMLInputElement).checked); }
  setTxVerifyDisposal(e: Event) { this.txVerifyDisposal.set((e.target as HTMLInputElement).checked); }

  txVerifyAllChecked() {
    return this.txVerifyReval() && this.txVerifyImp() && this.txVerifyReversal() && this.txVerifyDisposal();
  }

  closeTxVerify() {
    this.txVerifyOpen.set(false);
    this.txVerifyError.set('');
  }

  submitTxVerifyMonthEnd() {
    this.txVerifySubmitting.set(true);
    this.txVerifyError.set('');
    var finYear = this.monthEndFilters.finYear;
    var period = this.monthEndFilters.period;
    this.api.createMonthlyApproval({
      financialYear: finYear,
      financialPeriod: period,
      userId: 1,
      verifiedRevaluation: true,
      verifiedImpairment: true,
      verifiedImpairmentReversal: true,
      verifiedDisposal: true
    }).subscribe({
      next: function(this: TransactionsComponent) {
        this.txVerifySubmitting.set(false);
        this.txVerifyOpen.set(false);
        this.runMonthEnd();
      }.bind(this),
      error: function(this: TransactionsComponent, err: any) {
        this.txVerifySubmitting.set(false);
        this.txVerifyError.set('Could not record verification: ' + (err?.error?.error || err?.message || 'Unknown error'));
      }.bind(this)
    });
  }

  runMonthEnd() {
    var finYear = this.monthEndFilters.finYear;
    var period = this.monthEndFilters.period;
    if (!finYear || !period) return;
    this.monthEndRunning.set(true);
    this.monthEndResult.set(null);
    this.api.runMonthEnd({ finYear, period }).subscribe({
      next: function(this: TransactionsComponent, res: any) {
        this.monthEndResult.set(res);
        this.monthEndRunning.set(false);
        this.monthEndStatus.set({ alreadyRun: true });
      }.bind(this),
      error: function(this: TransactionsComponent, err: any) {
        this.monthEndRunning.set(false);
        this.monthEndResult.set({ success: false, errors: [err?.error?.error || 'Unknown error'] });
      }.bind(this)
    });
  }

  onRevalSearch(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.revalSearchTerm = val;
    if (val.length >= 1) {
      this.revalShowDropdown = true;
      this.searchAssetsFromApi(val, this.revalFilteredAssets);
    } else {
      this.revalFilteredAssets.set([]);
      this.revalShowDropdown = false;
    }
  }

  selectRevalAsset(asset: any) {
    this.revalSelectedAsset.set(asset);
    this.revalSearchTerm = asset.assetId;
    this.revalShowDropdown = false;
    this.revalFilteredAssets.set([]);
    this.revalCatchupDep.set(null);
    if (this.revalForm.revaluation_date) {
      this.onRevalDateChange();
    }
  }

  clearRevalAsset() {
    this.revalSelectedAsset.set(null);
    this.revalSearchTerm = '';
    this.revalCatchupDep.set(null);
    this.revalForm = { revaluation_date: '', market_value: null, valuation_module: -1, dep_adjustment: null };
    this.revalError.set('');
    this.revalDateError.set('');
  }

  onImpairSearch(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.impairSearchTerm = val;
    if (val.length >= 1) {
      this.impairShowDropdown = true;
      this.searchAssetsFromApi(val, this.impairFilteredAssets);
    } else {
      this.impairFilteredAssets.set([]);
      this.impairShowDropdown = false;
    }
  }

  selectImpairAsset(asset: any) {
    this.impairSelectedAsset.set(asset);
    this.impairSearchTerm = asset.assetId;
    this.impairShowDropdown = false;
    this.impairFilteredAssets.set([]);
    this.impairCatchupDep.set(null);
    this.impairAssetMinDate.set('');
    var assetRegId = parseInt(asset.assetId, 10);
    this.api.getAssetLastDepDate(assetRegId).subscribe({
      next: function(this: any, resp: any) {
        this.impairAssetMinDate.set(resp?.lastDepDate || '');
        if (this.impairForm.transaction_date) {
          this.onImpairDateChange(this.impairForm.transaction_date);
        }
      }.bind(this),
      error: function(this: any) {
        if (this.impairForm.transaction_date) {
          this.onImpairDateChange(this.impairForm.transaction_date);
        }
      }.bind(this)
    });
  }

  clearImpairAsset() {
    this.impairSelectedAsset.set(null);
    this.impairSearchTerm = '';
    this.impairCatchupDep.set(null);
    this.impairAssetMinDate.set('');
  }

  onReversalSearch(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.reversalSearchTerm = val;
    if (val.length >= 1) {
      this.reversalShowDropdown = true;
      this.searchAssetsFromApi(val, this.reversalFilteredAssets);
    } else {
      this.reversalFilteredAssets.set([]);
      this.reversalShowDropdown = false;
    }
  }

  selectReversalAsset(asset: any) {
    this.reversalSelectedAsset.set(asset);
    this.reversalSearchTerm = asset.assetId;
    this.reversalShowDropdown = false;
    this.reversalFilteredAssets.set([]);
    this.reversalCatchupDep.set(null);
    this.reversalAssetMinDate.set('');
    this.reversalOriginalBasis.set(null);
    this.reversalBasisError.set(null);
    var assetRegId = parseInt(asset.assetId, 10);
    this.api.getAssetLastDepDate(assetRegId).subscribe({
      next: function(this: any, resp: any) {
        this.reversalAssetMinDate.set(resp?.lastDepDate || '');
        if (this.reversalForm.transaction_date) {
          this.onReversalDateChange(this.reversalForm.transaction_date);
        }
      }.bind(this),
      error: function(this: any) {
        if (this.reversalForm.transaction_date) {
          this.onReversalDateChange(this.reversalForm.transaction_date);
        }
      }.bind(this)
    });
    this.api.getImpairmentReserveBasis(assetRegId).subscribe({
      next: function(this: any, basis: any) {
        this.reversalOriginalBasis.set(basis);
        this.reversalBasisError.set(null);
      }.bind(this),
      error: function(this: any) {
        this.reversalOriginalBasis.set(null);
        this.reversalBasisError.set('Could not load original impairment basis data. Please retry before submitting.');
      }.bind(this)
    });
  }

  clearReversalAsset() {
    this.reversalSelectedAsset.set(null);
    this.reversalSearchTerm = '';
    this.reversalCatchupDep.set(null);
    this.reversalAssetMinDate.set('');
    this.reversalOriginalBasis.set(null);
    this.reversalBasisError.set(null);
  }

  onReversalDateChange(dateStr: string) {
    this.reversalForm.transaction_date = dateStr;
    this.reversalDateError.set('');
    const asset = this.reversalSelectedAsset();
    if (!asset || !dateStr) return;
    var assetId = asset.assetRegisterItem_ID || asset.assetRegisterItemId || asset.assetId;
    this.loadCatchupDepreciation(String(assetId), dateStr, this.reversalCatchupDep, this.reversalCatchupLoading, this.reversalDateError, this.reversalAssetMinDate() || undefined);
  }

  getReversalAccumulatedImpairment(): number {
    const asset = this.reversalSelectedAsset();
    if (!asset) return 0;
    return Number(asset.accumulatedImpairment) || 0;
  }

  getReversalAdjustedCarrying(catchup: any, asset: any): number {
    return this.getAdjustedCarryingAmount(catchup, asset);
  }

  getReversalCurrentCarrying(catchup: any, asset: any): number {
    var current = Number(asset?.carryingAmount) || 0;
    var catchupDep = catchup ? (Number(catchup.depreciationAmount) || 0) : 0;
    return current - catchupDep;
  }

  getReversalBasis(): number {
    var recoverable = Number(this.reversalForm.recoverable_amount) || 0;
    var valueInUse = Number(this.reversalForm.value_in_use) || 0;
    return recoverable > valueInUse ? recoverable : valueInUse;
  }

  getReversalBasisError(): string {
    const catchup = this.reversalCatchupDep();
    const asset = this.reversalSelectedAsset();
    if (!asset) return '';
    var wouldHaveBeenCarrying = this.getReversalAdjustedCarrying(catchup, asset);
    if (wouldHaveBeenCarrying <= 0) return '';
    var basis = this.getReversalBasis();
    if (basis <= 0) return '';
    if (basis > wouldHaveBeenCarrying) {
      return 'The Recoverable Service Amount / Value in Use cannot exceed the Would-Have-Been Carrying (GRAP Cap) of ' + this.formatCurrency(wouldHaveBeenCarrying) + '. Please enter a lower amount.';
    }
    return '';
  }

  calculateTotalReversal(): number {
    const catchup = this.reversalCatchupDep();
    const asset = this.reversalSelectedAsset();
    var wouldHaveBeenCarrying = this.getReversalAdjustedCarrying(catchup, asset);
    var currentCarrying = this.getReversalCurrentCarrying(catchup, asset);
    var basis = this.getReversalBasis();
    var targetCarrying = wouldHaveBeenCarrying < basis ? wouldHaveBeenCarrying : basis;
    var reversal = targetCarrying - currentCarrying;
    if (reversal <= 0) return 0;
    var accImpairment = this.getReversalAccumulatedImpairment();
    if (accImpairment <= 0) return 0;
    return reversal < accImpairment ? reversal : accImpairment;
  }

  getReversalEffectiveRevaluationReserve(): number {
    const asset = this.reversalSelectedAsset();
    if (!asset) return 0;
    var reserve = Number(asset.revaluationReserveClosingBalance) || 0;
    if (reserve <= 0) return 0;
    const catchup = this.reversalCatchupDep();
    if (catchup) {
      var offset = this.getCatchupDepreciationOffset(catchup);
      reserve = reserve - offset;
      if (reserve < 0) reserve = 0;
    }
    return reserve;
  }

  calculateReversalRevaluationReserve(): number {
    var basis = this.reversalOriginalBasis();
    if (!basis) return 0;
    var total = this.calculateTotalReversal();
    if (total <= 0) return 0;
    var toReserve = Math.max(0, total - Math.min(total, basis.originalPnL));
    return Math.min(toReserve, basis.originalReserve);
  }

  calculateReversalToIncome(): number {
    var total = this.calculateTotalReversal();
    var reserveUsed = this.calculateReversalRevaluationReserve();
    return total - reserveUsed;
  }

  onTransferSearch(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.transferSearchTerm = val;
    if (val.length >= 1) {
      this.transferShowDropdown = true;
      this.searchAssetsFromApi(val, this.transferFilteredAssets);
    } else {
      this.transferFilteredAssets.set([]);
      this.transferShowDropdown = false;
    }
  }

  selectTransferAsset(asset: any) {
    this.transferSelectedAsset.set(asset);
    this.transferSearchTerm = asset.assetId;
    this.transferShowDropdown = false;
    this.transferFilteredAssets.set([]);
  }

  clearTransferAsset() {
    this.transferSelectedAsset.set(null);
    this.transferSearchTerm = '';
  }

  onDisposalSearch(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.disposalSearchTerm = val;
    if (val.length >= 1) {
      this.disposalShowDropdown = true;
      this.searchAssetsFromApi(val, this.disposalFilteredAssets);
    } else {
      this.disposalFilteredAssets.set([]);
      this.disposalShowDropdown = false;
    }
  }

  selectDisposalAsset(asset: any) {
    this.disposalSelectedAsset.set(asset);
    this.disposalSearchTerm = asset.assetId;
    this.disposalShowDropdown = false;
    this.disposalFilteredAssets.set([]);
    this.disposalCatchupDep.set(null);
    this.disposalAssetLastDepDate.set('');
    var assetRegId = parseInt(asset.assetId, 10);
    this.api.getAssetLastDepDate(assetRegId).subscribe({
      next: function(this: any, resp: any) {
        this.disposalAssetLastDepDate.set(resp?.lastDepDate || '');
        if (this.disposalForm.disposal_date) {
          this.onDisposalDateChange();
        }
      }.bind(this),
      error: function(this: any) {
        if (this.disposalForm.disposal_date) {
          this.onDisposalDateChange();
        }
      }.bind(this)
    });
  }

  clearDisposalAsset() {
    this.disposalSelectedAsset.set(null);
    this.disposalSearchTerm = '';
    this.disposalCatchupDep.set(null);
    this.disposalAssetLastDepDate.set('');
    this.disposalForm.value = null;
  }

  onRefurbSearch(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.refurbSearchTerm = val;
    if (val.length >= 1) {
      this.refurbShowDropdown = true;
      this.searchAssetsFromApi(val, this.refurbFilteredAssets);
    } else {
      this.refurbFilteredAssets.set([]);
      this.refurbShowDropdown = false;
    }
  }

  selectRefurbAsset(asset: any) {
    this.refurbSelectedAsset.set(asset);
    this.refurbSearchTerm = asset.assetId;
    this.refurbShowDropdown = false;
    this.refurbFilteredAssets.set([]);
    this.refurbCatchupDep.set(null);
    if (this.refurbForm.refurb_date) {
      this.onRefurbDateChange();
    }
  }

  clearRefurbAsset() {
    this.refurbSelectedAsset.set(null);
    this.refurbSearchTerm = '';
    this.refurbCatchupDep.set(null);
    this.refurbForm = { refurb_date: '', refurb_dt: null, refurb_ct: null, refurb_depreciation: null, refurb_revaluation: null, refurb_impairment: null, debitPlanProjectItemId: null, creditPlanProjectItemId: null };
    this.refurbDtProjectId = '';
    this.refurbDtScoaItemId = '';
    this.refurbDtScoaItems = [];
    this.refurbCtProjectId = '';
    this.refurbCtScoaItemId = '';
    this.refurbCtScoaItems = [];
    this.refurbError.set('');
    this.refurbDateError.set('');
  }

  onRefurbDateChange() {
    const asset = this.refurbSelectedAsset();
    if (asset && this.refurbForm.refurb_date) {
      this.loadCatchupDepreciation(asset.assetId, this.refurbForm.refurb_date, this.refurbCatchupDep, this.refurbCatchupLoading, this.refurbDateError);
    } else {
      this.refurbDateError.set(this.validateTransactionDate(this.refurbForm.refurb_date));
    }
  }

  closeDropdown(which: string) {
    setTimeout(() => {
      if (which === 'reval') this.revalShowDropdown = false;
      if (which === 'impair') this.impairShowDropdown = false;
      if (which === 'reversal') this.reversalShowDropdown = false;
      if (which === 'transfer') this.transferShowDropdown = false;
      if (which === 'disposal') this.disposalShowDropdown = false;
      if (which === 'refurb') this.refurbShowDropdown = false;
    }, 200);
  }

  onDepRunDateChange() {
    this.depRunDateError.set(this.validateDepRunDate());
  }

  previewDepreciation() {
    const err = this.validateDepRunDate();
    if (err) { this.depRunDateError.set(err); return; }
    this.depRunDateError.set('');
    this.depPreviewing.set(true);
    this.api.getDepreciationByDays({
      fromDate: this.lastDepreciationDate(),
      toDate: this.depRunToDate
    }).subscribe({
      next: (result: any) => {
        this.depPreviewData.set(result);
        this.depPreviewing.set(false);
      },
      error: () => this.depPreviewing.set(false)
    });
  }

  loadCompletedPeriods(finYear: string) {
    this.api.getMonthlyApprovals(finYear).subscribe({
      next: function(this: TransactionsComponent, rows: any[]) {
        var completed: number[] = [];
        for (var i = 0; i < rows.length; i++) {
          var row = rows[i];
          var rawPeriod = row['Financial_Period'] !== undefined ? row['Financial_Period'] : row['financial_Period'];
          var rawApproved = row['IsApproved'] !== undefined ? row['IsApproved'] : row['isApproved'];
          if (rawPeriod && rawApproved === true) {
            var p = Number(rawPeriod);
            if (p >= 1 && p <= 12 && completed.indexOf(p) === -1) completed.push(p);
          }
        }
        this.depCompletedPeriods.set(completed);
        if (completed.indexOf(this.depSelectedPeriod) !== -1) {
          var months = this.periodMonths;
          var foundNext = false;
          for (var j = 0; j < months.length; j++) {
            if (months[j].value > this.depSelectedPeriod && completed.indexOf(months[j].value) === -1) {
              this.depSelectedPeriod = months[j].value;
              foundNext = true;
              break;
            }
          }
          if (!foundNext) {
            for (var k = 0; k < months.length; k++) {
              if (completed.indexOf(months[k].value) === -1) {
                this.depSelectedPeriod = months[k].value;
                break;
              }
            }
          }
        }
      }.bind(this),
      error: function() {}
    });
  }

  onDepFinYearChange(finYear: string) {
    this.depCompletedPeriods.set([]);
    this.loadCompletedPeriods(finYear);
  }

  runDepreciation() {
    if (!this.depSelectedFinYear || !this.depSelectedPeriod) {
      this.depRunDateError.set('Please select a Financial Year and Period');
      return;
    }
    var scheduledDate = this.getScheduledDateForPeriod();
    if (!scheduledDate) {
      this.depRunDateError.set('Could not determine period end date');
      return;
    }
    this.depRunDateError.set('');
    this.depRunning.set(true);
    this.depRunStep.set(1);
    this.depRunModalVisible.set(true);
    var finYear = this.depSelectedFinYear;
    this.api.validateDepreciationPreRun({ finYear: finYear }).subscribe({
      next: function(this: TransactionsComponent, valResult: any) {
        if (!valResult.valid) {
          this.depRunning.set(false);
          this.depRunModalVisible.set(false);
          this.depRunStep.set(0);
          this.glValidationTxnType.set('Depreciation');
          this.glValidationErrors.set(valResult.results || []);
          this.glValidationVisible.set(true);
          return;
        }
        this.depRunStep.set(2);
        var self = this;
        setTimeout(function() { if (self.depRunStep() === 2) self.depRunStep.set(3); }, 1500);
        setTimeout(function() { if (self.depRunStep() === 3) self.depRunStep.set(4); }, 3500);
        self.api.runDepreciationBatch({
          finYear: finYear,
          scheduledDate: scheduledDate
        }).subscribe({
          next: function(this: TransactionsComponent, result: any) {
            this.depRunResult.set({
              finYear: this.depSelectedFinYear,
              period: this.depSelectedPeriod,
              periodName: this.getPeriodLabel(this.depSelectedPeriod),
              scheduledDate: result.scheduledDate || scheduledDate,
              assetsProcessed: result.totalAssets || 0,
              totalDepreciation: result.totalDepreciation || 0,
              scheduleId: result.scheduleId,
              scheduleItemCount: result.scheduleItemCount || 0
            });
            this.depRunning.set(false);
            this.loadPendingItems();
            this.refreshTransactions();
            this.loadCompletedPeriods(this.depSelectedFinYear);
            if (this.depRunStep() < 4) this.depRunStep.set(4);
            var self2 = this;
            setTimeout(function() {
              self2.depRunStep.set(5);
              setTimeout(function() {
                self2.depRunModalVisible.set(false);
                self2.depRunStep.set(0);
              }, 2500);
            }, 800);
          }.bind(this),
          error: function(this: TransactionsComponent, err: any) {
            this.depRunning.set(false);
            this.depRunModalVisible.set(false);
            this.depRunStep.set(0);
            this.depRunDateError.set('Run failed: ' + (err?.error?.error || err?.error?.details || err?.message || 'Unknown error'));
          }.bind(this)
        });
      }.bind(this),
      error: function(this: TransactionsComponent, err: any) {
        this.depRunning.set(false);
        this.depRunModalVisible.set(false);
        this.depRunStep.set(0);
        this.depRunDateError.set('mSCOA validation could not be completed — ' + (err?.error?.error || err?.message || 'Please try again.'));
      }.bind(this)
    });
  }


  loadScheduleItems(scheduleId: number) {
    this.depScheduleItemsLoading.set(true);
    this.depDetailScheduleId.set(scheduleId);
    this.depScheduleItems.set([]);
    this.depItemDetails.set({});
    this.depItemExpanded.set({});
    this.api.getDepreciationScheduleById(scheduleId).subscribe({
      next: function(this: TransactionsComponent, resp: any) {
        var items = resp.items || [];
        this.depScheduleItems.set(items);
        this.depScheduleItemsLoading.set(false);
      }.bind(this),
      error: function(this: TransactionsComponent) {
        this.depScheduleItemsLoading.set(false);
      }.bind(this)
    });
  }

  getScheduleItemVal(item: any, key: string): any {
    if (item[key] !== undefined) return item[key];
    var lower = key.charAt(0).toLowerCase() + key.slice(1);
    if (item[lower] !== undefined) return item[lower];
    return null;
  }

  getScheduleItemFinPeriod(item: any): string {
    var fp = this.getScheduleItemVal(item, 'FinancialPeriod') || this.getScheduleItemVal(item, 'Month_ID');
    var fy = this.getScheduleItemVal(item, 'FinYear') || '';
    if (!fp && !fy) return '—';
    var periodLabel = '';
    if (fp) {
      for (var i = 0; i < this.periodMonths.length; i++) {
        if (this.periodMonths[i].value === Number(fp)) {
          periodLabel = this.periodMonths[i].label;
          break;
        }
      }
    }
    if (fy && periodLabel) return fy + ' P' + fp + ' (' + periodLabel + ')';
    if (fy) return fy;
    return 'P' + fp;
  }

  toggleScheduleItemDetail(scheduleId: number, itemId: number) {
    var expanded = this.depItemExpanded();
    var newExpanded: Record<number, boolean> = {};
    for (var k in expanded) {
      newExpanded[k] = expanded[k];
    }
    if (newExpanded[itemId]) {
      newExpanded[itemId] = false;
      this.depItemExpanded.set(newExpanded);
      return;
    }
    newExpanded[itemId] = true;
    this.depItemExpanded.set(newExpanded);
    var existing = this.depItemDetails();
    if (existing[itemId] && existing[itemId].length > 0) {
      return;
    }
    var loadingMap: Record<number, boolean> = {};
    var currentLoading = this.depItemDetailsLoading();
    for (var lk in currentLoading) {
      loadingMap[lk] = currentLoading[lk];
    }
    loadingMap[itemId] = true;
    this.depItemDetailsLoading.set(loadingMap);

    this.api.getDepreciationScheduleDetails(scheduleId, undefined, itemId).subscribe({
      next: function(this: TransactionsComponent, items: any[]) {
        var detailMap: Record<number, any[]> = {};
        var curr = this.depItemDetails();
        for (var dk in curr) {
          detailMap[dk] = curr[dk];
        }
        detailMap[itemId] = items || [];
        this.depItemDetails.set(detailMap);

        var lm: Record<number, boolean> = {};
        var cl = this.depItemDetailsLoading();
        for (var lkey in cl) {
          lm[lkey] = cl[lkey];
        }
        lm[itemId] = false;
        this.depItemDetailsLoading.set(lm);
      }.bind(this),
      error: function(this: TransactionsComponent) {
        var lm: Record<number, boolean> = {};
        var cl = this.depItemDetailsLoading();
        for (var lkey in cl) {
          lm[lkey] = cl[lkey];
        }
        lm[itemId] = false;
        this.depItemDetailsLoading.set(lm);
      }.bind(this)
    });
  }

  isItemExpanded(itemId: number): boolean {
    return !!this.depItemExpanded()[itemId];
  }

  isItemLoading(itemId: number): boolean {
    return !!this.depItemDetailsLoading()[itemId];
  }

  getItemDetails(itemId: number): any[] {
    return this.depItemDetails()[itemId] || [];
  }

  exportScheduleDetail(scheduleId: number, itemId?: number) {
    var url = this.api.exportDepreciationScheduleDetails(scheduleId, itemId);
    window.open(url, '_blank');
  }

  submitRevaluation() {
    const asset = this.revalSelectedAsset();
    if (!asset) return;
    const dateErr = this.validateTransactionDate(this.revalForm.revaluation_date);
    if (dateErr) { this.revalDateError.set(dateErr); return; }
    var marketValue = Number(this.revalForm.market_value) || 0;
    if (marketValue <= 0) {
      this.revalError.set('Market Value / Fair Value is required');
      return;
    }
    var valModule = Number(this.revalForm.valuation_module);
    if (valModule < 1) {
      this.revalError.set('Valuation Module must be selected');
      return;
    }
    this.revalError.set('');
    var surplusAmount = this.getRevalSurplusAmount();
    var depAdjustment = Number(this.revalForm.dep_adjustment) || 0;
    var assetId = asset.assetRegisterItem_ID || asset.assetRegisterItemId || asset.assetId;

    this.submittingReval.set(true);
    this.api.createRevaluation({
      assetRegisterID: Number(assetId),
      revaluation: 0,
      asset: 0,
      profit: 0,
      revalModel: valModule,
      revalautionAmt: marketValue,
      revalutionDate: this.revalForm.revaluation_date,
      userID: 1,
      diffDepAcc: 0,
      diffBook: 0,
      projectDR: 0,
      projectItemDR: 0,
      projectCR: 0,
      projectItemCR: 0,
      surplusAmount: surplusAmount,
      depreciationAdjustment: depAdjustment
    }).subscribe({
      next: function(this: TransactionsComponent) {
        this.submittingReval.set(false);
        this.revalSuccess.set(true);
        this.revalForm = { revaluation_date: '', market_value: null, valuation_module: -1, dep_adjustment: null };
        this.clearRevalAsset();
        this.loadPendingItems();
        this.refreshTransactions();
      }.bind(this),
      error: function(this: TransactionsComponent, err: any) {
        this.submittingReval.set(false);
        this.revalError.set('Failed to create revaluation: ' + (err?.error?.error || err?.message || 'Unknown error'));
      }.bind(this)
    });
  }

  submitImpairment() {
    const asset = this.impairSelectedAsset();
    if (!asset) return;
    const dateErr = this.validateTransactionDate(this.impairForm.transaction_date);
    if (dateErr) { this.impairDateError.set(dateErr); return; }
    const catchup = this.impairCatchupDep();
    const adjustedCarrying = this.getAdjustedCarryingAmount(catchup, asset);
    const impairmentLoss = this.calculateImpairmentLoss();
    const revalReserveAmount = this.calculateImpairmentRevaluationReserve();
    const totalImpairment = this.calculateTotalImpairment();
    const basis = this.getImpairmentBasis();
    if (totalImpairment <= 0) {
      this.impairError.set('Recoverable amount must be less than the adjusted carrying amount');
      return;
    }
    this.submittingImpair.set(true);
    this.impairError.set('');

    var assetId = asset.assetRegisterItem_ID || asset.assetRegisterItemId || asset.assetId;
    var fy = this.getCurrentFinYear();
    var isoDate = this.toIsoDate(this.impairForm.transaction_date);
    var catchupDepAmount = catchup ? (Number(catchup.depreciationAmount) || 0) : 0;
    var catchupDays = catchup ? (Number(catchup.days) || 0) : 0;
    var payload: any = {
      assetRegisterItem_ID: assetId,
      asset_ItemID: assetId,
      impairmentDate: isoDate,
      impairmentAmount: totalImpairment,
      previousCarryingAmount: adjustedCarrying,
      newCarryingAmount: basis,
      remainingUsefulLife: asset.remainingUsefulLifeMonths || asset.remainingUsefulLife || 0,
      reason: this.impairForm.reason,
      status: 'Pending',
      finYear: fy,
      catchUpDepreciation: catchupDepAmount,
      catchUpDays: catchupDays
    };
    this.api.createImpairment(payload).subscribe({
      next: function(this: TransactionsComponent, result: any) {
        var impairmentId = result.assetImpairment_ID || result.assetImpairmentId;
        this.api.createImpairmentPosting({
          assetImpairment_ID: impairmentId,
          impairment_ID: impairmentId,
          fairValueAmt: basis,
          impairmentLostAmt: impairmentLoss,
          carryingValue: adjustedCarrying,
          newCarryingValue: basis,
          amountFromRevaluationReserve: revalReserveAmount,
          isReversal: 0
        }).subscribe({
          next: function(this: TransactionsComponent) {
            this.api.initiateWorkflow({
              entity_type: 'impairment',
              entity_id: String(assetId),
              data: {
                asset_id: assetId,
                asset_description: asset.description,
                impairment_id: impairmentId,
                impairment_amount: totalImpairment,
                previous_carrying_amount: adjustedCarrying,
                new_carrying_amount: basis,
                reason: this.impairForm.reason,
                transaction_date: isoDate
              },
              mssql_reference_id: String(impairmentId)
            }).subscribe({
              next: function(this: TransactionsComponent) {
                this.submittingImpair.set(false);
                this.impairSuccess.set(true);
                this.impairForm = { impairment_type: 'non_cash_generating', recoverable_amount: null, value_in_use: null, reason: '', transaction_date: '' };
                this.clearImpairAsset();
                this.loadPendingItems();
                this.refreshTransactions();
              }.bind(this),
              error: function(this: TransactionsComponent, err: any) {
                this.submittingImpair.set(false);
                this.impairError.set('Impairment created but workflow could not be initiated: ' + (err?.error?.error || err?.message || 'Unknown error'));
                this.loadPendingItems();
                this.refreshTransactions();
              }.bind(this)
            });
          }.bind(this),
          error: function(this: TransactionsComponent, err: any) {
            this.submittingImpair.set(false);
            this.impairError.set('Failed to create impairment posting: ' + (err?.error?.error || err?.message || 'Unknown error'));
          }.bind(this)
        });
      }.bind(this),
      error: function(this: TransactionsComponent, err: any) {
        this.submittingImpair.set(false);
        var detail = '';
        if (err?.error?.details) {
          detail = JSON.stringify(err.error.details);
        }
        if (err?.error?.rawBody) {
          detail = detail + ' | Raw: ' + err.error.rawBody;
        }
        this.impairError.set('Failed to create impairment: ' + (err?.error?.error || err?.message || 'Unknown error') + (detail ? ' — ' + detail : ''));
      }.bind(this)
    });
  }

  submitReversal() {
    const asset = this.reversalSelectedAsset();
    if (!asset) return;
    const dateErr = this.validateTransactionDate(this.reversalForm.transaction_date);
    if (dateErr) { this.reversalDateError.set(dateErr); return; }
    if (this.reversalOriginalBasis() === null) {
      const basisErr = this.reversalBasisError();
      this.reversalError.set(basisErr !== null
        ? basisErr
        : 'Original impairment basis data is still loading — please wait a moment and try again.');
      return;
    }
    const catchup = this.reversalCatchupDep();
    const currentCarrying = this.getReversalCurrentCarrying(catchup, asset);
    const reversalToIncome = this.calculateReversalToIncome();
    const revalReserveAmount = this.calculateReversalRevaluationReserve();
    const totalReversal = this.calculateTotalReversal();
    const basis = this.getReversalBasis();
    var basisErr = this.getReversalBasisError();
    if (basisErr) {
      this.reversalError.set(basisErr);
      return;
    }
    if (totalReversal <= 0) {
      this.reversalError.set('Recoverable amount must exceed the current carrying amount, and there must be an existing impairment to reverse');
      return;
    }
    if (!this.reversalForm.reason || !this.reversalForm.reason.trim()) {
      this.reversalError.set('Reason / evidence of reversal is required');
      return;
    }
    this.submittingReversal.set(true);
    this.reversalError.set('');

    var assetId = asset.assetRegisterItem_ID || asset.assetRegisterItemId || asset.assetId;
    var fy = this.getCurrentFinYear();
    var isoDate = this.toIsoDate(this.reversalForm.transaction_date);
    var catchupDepAmount = catchup ? (Number(catchup.depreciationAmount) || 0) : 0;
    var catchupDays = catchup ? (Number(catchup.days) || 0) : 0;
    var payload: any = {
      assetRegisterItem_ID: assetId,
      asset_ItemID: assetId,
      impairmentDate: isoDate,
      impairmentAmount: totalReversal,
      previousCarryingAmount: currentCarrying,
      newCarryingAmount: currentCarrying + totalReversal,
      remainingUsefulLife: asset.remainingUsefulLifeMonths || asset.remainingUsefulLife || 0,
      reason: this.reversalForm.reason,
      status: 'Pending',
      finYear: fy,
      catchUpDepreciation: catchupDepAmount,
      catchUpDays: catchupDays,
      isReversal: 1
    };
    this.api.createImpairment(payload).subscribe({
      next: function(this: TransactionsComponent, result: any) {
        var impairmentId = result.assetImpairment_ID || result.assetImpairmentId;
        this.api.createImpairmentPosting({
          assetImpairment_ID: impairmentId,
          impairment_ID: impairmentId,
          fairValueAmt: basis,
          impairmentLostAmt: reversalToIncome,
          carryingValue: currentCarrying,
          newCarryingValue: currentCarrying + totalReversal,
          amountFromRevaluationReserve: revalReserveAmount,
          isReversal: 1
        }).subscribe({
          next: function(this: TransactionsComponent) {
            this.api.initiateWorkflow({
              entity_type: 'impairment',
              entity_id: String(assetId),
              data: {
                asset_id: assetId,
                asset_description: asset.description,
                impairment_id: impairmentId,
                impairment_amount: totalReversal,
                previous_carrying_amount: currentCarrying,
                new_carrying_amount: currentCarrying + totalReversal,
                reason: this.reversalForm.reason,
                transaction_date: isoDate,
                is_reversal: true
              },
              mssql_reference_id: String(impairmentId)
            }).subscribe({
              next: function(this: TransactionsComponent) {
                this.submittingReversal.set(false);
                this.reversalSuccess.set(true);
                this.reversalForm = { recoverable_amount: null, value_in_use: null, reason: '', transaction_date: '' };
                this.clearReversalAsset();
                this.loadPendingItems();
                this.refreshTransactions();
              }.bind(this),
              error: function(this: TransactionsComponent, err: any) {
                this.submittingReversal.set(false);
                this.reversalError.set('Reversal created but workflow could not be initiated: ' + (err?.error?.error || err?.message || 'Unknown error'));
                this.loadPendingItems();
                this.refreshTransactions();
              }.bind(this)
            });
          }.bind(this),
          error: function(this: TransactionsComponent, err: any) {
            this.submittingReversal.set(false);
            this.reversalError.set('Failed to create reversal posting: ' + (err?.error?.error || err?.message || 'Unknown error'));
          }.bind(this)
        });
      }.bind(this),
      error: function(this: TransactionsComponent, err: any) {
        this.submittingReversal.set(false);
        var detail = '';
        if (err?.error?.details) {
          detail = JSON.stringify(err.error.details);
        }
        if (err?.error?.rawBody) {
          detail = detail + ' | Raw: ' + err.error.rawBody;
        }
        this.reversalError.set('Failed to create impairment reversal: ' + (err?.error?.error || err?.message || 'Unknown error') + (detail ? ' — ' + detail : ''));
      }.bind(this)
    });
  }

  submitTransfer() {
    const asset = this.transferSelectedAsset();
    if (!asset || !this.transferForm.to_department) return;
    const dateErr = this.validateTransactionDate(this.transferForm.transfer_date);
    if (dateErr) { this.transferDateError.set(dateErr); return; }
    this.submittingTransfer.set(true);
    this.api.initiateWorkflow({
      entity_type: 'transfer',
      entity_id: asset.assetId,
      data: {
        asset_id: asset.assetId,
        asset_description: asset.description,
        asset_class: asset.assetClassName,
        asset_category: asset.categoryName,
        current_department: asset.departmentName,
        current_location: asset.locationName || asset.town,
        to_department: this.transferForm.to_department,
        to_location: this.transferForm.to_location,
        transfer_date: this.transferForm.transfer_date,
        reason: this.transferForm.reason,
        description: 'Transfer of ' + asset.assetId + ' from ' + asset.departmentName + ' to ' + this.transferForm.to_department
      }
    }).subscribe({
      next: () => {
        this.submittingTransfer.set(false);
        this.transferSuccess.set(true);
        this.transferForm = { to_department: '', to_location: '', transfer_date: '', reason: '' };
        this.clearTransferAsset();
        this.refreshTransactions();
      },
      error: () => this.submittingTransfer.set(false)
    });
  }

  submitDisposal() {
    const asset = this.disposalSelectedAsset();
    if (!asset || !this.disposalForm.method) return;
    const dateErr = this.validateDisposalDate(this.disposalForm.disposal_date);
    if (dateErr) { this.disposalDateError.set(dateErr); return; }
    this.submittingDisposal.set(true);

    var fy = this.getCurrentFinYear();
    var disposalAssetId = asset.assetRegisterItem_ID || asset.assetRegisterItemId || asset.assetId;
    var disposalIsoDate = this.toIsoDate(this.disposalForm.disposal_date);
    var disposalSalePrice = Number(this.disposalForm.value) || 0;
    var disposalReason = this.disposalForm.reason || this.disposalForm.method;
    this.api.createDisposal({
      assetRegisterItem_ID: disposalAssetId,
      disposalDate: disposalIsoDate,
      disposalMethod_ID: null,
      salePrice: disposalSalePrice,
      reason: disposalReason,
      finYear: fy
    }).subscribe({
      next: function(this: TransactionsComponent, result: any) {
        var disposalId = result.assetDisposal_ID || result.assetDisposalId || result.id;
        this.api.initiateWorkflow({
          entity_type: 'disposal',
          entity_id: String(disposalAssetId),
          data: {
            asset_id: disposalAssetId,
            asset_description: asset.description,
            disposal_id: disposalId,
            disposal_method: this.disposalForm.method,
            sale_price: disposalSalePrice,
            reason: disposalReason,
            transaction_date: disposalIsoDate
          },
          mssql_reference_id: String(disposalId)
        }).subscribe({
          next: function(this: TransactionsComponent) {
            this.submittingDisposal.set(false);
            this.disposalSuccess.set(true);
            this.disposalForm = { method: '', value: null, disposal_date: '', reason: '' };
            this.clearDisposalAsset();
            this.loadPendingItems();
            this.refreshTransactions();
          }.bind(this),
          error: function(this: TransactionsComponent, err: any) {
            this.submittingDisposal.set(false);
            this.disposalError.set('Disposal created but workflow could not be initiated: ' + (err?.error?.error || err?.message || 'Unknown error'));
            this.loadPendingItems();
            this.refreshTransactions();
          }.bind(this)
        });
      }.bind(this),
      error: function(this: TransactionsComponent, err: any) {
        this.submittingDisposal.set(false);
        this.disposalError.set('Failed to create disposal: ' + (err?.error?.error || err?.message || 'Unknown error'));
      }.bind(this)
    });
  }

  getTransactionDescription(tx: any): string {
    if (tx.data?.description) return tx.data.description;
    return tx.entity_type + ' - ' + (tx.entity_id || '');
  }

  getStatusClass(status: string): string {
    const s = (status || '').toLowerCase();
    if (s === 'approved') return 'status-badge status-approved';
    if (s === 'rejected') return 'status-badge status-rejected';
    if (s === 'pending') return 'status-badge status-pending';
    return 'status-badge status-active';
  }

  private refreshTransactions() {
    this.api.getAllWorkflows().subscribe({
      next: w => this.recentTransactions.set(w),
      error: () => {}
    });
  }

  getMissingFieldsText(fields: string[]): string {
    if (!fields) return '';
    var text = '';
    for (var i = 0; i < fields.length; i++) {
      if (i > 0) text = text + ', ';
      text = text + fields[i];
    }
    return text;
  }

  dismissGlValidation() {
    this.glValidationVisible.set(false);
    this.glValidationErrors.set([]);
    this.glValidationTxnType.set('');
  }

  validateAndSubmitImpairment() {
    var asset = this.impairSelectedAsset();
    if (!asset) return;
    var assetId = asset.assetRegisterItem_ID || asset.assetRegisterItemId || asset.assetId;
    this.glValidating.set(true);
    this.glValidationErrors.set([]);
    this.glValidationVisible.set(false);
    this.api.validateGlPosting({
      assetIds: [assetId],
      transactionType: 'Impairment',
      checkOffsetReserve: true
    }).subscribe({
      next: function(this: TransactionsComponent, result: any) {
        this.glValidating.set(false);
        if (result.valid) {
          this.submitImpairment();
        } else {
          this.glValidationTxnType.set('Impairment');
          this.glValidationErrors.set(result.results || []);
          this.glValidationVisible.set(true);
        }
      }.bind(this),
      error: function(this: TransactionsComponent, err: any) {
        this.glValidating.set(false);
        this.impairError.set('GL validation could not be completed — submission blocked. ' + (err?.error?.error || err?.message || 'Please try again.'));
      }.bind(this)
    });
  }

  validateAndSubmitReversal() {
    var asset = this.reversalSelectedAsset();
    if (!asset) return;
    var assetId = asset.assetRegisterItem_ID || asset.assetRegisterItemId || asset.assetId;
    this.glValidating.set(true);
    this.glValidationErrors.set([]);
    this.glValidationVisible.set(false);
    this.api.validateGlPosting({
      assetIds: [assetId],
      transactionType: 'Impairment Reversal',
      checkOffsetReserve: true
    }).subscribe({
      next: function(this: TransactionsComponent, result: any) {
        this.glValidating.set(false);
        if (result.valid) {
          this.submitReversal();
        } else {
          this.glValidationTxnType.set('Impairment Reversal');
          this.glValidationErrors.set(result.results || []);
          this.glValidationVisible.set(true);
        }
      }.bind(this),
      error: function(this: TransactionsComponent, err: any) {
        this.glValidating.set(false);
        this.reversalError.set('GL validation could not be completed — submission blocked. ' + (err?.error?.error || err?.message || 'Please try again.'));
      }.bind(this)
    });
  }

  validateAndSubmitRevaluation() {
    var asset = this.revalSelectedAsset();
    if (!asset) return;
    var assetId = asset.assetRegisterItem_ID || asset.assetRegisterItemId || asset.assetId;
    this.glValidating.set(true);
    this.glValidationErrors.set([]);
    this.glValidationVisible.set(false);
    this.api.validateGlPosting({
      assetIds: [assetId],
      transactionType: 'Revaluation',
      checkOffsetReserve: true
    }).subscribe({
      next: function(this: TransactionsComponent, result: any) {
        this.glValidating.set(false);
        if (result.valid) {
          this.submitRevaluation();
        } else {
          this.glValidationTxnType.set('Revaluation');
          this.glValidationErrors.set(result.results || []);
          this.glValidationVisible.set(true);
        }
      }.bind(this),
      error: function(this: TransactionsComponent, err: any) {
        this.glValidating.set(false);
        this.revalDateError.set('GL validation could not be completed — submission blocked. ' + (err?.error?.error || err?.message || 'Please try again.'));
      }.bind(this)
    });
  }

  validateAndSubmitDisposal() {
    var asset = this.disposalSelectedAsset();
    if (!asset) return;
    var assetId = asset.assetRegisterItem_ID || asset.assetRegisterItemId || asset.assetId;
    this.glValidating.set(true);
    this.glValidationErrors.set([]);
    this.glValidationVisible.set(false);
    this.api.validateGlPosting({
      assetIds: [assetId],
      transactionType: 'Disposal',
      checkOffsetReserve: false
    }).subscribe({
      next: function(this: TransactionsComponent, result: any) {
        this.glValidating.set(false);
        if (result.valid) {
          this.submitDisposal();
        } else {
          this.glValidationTxnType.set('Disposal');
          this.glValidationErrors.set(result.results || []);
          this.glValidationVisible.set(true);
        }
      }.bind(this),
      error: function(this: TransactionsComponent, err: any) {
        this.glValidating.set(false);
        this.disposalError.set('GL validation could not be completed — submission blocked. ' + (err?.error?.error || err?.message || 'Please try again.'));
      }.bind(this)
    });
  }

  validateAndApproveDepreciation(scheduleId: number) {
    this.depApproveVisible.set(true);
    this.depApproveStep.set(1);
    this.glValidationErrors.set([]);
    this.glValidationVisible.set(false);
    this.approveError.set('');
    this.api.validateDepreciationScheduleGl({
      scheduleId: scheduleId
    }).subscribe({
      next: function(this: TransactionsComponent, result: any) {
        if (result.valid) {
          this.depApproveStep.set(2);
          this.approveDepSchedule(scheduleId);
        } else {
          this.depApproveVisible.set(false);
          this.depApproveStep.set(0);
          this.glValidationTxnType.set('Depreciation');
          this.glValidationErrors.set(result.results || []);
          this.glValidationVisible.set(true);
        }
      }.bind(this),
      error: function(this: TransactionsComponent, err: any) {
        this.depApproveVisible.set(false);
        this.depApproveStep.set(0);
        this.approveError.set('GL validation could not be completed — approval blocked. ' + (err?.error?.error || err?.message || 'Please try again.'));
      }.bind(this)
    });
  }

  approveDepSchedule(scheduleId: number) {
    this.approvingId.set(scheduleId);
    this.approveError.set('');
    var schedFy = '';
    var scheds = this.pendingSchedules();
    for (var si = 0; si < scheds.length; si++) {
      if (scheds[si].depreciationSchedule_ID === scheduleId) {
        schedFy = scheds[si].finYear || '';
        break;
      }
    }
    if (!schedFy) schedFy = this.getCurrentFinYear();
    var self = this;
    setTimeout(function() { if (self.depApproveStep() === 2) self.depApproveStep.set(3); }, 1500);
    setTimeout(function() { if (self.depApproveStep() === 3) self.depApproveStep.set(4); }, 4500);
    this.api.approveDepreciationBatch({
      scheduleId: scheduleId,
      finYear: schedFy,
      approvedBy: 'Administrator'
    }).subscribe({
      next: function(this: TransactionsComponent) {
        this.approvingId.set(0);
        this.loadPendingItems();
        this.refreshTransactions();
        if (this.depApproveStep() < 4) this.depApproveStep.set(4);
        var self = this;
        setTimeout(function() {
          self.depApproveStep.set(5);
          setTimeout(function() {
            self.depApproveVisible.set(false);
            self.depApproveStep.set(0);
          }, 2500);
        }, 800);
      }.bind(this),
      error: function(this: TransactionsComponent, err: any) {
        this.approvingId.set(0);
        this.depApproveVisible.set(false);
        this.depApproveStep.set(0);
        this.approveError.set('Approval failed: ' + (err?.error?.error || err?.message || 'Unknown error'));
      }.bind(this)
    });
  }

  approveRevaluation(reval: any) {
    var id = reval.Asset_RevaluationsID || reval.asset_RevaluationsID;
    this.approvingId.set(id);
    this.approveError.set('');
    this.api.approveRevaluation(id, 1).subscribe({
      next: function(this: TransactionsComponent) {
        this.approvingId.set(0);
        this.loadPendingItems();
        this.refreshTransactions();
      }.bind(this),
      error: function(this: TransactionsComponent, err: any) {
        this.approvingId.set(0);
        this.approveError.set('Revaluation approval failed: ' + (err?.error?.error || err?.error?.details || err?.message || 'Unknown error'));
      }.bind(this)
    });
  }

  rejectRevaluation(reval: any) {
    var id = reval.Asset_RevaluationsID || reval.asset_RevaluationsID;
    this.approvingId.set(id);
    this.api.rejectRevaluation(id).subscribe({
      next: function(this: TransactionsComponent) {
        this.approvingId.set(0);
        this.loadPendingItems();
      }.bind(this),
      error: function(this: TransactionsComponent) {
        this.approvingId.set(0);
      }.bind(this)
    });
  }

  approveImpairment(item: any) {
    var id = item.assetImpairment_ID || item.AssetImpairment_ID || item.id;
    this.approvingId.set(id);
    this.approveError.set('');
    this.api.approveImpairment(id, 1).subscribe({
      next: function(this: TransactionsComponent) {
        this.approvingId.set(0);
        this.loadPendingItems();
        this.refreshTransactions();
      }.bind(this),
      error: function(this: TransactionsComponent, err: any) {
        this.approvingId.set(0);
        this.approveError.set('Impairment approval failed: ' + (err?.error?.error || err?.error?.details || err?.message || 'Unknown error'));
      }.bind(this)
    });
  }

  rejectImpairment(item: any) {
    var id = item.assetImpairment_ID || item.AssetImpairment_ID || item.id;
    this.approvingId.set(id);
    this.api.rejectImpairment(id).subscribe({
      next: function(this: TransactionsComponent) {
        this.approvingId.set(0);
        this.loadPendingItems();
      }.bind(this),
      error: function(this: TransactionsComponent) {
        this.approvingId.set(0);
      }.bind(this)
    });
  }

  approveDisposal(item: any) {
    var id = item.assetDisposal_ID || item.AssetDisposal_ID || item.id;
    this.approvingId.set(id);
    this.approveError.set('');
    this.api.approveDisposal(id, 1).subscribe({
      next: function(this: TransactionsComponent) {
        this.approvingId.set(0);
        this.loadPendingItems();
        this.refreshTransactions();
      }.bind(this),
      error: function(this: TransactionsComponent, err: any) {
        this.approvingId.set(0);
        this.approveError.set('Disposal approval failed: ' + (err?.error?.error || err?.error?.details || err?.message || 'Unknown error'));
      }.bind(this)
    });
  }

  rejectDisposal(item: any) {
    var id = item.assetDisposal_ID || item.AssetDisposal_ID || item.id;
    this.approvingId.set(id);
    this.api.rejectDisposal(id).subscribe({
      next: function(this: TransactionsComponent) {
        this.approvingId.set(0);
        this.loadPendingItems();
      }.bind(this),
      error: function(this: TransactionsComponent) {
        this.approvingId.set(0);
      }.bind(this)
    });
  }

  approveImpairmentReversal(item: any) {
    var id = item.assetImpairment_ID || item.AssetImpairment_ID || item.id;
    this.approvingId.set(id);
    this.approveError.set('');
    this.api.approveImpairmentReversal(id, 1).subscribe({
      next: function(this: TransactionsComponent) {
        this.approvingId.set(0);
        this.loadPendingItems();
        this.refreshTransactions();
      }.bind(this),
      error: function(this: TransactionsComponent, err: any) {
        this.approvingId.set(0);
        this.approveError.set('Reversal approval failed: ' + (err?.error?.error || err?.error?.details || err?.message || 'Unknown error'));
      }.bind(this)
    });
  }

  rejectImpairmentReversal(item: any) {
    var id = item.assetImpairment_ID || item.AssetImpairment_ID || item.id;
    this.approvingId.set(id);
    this.api.rejectImpairmentReversal(id).subscribe({
      next: function(this: TransactionsComponent) {
        this.approvingId.set(0);
        this.loadPendingItems();
      }.bind(this),
      error: function(this: TransactionsComponent) {
        this.approvingId.set(0);
      }.bind(this)
    });
  }

  submitRefurbishment() {
    const asset = this.refurbSelectedAsset();
    if (!asset) return;
    const dateErr = this.validateTransactionDate(this.refurbForm.refurb_date);
    if (dateErr) { this.refurbDateError.set(dateErr); return; }
    var refurbDT = Number(this.refurbForm.refurb_dt) || 0;
    var refurbCT = Number(this.refurbForm.refurb_ct) || 0;
    if (refurbDT <= 0 && refurbCT <= 0) {
      this.refurbError.set('At least one of Refurbishment Debit or Credit is required');
      return;
    }
    this.submittingRefurb.set(true);
    this.refurbError.set('');

    var assetId = asset.assetRegisterItem_ID || asset.assetRegisterItemId || asset.assetId;
    var isoDate = this.toIsoDate(this.refurbForm.refurb_date);
    var refurbDepreciation = Number(this.refurbForm.refurb_depreciation) || 0;
    var refurbRevaluation = Number(this.refurbForm.refurb_revaluation) || 0;
    var refurbImpairment = Number(this.refurbForm.refurb_impairment) || 0;

    var debitPPI = this.refurbForm.debitPlanProjectItemId ? Number(this.refurbForm.debitPlanProjectItemId) : null;
    var creditPPI = this.refurbForm.creditPlanProjectItemId ? Number(this.refurbForm.creditPlanProjectItemId) : null;
    this.api.createRefurbishment({
      assetRegisterID: Number(assetId),
      refurbDate: isoDate,
      refurb_DT: refurbDT,
      refurb_CT: refurbCT,
      refurb_Depreciation: refurbDepreciation,
      refurb_Revaluation: refurbRevaluation,
      refurb_Impairment: refurbImpairment,
      debitPlanProjectItemId: debitPPI,
      creditPlanProjectItemId: creditPPI
    }).subscribe({
      next: function(this: TransactionsComponent, result: any) {
        var refurbId = result.asset_RefurbID || result.Asset_RefurbID || result.id;
        this.api.initiateWorkflow({
          entity_type: 'refurbishment',
          entity_id: String(assetId),
          data: {
            asset_id: assetId,
            asset_description: asset.description,
            refurb_id: refurbId,
            refurb_dt: refurbDT,
            refurb_ct: refurbCT,
            refurb_depreciation: refurbDepreciation,
            refurb_revaluation: refurbRevaluation,
            refurb_impairment: refurbImpairment,
            transaction_date: isoDate
          },
          mssql_reference_id: String(refurbId)
        }).subscribe({
          next: function(this: TransactionsComponent) {
            this.submittingRefurb.set(false);
            this.refurbSuccess.set(true);
            this.refurbForm = { refurb_date: '', refurb_dt: null, refurb_ct: null, refurb_depreciation: null, refurb_revaluation: null, refurb_impairment: null, debitPlanProjectItemId: null, creditPlanProjectItemId: null };
            this.clearRefurbAsset();
            this.loadPendingItems();
            this.refreshTransactions();
          }.bind(this),
          error: function(this: TransactionsComponent, err: any) {
            this.submittingRefurb.set(false);
            this.refurbError.set('Refurbishment created but workflow could not be initiated: ' + (err?.error?.error || err?.message || 'Unknown error'));
            this.loadPendingItems();
            this.refreshTransactions();
          }.bind(this)
        });
      }.bind(this),
      error: function(this: TransactionsComponent, err: any) {
        this.submittingRefurb.set(false);
        this.refurbError.set('Failed to create refurbishment: ' + (err?.error?.error || err?.message || 'Unknown error'));
      }.bind(this)
    });
  }

  validateAndSubmitRefurbishment() {
    this.submitRefurbishment();
  }

  approveRefurbishment(item: any) {
    var id = item.asset_RefurbID || item.Asset_RefurbID || item.id;
    this.approvingId.set(id);
    this.approveError.set('');
    this.api.approveRefurbishment(id, 1).subscribe({
      next: function(this: TransactionsComponent) {
        this.approvingId.set(0);
        this.loadPendingItems();
        this.refreshTransactions();
      }.bind(this),
      error: function(this: TransactionsComponent, err: any) {
        this.approvingId.set(0);
        this.approveError.set('Refurbishment approval failed: ' + (err?.error?.error || err?.error?.details || err?.message || 'Unknown error'));
      }.bind(this)
    });
  }

  rejectRefurbishment(item: any) {
    var id = item.asset_RefurbID || item.Asset_RefurbID || item.id;
    this.approvingId.set(id);
    this.api.rejectRefurbishment(id).subscribe({
      next: function(this: TransactionsComponent) {
        this.approvingId.set(0);
        this.loadPendingItems();
      }.bind(this),
      error: function(this: TransactionsComponent) {
        this.approvingId.set(0);
      }.bind(this)
    });
  }

  forceSubmitAfterValidation() {
    var txnType = this.glValidationTxnType();
    this.dismissGlValidation();
    if (txnType === 'Impairment') {
      this.submitImpairment();
    } else if (txnType === 'Revaluation') {
      this.submitRevaluation();
    } else if (txnType === 'Disposal') {
      this.submitDisposal();
    }
  }
}
