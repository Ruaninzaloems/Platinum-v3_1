import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { UiService } from '../../../core/services/ui.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { DateInputComponent } from '../../../shared/components/date-input/date-input.component';

@Component({
  selector: 'app-medical-aid-schemes',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, DateInputComponent],
  templateUrl: './medical-aid-schemes.component.html',
  styleUrl: './medical-aid-schemes.component.css'
})
export class MedicalAidSchemesComponent implements OnInit {
  schemes: any[] = [];
  filteredSchemes: any[] = [];
  loading = true;
  searchTerm = '';

  view: 'list' | 'detail' = 'list';
  mode: 'create' | 'view' | 'edit' = 'view';
  activeTab = 'details';
  scheme: any = {};
  currentIndex = -1;

  vendors: any[] = [];
  history: any[] = [];
  historyLoading = false;

  constructor(private api: ApiService, private ui: UiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadSchemes();
    this.api.get<any>('/benefits/ems-vendors').subscribe({
      next: (d) => { this.vendors = d || []; this.cdr.detectChanges(); },
      error: () => { this.vendors = []; }
    });
  }

  loadSchemes(): void {
    this.loading = true;
    this.api.get<any>('/benefits/medical-aid-schemes').subscribe({
      next: (d) => {
        this.schemes = d || [];
        this.filterSchemes();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.schemes = []; this.filteredSchemes = []; this.loading = false; this.cdr.detectChanges(); }
    });
  }

  vendorName(vendorId: any): string {
    if (!vendorId) return '-';
    const v = this.vendors.find(v => v.id === vendorId || v.id === parseInt(vendorId));
    return v ? v.name : `Vendor #${vendorId}`;
  }

  filterSchemes(): void {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredSchemes = [...this.schemes];
    } else {
      this.filteredSchemes = this.schemes.filter(s =>
        (s.name || '').toLowerCase().includes(term) ||
        this.vendorName(s.vendor_id).toLowerCase().includes(term) ||
        (s.contribution_plan || '').toLowerCase().includes(term)
      );
    }
    this.cdr.detectChanges();
  }

  get activeCount(): number {
    const now = new Date().toISOString().split('T')[0];
    return this.schemes.filter(s => {
      const start = s.start_date ? s.start_date.split('T')[0] : '';
      const end = s.end_date ? s.end_date.split('T')[0] : '9999-12-31';
      return start <= now && end >= now;
    }).length;
  }

  openCreate(): void {
    this.scheme = {
      name: '', vendor_id: '', contribution_plan: '',
      start_date: '1900-01-01', end_date: '9999-12-31',
      max_employer_contribution: 0, employer_contribution_percentage: 0,
      min_monthly_income: 0, max_monthly_income: 99999999,
      main_member_contribution: 0, adult_dependant_contribution: 0, child_dependant_contribution: 0,
      max_child_dependants_only: false, student_dependent: false, disabled_dependent: false,
      max_dependants: 0
    };
    this.history = [];
    this.mode = 'create';
    this.activeTab = 'details';
    this.view = 'detail';
    this.cdr.detectChanges();
  }

  openDetail(item: any, _filteredIndex: number): void {
    this.scheme = { ...item, vendor_id: item.vendor_id ? String(item.vendor_id) : '' };
    this.currentIndex = this.schemes.findIndex(s => s.id === item.id);
    this.mode = 'view';
    this.activeTab = 'details';
    this.view = 'detail';
    this.loadHistory(item.id);
    this.cdr.detectChanges();
  }

  goBack(): void {
    this.view = 'list';
    this.loadSchemes();
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
      const s = this.schemes[this.currentIndex];
      if (s) this.scheme = { ...s, vendor_id: s.vendor_id ? String(s.vendor_id) : '' };
      this.mode = 'view';
      this.cdr.detectChanges();
    }
  }

  get isEditable(): boolean {
    return this.mode === 'edit' || this.mode === 'create';
  }

  get pageTitle(): string {
    if (this.mode === 'create') return 'New Medical Aid Scheme';
    return this.scheme.name || 'Medical Aid Scheme';
  }

  navigatePrev(): void {
    if (this.currentIndex <= 0) return;
    this.currentIndex--;
    const s = this.schemes[this.currentIndex];
    this.scheme = { ...s, vendor_id: s.vendor_id ? String(s.vendor_id) : '' };
    this.mode = 'view';
    this.activeTab = 'details';
    this.loadHistory(s.id);
    this.cdr.detectChanges();
  }

  navigateNext(): void {
    if (this.currentIndex >= this.schemes.length - 1) return;
    this.currentIndex++;
    const s = this.schemes[this.currentIndex];
    this.scheme = { ...s, vendor_id: s.vendor_id ? String(s.vendor_id) : '' };
    this.mode = 'view';
    this.activeTab = 'details';
    this.loadHistory(s.id);
    this.cdr.detectChanges();
  }

  onVendorChange(): void {
    const vendorId = this.scheme.vendor_id ? parseInt(this.scheme.vendor_id) : null;
    const vendor = this.vendors.find(v => v.id === vendorId);
    if (vendor && !this.scheme.id) {
      this.scheme.name = vendor.name;
    }
    this.cdr.detectChanges();
  }

  loadHistory(schemeId: number): void {
    this.historyLoading = true;
    this.history = [];
    this.api.get<any>(`/benefits/medical-aid-schemes/${schemeId}/history`).subscribe({
      next: (d) => { this.history = d || []; this.historyLoading = false; this.cdr.detectChanges(); },
      error: () => { this.history = []; this.historyLoading = false; this.cdr.detectChanges(); }
    });
  }

  save(): void {
    if (!this.scheme.start_date) { this.ui.toast('error', 'Validation', 'Start date is required'); return; }
    const vendorId = this.scheme.vendor_id ? parseInt(this.scheme.vendor_id) : null;
    const vendor = this.vendors.find(v => v.id === vendorId);
    const payload = {
      ...this.scheme,
      name: this.scheme.name || (vendor ? vendor.name : 'Medical Aid Scheme'),
      vendor_id: vendorId,
      max_employer_contribution: parseFloat(this.scheme.max_employer_contribution) || 0,
      employer_contribution_percentage: parseFloat(this.scheme.employer_contribution_percentage) || 0,
      min_monthly_income: parseFloat(this.scheme.min_monthly_income) || 0,
      max_monthly_income: parseFloat(this.scheme.max_monthly_income) || 99999999,
      main_member_contribution: parseFloat(this.scheme.main_member_contribution) || 0,
      adult_dependant_contribution: parseFloat(this.scheme.adult_dependant_contribution) || 0,
      child_dependant_contribution: parseFloat(this.scheme.child_dependant_contribution) || 0,
      max_dependants: parseInt(this.scheme.max_dependants) || 0,
    };
    if (!payload.name && vendorId) {
      payload.name = vendor?.name || 'Scheme';
    }

    const obs = this.scheme.id
      ? this.api.put(`/benefits/medical-aid-schemes/${this.scheme.id}`, payload)
      : this.api.post('/benefits/medical-aid-schemes', payload);

    const isEdit = !!this.scheme.id;
    const editId = this.scheme.id;
    obs.subscribe({
      next: (result: any) => {
        this.ui.toast('success', 'Saved', isEdit ? 'Scheme updated' : 'Scheme created');
        if (isEdit) {
          this.loadSchemes();
          this.loadHistory(editId);
          this.mode = 'view';
        } else {
          this.goBack();
        }
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.ui.toast('error', 'Error', err?.error?.error?.message || 'Failed to save scheme');
      }
    });
  }

  deleteFromList(scheme: any, event?: Event): void {
    if (event) event.stopPropagation();
    if (!confirm(`Delete scheme "${scheme.name}"?`)) return;
    this.api.delete(`/benefits/medical-aid-schemes/${scheme.id}`).subscribe({
      next: () => {
        this.ui.toast('success', 'Deleted', 'Scheme deleted');
        this.loadSchemes();
      },
      error: (err: any) => {
        this.ui.toast('error', 'Error', err?.error?.error?.message || 'Cannot delete scheme');
      }
    });
  }

  formatCurrency(v: any): string {
    const n = parseFloat(v) || 0;
    return 'R' + n.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatDate(d: any): string {
    if (!d) return '-';
    const s = String(d).split('T')[0];
    if (s === '9999-12-31') return '9999-12-31';
    return s;
  }
}
