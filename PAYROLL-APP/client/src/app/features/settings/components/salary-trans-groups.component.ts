import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { UiService } from '../../../core/services/ui.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-salary-trans-groups',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './salary-trans-groups.component.html',
  styleUrl: './salary-trans-groups.component.css'
})
export class SalaryTransGroupsComponent implements OnInit {
  groups: any[] = [];
  filteredGroups: any[] = [];
  allHeads: any[] = [];
  loading = true;
  searchTerm = '';
  showModal = false;
  showItemsModal = false;
  editItem: any = {};
  manageGroup: any = null;
  groupItems: any[] = [];
  availableHeads: any[] = [];
  selectedTypeFilter: string = '';
  filteredHeads: any[] = [];
  selectedHeadIds: number[] = [];
  headSearchTerm: string = '';

  constructor(private api: ApiService, private ui: UiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    Promise.all([
      new Promise<any[]>((resolve) => {
        this.api.get<any[]>('/settings/salary-transaction-groups').subscribe({
          next: (d) => resolve(d || []), error: () => resolve([])
        });
      }),
      new Promise<any[]>((resolve) => {
        this.api.get<any[]>('/settings/salary-heads').subscribe({
          next: (d) => resolve(d || []), error: () => resolve([])
        });
      })
    ]).then(([groups, heads]) => {
      this.groups = groups;
      this.allHeads = heads;
      this.applyFilter();
      this.loading = false;
      this.cdr.detectChanges();
    });
  }

  applyFilter(): void {
    const s = this.searchTerm.toLowerCase();
    this.filteredGroups = s
      ? this.groups.filter(g =>
          (g.code || '').toLowerCase().includes(s) ||
          (g.name || '').toLowerCase().includes(s) ||
          (g.description || '').toLowerCase().includes(s))
      : [...this.groups];
    this.cdr.detectChanges();
  }

  get totalItems(): number {
    return this.groups.reduce((sum, g) => sum + (parseInt(g.item_count, 10) || 0), 0);
  }

  openModal(item?: any): void {
    this.editItem = item ? { ...item } : { code: '', name: '', description: '' };
    this.showModal = true;
    this.cdr.detectChanges();
  }

  save(): void {
    if (!this.editItem.code || !this.editItem.name) {
      this.ui.toast('error', 'Validation', 'Code and name are required');
      return;
    }
    const body = { code: this.editItem.code, name: this.editItem.name, description: this.editItem.description };
    const obs = this.editItem.id
      ? this.api.put(`/settings/salary-transaction-groups/${this.editItem.id}`, body)
      : this.api.post('/settings/salary-transaction-groups', body);
    obs.subscribe({
      next: () => { this.ui.toast('success', this.editItem.id ? 'Updated' : 'Created', `"${body.name}" saved successfully`); this.showModal = false; this.load(); this.cdr.detectChanges(); },
      error: () => { this.ui.toast('error', 'Error', 'Failed to save'); this.cdr.detectChanges(); }
    });
  }

  async deleteGroup(group: any): Promise<void> {
    const confirmed = await this.ui.confirm({ title: 'Delete Salary Transaction Group', message: `Delete "${group.name}" (${group.code})?`, danger: true });
    if (confirmed) {
      this.api.delete(`/settings/salary-transaction-groups/${group.id}`).subscribe({
        next: () => { this.ui.toast('success', 'Deleted', `"${group.name}" removed`); this.load(); this.cdr.detectChanges(); },
        error: () => { this.ui.toast('error', 'Error', 'Failed to delete'); this.cdr.detectChanges(); }
      });
    }
  }

  openItemsModal(group: any): void {
    this.manageGroup = group;
    this.showItemsModal = true;
    this.loadItems();
    this.cdr.detectChanges();
  }

  loadItems(): void {
    this.api.get<any[]>(`/settings/salary-transaction-groups/${this.manageGroup.id}/items`).subscribe({
      next: (data) => {
        this.groupItems = data || [];
        const linkedIds = new Set(this.groupItems.map((i: any) => i.salary_head_id));
        this.availableHeads = this.allHeads.filter(h => !linkedIds.has(h.id));
        this.selectedTypeFilter = '';
        this.filteredHeads = [];
        this.cdr.detectChanges();
      },
      error: () => { this.groupItems = []; this.cdr.detectChanges(); }
    });
  }

  getTypeLabel(t: string): string {
    const m: Record<string, string> = { EARNING: 'Earning', DEDUCTION: 'Deduction', COMPANY_CONTRIBUTION: 'Company Contribution', FRINGE_BENEFIT: 'Fringe Benefit' };
    return m[t] || t;
  }

  getTypeColor(t: string): string {
    const m: Record<string, string> = { EARNING: '#22c55e', DEDUCTION: '#ef4444', COMPANY_CONTRIBUTION: '#3b82f6', FRINGE_BENEFIT: '#f59e0b' };
    return m[t] || '#6b7280';
  }

  get availableTypes(): string[] {
    return [...new Set(this.availableHeads.map(h => h.transaction_type))].sort();
  }

  onTypeFilterChange(): void {
    this.selectedHeadIds = [];
    this.headSearchTerm = '';
    if (!this.selectedTypeFilter) {
      this.filteredHeads = [];
      this.cdr.detectChanges();
      return;
    }
    this.filteredHeads = this.availableHeads
      .filter(h => h.transaction_type === this.selectedTypeFilter)
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    this.cdr.detectChanges();
  }

  filterHeadsBySearch(): void {
    const term = (this.headSearchTerm || '').toLowerCase();
    const typeFiltered = this.availableHeads
      .filter(h => h.transaction_type === this.selectedTypeFilter)
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    this.filteredHeads = term
      ? typeFiltered.filter(h => (h.name || '').toLowerCase().includes(term) || (h.code || '').toLowerCase().includes(term))
      : typeFiltered;
    this.cdr.detectChanges();
  }

  isHeadSelected(id: number): boolean {
    return this.selectedHeadIds.includes(id);
  }

  toggleHead(id: number): void {
    const idx = this.selectedHeadIds.indexOf(id);
    if (idx >= 0) this.selectedHeadIds.splice(idx, 1);
    else this.selectedHeadIds.push(id);
    this.cdr.detectChanges();
  }

  addSelectedHeads(): void {
    if (this.selectedHeadIds.length === 0) return;
    this.api.post(`/settings/salary-transaction-groups/${this.manageGroup.id}/items`, { salary_head_ids: this.selectedHeadIds }).subscribe({
      next: (res: any) => { this.ui.toast('success', 'Added', res?.message || 'Items added'); this.selectedHeadIds = []; this.headSearchTerm = ''; this.loadItems(); this.load(); this.cdr.detectChanges(); },
      error: () => { this.ui.toast('error', 'Error', 'Failed to add'); this.cdr.detectChanges(); }
    });
  }

  removeItem(item: any): void {
    this.api.delete(`/settings/salary-transaction-groups/${this.manageGroup.id}/items/${item.id}`).subscribe({
      next: () => { this.loadItems(); this.load(); this.cdr.detectChanges(); },
      error: () => { this.ui.toast('error', 'Error', 'Failed to remove'); this.cdr.detectChanges(); }
    });
  }
}
