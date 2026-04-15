import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { UiService } from '../../../core/services/ui.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { DateInputComponent } from '../../../shared/components/date-input/date-input.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { DateSaPipe } from '../../../shared/pipes/date-sa.pipe';

@Component({
  selector: 'app-payroll-cycles',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, DateInputComponent, StatusBadgeComponent, DateSaPipe],
  templateUrl: './payroll-cycles.component.html',
  styleUrl: './payroll-cycles.component.css'
})
export class PayrollCyclesComponent implements OnInit {
  cycles: any[] = [];
  loading = true;
  showModal = false;
  editItem: any = {};
  isEdit = false;

  get activeCount(): number { return this.cycles.filter(c => c.enabled).length; }

  constructor(public api: ApiService, private ui: UiService, public cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.api.get<any[]>('/payroll/cycles', { all: 'true' }).subscribe({
      next: (data) => { this.cycles = data || []; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  getActivePayrollYear(): string {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    if (month >= 2) return `${year}/${year + 1}`;
    return `${year - 1}/${year}`;
  }

  getCycleTypeLabel(type: string): string {
    const map: Record<string, string> = { 'MONTHLY': 'Monthly', 'WEEKLY': 'Weekly', 'BI_WEEKLY': 'Bi-Weekly', 'BI-WEEKLY': 'Bi-Weekly', 'FORTNIGHTLY': 'Fortnightly' };
    return map[type] || type;
  }

  getPeriodsLabel(type: string): string {
    const map: Record<string, string> = { 'MONTHLY': '12 periods/year', 'WEEKLY': '52 periods/year', 'BI_WEEKLY': '26 periods/year', 'BI-WEEKLY': '26 periods/year', 'FORTNIGHTLY': '26 periods/year' };
    return map[type] || '';
  }

  openAdd(): void {
    this.editItem = { name: '', description: '', cycle_type: '', start_date: '' };
    this.isEdit = false;
    this.showModal = true;
    this.cdr.detectChanges();
  }

  openEdit(item: any): void {
    this.editItem = { ...item };
    this.isEdit = true;
    this.showModal = true;
    this.cdr.detectChanges();
  }

  closeModal(): void {
    this.showModal = false;
    this.cdr.detectChanges();
  }

  save(): void {
    if (!this.editItem.name) { this.ui.toast('warning', 'Validation', 'Cycle description is required'); return; }
    if (!this.editItem.cycle_type) { this.ui.toast('warning', 'Validation', 'Cycle type is required'); return; }

    if (this.isEdit) {
      this.api.put(`/payroll/cycles/${this.editItem.id}`, this.editItem).subscribe({
        next: () => { this.ui.toast('success', 'Updated', 'Payroll cycle updated'); this.closeModal(); this.load(); },
        error: (err: any) => { this.ui.toast('error', 'Error', err?.error?.message || 'Failed to update'); this.cdr.detectChanges(); }
      });
    } else {
      this.api.post('/payroll/cycles', this.editItem).subscribe({
        next: () => { this.ui.toast('success', 'Created', 'Payroll cycle created'); this.closeModal(); this.load(); },
        error: (err: any) => { this.ui.toast('error', 'Error', err?.error?.message || 'Failed to create'); this.cdr.detectChanges(); }
      });
    }
  }

  toggleEnabled(item: any): void {
    this.api.put(`/payroll/cycles/${item.id}`, { enabled: !item.enabled }).subscribe({
      next: () => { item.enabled = !item.enabled; this.cdr.detectChanges(); },
      error: () => { this.ui.toast('error', 'Error', 'Failed to update'); }
    });
  }

  deleteCycle(item: any): void {
    if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    this.api.delete(`/payroll/cycles/${item.id}`).subscribe({
      next: () => { this.ui.toast('success', 'Deleted', 'Payroll cycle deleted'); this.load(); },
      error: (err: any) => { this.ui.toast('error', 'Error', err?.error?.message || 'Failed to delete'); this.cdr.detectChanges(); }
    });
  }
}
