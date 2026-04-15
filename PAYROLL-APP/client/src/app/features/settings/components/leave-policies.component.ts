import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { UiService } from '../../../core/services/ui.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-leave-policies',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './leave-policies.component.html',
  styleUrl: './leave-policies.component.css'
})
export class LeavePoliciesComponent implements OnInit {
  policies: any[] = [];
  filteredPolicies: any[] = [];
  searchTerm = '';
  loading = true;
  showModal = false;
  editItem: any = {};

  constructor(private api: ApiService, private ui: UiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.api.get<any[]>('/leave/policies').subscribe({
      next: (data) => { this.policies = data || []; this.applyFilter(); this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  applyFilter(): void {
    const s = this.searchTerm.toLowerCase();
    this.filteredPolicies = s
      ? this.policies.filter(p =>
          (p.leave_type_name || '').toLowerCase().includes(s) ||
          (p.accrual_method || '').toLowerCase().includes(s))
      : [...this.policies];
    this.cdr.detectChanges();
  }

  get annualCount(): number {
    return this.policies.filter(p => (p.accrual_method || '').toUpperCase() === 'ANNUAL').length;
  }

  get monthlyCount(): number {
    return this.policies.filter(p => (p.accrual_method || '').toUpperCase() === 'MONTHLY').length;
  }

  formatNum(val: any): string {
    return parseFloat(val || 0).toFixed(2);
  }

  openEditModal(policy: any): void {
    this.editItem = { ...policy };
    this.showModal = true;
  }

  save(): void {
    const body = {
      accrual_method: this.editItem.accrual_method,
      accrual_amount: parseFloat(this.editItem.accrual_amount) || 0,
      max_balance: parseFloat(this.editItem.max_balance) || 0,
      carry_over_limit: parseFloat(this.editItem.carry_over_limit) || 0,
      cycle_months: parseInt(this.editItem.cycle_months) || 12,
      requires_medical_cert_after_days: parseInt(this.editItem.requires_medical_cert_after_days) || 0,
    };
    this.api.put(`/leave/policies/${this.editItem.id}`, body).subscribe({
      next: () => { this.ui.toast('success', 'Updated', 'Leave policy updated successfully'); this.showModal = false; this.load(); },
      error: () => this.ui.toast('error', 'Error', 'Failed to update')
    });
  }
}
