import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { UiService } from '../../../core/services/ui.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { CurrencyZarPipe } from '../../../shared/pipes/currency-zar.pipe';
import { DateSaPipe } from '../../../shared/pipes/date-sa.pipe';
import { DateInputComponent } from '../../../shared/components/date-input/date-input.component';

@Component({
  selector: 'app-task-grades',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, PaginationComponent, CurrencyZarPipe, DateSaPipe, DateInputComponent],
  templateUrl: './task-grades.component.html',
  styleUrl: './task-grades.component.css'
})
export class TaskGradesComponent implements OnInit {
  grades: any[] = [];
  filteredGrades: any[] = [];
  loading = true;
  searchTerm = '';
  page = 1;
  limit = 25;

  view: 'list' | 'detail' = 'list';
  mode: 'create' | 'view' | 'edit' = 'view';
  activeTab = 'details';
  grade: any = {};
  currentIndex = -1;

  notches: any[] = [];
  notchesLoading = false;
  showNotchModal = false;
  editNotch: any = {};

  history: any[] = [];
  historyLoading = false;

  skillLevels: any[] = [];

  months = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
    { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
    { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' }
  ];

  constructor(private api: ApiService, private ui: UiService, public cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.load();
    this.loadSkillLevels();
  }

  load(): void {
    this.loading = true;
    this.api.get<any[]>('/settings/task-grades').subscribe({
      next: (data) => {
        this.grades = data || [];
        this.applyFilter();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.ui.toast('error', 'Error', 'Failed to load task grades');
        this.cdr.detectChanges();
      }
    });
  }

  loadSkillLevels(): void {
    this.api.get<any[]>('/settings/task-skill-levels').subscribe({
      next: (data) => { this.skillLevels = data || []; this.cdr.detectChanges(); },
      error: () => { this.skillLevels = []; }
    });
  }

  applyFilter(): void {
    const s = this.searchTerm.toLowerCase();
    this.filteredGrades = s
      ? this.grades.filter(g =>
          (g.grade_code || '').toLowerCase().includes(s) ||
          (g.grade_name || '').toLowerCase().includes(s))
      : [...this.grades];
    this.page = 1;
    this.cdr.detectChanges();
  }

  get activeCount(): number {
    return this.grades.filter(g => g.enabled !== false).length;
  }

  get inactiveCount(): number {
    return this.grades.filter(g => g.enabled === false).length;
  }

  get pagedGrades(): any[] {
    const start = (this.page - 1) * this.limit;
    return this.filteredGrades.slice(start, start + this.limit);
  }

  get isEditable(): boolean {
    return this.mode === 'create' || this.mode === 'edit';
  }

  get pageTitle(): string {
    if (this.mode === 'create') return 'Add New Task Grade';
    return this.grade.grade_name || 'Task Grade';
  }

  get increaseDateMethod(): string {
    return this.grade.use_specific_notch_increase_date ? 'specific' : 'employment';
  }

  set increaseDateMethod(val: string) {
    if (val === 'specific') {
      this.grade.use_employment_date = false;
      this.grade.use_specific_notch_increase_date = true;
    } else {
      this.grade.use_employment_date = true;
      this.grade.use_specific_notch_increase_date = false;
      this.grade.notch_increase_month = null;
    }
    this.cdr.detectChanges();
  }

  formatEndDate(d: string): string {
    if (!d) return '-';
    if (d.startsWith('9999-12-31')) return '31/12/9999';
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return d;
    const dd = String(dt.getDate()).padStart(2, '0');
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${dt.getFullYear()}`;
  }

  monthlyAmount(annual: any): number {
    return (parseFloat(annual) || 0) / 12;
  }

  openCreate(): void {
    this.grade = {
      grade_code: '', grade_name: '', min_salary: 0, max_salary: 0, notch_count: 0,
      enabled: true, start_date: '1900-01-01', end_date: '9999-12-31',
      task_skill_level_id: null, yearly_notch_level_increase: 0,
      use_employment_date: true, use_specific_notch_increase_date: false,
      notch_increase_month: null,
      exclude_from_yearly_increase: false
    };
    this.mode = 'create';
    this.view = 'detail';
    this.activeTab = 'details';
    this.notches = [];
    this.history = [];
    this.cdr.detectChanges();
  }

  openDetail(item: any, idx?: number, tab?: string): void {
    this.api.get<any>(`/settings/task-grades/${item.id}`).subscribe({
      next: (data) => {
        this.grade = { ...data };
        if (this.grade.start_date?.includes('T')) this.grade.start_date = this.grade.start_date.split('T')[0];
        if (this.grade.end_date?.includes('T')) this.grade.end_date = this.grade.end_date.split('T')[0];
        this.currentIndex = idx !== undefined ? idx : this.grades.findIndex(g => g.id === item.id);
        this.mode = 'view';
        this.view = 'detail';
        this.activeTab = tab || 'details';
        this.loadNotches();
        this.cdr.detectChanges();
      },
      error: () => this.ui.toast('error', 'Error', 'Failed to load task grade')
    });
  }

  openDetailToNotches(item: any): void {
    const idx = this.grades.findIndex(g => g.id === item.id);
    this.openDetail(item, idx >= 0 ? idx : undefined, 'notches');
  }

  goBack(): void {
    this.view = 'list';
    this.load();
    this.cdr.detectChanges();
  }

  enterEdit(): void {
    this.mode = 'edit';
    this.cdr.detectChanges();
  }

  cancelEdit(): void {
    if (this.mode === 'create') {
      this.goBack();
    } else {
      this.openDetail(this.grade);
    }
  }

  editFromList(item: any): void {
    this.api.get<any>(`/settings/task-grades/${item.id}`).subscribe({
      next: (data) => {
        this.grade = { ...data };
        if (this.grade.start_date?.includes('T')) this.grade.start_date = this.grade.start_date.split('T')[0];
        if (this.grade.end_date?.includes('T')) this.grade.end_date = this.grade.end_date.split('T')[0];
        this.currentIndex = this.grades.findIndex(g => g.id === item.id);
        this.mode = 'edit';
        this.view = 'detail';
        this.activeTab = 'details';
        this.loadNotches();
        this.cdr.detectChanges();
      },
      error: () => this.ui.toast('error', 'Error', 'Failed to load task grade')
    });
  }

  navigatePrev(): void {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.openDetail(this.grades[this.currentIndex], this.currentIndex);
    }
  }

  navigateNext(): void {
    if (this.currentIndex < this.grades.length - 1) {
      this.currentIndex++;
      this.openDetail(this.grades[this.currentIndex], this.currentIndex);
    }
  }

  save(): void {
    if (!this.grade.grade_code || !this.grade.grade_code.trim()) {
      this.ui.toast('error', 'Validation', 'Grade Code is required');
      return;
    }
    if (!this.grade.grade_name || !this.grade.grade_name.trim()) {
      this.ui.toast('error', 'Validation', 'Grade Name is required');
      return;
    }
    if (!this.grade.start_date) {
      this.ui.toast('error', 'Validation', 'Start Date is required');
      return;
    }

    const payload = {
      grade_code: this.grade.grade_code,
      grade_name: this.grade.grade_name,
      min_salary: this.grade.min_salary || 0,
      max_salary: this.grade.max_salary || 0,
      notch_count: this.grade.notch_count || 0,
      enabled: this.grade.enabled !== false,
      start_date: this.grade.start_date,
      end_date: this.grade.end_date || '9999-12-31',
      task_skill_level_id: this.grade.task_skill_level_id || null,
      yearly_notch_level_increase: this.grade.yearly_notch_level_increase || 0,
      use_employment_date: this.grade.use_employment_date !== false,
      use_specific_notch_increase_date: this.grade.use_specific_notch_increase_date === true,
      notch_increase_month: this.grade.use_specific_notch_increase_date ? (this.grade.notch_increase_month || null) : null,
      exclude_from_yearly_increase: this.grade.exclude_from_yearly_increase === true
    };

    const request$ = this.mode === 'create'
      ? this.api.post<any>('/settings/task-grades', payload)
      : this.api.put<any>(`/settings/task-grades/${this.grade.id}`, payload);

    request$.subscribe({
      next: (data) => {
        this.ui.toast('success', 'Success', this.mode === 'create' ? 'Task grade created' : 'Task grade updated');
        this.grade = { ...data };
        if (this.grade.start_date?.includes('T')) this.grade.start_date = this.grade.start_date.split('T')[0];
        if (this.grade.end_date?.includes('T')) this.grade.end_date = this.grade.end_date.split('T')[0];
        this.mode = 'view';
        this.load();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        const msg = err?.error?.error?.message || err?.error?.error || 'Failed to save';
        this.ui.toast('error', 'Error', msg);
        this.cdr.detectChanges();
      }
    });
  }

  deleteFromList(item: any): void {
    this.ui.confirm({ title: 'Delete Task Grade', message: `Delete "${item.grade_name}" (${item.grade_code})? All associated notches will also be deleted.`, danger: true }).then(confirmed => {
      if (confirmed) {
        this.api.delete(`/settings/task-grades/${item.id}`).subscribe({
          next: () => {
            this.ui.toast('success', 'Deleted', 'Task grade removed');
            this.load();
            this.cdr.detectChanges();
          },
          error: (err: any) => {
            const msg = err?.error?.error?.message || err?.error?.error || 'Failed to delete';
            this.ui.toast('error', 'Error', msg);
            this.cdr.detectChanges();
          }
        });
      }
    });
  }

  loadNotches(): void {
    if (!this.grade.id) return;
    this.notchesLoading = true;
    this.api.get<any[]>(`/settings/task-grades/${this.grade.id}/notches`).subscribe({
      next: (data) => { this.notches = data || []; this.notchesLoading = false; this.cdr.detectChanges(); },
      error: () => { this.notches = []; this.notchesLoading = false; this.ui.toast('error', 'Error', 'Failed to load notches'); this.cdr.detectChanges(); }
    });
  }

  openNotchModal(item?: any): void {
    this.editNotch = item ? { ...item } : {
      task_grade_id: this.grade.id, notch_number: this.notches.length + 1,
      min_salary: 0, max_salary: 0,
      start_date: '1900-01-01', end_date: '9999-12-31'
    };
    if (this.editNotch.start_date?.includes('T')) this.editNotch.start_date = this.editNotch.start_date.split('T')[0];
    if (this.editNotch.end_date?.includes('T')) this.editNotch.end_date = this.editNotch.end_date.split('T')[0];
    this.showNotchModal = true;
    this.cdr.detectChanges();
  }

  saveNotch(): void {
    if (!this.editNotch.notch_number || !this.editNotch.start_date) {
      this.ui.toast('error', 'Validation', 'Notch number and start date are required');
      return;
    }
    const payload = { ...this.editNotch };
    if (!payload.end_date) payload.end_date = '9999-12-31';
    const obs = payload.id
      ? this.api.put(`/settings/task-grade-notches/${payload.id}`, payload)
      : this.api.post(`/settings/task-grades/${this.grade.id}/notches`, payload);
    obs.subscribe({
      next: () => {
        this.ui.toast('success', 'Saved', `Notch ${payload.notch_number} saved`);
        this.showNotchModal = false;
        this.loadNotches();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        const msg = err?.error?.error?.message || err?.error?.error || 'Failed to save';
        this.ui.toast('error', 'Error', msg);
        this.cdr.detectChanges();
      }
    });
  }

  deleteNotch(item: any): void {
    this.ui.confirm({ title: 'Delete Notch', message: `Delete notch ${item.notch_number}?`, danger: true }).then(confirmed => {
      if (confirmed) {
        this.api.delete(`/settings/task-grade-notches/${item.id}`).subscribe({
          next: () => {
            this.ui.toast('success', 'Deleted', 'Notch removed');
            this.loadNotches();
            this.cdr.detectChanges();
          },
          error: () => {
            this.ui.toast('error', 'Error', 'Failed to delete');
            this.cdr.detectChanges();
          }
        });
      }
    });
  }

  switchToNotches(): void {
    this.activeTab = 'notches';
    this.loadNotches();
    this.cdr.detectChanges();
  }

  switchToHistory(): void {
    this.activeTab = 'history';
    this.loadHistory();
    this.cdr.detectChanges();
  }

  loadHistory(): void {
    if (!this.grade.id) return;
    this.historyLoading = true;
    this.api.get<any[]>(`/settings/task-grades/${this.grade.id}/history`).subscribe({
      next: (data) => { this.history = data || []; this.historyLoading = false; this.cdr.detectChanges(); },
      error: () => { this.history = []; this.historyLoading = false; this.ui.toast('error', 'Error', 'Failed to load history'); this.cdr.detectChanges(); }
    });
  }

  formatDateTime(d: string): string {
    if (!d) return '-';
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return d;
    const dd = String(dt.getDate()).padStart(2, '0');
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const hh = String(dt.getHours()).padStart(2, '0');
    const mi = String(dt.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${dt.getFullYear()} ${hh}:${mi}`;
  }

  historyDescription(item: any): string {
    if (item.record_type === 'notch') {
      const snap = item.snapshot;
      return `Notch ${snap?.notch_number || '?'} — Min: R${parseFloat(snap?.min_salary || 0).toLocaleString()}, Max: R${parseFloat(snap?.max_salary || 0).toLocaleString()}`;
    }
    const snap = item.snapshot;
    return `${snap?.grade_code || '?'} — ${snap?.grade_name || ''}`;
  }

  getSkillLevelLabel(id: number): string {
    if (!id) return '—';
    const found = this.skillLevels.find(s => s.id === id);
    return found ? found.description : '—';
  }

  getMonthLabel(m: number): string {
    if (!m) return '—';
    const found = this.months.find(x => x.value === m);
    return found ? found.label : '—';
  }
}
