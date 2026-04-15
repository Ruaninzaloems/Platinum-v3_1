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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { environment } from '../../environment';
import { DashboardService } from '../../core/services/dashboard.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

@Component({
  selector: 'app-quotations',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatCardModule, MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatDatepickerModule, MatNativeDateModule, MatSelectModule, MatMenuModule, MatTooltipModule, MatTabsModule, MatChipsModule, MatBadgeModule, MatCheckboxModule, MatSlideToggleModule, MatProgressBarModule],
  templateUrl: './quotations.component.html',
  styleUrl: './quotations.component.scss'
})
export class QuotationsComponent implements OnInit {
  private http = inject(HttpClient);
  private dashboardService = inject(DashboardService);
  private analyticsService = inject(AnalyticsService);
  private apiUrl = environment.apiUrl;

  currentView = signal<string>('dashboard');
  rfqs = signal<any[]>([]);
  selectedRfq = signal<any>(null);
  dashSummary = signal<any>({});
  config = signal<any>({});
  budgetVotes = signal<any[]>([]);
  rotationalVendors = signal<any[]>([]);
  registeredVendors = signal<any[]>([]);
  aiInsights = signal<any[]>([]);
  quotAnalytics = signal<any>(null);
  vendorNotifications = signal<any[]>([]);
  auditTrail = signal<any[]>([]);
  notification = signal<string>('');
  notificationType = signal<string>('success');
  loading = signal(false);
  saving = signal(false);
  totalPages = signal(1);
  totalRfqs = signal(0);
  currentPage = signal(1);
  pageSize = signal(20);
  pageSizeValue = 20;
  showAdvanced = signal(false);
  showAddQuote = signal(false);
  showAwardPanel = signal(false);
  editMode = signal(false);
  detailTab = signal<string>('info');
  reportData = signal<any>(null);
  budgetValidationResult = signal<any>(null);
  selectedVendorIds = signal<string[]>([]);
  rfqDocuments = signal<any[]>([]);
  buyersList = signal<any[]>([]);
  budgetCheckResult = signal<any>(null);
  showDocUpload = signal(false);
  scmUsers = signal<any[]>([]);
  showBuyerDialog = signal(false);
  routeValidation = signal<any>(null);
  scmBoundaries = signal<any[]>([]);
  selectedBuyerId = '';
  availableRequisitions = signal<any[]>([]);
  requisitionSearch = '';

  filterStatus = '';
  searchQuery = '';
  filterDepartment = '';
  filterBusinessArea = '';
  filterSubSector = '';
  filterServiceType = '';
  filterVoteNumber = '';
  filterAssignedBuyer = '';
  filterDateFrom = '';
  filterDateTo = '';
  filterValueMin: number | null = null;
  filterValueMax: number | null = null;

  reportFilterDateFrom = '';
  reportFilterDateTo = '';
  reportFilterStatus = '';
  reportFilterDepartment = '';

  vendorFilterBusinessArea = '';
  vendorFilterSubSector = '';
  vendorFilterProvince = '';
  vendorSelectRfqId = '';

  awardQuoteId = '';
  overruleReason = '';

  departments = [
    'Infrastructure and Engineering', 'Water & Sanitation', 'Corporate Services',
    'Community Services', 'Finance', 'Planning & Development', 'Electricity', 'Public Safety'
  ];

  provinces = [
    'Gauteng', 'KwaZulu-Natal', 'Western Cape', 'Eastern Cape', 'Free State',
    'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape'
  ];

  rfqForm: any = {};
  formLineItems: any[] = [];
  quoteForm: any = { supplierName: '', bbbeeLevel: 1, deliveryDays: 14, lineItems: [] };
  docForm: any = { name: '', type: 'correspondence', description: '' };

  pageStart = computed(() => {
    const total = this.totalRfqs();
    if (total === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize() + 1;
  });

  pageEnd = computed(() => {
    return Math.min(this.currentPage() * this.pageSize(), this.totalRfqs());
  });

  allVendorsSelected = computed(() => {
    const vendors = this.rotationalVendors();
    const sel = this.selectedVendorIds();
    return vendors.length > 0 && vendors.every(v => sel.includes(v.supplierId));
  });

  ngOnInit() {
    this.loadDashboard();
    this.loadConfig();
    this.loadBudgetVotes();
    this.loadBuyersList();
    this.loadScmUsers();
    this.loadScmBoundaries();
    this.dashboardService.getQuotationAiInsights().subscribe(d => this.aiInsights.set(d.insights || []));
    this.analyticsService.getQuotationAnalytics().subscribe(d => {
      this.quotAnalytics.set(d);
      this.renderQuotCharts();
    });
  }

  private renderQuotCharts(): void {
    if (!this.quotAnalytics()) return;
    setTimeout(() => {
      const data = this.quotAnalytics();

      const compCtx = document.getElementById('quoteComplianceChart') as HTMLCanvasElement;
      if (compCtx) {
        new Chart(compCtx, {
          type: 'line',
          data: {
            labels: data.threeQuoteCompliance.labels,
            datasets: [
              { label: 'Compliance Rate %', data: data.threeQuoteCompliance.complianceRate, borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', tension: 0.4, fill: true, pointRadius: 3, borderWidth: 2, yAxisID: 'y1' },
              { label: 'Compliant', data: data.threeQuoteCompliance.compliant, borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.5)', type: 'bar' as any, borderRadius: 4, yAxisID: 'y' },
              { label: 'Non-Compliant', data: data.threeQuoteCompliance.nonCompliant, borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.5)', type: 'bar' as any, borderRadius: 4, yAxisID: 'y' }
            ]
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { font: { size: 10 }, usePointStyle: true, padding: 10 } } },
            scales: {
              y: { position: 'left', ticks: { font: { size: 10 } }, grid: { color: '#f1f5f9' }, title: { display: true, text: 'Count', font: { size: 10 } } },
              y1: { position: 'right', min: 70, max: 100, ticks: { font: { size: 10 }, callback: (v: any) => v + '%' }, grid: { display: false }, title: { display: true, text: 'Rate %', font: { size: 10 } } },
              x: { ticks: { font: { size: 10 } }, grid: { display: false } }
            }
          }
        });
      }

      const concCtx = document.getElementById('awardConcentrationChart') as HTMLCanvasElement;
      if (concCtx) {
        new Chart(concCtx, {
          type: 'doughnut',
          data: {
            labels: data.awardConcentration.suppliers,
            datasets: [{ data: data.awardConcentration.data, backgroundColor: ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444','#06b6d4','#94a3b8'], borderWidth: 2, borderColor: '#fff' }]
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'right', labels: { font: { size: 9 }, usePointStyle: true, padding: 6 } } },
            cutout: '50%'
          }
        });
      }
    }, 100);
  }

  loadDashboard() {
    this.http.get<any>(`${this.apiUrl}/quotations/dashboard/summary`).subscribe({
      next: (res) => this.dashSummary.set(res.data || res),
      error: () => this.dashSummary.set({})
    });
  }

  loadConfig() {
    this.http.get<any>(`${this.apiUrl}/quotations/config`).subscribe({
      next: (data) => this.config.set(data?.data || data || {}),
      error: () => this.config.set({})
    });
  }

  loadBudgetVotes() {
    this.http.get<any>(`${this.apiUrl}/quotations/budget-votes`).subscribe({
      next: (data) => this.budgetVotes.set(data || []),
      error: () => this.budgetVotes.set([])
    });
  }

  loadScmBoundaries() {
    this.http.get<any>(`${this.apiUrl}/scm-config/boundaries`).subscribe({
      next: (res) => {
        const data = res?.data || res;
        this.scmBoundaries.set(data?.boundaries || []);
      },
      error: () => this.scmBoundaries.set([])
    });
  }

  validateRouteForValue() {
    const amount = this.rfqForm.estimatedCostAmount;
    if (!amount || amount <= 0) {
      this.routeValidation.set(null);
      return;
    }
    const boundaries = this.scmBoundaries();
    if (!boundaries.length) return;
    const matched = boundaries.find((b: any) =>
      amount >= (b.rangeFrom || 0) && (b.rangeTo == null || amount <= b.rangeTo)
    );
    if (matched) {
      this.routeValidation.set({
        matched: true,
        method: matched.method,
        label: matched.label,
        scoring: matched.scoring,
        minQuotes: matched.minQuotes,
        advertDays: matched.advertDays,
        description: matched.description
      });
      if (matched.scoring && this.rfqForm.scoringMethod !== matched.scoring) {
        this.rfqForm.scoringMethod = matched.scoring;
      }
    } else {
      this.routeValidation.set({ matched: false, warning: `No process boundary found for R${amount.toLocaleString('en-ZA')}` });
    }
  }

  loadRfqs() {
    this.loading.set(true);
    let url = `${this.apiUrl}/quotations?page=${this.currentPage()}&pageSize=${this.pageSize()}`;
    if (this.filterStatus) url += `&status=${this.filterStatus}`;
    if (this.searchQuery) url += `&search=${encodeURIComponent(this.searchQuery)}`;
    if (this.filterDepartment) url += `&department=${encodeURIComponent(this.filterDepartment)}`;
    if (this.filterBusinessArea) url += `&businessArea=${encodeURIComponent(this.filterBusinessArea)}`;
    if (this.filterSubSector) url += `&subSector=${encodeURIComponent(this.filterSubSector)}`;
    if (this.filterServiceType) url += `&serviceType=${encodeURIComponent(this.filterServiceType)}`;
    if (this.filterVoteNumber) url += `&voteNumber=${encodeURIComponent(this.filterVoteNumber)}`;
    if (this.filterAssignedBuyer) url += `&assignedBuyer=${encodeURIComponent(this.filterAssignedBuyer)}`;
    if (this.filterDateFrom) url += `&dateFrom=${encodeURIComponent(this.filterDateFrom)}`;
    if (this.filterDateTo) url += `&dateTo=${encodeURIComponent(this.filterDateTo)}`;
    if (this.filterValueMin) url += `&valueMin=${this.filterValueMin}`;
    if (this.filterValueMax) url += `&valueMax=${this.filterValueMax}`;

    this.http.get<any>(url).subscribe({
      next: (res) => {
        this.rfqs.set(res.data || []);
        this.totalRfqs.set(res.totalCount || res.total || 0);
        this.totalPages.set(res.totalPages || 1);
        this.loading.set(false);
      },
      error: () => { this.rfqs.set([]); this.loading.set(false); }
    });
  }

  loadRfqDetail(id: string) {
    this.loading.set(true);
    this.http.get<any>(`${this.apiUrl}/quotations/${id}`).subscribe({
      next: (response) => {
        const data = response.data?.rfq || response.data || response;
        this.selectedRfq.set(data);
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); this.notify('Failed to load RFQ details', 'error'); }
    });
  }

  loadAuditTrail() {
    const id = this.selectedRfq()?.id;
    if (!id) return;
    this.http.get<any>(`${this.apiUrl}/quotations/${id}/audit-trail`).subscribe({
      next: (data) => this.auditTrail.set(data.auditTrail || data || []),
      error: () => this.auditTrail.set([])
    });
  }

  loadNotifications() {
    const id = this.selectedRfq()?.id;
    if (!id) return;
    this.http.get<any>(`${this.apiUrl}/quotations/${id}/notifications`).subscribe({
      next: (data) => this.vendorNotifications.set(data.notifications || data || []),
      error: () => this.vendorNotifications.set([])
    });
  }

  loadRotationalVendors() {
    let url = `${this.apiUrl}/quotations/rotational-vendors?`;
    if (this.vendorFilterBusinessArea) url += `&businessArea=${encodeURIComponent(this.vendorFilterBusinessArea)}`;
    if (this.vendorFilterSubSector) url += `&subSector=${encodeURIComponent(this.vendorFilterSubSector)}`;
    if (this.vendorFilterProvince) url += `&province=${encodeURIComponent(this.vendorFilterProvince)}`;
    this.http.get<any>(url).subscribe({
      next: (data) => this.rotationalVendors.set(data.vendors || []),
      error: () => this.rotationalVendors.set([])
    });
  }

  navigateTo(view: string) {
    this.currentView.set(view);
    if (view === 'list') this.loadRfqs();
    if (view === 'dashboard') this.loadDashboard();
    if (view === 'analytics') {
      this.analyticsService.getQuotationAnalytics().subscribe(d => {
        this.quotAnalytics.set(d);
        setTimeout(() => this.renderQuotCharts(), 100);
      });
      this.dashboardService.getQuotationAiInsights().subscribe(d => this.aiInsights.set(d.insights || []));
    }
  }

  filterByStatus(status: string) {
    this.filterStatus = status;
    this.currentPage.set(1);
    this.loadRfqs();
    this.currentView.set('list');
  }

  filterByStatusList(status: string) {
    this.filterStatus = status;
    this.currentPage.set(1);
    this.loadRfqs();
  }

  clearFilters() {
    this.filterStatus = '';
    this.searchQuery = '';
    this.filterDepartment = '';
    this.filterBusinessArea = '';
    this.filterSubSector = '';
    this.filterServiceType = '';
    this.filterVoteNumber = '';
    this.filterAssignedBuyer = '';
    this.filterDateFrom = '';
    this.filterDateTo = '';
    this.filterValueMin = null;
    this.filterValueMax = null;
    this.currentPage.set(1);
    this.loadRfqs();
  }

  changePage(page: number) {
    this.currentPage.set(page);
    this.loadRfqs();
  }

  onPageSizeChange() {
    this.pageSize.set(this.pageSizeValue);
    this.currentPage.set(1);
    this.loadRfqs();
  }

  viewRfq(rfq: any) {
    this.loadRfqDetail(rfq.id);
    this.detailTab.set('info');
    this.showAwardPanel.set(false);
    this.showAddQuote.set(false);
    this.currentView.set('detail');
  }

  editRfq(rfq: any) {
    this.editMode.set(true);
    this.loadAvailableRequisitions();
    this.rfqForm = {
      id: rfq.id,
      title: rfq.title || '',
      description: rfq.description || '',
      requisitionRef: rfq.requisitionRef || rfq.requisitionId || '',
      department: rfq.department || '',
      serviceType: rfq.serviceType || '',
      businessArea: rfq.businessArea || '',
      subSector: rfq.subSector || '',
      scoringMethod: rfq.scoringMethod || 'lowest_price',
      estimatedCostAmount: rfq.estimatedCost?.amount || 0,
      voteNumber: rfq.voteNumber || '',
      closingDate: rfq.closingDate || '',
      closingTime: rfq.closingTime || '',
      contactPerson: rfq.contactPerson || '',
      contactEmail: rfq.contactEmail || '',
      contactPhone: rfq.contactPhone || '',
      notes: rfq.notes || ''
    };
    this.formLineItems = (rfq.lineItems || []).map((li: any) => ({
      description: li.description || li.purchaseItem || li.name || '',
      quantity: li.quantity || 1,
      unitOfMeasure: li.unitOfMeasure || 'each',
      estimatedUnitCost: li.estimatedUnitCost?.amount || li.estimatedUnitPrice?.amount || 0,
      unspscCode: li.unspscCode || ''
    }));
    if (this.formLineItems.length === 0) {
      this.formLineItems = [this.getEmptyLineItem()];
    }
    this.routeValidation.set(null);
    this.validateRouteForValue();
    this.currentView.set('capture');
  }

  openCaptureForm() {
    this.editMode.set(false);
    this.rfqForm = {
      title: '', description: '', requisitionRef: '', department: '',
      serviceType: '', businessArea: '', subSector: '', scoringMethod: 'lowest_price',
      estimatedCostAmount: 0, voteNumber: '', closingDate: '', closingTime: '11:00',
      contactPerson: '', contactEmail: '', contactPhone: '', notes: ''
    };
    this.formLineItems = [this.getEmptyLineItem()];
    this.budgetValidationResult.set(null);
    this.routeValidation.set(null);
    this.loadAvailableRequisitions();
    this.currentView.set('capture');
  }

  loadAvailableRequisitions() {
    this.http.get<any>(`${this.apiUrl}/requisitions?pageSize=100`).subscribe({
      next: (res) => {
        const data = res?.data?.items || res?.data || [];
        const all = Array.isArray(data) ? data : [];
        const statusFiltered = all.filter((r: any) =>
          ['final_approved', 'routed'].includes(r.status)
        );
        this.http.get<any>(`${this.apiUrl}/quotations?pageSize=200`).subscribe({
          next: (qRes) => {
            const qData = qRes?.data?.items || qRes?.data || [];
            const qAll = Array.isArray(qData) ? qData : [];
            const usedRefs = new Set(qAll.map((q: any) => q.requisitionRef).filter(Boolean));
            const available = statusFiltered.filter((r: any) => {
              const ref = r.requisitionNumber || r.referenceNumber || '';
              return !usedRefs.has(ref);
            });
            this.availableRequisitions.set(available);
          },
          error: () => this.availableRequisitions.set(statusFiltered)
        });
      }
    });
  }

  private extractAmount(val: any): number {
    if (val == null) return 0;
    if (typeof val === 'number') return val;
    if (typeof val === 'object' && val.amount != null) return Number(val.amount) || 0;
    return Number(val) || 0;
  }

  onRequisitionSelected(reqRef: string) {
    if (!reqRef) return;
    const req = this.availableRequisitions().find((r: any) =>
      r.requisitionNumber === reqRef || r.referenceNumber === reqRef
    );
    if (req) {
      this.rfqForm.requisitionRef = reqRef;
      this.rfqForm.title = req.title || req.description || '';
      this.rfqForm.description = req.description || '';
      this.rfqForm.department = req.department || '';
      if (req.lineItems && req.lineItems.length > 0) {
        this.formLineItems = req.lineItems.map((li: any) => ({
          description: li.description || li.purchaseItem || li.name || '',
          quantity: li.quantity || li.qty || 1,
          unitOfMeasure: li.unitOfMeasure || li.uom || 'each',
          estimatedUnitCost: this.extractAmount(li.estimatedUnitPrice) || this.extractAmount(li.unitPrice) || 0,
          unspscCode: ''
        }));
        let totalCost = 0;
        for (const li of req.lineItems) {
          const qty = li.quantity || li.qty || 1;
          const price = this.extractAmount(li.estimatedUnitPrice) || this.extractAmount(li.unitPrice) || 0;
          const lineTotal = this.extractAmount(li.estimatedTotal) || (qty * price);
          totalCost += lineTotal;
        }
        if (totalCost > 0) {
          this.rfqForm.estimatedCostAmount = totalCost;
        }
      }
      if (!this.rfqForm.estimatedCostAmount && req.estimatedAmount) {
        this.rfqForm.estimatedCostAmount = this.extractAmount(req.estimatedAmount);
      }
      this.validateRouteForValue();
    }
  }

  cancelCapture() {
    if (this.editMode() && this.selectedRfq()) {
      this.currentView.set('detail');
    } else {
      this.navigateTo('list');
    }
  }

  private getEmptyLineItem(): any {
    return { description: '', quantity: 1, unitOfMeasure: 'each', estimatedUnitCost: 0, unspscCode: '' };
  }

  addLineItem() {
    this.formLineItems = [...this.formLineItems, this.getEmptyLineItem()];
  }

  removeLineItem(index: number) {
    if (this.formLineItems.length <= 1) return;
    this.formLineItems = this.formLineItems.filter((_, i) => i !== index);
  }

  getFormTotal(): number {
    return this.formLineItems.reduce((sum, li) => sum + ((li.quantity || 0) * (li.estimatedUnitCost || 0)), 0);
  }

  onVoteChange() {
    this.validateRouteForValue();
    if (this.rfqForm.voteNumber && this.rfqForm.estimatedCostAmount > 0) {
      this.http.post<any>(`${this.apiUrl}/quotations/budget-validate`, {
        voteNumber: this.rfqForm.voteNumber,
        amount: this.rfqForm.estimatedCostAmount
      }).subscribe({
        next: (result) => this.budgetValidationResult.set(result),
        error: () => this.budgetValidationResult.set(null)
      });
    } else {
      this.budgetValidationResult.set(null);
    }
  }

  saveRfq() {
    if (!this.rfqForm.title || !this.rfqForm.department) {
      this.notify('Please fill in Title and Department', 'error');
      return;
    }
    this.saving.set(true);
    const payload = this.buildRfqPayload();

    if (this.editMode() && this.rfqForm.id) {
      const rfqId = this.rfqForm.id;
      this.http.put<any>(`${this.apiUrl}/quotations/${rfqId}`, payload).subscribe({
        next: (res) => {
          this.saving.set(false);
          this.editMode.set(false);
          this.selectedRfq.set(res.data?.rfq || res.data || res);
          this.currentView.set('detail');
          this.detailTab.set('info');
          this.notify('RFQ updated successfully');
          this.loadRfqDetail(String(rfqId));
          this.loadRfqs();
          this.loadDashboard();
        },
        error: (err) => {
          this.saving.set(false);
          this.notify(err.error?.error || 'Failed to update RFQ', 'error');
        }
      });
    } else {
      this.http.post<any>(`${this.apiUrl}/quotations`, payload).subscribe({
        next: (res) => {
          this.saving.set(false);
          this.selectedRfq.set(res.data?.rfq || res.data || res);
          this.currentView.set('detail');
          this.notify('RFQ created successfully');
          this.loadDashboard();
        },
        error: (err) => {
          this.saving.set(false);
          this.notify(err.error?.error || 'Failed to create RFQ', 'error');
        }
      });
    }
  }

  private buildRfqPayload(): any {
    return {
      title: this.rfqForm.title,
      description: this.rfqForm.description,
      requisitionRef: this.rfqForm.requisitionRef || null,
      department: this.rfqForm.department,
      serviceType: this.rfqForm.serviceType || null,
      businessArea: this.rfqForm.businessArea || null,
      subSector: this.rfqForm.subSector || null,
      scoringMethod: this.rfqForm.scoringMethod || 'lowest_price',
      estimatedCost: this.rfqForm.estimatedCostAmount ? { amount: this.rfqForm.estimatedCostAmount, currency: 'ZAR' } : null,
      voteNumber: this.rfqForm.voteNumber || null,
      closingDate: this.rfqForm.closingDate || null,
      closingTime: this.rfqForm.closingTime || null,
      contactPerson: this.rfqForm.contactPerson || null,
      contactEmail: this.rfqForm.contactEmail || null,
      contactPhone: this.rfqForm.contactPhone || null,
      notes: this.rfqForm.notes || '',
      lineItems: this.formLineItems.map((li, i) => ({
        id: `LI-NEW-${i + 1}`,
        lineNumber: i + 1,
        purchaseItem: li.description,
        name: li.description,
        description: li.description,
        quantity: li.quantity,
        unitOfMeasure: li.unitOfMeasure,
        estimatedUnitCost: li.estimatedUnitCost ? { amount: li.estimatedUnitCost, currency: 'ZAR' } : undefined,
        estimatedUnitPrice: li.estimatedUnitCost ? { amount: li.estimatedUnitCost, currency: 'ZAR' } : undefined,
        estimatedTotal: li.estimatedUnitCost ? { amount: li.estimatedUnitCost * (li.quantity || 1), currency: 'ZAR' } : undefined,
        unspscCode: li.unspscCode || undefined
      }))
    };
  }

  submitRfq(id: string) {
    this.saving.set(true);
    this.http.post<any>(`${this.apiUrl}/quotations/${id}/submit`, {}).subscribe({
      next: (res) => {
        this.saving.set(false);
        const rfq = res.data?.rfq || res.rfq || res;
        this.selectedRfq.set(rfq);
        this.notify('RFQ submitted for approval');
        this.loadRfqs();
      },
      error: (err) => {
        this.saving.set(false);
        this.notify(err.error?.error || 'Failed to submit RFQ', 'error');
      }
    });
  }

  publishRfq(id: string) {
    this.vendorSelectRfqId = id;
    this.vendorFilterBusinessArea = '';
    this.vendorFilterSubSector = '';
    this.vendorFilterProvince = '';
    this.selectedVendorIds.set([]);
    this.loadRotationalVendors();
    this.currentView.set('vendor-select');
  }

  cancelVendorSelect() {
    if (this.selectedRfq()) {
      this.currentView.set('detail');
    } else {
      this.navigateTo('list');
    }
  }

  toggleVendorSelection(supplierId: string) {
    const current = this.selectedVendorIds();
    if (current.includes(supplierId)) {
      this.selectedVendorIds.set(current.filter(id => id !== supplierId));
    } else {
      this.selectedVendorIds.set([...current, supplierId]);
    }
  }

  isVendorSelected(supplierId: string): boolean {
    return this.selectedVendorIds().includes(supplierId);
  }

  toggleSelectAllVendors() {
    const vendors = this.rotationalVendors();
    if (this.allVendorsSelected()) {
      this.selectedVendorIds.set([]);
    } else {
      this.selectedVendorIds.set(vendors.map(v => v.supplierId));
    }
  }

  confirmPublishWithVendors() {
    const vendorIds = this.selectedVendorIds();
    if (vendorIds.length === 0) {
      this.notify('Please select at least one vendor', 'error');
      return;
    }
    if (!window.confirm(`Publish RFQ and invite ${vendorIds.length} vendors?`)) return;
    this.saving.set(true);
    const allVendors = this.rotationalVendors();
    const selectedVendors = allVendors.filter(v => vendorIds.includes(v.supplierId));
    this.http.post<any>(`${this.apiUrl}/quotations/${this.vendorSelectRfqId}/publish`, { vendorIds, selectedVendors }).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.selectedRfq.set(res.data?.rfq || res.rfq || res);
        this.currentView.set('detail');
        this.notify(`RFQ published. ${res.data?.vendorsInvited || res.vendorsInvited || vendorIds.length} vendors invited.`);
        this.loadDashboard();
      },
      error: (err) => {
        this.saving.set(false);
        this.notify(err.error?.error || 'Failed to publish RFQ', 'error');
      }
    });
  }

  closeRfq(id: string) {
    if (!window.confirm('Close this RFQ? No more quotes will be accepted.')) return;
    this.http.post<any>(`${this.apiUrl}/quotations/${id}/close`, {}).subscribe({
      next: (res) => {
        this.selectedRfq.set(res.data?.rfq || res.rfq || res);
        this.notify('RFQ closed');
        this.loadDashboard();
        this.loadRfqs();
      },
      error: (err) => this.notify(err.error?.error || 'Failed to close RFQ', 'error')
    });
  }

  evaluateRfq(id: string) {
    if (!window.confirm('Evaluate and adjudicate this RFQ?')) return;
    this.loading.set(true);
    this.http.post<any>(`${this.apiUrl}/quotations/${id}/evaluate`, {}).subscribe({
      next: (res) => {
        this.selectedRfq.set(res.data?.rfq || res.rfq || res);
        this.loading.set(false);
        this.notify('RFQ evaluated successfully');
        this.loadDashboard();
        this.loadRfqs();
      },
      error: (err) => {
        this.loading.set(false);
        this.notify(err.error?.error || 'Failed to evaluate RFQ', 'error');
      }
    });
  }

  awardToQuote(quote: any) {
    this.awardQuoteId = quote.id;
    this.overruleReason = '';
    this.showAwardPanel.set(true);
    this.detailTab.set('adjudication');
  }

  awardRfq() {
    if (!this.awardQuoteId) {
      this.notify('Please select a quote to award', 'error');
      return;
    }
    if (!this.isRecommendedQuoteId(this.awardQuoteId) && !this.overruleReason) {
      this.notify('Overrule reason is mandatory when awarding to a non-recommended vendor', 'error');
      return;
    }
    this.saving.set(true);
    const payload: any = { quoteId: this.awardQuoteId };
    if (this.overruleReason) payload.overruleReason = this.overruleReason;

    this.http.post<any>(`${this.apiUrl}/quotations/${this.selectedRfq()!.id}/award`, payload).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.selectedRfq.set(res.data?.rfq || res.rfq || res);
        this.showAwardPanel.set(false);
        this.notify('RFQ awarded, pending approval');
        this.loadDashboard();
        this.loadRfqs();
      },
      error: (err) => {
        this.saving.set(false);
        this.notify(err.error?.error || 'Failed to award RFQ', 'error');
      }
    });
  }

  approveRfq(id: string) {
    const comments = window.prompt('Approval comments (optional):') || '';
    this.http.post<any>(`${this.apiUrl}/quotations/${id}/approve`, { comments }).subscribe({
      next: (res) => {
        this.selectedRfq.set(res.data?.rfq || res.rfq || res);
        const rfqData = res.data?.rfq || res.rfq;
        this.notify(res.data?.finalApproval || res.finalApproval ? 'RFQ fully approved and awarded' : `Approved at level ${rfqData?.approvalChain?.length || 1}`);
        this.loadDashboard();
        this.loadRfqs();
      },
      error: (err) => this.notify(err.error?.error || 'Failed to approve RFQ', 'error')
    });
  }

  declineRfq(id: string) {
    const reason = window.prompt('Reason for declining:');
    if (!reason) return;
    this.http.post<any>(`${this.apiUrl}/quotations/${id}/decline`, { reason }).subscribe({
      next: (res) => {
        this.selectedRfq.set(res.data?.rfq || res.rfq || res);
        this.notify('RFQ declined');
        this.loadDashboard();
        this.loadRfqs();
      },
      error: (err) => this.notify(err.error?.error || 'Failed to decline RFQ', 'error')
    });
  }

  returnToCapturer(id: string) {
    if (!window.confirm('Return this declined RFQ to the capturer for correction?')) return;
    this.http.post<any>(`${this.apiUrl}/quotations/${id}/return-to-capturer`, {}).subscribe({
      next: (res) => {
        this.selectedRfq.set(res.data?.rfq || res.rfq || res);
        this.notify('RFQ returned to capturer');
        this.loadDashboard();
        this.loadRfqs();
      },
      error: (err) => this.notify(err.error?.error || 'Failed to return RFQ', 'error')
    });
  }

  voidRfq(id: string) {
    this.http.get<any>(`${this.apiUrl}/quotations/${id}/check-linked-orders`).subscribe({
      next: (check) => {
        if (check.hasLinkedOrder) {
          this.notify(`Cannot void: Purchase order ${check.orderNumber || check.orderId} has been generated from this RFQ`, 'error');
          return;
        }
        const reason = window.prompt('Reason for voiding this RFQ:');
        if (!reason) return;
        if (!window.confirm('Are you sure you want to void this RFQ? This action cannot be undone.')) return;
        this.http.post<any>(`${this.apiUrl}/quotations/${id}/void`, { reason, notifyVendors: true }).subscribe({
          next: (res) => {
            this.selectedRfq.set(res.data?.rfq || res.rfq || res);
            this.notify('RFQ voided');
            this.loadDashboard();
            this.loadRfqs();
          },
          error: (err) => this.notify(err.error?.error || 'Failed to void RFQ', 'error')
        });
      },
      error: () => {
        const reason = window.prompt('Reason for voiding this RFQ:');
        if (!reason) return;
        if (!window.confirm('Are you sure you want to void this RFQ? This action cannot be undone.')) return;
        this.http.post<any>(`${this.apiUrl}/quotations/${id}/void`, { reason }).subscribe({
          next: (res) => {
            this.selectedRfq.set(res.data?.rfq || res.rfq || res);
            this.notify('RFQ voided');
            this.loadDashboard();
            this.loadRfqs();
          },
          error: (err) => this.notify(err.error?.error || 'Failed to void RFQ', 'error')
        });
      }
    });
  }

  addQuote() {
    if (!this.quoteForm.supplierName) {
      this.notify('Please select a supplier from the vendor list', 'error');
      return;
    }

    const existingQuotes = this.selectedRfq()?.quotes || [];
    const duplicate = existingQuotes.find((q: any) => {
      if (this.quoteForm.supplierId && q.vendorId) {
        return String(q.vendorId).toLowerCase() === String(this.quoteForm.supplierId).toLowerCase();
      }
      const existingName = (q.vendorName || q.supplierName || '').toLowerCase();
      return existingName === this.quoteForm.supplierName.toLowerCase();
    });
    if (duplicate) {
      this.notify(`A quote from '${this.quoteForm.supplierName}' already exists on this RFQ`, 'error');
      return;
    }

    this.saving.set(true);
    const totalExcl = this.getQuoteFormTotal();
    const payload = {
      vendorId: this.quoteForm.supplierId || '',
      vendorName: this.quoteForm.supplierName,
      supplierName: this.quoteForm.supplierName,
      bbbeeLevel: this.quoteForm.bbbeeLevel,
      bbbeePoints: this.getBbbeePoints(this.quoteForm.bbbeeLevel),
      deliveryDays: this.quoteForm.deliveryDays || 14,
      lineItems: this.quoteForm.lineItems.map((ql: any) => ({
        lineRef: ql.lineRef,
        description: ql.description,
        quantity: ql.quantity || 1,
        unitOfMeasure: ql.unitOfMeasure || 'each',
        unitPrice: { amount: ql.unitPrice || 0, currency: 'ZAR' },
        total: { amount: (ql.unitPrice || 0) * (ql.quantity || 1), currency: 'ZAR' }
      })),
      totalExclVat: { amount: totalExcl, currency: 'ZAR' },
      totalInclVat: { amount: totalExcl * 1.15, currency: 'ZAR' },
      priceScore: null,
      totalScore: null
    };

    this.http.post<any>(`${this.apiUrl}/quotations/${this.selectedRfq()!.id}/quotes`, payload).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.selectedRfq.set(res.data?.rfq || res.rfq || res);
        this.showAddQuote.set(false);
        this.notify('Quote added successfully');
      },
      error: (err) => {
        this.saving.set(false);
        this.notify(err.error?.error || 'Failed to add quote', 'error');
      }
    });
  }

  updateQuoteStatus(quoteId: string, complianceStatus: string) {
    let nonComplianceReason = '';
    if (complianceStatus === 'non_compliant') {
      nonComplianceReason = window.prompt('Non-compliance reason:') || '';
      if (!nonComplianceReason) return;
    }
    this.http.put<any>(`${this.apiUrl}/quotations/${this.selectedRfq()!.id}/quotes/${quoteId}/status`, {
      complianceStatus,
      nonComplianceReason
    }).subscribe({
      next: () => {
        this.loadRfqDetail(this.selectedRfq()!.id);
        this.notify(`Quote marked as ${complianceStatus}`);
      },
      error: (err) => this.notify(err.error?.error || 'Failed to update quote', 'error')
    });
  }

  submitThreeQuoteJustification() {
    const justification = window.prompt('Justification for fewer than 3 quotes (per SCM Regulation):');
    if (!justification) return;
    this.http.post<any>(`${this.apiUrl}/quotations/${this.selectedRfq()!.id}/three-quote-justification`, { justification }).subscribe({
      next: (res) => {
        this.selectedRfq.set(res.data?.rfq || res.rfq || res);
        this.notify('Three-quote justification recorded');
      },
      error: (err) => this.notify(err.error?.error || 'Failed to save justification', 'error')
    });
  }

  loadRegisteredVendors() {
    const rfq = this.selectedRfq();
    if (rfq?.invitedVendors?.length) {
      this.registeredVendors.set(rfq.invitedVendors);
      return;
    }
    this.http.get<any>(`${this.apiUrl}/quotations/registered-vendors`).subscribe({
      next: (data) => this.registeredVendors.set(data?.vendors || []),
      error: () => this.registeredVendors.set([])
    });
  }

  onVendorSelected(vendorId: string) {
    const vendor = this.registeredVendors().find((v: any) => (v.supplierId || v.id) === vendorId);
    if (!vendor) return;
    this.quoteForm.supplierName = vendor.supplierName || vendor.name || '';
    this.quoteForm.supplierId = vendor.supplierId || vendor.id || '';
    this.quoteForm.bbbeeLevel = vendor.bbbeeLevel || 1;
  }

  initQuoteForm() {
    const rfq = this.selectedRfq();
    if (!rfq) return;
    this.quoteForm = {
      supplierName: '',
      supplierId: '',
      bbbeeLevel: 1,
      deliveryDays: 14,
      lineItems: (rfq.lineItems || []).map((li: any, idx: number) => ({
        lineRef: li.id || `LI-${idx + 1}`,
        description: li.description || li.purchaseItem || li.name || '',
        quantity: li.quantity || 1,
        unitOfMeasure: li.unitOfMeasure || 'each',
        unitPrice: 0
      }))
    };
    this.loadRegisteredVendors();
    this.showAddQuote.set(true);
  }

  getQuoteFormTotal(): number {
    return (this.quoteForm.lineItems || []).reduce((sum: number, ql: any) =>
      sum + ((ql.unitPrice || 0) * (ql.quantity || 1)), 0);
  }

  loadReport(type: string) {
    this.loading.set(true);
    let url = '';
    if (type === 'list') {
      url = `${this.apiUrl}/quotations/reports/list?`;
    } else if (type === 'exception') {
      url = `${this.apiUrl}/quotations/reports/exception?`;
    } else {
      url = `${this.apiUrl}/quotations/reports/register?`;
    }
    if (this.reportFilterDateFrom) url += `&dateFrom=${encodeURIComponent(this.reportFilterDateFrom)}`;
    if (this.reportFilterDateTo) url += `&dateTo=${encodeURIComponent(this.reportFilterDateTo)}`;
    if (this.reportFilterStatus) url += `&status=${encodeURIComponent(this.reportFilterStatus)}`;
    if (this.reportFilterDepartment) url += `&department=${encodeURIComponent(this.reportFilterDepartment)}`;
    this.http.get<any>(url).subscribe({
      next: (data) => {
        this.reportData.set(data);
        this.loading.set(false);
      },
      error: () => { this.reportData.set(null); this.loading.set(false); this.notify('Failed to load report', 'error'); }
    });
  }

  printReport() {
    window.print();
  }

  loadBuyersList() {
    this.http.get<any>(`${this.apiUrl}/quotations/buyers`).subscribe({
      next: (data) => this.buyersList.set(data || []),
      error: () => this.buyersList.set([])
    });
  }

  loadDocuments() {
    const id = this.selectedRfq()?.id;
    if (!id) return;
    this.http.get<any>(`${this.apiUrl}/quotations/${id}/documents`).subscribe({
      next: (data) => this.rfqDocuments.set(data.documents || []),
      error: () => this.rfqDocuments.set([])
    });
  }

  loadBudgetCheck() {
    const id = this.selectedRfq()?.id;
    if (!id) return;
    this.http.get<any>(`${this.apiUrl}/quotations/${id}/budget-check`).subscribe({
      next: (data) => this.budgetCheckResult.set(data),
      error: () => this.budgetCheckResult.set(null)
    });
  }

  uploadDocument() {
    if (!this.docForm.name) {
      this.notify('Please enter a document name', 'error');
      return;
    }
    this.saving.set(true);
    this.http.post<any>(`${this.apiUrl}/quotations/${this.selectedRfq()!.id}/documents`, {
      name: this.docForm.name,
      type: this.docForm.type,
      description: this.docForm.description
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.showDocUpload.set(false);
        this.docForm = { name: '', type: 'correspondence', description: '' };
        this.loadDocuments();
        this.notify('Document uploaded');
      },
      error: (err) => {
        this.saving.set(false);
        this.notify(err.error?.error || 'Failed to upload document', 'error');
      }
    });
  }

  deleteDocument(docId: string) {
    if (!window.confirm('Remove this document?')) return;
    this.http.delete<any>(`${this.apiUrl}/quotations/${this.selectedRfq()!.id}/documents/${docId}`).subscribe({
      next: () => {
        this.loadDocuments();
        this.notify('Document removed');
      },
      error: (err) => this.notify(err.error?.error || 'Failed to remove document', 'error')
    });
  }

  openAssignBuyer() {
    this.selectedBuyerId = '';
    this.showBuyerDialog.set(true);
  }

  confirmAssignBuyer() {
    const user = this.scmUsers().find(u => u.id === this.selectedBuyerId);
    if (!user) { this.notify('Please select a buyer', 'error'); return; }
    this.http.post<any>(`${this.apiUrl}/quotations/${this.selectedRfq()!.id}/assign-buyer`, {
      buyerId: user.id,
      buyerName: user.name
    }).subscribe({
      next: (res) => {
        this.selectedRfq.set(res.data?.rfq || res.rfq || res);
        this.showBuyerDialog.set(false);
        this.notify(`Buyer "${user.name}" assigned`);
        this.loadBuyersList();
      },
      error: (err) => this.notify(err.error?.error || 'Failed to assign buyer', 'error')
    });
  }

  loadScmUsers() {
    this.http.get<any[]>(`${this.apiUrl}/quotations/scm-users`).subscribe({
      next: (data) => this.scmUsers.set(data || []),
      error: () => this.scmUsers.set([])
    });
  }

  getStepState(stepIndex: number): string {
    const rfq = this.selectedRfq();
    if (!rfq) return 'pending';
    const status = rfq.status;
    if (status === 'voided' || status === 'declined') return 'voided';
    const statusOrder: Record<string, number> = {
      'draft': rfq.assignedBuyer || rfq.assignedBuyerName ? 2 : 1,
      'buyer_assigned': 2,
      'submitted': 3,
      'published': 3,
      'closed': 4,
      'evaluated': 5,
      'pending_approval': 6,
      'awarded': 6,
      'approved': 7
    };
    const activeStep = statusOrder[status] || 1;
    if (stepIndex < activeStep) return 'completed';
    if (stepIndex === activeStep) return 'active';
    return 'pending';
  }

  getNextActionMessage(): string {
    const rfq = this.selectedRfq();
    if (!rfq) return '';
    const status = rfq.status;
    if (status === 'voided') return 'This RFQ has been voided.';
    if (status === 'declined') return 'This RFQ has been declined.';
    if (status === 'draft') {
      if (!rfq.assignedBuyer && !rfq.assignedBuyerName) return 'Assign a buyer to this RFQ before publishing';
      if (!rfq.closingDate) return 'Set a closing date and add line items, then publish';
      return 'Ready to publish — select vendors to invite';
    }
    if (status === 'buyer_assigned') return 'Buyer assigned — submit for approval or publish directly to vendors';
    if (status === 'approved') return 'RFQ approved — publish to vendors for competitive quotes, or close for direct award (add quotes manually)';
    if (status === 'submitted') return 'RFQ submitted for approval — awaiting supervisor review';
    if (status === 'published') return 'Waiting for vendor quotes. Close the RFQ when the closing date passes.';
    if (status === 'closed') return 'Ready for evaluation — click Evaluate to score received quotes';
    if (status === 'evaluated') return 'Ready for award — select the winning quotation';
    if (status === 'pending_approval') return 'Awaiting approval from the Approving Officer';
    if (status === 'awarded') return 'RFQ has been awarded. A Purchase Order can now be created.';
    if (status === 'approved') return 'RFQ complete — Purchase Order has been approved.';
    return '';
  }

  updateVendorStatus(vendorId: string, status: string) {
    let reason = '';
    if (status === 'non_compliant') {
      reason = window.prompt('Reason for non-compliance:') || '';
      if (!reason) return;
    }
    this.http.put<any>(`${this.apiUrl}/quotations/${this.selectedRfq()!.id}/vendor-status`, {
      vendorId, status, reason
    }).subscribe({
      next: (res) => {
        this.selectedRfq.set(res.data?.rfq || res.rfq || res);
        this.notify(`Vendor status updated to ${status}`);
      },
      error: (err) => this.notify(err.error?.error || 'Failed to update vendor status', 'error')
    });
  }

  getCompliantQuoteCount(rfq: any): number {
    if (!rfq?.quotes) return 0;
    return rfq.quotes.filter((q: any) => q.complianceStatus !== 'non_compliant' && q.responseStatus !== 'no_response').length;
  }

  getDocTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      rfq_document: 'RFQ Document', specification: 'Specification',
      vendor_response: 'Vendor Response', evaluation_report: 'Evaluation Report',
      award_letter: 'Award Letter', correspondence: 'Correspondence'
    };
    return labels[type] || type;
  }

  getReportSummaryKeys(): string[] {
    const summary = this.reportData()?.summary;
    if (!summary) return [];
    return Object.keys(summary);
  }

  getReportColumns(): string[] {
    const data = this.reportData()?.data;
    if (!data || data.length === 0) return [];
    return Object.keys(data[0]);
  }

  formatReportValue(val: any): string {
    if (val && typeof val === 'object' && val.amount !== undefined) {
      return this.formatCurrency(val.amount);
    }
    return String(val ?? '');
  }

  formatReportCell(row: any, col: string): string {
    const val = row[col];
    if (val && typeof val === 'object' && val.amount !== undefined) {
      return this.formatCurrency(val.amount);
    }
    return val ?? '—';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      draft: 'Draft', buyer_assigned: 'Buyer Assigned', submitted: 'Submitted',
      published: 'Published', closed: 'Closed',
      evaluated: 'Evaluated', pending_approval: 'Pending Approval',
      awarded: 'Awarded', approved: 'Approved', declined: 'Declined', voided: 'Voided'
    };
    return labels[status] || status;
  }

  getQuoteStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      received: 'Received', evaluated: 'Evaluated', awarded: 'Awarded',
      unsuccessful: 'Unsuccessful', no_response: 'No Response'
    };
    return labels[status] || status;
  }

  getScoringLabel(method: string): string {
    const labels: Record<string, string> = {
      lowest_price: 'Lowest Price', '80_20': '80/20 Preference', '90_10': '90/10 Preference'
    };
    return labels[method] || method || '—';
  }

  getBbbeePoints(level: number): number {
    const points: Record<number, number> = { 1: 20, 2: 18, 3: 14, 4: 12, 5: 8, 6: 6, 7: 4, 8: 2 };
    return points[level] || 0;
  }

  isRecommended(quote: any): boolean {
    return this.selectedRfq()?.adjudicationReport?.recommendedSupplierId === quote.supplierId;
  }

  isRecommendedQuoteId(quoteId: string): boolean {
    const rfq = this.selectedRfq();
    if (!rfq?.adjudicationReport) return true;
    const quote = rfq.quotes?.find((q: any) => q.id === quoteId);
    return quote?.supplierId === rfq.adjudicationReport.recommendedSupplierId;
  }

  getCompliantQuotes(): any[] {
    const rfq = this.selectedRfq();
    if (!rfq?.quotes) return [];
    return rfq.quotes.filter((q: any) => q.complianceStatus !== 'non_compliant' && q.responseStatus !== 'no_response');
  }

  getSortedScores(): any[] {
    const scores = this.selectedRfq()?.adjudicationReport?.scores || [];
    return [...scores].sort((a: any, b: any) => (b.totalScore || 0) - (a.totalScore || 0));
  }

  getAuditDotClass(action: string): string {
    const lower = action.toLowerCase();
    if (lower.includes('approved')) return 'dot-approval';
    if (lower.includes('declined') || lower.includes('rejected')) return 'dot-rejection';
    if (lower.includes('voided')) return 'dot-void';
    if (lower.includes('published')) return 'dot-publish';
    if (lower.includes('system') || lower.includes('budget')) return 'dot-system';
    return 'dot-action';
  }

  formatCurrency(amount: number): string {
    if (amount >= 1000000) return 'R' + (amount / 1000000).toFixed(2) + 'M';
    if (amount >= 1000) return 'R' + (amount / 1000).toFixed(1) + 'K';
    return 'R' + amount.toFixed(2);
  }

  formatCurrencyFull(amount: number): string {
    return 'R ' + amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-ZA');
  }

  formatDateTime(dateStr: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' });
  }

  notify(msg: string, type: string = 'success') {
    this.notificationType.set(type);
    this.notification.set(msg);
    setTimeout(() => this.notification.set(''), 5000);
  }
}
