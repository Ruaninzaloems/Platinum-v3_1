import { Component, ChangeDetectionStrategy, signal, computed, inject, OnInit, AfterViewInit } from '@angular/core';
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
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { environment } from '../../../environments/environment';
import { DemandService } from '../../core/services/demand.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

@Component({
  selector: 'app-demand',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatCardModule, MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatMenuModule, MatTooltipModule, MatTabsModule, MatChipsModule, MatBadgeModule],
  templateUrl: './demand.component.html',
  styleUrl: './demand.component.scss'
})
export class DemandComponent implements OnInit, AfterViewInit {
  private http = inject(HttpClient);
  private demandService = inject(DemandService);
  private analyticsService = inject(AnalyticsService);

  currentView = signal<string>('dashboard');
  detailTab = signal<string>('overview');
  notification = signal<string>('');

  dashboard = signal<any>(null);
  plans = signal<any[]>([]);
  needsAssessments = signal<any[]>([]);
  analytics = signal<any>(null);
  aiInsights = signal<any>(null);
  selectedPlan = signal<any>(null);
  procurementPlan = signal<any>(null);

  searchQuery = '';
  filterStatus = '';
  filterDepartment = '';
  needsSearchQuery = '';
  needsFilterStatus = '';
  needsFilterPriority = '';

  currentPage = signal<number>(1);
  totalPages = signal<number>(1);
  pageSize = signal<number>(20);

  showCreateForm = signal<boolean>(false);
  showCreateNeedForm = signal<boolean>(false);
  showAddItemForm = signal<boolean>(false);
  editingItem = signal<any>(null);

  newPlan: any = {};
  newNeed: any = {};
  newItem: any = {};

  Math = Math;

  departmentOptions = [
    { id: 1, name: 'Corporate Services' },
    { id: 2, name: 'Financial Services' },
    { id: 3, name: 'Community Services' },
    { id: 4, name: 'Technical Services' },
    { id: 5, name: 'Infrastructure Development' },
    { id: 6, name: 'Planning & Development' },
    { id: 7, name: 'Electro-Technical Services' },
    { id: 8, name: 'Public Safety' },
    { id: 9, name: 'Water & Sanitation' },
    { id: 10, name: 'Environmental Management' }
  ];

  departments = [
    'Infrastructure Development',
    'Community Services',
    'Corporate Services',
    'Financial Services',
    'Planning & Development',
    'Public Safety',
    'Water & Sanitation',
    'Electro-Technical Services',
    'Technical Services',
    'Environmental Management'
  ];

  planStages = [
    { key: 'draft', label: 'Draft', icon: 'edit_note' },
    { key: 'submitted', label: 'Submitted', icon: 'send' },
    { key: 'reviewed', label: 'Reviewed', icon: 'rate_review' },
    { key: 'approved', label: 'Approved', icon: 'check_circle' },
    { key: 'rejected', label: 'Rejected', icon: 'cancel' },
    { key: 'in_progress', label: 'In Progress', icon: 'pending' }
  ];

  private chartInstances: Record<string, Chart> = {};

  ngOnInit() {
    this.loadDashboard();
    this.loadPlans();
    this.loadNeedsAssessments();
  }

  ngAfterViewInit() {
    if (this.currentView() === 'analytics') {
      setTimeout(() => this.renderCharts(), 100);
    }
  }

  switchView(view: string) {
    this.currentView.set(view);
    if (view === 'dashboard') {
      this.loadDashboard();
    } else if (view === 'plans') {
      this.loadPlans();
    } else if (view === 'needs') {
      this.loadNeedsAssessments();
    } else if (view === 'procurement') {
      this.loadProcurementPlan();
    } else if (view === 'analytics') {
      this.loadAnalytics();
      this.loadAiInsights();
      setTimeout(() => this.renderCharts(), 200);
    }
  }

  resetNewPlan() {
    this.newPlan = { title: '', departmentId: null, financialYear: '2025/26', vote: '', description: '', totalBudget: 0, idpReference: '', idpObjective: '', sdbipReference: '', sdbipIndicator: '', priority: 'Medium', notes: '' };
  }

  resetNewNeed() {
    this.newNeed = { title: '', departmentId: null, priority: 'Medium', justification: '', currentSituation: '', proposedSolution: '', estimatedCost: 0, riskFactors: '', category: 'goods' };
  }

  resetNewItem() {
    this.newItem = { description: '', quantity: 1, unitOfMeasure: 'Each', unitPrice: 0, category: 'goods', procurementMethod: 'RFQ', priority: 'Medium', deliveryQuarter: 'Q1' };
  }

  openCreateForm() {
    this.resetNewPlan();
    this.showCreateForm.set(true);
  }

  cancelCreate() {
    this.showCreateForm.set(false);
  }

  savePlan() {
    if (!this.newPlan.title) { this.showNotification('Title is required'); return; }
    this.demandService.createPlan(this.newPlan).subscribe({
      next: () => {
        this.showNotification('Demand plan created successfully');
        this.showCreateForm.set(false);
        this.loadPlans();
        this.loadDashboard();
      },
      error: () => this.showNotification('Failed to create demand plan')
    });
  }

  openCreateNeedForm() {
    this.resetNewNeed();
    this.showCreateNeedForm.set(true);
  }

  cancelCreateNeed() {
    this.showCreateNeedForm.set(false);
  }

  saveNeed() {
    if (!this.newNeed.title) { this.showNotification('Title is required'); return; }
    this.demandService.createNeedsAssessment(this.newNeed).subscribe({
      next: () => {
        this.showNotification('Needs assessment created successfully');
        this.showCreateNeedForm.set(false);
        this.loadNeedsAssessments();
      },
      error: () => this.showNotification('Failed to create needs assessment')
    });
  }

  openAddItemForm() {
    this.resetNewItem();
    this.editingItem.set(null);
    this.showAddItemForm.set(true);
  }

  cancelAddItem() {
    this.showAddItemForm.set(false);
    this.editingItem.set(null);
  }

  editItem(item: any) {
    this.editingItem.set(item);
    this.newItem = {
      description: item.description,
      quantity: item.quantity || 1,
      unitOfMeasure: item.unitOfMeasure || 'Each',
      unitPrice: item.unitPrice || (item.estimatedValue?.amount || 0),
      category: item.category || 'goods',
      procurementMethod: item.procurementMethod || 'RFQ',
      priority: item.priority || 'Medium',
      deliveryQuarter: item.deliveryQuarter || 'Q1'
    };
    this.showAddItemForm.set(true);
  }

  saveItem() {
    const planId = this.selectedPlan()?.id;
    if (!planId || !this.newItem.description) { this.showNotification('Description is required'); return; }

    const editing = this.editingItem();
    if (editing) {
      this.demandService.updateItem(planId, editing.id, this.newItem).subscribe({
        next: () => {
          this.showNotification('Item updated');
          this.showAddItemForm.set(false);
          this.editingItem.set(null);
          this.refreshPlanDetail(planId);
        },
        error: () => this.showNotification('Failed to update item')
      });
    } else {
      this.demandService.addItem(planId, this.newItem).subscribe({
        next: () => {
          this.showNotification('Item added to plan');
          this.showAddItemForm.set(false);
          this.refreshPlanDetail(planId);
        },
        error: () => this.showNotification('Failed to add item')
      });
    }
  }

  deleteItem(item: any) {
    const planId = this.selectedPlan()?.id;
    if (!planId || !item.id) return;
    if (!confirm('Delete this item?')) return;
    this.demandService.deleteItem(planId, item.id).subscribe({
      next: () => {
        this.showNotification('Item deleted');
        this.refreshPlanDetail(planId);
      },
      error: () => this.showNotification('Failed to delete item')
    });
  }

  refreshPlanDetail(planId: string) {
    this.demandService.getPlanById(planId).subscribe({
      next: (data) => this.selectedPlan.set(data),
      error: () => {}
    });
  }

  loadDashboard() {
    this.demandService.getDashboard().subscribe({
      next: (data) => this.dashboard.set(data),
      error: () => {
        this.dashboard.set({
          kpis: {
            totalPlans: 24, totalDemandValue: 187500000, budgetCoverage: 82, budgetGap: 33750000,
            avgComplianceScore: 87, conversionRate: 64, linkedItems: 89, totalItems: 139,
            needsCompleted: 18, needsTotal: 24, specsApproved: 31, specsTotal: 42,
            aggregationSavings: 12800000, aggregationCount: 7, overdueItems: 5
          },
          statusDistribution: [
            { status: 'draft', count: 4, value: 28500000, percentage: 15 },
            { status: 'submitted', count: 6, value: 42300000, percentage: 23 },
            { status: 'reviewed', count: 3, value: 21800000, percentage: 12 },
            { status: 'approved', count: 8, value: 68200000, percentage: 36 },
            { status: 'rejected', count: 2, value: 15400000, percentage: 8 },
            { status: 'in_progress', count: 1, value: 11300000, percentage: 6 }
          ],
          departmentBreakdown: [
            { department: 'Infrastructure & Engineering', plans: 6, value: 68500000, items: 42, complianceScore: 92, budgetUtilisation: 78 },
            { department: 'Community Services', plans: 4, value: 31200000, items: 28, complianceScore: 88, budgetUtilisation: 65 },
            { department: 'Corporate Services', plans: 3, value: 18900000, items: 18, complianceScore: 95, budgetUtilisation: 52 },
            { department: 'Financial Services', plans: 2, value: 12800000, items: 12, complianceScore: 91, budgetUtilisation: 41 },
            { department: 'Water & Sanitation', plans: 5, value: 35600000, items: 24, complianceScore: 79, budgetUtilisation: 88 },
            { department: 'Electricity', plans: 4, value: 20500000, items: 15, complianceScore: 85, budgetUtilisation: 72 }
          ],
          categoryBreakdown: [
            { category: 'capital_works', count: 28, value: 82500000, percentage: 44 },
            { category: 'services', count: 35, value: 52300000, percentage: 28 },
            { category: 'goods', count: 42, value: 33700000, percentage: 18 },
            { category: 'maintenance', count: 18, value: 19000000, percentage: 10 }
          ],
          procurementMethodBreakdown: [
            { method: 'Open Tender', count: 15, value: 95200000, percentage: 51 },
            { method: 'RFQ (Three Quotes)', count: 38, value: 42800000, percentage: 23 },
            { method: 'Limited Bidding', count: 8, value: 28500000, percentage: 15 },
            { method: 'Emergency', count: 3, value: 12400000, percentage: 7 },
            { method: 'Single Source', count: 4, value: 8600000, percentage: 4 }
          ],
          quarterlyPipeline: [
            { quarter: 'Q1', plannedValue: 45000000, actualValue: 38200000, committed: 42100000, items: 32 },
            { quarter: 'Q2', plannedValue: 52000000, actualValue: 41500000, committed: 48700000, items: 38 },
            { quarter: 'Q3', plannedValue: 48000000, actualValue: 35800000, committed: 44200000, items: 35 },
            { quarter: 'Q4', plannedValue: 42500000, actualValue: 28900000, committed: 38600000, items: 28 }
          ],
          riskSummary: { high: 5, medium: 12, low: 7 },
          legislativeCompliance: { idpAlignment: 84, budgetCoverage: 82, specReadiness: 74 }
        });
      }
    });
  }

  loadPlans() {
    const params: any = { page: this.currentPage(), pageSize: this.pageSize() };
    if (this.searchQuery) params.search = this.searchQuery;
    if (this.filterStatus) params.status = this.filterStatus;
    if (this.filterDepartment) params.department = this.filterDepartment;

    this.demandService.getPlans(params).subscribe({
      next: (res: any) => {
        if (Array.isArray(res)) {
          this.plans.set(res);
          this.totalPages.set(1);
        } else if (res && typeof res === 'object') {
          const data = Array.isArray(res.data) ? res.data : (Array.isArray(res.items) ? res.items : []);
          this.plans.set(data);
          this.totalPages.set(res.totalPages || 1);
        } else {
          this.plans.set([]);
          this.totalPages.set(1);
        }
      },
      error: () => {
        this.plans.set([]);
      }
    });
  }

  loadNeedsAssessments() {
    this.demandService.getNeedsAssessments().subscribe({
      next: (res: any) => {
        if (Array.isArray(res)) {
          this.needsAssessments.set(res);
        } else if (res && typeof res === 'object') {
          const data = Array.isArray(res.data) ? res.data : (Array.isArray(res.items) ? res.items : []);
          this.needsAssessments.set(data);
        } else {
          this.needsAssessments.set([]);
        }
      },
      error: () => this.needsAssessments.set([])
    });
  }

  loadProcurementPlan() {
    this.demandService.getProcurementPlans().subscribe({
      next: (data) => {
        const plans = Array.isArray(data) ? data : data?.data || [];
        this.procurementPlan.set(plans.length > 0 ? plans[0] : this.getMockProcurementPlan());
      },
      error: () => this.procurementPlan.set(this.getMockProcurementPlan())
    });
  }

  loadAnalytics() {
    this.analyticsService.getDemandAnalytics().subscribe({
      next: (data) => {
        this.analytics.set(data);
        setTimeout(() => this.renderCharts(), 200);
      },
      error: () => {
        this.analytics.set(this.getMockAnalytics());
        setTimeout(() => this.renderCharts(), 200);
      }
    });
  }

  loadAiInsights() {
    this.http.get<any>(`${environment.apiUrl}/ai/insights/demand`).subscribe({
      next: (data) => this.aiInsights.set(data),
      error: () => this.aiInsights.set({
        insights: [
          { title: 'Budget Over-allocation Risk', message: 'Water & Sanitation department budget utilisation at 88% with 3 months remaining. Consider reallocation.', severity: 'warning', icon: 'account_balance', legislationRef: 'MFMA s28', recommendation: 'Review Q4 spend projections and consider budget virements.' },
          { title: 'Aggregation Opportunity', message: 'Similar ICT equipment across 4 departments could yield R2.8M savings through consolidated procurement.', severity: 'info', icon: 'merge_type', legislationRef: 'SCM Reg 12(3)', recommendation: 'Initiate cross-departmental demand aggregation for ICT.' },
          { title: 'Specification Delay', message: '11 items awaiting specification approval, blocking procurement pipeline.', severity: 'critical', icon: 'description', legislationRef: 'SCM Reg 12(5)', recommendation: 'Escalate specification approvals to SCM unit manager.' },
          { title: 'IDP Misalignment', message: '6 demand items lack clear IDP linkage. Compliance risk for audit.', severity: 'warning', icon: 'link_off', legislationRef: 'MSA s25, IDP Guidelines', recommendation: 'Update demand plans to include IDP strategic objective references.' },
          { title: 'Commodity Price Increase', message: 'Construction materials showing 14% YoY price increase. Budget estimates may be understated.', severity: 'warning', icon: 'trending_up', legislationRef: 'NT Practice Note 8', recommendation: 'Update cost estimates using latest market analysis data.' },
          { title: 'Quarterly Target Achievement', message: 'Q2 actual spend at 80% of planned. Procurement execution needs acceleration.', severity: 'info', icon: 'speed', legislationRef: 'MFMA s112(2)', recommendation: 'Review procurement timelines and address bottlenecks.' }
        ]
      })
    });
  }

  viewPlan(plan: any) {
    this.demandService.getPlanById(plan.id).subscribe({
      next: (data) => {
        this.selectedPlan.set(data);
        this.currentView.set('plan-detail');
        this.detailTab.set('overview');
      },
      error: () => {
        this.selectedPlan.set(plan);
        this.currentView.set('plan-detail');
        this.detailTab.set('overview');
      }
    });
  }

  backToPlans() {
    this.currentView.set('plans');
    this.selectedPlan.set(null);
    this.loadPlans();
  }

  submitPlan(id: string) {
    this.demandService.submitPlan(id).subscribe({
      next: () => {
        this.showNotification('Plan submitted for review');
        this.loadPlans();
        if (this.selectedPlan()?.id === id) {
          this.demandService.getPlanById(id).subscribe({ next: (d) => this.selectedPlan.set(d) });
        }
      },
      error: () => this.showNotification('Failed to submit plan')
    });
  }

  reviewPlan(id: string) {
    this.demandService.reviewPlan(id).subscribe({
      next: () => {
        this.showNotification('Plan marked as reviewed');
        this.loadPlans();
        if (this.selectedPlan()?.id === id) {
          this.demandService.getPlanById(id).subscribe({ next: (d) => this.selectedPlan.set(d) });
        }
      },
      error: () => this.showNotification('Failed to review plan')
    });
  }

  approvePlan(id: string) {
    this.demandService.approvePlan(id).subscribe({
      next: () => {
        this.showNotification('Plan approved successfully');
        this.loadPlans();
        if (this.selectedPlan()?.id === id) {
          this.demandService.getPlanById(id).subscribe({ next: (d) => this.selectedPlan.set(d) });
        }
      },
      error: () => this.showNotification('Failed to approve plan')
    });
  }

  rejectPlan(id: string) {
    const reason = window.prompt('Reason for rejection:');
    if (!reason) return;
    this.demandService.rejectPlan(id, reason).subscribe({
      next: () => {
        this.showNotification('Plan rejected');
        this.loadPlans();
        if (this.selectedPlan()?.id === id) {
          this.demandService.getPlanById(id).subscribe({ next: (d) => this.selectedPlan.set(d) });
        }
      },
      error: () => this.showNotification('Failed to reject plan')
    });
  }

  generateRequisitions(id: string) {
    if (!confirm('Generate requisitions from this approved demand plan? This will create requisition records for each procurement method group.')) return;
    this.http.post<any>(`${environment.apiUrl}/demand/plans/${id}/generate-requisitions`, {}, { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } }).subscribe({
      next: (res) => {
        const data = res?.data || res;
        const count = data?.requisitionsGenerated || 0;
        const existing = data?.existingRequisitions || 0;
        if (existing > 0) {
          this.showNotification(`Requisitions already exist for this plan (${existing} found)`);
        } else if (count > 0) {
          this.showNotification(`${count} requisition(s) generated successfully`);
        } else {
          this.showNotification(data?.message || 'Requisitions generated');
        }
      },
      error: (err) => {
        this.showNotification(err.error?.message || err.error?.errors?.[0] || 'Failed to generate requisitions');
      }
    });
  }

  filterByStatus(status: string) {
    this.filterStatus = this.filterStatus === status ? '' : status;
    this.currentPage.set(1);
    this.loadPlans();
  }

  clearFilters() {
    this.searchQuery = '';
    this.filterStatus = '';
    this.filterDepartment = '';
    this.currentPage.set(1);
    this.loadPlans();
  }

  changePage(page: number) {
    this.currentPage.set(page);
    this.loadPlans();
  }

  filteredNeeds = computed(() => {
    let needs = this.needsAssessments();
    if (this.needsSearchQuery) {
      const q = this.needsSearchQuery.toLowerCase();
      needs = needs.filter(n => n.title?.toLowerCase().includes(q) || n.referenceNumber?.toLowerCase().includes(q));
    }
    if (this.needsFilterStatus) {
      needs = needs.filter(n => n.status === this.needsFilterStatus);
    }
    if (this.needsFilterPriority) {
      needs = needs.filter(n => n.priority === this.needsFilterPriority);
    }
    return needs;
  });

  needsCompletionPct = computed(() => {
    const total = this.dashboard()?.kpis?.needsTotal || 1;
    const completed = this.dashboard()?.kpis?.needsCompleted || 0;
    return Math.round((completed / total) * 100);
  });

  specsReadyPct = computed(() => {
    const total = this.dashboard()?.kpis?.specsTotal || 1;
    const approved = this.dashboard()?.kpis?.specsApproved || 0;
    return Math.round((approved / total) * 100);
  });

  getPlanCountForStatus(status: string): number {
    const dist = this.dashboard()?.statusDistribution || [];
    const match = dist.find((s: any) => s.status === status);
    return match?.count || 0;
  }

  getMethodKeys(): string[] {
    const plan = this.selectedPlan();
    if (!plan?.procurementMethodSummary) return [];
    return Object.keys(plan.procurementMethodSummary);
  }

  getQuarterKeys(): string[] {
    const plan = this.selectedPlan();
    if (!plan?.quarterlySpendPlan) return [];
    return Object.keys(plan.quarterlySpendPlan).sort();
  }

  getQPipelineKeys(): string[] {
    const pp = this.procurementPlan();
    if (!pp?.quarterlyPipeline) return [];
    return Object.keys(pp.quarterlyPipeline).sort();
  }

  getMethodBreakdownKeys(): string[] {
    const pp = this.procurementPlan();
    if (!pp?.methodBreakdown) return [];
    return Object.keys(pp.methodBreakdown);
  }

  getTotalPipelineItems(): number {
    const pipeline = this.analytics()?.pipeline || [];
    return pipeline.reduce((sum: number, s: any) => sum + (s.count || 0), 0);
  }

  formatRand(amount: number): string {
    if (!amount && amount !== 0) return 'R0';
    if (Math.abs(amount) >= 1000000) return `R${(amount / 1000000).toFixed(1)}M`;
    if (Math.abs(amount) >= 1000) return `R${(amount / 1000).toFixed(0)}K`;
    return `R${amount.toLocaleString('en-ZA')}`;
  }

  formatRandFull(amount: number): string {
    if (!amount && amount !== 0) return 'R0.00';
    return 'R' + amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 });
  }

  formatDate(date: string | null | undefined): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  getStatusColor(status: string): { bg: string; text: string } {
    const colors: Record<string, { bg: string; text: string }> = {
      draft: { bg: '#f1f5f9', text: '#64748b' },
      submitted: { bg: '#dbeafe', text: '#2563eb' },
      reviewed: { bg: '#fef3c7', text: '#d97706' },
      approved: { bg: '#dcfce7', text: '#16a34a' },
      rejected: { bg: '#fee2e2', text: '#dc2626' },
      in_progress: { bg: '#e0e7ff', text: '#4f46e5' },
      completed: { bg: '#dcfce7', text: '#16a34a' },
      pending: { bg: '#fef3c7', text: '#d97706' },
      on_track: { bg: '#dcfce7', text: '#16a34a' },
      delayed: { bg: '#fee2e2', text: '#dc2626' },
      published: { bg: '#dbeafe', text: '#2563eb' }
    };
    return colors[status] || { bg: '#f1f5f9', text: '#64748b' };
  }

  getPriorityColor(priority: string): { bg: string; text: string } {
    const colors: Record<string, { bg: string; text: string }> = {
      critical: { bg: '#fef2f2', text: '#dc2626' },
      high: { bg: '#fff7ed', text: '#ea580c' },
      medium: { bg: '#fefce8', text: '#ca8a04' },
      low: { bg: '#f0fdf4', text: '#16a34a' }
    };
    return colors[priority] || { bg: '#f1f5f9', text: '#64748b' };
  }

  getRiskColor(level: string): { bg: string; text: string } {
    const colors: Record<string, { bg: string; text: string }> = {
      high: { bg: '#fef2f2', text: '#dc2626' },
      medium: { bg: '#fff7ed', text: '#ea580c' },
      low: { bg: '#f0fdf4', text: '#16a34a' }
    };
    return colors[level] || { bg: '#f1f5f9', text: '#64748b' };
  }

  getCategoryColor(category: string): string {
    const colors: Record<string, string> = {
      capital_works: '#3b82f6',
      services: '#8b5cf6',
      goods: '#f59e0b',
      maintenance: '#10b981'
    };
    return colors[category] || '#64748b';
  }

  getAuditColor(action: string): string {
    if (action.toLowerCase().includes('approved')) return '#16a34a';
    if (action.toLowerCase().includes('rejected')) return '#dc2626';
    if (action.toLowerCase().includes('submitted')) return '#3b82f6';
    if (action.toLowerCase().includes('reviewed')) return '#f59e0b';
    return '#94a3b8';
  }

  showNotification(msg: string) {
    this.notification.set(msg);
    setTimeout(() => this.notification.set(''), 4000);
  }

  private destroyChart(id: string) {
    if (this.chartInstances[id]) {
      this.chartInstances[id].destroy();
      delete this.chartInstances[id];
    }
  }

  renderCharts() {
    const data = this.analytics();
    const dash = this.dashboard();
    if (!data && !dash) return;

    this.renderDemandPipelineChart(data);
    this.renderBudgetAlignmentChart(dash);
    this.renderCategorySpendChart(dash);
    this.renderMethodDistributionChart(dash);
    this.renderQuarterlyTargetsChart(dash);
    this.renderIdpAlignmentChart(data);
    this.renderCommodityTrendsChart(data);
    this.renderAggregationSavingsChart(data);
  }

  private renderDemandPipelineChart(data: any) {
    const canvas = document.getElementById('demandPipelineChart') as HTMLCanvasElement;
    if (!canvas) return;
    this.destroyChart('demandPipelineChart');

    const pipeline = data?.pipeline || [
      { stage: 'Needs Assessment', count: 42 },
      { stage: 'Specification', count: 36 },
      { stage: 'Market Analysis', count: 28 },
      { stage: 'Budget Approval', count: 24 },
      { stage: 'Procurement Plan', count: 18 },
      { stage: 'Requisition', count: 12 }
    ];

    this.chartInstances['demandPipelineChart'] = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: pipeline.map((s: any) => s.stage),
        datasets: [{
          data: pipeline.map((s: any) => s.count),
          backgroundColor: ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#c084fc', '#d8b4fe'],
          borderRadius: 6,
          barThickness: 28
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => `${ctx.parsed.x} items` } } },
        scales: { x: { grid: { display: false }, ticks: { font: { size: 11 } } }, y: { grid: { display: false }, ticks: { font: { size: 11 } } } }
      }
    });
  }

  private renderBudgetAlignmentChart(dash: any) {
    const canvas = document.getElementById('budgetAlignmentChart') as HTMLCanvasElement;
    if (!canvas) return;
    this.destroyChart('budgetAlignmentChart');

    const depts = dash?.departmentBreakdown || [];
    const labels = depts.map((d: any) => d.department?.split(' ')[0] || '');
    const demand = depts.map((d: any) => (d.value || 0) / 1000000);
    const budget = depts.map((d: any) => ((d.value || 0) / (d.budgetUtilisation || 1) * 100) / 1000000);
    const committed = depts.map((d: any) => (d.value || 0) * 0.7 / 1000000);

    this.chartInstances['budgetAlignmentChart'] = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Demand', data: demand, backgroundColor: '#3b82f6', borderRadius: 4 },
          { label: 'Budget', data: budget, backgroundColor: '#10b981', borderRadius: 4 },
          { label: 'Committed', data: committed, backgroundColor: '#f59e0b', borderRadius: 4 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { font: { size: 10 }, usePointStyle: true, pointStyle: 'circle' } }, tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: R${ctx.parsed.y?.toFixed(1)}M` } } },
        scales: { x: { grid: { display: false }, ticks: { font: { size: 10 } } }, y: { grid: { color: '#f1f5f9' }, ticks: { font: { size: 10 }, callback: (v) => `R${v}M` } } }
      }
    });
  }

  private renderCategorySpendChart(dash: any) {
    const canvas = document.getElementById('categorySpendChart') as HTMLCanvasElement;
    if (!canvas) return;
    this.destroyChart('categorySpendChart');

    const cats = dash?.categoryBreakdown || [];
    this.chartInstances['categorySpendChart'] = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: cats.map((c: any) => (c.category || '').replace('_', ' ')),
        datasets: [{
          data: cats.map((c: any) => c.value || 0),
          backgroundColor: ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981'],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right', labels: { font: { size: 11 }, usePointStyle: true, pointStyle: 'circle', padding: 12 } },
          tooltip: { callbacks: { label: (ctx) => { const v = ctx.parsed || 0; return ` R${(v / 1000000).toFixed(1)}M (${((v / (cats.reduce((s: number, c: any) => s + (c.value || 0), 0) || 1)) * 100).toFixed(0)}%)`; } } }
        },
        cutout: '60%'
      }
    });
  }

  private renderMethodDistributionChart(dash: any) {
    const canvas = document.getElementById('methodDistributionChart') as HTMLCanvasElement;
    if (!canvas) return;
    this.destroyChart('methodDistributionChart');

    const methods = dash?.procurementMethodBreakdown || [];
    this.chartInstances['methodDistributionChart'] = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: methods.map((m: any) => m.method),
        datasets: [{
          data: methods.map((m: any) => m.value || 0),
          backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#dc2626', '#8b5cf6'],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right', labels: { font: { size: 10 }, usePointStyle: true, pointStyle: 'circle', padding: 10 } },
          tooltip: { callbacks: { label: (ctx) => { const v = ctx.parsed || 0; return ` R${(v / 1000000).toFixed(1)}M`; } } }
        },
        cutout: '55%'
      }
    });
  }

  private renderQuarterlyTargetsChart(dash: any) {
    const canvas = document.getElementById('quarterlyTargetsChart') as HTMLCanvasElement;
    if (!canvas) return;
    this.destroyChart('quarterlyTargetsChart');

    const quarters = dash?.quarterlyPipeline || [];
    this.chartInstances['quarterlyTargetsChart'] = new Chart(canvas, {
      type: 'line',
      data: {
        labels: quarters.map((q: any) => q.quarter),
        datasets: [
          { label: 'Planned', data: quarters.map((q: any) => (q.plannedValue || 0) / 1000000), borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)', fill: true, tension: 0.3, pointRadius: 4, pointBackgroundColor: '#3b82f6' },
          { label: 'Actual', data: quarters.map((q: any) => (q.actualValue || 0) / 1000000), borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', fill: true, tension: 0.3, pointRadius: 4, pointBackgroundColor: '#10b981' },
          { label: 'Committed', data: quarters.map((q: any) => (q.committed || 0) / 1000000), borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.1)', fill: true, tension: 0.3, pointRadius: 4, pointBackgroundColor: '#f59e0b' }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { font: { size: 10 }, usePointStyle: true, pointStyle: 'circle' } }, tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: R${ctx.parsed.y?.toFixed(1)}M` } } },
        scales: { x: { grid: { display: false }, ticks: { font: { size: 11 } } }, y: { grid: { color: '#f1f5f9' }, ticks: { font: { size: 10 }, callback: (v) => `R${v}M` } } }
      }
    });
  }

  private renderIdpAlignmentChart(data: any) {
    const canvas = document.getElementById('idpAlignmentChart') as HTMLCanvasElement;
    if (!canvas) return;
    this.destroyChart('idpAlignmentChart');

    const objectives = data?.idpAlignment || [
      { objective: 'Service Delivery', score: 85, target: 90 },
      { objective: 'Financial Viability', score: 78, target: 85 },
      { objective: 'Institutional Dev.', score: 72, target: 80 },
      { objective: 'Local Economic Dev.', score: 68, target: 75 },
      { objective: 'Good Governance', score: 82, target: 90 },
      { objective: 'Spatial Planning', score: 65, target: 70 }
    ];

    this.chartInstances['idpAlignmentChart'] = new Chart(canvas, {
      type: 'radar',
      data: {
        labels: objectives.map((o: any) => o.objective),
        datasets: [
          { label: 'Actual', data: objectives.map((o: any) => o.score), borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.2)', pointBackgroundColor: '#3b82f6', pointRadius: 4 },
          { label: 'Target', data: objectives.map((o: any) => o.target), borderColor: '#dc2626', backgroundColor: 'rgba(220,38,38,0.05)', pointBackgroundColor: '#dc2626', pointRadius: 3, borderDash: [5, 5] }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { font: { size: 10 }, usePointStyle: true, pointStyle: 'circle' } } },
        scales: { r: { ticks: { font: { size: 9 }, backdropColor: 'transparent' }, pointLabels: { font: { size: 10 } }, suggestedMin: 0, suggestedMax: 100, grid: { color: '#e2e8f0' } } }
      }
    });
  }

  private renderCommodityTrendsChart(data: any) {
    const canvas = document.getElementById('commodityTrendsChart') as HTMLCanvasElement;
    if (!canvas) return;
    this.destroyChart('commodityTrendsChart');

    const commodities = data?.commodityTrends || {
      labels: ['2023/24', '2024/25', '2025/26'],
      datasets: [
        { name: 'Construction', data: [45, 52, 68] },
        { name: 'ICT Equipment', data: [22, 28, 31] },
        { name: 'Professional Services', data: [18, 21, 24] },
        { name: 'Fleet & Transport', data: [15, 14, 16] }
      ]
    };

    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
    this.chartInstances['commodityTrendsChart'] = new Chart(canvas, {
      type: 'line',
      data: {
        labels: commodities.labels,
        datasets: commodities.datasets.map((ds: any, i: number) => ({
          label: ds.name,
          data: ds.data,
          borderColor: colors[i % colors.length],
          backgroundColor: 'transparent',
          tension: 0.3,
          pointRadius: 4,
          pointBackgroundColor: colors[i % colors.length]
        }))
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { font: { size: 10 }, usePointStyle: true, pointStyle: 'circle' } }, tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: R${ctx.parsed.y}M` } } },
        scales: { x: { grid: { display: false }, ticks: { font: { size: 11 } } }, y: { grid: { color: '#f1f5f9' }, ticks: { font: { size: 10 }, callback: (v) => `R${v}M` } } }
      }
    });
  }

  private renderAggregationSavingsChart(data: any) {
    const canvas = document.getElementById('aggregationSavingsChart') as HTMLCanvasElement;
    if (!canvas) return;
    this.destroyChart('aggregationSavingsChart');

    const savings = data?.aggregationSavings || [
      { group: 'ICT Equipment', current: 18.5, projected: 14.2 },
      { group: 'Cleaning Services', current: 8.2, projected: 6.8 },
      { group: 'Office Supplies', current: 5.6, projected: 4.1 },
      { group: 'Fleet Maintenance', current: 12.4, projected: 10.2 },
      { group: 'Security Services', current: 9.8, projected: 8.1 }
    ];

    this.chartInstances['aggregationSavingsChart'] = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: savings.map((s: any) => s.group),
        datasets: [
          { label: 'Current Spend', data: savings.map((s: any) => s.current), backgroundColor: '#94a3b8', borderRadius: 4 },
          { label: 'Projected (Aggregated)', data: savings.map((s: any) => s.projected), backgroundColor: '#10b981', borderRadius: 4 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { font: { size: 10 }, usePointStyle: true, pointStyle: 'circle' } }, tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: R${ctx.parsed.y}M` } } },
        scales: { x: { grid: { display: false }, ticks: { font: { size: 10 }, maxRotation: 45 } }, y: { grid: { color: '#f1f5f9' }, ticks: { font: { size: 10 }, callback: (v) => `R${v}M` } } }
      }
    });
  }

  private getMockPlans(): any[] {
    return [
      { id: 'dp-001', referenceNumber: 'DP-2025-001', title: 'Infrastructure Capital Programme 2025/26', department: 'Infrastructure & Engineering', financialYear: '2025/26', totalDemand: { amount: 45200000 }, totalBudget: { amount: 52000000 }, complianceScore: 92, riskLevel: 'low', status: 'approved', items: new Array(12), priorityBreakdown: { critical: 2, high: 4, medium: 4, low: 2 }, procurementMethodSummary: { 'Open Tender': 5, 'RFQ': 4, 'Limited Bidding': 3 }, quarterlySpendPlan: { Q1: { planned: 12000000, actual: 10500000, committed: 11800000 }, Q2: { planned: 14000000, actual: 12200000, committed: 13500000 }, Q3: { planned: 11000000, actual: 8800000, committed: 10200000 }, Q4: { planned: 8200000, actual: 0, committed: 6500000 } }, auditTrail: [{ action: 'Created', by: 'J. Molefe', date: '2025-01-15', notes: 'Initial demand plan created' }, { action: 'Submitted', by: 'J. Molefe', date: '2025-02-01', notes: 'Submitted for SCM review' }, { action: 'Reviewed', by: 'S. Nkosi', date: '2025-02-10', notes: 'Reviewed and recommended for approval' }, { action: 'Approved', by: 'T. Dlamini', date: '2025-02-15', notes: 'Approved by CFO' }], createdByName: 'J. Molefe', createdDate: '2025-01-15', departmentCode: 'IE', vote: 'Vote 8', idpReference: 'IDP-2025-001', idpObjective: 'Improve municipal infrastructure', sdbipReference: 'SDBIP-2025-IE-001', sdbipIndicator: 'KPI 4.1', notes: 'Annual capital infrastructure demand plan', reviewedByName: 'S. Nkosi', reviewedDate: '2025-02-10', approvedByName: 'T. Dlamini', approvedDate: '2025-02-15', budgetVariance: { amount: 6800000 }, budgetUtilisation: 87 },
      { id: 'dp-002', referenceNumber: 'DP-2025-002', title: 'Community Services Operational Needs', department: 'Community Services', financialYear: '2025/26', totalDemand: { amount: 18900000 }, totalBudget: { amount: 22000000 }, complianceScore: 88, riskLevel: 'medium', status: 'submitted', items: new Array(8), priorityBreakdown: { critical: 1, high: 3, medium: 2, low: 2 }, procurementMethodSummary: { 'Open Tender': 2, 'RFQ': 4, 'Single Source': 2 }, quarterlySpendPlan: { Q1: { planned: 5200000, actual: 4800000, committed: 5100000 }, Q2: { planned: 5800000, actual: 0, committed: 4200000 }, Q3: { planned: 4200000, actual: 0, committed: 0 }, Q4: { planned: 3700000, actual: 0, committed: 0 } }, auditTrail: [{ action: 'Created', by: 'P. Maseko', date: '2025-01-20', notes: 'Operational demand plan created' }, { action: 'Submitted', by: 'P. Maseko', date: '2025-02-05', notes: 'Submitted for review' }], createdByName: 'P. Maseko', createdDate: '2025-01-20', departmentCode: 'CS', vote: 'Vote 5', idpReference: 'IDP-2025-003', idpObjective: 'Enhance community services delivery', sdbipReference: 'SDBIP-2025-CS-001', sdbipIndicator: 'KPI 2.3', notes: '', budgetVariance: { amount: 3100000 }, budgetUtilisation: 86 },
      { id: 'dp-003', referenceNumber: 'DP-2025-003', title: 'Water & Sanitation Maintenance Plan', department: 'Water & Sanitation', financialYear: '2025/26', totalDemand: { amount: 35600000 }, totalBudget: { amount: 38000000 }, complianceScore: 79, riskLevel: 'high', status: 'draft', items: new Array(15), priorityBreakdown: { critical: 4, high: 5, medium: 4, low: 2 }, procurementMethodSummary: { 'Open Tender': 6, 'RFQ': 5, 'Emergency': 3, 'Limited Bidding': 1 }, quarterlySpendPlan: { Q1: { planned: 9500000, actual: 0, committed: 0 }, Q2: { planned: 10200000, actual: 0, committed: 0 }, Q3: { planned: 8800000, actual: 0, committed: 0 }, Q4: { planned: 7100000, actual: 0, committed: 0 } }, auditTrail: [{ action: 'Created', by: 'K. van Wyk', date: '2025-02-01', notes: 'Maintenance demand plan drafted' }], createdByName: 'K. van Wyk', createdDate: '2025-02-01', departmentCode: 'WS', vote: 'Vote 9', idpReference: 'IDP-2025-005', idpObjective: 'Ensure sustainable water services', sdbipReference: 'SDBIP-2025-WS-001', sdbipIndicator: 'KPI 5.2', notes: 'Includes emergency pipeline repairs', budgetVariance: { amount: 2400000 }, budgetUtilisation: 94 },
      { id: 'dp-004', referenceNumber: 'DP-2025-004', title: 'Corporate ICT Modernisation', department: 'Corporate Services', financialYear: '2025/26', totalDemand: { amount: 12800000 }, totalBudget: { amount: 15000000 }, complianceScore: 95, riskLevel: 'low', status: 'reviewed', items: new Array(6), priorityBreakdown: { critical: 0, high: 2, medium: 3, low: 1 }, procurementMethodSummary: { 'Open Tender': 2, 'RFQ': 3, 'Single Source': 1 }, quarterlySpendPlan: { Q1: { planned: 3200000, actual: 2800000, committed: 3100000 }, Q2: { planned: 3800000, actual: 3200000, committed: 3600000 }, Q3: { planned: 3200000, actual: 0, committed: 2800000 }, Q4: { planned: 2600000, actual: 0, committed: 0 } }, auditTrail: [{ action: 'Created', by: 'L. Tshabalala', date: '2025-01-10', notes: 'ICT demand plan created' }, { action: 'Submitted', by: 'L. Tshabalala', date: '2025-01-25', notes: 'Submitted for SCM review' }, { action: 'Reviewed', by: 'S. Nkosi', date: '2025-02-08', notes: 'Specification clarity recommended' }], createdByName: 'L. Tshabalala', createdDate: '2025-01-10', departmentCode: 'CS', vote: 'Vote 3', idpReference: 'IDP-2025-002', idpObjective: 'Digital transformation', sdbipReference: 'SDBIP-2025-CS-002', sdbipIndicator: 'KPI 3.1', notes: '', reviewedByName: 'S. Nkosi', reviewedDate: '2025-02-08', budgetVariance: { amount: 2200000 }, budgetUtilisation: 85 }
    ];
  }

  private getMockNeeds(): any[] {
    return [
      { id: 'na-001', referenceNumber: 'NA-2025-001', title: 'Road Rehabilitation Needs Assessment', department: 'Infrastructure & Engineering', conductedByName: 'J. Molefe', conductedDate: '2025-01-10', priority: 'critical', estimatedCost: { amount: 28500000 }, status: 'approved', legislativeRef: 'MFMA s112(2)(a)', description: 'Comprehensive assessment of municipal road network requiring rehabilitation' },
      { id: 'na-002', referenceNumber: 'NA-2025-002', title: 'Community Hall Equipment Needs', department: 'Community Services', conductedByName: 'P. Maseko', conductedDate: '2025-01-15', priority: 'medium', estimatedCost: { amount: 4200000 }, status: 'completed', legislativeRef: 'SCM Reg 12(5)', description: 'Assessment of equipment needs for 12 community halls' },
      { id: 'na-003', referenceNumber: 'NA-2025-003', title: 'Water Infrastructure Assessment', department: 'Water & Sanitation', conductedByName: 'K. van Wyk', conductedDate: '2025-01-20', priority: 'high', estimatedCost: { amount: 18200000 }, status: 'in_progress', legislativeRef: 'Water Services Act s9', description: 'Assessment of bulk water infrastructure capacity' },
      { id: 'na-004', referenceNumber: 'NA-2025-004', title: 'ICT Infrastructure Assessment', department: 'Corporate Services', conductedByName: 'L. Tshabalala', conductedDate: '2025-01-25', priority: 'high', estimatedCost: { amount: 8500000 }, status: 'approved', legislativeRef: 'MFMA s112, e-Gov Framework', description: 'Assessment of ICT modernisation requirements' },
      { id: 'na-005', referenceNumber: 'NA-2025-005', title: 'Fleet Replacement Needs', department: 'Community Services', conductedByName: 'M. Khumalo', conductedDate: '2025-02-01', priority: 'medium', estimatedCost: { amount: 12800000 }, status: 'draft', legislativeRef: 'SCM Reg 12(5)', description: 'Fleet replacement assessment for refuse and maintenance vehicles' },
      { id: 'na-006', referenceNumber: 'NA-2025-006', title: 'Electrical Network Expansion', department: 'Electricity', conductedByName: 'R. Pillay', conductedDate: '2025-02-05', priority: 'critical', estimatedCost: { amount: 22000000 }, status: 'completed', legislativeRef: 'MFMA s112, ERA Regulations', description: 'Assessment of new development electrical connection needs' }
    ];
  }

  private getMockProcurementPlan(): any {
    return {
      id: 'pp-001',
      referenceNumber: 'APP-2025/26-001',
      title: 'Annual Procurement Plan 2025/26',
      financialYear: '2025/26',
      status: 'published',
      version: 2,
      publishedDate: '2025-03-01',
      preparedBy: 'usr-scm-001',
      preparedByName: 'S. Nkosi',
      totalPlannedSpend: { amount: 187500000 },
      totalBudgetAvailable: { amount: 215000000 },
      sourceDemandPlans: ['dp-001', 'dp-002', 'dp-003', 'dp-004'],
      items: [
        { id: 'pi-001', demandItemId: 'di-001', description: 'Road rehabilitation programme', procurementMethod: 'Open Tender', estimatedValue: 28500000, targetQuarter: 'Q1', category: 'capital_works', status: 'approved', biddingDocumentReady: true },
        { id: 'pi-002', demandItemId: 'di-002', description: 'Water pipeline replacement', procurementMethod: 'Open Tender', estimatedValue: 18200000, targetQuarter: 'Q1', category: 'capital_works', status: 'approved', biddingDocumentReady: true },
        { id: 'pi-003', demandItemId: 'di-003', description: 'ICT server infrastructure', procurementMethod: 'Open Tender', estimatedValue: 8500000, targetQuarter: 'Q2', category: 'goods', status: 'pending', biddingDocumentReady: false },
        { id: 'pi-004', demandItemId: 'di-004', description: 'Professional consulting services', procurementMethod: 'RFQ (Three Quotes)', estimatedValue: 4200000, targetQuarter: 'Q2', category: 'services', status: 'approved', biddingDocumentReady: true },
        { id: 'pi-005', demandItemId: 'di-005', description: 'Fleet vehicle procurement', procurementMethod: 'Open Tender', estimatedValue: 12800000, targetQuarter: 'Q3', category: 'goods', status: 'pending', biddingDocumentReady: false },
        { id: 'pi-006', demandItemId: 'di-006', description: 'Building maintenance services', procurementMethod: 'RFQ (Three Quotes)', estimatedValue: 3500000, targetQuarter: 'Q3', category: 'maintenance', status: 'draft', biddingDocumentReady: false },
        { id: 'pi-007', demandItemId: 'di-007', description: 'Electrical network expansion', procurementMethod: 'Open Tender', estimatedValue: 22000000, targetQuarter: 'Q2', category: 'capital_works', status: 'approved', biddingDocumentReady: true },
        { id: 'pi-008', demandItemId: 'di-008', description: 'Security services contract', procurementMethod: 'Limited Bidding', estimatedValue: 6800000, targetQuarter: 'Q1', category: 'services', status: 'approved', biddingDocumentReady: true }
      ],
      quarterlyPipeline: {
        Q1: { items: 12, value: 53500000, status: 'on_track' },
        Q2: { items: 10, value: 48700000, status: 'on_track' },
        Q3: { items: 8, value: 42300000, status: 'delayed' },
        Q4: { items: 6, value: 43000000, status: 'pending' }
      },
      methodBreakdown: {
        'Open Tender': { count: 15, value: 95200000, percentage: 51 },
        'RFQ (Three Quotes)': { count: 18, value: 42800000, percentage: 23 },
        'Limited Bidding': { count: 5, value: 28500000, percentage: 15 },
        'Emergency': { count: 3, value: 12400000, percentage: 7 },
        'Single Source': { count: 2, value: 8600000, percentage: 4 }
      }
    };
  }

  private getMockAnalytics(): any {
    return {
      pipeline: [
        { stage: 'Needs Assessment', count: 42 },
        { stage: 'Specification', count: 36 },
        { stage: 'Market Analysis', count: 28 },
        { stage: 'Budget Approval', count: 24 },
        { stage: 'Procurement Plan', count: 18 },
        { stage: 'Requisition', count: 12 }
      ],
      idpAlignment: [
        { objective: 'Service Delivery', score: 85, target: 90 },
        { objective: 'Financial Viability', score: 78, target: 85 },
        { objective: 'Institutional Dev.', score: 72, target: 80 },
        { objective: 'Local Economic Dev.', score: 68, target: 75 },
        { objective: 'Good Governance', score: 82, target: 90 },
        { objective: 'Spatial Planning', score: 65, target: 70 }
      ],
      commodityTrends: {
        labels: ['2023/24', '2024/25', '2025/26'],
        datasets: [
          { name: 'Construction', data: [45, 52, 68] },
          { name: 'ICT Equipment', data: [22, 28, 31] },
          { name: 'Professional Services', data: [18, 21, 24] },
          { name: 'Fleet & Transport', data: [15, 14, 16] }
        ]
      },
      aggregationSavings: [
        { group: 'ICT Equipment', current: 18.5, projected: 14.2 },
        { group: 'Cleaning Services', current: 8.2, projected: 6.8 },
        { group: 'Office Supplies', current: 5.6, projected: 4.1 },
        { group: 'Fleet Maintenance', current: 12.4, projected: 10.2 },
        { group: 'Security Services', current: 9.8, projected: 8.1 }
      ]
    };
  }
}
