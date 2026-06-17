import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { UiService } from '../../../core/services/ui.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { DateSaPipe } from '../../../shared/pipes/date-sa.pipe';
import { DateInputComponent } from '../../../shared/components/date-input/date-input.component';

@Component({
  selector: 'app-shift-rotations',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, DateSaPipe, DateInputComponent],
  templateUrl: './shift-rotations.component.html',
  styleUrl: './shift-rotations.component.css'
})
export class ShiftRotationsComponent implements OnInit {
  rotations: any[] = [];
  shifts: any[] = [];
  conditions: any[] = [];
  subtypes: any[] = [];

  loading = true;
  saving = false;
  savingHeader = false;

  showRotationModal = false;
  showWeekModal = false;
  editingId: number | null = null;
  editingWeekId: number | null = null;
  selectedRotation: any = null;
  headerForm: any = {};
  weeks: any[] = [];
  weeksLoading = false;

  search = '';

  form: any = {};
  weekForm: any = {};

  readonly DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'] as const;
  readonly DAY_LABELS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

  constructor(private api: ApiService, private ui: UiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.loadAll(); }

  loadAll(): void {
    this.loading = true;
    let done = 0;
    const check = () => { if (++done >= 4) { this.loading = false; this.cdr.detectChanges(); } };
    this.api.get<any>('/time/shift-rotations').subscribe({ next: (d: any) => { this.rotations = d?.data || d || []; if (!this.selectedRotation && this.rotations.length > 0) { this.selectRotation(this.rotations[0]); } check(); }, error: () => check() });
    this.api.get<any>('/time/shifts?enabled=true').subscribe({ next: (d: any) => { this.shifts = d?.data || d || []; check(); }, error: () => check() });
    this.api.get<any>('/settings/conditions-of-service').subscribe({ next: (d: any) => { this.conditions = d?.data || d || []; check(); }, error: () => check() });
    this.api.get<any>('/settings/employee-subtypes').subscribe({ next: (d: any) => { this.subtypes = d?.data || d || []; check(); }, error: () => check() });
  }

  get filtered(): any[] {
    const q = this.search.toLowerCase();
    return q ? this.rotations.filter(r => r.name?.toLowerCase().includes(q)) : this.rotations;
  }

  emptyForm(): any {
    const today = new Date().toISOString().split('T')[0];
    return { name: '', short_description: '', description: '', condition_of_service_id: '', employee_subtype_id: '', start_date: today, end_date: '', no_of_weeks: 1, enabled: true };
  }

  openAdd(): void { this.editingId = null; this.form = this.emptyForm(); this.showRotationModal = true; }

  openEdit(r: any): void {
    this.editingId = r.id;
    this.form = {
      name: r.name || '', short_description: r.short_description || '', description: r.description || '',
      condition_of_service_id: r.condition_of_service_id || '', employee_subtype_id: r.employee_subtype_id || '',
      start_date: r.start_date ? r.start_date.split('T')[0] : '',
      end_date: r.end_date && !r.end_date.startsWith('9999') ? r.end_date.split('T')[0] : '',
      no_of_weeks: r.no_of_weeks || 1, enabled: r.enabled ?? true
    };
    this.showRotationModal = true;
  }

  save(): void {
    if (!this.form.name?.trim()) { this.ui.toast('error', 'Validation', 'Rotation name is required'); return; }
    this.saving = true;
    const payload = { ...this.form };
    if (!payload.condition_of_service_id) payload.condition_of_service_id = null;
    if (!payload.employee_subtype_id) payload.employee_subtype_id = null;
    if (!payload.end_date) payload.end_date = '9999-12-31';
    const req = this.editingId
      ? this.api.put(`/time/shift-rotations/${this.editingId}`, payload)
      : this.api.post('/time/shift-rotations', payload);
    req.subscribe({
      next: (resp: any) => {
        this.ui.toast('success', this.editingId ? 'Updated' : 'Created', 'Rotation saved');
        this.showRotationModal = false; this.saving = false; this.loadAll();
      },
      error: (e: any) => { this.ui.toast('error', 'Error', e?.error?.error?.message || 'Save failed'); this.saving = false; }
    });
  }

  /** Save the inline header form from the detail pane */
  saveHeader(): void {
    if (!this.headerForm.name?.trim()) { this.ui.toast('error', 'Validation', 'Rotation name is required'); return; }
    this.savingHeader = true;
    const payload = { ...this.headerForm };
    if (!payload.condition_of_service_id) payload.condition_of_service_id = null;
    if (!payload.employee_subtype_id) payload.employee_subtype_id = null;
    if (!payload.end_date) payload.end_date = '9999-12-31';
    this.api.put(`/time/shift-rotations/${this.selectedRotation.id}`, payload).subscribe({
      next: (resp: any) => {
        this.ui.toast('success', 'Saved', 'Rotation header updated');
        this.savingHeader = false;
        const updated = resp?.data || resp;
        const idx = this.rotations.findIndex((r: any) => r.id === this.selectedRotation.id);
        if (idx >= 0) this.rotations[idx] = { ...this.rotations[idx], ...updated };
        this.selectedRotation = { ...this.selectedRotation, ...updated };
        this.cdr.detectChanges();
      },
      error: (e: any) => { this.ui.toast('error', 'Error', e?.error?.error?.message || 'Save failed'); this.savingHeader = false; }
    });
  }

  async deleteRotation(r: any): Promise<void> {
    const ok = await this.ui.confirm({ title: 'Delete Rotation', message: `Delete "${r.name}"? All week lines will be removed.` });
    if (!ok) return;
    this.api.delete(`/time/shift-rotations/${r.id}`).subscribe({
      next: () => {
        this.ui.toast('success', 'Deleted', 'Rotation removed'); this.loadAll();
        if (this.selectedRotation?.id === r.id) { this.selectedRotation = null; this.weeks = []; }
      },
      error: (e: any) => this.ui.toast('error', 'Error', e?.error?.error?.message || 'Delete failed')
    });
  }

  selectRotation(r: any): void {
    this.selectedRotation = r;
    this.headerForm = {
      name: r.name || '', short_description: r.short_description || '', description: r.description || '',
      condition_of_service_id: r.condition_of_service_id || '', employee_subtype_id: r.employee_subtype_id || '',
      start_date: r.start_date ? r.start_date.split('T')[0] : '',
      end_date: r.end_date && !r.end_date.startsWith('9999') ? r.end_date.split('T')[0] : '',
      no_of_weeks: r.no_of_weeks || 1, enabled: r.enabled ?? true
    };
    this.loadWeeks(r.id);
  }

  loadWeeks(rotationId: number): void {
    this.weeksLoading = true;
    this.api.get<any>(`/time/shift-rotations/${rotationId}/weeks`).subscribe({
      next: (d: any) => { this.weeks = d?.data || d || []; this.weeksLoading = false; this.cdr.detectChanges(); },
      error: () => { this.weeks = []; this.weeksLoading = false; }
    });
  }

  openAddWeek(): void {
    this.editingWeekId = null;
    const maxWeek = this.weeks.length > 0 ? Math.max(...this.weeks.map((w: any) => w.week_no || 1)) : 0;
    const nextWeek = maxWeek + 1;
    this.weekForm = { description: `Week ${nextWeek}`, week_no: nextWeek, enabled: true };
    for (const day of this.DAYS) this.weekForm[day] = '';
    this.showWeekModal = true;
  }

  openEditWeek(w: any): void {
    this.editingWeekId = w.id;
    this.weekForm = {
      description: w.description || '', week_no: w.week_no || 1, enabled: w.enabled ?? true,
      monday: w.monday || '', tuesday: w.tuesday || '', wednesday: w.wednesday || '',
      thursday: w.thursday || '', friday: w.friday || '', saturday: w.saturday || '', sunday: w.sunday || ''
    };
    this.showWeekModal = true;
  }

  saveWeek(): void {
    if (!this.weekForm.description?.trim()) { this.ui.toast('error', 'Validation', 'Description is required'); return; }
    this.saving = true;
    const payload: any = { ...this.weekForm };
    for (const day of this.DAYS) { if (!payload[day]) payload[day] = null; }
    const rid = this.selectedRotation.id;
    const req = this.editingWeekId
      ? this.api.put(`/time/shift-rotations/weeks/${this.editingWeekId}`, payload)
      : this.api.post(`/time/shift-rotations/${rid}/weeks`, payload);
    req.subscribe({
      next: () => {
        this.ui.toast('success', this.editingWeekId ? 'Updated' : 'Added', 'Week line saved');
        this.showWeekModal = false; this.saving = false; this.loadWeeks(rid);
      },
      error: (e: any) => { this.ui.toast('error', 'Error', e?.error?.error?.message || 'Save failed'); this.saving = false; }
    });
  }

  async deleteWeek(w: any): Promise<void> {
    const ok = await this.ui.confirm({ title: 'Remove Week', message: `Remove "${w.description}"?` });
    if (!ok) return;
    this.api.delete(`/time/shift-rotations/weeks/${w.id}`).subscribe({
      next: () => { this.ui.toast('success', 'Removed', 'Week line removed'); this.loadWeeks(this.selectedRotation.id); },
      error: () => this.ui.toast('error', 'Error', 'Delete failed')
    });
  }

  shiftName(id: any): string {
    if (!id) return '—';
    const s = this.shifts.find((x: any) => x.id === +id);
    return s?.short_description || s?.name || '—';
  }

  getShiftColor(id: any): string {
    if (!id) return '#94A3B8';
    const s = this.shifts.find((x: any) => x.id === +id);
    return s?.color || '#1976D2';
  }

  weekNos(): number[] {
    return [...new Set(this.weeks.map((w: any) => w.week_no || 1))].sort((a, b) => a - b);
  }

  weeksForNo(no: number): any[] {
    return this.weeks.filter((w: any) => (w.week_no || 1) === no);
  }
}
