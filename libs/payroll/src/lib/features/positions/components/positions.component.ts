import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { UiService } from '../../../core/services/ui.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { DateInputComponent } from '../../../shared/components/date-input/date-input.component';
import { DateSaPipe } from '../../../shared/pipes/date-sa.pipe';
import { ScoaDrilldownComponent } from '../../../shared/components/scoa-drilldown/scoa-drilldown.component';
import { DivisionCascadeComponent } from '../../../shared/components/division-cascade/division-cascade.component';
import { SearchablePickerComponent } from '../../../shared/components/searchable-picker/searchable-picker.component';

@Component({
  selector: 'app-positions',
  standalone: true,
  host: { 'data-accent': 'talent' },
  imports: [CommonModule, FormsModule, IconComponent, StatusBadgeComponent, PaginationComponent, DateInputComponent, DateSaPipe, ScoaDrilldownComponent, DivisionCascadeComponent, SearchablePickerComponent],
  templateUrl: './positions.component.html',
  styleUrl: './positions.component.css'
})
export class PositionsComponent implements OnInit {
  positions: any[] = [];
  filteredPositions: any[] = [];
  loading = true;
  searchTerm = '';
  page = 1;
  limit = 25;

  view: 'list' | 'detail' = 'list';
  mode: 'create' | 'view' | 'edit' = 'view';
  activeTab = 'position';
  position: any = {};
  currentIndex = -1;

  departments: any[] = [];
  divisions: any[] = [];
  jobProfiles: any[] = [];
  taskGrades: any[] = [];
  employeeTypes: any[] = [];
  employeeSubtypes: any[] = [];
  conditionsOfService: any[] = [];
  salaryTransactionGroups: any[] = [];
  scoaItems: any[] = [];
  scoaFunctions: any[] = [];
  scoaExpenseItems: any[] = [];
  scoaExpenseItemsLoading = false;
  resolvedProjectName: string = '';
  resolvedRegionName: string = '';
  private _resolveVersion = 0;

  planProjectItems: any[] = [];
  planProjectItemsLoading = false;
  planProjectItemsStatus: 'idle' | 'loaded' | 'error' = 'idle';
  private _planProjectItemsScoaId: string | null = null;
  private _planLoadVersion = 0;

  budgetProjects: any[] = [];
  budgetProjectsStatus: 'idle' | 'loaded' | 'error' = 'idle';
  private _budgetProjectsKey: string | null = null;
  private _budgetProjectsVersion = 0;

  budgetRegions: any[] = [];
  budgetRegionsStatus: 'idle' | 'loaded' | 'error' = 'idle';
  private _budgetRegionsKey: string | null = null;
  private _budgetRegionsVersion = 0;

  budgetFunds: any[] = [];
  budgetFundsStatus: 'idle' | 'loaded' | 'error' = 'idle';
  private _budgetFundsKey: string | null = null;
  private _budgetFundsVersion = 0;
  resolvedFundName: string = '';

  history: any[] = [];
  headerSearch = '';
  showQuantityModal = false;
  pendingQuantity = 1;
  private _pendingPayload: any = null;

  constructor(private api: ApiService, private ui: UiService, public cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.load();
    this.loadLookups();
  }

  load(): void {
    this.loading = true;
    this.api.get<any[]>('/positions?limit=9999').subscribe({
      next: (data) => {
        this.positions = data || [];
        this.filterPositions();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  loadLookups(): void {
    this.api.get<any[]>('/departments').subscribe({
      next: (d) => { this.departments = d || []; this.cdr.detectChanges(); },
      error: () => {}
    });

    this.api.get<any>('/positions/lookups/positions-all').subscribe({
      next: (data) => {
        this.divisions = data?.divisions || [];
        this.jobProfiles = data?.job_profiles || [];
        this.taskGrades = data?.task_grades || [];
        this.employeeTypes = data?.employee_types || [];
        this.employeeSubtypes = data?.employee_subtypes || [];
        this.conditionsOfService = data?.conditions_of_service || [];
        this.salaryTransactionGroups = data?.salary_transaction_groups || [];
        this.scoaItems = data?.scoa_items || [];
        this.scoaFunctions = data?.scoa_functions || [];
        if (this.position?.division_id && !this.position._division_scoa_function_code) {
          this.resolveDivisionScoaFunctionCode();
        }
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  filterPositions(): void {
    const s = this.searchTerm.toLowerCase();
    this.filteredPositions = !s ? [...this.positions] :
      this.positions.filter(p =>
        (p.position_code || '').toLowerCase().includes(s) ||
        (p.title || '').toLowerCase().includes(s) ||
        (p.department_name || '').toLowerCase().includes(s) ||
        (p.job_title || '').toLowerCase().includes(s) ||
        (p.incumbent_first_name || '').toLowerCase().includes(s) ||
        (p.incumbent_surname || '').toLowerCase().includes(s)
      );
    this.page = 1;
  }

  get totalCount(): number { return this.positions.length; }
  get fundedCount(): number { return this.positions.filter(p => p.funded).length; }
  get vacantCount(): number { return this.positions.filter(p => (p.status || '').toUpperCase() === 'VACANT').length; }
  get filledCount(): number { return this.positions.filter(p => (p.status || '').toUpperCase() === 'FILLED').length; }

  get pagedPositions(): any[] {
    const start = (this.page - 1) * this.limit;
    return this.filteredPositions.slice(start, start + this.limit);
  }

  openCreate(): void {
    this.position = {
      enabled: true, status: 'VACANT', funded: true, capacity: 1,
      manager_type: 0, is_hod: false, non_employee: false,
      performance_assessment: false, lock_fields: false,
      start_date: '1900-01-01', end_date: '9999-12-31'
    };
    this.mode = 'create';
    this.view = 'detail';
    this.activeTab = 'position';
    this.history = [];
    this.resolvedProjectName = '';
    this.resolvedRegionName = '';
    this.planProjectItems = [];
    this._planProjectItemsScoaId = null;
    this.planProjectItemsStatus = 'idle';
    this.budgetProjects = [];
    this._budgetProjectsKey = null;
    this.budgetProjectsStatus = 'idle';
    this.budgetRegions = [];
    this._budgetRegionsKey = null;
    this.budgetRegionsStatus = 'idle';
    this.budgetFunds = [];
    this._budgetFundsKey = null;
    this.budgetFundsStatus = 'idle';
    this.resolvedFundName = '';
    this.showQuantityModal = false;
    this.pendingQuantity = 1;
    this._pendingPayload = null;
    this.cdr.detectChanges();
  }

  openDetail(item: any, idx?: number): void {
    this.api.get<any>(`/positions/${item.id}`).subscribe({
      next: (data) => {
        this.position = { ...data };
        if (data.scoa_function_meta) {
          this.position._scoa_function_meta = data.scoa_function_meta;
        } else if (data.scoa_function_id) {
          this.resolveSubFunctionMeta(data.scoa_function_id);
        }
        this.currentIndex = idx !== undefined ? idx : this.filteredPositions.findIndex(p => p.id === item.id);
        this.mode = 'view';
        this.view = 'detail';
        this.activeTab = 'position';
        this.loadHistory();
        this.resolveDivisionScoaFunctionCode();
        this.resolveExternalScoaNames();
        this.loadPlanProjectItems();
        this.loadBudgetProjects();
        this.loadBudgetRegions();
        this.loadBudgetFunds();
        this.loadScoaExpenseItemsForPosition();
        this.cdr.detectChanges();
      },
      error: () => this.ui.toast('error', 'Error', 'Failed to load position')
    });
  }

  goBack(): void {
    this.view = 'list';
    this.load();
    this.cdr.detectChanges();
  }

  enterEdit(): void {
    this.mode = 'edit';
    this.reconcileProjectAndRegion();
    this.cdr.detectChanges();
  }

  get isEditable(): boolean {
    return this.mode === 'create' || this.mode === 'edit';
  }

  get pageTitle(): string {
    if (this.mode === 'create') return 'Add New Position';
    return this.position.title || 'Position';
  }

  navigatePrev(): void {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.openDetail(this.filteredPositions[this.currentIndex], this.currentIndex);
    }
  }

  navigateNext(): void {
    if (this.currentIndex < this.filteredPositions.length - 1) {
      this.currentIndex++;
      this.openDetail(this.filteredPositions[this.currentIndex], this.currentIndex);
    }
  }

  searchHeader(): void {
    if (!this.headerSearch) return;
    const s = this.headerSearch.toLowerCase();
    const idx = this.filteredPositions.findIndex(p =>
      String(p.id) === this.headerSearch ||
      (p.position_code || '').toLowerCase().includes(s) ||
      (p.title || '').toLowerCase().includes(s)
    );
    if (idx >= 0) {
      this.openDetail(this.filteredPositions[idx], idx);
    } else {
      this.ui.toast('info', 'Not Found', 'No position matches your search');
    }
  }

  filteredDivisions(): any[] {
    if (!this.position.department_id) return this.divisions;
    return this.divisions.filter((d: any) => d.department_id === this.position.department_id);
  }

  get divisionBreadcrumbPath(): string {
    const id = this.position?.division_id;
    if (!id) return this.position?.division_name || '-';
    const trail: string[] = [];
    const seen = new Set<number>();
    let cur: any = this.divisions.find((d: any) => d.id === id);
    if (!cur) return this.position?.division_name || String(id);
    while (cur && !seen.has(cur.id)) {
      seen.add(cur.id);
      const label = cur.code ? `${cur.code} - ${cur.name}` : cur.name;
      trail.unshift(label);
      if (!cur.parent_id) break;
      const parent = this.divisions.find((d: any) => d.id === cur.parent_id);
      if (!parent) break;
      cur = parent;
    }
    return trail.length > 0 ? trail.join(' › ') : (this.position?.division_name || '-');
  }

  onDivisionCascadeChange(newId: number | null): void {
    this.position.division_id = newId;
    this.onDivisionChange();
  }

  filteredSubtypes(): any[] {
    if (!this.position.employee_type_id) return this.employeeSubtypes;
    return this.employeeSubtypes.filter((s: any) => s.employee_type_id === this.position.employee_type_id);
  }

  onDepartmentChange(): void {
    this.position.division_id = null;
    this.position._division_scoa_function_code = null;
    this.position.scoa_function_id = null;
    this.position._scoa_function_meta = null;
    this.position.scoa_project_id = null;
    this.position.scoa_region_id = null;
    this.resolvedProjectName = '';
    this.resolvedRegionName = '';
    this.planProjectItems = [];
    this._planProjectItemsScoaId = null;
    this.planProjectItemsStatus = 'idle';
    this.budgetProjects = [];
    this._budgetProjectsKey = null;
    this.budgetProjectsStatus = 'idle';
    this.budgetRegions = [];
    this._budgetRegionsKey = null;
    this.budgetRegionsStatus = 'idle';
    this.budgetFunds = [];
    this._budgetFundsKey = null;
    this.budgetFundsStatus = 'idle';
    this.resolvedFundName = '';
    this.cdr.detectChanges();
  }

  onDivisionChange(): void {
    this.position._division_scoa_function_code = null;
    this.resolveDivisionScoaFunctionCode();
    this.defaultSubFunctionFromDivision();
    this.defaultProjectAndRegionFromDivision();
    this.loadPlanProjectItems();
    this.loadBudgetProjects();
    this.loadBudgetRegions();
    this.loadBudgetFunds();
    this.cdr.detectChanges();
  }

  loadBudgetProjects(): void {
    const scoaFunctionId = this.position?.scoa_function_id;
    const divisionId = this.position?.division_id;
    if (!scoaFunctionId || !divisionId) {
      this.budgetProjects = [];
      this._budgetProjectsKey = null;
      this.budgetProjectsStatus = 'idle';
      this.cdr.detectChanges();
      return;
    }
    const finYear = this.currentFinYear;
    const key = `${scoaFunctionId}|${divisionId}|${finYear}`;
    if (key === this._budgetProjectsKey && this.budgetProjectsStatus === 'loaded') {
      this.reconcileProjectAndRegion();
      return;
    }
    this._budgetProjectsKey = key;
    this.budgetProjectsStatus = 'idle';
    const ver = ++this._budgetProjectsVersion;
    this.cdr.detectChanges();
    this.api.get<any[]>('/gl/external/projects-by-division-function-year', {
      scoaFunctionId, divisionId, finYear
    }).subscribe({
      next: (data: any) => {
        if (ver !== this._budgetProjectsVersion) return;
        this.budgetProjects = Array.isArray(data) ? data : [];
        this.budgetProjectsStatus = 'loaded';
        this.reconcileProjectAndRegion();
        this.cdr.detectChanges();
      },
      error: () => {
        if (ver !== this._budgetProjectsVersion) return;
        this.budgetProjects = [];
        this.budgetProjectsStatus = 'error';
        this.cdr.detectChanges();
      }
    });
  }

  loadBudgetFunds(): void {
    const scoaFunctionId = this.position?.scoa_function_id;
    const divisionId = this.position?.division_id;
    const projectId = this.position?.scoa_project_id;
    const scoaRegionId = this.position?.scoa_region_id;
    if (!scoaFunctionId || !divisionId || !projectId || !scoaRegionId) {
      this.budgetFunds = [];
      this._budgetFundsKey = null;
      this.budgetFundsStatus = 'idle';
      this.cdr.detectChanges();
      return;
    }
    const finYear = this.currentFinYear;
    const key = `${scoaFunctionId}|${divisionId}|${projectId}|${scoaRegionId}|${finYear}`;
    if (key === this._budgetFundsKey && this.budgetFundsStatus === 'loaded') {
      this.reconcileProjectAndRegion();
      return;
    }
    this._budgetFundsKey = key;
    this.budgetFundsStatus = 'idle';
    const ver = ++this._budgetFundsVersion;
    this.cdr.detectChanges();
    this.api.get<any[]>('/gl/external/funds-by-division-function-project-region-year', {
      scoaFunctionId, divisionId, projectId, scoaRegionId, finYear
    }).subscribe({
      next: (data: any) => {
        if (ver !== this._budgetFundsVersion) return;
        this.budgetFunds = Array.isArray(data) ? data : [];
        this.budgetFundsStatus = 'loaded';
        this.resolveFundNameFromBudget();
        this.reconcileProjectAndRegion();
        this.cdr.detectChanges();
      },
      error: () => {
        if (ver !== this._budgetFundsVersion) return;
        this.budgetFunds = [];
        this.budgetFundsStatus = 'error';
        this.cdr.detectChanges();
      }
    });
  }

  private resolveFundNameFromBudget(): void {
    const fid = this.position?.scoa_fund_id;
    if (fid == null || fid === '') { this.resolvedFundName = ''; return; }
    const match = this.budgetFunds.find(r => String(r?.scoaId) === String(fid));
    this.resolvedFundName = match ? (match.scoaShortDesc || match.scoaDesc || '') : '';
  }

  loadBudgetRegions(): void {
    const scoaFunctionId = this.position?.scoa_function_id;
    const divisionId = this.position?.division_id;
    const projectId = this.position?.scoa_project_id;
    if (!scoaFunctionId || !divisionId || !projectId) {
      this.budgetRegions = [];
      this._budgetRegionsKey = null;
      this.budgetRegionsStatus = 'idle';
      this.cdr.detectChanges();
      return;
    }
    const finYear = this.currentFinYear;
    const key = `${scoaFunctionId}|${divisionId}|${projectId}|${finYear}`;
    if (key === this._budgetRegionsKey && this.budgetRegionsStatus === 'loaded') {
      this.reconcileProjectAndRegion();
      return;
    }
    this._budgetRegionsKey = key;
    this.budgetRegionsStatus = 'idle';
    const ver = ++this._budgetRegionsVersion;
    this.cdr.detectChanges();
    this.api.get<any[]>('/gl/external/regions-by-division-function-project-year', {
      scoaFunctionId, divisionId, projectId, finYear
    }).subscribe({
      next: (data: any) => {
        if (ver !== this._budgetRegionsVersion) return;
        this.budgetRegions = Array.isArray(data) ? data : [];
        this.budgetRegionsStatus = 'loaded';
        this.reconcileProjectAndRegion();
        this.cdr.detectChanges();
      },
      error: () => {
        if (ver !== this._budgetRegionsVersion) return;
        this.budgetRegions = [];
        this.budgetRegionsStatus = 'error';
        this.cdr.detectChanges();
      }
    });
  }

  onScoaFunctionChange(newValue: string): void {
    const v = newValue || null;
    if (this.position.scoa_function_id === v) return;
    this.position.scoa_function_id = v;
    this.position._scoa_function_meta = null;
    if (!v) {
      this.planProjectItems = [];
      this._planProjectItemsScoaId = null;
      this.planProjectItemsStatus = 'idle';
      this.budgetProjects = [];
      this._budgetProjectsKey = null;
      this.budgetProjectsStatus = 'idle';
      this.budgetRegions = [];
      this._budgetRegionsKey = null;
      this.budgetRegionsStatus = 'idle';
      this.budgetFunds = [];
      this._budgetFundsKey = null;
      this.budgetFundsStatus = 'idle';
      this.position.scoa_project_id = null;
      this.position.scoa_region_id = null;
      this.position.scoa_fund_id = null;
      this.resolvedProjectName = '';
      this.resolvedRegionName = '';
      this.resolvedFundName = '';
      this.cdr.detectChanges();
      return;
    }
    this.loadPlanProjectItems();
    this.loadBudgetProjects();
    this.loadBudgetRegions();
    this.loadBudgetFunds();
  }

  onProjectPicked(newId: string): void {
    const v = newId ? Number(newId) : null;
    this.position.scoa_project_id = v;
    if (v == null) {
      this.position.scoa_region_id = null;
      this.resolvedRegionName = '';
      this.budgetRegions = [];
      this._budgetRegionsKey = null;
      this.budgetRegionsStatus = 'idle';
      this.position.scoa_fund_id = null;
      this.resolvedFundName = '';
      this.budgetFunds = [];
      this._budgetFundsKey = null;
      this.budgetFundsStatus = 'idle';
    } else {
      this.loadBudgetRegions();
      this.loadBudgetFunds();
    }
    this.resolveExternalScoaNames();
    this.cdr.detectChanges();
  }

  onRegionPicked(newId: string): void {
    const v = newId ? Number(newId) : null;
    this.position.scoa_region_id = v;
    if (v == null) {
      this.position.scoa_fund_id = null;
      this.resolvedFundName = '';
      this.budgetFunds = [];
      this._budgetFundsKey = null;
      this.budgetFundsStatus = 'idle';
    } else {
      this.loadBudgetFunds();
    }
    this.resolveExternalScoaNames();
    this.cdr.detectChanges();
  }

  onFundPicked(newId: string): void {
    this.position.scoa_fund_id = newId || null;
    this.resolveFundNameFromBudget();
    this.cdr.detectChanges();
  }

  loadPlanProjectItems(): void {
    const scoaId = this.position?.scoa_function_id;
    if (!scoaId) {
      this.planProjectItems = [];
      this._planProjectItemsScoaId = null;
      this.planProjectItemsLoading = false;
      this.planProjectItemsStatus = 'idle';
      this.cdr.detectChanges();
      return;
    }
    if (String(scoaId) === this._planProjectItemsScoaId && !this.planProjectItemsLoading) {
      this.reconcileProjectAndRegion();
      return;
    }
    this._planProjectItemsScoaId = String(scoaId);
    this.planProjectItemsLoading = true;
    this.planProjectItemsStatus = 'idle';
    const ver = ++this._planLoadVersion;
    this.cdr.detectChanges();
    this.api.get<any>('/gl/external/plan-project-items', {
      scoaId,
      finYear: this.currentFinYear
    }).subscribe({
      next: (data: any) => {
        if (ver !== this._planLoadVersion) return;
        this.planProjectItems = Array.isArray(data) ? data : [];
        this.planProjectItemsLoading = false;
        this.planProjectItemsStatus = 'loaded';
        this.reconcileProjectAndRegion();
        this.cdr.detectChanges();
      },
      error: () => {
        if (ver !== this._planLoadVersion) return;
        this.planProjectItems = [];
        this.planProjectItemsLoading = false;
        this.planProjectItemsStatus = 'error';
        this.cdr.detectChanges();
      }
    });
  }

  private rowProjectId(row: any): number | null {
    const v = row?.projectId ?? row?.scoaProjectId ?? row?.project_id;
    return v == null ? null : Number(v);
  }

  private rowRegionId(row: any): number | null {
    const v = row?.scoaRegionId ?? row?.regionId ?? row?.scoa_region_id ?? row?.region_id;
    return v == null ? null : Number(v);
  }

  private rowDivisionId(row: any): number | null {
    const v = row?.divisionId ?? row?.scoaDivisionId ?? row?.division_id;
    return v == null ? null : Number(v);
  }

  // STRICT: never silently bypass the Division filter. If we cannot identify a
  // Division key on any loaded budget row we must offer NO options for this
  // Division — picking off-budget combinations is a hard correctness failure.
  // The UI surfaces a hint via `divisionKeyMissing` when this happens.
  private rowsForCurrentDivision(): any[] {
    if (this.planProjectItemsStatus !== 'loaded') return [];
    const divId = this.position?.division_id;
    if (divId == null) return [];
    if (this.planProjectItems.length === 0) return [];
    const anyHasDivision = this.planProjectItems.some(r => this.rowDivisionId(r) != null);
    if (!anyHasDivision) return [];
    return this.planProjectItems.filter(r => this.rowDivisionId(r) === Number(divId));
  }

  // True when budget rows loaded successfully but none expose a recognizable
  // Division identifier — we deliberately offer nothing in that case and the
  // UI must tell the user to verify the budget data.
  get divisionKeyMissing(): boolean {
    if (this.planProjectItemsStatus !== 'loaded') return false;
    if (this.planProjectItems.length === 0) return false;
    return !this.planProjectItems.some(r => this.rowDivisionId(r) != null);
  }

  get budgetReady(): boolean {
    return this.budgetProjectsStatus === 'loaded';
  }

  get availableProjects(): any[] {
    if (this.budgetProjectsStatus !== 'loaded') return [];
    const seen = new Map<number, any>();
    for (const r of this.budgetProjects) {
      const pid = this.rowProjectId(r);
      if (pid == null) continue;
      if (!seen.has(pid)) {
        seen.set(pid, {
          projectId: pid,
          projectDesc: r.projectDesc || r.projectName || `Project ${pid}`
        });
      }
    }
    return Array.from(seen.values());
  }

  get availableRegions(): any[] {
    if (this.budgetRegionsStatus !== 'loaded') return [];
    const seen = new Map<number, any>();
    for (const r of this.budgetRegions) {
      const rid = r?.scoaId == null ? null : Number(r.scoaId);
      if (rid == null) continue;
      if (!seen.has(rid)) {
        seen.set(rid, {
          regionId: rid,
          regionDesc: r.scoaShortDesc || r.scoaDesc || `Region ${rid}`
        });
      }
    }
    return Array.from(seen.values());
  }

  get budgetRegionsReady(): boolean {
    return this.budgetRegionsStatus === 'loaded';
  }

  get availableFunds(): any[] {
    if (this.budgetFundsStatus !== 'loaded') return [];
    const seen = new Map<string, any>();
    for (const r of this.budgetFunds) {
      const fid = r?.scoaId == null ? null : String(r.scoaId);
      if (fid == null) continue;
      if (!seen.has(fid)) {
        seen.set(fid, {
          fundId: fid,
          fundDesc: r.scoaShortDesc || r.scoaDesc || `Fund ${fid}`
        });
      }
    }
    return Array.from(seen.values());
  }

  get budgetFundsReady(): boolean {
    return this.budgetFundsStatus === 'loaded';
  }

  fundPrimary = (item: any): string => {
    if (!item) return '';
    return item.fundDesc ? `${item.fundId} - ${item.fundDesc} (${item.fundId})` : `Fund ${item.fundId}`;
  };

  projectPrimary = (item: any): string => {
    if (!item) return '';
    return item.projectDesc ? `${item.projectId} - ${item.projectDesc} (${item.projectId})` : `Project ${item.projectId}`;
  };

  regionPrimary = (item: any): string => {
    if (!item) return '';
    return item.regionDesc ? `${item.regionId} - ${item.regionDesc} (${item.regionId})` : `Region ${item.regionId}`;
  };

  toStr(v: any): string {
    return v == null ? '' : String(v);
  }

  reconcileProjectAndRegion(): void {
    if (!this.isEditable) return;

    if (this.budgetProjectsStatus === 'loaded') {
      const projId = this.position?.scoa_project_id;
      if (projId != null) {
        const validProjectIds = new Set(
          this.budgetProjects.map(r => this.rowProjectId(r)).filter(v => v != null) as number[]
        );
        if (!validProjectIds.has(Number(projId))) {
          this.position.scoa_project_id = null;
          this.position.scoa_region_id = null;
          this.resolvedProjectName = '';
          this.resolvedRegionName = '';
          return;
        }
      }
    }

    if (this.budgetRegionsStatus === 'loaded') {
      const regionId = this.position?.scoa_region_id;
      if (regionId != null) {
        const validRegionIds = new Set(
          this.budgetRegions.map(r => r?.scoaId == null ? null : Number(r.scoaId)).filter(v => v != null) as number[]
        );
        if (!validRegionIds.has(Number(regionId))) {
          this.position.scoa_region_id = null;
          this.resolvedRegionName = '';
          this.position.scoa_fund_id = null;
          this.resolvedFundName = '';
          return;
        }
      }
    }

    if (this.budgetFundsStatus !== 'loaded') return;
    const fundId = this.position?.scoa_fund_id;
    if (fundId != null && fundId !== '') {
      const validFundIds = new Set(
        this.budgetFunds.map(r => r?.scoaId == null ? null : String(r.scoaId)).filter(v => v != null) as string[]
      );
      if (!validFundIds.has(String(fundId))) {
        this.position.scoa_fund_id = null;
        this.resolvedFundName = '';
      }
    }
  }

  defaultProjectAndRegionFromDivision(): void {
    const divId = this.position.division_id;
    if (!divId) {
      this.position.scoa_project_id = null;
      this.position.scoa_region_id = null;
      this.resolvedProjectName = '';
      this.resolvedRegionName = '';
      return;
    }
    const div = this.divisions.find((d: any) => d.id === divId);
    this.position.scoa_project_id = div?.project_id || null;
    this.position.scoa_region_id = div?.scoa_region_id || null;
    this.resolveExternalScoaNames();
  }

  resolveExternalScoaNames(): void {
    this.resolvedProjectName = '';
    this.resolvedRegionName = '';
    const ver = ++this._resolveVersion;
    const projectId = this.position?.scoa_project_id;
    const regionId = this.position?.scoa_region_id;
    if (projectId) {
      this.api.get<any>(`/gl/external/resolve-project/${projectId}`).subscribe({
        next: (d) => {
          if (ver !== this._resolveVersion) return;
          this.resolvedProjectName = d?.name || String(projectId);
          this.cdr.detectChanges();
        },
        error: () => { if (ver !== this._resolveVersion) return; this.resolvedProjectName = String(projectId); this.cdr.detectChanges(); }
      });
    }
    if (regionId) {
      this.api.get<any>(`/gl/external/resolve-region/${regionId}`).subscribe({
        next: (d) => {
          if (ver !== this._resolveVersion) return;
          this.resolvedRegionName = d?.name || String(regionId);
          this.cdr.detectChanges();
        },
        error: () => { if (ver !== this._resolveVersion) return; this.resolvedRegionName = String(regionId); this.cdr.detectChanges(); }
      });
    }
  }

  defaultSubFunctionFromDivision(): void {
    const divId = this.position.division_id;
    if (!divId) {
      this.position.scoa_function_id = null;
      this.position._scoa_function_meta = null;
      return;
    }
    const div = this.divisions.find(d => d.id === divId);
    const scoaFunctionId = div?.scoa_function_id;
    if (scoaFunctionId) {
      this.position.scoa_function_id = String(scoaFunctionId);
      this.position._scoa_function_meta = null;
    } else {
      this.position.scoa_function_id = null;
      this.position._scoa_function_meta = null;
    }
  }

  resolveScoaName(list: any[], id: any): string {
    if (!id) return '-';
    const item = list.find((i: any) => String(i.id) === String(id));
    return item ? `${item.code} - ${item.name}` : String(id);
  }

  get currentFinYear(): string {
    const now = new Date();
    const year = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
    return `${year}/${year + 1}`;
  }

  resolveDivisionScoaFunctionCode(): void {
    const divId = this.position.division_id;
    if (!divId) {
      this.position._division_scoa_function_code = null;
      return;
    }
    const div = this.divisions.find(d => d.id === divId);
    const scoaFunctionId = div?.scoa_function_id;
    if (!scoaFunctionId) {
      this.position._division_scoa_function_code = null;
      return;
    }
    this.position._division_scoa_function_code = 'Loading...';
    this.cdr.detectChanges();
    const now = new Date();
    const year = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
    const finYear = `${year}/${year + 1}`;
    this.api.get<any>(`/gl/external/scoa-function-structure/${scoaFunctionId}?finYear=${encodeURIComponent(finYear)}`).subscribe({
      next: (data) => {
        this.position._division_scoa_function_code = data?.scoaCode || '-';
        this.cdr.detectChanges();
      },
      error: () => {
        this.position._division_scoa_function_code = '-';
        this.cdr.detectChanges();
      }
    });
  }

  resolveSubFunctionMeta(scoaFunctionId: string): void {
    this.api.get<any>('/gl/external/scoa-function-tree/resolve', { scoaId: scoaFunctionId, finYear: this.currentFinYear }).subscribe({
      next: (data) => {
        if (data && data.item) {
          this.position._scoa_function_meta = { item: data.item, breadcrumbs: data.breadcrumbs || [] };
          this.cdr.detectChanges();
        }
      },
      error: () => {}
    });
  }

  get divisionScoaFunctionCode(): string {
    if (this.position._division_scoa_function_code) return this.position._division_scoa_function_code;
    return this.position.division_scoa_function_code || '-';
  }

  get parentPositionOptions(): any[] {
    const currentId = this.position?.id;
    return this.positions.filter(p => p.id !== currentId && p.enabled !== false);
  }

  parentPositionPrimary = (item: any): string => {
    if (!item) return '';
    const code = item.position_code ? item.position_code : '';
    return `${item.id} | ${code} - ${item.title}`;
  };

  get resolvedParentPositionLabel(): string {
    const pid = this.position?.parent_position_id;
    if (!pid) return '-';
    const p = this.positions.find(pos => pos.id === pid || String(pos.id) === String(pid));
    if (!p) return String(pid);
    return `${p.title} (${p.position_code || pid})`;
  }

  onParentPositionPicked(val: string): void {
    this.position.parent_position_id = val ? Number(val) : null;
    this.cdr.detectChanges();
  }

  get businessRulesLocked(): boolean {
    return !!this.position.job_profile_id;
  }

  get selectedJobProfile(): any {
    if (!this.position.job_profile_id) return null;
    return this.jobProfiles.find(j => j.id === this.position.job_profile_id) || null;
  }

  get isUpperLimitProfile(): boolean {
    const jp = this.selectedJobProfile;
    return jp && !!jp.upper_limit_id;
  }

  loadScoaExpenseItemsForPosition(): void {
    const jp = this.selectedJobProfile;
    if (!jp || !jp.upper_limit_id) {
      this.scoaExpenseItems = [];
      return;
    }
    const empTypeId = this.position.employee_type_id || jp.employee_type_id;
    this.loadScoaExpenseItems(empTypeId);
  }

  loadScoaExpenseItems(employeeTypeId: any): void {
    this.scoaExpenseItemsLoading = true;
    this.api.get<any[]>('/positions/scoa-expense-items', { employee_type_id: employeeTypeId }).subscribe({
      next: (data) => {
        this.scoaExpenseItems = data || [];
        this.scoaExpenseItemsLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.scoaExpenseItems = [];
        this.scoaExpenseItemsLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  expenseItemPrimary = (item: any): string => {
    if (!item) return '';
    return item.name ? `${item.code} — ${item.name}` : item.code;
  };

  expenseItemSecondary = (item: any): string => {
    if (!item) return '';
    const desc = item.description || '';
    return desc.length > 80 ? desc.slice(0, 80) + '…' : desc;
  };

  onExpenseItemPicked(val: string): void {
    this.position.scoa_item_id = val || null;
    this.cdr.detectChanges();
  }

  get resolvedExpenseItemLabel(): string {
    if (!this.position.scoa_item_id) return '-';
    const item = this.scoaExpenseItems.find(i => String(i.id) === String(this.position.scoa_item_id));
    return item ? `${item.code} — ${item.name}` : String(this.position.scoa_item_id);
  }

  onJobProfileChange(): void {
    const jp = this.jobProfiles.find(j => j.id === this.position.job_profile_id);
    if (jp) {
      this.position.employee_type_id = jp.employee_type_id || null;
      this.position.employee_subtype_id = jp.employee_subtype_id || null;
      this.position.salary_transaction_group_id = jp.salary_transaction_group_id || null;
      this.position.condition_of_service_id = jp.condition_of_service_id || null;
      this.position.task_grade_id = jp.upper_limit_id ? null : (jp.task_grade_id || null);
      this.position.upper_limit_value_type = null;
      this.position.performance_assessment = jp.performance_assessment ?? this.position.performance_assessment;
      if (jp.upper_limit_id) {
        this.loadScoaExpenseItems(jp.employee_type_id);
      } else {
        this.scoaExpenseItems = [];
        this.position.scoa_item_id = null;
      }
    } else {
      this.position.employee_type_id = null;
      this.position.employee_subtype_id = null;
      this.position.salary_transaction_group_id = null;
      this.position.condition_of_service_id = null;
      this.position.task_grade_id = null;
      this.position.upper_limit_value_type = null;
      this.scoaExpenseItems = [];
      this.position.scoa_item_id = null;
    }
    this.cdr.detectChanges();
  }

  onManagerTypeChange(val: number): void {
    this.position.manager_type = val;
    this.position.is_hod = val === 1;
    this.cdr.detectChanges();
  }

  validate(): string | null {
    if (!this.position.title) return 'Title is required';
    if (!this.position.position_code) return 'Position Code is required';
    if (!this.position.start_date) return 'Start Date is required';
    if (!this.position.end_date) return 'End Date is required';
    if (!this.position.department_id) return 'Department is required';
    if (this.position.start_date && this.position.end_date && this.position.end_date < this.position.start_date) {
      return 'End Date must be on or after Start Date';
    }
    return null;
  }

  save(): void {
    const err = this.validate();
    if (err) {
      this.ui.toast('error', 'Validation', err);
      return;
    }

    const payload = { ...this.position };
    delete payload._division_scoa_function_code;
    if (payload._scoa_function_meta !== undefined) {
      payload.scoa_function_meta = payload._scoa_function_meta;
      delete payload._scoa_function_meta;
    }

    if (this.position.id) {
      this.api.put(`/positions/${this.position.id}`, payload).subscribe({
        next: (data: any) => {
          this.ui.toast('success', 'Saved', 'Position saved successfully');
          this.mode = 'view';
          this.load();
          this.api.get<any>(`/positions/${this.position.id}`).subscribe({
            next: (fresh) => {
              this.position = { ...fresh };
              if (fresh.scoa_function_meta) this.position._scoa_function_meta = fresh.scoa_function_meta;
              this.loadHistory();
              this.resolveDivisionScoaFunctionCode();
              this.cdr.detectChanges();
            }
          });
          this.cdr.detectChanges();
        },
        error: (err: any) => this.ui.toast('error', 'Error', err?.error?.error?.message || 'Failed to save')
      });
      return;
    }

    this._pendingPayload = payload;
    this.pendingQuantity = 1;
    this.showQuantityModal = true;
    this.cdr.detectChanges();
  }

  confirmCreatePositions(): void {
    const qty = Math.max(1, Math.min(99, Math.floor(this.pendingQuantity || 1)));
    const payload = this._pendingPayload;
    this.showQuantityModal = false;
    this._pendingPayload = null;
    this.cdr.detectChanges();

    if (qty > 1) {
      this.api.post('/positions/bulk', { ...payload, quantity: qty }).subscribe({
        next: (data: any) => {
          const count = Array.isArray(data) ? data.length : qty;
          this.ui.toast('success', 'Created', `${count} positions created successfully`);
          this.load();
          this.goBack();
          this.cdr.detectChanges();
        },
        error: (err: any) => this.ui.toast('error', 'Error', err?.error?.error?.message || 'Failed to create positions')
      });
    } else {
      this.api.post('/positions', payload).subscribe({
        next: (data: any) => {
          this.ui.toast('success', 'Saved', 'Position saved successfully');
          if (data?.id) this.position.id = data.id;
          this.mode = 'view';
          this.load();
          if (this.position.id) {
            this.api.get<any>(`/positions/${this.position.id}`).subscribe({
              next: (fresh) => {
                this.position = { ...fresh };
                if (fresh.scoa_function_meta) this.position._scoa_function_meta = fresh.scoa_function_meta;
                this.loadHistory();
                this.resolveDivisionScoaFunctionCode();
                this.cdr.detectChanges();
              }
            });
          }
          this.cdr.detectChanges();
        },
        error: (err: any) => this.ui.toast('error', 'Error', err?.error?.error?.message || 'Failed to save')
      });
    }
  }

  cancelQuantityModal(): void {
    this.showQuantityModal = false;
    this._pendingPayload = null;
    this.cdr.detectChanges();
  }

  async deleteFromList(item: any): Promise<void> {
    if (item.incumbent_id) {
      this.ui.toast('error', 'Cannot Delete', 'Position has an active incumbent');
      return;
    }
    const confirmed = await this.ui.confirm({ title: 'Delete Position', message: `Delete "${item.title}" (${item.position_code})?`, danger: true });
    if (confirmed) {
      this.api.delete(`/positions/${item.id}`).subscribe({
        next: () => { this.ui.toast('success', 'Deleted', 'Position removed'); this.load(); },
        error: (err: any) => this.ui.toast('error', 'Error', err?.error?.error?.message || 'Failed to delete')
      });
    }
  }

  loadHistory(): void {
    if (!this.position.id) return;
    this.api.get<any[]>(`/positions/${this.position.id}/history`).subscribe({
      next: (data) => { this.history = data || []; this.cdr.detectChanges(); },
      error: () => {}
    });
  }

  getStatusClass(status: string): string {
    switch ((status || '').toUpperCase()) {
      case 'FILLED': return 'status-filled';
      case 'VACANT': return 'status-vacant';
      case 'FROZEN': return 'status-frozen';
      default: return '';
    }
  }
}
