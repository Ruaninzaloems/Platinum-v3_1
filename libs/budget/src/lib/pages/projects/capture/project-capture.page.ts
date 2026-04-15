import { Component, OnInit, OnDestroy, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { ApiService } from '../../../services/api.service';
import { ConstantsApiService } from '../../../services/constants-api.service';

export type WizardTab = 'details' | 'idp' | 'scoa-funding' | 'scoa-items' | 'register';

interface FundingLine {
  id?: number;
  scoaFundId: number;
  fundCode?: string;
  fundDescription?: string;
  fundAmount?: number;
  y1: number;
  y2: number;
  y3: number;
}

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

interface ProjectItem {
  id?: number;
  projectItem?: string;
  scoaItemId: number;
  scoaItemCode?: string;
  scoaItemDesc?: string;
  scoaItemPath?: string;
  scoaFundId?: number;
  scoaFundCode?: string;
  scoaFundDesc?: string;
  scoaFunctionId?: number;
  scoaFunctionDesc?: string;
  scoaRegionId?: number;
  scoaRegionDesc?: string;
  scoaCostingId?: number;
  scoaCostingDesc?: string;
  budgetAmount?: number;
  budgetAmountP1?: number;
  budgetAmountP2?: number;
  grapClassification?: string;
  grapNoteClassification?: string;
  mainSegmentReporting?: string;
  subSegmentReporting?: string;
  isActiveForScm?: boolean;
  municipalClassification?: string;
  splitType?: 'Monthly' | 'Quarterly' | 'BiAnnually' | 'Manually';
  monthlyAmounts?: number[];
}

@Component({
  selector: 'app-project-capture',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, MatIconModule, MatButtonModule,
    MatSelectModule, MatFormFieldModule, MatInputModule,
    MatCheckboxModule, MatProgressSpinnerModule, MatAutocompleteModule
  ],
  templateUrl: './project-capture.page.html',
  styleUrls: ['./project-capture.page.scss']
})
export class ProjectCapturePage implements OnInit, OnDestroy {
  activeTab: WizardTab = 'details';
  projectId: number | null = null;
  loading = false;
  saving = false;

  tabs: { key: WizardTab; label: string }[] = [
    { key: 'details', label: 'Project Details' },
    { key: 'idp', label: 'IDP' },
    { key: 'scoa-funding', label: 'SCOA Funding' },
    { key: 'scoa-items', label: 'SCOA Items' },
    { key: 'register', label: 'Register Project' }
  ];

  financialYears: string[] = [];

  scoaDrillItems: any[] = [];
  scoaDrillHistory: any[][] = [];
  scoaDrillPath: any[] = [];
  scoaDrillSelected: any = null;
  scoaDrillOpen = false;
  scoaStructureLoading = false;
  idpItems: any[] = [];

  statusOptions: any[] = [];
  budgetTypeOptions: any[] = [];
  private readonly budgetTypeNameToValue: Record<string, number> = { Capital: 1, Operational: 0, Revenue: 2, Mixed: 4 };
  singleMultiYearOptions = ['Single-Year', 'Multi-Year'];
  projectTypeOptions: any[] = [];

  municipalClassificationOptions = [
    'Capital Expenditure',
    'Operating Expenditure',
    'Transfer Payments',
    'Financial Assets',
    'Financial Liabilities',
    'Revenue'
  ];

  form: any = this.getEmptyForm();

  idpLinks: IdpLink[] = [];
  idpLoadError = false;
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

  scoaCostingItems: any[] = [];
  scoaFunctionItems: any[] = [];
  scoaRegionItems: any[] = [];
  filteredScoaRegions: any[] = [];
  scoaRegionFilter = '';

  scoaItemSearchCtrl = new FormControl('');
  scoaItemResults: any[] = [];
  scoaItemSelected: any = null;
  private scoaItemSearch$ = new Subject<string>();
  private scoaItemSub?: Subscription;

  projectItems: ProjectItem[] = [];
  projectItemsFilter: Record<string, string> = { scoaItemDesc: '', scoaFundDesc: '', scoaCostingDesc: '' };
  newItem: ProjectItem = this.getEmptyItem();
  editingItem: ProjectItem | null = null;
  fundBudgetDetails: any[] = [];
  editFundBudgetDetails: any[] = [];

  selectedItemIds = new Set<number>();
  itemPage = 1;
  readonly itemPageSize = 25;

  get selectAllChecked(): boolean {
    const ids = this.filteredProjectItems.map(i => i.id!).filter(Boolean);
    return ids.length > 0 && ids.every(id => this.selectedItemIds.has(id));
  }

  toggleSelectAll() {
    const ids = this.filteredProjectItems.map(i => i.id!).filter(Boolean);
    if (this.selectAllChecked) ids.forEach(id => this.selectedItemIds.delete(id));
    else ids.forEach(id => this.selectedItemIds.add(id));
  }

  toggleItemSelect(id: number) {
    if (this.selectedItemIds.has(id)) this.selectedItemIds.delete(id);
    else this.selectedItemIds.add(id);
  }

  get pagedItems(): ProjectItem[] {
    const start = (this.itemPage - 1) * this.itemPageSize;
    return this.filteredProjectItems.slice(start, start + this.itemPageSize);
  }

  get totalItemPages(): number {
    return Math.max(1, Math.ceil(this.filteredProjectItems.length / this.itemPageSize));
  }

  exportItemsExcel() { }
  exportItemsPdf() { }

  get projectHeaderLabel(): string {
    if (this.form.projectCode && this.form.projectName) {
      return `${this.form.projectCode} - ${this.form.projectName}`;
    }
    if (this.form.projectName) return this.form.projectName;
    return 'New Project';
  }

  get scoaDrillPathLabel(): string {
    return this.scoaDrillPath.map(n => n.scoaShortDesc || n.scoaDesc).join(' › ');
  }

  @HostListener('document:click')
  onDocumentClick() {
    if (this.scoaDrillOpen) this.scoaDrillOpen = false;
  }

  loadScoaStructureRoot() {
    const fy = this.form.financialYear;
    if (!fy) return;
    this.scoaDrillItems = [];
    this.scoaDrillHistory = [];
    this.scoaDrillPath = [];
    this.scoaDrillSelected = null;
    this.form.scoaProjectId = null;
    this.constantsApi.getScoaProjectConsolidated(true, undefined, fy, undefined, true).subscribe({
      next: data => { this.scoaDrillItems = data; this.cdr.detectChanges(); },
      error: () => {}
    });
  }

  toggleScoaDrill(event: MouseEvent) {
    event.stopPropagation();
    if (this.scoaDrillOpen) {
      this.scoaDrillOpen = false;
      return;
    }
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
      error: () => {
        this.scoaDrillHistory.pop();
        this.scoaDrillPath.pop();
        this.cdr.detectChanges();
      }
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

  restoreScoaStructurePath(scoaId: number) {
    this.constantsApi.getScoaProjectConsolidatedById(scoaId).subscribe(async (leaf: any) => {
      if (!leaf) return;
      this.scoaDrillSelected = leaf;
      this.form.scoaProjectId = leaf.scoaID;
      const path: any[] = [leaf];
      let current = leaf;
      while (current.scoaParentID) {
        const parent: any = await this.constantsApi.getScoaProjectConsolidatedById(current.scoaParentID).toPromise();
        if (!parent) break;
        path.unshift(parent);
        current = parent;
      }
      this.scoaDrillPath = path.slice(0, -1);
      const fy = this.form.financialYear;
      const rootItems = await this.constantsApi.getScoaProjectConsolidated(true, undefined, fy, undefined, true).toPromise() as any[];
      this.scoaDrillItems = rootItems || [];
      this.scoaDrillHistory = [rootItems || []];
      for (let i = 0; i < path.length - 1; i++) {
        const children = await this.constantsApi.getScoaProjectConsolidated(true, undefined, fy, path[i].scoaID).toPromise() as any[];
        if (i < path.length - 2) this.scoaDrillHistory.push(children || []);
        else this.scoaDrillItems = children || [];
      }
    });
  }

  get filteredIdpLinks(): IdpLink[] {
    return this.idpLinks.filter(l => {
      return (
        (!this.idpFilters['nationalKpa'] || (l.nationalKpa || '').toLowerCase().includes(this.idpFilters['nationalKpa'].toLowerCase())) &&
        (!this.idpFilters['mtsf'] || (l.mtsf || '').toLowerCase().includes(this.idpFilters['mtsf'].toLowerCase())) &&
        (!this.idpFilters['iudf'] || (l.iudf || '').toLowerCase().includes(this.idpFilters['iudf'].toLowerCase())) &&
        (!this.idpFilters['strategicObjective'] || (l.strategicObjective || '').toLowerCase().includes(this.idpFilters['strategicObjective'].toLowerCase())) &&
        (!this.idpFilters['idpProgram'] || (l.idpProgram || '').toLowerCase().includes(this.idpFilters['idpProgram'].toLowerCase())) &&
        (!this.idpFilters['percentage'] || String(l.percentage).includes(this.idpFilters['percentage'])) &&
        (!this.idpFilters['longitude'] || String(l.longitude ?? '').includes(this.idpFilters['longitude']))
      );
    });
  }

  get idpPercentageTotal(): number {
    return this.idpLinks.reduce((sum, l) => sum + (l.percentage || 0), 0);
  }

  get idpPercentageWarning(): boolean {
    return this.idpLinks.length > 0 && Math.abs(this.idpPercentageTotal - 100) > 0.001;
  }

  constructor(
    private api: ApiService,
    private constantsApi: ConstantsApiService,
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      this.projectId = id ? +id : null;
      if (this.projectId) this.loadProject();
      else this.loadScoaStructureRoot();
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
    ).subscribe(results => { this.scoaItemResults = results; });
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
  }

  onEditScoaItemInput(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.scoaItemSearch$.next(val);
  }

  selectEditScoaItem(item: any) {
    if (!this.editingItem) return;
    this.editingItem.scoaItemId = item.scoaID;
    this.editingItem.scoaItemCode = item.scoaCode;
    this.editingItem.scoaItemDesc = item.scoaShortDesc || item.scoaDesc;
    this.scoaItemSearchCtrl.setValue(item.scoaShortDesc || item.scoaDesc || item.scoaCode);
    this.scoaItemResults = [];
  }

  filterRegions(val: string) {
    this.scoaRegionFilter = val;
    const lower = val.toLowerCase();
    this.filteredScoaRegions = val.length >= 2
      ? this.scoaRegionItems.filter(r =>
          (r.scoaShortDesc || r.scoaDesc || '').toLowerCase().includes(lower) ||
          (r.scoaCode || '').toLowerCase().includes(lower))
      : this.scoaRegionItems.slice(0, 100);
  }

  get filteredFundingLines(): FundingLine[] {
    const f = this.fundingFilters;
    return this.fundingLines.filter(l =>
      (!f['fundCode'] || (l.fundCode || '').toLowerCase().includes(f['fundCode'].toLowerCase())) &&
      (!f['fundDescription'] || (l.fundDescription || '').toLowerCase().includes(f['fundDescription'].toLowerCase())) &&
      (!f['fundAmount'] || String(l.fundAmount ?? '').includes(f['fundAmount'])) &&
      (!f['y1'] || String(l.y1).includes(f['y1'])) &&
      (!f['y2'] || String(l.y2).includes(f['y2'])) &&
      (!f['y3'] || String(l.y3).includes(f['y3']))
    );
  }

  get fundingTotals(): { y1: number; y2: number; y3: number; total: number } {
    return {
      y1: this.fundingLines.reduce((s, l) => s + (l.y1 || 0), 0),
      y2: this.fundingLines.reduce((s, l) => s + (l.y2 || 0), 0),
      y3: this.fundingLines.reduce((s, l) => s + (l.y3 || 0), 0),
      total: this.fundingLines.reduce((s, l) => s + (l.y1 || 0) + (l.y2 || 0) + (l.y3 || 0), 0)
    };
  }

  get filteredProjectItems(): ProjectItem[] {
    const f = this.projectItemsFilter;
    return this.projectItems.filter(i =>
      (!f['scoaItemDesc'] || (i.scoaItemDesc || '').toLowerCase().includes(f['scoaItemDesc'].toLowerCase()) ||
        (i.scoaItemCode || '').toLowerCase().includes(f['scoaItemDesc'].toLowerCase())) &&
      (!f['scoaFundDesc'] || (i.scoaFundDesc || '').toLowerCase().includes(f['scoaFundDesc'].toLowerCase()) ||
        (i.scoaFundCode || '').toLowerCase().includes(f['scoaFundDesc'].toLowerCase())) &&
      (!f['scoaCostingDesc'] || (i.scoaCostingDesc || '').toLowerCase().includes(f['scoaCostingDesc'].toLowerCase()))
    );
  }

  get itemTotals() {
    const sum = (key: keyof ProjectItem) => this.projectItems.reduce((s, i) => s + ((i[key] as number) || 0), 0);
    return { budgetAmount: sum('budgetAmount'), budgetAmountP1: sum('budgetAmountP1'), budgetAmountP2: sum('budgetAmountP2') };
  }

  get newItemCostingLabel(): string {
    if (!this.newItem.scoaCostingId) return '';
    const c = this.scoaCostingItems.find(x => x.scoaID === this.newItem.scoaCostingId);
    return c ? c.scoaDesc : '';
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
      this.filteredScoaRegions = data.slice(0, 100);
    });
  }

  private loadBudgetTypes() {
    this.constantsApi.getPlanCapitalOperationalTypes().subscribe({
      next: data => {
        this.budgetTypeOptions = data
          .filter(t => t.typeValue != null)
          .sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99));
      },
      error: () => {}
    });
  }

  loadProjectTypes(finYear?: string) {
    const fy = finYear || this.form.financialYear;
    this.constantsApi.getProjectTypes(fy, true).subscribe({
      next: data => { this.projectTypeOptions = data; this.cdr.detectChanges(); },
      error: () => {}
    });
  }

  private loadProjectStatuses() {
    this.constantsApi.getStatuses('ProjectRegister').subscribe({
      next: data => {
        this.statusOptions = data.sort((a, b) => (a.status_ID ?? 99) - (b.status_ID ?? 99));
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

  private loadProject() {
    if (!this.projectId) return;
    this.loading = true;
    this.api.getProject(this.projectId).subscribe({
      next: (p: any) => {
        this.form = {
          projectCode: p.projectCode || '',
          projectName: p.projectName || '',
          projectDescription: p.description || '',
          financialYear: p.financialYear || '2025/2026',
          projectStatus: this.statusOptions.find(s => s.statusDesc?.toLowerCase() === p.status?.toLowerCase())?.status_ID ?? p.status,
          budgetType: this.budgetTypeNameToValue[p.type] ?? 1,
          singleMultiYear: p.singleMultiYear || 'Multi-Year',
          scoaProjectId: p.scoaProjectId || null,
          costingProject: p.costingProject || false,
          projectType: p.projectType ?? null,
          isRegistered: p.isRegistered || false
        };
        this.loading = false;
        if (p.scoaProjectId) {
          this.restoreScoaStructurePath(p.scoaProjectId);
        } else {
          this.loadScoaStructureRoot();
        }
        this.loadIdpLinks();
        this.loadFundingLines();
        this.loadProjectItems();
      },
      error: () => { this.loading = false; }
    });
  }

  loadIdpLinks() {
    if (!this.projectId) return;
    this.http.get<IdpLink[]>(`/api/projects/${this.projectId}/idp-links`).subscribe({
      next: links => { this.idpLinks = links; this.idpLoadError = false; },
      error: () => { this.idpLoadError = true; }
    });
  }

  addIdpLink() {
    if (!this.newIdpLink.idpItemId || this.newIdpLink.percentage == null) return;
    if (!this.projectId) {
      this.save(true, () => this.addIdpLink());
      return;
    }
    const body = {
      idpItemId: this.newIdpLink.idpItemId,
      percentage: this.newIdpLink.percentage,
      longitude: this.newIdpLink.longitude,
      latitude: this.newIdpLink.latitude
    };
    this.http.post<any>(`/api/projects/${this.projectId}/idp-links`, body).subscribe({
      next: () => {
        this.newIdpLink = { idpItemId: null, percentage: null, longitude: null, latitude: null };
        this.loadIdpLinks();
      }
    });
  }

  startEditIdpLink(link: IdpLink) { this.editingIdpLink = { ...link }; }
  cancelEditIdpLink() { this.editingIdpLink = null; }

  saveEditIdpLink() {
    if (!this.editingIdpLink || !this.projectId) return;
    const body = {
      idpItemId: this.editingIdpLink.idpItemId,
      percentage: this.editingIdpLink.percentage,
      longitude: this.editingIdpLink.longitude,
      latitude: this.editingIdpLink.latitude
    };
    this.http.put(`/api/projects/${this.projectId}/idp-links/${this.editingIdpLink.id}`, body).subscribe({
      next: () => { this.editingIdpLink = null; this.loadIdpLinks(); }
    });
  }

  deleteIdpLink(link: IdpLink) {
    if (!this.projectId || !link.id) return;
    if (!confirm('Delete this IDP link?')) return;
    this.http.delete(`/api/projects/${this.projectId}/idp-links/${link.id}`).subscribe({
      next: () => this.loadIdpLinks()
    });
  }

  getIdpItemLabel(itemId: number): string {
    const item = this.idpItems.find(i => i.item_ID === itemId);
    return item ? (item.itemDesc || '') : '';
  }

  get mtrefYears(): string[] {
    const base = this.form.financialYear || '2025/2026';
    const match = base.match(/(\d{4})\/(\d{4})/);
    if (!match) return [base, '', ''];
    const y1 = parseInt(match[1]);
    return [`${y1}/${y1+1}`, `${y1+1}/${y1+2}`, `${y1+2}/${y1+3}`];
  }

  private loadScoaFunds() {
    this.constantsApi.getScoaFundsConsolidatedPosting(this.form.financialYear || '2025/2026').subscribe(data => {
      this.scoaFunds = data;
    });
  }

  loadFundingLines() {
    if (!this.projectId) return;
    this.http.get<any[]>(`/api/projects/${this.projectId}/funding`).subscribe({
      next: lines => {
        const yrs = this.mtrefYears;
        this.fundingLines = lines.map(l => {
          const yArr = l.years || [];
          const getAmt = (yr: string) => yArr.find((y: any) => y.finYear === yr)?.yearFundAmount ?? 0;
          return {
            id: l.id,
            scoaFundId: l.scoaFundId,
            fundCode: l.fundCode,
            fundDescription: l.fundDescription,
            fundAmount: l.fundAmount,
            y1: getAmt(yrs[0]),
            y2: getAmt(yrs[1]),
            y3: getAmt(yrs[2])
          } as FundingLine;
        });
      }
    });
  }

  getScoaFundLabel(id: number): string {
    const f = this.scoaFunds.find(s => s.scoaID === id);
    return f ? `${f.scoaCode} - ${f.scoaShortDesc || f.scoaDesc}` : '';
  }

  addFundingLine() {
    if (!this.newFunding.scoaFundId) return;
    if (!this.projectId) {
      this.save(true, () => this.addFundingLine());
      return;
    }
    const yrs = this.mtrefYears;
    const body = {
      scoaFundId: this.newFunding.scoaFundId,
      yearAmounts: [
        { finYear: yrs[0], amount: this.newFunding.y1 ?? 0 },
        { finYear: yrs[1], amount: this.newFunding.y2 ?? 0 },
        { finYear: yrs[2], amount: this.newFunding.y3 ?? 0 }
      ]
    };
    this.http.post<any>(`/api/projects/${this.projectId}/funding`, body).subscribe({
      next: () => {
        this.newFunding = { scoaFundId: null, y1: null, y2: null, y3: null };
        this.loadFundingLines();
      }
    });
  }

  startEditFunding(line: FundingLine) { this.editingFunding = { ...line }; }
  cancelEditFunding() { this.editingFunding = null; }

  saveEditFunding() {
    if (!this.editingFunding || !this.projectId) return;
    const yrs = this.mtrefYears;
    const body = {
      scoaFundId: this.editingFunding.scoaFundId,
      yearAmounts: [
        { finYear: yrs[0], amount: this.editingFunding.y1 ?? 0 },
        { finYear: yrs[1], amount: this.editingFunding.y2 ?? 0 },
        { finYear: yrs[2], amount: this.editingFunding.y3 ?? 0 }
      ]
    };
    this.http.put(`/api/projects/${this.projectId}/funding/${this.editingFunding.id}`, body).subscribe({
      next: () => { this.editingFunding = null; this.loadFundingLines(); }
    });
  }

  deleteFundingLine(line: FundingLine) {
    if (!this.projectId || !line.id) return;
    if (!confirm('Delete this funding line?')) return;
    this.http.delete(`/api/projects/${this.projectId}/funding/${line.id}`).subscribe({
      next: () => this.loadFundingLines()
    });
  }

  loadProjectItems() {
    if (!this.projectId) return;
    this.http.get<ProjectItem[]>(`/api/projects/${this.projectId}/items`).subscribe({
      next: items => { this.projectItems = items; }
    });
  }

  onNewItemFundChange(scoaFundId: number | undefined) {
    this.fundBudgetDetails = [];
    if (!scoaFundId || !this.projectId) return;
    this.http.get<any[]>(`/api/projects/${this.projectId}/items/fund-budget/${scoaFundId}`).subscribe({
      next: rows => { this.fundBudgetDetails = rows; }
    });
  }

  onEditItemFundChange(scoaFundId: number | undefined) {
    this.editFundBudgetDetails = [];
    if (!scoaFundId || !this.projectId) return;
    this.http.get<any[]>(`/api/projects/${this.projectId}/items/fund-budget/${scoaFundId}`).subscribe({
      next: rows => { this.editFundBudgetDetails = rows; }
    });
  }

  get fundBudgetTotals() {
    return {
      available: this.fundBudgetDetails.reduce((s, r) => s + (r.available || 0), 0),
      allocated: this.fundBudgetDetails.reduce((s, r) => s + (r.allocated || 0), 0),
      remaining: this.fundBudgetDetails.reduce((s, r) => s + (r.remaining || 0), 0)
    };
  }

  get editFundBudgetTotals() {
    return {
      available: this.editFundBudgetDetails.reduce((s, r) => s + (r.available || 0), 0),
      allocated: this.editFundBudgetDetails.reduce((s, r) => s + (r.allocated || 0), 0),
      remaining: this.editFundBudgetDetails.reduce((s, r) => s + (r.remaining || 0), 0)
    };
  }

  addProjectItem() {
    if (!this.newItem.scoaItemId) return;
    if (!this.projectId) {
      this.save(true, () => this.addProjectItem());
      return;
    }
    const body = {
      scoaItemId: this.newItem.scoaItemId,
      scoaFundId: this.newItem.scoaFundId || null,
      scoaFunctionId: this.newItem.scoaFunctionId || null,
      scoaRegionId: this.newItem.scoaRegionId || null,
      scoaCostingId: this.newItem.scoaCostingId || null,
      budgetAmount: this.newItem.budgetAmount || null,
      budgetAmountP1: this.newItem.budgetAmountP1 || null,
      budgetAmountP2: this.newItem.budgetAmountP2 || null,
      finYear: this.form.financialYear,
      grapClassification: this.newItem.grapClassification || null,
      grapNoteClassification: this.newItem.grapNoteClassification || null,
      mainSegmentReporting: this.newItem.mainSegmentReporting || null,
      subSegmentReporting: this.newItem.subSegmentReporting || null,
      isActiveForScm: this.newItem.isActiveForScm || false,
      municipalClassification: this.newItem.municipalClassification || null,
      monthlyAmounts: this.buildMonthlyBody(this.newItem)
    };
    this.http.post<any>(`/api/projects/${this.projectId}/items`, body).subscribe({
      next: () => {
        this.newItem = this.getEmptyItem();
        this.scoaItemSearchCtrl.setValue('');
        this.scoaItemResults = [];
        this.fundBudgetDetails = [];
        this.loadProjectItems();
      }
    });
  }

  startEditItem(item: ProjectItem) {
    const months = new Array(12).fill(0);
    if (item.monthlyAmounts) {
      item.monthlyAmounts.forEach((m: any) => {
        if (m && typeof m === 'object' && 'monthId' in m) {
          months[m.monthId - 1] = m.amount || 0;
        } else if (typeof m === 'number') {
          months[item.monthlyAmounts!.indexOf(m)] = m;
        }
      });
    }
    this.editingItem = { ...item, splitType: item.splitType || 'Monthly', monthlyAmounts: months };
    this.scoaItemSearchCtrl.setValue(item.scoaItemDesc || item.scoaItemCode || '');
    if (item.scoaFundId) this.onEditItemFundChange(item.scoaFundId);
  }

  cancelEditItem() {
    this.editingItem = null;
    this.editFundBudgetDetails = [];
    this.scoaItemResults = [];
  }

  saveEditItem() {
    if (!this.editingItem || !this.projectId) return;
    const body = {
      scoaItemId: this.editingItem.scoaItemId,
      scoaFundId: this.editingItem.scoaFundId || null,
      scoaFunctionId: this.editingItem.scoaFunctionId || null,
      scoaRegionId: this.editingItem.scoaRegionId || null,
      scoaCostingId: this.editingItem.scoaCostingId || null,
      budgetAmount: this.editingItem.budgetAmount || null,
      budgetAmountP1: this.editingItem.budgetAmountP1 || null,
      budgetAmountP2: this.editingItem.budgetAmountP2 || null,
      finYear: this.form.financialYear,
      grapClassification: this.editingItem.grapClassification || null,
      grapNoteClassification: this.editingItem.grapNoteClassification || null,
      mainSegmentReporting: this.editingItem.mainSegmentReporting || null,
      subSegmentReporting: this.editingItem.subSegmentReporting || null,
      isActiveForScm: this.editingItem.isActiveForScm || false,
      municipalClassification: this.editingItem.municipalClassification || null,
      monthlyAmounts: this.buildMonthlyBody(this.editingItem)
    };
    this.http.put(`/api/projects/${this.projectId}/items/${this.editingItem.id}`, body).subscribe({
      next: () => { this.editingItem = null; this.editFundBudgetDetails = []; this.loadProjectItems(); }
    });
  }

  deleteProjectItem(item: ProjectItem) {
    if (!this.projectId || !item.id) return;
    if (!confirm('Delete this SCOA item?')) return;
    this.http.delete(`/api/projects/${this.projectId}/items/${item.id}`).subscribe({
      next: () => this.loadProjectItems()
    });
  }

  getScoaCostingLabel(id: number | undefined): string {
    if (!id) return '';
    const c = this.scoaCostingItems.find(x => x.scoaID === id);
    return c ? c.scoaDesc : '';
  }

  getScoaFunctionLabel(id: number | undefined): string {
    if (!id) return '';
    const c = this.scoaFunctionItems.find(x => x.scoaID === id);
    return c ? (c.scoaShortDesc || c.scoaDesc) : '';
  }

  getScoaRegionLabel(id: number | undefined): string {
    if (!id) return '';
    const c = this.scoaRegionItems.find(x => x.scoaID === id);
    return c ? (c.scoaShortDesc || c.scoaDesc) : '';
  }

  readonly monthLabels = ['July','August','September','October','November','December','January','February','March','April','May','June'];
  readonly monthCols = [[0,1,2,3],[4,5,6,7],[8,9,10,11]];

  get activeItem(): ProjectItem { return this.editingItem || this.newItem; }

  applySplit(item: ProjectItem) {
    const y1 = item.budgetAmount || 0;
    const months = item.monthlyAmounts!;
    months.fill(0);
    switch (item.splitType) {
      case 'Monthly':
        for (let i = 0; i < 12; i++) months[i] = Math.round((y1 / 12) * 100) / 100;
        break;
      case 'Quarterly':
        months[0] = months[3] = months[6] = months[9] = Math.round((y1 / 4) * 100) / 100;
        break;
      case 'BiAnnually':
        months[0] = Math.round((y1 / 2) * 100) / 100;
        months[6] = Math.round((y1 / 2) * 100) / 100;
        break;
    }
  }

  onSplitTypeChange(item: ProjectItem) {
    if (item.splitType !== 'Manually') this.applySplit(item);
  }

  onY1Change(item: ProjectItem) {
    if (item.splitType !== 'Manually') this.applySplit(item);
  }

  get splitBudgetTotal(): number {
    return (this.newItem.budgetAmount || 0) + (this.newItem.budgetAmountP1 || 0) + (this.newItem.budgetAmountP2 || 0);
  }

  get editSplitBudgetTotal(): number {
    if (!this.editingItem) return 0;
    return (this.editingItem.budgetAmount || 0) + (this.editingItem.budgetAmountP1 || 0) + (this.editingItem.budgetAmountP2 || 0);
  }

  private buildMonthlyBody(item: ProjectItem): Array<{monthId: number; amount: number}> {
    return (item.monthlyAmounts || []).map((a, i) => ({ monthId: i + 1, amount: a || 0 }));
  }

  getEmptyItem(): ProjectItem {
    return {
      scoaItemId: 0,
      scoaFundId: undefined,
      scoaFunctionId: undefined,
      scoaRegionId: undefined,
      scoaCostingId: undefined,
      budgetAmount: undefined,
      budgetAmountP1: undefined,
      budgetAmountP2: undefined,
      grapClassification: '',
      grapNoteClassification: '',
      mainSegmentReporting: '',
      subSegmentReporting: '',
      isActiveForScm: false,
      municipalClassification: '',
      projectItem: '',
      splitType: 'Monthly',
      monthlyAmounts: new Array(12).fill(0)
    };
  }

  getEmptyForm() {
    return {
      projectCode: '',
      projectName: '',
      projectDescription: '',
      financialYear: '2025/2026',
      projectStatus: 4 as number | null,
      budgetType: 1,
      singleMultiYear: 'Multi-Year',
      scoaProjectId: null as number | null,
      costingProject: false,
      projectType: null as number | null,
      isRegistered: false
    };
  }

  isTabActive(tab: WizardTab): boolean { return this.activeTab === tab; }

  isTabCompleted(tab: WizardTab): boolean {
    const order = ['details', 'idp', 'scoa-funding', 'scoa-items', 'register'];
    return order.indexOf(tab) < order.indexOf(this.activeTab);
  }

  selectTab(tab: WizardTab) { this.activeTab = tab; }

  next() {
    const order: WizardTab[] = ['details', 'idp', 'scoa-funding', 'scoa-items', 'register'];
    const idx = order.indexOf(this.activeTab);
    if (idx < order.length - 1) this.activeTab = order[idx + 1];
  }

  previous() {
    const order: WizardTab[] = ['details', 'idp', 'scoa-funding', 'scoa-items', 'register'];
    const idx = order.indexOf(this.activeTab);
    if (idx > 0) this.activeTab = order[idx - 1];
  }

  isLastTab(): boolean { return this.activeTab === 'register'; }
  isFirstTab(): boolean { return this.activeTab === 'details'; }

  save(silentNav = false, callback?: () => void) {
    this.saving = true;
    const payload = {
      projectCode: this.form.projectCode,
      projectName: this.form.projectName,
      description: this.form.projectDescription,
      type: this.form.budgetType,
      status: this.form.projectStatus,
      isRegistered: this.form.isRegistered
    };
    const obs = this.projectId
      ? this.api.updateProject(this.projectId, payload)
      : this.api.createProject(payload);
    obs.subscribe({
      next: (result: any) => {
        this.saving = false;
        if (!this.projectId && result?.id) {
          this.projectId = result.id;
          this.router.navigate(['/projects/capture', result.id], { replaceUrl: true });
        }
        if (callback) callback();
        else if (!silentNav) this.router.navigate(['/projects']);
      },
      error: () => { this.saving = false; }
    });
  }

  cancel() { this.router.navigate(['/projects']); }
}
