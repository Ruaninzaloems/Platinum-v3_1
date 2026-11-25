import { Component, OnInit, ChangeDetectorRef, effect, Injector } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LeaveManagementService } from '../../services/leave-management.service';
import { ApprovalsService } from '../../../../core/services/approvals.service';
import { DateInputComponent } from '../../../../shared/components/date-input/date-input.component';
import { CurrentUserService } from '../../../../core/services/current-user.service';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { DateSaPipe } from '../../../../shared/pipes/date-sa.pipe';
import { DateTimeSaPipe } from '../../../../shared/pipes/date-time-sa.pipe';

@Component({
  selector: 'app-leave-adjustments',
  standalone: true,
  imports: [CommonModule, FormsModule, DateInputComponent, IconComponent, StatusBadgeComponent, DateSaPipe, DateTimeSaPipe],
  templateUrl: './leave-adjustments.component.html',
  styleUrls: ['./leave-adjustments.component.css']
})
export class LeaveAdjustmentsComponent implements OnInit {
  view: 'list' | 'form' | 'detail' = 'list';

  adjustments: any[] = [];
  loading = false;
  saving = false;
  canApprove = true;

  detailAdjustment: any = null;
  adjustmentHistory: any[] = [];
  historyLoading = false;

  showApproveModal = false;
  showRejectModal = false;
  showReturnModal = false;
  actionTarget: any = null;
  actionComment = '';
  actionSaving = false;

  showBulkRejectModal = false;
  selectedIds = new Set<number>();
  bulkSaving = false;
  bulkRejectComments = '';

  employeeSearch = '';
  employees: any[] = [];
  employeeLoading = false;
  selectedEmployee: any = null;

  leaveTypes: any[] = [];
  balances: any[] = [];
  selectedLeaveType: any = null;
  selectedFile: File | null = null;
  fileBase64 = '';
  fileError = '';

  form = {
    employee_id: null as number | null,
    leave_type_id: null as number | null,
    adjustment_type: 'OPENING_BALANCE' as string,
    adjustment_days: 0,
    effective_date: '',
    reason: ''
  };

  filters = { status: '', adjustment_type: '' };
  formError = '';
  successMsg = '';

  adjustmentTypes = [
    { value: 'OPENING_BALANCE', label: 'Opening Balance' },
    { value: 'ADJUSTED', label: 'Adjusted' },
    { value: 'ACCRUED', label: 'Accrued' },
    { value: 'FORFEITED', label: 'Forfeited' },
    { value: 'ENCASHED', label: 'Encashed' }
  ];

  constructor(
    private leaveSvc: LeaveManagementService,
    private approvalsSvc: ApprovalsService,
    private cdr: ChangeDetectorRef,
    private currentUser: CurrentUserService,
    private injector: Injector
  ) {
    let firstRun = true;
    effect(() => {
      const _user = this.currentUser.currentUser();
      if (firstRun) { firstRun = false; return; }
      this.loadCanApprove();
      this.loadAdjustments();
    }, { injector: this.injector });
  }

  ngOnInit(): void {
    this.loadAdjustments();
    this.loadCanApprove();
  }

  onFilterChange(): void { this.loadAdjustments(); }

  clearFilters(): void {
    this.filters = { status: '', adjustment_type: '' };
    this.loadAdjustments();
  }

  loadAdjustments(): void {
    this.loading = true;
    const params: any = {};
    if (this.filters.status) params.status = this.filters.status;
    if (this.filters.adjustment_type) params.adjustment_type = this.filters.adjustment_type;
    this.leaveSvc.getAdjustments(params).subscribe({
      next: d => { this.adjustments = d; this.loading = false; this.selectedIds.clear(); this.cdr.detectChanges(); },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  loadCanApprove(): void {
    this.leaveSvc.canApproveAdjustment().subscribe({
      next: (res: any) => { this.canApprove = res?.data?.canApprove !== false; this.cdr.detectChanges(); },
      error: () => { this.canApprove = true; this.cdr.detectChanges(); }
    });
  }

  viewAdjustment(a: any): void {
    this.detailAdjustment = a;
    this.adjustmentHistory = [];
    this.historyLoading = true;
    this.view = 'detail';
    this.cdr.detectChanges();
    this.leaveSvc.getAdjustmentHistory(a.id).subscribe({
      next: d => { this.adjustmentHistory = d; this.historyLoading = false; this.cdr.detectChanges(); },
      error: () => { this.historyLoading = false; this.cdr.detectChanges(); }
    });
  }

  backToList(): void {
    this.view = 'list';
    this.detailAdjustment = null;
    this.adjustmentHistory = [];
    this.loadAdjustments();
    this.cdr.detectChanges();
  }

  openAddForm(): void {
    this.resetForm();
    this.formError = '';
    this.successMsg = '';
    this.view = 'form';
    this.cdr.detectChanges();
  }

  approveAdjustment(a: any): void {
    this.actionTarget = a;
    this.actionComment = '';
    this.showApproveModal = true;
    this.cdr.detectChanges();
  }

  rejectAdjustment(a: any): void {
    this.actionTarget = a;
    this.actionComment = '';
    this.showRejectModal = true;
    this.cdr.detectChanges();
  }

  returnAdjustment(a: any): void {
    this.actionTarget = a;
    this.actionComment = '';
    this.showReturnModal = true;
    this.cdr.detectChanges();
  }

  cancelAction(): void {
    this.showApproveModal = false;
    this.showRejectModal = false;
    this.showReturnModal = false;
    this.actionTarget = null;
    this.actionComment = '';
    this.cdr.detectChanges();
  }

  confirmApprove(): void {
    if (!this.actionTarget) return;
    this.actionSaving = true;
    this.cdr.detectChanges();
    this.leaveSvc.approveAdjustment(this.actionTarget.id, this.actionComment).subscribe({
      next: () => {
        this.actionSaving = false;
        const wasDetail = this.view === 'detail';
        this.cancelAction();
        if (wasDetail) this.backToList(); else this.loadAdjustments();
        this.approvalsSvc.refreshCounts();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.actionSaving = false;
        this.cancelAction();
        this.cdr.detectChanges();
        alert(this.errMsg(err, 'Failed to approve adjustment.'));
      }
    });
  }

  confirmReject(): void {
    if (!this.actionTarget || !this.actionComment.trim()) return;
    this.actionSaving = true;
    this.cdr.detectChanges();
    this.leaveSvc.rejectAdjustment(this.actionTarget.id, this.actionComment).subscribe({
      next: () => {
        this.actionSaving = false;
        const wasDetail = this.view === 'detail';
        this.cancelAction();
        if (wasDetail) this.backToList(); else this.loadAdjustments();
        this.approvalsSvc.refreshCounts();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.actionSaving = false;
        this.cancelAction();
        this.cdr.detectChanges();
        alert(this.errMsg(err, 'Failed to reject adjustment.'));
      }
    });
  }

  confirmReturn(): void {
    if (!this.actionTarget || !this.actionComment.trim()) return;
    this.actionSaving = true;
    this.cdr.detectChanges();
    this.leaveSvc.returnAdjustment(this.actionTarget.id, this.actionComment).subscribe({
      next: () => {
        this.actionSaving = false;
        const wasDetail = this.view === 'detail';
        this.cancelAction();
        if (wasDetail) this.backToList(); else this.loadAdjustments();
        this.approvalsSvc.refreshCounts();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.actionSaving = false;
        this.cancelAction();
        this.cdr.detectChanges();
        alert(this.errMsg(err, 'Failed to return adjustment.'));
      }
    });
  }

  get currentUserId(): number { return this.currentUser.getCurrentUser().userId; }

  canApproveRecord(record: any): boolean { return record.created_by !== this.currentUserId; }

  errMsg(err: any, fallback: string): string {
    return err?.error?.error?.message
      || (typeof err?.error?.error === 'string' ? err.error.error : null)
      || err?.error?.message
      || fallback;
  }

  get pendingAdjustments(): any[] {
    return this.adjustments.filter(a => a.status === 'PENDING' && this.canApproveRecord(a));
  }

  isAllSelected(): boolean {
    const pending = this.pendingAdjustments;
    return pending.length > 0 && pending.every(a => this.selectedIds.has(a.id));
  }

  toggleSelect(id: number): void {
    if (this.selectedIds.has(id)) this.selectedIds.delete(id);
    else this.selectedIds.add(id);
    this.cdr.detectChanges();
  }

  toggleSelectAll(): void {
    const pending = this.pendingAdjustments;
    if (pending.every(a => this.selectedIds.has(a.id))) {
      pending.forEach(a => this.selectedIds.delete(a.id));
    } else {
      pending.forEach(a => this.selectedIds.add(a.id));
    }
    this.cdr.detectChanges();
  }

  clearBulkSelection(): void { this.selectedIds.clear(); this.cdr.detectChanges(); }

  bulkApprove(): void {
    if (!this.selectedIds.size) return;
    this.bulkSaving = true;
    this.leaveSvc.bulkApproveAdjustments(Array.from(this.selectedIds)).subscribe({
      next: () => {
        this.bulkSaving = false;
        this.selectedIds.clear();
        this.successMsg = 'Selected adjustments approved.';
        this.loadAdjustments();
        this.approvalsSvc.refreshCounts();
        this.cdr.detectChanges();
        setTimeout(() => { this.successMsg = ''; this.cdr.detectChanges(); }, 4000);
      },
      error: (err: any) => {
        this.bulkSaving = false;
        alert(err?.error?.error?.message || 'Bulk approve failed.');
        this.cdr.detectChanges();
      }
    });
  }

  openBulkReject(): void { this.bulkRejectComments = ''; this.showBulkRejectModal = true; this.cdr.detectChanges(); }
  closeBulkReject(): void { this.showBulkRejectModal = false; this.bulkRejectComments = ''; this.cdr.detectChanges(); }

  confirmBulkReject(): void {
    if (!this.bulkRejectComments.trim()) return;
    this.bulkSaving = true;
    this.leaveSvc.bulkRejectAdjustments(Array.from(this.selectedIds), this.bulkRejectComments).subscribe({
      next: () => {
        this.bulkSaving = false;
        this.selectedIds.clear();
        this.showBulkRejectModal = false;
        this.successMsg = 'Selected adjustments rejected.';
        this.loadAdjustments();
        this.approvalsSvc.refreshCounts();
        this.cdr.detectChanges();
        setTimeout(() => { this.successMsg = ''; this.cdr.detectChanges(); }, 4000);
      },
      error: (err: any) => {
        this.bulkSaving = false;
        alert(err?.error?.error?.message || 'Bulk reject failed.');
        this.cdr.detectChanges();
      }
    });
  }

  searchEmployees(): void {
    if (!this.employeeSearch || this.employeeSearch.length < 2) { this.employees = []; return; }
    if (this.selectedEmployee) return;
    this.employeeLoading = true;
    this.leaveSvc.lookupEmployee(this.employeeSearch).subscribe({
      next: d => { this.employees = d.slice(0, 10); this.employeeLoading = false; this.cdr.detectChanges(); },
      error: () => { this.employees = []; this.employeeLoading = false; this.cdr.detectChanges(); }
    });
  }

  selectEmployee(emp: any): void {
    this.selectedEmployee = emp;
    this.form.employee_id = emp.id;
    this.form.leave_type_id = null;
    this.employees = [];
    this.employeeSearch = `${emp.id} | ${emp.employee_code} - ${emp.first_name} ${emp.surname}`;
    this.leaveTypes = [];
    this.balances = [];
    this.selectedLeaveType = null;
    this.leaveSvc.getSchemeTypes(emp.id).subscribe({
      next: d => { this.leaveTypes = d; this.cdr.detectChanges(); },
      error: () => {}
    });
    this.leaveSvc.getBalance(emp.id).subscribe({
      next: d => { this.balances = d; this.cdr.detectChanges(); },
      error: () => {}
    });
  }

  clearEmployee(): void {
    this.selectedEmployee = null;
    this.form.employee_id = null;
    this.form.leave_type_id = null;
    this.employeeSearch = '';
    this.employees = [];
    this.leaveTypes = [];
    this.balances = [];
    this.selectedLeaveType = null;
  }

  onLeaveTypeChange(): void {
    this.selectedLeaveType = this.leaveTypes.find(t => t.id == this.form.leave_type_id) || null;
    this.selectedFile = null;
    this.fileBase64 = '';
    this.fileError = '';
  }

  getSelectedBalance(): any {
    return this.balances.find(b => b.leave_type_id == this.form.leave_type_id) || null;
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) { this.selectedFile = null; this.fileBase64 = ''; return; }
    const file = input.files[0];
    if (file.size > 5 * 1024 * 1024) {
      this.fileError = 'File must be smaller than 5 MB.';
      this.selectedFile = null; this.fileBase64 = '';
      (input as HTMLInputElement).value = '';
      this.cdr.detectChanges();
      return;
    }
    this.fileError = '';
    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      this.fileBase64 = result.includes(',') ? result.split(',')[1] : result;
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  resetForm(): void {
    this.form = { employee_id: null, leave_type_id: null, adjustment_type: 'OPENING_BALANCE', adjustment_days: 0, effective_date: '', reason: '' };
    this.selectedEmployee = null;
    this.employeeSearch = '';
    this.employees = [];
    this.leaveTypes = [];
    this.balances = [];
    this.selectedLeaveType = null;
    this.selectedFile = null;
    this.fileBase64 = '';
    this.fileError = '';
    this.formError = '';
  }

  submitForm(): void {
    this.formError = '';
    if (!this.form.employee_id) { this.formError = 'Please select an employee.'; return; }
    if (!this.form.leave_type_id) { this.formError = 'Please select a leave type.'; return; }
    if (!this.form.effective_date) { this.formError = 'Effective date is required.'; return; }
    if (this.form.adjustment_days === 0) { this.formError = 'Adjustment days cannot be zero.'; return; }
    if (this.selectedLeaveType?.requires_document && !this.selectedLeaveType.document_required_after_days) {
      if (!this.fileBase64) {
        this.formError = 'This leave type requires supporting documentation for all adjustments.';
        return;
      }
    }
    this.saving = true;
    this.leaveSvc.createAdjustment({
      ...this.form,
      document_base64: this.fileBase64 || null,
      document_filename: this.selectedFile?.name || null
    }).subscribe({
      next: (res: any) => {
        this.saving = false;
        this.resetForm();
        this.successMsg = res?.warning
          ? `Adjustment submitted. Note: ${res.warning}`
          : 'Leave adjustment submitted successfully.';
        this.view = 'list';
        this.loadAdjustments();
        this.approvalsSvc.refreshCounts();
        this.cdr.detectChanges();
        setTimeout(() => { this.successMsg = ''; this.cdr.detectChanges(); }, 6000);
      },
      error: (err: any) => {
        this.saving = false;
        this.formError = err?.error?.error?.message || err?.error?.message || 'Failed to submit leave adjustment.';
        this.cdr.detectChanges();
      }
    });
  }

  adjTypeLabel(type: string): string {
    const map: Record<string, string> = {
      OPENING_BALANCE: 'Opening Balance',
      ADJUSTED: 'Adjusted',
      ACCRUED: 'Accrued',
      FORFEITED: 'Forfeited',
      ENCASHED: 'Encashed'
    };
    return map[type] || type;
  }

  adjTypeClass(type: string): string {
    const map: Record<string, string> = {
      OPENING_BALANCE: 'badge-primary',
      ADJUSTED: 'badge-info',
      ACCRUED: 'badge-success',
      FORFEITED: 'badge-warning',
      ENCASHED: 'badge-secondary'
    };
    return map[type] || 'badge-secondary';
  }

  getActionIcon(action: string): string {
    switch (action) {
      case 'SUBMITTED': return 'plus';
      case 'APPROVED': return 'check';
      case 'REJECTED': return 'x';
      case 'RETURNED': return 'chevronLeft';
      default: return 'clock';
    }
  }

  getActionColor(action: string): string {
    switch (action) {
      case 'SUBMITTED': return '#3b82f6';
      case 'APPROVED': return '#16a34a';
      case 'REJECTED': return '#ef4444';
      case 'RETURNED': return '#f59e0b';
      default: return '#64748b';
    }
  }

  fmtDate(d: string): string {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: '2-digit' });
  }
}
