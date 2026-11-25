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

@Component({
  selector: 'app-claims',
  standalone: true,
  host: { 'data-accent': 'payroll' },
  imports: [CommonModule, FormsModule, IconComponent, StatusBadgeComponent, PaginationComponent, CurrencyZarPipe, DateSaPipe, DateTimeSaPipe, DateInputComponent],
  templateUrl: './claims.component.html',
  styleUrl: './claims.component.css'
})
export class ClaimsComponent implements OnInit {
  view: 'list' | 'form' | 'detail' = 'list';
  activeTab: 'current' | 'processed' = 'current';
  loading = true;
  claims: any[] = [];

  processedClaims: any[] = [];
  processedLoading = false;
  processedPage = 1;
  processedTotal = 0;
  processedClaimTypeFilter = '';
  processedEmployeeFilterId: number | null = null;
  processedFilterEmployeeSearch = '';
  processedFilterEmployees: any[] = [];

  detailClaim: any = null;
  claimHistory: any[] = [];
  historyLoading = false;

  showReturnModal = false;
  returnComment = '';
  returnTarget: any = null;
  returnIsBulk = false;

  showFailedModal = false;
  failedModalTitle = '';
  failedClaims: any[] = [];

  showRejectModal = false;
  rejectComment = '';
  rejectTarget: any = null;
  rejectIsBulk = false;

  selectedFile: File | null = null;
  uploadingDocument = false;

  selectedClaimIds: Set<number> = new Set();
  bulkProcessing = false;

  duplicateWarning: string | null = null;
  duplicateConflicts: any[] = [];
  checkingDuplicates = false;

  statusFilter = '';
  claimTypeFilter = '';
  departmentFilter = '';
  divisionFilter = '';
  departments: any[] = [];
  filteredDivisions: any[] = [];
  employeeFilter = '';
  employeeFilterId: number | null = null;
  filterEmployees: any[] = [];
  filterEmployeeSearch = '';

  page = 1;
  limit = 25;
  total = 0;

  formLoading = false;
  form: any = {};
  editingClaimId: number | null = null;
  editingPendingClaimId: number | null = null;

  employees: any[] = [];
  employeeSearch = '';
  employeeLoading = false;
  selectedEmployee: any = null;

  claimConfigurations: any[] = [];
  selectedConfig: any = null;
  tariff = 0;

  claimTypes = [
    { value: 'S_AND_T', label: 'S & T' },
    { value: 'TRAVEL', label: 'Travel' }
  ];

  constructor(private api: ApiService, private ui: UiService, private cdr: ChangeDetectorRef, private currentUser: CurrentUserService, private injector: Injector) {
    let firstRun = true;
    effect(() => {
      const _user = this.currentUser.currentUser();
      if (firstRun) { firstRun = false; return; }
      this.loadCanApprove();
      this.loadClaims();
    }, { injector: this.injector });
  }

  get currentUserId(): number {
    return this.currentUser.getCurrentUser().userId;
  }

  canApprove = true;
  formIsLocked = false;

  ngOnInit(): void {
    this.loadCanApprove();
    this.loadClaims();
    this.loadDepartments();
  }

  loadCanApprove(): void {
    this.api.getRaw<any>('/time/claims/can-approve').subscribe({
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

  switchTab(tab: 'current' | 'processed'): void {
    if (this.activeTab === tab) return;
    this.activeTab = tab;
    if (tab === 'processed') {
      this.loadProcessedClaims();
    }
    this.cdr.detectChanges();
  }

  loadClaims(): void {
    this.loading = true;
    const params: any = { page: this.page, limit: this.limit, tab: 'current' };
    if (this.statusFilter) params.status = this.statusFilter;
    if (this.claimTypeFilter) params.claim_type = this.claimTypeFilter;
    if (this.employeeFilterId) params.employee_id = this.employeeFilterId;
    if (this.departmentFilter) params.department_id = this.departmentFilter;
    if (this.divisionFilter) params.division_id = this.divisionFilter;

    this.api.getPaginated<any>('/time/claims', params).subscribe({
      next: (res: any) => {
        this.claims = res.data || [];
        this.total = res.meta?.total || 0;
        this.loading = false;
        this.selectedClaimIds.clear();
        this.cdr.detectChanges();
      },
      error: () => {
        this.claims = [];
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadProcessedClaims(): void {
    this.processedLoading = true;
    const params: any = { page: this.processedPage, limit: this.limit, tab: 'processed' };
    if (this.processedClaimTypeFilter) params.claim_type = this.processedClaimTypeFilter;
    if (this.processedEmployeeFilterId) params.employee_id = this.processedEmployeeFilterId;

    this.api.getPaginated<any>('/time/claims', params).subscribe({
      next: (res: any) => {
        this.processedClaims = res.data || [];
        this.processedTotal = res.meta?.total || 0;
        this.processedLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.processedClaims = [];
        this.processedLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onPageChange(p: number): void {
    this.page = p;
    this.loadClaims();
  }

  onProcessedPageChange(p: number): void {
    this.processedPage = p;
    this.loadProcessedClaims();
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
    this.loadClaims();
  }

  onProcessedFilterChange(): void {
    this.processedPage = 1;
    this.loadProcessedClaims();
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
      claim_type: '',
      sub_type: '',
      start_date: '',
      end_date: '',
      kilometres: null,
      reference_no: '',
      reason: ''
    };
    this.selectedEmployee = null;
    this.claimConfigurations = [];
    this.selectedConfig = null;
    this.tariff = 0;
    this.employees = [];
    this.employeeSearch = '';
    this.editingClaimId = null;
    this.selectedFile = null;
    this.duplicateWarning = null;
    this.duplicateConflicts = [];
    this.formIsLocked = false;
    this.view = 'form';
    this.cdr.detectChanges();
  }

  backToList(): void {
    this.view = 'list';
    this.editingClaimId = null;
    this.editingPendingClaimId = null;
    if (this.activeTab === 'processed') {
      this.loadProcessedClaims();
    } else {
      this.loadClaims();
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
    if (emp.payroll_cycle_id) this.checkFormLockStatus(emp.payroll_cycle_id);
    this.cdr.detectChanges();
    this.checkDuplicates();
  }

  clearEmployee(): void {
    this.selectedEmployee = null;
    this.form.employee_id = null;
    this.employeeSearch = '';
    this.employees = [];
    this.duplicateWarning = null;
    this.duplicateConflicts = [];
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

  onClaimTypeChange(): void {
    this.form.sub_type = '';
    this.selectedConfig = null;
    this.tariff = 0;
    this.form.kilometres = null;
    this.form.end_date = '';
    this.claimConfigurations = [];
    this.duplicateWarning = null;
    this.duplicateConflicts = [];

    if (this.form.claim_type) {
      this.api.get<any[]>('/time/claims/configurations-by-type', { claim_type: this.form.claim_type }).subscribe({
        next: (data) => {
          this.claimConfigurations = data || [];
          this.cdr.detectChanges();
          this.checkDuplicates();
        },
        error: () => {
          this.claimConfigurations = [];
          this.cdr.detectChanges();
        }
      });
    }
    this.cdr.detectChanges();
  }

  onSubTypeChange(): void {
    if (!this.form.sub_type) {
      this.selectedConfig = null;
      this.tariff = 0;
      this.cdr.detectChanges();
      return;
    }
    const configId = parseInt(this.form.sub_type, 10);
    this.selectedConfig = this.claimConfigurations.find((c: any) => c.id === configId) || null;
    this.tariff = this.selectedConfig?.client_policy ? parseFloat(this.selectedConfig.client_policy) : (this.selectedConfig?.sars_rate ? parseFloat(this.selectedConfig.sars_rate) : 0);
    this.cdr.detectChanges();
  }

  get claimValue(): number {
    if (!this.tariff) return 0;
    if (this.form.claim_type === 'TRAVEL') {
      const km = parseFloat(this.form.kilometres) || 0;
      return parseFloat((km * this.tariff).toFixed(2));
    }
    if (this.form.claim_type === 'S_AND_T') {
      if (this.form.start_date && this.form.end_date) {
        const start = new Date(this.form.start_date);
        const end = new Date(this.form.end_date);
        if (end < start) return 0;
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        return parseFloat((days * this.tariff).toFixed(2));
      }
    }
    return 0;
  }

  get dayCount(): number {
    if (this.form.claim_type !== 'S_AND_T' || !this.form.start_date || !this.form.end_date) return 0;
    const start = new Date(this.form.start_date);
    const end = new Date(this.form.end_date);
    if (end < start) return 0;
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }

  checkDuplicates(): void {
    if (!this.form.employee_id || !this.form.claim_type || !this.form.start_date) {
      this.duplicateWarning = null;
      this.duplicateConflicts = [];
      this.checkingDuplicates = false;
      this.cdr.detectChanges();
      return;
    }
    if (this.form.claim_type === 'S_AND_T' && !this.form.end_date) {
      this.duplicateWarning = null;
      this.duplicateConflicts = [];
      this.checkingDuplicates = false;
      this.cdr.detectChanges();
      return;
    }
    this.checkingDuplicates = true;
    const params: any = {
      employee_id: this.form.employee_id,
      claim_type: this.form.claim_type,
      start_date: this.form.start_date
    };
    if (this.form.end_date) params.end_date = this.form.end_date;
    if (this.editingClaimId) params.exclude_claim_id = this.editingClaimId;

    this.api.get<any>('/time/claims/check-duplicate', params).subscribe({
      next: (res: any) => {
        const data = res?.data || res || {};
        this.checkingDuplicates = false;
        if (data.has_conflict && data.conflicts?.length > 0) {
          const ids = data.conflicts.map((c: any) => '#' + c.id).join(', ');
          this.duplicateWarning = `Potential duplicate detected: existing claim(s) ${ids} with overlapping dates.`;
          this.duplicateConflicts = data.conflicts;
        } else {
          this.duplicateWarning = null;
          this.duplicateConflicts = [];
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.checkingDuplicates = false;
        this.duplicateWarning = null;
        this.duplicateConflicts = [];
        this.cdr.detectChanges();
      }
    });
  }

  getSubTypeLabel(config: any): string {
    if (!config) return '';
    const group = config.claim_group ? config.claim_group + ' - ' : '';
    return group + config.claim_subtype;
  }

  submitClaim(): void {
    if (!this.form.employee_id) {
      this.ui.toast('error', 'Validation', 'Please select an employee');
      return;
    }
    if (!this.form.claim_type) {
      this.ui.toast('error', 'Validation', 'Please select a claim type');
      return;
    }
    if (!this.form.sub_type && !this.editingClaimId && !this.editingPendingClaimId) {
      this.ui.toast('error', 'Validation', 'Please select a sub-type');
      return;
    }
    if (!this.form.start_date) {
      this.ui.toast('error', 'Validation', 'Start date is required');
      return;
    }
    if (this.form.claim_type === 'S_AND_T' && !this.form.end_date) {
      this.ui.toast('error', 'Validation', 'End date is required for S & T claims');
      return;
    }
    if (this.form.claim_type === 'S_AND_T' && this.form.end_date && new Date(this.form.end_date) < new Date(this.form.start_date)) {
      this.ui.toast('error', 'Validation', 'End date cannot be before start date');
      return;
    }
    if (this.form.claim_type === 'TRAVEL' && (!this.form.kilometres || this.form.kilometres <= 0)) {
      this.ui.toast('error', 'Validation', 'Kilometres must be greater than 0 for Travel claims');
      return;
    }
    if (this.claimValue <= 0 && !this.editingClaimId && !this.editingPendingClaimId) {
      this.ui.toast('error', 'Validation', 'Claim value must be greater than 0');
      return;
    }

    this.formLoading = true;
    const subType = this.selectedConfig ? this.getSubTypeLabel(this.selectedConfig) : (this.form.existing_sub_type || '');
    const amount = this.claimValue || this.form.amount;

    if (this.editingPendingClaimId) {
      const body = {
        claim_type: this.form.claim_type,
        sub_type: subType,
        start_date: this.form.start_date,
        end_date: this.form.end_date || null,
        amount: amount,
        kilometres: this.form.kilometres || null,
        reason: this.form.reason || null,
        reference_no: this.form.reference_no || null
      };
      this.api.put<any>(`/time/claims/${this.editingPendingClaimId}`, body).subscribe({
        next: () => {
          if (this.selectedFile) {
            this.uploadDocumentForClaim(this.editingPendingClaimId!, 'Updated', 'Claim updated successfully');
          } else {
            this.ui.toast('success', 'Updated', 'Claim updated successfully');
            this.formLoading = false;
            this.editingPendingClaimId = null;
            this.backToList();
          }
        },
        error: (err: any) => {
          const msg = err?.error?.error?.message || 'Failed to update claim';
          if (err?.status === 409) {
            this.duplicateWarning = msg;
            this.duplicateConflicts = err?.error?.error?.duplicates || [];
            this.ui.toast('error', 'Duplicate Claim', msg);
          } else if (err?.status === 403) {
            this.ui.toast('error', 'Unauthorized', 'You do not have permission to edit this claim');
          } else {
            this.ui.toast('error', 'Error', msg);
          }
          this.formLoading = false;
          this.cdr.detectChanges();
        }
      });
    } else if (this.editingClaimId) {
      const body = {
        employee_id: this.form.employee_id,
        claim_type: this.form.claim_type,
        sub_type: subType,
        start_date: this.form.start_date,
        end_date: this.form.end_date || null,
        amount: amount,
        kilometres: this.form.kilometres || null,
        reason: this.form.reason || null,
        reference_no: this.form.reference_no || null
      };
      this.api.patch<any>(`/time/claims/${this.editingClaimId}/resubmit`, body).subscribe({
        next: () => {
          if (this.selectedFile) {
            this.uploadDocumentForClaim(this.editingClaimId!, 'Resubmitted', 'Claim corrected and resubmitted');
          } else {
            this.ui.toast('success', 'Resubmitted', 'Claim corrected and resubmitted');
            this.formLoading = false;
            this.editingClaimId = null;
            this.backToList();
          }
        },
        error: (err: any) => {
          const msg = err?.error?.error?.message || 'Failed to resubmit claim';
          if (err?.status === 409) {
            this.duplicateWarning = msg;
            this.duplicateConflicts = err?.error?.error?.duplicates || [];
            this.ui.toast('error', 'Duplicate Claim', msg);
          } else {
            this.ui.toast('error', 'Error', msg);
          }
          this.formLoading = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      const fd = new FormData();
      fd.append('employee_id', String(this.form.employee_id));
      fd.append('claim_type', this.form.claim_type);
      fd.append('sub_type', subType);
      fd.append('start_date', this.form.start_date);
      if (this.form.end_date) fd.append('end_date', this.form.end_date);
      fd.append('amount', String(amount));
      if (this.form.kilometres) fd.append('kilometres', String(this.form.kilometres));
      if (this.form.reason) fd.append('reason', this.form.reason);
      if (this.form.reference_no) fd.append('reference_no', this.form.reference_no);
      if (this.selectedFile) fd.append('document', this.selectedFile, this.selectedFile.name);

      this.api.postFormData<any>('/time/claims', fd).subscribe({
        next: () => {
          this.ui.toast('success', 'Submitted', 'Claim submitted successfully');
          this.formLoading = false;
          this.backToList();
        },
        error: (err: any) => {
          const msg = err?.error?.error?.message || 'Failed to submit claim';
          if (err?.status === 409) {
            this.duplicateWarning = msg;
            this.duplicateConflicts = err?.error?.error?.duplicates || [];
            this.ui.toast('error', 'Duplicate Claim', msg);
          } else {
            this.ui.toast('error', 'Error', msg);
          }
          this.formLoading = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const allowed = ['.pdf', '.jpg', '.jpeg', '.png', '.docx'];
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (!allowed.includes(ext)) {
        this.ui.toast('error', 'Invalid File', 'Accepted: PDF, JPG, PNG, DOCX');
        input.value = '';
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        this.ui.toast('error', 'File Too Large', 'Maximum file size is 10MB');
        input.value = '';
        return;
      }
      this.selectedFile = file;
      this.cdr.detectChanges();
    }
  }

  removeFile(): void {
    this.selectedFile = null;
    this.cdr.detectChanges();
  }

  private uploadDocumentForClaim(claimId: number, title: string, msg: string): void {
    const fd = new FormData();
    fd.append('document', this.selectedFile!, this.selectedFile!.name);
    this.api.postFormData<any>(`/time/claims/${claimId}/document`, fd).subscribe({
      next: () => {
        this.ui.toast('success', title, msg);
        this.formLoading = false;
        this.editingClaimId = null;
        this.selectedFile = null;
        this.backToList();
      },
      error: () => {
        this.ui.toast('warning', title, msg + ' but document upload failed');
        this.formLoading = false;
        this.editingClaimId = null;
        this.selectedFile = null;
        this.backToList();
      }
    });
  }

  uploadDocumentDetail(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.jpg,.jpeg,.png,.docx';
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const allowedExts = ['.pdf', '.jpg', '.jpeg', '.png', '.docx'];
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (!allowedExts.includes(ext)) {
        this.ui.toast('error', 'Invalid File', 'Accepted: PDF, JPG, PNG, DOCX');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        this.ui.toast('error', 'File Too Large', 'Maximum file size is 10MB');
        return;
      }
      this.uploadingDocument = true;
      this.cdr.detectChanges();
      const fd = new FormData();
      fd.append('document', file, file.name);
      this.api.postFormData<any>(`/time/claims/${this.detailClaim.id}/document`, fd).subscribe({
        next: (res: any) => {
          this.detailClaim.document_path = res?.document_path || 'attached';
          this.uploadingDocument = false;
          this.ui.toast('success', 'Uploaded', 'Document attached to claim');
          this.cdr.detectChanges();
        },
        error: () => {
          this.uploadingDocument = false;
          this.ui.toast('error', 'Error', 'Failed to upload document');
          this.cdr.detectChanges();
        }
      });
    };
    input.click();
  }

  downloadDocument(): void {
    window.open(`/payroll-app/api/time/claims/${this.detailClaim.id}/document`, '_blank');
  }

  downloadClaimDocument(claim: any): void {
    window.open(`/payroll-app/api/time/claims/${claim.id}/document`, '_blank');
  }

  async removeDocument(): Promise<void> {
    const confirmed = await this.ui.confirm({
      title: 'Remove Document',
      message: 'Are you sure you want to remove the attached document?',
      danger: true
    });
    if (!confirmed) return;
    this.api.delete(`/time/claims/${this.detailClaim.id}/document`).subscribe({
      next: () => {
        this.detailClaim.document_path = null;
        this.ui.toast('success', 'Removed', 'Document removed from claim');
        this.cdr.detectChanges();
      },
      error: () => {
        this.ui.toast('error', 'Error', 'Failed to remove document');
      }
    });
  }

  async approveClaim(claim: any): Promise<void> {
    const confirmed = await this.ui.confirm({
      title: 'Approve Claim',
      message: `Approve ${this.getClaimTypeLabel(claim.claim_type)} claim for ${claim.first_name} ${claim.surname} - R${parseFloat(claim.amount).toFixed(2)}?`
    });
    if (!confirmed) return;

    this.api.patchRaw(`/time/claims/${claim.id}/approve`, {}).subscribe({
      next: (res: any) => {
        const msg = res?.message || 'Claim approved';
        const title = res?.finalApproval ? 'Fully Approved' : 'Step Approved';
        this.ui.toast('success', title, msg);
        this.loadClaims();
      },
      error: (err: any) => {
        const msg = err?.error?.error?.message || err?.error?.message || 'Failed to approve claim';
        this.ui.toast('error', err.status === 403 ? 'Unauthorized' : 'Error', msg);
      }
    });
  }

  rejectClaim(claim: any): void {
    this.rejectComment = '';
    this.rejectTarget = claim;
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
      const ids = Array.from(this.selectedClaimIds);
      this.bulkProcessing = true;
      this.cdr.detectChanges();
      this.api.post<any>('/time/claims/bulk-reject', { claim_ids: ids, comments: this.rejectComment.trim() }).subscribe({
        next: (res: any) => {
          const data = res || {};
          this.ui.toast('success', 'Bulk Rejected', `${data.rejected ?? ids.length} claim(s) rejected${data.skipped ? ', ' + data.skipped + ' skipped' : ''}`);
          this.bulkProcessing = false;
          this.selectedClaimIds.clear();
          this.loadClaims();
        },
        error: () => {
          this.ui.toast('error', 'Error', 'Failed to bulk reject claims');
          this.bulkProcessing = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      const claim = this.rejectTarget;
      this.api.patchRaw(`/time/claims/${claim.id}/reject`, { comments: this.rejectComment.trim() }).subscribe({
        next: (res: any) => {
          this.ui.toast('success', 'Rejected', res?.message || 'Claim rejected.');
          this.loadClaims();
        },
        error: (err: any) => {
          const msg = err?.error?.error?.message || err?.error?.message || 'Failed to reject claim';
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

  returnClaim(claim: any): void {
    this.returnComment = '';
    this.returnTarget = claim;
    this.returnIsBulk = false;
    this.showReturnModal = true;
    this.cdr.detectChanges();
  }

  confirmReturn(): void {
    if (!this.returnComment.trim()) {
      this.ui.toast('error', 'Required', 'Please provide a reason for returning the claim');
      return;
    }
    this.showReturnModal = false;
    this.cdr.detectChanges();

    if (this.returnIsBulk) {
      const ids = Array.from(this.selectedClaimIds);
      if (ids.length === 0) {
        this.ui.toast('warning', 'No Selection', 'No claims selected for return');
        return;
      }
      this.bulkProcessing = true;
      this.cdr.detectChanges();
      this.api.post<any>('/time/claims/bulk-return', { claim_ids: ids, comments: this.returnComment.trim() }).subscribe({
        next: (res: any) => {
          const data = res || {};
          const returned = data.returned ?? ids.length;
          const failed = data.failed ?? 0;
          const failedIds: number[] = data.failedIds || [];
          if (failed > 0 && failedIds.length > 0) {
            this.ui.toast('warning', 'Partial Return', `${returned} claim(s) returned, ${failed} failed`);
            this.showFailedClaimDetails('Return Failures', failedIds);
          } else if (failed > 0) {
            this.ui.toast('warning', 'Partial Return', `${returned} claim(s) returned, ${failed} failed`);
          } else {
            this.ui.toast('success', 'Bulk Returned', `${returned} claim(s) returned for correction`);
          }
          this.bulkProcessing = false;
          this.returnIsBulk = false;
          this.selectedClaimIds.clear();
          this.loadClaims();
        },
        error: () => {
          this.ui.toast('error', 'Error', 'Failed to bulk return claims');
          this.bulkProcessing = false;
          this.returnIsBulk = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      const claim = this.returnTarget;
      if (!claim) return;
      this.api.patchRaw(`/time/claims/${claim.id}/return`, { comments: this.returnComment.trim() }).subscribe({
        next: (res: any) => {
          this.ui.toast('success', 'Returned', res?.message || 'Claim returned for correction.');
          this.loadClaims();
        },
        error: (err: any) => {
          const msg = err?.error?.error?.message || err?.error?.message || 'Failed to return claim';
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

  showFailedClaimDetails(title: string, failedIds: number[]): void {
    this.failedModalTitle = title;
    this.failedClaims = failedIds.map(id => {
      const claim = this.claims.find(c => c.id === id);
      return claim
        ? { id, employee_name: `${claim.first_name} ${claim.surname}`, employee_code: claim.employee_code, claim_type: claim.claim_type, amount: parseFloat(claim.amount) || 0 }
        : { id, employee_name: 'Unknown', employee_code: '', claim_type: '', amount: 0 };
    });
    this.showFailedModal = true;
    this.cdr.detectChanges();
  }

  closeFailedModal(): void {
    this.showFailedModal = false;
    this.failedClaims = [];
    this.failedModalTitle = '';
    this.cdr.detectChanges();
  }

  editPendingClaim(claim: any): void {
    this.editingPendingClaimId = claim.id;
    this.editingClaimId = null;
    this.prefillClaimForm(claim);
  }

  editAndResubmit(claim: any): void {
    this.editingClaimId = claim.id;
    this.editingPendingClaimId = null;
    this.prefillClaimForm(claim);
  }

  private prefillClaimForm(claim: any): void {
    this.form = {
      employee_id: claim.employee_id,
      claim_type: claim.claim_type,
      sub_type: '',
      existing_sub_type: claim.sub_type || '',
      amount: parseFloat(claim.amount) || 0,
      start_date: claim.start_date ? claim.start_date.substring(0, 10) : '',
      end_date: claim.end_date ? claim.end_date.substring(0, 10) : '',
      kilometres: claim.kilometres || null,
      reference_no: claim.reference_no || '',
      reason: claim.reason || ''
    };
    this.selectedEmployee = { id: claim.employee_id, first_name: claim.first_name, surname: claim.surname, employee_code: claim.employee_code };
    this.employeeSearch = claim.employee_id + ' | ' + (claim.employee_code || '') + ' - ' + claim.first_name + ' ' + claim.surname;
    this.employees = [];
    this.claimConfigurations = [];
    this.selectedConfig = null;
    this.tariff = 0;
    this.checkFormLockStatus(claim.payroll_cycle_id);
    this.view = 'form';
    this.cdr.detectChanges();

    if (claim.claim_type) {
      this.api.get<any[]>('/time/claims/configurations-by-type', { claim_type: claim.claim_type }).subscribe({
        next: (data) => {
          this.claimConfigurations = data || [];
          if (claim.sub_type && this.claimConfigurations.length > 0) {
            const matchedConfig = this.claimConfigurations.find((c: any) => {
              const label = this.getSubTypeLabel(c);
              return label === claim.sub_type || c.claim_subtype === claim.sub_type;
            });
            if (matchedConfig) {
              this.form.sub_type = String(matchedConfig.id);
              this.selectedConfig = matchedConfig;
              this.tariff = matchedConfig.client_policy ? parseFloat(matchedConfig.client_policy) : (matchedConfig.sars_rate ? parseFloat(matchedConfig.sars_rate) : 0);
            }
          }
          this.cdr.detectChanges();
        },
        error: () => {
          this.claimConfigurations = [];
          this.cdr.detectChanges();
        }
      });
    }
  }

  printClaimPDF(claim: any): void {
    this.api.getBlob(`/time/claims/${claim.id}/pdf`).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => window.URL.revokeObjectURL(url), 30000);
      },
      error: () => {
        this.ui.toast('error', 'Error', 'Failed to generate claim PDF');
      }
    });
  }

  downloadClaimPDF(claim: any): void {
    this.api.getBlob(`/time/claims/${claim.id}/pdf`, { download: 'true' }).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `claim_${claim.id}.pdf`;
        link.click();
        setTimeout(() => window.URL.revokeObjectURL(url), 30000);
      },
      error: () => {
        this.ui.toast('error', 'Error', 'Failed to download claim PDF');
      }
    });
  }

  getClaimTypeLabel(type: string): string {
    const found = this.claimTypes.find(t => t.value === type);
    return found ? found.label : type;
  }

  viewClaim(claim: any): void {
    this.detailClaim = claim;
    this.claimHistory = [];
    this.historyLoading = true;
    this.view = 'detail';
    this.cdr.detectChanges();

    this.api.get<any>(`/time/claims/${claim.id}/history`).subscribe({
      next: (res: any) => {
        this.claimHistory = res?.data || res || [];
        this.historyLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.claimHistory = [];
        this.historyLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  getActionIcon(action: string): string {
    switch (action) {
      case 'SUBMITTED': return 'plus';
      case 'APPROVED': return 'check';
      case 'REJECTED': return 'x';
      case 'RETURNED': return 'chevronLeft';
      case 'PAID': return 'dollar';
      default: return 'clock';
    }
  }

  getActionColor(action: string): string {
    switch (action) {
      case 'SUBMITTED': return '#3b82f6';
      case 'APPROVED': return '#16a34a';
      case 'REJECTED': return '#ef4444';
      case 'RETURNED': return '#f59e0b';
      case 'PAID': return '#8b5cf6';
      default: return '#64748b';
    }
  }

  get pendingClaims(): any[] {
    return this.claims.filter(c => c.status === 'PENDING');
  }

  get allPendingSelected(): boolean {
    const pending = this.pendingClaims;
    return pending.length > 0 && pending.every(c => this.selectedClaimIds.has(c.id));
  }

  get selectedCount(): number {
    return this.selectedClaimIds.size;
  }

  get selectedTotal(): number {
    return this.claims
      .filter(c => this.selectedClaimIds.has(c.id))
      .reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
  }

  toggleSelectAll(): void {
    const pending = this.pendingClaims;
    if (this.allPendingSelected) {
      pending.forEach(c => this.selectedClaimIds.delete(c.id));
    } else {
      pending.forEach(c => this.selectedClaimIds.add(c.id));
    }
    this.cdr.detectChanges();
  }

  toggleClaimSelection(claimId: number): void {
    if (this.selectedClaimIds.has(claimId)) {
      this.selectedClaimIds.delete(claimId);
    } else {
      this.selectedClaimIds.add(claimId);
    }
    this.cdr.detectChanges();
  }

  async bulkApprove(): Promise<void> {
    const ids = Array.from(this.selectedClaimIds);
    const confirmed = await this.ui.confirm({
      title: 'Bulk Approve Claims',
      message: `Approve ${ids.length} claim(s) totalling R${this.selectedTotal.toFixed(2)}?`
    });
    if (!confirmed) return;

    this.bulkProcessing = true;
    this.cdr.detectChanges();
    this.api.post<any>('/time/claims/bulk-approve', { claim_ids: ids }).subscribe({
      next: (res: any) => {
        const data = res || {};
        const approved = data.approved ?? 0;
        const stepped = data.stepped ?? 0;
        const skipped = data.skipped ?? 0;
        const skipReasons = data.skipReasons || {};
        const reasonList = Object.keys(skipReasons);
        if (approved + stepped === 0 && skipped > 0) {
          const reasonText = reasonList.length === 1 ? reasonList[0] : reasonList.map(r => `${skipReasons[r]}x: ${r}`).join('; ');
          this.ui.toast('warning', 'None Approved', `${skipped} claim(s) skipped: ${reasonText}`);
        } else if (skipped > 0) {
          const reasonText = reasonList.length === 1 ? reasonList[0] : reasonList.map(r => `${skipReasons[r]}x: ${r}`).join('; ');
          this.ui.toast('warning', 'Partial Approval', `${approved + stepped} claim(s) approved, ${skipped} skipped: ${reasonText}`);
        } else if (stepped > 0 && approved === 0) {
          this.ui.toast('success', 'Bulk Approved', `${stepped} claim(s) advanced to next approval level`);
        } else {
          this.ui.toast('success', 'Bulk Approved', `${approved} claim(s) fully approved${stepped ? ', ' + stepped + ' advanced to next level' : ''}`);
        }
        this.bulkProcessing = false;
        this.selectedClaimIds.clear();
        this.loadClaims();
      },
      error: () => {
        this.ui.toast('error', 'Error', 'Failed to bulk approve claims');
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

}
