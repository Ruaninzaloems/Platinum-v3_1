import { Component, OnInit, ChangeDetectorRef, effect, Injector } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { UiService } from '../../../../core/services/ui.service';
import { CurrentUserService } from '../../../../core/services/current-user.service';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { CurrencyZarPipe } from '../../../../shared/pipes/currency-zar.pipe';
import { DateSaPipe } from '../../../../shared/pipes/date-sa.pipe';
import { DateTimeSaPipe } from '../../../../shared/pipes/date-time-sa.pipe';
import { DateInputComponent } from '../../../../shared/components/date-input/date-input.component';
import { SearchablePickerComponent } from '../../../../shared/components/searchable-picker/searchable-picker.component';

@Component({
  selector: 'app-overtime',
  standalone: true,
  host: { 'data-accent': 'payroll' },
  imports: [CommonModule, FormsModule, IconComponent, StatusBadgeComponent, PaginationComponent, CurrencyZarPipe, DateSaPipe, DateTimeSaPipe, DateInputComponent, SearchablePickerComponent],
  templateUrl: './overtime.component.html',
  styleUrl: './overtime.component.css'
})
export class OvertimeComponent implements OnInit {
  view: 'list' | 'form' | 'detail' = 'list';
  activeTab: 'current' | 'processed' = 'current';
  loading = true;
  records: any[] = [];

  processedRecords: any[] = [];
  processedLoading = false;
  processedPage = 1;
  processedTotal = 0;
  processedHeadFilter = '';
  processedEmployeeFilterId: number | null = null;
  processedFilterEmployeeSearch = '';
  processedFilterEmployees: any[] = [];

  detailRecord: any = null;
  recordHistory: any[] = [];
  historyLoading = false;

  showReturnModal = false;
  returnComment = '';
  returnTarget: any = null;
  returnIsBulk = false;

  showFailedModal = false;
  failedModalTitle = '';
  failedRecords: any[] = [];

  showRejectModal = false;
  rejectComment = '';
  rejectTarget: any = null;
  rejectIsBulk = false;

  selectedIds: Set<number> = new Set();
  bulkProcessing = false;

  statusFilter = '';
  headFilter = '';
  departmentFilter = '';
  divisionFilter = '';
  departments: any[] = [];
  filteredDivisions: any[] = [];
  employeeFilterId: number | null = null;
  filterEmployeeSearch = '';
  filterEmployees: any[] = [];

  page = 1;
  limit = 25;
  total = 0;

  formLoading = false;
  form: any = {};
  editingId: number | null = null;
  editingReturnedId: number | null = null;

  employees: any[] = [];
  employeeSearch = '';
  employeeLoading = false;
  selectedEmployee: any = null;

  salaryHeads: any[] = [];
  employeeSalaryHeads: any[] = [];
  selectedHead: any = null;
  inputMode: 'hours' | 'time' = 'hours';

  employeeOvertimeAllowed = true;
  employeeHourlyRate = 0;
  employeeAnnualSalary = 0;
  employeeInfoLoading = false;

  canApprove = true;
  formIsLocked = false;

  scoaResolution: { scoa_item_id: number | null; scoa_code: string | null; scoa_description: string | null; fin_year: string | null } | null = null;
  scoaResolutionLoading = false;
  planProjectItems: any[] = [];
  planProjectItemsLoading = false;
  detailPlanProjectItem: any = null;

  planProjectItemPrimary = (item: any): string => {
    if (!item) return '';
    const desc = item.projectDesc || '';
    const id = item.planProjectItemId != null ? item.planProjectItemId : '';
    return desc && id ? `${desc} - ${id}` : (desc || String(id));
  };

  planProjectItemSecondary = (item: any): string => {
    if (!item) return '';
    return [item.fund, item.scoaFunction, item.region, item.cost]
      .filter(v => v != null && v !== '')
      .join(' | ');
  };

  planProjectItemSearchFields = ['planProjectItemId', 'projectDesc', 'fund', 'scoaFunction', 'region', 'cost'];

  constructor(private api: ApiService, private ui: UiService, private cdr: ChangeDetectorRef, private currentUser: CurrentUserService, private injector: Injector) {
    let firstRun = true;
    effect(() => {
      const _user = this.currentUser.currentUser();
      if (firstRun) { firstRun = false; return; }
      this.loadCanApprove();
      this.loadRecords();
    }, { injector: this.injector });
  }

  get currentUserId(): number {
    return this.currentUser.getCurrentUser().userId;
  }

  ngOnInit(): void {
    this.loadCanApprove();
    this.loadRecords();
    this.loadDepartments();
    this.loadSalaryHeads();
  }

  loadCanApprove(): void {
    this.api.getRaw<any>('/overtime/can-approve').subscribe({
      next: (res: any) => {
        this.canApprove = res?.data?.canApprove === true;
        this.cdr.detectChanges();
      },
      error: () => {
        this.canApprove = true;
        this.cdr.detectChanges();
      }
    });
  }

  loadSalaryHeads(): void {
    this.api.getRaw<any>('/overtime/salary-heads').subscribe({
      next: (res: any) => {
        this.salaryHeads = res?.data || [];
        this.cdr.detectChanges();
      },
      error: () => { this.salaryHeads = []; }
    });
  }

  switchTab(tab: 'current' | 'processed'): void {
    if (this.activeTab === tab) return;
    this.activeTab = tab;
    if (tab === 'processed') {
      this.loadProcessedRecords();
    }
    this.cdr.detectChanges();
  }

  loadRecords(): void {
    this.loading = true;
    const params: any = { page: this.page, limit: this.limit, tab: 'current' };
    if (this.statusFilter) params.status = this.statusFilter;
    if (this.headFilter) params.salary_head_id = this.headFilter;
    if (this.employeeFilterId) params.employee_id = this.employeeFilterId;
    if (this.departmentFilter) params.department_id = this.departmentFilter;
    if (this.divisionFilter) params.division_id = this.divisionFilter;

    this.api.getPaginated<any>('/overtime', params).subscribe({
      next: (res: any) => {
        this.records = res.data || [];
        this.total = res.meta?.total || 0;
        this.loading = false;
        this.selectedIds.clear();
        this.cdr.detectChanges();
      },
      error: () => {
        this.records = [];
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadProcessedRecords(): void {
    this.processedLoading = true;
    const params: any = { page: this.processedPage, limit: this.limit, tab: 'processed' };
    if (this.processedHeadFilter) params.salary_head_id = this.processedHeadFilter;
    if (this.processedEmployeeFilterId) params.employee_id = this.processedEmployeeFilterId;

    this.api.getPaginated<any>('/overtime', params).subscribe({
      next: (res: any) => {
        this.processedRecords = res.data || [];
        this.processedTotal = res.meta?.total || 0;
        this.processedLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.processedRecords = [];
        this.processedLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onPageChange(p: number): void {
    this.page = p;
    this.loadRecords();
  }

  onProcessedPageChange(p: number): void {
    this.processedPage = p;
    this.loadProcessedRecords();
  }

  loadDepartments(): void {
    this.api.get<any>('/departments').subscribe({
      next: (data: any) => {
        this.departments = data || [];
        this.cdr.detectChanges();
      },
      error: () => { this.departments = []; }
    });
  }

  onDepartmentFilterChange(): void {
    this.divisionFilter = '';
    if (this.departmentFilter) {
      this.api.get<any>(`/departments/${this.departmentFilter}/divisions`).subscribe({
        next: (data: any) => {
          this.filteredDivisions = data || [];
          this.cdr.detectChanges();
        },
        error: () => { this.filteredDivisions = []; this.cdr.detectChanges(); }
      });
    } else {
      this.filteredDivisions = [];
    }
    this.onFilterChange();
  }

  onFilterChange(): void {
    this.page = 1;
    this.loadRecords();
  }

  onProcessedFilterChange(): void {
    this.processedPage = 1;
    this.loadProcessedRecords();
  }

  searchProcessedFilterEmployees(): void {
    if (!this.processedFilterEmployeeSearch || this.processedFilterEmployeeSearch.length < 2) {
      this.processedFilterEmployees = [];
      this.cdr.detectChanges();
      return;
    }
    this.api.getPaginated<any>('/employees', { search: this.processedFilterEmployeeSearch, limit: 20 }).subscribe({
      next: (res: any) => {
        this.processedFilterEmployees = res.data || [];
        this.cdr.detectChanges();
      },
      error: () => {
        this.processedFilterEmployees = [];
        this.cdr.detectChanges();
      }
    });
  }

  selectProcessedFilterEmployee(emp: any): void {
    this.processedEmployeeFilterId = emp.id;
    this.processedFilterEmployeeSearch = emp.id + ' | ' + emp.employee_code + ' - ' + emp.first_name + ' ' + emp.surname;
    this.processedFilterEmployees = [];
    this.onProcessedFilterChange();
  }

  clearProcessedEmployeeFilter(): void {
    this.processedEmployeeFilterId = null;
    this.processedFilterEmployeeSearch = '';
    this.processedFilterEmployees = [];
    this.onProcessedFilterChange();
  }

  searchFilterEmployees(): void {
    if (!this.filterEmployeeSearch || this.filterEmployeeSearch.length < 2) {
      this.filterEmployees = [];
      this.cdr.detectChanges();
      return;
    }
    this.api.getPaginated<any>('/employees', { search: this.filterEmployeeSearch, limit: 20 }).subscribe({
      next: (res: any) => {
        this.filterEmployees = res.data || [];
        this.cdr.detectChanges();
      },
      error: () => {
        this.filterEmployees = [];
        this.cdr.detectChanges();
      }
    });
  }

  selectFilterEmployee(emp: any): void {
    this.employeeFilterId = emp.id;
    this.filterEmployeeSearch = emp.id + ' | ' + emp.employee_code + ' - ' + emp.first_name + ' ' + emp.surname;
    this.filterEmployees = [];
    this.onFilterChange();
  }

  clearEmployeeFilter(): void {
    this.employeeFilterId = null;
    this.filterEmployeeSearch = '';
    this.filterEmployees = [];
    this.onFilterChange();
  }

  openAddForm(): void {
    this.form = {
      employee_id: null,
      salary_head_id: '',
      overtime_date: '',
      hours: null,
      start_time: '',
      end_time: '',
      reference_no: '',
      notes: '',
      override_project: false,
      plan_project_item_id: null
    };
    this.selectedEmployee = null;
    this.selectedHead = null;
    this.inputMode = 'hours';
    this.employees = [];
    this.employeeSearch = '';
    this.editingId = null;
    this.editingReturnedId = null;
    this.scoaResolution = null;
    this.planProjectItems = [];
    this.formIsLocked = false;
    this.view = 'form';
    this.cdr.detectChanges();
  }

  toStr(v: any): string { return v == null ? '' : String(v); }

  private resolveScoa(): void {
    this.scoaResolution = null;
    this.planProjectItems = [];
    if (!this.form.employee_id || !this.form.salary_head_id) {
      this.cdr.detectChanges();
      return;
    }
    this.scoaResolutionLoading = true;
    this.cdr.detectChanges();
    const params: any = {
      employee_id: this.form.employee_id,
      salary_head_id: this.form.salary_head_id
    };
    if (this.form.overtime_date) params.overtime_date = this.form.overtime_date;
    this.api.getRaw<any>('/overtime/scoa-resolution', params).subscribe({
      next: (res: any) => {
        this.scoaResolution = res?.data || null;
        this.scoaResolutionLoading = false;
        if (this.form.override_project && this.scoaResolution?.scoa_item_id && this.scoaResolution.fin_year) {
          this.loadPlanProjectItems();
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.scoaResolution = null;
        this.scoaResolutionLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadPlanProjectItems(): void {
    if (!this.scoaResolution?.scoa_item_id || !this.scoaResolution.fin_year) {
      this.planProjectItems = [];
      this.cdr.detectChanges();
      return;
    }
    this.planProjectItemsLoading = true;
    this.cdr.detectChanges();
    this.api.get<any>('/gl/external/plan-project-items', {
      scoaId: this.scoaResolution.scoa_item_id,
      finYear: this.scoaResolution.fin_year
    }).subscribe({
      next: (data: any) => {
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

  onOvertimeDateChange(): void {
    if (!this.form.employee_id || !this.form.salary_head_id) return;
    const previousFinYear = this.scoaResolution?.fin_year || null;
    this.resolveScoa();
    if (this.form.override_project) {
      this.form.plan_project_item_id = null;
      this.planProjectItems = [];
      if (previousFinYear) {
        this.ui.toast('info', 'GL Posting', 'Plan Project Item cleared because the overtime date changed the financial year. Please pick again.');
      }
    }
  }

  onOverrideProjectToggle(): void {
    if (this.form.override_project) {
      if (this.scoaResolution?.scoa_item_id && this.scoaResolution.fin_year) {
        this.loadPlanProjectItems();
      }
    } else {
      this.form.plan_project_item_id = null;
      this.planProjectItems = [];
    }
    this.cdr.detectChanges();
  }

  get scoaDisplayLabel(): string {
    if (this.scoaResolutionLoading) return 'Resolving...';
    const r = this.scoaResolution;
    if (!r || !r.scoa_item_id) return 'SCOA unavailable';
    if (r.scoa_code && r.scoa_description) return `${r.scoa_code} — ${r.scoa_description}`;
    return r.scoa_code || r.scoa_description || 'SCOA unavailable';
  }

  get scoaResolved(): boolean {
    return !!(this.scoaResolution && this.scoaResolution.scoa_item_id);
  }

  backToList(): void {
    this.view = 'list';
    this.editingId = null;
    this.editingReturnedId = null;
    if (this.activeTab === 'processed') {
      this.loadProcessedRecords();
    } else {
      this.loadRecords();
    }
  }

  searchEmployees(): void {
    if (!this.employeeSearch || this.employeeSearch.length < 2) {
      this.employees = [];
      this.cdr.detectChanges();
      return;
    }
    this.employeeLoading = true;
    this.api.getPaginated<any>('/employees', { search: this.employeeSearch, limit: 20 }).subscribe({
      next: (res: any) => {
        this.employees = res.data || [];
        this.employeeLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.employees = [];
        this.employeeLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  selectEmployee(emp: any): void {
    this.selectedEmployee = emp;
    this.form.employee_id = emp.id;
    this.employeeSearch = emp.id + ' | ' + emp.employee_code + ' - ' + emp.first_name + ' ' + emp.surname;
    this.employees = [];
    this.form.salary_head_id = '';
    this.selectedHead = null;
    this.form.override_project = false;
    this.form.plan_project_item_id = null;
    this.scoaResolution = null;
    this.planProjectItems = [];
    this.loadEmployeeOvertimeInfo(emp.id);
    if (emp.payroll_cycle_id) this.checkFormLockStatus(emp.payroll_cycle_id);
    this.cdr.detectChanges();
  }

  clearEmployee(): void {
    this.selectedEmployee = null;
    this.form.employee_id = null;
    this.form.salary_head_id = '';
    this.selectedHead = null;
    this.employeeSearch = '';
    this.employees = [];
    this.employeeSalaryHeads = [];
    this.employeeOvertimeAllowed = true;
    this.employeeHourlyRate = 0;
    this.employeeAnnualSalary = 0;
    this.form.override_project = false;
    this.form.plan_project_item_id = null;
    this.scoaResolution = null;
    this.planProjectItems = [];
    this.formIsLocked = false;
    this.cdr.detectChanges();
  }

  checkFormLockStatus(cycleId: any): void {
    if (!cycleId) { this.formIsLocked = false; this.cdr.detectChanges(); return; }
    this.api.getRaw<any>('/payroll/lock-status', { cycle_id: cycleId }).subscribe({
      next: (res: any) => { this.formIsLocked = res?.data?.locked === true; this.cdr.detectChanges(); },
      error: () => { this.formIsLocked = false; this.cdr.detectChanges(); }
    });
  }

  loadEmployeeOvertimeInfo(employeeId: number): void {
    this.employeeInfoLoading = true;
    this.api.getRaw<any>(`/overtime/employee-salary-heads/${employeeId}`).subscribe({
      next: (res: any) => {
        const data = res?.data || {};
        this.employeeOvertimeAllowed = data.allowOvertime !== false;
        this.employeeHourlyRate = data.hourlyRate || 0;
        this.employeeAnnualSalary = data.annualSalary || 0;
        this.employeeSalaryHeads = data.salaryHeads || [];
        this.employeeInfoLoading = false;
        if (!this.employeeOvertimeAllowed) {
          this.ui.toast('warning', 'Not Eligible', 'This employee is not eligible for overtime');
        }
        if (this.form.salary_head_id) {
          const headId = parseInt(this.form.salary_head_id, 10);
          this.selectedHead = this.employeeSalaryHeads.find((h: any) => h.id === headId) || null;
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.employeeSalaryHeads = this.salaryHeads;
        this.employeeOvertimeAllowed = true;
        this.employeeHourlyRate = 0;
        this.employeeAnnualSalary = 0;
        this.employeeInfoLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onHeadChange(): void {
    if (this.form.salary_head_id) {
      const headId = parseInt(this.form.salary_head_id, 10);
      this.selectedHead = this.employeeSalaryHeads.find((h: any) => h.id === headId)
        || this.salaryHeads.find((h: any) => h.id === headId)
        || null;
    } else {
      this.selectedHead = null;
    }
    this.form.override_project = false;
    this.form.plan_project_item_id = null;
    this.planProjectItems = [];
    this.resolveScoa();
    this.cdr.detectChanges();
  }

  get estimatedAmount(): number {
    if (!this.selectedEmployee || !this.selectedHead || this.employeeHourlyRate <= 0) return 0;
    const hours = this.computedHours;
    if (hours <= 0) return 0;
    return parseFloat((this.employeeHourlyRate * this.multiplier * hours).toFixed(2));
  }

  get computedHours(): number {
    if (this.inputMode === 'hours') {
      return parseFloat(this.form.hours) || 0;
    }
    if (this.form.start_time && this.form.end_time) {
      const [sh, sm] = this.form.start_time.split(':').map(Number);
      const [eh, em] = this.form.end_time.split(':').map(Number);
      let diff = (eh * 60 + em) - (sh * 60 + sm);
      if (diff < 0) diff += 24 * 60;
      return parseFloat((diff / 60).toFixed(2));
    }
    return 0;
  }

  get multiplier(): number {
    return this.selectedHead ? parseFloat(this.selectedHead.overtime_multiplier_rate) || 1.5 : 1.5;
  }

  submitOvertime(): void {
    if (!this.form.employee_id) {
      this.ui.toast('error', 'Validation', 'Please select an employee');
      return;
    }
    if (!this.form.salary_head_id) {
      this.ui.toast('error', 'Validation', 'Please select an overtime type');
      return;
    }
    if (!this.form.overtime_date) {
      this.ui.toast('error', 'Validation', 'Overtime date is required');
      return;
    }
    if (this.computedHours <= 0) {
      this.ui.toast('error', 'Validation', 'Hours must be greater than 0');
      return;
    }
    if (this.form.override_project && !this.form.plan_project_item_id) {
      this.ui.toast('error', 'Validation', 'Please select a Plan Project Item when Override Project is ticked');
      return;
    }

    this.formLoading = true;
    const body: any = {
      employee_id: this.form.employee_id,
      salary_head_id: parseInt(this.form.salary_head_id, 10),
      overtime_date: this.form.overtime_date,
      reference_no: this.form.reference_no || null,
      notes: this.form.notes || null,
      override_project: !!this.form.override_project,
      plan_project_item_id: this.form.override_project && this.form.plan_project_item_id
        ? parseInt(String(this.form.plan_project_item_id), 10)
        : null
    };

    if (this.inputMode === 'hours') {
      body.hours = this.computedHours;
    } else {
      body.start_time = this.form.start_time;
      body.end_time = this.form.end_time;
    }

    if (this.editingReturnedId) {
      this.api.put<any>(`/overtime/${this.editingReturnedId}`, body).subscribe({
        next: () => {
          this.ui.toast('success', 'Resubmitted', 'Overtime corrected and resubmitted');
          this.formLoading = false;
          this.editingReturnedId = null;
          this.backToList();
        },
        error: (err: any) => {
          this.ui.toast('error', 'Error', err?.error?.error?.message || 'Failed to resubmit overtime');
          this.formLoading = false;
          this.cdr.detectChanges();
        }
      });
    } else if (this.editingId) {
      this.api.put<any>(`/overtime/${this.editingId}`, body).subscribe({
        next: () => {
          this.ui.toast('success', 'Updated', 'Overtime updated successfully');
          this.formLoading = false;
          this.editingId = null;
          this.backToList();
        },
        error: (err: any) => {
          this.ui.toast('error', 'Error', err?.error?.error?.message || 'Failed to update overtime');
          this.formLoading = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      this.api.postRaw<any>('/overtime', body).subscribe({
        next: () => {
          this.ui.toast('success', 'Submitted', 'Overtime submitted successfully');
          this.formLoading = false;
          this.backToList();
        },
        error: (err: any) => {
          this.ui.toast('error', 'Error', err?.error?.error?.message || 'Failed to submit overtime');
          this.formLoading = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  viewRecord(record: any): void {
    this.detailRecord = record;
    this.recordHistory = [];
    this.historyLoading = true;
    this.scoaResolution = null;
    this.detailPlanProjectItem = null;
    this.view = 'detail';
    this.cdr.detectChanges();

    this.api.getRaw<any>(`/overtime/${record.id}/history`).subscribe({
      next: (res: any) => {
        this.recordHistory = res?.data || [];
        this.historyLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.recordHistory = [];
        this.historyLoading = false;
        this.cdr.detectChanges();
      }
    });

    this.api.getRaw<any>('/overtime/scoa-resolution', {
      employee_id: record.employee_id,
      salary_head_id: record.salary_head_id,
      overtime_date: record.overtime_date ? String(record.overtime_date).substring(0, 10) : ''
    }).subscribe({
      next: (res: any) => {
        this.scoaResolution = res?.data || null;
        if (record.override_project && record.plan_project_item_id && this.scoaResolution?.scoa_item_id && this.scoaResolution.fin_year) {
          this.api.get<any>('/gl/external/plan-project-items', {
            scoaId: this.scoaResolution.scoa_item_id,
            finYear: this.scoaResolution.fin_year
          }).subscribe({
            next: (data: any) => {
              const list = data || [];
              this.detailPlanProjectItem = list.find((i: any) => Number(i.planProjectItemId) === Number(record.plan_project_item_id)) || null;
              this.cdr.detectChanges();
            },
            error: () => { this.cdr.detectChanges(); }
          });
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.scoaResolution = null;
        this.cdr.detectChanges();
      }
    });
  }

  get detailScoaLabel(): string {
    const r = this.scoaResolution;
    if (!r || !r.scoa_item_id) return 'SCOA unavailable';
    if (r.scoa_code && r.scoa_description) return `${r.scoa_code} — ${r.scoa_description}`;
    return r.scoa_code || r.scoa_description || 'SCOA unavailable';
  }

  get detailPlanProjectItemLabel(): string {
    const item = this.detailPlanProjectItem;
    if (!item) {
      return this.detailRecord?.plan_project_item_id ? `#${this.detailRecord.plan_project_item_id}` : '';
    }
    const desc = item.projectDesc || '';
    const id = item.planProjectItemId != null ? item.planProjectItemId : '';
    return desc && id ? `${desc} - ${id}` : (desc || String(id));
  }

  async approveRecord(record: any): Promise<void> {
    const confirmed = await this.ui.confirm({
      title: 'Approve Overtime',
      message: `Approve ${record.salary_head_name} overtime for ${record.first_name} ${record.surname} - R${parseFloat(record.amount).toFixed(2)}?`
    });
    if (!confirmed) return;

    this.api.patchRaw(`/overtime/${record.id}/approve`, {}).subscribe({
      next: (res: any) => {
        const msg = res?.message || 'Overtime approved';
        const title = res?.finalApproval ? 'Fully Approved' : 'Step Approved';
        this.ui.toast('success', title, msg);
        this.loadRecords();
      },
      error: (err: any) => {
        const msg = err?.error?.error?.message || err?.error?.message || 'Failed to approve overtime';
        this.ui.toast('error', err.status === 403 ? 'Unauthorized' : 'Error', msg);
      }
    });
  }

  rejectRecord(record: any): void {
    this.rejectComment = '';
    this.rejectTarget = record;
    this.rejectIsBulk = false;
    this.showRejectModal = true;
    this.cdr.detectChanges();
  }

  confirmReject(): void {
    if (!this.rejectComment.trim()) {
      this.ui.toast('error', 'Required', 'Please provide a reason for rejection');
      return;
    }
    this.showRejectModal = false;

    if (this.rejectIsBulk) {
      const ids = Array.from(this.selectedIds);
      this.bulkProcessing = true;
      this.cdr.detectChanges();
      this.api.postRaw<any>('/overtime/bulk-reject', { ids, comments: this.rejectComment.trim() }).subscribe({
        next: (res: any) => {
          const data = res?.data || res || {};
          this.ui.toast('success', 'Bulk Rejected', `${data.rejected ?? ids.length} overtime(s) rejected${data.failed ? ', ' + data.failed + ' failed' : ''}`);
          this.bulkProcessing = false;
          this.selectedIds.clear();
          this.loadRecords();
        },
        error: () => {
          this.ui.toast('error', 'Error', 'Failed to bulk reject');
          this.bulkProcessing = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      const record = this.rejectTarget;
      this.api.patchRaw(`/overtime/${record.id}/reject`, { comments: this.rejectComment.trim() }).subscribe({
        next: (res: any) => {
          this.ui.toast('success', 'Rejected', res?.message || 'Overtime rejected.');
          this.loadRecords();
        },
        error: (err: any) => {
          const msg = err?.error?.error?.message || err?.error?.message || 'Failed to reject overtime';
          this.ui.toast('error', err.status === 403 ? 'Unauthorized' : 'Error', msg);
        }
      });
    }
  }

  cancelReject(): void {
    this.showRejectModal = false;
    this.rejectTarget = null;
    this.rejectComment = '';
    this.rejectIsBulk = false;
    this.cdr.detectChanges();
  }

  returnRecord(record: any): void {
    this.returnComment = '';
    this.returnTarget = record;
    this.returnIsBulk = false;
    this.showReturnModal = true;
    this.cdr.detectChanges();
  }

  confirmReturn(): void {
    if (!this.returnComment.trim()) {
      this.ui.toast('error', 'Required', 'Please provide a reason for returning the overtime');
      return;
    }
    this.showReturnModal = false;
    this.cdr.detectChanges();

    if (this.returnIsBulk) {
      const ids = Array.from(this.selectedIds);
      if (ids.length === 0) {
        this.ui.toast('warning', 'No Selection', 'No records selected for return');
        return;
      }
      this.bulkProcessing = true;
      this.cdr.detectChanges();
      this.api.postRaw<any>('/overtime/bulk-return', { ids, comments: this.returnComment.trim() }).subscribe({
        next: (res: any) => {
          const data = res?.data || res || {};
          const returned = data.returned ?? ids.length;
          const failed = data.failed ?? 0;
          if (failed > 0) {
            this.ui.toast('warning', 'Partial Return', `${returned} overtime(s) returned, ${failed} failed`);
          } else {
            this.ui.toast('success', 'Bulk Returned', `${returned} overtime(s) returned for correction`);
          }
          this.bulkProcessing = false;
          this.returnIsBulk = false;
          this.selectedIds.clear();
          this.loadRecords();
        },
        error: () => {
          this.ui.toast('error', 'Error', 'Failed to bulk return');
          this.bulkProcessing = false;
          this.returnIsBulk = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      const record = this.returnTarget;
      if (!record) return;
      this.api.patchRaw(`/overtime/${record.id}/return`, { comments: this.returnComment.trim() }).subscribe({
        next: (res: any) => {
          this.ui.toast('success', 'Returned', res?.message || 'Overtime returned for correction.');
          this.loadRecords();
        },
        error: (err: any) => {
          const msg = err?.error?.error?.message || err?.error?.message || 'Failed to return overtime';
          this.ui.toast('error', err.status === 403 ? 'Unauthorized' : 'Error', msg);
        }
      });
    }
  }

  cancelReturn(): void {
    this.showReturnModal = false;
    this.returnTarget = null;
    this.returnComment = '';
    this.returnIsBulk = false;
    this.cdr.detectChanges();
  }

  bulkReturn(): void {
    this.returnComment = '';
    this.returnTarget = null;
    this.returnIsBulk = true;
    this.showReturnModal = true;
    this.cdr.detectChanges();
  }

  editPendingRecord(record: any): void {
    this.editingId = record.id;
    this.editingReturnedId = null;
    this.prefillForm(record);
  }

  editAndResubmit(record: any): void {
    this.editingReturnedId = record.id;
    this.editingId = null;
    this.prefillForm(record);
  }

  private prefillForm(record: any): void {
    this.form = {
      employee_id: record.employee_id,
      salary_head_id: String(record.salary_head_id),
      overtime_date: record.overtime_date ? record.overtime_date.substring(0, 10) : '',
      hours: record.hours || null,
      start_time: record.start_time || '',
      end_time: record.end_time || '',
      reference_no: record.reference_no || '',
      notes: record.notes || record.reason || '',
      override_project: !!record.override_project,
      plan_project_item_id: record.plan_project_item_id != null ? String(record.plan_project_item_id) : null
    };
    this.selectedEmployee = { id: record.employee_id, first_name: record.first_name, surname: record.surname, employee_code: record.employee_code };
    this.employeeSearch = record.employee_id + ' | ' + (record.employee_code || '') + ' - ' + record.first_name + ' ' + record.surname;
    this.inputMode = record.start_time ? 'time' : 'hours';
    this.employees = [];
    this.scoaResolution = null;
    this.planProjectItems = [];
    this.checkFormLockStatus(record.cycle_id);
    this.view = 'form';
    this.loadEmployeeOvertimeInfo(record.employee_id);
    this.resolveScoa();
    this.cdr.detectChanges();
  }

  getActionIcon(action: string): string {
    switch (action) {
      case 'SUBMITTED': return 'plus';
      case 'APPROVED': return 'check';
      case 'REJECTED': return 'x';
      case 'RETURNED': return 'chevronLeft';
      case 'PROCESSED': return 'dollar';
      default: return 'clock';
    }
  }

  getActionColor(action: string): string {
    switch (action) {
      case 'SUBMITTED': return '#3b82f6';
      case 'APPROVED': return '#16a34a';
      case 'REJECTED': return '#ef4444';
      case 'RETURNED': return '#f59e0b';
      case 'PROCESSED': return '#8b5cf6';
      default: return '#64748b';
    }
  }

  get pendingRecords(): any[] {
    return this.records.filter(r => r.status === 'PENDING');
  }

  get allPendingSelected(): boolean {
    const pending = this.pendingRecords;
    return pending.length > 0 && pending.every(r => this.selectedIds.has(r.id));
  }

  get selectedCount(): number {
    return this.selectedIds.size;
  }

  get selectedTotal(): number {
    return this.records
      .filter(r => this.selectedIds.has(r.id))
      .reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
  }

  toggleSelectAll(): void {
    const pending = this.pendingRecords;
    if (this.allPendingSelected) {
      pending.forEach(r => this.selectedIds.delete(r.id));
    } else {
      pending.forEach(r => this.selectedIds.add(r.id));
    }
    this.cdr.detectChanges();
  }

  toggleSelection(id: number): void {
    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
    } else {
      this.selectedIds.add(id);
    }
    this.cdr.detectChanges();
  }

  async bulkApprove(): Promise<void> {
    const ids = Array.from(this.selectedIds);
    const confirmed = await this.ui.confirm({
      title: 'Bulk Approve Overtime',
      message: `Approve ${ids.length} overtime(s) totalling R${this.selectedTotal.toFixed(2)}?`
    });
    if (!confirmed) return;

    this.bulkProcessing = true;
    this.cdr.detectChanges();
    this.api.postRaw<any>('/overtime/bulk-approve', { ids }).subscribe({
      next: (res: any) => {
        const data = res?.data || res || {};
        const approved = data.approved ?? 0;
        const stepped = data.stepped ?? 0;
        const skipped = data.failed ?? 0;
        const skipReasons = data.skipReasons || {};
        const reasonList = Object.keys(skipReasons);
        if (approved + stepped === 0 && skipped > 0) {
          const reasonText = reasonList.length === 1 ? reasonList[0] : reasonList.map(r => `${skipReasons[r]}x: ${r}`).join('; ');
          this.ui.toast('warning', 'None Approved', `${skipped} overtime(s) skipped: ${reasonText}`);
        } else if (skipped > 0) {
          const reasonText = reasonList.length === 1 ? reasonList[0] : reasonList.map(r => `${skipReasons[r]}x: ${r}`).join('; ');
          this.ui.toast('warning', 'Partial Approval', `${approved + stepped} overtime(s) approved, ${skipped} skipped: ${reasonText}`);
        } else if (stepped > 0 && approved === 0) {
          this.ui.toast('success', 'Bulk Approved', `${stepped} overtime(s) advanced to next approval level`);
        } else {
          this.ui.toast('success', 'Bulk Approved', `${approved} overtime(s) fully approved${stepped ? ', ' + stepped + ' advanced to next level' : ''}`);
        }
        this.bulkProcessing = false;
        this.selectedIds.clear();
        this.loadRecords();
      },
      error: () => {
        this.ui.toast('error', 'Error', 'Failed to bulk approve');
        this.bulkProcessing = false;
        this.cdr.detectChanges();
      }
    });
  }

  bulkReject(): void {
    this.rejectComment = '';
    this.rejectTarget = null;
    this.rejectIsBulk = true;
    this.showRejectModal = true;
    this.cdr.detectChanges();
  }

  showFailedDetails(title: string, failedIds: number[]): void {
    this.failedModalTitle = title;
    this.failedRecords = failedIds.map(id => {
      const r = this.records.find(rec => rec.id === id);
      return r
        ? { id, employee_name: `${r.first_name} ${r.surname}`, employee_code: r.employee_code, salary_head_name: r.salary_head_name, amount: parseFloat(r.amount) || 0 }
        : { id, employee_name: 'Unknown', employee_code: '', salary_head_name: '', amount: 0 };
    });
    this.showFailedModal = true;
    this.cdr.detectChanges();
  }

  closeFailedModal(): void {
    this.showFailedModal = false;
    this.failedRecords = [];
    this.failedModalTitle = '';
    this.cdr.detectChanges();
  }
}
