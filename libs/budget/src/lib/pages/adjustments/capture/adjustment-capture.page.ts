import { Component, OnInit, OnDestroy, HostListener, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl, NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { ConstantsApiService } from '../../../core/services/constants-api.service';

export type AdjTab = 'details' | 'idp' | 'scoa-funding' | 'scoa-items' | 'recommenders';

interface IdpLink {
  id?: number;
  idpItemId: number;
  percentage: number;
  longitude: number | null;
  latitude: number | null;
  nationalKpa?: string;
  mtsf?: string;
  iudf?: string;
  strategicObjective?: string;
  idpProgram?: string;
  editing?: boolean;
}

interface FundingLine {
  id?: number;
  scoaFundId: number;
  fundCode?: string;
  fundDescription?: string;
  y1: number;
  y2: number;
  y3: number;
}

interface AdjItem {
  id?: number;
  projectItem?: string;
  scoaItemId: number;
  scoaItemCode?: string;
  scoaItemDesc?: string;
  scoaItemPath?: string;
  scoaCostingPath?: string;
  scoaFundId?: number;
  scoaFundCode?: string;
  scoaFundDesc?: string;
  scoaFunctionId?: number;
  scoaFunctionDesc?: string;
  scoaRegionId?: number;
  scoaRegionDesc?: string;
  scoaCostingId?: number;
  scoaCostingDesc?: string;
  budget?: number;
  budgetAmount?: number;
  budgetAmountP1?: number;
  budgetAmountP2?: number;
  splitType?: 'Bi-Annually' | 'Manually' | 'Monthly' | 'Quarterly';
  monthlyAmounts?: number[];
  municipalClassification?: string;
  grapClassification?: string;
  grapNoteClassification?: string;
  mainSegmentReporting?: string;
  subSegmentReporting?: string;
  typeOfAdjustment?: string;
  legislativeReasonForAdjustment?: string;
  userReasonForAdjustment?: string;
  activeForScm?: boolean;
}

interface Recommender {
  id?: number;
  name: string;
  role: string;
  department: string;
  comment: string;
}

@Component({
  selector: 'app-adjustment-capture',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    MatIconModule, MatButtonModule, MatCheckboxModule, MatProgressSpinnerModule,
    MatFormFieldModule, MatInputModule, MatSelectModule
  ],
  templateUrl: './adjustment-capture.page.html',
  styleUrls: ['./adjustment-capture.page.scss']
})
export class AdjustmentCapturePage implements OnInit, OnDestroy {
  activeTab: AdjTab = 'details';
  projectId: number | null = null;
  planProjectId: number | null = null;
  loading = false;
  saving = false;
  detailsSaving = false;
  detailsErrors: Record<string, boolean> = {};
  detailsHasErrors = false;
  maxTabReached = 0;
  tabBannerError: string | null = null;

  tabs: { key: AdjTab; label: string }[] = [
    { key: 'details', label: 'Project Details' },
    { key: 'idp', label: 'IDP' },
    { key: 'scoa-funding', label: 'SCOA Funding' },
    { key: 'scoa-items', label: 'SCOA Items' },
    { key: 'recommenders', label: 'Recommenders' }
  ];

  tabOrder: AdjTab[] = ['details', 'idp', 'scoa-funding', 'scoa-items', 'recommenders'];

  form: any = this.getEmptyForm();

  financialYears: string[] = [];
  statusOptions: any[] = [];
  budgetTypeOptions: any[] = [];
  singleMultiYearOptions = ['Single-Year', 'Multi-Year'];
  projectTypeOptions: any[] = [];

  scoaDrillItems: any[] = [];
  scoaDrillHistory: any[][] = [];
  scoaDrillPath: any[] = [];
  scoaDrillSelected: any = null;
  scoaDrillOpen = false;
  scoaDrillOpenAbove = false;
  scoaStructureLoading = false;

  idpItems: any[] = [];
  idpLinks: IdpLink[] = [];
  idpFilters: Record<string, string> = {
    nationalKpa: '', mtsf: '', iudf: '', strategicObjective: '', idpProgram: '', percentage: '', longitude: ''
  };
  newIdpLink: { idpItemId: number | null; percentage: number | null; longitude: number | null; latitude: number | null } = {
    idpItemId: null, percentage: null, longitude: null, latitude: null
  };
  editingIdpLink: IdpLink | null = null;

  scoaFunds: any[] = [];
  fundingLines: FundingLine[] = [];
  fundingFilters: Record<string, string> = { fundCode: '', fundDescription: '', fundAmount: '', y1: '', y2: '', y3: '' };
  newFunding: { scoaFundId: number | null; y1: number | null; y2: number | null; y3: number | null } = {
    scoaFundId: null, y1: null, y2: null, y3: null
  };
  editingFunding: FundingLine | null = null;

  scoaItemSearchCtrl = new FormControl('');
  scoaItemResults: any[] = [];
  scoaItemSelected: any = null;
  private scoaItemSearch$ = new Subject<string>();
  private scoaItemSub?: Subscription;

  scoaCostingItems: any[] = [];
  scoaFunctionItems: any[] = [];
  scoaRegionItems: any[] = [];

  municipalClassificationOptions = [
    'Capital Expenditure', 'Operating Expenditure', 'Transfer Payments',
    'Financial Assets', 'Financial Liabilities', 'Revenue'
  ];
  typeOfAdjustmentOptions: string[] = ['Adjustment', 'Rollover', 'Virement', 'Correction', 'Emergency'];
  legislativeReasonOptions: string[] = [
    'MFMA Section 28 - Adjustment Budget',
    'MFMA Section 31 - Unforeseen Expenditure',
    'Council Resolution',
    'NT Directive',
    'MEC Approval'
  ];
  selectedDocumentFile: File | null = null;
  selectedDocumentName = '';

  adjItems: AdjItem[] = [];
  adjItemsFilter: Record<string, string> = { itemDescription: '', scoaItemDesc: '', scoaFundDesc: '' };
  adjItemsPage = 1;
  readonly adjItemsPageSize = 25;
  selectedAdjItemIds = new Set<number>();
  newItem: AdjItem = this.getEmptyItem();
  editingItem: AdjItem | null = null;

  recommenders: Recommender[] = [];
  newRecommender: Recommender = this.getEmptyRecommender();
  editingRecommender: Recommender | null = null;

  budgetUsers: any[] = [];
  firstRecommenderId: number | null = null;
  secondRecommenderId: number | null = null;
  finalRecommenderId: number | null = null;

  get recommenderSameWarning(): boolean {
    const ids = [this.firstRecommenderId, this.secondRecommenderId, this.finalRecommenderId]
      .filter(id => id !== null && id !== undefined);
    return ids.length !== new Set(ids).size;
  }

  get scoaDrillPathLabel(): string {
    return this.scoaDrillPath.map(n => n.scoaShortDesc || n.scoaDesc).join(' › ');
  }

  get idpPercentageTotal(): number {
    return this.idpLinks.reduce((sum, l) => sum + (l.percentage || 0), 0);
  }

  get idpPercentageWarning(): boolean {
    return this.idpLinks.length > 0 && Math.abs(this.idpPercentageTotal - 100) > 0.001;
  }

  get filteredIdpLinks(): IdpLink[] {
    return this.idpLinks.filter(l =>
      (!this.idpFilters['nationalKpa'] || (l.nationalKpa || '').toLowerCase().includes(this.idpFilters['nationalKpa'].toLowerCase())) &&
      (!this.idpFilters['mtsf'] || (l.mtsf || '').toLowerCase().includes(this.idpFilters['mtsf'].toLowerCase())) &&
      (!this.idpFilters['iudf'] || (l.iudf || '').toLowerCase().includes(this.idpFilters['iudf'].toLowerCase())) &&
      (!this.idpFilters['strategicObjective'] || (l.strategicObjective || '').toLowerCase().includes(this.idpFilters['strategicObjective'].toLowerCase())) &&
      (!this.idpFilters['idpProgram'] || (l.idpProgram || '').toLowerCase().includes(this.idpFilters['idpProgram'].toLowerCase())) &&
      (!this.idpFilters['percentage'] || String(l.percentage).includes(this.idpFilters['percentage'])) &&
      (!this.idpFilters['longitude'] || String(l.longitude ?? '').includes(this.idpFilters['longitude']))
    );
  }

  get filteredFundingLines(): FundingLine[] {
    const f = this.fundingFilters;
    return this.fundingLines.filter(l =>
      (!f['fundCode'] || (l.fundCode || '').toLowerCase().includes(f['fundCode'].toLowerCase())) &&
      (!f['fundDescription'] || (l.fundDescription || '').toLowerCase().includes(f['fundDescription'].toLowerCase()))
    );
  }

  get fundingTotals() {
    return {
      y1: this.fundingLines.reduce((s, l) => s + (l.y1 || 0), 0),
      y2: this.fundingLines.reduce((s, l) => s + (l.y2 || 0), 0),
      y3: this.fundingLines.reduce((s, l) => s + (l.y3 || 0), 0),
    };
  }

  get filteredAdjItems(): AdjItem[] {
    const f = this.adjItemsFilter;
    return this.adjItems.filter(i =>
      (!f['itemDescription'] || (i.scoaItemPath || i.scoaItemDesc || '').toLowerCase().includes(f['itemDescription'].toLowerCase())) &&
      (!f['scoaItemDesc'] || (i.scoaItemDesc || '').toLowerCase().includes(f['scoaItemDesc'].toLowerCase())) &&
      (!f['scoaFundDesc'] || (i.scoaFundDesc || '').toLowerCase().includes(f['scoaFundDesc'].toLowerCase()))
    );
  }

  get pagedAdjItems(): AdjItem[] {
    const start = (this.adjItemsPage - 1) * this.adjItemsPageSize;
    return this.filteredAdjItems.slice(start, start + this.adjItemsPageSize);
  }

  get totalAdjItemPages(): number {
    return Math.max(1, Math.ceil(this.filteredAdjItems.length / this.adjItemsPageSize));
  }

  get selectAllAdjChecked(): boolean {
    return this.pagedAdjItems.length > 0 &&
      this.pagedAdjItems.every((_, i) => this.selectedAdjItemIds.has(i));
  }

  toggleSelectAllAdj() {
    if (this.selectAllAdjChecked) {
      this.selectedAdjItemIds.clear();
    } else {
      this.pagedAdjItems.forEach((_, i) => this.selectedAdjItemIds.add(i));
    }
  }

  toggleAdjItemSelect(idx: number) {
    if (this.selectedAdjItemIds.has(idx)) {
      this.selectedAdjItemIds.delete(idx);
    } else {
      this.selectedAdjItemIds.add(idx);
    }
  }

  get itemTotals() {
    return {
      budgetAmount: this.adjItems.reduce((s, i) => s + (i.budgetAmount || 0), 0),
      budgetAmountP1: this.adjItems.reduce((s, i) => s + (i.budgetAmountP1 || 0), 0),
      budgetAmountP2: this.adjItems.reduce((s, i) => s + (i.budgetAmountP2 || 0), 0),
    };
  }

  get mtrefYears(): string[] {
    const base = this.form.financialYear || '2025/2026';
    const parts = base.split('/');
    const y1 = parseInt(parts[0]);
    if (isNaN(y1)) return [base, '', ''];
    return [`${y1}/${y1 + 1}`, `${y1 + 1}/${y1 + 2}`, `${y1 + 2}/${y1 + 3}`];
  }

  get projectHeaderLabel(): string {
    if (this.form.projectCode && this.form.projectName) return `${this.form.projectCode} - ${this.form.projectName}`;
    if (this.form.projectName) return this.form.projectName;
    return 'New Adjustment Project';
  }

  @HostListener('document:click')
  onDocumentClick() {
    if (this.scoaDrillOpen) this.scoaDrillOpen = false;
    if (this.scoaItemResults.length) this.scoaItemResults = [];
  }

  constructor(
    private api: ApiService,
    private constantsApi: ConstantsApiService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      this.projectId = id ? +id : null;
      if (!this.projectId) this.loadScoaStructureRoot();
    });
    this.loadReferenceData();
    this.loadBudgetTypes();
    this.loadProjectStatuses();
    this.initScoaItemSearch();
  }

  ngOnDestroy() {
    this.scoaItemSub?.unsubscribe();
  }

  private initScoaItemSearch() {
    this.scoaItemSub = this.scoaItemSearch$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => term.length >= 2
        ? this.constantsApi.searchScoaStructureConsolidated(term, 'Yes', 50)
        : [])
    ).subscribe(results => { this.scoaItemResults = results; this.cdr.detectChanges(); });
  }

  get selectedFundDetails(): { rows: { year: string; available: number; allocated: number; remaining: number }[]; totals: any } {
    const fundId = this.newItem.scoaFundId;
    if (!fundId) return { rows: [], totals: { available: 0, allocated: 0, remaining: 0 } };
    const line = this.fundingLines.find(f => f.scoaFundId === fundId);
    const yrs = this.mtrefYears;
    const avail = [line?.y1 || 0, line?.y2 || 0, line?.y3 || 0];
    const alloc = [
      this.adjItems.filter(i => i.scoaFundId === fundId).reduce((s, i) => s + (i.budgetAmount || 0), 0),
      this.adjItems.filter(i => i.scoaFundId === fundId).reduce((s, i) => s + (i.budgetAmountP1 || 0), 0),
      this.adjItems.filter(i => i.scoaFundId === fundId).reduce((s, i) => s + (i.budgetAmountP2 || 0), 0),
    ];
    const rows = yrs.map((year, i) => ({ year, available: avail[i], allocated: alloc[i], remaining: avail[i] - alloc[i] }));
    const totals = {
      available: rows.reduce((s, r) => s + r.available, 0),
      allocated: rows.reduce((s, r) => s + r.allocated, 0),
      remaining: rows.reduce((s, r) => s + r.remaining, 0)
    };
    return { rows, totals };
  }

  private loadReferenceData() {
    this.api.getFinancialYears().subscribe(years => {
      this.financialYears = years.map((y: any) => y.yearCode || y.description || '').filter(Boolean);
      if (!this.form.financialYear && this.financialYears.length) {
        this.form.financialYear = this.financialYears.find((y: string) => y.includes('2025')) || this.financialYears[0];
      }
      this.loadIdpItems();
      this.loadScoaFunds();
      this.loadProjectTypes(this.form.financialYear);
      if (!this.scoaDrillItems.length) this.loadScoaStructureRoot();
    });

    this.constantsApi.getScoaCostingConsolidated(true, 'Yes').subscribe(data => {
      this.scoaCostingItems = data;
    });

    this.constantsApi.getScoaFunctionConsolidatedPosting().subscribe(data => {
      this.scoaFunctionItems = data;
    });

    this.constantsApi.getScoaRegionalConsolidatedPosting().subscribe(data => {
      this.scoaRegionItems = data;
    });

    this.http.get<any[]>('/budget-app/api/BudgetUsers').subscribe({
      next: data => this.budgetUsers = data,
      error: () => {}
    });
  }

  private loadBudgetTypes() {
    this.constantsApi.getPlanCapitalOperationalTypes().subscribe({
      next: data => {
        this.budgetTypeOptions = data
          .filter((t: any) => t.typeValue != null)
          .sort((a: any, b: any) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99));
      },
      error: () => {}
    });
  }

  private loadProjectStatuses() {
    this.constantsApi.getStatuses('ProjectRegister').subscribe({
      next: data => {
        this.statusOptions = data.sort((a: any, b: any) => (a.status_ID ?? 99) - (b.status_ID ?? 99));
        if (!this.projectId && this.form.projectStatus == null) {
          this.form.projectStatus = 4;
        }
      },
      error: () => {}
    });
  }

  private loadIdpItems() {
    const fy = this.form.financialYear || '2025/2026';
    this.constantsApi.getIdpItems(fy, 5).subscribe(items => {
      this.idpItems = items;
    });
  }

  private loadScoaFunds() {
    this.constantsApi.getScoaFundsConsolidatedPosting(this.form.financialYear || '2025/2026').subscribe(data => {
      this.scoaFunds = data;
    });
  }

  loadProjectTypes(finYear?: string) {
    const fy = finYear || this.form.financialYear;
    this.constantsApi.getProjectTypes(fy, true).subscribe({
      next: data => { this.projectTypeOptions = data; this.cdr.detectChanges(); },
      error: () => {}
    });
  }

  loadScoaStructureRoot() {
    const fy = this.form.financialYear;
    if (!fy) return;
    this.scoaDrillItems = [];
    this.scoaDrillHistory = [];
    this.scoaDrillPath = [];
    this.scoaDrillSelected = null;
    this.form.scoaProjectId = null;
    this.scoaStructureLoading = true;
    this.constantsApi.getScoaProjectConsolidated(true, undefined, fy, undefined, true).subscribe({
      next: data => { this.scoaDrillItems = data; this.scoaStructureLoading = false; this.cdr.detectChanges(); },
      error: () => { this.scoaStructureLoading = false; }
    });
  }

  toggleScoaDrill(event: MouseEvent) {
    event.stopPropagation();
    if (this.scoaDrillOpen) { this.scoaDrillOpen = false; return; }
    const trigger = event.currentTarget as HTMLElement;
    const rect = trigger.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    this.scoaDrillOpenAbove = spaceBelow < 340 && rect.top > spaceBelow;
    this.scoaDrillOpen = true;
    if (this.scoaDrillItems.length === 0 && !this.scoaStructureLoading) {
      const fy = this.form.financialYear;
      if (!fy) return;
      this.scoaStructureLoading = true;
      this.constantsApi.getScoaProjectConsolidated(true, undefined, fy, undefined, true).subscribe({
        next: data => { this.scoaDrillItems = data; this.scoaStructureLoading = false; this.cdr.detectChanges(); },
        error: () => { this.scoaStructureLoading = false; this.cdr.detectChanges(); }
      });
    }
  }

  onScoaDrillSelect(node: any, event: MouseEvent) {
    event.stopPropagation();
    if (node.postingLevel === 'Yes') {
      this.scoaDrillSelected = node;
      this.form.scoaProjectId = node.scoaID;
      this.clearDetailError('scoaProjectId');
      this.scoaDrillOpen = false;
      return;
    }
    this.scoaDrillHistory.push([...this.scoaDrillItems]);
    this.scoaDrillPath.push(node);
    this.constantsApi.getScoaProjectConsolidated(true, undefined, this.form.financialYear, node.scoaID).subscribe({
      next: children => {
        if (children.length === 0) {
          this.scoaDrillSelected = node;
          this.form.scoaProjectId = node.scoaID;
          this.scoaDrillHistory.pop();
          this.scoaDrillPath.pop();
          this.scoaDrillOpen = false;
        } else {
          this.scoaDrillItems = children;
        }
        this.cdr.detectChanges();
      },
      error: () => { this.scoaDrillHistory.pop(); this.scoaDrillPath.pop(); }
    });
  }

  scoaDrillBack() {
    if (this.scoaDrillHistory.length > 0) {
      this.scoaDrillItems = this.scoaDrillHistory.pop()!;
      this.scoaDrillPath.pop();
    }
  }

  clearScoaDrill(event: MouseEvent) {
    event.stopPropagation();
    this.scoaDrillSelected = null;
    this.form.scoaProjectId = null;
    this.scoaDrillHistory = [];
    this.scoaDrillPath = [];
    this.loadScoaStructureRoot();
  }

  onFinancialYearChange() {
    this.loadProjectTypes(this.form.financialYear);
    this.loadIdpItems();
    this.loadScoaFunds();
    this.loadScoaStructureRoot();
  }

  getIdpLabel(idpItemId: number): string {
    const item = this.idpItems.find(i => i.item_ID === idpItemId);
    if (!item) return '';
    return item.idpProgram || item.idpDescription || '';
  }

  addIdpLink() {
    if (!this.newIdpLink.idpItemId || !this.newIdpLink.percentage) return;
    const item = this.idpItems.find(i => i.item_ID === this.newIdpLink.idpItemId);
    const link: IdpLink = {
      idpItemId: this.newIdpLink.idpItemId!,
      percentage: this.newIdpLink.percentage!,
      longitude: this.newIdpLink.longitude,
      latitude: this.newIdpLink.latitude,
      nationalKpa: item?.nationalKPA || '',
      mtsf: item?.mtsf || '',
      iudf: item?.iudf || '',
      strategicObjective: item?.strategicObjective || '',
      idpProgram: item?.idpProgram || item?.idpDescription || ''
    };
    this.idpLinks = [...this.idpLinks, link];
    this.newIdpLink = { idpItemId: null, percentage: null, longitude: null, latitude: null };
  }

  editIdpLink(link: IdpLink) {
    this.editingIdpLink = { ...link };
  }

  saveEditIdpLink() {
    if (!this.editingIdpLink) return;
    const idx = this.idpLinks.findIndex(l => l.idpItemId === this.editingIdpLink!.idpItemId);
    if (idx >= 0) {
      this.idpLinks = [...this.idpLinks.slice(0, idx), { ...this.editingIdpLink }, ...this.idpLinks.slice(idx + 1)];
    }
    this.editingIdpLink = null;
  }

  cancelEditIdpLink() { this.editingIdpLink = null; }

  deleteIdpLink(idx: number) {
    this.idpLinks = this.idpLinks.filter((_, i) => i !== idx);
  }

  getFundLabel(scoaFundId: number): string {
    const f = this.scoaFunds.find(s => s.scoaID === scoaFundId);
    return f ? `${f.scoaCode || ''} - ${f.scoaShortDesc || f.scoaDesc || ''}` : '';
  }

  addFundingLine() {
    if (!this.newFunding.scoaFundId) return;
    const f = this.scoaFunds.find(s => s.scoaID === this.newFunding.scoaFundId);
    const line: FundingLine = {
      scoaFundId: this.newFunding.scoaFundId!,
      fundCode: f?.scoaCode || '',
      fundDescription: f?.scoaShortDesc || f?.scoaDesc || '',
      y1: this.newFunding.y1 || 0,
      y2: this.newFunding.y2 || 0,
      y3: this.newFunding.y3 || 0
    };
    this.fundingLines = [...this.fundingLines, line];
    this.newFunding = { scoaFundId: null, y1: null, y2: null, y3: null };
  }

  editFundingLine(line: FundingLine) {
    this.editingFunding = { ...line };
  }

  saveEditFunding() {
    if (!this.editingFunding) return;
    const idx = this.fundingLines.findIndex(l => l.scoaFundId === this.editingFunding!.scoaFundId);
    if (idx >= 0) {
      this.fundingLines = [...this.fundingLines.slice(0, idx), { ...this.editingFunding }, ...this.fundingLines.slice(idx + 1)];
    }
    this.editingFunding = null;
  }

  cancelEditFunding() { this.editingFunding = null; }

  deleteFundingLine(idx: number) {
    this.fundingLines = this.fundingLines.filter((_, i) => i !== idx);
  }

  onScoaItemInput(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.scoaItemSearch$.next(val);
    if (!val) { this.scoaItemSelected = null; this.newItem.scoaItemId = 0; }
  }

  selectScoaItem(item: any) {
    this.scoaItemSelected = item;
    this.newItem.scoaItemId = item.scoaID;
    this.newItem.scoaItemCode = item.scoaCode;
    this.newItem.scoaItemDesc = item.scoaShortDesc || item.scoaDesc;
    this.scoaItemSearchCtrl.setValue(item.scoaShortDesc || item.scoaDesc || item.scoaCode);
    this.scoaItemResults = [];
  }

  addAdjItem() {
    if (!this.newItem.scoaItemId) return;
    this.adjItems = [...this.adjItems, { ...this.newItem }];
    this.newItem = this.getEmptyItem();
    this.scoaItemSelected = null;
    this.scoaItemSearchCtrl.setValue('');
  }

  editAdjItem(item: AdjItem) {
    this.editingItem = { ...item };
  }

  saveEditItem() {
    if (!this.editingItem) return;
    const idx = this.adjItems.findIndex(i => i === this.editingItem || i.scoaItemId === this.editingItem!.scoaItemId);
    if (idx >= 0) {
      this.adjItems = [...this.adjItems.slice(0, idx), { ...this.editingItem }, ...this.adjItems.slice(idx + 1)];
    }
    this.editingItem = null;
  }

  cancelEditItem() { this.editingItem = null; }

  deleteAdjItem(idx: number) {
    this.adjItems = this.adjItems.filter((_, i) => i !== idx);
  }

  getCostingLabel(id: number | undefined): string {
    if (!id) return '';
    const c = this.scoaCostingItems.find(x => x.scoaID === id);
    return c ? c.scoaDesc : '';
  }

  addRecommender() {
    if (!this.newRecommender.name.trim()) return;
    this.recommenders = [...this.recommenders, { ...this.newRecommender }];
    this.newRecommender = this.getEmptyRecommender();
  }

  editRecommender(r: Recommender) {
    this.editingRecommender = { ...r };
  }

  saveEditRecommender() {
    if (!this.editingRecommender) return;
    const idx = this.recommenders.findIndex(r => r === this.editingRecommender || r.name === this.editingRecommender!.name);
    if (idx >= 0) {
      this.recommenders = [...this.recommenders.slice(0, idx), { ...this.editingRecommender }, ...this.recommenders.slice(idx + 1)];
    }
    this.editingRecommender = null;
  }

  cancelEditRecommender() { this.editingRecommender = null; }

  deleteRecommender(idx: number) {
    this.recommenders = this.recommenders.filter((_, i) => i !== idx);
  }

  isTabActive(tab: AdjTab): boolean { return this.activeTab === tab; }

  isTabCompleted(tab: AdjTab): boolean {
    return this.tabOrder.indexOf(tab) < this.tabOrder.indexOf(this.activeTab);
  }

  selectTab(tab: AdjTab) {
    const targetIdx = this.tabOrder.indexOf(tab);
    if (targetIdx <= this.maxTabReached) {
      this.tabBannerError = null;
      this.activeTab = tab;
    }
  }

  isTabLocked(tab: AdjTab): boolean {
    return this.tabOrder.indexOf(tab) > this.maxTabReached;
  }

  next() {
    this.tabBannerError = null;

    if (this.activeTab === 'details') {
      if (!this.validateDetailsTab()) return;
      this.savePlanProject();
      return;
    }

    if (this.activeTab === 'idp') {
      if (this.idpLinks.length === 0) {
        this.tabBannerError = 'At least one IDP Link must be added before continuing.';
        return;
      }
      if (Math.abs(this.idpPercentageTotal - 100) > 0.001) {
        this.tabBannerError = `IDP percentages must total 100%. Current total: ${this.idpPercentageTotal.toFixed(2)}%`;
        return;
      }
    }

    if (this.activeTab === 'scoa-funding') {
      if (this.fundingLines.length === 0) {
        this.tabBannerError = 'At least one Funding Line must be added before continuing.';
        return;
      }
    }

    if (this.activeTab === 'scoa-items') {
      if (this.adjItems.length === 0) {
        this.tabBannerError = 'At least one SCOA Item must be added before continuing.';
        return;
      }
    }

    const idx = this.tabOrder.indexOf(this.activeTab);
    if (idx < this.tabOrder.length - 1) {
      this.maxTabReached = Math.max(this.maxTabReached, idx + 1);
      this.activeTab = this.tabOrder[idx + 1];
    }
  }

  validateDetailsTab(): boolean {
    const errors: Record<string, boolean> = {};
    if (!this.form.projectName?.trim()) errors['projectName'] = true;
    if (!this.form.projectDescription?.trim()) errors['projectDescription'] = true;
    if (this.form.projectStatus == null) errors['projectStatus'] = true;
    if (this.form.budgetType == null) errors['budgetType'] = true;
    if (!this.form.singleMultiYear) errors['singleMultiYear'] = true;
    if (!this.form.scoaProjectId || !this.scoaDrillSelected || this.scoaDrillSelected.postingLevel !== 'Yes') errors['scoaProjectId'] = true;
    this.detailsErrors = { ...errors };
    this.detailsHasErrors = Object.keys(errors).length > 0;
    this.cdr.detectChanges();
    return !this.detailsHasErrors;
  }

  clearDetailError(field: string) {
    if (this.detailsErrors[field]) {
      this.detailsErrors = { ...this.detailsErrors, [field]: false };
      this.detailsHasErrors = Object.values(this.detailsErrors).some(v => v === true);
      this.cdr.detectChanges();
    }
  }

  savePlanProject() {
    this.detailsSaving = true;
    const payload: any = {
      ProjectName: this.form.projectName?.trim(),
      ProjectDesc: this.form.projectDescription?.trim(),
      CapitalOperation: this.form.budgetType,
      ScoaProjectID: this.form.scoaProjectId,
      ProjectStatus: this.form.projectStatus,
      FinYear: this.form.financialYear,
      ProjectTypeID: this.form.projectType ?? null,
      SingleMultiYear: this.form.singleMultiYear,
      CapturerID: 1,
      DateCaptured: new Date().toISOString()
    };

    const req = this.planProjectId
      ? this.http.put(`/api/ems/plan-project/plan-project/${this.planProjectId}`, { ...payload, Project_ID: this.planProjectId })
      : this.http.post<any>('/budget-app/api/ems/plan-project/plan-project', { ...payload, Project_ID: 0 });

    req.subscribe({
      next: (result: any) => {
        this.detailsSaving = false;
        if (!this.planProjectId && result?.Project_ID) {
          this.planProjectId = result.Project_ID;
        }
        const idx = this.tabOrder.indexOf(this.activeTab);
        if (idx < this.tabOrder.length - 1) {
          this.maxTabReached = Math.max(this.maxTabReached, idx + 1);
          this.activeTab = this.tabOrder[idx + 1];
        }
      },
      error: () => { this.detailsSaving = false; }
    });
  }

  previous() {
    this.tabBannerError = null;
    const idx = this.tabOrder.indexOf(this.activeTab);
    if (idx > 0) this.activeTab = this.tabOrder[idx - 1];
  }

  isLastTab(): boolean { return this.activeTab === 'recommenders'; }
  isFirstTab(): boolean { return this.activeTab === 'details'; }

  save() {
    this.tabBannerError = null;
    if (!this.firstRecommenderId) {
      this.tabBannerError = 'A First Recommender must be selected before finishing.';
      return;
    }
    this.saving = true;
    const payload = {
      projectCode: this.form.projectCode,
      projectName: this.form.projectName,
      description: this.form.projectDescription,
      type: this.form.budgetType,
      status: this.form.projectStatus
    };
    const obs = this.projectId
      ? this.api.updateProject(this.projectId, payload)
      : this.api.createProject(payload);
    obs.subscribe({
      next: (result: any) => {
        this.saving = false;
        if (!this.projectId && result?.id) {
          this.projectId = result.id;
          this.router.navigate(['/adjustments/capture', result.id], { replaceUrl: true });
        }
        this.router.navigate(['/adjustments/request']);
      },
      error: () => { this.saving = false; }
    });
  }

  cancel() { this.router.navigate(['/adjustments/request']); }

  getEmptyForm() {
    return {
      projectCode: '',
      projectName: '',
      projectDescription: '',
      financialYear: '2025/2026',
      projectStatus: 4 as number | null,
      budgetType: null as number | null,
      singleMultiYear: '',
      scoaProjectId: null as number | null,
      costingProject: false,
      projectType: null as number | null
    };
  }

  onDocumentFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedDocumentFile = input.files[0];
      this.selectedDocumentName = input.files[0].name;
    }
  }

  onFundSelectChange() {
    this.cdr.detectChanges();
  }

  getCostingPath(costingId: number | undefined): string {
    if (!costingId) return '';
    const c = this.scoaCostingItems.find(x => x.scoaID === costingId);
    if (!c) return '';
    return (c.scoaShortDesc || c.scoaDesc || '') + ' ' + (c.scoaCode || '');
  }

  getFunctionLabel(id: number | undefined): string {
    if (!id) return '';
    const f = this.scoaFunctionItems.find(x => x.scoaID === id);
    return f ? (f.scoaShortDesc || f.scoaDesc || '') : '';
  }

  getRegionLabel(id: number | undefined): string {
    if (!id) return '';
    const r = this.scoaRegionItems.find(x => x.scoaID === id);
    return r ? (r.scoaShortDesc || r.scoaDesc || '') : '';
  }

  getEmptyItem(): AdjItem {
    return {
      scoaItemId: 0,
      projectItem: '',
      scoaItemCode: '',
      scoaItemDesc: '',
      scoaItemPath: '',
      scoaCostingPath: '',
      scoaFundId: undefined,
      scoaFundCode: '',
      scoaFundDesc: '',
      scoaFunctionId: undefined,
      scoaFunctionDesc: '',
      scoaRegionId: undefined,
      scoaRegionDesc: '',
      scoaCostingId: undefined,
      scoaCostingDesc: '',
      budget: undefined,
      budgetAmount: undefined,
      budgetAmountP1: undefined,
      budgetAmountP2: undefined,
      splitType: 'Monthly',
      monthlyAmounts: new Array(12).fill(undefined),
      municipalClassification: '',
      grapClassification: '',
      grapNoteClassification: '',
      mainSegmentReporting: '',
      subSegmentReporting: '',
      typeOfAdjustment: '',
      legislativeReasonForAdjustment: '',
      userReasonForAdjustment: '',
      activeForScm: false
    };
  }

  getEmptyRecommender(): Recommender {
    return { name: '', role: '', department: '', comment: '' };
  }
}
