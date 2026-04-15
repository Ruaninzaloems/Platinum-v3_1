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
import { MatSliderModule } from '@angular/material/slider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { environment } from '../../../environments/environment';
import { AnalyticsService } from '../../core/services/analytics.service';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

@Component({
  selector: 'app-contracts',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatCardModule, MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatDatepickerModule, MatNativeDateModule, MatSelectModule, MatMenuModule, MatTooltipModule, MatTabsModule, MatChipsModule, MatBadgeModule, MatSliderModule, MatProgressBarModule],
  templateUrl: './contracts.component.html',
  styleUrl: './contracts.component.scss'
})
export class ContractsComponent implements OnInit {
  private http = inject(HttpClient);
  private analyticsService = inject(AnalyticsService);

  contractAnalytics = signal<any>(null);
  showContractAnalytics = signal(false);

  currentView = signal<'main' | 'detail' | 'create' | 'analytics'>('main');
  mainTab = signal<'dashboard' | 'list' | 'expiring' | 'reports'>('dashboard');
  detailTab = signal<string>('overview');

  contracts = signal<any[]>([]);
  totalContracts = signal(0);
  currentPage = signal(1);
  pageSize = signal(20);
  totalPages = signal(1);

  selectedContract = signal<any>(null);
  contractDashboard = signal<any>(null);

  expiringContracts = signal<any[]>([]);
  expiringAlerts = signal<any[]>([]);
  topContracts = signal<any[]>([]);
  expiringDays = 30;

  paymentCertificates = signal<any[]>([]);
  performanceHistory = signal<any[]>([]);
  performanceSummary = signal<any>(null);
  penalties = signal<any[]>([]);
  retentionInfo = signal<any>(null);
  guaranteeInfo = signal<any>(null);
  correspondence = signal<any[]>([]);
  variations = signal<any[]>([]);

  dashboardKpis = signal<any>({ activeCount: 0, activeValue: 0, expiringCount: 0, completedCount: 0, totalValue: 0, avgPerformance: 0, pendingCerts: 0 });
  pipelineCounts = signal<any>({ draft: 0, active: 0, completed: 0, expired: 0 });
  reportStatusSummary = signal<any[]>([]);
  reportDeptSummary = signal<any[]>([]);
  reportFinancials = signal<any>({ totalValue: 0, totalCertified: 0, totalPaid: 0, totalRetention: 0, totalPenalties: 0 });
  reportPerformance = signal<any[]>([]);

  searchQuery = '';
  filterStatus = '';
  filterDepartment = '';
  filterType = '';
  filterDateFrom = '';
  filterDateTo = '';
  filterValueMin: number | null = null;
  filterValueMax: number | null = null;
  sortBy = 'startDate';
  sortDir = 'desc';

  saving = signal(false);
  notification = signal('');

  departments = [
    'Infrastructure and Engineering', 'Water & Sanitation', 'Corporate Services',
    'Community Services', 'Finance', 'Planning & Development', 'Electricity', 'Public Safety'
  ];

  performanceDimensions = [
    { key: 'quality', label: 'Quality' },
    { key: 'delivery', label: 'Delivery' },
    { key: 'cost', label: 'Cost' },
    { key: 'service', label: 'Service' }
  ];

  perfForm: any = { quality: 70, delivery: 70, cost: 70, service: 70 };
  perfComments = '';

  penaltyForm: any = { type: '', amount: null, reason: '' };

  contractForm: any = { title: '', supplierName: '', department: '', type: 'services', value: null, startDate: '', endDate: '', terms: '' };

  pageStart = computed(() => {
    const total = this.totalContracts();
    if (total === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize() + 1;
  });

  pageEnd = computed(() => {
    return Math.min(this.currentPage() * this.pageSize(), this.totalContracts());
  });

  ngOnInit() {
    this.loadDashboardData();
    this.analyticsService.getContractAnalytics().subscribe(d => this.contractAnalytics.set(d));
  }

  loadDashboardData() {
    this.http.get<any>(`${environment.apiUrl}/contracts`, { params: { page: 1, pageSize: 200 } }).subscribe({
      next: (res) => {
        const all = res.data || [];
        const active = all.filter((c: any) => c.status === 'active');
        const completed = all.filter((c: any) => c.status === 'completed');
        const expired = all.filter((c: any) => c.status === 'expired');
        const draft = all.filter((c: any) => c.status === 'draft');

        const totalVal = all.reduce((sum: number, c: any) => sum + (c.contractValue?.amount || 0), 0);
        const activeVal = active.reduce((sum: number, c: any) => sum + (c.contractValue?.amount || 0), 0);

        this.dashboardKpis.set({
          activeCount: active.length,
          activeValue: activeVal,
          expiringCount: 0,
          completedCount: completed.length,
          totalValue: totalVal,
          avgPerformance: all.length > 0 ? all.reduce((s: number, c: any) => s + (c.percentageComplete || 0), 0) / all.length : 0,
          pendingCerts: 0
        });

        this.pipelineCounts.set({
          draft: draft.length,
          active: active.length,
          completed: completed.length,
          expired: expired.length
        });

        const sorted = [...all].sort((a: any, b: any) => (b.contractValue?.amount || 0) - (a.contractValue?.amount || 0));
        this.topContracts.set(sorted.slice(0, 5));

        const statusMap: any = {};
        const deptMap: any = {};
        let totalCertified = 0, totalPaid = 0, totalRetention = 0;

        all.forEach((c: any) => {
          if (!statusMap[c.status]) statusMap[c.status] = { status: c.status, count: 0, totalValue: 0 };
          statusMap[c.status].count++;
          statusMap[c.status].totalValue += c.contractValue?.amount || 0;

          if (!deptMap[c.department]) deptMap[c.department] = { department: c.department, count: 0, totalValue: 0 };
          deptMap[c.department].count++;
          deptMap[c.department].totalValue += c.contractValue?.amount || 0;

          totalCertified += c.totalCertified?.amount || 0;
          totalPaid += c.totalPaid?.amount || 0;
          if (c.retentionPercentage && c.totalCertified?.amount) {
            totalRetention += (c.totalCertified.amount * c.retentionPercentage / 100);
          }
        });

        this.reportStatusSummary.set(Object.values(statusMap));
        this.reportDeptSummary.set(Object.values(deptMap));
        this.reportFinancials.set({ totalValue: totalVal, totalCertified, totalPaid, totalRetention, totalPenalties: 0 });
        this.reportPerformance.set(all.filter((c: any) => c.status === 'active').map((c: any) => ({
          contractId: c.id,
          title: c.title,
          supplier: c.supplierName,
          avgScore: c.percentageComplete || 0,
          assessmentCount: c.milestones?.filter((m: any) => m.status === 'completed').length || 0,
          status: c.status
        })));
      },
      error: () => {}
    });

    this.http.get<any>(`${environment.apiUrl}/contracts/expiring`, { params: { days: 90 } }).subscribe({
      next: (data) => {
        const expiring = Array.isArray(data) ? data : (data.data || []);
        this.expiringAlerts.set(expiring.slice(0, 5));
        this.dashboardKpis.update((kpi: any) => ({ ...kpi, expiringCount: expiring.length }));
      },
      error: () => {}
    });
  }

  loadContracts() {
    const params: any = { page: this.currentPage(), pageSize: this.pageSize(), sortBy: this.sortBy, sortDir: this.sortDir };
    if (this.searchQuery) params.search = this.searchQuery;
    if (this.filterStatus) params.status = this.filterStatus;
    if (this.filterDepartment) params.department = this.filterDepartment;
    if (this.filterType) params.type = this.filterType;
    if (this.filterDateFrom) params.dateFrom = this.filterDateFrom;
    if (this.filterDateTo) params.dateTo = this.filterDateTo;

    this.http.get<any>(`${environment.apiUrl}/contracts`, { params }).subscribe({
      next: (res) => {
        this.contracts.set(res.data || []);
        this.totalContracts.set(res.total || 0);
        this.totalPages.set(res.totalPages || 1);
      },
      error: () => this.contracts.set([])
    });
  }

  loadExpiring(days: number) {
    this.expiringDays = days;
    this.http.get<any>(`${environment.apiUrl}/contracts/expiring`, { params: { days } }).subscribe({
      next: (data) => {
        const expiring = Array.isArray(data) ? data : (data.data || []);
        this.expiringContracts.set(expiring);
      },
      error: () => this.expiringContracts.set([])
    });
  }

  navigateTo(view: string) {
    this.currentView.set(view as any);
    if (view === 'main') {
      this.loadDashboardData();
    }
    if (view === 'analytics') {
      this.analyticsService.getContractAnalytics().subscribe(d => {
        this.contractAnalytics.set(d);
        setTimeout(() => this.renderContractCharts(), 100);
      });
    }
  }

  viewContract(contract: any) {
    this.http.get<any>(`${environment.apiUrl}/contracts/${contract.id}`).subscribe({
      next: (data) => {
        this.selectedContract.set(data);
        this.currentView.set('detail');
        this.detailTab.set('overview');
        this.loadContractDashboard(data.id);
      }
    });
  }

  loadContractDashboard(contractId: string) {
    this.http.get<any>(`${environment.apiUrl}/contracts/${contractId}/dashboard`).subscribe({
      next: (data) => this.contractDashboard.set(data),
      error: () => this.contractDashboard.set(null)
    });
  }

  loadPaymentCertificates() {
    const c = this.selectedContract();
    if (!c) return;
    this.http.get<any>(`${environment.apiUrl}/contracts/${c.id}/payment-certificates`).subscribe({
      next: (data) => this.paymentCertificates.set(Array.isArray(data) ? data : (data.data || [])),
      error: () => this.paymentCertificates.set([])
    });
  }

  loadPerformance() {
    const c = this.selectedContract();
    if (!c) return;
    this.http.get<any>(`${environment.apiUrl}/contracts/${c.id}/performance`).subscribe({
      next: (data) => {
        this.performanceHistory.set(data.history || []);
        this.performanceSummary.set(data.summary || null);
      },
      error: () => { this.performanceHistory.set([]); this.performanceSummary.set(null); }
    });
  }

  loadPenalties() {
    const c = this.selectedContract();
    if (!c) return;
    this.http.get<any>(`${environment.apiUrl}/contracts/${c.id}/penalties`).subscribe({
      next: (data) => this.penalties.set(Array.isArray(data) ? data : (data.data || [])),
      error: () => this.penalties.set([])
    });
  }

  loadRetentionGuarantee() {
    const c = this.selectedContract();
    if (!c) return;
    this.http.get<any>(`${environment.apiUrl}/contracts/${c.id}/retention`).subscribe({
      next: (data) => this.retentionInfo.set(data),
      error: () => this.retentionInfo.set(null)
    });
    this.http.get<any>(`${environment.apiUrl}/contracts/${c.id}/guarantee`).subscribe({
      next: (data) => this.guaranteeInfo.set(data),
      error: () => this.guaranteeInfo.set(null)
    });
  }

  loadCorrespondence() {
    const c = this.selectedContract();
    if (!c) return;
    this.http.get<any>(`${environment.apiUrl}/contracts/${c.id}/correspondence`).subscribe({
      next: (data) => this.correspondence.set(data.correspondence || data || []),
      error: () => this.correspondence.set([])
    });
  }

  loadVariations() {
    const c = this.selectedContract();
    if (!c) return;
    this.http.get<any>(`${environment.apiUrl}/contracts/${c.id}/variations`).subscribe({
      next: (data) => this.variations.set(Array.isArray(data) ? data : (data.data || [])),
      error: () => this.variations.set([])
    });
  }

  backToList() {
    this.currentView.set('main');
    this.selectedContract.set(null);
    this.contractDashboard.set(null);
    if (this.mainTab() === 'list') this.loadContracts();
    else this.loadDashboardData();
  }

  applyFilters() {
    this.currentPage.set(1);
    this.loadContracts();
  }

  clearFilters() {
    this.searchQuery = '';
    this.filterStatus = '';
    this.filterDepartment = '';
    this.filterType = '';
    this.filterDateFrom = '';
    this.filterDateTo = '';
    this.filterValueMin = null;
    this.filterValueMax = null;
    this.currentPage.set(1);
    this.loadContracts();
  }

  sort(field: string) {
    if (this.sortBy === field) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortDir = 'asc';
    }
    this.loadContracts();
  }

  changePage(page: number) {
    this.currentPage.set(page);
    this.loadContracts();
  }

  activateContract(contract: any) {
    this.saving.set(true);
    this.http.post<any>(`${environment.apiUrl}/contracts/${contract.id}/activate`, {}).subscribe({
      next: (res) => {
        this.showNotification('Contract activated successfully');
        this.saving.set(false);
        if (this.selectedContract()) {
          this.selectedContract.set(res.contract || { ...contract, status: 'active' });
          this.loadContractDashboard(contract.id);
        }
        this.loadContracts();
      },
      error: () => { this.saving.set(false); this.showNotification('Failed to activate contract'); }
    });
  }

  completeContract(contract: any) {
    this.saving.set(true);
    this.http.put<any>(`${environment.apiUrl}/contracts/${contract.id}`, { status: 'completed' }).subscribe({
      next: () => {
        this.showNotification('Contract marked as completed');
        this.saving.set(false);
        this.loadContracts();
      },
      error: () => { this.saving.set(false); }
    });
  }

  voidContract(contract: any) {
    this.saving.set(true);
    this.http.post<any>(`${environment.apiUrl}/contracts/${contract.id}/terminate`, { reason: 'Voided by user' }).subscribe({
      next: (res) => {
        this.showNotification('Contract has been terminated');
        this.saving.set(false);
        if (this.selectedContract()) {
          this.selectedContract.set(res.contract || { ...contract, status: 'terminated' });
        }
        this.loadContracts();
      },
      error: () => { this.saving.set(false); }
    });
  }

  sendSigningInvitation() {
    const c = this.selectedContract();
    if (!c) return;
    this.saving.set(true);
    this.http.post<any>(`${environment.apiUrl}/contracts/${c.id}/signing-invitation`, {}).subscribe({
      next: () => {
        this.showNotification('Signing invitation sent successfully');
        this.saving.set(false);
      },
      error: () => { this.saving.set(false); }
    });
  }

  completeMilestone(milestone: any) {
    const c = this.selectedContract();
    if (!c) return;
    this.saving.set(true);
    this.http.post<any>(`${environment.apiUrl}/contracts/${c.id}/milestones/${milestone.id}/complete`, {}).subscribe({
      next: (res) => {
        this.showNotification('Milestone completed and payment certificate created');
        this.saving.set(false);
        if (res.milestone) {
          const updated = { ...c };
          const idx = updated.milestones.findIndex((m: any) => m.id === milestone.id);
          if (idx >= 0) updated.milestones[idx] = res.milestone;
          this.selectedContract.set(updated);
        }
        this.loadContractDashboard(c.id);
      },
      error: () => { this.saving.set(false); }
    });
  }

  approveCertificate(cert: any) {
    const c = this.selectedContract();
    if (!c) return;
    this.saving.set(true);
    this.http.post<any>(`${environment.apiUrl}/contracts/${c.id}/payment-certificates/${cert.id}/approve`, { role: 'projectManager' }).subscribe({
      next: () => {
        this.showNotification('Payment certificate approved');
        this.saving.set(false);
        this.loadPaymentCertificates();
      },
      error: () => { this.saving.set(false); }
    });
  }

  submitPerformance() {
    const c = this.selectedContract();
    if (!c) return;
    this.saving.set(true);
    const payload = {
      score: Math.round((this.perfForm.quality + this.perfForm.delivery + this.perfForm.cost + this.perfForm.service) / 4),
      dimensions: { ...this.perfForm },
      comments: this.perfComments
    };
    this.http.post<any>(`${environment.apiUrl}/contracts/${c.id}/performance`, payload).subscribe({
      next: () => {
        this.showNotification('Performance assessment submitted');
        this.saving.set(false);
        this.perfForm = { quality: 70, delivery: 70, cost: 70, service: 70 };
        this.perfComments = '';
        this.loadPerformance();
      },
      error: () => { this.saving.set(false); }
    });
  }

  recordPenalty() {
    const c = this.selectedContract();
    if (!c || !this.penaltyForm.type || !this.penaltyForm.amount) return;
    this.saving.set(true);
    this.http.post<any>(`${environment.apiUrl}/contracts/${c.id}/penalties`, this.penaltyForm).subscribe({
      next: () => {
        this.showNotification('Penalty recorded');
        this.saving.set(false);
        this.penaltyForm = { type: '', amount: null, reason: '' };
        this.loadPenalties();
      },
      error: () => { this.saving.set(false); }
    });
  }

  openCreateContract() {
    this.contractForm = { title: '', supplierName: '', department: '', type: 'services', value: null, startDate: '', endDate: '', terms: '' };
    this.currentView.set('create');
  }

  saveContract() {
    this.saving.set(true);
    const payload = {
      title: this.contractForm.title,
      supplierName: this.contractForm.supplierName,
      department: this.contractForm.department,
      type: this.contractForm.type,
      contractValue: { amount: this.contractForm.value || 0, currency: 'ZAR' },
      startDate: this.contractForm.startDate,
      endDate: this.contractForm.endDate,
      paymentTerms: this.contractForm.terms
    };
    this.http.post<any>(`${environment.apiUrl}/contracts`, payload).subscribe({
      next: () => {
        this.showNotification('Contract created successfully');
        this.saving.set(false);
        this.currentView.set('main');
        this.mainTab.set('list');
        this.loadContracts();
      },
      error: () => { this.saving.set(false); }
    });
  }

  onDocumentSelected(event: any) {
    const file = event.target?.files?.[0];
    if (file) {
      this.showNotification('Document uploaded: ' + file.name);
    }
  }

  showNotification(msg: string) {
    this.notification.set(msg);
    setTimeout(() => this.notification.set(''), 4000);
  }

  formatCurrency(amount: number): string {
    if (!amount) return 'R 0';
    if (amount >= 1000000) return `R ${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `R ${(amount / 1000).toFixed(0)}K`;
    return `R ${amount.toFixed(0)}`;
  }

  formatCurrencyFull(amount: number): string {
    if (!amount) return 'R 0.00';
    return 'R ' + amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 });
  }

  formatDate(date: string): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      draft: 'Draft', active: 'Active', completed: 'Completed', expired: 'Expired',
      terminated: 'Terminated', suspended: 'Suspended', pending: 'Pending',
      in_progress: 'In Progress', approved: 'Approved', held: 'Held',
      overdue: 'Overdue', not_started: 'Not Started'
    };
    return labels[status] || status;
  }

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      goods: 'Goods', services: 'Services', works: 'Works', consulting: 'Consulting',
      fixed_price: 'Fixed Price', rate_based: 'Rate Based', framework: 'Framework', period: 'Period'
    };
    return labels[type] || type;
  }

  getDaysRemaining(contract: any): number {
    if (!contract.endDate) return 999;
    const diff = new Date(contract.endDate).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  getDaysRemainingClass(days: number): string {
    if (days <= 14) return 'badge-danger';
    if (days <= 30) return 'badge-warning';
    return 'badge-info';
  }

  getMilestoneProgress(): number {
    const milestones = this.selectedContract()?.milestones || [];
    if (!milestones.length) return 0;
    const completed = milestones.filter((m: any) => m.status === 'completed').length;
    return (completed / milestones.length) * 100;
  }

  getCompletedMilestones(): number {
    return (this.selectedContract()?.milestones || []).filter((m: any) => m.status === 'completed').length;
  }

  getBudgetPct(): number {
    const budget = this.selectedContract()?.contractValue?.amount || 1;
    const actual = this.selectedContract()?.totalCertified?.amount || 0;
    return Math.min((actual / budget) * 100, 120);
  }

  getScoreColor(score: number): string {
    if (!score && score !== 0) return '#64748b';
    if (score >= 80) return '#2e7d32';
    if (score >= 60) return '#ef6c00';
    return '#c62828';
  }

  getTotalPenalties(): number {
    return this.penalties().reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
  }

  getTotalVariationImpact(): number {
    return this.variations().reduce((sum: number, v: any) => sum + (v.valueChange?.amount || v.variationValue?.amount || 0), 0);
  }

  renderContractCharts(): void {
    if (!this.contractAnalytics()) return;
    setTimeout(() => {
      const data = this.contractAnalytics();
      const varCtx = document.getElementById('contractVariationChart') as HTMLCanvasElement;
      if (varCtx) {
        new Chart(varCtx, {
          type: 'bar',
          data: {
            labels: data.variationAnalysis.contracts.map((c: any) => c.ref),
            datasets: [
              { label: 'Original Value', data: data.variationAnalysis.contracts.map((c: any) => c.originalValue / 1000000), backgroundColor: '#93c5fd', borderRadius: 4 },
              { label: 'Variation Value', data: data.variationAnalysis.contracts.map((c: any) => c.variationValue / 1000000), backgroundColor: '#fca5a5', borderRadius: 4 }
            ]
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { font: { size: 10 }, usePointStyle: true } } },
            scales: { y: { ticks: { font: { size: 10 }, callback: (v: any) => 'R' + v + 'M' }, grid: { color: '#f1f5f9' } }, x: { ticks: { font: { size: 10 } }, grid: { display: false } } }
          }
        });
      }
      const expiryCtx = document.getElementById('contractExpiryChart') as HTMLCanvasElement;
      if (expiryCtx) {
        new Chart(expiryCtx, {
          type: 'doughnut',
          data: {
            labels: data.renewalCalendar.expiringSummary.map((s: any) => s.period),
            datasets: [{ data: data.renewalCalendar.expiringSummary.map((s: any) => s.count), backgroundColor: ['#fca5a5', '#fde68a', '#93c5fd', '#86efac'], borderWidth: 2, borderColor: '#fff' }]
          },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { font: { size: 10 }, usePointStyle: true } } }, cutout: '55%' }
        });
      }
    }, 200);
  }
}
