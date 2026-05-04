import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { UiService } from '../../../core/services/ui.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-conditions',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './conditions.component.html',
  styleUrl: './conditions.component.css'
})
export class ConditionsComponent implements OnInit {
  items: any[] = [];
  filteredItems: any[] = [];
  searchTerm = '';
  loading = true;
  showModal = false;
  editItem: any = {};

  constructor(private api: ApiService, private ui: UiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.api.get<any[]>('/settings/conditions-of-service').subscribe({
      next: (data) => { this.items = data || []; this.applyFilter(); this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  applyFilter(): void {
    const s = this.searchTerm.toLowerCase();
    this.filteredItems = s
      ? this.items.filter(i =>
          (i.code || '').toLowerCase().includes(s) ||
          (i.name || '').toLowerCase().includes(s) ||
          (i.description || '').toLowerCase().includes(s))
      : [...this.items];
    this.cdr.detectChanges();
  }

  get activeCount(): number {
    return this.items.filter(i => i.enabled !== false).length;
  }

  get disabledCount(): number {
    return this.items.filter(i => i.enabled === false).length;
  }

  openModal(item?: any): void {
    this.editItem = item ? { ...item } : {
      code: '', name: '', description: '',
      working_hours_per_day: 8, working_days_per_week: 5,
      start_date: new Date().toISOString().split('T')[0], enabled: true
    };
    if (this.editItem.start_date?.includes('T')) this.editItem.start_date = this.editItem.start_date.split('T')[0];
    this.showModal = true;
  }

  save(): void {
    if (!this.editItem.code || !this.editItem.name) {
      this.ui.toast('error', 'Validation', 'Code and name are required');
      return;
    }
    const payload = { ...this.editItem, end_date: '9999-12-31' };
    const obs = this.editItem.id
      ? this.api.put(`/settings/conditions-of-service/${this.editItem.id}`, payload)
      : this.api.post('/settings/conditions-of-service', payload);
    obs.subscribe({
      next: () => { this.ui.toast('success', 'Saved', `${payload.name} saved`); this.showModal = false; this.load(); },
      error: () => this.ui.toast('error', 'Error', 'Failed to save')
    });
  }

  async deleteItem(item: any): Promise<void> {
    const confirmed = await this.ui.confirm({ title: 'Delete Condition of Service', message: `Delete "${item.name}" (${item.code})?`, danger: true });
    if (confirmed) {
      this.api.delete(`/settings/conditions-of-service/${item.id}`).subscribe({
        next: () => { this.ui.toast('success', 'Deleted', `${item.name} removed`); this.load(); },
        error: () => this.ui.toast('error', 'Error', 'Failed to delete')
      });
    }
  }
}
