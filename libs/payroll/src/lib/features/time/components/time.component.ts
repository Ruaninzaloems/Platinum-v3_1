import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { UiService } from '../../../core/services/ui.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { DateInputComponent } from '../../../shared/components/date-input/date-input.component';

@Component({
  selector: 'app-time',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, PaginationComponent, DateInputComponent],
  templateUrl: './time.component.html',
  styleUrl: './time.component.css'
})
export class TimeComponent implements OnInit {
  activeTab = 'overtime';
  shifts: any[] = [];
  employees: any[] = [];
  loading = true;

  overtimeRecords: any[] = [];
  overtimeTotal = 0;
  overtimePendingCount = 0;
  overtimePage = 1;
  overtimeLoading = false;

  attendanceRecords: any[] = [];
  attendanceTotal = 0;
  attendancePage = 1;
  attendanceLoading = false;

  claimsRecords: any[] = [];
  claimsTotal = 0;
  claimsPage = 1;
  claimsLoading = false;

  rosters: any[] = [];
  rostersLoading = false;

  flexiRecords: any[] = [];
  flexiLoading = false;

  instalments: any[] = [];
  instalmentsLoading = false;

  ghostMonths = 3;
  ghostResults: any = null;
  ghostLoading = false;

  reportResults: any = null;
  reportLoading = false;
  rptAttStart = '';
  rptAttEnd = '';
  rptOtPeriod = '';
  periods: any[] = [];

  showOvertimeModal = false;
  showAttendanceModal = false;
  showRosterModal = false;
  showClaimModal = false;
  showInstalmentModal = false;

  otForm = { employee_id: '', overtime_date: '', hours: 0, rate_multiplier: '1.5', reason: '' };
  attForm = { employee_id: '', attendance_date: '', clock_in: '', clock_out: '', shift_id: '', status: 'PRESENT' };
  rosterForm = { employee_id: '', shift_id: '', roster_date: '' };
  claimForm = { employee_id: '', claim_type: 'S_AND_T', start_date: '', end_date: '', amount: 0, kilometres: 0, reason: '' };
  instForm = { employee_id: '', description: '', total_amount: 0, monthly_instalment: 0, period_months: 12, start_date: '', vendor_name: '', reference_number: '' };

  tabs = [
    { id: 'overtime', label: 'Overtime', icon: 'clock' },
    { id: 'attendance', label: 'Attendance Log', icon: 'check' },
    { id: 'shifts', label: 'Shifts', icon: 'settings' },
    { id: 'rosters', label: 'Shift Rosters', icon: 'calendar' },
    { id: 'flexi', label: 'Flexi-Time', icon: 'clock' },
    { id: 'claims', label: 'Claims', icon: 'fileText' },
    { id: 'instalments', label: 'Instalments', icon: 'dollarSign' },
    { id: 'ghost', label: 'Ghost Detection', icon: 'alertTriangle' },
    { id: 'reports', label: 'Time Reports', icon: 'barChart' },
  ];

  constructor(private api: ApiService, private ui: UiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loading = true;
    const today = new Date().toISOString().split('T')[0];
    this.rptAttEnd = today;
    this.rptAttStart = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

    let loaded = 0;
    const check = () => { loaded++; if (loaded >= 2) { this.loading = false; this.cdr.detectChanges(); this.loadTab(); } };
    this.api.get<any>('/time/shifts').subscribe({
      next: (d) => { this.shifts = d || []; check();  this.cdr.detectChanges(); },
      error: () => { this.shifts = []; check(); }
    });
    this.api.get<any>('/employees', { limit: 200, sort_by: 'surname', sort_order: 'asc' }).subscribe({
      next: (d) => { this.employees = (d as any)?.data || d || []; check();  this.cdr.detectChanges(); },
      error: () => { this.employees = []; check(); }
    });
  }

  setTab(tab: string): void {
    this.activeTab = tab;
    this.loadTab();
  }

  loadTab(): void {
    switch (this.activeTab) {
      case 'overtime': this.loadOvertime(); break;
      case 'attendance': this.loadAttendance(); break;
      case 'rosters': this.loadRosters(); break;
      case 'flexi': this.loadFlexi(); break;
      case 'claims': this.loadClaims(); break;
      case 'instalments': this.loadInstalments(); break;
      case 'reports': this.loadPeriods(); break;
    }
  }

  loadOvertime(): void {
    this.overtimeLoading = true;
    this.api.getPaginated<any>('/time/overtime', { limit: 20, page: this.overtimePage }).subscribe({
      next: (res) => {
        this.overtimeRecords = res.data || [];
        this.overtimeTotal = res.meta?.total || 0;
        this.overtimePendingCount = this.overtimeRecords.filter(o => o.status === 'PENDING').length;
        this.overtimeLoading = false;
       this.cdr.detectChanges(); },
      error: () => { this.overtimeRecords = []; this.overtimeLoading = false; }
    });
  }

  onOvertimePage(p: number): void { this.overtimePage = p; this.loadOvertime(); }

  openOvertimeModal(): void {
    const today = new Date().toISOString().split('T')[0];
    this.otForm = { employee_id: '', overtime_date: today, hours: 0, rate_multiplier: '1.5', reason: '' };
    this.showOvertimeModal = true;
  }

  submitOvertime(): void {
    if (!this.otForm.employee_id || !this.otForm.hours) { this.ui.toast('error', 'Validation', 'Fill required fields'); return; }
    this.api.post('/time/overtime', {
      employee_id: parseInt(this.otForm.employee_id),
      salary_head_id: 1,
      overtime_date: this.otForm.overtime_date,
      hours: this.otForm.hours,
      rate_multiplier: parseFloat(this.otForm.rate_multiplier),
      reason: this.otForm.reason,
    }).subscribe({
      next: () => { this.ui.toast('success', 'Submitted', 'Overtime captured successfully'); this.showOvertimeModal = false; this.loadOvertime(); },
      error: () => this.ui.toast('error', 'Error', 'Failed to capture overtime')
    });
  }

  async approveOvertime(id: number): Promise<void> {
    const confirmed = await this.ui.confirm({ title: 'Approve Overtime', message: 'Are you sure you want to approve this overtime transaction?' });
    if (!confirmed) return;
    this.api.post(`/time/overtime/${id}/approve`, {}).subscribe({
      next: () => { this.ui.toast('success', 'Approved', 'Overtime approved'); this.loadOvertime(); },
      error: () => this.ui.toast('error', 'Error', 'Failed to approve')
    });
  }

  loadAttendance(): void {
    this.attendanceLoading = true;
    this.api.getPaginated<any>('/time/attendance', { limit: 20, page: this.attendancePage }).subscribe({
      next: (res) => {
        this.attendanceRecords = res.data || [];
        this.attendanceTotal = res.meta?.total || 0;
        this.attendanceLoading = false;
       this.cdr.detectChanges(); },
      error: () => { this.attendanceRecords = []; this.attendanceLoading = false; }
    });
  }

  onAttendancePage(p: number): void { this.attendancePage = p; this.loadAttendance(); }

  openAttendanceModal(): void {
    const today = new Date().toISOString().split('T')[0];
    this.attForm = { employee_id: '', attendance_date: today, clock_in: '', clock_out: '', shift_id: '', status: 'PRESENT' };
    this.showAttendanceModal = true;
  }

  submitAttendance(): void {
    if (!this.attForm.employee_id) { this.ui.toast('error', 'Validation', 'Select an employee'); return; }
    const dateStr = this.attForm.attendance_date;
    let clockIn = null, clockOut = null;
    if (this.attForm.clock_in) clockIn = `${dateStr}T${this.attForm.clock_in}:00`;
    if (this.attForm.clock_out) clockOut = `${dateStr}T${this.attForm.clock_out}:00`;

    this.api.post('/time/attendance', {
      employee_id: parseInt(this.attForm.employee_id),
      attendance_date: dateStr,
      clock_in: clockIn,
      clock_out: clockOut,
      shift_id: this.attForm.shift_id ? parseInt(this.attForm.shift_id) : null,
      status: this.attForm.status,
    }).subscribe({
      next: () => { this.ui.toast('success', 'Recorded', 'Attendance recorded'); this.showAttendanceModal = false; this.loadAttendance(); },
      error: () => this.ui.toast('error', 'Error', 'Failed to record attendance')
    });
  }

  loadRosters(): void {
    this.rostersLoading = true;
    this.api.get<any>('/time/shift-rosters').subscribe({
      next: (d) => { this.rosters = d || []; this.rostersLoading = false;  this.cdr.detectChanges(); },
      error: () => { this.rosters = []; this.rostersLoading = false; }
    });
  }

  openRosterModal(): void {
    const today = new Date().toISOString().split('T')[0];
    this.rosterForm = { employee_id: '', shift_id: '', roster_date: today };
    this.showRosterModal = true;
  }

  submitRoster(): void {
    if (!this.rosterForm.employee_id || !this.rosterForm.shift_id) { this.ui.toast('error', 'Validation', 'Fill required fields'); return; }
    this.api.post('/time/shift-rosters', {
      employee_id: parseInt(this.rosterForm.employee_id),
      shift_id: parseInt(this.rosterForm.shift_id),
      roster_date: this.rosterForm.roster_date,
    }).subscribe({
      next: () => { this.ui.toast('success', 'Created', 'Shift roster created'); this.showRosterModal = false; this.loadRosters(); },
      error: () => this.ui.toast('error', 'Error', 'Failed to create roster')
    });
  }

  loadFlexi(): void {
    this.flexiLoading = true;
    this.api.get<any>('/time/flexi-time').subscribe({
      next: (d) => { this.flexiRecords = d || []; this.flexiLoading = false;  this.cdr.detectChanges(); },
      error: () => { this.flexiRecords = []; this.flexiLoading = false; }
    });
  }

  loadClaims(): void {
    this.claimsLoading = true;
    this.api.getPaginated<any>('/time/claims', { limit: 20, page: this.claimsPage }).subscribe({
      next: (res) => {
        this.claimsRecords = res.data || [];
        this.claimsTotal = res.meta?.total || 0;
        this.claimsLoading = false;
       this.cdr.detectChanges(); },
      error: () => { this.claimsRecords = []; this.claimsLoading = false; }
    });
  }

  onClaimsPage(p: number): void { this.claimsPage = p; this.loadClaims(); }

  openClaimModal(): void {
    const today = new Date().toISOString().split('T')[0];
    this.claimForm = { employee_id: '', claim_type: 'S_AND_T', start_date: today, end_date: '', amount: 0, kilometres: 0, reason: '' };
    this.showClaimModal = true;
  }

  submitClaim(): void {
    if (!this.claimForm.employee_id || !this.claimForm.amount) { this.ui.toast('error', 'Validation', 'Fill required fields'); return; }
    this.api.post('/time/claims', {
      employee_id: parseInt(this.claimForm.employee_id),
      claim_type: this.claimForm.claim_type,
      start_date: this.claimForm.start_date,
      end_date: this.claimForm.end_date || null,
      amount: this.claimForm.amount,
      kilometres: this.claimForm.kilometres || null,
      reason: this.claimForm.reason,
    }).subscribe({
      next: () => { this.ui.toast('success', 'Submitted', 'Claim submitted'); this.showClaimModal = false; this.loadClaims(); },
      error: () => this.ui.toast('error', 'Error', 'Failed to submit claim')
    });
  }

  loadInstalments(): void {
    this.instalmentsLoading = true;
    this.api.get<any>('/time/instalments').subscribe({
      next: (d) => { this.instalments = d || []; this.instalmentsLoading = false;  this.cdr.detectChanges(); },
      error: () => { this.instalments = []; this.instalmentsLoading = false; }
    });
  }

  openInstalmentModal(): void {
    const today = new Date().toISOString().split('T')[0];
    this.instForm = { employee_id: '', description: '', total_amount: 0, monthly_instalment: 0, period_months: 12, start_date: today, vendor_name: '', reference_number: '' };
    this.showInstalmentModal = true;
  }

  submitInstalment(): void {
    if (!this.instForm.employee_id || !this.instForm.total_amount) { this.ui.toast('error', 'Validation', 'Fill required fields'); return; }
    this.api.post('/time/instalments', {
      employee_id: parseInt(this.instForm.employee_id),
      salary_head_id: 1,
      description: this.instForm.description,
      total_amount: this.instForm.total_amount,
      monthly_instalment: this.instForm.monthly_instalment,
      period_months: this.instForm.period_months,
      start_date: this.instForm.start_date,
      vendor_name: this.instForm.vendor_name,
      reference_number: this.instForm.reference_number,
    }).subscribe({
      next: () => { this.ui.toast('success', 'Created', 'Instalment plan created'); this.showInstalmentModal = false; this.loadInstalments(); },
      error: () => this.ui.toast('error', 'Error', 'Failed to create instalment')
    });
  }

  getInstalmentProgress(i: any): number {
    if (!i.total_amount || i.total_amount <= 0) return 0;
    return Math.round(((i.total_amount - (i.balance || 0)) / i.total_amount) * 100);
  }

  runGhostDetection(): void {
    this.ghostLoading = true;
    this.ghostResults = null;
    this.api.getRaw<any>('/time/ghost-detection', { months: this.ghostMonths }).subscribe({
      next: (res) => {
        this.ghostResults = { summary: res.summary || {}, flagged: res.flagged_employees || res.data || [] };
        this.ghostLoading = false;
      },
      error: () => { this.ghostLoading = false; this.ui.toast('error', 'Error', 'Failed to run ghost detection'); }
    });
  }

  loadPeriods(): void {
    this.api.get<any>('/payroll/periods').subscribe({
      next: (d) => this.periods = d || [],
      error: () => this.periods = []
    });
  }

  loadAttendanceSummary(): void {
    if (!this.rptAttStart || !this.rptAttEnd) { this.ui.toast('error', 'Validation', 'Select date range'); return; }
    this.reportLoading = true;
    this.reportResults = null;
    this.api.getRaw<any>('/time/reports/attendance-summary', { start_date: this.rptAttStart, end_date: this.rptAttEnd }).subscribe({
      next: (res) => { this.reportResults = { type: 'attendance', data: res.data || res || [], start: this.rptAttStart, end: this.rptAttEnd }; this.reportLoading = false; this.cdr.detectChanges(); },
      error: () => { this.reportLoading = false; this.ui.toast('error', 'Error', 'Failed to load report'); }
    });
  }

  loadOvertimeSummary(): void {
    if (!this.rptOtPeriod) { this.ui.toast('error', 'Validation', 'Select period'); return; }
    this.reportLoading = true;
    this.reportResults = null;
    this.api.getRaw<any>('/time/reports/overtime-summary', { period_id: this.rptOtPeriod }).subscribe({
      next: (res) => { this.reportResults = { type: 'overtime', data: res.data || res || [] }; this.reportLoading = false; },
      error: () => { this.reportLoading = false; this.ui.toast('error', 'Error', 'Failed to load report'); }
    });
  }

  loadShiftReport(): void {
    this.reportLoading = true;
    this.reportResults = null;
    this.api.getRaw<any>('/time/reports/shift-report').subscribe({
      next: (res) => { this.reportResults = { type: 'shift', data: res.data || res || [] }; this.reportLoading = false; },
      error: () => { this.reportLoading = false; this.ui.toast('error', 'Error', 'Failed to load report'); }
    });
  }

  loadClaimsReport(): void {
    this.reportLoading = true;
    this.reportResults = null;
    this.api.getRaw<any>('/time/claims/reports').subscribe({
      next: (res) => { this.reportResults = { type: 'claims', data: res.data || res || [], summary: res.summary || {} }; this.reportLoading = false; this.cdr.detectChanges(); },
      error: () => { this.reportLoading = false; this.ui.toast('error', 'Error', 'Failed to load report'); }
    });
  }

  formatCurrency(v: any): string {
    const n = parseFloat(v) || 0;
    return 'R' + n.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  parseFloat(v: any): number { return parseFloat(v) || 0; }
}
