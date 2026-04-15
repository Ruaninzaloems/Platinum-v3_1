import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { UiService } from '../../../core/services/ui.service';
import { ScoaDrilldownComponent } from '../../../shared/components/scoa-drilldown/scoa-drilldown.component';

@Component({
  selector: 'app-gl-integration',
  standalone: true,
  imports: [CommonModule, FormsModule, ScoaDrilldownComponent],
  templateUrl: './gl-integration.component.html',
  styleUrl: './gl-integration.component.css'
})
export class GlIntegrationComponent implements OnInit {
  items: any[] = [];
  filteredItems: any[] = [];
  loading = true;
  saving = false;
  searchTerm = '';
  activeTab = 'EARNING';

  view: 'list' | 'detail' = 'list';
  selectedItem: any = null;
  glForm: any = {};

  scoaItems: any[] = [];
  scoaFunds: any[] = [];
  scoaFunctions: any[] = [];
  scoaProjects: any[] = [];
  scoaRegions: any[] = [];
  scoaCostings: any[] = [];
  scoaMsc: any[] = [];
  externalProjects: any[] = [];
  projectsLoading = false;
  controlScoaItems: any[] = [];
  controlItemsLoading = false;
  lookupsLoaded = false;
  overrideProjectDetails = { project: '', department: '', division: '', function: '', region: '', fund: '' };
  planProjectItems: any[] = [];
  planProjectItemsLoading = false;
  vendors: any[] = [];
  vendorsLoading = false;
  creditorControlScoaItems: any[] = [];
  creditorControlItemsLoading = false;
  revenuePlanProjectItems: any[] = [];
  revenuePlanProjectItemsLoading = false;
  revenueItemDetails = { project: '', department: '', division: '', function: '', region: '', fund: '' };

  currentPage = 1;
  pageSize = 20;

  financialYears: string[] = [];

  constructor(private api: ApiService, private ui: UiService, private cdr: ChangeDetectorRef) {
    const currentYear = new Date().getFullYear();
    for (let y = currentYear + 1; y >= 2020; y--) {
      this.financialYears.push(`${y}/${y + 1}`);
    }
  }

  ngOnInit(): void {
    this.loadItems();
  }

  loadItems(): void {
    this.loading = true;
    this.api.get<any>('/gl/salary-heads').subscribe({
      next: (data) => {
        this.items = data || [];
        this.filterItems();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.items = [];
        this.filteredItems = [];
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadLookups(): void {
    if (this.lookupsLoaded) return;
    this.lookupsLoaded = true;
    const segments = ['items', 'funds', 'functions', 'projects', 'regions', 'costings', 'msc'];
    const targets = [
      'scoaItems', 'scoaFunds', 'scoaFunctions', 'scoaProjects',
      'scoaRegions', 'scoaCostings', 'scoaMsc'
    ];
    segments.forEach((seg, i) => {
      this.api.get<any>(`/gl/scoa/${seg}`).subscribe({
        next: (data) => {
          (this as any)[targets[i]] = data || [];
          this.cdr.detectChanges();
        },
        error: () => {
          (this as any)[targets[i]] = [];
        }
      });
    });
  }

  loadExternalProjects(finYear: string): void {
    if (!finYear) {
      this.externalProjects = [];
      this.cdr.detectChanges();
      return;
    }
    this.projectsLoading = true;
    this.api.get<any>(`/gl/external/projects`, { finYear, capitalOperationValue: '3' }).subscribe({
      next: (data) => {
        this.externalProjects = data || [];
        this.projectsLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.externalProjects = [];
        this.projectsLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onFinancialYearChange(): void {
    this.glForm.scoa_project_id = '';
    this.glForm.suspense_scoa_item_id = '';
    this.glForm.suspense_scoa_item_credit_id = '';
    this.glForm.scoa_item_id_permanent_staff = '';
    this.glForm.scoa_item_id_post_retirement = '';
    this.glForm.plan_project_item_id = '';
    this.glForm.vendor_scoa_project_id = '';
    this.glForm.vendor_scoa_id = '';
    this.glForm.scoa_item_id = '';
    this.glForm.scoa_item_id_meta = null;
    this.controlScoaItems = [];
    this.creditorControlScoaItems = [];
    this.planProjectItems = [];
    this.revenuePlanProjectItems = [];
    this.overrideProjectDetails = { project: '', department: '', division: '', function: '', region: '', fund: '' };
    this.revenueItemDetails = { project: '', department: '', division: '', function: '', region: '', fund: '' };
    this.loadExternalProjects(this.glForm.fin_year);
  }

  onProjectChange(): void {
    this.glForm.suspense_scoa_item_id = '';
    this.glForm.suspense_scoa_item_credit_id = '';
    this.controlScoaItems = [];
    if (this.glForm.scoa_project_id && this.glForm.fin_year) {
      this.loadControlScoaItems(this.glForm.scoa_project_id, this.glForm.fin_year);
    }
    this.cdr.detectChanges();
  }

  loadControlScoaItems(projectId: string, finYear: string): void {
    this.controlItemsLoading = true;
    this.cdr.detectChanges();
    this.api.get<any>(`/gl/external/control-scoa-items`, { projectId, finYear }).subscribe({
      next: (data) => {
        this.controlScoaItems = data || [];
        this.controlItemsLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.controlScoaItems = [];
        this.controlItemsLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onMunicipalStaffChange(scoaId: string): void {
    this.glForm.scoa_item_id_permanent_staff = scoaId;
    this.glForm.plan_project_item_id = '';
    this.planProjectItems = [];
    this.overrideProjectDetails = { project: '', department: '', division: '', function: '', region: '', fund: '' };
    if (scoaId && this.glForm.fin_year) {
      this.loadPlanProjectItems(scoaId, this.glForm.fin_year);
    }
    this.cdr.detectChanges();
  }

  onMunicipalStaffMetaChange(meta: any): void {
    this.glForm.scoa_item_id_permanent_staff_meta = meta;
  }

  onPostRetirementMetaChange(meta: any): void {
    this.glForm.scoa_item_id_post_retirement_meta = meta;
  }

  loadVendors(): void {
    if (this.vendors.length > 0) return;
    this.vendorsLoading = true;
    this.cdr.detectChanges();
    this.api.get<any>('/benefits/ems-vendors').subscribe({
      next: (data) => {
        this.vendors = data || [];
        this.vendorsLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.vendors = [];
        this.vendorsLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onCreditorProjectChange(): void {
    this.glForm.vendor_scoa_id = '';
    this.creditorControlScoaItems = [];
    if (this.glForm.vendor_scoa_project_id && this.glForm.fin_year) {
      this.loadCreditorControlScoaItems(this.glForm.vendor_scoa_project_id, this.glForm.fin_year);
    }
    this.cdr.detectChanges();
  }

  loadCreditorControlScoaItems(projectId: string, finYear: string): void {
    this.creditorControlItemsLoading = true;
    this.cdr.detectChanges();
    this.api.get<any>('/gl/external/control-scoa-items', { projectId, finYear }).subscribe({
      next: (data) => {
        this.creditorControlScoaItems = data || [];
        this.creditorControlItemsLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.creditorControlScoaItems = [];
        this.creditorControlItemsLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadPlanProjectItems(scoaId: string, finYear: string): void {
    this.planProjectItemsLoading = true;
    this.cdr.detectChanges();
    this.api.get<any>('/gl/external/plan-project-items', { scoaId, finYear }).subscribe({
      next: (data) => {
        this.planProjectItems = data || [];
        this.planProjectItemsLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.planProjectItems = [];
        this.planProjectItemsLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onDebitItemChange(): void {
  }

  onJournalEntryOnlyToggle(): void {
    if (this.glForm.journal_entry_only) {
      this.glForm.vendor_id = '';
      this.glForm.vendor_scoa_project_id = '';
      this.glForm.vendor_scoa_id = '';
      this.creditorControlScoaItems = [];
      this.glForm.plan_project_item_id = '';
      this.revenuePlanProjectItems = [];
      this.revenueItemDetails = { project: '', department: '', division: '', function: '', region: '', fund: '' };
      if (this.glForm.scoa_item_id && this.glForm.fin_year) {
        this.loadRevenuePlanProjectItems(this.glForm.scoa_item_id, this.glForm.fin_year);
      }
    } else {
      this.glForm.scoa_item_id = '';
      this.glForm.scoa_item_id_meta = null;
      this.glForm.plan_project_item_id = '';
      this.revenuePlanProjectItems = [];
      this.revenueItemDetails = { project: '', department: '', division: '', function: '', region: '', fund: '' };
    }
    this.cdr.detectChanges();
  }

  onRevenueScoaItemChange(scoaId: string): void {
    this.glForm.scoa_item_id = scoaId;
    this.glForm.plan_project_item_id = '';
    this.revenuePlanProjectItems = [];
    this.revenueItemDetails = { project: '', department: '', division: '', function: '', region: '', fund: '' };
    if (scoaId && this.glForm.fin_year) {
      this.loadRevenuePlanProjectItems(scoaId, this.glForm.fin_year);
    }
    this.cdr.detectChanges();
  }

  onRevenueScoaItemMetaChange(meta: any): void {
    this.glForm.scoa_item_id_meta = meta;
  }

  loadRevenuePlanProjectItems(scoaId: string, finYear: string): void {
    this.revenuePlanProjectItemsLoading = true;
    this.cdr.detectChanges();
    this.api.get<any>('/gl/external/plan-project-items', { scoaId, finYear }).subscribe({
      next: (data) => {
        this.revenuePlanProjectItems = data || [];
        this.revenuePlanProjectItemsLoading = false;
        if (this.glForm.plan_project_item_id && this.glForm.journal_entry_only) {
          this.onRevenuePlanProjectItemChange();
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.revenuePlanProjectItems = [];
        this.revenuePlanProjectItemsLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onRevenuePlanProjectItemChange(): void {
    const selectedId = this.glForm.plan_project_item_id;
    if (!selectedId) {
      this.revenueItemDetails = { project: '', department: '', division: '', function: '', region: '', fund: '' };
      this.cdr.detectChanges();
      return;
    }
    const item = this.revenuePlanProjectItems.find(i => String(i.planProjectItemId) === String(selectedId));
    if (item) {
      this.revenueItemDetails = {
        project: item.scoaProjectDesc || item.projectDesc || '',
        department: item.costDesc || '',
        division: item.divisionDesc || '',
        function: item.funcDesc || '',
        region: item.regionDesc || '',
        fund: item.fundDesc || ''
      };
    } else {
      this.revenueItemDetails = { project: '', department: '', division: '', function: '', region: '', fund: '' };
    }
    this.cdr.detectChanges();
  }

  onPostRetirementChange(scoaId: string): void {
    this.glForm.scoa_item_id_post_retirement = scoaId;
    this.cdr.detectChanges();
  }

  onPostRetirementToggle(): void {
    if (this.glForm.earning_not_applicable_post_retirement) {
      this.glForm.scoa_item_id_post_retirement = '';
    }
    this.cdr.detectChanges();
  }

  onOverrideProjectToggle(): void {
    if (!this.glForm.override_project) {
      this.glForm.plan_project_item_id = '';
      this.overrideProjectDetails = { project: '', department: '', division: '', function: '', region: '', fund: '' };
    }
    this.cdr.detectChanges();
  }

  onPlanProjectItemChange(): void {
    const selectedId = this.glForm.plan_project_item_id;
    if (!selectedId) {
      this.overrideProjectDetails = { project: '', department: '', division: '', function: '', region: '', fund: '' };
      this.cdr.detectChanges();
      return;
    }
    const item = this.planProjectItems.find(i => String(i.planProjectItemId) === String(selectedId));
    if (item) {
      this.overrideProjectDetails = {
        project: item.scoaProjectDesc || item.projectDesc || '',
        department: item.costDesc || '',
        division: item.divisionDesc || '',
        function: item.funcDesc || '',
        region: item.regionDesc || '',
        fund: item.fundDesc || ''
      };
    } else {
      this.overrideProjectDetails = { project: '', department: '', division: '', function: '', region: '', fund: '' };
    }
    this.cdr.detectChanges();
  }

  filterItems(): void {
    const term = this.searchTerm.toLowerCase().trim();
    let filtered = this.items.filter(i => i.transaction_type === this.activeTab);
    if (term) {
      filtered = filtered.filter(i =>
        String(i.id || '').includes(term) ||
        (i.name || '').toLowerCase().includes(term)
      );
    }
    this.filteredItems = filtered;
    this.currentPage = 1;
    this.cdr.detectChanges();
  }

  toStr(val: any): string {
    return val == null ? '' : String(val);
  }

  switchTab(tab: string): void {
    this.activeTab = tab;
    this.filterItems();
  }

  get tabCounts(): Record<string, number> {
    const counts: Record<string, number> = { EARNING: 0, DEDUCTION: 0, COMPANY_CONTRIBUTION: 0, FRINGE_BENEFIT: 0 };
    this.items.forEach(i => {
      if (counts[i.transaction_type] !== undefined) counts[i.transaction_type]++;
    });
    return counts;
  }

  get configuredCount(): number {
    return this.items.filter(i => i.transaction_type === this.activeTab && this.isConfigured(i)).length;
  }

  get unconfiguredCount(): number {
    const tabItems = this.items.filter(i => i.transaction_type === this.activeTab);
    return tabItems.length - this.items.filter(i => i.transaction_type === this.activeTab && this.isConfigured(i)).length;
  }

  isConfigured(item: any): boolean {
    return !!(item.suspense_scoa_item_id && item.suspense_scoa_item_credit_id);
  }

  isPartiallyConfigured(item: any): boolean {
    return !!(item.suspense_scoa_item_id || item.suspense_scoa_item_credit_id) && !(item.suspense_scoa_item_id && item.suspense_scoa_item_credit_id);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredItems.length / this.pageSize) || 1;
  }

  get pagedItems(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredItems.slice(start, start + this.pageSize);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.cdr.detectChanges();
    }
  }

  openDetail(item: any): void {
    this.selectedItem = { ...item };
    const s = (v: any) => v == null ? '' : String(v);
    this.glForm = {
      scoa_project_id: s(item.scoa_project_id),
      suspense_scoa_item_id: s(item.suspense_scoa_item_id),
      suspense_scoa_item_credit_id: s(item.suspense_scoa_item_credit_id),
      start_date: item.start_date ? item.start_date.split('T')[0] : '1900-01-01',
      end_date: item.end_date ? item.end_date.split('T')[0] : '9999-12-31',
      fin_year: item.fin_year || '',
      scoa_item_id_permanent_staff: s(item.scoa_item_id_permanent_staff),
      scoa_item_id_permanent_staff_meta: item.scoa_item_id_permanent_staff_meta || null,
      earning_not_applicable_post_retirement: item.earning_not_applicable_post_retirement || false,
      scoa_item_id_post_retirement: s(item.scoa_item_id_post_retirement),
      scoa_item_id_post_retirement_meta: item.scoa_item_id_post_retirement_meta || null,
      override_project: item.override_project || false,
      plan_project_item_id: s(item.plan_project_item_id),
      vendor_id: s(item.vendor_id),
      vendor_scoa_project_id: s(item.vendor_scoa_project_id),
      vendor_scoa_id: s(item.vendor_scoa_id),
      journal_entry_only: item.journal_entry_only || false,
      scoa_item_id: s(item.scoa_item_id),
      scoa_item_id_meta: item.scoa_item_id_meta || null
    };
    this.view = 'detail';
    this.loadLookups();
    this.externalProjects = [];
    this.controlScoaItems = [];
    this.planProjectItems = [];
    this.creditorControlScoaItems = [];
    this.revenuePlanProjectItems = [];
    this.revenueItemDetails = { project: '', department: '', division: '', function: '', region: '', fund: '' };
    this.loadExternalProjects(this.glForm.fin_year);
    if (this.glForm.scoa_project_id && this.glForm.fin_year) {
      this.loadControlScoaItems(this.glForm.scoa_project_id, this.glForm.fin_year);
    }
    if (this.glForm.scoa_item_id_permanent_staff && this.glForm.fin_year) {
      this.loadPlanProjectItems(this.glForm.scoa_item_id_permanent_staff, this.glForm.fin_year);
    }
    if (item.transaction_type === 'DEDUCTION' || item.transaction_type === 'COMPANY_CONTRIBUTION') {
      this.loadVendors();
      if (this.glForm.vendor_scoa_project_id && this.glForm.fin_year) {
        this.loadCreditorControlScoaItems(this.glForm.vendor_scoa_project_id, this.glForm.fin_year);
      }
    }
    if (item.transaction_type === 'DEDUCTION' && this.glForm.journal_entry_only && this.glForm.scoa_item_id && this.glForm.fin_year) {
      this.loadRevenuePlanProjectItems(this.glForm.scoa_item_id, this.glForm.fin_year);
    }
    this.cdr.detectChanges();
  }

  goBack(): void {
    this.view = 'list';
    this.selectedItem = null;
    this.loadItems();
    this.cdr.detectChanges();
  }

  saveGlMapping(): void {
    if (!this.selectedItem) return;
    this.saving = true;
    this.api.put<any>(`/gl/salary-heads/${this.selectedItem.id}/gl-mapping`, this.glForm).subscribe({
      next: (data) => {
        this.saving = false;
        this.ui.toast('success', 'Saved', 'GL mapping updated successfully');
        Object.assign(this.selectedItem, data);
        const idx = this.items.findIndex(i => i.id === this.selectedItem.id);
        if (idx >= 0) {
          Object.keys(this.glForm).forEach(k => {
            this.items[idx][k] = this.glForm[k];
          });
        }
        this.goBack();
      },
      error: (err: any) => {
        this.saving = false;
        this.ui.toast('error', 'Error', err?.error?.error?.message || 'Failed to save GL mapping');
        this.cdr.detectChanges();
      }
    });
  }

  clearGlMapping(): void {
    this.glForm = {
      scoa_project_id: '',
      suspense_scoa_item_id: '',
      suspense_scoa_item_credit_id: '',
      start_date: this.glForm.start_date,
      end_date: this.glForm.end_date,
      fin_year: this.glForm.fin_year,
      scoa_item_id_permanent_staff: '',
      earning_not_applicable_post_retirement: false,
      scoa_item_id_post_retirement: '',
      override_project: false,
      plan_project_item_id: '',
      vendor_id: '',
      vendor_scoa_project_id: '',
      vendor_scoa_id: '',
      journal_entry_only: false,
      scoa_item_id: '',
      scoa_item_id_meta: null
    };
    this.overrideProjectDetails = { project: '', department: '', division: '', function: '', region: '', fund: '' };
    this.revenueItemDetails = { project: '', department: '', division: '', function: '', region: '', fund: '' };
    this.controlScoaItems = [];
    this.creditorControlScoaItems = [];
    this.revenuePlanProjectItems = [];
    this.externalProjects = [];
    this.cdr.detectChanges();
  }

  getTypeLabel(type: string): string {
    const map: Record<string, string> = {
      EARNING: 'Earning',
      DEDUCTION: 'Deduction',
      COMPANY_CONTRIBUTION: 'Company Contribution',
      FRINGE_BENEFIT: 'Fringe Benefit'
    };
    return map[type] || type;
  }

  getTypeBadge(type: string): string {
    const map: Record<string, string> = {
      EARNING: 'badge-earning',
      DEDUCTION: 'badge-deduction',
      COMPANY_CONTRIBUTION: 'badge-company',
      FRINGE_BENEFIT: 'badge-fringe'
    };
    return map[type] || '';
  }

  deriveFinancialYear(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = d.getMonth();
    if (month >= 6) return `${year}/${year + 1}`;
    return `${year - 1}/${year}`;
  }
}
