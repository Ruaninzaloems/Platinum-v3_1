import { Component, ChangeDetectionStrategy, signal, computed, inject, OnInit } from '@angular/core';
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
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { environment } from '../../../environments/environment';
import { AnalyticsService } from '../../core/services/analytics.service';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

@Component({
  selector: 'app-supplier-performance',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatCardModule, MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatDatepickerModule, MatNativeDateModule, MatSelectModule, MatMenuModule, MatTooltipModule, MatTabsModule, MatChipsModule, MatBadgeModule],
  templateUrl: './supplier-performance.component.html',
  styleUrl: './supplier-performance.component.scss'
})
export class SupplierPerformanceComponent implements OnInit {
  private http = inject(HttpClient);

  currentView = signal<'main' | 'issue-detail' | 'scorecard-detail' | 'blacklist-detail' | 'analytics'>('main');
  activeTab = signal<'dashboard' | 'issues' | 'blacklist' | 'whitelist' | 'scorecards' | 'reports'>('dashboard');
  reportTab = signal<'performance' | 'diversity' | 'trends'>('performance');
  notification = signal('');
  saving = signal(false);

  config = signal<any>({ issueCategories: [], issueSeverities: [], issueStatuses: [], scorecardWeights: {} });
  dashboardData = signal<any>({});
  diversityData = signal<any>(null);
  suppliers = signal<any[]>([]);

  issues = signal<any[]>([]);
  issueTotal = signal(0);
  issuePageNum = signal(1);
  issuePageSize = 20;
  issueTotalPages = computed(() => Math.max(1, Math.ceil(this.issueTotal() / this.issuePageSize)));
  issuePageStart = computed(() => this.issueTotal() === 0 ? 0 : (this.issuePageNum() - 1) * this.issuePageSize + 1);
  issuePageEnd = computed(() => Math.min(this.issuePageNum() * this.issuePageSize, this.issueTotal()));
  issueSearch = '';
  issueFilterCategory = '';
  issueFilterSeverity = '';
  issueFilterStatus = '';
  issueDateFrom = '';
  issueDateTo = '';

  showCreateIssue = signal(false);
  issueForm: any = { supplierId: '', category: '', severity: '', description: '' };
  selectedIssue = signal<any>(null);
  contactForm: any = { contactType: 'Email', contactPerson: '', email: '', comments: '' };

  blacklistData = signal<any[]>([]);
  blTotal = signal(0);
  blPageNum = signal(1);
  blPageSize = 20;
  blTotalPages = computed(() => Math.max(1, Math.ceil(this.blTotal() / this.blPageSize)));
  blPageStart = computed(() => this.blTotal() === 0 ? 0 : (this.blPageNum() - 1) * this.blPageSize + 1);
  blPageEnd = computed(() => Math.min(this.blPageNum() * this.blPageSize, this.blTotal()));
  blSearch = '';
  blFilterSource = '';
  blFilterStatus = '';

  showImportCsv = signal(false);
  csvImportText = '';
  importResult = signal<any>(null);
  showCheckSuppliers = signal(false);
  checkForm: any = { registrationNumber: '', csdNumber: '', supplierName: '' };
  checkResult = signal<any>(null);
  selectedBlacklist = signal<any>(null);

  whitelistData = signal<any[]>([]);
  wlTotal = signal(0);
  wlPageNum = signal(1);
  wlPageSize = 20;
  wlTotalPages = computed(() => Math.max(1, Math.ceil(this.wlTotal() / this.wlPageSize)));
  wlPageStart = computed(() => this.wlTotal() === 0 ? 0 : (this.wlPageNum() - 1) * this.wlPageSize + 1);
  wlPageEnd = computed(() => Math.min(this.wlPageNum() * this.wlPageSize, this.wlTotal()));
  wlFilterCategory = '';
  showAddWhitelist = signal(false);
  wlForm: any = { supplierId: '', category: '', reason: '' };

  scorecards = signal<any[]>([]);
  scTotal = signal(0);
  scPageNum = signal(1);
  scPageSize = 20;
  scTotalPages = computed(() => Math.max(1, Math.ceil(this.scTotal() / this.scPageSize)));
  scPageStart = computed(() => this.scTotal() === 0 ? 0 : (this.scPageNum() - 1) * this.scPageSize + 1);
  scPageEnd = computed(() => Math.min(this.scPageNum() * this.scPageSize, this.scTotal()));
  scSearch = '';
  showCreateScorecard = signal(false);
  scForm: any = { supplierId: '', assessmentPeriod: '', industryProfile: 'default' };
  scorecardWeights = signal<any>(null);
  currentWeights = signal<any>(null);
  scDimensionScores: Record<string, number> = {};
  scOverallScore = signal(0);
  selectedScorecard = signal<any>(null);

  private analyticsService = inject(AnalyticsService);
  spAnalytics = signal<any>(null);
  showSpAnalytics = signal(false);

  ngOnInit() {
    this.loadConfig();
    this.loadSuppliers();
    this.loadDashboard();
    this.analyticsService.getSupplierPerformanceAnalytics().subscribe(d => this.spAnalytics.set(d));
  }

  navigateTo(view: string) {
    this.currentView.set(view as any);
    if (view === 'main') {
      this.loadDashboard();
    }
    if (view === 'analytics') {
      this.analyticsService.getSupplierPerformanceAnalytics().subscribe(d => {
        this.spAnalytics.set(d);
        setTimeout(() => this.renderSpCharts(), 100);
      });
    }
  }

  renderSpCharts(): void {
    if (!this.spAnalytics()) return;
    setTimeout(() => {
      const data = this.spAnalytics();
      const trendCtx = document.getElementById('otifTrendChart') as HTMLCanvasElement;
      if (trendCtx) {
        new Chart(trendCtx, {
          type: 'line',
          data: {
            labels: data.otifTrend.labels.map((l: string) => l.split(' ')[0]),
            datasets: [
              { label: 'OTIF %', data: data.otifTrend.otif, borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)', tension: 0.4, fill: true, pointRadius: 3, borderWidth: 2 },
              { label: 'Defect Rate %', data: data.otifTrend.defectRate, borderColor: '#ef4444', backgroundColor: 'transparent', tension: 0.4, pointRadius: 3, borderWidth: 2 },
              { label: 'Dispute Rate %', data: data.otifTrend.disputeRate, borderColor: '#f59e0b', backgroundColor: 'transparent', tension: 0.4, pointRadius: 3, borderWidth: 2 }
            ]
          },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { size: 10 }, usePointStyle: true, padding: 10 } } }, scales: { y: { ticks: { font: { size: 10 }, callback: (v: any) => v + '%' }, grid: { color: '#f1f5f9' } }, x: { ticks: { font: { size: 10 } }, grid: { display: false } } } }
        });
      }
      const corrCtx = document.getElementById('perfAwardCorrelation') as HTMLCanvasElement;
      if (corrCtx) {
        new Chart(corrCtx, {
          type: 'bubble',
          data: {
            datasets: data.performanceToAward.map((s: any) => ({
              label: s.supplier,
              data: [{ x: s.performanceScore, y: s.awardValue / 1000000, r: Math.max(s.awardCount, 4) }],
              backgroundColor: s.performanceScore >= 80 ? 'rgba(16,185,129,0.6)' : s.performanceScore >= 60 ? 'rgba(245,158,11,0.6)' : 'rgba(239,68,68,0.6)',
              borderColor: s.performanceScore >= 80 ? '#10b981' : s.performanceScore >= 60 ? '#f59e0b' : '#ef4444'
            }))
          },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { size: 9 }, usePointStyle: true, padding: 6 } } }, scales: { x: { title: { display: true, text: 'Performance Score', font: { size: 10 } }, min: 30, max: 100, ticks: { font: { size: 10 } }, grid: { color: '#f1f5f9' } }, y: { title: { display: true, text: 'Award Value (R millions)', font: { size: 10 } }, ticks: { font: { size: 10 }, callback: (v: any) => 'R' + v + 'M' }, grid: { color: '#f1f5f9' } } } }
        });
      }
    }, 200);
  }

  loadConfig() {
    this.http.get<any>(`${environment.apiUrl}/supplier-performance/config`).subscribe({
      next: (data) => this.config.set(data),
      error: () => {}
    });
  }

  loadSuppliers() {
    this.http.get<any>(`${environment.apiUrl}/suppliers`, { params: { page: '1', pageSize: '200' } }).subscribe({
      next: (data) => this.suppliers.set(data.data || data || []),
      error: () => {}
    });
  }

  loadDashboard() {
    this.http.get<any>(`${environment.apiUrl}/supplier-performance/issues`, { params: { page: '1', pageSize: '200' } }).subscribe({
      next: (data) => {
        const allIssues = data.data || [];
        const criticalCount = allIssues.filter((i: any) => i.severity === 'CRITICAL').length;
        const openCount = allIssues.filter((i: any) => ['open', 'in_progress', 'escalated'].includes(i.status)).length;

        const severityCounts: Record<string, number> = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
        allIssues.forEach((i: any) => { if (severityCounts[i.severity] !== undefined) severityCounts[i.severity]++; });

        const categories = this.config().issueCategories || [];
        const categoryBreakdown = categories.map((cat: any) => {
          const catIssues = allIssues.filter((i: any) => i.category === cat.code);
          const openCat = catIssues.filter((i: any) => ['open', 'in_progress', 'escalated'].includes(i.status)).length;
          const resolvedCat = catIssues.filter((i: any) => ['resolved', 'closed'].includes(i.status)).length;
          const resolved = catIssues.filter((i: any) => i.elapsedDays);
          const avgDays = resolved.length > 0 ? Math.round(resolved.reduce((sum: number, i: any) => sum + (i.elapsedDays || 0), 0) / resolved.length) : null;
          return {
            code: cat.code, name: cat.name, description: cat.description,
            count: catIssues.length,
            percentage: allIssues.length > 0 ? Math.round((catIssues.length / allIssues.length) * 100) : 0,
            open: openCat, resolved: resolvedCat, avgDays
          };
        }).filter((c: any) => c.count > 0);

        this.dashboardData.set({
          ...this.dashboardData(),
          totalIssues: allIssues.length,
          criticalIssues: criticalCount,
          openIssues: openCount,
          severityCounts,
          categoryBreakdown,
          recentIssues: allIssues.slice(0, 5)
        });
      },
      error: () => {}
    });

    this.http.get<any>(`${environment.apiUrl}/supplier-performance/blacklist`, { params: { page: '1', pageSize: '200' } }).subscribe({
      next: (data) => {
        const active = (data.data || []).filter((b: any) => b.status === 'active');
        this.dashboardData.set({ ...this.dashboardData(), blacklistedVendors: active.length });
      },
      error: () => {}
    });

    this.http.get<any>(`${environment.apiUrl}/supplier-performance/whitelist`, { params: { page: '1', pageSize: '200' } }).subscribe({
      next: (data) => {
        const active = (data.data || []).filter((w: any) => w.status === 'active');
        this.dashboardData.set({ ...this.dashboardData(), whitelistedVendors: active.length });
      },
      error: () => {}
    });

    this.http.get<any>(`${environment.apiUrl}/supplier-performance/scorecards`, { params: { page: '1', pageSize: '200' } }).subscribe({
      next: (data) => {
        const scs = data.data || [];
        const avg = scs.length > 0 ? Math.round(scs.reduce((s: number, sc: any) => s + (sc.overallScore || 0), 0) / scs.length) : 0;
        this.dashboardData.set({ ...this.dashboardData(), avgScore: avg });
      },
      error: () => {}
    });

    this.loadDiversity();
  }

  loadDiversity() {
    this.http.get<any>(`${environment.apiUrl}/supplier-performance/diversity`).subscribe({
      next: (data) => this.diversityData.set(data),
      error: () => {}
    });
  }

  loadIssues() {
    const params: any = { page: String(this.issuePageNum()), pageSize: String(this.issuePageSize) };
    if (this.issueFilterCategory) params.category = this.issueFilterCategory;
    if (this.issueFilterSeverity) params.severity = this.issueFilterSeverity;
    if (this.issueFilterStatus) params.status = this.issueFilterStatus;
    this.http.get<any>(`${environment.apiUrl}/supplier-performance/issues`, { params }).subscribe({
      next: (data) => {
        this.issues.set(data.data || []);
        this.issueTotal.set(data.total || 0);
      },
      error: () => {}
    });
  }

  clearIssueFilters() {
    this.issueSearch = '';
    this.issueFilterCategory = '';
    this.issueFilterSeverity = '';
    this.issueFilterStatus = '';
    this.issueDateFrom = '';
    this.issueDateTo = '';
    this.issuePageNum.set(1);
    this.loadIssues();
  }

  createIssue() {
    this.saving.set(true);
    const supplier = this.suppliers().find((s: any) => s.id === this.issueForm.supplierId);
    const payload = {
      supplierId: this.issueForm.supplierId,
      category: this.issueForm.category,
      severity: this.issueForm.severity,
      description: this.issueForm.description
    };
    this.http.post<any>(`${environment.apiUrl}/supplier-performance/issues`, payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.showNotification('Issue logged successfully');
        this.showCreateIssue.set(false);
        this.issueForm = { supplierId: '', category: '', severity: '', description: '' };
        this.loadIssues();
        this.loadDashboard();
      },
      error: (err) => {
        this.saving.set(false);
        this.showNotification(err.error?.error || 'Failed to log issue');
      }
    });
  }

  viewIssueDetail(issue: any) {
    this.http.get<any>(`${environment.apiUrl}/supplier-performance/issues/${issue.id}`).subscribe({
      next: (data) => {
        this.selectedIssue.set(data);
        this.currentView.set('issue-detail');
      },
      error: () => this.showNotification('Failed to load issue details')
    });
  }

  resolveIssue(issue: any) {
    const notes = window.prompt('Resolution notes:');
    if (!notes) return;
    this.saving.set(true);
    this.http.put<any>(`${environment.apiUrl}/supplier-performance/issues/${issue.id}`, { status: 'resolved', resolutionNotes: notes }).subscribe({
      next: (data) => {
        this.saving.set(false);
        this.showNotification('Issue resolved successfully');
        if (this.currentView() === 'issue-detail') {
          this.selectedIssue.set(data.issue);
        }
        this.loadIssues();
        this.loadDashboard();
      },
      error: (err) => {
        this.saving.set(false);
        this.showNotification(err.error?.error || 'Failed to resolve issue');
      }
    });
  }

  deleteIssue(id: string) {
    if (!confirm('Are you sure you want to delete this issue?')) return;
    this.http.delete<any>(`${environment.apiUrl}/supplier-performance/issues/${id}`).subscribe({
      next: () => {
        this.showNotification('Issue deleted');
        this.loadIssues();
        this.loadDashboard();
      },
      error: () => this.showNotification('Failed to delete issue')
    });
  }

  addContactEntry() {
    const issue = this.selectedIssue();
    if (!issue) return;
    this.saving.set(true);
    this.http.put<any>(`${environment.apiUrl}/supplier-performance/issues/${issue.id}`, {
      contactEntry: {
        contactType: this.contactForm.contactType,
        contactPerson: this.contactForm.contactPerson,
        email: this.contactForm.email,
        comments: this.contactForm.comments
      }
    }).subscribe({
      next: (data) => {
        this.saving.set(false);
        this.selectedIssue.set(data.issue);
        this.contactForm = { contactType: 'Email', contactPerson: '', email: '', comments: '' };
        this.showNotification('Contact entry added');
      },
      error: (err) => {
        this.saving.set(false);
        this.showNotification(err.error?.error || 'Failed to add contact entry');
      }
    });
  }

  onIssueSupplierChange() {}

  loadBlacklist() {
    const params: any = { page: String(this.blPageNum()), pageSize: String(this.blPageSize) };
    if (this.blFilterSource) params.source = this.blFilterSource;
    if (this.blFilterStatus) params.status = this.blFilterStatus;
    this.http.get<any>(`${environment.apiUrl}/supplier-performance/blacklist`, { params }).subscribe({
      next: (data) => {
        this.blacklistData.set(data.data || []);
        this.blTotal.set(data.total || 0);
      },
      error: () => {}
    });
  }

  importBlacklistCsv() {
    this.saving.set(true);
    const lines = this.csvImportText.split('\n').filter(l => l.trim());
    const entries = lines.map(line => {
      const parts = line.split(',').map(p => p.trim());
      return {
        supplierName: parts[0] || '',
        registrationNumber: parts[1] || '',
        reason: parts[2] || '',
        source: parts[3] || 'National Treasury'
      };
    });
    this.http.post<any>(`${environment.apiUrl}/supplier-performance/blacklist/import`, { entries }).subscribe({
      next: (data) => {
        this.saving.set(false);
        this.importResult.set(data);
        this.showNotification(data.message);
        this.loadBlacklist();
        this.loadDashboard();
      },
      error: (err) => {
        this.saving.set(false);
        this.showNotification(err.error?.error || 'Import failed');
      }
    });
  }

  checkSupplierBlacklist() {
    this.saving.set(true);
    this.http.post<any>(`${environment.apiUrl}/supplier-performance/blacklist/check`, this.checkForm).subscribe({
      next: (data) => {
        this.saving.set(false);
        this.checkResult.set(data);
      },
      error: (err) => {
        this.saving.set(false);
        this.showNotification(err.error?.error || 'Check failed');
      }
    });
  }

  viewBlacklistDetail(bl: any) {
    this.selectedBlacklist.set(bl);
    this.currentView.set('blacklist-detail');
  }

  countBySource(source: string): number {
    return this.blacklistData().filter((b: any) => b.source === source).length;
  }

  countAutoMatched(): number {
    return this.blacklistData().filter((b: any) => !b.supplierId?.startsWith('SUP-BL')).length;
  }

  loadWhitelist() {
    const params: any = { page: String(this.wlPageNum()), pageSize: String(this.wlPageSize) };
    if (this.wlFilterCategory) params.category = this.wlFilterCategory;
    this.http.get<any>(`${environment.apiUrl}/supplier-performance/whitelist`, { params }).subscribe({
      next: (data) => {
        this.whitelistData.set(data.data || []);
        this.wlTotal.set(data.total || 0);
      },
      error: () => {}
    });
  }

  addToWhitelist() {
    this.saving.set(true);
    const supplier = this.suppliers().find((s: any) => s.id === this.wlForm.supplierId);
    this.http.post<any>(`${environment.apiUrl}/supplier-performance/whitelist`, {
      supplierId: this.wlForm.supplierId,
      category: this.wlForm.category,
      reason: this.wlForm.reason
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.showNotification('Supplier added to whitelist');
        this.showAddWhitelist.set(false);
        this.wlForm = { supplierId: '', category: '', reason: '' };
        this.loadWhitelist();
        this.loadDashboard();
      },
      error: (err) => {
        this.saving.set(false);
        this.showNotification(err.error?.error || 'Failed to add to whitelist');
      }
    });
  }

  removeFromWhitelist(wl: any) {
    if (!confirm(`Remove ${wl.supplierName} from whitelist?`)) return;
    this.http.delete<any>(`${environment.apiUrl}/supplier-performance/whitelist/${wl.id}`).subscribe({
      next: () => {
        this.showNotification('Supplier removed from whitelist');
        this.loadWhitelist();
        this.loadDashboard();
      },
      error: () => this.showNotification('Failed to remove from whitelist')
    });
  }

  onWlSupplierChange() {}

  getWhitelistCategories(): string[] {
    const cats = new Set(this.whitelistData().map((w: any) => w.category));
    return Array.from(cats);
  }

  loadScorecards() {
    const params: any = { page: String(this.scPageNum()), pageSize: String(this.scPageSize) };
    this.http.get<any>(`${environment.apiUrl}/supplier-performance/scorecards`, { params }).subscribe({
      next: (data) => {
        this.scorecards.set(data.data || []);
        this.scTotal.set(data.total || 0);
      },
      error: () => {}
    });
  }

  loadScorecardWeights() {
    this.http.get<any>(`${environment.apiUrl}/supplier-performance/scorecard-weights`).subscribe({
      next: (data) => {
        this.scorecardWeights.set(data);
        this.onProfileChange();
      },
      error: () => {}
    });
  }

  onProfileChange() {
    const weights = this.scorecardWeights();
    if (!weights) return;
    const profile = this.scForm.industryProfile || 'default';
    this.currentWeights.set(weights[profile] || weights['default']);
    this.scDimensionScores = {};
    if (this.currentWeights()) {
      Object.keys(this.currentWeights()).forEach(key => { this.scDimensionScores[key] = 0; });
    }
    this.calcOverallScore();
  }

  onScSupplierChange() {}

  getWeightDimensions(): any[] {
    const w = this.currentWeights();
    if (!w) return [];
    return Object.entries(w).map(([key, val]: [string, any]) => ({
      key, name: val.name, weight: val.weight
    }));
  }

  calcDimWeightedScore(key: string, weight: number): string {
    const score = this.scDimensionScores[key] || 0;
    return ((weight * score) / 100).toFixed(1);
  }

  calcOverallScore() {
    const w = this.currentWeights();
    if (!w) { this.scOverallScore.set(0); return; }
    let total = 0;
    Object.entries(w).forEach(([key, val]: [string, any]) => {
      total += ((val.weight || 0) * (this.scDimensionScores[key] || 0)) / 100;
    });
    this.scOverallScore.set(Math.round(total));
  }

  createScorecard() {
    this.saving.set(true);
    const dimensions: any = {};
    const w = this.currentWeights();
    if (w) {
      Object.entries(w).forEach(([key, val]: [string, any]) => {
        dimensions[key] = { weight: val.weight, score: this.scDimensionScores[key] || 0, maxScore: 100 };
      });
    }
    this.http.post<any>(`${environment.apiUrl}/supplier-performance/scorecards`, {
      supplierId: this.scForm.supplierId,
      assessmentPeriod: this.scForm.assessmentPeriod,
      dimensions
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.showNotification('Scorecard created successfully');
        this.showCreateScorecard.set(false);
        this.scForm = { supplierId: '', assessmentPeriod: '', industryProfile: 'default' };
        this.loadScorecards();
        this.loadDashboard();
      },
      error: (err) => {
        this.saving.set(false);
        this.showNotification(err.error?.error || 'Failed to create scorecard');
      }
    });
  }

  viewScorecardDetail(sc: any) {
    this.http.get<any>(`${environment.apiUrl}/supplier-performance/scorecards/${sc.id}`).subscribe({
      next: (data) => {
        this.selectedScorecard.set(data);
        this.currentView.set('scorecard-detail');
      },
      error: () => this.showNotification('Failed to load scorecard')
    });
  }

  getScorecardDimensions(): any[] {
    const sc = this.selectedScorecard();
    if (!sc?.dimensions) return [];
    return Object.entries(sc.dimensions).map(([key, val]: [string, any]) => ({
      key, name: val.name || key.replace(/([A-Z])/g, ' $1').trim(), weight: val.weight, score: val.score
    }));
  }

  getTopSuppliers(): any[] {
    return [...this.scorecards()].sort((a, b) => b.overallScore - a.overallScore).slice(0, 5);
  }

  getBottomSuppliers(): any[] {
    return [...this.scorecards()].sort((a, b) => a.overallScore - b.overallScore).slice(0, 5);
  }

  getBbbeeEntries(): any[] {
    const dist = this.diversityData()?.bbbeeDistribution;
    if (!dist) return [];
    return Object.entries(dist).map(([key, value]) => ({ key, value }));
  }

  getCategoryName(code: string): string {
    const cat = (this.config().issueCategories || []).find((c: any) => c.code === code);
    return cat?.name || code || '';
  }

  formatStatus(status: string): string {
    if (!status) return '';
    return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  formatAmount(amount: number): string {
    if (!amount && amount !== 0) return '0';
    return amount.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  getScoreColor(score: number): string {
    if (score >= 80) return '#2e7d32';
    if (score >= 60) return '#f9a825';
    if (score >= 40) return '#ef6c00';
    return '#c62828';
  }

  getScoreBg(score: number): string {
    if (score >= 80) return '#e8f5e9';
    if (score >= 60) return '#fff8e1';
    if (score >= 40) return '#fff3e0';
    return '#ffebee';
  }

  showNotification(msg: string) {
    this.notification.set(msg);
    setTimeout(() => this.notification.set(''), 4000);
  }

  printReport() {
    window.print();
  }
}
