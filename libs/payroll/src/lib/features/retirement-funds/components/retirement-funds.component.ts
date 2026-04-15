import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { UiService } from '../../../core/services/ui.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { DateInputComponent } from '../../../shared/components/date-input/date-input.component';

@Component({
  selector: 'app-retirement-funds',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, DateInputComponent],
  templateUrl: './retirement-funds.component.html',
  styleUrl: './retirement-funds.component.css'
})
export class RetirementFundsComponent implements OnInit {
  funds: any[] = [];
  filteredFunds: any[] = [];
  loading = true;
  searchTerm = '';

  benefitType = 'PENSION';
  benefitTypes = [
    { value: 'PENSION', label: 'Pension Contribution' },
    { value: 'PROVIDENT', label: 'Provident Contribution' },
    { value: 'RETIREMENT_ANNUITY', label: 'Retirement Annuities' }
  ];

  fundSubTypes = ['Defined Contribution Fund', 'Defined Benefit Fund', 'Hybrid Fund'];

  view: 'list' | 'detail' = 'list';
  mode: 'create' | 'view' | 'edit' = 'view';
  fund: any = {};
  currentIndex = -1;

  vendors: any[] = [];
  earningHeads: any[] = [];
  fundSalaryHeads: any[] = [];
  selectedSalaryHead = '';

  constructor(private api: ApiService, private ui: UiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadFunds();
    this.api.get<any>('/benefits/ems-vendors').subscribe({
      next: (d) => { this.vendors = d || []; this.cdr.detectChanges(); },
      error: () => { this.vendors = []; }
    });
    this.api.get<any>('/settings/salary-heads').subscribe({
      next: (d) => {
        const arr = d || [];
        this.earningHeads = arr.filter((h: any) => h.transaction_type === 'EARNING');
        this.cdr.detectChanges();
      },
      error: () => { this.earningHeads = []; }
    });
  }

  loadFunds(): void {
    this.loading = true;
    this.api.get<any>('/benefits/retirement-funds', { fund_type: this.benefitType }).subscribe({
      next: (d) => {
        this.funds = d || [];
        this.filterFunds();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.funds = []; this.filteredFunds = []; this.loading = false; this.cdr.detectChanges(); }
    });
  }

  onBenefitTypeChange(): void {
    this.loadFunds();
  }

  vendorName(vendorId: any): string {
    if (!vendorId) return '-';
    const v = this.vendors.find(v => v.id === vendorId || v.id === parseInt(vendorId));
    return v ? v.name : `Vendor #${vendorId}`;
  }

  filterFunds(): void {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredFunds = [...this.funds];
    } else {
      this.filteredFunds = this.funds.filter(f =>
        (f.name || '').toLowerCase().includes(term) ||
        this.vendorName(f.vendor_id).toLowerCase().includes(term) ||
        (f.plan_name || '').toLowerCase().includes(term) ||
        (f.clearance_no || '').toLowerCase().includes(term)
      );
    }
    this.cdr.detectChanges();
  }

  get benefitLabel(): string {
    return this.benefitTypes.find(b => b.value === this.benefitType)?.label || 'Fund';
  }

  get adminLabel(): string {
    if (this.benefitType === 'PENSION') return 'Pension Fund Administrator';
    if (this.benefitType === 'PROVIDENT') return 'Provident Fund Administrator';
    return 'Retirement Fund Administrator';
  }

  get fundNameLabel(): string {
    if (this.benefitType === 'PENSION') return 'Plan Name';
    return 'Fund Name';
  }

  get sectionTitle(): string {
    if (this.benefitType === 'PENSION') return 'Pension Fund Contribution';
    if (this.benefitType === 'PROVIDENT') return 'Provident Fund Contribution';
    return 'Retirement Annuity Contribution';
  }

  get showContributions(): boolean {
    return this.benefitType !== 'RETIREMENT_ANNUITY';
  }

  get isEditable(): boolean {
    return this.mode === 'edit' || this.mode === 'create';
  }

  get pageTitle(): string {
    if (this.mode === 'create') return 'Add New Retirement Fund';
    return this.fund.name || 'Retirement Fund';
  }

  openCreate(): void {
    this.fund = {
      name: '', fund_type: this.benefitType, vendor_id: '', plan_name: '',
      clearance_no: '', fund_sub_type: '', fund_category_factor: '',
      employer_contribution_type: 'PERCENTAGE', employer_contribution_value: '',
      employer_max_value: '', employee_contribution_value: '', employee_max_value: '',
      employee_pro_rata: false, start_date: '1900-01-01', end_date: '9999-12-31'
    };
    this.fundSalaryHeads = [];
    this.mode = 'create';
    this.view = 'detail';
    this.cdr.detectChanges();
  }

  openDetail(item: any, _idx: number): void {
    this.fund = { ...item, vendor_id: item.vendor_id ? String(item.vendor_id) : '' };
    this.currentIndex = this.funds.findIndex(f => f.id === item.id);
    this.mode = 'view';
    this.view = 'detail';
    this.loadFundSalaryHeads(item.id);
    this.cdr.detectChanges();
  }

  goBack(): void {
    this.view = 'list';
    this.loadFunds();
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
      const f = this.funds[this.currentIndex];
      if (f) this.fund = { ...f, vendor_id: f.vendor_id ? String(f.vendor_id) : '' };
      this.mode = 'view';
      this.cdr.detectChanges();
    }
  }

  navigatePrev(): void {
    if (this.currentIndex <= 0) return;
    this.currentIndex--;
    const f = this.funds[this.currentIndex];
    this.fund = { ...f, vendor_id: f.vendor_id ? String(f.vendor_id) : '' };
    this.mode = 'view';
    this.loadFundSalaryHeads(f.id);
    this.cdr.detectChanges();
  }

  navigateNext(): void {
    if (this.currentIndex >= this.funds.length - 1) return;
    this.currentIndex++;
    const f = this.funds[this.currentIndex];
    this.fund = { ...f, vendor_id: f.vendor_id ? String(f.vendor_id) : '' };
    this.mode = 'view';
    this.loadFundSalaryHeads(f.id);
    this.cdr.detectChanges();
  }

  loadFundSalaryHeads(fundId: number): void {
    this.api.get<any>(`/benefits/retirement-funds/${fundId}/salary-heads`).subscribe({
      next: (d) => { this.fundSalaryHeads = d || []; this.cdr.detectChanges(); },
      error: () => { this.fundSalaryHeads = []; this.cdr.detectChanges(); }
    });
  }

  addSalaryHead(): void {
    if (!this.selectedSalaryHead || !this.fund.id) return;
    this.api.post(`/benefits/retirement-funds/${this.fund.id}/salary-heads`, {
      salary_head_id: parseInt(this.selectedSalaryHead)
    }).subscribe({
      next: () => {
        this.selectedSalaryHead = '';
        this.loadFundSalaryHeads(this.fund.id);
        this.ui.toast('success', 'Added', 'Salary transaction added');
      },
      error: () => this.ui.toast('error', 'Error', 'Failed to add salary transaction')
    });
  }

  removeSalaryHead(sh: any): void {
    this.api.delete(`/benefits/retirement-funds/${this.fund.id}/salary-heads/${sh.id}`).subscribe({
      next: () => {
        this.loadFundSalaryHeads(this.fund.id);
        this.ui.toast('success', 'Removed', 'Salary transaction removed');
      },
      error: () => this.ui.toast('error', 'Error', 'Failed to remove')
    });
  }

  get availableSalaryHeads(): any[] {
    const usedIds = new Set(this.fundSalaryHeads.map(s => s.salary_head_id));
    return this.earningHeads.filter(h => !usedIds.has(h.id));
  }

  save(): void {
    if (!this.fund.name) { this.ui.toast('error', 'Validation', 'Fund name is required'); return; }
    const vendorId = this.fund.vendor_id ? parseInt(this.fund.vendor_id) : null;
    const payload = {
      ...this.fund,
      fund_type: this.benefitType,
      vendor_id: vendorId,
      fund_category_factor: parseFloat(this.fund.fund_category_factor) || null,
      employer_contribution_value: parseFloat(this.fund.employer_contribution_value) || 0,
      employer_max_value: parseFloat(this.fund.employer_max_value) || 0,
      employee_contribution_value: parseFloat(this.fund.employee_contribution_value) || 0,
      employee_max_value: parseFloat(this.fund.employee_max_value) || 0,
    };

    const obs = this.fund.id
      ? this.api.put(`/benefits/retirement-funds/${this.fund.id}`, payload)
      : this.api.post('/benefits/retirement-funds', payload);

    const isEdit = !!this.fund.id;
    obs.subscribe({
      next: (result: any) => {
        this.ui.toast('success', 'Saved', isEdit ? 'Fund updated' : 'Fund created');
        if (isEdit) {
          this.loadFunds();
          this.mode = 'view';
        } else {
          this.goBack();
        }
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.ui.toast('error', 'Error', err?.error?.error?.message || 'Failed to save fund');
      }
    });
  }

  deleteFromList(fund: any, event?: Event): void {
    if (event) event.stopPropagation();
    if (!confirm(`Delete fund "${fund.name}"?`)) return;
    this.api.delete(`/benefits/retirement-funds/${fund.id}`).subscribe({
      next: () => {
        this.ui.toast('success', 'Deleted', 'Fund deleted');
        this.loadFunds();
      },
      error: (err: any) => {
        this.ui.toast('error', 'Error', err?.error?.error?.message || 'Cannot delete fund');
      }
    });
  }

  formatDate(d: any): string {
    if (!d) return '-';
    return String(d).split('T')[0];
  }

  formatPct(v: any): string {
    const n = parseFloat(v);
    if (isNaN(n) || n === 0) return '-';
    return n.toFixed(2) + '%';
  }

  formatCurrency(v: any): string {
    const n = parseFloat(v) || 0;
    return 'R ' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }
}
