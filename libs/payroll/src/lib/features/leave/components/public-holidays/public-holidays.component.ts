import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { UiService } from '../../../../core/services/ui.service';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { DateInputComponent } from '../../../../shared/components/date-input/date-input.component';

@Component({
  selector: 'app-public-holidays',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, StatusBadgeComponent, DateInputComponent],
  host: { 'data-accent': 'leave' },
  templateUrl: './public-holidays.component.html',
  styleUrl: './public-holidays.component.css'
})
export class PublicHolidaysComponent implements OnInit {
  holidays: any[] = [];
  years: number[] = [];
  selectedYear: number = new Date().getFullYear();
  loading = false;
  generating = false;

  showAddForm = false;
  newHoliday = { name: '', holiday_date: '', notes: '' };
  addSaving = false;

  editingId: number | null = null;
  editRow: any = {};

  deleteConfirmId: number | null = null;

  readonly DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  readonly MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  constructor(
    private api: ApiService,
    private ui: UiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadYears();
    this.loadHolidays();
  }

  loadYears(): void {
    this.api.get<number[]>('/leave/public-holidays/years').subscribe({
      next: (d) => {
        const existing = d || [];
        const cur = new Date().getFullYear();
        const set = new Set<number>(existing);
        for (let y = cur - 2; y <= cur + 2; y++) set.add(y);
        this.years = Array.from(set).sort();
        this.cdr.detectChanges();
      },
      error: () => {
        const cur = new Date().getFullYear();
        this.years = [cur - 2, cur - 1, cur, cur + 1, cur + 2];
        this.cdr.detectChanges();
      }
    });
  }

  loadHolidays(): void {
    this.loading = true;
    this.api.get<any[]>(`/leave/public-holidays?year=${this.selectedYear}`).subscribe({
      next: (d) => {
        this.holidays = d || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.holidays = [];
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  selectYear(y: number): void {
    this.selectedYear = y;
    this.cancelAdd();
    this.cancelEdit();
    this.deleteConfirmId = null;
    this.loadHolidays();
  }

  generateYear(): void {
    this.generating = true;
    this.api.post(`/leave/public-holidays/generate/${this.selectedYear}`, {}).subscribe({
      next: (d: any) => {
        this.generating = false;
        const inserted = d?.inserted ?? 0;
        if (inserted > 0) {
          this.ui.toast('success', `Generated ${inserted} holiday(s) for ${this.selectedYear}`, '');
        } else {
          this.ui.toast('info', `All statutory holidays for ${this.selectedYear} already exist`, '');
        }
        this.loadYears();
        this.loadHolidays();
      },
      error: (e) => {
        this.generating = false;
        this.ui.toast('error', 'Generate failed', e?.error?.error?.message || '');
      }
    });
  }

  hasStatutoryHolidays(): boolean {
    return this.holidays.some(h => h.holiday_type === 'STATUTORY_FIXED');
  }

  // ── Add ad-hoc ──────────────────────────────────────────────────────────────
  startAdd(): void {
    this.showAddForm = true;
    this.newHoliday = { name: '', holiday_date: '', notes: '' };
    this.cancelEdit();
    this.cdr.detectChanges();
  }

  cancelAdd(): void {
    this.showAddForm = false;
    this.cdr.detectChanges();
  }

  saveAdd(): void {
    if (!this.newHoliday.name.trim()) {
      this.ui.toast('error', 'Validation', 'Holiday name is required'); return;
    }
    if (!this.newHoliday.holiday_date) {
      this.ui.toast('error', 'Validation', 'Date is required'); return;
    }
    this.addSaving = true;
    this.api.post('/leave/public-holidays', this.newHoliday).subscribe({
      next: () => {
        this.addSaving = false;
        this.ui.toast('success', 'Holiday added', '');
        this.cancelAdd();
        this.loadYears();
        this.loadHolidays();
      },
      error: (e) => {
        this.addSaving = false;
        this.ui.toast('error', 'Save failed', e?.error?.error?.message || '');
      }
    });
  }

  // ── Edit row ─────────────────────────────────────────────────────────────────
  startEdit(h: any): void {
    this.editingId = h.id;
    this.editRow = {
      name: h.name,
      enabled: h.enabled,
      holiday_date: h.holiday_type === 'AD_HOC' ? (h.holiday_date ? String(h.holiday_date).split('T')[0] : '') : null,
      notes: h.notes || ''
    };
    this.cancelAdd();
    this.deleteConfirmId = null;
    this.cdr.detectChanges();
  }

  cancelEdit(): void {
    this.editingId = null;
    this.cdr.detectChanges();
  }

  saveEdit(h: any): void {
    const payload: any = {
      name: this.editRow.name,
      enabled: this.editRow.enabled,
      notes: this.editRow.notes
    };
    if (h.holiday_type === 'AD_HOC') {
      if (!this.editRow.holiday_date) {
        this.ui.toast('error', 'Validation', 'Date is required'); return;
      }
      payload.holiday_date = this.editRow.holiday_date;
    }
    this.api.put(`/leave/public-holidays/${h.id}`, payload).subscribe({
      next: () => {
        this.ui.toast('success', 'Holiday updated', '');
        this.cancelEdit();
        this.loadHolidays();
      },
      error: (e) => this.ui.toast('error', 'Save failed', e?.error?.error?.message || '')
    });
  }

  toggleEnabled(h: any): void {
    this.api.put(`/leave/public-holidays/${h.id}`, { enabled: !h.enabled }).subscribe({
      next: () => {
        h.enabled = !h.enabled;
        this.cdr.detectChanges();
      },
      error: (e) => this.ui.toast('error', 'Update failed', e?.error?.error?.message || '')
    });
  }

  // ── Delete ───────────────────────────────────────────────────────────────────
  confirmDelete(id: number): void {
    this.deleteConfirmId = id;
    this.cancelEdit();
    this.cdr.detectChanges();
  }

  cancelDelete(): void {
    this.deleteConfirmId = null;
    this.cdr.detectChanges();
  }

  doDelete(h: any): void {
    this.api.delete(`/leave/public-holidays/${h.id}`).subscribe({
      next: () => {
        this.ui.toast('success', 'Deleted', '');
        this.deleteConfirmId = null;
        this.loadYears();
        this.loadHolidays();
      },
      error: (e) => this.ui.toast('error', 'Delete failed', e?.error?.error?.message || '')
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────────
  formatStatutoryDate(h: any): string {
    if (!h.statutory_month || !h.statutory_day) return '-';
    return `${String(h.statutory_day).padStart(2,'0')}/${String(h.statutory_month).padStart(2,'0')}`;
  }

  formatObservedDate(h: any): string {
    if (!h.holiday_date) return '-';
    const d = new Date(h.holiday_date);
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth() + 1).padStart(2,'0')}/${d.getFullYear()}`;
  }

  getDayName(h: any): string {
    if (!h.holiday_date) return '-';
    return this.DAYS[new Date(h.holiday_date).getDay()];
  }

  trackById(_: number, h: any): number { return h.id; }
}
