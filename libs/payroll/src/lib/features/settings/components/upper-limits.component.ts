import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { UiService } from '../../../core/services/ui.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { CurrencyZarPipe } from '../../../shared/pipes/currency-zar.pipe';
import { DateSaPipe } from '../../../shared/pipes/date-sa.pipe';
import { DateInputComponent } from '../../../shared/components/date-input/date-input.component';

@Component({
  selector: 'app-upper-limits',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, CurrencyZarPipe, DateSaPipe, DateInputComponent],
  templateUrl: './upper-limits.component.html',
  styleUrl: './upper-limits.component.css'
})
export class UpperLimitsComponent implements OnInit {
  limits: any[] = [];
  filteredLimits: any[] = [];
  searchTerm = '';
  types: any[] = [];
  subtypes: any[] = [];
  loading = true;
  showModal = false;
  editItem: any = {};
  filteredSubtypes: any[] = [];
  detailItem: any = null;
  activeTab: 'details' | 'history' = 'details';
  history: any[] = [];
  historyLoading = false;

  constructor(private api: ApiService, private ui: UiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    Promise.all([
      new Promise<any[]>((resolve) => { this.api.get<any[]>('/settings/upper-limits').subscribe({ next: (d) => resolve(d || []), error: () => resolve([]) }); }),
      new Promise<any[]>((resolve) => { this.api.get<any[]>('/settings/employee-types').subscribe({ next: (d) => resolve(d || []), error: () => resolve([]) }); }),
      new Promise<any[]>((resolve) => { this.api.get<any[]>('/settings/employee-subtypes').subscribe({ next: (d) => resolve(d || []), error: () => resolve([]) }); }),
    ]).then(([limits, types, subtypes]) => {
      this.limits = limits;
      this.types = types;
      this.subtypes = subtypes;
      this.applyFilter();
      this.loading = false; this.cdr.detectChanges();
    });
  }

  applyFilter(): void {
    const s = this.searchTerm.toLowerCase();
    this.filteredLimits = s
      ? this.limits.filter(l =>
          (l.employee_type_name || '').toLowerCase().includes(s) ||
          (l.employee_subtype_name || '').toLowerCase().includes(s))
      : [...this.limits];
    this.cdr.detectChanges();
  }

  get employeeTypeCount(): number {
    return new Set(this.limits.map(l => l.employee_type_name).filter(Boolean)).size;
  }

  openModal(item?: any): void {
    this.detailItem = null;
    if (item) {
      this.editItem = { ...item };
    } else {
      this.editItem = {
        employee_type_id: '', employee_subtype_id: '',
        start_date: '1900-01-01', end_date: '9999-12-31',
        minimum_value: 0, midpoint_value: 0, maximum_value: 0
      };
    }
    if (this.editItem.start_date?.includes('T')) this.editItem.start_date = this.editItem.start_date.split('T')[0];
    if (this.editItem.end_date?.includes('T')) this.editItem.end_date = this.editItem.end_date.split('T')[0];
    this.onTypeChange();
    this.activeTab = 'details';
    this.showModal = true;
    this.cdr.detectChanges();
  }

  openDetail(item: any): void {
    this.editItem = { ...item };
    if (this.editItem.start_date?.includes('T')) this.editItem.start_date = this.editItem.start_date.split('T')[0];
    if (this.editItem.end_date?.includes('T')) this.editItem.end_date = this.editItem.end_date.split('T')[0];
    this.onTypeChange();
    this.detailItem = item;
    this.activeTab = 'details';
    this.showModal = true;
    this.cdr.detectChanges();
  }

  switchTab(tab: 'details' | 'history'): void {
    this.activeTab = tab;
    if (tab === 'history' && this.editItem.id) {
      this.loadHistory();
    }
    this.cdr.detectChanges();
  }

  loadHistory(): void {
    if (!this.editItem.id) return;
    this.historyLoading = true;
    this.cdr.detectChanges();
    this.api.get<any[]>(`/settings/upper-limits/${this.editItem.id}/history`).subscribe({
      next: (data) => {
        this.history = data || [];
        this.historyLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.history = [];
        this.historyLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onTypeChange(): void {
    const typeId = this.editItem.employee_type_id;
    this.filteredSubtypes = typeId
      ? this.subtypes.filter(s => s.employee_type_id == typeId)
      : [];
  }

  save(): void {
    if (!this.editItem.start_date) {
      this.ui.toast('error', 'Validation', 'Start date is required');
      return;
    }
    const payload = {
      employee_type_id: this.editItem.employee_type_id ? parseInt(this.editItem.employee_type_id) : null,
      employee_subtype_id: this.editItem.employee_subtype_id ? parseInt(this.editItem.employee_subtype_id) : null,
      start_date: this.editItem.start_date,
      end_date: this.editItem.end_date || '9999-12-31',
      minimum_value: parseFloat(this.editItem.minimum_value) || 0,
      midpoint_value: parseFloat(this.editItem.midpoint_value) || 0,
      maximum_value: parseFloat(this.editItem.maximum_value) || 0,
    };
    const obs = this.editItem.id
      ? this.api.put(`/settings/upper-limits/${this.editItem.id}`, payload)
      : this.api.post('/settings/upper-limits', payload);
    obs.subscribe({
      next: () => { this.ui.toast('success', this.editItem.id ? 'Updated' : 'Created', 'Upper limit saved'); this.showModal = false; this.load(); },
      error: () => this.ui.toast('error', 'Error', 'Failed to save')
    });
  }

  async deleteLimit(item: any): Promise<void> {
    const confirmed = await this.ui.confirm({ title: 'Delete Upper Limit', message: `Delete this upper limit?`, danger: true });
    if (confirmed) {
      this.api.delete(`/settings/upper-limits/${item.id}`).subscribe({
        next: () => { this.ui.toast('success', 'Deleted', 'Upper limit removed'); this.load(); },
        error: () => this.ui.toast('error', 'Error', 'Failed to delete')
      });
    }
  }

  formatEndDate(d: string): string {
    if (!d) return '-';
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return d;
    const dd = String(dt.getDate()).padStart(2, '0');
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${dt.getFullYear()}`;
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
}
