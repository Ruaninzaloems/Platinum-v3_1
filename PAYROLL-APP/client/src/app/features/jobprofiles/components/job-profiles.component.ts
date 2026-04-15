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
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-job-profiles',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, StatusBadgeComponent, PaginationComponent, DateInputComponent, DateSaPipe],
  templateUrl: './job-profiles.component.html',
  styleUrl: './job-profiles.component.css'
})
export class JobProfilesComponent implements OnInit {
  profiles: any[] = [];
  filteredProfiles: any[] = [];
  loading = true;
  searchTerm = '';
  page = 1;
  limit = 25;

  view: 'list' | 'detail' = 'list';
  mode: 'create' | 'view' | 'edit' = 'view';
  activeTab = 'details';
  profile: any = {};
  currentIndex = -1;

  taskGrades: any[] = [];
  upperLimits: any[] = [];
  employeeTypes: any[] = [];
  employeeSubtypes: any[] = [];
  conditionsOfService: any[] = [];
  salaryTransactionGroups: any[] = [];
  departments: any[] = [];
  divisions: any[] = [];
  shifts: any[] = [];
  jobFamilies: any[] = [];
  employmentCategories: any[] = [];
  employmentCodes: any[] = [];
  workAreas: any[] = [];
  ofoMajorGroups: any[] = [];
  ofoSubMajorGroups: any[] = [];
  ofoMinorGroups: any[] = [];
  ofoUnitGroups: any[] = [];
  ofoOccupations: any[] = [];
  ofoSpecialists: any[] = [];

  duties: any[] = [];
  dutyForm: any = {};
  editingDuty: any = null;
  showDutyForm = false;

  history: any[] = [];
  linkedPositions: any[] = [];

  headerSearch = '';

  constructor(private api: ApiService, private ui: UiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.load();
    this.loadLookups();
  }

  load(): void {
    this.loading = true;
    this.api.get<any[]>('/positions/job-profiles').subscribe({
      next: (data) => {
        this.profiles = data || [];
        this.filterProfiles();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  loadLookups(): void {
    forkJoin({
      taskGrades: this.api.get<any[]>('/settings/task-grades'),
      upperLimits: this.api.get<any[]>('/settings/upper-limits'),
      employeeTypes: this.api.get<any[]>('/settings/employee-types'),
      employeeSubtypes: this.api.get<any[]>('/settings/employee-subtypes'),
      conditions: this.api.get<any[]>('/settings/conditions-of-service'),
      salaryGroups: this.api.get<any[]>('/settings/salary-transaction-groups'),
      departments: this.api.get<any[]>('/settings/departments'),
      divisions: this.api.get<any[]>('/settings/divisions'),
      shifts: this.api.get<any[]>('/settings/shifts'),
    }).subscribe({
      next: (r) => {
        this.taskGrades = r.taskGrades || [];
        this.upperLimits = r.upperLimits || [];
        this.employeeTypes = r.employeeTypes || [];
        this.employeeSubtypes = r.employeeSubtypes || [];
        this.conditionsOfService = r.conditions || [];
        this.salaryTransactionGroups = r.salaryGroups || [];
        this.departments = r.departments || [];
        this.divisions = r.divisions || [];
        this.shifts = r.shifts || [];
        this.cdr.detectChanges();
      },
      error: () => {}
    });

    this.api.get<any>('/positions/job-profiles/lookups/all').subscribe({
      next: (data) => {
        this.jobFamilies = data?.job_families || [];
        this.employmentCategories = data?.employment_categories || [];
        this.employmentCodes = data?.employment_codes || [];
        this.workAreas = data?.work_areas || [];
        this.ofoMajorGroups = data?.ofo_major_groups || [];
        this.ofoSubMajorGroups = data?.ofo_sub_major_groups || [];
        this.ofoMinorGroups = data?.ofo_minor_groups || [];
        this.ofoUnitGroups = data?.ofo_unit_groups || [];
        this.ofoOccupations = data?.ofo_occupations || [];
        this.ofoSpecialists = data?.ofo_specialists || [];
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  filterProfiles(): void {
    const s = this.searchTerm.toLowerCase().trim();
    if (!s) { this.filteredProfiles = [...this.profiles]; return; }
    const matched = this.profiles.filter(p =>
      String(p.id).includes(s) ||
      (p.job_title || '').toLowerCase().includes(s) ||
      (p.ofo_code || '').toLowerCase().includes(s) ||
      (p.occupation || '').toLowerCase().includes(s) ||
      (p.job_description_code || '').toLowerCase().includes(s) ||
      (p.employee_type_name || '').toLowerCase().includes(s) ||
      (p.grade_name || '').toLowerCase().includes(s)
    );
    matched.sort((a, b) => {
      const aExact = String(a.id) === s ? 0 : 1;
      const bExact = String(b.id) === s ? 0 : 1;
      if (aExact !== bExact) return aExact - bExact;
      const aIdMatch = String(a.id).includes(s) ? 0 : 1;
      const bIdMatch = String(b.id).includes(s) ? 0 : 1;
      if (aIdMatch !== bIdMatch) return aIdMatch - bIdMatch;
      return (a.job_title || '').localeCompare(b.job_title || '');
    });
    this.filteredProfiles = matched;
  }

  get activeCount(): number {
    return this.profiles.filter(p => p.is_active !== false && p.enabled).length;
  }

  get pagedProfiles(): any[] {
    const start = (this.page - 1) * this.limit;
    return this.filteredProfiles.slice(start, start + this.limit);
  }

  openCreate(): void {
    this.profile = { enabled: true, is_active: true, status: 1, link_task_grade: false, link_upper_limit: false, upper_limit_type: 'maximum', start_date: '1900-01-01', end_date: '9999-12-31' };
    this.mode = 'create';
    this.view = 'detail';
    this.activeTab = 'details';
    this.duties = [];
    this.history = [];
    this.linkedPositions = [];
    this.cdr.detectChanges();
  }

  openDetail(item: any, idx?: number): void {
    this.api.get<any>(`/positions/job-profiles/${item.id}`).subscribe({
      next: (data) => {
        this.profile = { ...data };
        this.profile.link_task_grade = !!this.profile.task_grade_id;
        this.profile.link_upper_limit = !!this.profile.upper_limit_id;
        if (!this.profile.upper_limit_type) this.profile.upper_limit_type = 'maximum';
        this.currentIndex = idx !== undefined ? idx : this.profiles.findIndex(p => p.id === item.id);
        this.mode = 'view';
        this.view = 'detail';
        this.activeTab = 'details';
        this.loadDuties();
        this.loadHistory();
        this.loadLinkedPositions();
        this.cdr.detectChanges();
      },
      error: () => this.ui.toast('error', 'Error', 'Failed to load job profile')
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
    if (this.mode === 'create') return 'Add New Job Profile';
    return this.profile.job_title || 'Job Profile';
  }

  navigatePrev(): void {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.openDetail(this.profiles[this.currentIndex], this.currentIndex);
    }
  }

  navigateNext(): void {
    if (this.currentIndex < this.profiles.length - 1) {
      this.currentIndex++;
      this.openDetail(this.profiles[this.currentIndex], this.currentIndex);
    }
  }

  searchHeader(): void {
    if (!this.headerSearch) return;
    const s = this.headerSearch.toLowerCase();
    const found = this.profiles.find(p =>
      String(p.id) === this.headerSearch ||
      (p.job_title || '').toLowerCase().includes(s) ||
      (p.job_description_code || '').toLowerCase().includes(s)
    );
    if (found) {
      this.openDetail(found);
    } else {
      this.ui.toast('info', 'Not Found', 'No profile matches your search');
    }
  }

  get isPostRetirement(): boolean {
    if (!this.profile.employee_type_id) return false;
    const et = this.employeeTypes.find(t => t.id === this.profile.employee_type_id);
    return et?.name === 'Post-Retirement';
  }

  get showTaskGrade(): boolean {
    if (!this.profile.employee_type_id) return true;
    const et = this.employeeTypes.find(t => t.id === this.profile.employee_type_id);
    const name = (et?.name || '').toLowerCase();
    return name.includes('municipal staff') || name.includes('post-retirement') || name.includes('post retirement');
  }

  get showUpperLimit(): boolean {
    return !this.showTaskGrade;
  }

  onEmployeeTypeChange(): void {
    this.profile.employee_subtype_id = null;
    this.profile.upper_limit_id = null;
    if (this.showTaskGrade) {
      this.profile.link_upper_limit = false;
    } else {
      this.profile.link_task_grade = false;
      this.profile.task_grade_id = null;
    }
    if (this.isPostRetirement) {
      this.profile.ofo_major_group_id = null;
      this.profile.ofo_sub_major_group_id = null;
      this.profile.ofo_minor_group_id = null;
      this.profile.ofo_unit_group_id = null;
      this.profile.ofo_occupation_id = null;
      this.profile.specialist_id = null;
      this.profile.ofo_code = null;
      this.profile.occupation = null;
      this.profile.employment_category_id = null;
      this.profile.employment_code_id = null;
      this.profile.work_area_id = null;
      this.profile.job_family_id = null;
    }
    this.cdr.detectChanges();
  }

  onEmployeeSubtypeChange(): void {
    this.profile.upper_limit_id = null;
    this.cdr.detectChanges();
  }

  onLinkTaskGradeChange(): void {
    if (!this.profile.link_task_grade) {
      this.profile.task_grade_id = null;
    }
    this.cdr.detectChanges();
  }

  onLinkUpperLimitChange(): void {
    if (!this.profile.link_upper_limit) {
      this.profile.upper_limit_id = null;
      this.profile.upper_limit_type = 'maximum';
    } else if (!this.profile.upper_limit_type) {
      this.profile.upper_limit_type = 'maximum';
    }
    this.cdr.detectChanges();
  }

  onUpperLimitTypeChange(): void {
    this.cdr.detectChanges();
  }

  filteredUpperLimits(): any[] {
    if (!this.profile.employee_type_id || !this.profile.employee_subtype_id) return [];
    return this.upperLimits.filter((u: any) =>
      u.employee_type_id === this.profile.employee_type_id &&
      u.employee_subtype_id === this.profile.employee_subtype_id
    );
  }

  upperLimitDisplayAmount(u: any): string {
    const type = this.profile.upper_limit_type || 'maximum';
    let val = 0;
    if (type === 'minimum') val = u.minimum_value;
    else if (type === 'midpoint') val = u.midpoint_value;
    else val = u.maximum_value;
    return Number(val).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  upperLimitViewAmount(): string {
    const type = this.profile.upper_limit_type || 'maximum';
    let val = 0;
    if (type === 'minimum') val = this.profile.upper_limit_min;
    else if (type === 'midpoint') val = this.profile.upper_limit_mid;
    else val = this.profile.upper_limit_max;
    return Number(val || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  filteredSubtypes(): any[] {
    if (!this.profile.employee_type_id) return this.employeeSubtypes;
    return this.employeeSubtypes.filter((s: any) => s.employee_type_id === this.profile.employee_type_id);
  }

  filteredOfoSubMajorGroups(): any[] {
    if (!this.profile.ofo_major_group_id) return [];
    return this.ofoSubMajorGroups.filter((g: any) => g.major_group_id === this.profile.ofo_major_group_id);
  }

  filteredOfoMinorGroups(): any[] {
    if (!this.profile.ofo_sub_major_group_id) return [];
    return this.ofoMinorGroups.filter((g: any) => g.sub_major_group_id === this.profile.ofo_sub_major_group_id);
  }

  filteredOfoUnitGroups(): any[] {
    if (!this.profile.ofo_minor_group_id) return [];
    return this.ofoUnitGroups.filter((g: any) => g.minor_group_id === this.profile.ofo_minor_group_id);
  }

  filteredOfoOccupations(): any[] {
    if (!this.profile.ofo_unit_group_id) return [];
    return this.ofoOccupations.filter((o: any) => o.unit_group_id === this.profile.ofo_unit_group_id);
  }

  filteredOfoSpecialists(): any[] {
    if (!this.profile.ofo_occupation_id) return [];
    return this.ofoSpecialists.filter((s: any) => s.occupation_id === this.profile.ofo_occupation_id);
  }

  onMajorGroupChange(): void {
    this.profile.ofo_sub_major_group_id = null;
    this.profile.ofo_minor_group_id = null;
    this.profile.ofo_unit_group_id = null;
    this.profile.ofo_occupation_id = null;
    this.profile.specialist_id = null;
    this.profile.ofo_code = null;
    this.profile.occupation = null;
  }

  onSubMajorGroupChange(): void {
    this.profile.ofo_minor_group_id = null;
    this.profile.ofo_unit_group_id = null;
    this.profile.ofo_occupation_id = null;
    this.profile.specialist_id = null;
    this.profile.ofo_code = null;
    this.profile.occupation = null;
  }

  onMinorGroupChange(): void {
    this.profile.ofo_unit_group_id = null;
    this.profile.ofo_occupation_id = null;
    this.profile.specialist_id = null;
    this.profile.ofo_code = null;
    this.profile.occupation = null;
  }

  onUnitGroupChange(): void {
    this.profile.ofo_occupation_id = null;
    this.profile.specialist_id = null;
    this.profile.ofo_code = null;
    this.profile.occupation = null;
  }

  onOccupationChange(): void {
    this.profile.specialist_id = null;
    const occ = this.ofoOccupations.find(o => o.id === this.profile.ofo_occupation_id);
    if (occ) {
      this.profile.ofo_code = occ.code;
      this.profile.occupation = occ.name;
    } else {
      this.profile.ofo_code = null;
      this.profile.occupation = null;
    }
    this.cdr.detectChanges();
  }

  onSpecialistChange(): void {
    const spec = this.ofoSpecialists.find(s => s.id === this.profile.specialist_id);
    if (spec) {
      this.profile.ofo_code = spec.code;
      this.profile.occupation = spec.name;
    }
    this.cdr.detectChanges();
  }

  validate(): string | null {
    if (!this.profile.job_title) return 'Job Title is required';
    if (!this.profile.start_date) return 'Start Date is required';
    if (!this.profile.end_date) return 'End Date is required';
    if (!this.profile.employee_type_id) return 'Employee Type is required';
    if (!this.profile.employee_subtype_id) return 'Employee Subtype is required';
    if (!this.profile.salary_transaction_group_id) return 'Salary Transaction Group is required';
    if (!this.profile.job_description_code) return 'Job Description Code is required';

    if (this.profile.start_date && this.profile.end_date && this.profile.end_date < this.profile.start_date) {
      return 'End Date must be on or after Start Date';
    }

    if (!this.isPostRetirement) {
      if (!this.profile.job_family_id) return 'Occupation Level / Job Family is required';
      if (!this.profile.employment_category_id) return 'Employment Category is required';
      if (!this.profile.employment_code_id) return 'Employment Code is required';
    }

    const dup = this.profiles.find(p =>
      p.job_title?.toLowerCase() === this.profile.job_title?.toLowerCase() && p.id !== this.profile.id
    );
    if (dup) return 'A job profile with this title already exists';

    return null;
  }

  save(): void {
    const err = this.validate();
    if (err) {
      this.ui.toast('error', 'Validation', err);
      return;
    }

    if (!this.profile.link_task_grade) this.profile.task_grade_id = null;
    if (!this.profile.link_upper_limit) this.profile.upper_limit_id = null;

    const obs = this.profile.id
      ? this.api.put(`/positions/job-profiles/${this.profile.id}`, this.profile)
      : this.api.post('/positions/job-profiles', this.profile);

    obs.subscribe({
      next: (data: any) => {
        this.ui.toast('success', 'Saved', 'Job profile saved successfully');
        if (!this.profile.id && data?.id) {
          this.profile.id = data.id;
        }
        this.mode = 'view';
        this.load();
        if (this.profile.id) {
          this.api.get<any>(`/positions/job-profiles/${this.profile.id}`).subscribe({
            next: (fresh) => {
              this.profile = { ...fresh };
              this.profile.link_task_grade = !!this.profile.task_grade_id;
              this.profile.link_upper_limit = !!this.profile.upper_limit_id;
              if (!this.profile.upper_limit_type) this.profile.upper_limit_type = 'maximum';
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
    const linked = item.position_count > 0;
    if (linked) {
      this.ui.toast('error', 'Cannot Delete', `${item.position_count} position(s) are linked to this profile`);
      return;
    }
    const confirmed = await this.ui.confirm({ title: 'Delete Profile', message: `Delete "${item.job_title}"?`, danger: true });
    if (confirmed) {
      this.api.delete(`/positions/job-profiles/${item.id}`).subscribe({
        next: () => { this.ui.toast('success', 'Deleted', 'Job profile removed'); this.load(); },
        error: (err: any) => this.ui.toast('error', 'Error', err?.error?.error?.message || 'Failed to delete')
      });
    }
  }

  async deleteProfile(): Promise<void> {
    if (this.linkedPositions.length > 0) {
      this.ui.toast('error', 'Cannot Disable', 'This profile has linked positions with active employees');
      return;
    }
    const confirmed = await this.ui.confirm({ title: 'Disable Profile', message: `Disable "${this.profile.job_title}"?`, danger: true });
    if (confirmed) {
      this.api.delete(`/positions/job-profiles/${this.profile.id}`).subscribe({
        next: () => {
          this.ui.toast('success', 'Disabled', 'Job profile disabled');
          this.goBack();
        },
        error: (err: any) => this.ui.toast('error', 'Error', err?.error?.error?.message || 'Failed to disable')
      });
    }
  }

  loadDuties(): void {
    if (!this.profile.id) return;
    this.api.get<any[]>(`/positions/job-profiles/${this.profile.id}/duties`).subscribe({
      next: (data) => { this.duties = data || []; this.cdr.detectChanges(); },
      error: () => {}
    });
  }

  openDutyForm(duty?: any): void {
    this.editingDuty = duty || null;
    this.dutyForm = duty ? { ...duty } : { duty_description: '', sequence: this.duties.length + 1, is_active: true };
    this.showDutyForm = true;
    this.cdr.detectChanges();
  }

  cancelDutyForm(): void {
    this.showDutyForm = false;
    this.editingDuty = null;
    this.cdr.detectChanges();
  }

  saveDuty(): void {
    if (!this.dutyForm.duty_description) {
      this.ui.toast('error', 'Validation', 'Duty description is required');
      return;
    }
    const obs = this.editingDuty
      ? this.api.put(`/positions/job-profiles/${this.profile.id}/duties/${this.editingDuty.id}`, this.dutyForm)
      : this.api.post(`/positions/job-profiles/${this.profile.id}/duties`, this.dutyForm);
    obs.subscribe({
      next: () => {
        this.ui.toast('success', 'Saved', 'Duty saved');
        this.showDutyForm = false;
        this.editingDuty = null;
        this.loadDuties();
        this.cdr.detectChanges();
      },
      error: (err: any) => this.ui.toast('error', 'Error', err?.error?.error?.message || 'Failed to save duty')
    });
  }

  async deleteDuty(duty: any): Promise<void> {
    const confirmed = await this.ui.confirm({ title: 'Delete Duty', message: 'Delete this duty?', danger: true });
    if (confirmed) {
      this.api.delete(`/positions/job-profiles/${this.profile.id}/duties/${duty.id}`).subscribe({
        next: () => { this.ui.toast('success', 'Deleted', 'Duty removed'); this.loadDuties(); },
        error: (err: any) => this.ui.toast('error', 'Error', err?.error?.error?.message || 'Failed to delete')
      });
    }
  }

  loadHistory(): void {
    if (!this.profile.id) return;
    this.api.get<any[]>(`/positions/job-profiles/${this.profile.id}/history`).subscribe({
      next: (data) => { this.history = data || []; this.cdr.detectChanges(); },
      error: () => {}
    });
  }

  loadLinkedPositions(): void {
    if (!this.profile.id) return;
    this.api.get<any[]>(`/positions/job-profiles/${this.profile.id}/linked-positions`).subscribe({
      next: (data) => { this.linkedPositions = data || []; this.cdr.detectChanges(); },
      error: () => {}
    });
  }
}
