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
  selector: 'app-leave-requests',
  standalone: true,
  imports: [CommonModule, FormsModule, DateInputComponent, IconComponent, StatusBadgeComponent, DateSaPipe, DateTimeSaPipe],
  templateUrl: './leave-requests.component.html',
  styleUrls: ['./leave-requests.component.css']
})
export class LeaveRequestsComponent implements OnInit {
  view: 'list' | 'form' | 'detail' = 'list';
  editingTransaction: any = null;

  transactions: any[] = [];
  loading = false;
  saving = false;
  canApprove = true;

  detailTransaction: any = null;
  transactionHistory: any[] = [];
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

  form = {
    employee_id: null as number | null,
    leave_type_id: null as number | null,
    start_date: '',
    end_date: '',
    days: 0,
    reason: '',
    manual_doc_number: ''
  };

  selectedFile: File | null = null;
  fileBase64 = '';
  fileError = '';

  filters = { status: '', date_from: '', date_to: '' };
  formError = '';
  successMsg = '';

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
      this.loadTransactions();
    }, { injector: this.injector });
  }

  ngOnInit(): void {
    this.loadTransactions();
    this.loadCanApprove();
  }

  onFilterChange(): void { this.loadTransactions(); }

  clearFilters(): void {
    this.filters = { status: '', date_from: '', date_to: '' };
    this.loadTransactions();
  }

  loadTransactions(): void {
    this.loading = true;
    const params: any = {};
    if (this.filters.status) params.status = this.filters.status;
    if (this.filters.date_from) params.date_from = this.filters.date_from;
    if (this.filters.date_to) params.date_to = this.filters.date_to;
    this.leaveSvc.getTransactions(params).subscribe({
      next: d => { this.transactions = d; this.loading = false; this.selectedIds.clear(); this.cdr.detectChanges(); },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  loadCanApprove(): void {
    this.leaveSvc.canApproveTransaction().subscribe({
      next: (res: any) => { this.canApprove = res?.data?.canApprove !== false; this.cdr.detectChanges(); },
      error: () => { this.canApprove = true; this.cdr.detectChanges(); }
    });
  }

  viewTransaction(t: any): void {
    this.detailTransaction = t;
    this.transactionHistory = [];
    this.historyLoading = true;
    this.view = 'detail';
    this.cdr.detectChanges();
    this.leaveSvc.getTransactionHistory(t.id).subscribe({
      next: d => { this.transactionHistory = d; this.historyLoading = false; this.cdr.detectChanges(); },
      error: () => { this.historyLoading = false; this.cdr.detectChanges(); }
    });
  }

  backToList(): void {
    this.view = 'list';
    this.detailTransaction = null;
    this.transactionHistory = [];
    this.editingTransaction = null;
    this.loadTransactions();
    this.cdr.detectChanges();
  }

  openAddForm(): void {
    this.resetForm();
    this.editingTransaction = null;
    this.formError = '';
    this.successMsg = '';
    this.view = 'form';
    this.cdr.detectChanges();
  }

  openEditForm(t: any): void {
    this.resetForm();
    this.editingTransaction = t;
    this.formError = '';
    this.successMsg = '';
    this.form.employee_id = t.employee_id;
    this.form.leave_type_id = t.leave_type_id;
    this.form.start_date = t.start_date ? t.start_date.substring(0, 10) : '';
    this.form.end_date = t.end_date ? t.end_date.substring(0, 10) : '';
    this.form.days = parseFloat(t.days) || 0;
    this.form.reason = t.reason || '';
    this.form.manual_doc_number = t.manual_doc_number || '';
    this.selectedEmployee = {
      id: t.employee_id,
      employee_code: t.employee_code,
      first_name: t.first_name,
      surname: t.surname
    };
    this.employeeSearch = `${t.employee_id} | ${t.employee_code} - ${t.first_name} ${t.surname}`;
    this.leaveSvc.getSchemeTypes(t.employee_id).subscribe({
      next: d => {
        this.leaveTypes = d;
        this.selectedLeaveType = d.find((lt: any) => lt.id == t.leave_type_id) || null;
        this.cdr.detectChanges();
      },
      error: () => {}
    });
    this.leaveSvc.getBalance(t.employee_id).subscribe({
      next: d => { this.balances = d; this.cdr.detectChanges(); },
      error: () => {}
    });
    this.view = 'form';
    this.cdr.detectChanges();
  }

  approveTransaction(t: any): void {
    this.actionTarget = t;
    this.actionComment = '';
    this.showApproveModal = true;
    this.cdr.detectChanges();
  }

  rejectTransaction(t: any): void {
    this.actionTarget = t;
    this.actionComment = '';
    this.showRejectModal = true;
    this.cdr.detectChanges();
  }

  returnTransaction(t: any): void {
    this.actionTarget = t;
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
    this.leaveSvc.approveTransaction(this.actionTarget.id, this.actionComment).subscribe({
      next: () => {
        this.actionSaving = false;
        const wasDetail = this.view === 'detail';
        this.cancelAction();
        if (wasDetail) this.backToList(); else this.loadTransactions();
        this.approvalsSvc.refreshCounts();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.actionSaving = false;
        this.cancelAction();
        this.cdr.detectChanges();
        alert(this.errMsg(err, 'Failed to approve leave request.'));
      }
    });
  }

  confirmReject(): void {
    if (!this.actionTarget || !this.actionComment.trim()) return;
    this.actionSaving = true;
    this.cdr.detectChanges();
    this.leaveSvc.rejectTransaction(this.actionTarget.id, this.actionComment).subscribe({
      next: () => {
        this.actionSaving = false;
        const wasDetail = this.view === 'detail';
        this.cancelAction();
        if (wasDetail) this.backToList(); else this.loadTransactions();
        this.approvalsSvc.refreshCounts();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.actionSaving = false;
        this.cancelAction();
        this.cdr.detectChanges();
        alert(this.errMsg(err, 'Failed to reject leave request.'));
      }
    });
  }

  confirmReturn(): void {
    if (!this.actionTarget || !this.actionComment.trim()) return;
    this.actionSaving = true;
    this.cdr.detectChanges();
    this.leaveSvc.returnTransaction(this.actionTarget.id, this.actionComment).subscribe({
      next: () => {
        this.actionSaving = false;
        const wasDetail = this.view === 'detail';
        this.cancelAction();
        if (wasDetail) this.backToList(); else this.loadTransactions();
        this.approvalsSvc.refreshCounts();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.actionSaving = false;
        this.cancelAction();
        this.cdr.detectChanges();
        alert(this.errMsg(err, 'Failed to return leave request.'));
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

  get pendingTransactions(): any[] {
    return this.transactions.filter(t => t.status === 'PENDING');
  }

  isAllSelected(): boolean {
    const pending = this.pendingTransactions;
    return pending.length > 0 && pending.every(t => this.selectedIds.has(t.id));
  }

  toggleSelect(id: number): void {
    if (this.selectedIds.has(id)) this.selectedIds.delete(id);
    else this.selectedIds.add(id);
    this.cdr.detectChanges();
  }

  toggleSelectAll(): void {
    const pending = this.pendingTransactions;
    if (pending.every(t => this.selectedIds.has(t.id))) {
      pending.forEach(t => this.selectedIds.delete(t.id));
    } else {
      pending.forEach(t => this.selectedIds.add(t.id));
    }
    this.cdr.detectChanges();
  }

  clearBulkSelection(): void { this.selectedIds.clear(); this.cdr.detectChanges(); }

  bulkApprove(): void {
    if (!this.selectedIds.size) return;
    this.bulkSaving = true;
    this.leaveSvc.bulkApproveTransactions(Array.from(this.selectedIds)).subscribe({
      next: () => {
        this.bulkSaving = false;
        this.selectedIds.clear();
        this.successMsg = 'Selected requests approved.';
        this.loadTransactions();
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
    this.leaveSvc.bulkRejectTransactions(Array.from(this.selectedIds), this.bulkRejectComments).subscribe({
      next: () => {
        this.bulkSaving = false;
        this.selectedIds.clear();
        this.showBulkRejectModal = false;
        this.successMsg = 'Selected requests rejected.';
        this.loadTransactions();
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
    this.computeDays();
  }

  getSelectedBalance(): any {
    return this.balances.find(b => b.leave_type_id == this.form.leave_type_id) || null;
  }

  computeDays(): void {
    if (!this.form.start_date || !this.form.end_date) { this.form.days = 0; return; }
    const s = new Date(this.form.start_date);
    const e = new Date(this.form.end_date);
    if (e < s) { this.form.days = 0; return; }
    if (this.selectedLeaveType?.base_type === 'WORKING_DAYS') {
      let count = 0;
      const cur = new Date(s);
      while (cur <= e) {
        const dow = cur.getDay();
        if (dow !== 0 && dow !== 6) count++;
        cur.setDate(cur.getDate() + 1);
      }
      this.form.days = count;
    } else {
      this.form.days = Math.round((e.getTime() - s.getTime()) / 86400000) + 1;
    }
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

  printTransaction(): void {
    window.print();
  }

  resetForm(): void {
    this.form = { employee_id: null, leave_type_id: null, start_date: '', end_date: '', days: 0, reason: '', manual_doc_number: '' };
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
    if (!this.form.start_date || !this.form.end_date) { this.formError = 'Start and end dates are required.'; return; }
    if (this.form.days <= 0) { this.formError = 'Number of days must be greater than zero.'; return; }
    if (this.selectedLeaveType?.requires_document) {
      const reqAfterDays = this.selectedLeaveType.document_required_after_days;
      const needsDoc = !reqAfterDays || this.form.days > parseFloat(reqAfterDays);
      if (needsDoc && !this.fileBase64 && !this.editingTransaction?.document_path) {
        this.formError = `This leave type requires a supporting document${reqAfterDays ? ` for requests exceeding ${reqAfterDays} days` : ''}.`;
        return;
      }
    }
    this.saving = true;
    if (this.editingTransaction) {
      this.leaveSvc.resubmitTransaction(this.editingTransaction.id, {
        ...this.form,
        document_base64: this.fileBase64 || null,
        document_filename: this.selectedFile?.name || null
      }).subscribe({
        next: () => {
          this.saving = false;
          this.editingTransaction = null;
          this.resetForm();
          this.successMsg = 'Leave request resubmitted successfully.';
          this.view = 'list';
          this.loadTransactions();
          this.approvalsSvc.refreshCounts();
          this.cdr.detectChanges();
          setTimeout(() => { this.successMsg = ''; this.cdr.detectChanges(); }, 4000);
        },
        error: (err: any) => {
          this.saving = false;
          this.formError = err?.error?.error?.message || err?.error?.message || 'Failed to resubmit leave request.';
          this.cdr.detectChanges();
        }
      });
    } else {
      this.leaveSvc.createTransaction({
        ...this.form,
        document_base64: this.fileBase64 || null,
        document_filename: this.selectedFile?.name || null
      }).subscribe({
        next: () => {
          this.saving = false;
          this.resetForm();
          this.successMsg = 'Leave request submitted successfully.';
          this.view = 'list';
          this.loadTransactions();
          this.approvalsSvc.refreshCounts();
          this.cdr.detectChanges();
          setTimeout(() => { this.successMsg = ''; this.cdr.detectChanges(); }, 4000);
        },
        error: (err: any) => {
          this.saving = false;
          this.formError = err?.error?.error?.message || err?.error?.message || 'Failed to submit leave request.';
          this.cdr.detectChanges();
        }
      });
    }
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
