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
  selector: 'app-orders',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatCardModule, MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatDatepickerModule, MatNativeDateModule, MatSelectModule, MatMenuModule, MatTooltipModule, MatTabsModule, MatChipsModule, MatBadgeModule, MatCheckboxModule, MatSlideToggleModule, MatProgressBarModule],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss'
})
export class OrdersComponent implements OnInit {
  private http = inject(HttpClient);
  private dashboardService = inject(DashboardService);
  private analyticsService = inject(AnalyticsService);
  private apiUrl = environment.apiUrl;

  orderAnalyticsData = signal<any>(null);
  currentView = signal<string>('dashboard');
  orders = signal<any[]>([]);
  selectedOrder = signal<any>(null);
  orderAiInsights = signal<any[]>([]);
  summary = signal<any>({});
  pipeline = signal<any>({});
  budgetOverview = signal<any>({});
  slaPerformance = signal<any>({});
  aging = signal<any>({});
  topSuppliers = signal<any[]>([]);
  departmentSpend = signal<any[]>([]);
  monthlyTrend = signal<any[]>([]);
  aiInsights = signal<any[]>([]);
  cessions = signal<any[]>([]);
  selectedCession = signal<any>(null);
  cessionTypes = signal<any[]>([]);
  notification = signal<string>('');
  loading = signal(false);
  totalPages = signal(1);
  totalOrders = signal(0);
  currentPage = signal(1);
  pageSize = signal(20);
  pageSizeValue = 20;
  filterStatus = '';
  searchQuery = '';
  showFilters = signal(false);
  showAdvanced = signal(false);
  selectedOrders = signal<string[]>([]);
  reportData = signal<any>(null);
  reportType = signal<string>('');
  editMode = signal(false);
  detailTab = signal<string>('info');
  budgetHistory = signal<any[]>([]);
  correspondence = signal<any[]>([]);
  saving = signal(false);
  financialYears = signal<string[]>([]);
  showCessionForm = signal(false);

  filterDepartment = '';
  filterReferenceType = '';
  filterFinancialYear = '';
  filterSupplier = '';
  filterQuotation = '';
  filterContract = '';
  filterRequisition = '';

  cessionFilterOrder = '';
  cessionFilterType = '';
  cessionFilterCedant = '';

  departments = [
    'Infrastructure and Engineering', 'Water & Sanitation', 'Corporate Services',
    'Community Services', 'Finance', 'Planning & Development', 'Electricity', 'Public Safety'
  ];

  orderForm: any = {};
  formLineItems: any[] = [];
  awardedTenders = signal<any[]>([]);
  loadingTenders = signal(false);

  reportFilters: any = { orderNumber: '', vendorName: '', quotationNumber: '', contractNumber: '', status: '', dateFrom: '', dateTo: '' };
  paymentReportFilters: any = { orderNumber: '', vendorName: '', contractNumber: '', requestType: '' };

  cessionForm: any = {};

  pageStart = computed(() => {
    const total = this.totalOrders();
    if (total === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize() + 1;
  });

  pageEnd = computed(() => {
    return Math.min(this.currentPage() * this.pageSize(), this.totalOrders());
  });

  allSelected = computed(() => {
    const ords = this.orders();
    const sel = this.selectedOrders();
    return ords.length > 0 && ords.every(o => sel.includes(o.id));
  });

  ngOnInit() {
    this.loadDashboard();
    this.loadFinancialYears();
    this.loadCessionTypes();
    this.dashboardService.getOrderAiInsights().subscribe({
      next: (d: any) => { const r = d?.insights || d?.data; this.orderAiInsights.set(Array.isArray(r) ? r : []); },
      error: () => this.orderAiInsights.set([])
    });
  }

  loadDashboard() {
    this.http.get<any>(`${this.apiUrl}/orders/dashboard/summary`).subscribe({
      next: (data) => this.summary.set(data),
      error: () => this.summary.set({})
    });
    this.http.get<any>(`${this.apiUrl}/orders/dashboard/pipeline`).subscribe({
      next: (data) => this.pipeline.set(data),
      error: () => this.pipeline.set({})
    });
    this.http.get<any>(`${this.apiUrl}/orders/dashboard/budget-overview`).subscribe({
      next: (data) => this.budgetOverview.set(data),
      error: () => this.budgetOverview.set({})
    });
    this.http.get<any>(`${this.apiUrl}/orders/dashboard/sla-performance`).subscribe({
      next: (data) => this.slaPerformance.set(data),
      error: () => this.slaPerformance.set({})
    });
    this.http.get<any>(`${this.apiUrl}/orders/dashboard/aging`).subscribe({
      next: (data) => this.aging.set(data),
      error: () => this.aging.set({})
    });
    this.http.get<any>(`${this.apiUrl}/orders/dashboard/top-suppliers`).subscribe({
      next: (data) => { const r = data?.suppliers || data?.data; this.topSuppliers.set(Array.isArray(r) ? r : []); },
      error: () => this.topSuppliers.set([])
    });
    this.http.get<any>(`${this.apiUrl}/orders/dashboard/department-spend`).subscribe({
      next: (data) => { const r = data?.departments || data?.data; this.departmentSpend.set(Array.isArray(r) ? r : []); },
      error: () => this.departmentSpend.set([])
    });
    this.http.get<any>(`${this.apiUrl}/orders/dashboard/monthly-trend`).subscribe({
      next: (data) => { const r = data?.months || data?.data; this.monthlyTrend.set(Array.isArray(r) ? r : []); },
      error: () => this.monthlyTrend.set([])
    });
    this.http.get<any>(`${this.apiUrl}/orders/dashboard/ai-insights`).subscribe({
      next: (data) => { const r = data?.insights || data?.data; this.aiInsights.set(Array.isArray(r) ? r : []); },
      error: () => this.aiInsights.set([])
    });
  }

  private renderOrderCharts(): void {
    if (!this.orderAnalyticsData()) return;
    setTimeout(() => {
      const data = this.orderAnalyticsData();

      const spendCtx = document.getElementById('spendByMethodChart') as HTMLCanvasElement;
      if (spendCtx) {
        new Chart(spendCtx, {
          type: 'doughnut',
          data: {
            labels: data.spendByMethod.labels,
            datasets: [{ data: data.spendByMethod.data, backgroundColor: data.spendByMethod.colors, borderWidth: 2, borderColor: '#fff' }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'right', labels: { font: { size: 10 }, usePointStyle: true, padding: 8 } } },
            cutout: '55%'
          }
        });
      }

      const pipeCtx = document.getElementById('orderPipelineChart') as HTMLCanvasElement;
      if (pipeCtx) {
        new Chart(pipeCtx, {
          type: 'bar',
          data: {
            labels: data.conversionPipeline.stages.map((s: any) => s.stage),
            datasets: [{
              label: 'Count',
              data: data.conversionPipeline.stages.map((s: any) => s.count),
              backgroundColor: ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981'],
              borderRadius: 6
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              y: { ticks: { font: { size: 10 } }, grid: { color: '#f1f5f9' } },
              x: { ticks: { font: { size: 10 } }, grid: { display: false } }
            }
          }
        });
      }
    }, 100);
  }

  loadOrders() {
    this.loading.set(true);
    let url = `${this.apiUrl}/orders?page=${this.currentPage()}&pageSize=${this.pageSize()}`;
    if (this.filterStatus) url += `&status=${this.filterStatus}`;
    if (this.searchQuery) url += `&search=${encodeURIComponent(this.searchQuery)}`;
    if (this.filterDepartment) url += `&department=${encodeURIComponent(this.filterDepartment)}`;
    if (this.filterReferenceType) url += `&referenceType=${this.filterReferenceType}`;
    if (this.filterFinancialYear) url += `&financialYear=${encodeURIComponent(this.filterFinancialYear)}`;
    if (this.filterSupplier) url += `&supplierName=${encodeURIComponent(this.filterSupplier)}`;
    if (this.filterQuotation) url += `&quotationNumber=${encodeURIComponent(this.filterQuotation)}`;
    if (this.filterContract) url += `&contractNumber=${encodeURIComponent(this.filterContract)}`;
    if (this.filterRequisition) url += `&requisitionNumber=${encodeURIComponent(this.filterRequisition)}`;

    this.http.get<any>(url).subscribe({
      next: (res) => {
        this.orders.set(Array.isArray(res?.data) ? res.data : []);
        this.totalOrders.set(res.total || 0);
        this.totalPages.set(res.totalPages || 1);
        this.loading.set(false);
      },
      error: () => { this.orders.set([]); this.loading.set(false); }
    });
  }

  loadOrderDetail(id: string) {
    this.loading.set(true);
    this.http.get<any>(`${this.apiUrl}/orders/${id}`).subscribe({
      next: (res) => {
        const order = res?.data || res;
        this.selectedOrder.set(order);
        this.loading.set(false);
        this.loadBudgetHistory(id);
      },
      error: () => { this.loading.set(false); this.notify('Failed to load order details'); }
    });
  }

  loadBudgetHistory(id: string) {
    this.http.get<any>(`${this.apiUrl}/orders/${id}/budget-history`).subscribe({
      next: (data) => { const r = data?.history || data?.data; this.budgetHistory.set(Array.isArray(r) ? r : []); },
      error: () => this.budgetHistory.set([])
    });
  }

  loadCorrespondence() {
    const id = this.selectedOrder()?.id;
    if (!id) return;
    this.http.get<any>(`${this.apiUrl}/orders/${id}/correspondence`).subscribe({
      next: (data) => { const r = data?.correspondence || data?.data; this.correspondence.set(Array.isArray(r) ? r : []); },
      error: () => this.correspondence.set([])
    });
  }

  loadFinancialYears() {
    this.http.get<any>(`${this.apiUrl}/orders/financial-years`).subscribe({
      next: (data) => { const r = data?.years || data?.data; this.financialYears.set(Array.isArray(r) ? r : ['2024/2025', '2025/2026', '2026/2027']); },
      error: () => this.financialYears.set(['2024/2025', '2025/2026', '2026/2027'])
    });
  }

  loadCessionTypes() {
    this.http.get<any>(`${this.apiUrl}/orders/cession-types`).subscribe({
      next: (data) => { const r = data?.types || data?.data; this.cessionTypes.set(Array.isArray(r) ? r : []); },
      error: () => this.cessionTypes.set([])
    });
  }

  viewOrder(order: any) {
    this.loadOrderDetail(order.id);
    this.detailTab.set('info');
    this.currentView.set('detail');
  }

  editOrder(order: any) {
    this.editMode.set(true);
    this.orderForm = {
      id: order.id,
      supplierName: order.supplier?.name || '',
      department: order.department || '',
      costCentre: order.costCentre || '',
      referenceType: order.referenceType || '',
      referenceNumber: order.referenceNumber || '',
      contractNumber: order.contractNumber || '',
      financialYear: order.financialYear || '',
      paymentTerms: order.paymentTerms || '',
      deliveryTerms: order.deliveryTerms || '',
      deliveryAddress: order.deliveryAddress || '',
      specialInstructions: order.specialInstructions || '',
      contactPerson: order.contactPerson || '',
      contactTelephone: order.contactTelephone || '',
      contactEmail: order.contactEmail || '',
      isPartial: order.partialOrder?.isPartial || false
    };
    this.formLineItems = (order.lineItems || []).map((li: any) => ({
      description: li.description || li.name || li.purchaseItem || '',
      unspscCode: li.unspscCode || '',
      quantity: li.quantity || 1,
      unitOfMeasure: li.unitOfMeasure || 'each',
      unitPrice: li.unitPrice?.amount ?? li.estimatedUnitPrice?.amount ?? 0,
      vatRate: li.vatRate || 15,
      mscoaSegment: li.mscoaSegment?.fund || ''
    }));
    if (this.formLineItems.length === 0) {
      this.formLineItems = [this.getEmptyLineItem()];
    }
    this.currentView.set('capture');
  }

  openCaptureForm(prefillFromTender?: any) {
    this.editMode.set(false);
    this.orderForm = {
      supplierName: '', department: '', costCentre: '', referenceType: 'quotation',
      referenceNumber: '', contractNumber: '', financialYear: '', paymentTerms: '30 days',
      deliveryTerms: 'Ex Works', deliveryAddress: '', specialInstructions: '',
      contactPerson: '', contactTelephone: '', contactEmail: '', isPartial: false
    };
    this.formLineItems = [this.getEmptyLineItem()];
    if (prefillFromTender) {
      this.orderForm.referenceType = 'tender';
      this.orderForm.referenceNumber = prefillFromTender.referenceNumber || '';
      this.orderForm.supplierName = prefillFromTender.supplierName || '';
      this.orderForm.department = prefillFromTender.department || '';
      if (prefillFromTender.lineItems?.length) {
        this.formLineItems = prefillFromTender.lineItems.map((li: any) => ({
          description: li.description || '', unspscCode: li.unspscCode || '', quantity: li.quantity || 1,
          unitOfMeasure: li.unit || li.unitOfMeasure || 'each', unitPrice: li.unitPrice?.amount || li.unitPrice || 0,
          vatRate: 15, mscoaSegment: li.mScoaCode || ''
        }));
      }
      this.loadAwardedTenders();
    }
    this.currentView.set('capture');
  }

  loadAwardedTenders() {
    this.loadingTenders.set(true);
    this.http.get<any>(`${this.apiUrl}/tenders?status=awarded,contract_active&limit=100`).subscribe({
      next: (res) => {
        const tenders = res.tenders || res.data || res || [];
        this.awardedTenders.set(Array.isArray(tenders) ? tenders : []);
        this.loadingTenders.set(false);
      },
      error: () => {
        this.awardedTenders.set([]);
        this.loadingTenders.set(false);
      }
    });
  }

  onReferenceTypeChange(type: string) {
    if (type === 'tender') {
      this.loadAwardedTenders();
    }
    this.orderForm.referenceNumber = '';
  }

  onTenderSelected(refNumber: string) {
    const tender = this.awardedTenders().find(t => t.referenceNumber === refNumber);
    if (!tender) return;
    const awardedBidder = tender.bidders?.find((b: any) => b.status === 'awarded');
    if (awardedBidder) {
      this.orderForm.supplierName = awardedBidder.supplierName || '';
    }
    this.orderForm.department = tender.department || this.orderForm.department;
    this.orderForm.contractNumber = tender.linkedContract || '';
    const boqItems = tender.boqItems || [];
    if (boqItems.length > 0) {
      this.formLineItems = boqItems.map((item: any) => ({
        description: item.description || '', unspscCode: item.unspscCode || '',
        quantity: item.quantity || 1, unitOfMeasure: item.unit || 'each',
        unitPrice: item.unitPrice || (awardedBidder?.bidAmount?.amount || 0), vatRate: 15, mscoaSegment: item.mScoaCode || ''
      }));
    } else if (awardedBidder) {
      this.formLineItems = [{
        description: tender.title || 'Tender award', unspscCode: '', quantity: 1,
        unitOfMeasure: 'service', unitPrice: awardedBidder.bidAmount?.amount || 0, vatRate: 15, mscoaSegment: ''
      }];
    }
  }

  cancelCapture() {
    if (this.editMode() && this.selectedOrder()) {
      this.currentView.set('detail');
    } else {
      this.navigateTo('list');
    }
  }

  private getEmptyLineItem(): any {
    return { description: '', unspscCode: '', quantity: 1, unitOfMeasure: 'each', unitPrice: 0, vatRate: 15, mscoaSegment: '' };
  }

  addLineItem() {
    this.formLineItems = [...this.formLineItems, this.getEmptyLineItem()];
  }

  removeLineItem(index: number) {
    if (this.formLineItems.length <= 1) return;
    this.formLineItems = this.formLineItems.filter((_, i) => i !== index);
  }

  getFormSubtotal(): number {
    return this.formLineItems.reduce((sum, li) => sum + ((li.quantity || 0) * (li.unitPrice || 0)), 0);
  }

  getFormVat(): number {
    return this.formLineItems.reduce((sum, li) => {
      const lineTotal = (li.quantity || 0) * (li.unitPrice || 0);
      return sum + (lineTotal * ((li.vatRate || 0) / 100));
    }, 0);
  }

  getFormTotal(): number {
    return this.getFormSubtotal() + this.getFormVat();
  }

  private buildOrderPayload(): any {
    return {
      supplier: { name: this.orderForm.supplierName },
      department: this.orderForm.department,
      costCentre: this.orderForm.costCentre,
      referenceType: this.orderForm.referenceType,
      referenceNumber: this.orderForm.referenceNumber,
      contractNumber: this.orderForm.contractNumber,
      financialYear: this.orderForm.financialYear,
      paymentTerms: this.orderForm.paymentTerms,
      deliveryTerms: this.orderForm.deliveryTerms,
      deliveryAddress: this.orderForm.deliveryAddress,
      specialInstructions: this.orderForm.specialInstructions,
      contactPerson: this.orderForm.contactPerson,
      contactTelephone: this.orderForm.contactTelephone,
      contactEmail: this.orderForm.contactEmail,
      isPartial: this.orderForm.isPartial,
      lineItems: this.formLineItems.map(li => ({
        description: li.description,
        unspscCode: li.unspscCode,
        quantity: li.quantity,
        unitOfMeasure: li.unitOfMeasure,
        unitPrice: { amount: li.unitPrice, currency: 'ZAR' },
        totalPrice: { amount: (li.quantity || 0) * (li.unitPrice || 0), currency: 'ZAR' },
        vatRate: li.vatRate,
        vatAmount: { amount: ((li.quantity || 0) * (li.unitPrice || 0)) * ((li.vatRate || 0) / 100), currency: 'ZAR' },
        mscoaSegment: li.mscoaSegment ? { fund: li.mscoaSegment } : null
      }))
    };
  }

  saveOrder() {
    if (!this.orderForm.supplierName || !this.orderForm.department) {
      this.notify('Please fill in Supplier Name and Department');
      return;
    }
    this.saving.set(true);
    const payload = this.buildOrderPayload();

    if (this.editMode() && this.orderForm.id) {
      this.http.put<any>(`${this.apiUrl}/orders/${this.orderForm.id}`, payload).subscribe({
        next: (res) => {
          this.saving.set(false);
          this.selectedOrder.set(this.unwrapOrderResponse(res));
          this.currentView.set('detail');
          this.notify('Order updated successfully');
          this.loadDashboard();
        },
        error: (err) => {
          this.saving.set(false);
          this.notify(err.error?.error || 'Failed to update order');
        }
      });
    } else {
      this.http.post<any>(`${this.apiUrl}/orders`, payload).subscribe({
        next: (res) => {
          this.saving.set(false);
          this.selectedOrder.set(this.unwrapOrderResponse(res));
          this.currentView.set('detail');
          this.notify('Order created successfully');
          this.loadDashboard();
        },
        error: (err) => {
          this.saving.set(false);
          this.notify(err.error?.error || 'Failed to create order');
        }
      });
    }
  }

  saveAndSubmit() {
    if (!this.orderForm.supplierName || !this.orderForm.department) {
      this.notify('Please fill in Supplier Name and Department');
      return;
    }
    this.saving.set(true);
    const payload = this.buildOrderPayload();

    const saveObs = this.editMode() && this.orderForm.id
      ? this.http.put<any>(`${this.apiUrl}/orders/${this.orderForm.id}`, payload)
      : this.http.post<any>(`${this.apiUrl}/orders`, payload);

    saveObs.subscribe({
      next: (savedRes) => {
        const saved = this.unwrapOrderResponse(savedRes);
        const id = saved.id;
        this.http.post<any>(`${this.apiUrl}/orders/${id}/submit`, {}).subscribe({
          next: (res) => {
            this.saving.set(false);
            this.selectedOrder.set(this.unwrapOrderResponse(res));
            this.currentView.set('detail');
            this.notify('Order saved and submitted for approval');
            this.loadDashboard();
          },
          error: (err) => {
            this.saving.set(false);
            this.selectedOrder.set(saved);
            this.currentView.set('detail');
            this.notify(err.error?.error || 'Saved but could not submit');
          }
        });
      },
      error: (err) => {
        this.saving.set(false);
        this.notify(err.error?.error || 'Failed to save order');
      }
    });
  }

  private unwrapOrderResponse(res: any): any {
    return res?.data?.order || res?.data || res?.order || res;
  }

  submitOrder(id: string) {
    this.http.post<any>(`${this.apiUrl}/orders/${id}/submit`, {}).subscribe({
      next: (res) => {
        const order = this.unwrapOrderResponse(res);
        if (this.selectedOrder()?.id === id || this.selectedOrder()?.id == id) this.selectedOrder.set(order);
        this.notify('Order submitted for approval');
        this.loadDashboard();
        this.loadOrders();
      },
      error: (err) => this.notify(err.error?.error || 'Failed to submit order')
    });
  }

  approveOrder(id: string) {
    const comments = window.prompt('Approval comments (optional):') || '';
    this.http.post<any>(`${this.apiUrl}/orders/${id}/approve`, { comments }).subscribe({
      next: (res) => {
        const order = this.unwrapOrderResponse(res);
        if (this.selectedOrder()?.id === id || this.selectedOrder()?.id == id) this.selectedOrder.set(order);
        this.notify('Order approved successfully');
        this.loadDashboard();
        this.loadOrders();
      },
      error: (err) => this.notify(err.error?.error || 'Failed to approve order')
    });
  }

  declineOrder(id: string) {
    const reason = window.prompt('Reason for declining:');
    if (!reason) return;
    this.http.post<any>(`${this.apiUrl}/orders/${id}/decline`, { reason }).subscribe({
      next: (res) => {
        const order = this.unwrapOrderResponse(res);
        if (this.selectedOrder()?.id === id || this.selectedOrder()?.id == id) this.selectedOrder.set(order);
        this.notify('Order declined');
        this.loadDashboard();
        this.loadOrders();
      },
      error: (err) => this.notify(err.error?.error || 'Failed to decline order')
    });
  }

  dispatchOrder(id: string) {
    if (!window.confirm('Dispatch this order to the supplier?')) return;
    this.http.post<any>(`${this.apiUrl}/orders/${id}/dispatch`, {}).subscribe({
      next: (res) => {
        const order = this.unwrapOrderResponse(res);
        if (this.selectedOrder()?.id === id || this.selectedOrder()?.id == id) this.selectedOrder.set(order);
        this.notify('Order dispatched to supplier');
        this.loadDashboard();
        this.loadOrders();
      },
      error: (err) => this.notify(err.error?.error || 'Failed to dispatch order')
    });
  }

  voidOrder(id: string) {
    const reason = window.prompt('Reason for voiding this order:');
    if (!reason) return;
    if (!window.confirm('Are you sure you want to void this order? This action cannot be undone.')) return;
    this.http.post<any>(`${this.apiUrl}/orders/${id}/void`, { reason }).subscribe({
      next: (res) => {
        const order = this.unwrapOrderResponse(res);
        if (this.selectedOrder()?.id === id || this.selectedOrder()?.id == id) this.selectedOrder.set(order);
        this.notify('Order voided successfully');
        this.loadDashboard();
        this.loadOrders();
      },
      error: (err) => this.notify(err.error?.error || 'Failed to void order')
    });
  }

  bulkVoidOrders() {
    const ids = this.selectedOrders();
    if (ids.length === 0) return;
    const reason = window.prompt(`Void ${ids.length} selected orders. Reason:`);
    if (!reason) return;
    if (!window.confirm(`Are you sure you want to void ${ids.length} orders?`)) return;
    this.http.post<any>(`${this.apiUrl}/orders/bulk-void`, { orderIds: ids, reason }).subscribe({
      next: () => {
        this.notify(`${ids.length} orders voided`);
        this.selectedOrders.set([]);
        this.loadOrders();
        this.loadDashboard();
      },
      error: (err) => this.notify(err.error?.error || 'Failed to void orders')
    });
  }

  bulkExport() {
    this.notify(`Exporting ${this.selectedOrders().length} orders...`);
  }

  resendOrder(id: string) {
    if (!window.confirm('Resend this order to the supplier?')) return;
    this.http.post<any>(`${this.apiUrl}/orders/${id}/resend`, {}).subscribe({
      next: () => this.notify('Order resent to supplier'),
      error: (err) => this.notify(err.error?.error || 'Failed to resend order')
    });
  }

  loadCessions() {
    let url = `${this.apiUrl}/orders/cessions?`;
    if (this.cessionFilterOrder) url += `&orderNumber=${encodeURIComponent(this.cessionFilterOrder)}`;
    if (this.cessionFilterType) url += `&directiveType=${encodeURIComponent(this.cessionFilterType)}`;
    if (this.cessionFilterCedant) url += `&cedantName=${encodeURIComponent(this.cessionFilterCedant)}`;
    this.http.get<any>(url).subscribe({
      next: (data) => { const r = data?.data || data; this.cessions.set(Array.isArray(r) ? r : []); },
      error: () => this.cessions.set([])
    });
  }

  viewCession(cession: any) {
    this.http.get<any>(`${this.apiUrl}/orders/cessions/${cession.id}`).subscribe({
      next: (data) => {
        this.selectedCession.set(data);
        this.currentView.set('cession-detail');
      },
      error: () => {
        this.selectedCession.set(cession);
        this.currentView.set('cession-detail');
      }
    });
  }

  createCession() {
    if (!this.cessionForm.orderNumber) {
      this.notify('Please enter an order number');
      return;
    }
    this.saving.set(true);
    const payload = {
      orderNumber: this.cessionForm.orderNumber,
      cedant: { name: this.cessionForm.cedantName },
      cedantPercentage: this.cessionForm.cedantPercentage || 0,
      beneficiary: { name: this.cessionForm.beneficiaryName },
      beneficiaryPercentage: this.cessionForm.beneficiaryPercentage || 0,
      cessionDirectiveType: this.cessionForm.cessionDirectiveType || '',
      cessionDate: this.cessionForm.cessionDate || new Date().toISOString().substring(0, 10),
      totalClaimAmount: { amount: this.cessionForm.totalClaimAmount || 0, currency: 'ZAR' },
      description: this.cessionForm.description || '',
      comments: this.cessionForm.comments || ''
    };

    this.http.post<any>(`${this.apiUrl}/orders/cessions`, payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.showCessionForm.set(false);
        this.cessionForm = {};
        this.notify('Cession created successfully');
        this.loadCessions();
      },
      error: (err) => {
        this.saving.set(false);
        this.notify(err.error?.error || 'Failed to create cession');
      }
    });
  }

  deleteCession(id: string) {
    if (!window.confirm('Are you sure you want to delete this cession?')) return;
    this.http.delete<any>(`${this.apiUrl}/orders/cessions/${id}`).subscribe({
      next: () => {
        this.notify('Cession deleted');
        if (this.currentView() === 'cession-detail') {
          this.navigateTo('cessions');
        }
        this.loadCessions();
      },
      error: (err) => this.notify(err.error?.error || 'Failed to delete cession')
    });
  }

  loadReport(type: string) {
    this.loading.set(true);
    this.reportType.set(type);
    const filters = type === 'order-list' ? this.reportFilters : this.paymentReportFilters;
    const params: any = {};
    Object.keys(filters).forEach(key => {
      if (filters[key]) params[key] = filters[key];
    });

    this.http.get<any>(`${this.apiUrl}/orders/reports/${type}`, { params }).subscribe({
      next: (data) => {
        this.reportData.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.reportData.set({ title: type === 'order-list' ? 'Order List Report' : 'Outstanding Payments Report', data: [], summary: {} });
        this.loading.set(false);
      }
    });
  }

  navigateTo(view: string) {
    this.currentView.set(view);
    if (view === 'list') {
      this.loadOrders();
      this.loadDashboard();
    } else if (view === 'dashboard') {
      this.loadDashboard();
    } else if (view === 'cessions') {
      this.loadCessions();
    } else if (view === 'analytics') {
      this.analyticsService.getOrderAnalytics().subscribe(d => {
        this.orderAnalyticsData.set(d);
        setTimeout(() => this.renderOrderCharts(), 100);
      });
      this.dashboardService.getOrderAiInsights().subscribe({
        next: (d: any) => { const r = d?.insights || d?.data; this.orderAiInsights.set(Array.isArray(r) ? r : []); },
        error: () => this.orderAiInsights.set([])
      });
    }
  }

  filterByStatus(status: string) {
    if (this.filterStatus === status) {
      this.filterStatus = '';
    } else {
      this.filterStatus = status;
    }
    this.currentPage.set(1);
    this.currentView.set('list');
    this.loadOrders();
  }

  clearFilters() {
    this.searchQuery = '';
    this.filterStatus = '';
    this.filterDepartment = '';
    this.filterReferenceType = '';
    this.filterFinancialYear = '';
    this.filterSupplier = '';
    this.filterQuotation = '';
    this.filterContract = '';
    this.filterRequisition = '';
    this.currentPage.set(1);
    this.loadOrders();
  }

  changePage(page: number) {
    this.currentPage.set(page);
    this.loadOrders();
  }

  onPageSizeChange() {
    this.pageSize.set(this.pageSizeValue);
    this.currentPage.set(1);
    this.loadOrders();
  }

  toggleSelectOrder(id: string) {
    const current = this.selectedOrders();
    if (current.includes(id)) {
      this.selectedOrders.set(current.filter(i => i !== id));
    } else {
      this.selectedOrders.set([...current, id]);
    }
  }

  toggleSelectAll() {
    if (this.allSelected()) {
      this.selectedOrders.set([]);
    } else {
      this.selectedOrders.set(this.orders().map(o => o.id));
    }
  }

  isSelected(id: string): boolean {
    return this.selectedOrders().includes(id);
  }

  printOrder() {
    window.print();
  }

  notify(msg: string) {
    this.notification.set(msg);
    setTimeout(() => this.notification.set(''), 4000);
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

  formatPercentage(value: number): string {
    if (!value && value !== 0) return '0%';
    return value.toFixed(8) + '%';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      draft: 'Draft', awaiting_approval: 'Awaiting Approval', approved: 'Approved',
      declined: 'Declined', dispatched: 'Dispatched', partially_received: 'Partially Received',
      completed: 'Completed', voided: 'Voided', cancelled: 'Cancelled',
      submitted: 'Submitted', pending: 'Pending', active: 'Active'
    };
    return labels[status] || status;
  }

  getReferenceTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      quotation: 'Quotation', informal_tender: 'Informal Tender',
      tender: 'Tender', contract: 'Contract', direct: 'Direct'
    };
    return labels[type] || type || '—';
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      draft: '#64748b', awaiting_approval: '#ef6c00', approved: '#2e7d32',
      declined: '#c62828', dispatched: '#1565c0', partially_received: '#6a1b9a',
      completed: '#1b5e20', voided: '#c62828'
    };
    return colors[status] || '#64748b';
  }

  getSlaClass(actual: number, target: number): string {
    if (!actual) return 'sla-good';
    if (actual <= target) return 'sla-good';
    if (actual <= target * 1.5) return 'sla-warn';
    return 'sla-danger';
  }

  getSlaBarWidth(actual: number, target: number): number {
    if (!actual || !target) return 0;
    return Math.min((actual / (target * 2)) * 100, 100);
  }

  getSlaBarColor(actual: number, target: number): string {
    if (!actual) return '#2e7d32';
    if (actual <= target) return '#2e7d32';
    if (actual <= target * 1.5) return '#ef6c00';
    return '#c62828';
  }

  isBudgetStateCompleted(state: string): boolean {
    const order = ['available', 'reserved', 'committed', 'consumed', 'released'];
    const currentState = this.selectedOrder()?.budgetState?.state;
    if (!currentState) return false;
    return order.indexOf(state) < order.indexOf(currentState);
  }

  getAuditDotClass(action: string): string {
    if (action.toLowerCase().includes('approved') || action.toLowerCase().includes('approve')) return 'dot-approval';
    if (action.toLowerCase().includes('declined') || action.toLowerCase().includes('voided') || action.toLowerCase().includes('rejected')) return 'dot-rejection';
    if (action.toLowerCase().includes('system') || action.toLowerCase().includes('dispatch')) return 'dot-system';
    return 'dot-action';
  }

  getMscoaTooltip(mscoa: any): string {
    if (!mscoa) return '';
    const parts = [];
    if (mscoa.fund) parts.push('Fund: ' + mscoa.fund);
    if (mscoa.function) parts.push('Function: ' + mscoa.function);
    if (mscoa.project) parts.push('Project: ' + mscoa.project);
    if (mscoa.costing) parts.push('Costing: ' + mscoa.costing);
    if (mscoa.region) parts.push('Region: ' + mscoa.region);
    if (mscoa.item) parts.push('Item: ' + mscoa.item);
    return parts.join(' | ') || 'mSCOA segment';
  }

  getDeptBarWidth(dept: any): number {
    const total = this.budgetOverview().totalCommitted || 1;
    return Math.min(((dept.committed || 0) / total) * 100, 100);
  }

  getDeptBarColor(dept: any): string {
    const ratio = (dept.committed || 0) / (dept.available || 1);
    if (ratio < 0.6) return '#2e7d32';
    if (ratio < 0.8) return '#ef6c00';
    return '#c62828';
  }

  getBarHeight(month: any): number {
    const maxCount = Math.max(...this.monthlyTrend().map(m => m.count || 0), 1);
    return ((month.count || 0) / maxCount) * 100;
  }

  getReportColumns(): string[] {
    const data = this.reportData()?.data;
    if (!data?.length) return [];
    return Object.keys(data[0]);
  }

  getReportSummaryKeys(): string[] {
    const summary = this.reportData()?.summary;
    if (!summary) return [];
    return Object.keys(summary);
  }
}
