import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { UiService } from '../../../core/services/ui.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { DateSaPipe } from '../../../shared/pipes/date-sa.pipe';
import { CurrencyZarPipe } from '../../../shared/pipes/currency-zar.pipe';
import { DateInputComponent } from '../../../shared/components/date-input/date-input.component';

@Component({
  selector: 'app-leave',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, StatusBadgeComponent, PaginationComponent, DateSaPipe, CurrencyZarPipe, DateInputComponent],
  templateUrl: './leave.component.html',
  styleUrl: './leave.component.css'
})
export class LeaveComponent implements OnInit {
  activeView = 'transactions';
  transactions: any[] = [];
  leaveTypes: any[] = [];
  employees: any[] = [];
  balances: any[] = [];
  loading = true;
  searchTerm = '';
  filters = { status: '', leave_type_id: '' };
  page = 1;
  limit = 20;
  total = 0;

  showModal = false;
  newLeave: any = {};
  submitting = false;
  balanceCheck: any = null;
  balanceCheckInsufficient = false;

  selectedBalanceEmployee = '';
  balanceResults: any[] = [];
  balanceLoading = false;
  balanceEmployee: any = null;

  calendarYear = new Date().getFullYear();
  calendarMonth = new Date().getMonth() + 1;
  calendarData: any = null;
  calendarLoading = false;
  calendarHolidays: Record<number, string> = {};

  policies: any[] = [];
  policiesLoading = false;

  reportResults: any = null;
  reportLoading = false;
  reportType = '';
  reportYear = new Date().getFullYear();

  typesData: any[] = [];

  showRejectModal = false;
  rejectId = 0;
  rejectReason = '';

  showDetailModal = false;
  detailTransaction: any = null;
  detailBalances: any[] = [];
  detailSickCycle: any = null;

  tabs = [
    { id: 'transactions', label: 'Leave Transactions', icon: 'fileText' },
    { id: 'balances', label: 'Leave Balances', icon: 'calendar' },
    { id: 'calendar', label: 'Leave Calendar', icon: 'calendar' },
    { id: 'policies', label: 'Leave Policies', icon: 'clipboard' },
    { id: 'reports', label: 'Leave Reports', icon: 'barChart' },
    { id: 'types', label: 'Leave Types', icon: 'settings' },
  ];

  monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  constructor(private api: ApiService, private ui: UiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadLookups();
    this.loadTransactions();
  }

  get statusCounts(): Record<string, number> {
    const counts: Record<string, number> = {};
    this.transactions.forEach(t => {
      counts[t.status] = (counts[t.status] || 0) + 1;
    });
    return counts;
  }

  get filteredTransactions(): any[] {
    if (!this.searchTerm) return this.transactions;
    const s = this.searchTerm.toLowerCase();
    return this.transactions.filter(t => {
      const text = `${t.employee_code} ${t.first_name} ${t.surname} ${t.leave_type_name}`.toLowerCase();
      return text.includes(s);
    });
  }

  get yearOptions(): number[] {
    const y = this.calendarYear;
    return [y - 2, y - 1, y, y + 1, y + 2];
  }

  get daysInMonth(): number {
    return new Date(this.calendarYear, this.calendarMonth, 0).getDate();
  }

  get calendarDayHeaders(): { day: number; isWeekend: boolean; isHoliday: string }[] {
    const headers = [];
    for (let d = 1; d <= this.daysInMonth; d++) {
      const dow = new Date(this.calendarYear, this.calendarMonth - 1, d).getDay();
      headers.push({
        day: d,
        isWeekend: dow === 0 || dow === 6,
        isHoliday: this.calendarHolidays[d] || ''
      });
    }
    return headers;
  }

  get calendarEmployees(): any[] {
    return this.calendarData?.employees || [];
  }

  loadLookups(): void {
    this.api.get<any[]>('/leave/types').subscribe({ next: (d) => this.leaveTypes = d || [] });
    this.api.get<any>('/employees', { limit: 500, sort_by: 'surname', sort_order: 'asc' }).subscribe({
      next: (d) => this.employees = (d as any)?.data || d || []
    });
  }

  loadTransactions(): void {
    this.loading = true;
    const params: any = { page: this.page, limit: this.limit };
    if (this.filters.status) params.status = this.filters.status;
    if (this.filters.leave_type_id) params.leave_type_id = this.filters.leave_type_id;

    this.api.getPaginated<any>('/leave/transactions', params).subscribe({
      next: (res) => {
        this.transactions = res.data || [];
        this.total = res.meta?.total || res.pagination?.total || 0;
        this.loading = false; this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  onFilterChange(): void {
    this.page = 1;
    this.loadTransactions();
  }

  onPageChange(p: number): void {
    this.page = p;
    this.loadTransactions();
  }

  setActiveView(view: string): void {
    this.activeView = view;
    if (view === 'calendar') this.loadCalendar();
    if (view === 'policies') this.loadPolicies();
    if (view === 'types') this.typesData = this.leaveTypes;
  }

  openModal(): void {
    const today = new Date().toISOString().split('T')[0];
    this.newLeave = { employee_id: '', leave_type_id: '', start_date: today, end_date: today, days: 1, reason: '' };
    this.balanceCheck = null;
    this.submitting = false;
    this.showModal = true;
  }

  calculateWorkingDays(): void {
    if (!this.newLeave.start_date || !this.newLeave.end_date) return;
    const start = new Date(this.newLeave.start_date);
    const end = new Date(this.newLeave.end_date);
    if (start > end) { this.newLeave.days = 0; return; }
    let count = 0;
    const current = new Date(start);
    while (current <= end) {
      const day = current.getDay();
      if (day !== 0 && day !== 6) count++;
      current.setDate(current.getDate() + 1);
    }
    this.newLeave.days = count;
    this.checkBalance();
  }

  checkBalance(): void {
    const empId = this.newLeave.employee_id;
    const typeId = this.newLeave.leave_type_id;
    const days = parseFloat(this.newLeave.days) || 0;
    if (!empId || !typeId) { this.balanceCheck = null; return; }

    this.api.getRaw<any>(`/leave/balances/${empId}`).subscribe({
      next: (res) => {
        const balData = res.data || [];
        const lt = this.leaveTypes.find(t => t.id == typeId);
        const bal = balData.find((b: any) => lt && b.code === lt.code);
        if (bal) {
          const available = parseFloat(bal.balance_days) || (parseFloat(bal.accrued_days) - parseFloat(bal.taken_days));
          this.balanceCheckInsufficient = days > 0 && available < days;
          this.balanceCheck = { ...bal, available };
          this.cdr.detectChanges();
        } else {
          this.balanceCheck = { notFound: true };
          this.balanceCheckInsufficient = false;
        }
      },
      error: () => { this.balanceCheck = null; }
    });
  }

  saveLeave(): void {
    if (!this.newLeave.employee_id || !this.newLeave.leave_type_id || !this.newLeave.start_date || !this.newLeave.end_date) {
      this.ui.toast('error', 'Validation Error', 'Please fill all required fields');
      return;
    }
    this.submitting = true;
    this.api.post('/leave/transactions', this.newLeave).subscribe({
      next: (res: any) => {
        this.ui.toast('success', 'Leave Request Submitted', `Leave request created successfully`);
        this.showModal = false;
        this.submitting = false;
        this.loadTransactions();
      },
      error: () => {
        this.ui.toast('error', 'Error', 'Failed to submit leave request');
        this.submitting = false;
      }
    });
  }

  async approveLeave(id: number): Promise<void> {
    const confirmed = await this.ui.confirm({
      title: 'Approve Leave Request',
      message: 'Are you sure you want to approve this leave request? The employee\'s leave balance will be updated.'
    });
    if (!confirmed) return;

    this.api.post(`/leave/transactions/${id}/approve`, {}).subscribe({
      next: () => {
        this.ui.toast('success', 'Leave Approved', 'Leave request approved successfully');
        this.loadTransactions();
      },
      error: () => this.ui.toast('error', 'Approval Failed', 'Failed to approve leave request')
    });
  }

  openRejectModal(id: number): void {
    this.rejectId = id;
    this.rejectReason = '';
    this.showRejectModal = true;
  }

  submitReject(): void {
    if (!this.rejectReason.trim()) {
      this.ui.toast('warning', 'Required', 'Please provide a reason for rejection');
      return;
    }
    this.api.post(`/leave/transactions/${this.rejectId}/reject`, { reason: this.rejectReason }).subscribe({
      next: () => {
        this.ui.toast('success', 'Leave Rejected', 'Leave request rejected');
        this.showRejectModal = false;
        this.loadTransactions();
      },
      error: () => this.ui.toast('error', 'Rejection Failed', 'Failed to reject leave request')
    });
  }

  showTransactionDetail(t: any): void {
    this.detailTransaction = t;
    this.detailBalances = [];
    this.detailSickCycle = null;
    this.showDetailModal = true;

    this.api.getRaw<any>(`/leave/balances/${t.employee_id}`).subscribe({
      next: (res) => this.detailBalances = res.data || [],
      error: () => {}
    });

    this.api.getRaw<any>(`/leave/sick-cycle/${t.employee_id}`).subscribe({
      next: (res) => this.detailSickCycle = res.data,
      error: () => {}
    });
  }

  onBalanceEmployeeChange(): void {
    if (!this.selectedBalanceEmployee) {
      this.balanceResults = [];
      this.balanceEmployee = null;
      return;
    }
    this.balanceLoading = true;
    this.balanceEmployee = this.employees.find(e => e.id == this.selectedBalanceEmployee);
    this.api.getRaw<any>(`/leave/balances/${this.selectedBalanceEmployee}`).subscribe({
      next: (res) => {
        this.balanceResults = (res.data || []).map((b: any) => {
          const available = parseFloat(b.balance_days) || (parseFloat(b.accrued_days || 0) - parseFloat(b.taken_days || 0));
          const entitlement = parseFloat(b.annual_entitlement || 0);
          const pct = entitlement > 0 ? Math.min((parseFloat(b.taken_days || 0) / entitlement) * 100, 100) : 0;
          return { ...b, available, entitlement, pct };
        });
        this.balanceLoading = false;
      },
      error: () => {
        this.balanceLoading = false;
        this.balanceResults = [];
      }
    });
  }

  getBalanceBarColor(pct: number): string {
    if (pct > 80) return '#EF4444';
    if (pct > 60) return '#F59E0B';
    return '#10B981';
  }

  loadCalendar(): void {
    this.calendarLoading = true;
    this.api.getRaw<any>(`/leave/calendar/${this.calendarYear}/${this.calendarMonth}`).subscribe({
      next: (res) => {
        this.calendarData = res.data;
        this.buildHolidayMap();
        this.calendarLoading = false;
       this.cdr.detectChanges(); },
      error: () => {
        this.calendarData = { employees: [], holidays: [] };
        this.calendarLoading = false;
      }
    });
  }

  buildHolidayMap(): void {
    this.calendarHolidays = {};
    const holidays = this.calendarData?.holidays || [];
    holidays.forEach((h: any) => {
      const d = new Date(h.holiday_date || h.date);
      if (d.getMonth() + 1 === this.calendarMonth && d.getFullYear() === this.calendarYear) {
        this.calendarHolidays[d.getDate()] = h.name || h.holiday_name;
      }
    });
  }

  calendarPrevMonth(): void {
    this.calendarMonth--;
    if (this.calendarMonth < 1) { this.calendarMonth = 12; this.calendarYear--; }
    this.loadCalendar();
  }

  calendarNextMonth(): void {
    this.calendarMonth++;
    if (this.calendarMonth > 12) { this.calendarMonth = 1; this.calendarYear++; }
    this.loadCalendar();
  }

  calendarMonthChange(): void { this.loadCalendar(); }
  calendarYearChange(): void { this.loadCalendar(); }

  getEmployeeLeaveDays(emp: any): Record<number, any> {
    const leaveDays: Record<number, any> = {};
    (emp.leaves || []).forEach((l: any) => {
      const start = new Date(l.start_date);
      const end = new Date(l.end_date);
      const cur = new Date(start);
      while (cur <= end) {
        if (cur.getMonth() + 1 === this.calendarMonth && cur.getFullYear() === this.calendarYear) {
          leaveDays[cur.getDate()] = { code: l.leave_type_code || 'AL', name: l.leave_type_name || 'Leave' };
        }
        cur.setDate(cur.getDate() + 1);
      }
    });
    return leaveDays;
  }

  getLeaveColor(code: string): string {
    const colors: Record<string, string> = {
      'AL': '#3B82F6', 'SL': '#F59E0B', 'FL': '#10B981', 'ML': '#8B5CF6',
      'PL': '#EC4899', 'SDL': '#06B6D4', 'UPL': '#6B7280', 'CL': '#14B8A6'
    };
    return colors[code] || '#4F6AFF';
  }

  getDayCellStyle(day: number, emp: any): Record<string, string> {
    const leaveDays = this.getEmployeeLeaveDays(emp);
    const leave = leaveDays[day];
    const dow = new Date(this.calendarYear, this.calendarMonth - 1, day).getDay();
    const isWeekend = dow === 0 || dow === 6;
    const isHoliday = !!this.calendarHolidays[day];
    const style: Record<string, string> = { 'text-align': 'center', 'font-size': '10px' };
    if (leave) {
      const color = this.getLeaveColor(leave.code);
      style['background'] = color + '20';
      style['color'] = color;
      style['font-weight'] = '600';
    } else if (isHoliday) {
      style['background'] = '#FEF3C7';
    } else if (isWeekend) {
      style['background'] = '#F3F4F6';
    }
    return style;
  }

  getDayCellContent(day: number, emp: any): string {
    const leaveDays = this.getEmployeeLeaveDays(emp);
    return leaveDays[day]?.code || '';
  }

  loadPolicies(): void {
    this.policiesLoading = true;
    this.api.getRaw<any>('/leave/policies').subscribe({
      next: (res) => {
        this.policies = res.data || [];
        this.policiesLoading = false;
       this.cdr.detectChanges(); },
      error: () => {
        this.policies = this.leaveTypes.map(t => ({
          id: t.id,
          leave_type_name: t.name,
          accrual_method: t.accrual_frequency || 'Monthly',
          accrual_amount: t.accrual_days || 0,
          max_balance: t.max_accumulation || 0,
          carry_over_limit: t.carry_over_limit || 0,
          cycle_months: t.cycle_months || 12,
          cycle_entitlement: t.accrual_days || 0
        }));
        this.policiesLoading = false;
      }
    });
  }

  loadBalanceReport(): void {
    this.reportType = 'balance';
    this.reportLoading = true;
    this.reportResults = null;
    this.api.getRaw<any>('/leave/reports/balance').subscribe({
      next: (res) => {
        this.reportResults = { balances: res.data || [] };
        this.reportLoading = false;
      },
      error: () => {
        this.reportResults = { balances: [] };
        this.reportLoading = false;
      }
    });
  }

  loadUtilisationReport(): void {
    this.reportType = 'utilisation';
    this.reportLoading = true;
    this.reportResults = null;
    this.api.getRaw<any>(`/leave/reports/utilisation`, { year: this.reportYear }).subscribe({
      next: (res) => {
        this.reportResults = { utilisation: res.data || [] };
        this.reportLoading = false;
      },
      error: () => {
        this.reportResults = { utilisation: [] };
        this.reportLoading = false;
      }
    });
  }

  loadLeaveLiability(): void {
    this.reportType = 'liability';
    this.reportLoading = true;
    this.reportResults = null;
    this.api.post('/payroll/leave-liability', {}).subscribe({
      next: (res: any) => {
        this.reportResults = { liability: res };
        this.reportLoading = false;
      },
      error: () => {
        this.reportResults = { liability: { total_liability: 0, details: [] } };
        this.reportLoading = false;
      }
    });
  }

  parseFloat(v: any): number { return parseFloat(v) || 0; }
  abs(v: number): number { return Math.abs(v); }
}
