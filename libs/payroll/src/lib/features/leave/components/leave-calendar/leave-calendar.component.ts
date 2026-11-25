import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LeaveManagementService } from '../../services/leave-management.service';
import { ApiService } from '../../../../core/services/api.service';
import { map } from 'rxjs/operators';

interface CalendarDay {
  date: Date;
  dateStr: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}

interface CalendarEvent {
  id: number;
  employeeId: number;
  employeeCode: string;
  firstName: string;
  surname: string;
  leaveTypeName: string;
  leaveTypeCode: string;
  calendarColor: string;
  startDate: string;
  endDate: string;
  days: number;
}

@Component({
  selector: 'app-leave-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './leave-calendar.component.html',
  styleUrls: ['./leave-calendar.component.css']
})
export class LeaveCalendarComponent implements OnInit {
  viewMode: 'month' | 'week' = 'month';
  currentDate = new Date();
  currentYear = this.currentDate.getFullYear();
  currentMonth = this.currentDate.getMonth();

  weekStartDate = this.startOfWeek(new Date());

  loading = false;
  events: CalendarEvent[] = [];

  departments: any[] = [];
  divisions: any[] = [];
  filteredDivisions: any[] = [];

  filters = {
    department_id: '',
    division_id: ''
  };

  calendarWeeks: CalendarDay[][] = [];
  weekDays: CalendarDay[] = [];

  dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  leaveTypeLegend: { name: string; code: string; color: string }[] = [];

  tooltipEvent: CalendarEvent | null = null;
  tooltipDay: string = '';

  constructor(
    private leaveSvc: LeaveManagementService,
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  nearestMonthHint: string = '';

  ngOnInit(): void {
    this.loadDepartments();
    this.loadDataThenAutoNavigate();
  }

  loadDataThenAutoNavigate(): void {
    const { dateFrom, dateTo } = this.getDateRange();
    this.loading = true;
    const params: any = { date_from: dateFrom, date_to: dateTo };
    if (this.filters.department_id) params.department_id = this.filters.department_id;
    if (this.filters.division_id) params.division_id = this.filters.division_id;

    this.leaveSvc.getCalendarEvents(params).subscribe({
      next: (data: any[]) => {
        const events = data.map((r: any) => ({
          id: r.id,
          employeeId: r.emp_id,
          employeeCode: r.employee_code,
          firstName: r.first_name,
          surname: r.surname,
          leaveTypeName: r.leave_type_name,
          leaveTypeCode: r.leave_type_code,
          calendarColor: r.calendar_color || '#3b82f6',
          startDate: r.start_date ? String(r.start_date).substring(0, 10) : r.start_date,
          endDate: r.end_date ? String(r.end_date).substring(0, 10) : r.end_date,
          days: r.days
        }));

        if (events.length === 0) {
          this.events = [];
          this.buildLegend();
          this.buildCalendar();
          this.loading = false;
          this.cdr.detectChanges();
          this.searchNearestAndNavigate();
        } else {
          this.events = events;
          this.nearestMonthHint = '';
          this.buildLegend();
          this.buildCalendar();
          this.loading = false;
          this.cdr.detectChanges();
        }
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  private searchNearestAndNavigate(): void {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth() - 6, 1);
    const to = new Date(now.getFullYear(), now.getMonth() + 6, 0);
    const wideParams: any = { date_from: this.fmt(from), date_to: this.fmt(to) };
    if (this.filters.department_id) wideParams.department_id = this.filters.department_id;
    if (this.filters.division_id) wideParams.division_id = this.filters.division_id;

    this.leaveSvc.getCalendarEvents(wideParams).subscribe({
      next: (data: any[]) => {
        if (data.length === 0) { this.nearestMonthHint = ''; this.cdr.detectChanges(); return; }
        const today = this.fmt(new Date());
        const normed = data.map((r: any) => ({
          ...r,
          start_date: r.start_date ? String(r.start_date).substring(0, 10) : r.start_date
        }));
        const past = normed.filter(r => r.start_date <= today).sort((a: any, b: any) => b.start_date.localeCompare(a.start_date));
        const future = normed.filter(r => r.start_date > today).sort((a: any, b: any) => a.start_date.localeCompare(b.start_date));
        const nearest = future[0] || past[0];
        if (!nearest) { this.cdr.detectChanges(); return; }
        const d = new Date(nearest.start_date);
        this.currentYear = d.getFullYear();
        this.currentMonth = d.getMonth();
        this.nearestMonthHint = '';
        this.loadData();
      },
      error: () => { this.cdr.detectChanges(); }
    });
  }

  loadDepartments(): void {
    this.api.getRaw<any>('/departments').pipe(
      map((res: any) => res?.data || [])
    ).subscribe({
      next: (data: any[]) => {
        this.departments = data;
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  onDepartmentChange(): void {
    this.filters.division_id = '';
    this.filteredDivisions = [];
    if (!this.filters.department_id) { this.loadData(); return; }
    this.api.getRaw<any>(`/departments/${this.filters.department_id}/divisions`).pipe(
      map((res: any) => res?.data || [])
    ).subscribe({
      next: (data: any[]) => { this.filteredDivisions = data; this.cdr.detectChanges(); },
      error: () => {}
    });
    this.loadData();
  }

  onDivisionChange(): void {
    this.loadData();
  }

  get monthLabel(): string {
    return new Date(this.currentYear, this.currentMonth, 1)
      .toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' });
  }

  get weekLabel(): string {
    const end = new Date(this.weekStartDate);
    end.setDate(end.getDate() + 6);
    const fmt = (d: Date) => d.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short' });
    return `${fmt(this.weekStartDate)} – ${fmt(end)}, ${end.getFullYear()}`;
  }

  prevPeriod(): void {
    if (this.viewMode === 'month') {
      this.currentMonth--;
      if (this.currentMonth < 0) { this.currentMonth = 11; this.currentYear--; }
    } else {
      const d = new Date(this.weekStartDate);
      d.setDate(d.getDate() - 7);
      this.weekStartDate = d;
    }
    this.loadData();
  }

  nextPeriod(): void {
    if (this.viewMode === 'month') {
      this.currentMonth++;
      if (this.currentMonth > 11) { this.currentMonth = 0; this.currentYear++; }
    } else {
      const d = new Date(this.weekStartDate);
      d.setDate(d.getDate() + 7);
      this.weekStartDate = d;
    }
    this.loadData();
  }

  goToToday(): void {
    const now = new Date();
    this.currentYear = now.getFullYear();
    this.currentMonth = now.getMonth();
    this.weekStartDate = this.startOfWeek(now);
    this.loadData();
  }

  setView(mode: 'month' | 'week'): void {
    this.viewMode = mode;
    this.loadData();
  }

  loadData(): void {
    const { dateFrom, dateTo } = this.getDateRange();
    this.loading = true;
    const params: any = { date_from: dateFrom, date_to: dateTo };
    if (this.filters.department_id) params.department_id = this.filters.department_id;
    if (this.filters.division_id) params.division_id = this.filters.division_id;

    this.leaveSvc.getCalendarEvents(params).subscribe({
      next: (data: any[]) => {
        this.events = data.map(r => ({
          id: r.id,
          employeeId: r.emp_id,
          employeeCode: r.employee_code,
          firstName: r.first_name,
          surname: r.surname,
          leaveTypeName: r.leave_type_name,
          leaveTypeCode: r.leave_type_code,
          calendarColor: r.calendar_color || '#3b82f6',
          startDate: r.start_date ? String(r.start_date).substring(0, 10) : r.start_date,
          endDate: r.end_date ? String(r.end_date).substring(0, 10) : r.end_date,
          days: r.days
        }));
        this.buildLegend();
        this.buildCalendar();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  private getDateRange(): { dateFrom: string; dateTo: string } {
    if (this.viewMode === 'month') {
      const first = new Date(this.currentYear, this.currentMonth, 1);
      const last = new Date(this.currentYear, this.currentMonth + 1, 0);
      return { dateFrom: this.fmt(first), dateTo: this.fmt(last) };
    } else {
      const end = new Date(this.weekStartDate);
      end.setDate(end.getDate() + 6);
      return { dateFrom: this.fmt(this.weekStartDate), dateTo: this.fmt(end) };
    }
  }

  private buildLegend(): void {
    const seen = new Map<string, { name: string; code: string; color: string }>();
    for (const e of this.events) {
      if (!seen.has(e.leaveTypeCode)) {
        seen.set(e.leaveTypeCode, { name: e.leaveTypeName, code: e.leaveTypeCode, color: e.calendarColor });
      }
    }
    this.leaveTypeLegend = Array.from(seen.values());
  }

  private buildCalendar(): void {
    if (this.viewMode === 'month') {
      this.buildMonthCalendar();
    } else {
      this.buildWeekCalendar();
    }
  }

  private buildMonthCalendar(): void {
    const firstOfMonth = new Date(this.currentYear, this.currentMonth, 1);
    const lastOfMonth = new Date(this.currentYear, this.currentMonth + 1, 0);
    const today = this.fmt(new Date());

    const startDay = new Date(firstOfMonth);
    startDay.setDate(startDay.getDate() - startDay.getDay());

    const endDay = new Date(lastOfMonth);
    const remaining = 6 - endDay.getDay();
    endDay.setDate(endDay.getDate() + remaining);

    this.calendarWeeks = [];
    const cur = new Date(startDay);
    while (cur <= endDay) {
      const week: CalendarDay[] = [];
      for (let d = 0; d < 7; d++) {
        const dateStr = this.fmt(cur);
        week.push({
          date: new Date(cur),
          dateStr,
          isCurrentMonth: cur.getMonth() === this.currentMonth,
          isToday: dateStr === today,
          events: this.eventsForDate(dateStr)
        });
        cur.setDate(cur.getDate() + 1);
      }
      this.calendarWeeks.push(week);
    }
  }

  private buildWeekCalendar(): void {
    const today = this.fmt(new Date());
    this.weekDays = [];
    const cur = new Date(this.weekStartDate);
    for (let d = 0; d < 7; d++) {
      const dateStr = this.fmt(cur);
      this.weekDays.push({
        date: new Date(cur),
        dateStr,
        isCurrentMonth: cur.getMonth() === this.currentMonth,
        isToday: dateStr === today,
        events: this.eventsForDate(dateStr)
      });
      cur.setDate(cur.getDate() + 1);
    }
  }

  private eventsForDate(dateStr: string): CalendarEvent[] {
    return this.events.filter(e => e.startDate <= dateStr && e.endDate >= dateStr);
  }

  private startOfWeek(d: Date): Date {
    const clone = new Date(d);
    clone.setDate(clone.getDate() - clone.getDay());
    return clone;
  }

  private fmt(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  eventStyle(event: CalendarEvent): Record<string, string> {
    const color = event.calendarColor || '#3b82f6';
    return {
      'background-color': this.hexToRgba(color, 0.15),
      'border-left': `3px solid ${color}`,
      'color': this.darken(color)
    };
  }

  legendStyle(color: string): Record<string, string> {
    return { 'background-color': color };
  }

  private hexToRgba(hex: string, alpha: number): string {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  private darken(hex: string): string {
    try {
      const clean = hex.replace('#', '');
      const r = Math.max(0, parseInt(clean.substring(0, 2), 16) - 60);
      const g = Math.max(0, parseInt(clean.substring(2, 4), 16) - 60);
      const b = Math.max(0, parseInt(clean.substring(4, 6), 16) - 60);
      return `rgb(${r},${g},${b})`;
    } catch { return '#1e293b'; }
  }

  totalOnLeaveToday(): number {
    const today = this.fmt(new Date());
    return this.events.filter(e => e.startDate <= today && e.endDate >= today).length;
  }

  totalInView(): number {
    return new Set(this.events.map(e => e.id)).size;
  }

  fmtDateDisplay(s: string): string {
    if (!s) return '';
    return new Date(s).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
