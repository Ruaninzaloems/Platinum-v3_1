import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { UiService } from '../../../core/services/ui.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-leave-types',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './leave-types.component.html',
  styleUrl: './leave-types.component.css'
})
export class LeaveTypesSettingsComponent implements OnInit {
  items: any[] = [];
  filteredItems: any[] = [];
  searchTerm = '';
  leaveSchemes: any[] = [];
  loading = true;
  showModal = false;
  editItem: any = {};

  constructor(private api: ApiService, private ui: UiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    Promise.all([
      new Promise<any[]>((resolve) => {
        this.api.get<any[]>('/settings/leave-types').subscribe({
          next: (d) => resolve(d || []), error: () => resolve([])
        });
      }),
      new Promise<any[]>((resolve) => {
        this.api.get<any[]>('/settings/leave-schemes').subscribe({
          next: (d) => resolve(d || []), error: () => resolve([])
        });
      })
    ]).then(([types, schemes]) => {
      this.items = types;
      this.leaveSchemes = schemes;
      this.applyFilter();
      this.loading = false; this.cdr.detectChanges();
    });
  }

  applyFilter(): void {
    const s = this.searchTerm.toLowerCase();
    this.filteredItems = s
      ? this.items.filter(i =>
          (i.code || '').toLowerCase().includes(s) ||
          (i.name || '').toLowerCase().includes(s) ||
          (i.scheme_name || '').toLowerCase().includes(s))
      : [...this.items];
    this.cdr.detectChanges();
  }

  get paidCount(): number {
    return this.items.filter(i => i.paid !== false).length;
  }

  get unpaidCount(): number {
    return this.items.filter(i => i.paid === false).length;
  }

  openModal(item?: any): void {
    this.editItem = item ? { ...item } : {
      code: '', name: '', leave_scheme_id: '',
      accrual_days: 0, max_accumulation: 0, accrual_frequency: 'ANNUAL',
      carry_over_days: 0, requires_document: false, paid: true, negative_balance_allowed: false
    };
    this.showModal = true;
  }

  save(): void {
    if (!this.editItem.code || !this.editItem.name) {
      this.ui.toast('error', 'Validation', 'Code and name are required');
      return;
    }
    const body = {
      code: this.editItem.code,
      name: this.editItem.name,
      leave_scheme_id: this.editItem.leave_scheme_id || null,
      accrual_days: parseFloat(this.editItem.accrual_days) || 0,
      max_accumulation: parseFloat(this.editItem.max_accumulation) || 0,
      accrual_frequency: this.editItem.accrual_frequency || 'ANNUAL',
      carry_over_days: parseFloat(this.editItem.carry_over_days) || 0,
      requires_document: this.editItem.requires_document || false,
      paid: this.editItem.paid !== false,
      negative_balance_allowed: this.editItem.negative_balance_allowed || false,
    };
    const obs = this.editItem.id
      ? this.api.put(`/settings/leave-types/${this.editItem.id}`, body)
      : this.api.post('/settings/leave-types', body);
    obs.subscribe({
      next: () => { this.ui.toast('success', this.editItem.id ? 'Updated' : 'Created', `${body.name} has been ${this.editItem.id ? 'updated' : 'created'}`); this.showModal = false; this.load(); },
      error: () => this.ui.toast('error', 'Error', 'Failed to save')
    });
  }

  async deleteItem(item: any): Promise<void> {
    const confirmed = await this.ui.confirm({ title: 'Delete Leave Type', message: `Delete ${item.code}? If used in historical data, it will be disabled instead.`, danger: true });
    if (confirmed) {
      this.api.delete(`/settings/leave-types/${item.id}`).subscribe({
        next: () => { this.ui.toast('success', 'Deleted', 'Leave type removed'); this.load(); },
        error: () => this.ui.toast('error', 'Error', 'Failed to delete')
      });
    }
  }

  formatDays(val: any): string {
    return parseFloat(val || 0).toFixed(2);
  }
}
