import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { UiService } from '../../../core/services/ui.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-trade-unions',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, StatusBadgeComponent],
  templateUrl: './trade-unions.component.html',
  styleUrl: './trade-unions.component.css'
})
export class TradeUnionsComponent implements OnInit {
  unions: any[] = [];
  filteredUnions: any[] = [];
  loading = true;
  searchTerm = '';

  view: 'list' | 'detail' = 'list';
  mode: 'create' | 'view' | 'edit' = 'view';
  activeTab = 'details';
  union: any = {};
  currentIndex = -1;

  vendors: any[] = [];

  constructor(private api: ApiService, private ui: UiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadUnions();
    this.api.get<any>('/benefits/ems-vendors').subscribe({
      next: (d) => { this.vendors = d || []; this.cdr.detectChanges(); },
      error: () => { this.vendors = []; }
    });
  }

  loadUnions(): void {
    this.loading = true;
    this.api.get<any>('/trade-unions').subscribe({
      next: (d) => {
        this.unions = d || [];
        this.filterUnions();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.unions = []; this.filteredUnions = []; this.loading = false; this.cdr.detectChanges(); }
    });
  }

  vendorName(vendorId: any): string {
    if (!vendorId) return '-';
    const v = this.vendors.find(v => v.id === vendorId || v.id === parseInt(vendorId));
    return v ? v.name : `Vendor #${vendorId}`;
  }

  filterUnions(): void {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredUnions = [...this.unions];
    } else {
      this.filteredUnions = this.unions.filter(u =>
        (u.representative || '').toLowerCase().includes(term) ||
        this.vendorName(u.vendor_id).toLowerCase().includes(term)
      );
    }
    this.cdr.detectChanges();
  }

  get activeCount(): number {
    return this.unions.filter(u => u.enabled).length;
  }

  openCreate(): void {
    this.union = {
      representative: '', vendor_id: '',
      contribution_type: '%', contribution_value: 0,
      maximum_value: 0, enabled: true
    };
    this.mode = 'create';
    this.activeTab = 'details';
    this.view = 'detail';
    this.cdr.detectChanges();
  }

  openDetail(item: any, _filteredIndex: number): void {
    this.union = { ...item, vendor_id: item.vendor_id ? String(item.vendor_id) : '' };
    this.currentIndex = this.unions.findIndex(u => u.id === item.id);
    this.mode = 'view';
    this.activeTab = 'details';
    this.view = 'detail';
    this.cdr.detectChanges();
  }

  goBack(): void {
    this.view = 'list';
    this.loadUnions();
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
      const u = this.unions[this.currentIndex];
      if (u) this.union = { ...u, vendor_id: u.vendor_id ? String(u.vendor_id) : '' };
      this.mode = 'view';
      this.cdr.detectChanges();
    }
  }

  get isEditable(): boolean {
    return this.mode === 'edit' || this.mode === 'create';
  }

  get pageTitle(): string {
    if (this.mode === 'create') return 'New Trade Union Representative';
    return this.union.representative || 'Trade Union Representative';
  }

  navigatePrev(): void {
    if (this.currentIndex <= 0) return;
    this.currentIndex--;
    const u = this.unions[this.currentIndex];
    this.union = { ...u, vendor_id: u.vendor_id ? String(u.vendor_id) : '' };
    this.mode = 'view';
    this.activeTab = 'details';
    this.cdr.detectChanges();
  }

  navigateNext(): void {
    if (this.currentIndex >= this.unions.length - 1) return;
    this.currentIndex++;
    const u = this.unions[this.currentIndex];
    this.union = { ...u, vendor_id: u.vendor_id ? String(u.vendor_id) : '' };
    this.mode = 'view';
    this.activeTab = 'details';
    this.cdr.detectChanges();
  }

  save(): void {
    if (!this.union.representative) { this.ui.toast('error', 'Validation', 'Trade Union Representative is required'); return; }
    const payload = {
      representative: this.union.representative,
      vendor_id: this.union.vendor_id ? parseInt(this.union.vendor_id) : null,
      contribution_type: this.union.contribution_type || '%',
      contribution_value: parseFloat(this.union.contribution_value) || 0,
      maximum_value: parseFloat(this.union.maximum_value) || 0,
      enabled: this.union.enabled !== false,
    };

    const obs = this.union.id
      ? this.api.put(`/trade-unions/${this.union.id}`, payload)
      : this.api.post('/trade-unions', payload);

    const isEdit = !!this.union.id;
    obs.subscribe({
      next: () => {
        this.ui.toast('success', 'Saved', isEdit ? 'Trade union updated' : 'Trade union created');
        if (isEdit) {
          this.loadUnions();
          this.mode = 'view';
        } else {
          this.goBack();
        }
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.ui.toast('error', 'Error', err?.error?.error || 'Failed to save');
      }
    });
  }

  deleteFromList(union: any, event?: Event): void {
    if (event) event.stopPropagation();
    if (!confirm(`Delete trade union "${union.representative}"?`)) return;
    this.api.delete(`/trade-unions/${union.id}`).subscribe({
      next: () => {
        this.ui.toast('success', 'Deleted', 'Trade union deleted');
        this.loadUnions();
      },
      error: (err: any) => {
        this.ui.toast('error', 'Error', err?.error?.error || 'Cannot delete');
      }
    });
  }

  formatCurrency(v: any): string {
    const n = parseFloat(v) || 0;
    return 'R' + n.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
