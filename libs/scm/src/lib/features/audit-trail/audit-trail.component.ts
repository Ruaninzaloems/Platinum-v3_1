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
import { environment } from '../../environment';

@Component({
  selector: 'app-audit-trail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatCardModule, MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatDatepickerModule, MatNativeDateModule, MatSelectModule, MatMenuModule, MatTooltipModule, MatChipsModule],
  templateUrl: './audit-trail.component.html',
  styleUrl: './audit-trail.component.scss'
})
export class AuditTrailComponent implements OnInit {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  currentView = signal<'list' | 'entity-timeline' | 'user-activity'>('list');
  entries = signal<any[]>([]);
  entityTimeline = signal<any[]>([]);
  userEntries = signal<any[]>([]);
  notification = signal<string>('');
  notificationError = signal(false);
  loading = signal(false);
  totalPages = signal(1);
  currentPage = signal(1);
  pageSize = signal(20);
  totalEntries = signal(0);
  showFilters = signal(false);

  timelineEntityType = signal('');
  timelineEntityId = signal('');

  kpiSummary = signal<any>({ totalEntries: 0, todayActions: 0, uniqueUsers: 0, mostActiveModule: '—', exportCount: 0 });

  availableModules = signal<string[]>([]);
  availableEntityTypes = signal<string[]>([]);
  availableUsers = signal<any[]>([]);

  searchQuery = '';
  filterAction = '';
  filterModule = '';
  filterEntityType = '';
  filterUserId = '';
  filterDateFrom = '';
  filterDateTo = '';
  selectedUserId = '';

  private exportCount = 0;

  ngOnInit() {
    this.loadEntries();
    this.loadSummary();
    this.loadModules();
  }

  loadSummary() {
    this.http.get<any>(`${this.apiUrl}/audit-trail/summary`).subscribe({
      next: (summary) => {
        const mostActiveModule = summary.byModule?.[0]?.module || '—';
        const uniqueUsers = summary.topUsers?.length || 0;
        this.kpiSummary.set({
          totalEntries: summary.totalEntries || 0,
          todayActions: summary.todayEntries || 0,
          uniqueUsers,
          mostActiveModule: mostActiveModule.charAt(0).toUpperCase() + mostActiveModule.slice(1),
          exportCount: this.exportCount
        });
        const userList = (summary.topUsers || []).map((u: any) => ({ id: u.userId, name: u.userName }));
        this.availableUsers.set(userList.sort((a: any, b: any) => a.name.localeCompare(b.name)));
      },
      error: () => {}
    });
  }

  loadModules() {
    this.http.get<any[]>(`${this.apiUrl}/audit-trail/modules`).subscribe({
      next: (modules) => {
        this.availableModules.set(modules.map((m: any) => m.code).sort());
      },
      error: () => {}
    });
    this.http.get<any[]>(`${this.apiUrl}/audit-trail/actions`).subscribe({
      next: (actions) => {
        this.availableEntityTypes.set(actions.map((a: any) => a.code).sort());
      },
      error: () => {}
    });
  }

  loadEntries() {
    this.loading.set(true);
    const params: any = {
      page: this.currentPage(),
      pageSize: this.pageSize()
    };
    if (this.searchQuery) params.search = this.searchQuery;
    if (this.filterAction) params.action = this.filterAction;
    if (this.filterModule) params.module = this.filterModule;
    if (this.filterEntityType) params.entityType = this.filterEntityType;
    if (this.filterUserId) params.userId = this.filterUserId;
    if (this.filterDateFrom) params.dateFrom = this.filterDateFrom;
    if (this.filterDateTo) params.dateTo = this.filterDateTo;

    const queryString = Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v as string)}`).join('&');
    this.http.get<any>(`${this.apiUrl}/audit-trail?${queryString}`).subscribe({
      next: (data) => {
        this.entries.set(data.data || []);
        this.totalPages.set(data.totalPages || 1);
        this.totalEntries.set(data.total || 0);
        this.loading.set(false);
      },
      error: () => {
        this.entries.set([]);
        this.loading.set(false);
      }
    });
  }

  viewEntityTimeline(entityType: string, entityId: string) {
    this.loading.set(true);
    this.timelineEntityType.set(entityType);
    this.timelineEntityId.set(entityId);
    this.http.get<any>(`${this.apiUrl}/audit-trail/entity/${entityType}/${entityId}`).subscribe({
      next: (data) => {
        this.entityTimeline.set(Array.isArray(data) ? data : data.data || []);
        this.currentView.set('entity-timeline');
        this.loading.set(false);
      },
      error: () => {
        this.entityTimeline.set([]);
        this.currentView.set('entity-timeline');
        this.loading.set(false);
      }
    });
  }

  loadUserActivity() {
    if (!this.selectedUserId) return;
    this.loading.set(true);
    this.http.get<any>(`${this.apiUrl}/audit-trail/user/${this.selectedUserId}?page=1&pageSize=100`).subscribe({
      next: (data) => {
        this.userEntries.set(data.data || []);
        this.loading.set(false);
      },
      error: () => {
        this.userEntries.set([]);
        this.loading.set(false);
      }
    });
  }

  exportAuditLog() {
    this.loading.set(true);
    const params: any = {};
    if (this.filterEntityType) params.entityType = this.filterEntityType;
    if (this.filterUserId) params.userId = this.filterUserId;
    if (this.filterModule) params.module = this.filterModule;
    if (this.filterAction) params.action = this.filterAction;
    if (this.filterDateFrom) params.dateFrom = this.filterDateFrom;
    if (this.filterDateTo) params.dateTo = this.filterDateTo;
    const queryString = Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v as string)}`).join('&');

    this.http.get<any>(`${this.apiUrl}/audit-trail/export${queryString ? '?' + queryString : ''}`).subscribe({
      next: (data) => {
        this.loading.set(false);
        this.exportCount++;
        this.kpiSummary.update(s => ({ ...s, exportCount: this.exportCount }));
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-trail-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.showNotification('Audit log exported successfully');
      },
      error: () => {
        this.loading.set(false);
        this.showNotification('Failed to export audit log', true);
      }
    });
  }

  backToList() {
    this.currentView.set('list');
    this.entityTimeline.set([]);
  }

  changePage(page: number) {
    this.currentPage.set(page);
    this.loadEntries();
  }

  clearFilters() {
    this.searchQuery = '';
    this.filterAction = '';
    this.filterModule = '';
    this.filterEntityType = '';
    this.filterUserId = '';
    this.filterDateFrom = '';
    this.filterDateTo = '';
    this.currentPage.set(1);
    this.loadEntries();
  }

  getUserName(userId: string): string {
    const user = this.availableUsers().find(u => u.id === userId);
    return user?.name || userId;
  }

  getActionIcon(action: string): string {
    const icons: Record<string, string> = {
      login: 'login',
      create: 'add_circle',
      update: 'edit',
      approve: 'check_circle',
      reject: 'cancel',
      submit: 'send',
      delete: 'delete',
      publish: 'public',
      award: 'emoji_events'
    };
    return icons[action] || 'info';
  }

  formatEntityType(type: string): string {
    if (!type) return '—';
    return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  formatTimestamp(ts: string): string {
    if (!ts) return '—';
    try {
      return new Date(ts).toLocaleString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return ts; }
  }

  showNotification(msg: string, isError = false) {
    this.notification.set(msg);
    this.notificationError.set(isError);
    setTimeout(() => this.notification.set(''), 4000);
  }
}
