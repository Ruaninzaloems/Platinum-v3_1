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
  selector: 'app-ifw-register',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatCardModule, MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatDatepickerModule, MatNativeDateModule, MatSelectModule, MatMenuModule, MatTooltipModule, MatChipsModule],
  templateUrl: './ifw-register.component.html',
  styleUrl: './ifw-register.component.scss'
})
export class IfwRegisterComponent implements OnInit {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  currentView = signal<'dashboard' | 'list' | 'detail' | 'form'>('dashboard');
  items = signal<any[]>([]);
  recentItems = signal<any[]>([]);
  selectedItem = signal<any>(null);
  summary = signal<any>({});
  notification = signal<string>('');
  notificationError = signal(false);
  loading = signal(false);
  totalPages = signal(1);
  currentPage = signal(1);
  editMode = signal(false);
  saving = signal(false);
  departments = signal<string[]>([
    'Infrastructure and Engineering',
    'Electricity',
    'Corporate Services',
    'Community Services',
    'Water & Sanitation',
    'Finance',
    'Planning & Development',
    'Public Safety'
  ]);

  searchQuery = '';
  filterType = '';
  filterStatus = '';
  filterDepartment = '';

  formData: any = {};

  ngOnInit() {
    this.loadSummary();
    this.loadItems();
    this.loadRecentItems();
  }

  loadSummary() {
    this.http.get<any>(`${this.apiUrl}/ifw/summary`).subscribe({
      next: (data) => this.summary.set(data),
      error: () => {}
    });
  }

  loadItems() {
    this.loading.set(true);
    const params: any = { page: this.currentPage(), pageSize: 20 };
    if (this.searchQuery) params.search = this.searchQuery;
    if (this.filterType) params.type = this.filterType;
    if (this.filterStatus) params.status = this.filterStatus;
    if (this.filterDepartment) params.department = this.filterDepartment;

    const queryStr = Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&');
    this.http.get<any>(`${this.apiUrl}/ifw?${queryStr}`).subscribe({
      next: (data) => {
        this.items.set(data.data || []);
        this.totalPages.set(data.totalPages || 1);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.showNotification('Failed to load incidents', true);
      }
    });
  }

  loadRecentItems() {
    this.http.get<any>(`${this.apiUrl}/ifw?page=1&pageSize=5&sortBy=discoveredDate&sortDir=desc`).subscribe({
      next: (data) => this.recentItems.set(data.data || []),
      error: () => {}
    });
  }

  viewItem(item: any) {
    this.loading.set(true);
    this.http.get<any>(`${this.apiUrl}/ifw/${item.id}`).subscribe({
      next: (data) => {
        this.selectedItem.set(data);
        this.currentView.set('detail');
        this.loading.set(false);
      },
      error: () => {
        this.selectedItem.set(item);
        this.currentView.set('detail');
        this.loading.set(false);
      }
    });
  }

  editItem(item: any) {
    this.editMode.set(true);
    this.formData = {
      id: item.id,
      type: item.type,
      title: item.title,
      description: item.description,
      department: item.department,
      amountValue: item.amount?.amount || 0,
      responsibleOfficer: item.responsibleOfficer || '',
      discoveredDate: item.discoveredDate ? item.discoveredDate.split('T')[0] : '',
      relatedEntityType: item.relatedEntity?.type || '',
      relatedEntityId: item.relatedEntity?.id || '',
      relatedEntityDescription: item.relatedEntity?.description || ''
    };
    this.currentView.set('form');
  }

  openCreateForm() {
    this.editMode.set(false);
    this.formData = {
      type: '',
      title: '',
      description: '',
      department: '',
      amountValue: 0,
      responsibleOfficer: '',
      discoveredDate: new Date().toISOString().split('T')[0],
      relatedEntityType: '',
      relatedEntityId: '',
      relatedEntityDescription: ''
    };
    this.currentView.set('form');
  }

  saveItem() {
    this.saving.set(true);
    const payload: any = {
      type: this.formData.type,
      title: this.formData.title,
      description: this.formData.description,
      department: this.formData.department,
      amount: { amount: Number(this.formData.amountValue) || 0, currency: 'ZAR' },
      responsibleOfficer: this.formData.responsibleOfficer,
      discoveredDate: this.formData.discoveredDate ? new Date(this.formData.discoveredDate).toISOString() : new Date().toISOString()
    };
    if (this.formData.relatedEntityType && this.formData.relatedEntityId) {
      payload.relatedEntity = {
        type: this.formData.relatedEntityType,
        id: this.formData.relatedEntityId,
        description: this.formData.relatedEntityDescription || ''
      };
    }

    const request = this.editMode()
      ? this.http.put<any>(`${this.apiUrl}/ifw/${this.formData.id}`, payload)
      : this.http.post<any>(`${this.apiUrl}/ifw`, payload);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.showNotification(this.editMode() ? 'Incident updated successfully' : 'Incident reported successfully');
        this.backToList();
        this.loadItems();
        this.loadSummary();
        this.loadRecentItems();
      },
      error: (err) => {
        this.saving.set(false);
        this.showNotification('Error saving incident: ' + (err.error?.message || 'Unknown error'), true);
      }
    });
  }

  updateStatus(id: string, status: string) {
    this.http.patch<any>(`${this.apiUrl}/ifw/${id}/status`, { status }).subscribe({
      next: () => {
        this.showNotification(`Status updated to ${this.getStatusLabel(status)}`);
        this.loadItems();
        this.loadSummary();
        this.loadRecentItems();
        if (this.selectedItem()?.id === id) {
          this.viewItem({ id });
        }
      },
      error: () => this.showNotification('Failed to update status', true)
    });
  }

  backToList() {
    this.currentView.set('list');
    this.selectedItem.set(null);
    this.editMode.set(false);
  }

  changePage(page: number) {
    this.currentPage.set(page);
    this.loadItems();
  }

  clearFilters() {
    this.searchQuery = '';
    this.filterType = '';
    this.filterStatus = '';
    this.filterDepartment = '';
    this.currentPage.set(1);
    this.loadItems();
  }

  getStatusCount(status: string): number {
    return this.summary().byStatus?.[status] || 0;
  }

  getStatusPercent(status: string): number {
    const total = this.summary().total || 1;
    return Math.round(((this.summary().byStatus?.[status] || 0) / total) * 100);
  }

  isStatusReached(status: string): boolean {
    const order = ['reported', 'under_investigation', 'resolved', 'reported_to_council'];
    const current = this.selectedItem()?.status || '';
    return order.indexOf(status) <= order.indexOf(current);
  }

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      irregular: 'Irregular',
      fruitless_wasteful: 'Fruitless & Wasteful',
      unauthorized: 'Unauthorized'
    };
    return labels[type] || type;
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      reported: 'Reported',
      under_investigation: 'Under Investigation',
      resolved: 'Resolved',
      reported_to_council: 'Reported to Council'
    };
    return labels[status] || status;
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

  showNotification(msg: string, isError = false) {
    this.notification.set(msg);
    this.notificationError.set(isError);
    setTimeout(() => this.notification.set(''), 4000);
  }
}
