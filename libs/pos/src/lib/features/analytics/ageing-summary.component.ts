import { Component, inject, signal, computed, OnInit, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';

interface BillingPeriod {
  period_ID: number;
  periodInFinancialYear: number;
  financialYear: string;
  processingMonth: string;
  monthEndProcessed: boolean;
}

function getCurrentFinYear(): string {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  return month >= 6 ? `${year}/${year + 1}` : `${year - 1}/${year}`;
}

function getCurrentMonthName(): string {
  const months = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];
  return months[new Date().getMonth()];
}

function buildAvailableYears(currentFy: string): string[] {
  const [startYear] = currentFy.split('/').map(Number);
  const years: string[] = [];
  for (let i = 0; i < 5; i++) {
    const y = startYear - i;
    years.push(`${y}/${y + 1}`);
  }
  return years;
}

interface LookupItem { id: number; name: string; }

@Component({
  selector: 'app-ageing-summary',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ageing-summary.component.html',
  styleUrls: ['./ageing-summary.component.css']
})
export class AgeingSummaryComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  // ── Period selection ──────────────────────────────────────
  finYear = signal('');
  selectedPeriodId = signal('');
  availableYears = signal<string[]>([]);
  billingPeriods = signal<BillingPeriod[]>([]);
  periodsLoading = signal(false);

  selectedMonth = computed(() => {
    const pid = this.selectedPeriodId();
    const period = this.billingPeriods().find(p => String(p.period_ID) === pid);
    return period?.processingMonth ?? '';
  });

  periodId = computed(() => this.selectedPeriodId());

  // ── Basic filters ─────────────────────────────────────────
  accountId = signal('');
  reportType = signal('2');
  balanceType = signal('1');

  // ── Advanced filters ──────────────────────────────────────
  billingCycle = signal('0');
  accountGroupingId = signal('0');
  townId = signal('0');
  suburbId = signal('0');
  electionWardId = signal('0');
  serviceStatusId = signal('0');
  doServiceStatusAndTariff = signal('0');
  showAdvanced = signal(false);

  // ── Lookup data ───────────────────────────────────────────
  billingCycles = signal<LookupItem[]>([]);
  accountGroupings = signal<LookupItem[]>([]);
  towns = signal<LookupItem[]>([]);
  suburbs = signal<LookupItem[]>([]);
  wards = signal<LookupItem[]>([]);
  lookupsLoading = signal(false);

  readonly serviceStatuses: LookupItem[] = [
    { id: 0, name: 'All statuses' },
    { id: 1, name: 'Active' },
    { id: 2, name: 'Inactive' },
    { id: 3, name: 'Suspended' },
    { id: 4, name: 'Closed' },
  ];

  // ── Results ───────────────────────────────────────────────
  results = signal<any[]>([]);
  columns = signal<string[]>([]);
  loading = signal(false);
  error = signal('');
  hasSearched = signal(false);

  // ── Loading progress ────────────────────────────────────
  elapsedSeconds = signal(0);
  private loadingTimer: any = null;
  loadingMessage = computed(() => {
    const s = this.elapsedSeconds();
    if (s < 5) return 'Connecting to Platinum API...';
    if (s < 15) return 'Querying ageing data...';
    if (s < 30) return 'Processing records — this may take a moment for large datasets...';
    if (s < 60) return 'Still working — large queries can take up to 2 minutes...';
    return `Still loading (${s}s elapsed) — please wait...`;
  });
  progressPercent = computed(() => {
    const maxTime = this.accountId() ? 30 : 120;
    return Math.min(95, (this.elapsedSeconds() / maxTime) * 100);
  });

  reportTypeOptions = [
    { value: '1', label: 'Service Detail (per billing line)' },
    { value: '2', label: 'Account Total (one row per account)' },
  ];

  balanceTypeOptions = [
    { value: '1', label: 'All accounts' },
    { value: '2', label: 'Debit only (balance > 0)' },
    { value: '3', label: 'Credit only (balance < 0)' },
  ];

  ngOnInit(): void {
    const userFy = (this.auth.user() as any)?.finYear || getCurrentFinYear();
    const years = buildAvailableYears(userFy);
    this.availableYears.set(years);
    this.finYear.set(years[0]);
    this.loadBillingPeriods(years[0]);
    this.loadLookups();
  }

  onFinYearChange(fy: string): void {
    this.finYear.set(fy);
    this.selectedPeriodId.set('');
    this.billingPeriods.set([]);
    this.loadBillingPeriods(fy);
  }

  loadBillingPeriods(finYear: string): void {
    this.periodsLoading.set(true);
    this.http.get<BillingPeriod[]>('/api/analytics/billing-periods', { params: { finYear } }).subscribe({
      next: (periods) => {
        const list = Array.isArray(periods) ? periods : [];
        this.billingPeriods.set(list);
        this.periodsLoading.set(false);
        const currentMonth = getCurrentMonthName();
        const match = list.find(p => p.processingMonth === currentMonth);
        if (match) {
          this.selectedPeriodId.set(String(match.period_ID));
        } else if (list.length > 0) {
          this.selectedPeriodId.set(String(list[list.length - 1].period_ID));
        }
      },
      error: () => {
        this.billingPeriods.set([]);
        this.periodsLoading.set(false);
      }
    });
  }

  loadLookups(): void {
    this.lookupsLoading.set(true);
    this.http.get<LookupItem[]>('/api/analytics/billing-cycles').subscribe({
      next: d => this.billingCycles.set(Array.isArray(d) ? d : []),
      error: () => this.billingCycles.set([])
    });
    this.http.get<LookupItem[]>('/api/analytics/account-groupings').subscribe({
      next: d => this.accountGroupings.set(Array.isArray(d) ? d : []),
      error: () => this.accountGroupings.set([])
    });
    this.http.get<LookupItem[]>('/api/analytics/towns').subscribe({
      next: d => this.towns.set(Array.isArray(d) ? d : []),
      error: () => this.towns.set([])
    });
    this.http.get<LookupItem[]>('/api/analytics/wards').subscribe({
      next: d => { this.wards.set(Array.isArray(d) ? d : []); this.lookupsLoading.set(false); },
      error: () => { this.wards.set([]); this.lookupsLoading.set(false); }
    });
  }

  onTownChange(id: string): void {
    this.townId.set(id);
    this.suburbId.set('0');
    this.suburbs.set([]);
    if (id && id !== '0') {
      this.http.get<LookupItem[]>('/api/analytics/suburbs', { params: { townId: id } }).subscribe({
        next: d => this.suburbs.set(Array.isArray(d) ? d : []),
        error: () => this.suburbs.set([])
      });
    }
  }

  get periodValid(): boolean {
    return this.selectedPeriodId() !== '';
  }

  private startLoadingTimer(): void {
    this.elapsedSeconds.set(0);
    this.stopLoadingTimer();
    this.loadingTimer = setInterval(() => {
      this.elapsedSeconds.update(s => s + 1);
    }, 1000);
  }

  private stopLoadingTimer(): void {
    if (this.loadingTimer) {
      clearInterval(this.loadingTimer);
      this.loadingTimer = null;
    }
  }

  ngOnDestroy(): void {
    this.stopLoadingTimer();
  }

  runReport(): void {
    if (!this.periodValid) {
      this.error.set('Please select a financial year and billing period.');
      return;
    }
    this.error.set('');
    this.loading.set(true);
    this.hasSearched.set(true);
    this.results.set([]);
    this.columns.set([]);
    this.startLoadingTimer();

    const params: Record<string, string> = {
      periodId: this.periodId(),
      reportType: this.reportType(),
      balanceType: this.balanceType(),
    };
    if (this.accountId()) params['accountId'] = this.accountId();
    if (this.billingCycle() && this.billingCycle() !== '0') params['billingCycle'] = this.billingCycle();
    if (this.accountGroupingId() && this.accountGroupingId() !== '0') params['accountGroupingId'] = this.accountGroupingId();
    if (this.townId() && this.townId() !== '0') params['townId'] = this.townId();
    if (this.suburbId() && this.suburbId() !== '0') params['suburbId'] = this.suburbId();
    if (this.electionWardId() && this.electionWardId() !== '0') params['electionWardId'] = this.electionWardId();
    if (this.serviceStatusId() && this.serviceStatusId() !== '0') params['serviceStatusId'] = this.serviceStatusId();
    if (this.doServiceStatusAndTariff() === '1') params['doServiceStatusAndTariff'] = '1';

    const qs = new URLSearchParams(params).toString();
    this.http.get<any>(`/api/analytics/ageing-summary?${qs}`).subscribe({
      next: (res) => {
        this.stopLoadingTimer();
        const rows: any[] = Array.isArray(res) ? res : (res?.data ?? res?.items ?? res?.result ?? []);
        if (rows.length > 0) this.columns.set(Object.keys(rows[0]));
        this.results.set(rows);
        this.loading.set(false);
      },
      error: (err) => {
        this.stopLoadingTimer();
        this.error.set(err?.error?.message ?? 'Failed to load ageing summary. Please try again.');
        this.loading.set(false);
      }
    });
  }

  clearFilters(): void {
    const userFy = (this.auth.user() as any)?.finYear || getCurrentFinYear();
    const years = buildAvailableYears(userFy);
    this.finYear.set(years[0]);
    this.loadBillingPeriods(years[0]);
    this.accountId.set('');
    this.reportType.set('2');
    this.balanceType.set('1');
    this.billingCycle.set('0');
    this.accountGroupingId.set('0');
    this.townId.set('0');
    this.suburbId.set('0');
    this.suburbs.set([]);
    this.electionWardId.set('0');
    this.serviceStatusId.set('0');
    this.doServiceStatusAndTariff.set('0');
    this.results.set([]);
    this.columns.set([]);
    this.hasSearched.set(false);
    this.error.set('');
  }

  hasAdvancedFilters(): boolean {
    return this.billingCycle() !== '0' || this.accountGroupingId() !== '0' ||
           this.townId() !== '0' || this.suburbId() !== '0' ||
           this.electionWardId() !== '0' || this.serviceStatusId() !== '0' ||
           this.doServiceStatusAndTariff() === '1';
  }

  formatCell(value: any): string {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'number') {
      if (Number.isInteger(value) && Math.abs(value) < 1_000_000_000 && String(value).length <= 9) {
        return value.toLocaleString('en-ZA');
      }
      return value.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
      }
    }
    return String(value);
  }

  isCurrencyColumn(col: string): boolean {
    const lc = col.toLowerCase();
    const nonCurrencyFields = ['accountid','accountsubno','nameid','accountname','nametype',
      'accountgroup','paymentgroup','propertycategorydesc','propertytypeusedesc','townname',
      'suburbname','warddescription','ntsubgroupcode','servicedesc','servicedescription',
      'servicestatus','tariffcode','tariffdesc','attpstatus','oldaccountcode','accountstatus'];
    if (nonCurrencyFields.includes(lc)) return false;
    const currencyKeys = ['amt','amount','balance','days','total','outstanding',
                          'credit','debit','value','current','over150','deposit','newcharge',
                          'vat','int'];
    return currencyKeys.some(k => lc.includes(k));
  }

  formatColumnHeader(col: string): string {
    const friendlyNames: Record<string, string> = {
      accountId: 'Account No.',
      oldAccountCode: 'Old Account',
      accountStatus: 'Status',
      accountSubNo: 'Sub No.',
      nameID: 'Name ID',
      accountName: 'Account Name',
      nameType: 'Name Type',
      accountGroup: 'Account Group',
      paymentGroup: 'Payment Group',
      propertyCategoryDesc: 'Property Category',
      propertyTypeUseDesc: 'Property Type',
      townName: 'Town',
      suburbName: 'Suburb',
      wardDescription: 'Ward',
      ntSubGroupCode: 'Sub Group',
      serviceDesc: 'Service',
      serviceDescription: 'Service',
      serviceStatus: 'Service Status',
      tariffCode: 'Tariff Code',
      tariffDesc: 'Tariff',
      attpStatus: 'ATTP Status',
      balance: 'Balance',
      balanceAmount: 'Balance Amount',
      balanceVAT: 'Balance VAT',
      balanceInterest: 'Balance Interest',
      days0Amt: 'Current Amt',
      days0Vat: 'Current VAT',
      days0Int: 'Current Int',
      days30Amt: '30 Days Amt',
      days30Vat: '30 Days VAT',
      days30Int: '30 Days Int',
      days60Amt: '60 Days Amt',
      days60Vat: '60 Days VAT',
      days60Int: '60 Days Int',
      days90Amt: '90 Days Amt',
      days90Vat: '90 Days VAT',
      days90Int: '90 Days Int',
      days120Amt: '120 Days Amt',
      days120Vat: '120 Days VAT',
      days120Int: '120 Days Int',
      days150Amt: '150 Days Amt',
      days150Vat: '150 Days VAT',
      days150Int: '150 Days Int',
      'days180P_Amt': '180+ Days Amt',
      'days180P_Vat': '180+ Days VAT',
      'days180P_Int': '180+ Days Int',
      current: 'Current',
      days30: '30 Days',
      days60: '60 Days',
      days90: '90 Days',
      days120: '120 Days',
      days150: '150 Days',
      over150: '150+ Days',
      totalOutstanding: 'Total Outstanding',
      deposit: 'Deposit',
      newCharge: 'New Charge',
    };
    if (friendlyNames[col]) return friendlyNames[col];
    return col
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/\bAmt\b/gi, 'Amount')
      .replace(/\bNo\b/g, 'No.')
      .trim()
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  exportCsv(): void {
    const cols = this.columns();
    const rows = this.results();
    if (!rows.length) return;
    const header = cols.map(c => `"${this.formatColumnHeader(c)}"`).join(',');
    const body = rows.map(row =>
      cols.map(c => `"${this.formatCell(row[c]).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    const blob = new Blob([`${header}\n${body}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ageing-summary-${this.periodId()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }
}
