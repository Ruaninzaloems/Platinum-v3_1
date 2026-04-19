import { Component, signal, computed, OnInit, OnDestroy, HostListener, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { formatFileSize, formatDate, getFinancialYearList } from '../../../services/format.service';
import { getStatusColor } from '../../../services/validation.service';
import type { Section129Config, Section129Run, Section129RunFile } from '../../../models/debt.models';
import type { HandoverOption, DistributionType } from '../../../models/debt.models';

type PageStep = 'configure' | 'previewing' | 'review' | 'generating' | 'done';

export interface RunAccount {
  accountId: number;
  accountNumber: string;
  accountName: string;
  outstandingAmount: number;
  billingCycle?: string;
  ageingRange?: string;
  selected: boolean;
  exclusionReason?: string;
  email?: string;
  cellNumber?: string;
  allEmails?: string[];
  allMobiles?: string[];
  hasEmail: boolean;
  hasCell: boolean;
  channel: DistributionType;
}

@Component({
  selector: 'app-section129-notices',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './section129-notices.component.html',
  styleUrl: './section129-notices.component.css'
})
export class Section129NoticesComponent implements OnInit, OnDestroy {
  private el = inject(ElementRef);

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.el.nativeElement.contains(event.target)) {
      this.closeAllDropdowns();
    }
    const target = event.target as HTMLElement;
    if (!target.closest('.multi-select-wrap') && !target.closest('.suburb-wrap') && !target.closest('.town-wrap')) {
      this.closeAllDropdowns();
    }
  }

  closeAllDropdowns(): void {
    this.townDropdownOpen = false; this.townSearchText = '';
    this.suburbDropdownOpen = false; this.suburbSearchText = '';
    this.propCatDropdownOpen = false; this.propCatSearchText = '';
    this.propTypeDropdownOpen = false; this.propTypeSearchText = '';
    this.accTypeDropdownOpen = false; this.accTypeSearchText = '';
    this.personTypeDropdownOpen = false; this.personTypeSearchText = '';
  }

  // ── page state ──────────────────────────────────────────────────────────
  step: PageStep = 'configure';
  config = signal<Section129Config | null>(null);
  configLoading = signal(true);

  // ── top selectors (always visible) ────────────────────────────────────
  finYear: string;
  finMonth: string;
  handoverOption: HandoverOption = 'bulk';
  finYears: string[] = [];
  months = [
    { value: '1', label: 'January' }, { value: '2', label: 'February' }, { value: '3', label: 'March' },
    { value: '4', label: 'April' }, { value: '5', label: 'May' }, { value: '6', label: 'June' },
    { value: '7', label: 'July' }, { value: '8', label: 'August' }, { value: '9', label: 'September' },
    { value: '10', label: 'October' }, { value: '11', label: 'November' }, { value: '12', label: 'December' },
  ];

  // ── configure step – lookup data ──────────────────────────────────────
  billingCycles: { id: string; name: string }[] = [];
  towns: { id: string; name: string }[] = [];
  suburbs: { id: string; name: string }[] = [];
  suburbsLoading = false;
  private suburbCache = new Map<string, { id: string; name: string }[]>();
  selectedSuburbs: { id: string; name: string }[] = [];
  suburbMode: 'include' | 'exclude' = 'include';
  suburbDropdownOpen = false;
  suburbSearchText = '';
  propertyCategories: { id: string; name: string }[] = [];
  propertyTypesOfUse: { id: string; name: string }[] = [];
  accountTypes: { id: string; name: string }[] = [];
  personTypes: { id: string; name: string }[] = [];
  ageingRanges: { id: string; name: string }[] = [];
  expandedRunIds = new Set<number>();

  // ── configure step – filter values ────────────────────────────────────
  accountNumber = '';
  billingCycle = '';
  ageing = '';

  // ── town multi-select ────────────────────────────────────────────────
  selectedTowns: { id: string; name: string }[] = [];
  townDropdownOpen = false;
  townSearchText = '';

  // ── multi-select filter selections ────────────────────────────────────
  selectedPropertyCategories: { id: string; name: string }[] = [];
  propCatDropdownOpen = false;
  propCatSearchText = '';
  selectedPropertyTypesOfUse: { id: string; name: string }[] = [];
  propTypeDropdownOpen = false;
  propTypeSearchText = '';
  selectedAccountTypes: { id: string; name: string }[] = [];
  accTypeDropdownOpen = false;
  accTypeSearchText = '';
  selectedPersonTypes: { id: string; name: string }[] = [];
  personTypeDropdownOpen = false;
  personTypeSearchText = '';
  amountGreaterThan = '';
  includeIndigents = false;
  includePensioners = false;
  excludeDepositBalances = false;

  // ── configure step – shared contact / distribution ─────────────────────
  contactPerson = '';
  contactPhone = '';
  contactEmail = '';
  distributionType: DistributionType = 'email';
  mustEmailBePrinted = false;

  // ── configure step – validation ────────────────────────────────────────
  showValidation = false;

  get canPreview(): boolean {
    if (!this.finYear || !this.finMonth) return false;
    if (!this.config()) return false;
    if (this.handoverOption === 'account') return !!this.accountNumber.trim();
    return !!this.billingCycle;
  }

  get missingFinYear(): boolean { return this.showValidation && !this.finYear; }
  get missingFinMonth(): boolean { return this.showValidation && !this.finMonth; }
  get currentMonthLabel(): string {
    const m = this.months.find(m => m.value === this.finMonth);
    return m ? m.label : this.finMonth;
  }
  get missingBillingCycle(): boolean { return this.showValidation && this.handoverOption !== 'account' && !this.billingCycle; }
  get missingAccountNumber(): boolean { return this.showValidation && this.handoverOption === 'account' && !this.accountNumber.trim(); }
  get missingConfig(): boolean { return this.showValidation && !this.config(); }

  // ── previewing / generating step ──────────────────────────────────────
  activeRunId: number | null = null;
  pollProgress = signal<{ statusDescription: string; progress: number; completedAccounts: number; totalAccounts: number } | null>(null);
  private progressInterval: ReturnType<typeof setInterval> | null = null;
  elapsedSeconds = signal(0);
  private elapsedTimer: ReturnType<typeof setInterval> | null = null;

  // ── review step ────────────────────────────────────────────────────────
  reviewAccounts = signal<RunAccount[]>([]);
  accountsLoading = signal(false);
  accountSearchText = '';
  namesFetching = signal(false);
  private nameCache = new Map<number, string>();
  contactsEnriching = signal(false);
  contactsEnrichProgress = signal('');

  // ── applied filter snapshot (captured at handlePreview time) ─────────────
  appliedRunParams: {
    billingCycleName: string;
    towns: string; suburbs: string; suburbMode: 'include' | 'exclude'; propertyCategory: string;
    accountType: string; typeOfPerson: string;
    ageing: string; amountGreaterThan: number | null;
    includeIndigents: boolean; includePensioners: boolean; excludeDepositBalances: boolean;
    clientFiltered: number;
  } | null = null;

  // ── review grid pagination ──────────────────────────────────────────────
  accPage = 1;
  accPageSize = 50;
  readonly ACC_PAGE_SIZES = [25, 50, 100, 200, 300];

  get filteredAccounts(): RunAccount[] {
    const q = this.accountSearchText.toLowerCase().trim();
    if (!q) return this.reviewAccounts();
    return this.reviewAccounts().filter(a =>
      a.accountNumber.toLowerCase().includes(q) ||
      a.accountName.toLowerCase().includes(q)
    );
  }

  get pagedAccounts(): RunAccount[] {
    const start = (this.accPage - 1) * this.accPageSize;
    return this.filteredAccounts.slice(start, start + this.accPageSize);
  }

  get accTotalPages(): number {
    return Math.max(1, Math.ceil(this.filteredAccounts.length / this.accPageSize));
  }

  get accPageStart(): number { return (this.accPage - 1) * this.accPageSize + 1; }
  get accPageEnd(): number { return Math.min(this.accPage * this.accPageSize, this.filteredAccounts.length); }

  accGoTo(page: number): void {
    this.accPage = Math.max(1, Math.min(page, this.accTotalPages));
    this.fetchNamesForCurrentPage();
  }

  setAccPageSize(n: number): void {
    this.accPageSize = n;
    this.accPage = 1;
    this.fetchNamesForCurrentPage();
  }

  onAccountSearch(): void {
    this.accPage = 1;
    this.fetchNamesForCurrentPage();
  }

  private async fetchNamesForCurrentPage(): Promise<void> {
    const page = this.pagedAccounts;
    const toFetch = page.filter(a => a.accountId > 0 && !this.nameCache.has(a.accountId) && !a.accountName);
    if (toFetch.length === 0) return;
    this.namesFetching.set(true);
    try {
      const result = await firstValueFrom(
        this.api.post('/api/platinum/billing-debt/section129-account-names', {
          accounts: toFetch.map(a => ({ detailId: a.accountId, accountId: a.accountId, accountNo: a.accountNumber }))
        })
      );
      if (Array.isArray(result)) {
        let hasNew = false;
        for (const entry of result) {
          if (entry.name && entry.detailId) {
            this.nameCache.set(entry.detailId, entry.name);
            hasNew = true;
          }
        }
        if (hasNew) {
          this.reviewAccounts.update(accounts =>
            accounts.map(a => {
              const cached = this.nameCache.get(a.accountId);
              return (cached && !a.accountName) ? { ...a, accountName: cached } : a;
            })
          );
        }
      }
    } catch { /* silent — names are supplemental */ }
    finally { this.namesFetching.set(false); }
  }

  private isValidPhone(val: any): boolean {
    if (typeof val !== 'string') return false;
    const cleaned = val.replace(/[\s\-()]/g, '');
    if (/^\+27\d{9}$/.test(cleaned)) return true;
    if (/^27\d{9}$/.test(cleaned)) return true;
    if (/^0\d{9}$/.test(cleaned)) return true;
    return false;
  }

  private isMobileNumber(val: any): boolean {
    if (typeof val !== 'string') return false;
    const cleaned = val.replace(/[\s\-()]/g, '');
    if (/^0[6-8]\d{8}$/.test(cleaned)) return true;
    if (/^\+27[6-8]\d{8}$/.test(cleaned)) return true;
    if (/^27[6-8]\d{8}$/.test(cleaned)) return true;
    return false;
  }

  private isValidEmail(val: any): boolean {
    if (typeof val !== 'string') return false;
    return val.trim().length > 3 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  }

  private normalizeMobile(val: string): string {
    const cleaned = val.replace(/[\s\-()]/g, '');
    if (/^\+27\d{9}$/.test(cleaned)) return '0' + cleaned.slice(3);
    if (/^27\d{9}$/.test(cleaned)) return '0' + cleaned.slice(2);
    return cleaned;
  }

  private extractContactsFromRecord(rec: any): { emails: string[]; mobiles: string[] } {
    const emailSet = new Set<string>();
    const mobileSet = new Set<string>();
    if (!rec || typeof rec !== 'object') return { emails: [], mobiles: [] };
    const emailFields = ['email', 'eMail', 'emailAddress', 'Email'];
    const phoneFields = ['tel_Mobile', 'tel_Home', 'tel_Work', 'cellphone', 'cellPhone', 'mobile', 'mobileNumber', 'CellPhone', 'telephone', 'workPhone', 'homePhone', 'phone', 'Phone', 'telNo'];
    for (const f of emailFields) {
      if (this.isValidEmail(rec[f])) emailSet.add(rec[f].trim().toLowerCase());
    }
    for (const f of phoneFields) {
      if (this.isMobileNumber(rec[f])) {
        mobileSet.add(this.normalizeMobile(rec[f].trim()));
      }
    }
    return { emails: Array.from(emailSet), mobiles: Array.from(mobileSet) };
  }

  async enrichAccountContacts(): Promise<void> {
    const accounts = this.reviewAccounts();
    if (accounts.length === 0) return;
    const accountIds = accounts.map(a => a.accountId).filter(id => id > 0);
    if (accountIds.length === 0) return;

    this.contactsEnriching.set(true);
    const BATCH_SIZE = 50;
    const totalBatches = Math.ceil(accountIds.length / BATCH_SIZE);
    const contactMap = new Map<number, { emails: string[]; mobiles: string[] }>();

    try {
      for (let i = 0; i < totalBatches; i++) {
        const batch = accountIds.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
        this.contactsEnrichProgress.set(`Loading contacts: batch ${i + 1}/${totalBatches} (${Math.min((i + 1) * BATCH_SIZE, accountIds.length)}/${accountIds.length} accounts)`);
        try {
          const results: any[] = await firstValueFrom(
            this.api.post('/api/platinum/billing-debt/batch-contact-details', { accountIds: batch })
          );
          for (const item of (results || [])) {
            const { emails: cEmails, mobiles: cMobiles } = this.extractContactsFromRecord(item?.contact);
            const allEmails = new Set(cEmails);
            const allMobiles = new Set(cMobiles);
            if (Array.isArray(item?.additionalEmails)) {
              for (const ae of item.additionalEmails) {
                const addr = ae?.emailAdress ?? ae?.emailAddress ?? ae?.email ?? '';
                if (this.isValidEmail(addr)) allEmails.add(addr.trim().toLowerCase());
              }
            }
            contactMap.set(item.accountId, { emails: Array.from(allEmails), mobiles: Array.from(allMobiles) });
          }
        } catch (batchErr) {
          console.warn(`[section129] Contact enrichment batch ${i + 1} failed:`, batchErr);
        }
      }
      const defaultChannel = this.distributionType;
      this.reviewAccounts.update(accs => accs.map(a => {
        const contacts = contactMap.get(a.accountId);
        if (!contacts) return a;
        const allEmails = contacts.emails;
        const allMobiles = contacts.mobiles;
        const email = allEmails[0] || a.email || '';
        const cellNumber = allMobiles[0] || a.cellNumber || '';
        const hasEmail = allEmails.length > 0;
        const hasCell = allMobiles.length > 0;
        let channel = a.channel;
        if (channel === 'print' || !a.hasEmail && !a.hasCell) {
          if (defaultChannel === 'email' && hasEmail) channel = 'email';
          else if ((defaultChannel === 'sms' || defaultChannel === 'whatsapp') && hasCell) channel = defaultChannel;
          else if (defaultChannel === 'all') channel = hasEmail ? 'email' : hasCell ? 'sms' : 'print';
        }
        return { ...a, email, cellNumber, allEmails, allMobiles, hasEmail, hasCell, channel };
      }));
      const enriched = contactMap.size;
      const withPhone = Array.from(contactMap.values()).filter(c => c.mobiles.length > 0).length;
      const withEmail = Array.from(contactMap.values()).filter(c => c.emails.length > 0).length;
      this.contactsEnrichProgress.set(`Contact enrichment complete: ${withPhone} with phone, ${withEmail} with email out of ${enriched} accounts`);
    } catch (err) {
      console.error('[section129] Contact enrichment failed:', err);
      this.contactsEnrichProgress.set('Contact enrichment failed — contact details may be incomplete');
    } finally {
      this.contactsEnriching.set(false);
    }
  }

  get selectedCount(): number { return this.reviewAccounts().filter(a => a.selected).length; }
  get totalCount(): number { return this.reviewAccounts().length; }
  get selectedTotal(): number {
    return this.reviewAccounts().filter(a => a.selected).reduce((s, a) => s + (a.outstandingAmount || 0), 0);
  }

  // Channel breakdown counts (selected accounts only)
  get emailCount(): number { return this.reviewAccounts().filter(a => a.selected && a.channel === 'email').length; }
  get smsCount(): number { return this.reviewAccounts().filter(a => a.selected && a.channel === 'sms').length; }
  get whatsappCount(): number { return this.reviewAccounts().filter(a => a.selected && a.channel === 'whatsapp').length; }
  get printCount(): number { return this.reviewAccounts().filter(a => a.selected && a.channel === 'print').length; }
  get noContactCount(): number {
    return this.reviewAccounts().filter(a => a.selected && (
      (a.channel === 'email' && !a.hasEmail) ||
      ((a.channel === 'sms' || a.channel === 'whatsapp') && !a.hasCell)
    )).length;
  }

  // Set all SELECTED accounts to a channel, falling back to Print if contact info missing
  setAllChannels(type: DistributionType): void {
    this.distributionType = type;
    const updated = this.reviewAccounts().map(a => {
      if (!a.selected) return a;
      let ch: DistributionType = type;
      if (type === 'email' && !a.hasEmail) ch = 'print';
      if ((type === 'sms' || type === 'whatsapp') && !a.hasCell) ch = 'print';
      return { ...a, channel: ch };
    });
    this.reviewAccounts.set(updated);
  }

  // Set a single account's channel
  setAccountChannel(accountId: number, type: DistributionType, event: Event): void {
    event.stopPropagation();
    const updated = this.reviewAccounts().map(a =>
      a.accountId === accountId ? { ...a, channel: type } : a
    );
    this.reviewAccounts.set(updated);
  }

  // ── done step ──────────────────────────────────────────────────────────
  doneRunId: number | null = null;
  doneFiles = signal<Section129RunFile[]>([]);
  doneFilesLoading = signal(false);
  downloadingFileId: number | null = null;
  doneSummary: { accountCount: number; totalAmount: number } | null = null;
  /** true when the done screen follows a Trial Review submit (accounts saved, no PDFs yet) */
  doneIsTrialComplete = false;

  // ── run history (always at bottom) ────────────────────────────────────
  runs = signal<Section129Run[]>([]);
  runsLoading = signal(true);
  gridPage = 1;
  gridPageSize = 10;
  NON_DELETABLE_STATUSES = ['Approved', 'Authorized', 'Final Running', 'Final Complete'];
  finalRunningId: number | null = null;
  deleteConfirmRun: Section129Run | null = null;
  deletePhase: 'confirm' | 'deleting' | 'done' = 'confirm';
  deleteCurrentStep = 0;
  deleteSteps = [
    { label: 'Verifying run can be deleted', detail: 'Checking run status and permissions' },
    { label: 'Removing associated notice files', detail: 'Deleting generated PDF/print notice files' },
    { label: 'Removing account records', detail: 'Clearing linked account and ageing entries' },
    { label: 'Deleting run record', detail: 'Removing the run header from the system' },
  ];
  private deleteStepTimer: ReturnType<typeof setInterval> | null = null;
  historyFileModalOpen = false;
  historyFileModalRunId: number | null = null;
  historyFiles: Section129RunFile[] = [];
  historyFilesLoading = false;

  constructor(private api: ApiService, private toast: ToastService) {
    const now = new Date();
    const year = now.getMonth() >= 6 ? now.getFullYear() + 1 : now.getFullYear();
    this.finYear = `${year - 1}/${year}`;
    this.finMonth = String(now.getMonth() + 1);
    this.finYears = getFinancialYearList(5);
  }

  ngOnInit(): void { this.loadPageData(); }
  ngOnDestroy(): void { this.stopPolling(); this.stopElapsedTimer(); }

  get formattedElapsed(): string {
    const s = this.elapsedSeconds();
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
  }

  private startElapsedTimer(): void {
    this.stopElapsedTimer();
    this.elapsedSeconds.set(0);
    this.elapsedTimer = setInterval(() => this.elapsedSeconds.update(v => v + 1), 1000);
  }

  private stopElapsedTimer(): void {
    if (this.elapsedTimer) { clearInterval(this.elapsedTimer); this.elapsedTimer = null; }
  }

  async loadPageData(): Promise<void> {
    const results = await Promise.allSettled([
      firstValueFrom(this.api.get('/api/platinum/billing-debt/section129-config', { finYear: this.finYear })),
      firstValueFrom(this.api.get('/api/platinum/billing-debt/section129-runs', { finYear: this.finYear })),
      firstValueFrom(this.api.get('/api/platinum/billing-debt/billing-cycles')),
      firstValueFrom(this.api.get('/api/platinum/billing-debt/towns')),
      firstValueFrom(this.api.get('/api/platinum/billing-debt/property-categories')),
      firstValueFrom(this.api.get('/api/platinum/billing-debt/account-types')),
      firstValueFrom(this.api.get('/api/platinum/billing-debt/person-types')),
      firstValueFrom(this.api.get('/api/platinum/billing-debt/ageing-ranges')),
      firstValueFrom(this.api.get('/api/platinum/billing-debt/property-types-of-use')),
    ]);
    if (results[0].status === 'fulfilled') {
      this.config.set(results[0].value);
      if (!results[0].value?.activateRotation && this.handoverOption === 'rotation') this.handoverOption = 'bulk';
      this.applyConfigDefaults(results[0].value);
    }
    this.configLoading.set(false);
    if (results[1].status === 'fulfilled') { this.runs.set(results[1].value || []); this.enrichRunAmounts(); }
    this.runsLoading.set(false);
    if (results[2].status === 'fulfilled') this.billingCycles = results[2].value || [];
    if (results[3].status === 'fulfilled') {
      this.towns = results[3].value || [];
    }
    if (results[4].status === 'fulfilled') this.propertyCategories = results[4].value || [];
    if (results[5].status === 'fulfilled') this.accountTypes = results[5].value || [];
    if (results[6].status === 'fulfilled') this.personTypes = results[6].value || [];
    if (results[7].status === 'fulfilled') this.ageingRanges = results[7].value || [];
    if (results[8].status === 'fulfilled') this.propertyTypesOfUse = results[8].value || [];
  }

  async refreshRuns(): Promise<void> {
    try {
      const data = await firstValueFrom(this.api.get('/api/platinum/billing-debt/section129-runs', { finYear: this.finYear }));
      this.runs.set(data || []);
      this.enrichRunAmounts();
    } catch {}
  }

  /** Lazily fetches totalAmount for runs where Platinum returned 0.
   *  Runs all summaries in parallel and patches the signal as each resolves. */
  private enrichRunAmounts(): void {
    const toEnrich = this.runs().filter(r => (r.totalAmount ?? 0) === 0 && r.totalAccounts > 0);
    for (const run of toEnrich) {
      this.api.get('/api/platinum/billing-debt/section129-run-summary', { runId: String(run.runId) })
        .subscribe({
          next: (summary: any) => {
            if (!summary || typeof summary.totalAmount !== 'number') return;
            this.runs.update(list => list.map(r =>
              r.runId === run.runId ? { ...r, totalAmount: summary.totalAmount } : r
            ));
          },
          error: () => {}
        });
    }
  }

  async onFinYearChange(): Promise<void> {
    this.configLoading.set(true);
    this.config.set(null);
    const [cfg, runs] = await Promise.allSettled([
      firstValueFrom(this.api.get('/api/platinum/billing-debt/section129-config', { finYear: this.finYear })),
      firstValueFrom(this.api.get('/api/platinum/billing-debt/section129-runs', { finYear: this.finYear })),
    ]);
    if (cfg.status === 'fulfilled') {
      this.config.set(cfg.value);
      if (!cfg.value?.activateRotation && this.handoverOption === 'rotation') this.handoverOption = 'bulk';
      this.applyConfigDefaults(cfg.value);
    }
    this.configLoading.set(false);
    if (runs.status === 'fulfilled') { this.runs.set(runs.value || []); this.enrichRunAmounts(); }
    this.runsLoading.set(false);
  }

  private applyConfigDefaults(cfg: Section129Config | null): void {
    if (!cfg) return;
    if (cfg.includeIndigents != null) this.includeIndigents = cfg.includeIndigents;
    if (cfg.includePensioners != null) this.includePensioners = cfg.includePensioners;
    if (cfg.excludeDepositBalances != null) this.excludeDepositBalances = cfg.excludeDepositBalances;
    if (cfg.minimumAmount != null && !this.amountGreaterThan) {
      this.amountGreaterThan = String(cfg.minimumAmount);
    }
  }

  // ── STEP 1 → 2: Preview (Trial Review run) ────────────────────────────
  async handlePreview(): Promise<void> {
    this.showValidation = true;
    if (!this.canPreview) {
      if (!this.config()) {
        this.toast.show('Section 129 configuration has not loaded. Please wait or refresh the page.', 'error');
      } else if (!this.finYear || !this.finMonth) {
        this.toast.show('Financial year and month are required.', 'error');
      } else if (this.handoverOption === 'account') {
        this.toast.show('Please enter an account number.', 'error');
      } else {
        this.toast.show('Billing cycle is required before you can preview accounts.', 'error');
      }
      return;
    }

    this.step = 'previewing';
    this.pollProgress.set(null);
    this.appliedRunParams = null;
    this.startElapsedTimer();

    try {
      const amountGT = this.amountGreaterThan ? parseFloat(this.amountGreaterThan) : null;

      const cfg = this.config();
      // Always send explicit values — never omit a filter param (Platinum must know what was requested)
      const params: any = {
        finYear: this.finYear,
        finMonth: this.finMonth,
        runType: 'trial-review',
        handoverOption: this.handoverOption,
        contactPerson: this.contactPerson || null,
        phone: this.contactPhone || null,
        email: this.contactEmail || null,
        distributionType: this.distributionType,
        mustEmailBePrinted: this.distributionType === 'email' ? this.mustEmailBePrinted : false,
        configId: cfg?.configId ?? (cfg as any)?.id ?? null,
        lapseDays: cfg?.lapseDays ?? null,
        minimumAmount: cfg?.minimumAmount ?? null,
        adminFees: cfg?.adminFees ?? null,
        interestRate: cfg?.interestRate ?? null,
        noticesPerFile: cfg?.noticesPerFile ?? null,
        section129TemplateId: (cfg as any)?.section129TemplateId ?? cfg?.demandLetterTemplateId ?? null,
        smsTemplateId: (cfg as any)?.smsTemplateId ?? cfg?.smsTemplateId ?? null,
      };

      if (this.handoverOption === 'account') {
        params.accountNumber = this.accountNumber.trim();
      } else {
        // Always explicit — null means "no filter applied" which Platinum must honour
        params.billingCycle = this.billingCycle;
        params.townIds = this.selectedTowns.length > 0 ? this.selectedTowns.map(t => Number(t.id)) : null;
        params.suburbIds = this.selectedSuburbs.length > 0 ? this.selectedSuburbs.map(s => Number(s.id)) : null;
        params.propertyCategoryIds = this.selectedPropertyCategories.length > 0 ? this.selectedPropertyCategories.map(p => Number(p.id)) : null;
        params.propertyTypeOfUseIds = this.selectedPropertyTypesOfUse.length > 0 ? this.selectedPropertyTypesOfUse.map(p => Number(p.id)) : null;
        params.accountTypeIds = this.selectedAccountTypes.length > 0 ? this.selectedAccountTypes.map(a => Number(a.id)) : null;
        params.typeOfPersonIds = this.selectedPersonTypes.length > 0 ? this.selectedPersonTypes.map(p => Number(p.id)) : null;
        params.ageing = (this.ageing && this.ageing !== '__all__') ? this.ageing : null;
        params.amountGreaterThan = amountGT;
        params.includeIndigents = this.includeIndigents;
        params.includePensioners = this.includePensioners;
        params.excludeDepositBalances = this.excludeDepositBalances;
      }

      // Snapshot for the review step filter summary
      this.appliedRunParams = {
        billingCycleName: this.billingCycles.find(c => String(c.id) === String(this.billingCycle))?.name || this.billingCycle,
        towns: this.selectedTowns.map(t => t.name).join(', '),
        suburbs: this.selectedSuburbs.map(s => s.name).join(', '),
        suburbMode: this.suburbMode,
        propertyCategory: this.selectedPropertyCategories.map(p => p.name).join(', '),
        accountType: this.selectedAccountTypes.map(a => a.name).join(', '),
        typeOfPerson: this.selectedPersonTypes.map(p => p.name).join(', '),
        ageing: this.ageingRanges.find(a => String(a.id) === String(this.ageing))?.name || '',
        amountGreaterThan: amountGT,
        includeIndigents: this.includeIndigents,
        includePensioners: this.includePensioners,
        excludeDepositBalances: this.excludeDepositBalances,
        clientFiltered: 0,
      };

      const result = await firstValueFrom(this.api.post('/api/platinum/billing-debt/section129-trial-run', params));
      this.activeRunId = result?.id ?? result?.runId ?? null;
      if (!this.activeRunId) { this.toast.show('Preview started but could not get run ID.', 'error'); this.step = 'configure'; return; }
      this.startPolling(() => this.onPreviewComplete());
    } catch (err: any) {
      this.stopElapsedTimer();
      this.toast.show(err?.error?.message || 'Failed to start preview.', 'error');
      this.step = 'configure';
    }
  }

  async onPreviewComplete(): Promise<void> {
    this.stopElapsedTimer();
    if (!this.activeRunId) return;
    this.accountsLoading.set(true);
    this.step = 'review';
    this.accountSearchText = '';
    this.accPage = 1;
    this.nameCache.clear();
    try {
      const runs = await firstValueFrom(this.api.get('/api/platinum/billing-debt/section129-runs', { finYear: this.finYear }));
      const run = (runs || []).find((r: any) => r.runId === this.activeRunId);
      this.doneSummary = { accountCount: run?.totalAccounts ?? 0, totalAmount: run?.totalAmount ?? 0 };
      this.runs.set(runs || []);
      this.enrichRunAmounts();
      const runBillingCycle: string = run?.billingCycle ?? '';

      const raw = await firstValueFrom(this.api.get('/api/platinum/billing-debt/section129-run-accounts', { runId: String(this.activeRunId) }));
      console.log('[section129-run-accounts] raw sample:', JSON.stringify(Array.isArray(raw) ? raw[0] : raw));
      const defaultChannel = this.distributionType;
      const rows: RunAccount[] = (Array.isArray(raw) ? raw : []).map((r: any) => {
        const email = r.emailAddress ?? r.email ?? r.Email ?? r.emailAddr ?? '';
        const cellNumber = r.cellNumber ?? r.cellNo ?? r.cell ?? r.mobile ?? r.mobileNumber ?? r.phoneNumber ?? r.telephone ?? r.Phone ?? '';
        const hasEmail = !!(email && email.includes('@'));
        const hasCell = !!(cellNumber && cellNumber.replace(/\D/g, '').length >= 9);
        let channel: DistributionType = defaultChannel;
        if (channel === 'email' && !hasEmail) channel = 'print';
        if ((channel === 'sms' || channel === 'whatsapp') && !hasCell) channel = 'print';
        if (channel === 'all') channel = hasEmail ? 'email' : hasCell ? 'sms' : 'print';
        const isSelected = r.selected !== false;
        const outstandingAmount = r.qualifyingAmount ?? r.balanceDue ?? r.totalBalance ?? r.outstandingAmount ?? r.balance ?? 0;
        let exclusionReason: string | undefined;
        if (!isSelected) {
          const platReason = r.excludeReason ?? r.exclusionReason ?? r.exclusionDesc ?? r.reason ?? r.note ?? r.excludedReason ?? '';
          if (platReason) {
            exclusionReason = platReason;
          } else if (outstandingAmount <= 0) {
            exclusionReason = outstandingAmount < 0
              ? `Credit balance of R ${Math.abs(outstandingAmount).toLocaleString('en-ZA', { minimumFractionDigits: 2 })} — account has no outstanding debt`
              : 'Zero balance — no outstanding debt to collect';
          } else {
            exclusionReason = 'Excluded by the system — does not meet the run criteria (check minimum amount, lapse period, or billing cycle)';
          }
        }
        return {
          accountId: r.detailId ?? r.accountId ?? r.account_ID ?? r.id ?? 0,
          accountNumber: r.accountNo ?? r.accountNumber ?? r.account_No ?? '',
          accountName: r.accountName ?? r.address ?? r.description ?? r.name ?? '',
          outstandingAmount,
          // Use run's billing cycle for all accounts (not in the per-account Platinum response)
          billingCycle: r.billingCycle ?? r.billingCycleName ?? runBillingCycle,
          ageingRange: r.ageingRange ?? r.ageing ?? (r.outstandingDays ? `${r.outstandingDays} days` : ''),
          selected: isSelected,
          exclusionReason,
          email: email || undefined,
          cellNumber: cellNumber || undefined,
          hasEmail,
          hasCell,
          channel,
        };
      });
      // Client-side secondary filter: deselect accounts that don't meet the amount threshold
      // (Platinum may return all qualifying accounts; we enforce additional criteria here)
      let clientFilteredCount = 0;
      const amtThreshold = this.appliedRunParams?.amountGreaterThan ?? null;
      if (amtThreshold !== null && amtThreshold > 0) {
        for (const row of rows) {
          if (row.selected && row.outstandingAmount <= amtThreshold) {
            row.selected = false;
            row.exclusionReason = `Outstanding amount R ${row.outstandingAmount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })} does not meet the minimum of R ${amtThreshold.toLocaleString('en-ZA', { minimumFractionDigits: 2 })} set in the run filters`;
            clientFilteredCount++;
          }
        }
      }
      if (this.appliedRunParams) this.appliedRunParams.clientFiltered = clientFilteredCount;

      this.reviewAccounts.set(rows);
      this.doneSummary = {
        accountCount: rows.length,
        totalAmount: rows.reduce((s, r) => s + (r.outstandingAmount || 0), 0),
      };
      setTimeout(() => this.fetchNamesForCurrentPage(), 100);
      setTimeout(() => this.enrichAccountContacts(), 200);
    } catch (err: any) {
      this.toast.show(err?.error?.message || 'Could not load account preview.', 'error');
    } finally {
      this.accountsLoading.set(false);
    }
  }

  // ── STEP 3 → 4: Generate Notices ──────────────────────────────────────
  generateBatchStatus = signal<{ channel: string; count: number; done: boolean }[]>([]);

  async handleGenerate(): Promise<void> {
    if (this.selectedCount === 0) { this.toast.show('Please select at least one account.', 'error'); return; }

    const selected = this.reviewAccounts().filter(a => a.selected && a.accountId > 0);
    const deselectedIds = this.reviewAccounts().filter(a => !a.selected && a.accountId > 0).map(a => a.accountId);

    // Save summary from review state now — the Platinum API always returns 0 for these after submit
    this.doneSummary = {
      accountCount: selected.length,
      totalAmount: selected.reduce((s, a) => s + (a.outstandingAmount || 0), 0),
    };

    // Group selected accounts by their channel
    const groups = new Map<DistributionType, number[]>();
    for (const acc of selected) {
      if (!groups.has(acc.channel)) groups.set(acc.channel, []);
      groups.get(acc.channel)!.push(acc.accountId);
    }

    this.step = 'generating';
    this.pollProgress.set(null);
    this.generateBatchStatus.set(
      [...groups.entries()].map(([ch, ids]) => ({ channel: ch, count: ids.length, done: false }))
    );

    try {
      let lastRunId = this.activeRunId;

      for (const [channelType, channelIds] of groups) {
        // Exclude: deselected + selected accounts NOT in this channel group
        const excludedForBatch = [
          ...deselectedIds,
          ...selected.filter(a => a.channel !== channelType).map(a => a.accountId),
        ];

        const body: any = {
          runId: this.activeRunId,
          distributionType: channelType,
        };
        if (excludedForBatch.length > 0) body.excludedAccountIds = excludedForBatch;
        if (this.contactPerson) body.contactPerson = this.contactPerson;
        if (this.contactPhone) body.phone = this.contactPhone;
        if (this.contactEmail) body.email = this.contactEmail;
        if (channelType === 'email') body.mustEmailBePrinted = this.mustEmailBePrinted;

        const result = await firstValueFrom(this.api.post('/api/platinum/billing-debt/section129-trial-review-submit', body));
        const genRunId = result?.id ?? result?.runId ?? this.activeRunId;
        if (genRunId) lastRunId = genRunId;

        // Mark this batch as done
        this.generateBatchStatus.update(batches =>
          batches.map(b => b.channel === channelType ? { ...b, done: true } : b)
        );
      }

      if (lastRunId) this.activeRunId = lastRunId;
      this.startPolling(() => this.onGenerateComplete());
    } catch (err: any) {
      this.toast.show(err?.error?.message || 'Failed to generate notices.', 'error');
      this.step = 'review';
    }
  }

  private async onGenerateComplete(): Promise<void> {
    this.doneRunId = this.activeRunId;
    this.doneIsTrialComplete = true; // trial review → trial complete; final run is a separate step
    this.step = 'done';
    this.doneFilesLoading.set(true);
    await this.refreshRuns();
    try {
      // doneSummary was already set from review state in handleGenerate() — do NOT overwrite with API zeros
      const files = await firstValueFrom(this.api.get('/api/platinum/billing-debt/section129-run-files', { runId: String(this.doneRunId) }));
      this.doneFiles.set(files || []);
    } catch {} finally {
      this.doneFilesLoading.set(false);
    }
  }

  // ── Polling ───────────────────────────────────────────────────────────
  private startPolling(onDone: () => void): void {
    this.stopPolling();
    const RUNNING_STATUSES = ['Trial Running', 'Final Running', 'Processing', 'Generating', 'Running'];
    const isStillRunning = (desc: string) => RUNNING_STATUSES.some(st => (desc || '').toLowerCase().includes(st.toLowerCase()));

    const poll = async () => {
      if (!this.activeRunId) { this.stopPolling(); return; }
      try {
        const s = await firstValueFrom(this.api.get('/api/platinum/billing-debt/section129-run-status', { runId: String(this.activeRunId) }));
        if (s) {
          const statusDesc = s.statusDescription || s.status || 'Processing…';
          // Platinum may return progress %, or just accountCount — handle both
          const hasGranularProgress = typeof s.progress === 'number' && s.progress > 0;
          const accountCount = s.accountCount ?? s.completedAccounts ?? 0;
          this.pollProgress.set({
            statusDescription: statusDesc,
            progress: hasGranularProgress ? s.progress : -1,  // -1 = indeterminate
            completedAccounts: accountCount,
            totalAccounts: s.totalAccounts ?? 0,
          });
          if (!isStillRunning(statusDesc)) { this.stopPolling(); onDone(); }
        } else {
          // null → status not found yet; fall back to runs list
          try {
            const runs = await firstValueFrom(this.api.get('/api/platinum/billing-debt/section129-runs', { finYear: this.finYear }));
            const run = (runs || []).find((r: any) => r.runId === this.activeRunId);
            if (run) {
              this.pollProgress.set({
                statusDescription: run.status || 'Processing…',
                progress: -1,
                completedAccounts: run.totalAccounts ?? 0,
                totalAccounts: 0,
              });
              if (!isStillRunning(run.status || '')) { this.stopPolling(); onDone(); }
            }
          } catch {}
        }
      } catch {}
    };
    poll();
    this.progressInterval = setInterval(poll, 3000);
  }

  private stopPolling(): void {
    if (this.progressInterval) { clearInterval(this.progressInterval); this.progressInterval = null; }
  }

  // ── Navigation helpers ────────────────────────────────────────────────
  goBackToConfigure(): void {
    this.stopPolling();
    this.stopElapsedTimer();
    this.step = 'configure';
    this.pollProgress.set(null);
    this.reviewAccounts.set([]);
    this.activeRunId = null;
  }

  enquiryPanelOpen = signal(false);
  enquiryPanelAccount = signal('');
  enquiryPanelLoading = signal(false);
  enquiryPanelData = signal<any>(null);
  enquiryPanelServices = signal<any[]>([]);
  enquiryPanelBalances = signal<any>(null);

  openEnquiry(accountNumber: string, accountId?: number): void {
    this.enquiryPanelAccount.set(accountNumber);
    this.enquiryPanelOpen.set(true);
    this.enquiryPanelLoading.set(true);
    this.enquiryPanelData.set(null);
    this.enquiryPanelServices.set([]);
    this.enquiryPanelBalances.set(null);
    this.loadEnquiryPanel(accountNumber, accountId);
  }

  closeEnquiryPanel(): void {
    this.enquiryPanelOpen.set(false);
  }

  openEnquiryFullPage(): void {
    window.open(`/enquiries/general?account=${this.enquiryPanelAccount()}`, '_blank', 'noopener,noreferrer');
  }

  private async loadEnquiryPanel(accountNumber: string, knownAccountId?: number): Promise<void> {
    try {
      let accountId = knownAccountId;
      if (!accountId) {
        const searchResult: any = await firstValueFrom(
          this.api.post('/api/platinum/billing-payment/search-accounts', { searchValue: accountNumber })
        );
        const accounts = Array.isArray(searchResult) ? searchResult : searchResult?.accounts || [];
        const match = accounts.find((a: any) => a.accountNumber === accountNumber || a.sgNumber === accountNumber) || accounts[0];
        if (!match) {
          this.enquiryPanelData.set({ accountNumber, error: 'Account not found' });
          return;
        }
        accountId = match.accountID || match.account_ID || match.accountId;
      }
      const [detailResult, servicesResult, balanceResult] = await Promise.allSettled([
        firstValueFrom(this.api.get<any>('/api/platinum/billing-enquiry/basic-account-details', { AccountId: String(accountId), IsSundryDebtor: 'false' })),
        firstValueFrom(this.api.get<any>(`/api/platinum/billing-enquiry/all-services/${accountId}`)),
        firstValueFrom(this.api.get<any>(`/api/platinum/billing-enquiry/account-info-result/${accountId}`)),
      ]);
      const detail = detailResult.status === 'fulfilled' ? detailResult.value : {};
      const services = servicesResult.status === 'fulfilled' ? (Array.isArray(servicesResult.value) ? servicesResult.value : []) : [];
      const balance = balanceResult.status === 'fulfilled' ? balanceResult.value : null;
      this.enquiryPanelData.set({ accountNumber, ...detail, accountId });
      this.enquiryPanelServices.set(services);
      this.enquiryPanelBalances.set(balance);
    } catch (e: any) {
      this.enquiryPanelData.set({ accountNumber, error: e?.error?.message || e?.message || 'Failed to load account details' });
    } finally {
      this.enquiryPanelLoading.set(false);
    }
  }

  toggleRunExpand(runId: number): void {
    if (this.expandedRunIds.has(runId)) {
      this.expandedRunIds.delete(runId);
    } else {
      this.expandedRunIds.add(runId);
    }
  }

  getAgeingLabel(ageingId: number | null): string {
    if (ageingId == null) return '—';
    const match = this.ageingRanges.find(a => String(a.id) === String(ageingId));
    return match?.name || `ID ${ageingId}`;
  }

  startNewRun(): void {
    this.stopPolling();
    this.step = 'configure';
    this.pollProgress.set(null);
    this.reviewAccounts.set([]);
    this.doneFiles.set([]);
    this.activeRunId = null;
    this.doneRunId = null;
    this.doneSummary = null;
    this.doneIsTrialComplete = false;
    this.clearFilters();
    this.refreshRuns();
  }

  clearFilters(): void {
    this.accountNumber = ''; this.billingCycle = '';
    this.selectedTowns = []; this.townDropdownOpen = false; this.townSearchText = '';
    this.suburbs = []; this.selectedSuburbs = []; this.suburbMode = 'include';
    this.suburbDropdownOpen = false; this.suburbSearchText = '';
    this.selectedPropertyCategories = []; this.selectedPropertyTypesOfUse = [];
    this.selectedAccountTypes = []; this.selectedPersonTypes = [];
    this.ageing = '';
    this.amountGreaterThan = ''; this.includeIndigents = false;
    this.includePensioners = false; this.excludeDepositBalances = false;
    this.contactPerson = ''; this.contactPhone = ''; this.contactEmail = '';
    this.distributionType = 'email'; this.mustEmailBePrinted = false;
    this.accountSearchText = ''; this.showValidation = false;
  }

  // ── Account selection helpers ─────────────────────────────────────────
  toggleAccount(account: RunAccount): void {
    account.selected = !account.selected;
    this.reviewAccounts.update(a => [...a]);
  }

  selectAll(): void { this.reviewAccounts.update(list => list.map(a => ({ ...a, selected: true }))); }
  deselectAll(): void { this.reviewAccounts.update(list => list.map(a => ({ ...a, selected: false }))); }

  // ── Suburb multi-select helpers ────────────────────────────────────────
  get filteredSuburbs(): { id: string; name: string }[] {
    if (!this.suburbSearchText) return this.suburbs;
    const q = this.suburbSearchText.toLowerCase();
    return this.suburbs.filter(s => s.name.toLowerCase().includes(q));
  }

  isSuburbSelected(id: string): boolean {
    return this.selectedSuburbs.some(s => s.id === id);
  }

  toggleSuburb(sub: { id: string; name: string }): void {
    if (this.isSuburbSelected(sub.id)) {
      this.selectedSuburbs = this.selectedSuburbs.filter(s => s.id !== sub.id);
    } else {
      this.selectedSuburbs = [...this.selectedSuburbs, sub];
    }
  }

  removeSuburb(id: string): void {
    this.selectedSuburbs = this.selectedSuburbs.filter(s => s.id !== id);
  }

  selectAllSuburbs(): void {
    this.selectedSuburbs = [...this.suburbs];
  }

  clearAllSuburbs(): void {
    this.selectedSuburbs = [];
  }

  get suburbTriggerText(): string {
    if (this.suburbsLoading) return 'Loading...';
    if (this.selectedTowns.length === 0) return 'Select a town first';
    if (this.suburbs.length === 0) return 'No suburbs';
    if (this.selectedSuburbs.length === 0) return 'All suburbs (no filter)';
    return `${this.selectedSuburbs.length} suburb${this.selectedSuburbs.length !== 1 ? 's' : ''} selected`;
  }

  toggleSuburbDropdown(): void {
    if (this.selectedTowns.length === 0 || this.suburbsLoading) return;
    this.suburbDropdownOpen = !this.suburbDropdownOpen;
    if (!this.suburbDropdownOpen) this.suburbSearchText = '';
  }

  closeSuburbDropdown(): void {
    this.suburbDropdownOpen = false;
    this.suburbSearchText = '';
  }
  closeSuburb(): void { this.closeSuburbDropdown(); }

  // ── Town multi-select helpers ────────────────────────────────────────
  get filteredTowns(): { id: string; name: string }[] {
    const q = this.townSearchText.toLowerCase();
    return q ? this.towns.filter(t => t.name.toLowerCase().includes(q)) : this.towns;
  }
  isTownSelected(id: string): boolean { return this.selectedTowns.some(t => t.id === id); }
  toggleTown(item: { id: string; name: string }): void {
    this.selectedTowns = this.isTownSelected(item.id) ? this.selectedTowns.filter(t => t.id !== item.id) : [...this.selectedTowns, item];
    if (this.selectedTowns.length === this.towns.length) { this.selectedTowns = []; this.closeTown(); }
    this.onTownSelectionChange();
  }
  removeTown(id: string): void { this.selectedTowns = this.selectedTowns.filter(t => t.id !== id); this.onTownSelectionChange(); }
  selectAllTowns(): void { this.selectedTowns = []; this.closeTown(); this.onTownSelectionChange(); }
  clearAllTowns(): void { this.selectedTowns = []; this.onTownSelectionChange(); }
  get townTriggerText(): string {
    if (this.selectedTowns.length === 0) return 'All Towns';
    return `${this.selectedTowns.length} of ${this.towns.length} selected`;
  }
  toggleTownDropdown(event?: MouseEvent): void { event?.stopPropagation(); this.townDropdownOpen = !this.townDropdownOpen; if (!this.townDropdownOpen) this.townSearchText = ''; this.closeSuburb(); this.closePropCat(); this.closePropType(); this.closeAccType(); this.closePersonType(); }
  closeTown(): void { this.townDropdownOpen = false; this.townSearchText = ''; }

  // ── Town/suburb cascade — on-demand with cache ────────────────────────
  private suburbFetchVersion = 0;
  onTownSelectionChange(): void {
    this.suburbs = []; this.selectedSuburbs = [];
    this.suburbDropdownOpen = false; this.suburbSearchText = '';
    if (this.selectedTowns.length === 0) return;
    this.suburbsLoading = true;
    const version = ++this.suburbFetchVersion;
    const townIds = this.selectedTowns.map(t => t.id);
    Promise.all(townIds.map(townId => {
      const cached = this.suburbCache.get(townId);
      if (cached) return Promise.resolve(cached);
      return firstValueFrom(this.api.get('/api/platinum/billing-debt/suburbs', { townId }))
        .then((data: any) => {
          const subs = Array.isArray(data) ? data : [];
          this.suburbCache.set(townId, subs);
          return subs;
        })
        .catch(() => [] as { id: string; name: string }[]);
    })).then(results => {
      if (version !== this.suburbFetchVersion) return;
      const seen = new Set<string>();
      const merged: { id: string; name: string }[] = [];
      for (const list of results) {
        for (const s of list) {
          if (!seen.has(s.id)) { seen.add(s.id); merged.push(s); }
        }
      }
      merged.sort((a, b) => a.name.localeCompare(b.name));
      this.suburbs = merged;
    }).finally(() => { if (version === this.suburbFetchVersion) this.suburbsLoading = false; });
  }

  // ── Generic multi-select helpers ──────────────────────────────────────
  get filteredPropertyCategories(): { id: string; name: string }[] {
    const q = this.propCatSearchText.toLowerCase();
    return q ? this.propertyCategories.filter(p => p.name.toLowerCase().includes(q)) : this.propertyCategories;
  }
  isPropCatSelected(id: string): boolean { return this.selectedPropertyCategories.some(p => p.id === id); }
  togglePropCat(item: { id: string; name: string }): void {
    this.selectedPropertyCategories = this.isPropCatSelected(item.id) ? this.selectedPropertyCategories.filter(p => p.id !== item.id) : [...this.selectedPropertyCategories, item];
    if (this.selectedPropertyCategories.length === this.propertyCategories.length) { this.selectedPropertyCategories = []; this.closePropCat(); }
  }
  removePropCat(id: string): void { this.selectedPropertyCategories = this.selectedPropertyCategories.filter(p => p.id !== id); }
  selectAllPropCat(): void { this.selectedPropertyCategories = []; this.closePropCat(); }
  clearAllPropCat(): void { this.selectedPropertyCategories = []; }
  get propCatTriggerText(): string {
    if (this.selectedPropertyCategories.length === 0) return 'All Categories';
    return `${this.selectedPropertyCategories.length} of ${this.propertyCategories.length} selected`;
  }
  togglePropCatDropdown(event?: MouseEvent): void { event?.stopPropagation(); this.propCatDropdownOpen = !this.propCatDropdownOpen; if (!this.propCatDropdownOpen) this.propCatSearchText = ''; this.closeTown(); this.closePropType(); this.closeAccType(); this.closePersonType(); this.closeSuburb(); }
  closePropCat(): void { this.propCatDropdownOpen = false; this.propCatSearchText = ''; }

  get filteredPropertyTypesOfUse(): { id: string; name: string }[] {
    const q = this.propTypeSearchText.toLowerCase();
    return q ? this.propertyTypesOfUse.filter(p => p.name.toLowerCase().includes(q)) : this.propertyTypesOfUse;
  }
  isPropTypeSelected(id: string): boolean { return this.selectedPropertyTypesOfUse.some(p => p.id === id); }
  togglePropType(item: { id: string; name: string }): void {
    this.selectedPropertyTypesOfUse = this.isPropTypeSelected(item.id) ? this.selectedPropertyTypesOfUse.filter(p => p.id !== item.id) : [...this.selectedPropertyTypesOfUse, item];
    if (this.selectedPropertyTypesOfUse.length === this.propertyTypesOfUse.length) { this.selectedPropertyTypesOfUse = []; this.closePropType(); }
  }
  removePropType(id: string): void { this.selectedPropertyTypesOfUse = this.selectedPropertyTypesOfUse.filter(p => p.id !== id); }
  selectAllPropType(): void { this.selectedPropertyTypesOfUse = []; this.closePropType(); }
  clearAllPropType(): void { this.selectedPropertyTypesOfUse = []; }
  get propTypeTriggerText(): string {
    if (this.selectedPropertyTypesOfUse.length === 0) return 'All Types';
    return `${this.selectedPropertyTypesOfUse.length} of ${this.propertyTypesOfUse.length} selected`;
  }
  togglePropTypeDropdown(event?: MouseEvent): void { event?.stopPropagation(); this.propTypeDropdownOpen = !this.propTypeDropdownOpen; if (!this.propTypeDropdownOpen) this.propTypeSearchText = ''; this.closeTown(); this.closePropCat(); this.closeAccType(); this.closePersonType(); this.closeSuburb(); }
  closePropType(): void { this.propTypeDropdownOpen = false; this.propTypeSearchText = ''; }

  get filteredAccountTypes(): { id: string; name: string }[] {
    const q = this.accTypeSearchText.toLowerCase();
    return q ? this.accountTypes.filter(a => a.name.toLowerCase().includes(q)) : this.accountTypes;
  }
  isAccTypeSelected(id: string): boolean { return this.selectedAccountTypes.some(a => a.id === id); }
  toggleAccType(item: { id: string; name: string }): void {
    this.selectedAccountTypes = this.isAccTypeSelected(item.id) ? this.selectedAccountTypes.filter(a => a.id !== item.id) : [...this.selectedAccountTypes, item];
    if (this.selectedAccountTypes.length === this.accountTypes.length) { this.selectedAccountTypes = []; this.closeAccType(); }
  }
  removeAccType(id: string): void { this.selectedAccountTypes = this.selectedAccountTypes.filter(a => a.id !== id); }
  selectAllAccType(): void { this.selectedAccountTypes = []; this.closeAccType(); }
  clearAllAccType(): void { this.selectedAccountTypes = []; }
  get accTypeTriggerText(): string {
    if (this.selectedAccountTypes.length === 0) return 'All Types';
    return `${this.selectedAccountTypes.length} of ${this.accountTypes.length} selected`;
  }
  toggleAccTypeDropdown(event?: MouseEvent): void { event?.stopPropagation(); this.accTypeDropdownOpen = !this.accTypeDropdownOpen; if (!this.accTypeDropdownOpen) this.accTypeSearchText = ''; this.closeTown(); this.closePropCat(); this.closePropType(); this.closePersonType(); this.closeSuburb(); }
  closeAccType(): void { this.accTypeDropdownOpen = false; this.accTypeSearchText = ''; }

  get filteredPersonTypes(): { id: string; name: string }[] {
    const q = this.personTypeSearchText.toLowerCase();
    return q ? this.personTypes.filter(p => p.name.toLowerCase().includes(q)) : this.personTypes;
  }
  isPersonTypeSelected(id: string): boolean { return this.selectedPersonTypes.some(p => p.id === id); }
  togglePersonType(item: { id: string; name: string }): void {
    this.selectedPersonTypes = this.isPersonTypeSelected(item.id) ? this.selectedPersonTypes.filter(p => p.id !== item.id) : [...this.selectedPersonTypes, item];
    if (this.selectedPersonTypes.length === this.personTypes.length) { this.selectedPersonTypes = []; this.closePersonType(); }
  }
  removePersonType(id: string): void { this.selectedPersonTypes = this.selectedPersonTypes.filter(p => p.id !== id); }
  selectAllPersonType(): void { this.selectedPersonTypes = []; this.closePersonType(); }
  clearAllPersonType(): void { this.selectedPersonTypes = []; }
  get personTypeTriggerText(): string {
    if (this.selectedPersonTypes.length === 0) return 'All';
    return `${this.selectedPersonTypes.length} of ${this.personTypes.length} selected`;
  }
  togglePersonTypeDropdown(event?: MouseEvent): void { event?.stopPropagation(); this.personTypeDropdownOpen = !this.personTypeDropdownOpen; if (!this.personTypeDropdownOpen) this.personTypeSearchText = ''; this.closeTown(); this.closePropCat(); this.closePropType(); this.closeAccType(); this.closeSuburb(); }
  closePersonType(): void { this.personTypeDropdownOpen = false; this.personTypeSearchText = ''; }

  // ── File download ─────────────────────────────────────────────────────
  async handleDownloadFile(fileId: number): Promise<void> {
    this.downloadingFileId = fileId;
    try {
      const { blob, filename } = await firstValueFrom(
        this.api.getBlob('/api/platinum/billing-debt/section129-download-file', { fileId: String(fileId) })
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      this.toast.show(err?.error?.message || 'Failed to download file.', 'error');
    } finally { this.downloadingFileId = null; }
  }

  exportingReviewCsv = false;
  downloadReviewCSV(): void {
    if (this.exportingReviewCsv) return;
    this.exportingReviewCsv = true;
    try {
      const accounts = this.reviewAccounts();
      const runId = this.activeRunId || '';
      const headers = ['Account Number', 'Name', 'Billing Cycle', 'Ageing Range', 'Outstanding (R)', 'Selected', 'Channel', 'Has Email', 'Has Cell', 'All Emails', 'All Cell Numbers'];
      const rows = accounts.map(a => [
        a.accountNumber || '',
        (a.accountName || '').replace(/,/g, ';'),
        (a.billingCycle || '').replace(/,/g, ';'),
        (a.ageingRange || '').replace(/,/g, ';'),
        (a.outstandingAmount || 0).toFixed(2),
        a.selected ? 'Yes' : 'No',
        a.channel || '',
        a.hasEmail ? 'Yes' : 'No',
        a.hasCell ? 'Yes' : 'No',
        (a.allEmails || [a.email || '']).filter(Boolean).join('; '),
        (a.allMobiles || [a.cellNumber || '']).filter(Boolean).join('; '),
      ]);
      const csvContent = [headers, ...rows].map(r => r.join(',')).join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const d = new Date();
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      a.href = url;
      a.download = `section129-run${runId}-accounts-${dd}${mm}${yyyy}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      this.toast.show(`Exported ${accounts.length} accounts to CSV.`, 'success');
    } catch (e: any) {
      this.toast.show('Failed to export CSV.', 'error');
    } finally {
      this.exportingReviewCsv = false;
    }
  }

  isRunApproved(run: Section129Run): boolean {
    const s = run.status;
    return s === 'Authorized' || s === 'Approved' || s === 'Final Running' || s === 'Final Complete';
  }

  canShowRunFiles(run: Section129Run): boolean {
    return run.status === 'Final Complete';
  }

  sendingRunId: number | null = null;
  sendingChannel: string | null = null;
  async handleSendNotices(run: Section129Run, channel: 'email' | 'sms' | 'whatsapp'): Promise<void> {
    if (this.sendingRunId !== null) return;
    this.sendingRunId = run.runId;
    this.sendingChannel = channel;
    try {
      await firstValueFrom(this.api.post('/api/platinum/billing-debt/section129-final-run', {
        runId: run.runId,
        distributionType: channel,
      }));
      try {
        await firstValueFrom(this.api.post<any>('/api/communication-logs', {
          accountId: String(run.runId),
          accountNumber: `Run #${run.runId}`,
          accountHolder: (run as any).description || `Section 129 Run #${run.runId}`,
          method: channel,
          recipients: `${run.totalAccounts || 0} accounts`,
          subject: `Section 129 Notice - ${channel.toUpperCase()}`,
          messageBody: `Section 129 notices dispatched via ${channel} for run #${run.runId} (${run.totalAccounts || 0} accounts)`,
          statementType: 'Section 129',
        }));
      } catch { console.warn('[Section129] Communication log save failed — notices were sent'); }
      this.toast.show(`${channel.charAt(0).toUpperCase() + channel.slice(1)} notices for run #${run.runId} submitted.`, 'success');
      await this.refreshRuns();
    } catch (err: any) {
      this.toast.show(err?.error?.message || `Failed to send ${channel} notices.`, 'error');
    } finally { this.sendingRunId = null; this.sendingChannel = null; }
  }

  exportingRunCsvId: number | null = null;
  async exportRunCSV(run: Section129Run): Promise<void> {
    if (this.exportingRunCsvId !== null) return;
    this.exportingRunCsvId = run.runId;
    try {
      const raw = await firstValueFrom(this.api.get('/api/platinum/billing-debt/section129-run-accounts', { runId: String(run.runId) }));
      const accounts: RunAccount[] = (Array.isArray(raw) ? raw : []).map((r: any) => {
        const outstandingAmount = r.qualifyingAmount ?? r.balanceDue ?? r.totalBalance ?? r.outstandingAmount ?? r.balance ?? 0;
        const isSelected = r.selected !== false;
        return {
          accountId: r.detailId ?? r.accountId ?? r.account_ID ?? r.id ?? 0,
          accountNumber: r.accountNo ?? r.accountNumber ?? r.account_No ?? '',
          accountName: r.accountName ?? r.address ?? r.description ?? r.name ?? '',
          outstandingAmount,
          billingCycle: r.billingCycle ?? r.billingCycleName ?? run.billingCycle ?? '',
          ageingRange: r.ageingRange ?? r.ageing ?? (r.outstandingDays ? `${r.outstandingDays} days` : ''),
          selected: isSelected,
          hasEmail: false,
          hasCell: false,
          channel: 'print' as DistributionType,
        };
      });
      if (accounts.length === 0) {
        this.toast.show('No accounts found for this run.', 'error');
        return;
      }
      const accountIds = accounts.map(a => a.accountId).filter(id => id > 0);
      const BATCH_SIZE = 50;
      const contactMap = new Map<number, { emails: string[]; mobiles: string[] }>();
      for (let i = 0; i < accountIds.length; i += BATCH_SIZE) {
        const batch = accountIds.slice(i, i + BATCH_SIZE);
        try {
          const results: any[] = await firstValueFrom(
            this.api.post('/api/platinum/billing-debt/batch-contact-details', { accountIds: batch })
          );
          for (const item of (results || [])) {
            const { emails: cEmails, mobiles: cMobiles } = this.extractContactsFromRecord(item?.contact);
            const allEmails = new Set(cEmails);
            const allMobiles = new Set(cMobiles);
            if (Array.isArray(item?.additionalEmails)) {
              for (const ae of item.additionalEmails) {
                const addr = ae?.emailAdress ?? ae?.emailAddress ?? ae?.email ?? '';
                if (this.isValidEmail(addr)) allEmails.add(addr.trim().toLowerCase());
              }
            }
            contactMap.set(item.accountId, { emails: Array.from(allEmails), mobiles: Array.from(allMobiles) });
          }
        } catch { /* continue with available data */ }
      }
      for (const a of accounts) {
        const c = contactMap.get(a.accountId);
        if (c) {
          a.email = c.emails[0] || undefined;
          a.cellNumber = c.mobiles[0] || undefined;
          a.allEmails = c.emails;
          a.allMobiles = c.mobiles;
          a.hasEmail = c.emails.length > 0;
          a.hasCell = c.mobiles.length > 0;
        }
      }
      const headers = ['Account Number', 'Name', 'Billing Cycle', 'Ageing Range', 'Outstanding (R)', 'Selected', 'Has Email', 'Has Cell', 'All Emails', 'All Cell Numbers'];
      const rows = accounts.map(a => [
        a.accountNumber || '',
        (a.accountName || '').replace(/,/g, ';'),
        (a.billingCycle || '').replace(/,/g, ';'),
        (a.ageingRange || '').replace(/,/g, ';'),
        (a.outstandingAmount || 0).toFixed(2),
        a.selected ? 'Yes' : 'No',
        a.hasEmail ? 'Yes' : 'No',
        a.hasCell ? 'Yes' : 'No',
        (a.allEmails || []).join('; '),
        (a.allMobiles || []).join('; '),
      ]);
      const csvContent = [headers, ...rows].map(r => r.join(',')).join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const d = new Date();
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      a.href = url;
      a.download = `section129-run${run.runId}-accounts-${dd}${mm}${yyyy}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      this.toast.show(`Exported ${accounts.length} accounts for Run #${run.runId} to CSV.`, 'success');
    } catch (err: any) {
      this.toast.show(err?.error?.message || `Failed to export accounts for Run #${run.runId}.`, 'error');
    } finally {
      this.exportingRunCsvId = null;
    }
  }

  // ── Run history actions ───────────────────────────────────────────────
  get paginatedRuns(): Section129Run[] {
    return this.runs().slice((this.gridPage - 1) * this.gridPageSize, this.gridPage * this.gridPageSize);
  }
  get totalGridPages(): number { return Math.ceil(this.runs().length / this.gridPageSize); }
  prevPage(): void { if (this.gridPage > 1) this.gridPage--; }
  nextPage(): void { if (this.gridPage < this.totalGridPages) this.gridPage++; }
  canDeleteRun(run: Section129Run): boolean { return !this.NON_DELETABLE_STATUSES.includes(run.status); }
  getStatusColor(s: string): string { return getStatusColor(s); }
  isDeclinedOrFailed(status: string): boolean {
    const s = status.toLowerCase();
    return s.includes('declined') || s.includes('rejected') || s.includes('failed');
  }
  fmtDate(v: string | null | undefined): string { return formatDate(v); }
  formatFileSize(b: number): string { return formatFileSize(b); }

  async handleFinalRun(runId: number): Promise<void> {
    this.finalRunningId = runId;
    try {
      await firstValueFrom(this.api.post('/api/platinum/billing-debt/section129-final-run', { runId }));
      this.toast.show(`Final run for #${runId} submitted.`, 'success');

      try {
        const run = this.runs().find(r => r.runId === runId);
        const accountsData: any = await firstValueFrom(
          this.api.get('/api/platinum/billing-debt/section129-run-accounts', { runId: String(runId) })
        );
        const accounts = Array.isArray(accountsData) ? accountsData : (accountsData?.accounts || []);
        if (accounts.length > 0) {
          await firstValueFrom(
            this.api.post('/api/section129-notices/track-final-run', {
              runId,
              runDescription: run ? `${run.handoverOption || 'Run'} #${run.runId}` : `Run #${runId}`,
              runDate: run?.dateCreated || new Date().toISOString(),
              accounts,
            })
          );
          this.toast.show(`${accounts.length} Section 129 notices tracked for handover processing.`, 'info');
        }
      } catch (trackErr: any) {
        console.error('[section129] Failed to track final run notices:', trackErr);
      }

      await this.refreshRuns();
    } catch (err: any) {
      this.toast.show(err?.error?.message || 'Failed to submit final run.', 'error');
    } finally { this.finalRunningId = null; }
  }

  confirmDelete(run: Section129Run): void {
    this.deleteConfirmRun = run;
    this.deletePhase = 'confirm';
    this.deleteCurrentStep = 0;
  }

  cancelDelete(): void {
    if (this.deletePhase === 'deleting') return; // cannot cancel mid-delete
    if (this.deleteStepTimer) { clearInterval(this.deleteStepTimer); this.deleteStepTimer = null; }
    this.deleteConfirmRun = null;
    this.deletePhase = 'confirm';
    this.deleteCurrentStep = 0;
  }

  closeDoneDelete(): void {
    if (this.deleteStepTimer) { clearInterval(this.deleteStepTimer); this.deleteStepTimer = null; }
    this.deleteConfirmRun = null;
    this.deletePhase = 'confirm';
    this.deleteCurrentStep = 0;
  }

  async handleDeleteRun(): Promise<void> {
    if (!this.deleteConfirmRun) return;
    const run = this.deleteConfirmRun;
    this.deletePhase = 'deleting';
    this.deleteCurrentStep = 0;

    // Animate steps at ~1.2 s intervals while the real API call runs in parallel
    let stepIdx = 0;
    this.deleteStepTimer = setInterval(() => {
      if (stepIdx < this.deleteSteps.length - 1) { stepIdx++; this.deleteCurrentStep = stepIdx; }
      else if (this.deleteStepTimer) { clearInterval(this.deleteStepTimer); this.deleteStepTimer = null; }
    }, 1200);

    try {
      await firstValueFrom(this.api.post('/api/platinum/billing-debt/section129-delete-run', { runId: run.runId }));
      if (this.deleteStepTimer) { clearInterval(this.deleteStepTimer); this.deleteStepTimer = null; }
      this.deleteCurrentStep = this.deleteSteps.length; // all done
      this.deletePhase = 'done';
      await this.refreshRuns();
    } catch (err: any) {
      if (this.deleteStepTimer) { clearInterval(this.deleteStepTimer); this.deleteStepTimer = null; }
      this.deletePhase = 'confirm'; // back to confirm so user can see error
      this.deleteCurrentStep = 0;
      this.toast.show(err?.error?.message || 'Failed to delete run. Please check with your system administrator.', 'error');
    }
  }

  resumingRunId: number | null = null;

  async resumeRun(run: any): Promise<void> {
    if (this.resumingRunId) return;
    this.resumingRunId = run.runId;
    try {
      this.activeRunId = run.runId;
      // Restore distribution type from the run record so auto-channel assignment is correct
      if (run.distributionType) {
        this.distributionType = run.distributionType.toLowerCase() as DistributionType;
      }
      await this.onPreviewComplete();
    } catch (err: any) {
      this.toast.show(err?.error?.message || 'Could not load accounts for this run.', 'error');
      this.step = 'configure';
    } finally {
      this.resumingRunId = null;
    }
  }

  get historyFileModalRun(): Section129Run | null {
    if (this.historyFileModalRunId === null) return null;
    return this.runs().find(r => r.runId === this.historyFileModalRunId) ?? null;
  }

  async openHistoryFiles(runId: number): Promise<void> {
    this.historyFileModalRunId = runId; this.historyFileModalOpen = true;
    this.historyFilesLoading = true; this.historyFiles = [];
    try {
      const files = await firstValueFrom(this.api.get('/api/platinum/billing-debt/section129-run-files', { runId: String(runId) }));
      this.historyFiles = Array.isArray(files) ? files : [];
    } catch { this.toast.show('Could not retrieve files for this run. Please try again.', 'error'); }
    finally { this.historyFilesLoading = false; }
  }
  closeHistoryFiles(): void { this.historyFileModalOpen = false; this.historyFileModalRunId = null; this.historyFiles = []; }
}
