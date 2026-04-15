import { Component, ChangeDetectionStrategy, signal, computed, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { environment } from '../../../environments/environment';
import { DashboardService } from '../../core/services/dashboard.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

@Component({
  selector: 'app-requisitions',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatCardModule, MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatMenuModule, MatTooltipModule, MatTabsModule, MatChipsModule, MatBadgeModule, MatCheckboxModule, MatSlideToggleModule, MatDatepickerModule, MatNativeDateModule],
  templateUrl: './requisitions.component.html',
  styleUrl: './requisitions.component.scss'
})
export class RequisitionsComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private dashboardService = inject(DashboardService);
  private analyticsService = inject(AnalyticsService);

  currentView = signal<'dashboard' | 'list' | 'detail' | 'create' | 'edit' | 'report' | 'analytics'>('dashboard');
  notificationMessage = signal<string>('');
  saving = signal(false);
  formData: any = {};
  formLineItems: any[] = [];
  selectedRequisition = signal<any>(null);
  detailTab = signal<string>('details');

  requisitions = signal<any[]>([]);
  totalRequisitions = signal(0);
  currentPage = signal(1);
  pageSize = signal(20);
  totalPages = signal(1);

  pipeline = signal<any>({});
  summary = signal<any>({});
  myApprovals = signal<any[]>([]);
  boundaries = signal<any[]>([]);
  expandedLineItem = signal<string | null>(null);
  slaData = signal<any>({});
  showDeptGrouping = signal(false);
  deptPipeline = signal<any>({});
  reqAiInsights = signal<any[]>([]);
  showAiPanel = signal(true);
  reqAnalytics = signal<any>(null);
  projectHistory = signal<any[]>([]);
  previousReqs = signal<any[]>([]);
  procurementPlans = signal<any[]>([]);
  procurementPlanItems = signal<any[]>([]);

  searchQuery = '';
  filterStatus = '';
  filterDepartment = '';
  filterRequisitionType = '';
  filterCategory = '';
  filterPriority = '';
  filterRoute = '';
  filterDateFrom = '';
  filterDateTo = '';
  filterValueMin: number | null = null;
  filterValueMax: number | null = null;
  sortBy = 'captureDate';
  sortDir = 'desc';

  actionComments = '';
  newDocName = '';
  newDocType = '';
  newDocDescription = '';
  newDocCategory = 'supporting';
  docTypeFilter = '';

  showAddCommodity = false;
  newCommodityId = '';
  newCommodityName = '';
  newCommodityQty = 0;
  newCommodityUom = 'Each';

  supervisorOptions = [
    { id: 'USR007', name: 'David Botha' },
    { id: 'USR003', name: 'Sipho Nkosi' },
    { id: 'USR004', name: 'Lerato Dlamini' }
  ];

  hodOptions = [
    { id: 'USR001', name: 'Thabiso Molefe' },
    { id: 'USR002', name: 'Naledi Khumalo' },
    { id: 'USR003', name: 'Sipho Nkosi' }
  ];

  deviationMotivationOptions = [
    { value: 'sole_supplier', label: 'Sole Supplier' },
    { value: 'emergency', label: 'Emergency' },
    { value: 'market_conditions', label: 'Unfavourable Market Conditions' },
    { value: 'impractical', label: 'Impractical to Follow Process' },
    { value: 'other', label: 'Other' }
  ];

  workflowSteps = [
    { key: 'draft', label: 'Draft' },
    { key: 'submitted', label: 'Submit' },
    { key: 'supervisor_review', label: 'Supervisor' },
    { key: 'hod_review', label: 'HOD' },
    { key: 'final_approved', label: 'Approved' },
    { key: 'routed', label: 'Routed' },
    { key: 'completed', label: 'Completed' }
  ];

  departments = [
    'Infrastructure and Engineering', 'Water & Sanitation', 'Corporate Services',
    'Community Services', 'Finance', 'Planning & Development', 'Electricity',
    'Public Safety', 'Environmental Management'
  ];

  statusOptions = [
    { key: 'draft', label: 'Draft' },
    { key: 'saved', label: 'Saved' },
    { key: 'submitted', label: 'Submitted' },
    { key: 'supervisor_review', label: 'Supervisor Review' },
    { key: 'supervisor_approved', label: 'Supervisor Approved' },
    { key: 'supervisor_rejected', label: 'Supervisor Rejected' },
    { key: 'hod_review', label: 'HOD Review' },
    { key: 'final_approved', label: 'Approved' },
    { key: 'hod_rejected', label: 'HOD Rejected' },
    { key: 'returned', label: 'Returned' },
    { key: 'routed', label: 'Routed' },
    { key: 'completed', label: 'Completed' },
    { key: 'voided', label: 'Voided' },
    { key: 'cancelled', label: 'Cancelled' }
  ];

  reportDateFrom = '';
  reportDateTo = '';
  reportStatus = '';
  reportType = '';
  reportDepartment = '';
  reportRequestedBy = '';
  reportRoute = '';
  reportOfflineRef = '';
  reportResults = signal<any>(null);

  pageStart = computed(() => {
    const total = this.totalRequisitions();
    if (total === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize() + 1;
  });

  pageEnd = computed(() => {
    return Math.min(this.currentPage() * this.pageSize(), this.totalRequisitions());
  });

  ngOnInit() {
    this.loadPipeline();
    this.loadSummary();
    this.loadMyApprovals();
    this.loadBoundaries();
    this.loadRequisitions();
    this.loadSlaData();
    this.dashboardService.getRequisitionAiInsights().subscribe(d => this.reqAiInsights.set(d.insights || []));
    this.analyticsService.getRequisitionAnalytics().subscribe(d => {
      this.reqAnalytics.set(d);
      this.renderReqCharts();
    });
  }

  private getHeaders() {
    return { 'Authorization': 'Bearer ' + localStorage.getItem('token') };
  }

  loadPipeline() {
    this.http.get<any>(`${environment.apiUrl}/requisitions/pipeline`, { headers: this.getHeaders() }).subscribe({
      next: (data) => this.pipeline.set(data?.data || data),
      error: () => this.pipeline.set({})
    });
  }

  loadSummary() {
    this.http.get<any>(`${environment.apiUrl}/requisitions/summary`, { headers: this.getHeaders() }).subscribe({
      next: (data) => this.summary.set(data?.data || data),
      error: () => this.summary.set({})
    });
  }

  loadMyApprovals() {
    this.http.get<any[]>(`${environment.apiUrl}/requisitions/my-approvals`, { headers: this.getHeaders() }).subscribe({
      next: (data) => this.myApprovals.set(data || []),
      error: () => this.myApprovals.set([])
    });
  }

  loadBoundaries() {
    this.http.get<any>(`${environment.apiUrl}/scm-config/boundaries`, { headers: this.getHeaders() }).subscribe({
      next: (res) => {
        const data = res?.data || res;
        this.boundaries.set(data?.boundaries || []);
      },
      error: () => {
        this.http.get<any>(`${environment.apiUrl}/requisitions/process-boundaries`, { headers: this.getHeaders() }).subscribe({
          next: (data) => this.boundaries.set(data?.data?.boundaries || data?.boundaries || []),
          error: () => this.boundaries.set([])
        });
      }
    });
  }

  loadSlaData() {
    this.http.get<any>(`${environment.apiUrl}/requisitions/summary`, { headers: this.getHeaders() }).subscribe({
      next: (data) => {
        if (data?.slaPerformance?.stages) {
          const mapped = {
            stages: data.slaPerformance.stages.map((s: any) => ({
              name: s.label,
              actualDays: s.actualAvgDays,
              targetDays: s.targetDays
            }))
          };
          this.slaData.set(mapped);
        } else {
          this.http.get<any>(`${environment.apiUrl}/requisitions/sla-targets`, { headers: this.getHeaders() }).subscribe({
            next: (targets) => {
              if (targets?.stages) {
                this.slaData.set({ stages: targets.stages.map((s: any) => ({ name: s.label, actualDays: 0, targetDays: s.targetDays })) });
              }
            },
            error: () => this.slaData.set({})
          });
        }
      },
      error: () => this.slaData.set({})
    });
  }

  loadDeptPipeline() {
    this.http.get<any>(`${environment.apiUrl}/requisitions/pipeline-by-department`, { headers: this.getHeaders() }).subscribe({
      next: (data) => {
        const departments = data?.departments || data || {};
        const transformed: any = {};
        for (const dept of Object.keys(departments)) {
          const d = departments[dept];
          const byStatus = d.byStatus || {};
          transformed[dept] = {
            draft: (byStatus.draft?.count || 0) + (byStatus.saved?.count || 0),
            submitted: byStatus.submitted?.count || 0,
            inReview: (byStatus.supervisor_review?.count || 0) + (byStatus.hod_review?.count || 0) + (byStatus.supervisor_approved?.count || 0),
            approved: (byStatus.final_approved?.count || 0) + (byStatus.routed?.count || 0) + (byStatus.completed?.count || 0),
            totalValue: d.value || 0
          };
        }
        this.deptPipeline.set(transformed);
      },
      error: () => this.deptPipeline.set({})
    });
  }

  loadProcurementPlans() {
    this.http.get<any[]>(`${environment.apiUrl}/procurement-plans`, { headers: this.getHeaders() }).subscribe({
      next: (data) => this.procurementPlans.set(data || []),
      error: () => this.procurementPlans.set([])
    });
  }

  onProcurementPlanChange() {
    const planId = this.formData.procurementPlanId;
    this.formData.procurementPlanItemId = '';
    if (!planId) {
      this.procurementPlanItems.set([]);
      return;
    }
    this.http.get<any>(`${environment.apiUrl}/procurement-plans/${planId}/items`, { headers: this.getHeaders() }).subscribe({
      next: (data) => this.procurementPlanItems.set(data?.items || data || []),
      error: () => this.procurementPlanItems.set([])
    });
  }

  loadRequisitions() {
    const params: any = { page: this.currentPage(), pageSize: this.pageSize(), sortBy: this.sortBy, sortDir: this.sortDir };
    if (this.searchQuery) params.search = this.searchQuery;
    if (this.filterStatus) params.status = this.filterStatus;
    if (this.filterDepartment) params.department = this.filterDepartment;
    if (this.filterRequisitionType) params.requisitionType = this.filterRequisitionType;
    if (this.filterCategory) params.category = this.filterCategory;
    if (this.filterPriority) params.priority = this.filterPriority;
    if (this.filterRoute) params.procurementRoute = this.filterRoute;
    if (this.filterDateFrom) params.dateFrom = this.filterDateFrom;
    if (this.filterDateTo) params.dateTo = this.filterDateTo;
    if (this.filterValueMin != null && this.filterValueMin !== null) params.valueMin = this.filterValueMin;
    if (this.filterValueMax != null && this.filterValueMax !== null) params.valueMax = this.filterValueMax;

    this.http.get<any>(`${environment.apiUrl}/requisitions`, { params, headers: this.getHeaders() }).subscribe({
      next: (res) => {
        this.requisitions.set(res.data || []);
        this.totalRequisitions.set(res.totalCount || res.total || 0);
        this.totalPages.set(res.totalPages || 1);
      },
      error: () => this.requisitions.set([])
    });
  }

  viewRequisition(req: any) {
    this.http.get<any>(`${environment.apiUrl}/requisitions/${req.id}`, { headers: this.getHeaders() }).subscribe({
      next: (response) => {
        const data = response.data?.requisition || response.data || response;
        this.selectedRequisition.set(data);
        this.loadPreviousReqs(data.department, data.id);
        this.currentView.set('detail');
        this.detailTab.set('details');
        this.actionComments = '';
        if (data.project?.id) {
          this.loadProjectHistory(data.project.id, data.id);
        } else {
          this.projectHistory.set([]);
        }
      }
    });
  }

  loadProjectHistory(projectId: string, excludeId: string) {
    this.http.get<any[]>(`${environment.apiUrl}/requisitions/project-history/${projectId}`, { headers: this.getHeaders() }).subscribe({
      next: (data) => this.projectHistory.set((data || []).filter(r => r.id !== excludeId)),
      error: () => this.projectHistory.set([])
    });
  }

  loadPreviousReqs(department: string, currentId: string) {
    this.http.get<any>(`${environment.apiUrl}/requisitions?department=${department}&pageSize=5`).subscribe({
      next: (res) => {
        const prev = (res.data || []).filter((r: any) => r.id !== currentId);
        this.previousReqs.set(prev.slice(0, 5));
      },
      error: () => this.previousReqs.set([])
    });
  }

  addCommodity() {
    if (!this.newCommodityId || !this.newCommodityName) {
      this.showNotification('Commodity ID and Name are required');
      return;
    }
    const req = this.selectedRequisition();
    if (!req) return;
    if (!req.inventoryDetails) req.inventoryDetails = { commodities: [] };
    if (!req.inventoryDetails.commodities) req.inventoryDetails.commodities = [];
    req.inventoryDetails.commodities.push({
      commodityId: this.newCommodityId,
      name: this.newCommodityName,
      quantity: this.newCommodityQty,
      unitOfMeasure: this.newCommodityUom,
      classification: 'Added manually'
    });
    this.selectedRequisition.set({...req});
    this.showAddCommodity = false;
    this.newCommodityId = '';
    this.newCommodityName = '';
    this.newCommodityQty = 0;
    this.newCommodityUom = 'Each';
    this.showNotification('Commodity added');
  }

  removeCommodity(index: number) {
    const req = this.selectedRequisition();
    if (!req?.inventoryDetails?.commodities) return;
    req.inventoryDetails.commodities.splice(index, 1);
    this.selectedRequisition.set({...req});
    this.showNotification('Commodity removed');
  }

  navigateTo(view: string) {
    this.currentView.set(view as any);
    if (view === 'list') {
      this.loadRequisitions();
    }
    if (view === 'dashboard') {
      this.loadPipeline();
      this.loadSummary();
    }
    if (view === 'analytics') {
      this.analyticsService.getRequisitionAnalytics().subscribe(d => {
        this.reqAnalytics.set(d);
        setTimeout(() => this.renderReqCharts(), 100);
      });
    }
  }

  backToList() {
    this.currentView.set('dashboard');
    this.selectedRequisition.set(null);
    this.loadPipeline();
    this.loadSummary();
    this.loadRequisitions();
  }

  filterByStatus(status: string) {
    this.filterStatus = this.filterStatus === status ? '' : status;
    this.currentPage.set(1);
    if (this.currentView() === 'dashboard') {
      this.currentView.set('list');
    }
    this.loadRequisitions();
  }

  clearFilters() {
    this.searchQuery = '';
    this.filterStatus = '';
    this.filterDepartment = '';
    this.filterRequisitionType = '';
    this.filterCategory = '';
    this.filterPriority = '';
    this.filterRoute = '';
    this.filterDateFrom = '';
    this.filterDateTo = '';
    this.filterValueMin = null;
    this.filterValueMax = null;
    this.currentPage.set(1);
    this.loadRequisitions();
  }

  applyFilters() {
    this.currentPage.set(1);
    this.loadRequisitions();
  }

  sort(field: string) {
    if (this.sortBy === field) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortDir = 'asc';
    }
    this.loadRequisitions();
  }

  changePage(page: number) {
    this.currentPage.set(page);
    this.loadRequisitions();
  }

  toggleLineItemExpand(id: string) {
    this.expandedLineItem.set(this.expandedLineItem() === id ? null : id);
  }

  toggleDeptGrouping() {
    this.showDeptGrouping.set(!this.showDeptGrouping());
    if (this.showDeptGrouping() && !Object.keys(this.deptPipeline()).length) {
      this.loadDeptPipeline();
    }
  }

  getDeptPipelineKeys(): string[] {
    const data = this.deptPipeline();
    if (!data || typeof data !== 'object') return [];
    return Object.keys(data).filter(k => k !== 'totalValue');
  }

  myApprovalsValue(): number {
    return (this.myApprovals() || []).reduce((sum: number, r: any) => sum + (r.totalEstimatedValue?.amount || 0), 0);
  }

  getSlaClass(actual: number, target: number): string {
    if (!actual || !target) return 'sla-good';
    if (actual <= target) return 'sla-good';
    if (actual <= target * 1.5) return 'sla-warn';
    return 'sla-bad';
  }

  getSlaBarColor(actual: number, target: number): string {
    if (!actual || !target) return '#2e7d32';
    if (actual <= target) return '#2e7d32';
    if (actual <= target * 1.5) return '#ef6c00';
    return '#c62828';
  }

  getSlaBarWidth(actual: number, target: number): number {
    if (!target) return 0;
    return Math.min((actual / (target * 2)) * 100, 100);
  }

  isStepCompleted(key: string): boolean {
    const order = this.workflowSteps.map(s => s.key);
    const req = this.selectedRequisition();
    if (!req) return false;
    let statusKey = req.status;
    if (['supervisor_approved'].includes(statusKey)) statusKey = 'hod_review';
    if (['supervisor_rejected', 'hod_rejected', 'returned', 'voided', 'cancelled'].includes(statusKey)) {
      const lastApproved = req.auditTrail?.filter((e: any) => e.action.includes('Approved')).length || 0;
      if (lastApproved >= 2) statusKey = 'completed';
      else if (lastApproved === 1) statusKey = 'hod_review';
      else statusKey = 'submitted';
    }
    const currentIdx = order.indexOf(statusKey);
    const stepIdx = order.indexOf(key);
    if (currentIdx === -1) return false;
    return stepIdx < currentIdx;
  }

  isStepCurrent(key: string): boolean {
    const req = this.selectedRequisition();
    if (!req) return false;
    let statusKey = req.status;
    if (statusKey === 'supervisor_approved') statusKey = 'hod_review';
    if (statusKey === 'supervisor_rejected' || statusKey === 'hod_rejected') return false;
    return statusKey === key;
  }

  isEditable(): boolean {
    const status = this.selectedRequisition()?.status;
    return ['draft', 'saved', 'returned', 'submitted', 'supervisor_review', 'supervisor_approved', 'hod_review'].includes(status);
  }

  getBudgetPct(type: string): number {
    const req = this.selectedRequisition();
    if (!req?.budget) return 0;
    const total = req.budget.totalAnnual || 1;
    const committed = total - (req.budget.remainingAnnual || 0);
    if (type === 'committed') return Math.min((committed / total) * 100, 100);
    if (type === 'spent') return 0;
    if (type === 'thisReq') return Math.min(((req.totalEstimatedValue?.amount || 0) / total) * 100, 100);
    return 0;
  }

  generateReqReport() {
    const params = new URLSearchParams();
    if (this.reportDateFrom) params.set('dateFrom', this.reportDateFrom);
    if (this.reportDateTo) params.set('dateTo', this.reportDateTo);
    if (this.reportStatus) params.set('status', this.reportStatus);
    if (this.reportType) params.set('type', this.reportType);
    if (this.reportDepartment) params.set('department', this.reportDepartment);
    if (this.reportRequestedBy) params.set('requestedBy', this.reportRequestedBy);
    if (this.reportRoute) params.set('procurementRoute', this.reportRoute);
    if (this.reportOfflineRef) params.set('offlineReference', this.reportOfflineRef);
    const url = `${environment.apiUrl}/requisitions/report${params.toString() ? '?' + params.toString() : ''}`;
    this.http.get<any>(url, { headers: this.getHeaders() }).subscribe({
      next: (data) => this.reportResults.set(data),
      error: () => this.showNotification('Failed to generate report')
    });
  }

  clearReportFilters() {
    this.reportDateFrom = '';
    this.reportDateTo = '';
    this.reportStatus = '';
    this.reportType = '';
    this.reportDepartment = '';
    this.reportRequestedBy = '';
    this.reportRoute = '';
    this.reportOfflineRef = '';
    this.reportResults.set(null);
  }

  printRequisition() {
    window.print();
  }

  supervisorApprove() {
    const id = this.selectedRequisition()?.id;
    if (!id) return;
    this.http.post<any>(`${environment.apiUrl}/requisitions/${id}/supervisor-approve`, { comments: this.actionComments }, { headers: this.getHeaders() }).subscribe({
      next: (res) => { this.selectedRequisition.set(res.data?.requisition || res.requisition || res); this.actionComments = ''; }
    });
  }

  supervisorReject() {
    const id = this.selectedRequisition()?.id;
    if (!id || !this.actionComments) return;
    this.http.post<any>(`${environment.apiUrl}/requisitions/${id}/supervisor-reject`, { reason: this.actionComments }, { headers: this.getHeaders() }).subscribe({
      next: (res) => { this.selectedRequisition.set(res.data?.requisition || res.requisition || res); this.actionComments = ''; }
    });
  }

  supervisorReturn() {
    const id = this.selectedRequisition()?.id;
    if (!id) return;
    this.http.post<any>(`${environment.apiUrl}/requisitions/${id}/supervisor-return`, { reason: this.actionComments }, { headers: this.getHeaders() }).subscribe({
      next: (res) => { this.selectedRequisition.set(res.data?.requisition || res.requisition || res); this.actionComments = ''; }
    });
  }

  hodApprove() {
    const id = this.selectedRequisition()?.id;
    if (!id) return;
    this.http.post<any>(`${environment.apiUrl}/requisitions/${id}/hod-approve`, { comments: this.actionComments }, { headers: this.getHeaders() }).subscribe({
      next: (res) => { this.selectedRequisition.set(res.data?.requisition || res.requisition || res); this.actionComments = ''; }
    });
  }

  hodReject() {
    const id = this.selectedRequisition()?.id;
    if (!id || !this.actionComments) return;
    this.http.post<any>(`${environment.apiUrl}/requisitions/${id}/hod-reject`, { reason: this.actionComments }, { headers: this.getHeaders() }).subscribe({
      next: (res) => { this.selectedRequisition.set(res.data?.requisition || res.requisition || res); this.actionComments = ''; }
    });
  }

  hodReturn() {
    const id = this.selectedRequisition()?.id;
    if (!id) return;
    this.http.post<any>(`${environment.apiUrl}/requisitions/${id}/hod-return`, { reason: this.actionComments }, { headers: this.getHeaders() }).subscribe({
      next: (res) => { this.selectedRequisition.set(res.data?.requisition || res.requisition || res); this.actionComments = ''; }
    });
  }

  routeToProcurement() {
    const req = this.selectedRequisition();
    if (!req?.id || req.status !== 'final_approved') return;
    const route = req.procurementRoute;
    this.http.post<any>(`${environment.apiUrl}/requisitions/${req.id}/route`, {}, { headers: this.getHeaders() }).subscribe({
      next: (res) => {
        const updated = res.data?.requisition || res.requisition || res;
        this.selectedRequisition.set(updated);
        const methodLabel = this.getRouteLabel(route);
        const lq = res.data?.linkedQuotation || res.linkedQuotation;
        const linkMsg = updated?.linkedTender ? 'Tender ' + updated.linkedTender + ' created.' : lq ? 'Quotation ' + lq + ' created.' : '';
        this.notificationMessage.set(`Requisition successfully routed to ${methodLabel}. ${linkMsg}`);
        this.loadRequisitions();
      },
      error: (err) => {
        this.notificationMessage.set(err.error?.error || 'Failed to route requisition');
      }
    });
  }

  navigateToTender(tenderId: string) {
    if (tenderId) {
      this.router.navigate(['/tenders'], { queryParams: { id: tenderId } });
    }
  }

  navigateToQuotation(quotationId: string) {
    if (quotationId) {
      this.router.navigate(['/quotations'], { queryParams: { id: quotationId } });
    }
  }

  uploadDocument() {
    const id = this.selectedRequisition()?.id;
    if (!id || !this.newDocName || !this.newDocType) return;
    this.http.post<any>(`${environment.apiUrl}/requisitions/${id}/documents`, {
      name: this.newDocName, type: this.newDocType, category: this.newDocCategory,
      description: this.newDocDescription, size: Math.floor(Math.random() * 500000) + 50000
    }, { headers: this.getHeaders() }).subscribe({
      next: () => {
        this.newDocName = '';
        this.newDocType = '';
        this.newDocDescription = '';
        this.newDocCategory = 'supporting';
        this.viewRequisition({ id });
        this.showNotification('Document uploaded successfully');
      }
    });
  }

  confirmDeleteDocument(docId: string) {
    if (!this.confirmAction('Are you sure you want to remove this document?')) return;
    this.deleteDocument(docId);
  }

  deleteDocument(docId: string) {
    const id = this.selectedRequisition()?.id;
    if (!id) return;
    this.http.delete<any>(`${environment.apiUrl}/requisitions/${id}/documents/${docId}`, { headers: this.getHeaders() }).subscribe({
      next: () => {
        this.viewRequisition({ id });
        this.showNotification('Document removed');
      }
    });
  }

  getFilteredDocuments(): any[] {
    const docs = this.selectedRequisition()?.documents || [];
    if (!this.docTypeFilter) return docs;
    return docs.filter((d: any) => d.type === this.docTypeFilter);
  }

  applyDocTypeFilter() {
  }

  getDocumentCategories(): string[] {
    const docs = this.selectedRequisition()?.documents || [];
    const cats = [...new Set(docs.map((d: any) => d.category || 'supporting'))];
    return cats as string[];
  }

  getDocumentsByCategory(category: string): any[] {
    return (this.selectedRequisition()?.documents || []).filter((d: any) => (d.category || 'supporting') === category);
  }

  amendRequisition() {
    const id = this.selectedRequisition()?.id;
    if (!id) return;
    const reason = window.prompt('Please provide the reason for this amendment:');
    if (!reason) return;
    this.http.post<any>(`${environment.apiUrl}/requisitions/${id}/amend`, { reason }, { headers: this.getHeaders() }).subscribe({
      next: (res) => {
        const amendment = res.data?.requisition || res.data || res;
        this.showNotification('Amendment created — ' + amendment.referenceNumber);
        this.selectedRequisition.set(amendment);
        this.detailTab.set('details');
        this.loadPipeline();
        this.loadSummary();
        this.loadRequisitions();
      },
      error: (err) => {
        this.showNotification(err.error?.error || 'Failed to create amendment');
      }
    });
  }

  approveAmendment() {
    const id = this.selectedRequisition()?.id;
    if (!id) return;
    if (!this.confirmAction('Approve this amendment? The original requisition will be superseded.')) return;
    this.http.post<any>(`${environment.apiUrl}/requisitions/${id}/amendment/approve`, { comments: this.actionComments }, { headers: this.getHeaders() }).subscribe({
      next: (res) => {
        this.selectedRequisition.set(res.data?.requisition || res.requisition || res);
        this.actionComments = '';
        this.showNotification('Amendment approved — original requisition superseded');
        this.loadPipeline();
        this.loadSummary();
        this.loadRequisitions();
      },
      error: (err) => {
        this.showNotification(err.error?.error || 'Failed to approve amendment');
      }
    });
  }

  rejectAmendment() {
    const id = this.selectedRequisition()?.id;
    if (!id) return;
    const reason = this.actionComments || window.prompt('Please provide a reason for rejecting this amendment:');
    if (!reason) return;
    this.http.post<any>(`${environment.apiUrl}/requisitions/${id}/amendment/reject`, { reason }, { headers: this.getHeaders() }).subscribe({
      next: (res) => {
        this.selectedRequisition.set(res.data?.requisition || res.requisition || res);
        this.actionComments = '';
        this.showNotification('Amendment rejected — original requisition restored');
        this.loadPipeline();
        this.loadSummary();
        this.loadRequisitions();
      },
      error: (err) => {
        this.showNotification(err.error?.error || 'Failed to reject amendment');
      }
    });
  }

  exportRequisition() {
    const id = this.selectedRequisition()?.id;
    if (!id) return;
    this.http.get<any>(`${environment.apiUrl}/requisitions/${id}/export`, { headers: this.getHeaders() }).subscribe({
      next: (exportData) => {
        this.showExportPrintView(exportData);
      },
      error: (err) => {
        this.showNotification(err.error?.error || 'Failed to export requisition');
      }
    });
  }

  private showExportPrintView(data: any) {
    const req = data.requisition;
    const lines = (data.lineItems || []).map((li: any) =>
      `<tr><td>${li.number}</td><td>${li.purchaseItem}</td><td>${li.description || ''}</td><td>${li.quantity}</td><td>${li.unitOfMeasure}</td><td>R ${(li.estimatedUnitPrice?.amount || 0).toLocaleString('en-ZA', {minimumFractionDigits: 2})}</td><td>R ${(li.estimatedTotal?.amount || 0).toLocaleString('en-ZA', {minimumFractionDigits: 2})}</td></tr>`
    ).join('');
    const approvals = (data.approvalHistory || []).map((a: any) =>
      `<tr><td>Level ${a.level} - ${a.role}</td><td>${a.assignedTo?.name || ''}</td><td>${a.status}</td><td>${a.actionDate ? new Date(a.actionDate).toLocaleDateString('en-ZA') : 'Pending'}</td><td>${a.comments || ''}</td></tr>`
    ).join('');
    const docs = (data.documents || []).map((d: any) =>
      `<tr><td>${d.type}</td><td>${d.name}</td><td>${this.formatFileSize(d.size)}</td><td>${d.uploadedAt ? new Date(d.uploadedAt).toLocaleDateString('en-ZA') : ''}</td></tr>`
    ).join('');

    const html = `<!DOCTYPE html><html><head><title>${req.referenceNumber} - Export</title><style>body{font-family:Arial,sans-serif;padding:20px;color:#333}h1{font-size:18px;border-bottom:2px solid #333;padding-bottom:8px}h2{font-size:14px;margin-top:20px;background:#f5f5f5;padding:8px;border-left:3px solid #3b82f6}table{width:100%;border-collapse:collapse;margin:10px 0}th,td{padding:6px 10px;border:1px solid #ddd;font-size:12px;text-align:left}th{background:#f8f8f8;font-weight:600}.meta{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin:10px 0}.meta-item{padding:4px 0}.meta-label{font-size:11px;color:#666;display:block}.meta-value{font-size:13px;font-weight:500}.header-row{display:flex;justify-content:space-between;align-items:flex-start}.value-box{text-align:right}.value-box .amount{font-size:22px;font-weight:700}</style></head><body><div class="header-row"><div><h1>${req.referenceNumber} - ${req.title}</h1><p style="font-size:12px;color:#666">Exported: ${new Date(data.exportDate).toLocaleDateString('en-ZA')} by ${data.exportedBy}</p></div><div class="value-box"><div style="font-size:11px;color:#666">ESTIMATED VALUE</div><div class="amount">R ${(req.totalEstimatedValue?.amount || 0).toLocaleString('en-ZA', {minimumFractionDigits: 2})}</div></div></div><div class="meta"><div class="meta-item"><span class="meta-label">Status</span><span class="meta-value">${this.getStatusLabel(req.status)}</span></div><div class="meta-item"><span class="meta-label">Type</span><span class="meta-value">${this.getTypeLabel(req.requisitionType)}</span></div><div class="meta-item"><span class="meta-label">Category</span><span class="meta-value">${req.category}</span></div><div class="meta-item"><span class="meta-label">Department</span><span class="meta-value">${req.department}</span></div><div class="meta-item"><span class="meta-label">Priority</span><span class="meta-value">${req.priority}</span></div><div class="meta-item"><span class="meta-label">Requested By</span><span class="meta-value">${req.requestedBy?.name || ''}</span></div><div class="meta-item"><span class="meta-label">Capture Date</span><span class="meta-value">${req.captureDate ? new Date(req.captureDate).toLocaleDateString('en-ZA') : ''}</span></div><div class="meta-item"><span class="meta-label">Procurement Route</span><span class="meta-value">${req.procurementRoute ? this.getRouteLabel(req.procurementRoute) : 'Pending'}</span></div><div class="meta-item"><span class="meta-label">Days in Process</span><span class="meta-value">${req.daysInProcess || 0}</span></div></div><p style="margin-top:8px"><strong>Description:</strong> ${req.description || ''}</p>${lines ? '<h2>Line Items</h2><table><thead><tr><th>#</th><th>Item</th><th>Description</th><th>Qty</th><th>UoM</th><th>Unit Price</th><th>Total</th></tr></thead><tbody>' + lines + '</tbody></table>' : ''}${data.budget ? '<h2>Budget Information</h2><div class="meta"><div class="meta-item"><span class="meta-label">Project</span><span class="meta-value">' + (data.budget.projectName || '') + '</span></div><div class="meta-item"><span class="meta-label">Total Budget</span><span class="meta-value">R ' + (data.budget.totalBudget || 0).toLocaleString('en-ZA', {minimumFractionDigits: 2}) + '</span></div><div class="meta-item"><span class="meta-label">Available</span><span class="meta-value">R ' + (data.budget.available || 0).toLocaleString('en-ZA', {minimumFractionDigits: 2}) + '</span></div><div class="meta-item"><span class="meta-label">Budget Sufficient</span><span class="meta-value">' + (data.budget.sufficient ? 'Yes' : 'No') + '</span></div></div>' : ''}${approvals ? '<h2>Approval History</h2><table><thead><tr><th>Role</th><th>Assigned To</th><th>Status</th><th>Date</th><th>Comments</th></tr></thead><tbody>' + approvals + '</tbody></table>' : ''}${docs ? '<h2>Documents</h2><table><thead><tr><th>Type</th><th>Name</th><th>Size</th><th>Uploaded</th></tr></thead><tbody>' + docs + '</tbody></table>' : ''}</body></html>`;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 500);
    }
  }

  formatCurrency(amount: number): string {
    if (!amount && amount !== 0) return 'R 0';
    if (amount >= 1000000) return `R ${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `R ${(amount / 1000).toFixed(0)}K`;
    return `R ${amount.toFixed(0)}`;
  }

  formatCurrencyFull(amount: number): string {
    if (!amount && amount !== 0) return 'R 0.00';
    return 'R ' + amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 });
  }

  formatDate(date: string): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  formatDateTime(date: string): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  formatFileSize(bytes: number): string {
    if (!bytes) return '0 B';
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
    if (bytes >= 1024) return (bytes / 1024).toFixed(0) + ' KB';
    return bytes + ' B';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      draft: 'Draft', saved: 'Saved', submitted: 'Submitted',
      supervisor_review: 'Supervisor Review', supervisor_approved: 'Supervisor Approved',
      supervisor_rejected: 'Supervisor Rejected', hod_review: 'HOD Review',
      hod_approved: 'HOD Approved', hod_rejected: 'HOD Rejected',
      final_approved: 'Approved', routed: 'Routed', completed: 'Completed',
      voided: 'Voided', returned: 'Returned', cancelled: 'Cancelled',
      pending: 'Pending', approved: 'Approved', rejected: 'Rejected',
      amendment_draft: 'Amendment Draft', amendment_pending: 'Amendment Pending'
    };
    return labels[status] || status;
  }

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      operational: 'Operational', capital: 'Capital',
      financial_position: 'Financial Position', inventory_external: 'Inventory External',
      deviation: 'Deviation', maintenance: 'Maintenance', emergency: 'Emergency'
    };
    return labels[type] || type;
  }

  getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      goods: 'inventory_2', services: 'engineering', works: 'construction',
      professional_services: 'work', consulting: 'support_agent'
    };
    return icons[category] || 'category';
  }

  getRouteLabel(route: string): string {
    const labels: Record<string, string> = {
      direct_purchase: 'Direct Purchase', informal_quotation: 'Informal Quotation',
      formal_quotation: 'Formal Quotation', competitive_bid: 'Competitive Bid',
      deviation: 'Deviation'
    };
    return labels[route] || route;
  }

  getRouteBadgeClass(route: string): string {
    return 'route-badge route-' + route;
  }

  getTypeBadgeClass(type: string): string {
    return 'type-badge type-' + type;
  }

  getPriorityIcon(priority: string): string {
    const icons: Record<string, string> = {
      low: 'arrow_downward', medium: 'remove', high: 'arrow_upward', urgent: 'priority_high'
    };
    return icons[priority] || 'remove';
  }

  getRouteScoring(route: string): string | null {
    const b = this.boundaries().find((b: any) => b.method === route && b.scoring);
    return b?.scoring || null;
  }

  getRouteMinQuotes(route: string): number {
    const b = this.boundaries().find((b: any) => b.method === route && b.minQuotes > 0);
    return b?.minQuotes || 0;
  }

  getRouteAdvertDays(route: string): number {
    const b = this.boundaries().find((b: any) => b.method === route && b.advertDays > 0);
    return b?.advertDays || 0;
  }

  getDeviationRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      scm_manager: 'SCM Manager', cfo: 'Chief Financial Officer', municipal_manager: 'Municipal Manager'
    };
    return labels[role] || role;
  }

  getDocIcon(type: string): string {
    const icons: Record<string, string> = {
      motivation: 'article', quotation: 'request_quote', specification: 'description',
      approval: 'verified', supporting: 'attach_file', supporting_document: 'attach_file',
      deviation_approval: 'warning', evidence: 'photo_library', council_resolution: 'gavel',
      compliance: 'verified_user', procurement_plan: 'assignment', budget_confirmation: 'account_balance',
      other: 'insert_drive_file'
    };
    return icons[type] || 'description';
  }

  getAuditDotClass(action: string): string {
    if (action.toLowerCase().includes('approved')) return 'dot-approval';
    if (action.toLowerCase().includes('rejected') || action.toLowerCase().includes('voided')) return 'dot-rejection';
    if (action.toLowerCase().includes('system') || action === 'Routed') return 'dot-system';
    return 'dot-action';
  }

  openCreateForm() {
    this.formData = {
      title: '', description: '', requisitionType: 'operational', category: 'goods',
      department: '', priority: 'medium', preferredSupplier: '', costCollector: '',
      offlineReferenceNumber: '', supervisor: '', hod: '',
      isTenderRequisition: false, isMultiYear: false, isInventoryDirectDelivery: false,
      deviationMotivation: '', deviationReason: '',
      procurementPlanId: '', procurementPlanItemId: ''
    };
    this.formLineItems = [{ purchaseItem: '', description: '', quantity: 1, unitOfMeasure: 'each', estimatedUnitPrice: 0, deliveryDate: '', deliveryAddress: '' }];
    this.notificationMessage.set('');
    this.loadProcurementPlans();
    this.currentView.set('create');
  }

  openEditForm() {
    const req = this.selectedRequisition();
    if (!req) return;
    this.formData = {
      title: req.title || '', description: req.description || '',
      requisitionType: req.requisitionType || 'operational', category: req.category || 'goods',
      department: req.department || '', priority: req.priority || 'medium',
      preferredSupplier: req.preferredSupplier || '', costCollector: req.costCollector || '',
      project: req.project || null,
      offlineReferenceNumber: req.offlineReferenceNumber || '',
      supervisor: req.supervisor?.id || '',
      hod: req.hod?.id || '',
      isTenderRequisition: req.isTenderRequisition || false,
      isMultiYear: req.isMultiYear || false,
      isInventoryDirectDelivery: req.isInventoryDirectDelivery || false,
      deviationMotivation: req.deviation?.motivation || '',
      deviationReason: req.deviation?.reason || req.deviation?.motivationDescription || '',
      procurementPlanId: req.procurementPlanReference || '',
      procurementPlanItemId: req.procurementPlanItemId || ''
    };
    this.loadProcurementPlans();
    if (this.formData.procurementPlanId) {
      this.onProcurementPlanChange();
    }
    this.formLineItems = (req.lineItems || []).map((li: any) => ({
      purchaseItem: li.purchaseItem || li.name || li.description || '',
      description: li.purchaseItemDescription2 || li.description || li.purchaseItem || li.name || '',
      quantity: li.quantity || 1, unitOfMeasure: li.unitOfMeasure || 'each',
      estimatedUnitPrice: li.estimatedUnitPrice?.amount || li.estimatedUnitCost?.amount || li.estimatedUnitPrice || li.estimatedUnitCost || 0,
      deliveryDate: li.deliveryDate || '',
      deliveryAddress: li.deliveryAddress || ''
    }));
    if (this.formLineItems.length === 0) {
      this.formLineItems = [{ purchaseItem: '', description: '', quantity: 1, unitOfMeasure: 'each', estimatedUnitPrice: 0, deliveryDate: '', deliveryAddress: '' }];
    }
    this.notificationMessage.set('');
    this.currentView.set('edit');
  }

  addLineItem() {
    this.formLineItems = [...this.formLineItems, { purchaseItem: '', description: '', quantity: 1, unitOfMeasure: 'each', estimatedUnitPrice: 0, deliveryDate: '', deliveryAddress: '' }];
  }

  removeLineItem(index: number) {
    if (this.formLineItems.length <= 1) return;
    this.formLineItems = this.formLineItems.filter((_, i) => i !== index);
  }

  getFormTotal(): number {
    return this.formLineItems.reduce((sum, item) => sum + ((item.quantity || 0) * (item.estimatedUnitPrice || 0)), 0);
  }

  getReqLineItemsTotal(req: any): number {
    if (!req?.lineItems?.length) return 0;
    return req.lineItems.reduce((sum: number, li: any) => {
      const total = li.estimatedTotal?.amount || li.estimatedUnitPrice?.amount || li.estimatedUnitCost?.amount || 0;
      const qty = li.quantity || 1;
      if (li.estimatedTotal?.amount) return sum + li.estimatedTotal.amount;
      return sum + (qty * total);
    }, 0);
  }

  private buildPayload(): any {
    return {
      title: this.formData.title,
      description: this.formData.description,
      requisitionType: this.formData.requisitionType,
      category: this.formData.category,
      department: this.formData.department,
      priority: this.formData.priority,
      preferredSupplier: this.formData.preferredSupplier || null,
      costCollector: this.formData.costCollector || null,
      project: this.formData.project || { id: 'PRJ-001', name: 'General Operations' },
      offlineReferenceNumber: this.formData.offlineReferenceNumber || null,
      supervisor: this.formData.supervisor ? { id: this.formData.supervisor, name: this.supervisorOptions.find(s => s.id === this.formData.supervisor)?.name } : null,
      hod: this.formData.hod ? { id: this.formData.hod, name: this.hodOptions.find(h => h.id === this.formData.hod)?.name } : null,
      isTenderRequisition: this.formData.isTenderRequisition || false,
      isMultiYear: this.formData.isMultiYear || false,
      isInventoryDirectDelivery: this.formData.isInventoryDirectDelivery || false,
      deviationReason: this.formData.deviationReason || null,
      deviationMotivation: this.formData.deviationMotivation || null,
      procurementPlanReference: this.formData.procurementPlanId || null,
      procurementPlanItemId: this.formData.procurementPlanItemId || null,
      totalEstimatedValue: { amount: this.getFormTotal(), currency: 'ZAR' },
      estimatedCost: { amount: this.getFormTotal(), currency: 'ZAR' },
      lineItems: this.formLineItems.map(li => ({
        purchaseItem: li.purchaseItem,
        name: li.purchaseItem,
        description: li.description,
        quantity: li.quantity,
        unitOfMeasure: li.unitOfMeasure,
        estimatedUnitPrice: { amount: li.estimatedUnitPrice, currency: 'ZAR' },
        estimatedTotal: { amount: (li.quantity || 0) * (li.estimatedUnitPrice || 0), currency: 'ZAR' },
        deliveryDate: li.deliveryDate || null,
        deliveryAddress: li.deliveryAddress || null
      }))
    };
  }

  saveRequisition() {
    if (!this.formData.title || !this.formData.description) {
      this.showNotification('Please fill in Title and Description');
      return;
    }
    if (this.formLineItems?.length) {
      const emptyItems = this.formLineItems
        .map((li: any, i: number) => (!(li.purchaseItem || '').trim() && !(li.description || '').trim() && !(li.name || '').trim()) ? i + 1 : null)
        .filter((v: number | null) => v !== null);
      if (emptyItems.length) {
        this.showNotification(`Line item${emptyItems.length > 1 ? 's' : ''} ${emptyItems.join(', ')} missing description — please fill in the item name`);
        return;
      }
    }
    this.saving.set(true);
    const payload = this.buildPayload();

    if (this.currentView() === 'edit' && this.selectedRequisition()?.id) {
      const id = this.selectedRequisition()!.id;
      this.http.put<any>(`${environment.apiUrl}/requisitions/${id}`, payload, { headers: this.getHeaders() }).subscribe({
        next: (res) => {
          this.saving.set(false);
          this.selectedRequisition.set(res.data?.requisition || res.data || res);
          this.currentView.set('detail');
          this.detailTab.set('details');
          this.showNotification('Requisition updated successfully');
          this.http.get<any>(`${environment.apiUrl}/requisitions/${id}`, { headers: this.getHeaders() }).subscribe({
            next: (updated) => {
              this.selectedRequisition.set(updated.data?.requisition || updated.data || updated);
            }
          });
          this.loadRequisitions();
          this.loadPipeline();
          this.loadSummary();
        },
        error: (err) => {
          this.saving.set(false);
          this.showNotification(err.error?.error || 'Failed to update requisition');
        }
      });
    } else {
      this.http.post<any>(`${environment.apiUrl}/requisitions`, payload, { headers: this.getHeaders() }).subscribe({
        next: (res) => {
          this.saving.set(false);
          this.selectedRequisition.set(res.data || res);
          this.currentView.set('detail');
          this.showNotification('Requisition created successfully');
          this.loadPipeline();
          this.loadSummary();
          this.loadRequisitions();
        },
        error: (err) => {
          this.saving.set(false);
          this.showNotification(err.error?.error || err.error?.details?.join(', ') || 'Failed to create requisition');
        }
      });
    }
  }

  submitRequisition() {
    if (this.currentView() === 'create' || this.currentView() === 'edit') {
      if (!this.formData.title || !this.formData.description) {
        this.showNotification('Please fill in Title and Description');
        return;
      }
      if (this.formLineItems?.length) {
        const emptyItems = this.formLineItems
          .map((li: any, i: number) => (!(li.purchaseItem || '').trim() && !(li.description || '').trim() && !(li.name || '').trim()) ? i + 1 : null)
          .filter((v: number | null) => v !== null);
        if (emptyItems.length) {
          this.showNotification(`Line item${emptyItems.length > 1 ? 's' : ''} ${emptyItems.join(', ')} missing description — please fill in the item name`);
          return;
        }
      }
      this.saving.set(true);
      const payload = this.buildPayload();
      const isEdit = this.currentView() === 'edit' && this.selectedRequisition()?.id;

      const saveObs = isEdit
        ? this.http.put<any>(`${environment.apiUrl}/requisitions/${this.selectedRequisition()!.id}`, payload, { headers: this.getHeaders() })
        : this.http.post<any>(`${environment.apiUrl}/requisitions`, payload, { headers: this.getHeaders() });

      saveObs.subscribe({
        next: (saved) => {
          const savedData = saved.data?.requisition || saved.data || saved;
          const id = savedData.id || this.selectedRequisition()?.id;
          if (!id) {
            this.saving.set(false);
            this.selectedRequisition.set(savedData);
            this.currentView.set('detail');
            this.detailTab.set('details');
            this.showNotification('Saved but could not determine requisition ID for submission');
            return;
          }
          this.http.post<any>(`${environment.apiUrl}/requisitions/${id}/submit`, {}, { headers: this.getHeaders() }).subscribe({
            next: (res) => {
              this.saving.set(false);
              this.selectedRequisition.set(res.data?.requisition || res.requisition || res);
              this.currentView.set('detail');
              this.detailTab.set('details');
              this.showNotification('Requisition submitted for approval');
              this.loadPipeline();
              this.loadSummary();
              this.loadRequisitions();
            },
            error: (err) => {
              this.saving.set(false);
              this.selectedRequisition.set(savedData);
              this.currentView.set('detail');
              this.detailTab.set('details');
              this.showNotification(err.error?.error || 'Saved but could not submit — ' + (err.error?.details?.join(', ') || 'check required fields'));
            }
          });
        },
        error: (err) => {
          this.saving.set(false);
          this.showNotification(err.error?.error || 'Failed to save requisition');
        }
      });
    } else {
      const id = this.selectedRequisition()?.id;
      if (!id) return;
      this.http.post<any>(`${environment.apiUrl}/requisitions/${id}/submit`, {}, { headers: this.getHeaders() }).subscribe({
        next: (res) => {
          this.selectedRequisition.set(res.data?.requisition || res.requisition || res);
          this.showNotification('Requisition submitted for approval');
          this.loadPipeline();
          this.loadSummary();
        },
        error: (err) => {
          this.showNotification(err.error?.error || 'Failed to submit — ' + (err.error?.details?.join(', ') || 'unknown error'));
        }
      });
    }
  }

  voidRequisition() {
    const id = this.selectedRequisition()?.id;
    if (!id) return;
    const reason = window.prompt('Please enter a reason for voiding this requisition:');
    if (!reason) return;
    if (!this.confirmAction('Are you sure you want to void this requisition? This action cannot be undone.')) return;
    this.http.post<any>(`${environment.apiUrl}/requisitions/${id}/void`, { reason }, { headers: this.getHeaders() }).subscribe({
      next: (res) => {
        this.selectedRequisition.set(res.data?.requisition || res.requisition || res);
        this.showNotification('Requisition voided successfully');
        this.loadPipeline();
        this.loadSummary();
      },
      error: (err) => {
        this.showNotification(err.error?.error || 'Failed to void requisition');
      }
    });
  }

  deleteRequisition() {
    const id = this.selectedRequisition()?.id;
    if (!id) return;
    if (!this.confirmAction('Are you sure you want to delete this requisition? This action cannot be undone.')) return;
    this.http.delete<any>(`${environment.apiUrl}/requisitions/${id}`, { headers: this.getHeaders() }).subscribe({
      next: () => {
        this.showNotification('Requisition deleted');
        this.backToList();
      },
      error: (err) => {
        this.showNotification(err.error?.error || 'Failed to delete requisition');
      }
    });
  }

  recallRequisition() {
    const id = this.selectedRequisition()?.id;
    if (!id) return;
    if (!this.confirmAction('Are you sure you want to recall this requisition?')) return;
    const reason = 'Recalled by requestor';
    this.http.post<any>(`${environment.apiUrl}/requisitions/${id}/void`, { reason }, { headers: this.getHeaders() }).subscribe({
      next: (res) => {
        this.selectedRequisition.set(res.data?.requisition || res.requisition || res);
        this.showNotification('Requisition recalled successfully');
        this.loadPipeline();
        this.loadSummary();
      },
      error: (err) => {
        this.showNotification(err.error?.error || 'Failed to recall requisition');
      }
    });
  }

  sumDatasetMillions(index: number): string {
    const data = this.reqAnalytics();
    if (!data?.demandVsBudget?.datasets?.[index]?.data) return '0.0';
    const sum = data.demandVsBudget.datasets[index].data.reduce((a: number, b: number) => a + b, 0);
    return (sum / 1000000).toFixed(1);
  }

  private renderReqCharts(): void {
    if (!this.reqAnalytics()) return;

    setTimeout(() => {
      const data = this.reqAnalytics();

      const dbCtx = document.getElementById('demandBudgetChart') as HTMLCanvasElement;
      if (dbCtx) {
        new Chart(dbCtx, {
          type: 'line',
          data: {
            labels: data.demandVsBudget.labels,
            datasets: data.demandVsBudget.datasets.map((ds: any) => ({
              ...ds,
              tension: 0.4,
              fill: true,
              pointRadius: 3,
              pointHoverRadius: 5,
              borderWidth: 2
            }))
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, usePointStyle: true, padding: 15 } } },
            scales: {
              y: { ticks: { callback: (v: any) => 'R' + (v/1000000).toFixed(1) + 'M', font: { size: 10 } }, grid: { color: '#f1f5f9' } },
              x: { ticks: { font: { size: 10 } }, grid: { display: false } }
            }
          }
        });
      }

      const spCtx = document.getElementById('splittingChart') as HTMLCanvasElement;
      if (spCtx) {
        new Chart(spCtx, {
          type: 'bar',
          data: {
            labels: data.splittingDetection.labels,
            datasets: [{
              label: 'Detected Split Cases',
              data: data.splittingDetection.detectedCases,
              backgroundColor: '#fca5a5',
              borderColor: '#ef4444',
              borderWidth: 1,
              borderRadius: 4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              y: { ticks: { stepSize: 1, font: { size: 10 } }, grid: { color: '#f1f5f9' } },
              x: { ticks: { font: { size: 10 } }, grid: { display: false } }
            }
          }
        });
      }
    }, 100);
  }

  confirmAction(message: string): boolean {
    return window.confirm(message);
  }

  showNotification(message: string) {
    this.notificationMessage.set(message);
    setTimeout(() => this.notificationMessage.set(''), 5000);
  }
}
