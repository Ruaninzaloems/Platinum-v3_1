import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { UiService } from '../../../../core/services/ui.service';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { DateInputComponent } from '../../../../shared/components/date-input/date-input.component';
import { TimeInputComponent } from '../../../../shared/components/time-input/time-input.component';

@Component({
  selector: 'app-attendance',
  standalone: true,
  host: { 'data-accent': 'time-off' },
  imports: [CommonModule, FormsModule, IconComponent, PaginationComponent, DateInputComponent, TimeInputComponent],
  templateUrl: './attendance.component.html',
  styleUrl: './attendance.component.css'
})
export class AttendanceComponent implements OnInit {

  loading = true;
  records: any[] = [];
  total = 0;
  page = 1;
  limit = 25;

  dateFrom = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`; })();
  dateTo = new Date().toISOString().split('T')[0];
  employeeFilterId: number | null = null;
  filterEmployeeSearch = '';
  filterEmployees: any[] = [];
  exceptionFilter = '';
  payPointFilter: number | null = null;
  payPoints: any[] = [];
  deptFilter: number | null = null;
  divisionFilter: number | null = null;
  departments: any[] = [];
  divisions: any[] = [];

  selectedRow: any = null;
  dailyRecords: any[] = [];
  dailyLoading = false;

  showDrawer = false;
  showModal = false;
  editingId: number | null = null;

  inputMode: 'DAILY' | 'PERIOD' = 'DAILY';

  form: any = {
    employee_id: null,
    attendance_date: '',
    clock_in: '',
    clock_out: '',
    hours_worked: null,
    comment: '',
    period_start_date: '',
    period_end_date: '',
    status: 'PRESENT'
  };
  formEmployee: any = null;
  formEmployeeSearch = '';
  formEmployees: any[] = [];
  formEmployeeLoading = false;
  resolvedShift: any = null;
  shiftLoading = false;
  private shiftSeq = 0;
  hoursCalc: string | null = null;
  payrollPeriods: any[] = [];
  selectedPeriodId: number | null = null;
  formDocument: File | null = null;
  formDocumentName = '';

  stats: any = { total: 0, compliant: 0, exceptions: 0, avgHours: 0 };

  editingRecord: any = null;
  editComment = '';
  editClockIn = '';
  editClockOut = '';
  editStatus = 'PRESENT';
  editHours: number | null = null;
  editSaving = false;

  showImportModal = false;
  importFile: File | null = null;
  importFileName = '';
  importLoading = false;
  importResult: { imported: number; skipped: number; errors: Array<{ row: number; reason: string }>; date_range?: { min: string; max: string } | null } | null = null;

  constructor(private api: ApiService, private ui: UiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadPayPoints();
    this.loadFilterOptions();
    this.loadPayrollPeriods();
    this.loadRecords();
  }

  resolveShift(): void {
    if (!this.formEmployee || !this.form.attendance_date) {
      this.resolvedShift = null;
      this.shiftLoading = false;
      this.cdr.detectChanges();
      return;
    }
    this.shiftLoading = true;
    this.resolvedShift = null;
    this.cdr.detectChanges();
    const seq = ++this.shiftSeq;
    const empId = this.formEmployee.id;
    const d = this.form.attendance_date;
    this.api.getRaw<any>(`/time/employees/${empId}/shift-roster`, { date_from: d, date_to: d }).subscribe({
      next: (res: any) => {
        if (seq !== this.shiftSeq) return;
        const entry = (res?.data || [])[0];
        this.resolvedShift = entry ?? { is_off: true, no_coverage: true };
        this.shiftLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        if (seq !== this.shiftSeq) return;
        this.resolvedShift = { is_off: true, no_coverage: true };
        this.shiftLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onShiftDateChange(date: string): void {
    this.form.attendance_date = date;
    if (this.formEmployee) {
      this.resolveShift();
    }
  }

  formatTime(t: any): string {
    if (!t) return '';
    return String(t).substring(0, 5);
  }

  loadPayPoints(): void {
    this.api.getRaw<any>('/time/attendance/pay-points', {}).subscribe({
      next: (res: any) => { this.payPoints = res?.data || []; this.cdr.detectChanges(); },
      error: () => {}
    });
  }

  loadFilterOptions(): void {
    this.api.getRaw<any>('/time/attendance/filter-options', {}).subscribe({
      next: (res: any) => {
        this.departments = res?.data?.departments || [];
        this.divisions = res?.data?.divisions || [];
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  loadPayrollPeriods(): void {
    this.api.getPaginated<any>('/payroll/periods', { limit: 100 }).subscribe({
      next: (res: any) => { this.payrollPeriods = res.data || []; this.cdr.detectChanges(); },
      error: () => {}
    });
  }

  onPeriodSelect(): void {
    const p = this.payrollPeriods.find(x => x.id === Number(this.selectedPeriodId));
    if (p) {
      this.form.period_start_date = String(p.start_date).split('T')[0];
      this.form.period_end_date = String(p.end_date).split('T')[0];
    }
    this.cdr.detectChanges();
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.formDocument = input.files[0];
      this.formDocumentName = input.files[0].name;
    } else {
      this.formDocument = null;
      this.formDocumentName = '';
    }
    this.cdr.detectChanges();
  }

  onFilterChange(): void {
    this.page = 1;
    this.loadRecords();
  }

  loadRecords(): void {
    this.loading = true;
    const params: any = { page: this.page, limit: this.limit };
    if (this.dateFrom) params.date_from = this.dateFrom;
    if (this.dateTo) params.date_to = this.dateTo;
    if (this.employeeFilterId) params.employee_id = this.employeeFilterId;
    if (this.exceptionFilter) params.exception_filter = this.exceptionFilter;
    if (this.payPointFilter) params.pay_point_id = this.payPointFilter;
    if (this.deptFilter) params.dept_id = this.deptFilter;
    if (this.divisionFilter) params.division_id = this.divisionFilter;
    params.summary = true;

    this.api.getPaginated<any>('/time/attendance', params).subscribe({
      next: (res: any) => {
        this.records = res.data || [];
        this.total = res.meta?.total || 0;
        this.computeStats();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.records = []; this.loading = false; this.cdr.detectChanges(); }
    });
  }

  computeStats(): void {
    const total = this.records.length;
    const compliant = this.records.filter(r => !r.exception_count || r.exception_count === 0).length;
    const exceptions = total - compliant;
    const avgHours = total > 0 ? this.records.reduce((s, r) => s + (parseFloat(r.time_worked) || 0), 0) / total : 0;
    this.stats = { total, compliant, exceptions, avgHours: avgHours.toFixed(1) };
  }

  onPageChange(p: number): void {
    this.page = p;
    this.loadRecords();
  }

  selectRow(row: any): void {
    this.selectedRow = row;
    this.showDrawer = true;
    this.loadDaily(row.employee_id);
  }

  closeDrawer(): void {
    this.showDrawer = false;
    this.selectedRow = null;
    this.dailyRecords = [];
    this.editingRecord = null;
  }

  loadDaily(employeeId: number): void {
    this.dailyLoading = true;
    this.dailyRecords = [];
    const params: any = {};
    if (this.dateFrom) params.date_from = this.dateFrom;
    if (this.dateTo) params.date_to = this.dateTo;
    this.api.getRaw<any>(`/time/attendance/${employeeId}/daily`, params).subscribe({
      next: (res: any) => {
        this.dailyRecords = res.data || [];
        this.dailyLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.dailyRecords = []; this.dailyLoading = false; this.cdr.detectChanges(); }
    });
  }

  startEditRecord(rec: any): void {
    this.editingRecord = rec;
    this.editComment = rec.comment || '';
    this.editClockIn = rec.clock_in ? this.extractTime(rec.clock_in) : '';
    this.editClockOut = rec.clock_out ? this.extractTime(rec.clock_out) : '';
    this.editStatus = rec.status || 'PRESENT';
    this.editHours = rec.hours_worked ? parseFloat(rec.hours_worked) : null;
    this.cdr.detectChanges();
  }

  cancelEdit(): void {
    this.editingRecord = null;
    this.cdr.detectChanges();
  }

  saveEdit(): void {
    if (!this.editingRecord) return;
    this.editSaving = true;
    const dateStr = String(this.editingRecord.attendance_date).split('T')[0];
    const body: any = {
      comment: this.editComment,
      status: this.editStatus,
      clock_in: this.editClockIn ? `${dateStr}T${this.editClockIn}:00` : null,
      clock_out: this.editClockOut ? `${dateStr}T${this.editClockOut}:00` : null,
    };
    if (this.editingRecord.input_mode === 'PERIOD') {
      body.hours_worked = this.editHours;
    }
    this.api.put(`/time/attendance/${this.editingRecord.id}`, body).subscribe({
      next: () => {
        this.ui.toast('success', 'Saved', 'Attendance record updated');
        this.editSaving = false;
        this.editingRecord = null;
        this.loadDaily(this.selectedRow.employee_id);
        this.loadRecords();
        this.cdr.detectChanges();
      },
      error: (e: any) => {
        this.ui.toast('error', 'Error', e?.error?.error?.message || 'Failed to save');
        this.editSaving = false;
        this.cdr.detectChanges();
      }
    });
  }

  openAddModal(): void {
    this.showDrawer = false;
    this.selectedRow = null;
    const today = new Date().toISOString().split('T')[0];
    this.form = {
      employee_id: null,
      attendance_date: today,
      clock_in: '',
      clock_out: '',
      hours_worked: null,
      comment: '',
      period_start_date: this.dateFrom || today,
      period_end_date: this.dateTo || today,
      status: 'PRESENT'
    };
    this.formEmployee = null;
    this.formEmployeeSearch = '';
    this.formEmployees = [];
    this.resolvedShift = null;
    this.shiftLoading = false;
    this.inputMode = 'DAILY';
    this.hoursCalc = null;
    this.editingId = null;
    this.selectedPeriodId = null;
    this.formDocument = null;
    this.formDocumentName = '';
    this.showModal = true;
    this.cdr.detectChanges();
  }

  closeModal(): void {
    this.showModal = false;
    this.editingId = null;
    this.cdr.detectChanges();
  }

  searchFormEmployees(): void {
    if (!this.formEmployeeSearch || this.formEmployeeSearch.length < 2) {
      this.formEmployees = [];
      this.cdr.detectChanges();
      return;
    }
    this.formEmployeeLoading = true;
    this.api.getPaginated<any>('/employees', { search: this.formEmployeeSearch, limit: 15 }).subscribe({
      next: (res: any) => {
        this.formEmployees = res.data || [];
        this.formEmployeeLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.formEmployees = []; this.formEmployeeLoading = false; this.cdr.detectChanges(); }
    });
  }

  selectFormEmployee(emp: any): void {
    this.formEmployee = emp;
    this.form.employee_id = emp.id;
    this.formEmployeeSearch = `${emp.id} | ${emp.employee_code} - ${emp.first_name} ${emp.surname}`;
    this.formEmployees = [];
    if (this.form.attendance_date) {
      this.resolveShift();
    } else {
      this.cdr.detectChanges();
    }
  }

  clearFormEmployee(): void {
    this.formEmployee = null;
    this.form.employee_id = null;
    this.formEmployeeSearch = '';
    this.resolvedShift = null;
    this.shiftLoading = false;
    this.shiftSeq++;
    this.cdr.detectChanges();
  }

  onTimeChange(): void {
    if (this.form.clock_in && this.form.clock_out) {
      const date = this.form.attendance_date || '2026-06-01';
      const inMs = new Date(`${date}T${this.form.clock_in}:00`).getTime();
      const outMs = new Date(`${date}T${this.form.clock_out}:00`).getTime();
      if (outMs > inMs) {
        const hrs = (outMs - inMs) / 3600000;
        this.form.hours_worked = parseFloat(hrs.toFixed(2));
        this.hoursCalc = `${hrs.toFixed(1)} hours`;
      } else {
        this.hoursCalc = null;
      }
    } else {
      this.hoursCalc = null;
    }
    this.cdr.detectChanges();
  }

  submitForm(): void {
    if (!this.form.employee_id) { this.ui.toast('error', 'Validation', 'Please select an employee'); return; }
    if (this.inputMode === 'DAILY' && !this.form.attendance_date) { this.ui.toast('error', 'Validation', 'Date is required'); return; }
    if (this.inputMode === 'PERIOD' && (!this.form.period_start_date || !this.form.hours_worked)) {
      this.ui.toast('error', 'Validation', 'Payroll period and hours worked are required'); return;
    }
    if (!this.form.comment || !String(this.form.comment).trim()) {
      this.ui.toast('error', 'Validation', 'Comment / Reason is required for manual attendance records'); return;
    }

    const body: any = {
      employee_id: this.form.employee_id,
      status: this.form.status,
      comment: this.form.comment,
      shift_id: this.resolvedShift?.shift_id || null,
      input_mode: this.inputMode,
      source: 'MANUAL'
    };

    if (this.inputMode === 'DAILY') {
      const date = this.form.attendance_date;
      body.attendance_date = date;
      body.period_start_date = date;
      body.period_end_date = date;
      body.clock_in = this.form.clock_in ? `${date}T${this.form.clock_in}:00` : null;
      body.clock_out = this.form.clock_out ? `${date}T${this.form.clock_out}:00` : null;
      body.hours_worked = this.form.hours_worked;
    } else {
      body.attendance_date = this.form.period_start_date;
      body.period_start_date = this.form.period_start_date;
      body.period_end_date = this.form.period_end_date;
      body.hours_worked = this.form.hours_worked;
    }

    this.api.post('/time/attendance', body).subscribe({
      next: () => {
        this.ui.toast('success', 'Recorded', 'Attendance record created successfully');
        this.showModal = false;
        this.loadRecords();
        this.cdr.detectChanges();
      },
      error: (e: any) => this.ui.toast('error', 'Error', e?.error?.error?.message || 'Failed to create record')
    });
  }

  exportExcel(): void {
    const params = new URLSearchParams();
    if (this.dateFrom) params.set('date_from', this.dateFrom);
    if (this.dateTo) params.set('date_to', this.dateTo);
    if (this.employeeFilterId) params.set('employee_id', String(this.employeeFilterId));
    if (this.exceptionFilter) params.set('exception_filter', this.exceptionFilter);
    if (this.payPointFilter) params.set('pay_point_id', String(this.payPointFilter));
    if (this.deptFilter) params.set('dept_id', String(this.deptFilter));
    if (this.divisionFilter) params.set('division_id', String(this.divisionFilter));
    const url = `/payroll-app/api/time/attendance/export?${params.toString()}`;
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_summary_${this.dateFrom}_${this.dateTo}.xlsx`;
    a.click();
  }

  searchFilterEmployees(): void {
    if (!this.filterEmployeeSearch || this.filterEmployeeSearch.length < 2) {
      this.filterEmployees = [];
      this.cdr.detectChanges();
      return;
    }
    this.api.getPaginated<any>('/employees', { search: this.filterEmployeeSearch, limit: 15 }).subscribe({
      next: (res: any) => { this.filterEmployees = res.data || []; this.cdr.detectChanges(); },
      error: () => { this.filterEmployees = []; }
    });
  }

  selectFilterEmployee(emp: any): void {
    this.employeeFilterId = emp.id;
    this.filterEmployeeSearch = `${emp.id} | ${emp.employee_code} - ${emp.first_name} ${emp.surname}`;
    this.filterEmployees = [];
    this.onFilterChange();
  }

  clearEmployeeFilter(): void {
    this.employeeFilterId = null;
    this.filterEmployeeSearch = '';
    this.filterEmployees = [];
    this.onFilterChange();
  }

  fmtHours(v: any): string {
    const n = parseFloat(v) || 0;
    return n.toFixed(1) + 'h';
  }

  fmtVariance(v: any): string {
    const n = parseFloat(v) || 0;
    return (n >= 0 ? '+' : '') + n.toFixed(1) + 'h';
  }

  varianceClass(v: any): string {
    const n = parseFloat(v) || 0;
    if (n > 0.5) return 'var-positive';
    if (n < -0.5) return 'var-negative';
    return 'var-neutral';
  }

  exceptionBadgeClass(types: string): string {
    if (!types) return 'exc-compliant';
    if (types.includes('MISSING')) return 'exc-missing';
    if (types.includes('ABNORMAL')) return 'exc-abnormal';
    if (types.includes('LATE')) return 'exc-late';
    if (types.includes('EARLY')) return 'exc-early';
    return 'exc-other';
  }

  exceptionLabel(types: string, count: number): string {
    if (!types || count === 0) return 'Compliant';
    const parts: string[] = [];
    if (types.includes('MISSING_CLOCKING')) parts.push('Missing Clocking');
    if (types.includes('LATE_ARRIVAL')) parts.push('Late Arrival');
    if (types.includes('EARLY_DEPARTURE')) parts.push('Early Departure');
    if (types.includes('ABNORMAL_HOURS')) parts.push('Abnormal Hours');
    if (types.includes('SHORT_TIME')) parts.push('Short Time');
    return parts.length > 0 ? parts.join(' / ') : types;
  }

  extractTime(ts: any): string {
    if (!ts) return '';
    const str = String(ts);
    const t = str.includes('T') ? str.split('T')[1] : str;
    return t ? t.substring(0, 5) : '';
  }

  formatDateTime(ts: any): string {
    if (!ts) return '—';
    const str = String(ts);
    const t = str.includes('T') ? str.split('T')[1] : str;
    return t ? t.substring(0, 5) : '—';
  }

  formatDate(d: any): string {
    if (!d) return '—';
    const str = String(d).split('T')[0];
    const [y, m, dd] = str.split('-');
    return `${dd}/${m}/${y}`;
  }

  dayOfWeek(d: any): string {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dt = new Date(String(d).split('T')[0]);
    return days[dt.getDay()];
  }

  downloadAttendanceTemplate(): void {
    this.api.getBlob('/time/attendance/template').subscribe({
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

  openImportModal(): void {
    this.showImportModal = true;
    this.importFile = null;
    this.importFileName = '';
    this.importResult = null;
    this.importLoading = false;
    this.cdr.detectChanges();
  }

  closeImportModal(): void {
    const importedCount = this.importResult?.imported ?? 0;
    const rangeMax = this.importResult?.date_range?.max ?? null;
    this.showImportModal = false;
    this.importFile = null;
    this.importResult = null;
    this.cdr.detectChanges();
    if (importedCount > 0) {
      if (rangeMax && rangeMax > this.dateTo) {
        this.dateTo = rangeMax;
      }
      this.loadRecords();
    }
  }

  onImportFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.importFile = input.files[0];
      this.importFileName = input.files[0].name;
      this.importResult = null;
    } else {
      this.importFile = null;
      this.importFileName = '';
    }
    this.cdr.detectChanges();
  }

  submitBulkImport(): void {
    if (!this.importFile) return;
    this.importLoading = true;
    this.importResult = null;
    this.cdr.detectChanges();
    const fd = new FormData();
    fd.append('file', this.importFile);
    this.api.postFormData<{ imported: number; skipped: number; errors: Array<{ row: number; reason: string }>; date_range?: { min: string; max: string } | null }>('/time/attendance/bulk-import', fd)
      .subscribe({
        next: (result) => {
          this.importLoading = false;
          this.importResult = result;
          if (result && result.imported > 0) {
            this.ui.toast('success', 'Import Complete', `${result.imported} record(s) imported`);
            this.loadRecords();
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.importLoading = false;
          const msg = err?.error?.error?.message || 'Could not process the file. Check the format and try again.';
          this.ui.toast('error', 'Import Failed', msg);
          this.cdr.detectChanges();
        }
      });
  }
}
