import { Component, ChangeDetectionStrategy, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { environment } from '../../environment';

@Component({
  selector: 'app-reports',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatCardModule, MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatMenuModule, MatTooltipModule, MatChipsModule, MatSlideToggleModule],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss'
})
export class ReportsComponent implements OnInit {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  currentTab = signal<'catalog' | 'scheduled' | 'history'>('catalog');
  allReports = signal<any[]>([]);
  filteredReportsList = signal<any[]>([]);
  scheduledReports = signal<any[]>([]);
  downloadableReports = signal<any[]>([]);
  downloadHistory = signal<any[]>([]);
  notification = signal('');
  notificationType = signal<'success' | 'error'>('success');
  loading = signal(false);
  generating = signal<string>('');
  showScheduleForm = signal(false);

  searchQuery = '';
  filterCategory = '';

  scheduleForm: any = {
    reportId: '',
    frequency: '',
    recipientsRaw: ''
  };

  private categoryIcons: Record<string, string> = {
    procurement: 'shopping_cart',
    financial: 'account_balance',
    compliance: 'gavel',
    inventory: 'inventory_2',
    suppliers: 'business',
    supplier: 'business',
    planning: 'trending_up',
    contracts: 'handshake',
    finance: 'account_balance'
  };

  private categoryLabels: Record<string, string> = {
    procurement: 'Procurement',
    financial: 'Financial',
    compliance: 'Compliance',
    inventory: 'Inventory',
    suppliers: 'Suppliers',
    supplier: 'Suppliers',
    planning: 'Planning',
    contracts: 'Contracts',
    finance: 'Financial'
  };

  ngOnInit() {
    this.loadReports();
    this.loadScheduledReports();
    this.loadDownloadableReports();
  }

  loadReports() {
    this.http.get<any[]>(`${this.apiUrl}/reports`).subscribe({
      next: (data) => {
        this.allReports.set(data || []);
        this.filteredReportsList.set(data || []);
      },
      error: () => this.allReports.set([])
    });
  }

  loadScheduledReports() {
    this.http.get<any[]>(`${this.apiUrl}/reports/scheduled`).subscribe({
      next: (data) => this.scheduledReports.set(data || []),
      error: () => this.scheduledReports.set([])
    });
  }

  loadDownloadableReports() {
    this.http.get<any[]>(`${this.apiUrl}/report-exports/available`).subscribe({
      next: (data) => this.downloadableReports.set(data || []),
      error: () => this.downloadableReports.set([])
    });
  }

  categories(): string[] {
    const cats = [...new Set(this.allReports().map(r => r.category))];
    return cats.sort();
  }

  filteredCategories(): string[] {
    const reports = this.filteredReportsList();
    const cats = [...new Set(reports.map((r: any) => r.category))];
    return cats.sort();
  }

  getReportsForCategory(category: string): any[] {
    return this.filteredReportsList().filter(r => r.category === category);
  }

  filterReports() {
    let reports = this.allReports();
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      reports = reports.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q)
      );
    }
    if (this.filterCategory) {
      reports = reports.filter(r => r.category === this.filterCategory);
    }
    this.filteredReportsList.set(reports);
  }

  clearFilters() {
    this.searchQuery = '';
    this.filterCategory = '';
    this.filteredReportsList.set(this.allReports());
  }

  getCategoryIcon(category: string): string {
    return this.categoryIcons[category] || 'description';
  }

  getCategoryLabel(category: string): string {
    return this.categoryLabels[category] || (category.charAt(0).toUpperCase() + category.slice(1));
  }

  isDownloadable(reportId: string): boolean {
    const downloadableIds = this.downloadableReports().map(r => r.id);
    return downloadableIds.includes(reportId);
  }

  generateReport(report: any) {
    this.generating.set(report.id);
    this.http.post<any>(`${this.apiUrl}/reports/${report.id}/generate`, {}).subscribe({
      next: (data) => {
        this.generating.set('');
        const historyItem = {
          reportId: report.id,
          reportName: report.name,
          format: report.format || 'pdf',
          generatedAt: data.generatedAt || new Date().toISOString(),
          downloadUrl: data.downloadUrl || null
        };
        this.downloadHistory.update(list => [historyItem, ...list]);
        this.showNotification(`Report "${report.name}" generated successfully`);
        this.loadReports();
      },
      error: () => {
        this.generating.set('');
        this.showNotification('Failed to generate report', 'error');
      }
    });
  }

  downloadReport(report: any) {
    const dlReport = this.downloadableReports().find(r => r.id === report.id);
    if (dlReport) {
      this.downloadPdfReport(dlReport.id);
    }
  }

  downloadPdfReport(reportId: string) {
    window.open(`${this.apiUrl}/report-exports/download/${reportId}`, '_blank');
  }

  openDownload(url: string) {
    window.open(`${this.apiUrl}${url.startsWith('/api') ? url.replace('/api', '') : url}`, '_blank');
  }

  createSchedule() {
    const recipients = this.scheduleForm.recipientsRaw
      .split(',')
      .map((r: string) => r.trim())
      .filter((r: string) => r.length > 0);

    const payload = {
      reportId: this.scheduleForm.reportId,
      frequency: this.scheduleForm.frequency,
      recipients,
      nextRun: this.calculateNextRun(this.scheduleForm.frequency)
    };

    this.http.post<any>(`${this.apiUrl}/reports/schedule`, payload).subscribe({
      next: () => {
        this.showNotification('Report schedule created successfully');
        this.showScheduleForm.set(false);
        this.scheduleForm = { reportId: '', frequency: '', recipientsRaw: '' };
        this.loadScheduledReports();
      },
      error: () => this.showNotification('Failed to create schedule', 'error')
    });
  }

  switchTab(tab: 'catalog' | 'scheduled' | 'history') {
    this.currentTab.set(tab);
    if (tab === 'scheduled') this.loadScheduledReports();
    if (tab === 'history') this.loadDownloadableReports();
  }

  getReportName(reportId: string): string {
    const report = this.allReports().find(r => r.id === reportId);
    return report?.name || reportId;
  }

  getEmailUser(email: string): string {
    return email.split('@')[0];
  }

  calculateNextRun(frequency: string): string {
    const now = new Date();
    switch (frequency) {
      case 'daily': now.setDate(now.getDate() + 1); break;
      case 'weekly': now.setDate(now.getDate() + 7); break;
      case 'monthly': now.setMonth(now.getMonth() + 1); break;
      case 'quarterly': now.setMonth(now.getMonth() + 3); break;
    }
    return now.toISOString();
  }

  formatDate(date: string): string {
    if (!date) return '—';
    try {
      return new Date(date).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch { return date; }
  }

  formatDateTime(date: string): string {
    if (!date) return '—';
    try {
      return new Date(date).toLocaleString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return date; }
  }

  showNotification(msg: string, type: 'success' | 'error' = 'success') {
    this.notification.set(msg);
    this.notificationType.set(type);
    setTimeout(() => this.notification.set(''), 4000);
  }
}
