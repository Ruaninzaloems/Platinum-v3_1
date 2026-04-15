import { Component, ChangeDetectionStrategy, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-delegations',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatCardModule, MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatDatepickerModule, MatNativeDateModule, MatSelectModule, MatMenuModule, MatTooltipModule, MatChipsModule],
  templateUrl: './delegations.component.html',
  styleUrl: './delegations.component.scss'
})
export class DelegationsComponent implements OnInit {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  currentView = signal<'list' | 'detail' | 'create'>('list');
  activeTab = signal<'delegations' | 'thresholds'>('delegations');
  delegations = signal<any[]>([]);
  thresholds = signal<any[]>([]);
  selectedDelegation = signal<any>(null);
  notification = signal<string>('');
  notificationType = signal<'success' | 'error'>('success');
  loading = signal(false);
  saving = signal(false);
  editMode = signal(false);
  totalPages = signal(1);
  currentPage = signal(1);
  pageSize = signal(20);
  showRevokeDialog = signal(false);
  revokeTarget = signal<any>(null);
  revokeReason = '';
  showEditThresholdDialog = signal(false);
  editingThreshold = signal<any>(null);
  thresholdEditAmount = 0;
  thresholdEditDescription = '';

  searchQuery = '';
  filterStatus = '';
  thresholdFilterRole = '';
  thresholdFilterType = '';

  delegationForm: any = {};

  userMap: Record<string, string> = {
    'USR001': 'Municipal Manager',
    'USR002': 'CFO (J. van der Merwe)',
    'USR003': 'SCM Manager (T. Nkosi)',
    'USR004': 'SCM Practitioner (L. Mokoena)',
    'USR005': 'Budget Officer (S. Pillay)',
    'USR006': 'Stores Officer (M. Dlamini)',
    'USR007': 'Approving Officer (K. Botha)',
    'USR008': 'Creditors Clerk (N. Zulu)',
    'USR009': 'Internal Auditor (P. Govender)',
    'USR010': 'Expenditure Officer (R. Mthembu)'
  };

  roleLabels: Record<string, string> = {
    'requestor': 'Requestor',
    'scm_practitioner': 'SCM Practitioner',
    'scm_manager': 'SCM Manager',
    'budget_officer': 'Budget Officer',
    'approving_officer': 'Approving Officer',
    'stores_officer': 'Stores Officer',
    'creditors_clerk': 'Creditors Clerk',
    'expenditure_officer': 'Expenditure Officer',
    'cfo': 'Chief Financial Officer',
    'municipal_manager': 'Municipal Manager',
    'bsc_chairperson': 'BSC Chairperson',
    'bec_chairperson': 'BEC Chairperson',
    'bac_chairperson': 'BAC Chairperson',
    'internal_auditor': 'Internal Auditor',
    'system_admin': 'System Admin'
  };

  roleOptions = [
    { value: 'requestor', label: 'Requestor' },
    { value: 'scm_practitioner', label: 'SCM Practitioner' },
    { value: 'scm_manager', label: 'SCM Manager' },
    { value: 'budget_officer', label: 'Budget Officer' },
    { value: 'approving_officer', label: 'Approving Officer' },
    { value: 'stores_officer', label: 'Stores Officer' },
    { value: 'creditors_clerk', label: 'Creditors Clerk' },
    { value: 'expenditure_officer', label: 'Expenditure Officer' },
    { value: 'cfo', label: 'Chief Financial Officer' },
    { value: 'municipal_manager', label: 'Municipal Manager' }
  ];

  transactionTypeOptions = [
    'requisitions', 'orders', 'rfq', 'quotations', 'tenders',
    'contracts', 'payments', 'invoices', 'grn', 'deviations', 'budget_transfers'
  ];

  get activeDelegations(): () => number {
    return () => this.delegations().filter(d => d.status === 'active').length;
  }

  get expiredDelegations(): () => number {
    return () => this.delegations().filter(d => d.status === 'expired').length;
  }

  get revokedDelegations(): () => number {
    return () => this.delegations().filter(d => d.status === 'revoked').length;
  }

  get highestDelegation(): () => number {
    return () => {
      const amounts = this.delegations().map(d => d.maxAmount?.amount || 0);
      return amounts.length > 0 ? Math.max(...amounts) : 0;
    };
  }

  filteredThresholds = () => {
    let filtered = this.thresholds();
    if (this.thresholdFilterRole) filtered = filtered.filter(t => t.role === this.thresholdFilterRole);
    if (this.thresholdFilterType) filtered = filtered.filter(t => t.transactionType === this.thresholdFilterType);
    return filtered;
  };

  ngOnInit() {
    this.loadDelegations();
    this.loadThresholds();
  }

  loadDelegations() {
    this.loading.set(true);
    const params: any = { page: this.currentPage(), pageSize: this.pageSize() };
    if (this.searchQuery) params.search = this.searchQuery;
    if (this.filterStatus) params.status = this.filterStatus;
    const queryString = Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v as string)}`).join('&');

    this.http.get<any>(`${this.apiUrl}/delegations?${queryString}`).subscribe({
      next: (data) => {
        this.delegations.set(data.data || data || []);
        this.totalPages.set(data.totalPages || 1);
        this.loading.set(false);
      },
      error: () => {
        this.delegations.set([]);
        this.loading.set(false);
      }
    });
  }

  loadThresholds() {
    this.http.get<any>(`${this.apiUrl}/delegations/thresholds`).subscribe({
      next: (data) => this.thresholds.set(data || []),
      error: () => this.thresholds.set([])
    });
  }

  switchToThresholds() {
    this.activeTab.set('thresholds');
    this.loadThresholds();
  }

  viewDelegation(del: any) {
    this.loading.set(true);
    this.http.get<any>(`${this.apiUrl}/delegations/${del.id}`).subscribe({
      next: (data) => {
        this.selectedDelegation.set(data);
        this.currentView.set('detail');
        this.loading.set(false);
      },
      error: () => {
        this.selectedDelegation.set(del);
        this.currentView.set('detail');
        this.loading.set(false);
      }
    });
  }

  openCreateForm() {
    this.editMode.set(false);
    this.delegationForm = {
      delegatedBy: '',
      delegatedTo: '',
      role: '',
      transactionTypes: [],
      maxAmount: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      reason: '',
      councilResolution: ''
    };
    this.currentView.set('create');
  }

  editDelegation(del: any) {
    this.editMode.set(true);
    this.delegationForm = {
      id: del.id,
      delegatedBy: del.delegatedBy,
      delegatedTo: del.delegatedTo,
      role: del.role,
      transactionTypes: [...(del.transactionTypes || [])],
      maxAmount: del.maxAmount?.amount || 0,
      startDate: del.startDate ? del.startDate.split('T')[0] : '',
      endDate: del.endDate ? del.endDate.split('T')[0] : '',
      reason: del.reason || '',
      councilResolution: del.councilResolution || ''
    };
    this.currentView.set('create');
  }

  saveDelegation() {
    this.saving.set(true);
    const payload = {
      delegatedBy: this.delegationForm.delegatedBy,
      delegatedTo: this.delegationForm.delegatedTo,
      role: this.delegationForm.role,
      transactionTypes: this.delegationForm.transactionTypes,
      maxAmount: { amount: Number(this.delegationForm.maxAmount), currency: 'ZAR' },
      startDate: this.delegationForm.startDate,
      endDate: this.delegationForm.endDate,
      reason: this.delegationForm.reason,
      councilResolution: this.delegationForm.councilResolution
    };

    const request = this.editMode()
      ? this.http.put<any>(`${this.apiUrl}/delegations/${this.delegationForm.id}`, payload)
      : this.http.post<any>(`${this.apiUrl}/delegations`, payload);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.showNotification(this.editMode() ? 'Delegation updated successfully' : 'Delegation created successfully');
        this.backToList();
        this.loadDelegations();
      },
      error: (err) => {
        this.saving.set(false);
        this.showNotification('Error: ' + (err.error?.message || 'Failed to save delegation'), 'error');
      }
    });
  }

  openRevokeDialog(del: any) {
    this.revokeTarget.set(del);
    this.revokeReason = '';
    this.showRevokeDialog.set(true);
  }

  confirmRevoke() {
    const target = this.revokeTarget();
    if (!target) return;

    this.http.post<any>(`${this.apiUrl}/delegations/${target.id}/revoke`, { reason: this.revokeReason }).subscribe({
      next: () => {
        this.showRevokeDialog.set(false);
        this.showNotification('Delegation revoked successfully');
        this.loadDelegations();
        if (this.selectedDelegation()?.id === target.id) {
          this.viewDelegation(target);
        }
      },
      error: (err) => {
        this.showNotification('Error: ' + (err.error?.error || 'Failed to revoke'), 'error');
      }
    });
  }

  openEditThreshold(thr: any) {
    this.editingThreshold.set(thr);
    this.thresholdEditAmount = thr.maxAmount?.amount || 0;
    this.thresholdEditDescription = thr.description || '';
    this.showEditThresholdDialog.set(true);
  }

  saveThreshold() {
    const thr = this.editingThreshold();
    if (!thr) return;

    this.http.put<any>(`${this.apiUrl}/delegations/thresholds/${thr.id}`, {
      maxAmount: { amount: Number(this.thresholdEditAmount), currency: 'ZAR' },
      description: this.thresholdEditDescription
    }).subscribe({
      next: () => {
        this.showEditThresholdDialog.set(false);
        this.showNotification('Threshold updated successfully');
        this.loadThresholds();
      },
      error: () => {
        this.showNotification('Failed to update threshold', 'error');
      }
    });
  }

  backToList() {
    this.currentView.set('list');
    this.selectedDelegation.set(null);
    this.editMode.set(false);
  }

  changePage(page: number) {
    this.currentPage.set(page);
    this.loadDelegations();
  }

  clearFilters() {
    this.searchQuery = '';
    this.filterStatus = '';
    this.currentPage.set(1);
    this.loadDelegations();
  }

  clearThresholdFilters() {
    this.thresholdFilterRole = '';
    this.thresholdFilterType = '';
  }

  getUserName(userId: string): string {
    return this.userMap[userId] || userId || '—';
  }

  getRoleLabel(role: string): string {
    return this.roleLabels[role] || role || '—';
  }

  formatDate(date: string): string {
    if (!date) return '—';
    try {
      return new Date(date).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch { return date; }
  }

  formatCurrency(value: number): string {
    if (typeof value === 'object' && value !== null) value = (value as any).amount || 0;
    return 'R ' + (value || 0).toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  formatCurrencyFull(value: number): string {
    if (typeof value === 'object' && value !== null) value = (value as any).amount || 0;
    return 'R ' + (value || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  showNotification(msg: string, type: 'success' | 'error' = 'success') {
    this.notification.set(msg);
    this.notificationType.set(type);
    setTimeout(() => this.notification.set(''), 4000);
  }
}
