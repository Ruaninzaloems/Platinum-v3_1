import { Component, signal, computed, inject, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { PAGE_SIZE } from '../../../services/debt-config';
import { formatCurrency, formatDate } from '../../../services/format.service';
import { DateInputComponent } from '../../../shared/components/date-input.component';
import { AuthService } from '../../../core/services/auth.service';
import { Attorney, HandoverRecord, HandoverOption } from '../../../models/debt.models';

@Component({
  selector: 'app-handover-management',
  standalone: true,
  imports: [CommonModule, FormsModule, DateInputComponent],
  templateUrl: './handover-management.component.html',
  styleUrls: ['./handover-management.component.css']
})
export class HandoverManagementComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private auth = inject(AuthService);

  handoverOption = signal<HandoverOption>('account');
  accountSearch = signal('');
  selectedAttorneyId = signal('');
  billingCycle = signal('');
  ageing = signal('');
  amountGreaterThan = signal('');
  handoverComment = signal('');
  handedOverDate = signal(new Date().toISOString().split('T')[0]);

  includeIndigents = false;
  includePensioners = false;
  excludeDepositBalances = false;

  attorneys = signal<Attorney[]>([]);
  billingCycles = signal<{ id: string; name: string }[]>([]);
  towns = signal<{ id: string; name: string }[]>([]);
  selectedTowns: { id: string; name: string }[] = [];
  townDropdownOpen = false;
  townSearchText = '';
  ageingRanges = signal<{ id: string; name: string }[]>([]);

  propertyCategories: { id: string; name: string }[] = [];
  selectedPropertyCategories: { id: string; name: string }[] = [];
  propCatSearchText = '';

  propertyTypesOfUse: { id: string; name: string }[] = [];
  selectedPropertyTypesOfUse: { id: string; name: string }[] = [];
  propTypeSearchText = '';

  accountTypes: { id: string; name: string }[] = [];
  selectedAccountTypes: { id: string; name: string }[] = [];
  accTypeSearchText = '';

  personTypes: { id: string; name: string }[] = [];
  selectedPersonTypes: { id: string; name: string }[] = [];
  personTypeSearchText = '';

  propCatOpen = false;
  propTypeOpen = false;
  accTypeOpen = false;
  personTypeOpen = false;

  suburbs: { id: string; name: string }[] = [];
  suburbsLoading = false;
  private suburbCache = new Map<string, { id: string; name: string }[]>();
  selectedSuburbs: { id: string; name: string }[] = [];
  suburbMode: 'include' | 'exclude' = 'include';
  suburbDropdownOpen = false;
  suburbSearchText = '';

  rotationAllocations = signal<{ attorneyId: number; attorneyName: string; percentage: number }[]>([]);

  handovers = signal<HandoverRecord[]>([]);
  loadingHandovers = signal(false);
  loadingRef = signal(true);
  submitting = signal(false);
  currentPage = signal(1);

  selectedHandover = signal<HandoverRecord | null>(null);
  accountDetail = signal<any>(null);
  handoverTransactions = signal<any[]>([]);
  loadingDetail = signal(false);

  s129Eligible = signal<any[]>([]);
  s129Loading = signal(false);
  s129LapseDays = signal(14);
  s129SelectedIds = signal<Set<number>>(new Set());
  s129TrackedRuns = signal<any[]>([]);
  s129FilterRunId = signal<number | null>(null);
  s129Submitting = signal(false);

  formatCurrency = formatCurrency;
  formatDate = formatDate;

  get finYear(): string {
    const u = this.auth.user();
    return u?.finYear || `${new Date().getFullYear() - 1}/${new Date().getFullYear()}`;
  }

  activeAttorneys = computed(() => this.attorneys().filter(a => a.isActive));

  totalAllocation = computed(() =>
    this.rotationAllocations().reduce((sum, a) => sum + a.percentage, 0)
  );

  paginatedHandovers = computed(() => {
    const start = (this.currentPage() - 1) * PAGE_SIZE;
    return this.handovers().slice(start, start + PAGE_SIZE);
  });

  totalPages = computed(() =>
    Math.max(1, Math.ceil(this.handovers().length / PAGE_SIZE))
  );

  @HostListener('document:click', ['$event'])
  onDocClick(event: MouseEvent): void {
    const el = event.target as HTMLElement;
    if (!el.closest('.multi-select-wrap')) {
      this.propCatOpen = false;
      this.propTypeOpen = false;
      this.accTypeOpen = false;
      this.personTypeOpen = false;
    }
    if (!el.closest('.suburb-multi')) {
      this.suburbDropdownOpen = false;
    }
    if (!el.closest('.town-multi')) {
      this.townDropdownOpen = false;
    }
  }

  ngOnInit(): void {
    this.loadRefData();
    this.loadHandovers();
  }

  async loadRefData(): Promise<void> {
    this.loadingRef.set(true);
    try {
      const [attResult, bcResult, townResult, ageResult, pcResult, atResult, ptuResult, ptResult] = await Promise.allSettled([
        firstValueFrom(this.api.get<Attorney[]>('/api/platinum/billing-debt/attorney-list')),
        firstValueFrom(this.api.get<any[]>('/api/platinum/billing-debt/billing-cycles')),
        firstValueFrom(this.api.get<any[]>('/api/platinum/billing-debt/towns')),
        firstValueFrom(this.api.get<any[]>('/api/platinum/billing-debt/ageing-ranges')),
        firstValueFrom(this.api.get<any[]>('/api/platinum/billing-debt/property-categories')),
        firstValueFrom(this.api.get<any[]>('/api/platinum/billing-debt/account-types')),
        firstValueFrom(this.api.get<any[]>('/api/platinum/billing-debt/property-types-of-use')),
        firstValueFrom(this.api.get<any[]>('/api/platinum/billing-debt/person-types')),
      ]);
      if (attResult.status === 'fulfilled') this.attorneys.set(attResult.value);
      if (bcResult.status === 'fulfilled') this.billingCycles.set(bcResult.value);
      if (townResult.status === 'fulfilled') this.towns.set(townResult.value);
      if (ageResult.status === 'fulfilled') this.ageingRanges.set(ageResult.value);
      if (pcResult.status === 'fulfilled') this.propertyCategories = pcResult.value || [];
      if (atResult.status === 'fulfilled') this.accountTypes = atResult.value || [];
      if (ptuResult.status === 'fulfilled') this.propertyTypesOfUse = ptuResult.value || [];
      if (ptResult.status === 'fulfilled') this.personTypes = ptResult.value || [];
    } catch (e: any) {
      this.toast.error('Failed to load reference data');
    } finally {
      this.loadingRef.set(false);
    }
  }

  async loadHandovers(): Promise<void> {
    this.loadingHandovers.set(true);
    try {
      const data = await firstValueFrom(this.api.get<HandoverRecord[]>('/api/platinum/billing-debt/handover-list', { finYear: this.finYear }));
      this.handovers.set(Array.isArray(data) ? data : []);
    } catch (e: any) {
      this.toast.error(e?.error?.message || e?.message || 'Failed to load handovers');
    } finally {
      this.loadingHandovers.set(false);
    }
  }

  setOption(opt: HandoverOption): void {
    this.handoverOption.set(opt);
    this.handleClear();
    if (opt === 'fromSection129') {
      this.loadS129EligibleRuns();
    }
  }

  addRotationAttorney(): void {
    this.rotationAllocations.update(prev => [...prev, { attorneyId: 0, attorneyName: '', percentage: 0 }]);
  }

  removeRotationAttorney(idx: number): void {
    this.rotationAllocations.update(prev => prev.filter((_, i) => i !== idx));
  }

  updateRotationAttorneyId(idx: number, value: string): void {
    const id = parseInt(value, 10);
    const att = this.attorneys().find(a => a.attorneyId === id);
    this.rotationAllocations.update(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], attorneyId: id, attorneyName: att?.attorneyName || '' };
      return updated;
    });
  }

  updateRotationPercentage(idx: number, value: string): void {
    this.rotationAllocations.update(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], percentage: parseFloat(value) || 0 };
      return updated;
    });
  }

  async handleSubmit(): Promise<void> {
    const opt = this.handoverOption();
    if (!this.handedOverDate()) { this.toast.error('Please set a handover date.'); return; }
    if (opt === 'account') {
      if (!this.accountSearch().trim()) { this.toast.error('Please enter an account number.'); return; }
      if (!this.selectedAttorneyId()) { this.toast.error('Please select an attorney.'); return; }
    }
    if (opt === 'bulk') {
      if (!this.selectedAttorneyId()) { this.toast.error('Please select an attorney for bulk handover.'); return; }
    }
    if (opt === 'rotation') {
      if (this.rotationAllocations().length === 0) { this.toast.error('Please add at least one attorney for rotation.'); return; }
      if (Math.abs(this.totalAllocation() - 100) > 0.01) { this.toast.error(`Rotation percentages must total 100%. Current: ${this.totalAllocation().toFixed(1)}%`); return; }
    }

    this.submitting.set(true);
    try {
      const params: any = {
        handoverOption: opt,
        comment: this.handoverComment() || '',
        handedOverDate: this.handedOverDate(),
      };
      if (opt === 'account') {
        params.attorneyId = parseInt(this.selectedAttorneyId(), 10);
        params.accountNumbers = [this.accountSearch().trim()];
      }
      if (opt === 'bulk' || opt === 'rotation') {
        if (opt === 'bulk') params.attorneyId = parseInt(this.selectedAttorneyId(), 10);
        const billingCycleVal = this.billingCycle();
        if (billingCycleVal) params.billingCycleId = parseInt(billingCycleVal, 10);
        const ageingVal = this.ageing();
        if (ageingVal) params.ageingId = parseInt(ageingVal, 10);
        const amtVal = this.amountGreaterThan();
        if (amtVal) params.amountGreaterThan = parseFloat(amtVal);
        params.townIds = this.selectedTowns.length > 0 ? this.selectedTowns.map(t => Number(t.id)) : null;
        params.suburbIds = this.selectedSuburbs.length > 0 ? this.selectedSuburbs.map(s => Number(s.id)) : null;
        if (this.selectedSuburbs.length > 0) params.suburbMode = this.suburbMode;
        params.propertyCategoryIds = this.selectedPropertyCategories.length > 0 ? this.selectedPropertyCategories.map(p => Number(p.id)) : null;
        params.propertyTypeOfUseIds = this.selectedPropertyTypesOfUse.length > 0 ? this.selectedPropertyTypesOfUse.map(p => Number(p.id)) : null;
        params.accountTypeIds = this.selectedAccountTypes.length > 0 ? this.selectedAccountTypes.map(a => Number(a.id)) : null;
        params.typeOfPersonIds = this.selectedPersonTypes.length > 0 ? this.selectedPersonTypes.map(p => Number(p.id)) : null;
        params.includeIndigents = this.includeIndigents;
        params.includePensioners = this.includePensioners;
        params.excludeDepositBalances = this.excludeDepositBalances;
      }
      if (opt === 'rotation') {
        params.rotationAllocations = this.rotationAllocations().map(a => ({ attorneyId: a.attorneyId, percentage: a.percentage }));
      }
      const result = await firstValueFrom(this.api.post<any>('/api/platinum/billing-debt/handover-submit', params));
      const msg = result?.message || `Handover submitted — ${result?.totalAccounts || 0} accounts processed.`;
      this.toast.success(msg);
      this.loadHandovers();
      this.handleClear();
    } catch (e: any) {
      this.toast.error(e?.error?.message || e?.message || 'Failed to submit handover.');
    } finally {
      this.submitting.set(false);
    }
  }

  handleClear(): void {
    this.accountSearch.set('');
    this.selectedAttorneyId.set('');
    this.billingCycle.set('');
    this.ageing.set('');
    this.amountGreaterThan.set('');
    this.handoverComment.set('');
    this.handedOverDate.set(new Date().toISOString().split('T')[0]);
    this.includeIndigents = false;
    this.includePensioners = false;
    this.excludeDepositBalances = false;
    this.rotationAllocations.set([]);
    this.selectedTowns = []; this.townDropdownOpen = false; this.townSearchText = '';
    this.suburbs = []; this.selectedSuburbs = [];
    this.suburbMode = 'include'; this.suburbDropdownOpen = false;
    this.suburbSearchText = '';
    this.selectedPropertyCategories = [];
    this.selectedPropertyTypesOfUse = [];
    this.selectedAccountTypes = [];
    this.selectedPersonTypes = [];
    this.propCatSearchText = '';
    this.propTypeSearchText = '';
    this.accTypeSearchText = '';
    this.personTypeSearchText = '';
  }

  get filteredTowns() {
    const q = this.townSearchText.toLowerCase();
    return q ? this.towns().filter(t => t.name.toLowerCase().includes(q)) : this.towns();
  }
  isTownSelected(id: string): boolean { return this.selectedTowns.some(t => t.id === id); }
  toggleTown(t: { id: string; name: string }): void {
    this.selectedTowns = this.isTownSelected(t.id) ? this.selectedTowns.filter(x => x.id !== t.id) : [...this.selectedTowns, t];
    this.onTownsChanged();
  }
  removeTown(id: string): void {
    this.selectedTowns = this.selectedTowns.filter(t => t.id !== id);
    this.onTownsChanged();
  }
  selectAllTowns(): void { this.selectedTowns = [...this.towns()]; this.onTownsChanged(); }
  clearAllTowns(): void { this.selectedTowns = []; this.onTownsChanged(); }
  get townTriggerText(): string {
    if (this.selectedTowns.length === 0) return 'All Towns';
    if (this.selectedTowns.length === 1) return this.selectedTowns[0].name;
    return `${this.selectedTowns.length} towns selected`;
  }

  private suburbFetchVersion = 0;
  onTownsChanged(): void {
    this.suburbs = []; this.selectedSuburbs = [];
    this.suburbDropdownOpen = false; this.suburbSearchText = '';
    if (this.selectedTowns.length === 0) return;
    this.suburbsLoading = true;
    const version = ++this.suburbFetchVersion;
    const fetches = this.selectedTowns.map(t => {
      const cached = this.suburbCache.get(t.id);
      if (cached) return Promise.resolve(cached);
      return firstValueFrom(this.api.get<any[]>('/api/platinum/billing-debt/suburbs', { townId: t.id }))
        .then(data => { const arr = Array.isArray(data) ? data : []; this.suburbCache.set(t.id, arr); return arr; })
        .catch(() => [] as { id: string; name: string }[]);
    });
    Promise.all(fetches).then(results => {
      if (version !== this.suburbFetchVersion) return;
      const seen = new Set<string>();
      const merged: { id: string; name: string }[] = [];
      for (const list of results) {
        for (const s of list) {
          if (!seen.has(s.id)) { seen.add(s.id); merged.push(s); }
        }
      }
      this.suburbs = merged.sort((a, b) => a.name.localeCompare(b.name));
    }).finally(() => { if (version === this.suburbFetchVersion) this.suburbsLoading = false; });
  }

  toggleSuburbDropdown(): void { this.suburbDropdownOpen = !this.suburbDropdownOpen; }
  get filteredSuburbs() { const q = this.suburbSearchText.toLowerCase(); return q ? this.suburbs.filter(s => s.name.toLowerCase().includes(q)) : this.suburbs; }
  isSuburbSelected(id: string): boolean { return this.selectedSuburbs.some(s => s.id === id); }
  toggleSuburb(s: { id: string; name: string }): void {
    this.selectedSuburbs = this.isSuburbSelected(s.id) ? this.selectedSuburbs.filter(x => x.id !== s.id) : [...this.selectedSuburbs, s];
  }
  removeSuburb(id: string): void { this.selectedSuburbs = this.selectedSuburbs.filter(s => s.id !== id); }
  selectAllSuburbs(): void { this.selectedSuburbs = [...this.suburbs]; }
  clearAllSuburbs(): void { this.selectedSuburbs = []; }
  get suburbTriggerText(): string {
    if (this.suburbsLoading) return 'Loading...';
    if (this.selectedTowns.length === 0) return 'Select a town first';
    if (this.selectedSuburbs.length === 0) return 'All Suburbs';
    return `${this.selectedSuburbs.length} suburb${this.selectedSuburbs.length > 1 ? 's' : ''} selected`;
  }

  get filteredPropCat() { const q = this.propCatSearchText.toLowerCase(); return q ? this.propertyCategories.filter(p => p.name.toLowerCase().includes(q)) : this.propertyCategories; }
  isPropCatSelected(id: string): boolean { return this.selectedPropertyCategories.some(p => p.id === id); }
  togglePropCat(item: { id: string; name: string }): void {
    this.selectedPropertyCategories = this.isPropCatSelected(item.id) ? this.selectedPropertyCategories.filter(p => p.id !== item.id) : [...this.selectedPropertyCategories, item];
    if (this.selectedPropertyCategories.length === this.propertyCategories.length) { this.selectedPropertyCategories = []; this.propCatOpen = false; }
  }
  removePropCat(id: string): void { this.selectedPropertyCategories = this.selectedPropertyCategories.filter(p => p.id !== id); }
  selectAllPropCat(): void { this.selectedPropertyCategories = []; this.propCatOpen = false; }
  clearAllPropCat(): void { this.selectedPropertyCategories = []; }
  get propCatTriggerText(): string {
    if (this.selectedPropertyCategories.length === 0) return 'All Categories';
    return `${this.selectedPropertyCategories.length} of ${this.propertyCategories.length} selected`;
  }

  get filteredPropType() { const q = this.propTypeSearchText.toLowerCase(); return q ? this.propertyTypesOfUse.filter(p => p.name.toLowerCase().includes(q)) : this.propertyTypesOfUse; }
  isPropTypeSelected(id: string): boolean { return this.selectedPropertyTypesOfUse.some(p => p.id === id); }
  togglePropType(item: { id: string; name: string }): void {
    this.selectedPropertyTypesOfUse = this.isPropTypeSelected(item.id) ? this.selectedPropertyTypesOfUse.filter(p => p.id !== item.id) : [...this.selectedPropertyTypesOfUse, item];
    if (this.selectedPropertyTypesOfUse.length === this.propertyTypesOfUse.length) { this.selectedPropertyTypesOfUse = []; this.propTypeOpen = false; }
  }
  removePropType(id: string): void { this.selectedPropertyTypesOfUse = this.selectedPropertyTypesOfUse.filter(p => p.id !== id); }
  selectAllPropType(): void { this.selectedPropertyTypesOfUse = []; this.propTypeOpen = false; }
  clearAllPropType(): void { this.selectedPropertyTypesOfUse = []; }
  get propTypeTriggerText(): string {
    if (this.selectedPropertyTypesOfUse.length === 0) return 'All Types';
    return `${this.selectedPropertyTypesOfUse.length} of ${this.propertyTypesOfUse.length} selected`;
  }

  get filteredAccType() { const q = this.accTypeSearchText.toLowerCase(); return q ? this.accountTypes.filter(a => a.name.toLowerCase().includes(q)) : this.accountTypes; }
  isAccTypeSelected(id: string): boolean { return this.selectedAccountTypes.some(a => a.id === id); }
  toggleAccType(item: { id: string; name: string }): void {
    this.selectedAccountTypes = this.isAccTypeSelected(item.id) ? this.selectedAccountTypes.filter(a => a.id !== item.id) : [...this.selectedAccountTypes, item];
    if (this.selectedAccountTypes.length === this.accountTypes.length) { this.selectedAccountTypes = []; this.accTypeOpen = false; }
  }
  removeAccType(id: string): void { this.selectedAccountTypes = this.selectedAccountTypes.filter(a => a.id !== id); }
  selectAllAccType(): void { this.selectedAccountTypes = []; this.accTypeOpen = false; }
  clearAllAccType(): void { this.selectedAccountTypes = []; }
  get accTypeTriggerText(): string {
    if (this.selectedAccountTypes.length === 0) return 'All Account Types';
    return `${this.selectedAccountTypes.length} of ${this.accountTypes.length} selected`;
  }

  get filteredPersonType() { const q = this.personTypeSearchText.toLowerCase(); return q ? this.personTypes.filter(p => p.name.toLowerCase().includes(q)) : this.personTypes; }
  isPersonTypeSelected(id: string): boolean { return this.selectedPersonTypes.some(p => p.id === id); }
  togglePersonType(item: { id: string; name: string }): void {
    this.selectedPersonTypes = this.isPersonTypeSelected(item.id) ? this.selectedPersonTypes.filter(p => p.id !== item.id) : [...this.selectedPersonTypes, item];
    if (this.selectedPersonTypes.length === this.personTypes.length) { this.selectedPersonTypes = []; this.personTypeOpen = false; }
  }
  removePersonType(id: string): void { this.selectedPersonTypes = this.selectedPersonTypes.filter(p => p.id !== id); }
  selectAllPersonType(): void { this.selectedPersonTypes = []; this.personTypeOpen = false; }
  clearAllPersonType(): void { this.selectedPersonTypes = []; }
  get personTypeTriggerText(): string {
    if (this.selectedPersonTypes.length === 0) return 'All';
    return `${this.selectedPersonTypes.length} of ${this.personTypes.length} selected`;
  }

  async selectHandover(h: HandoverRecord): Promise<void> {
    if (this.selectedHandover()?.handoverId === h.handoverId) {
      this.selectedHandover.set(null);
      this.accountDetail.set(null);
      this.handoverTransactions.set([]);
      return;
    }
    this.selectedHandover.set(h);
    this.loadingDetail.set(true);
    this.accountDetail.set(null);
    this.handoverTransactions.set([]);
    try {
      const [detail, txns] = await Promise.allSettled([
        firstValueFrom(this.api.get<any>('/api/platinum/billing-debt/handover-account-detail', { handoverId: String(h.handoverId), accountNo: h.accountNo })),
        firstValueFrom(this.api.get<any[]>('/api/platinum/billing-debt/handover-transactions', { handoverId: String(h.handoverId) })),
      ]);
      if (detail.status === 'fulfilled') this.accountDetail.set(detail.value);
      if (txns.status === 'fulfilled') this.handoverTransactions.set(Array.isArray(txns.value) ? txns.value : []);
    } catch (e: any) {
      this.toast.error('Failed to load handover detail');
    } finally {
      this.loadingDetail.set(false);
    }
  }

  closeDetail(): void {
    this.selectedHandover.set(null);
    this.accountDetail.set(null);
    this.handoverTransactions.set([]);
  }

  async loadS129EligibleRuns(): Promise<void> {
    this.s129Loading.set(true);
    try {
      const runs: any = await firstValueFrom(
        this.api.get('/api/platinum/billing-debt/section129-runs-for-handover')
      );
      this.s129TrackedRuns.set(Array.isArray(runs) ? runs : []);
      this.s129Eligible.set([]);
      this.s129SelectedIds.set(new Set());
    } catch (e: any) {
      this.toast.error(e?.error?.message || e?.message || 'Failed to load eligible S129 runs');
    } finally {
      this.s129Loading.set(false);
    }
  }

  async loadS129RunAccounts(runId: number): Promise<void> {
    this.s129FilterRunId.set(runId);
    this.s129Loading.set(true);
    try {
      const data: any = await firstValueFrom(
        this.api.get('/api/platinum/billing-debt/section129-run-accounts-for-handover', { runId: String(runId) })
      );
      const accounts = data?.accounts || [];
      const eligible = accounts.filter((a: any) => !a.isAlreadyHandedOver);
      this.s129Eligible.set(eligible);
      this.s129SelectedIds.set(new Set());
    } catch (e: any) {
      this.toast.error(e?.error?.message || e?.message || 'Failed to load run accounts');
    } finally {
      this.s129Loading.set(false);
    }
  }

  toggleS129Account(id: number): void {
    this.s129SelectedIds.update(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  toggleS129SelectAll(): void {
    const eligible = this.s129Eligible();
    const selected = this.s129SelectedIds();
    if (selected.size === eligible.length) {
      this.s129SelectedIds.set(new Set());
    } else {
      this.s129SelectedIds.set(new Set(eligible.map((a: any) => a.accountId)));
    }
  }

  clearS129Selection(): void {
    this.s129SelectedIds.set(new Set());
    this.selectedAttorneyId.set('');
  }

  get s129SelectedAccounts(): any[] {
    return this.s129Eligible().filter((a: any) => this.s129SelectedIds().has(a.accountId));
  }

  get s129TotalSelected(): number { return this.s129SelectedIds().size; }

  get s129TotalAmount(): number {
    return this.s129SelectedAccounts.reduce((s, a) => s + (a.outstandingAmount || 0), 0);
  }

  async submitS129Handover(): Promise<void> {
    if (this.s129SelectedIds().size === 0) {
      this.toast.error('Select at least one account to handover'); return;
    }
    if (!this.selectedAttorneyId()) {
      this.toast.error('Select an attorney for the handover'); return;
    }
    if (!this.handedOverDate()) {
      this.toast.error('Please set a handover date.'); return;
    }
    const runId = this.s129FilterRunId();
    if (!runId) {
      this.toast.error('Select a Section 129 run first.'); return;
    }

    this.s129Submitting.set(true);
    try {
      const selectedAccounts = this.s129SelectedAccounts;
      const params: any = {
        handoverOption: 'fromSection129',
        attorneyId: parseInt(this.selectedAttorneyId(), 10),
        comment: this.handoverComment() || '',
        handedOverDate: this.handedOverDate(),
        section129RunId: runId,
        lapseDays: this.s129LapseDays(),
      };
      if (selectedAccounts.length < this.s129Eligible().length) {
        params.accountIds = selectedAccounts.map((a: any) => a.accountId);
      }

      const result: any = await firstValueFrom(
        this.api.post('/api/platinum/billing-debt/handover-submit', params)
      );

      const msg = result?.message || `${result?.totalAccounts || selectedAccounts.length} accounts submitted for handover.`;
      this.toast.success(msg);
      this.loadS129RunAccounts(runId);
      this.loadHandovers();
    } catch (e: any) {
      this.toast.error(e?.error?.message || e?.message || 'Failed to submit handover');
    } finally {
      this.s129Submitting.set(false);
    }
  }

  getStatusClass(status: string): string {
    const s = status.toLowerCase();
    if (s.includes('active')) return 'badge-success';
    if (s.includes('terminated') || s.includes('closed')) return 'badge-danger';
    if (s.includes('pending')) return 'badge-warning';
    return 'badge-outline';
  }

  prevPage(): void { this.currentPage.update(p => Math.max(1, p - 1)); }
  nextPage(): void { this.currentPage.update(p => Math.min(this.totalPages(), p + 1)); }
}
