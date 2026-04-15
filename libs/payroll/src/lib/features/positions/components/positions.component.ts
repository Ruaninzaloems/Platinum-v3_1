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

@Component({
  selector: 'app-positions',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, StatusBadgeComponent, PaginationComponent, DateInputComponent, DateSaPipe, ScoaDrilldownComponent],
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
  resolvedProjectName: string = '';
  resolvedRegionName: string = '';
  private _resolveVersion = 0;

  history: any[] = [];
  headerSearch = '';

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
    this.cdr.detectChanges();
  }

  onDivisionChange(): void {
    this.position._division_scoa_function_code = null;
    this.resolveDivisionScoaFunctionCode();
    this.defaultSubFunctionFromDivision();
    this.defaultProjectAndRegionFromDivision();
    this.cdr.detectChanges();
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
    } else {
      this.position.employee_type_id = null;
      this.position.employee_subtype_id = null;
      this.position.salary_transaction_group_id = null;
      this.position.condition_of_service_id = null;
      this.position.task_grade_id = null;
      this.position.upper_limit_value_type = null;
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

    const obs = this.position.id
      ? this.api.put(`/positions/${this.position.id}`, payload)
      : this.api.post('/positions', payload);

    obs.subscribe({
      next: (data: any) => {
        this.ui.toast('success', 'Saved', 'Position saved successfully');
        if (!this.position.id && data?.id) {
          this.position.id = data.id;
        }
        this.mode = 'view';
        this.load();
        if (this.position.id) {
          this.api.get<any>(`/positions/${this.position.id}`).subscribe({
            next: (fresh) => {
              this.position = { ...fresh };
              if (fresh.scoa_function_meta) {
                this.position._scoa_function_meta = fresh.scoa_function_meta;
              }
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
