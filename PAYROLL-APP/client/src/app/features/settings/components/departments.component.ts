import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
  import { CommonModule } from '@angular/common';
  import { FormsModule } from '@angular/forms';
  import { ApiService } from '../../../core/services/api.service';
  import { UiService } from '../../../core/services/ui.service';
  import { IconComponent } from '../../../shared/components/icon/icon.component';
  import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
  import { CurrencyZarPipe } from '../../../shared/pipes/currency-zar.pipe';
  import { DateSaPipe } from '../../../shared/pipes/date-sa.pipe';

  @Component({
    selector: 'app-departments',
    standalone: true,
    imports: [CommonModule, FormsModule, IconComponent, StatusBadgeComponent, CurrencyZarPipe, DateSaPipe],
    templateUrl: './departments.component.html',
    styleUrl: './departments.component.css'
  })
  export class DepartmentsComponent implements OnInit {
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
      this.api.get<any[]>('/departments').subscribe({
        next: (data) => { this.items = data || []; this.applyFilter(); this.loading = false; this.cdr.detectChanges(); },
        error: () => { this.loading = false; this.cdr.detectChanges(); }
      });
    }

    applyFilter(): void {
      const s = this.searchTerm.toLowerCase();
      this.filteredItems = s
        ? this.items.filter(i =>
            (i.code || '').toLowerCase().includes(s) ||
            (i.name || '').toLowerCase().includes(s))
        : [...this.items];
      this.cdr.detectChanges();
    }

    get activeCount(): number {
      return this.items.filter(i => i.enabled !== false).length;
    }

    get inactiveCount(): number {
      return this.items.filter(i => i.enabled === false).length;
    }

    openModal(item?: any): void {
      this.editItem = item ? { ...item } : { enabled: true };
      this.showModal = true;
    }

    save(): void {
      const obs = this.editItem.id
        ? this.api.put(`/departments/${this.editItem.id}`, this.editItem)
        : this.api.post('/departments', this.editItem);
      obs.subscribe({
        next: () => { this.ui.toast('success', 'Saved', 'Departments saved'); this.showModal = false; this.load(); },
        error: () => this.ui.toast('error', 'Error', 'Failed to save')
      });
    }

    async deleteItem(item: any): Promise<void> {
      const confirmed = await this.ui.confirm({ title: 'Delete', message: `Delete ${item.name || item.code || 'this item'}?`, danger: true });
      if (confirmed) {
        this.api.delete(`/departments/${item.id}`).subscribe({
          next: () => { this.ui.toast('success', 'Deleted', 'Item removed'); this.load(); },
          error: () => this.ui.toast('error', 'Error', 'Failed to delete')
        });
      }
    }
  }
