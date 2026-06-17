import { Component, OnInit, ChangeDetectorRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { UiService } from '../../../core/services/ui.service';
import { CurrentUserService } from '../../../core/services/current-user.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { CurrencyZarPipe } from '../../../shared/pipes/currency-zar.pipe';
import { DateSaPipe } from '../../../shared/pipes/date-sa.pipe';
import { DateInputComponent } from '../../../shared/components/date-input/date-input.component';
import { TimeInputComponent } from '../../../shared/components/time-input/time-input.component';

@Component({
  selector: 'app-ess',
  standalone: true,
  host: { 'data-accent': 'employees' },
  imports: [CommonModule, FormsModule, IconComponent, StatusBadgeComponent, CurrencyZarPipe, DateSaPipe, DateInputComponent, TimeInputComponent],
  templateUrl: './ess.component.html',
  styleUrl: './ess.component.css'
})
export class EssComponent implements OnInit {
  selectedEmployeeId: number | null = null;
  noLinkedEmployee = false;

  loading = false;
  profile: any = null;
  payslips: any[] = [];
  latestPayslip: any = null;
  latestPayslipEarnings: any[] = [];
  latestPayslipDeductions: any[] = [];
  leaveBalances: any[] = [];
  leaveTypes: any[] = [];
  leaveRequests: any[] = [];
  leaveRequestsLoading = false;
  leaveView: 'list' | 'form' = 'list';
  leaveForm: any = {};
  leaveFormLoading = false;
  leaveFormError: string | null = null;
  benefits: any = { medical_aid: [], retirement_funds: [] };
  dependants: any[] = [];
  bankingDetails: any = null;
  bankingLoading = false;
  reportingBanking = false;

  editingContact = false;
  editingEmergency = false;
  contactDraft: any = {};
  emergencyDraft: any = {};
  contactSaving = false;
  emergencySaving = false;
  contactErrors: { email_address?: string; cell_number?: string; home_number?: string; work_number?: string } = {};
  emergencyErrors: { emergency_contact_name?: string; emergency_contact_phone?: string; emergency_contact_relationship?: string } = {};
  relationshipOptions = [
    { value: 'SELF', label: 'Self' },
    { value: 'SPOUSE', label: 'Spouse' },
    { value: 'PARENT', label: 'Parent' },
    { value: 'SIBLING', label: 'Sibling' },
    { value: 'CHILD', label: 'Child' },
    { value: 'FRIEND', label: 'Friend' },
    { value: 'OTHER', label: 'Other' },
  ];

  activeTab = 'overview';

  essClaims: any[] = [];
  essClaimsLoading = false;
  essClaimView: 'list' | 'form' = 'list';
  essClaimForm: any = {};
  essClaimFormLoading = false;
  essEditingClaimId: number | null = null;
  essClaimConfigurations: any[] = [];
  essSelectedConfig: any = null;
  essTariff = 0;
  essDuplicateWarning: string | null = null;
  essCheckingDuplicates = false;

  claimTypes = [
    { value: 'S_AND_T', label: 'S & T' },
    { value: 'TRAVEL', label: 'Travel' }
  ];

  essTimeRecords: any[] = [];
  essTimeLoading = false;
  essTimeView: 'list' | 'form' = 'list';
  essTimeForm: any = {};
  essTimeFormLoading = false;
  essTimeFormError: string | null = null;
  essTimeShiftLoading = false;
  essTimeResolvedShift: any = null;
  essTimeShiftNoRotation = false;
  essTimeShiftIsOffDay = false;
  private essTimeShiftSeq = 0;
  essTimeDateFrom = '';
  essTimeDateTo = '';
  essTimeViewMonth = new Date();

  showTimeImportModal = false;
  timeImportFile: File | null = null;
  timeImportFileName = '';
  timeImportLoading = false;
  timeImportResult: { imported: number; skipped: number; errors: Array<{ row: number; reason: string }> } | null = null;

  private currentRequestEmployeeId: number | null = null;

  constructor(
    private api: ApiService,
    private ui: UiService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private currentUserService: CurrentUserService
  ) {
    effect(() => {
      const user = this.currentUserService.currentUser();
      this.handleUserChange(user.employeeId ?? null);
    });
  }

  ngOnInit(): void {}

  private handleUserChange(employeeId: number | null): void {
    if (employeeId === this.selectedEmployeeId && (employeeId !== null || this.noLinkedEmployee)) {
      return;
    }

    this.resetState();

    if (!employeeId) {
      this.noLinkedEmployee = true;
      this.selectedEmployeeId = null;
      this.currentRequestEmployeeId = null;
      this.cdr.detectChanges();
      return;
    }

    this.noLinkedEmployee = false;
    this.selectedEmployeeId = employeeId;
    this.currentRequestEmployeeId = employeeId;
    this.loading = true;
    this.cdr.detectChanges();

    const requestedId = employeeId;
    this.api.get<any>(`/ess/profile/${requestedId}`).subscribe({
      next: (data) => {
        if (this.currentRequestEmployeeId !== requestedId) return;
        this.profile = data;
        this.loading = false;
        this.cdr.detectChanges();
        this.loadAllData();
      },
      error: () => {
        if (this.currentRequestEmployeeId !== requestedId) return;
        this.profile = null;
        this.loading = false;
        this.ui.toast('error', 'Error', 'Failed to load employee profile');
        this.cdr.detectChanges();
      }
    });
  }

  private resetState(): void {
    this.profile = null;
    this.payslips = [];
    this.latestPayslip = null;
    this.latestPayslipEarnings = [];
    this.latestPayslipDeductions = [];
    this.leaveBalances = [];
    this.leaveTypes = [];
    this.leaveRequests = [];
    this.leaveRequestsLoading = false;
    this.leaveView = 'list';
    this.leaveForm = {};
    this.leaveFormLoading = false;
    this.leaveFormError = null;
    this.benefits = { medical_aid: [], retirement_funds: [] };
    this.dependants = [];
    this.bankingDetails = null;
    this.bankingLoading = false;
    this.reportingBanking = false;
    this.essClaims = [];
    this.essClaimsLoading = false;
    this.essClaimView = 'list';
    this.essClaimForm = {};
    this.essClaimFormLoading = false;
    this.essEditingClaimId = null;
    this.essClaimConfigurations = [];
    this.essSelectedConfig = null;
    this.essTariff = 0;
    this.essDuplicateWarning = null;
    this.essCheckingDuplicates = false;
    this.essTimeRecords = [];
    this.essTimeLoading = false;
    this.essTimeView = 'list';
    this.essTimeForm = {};
    this.essTimeFormLoading = false;
    this.essTimeFormError = null;
    this.essTimeShiftLoading = false;
    this.essTimeResolvedShift = null;
    this.essTimeShiftNoRotation = false;
    this.essTimeShiftIsOffDay = false;
    this.essTimeDateFrom = '';
    this.essTimeDateTo = '';
    this.essTimeViewMonth = new Date();
    this.showTimeImportModal = false;
    this.timeImportFile = null;
    this.timeImportFileName = '';
    this.timeImportLoading = false;
    this.timeImportResult = null;
    this.activeTab = 'overview';
    this.loading = false;
    this.noLinkedEmployee = false;
  }

  loadAllData(): void {
    if (!this.selectedEmployeeId) return;
    this.loadPayslips();
    this.loadLeaveBalances();
    this.loadLeaveTypes();
    this.loadLeaveRequests();
    this.loadBenefits();
    this.loadDependants();
    this.loadBankingDetails();
  }

  loadBankingDetails(): void {
    const requestedId = this.selectedEmployeeId;
    if (!requestedId) return;
    this.bankingLoading = true;
    this.api.get<any>(`/ess/me/banking`).subscribe({
      next: (data: any) => {
        if (this.currentRequestEmployeeId !== requestedId) return;
        this.bankingDetails = data || null;
        this.bankingLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        if (this.currentRequestEmployeeId !== requestedId) return;
        this.bankingDetails = null;
        this.bankingLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadPayslips(): void {
    const requestedId = this.selectedEmployeeId;
    if (!requestedId) return;
    this.api.get<any[]>(`/ess/payslips/${requestedId}`).subscribe({
      next: (data) => {
        if (this.currentRequestEmployeeId !== requestedId) return;
        this.payslips = data || [];
        this.latestPayslip = this.payslips.length > 0 ? this.payslips[0] : null;
        this.cdr.detectChanges();
        if (this.latestPayslip) {
          this.loadPayslipDetail(this.latestPayslip.run_id);
        }
      },
      error: () => {
        if (this.currentRequestEmployeeId !== requestedId) return;
        this.payslips = [];
        this.latestPayslip = null;
        this.latestPayslipEarnings = [];
        this.latestPayslipDeductions = [];
        this.cdr.detectChanges();
      }
    });
  }

  loadPayslipDetail(runId: number): void {
    const requestedId = this.selectedEmployeeId;
    if (!requestedId) return;
    this.api.get<any[]>(`/ess/payslip-detail/${requestedId}/${runId}`).subscribe({
      next: (data) => {
        if (this.currentRequestEmployeeId !== requestedId) return;
        const items = data || [];
        this.latestPayslipEarnings = items.filter((t: any) => t.transaction_type === 'EARNING');
        this.latestPayslipDeductions = items.filter((t: any) => t.transaction_type === 'DEDUCTION');
        this.cdr.detectChanges();
      },
      error: () => {
        if (this.currentRequestEmployeeId !== requestedId) return;
        this.latestPayslipEarnings = [];
        this.latestPayslipDeductions = [];
        this.cdr.detectChanges();
      }
    });
  }

  loadLeaveBalances(): void {
    const requestedId = this.selectedEmployeeId;
    if (!requestedId) return;
    this.api.get<any[]>(`/ess/leave-balances/${requestedId}`).subscribe({
      next: (data) => {
        if (this.currentRequestEmployeeId !== requestedId) return;
        this.leaveBalances = data || [];
        this.cdr.detectChanges();
      },
      error: () => {
        if (this.currentRequestEmployeeId !== requestedId) return;
        this.leaveBalances = [];
        this.cdr.detectChanges();
      }
    });
  }

  loadLeaveTypes(): void {
    const requestedId = this.selectedEmployeeId;
    if (!requestedId) return;
    this.api.get<any[]>(`/ess/leave-types/${requestedId}`).subscribe({
      next: (data) => {
        if (this.currentRequestEmployeeId !== requestedId) return;
        this.leaveTypes = data || [];
        this.cdr.detectChanges();
      },
      error: () => {
        if (this.currentRequestEmployeeId !== requestedId) return;
        this.leaveTypes = [];
        this.cdr.detectChanges();
      }
    });
  }

  loadLeaveRequests(): void {
    const requestedId = this.selectedEmployeeId;
    if (!requestedId) return;
    this.leaveRequestsLoading = true;
    this.api.get<any[]>(`/ess/leave-requests/${requestedId}`).subscribe({
      next: (data) => {
        if (this.currentRequestEmployeeId !== requestedId) return;
        this.leaveRequests = data || [];
        this.leaveRequestsLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        if (this.currentRequestEmployeeId !== requestedId) return;
        this.leaveRequests = [];
        this.leaveRequestsLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  openLeaveForm(): void {
    this.leaveForm = { leave_type_id: '', start_date: '', end_date: '', reason: '' };
    this.leaveFormError = null;
    this.leaveView = 'form';
    this.activeTab = 'leave';
    this.cdr.detectChanges();
  }

  cancelLeaveForm(): void {
    this.leaveView = 'list';
    this.leaveFormError = null;
    this.cdr.detectChanges();
  }

  get leaveDayCount(): number {
    if (!this.leaveForm.start_date || !this.leaveForm.end_date) return 0;
    const s = new Date(this.leaveForm.start_date);
    const e = new Date(this.leaveForm.end_date);
    if (e < s) return 0;
    return Math.round((e.getTime() - s.getTime()) / 86400000) + 1;
  }

  get selectedLeaveType(): any {
    if (!this.leaveForm.leave_type_id) return null;
    return this.leaveTypes.find(lt => lt.id === parseInt(this.leaveForm.leave_type_id, 10)) || null;
  }

  submitLeaveApplication(): void {
    this.leaveFormError = null;
    if (!this.leaveForm.leave_type_id) { this.leaveFormError = 'Please select a leave type.'; this.cdr.detectChanges(); return; }
    if (!this.leaveForm.start_date) { this.leaveFormError = 'Start date is required.'; this.cdr.detectChanges(); return; }
    if (!this.leaveForm.end_date) { this.leaveFormError = 'End date is required.'; this.cdr.detectChanges(); return; }
    if (new Date(this.leaveForm.end_date) < new Date(this.leaveForm.start_date)) {
      this.leaveFormError = 'End date cannot be before start date.'; this.cdr.detectChanges(); return;
    }
    this.leaveFormLoading = true;
    this.cdr.detectChanges();
    const body = {
      leave_type_id: parseInt(this.leaveForm.leave_type_id, 10),
      start_date: this.leaveForm.start_date,
      end_date: this.leaveForm.end_date,
      reason: this.leaveForm.reason || null
    };
    this.api.post<any>('/ess/leave-request', body).subscribe({
      next: (res: any) => {
        this.leaveFormLoading = false;
        const msg = res?.autoApproved ? 'Leave request submitted and auto-approved.' : 'Leave request submitted and sent for approval.';
        this.ui.toast('success', 'Leave Submitted', msg);
        this.leaveView = 'list';
        this.leaveFormError = null;
        this.loadLeaveBalances();
        this.loadLeaveRequests();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.leaveFormLoading = false;
        this.leaveFormError = err?.error?.error?.message || err?.error?.message || 'Failed to submit leave request.';
        this.cdr.detectChanges();
      }
    });
  }

  loadBenefits(): void {
    const requestedId = this.selectedEmployeeId;
    if (!requestedId) return;
    this.api.get<any>(`/ess/benefits/${requestedId}`).subscribe({
      next: (data) => {
        if (this.currentRequestEmployeeId !== requestedId) return;
        this.benefits = data || { medical_aid: [], retirement_funds: [] };
        this.cdr.detectChanges();
      },
      error: () => {
        if (this.currentRequestEmployeeId !== requestedId) return;
        this.benefits = { medical_aid: [], retirement_funds: [] };
        this.cdr.detectChanges();
      }
    });
  }

  loadDependants(): void {
    const requestedId = this.selectedEmployeeId;
    if (!requestedId) return;
    this.api.get<any[]>(`/ess/dependants/${requestedId}`).subscribe({
      next: (data) => {
        if (this.currentRequestEmployeeId !== requestedId) return;
        this.dependants = data || [];
        this.cdr.detectChanges();
      },
      error: () => {
        if (this.currentRequestEmployeeId !== requestedId) return;
        this.dependants = [];
        this.cdr.detectChanges();
      }
    });
  }

  switchTab(tab: string): void {
    this.activeTab = tab;
    this.cdr.detectChanges();
  }

  goToLeave(): void {
    this.openLeaveForm();
  }

  goToPayslipHistory(): void {
    this.activeTab = 'payslips';
    this.cdr.detectChanges();
  }

  downloadLatestPayslip(): void {
    if (!this.latestPayslip || !this.selectedEmployeeId) return;
    window.open(`/payroll-app/api/reports/payslip/${this.latestPayslip.run_id}/${this.selectedEmployeeId}`, '_blank');
  }

  getStatusClass(status: string): string {
    if (!status) return '';
    const s = status.toUpperCase();
    if (s === 'ACTIVE' || s === 'COMPLETED' || s === 'APPROVED') return 'status-success';
    if (s === 'INACTIVE' || s === 'TERMINATED' || s === 'SUSPENDED') return 'status-danger';
    if (s === 'PENDING' || s === 'TRIAL') return 'status-warning';
    return 'status-info';
  }

  getInitials(): string {
    if (!this.profile) return '?';
    const f = (this.profile.first_name || '').charAt(0);
    const s = (this.profile.surname || '').charAt(0);
    return (f + s).toUpperCase();
  }

  maskAccountNumber(acc: string): string {
    if (!acc || acc.length < 4) return acc || '-';
    return '****' + acc.slice(-4);
  }

  getRelationshipLabel(rel: string | null | undefined): string {
    if (!rel) return '-';
    const map: Record<string, string> = { SELF: 'Self', SPOUSE: 'Spouse', CHILD: 'Child', OTHER: 'Other' };
    return map[rel] || rel;
  }

  startEditContact(): void {
    this.contactDraft = {
      cell_number: this.profile?.cell_number || '',
      home_number: this.profile?.home_number || '',
      work_number: this.profile?.work_number || '',
      email_address: this.profile?.email_address || '',
    };
    this.contactErrors = {};
    this.editingContact = true;
    this.cdr.detectChanges();
  }

  cancelEditContact(): void {
    this.editingContact = false;
    this.contactDraft = {};
    this.contactErrors = {};
    this.cdr.detectChanges();
  }

  validateContactDraft(): boolean {
    this.contactErrors = {};
    let ok = true;
    const email = (this.contactDraft.email_address || '').trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.contactErrors.email_address = 'Invalid email format';
      ok = false;
    }
    for (const k of ['cell_number','home_number','work_number'] as const) {
      const v = (this.contactDraft[k] || '').toString().trim();
      if (v) {
        if (!/^[0-9+\-\s]+$/.test(v)) {
          this.contactErrors[k] = 'Only digits, +, -, spaces allowed';
          ok = false;
        } else {
          const digits = v.replace(/\D/g, '');
          if (digits.length < 7 || digits.length > 15) {
            this.contactErrors[k] = 'Must be 7-15 digits';
            ok = false;
          }
        }
      }
    }
    return ok;
  }

  saveContact(): void {
    if (!this.validateContactDraft()) { this.cdr.detectChanges(); return; }
    this.contactSaving = true;
    this.cdr.detectChanges();
    this.api.patch<any>('/ess/me/contact', this.contactDraft).subscribe({
      next: (res: any) => {
        const data = res?.data || res || {};
        if (this.profile) {
          if ('cell_number' in data) this.profile.cell_number = data.cell_number;
          if ('home_number' in data) this.profile.home_number = data.home_number;
          if ('work_number' in data) this.profile.work_number = data.work_number;
          if ('email_address' in data) this.profile.email_address = data.email_address;
        }
        this.contactSaving = false;
        this.editingContact = false;
        this.contactDraft = {};
        this.ui.toast('success', 'Saved', 'Contact details updated');
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.contactSaving = false;
        const msg = err?.error?.error?.message || 'Failed to update contact details';
        this.ui.toast('error', 'Error', msg);
        this.cdr.detectChanges();
      }
    });
  }

  startEditEmergency(): void {
    this.emergencyDraft = {
      emergency_contact_name: this.profile?.emergency_contact_name || '',
      emergency_contact_phone: this.profile?.emergency_contact_phone || '',
      emergency_contact_relationship: this.profile?.emergency_contact_relationship || '',
    };
    this.emergencyErrors = {};
    this.editingEmergency = true;
    this.cdr.detectChanges();
  }

  cancelEditEmergency(): void {
    this.editingEmergency = false;
    this.emergencyDraft = {};
    this.emergencyErrors = {};
    this.cdr.detectChanges();
  }

  validateEmergencyDraft(): boolean {
    this.emergencyErrors = {};
    let ok = true;
    const phone = (this.emergencyDraft.emergency_contact_phone || '').toString().trim();
    if (phone) {
      if (!/^[0-9+\-\s]+$/.test(phone)) {
        this.emergencyErrors.emergency_contact_phone = 'Only digits, +, -, spaces allowed';
        ok = false;
      } else {
        const digits = phone.replace(/\D/g, '');
        if (digits.length < 7 || digits.length > 15) {
          this.emergencyErrors.emergency_contact_phone = 'Must be 7-15 digits';
          ok = false;
        }
      }
    }
    const rel = (this.emergencyDraft.emergency_contact_relationship || '').trim();
    if (rel && !this.relationshipOptions.some(o => o.value === rel)) {
      this.emergencyErrors.emergency_contact_relationship = 'Invalid relationship';
      ok = false;
    }
    return ok;
  }

  saveEmergency(): void {
    if (!this.validateEmergencyDraft()) { this.cdr.detectChanges(); return; }
    this.emergencySaving = true;
    this.cdr.detectChanges();
    this.api.patch<any>('/ess/me/contact', this.emergencyDraft).subscribe({
      next: (res: any) => {
        const data = res?.data || res || {};
        if (this.profile) {
          if ('emergency_contact_name' in data) this.profile.emergency_contact_name = data.emergency_contact_name;
          if ('emergency_contact_phone' in data) this.profile.emergency_contact_phone = data.emergency_contact_phone;
          if ('emergency_contact_relationship' in data) this.profile.emergency_contact_relationship = data.emergency_contact_relationship;
        }
        this.emergencySaving = false;
        this.editingEmergency = false;
        this.emergencyDraft = {};
        this.ui.toast('success', 'Saved', 'Emergency contact updated');
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.emergencySaving = false;
        const msg = err?.error?.error?.message || 'Failed to update emergency contact';
        this.ui.toast('error', 'Error', msg);
        this.cdr.detectChanges();
      }
    });
  }

  get contactDraftInvalid(): boolean {
    const d = this.contactDraft || {};
    const email = (d.email_address || '').trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return true;
    for (const k of ['cell_number','home_number','work_number'] as const) {
      const v = (d[k] || '').toString().trim();
      if (!v) continue;
      if (!/^[0-9+\-\s]+$/.test(v)) return true;
      const digits = v.replace(/\D/g, '');
      if (digits.length < 7 || digits.length > 15) return true;
    }
    return false;
  }

  get emergencyDraftInvalid(): boolean {
    const d = this.emergencyDraft || {};
    const phone = (d.emergency_contact_phone || '').toString().trim();
    if (phone) {
      if (!/^[0-9+\-\s]+$/.test(phone)) return true;
      const digits = phone.replace(/\D/g, '');
      if (digits.length < 7 || digits.length > 15) return true;
    }
    const rel = (d.emergency_contact_relationship || '').trim();
    if (rel && !this.relationshipOptions.some(o => o.value === rel)) return true;
    return false;
  }

  emergencyRelationshipLabel(val: string | null | undefined): string {
    if (!val) return '-';
    const o = this.relationshipOptions.find(x => x.value === val);
    return o ? o.label : val;
  }

  reportIncorrectBanking(): void {
    if (this.reportingBanking) return;
    const notes = (typeof window !== 'undefined' && window.prompt)
      ? (window.prompt('Optionally describe what is incorrect (max 1000 chars):') || '')
      : '';
    this.reportingBanking = true;
    this.cdr.detectChanges();
    this.api.post<any>(`/ess/me/banking/report-issue`, { notes }).subscribe({
      next: (res: any) => {
        const data = res?.data || res || {};
        this.reportingBanking = false;
        if (data.recipients_notified > 0) {
          this.ui.toast('success', 'Request submitted', data.message || 'HR/Payroll has been notified.');
        } else {
          this.ui.toast('warning', 'Request logged', data.message || 'No HR/Payroll users were available to receive your request.');
        }
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.reportingBanking = false;
        const msg = err?.error?.error?.message || 'Failed to submit your request';
        this.ui.toast('error', 'Error', msg);
        this.cdr.detectChanges();
      }
    });
  }

  getLeavePercentage(balance: any): number {
    const total = (parseFloat(balance.accrued) || 0) + (parseFloat(balance.taken) || 0) + (parseFloat(balance.forfeited) || 0);
    if (total === 0) return 0;
    const remaining = parseFloat(balance.balance) || 0;
    return Math.min(100, Math.max(0, (remaining / total) * 100));
  }

  getLeaveBarColor(balance: any): string {
    const pct = this.getLeavePercentage(balance);
    if (pct >= 60) return 'var(--platinum-success)';
    if (pct >= 30) return 'var(--platinum-warning)';
    return 'var(--platinum-danger)';
  }

  formatDate(d: string): string {
    if (!d) return '-';
    try {
      return new Date(d).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch { return '-'; }
  }

  formatCurrency(v: any): string {
    const n = parseFloat(v) || 0;
    return 'R ' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  viewPayslip(runId: number): void {
    window.open(`/payroll-app/api/reports/payslip/${runId}/${this.selectedEmployeeId}`, '_blank');
  }

  getPeriodLabel(payslip: any): string {
    if (!payslip) return '-';
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const periodNum = parseInt(payslip.period_number) || 0;
    const monthIdx = ((periodNum - 1 + 2) % 12);
    return `${months[monthIdx]} ${payslip.tax_year}`;
  }

  loadEssClaims(): void {
    const requestedId = this.selectedEmployeeId;
    if (!requestedId) return;
    this.essClaimsLoading = true;
    this.api.get<any>(`/ess/claims/${requestedId}`).subscribe({
      next: (data: any) => {
        if (this.currentRequestEmployeeId !== requestedId) return;
        this.essClaims = data || [];
        this.essClaimsLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        if (this.currentRequestEmployeeId !== requestedId) return;
        this.essClaims = [];
        this.essClaimsLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  getClaimTypeLabel(type: string): string {
    const ct = this.claimTypes.find(t => t.value === type);
    return ct ? ct.label : type;
  }

  openEssClaimForm(): void {
    this.essClaimForm = {
      claim_type: '',
      sub_type: '',
      start_date: '',
      end_date: '',
      kilometres: null,
      reference_no: '',
      reason: ''
    };
    this.essClaimConfigurations = [];
    this.essSelectedConfig = null;
    this.essTariff = 0;
    this.essEditingClaimId = null;
    this.essDuplicateWarning = null;
    this.essCheckingDuplicates = false;
    this.essClaimView = 'form';
    this.cdr.detectChanges();
  }

  essBackToList(): void {
    this.essClaimView = 'list';
    this.loadEssClaims();
  }

  essOnClaimTypeChange(): void {
    this.essClaimForm.sub_type = '';
    this.essSelectedConfig = null;
    this.essTariff = 0;
    this.essClaimForm.kilometres = null;
    this.essClaimForm.end_date = '';
    this.essClaimConfigurations = [];
    this.essDuplicateWarning = null;

    if (this.essClaimForm.claim_type) {
      const requestedId = this.selectedEmployeeId;
      this.api.get<any[]>('/time/claims/configurations-by-type', { claim_type: this.essClaimForm.claim_type }).subscribe({
        next: (data) => {
          if (this.currentRequestEmployeeId !== requestedId) return;
          this.essClaimConfigurations = data || [];
          this.cdr.detectChanges();
          this.essCheckDuplicates();
        },
        error: () => {
          if (this.currentRequestEmployeeId !== requestedId) return;
          this.essClaimConfigurations = [];
          this.cdr.detectChanges();
        }
      });
    }
    this.cdr.detectChanges();
  }

  essOnSubTypeChange(): void {
    if (!this.essClaimForm.sub_type) {
      this.essSelectedConfig = null;
      this.essTariff = 0;
      this.cdr.detectChanges();
      return;
    }
    const configId = parseInt(this.essClaimForm.sub_type, 10);
    this.essSelectedConfig = this.essClaimConfigurations.find((c: any) => c.id === configId) || null;
    this.essTariff = this.essSelectedConfig?.client_policy ? parseFloat(this.essSelectedConfig.client_policy) : (this.essSelectedConfig?.sars_rate ? parseFloat(this.essSelectedConfig.sars_rate) : 0);
    this.cdr.detectChanges();
  }

  getEssSubTypeLabel(config: any): string {
    if (!config) return '';
    const group = config.claim_group ? config.claim_group + ' - ' : '';
    return group + config.claim_subtype;
  }

  get essClaimValue(): number {
    if (!this.essTariff) return 0;
    if (this.essClaimForm.claim_type === 'TRAVEL') {
      const km = parseFloat(this.essClaimForm.kilometres) || 0;
      return parseFloat((km * this.essTariff).toFixed(2));
    }
    if (this.essClaimForm.claim_type === 'S_AND_T') {
      if (this.essClaimForm.start_date && this.essClaimForm.end_date) {
        const start = new Date(this.essClaimForm.start_date);
        const end = new Date(this.essClaimForm.end_date);
        if (end < start) return 0;
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        return parseFloat((days * this.essTariff).toFixed(2));
      }
    }
    return 0;
  }

  get essDayCount(): number {
    if (this.essClaimForm.claim_type !== 'S_AND_T' || !this.essClaimForm.start_date || !this.essClaimForm.end_date) return 0;
    const start = new Date(this.essClaimForm.start_date);
    const end = new Date(this.essClaimForm.end_date);
    if (end < start) return 0;
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }

  essCheckDuplicates(): void {
    if (!this.selectedEmployeeId || !this.essClaimForm.claim_type || !this.essClaimForm.start_date) {
      this.essDuplicateWarning = null;
      this.essCheckingDuplicates = false;
      this.cdr.detectChanges();
      return;
    }
    if (this.essClaimForm.claim_type === 'S_AND_T' && !this.essClaimForm.end_date) {
      this.essDuplicateWarning = null;
      this.essCheckingDuplicates = false;
      this.cdr.detectChanges();
      return;
    }
    this.essCheckingDuplicates = true;
    const requestedId = this.selectedEmployeeId;
    const params: any = {
      employee_id: requestedId,
      claim_type: this.essClaimForm.claim_type,
      start_date: this.essClaimForm.start_date
    };
    if (this.essClaimForm.end_date) params.end_date = this.essClaimForm.end_date;
    if (this.essEditingClaimId) params.exclude_claim_id = this.essEditingClaimId;

    this.api.get<any>('/time/claims/check-duplicate', params).subscribe({
      next: (res: any) => {
        if (this.currentRequestEmployeeId !== requestedId) return;
        const data = res?.data || res || {};
        this.essCheckingDuplicates = false;
        if (data.has_conflict && data.conflicts?.length > 0) {
          const ids = data.conflicts.map((c: any) => '#' + c.id).join(', ');
          this.essDuplicateWarning = `Potential duplicate: existing claim(s) ${ids} with overlapping dates.`;
        } else {
          this.essDuplicateWarning = null;
        }
        this.cdr.detectChanges();
      },
      error: () => {
        if (this.currentRequestEmployeeId !== requestedId) return;
        this.essCheckingDuplicates = false;
        this.essDuplicateWarning = null;
        this.cdr.detectChanges();
      }
    });
  }

  essSubmitClaim(): void {
    if (!this.essClaimForm.claim_type) {
      this.ui.toast('error', 'Validation', 'Please select a claim type');
      return;
    }
    if (!this.essClaimForm.sub_type && !this.essEditingClaimId) {
      this.ui.toast('error', 'Validation', 'Please select a sub-type');
      return;
    }
    if (!this.essClaimForm.start_date) {
      this.ui.toast('error', 'Validation', 'Start date is required');
      return;
    }
    if (this.essClaimForm.claim_type === 'S_AND_T' && !this.essClaimForm.end_date) {
      this.ui.toast('error', 'Validation', 'End date is required for S & T claims');
      return;
    }
    if (this.essClaimForm.claim_type === 'S_AND_T' && this.essClaimForm.end_date && new Date(this.essClaimForm.end_date) < new Date(this.essClaimForm.start_date)) {
      this.ui.toast('error', 'Validation', 'End date cannot be before start date');
      return;
    }
    if (this.essClaimForm.claim_type === 'TRAVEL' && (!this.essClaimForm.kilometres || this.essClaimForm.kilometres <= 0)) {
      this.ui.toast('error', 'Validation', 'Kilometres must be greater than 0');
      return;
    }
    if (this.essClaimValue <= 0 && !this.essEditingClaimId) {
      this.ui.toast('error', 'Validation', 'Claim value must be greater than 0');
      return;
    }

    this.essClaimFormLoading = true;
    const subType = this.essSelectedConfig ? this.getEssSubTypeLabel(this.essSelectedConfig) : (this.essClaimForm.existing_sub_type || '');
    const amount = this.essClaimValue || this.essClaimForm.amount;

    if (this.essEditingClaimId) {
      const body = {
        claim_type: this.essClaimForm.claim_type,
        sub_type: subType,
        start_date: this.essClaimForm.start_date,
        end_date: this.essClaimForm.end_date || null,
        amount: amount,
        kilometres: this.essClaimForm.kilometres || null,
        reason: this.essClaimForm.reason || null,
        reference_no: this.essClaimForm.reference_no || null
      };
      this.api.patch<any>(`/ess/claims/${this.essEditingClaimId}/resubmit`, body).subscribe({
        next: () => {
          this.ui.toast('success', 'Resubmitted', 'Claim corrected and resubmitted');
          this.essClaimFormLoading = false;
          this.essEditingClaimId = null;
          this.essBackToList();
        },
        error: (err: any) => {
          const msg = err?.error?.error?.message || 'Failed to resubmit claim';
          if (err?.status === 409) {
            this.essDuplicateWarning = msg;
            this.ui.toast('error', 'Duplicate Claim', msg);
          } else {
            this.ui.toast('error', 'Error', msg);
          }
          this.essClaimFormLoading = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      const body = {
        claim_type: this.essClaimForm.claim_type,
        sub_type: subType,
        start_date: this.essClaimForm.start_date,
        end_date: this.essClaimForm.end_date || null,
        amount: amount,
        kilometres: this.essClaimForm.kilometres || null,
        reason: this.essClaimForm.reason || null,
        reference_no: this.essClaimForm.reference_no || null
      };
      this.api.post<any>('/ess/claims', body).subscribe({
        next: () => {
          this.ui.toast('success', 'Submitted', 'Claim submitted successfully');
          this.essClaimFormLoading = false;
          this.essBackToList();
        },
        error: (err: any) => {
          const msg = err?.error?.error?.message || 'Failed to submit claim';
          if (err?.status === 409) {
            this.essDuplicateWarning = msg;
            this.ui.toast('error', 'Duplicate Claim', msg);
          } else {
            this.ui.toast('error', 'Error', msg);
          }
          this.essClaimFormLoading = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  essPrintClaimPDF(claim: any): void {
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

  essEditAndResubmit(claim: any): void {
    this.essEditingClaimId = claim.id;
    this.essClaimForm = {
      claim_type: claim.claim_type,
      sub_type: '',
      existing_sub_type: claim.sub_type || '',
      start_date: claim.start_date ? claim.start_date.substring(0, 10) : '',
      end_date: claim.end_date ? claim.end_date.substring(0, 10) : '',
      kilometres: claim.kilometres ? parseFloat(claim.kilometres) : null,
      reference_no: claim.reference_no || '',
      reason: claim.reason || '',
      amount: parseFloat(claim.amount) || 0
    };
    this.essSelectedConfig = null;
    this.essTariff = 0;
    this.essClaimConfigurations = [];
    this.essDuplicateWarning = null;

    if (this.essClaimForm.claim_type) {
      const requestedId = this.selectedEmployeeId;
      this.api.get<any[]>('/time/claims/configurations-by-type', { claim_type: this.essClaimForm.claim_type }).subscribe({
        next: (data) => {
          if (this.currentRequestEmployeeId !== requestedId) return;
          this.essClaimConfigurations = data || [];
          this.cdr.detectChanges();
        },
        error: () => {
          if (this.currentRequestEmployeeId !== requestedId) return;
          this.essClaimConfigurations = [];
          this.cdr.detectChanges();
        }
      });
    }

    this.essClaimView = 'form';
    this.cdr.detectChanges();
  }

  private essTimeDefaultDates(): { from: string; to: string } {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return { from: `${y}-${m}-01`, to: `${y}-${m}-${d}` };
  }

  private essTimeToday(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  loadMyAttendance(): void {
    const requestedId = this.selectedEmployeeId;
    if (!requestedId) return;
    const { from, to } = this.essTimeDefaultDates();
    if (!this.essTimeDateFrom) this.essTimeDateFrom = from;
    if (!this.essTimeDateTo) this.essTimeDateTo = to;
    this.essTimeLoading = true;
    this.cdr.detectChanges();
    this.api.get<any>(`/time/attendance/${requestedId}/daily`, {
      date_from: this.essTimeDateFrom,
      date_to: this.essTimeDateTo
    }).subscribe({
      next: (res: any) => {
        if (this.currentRequestEmployeeId !== requestedId) return;
        const rows = res?.data || res || [];
        this.essTimeRecords = Array.isArray(rows) ? [...rows].reverse() : [];
        this.essTimeLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        if (this.currentRequestEmployeeId !== requestedId) return;
        this.essTimeRecords = [];
        this.essTimeLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  openTimeForm(): void {
    const today = this.essTimeToday();
    this.essTimeForm = {
      attendance_date: today,
      clock_in: '',
      clock_out: '',
      hours_worked: '',
      comment: ''
    };
    this.essTimeFormError = null;
    this.essTimeResolvedShift = null;
    this.essTimeShiftNoRotation = false;
    this.essTimeView = 'form';
    this.cdr.detectChanges();
    this.resolveEssShift(today);
  }

  cancelTimeForm(): void {
    this.essTimeView = 'list';
    this.essTimeFormError = null;
    this.cdr.detectChanges();
  }

  onEssDateChange(): void {
    const d = this.essTimeForm.attendance_date;
    if (!d) return;
    this.essTimeResolvedShift = null;
    this.essTimeShiftNoRotation = false;
    this.resolveEssShift(d);
  }

  resolveEssShift(date: string): void {
    if (!this.selectedEmployeeId || !date) return;
    const seq = ++this.essTimeShiftSeq;
    this.essTimeShiftLoading = true;
    this.cdr.detectChanges();
    this.api.get<any>(`/time/employees/${this.selectedEmployeeId}/shift-roster`, {
      date_from: date,
      date_to: date
    }).subscribe({
      next: (res: any) => {
        if (seq !== this.essTimeShiftSeq) return;
        const rows: any[] = res?.data || res || [];
        this.essTimeShiftLoading = false;
        if (rows.length > 0 && rows[0].shift_id) {
          this.essTimeResolvedShift = rows[0];
          this.essTimeShiftNoRotation = false;
          this.essTimeShiftIsOffDay = false;
          this.essTimeForm.shift_id = rows[0].shift_id;
        } else if (rows.length > 0 && rows[0].is_off && !rows[0].no_coverage) {
          this.essTimeResolvedShift = null;
          this.essTimeShiftNoRotation = false;
          this.essTimeShiftIsOffDay = true;
          this.essTimeForm.shift_id = null;
        } else {
          this.essTimeResolvedShift = null;
          this.essTimeShiftNoRotation = true;
          this.essTimeShiftIsOffDay = false;
          this.essTimeForm.shift_id = null;
        }
        this.cdr.detectChanges();
      },
      error: () => {
        if (seq !== this.essTimeShiftSeq) return;
        this.essTimeShiftLoading = false;
        this.essTimeResolvedShift = null;
        this.essTimeShiftNoRotation = true;
        this.essTimeShiftIsOffDay = false;
        this.essTimeForm.shift_id = null;
        this.cdr.detectChanges();
      }
    });
  }

  onEssClockChange(): void {
    const ci = this.essTimeForm.clock_in;
    const co = this.essTimeForm.clock_out;
    if (ci && co) {
      const [ih, im] = ci.split(':').map(Number);
      const [oh, om] = co.split(':').map(Number);
      const mins = (oh * 60 + om) - (ih * 60 + im);
      if (mins > 0) {
        this.essTimeForm.hours_worked = parseFloat((mins / 60).toFixed(2));
      }
    }
    this.cdr.detectChanges();
  }

  submitTimeEntry(): void {
    this.essTimeFormError = null;

    const date = this.essTimeForm.attendance_date;
    if (!date) { this.essTimeFormError = 'Date is required.'; this.cdr.detectChanges(); return; }

    const today = this.essTimeToday();
    if (date > today) { this.essTimeFormError = 'Cannot capture attendance for a future date.'; this.cdr.detectChanges(); return; }

    const comment = (this.essTimeForm.comment || '').trim();
    if (!comment || comment.length < 5) {
      this.essTimeFormError = 'Reason is required (minimum 5 characters).';
      this.cdr.detectChanges();
      return;
    }

    const ci = this.essTimeForm.clock_in || null;
    const co = this.essTimeForm.clock_out || null;
    if (co && !ci) { this.essTimeFormError = 'Clock Out cannot be set without Clock In.'; this.cdr.detectChanges(); return; }
    if (ci && co) {
      const [ih, im] = ci.split(':').map(Number);
      const [oh, om] = co.split(':').map(Number);
      if ((oh * 60 + om) <= (ih * 60 + im)) {
        this.essTimeFormError = 'Clock Out must be after Clock In.';
        this.cdr.detectChanges();
        return;
      }
    }

    const hw = this.essTimeForm.hours_worked ? parseFloat(this.essTimeForm.hours_worked) : null;

    this.essTimeFormLoading = true;
    this.cdr.detectChanges();

    const body: any = {
      employee_id: this.selectedEmployeeId,
      attendance_date: date,
      clock_in: ci ? `${date}T${ci}:00` : null,
      clock_out: co ? `${date}T${co}:00` : null,
      hours_worked: hw,
      shift_id: this.essTimeForm.shift_id || null,
      status: 'PRESENT',
      source: 'MANUAL',
      comment: comment,
      input_mode: 'DAILY'
    };

    this.api.post<any>('/time/attendance', body).subscribe({
      next: () => {
        this.essTimeFormLoading = false;
        this.ui.toast('success', 'Time Entry Submitted', 'Your attendance record has been saved and is subject to supervisor review.');
        this.essTimeView = 'list';
        this.essTimeFormError = null;
        this.loadMyAttendance();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.essTimeFormLoading = false;
        this.essTimeFormError = err?.error?.error?.message || err?.error?.message || 'Failed to submit time entry.';
        this.cdr.detectChanges();
      }
    });
  }

  essTimeExceptionLabel(type: string): string {
    if (!type || type === 'COMPLIANT') return 'Compliant';
    const map: Record<string, string> = {
      LATE_ARRIVAL: 'Late Arrival',
      EARLY_DEPARTURE: 'Early Departure',
      SHORT_TIME: 'Short Time',
      MISSING_CLOCKING: 'Missing Clocking',
      ABNORMAL_HOURS: 'Abnormal Hours'
    };
    return map[type] || type;
  }

  essTimeDayName(dateStr: string): string {
    if (!dateStr) return '';
    try {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return days[new Date(dateStr + 'T00:00:00').getDay()];
    } catch { return ''; }
  }

  essTimeShiftChip(): string {
    if (!this.essTimeResolvedShift) return '';
    const s = this.essTimeResolvedShift;
    const name = s.shift_name || s.name || 'Shift';
    const start = (s.shift_start || s.shift_start_time || '').toString().substring(0, 5);
    const end = (s.shift_end || s.shift_end_time || '').toString().substring(0, 5);
    return start && end ? `${name} · ${start}–${end}` : name;
  }

  essTimeViewMonthLabel(): string {
    return this.essTimeViewMonth.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' });
  }

  essTimeIsCurrentMonth(): boolean {
    const now = new Date();
    return this.essTimeViewMonth.getFullYear() === now.getFullYear()
        && this.essTimeViewMonth.getMonth() === now.getMonth();
  }

  prevEssMonth(): void {
    const d = new Date(this.essTimeViewMonth);
    d.setMonth(d.getMonth() - 1);
    this.essTimeViewMonth = d;
    this.applyEssMonth();
  }

  nextEssMonth(): void {
    if (this.essTimeIsCurrentMonth()) return;
    const d = new Date(this.essTimeViewMonth);
    d.setMonth(d.getMonth() + 1);
    this.essTimeViewMonth = d;
    this.applyEssMonth();
  }

  openTimeImportModal(): void {
    this.showTimeImportModal = true;
    this.timeImportFile = null;
    this.timeImportFileName = '';
    this.timeImportResult = null;
    this.timeImportLoading = false;
    this.cdr.detectChanges();
  }

  closeTimeImportModal(): void {
    const importedCount = this.timeImportResult?.imported ?? 0;
    this.showTimeImportModal = false;
    this.timeImportFile = null;
    this.timeImportResult = null;
    this.cdr.detectChanges();
    if (importedCount > 0) {
      this.loadMyAttendance();
    }
  }

  downloadAttendanceTemplate(): void {
    if (!this.selectedEmployeeId) return;
    this.api.getBlob('/time/attendance/template', { employee_id: this.selectedEmployeeId }).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'time-import-template.xlsx';
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      },
      error: () => this.ui.toast('error', 'Download Failed', 'Could not download the template')
    });
  }

  onTimeImportFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.timeImportFile = input.files[0];
      this.timeImportFileName = input.files[0].name;
      this.timeImportResult = null;
    } else {
      this.timeImportFile = null;
      this.timeImportFileName = '';
    }
    this.cdr.detectChanges();
  }

  submitTimeImport(): void {
    if (!this.timeImportFile || !this.selectedEmployeeId) return;
    this.timeImportLoading = true;
    this.timeImportResult = null;
    this.cdr.detectChanges();
    const fd = new FormData();
    fd.append('file', this.timeImportFile);
    this.api.postFormData<{ imported: number; skipped: number; errors: Array<{ row: number; reason: string }> }>(`/time/attendance/bulk-import?employee_id=${this.selectedEmployeeId}`, fd)
      .subscribe({
        next: (result) => {
          this.timeImportLoading = false;
          this.timeImportResult = result;
          if (result && result.imported > 0) {
            this.ui.toast('success', 'Import Complete', `${result.imported} record(s) imported`);
            this.loadMyAttendance();
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.timeImportLoading = false;
          const msg = err?.error?.error?.message || 'Could not process the file. Check the format and try again.';
          this.ui.toast('error', 'Import Failed', msg);
          this.cdr.detectChanges();
        }
      });
  }

  private applyEssMonth(): void {
    const y = this.essTimeViewMonth.getFullYear();
    const m = this.essTimeViewMonth.getMonth();
    const pad = (n: number) => String(n).padStart(2, '0');
    this.essTimeDateFrom = `${y}-${pad(m + 1)}-01`;
    const lastDay = new Date(y, m + 1, 0).getDate();
    const now = new Date();
    const isCurrentMonth = this.essTimeIsCurrentMonth();
    const day = isCurrentMonth ? now.getDate() : lastDay;
    this.essTimeDateTo = `${y}-${pad(m + 1)}-${pad(day)}`;
    this.loadMyAttendance();
  }
}
