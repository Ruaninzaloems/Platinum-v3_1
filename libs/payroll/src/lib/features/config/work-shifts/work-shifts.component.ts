import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { UiService } from '../../../core/services/ui.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { DateSaPipe } from '../../../shared/pipes/date-sa.pipe';
import { DateInputComponent } from '../../../shared/components/date-input/date-input.component';
import { TimeInputComponent } from '../../../shared/components/time-input/time-input.component';

@Component({
  selector: 'app-work-shifts',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, DateSaPipe, DateInputComponent, TimeInputComponent],
  templateUrl: './work-shifts.component.html',
  styleUrl: './work-shifts.component.css'
})
export class WorkShiftsComponent implements OnInit {
  shifts: any[] = [];
  loading = true;
  saving = false;

  showModal = false;
  editingId: number | null = null;
  search = '';

  form: any = this.emptyForm();

  readonly colorOptions = [
    '#1976D2','#388E3C','#F57C00','#7B1FA2','#D32F2F','#0097A7','#5D4037','#455A64'
  ];

  constructor(private api: ApiService, private ui: UiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.api.get<any>('/time/shifts').subscribe({
      next: (d: any) => { this.shifts = d?.data || d || []; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.shifts = []; this.loading = false; }
    });
  }

  get filtered(): any[] {
    const q = this.search.toLowerCase();
    return q ? this.shifts.filter(s => s.name?.toLowerCase().includes(q) || s.short_description?.toLowerCase().includes(q)) : this.shifts;
  }

  get enabledCount(): number { return this.shifts.filter(s => s.enabled).length; }
  get disabledCount(): number { return this.shifts.filter(s => !s.enabled).length; }

  emptyForm(): any {
    const today = new Date().toISOString().split('T')[0];
    return {
      name: '', short_description: '', shift_start_time: '08:00', shift_end_time: '17:00',
      total_hours: 8, night_hours: 0, color: '#1976D2', has_break: false,
      break_start_time: '', break_end_time: '', break_hours: 0,
      break_duration_minutes: 0, is_night_shift: false,
      enabled: true, start_date: today, end_date: ''
    };
  }

  openAdd(): void {
    this.editingId = null;
    this.form = this.emptyForm();
    this.showModal = true;
  }

  openEdit(s: any): void {
    this.editingId = s.id;
    this.form = {
      name: s.name || '', short_description: s.short_description || '',
      shift_start_time: s.shift_start_time ? s.shift_start_time.substring(0, 5) : '',
      shift_end_time: s.shift_end_time ? s.shift_end_time.substring(0, 5) : '',
      total_hours: s.total_hours || 0, night_hours: s.night_hours || 0,
      color: s.color || '#1976D2', has_break: s.has_break ?? false,
      break_start_time: s.break_start_time ? s.break_start_time.substring(0, 5) : '',
      break_end_time: s.break_end_time ? s.break_end_time.substring(0, 5) : '',
      break_hours: s.break_hours || 0, break_duration_minutes: s.break_duration_minutes || 0,
      is_night_shift: s.is_night_shift ?? false, enabled: s.enabled ?? true,
      start_date: s.start_date ? s.start_date.split('T')[0] : '',
      end_date: s.end_date ? s.end_date.split('T')[0] : ''
    };
    this.showModal = true;
  }

  autoCalcHours(): void {
    const toMins = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };
    if (this.form.shift_start_time && this.form.shift_end_time) {
      let shiftMins = toMins(this.form.shift_end_time) - toMins(this.form.shift_start_time);
      if (shiftMins < 0) shiftMins += 24 * 60;
      let breakMins = 0;
      if (this.form.has_break && this.form.break_start_time && this.form.break_end_time) {
        breakMins = toMins(this.form.break_end_time) - toMins(this.form.break_start_time);
        if (breakMins < 0) breakMins = 0;
        this.form.break_hours = +(breakMins / 60).toFixed(2);
        this.form.break_duration_minutes = breakMins;
      }
      this.form.total_hours = +((shiftMins - breakMins) / 60).toFixed(2);
    }
  }

  save(): void {
    const errs: string[] = [];
    if (!this.form.name?.trim()) errs.push('Shift name is required');
    if (!this.form.start_date) errs.push('Start date is required');
    if (!this.form.shift_start_time) errs.push('Shift start time is required');
    if (!this.form.shift_end_time) errs.push('Shift end time is required');
    if (this.form.has_break && !this.form.break_start_time) errs.push('Break start time is required');
    if (this.form.has_break && !this.form.break_end_time) errs.push('Break end time is required');
    if (errs.length) { this.ui.toast('error', 'Validation', errs.join('; ')); return; }

    this.saving = true;
    const payload = { ...this.form };
    if (!payload.has_break) {
      payload.break_start_time = null;
      payload.break_end_time = null;
      payload.break_hours = 0;
      payload.break_duration_minutes = 0;
    }
    const req = this.editingId
      ? this.api.put(`/time/shifts/${this.editingId}`, payload)
      : this.api.post('/time/shifts', payload);
    req.subscribe({
      next: () => {
        this.ui.toast('success', this.editingId ? 'Updated' : 'Created', 'Work shift saved');
        this.showModal = false; this.saving = false; this.load();
      },
      error: (e: any) => { this.ui.toast('error', 'Error', e?.error?.error?.message || 'Save failed'); this.saving = false; }
    });
  }

  async toggleEnabled(s: any): Promise<void> {
    const payload = { ...s, enabled: !s.enabled,
      shift_start_time: s.shift_start_time ? s.shift_start_time.substring(0, 5) : s.shift_start_time,
      shift_end_time: s.shift_end_time ? s.shift_end_time.substring(0, 5) : s.shift_end_time,
      break_start_time: s.break_start_time ? s.break_start_time.substring(0, 5) : null,
      break_end_time: s.break_end_time ? s.break_end_time.substring(0, 5) : null,
      start_date: s.start_date ? s.start_date.split('T')[0] : s.start_date
    };
    this.api.put(`/time/shifts/${s.id}`, payload).subscribe({
      next: () => { s.enabled = !s.enabled; this.cdr.detectChanges(); },
      error: () => this.ui.toast('error', 'Error', 'Failed to update')
    });
  }

  async disableShift(s: any): Promise<void> {
    const ok = await this.ui.confirm({ title: 'Disable Shift', message: `Disable "${s.name}"? The shift record is kept but marked inactive.` });
    if (!ok) return;
    this.api.delete(`/time/shifts/${s.id}`).subscribe({
      next: () => { this.ui.toast('success', 'Disabled', 'Shift deactivated'); this.load(); },
      error: (e: any) => this.ui.toast('error', 'Error', e?.error?.error?.message || 'Failed')
    });
  }

  shiftTypeBadge(s: any): string { return s.is_night_shift ? 'status-pending' : 'status-approved'; }
  shiftTypeLabel(s: any): string { return s.is_night_shift ? 'Night' : 'Day'; }
}
