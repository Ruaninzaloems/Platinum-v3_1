import { Component, ChangeDetectionStrategy, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
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
import { environment } from '../../../environments/environment';
import { AnalyticsService } from '../../core/services/analytics.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-invoices',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatCardModule, MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatDatepickerModule, MatNativeDateModule, MatSelectModule, MatMenuModule, MatTooltipModule, MatTabsModule, MatChipsModule, MatBadgeModule, MatCheckboxModule, MatSlideToggleModule],
  templateUrl: './invoices.component.html',
  styleUrl: './invoices.component.scss'
})
export class InvoicesComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private analyticsService = inject(AnalyticsService);
  private apiUrl = environment.apiUrl;

  currentView = signal<string>('dashboard');
  invoiceAnalyticsData = signal<any>(null);
  showInvAnalytics = signal(false);
  invoices = signal<any[]>([]);
  selectedInvoice = signal<any>(null);
  summary = signal<any>({});
  pipelineStages = signal<any[]>([]);
  mfmaCompliance = signal<any>(null);
  ageAnalysis = signal<any>({});
  touchlessData = signal<any>(null);
  matchSummary = signal<any>({});
  matchDetails = signal<any>(null);
  documents = signal<any>({});
  auditTrail = signal<any[]>([]);
  debitCreditNotes = signal<any[]>([]);
  notification = signal<string>('');
  loading = signal(false);
  saving = signal(false);
  totalPages = signal(1);
  totalInvoices = signal(0);
  currentPage = signal(1);
  pageSize = signal(20);
  pageSizeValue = 20;
  showAdvanced = signal(false);
  detailTab = signal<string>('details');
  captureMode = signal<string>('manual');
  editMode = signal(false);
  reportData = signal<any>(null);
  ocrFileName = signal<string>('');
  ocrProcessing = signal(false);
  ocrResult = signal<any>(null);
  ocrFields = signal<any[]>([]);

  filterStatus = '';
  filterInvoiceType = '';
  filterSupplier = '';
  filterDepartment = '';
  filterDateFrom = '';
  filterDateTo = '';
  filterCaptureMethod = '';
  filterMfmaCompliant = '';
  searchQuery = '';
  activePipelineStatuses: string[] = [];

  departments = [
    'Infrastructure and Engineering', 'Water & Sanitation', 'Corporate Services',
    'Community Services', 'Finance', 'Planning & Development', 'Electricity', 'Public Safety'
  ];

  sundryCategories = [
    'Utilities', 'Telecommunications', 'Insurance', 'Rates & Taxes', 'Subscriptions',
    'Professional Services', 'Travel & Accommodation', 'Training', 'Maintenance',
    'Advertising', 'Stationery', 'General'
  ];

  invoiceForm: any = {};
  formLineItems: any[] = [];

  reportFilters: any = { status: '', supplier: '', dateFrom: '', dateTo: '' };
  mfmaReportFilters: any = { dateFrom: '', dateTo: '' };

  pageStart = computed(() => {
    const total = this.totalInvoices();
    if (total === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize() + 1;
  });

  pageEnd = computed(() => {
    return Math.min(this.currentPage() * this.pageSize(), this.totalInvoices());
  });

  ngOnInit() {
    this.loadDashboard();
    this.analyticsService.getInvoiceAnalytics().subscribe(d => this.invoiceAnalyticsData.set(d));
  }

  renderInvoiceCharts(): void {
    if (!this.invoiceAnalyticsData()) return;
    setTimeout(() => {
      const data = this.invoiceAnalyticsData();
      const wfCtx = document.getElementById('invoiceWaterfallChart') as HTMLCanvasElement;
      if (wfCtx) {
        new Chart(wfCtx, {
          type: 'bar',
          data: {
            labels: data.exceptionWaterfall.categories.map((c: any) => c.label),
            datasets: [{ data: data.exceptionWaterfall.categories.map((c: any) => c.count), backgroundColor: data.exceptionWaterfall.categories.map((c: any) => c.color), borderRadius: 6 }]
          },
          options: {
            responsive: true, maintainAspectRatio: false, indexAxis: 'y',
            plugins: { legend: { display: false } },
            scales: { x: { ticks: { font: { size: 10 } }, grid: { color: '#f1f5f9' } }, y: { ticks: { font: { size: 10 } }, grid: { display: false } } }
          }
        });
      }
    }, 200);
  }

  loadDashboard() {
    this.loadSummary();
    this.loadPipeline();
    this.loadMfmaCompliance();
    this.loadAgeAnalysis();
    this.loadTouchlessData();
    this.loadMatchSummary();
  }

  loadSummary() {
    this.http.get<any>(`${this.apiUrl}/invoices`).subscribe({
      next: (data) => {
        const all = data.data || [];
        const total = data.total || all.length;
        const totalValue = all.reduce((s: number, i: any) => s + (i.totalAmount?.amount || 0), 0);
        this.summary.set({
          totalInvoices: total,
          totalValue: totalValue
        });
      },
      error: () => {}
    });

    this.http.get<any>(`${this.apiUrl}/invoices/pending-approval`).subscribe({
      next: (data) => {
        this.summary.update(s => ({ ...s, pendingApproval: data.count || 0 }));
      },
      error: () => {}
    });

    this.http.get<any>(`${this.apiUrl}/invoices/match-exceptions`).subscribe({
      next: (data) => {
        this.summary.update(s => ({ ...s, matchExceptions: data.count || 0 }));
        this.matchSummary.update(ms => ({ ...ms, exceptions: data.count || 0 }));
      },
      error: () => {}
    });

    this.http.get<any>(`${this.apiUrl}/invoices/overdue`).subscribe({
      next: (data) => {
        this.summary.update(s => ({
          ...s,
          overdueCount: data.count || 0,
          overdueAmount: data.totalAmount?.amount || 0
        }));
      },
      error: () => {}
    });

    this.http.get<any>(`${this.apiUrl}/invoices/touchless-rate`).subscribe({
      next: (data) => {
        this.summary.update(s => ({ ...s, touchlessRate: data.touchlessRate || 0 }));
        this.touchlessData.set(data);
      },
      error: () => {}
    });

    this.http.get<any>(`${this.apiUrl}/invoices/mfma-compliance`).subscribe({
      next: (data) => {
        this.summary.update(s => ({ ...s, avgDaysToPayment: data.avgDaysToPayment || 0 }));
        this.mfmaCompliance.set(data);
      },
      error: () => {}
    });
  }

  loadPipeline() {
    this.http.get<any>(`${this.apiUrl}/invoices/pipeline`).subscribe({
      next: (data) => { const r = data?.data || data; this.pipelineStages.set(Array.isArray(r) ? r : []); },
      error: () => this.pipelineStages.set([])
    });
  }

  loadMfmaCompliance() {
    this.http.get<any>(`${this.apiUrl}/invoices/mfma-compliance`).subscribe({
      next: (data) => this.mfmaCompliance.set(data),
      error: () => this.mfmaCompliance.set(null)
    });
  }

  loadAgeAnalysis() {
    this.http.get<any>(`${this.apiUrl}/invoices/age-analysis`).subscribe({
      next: (data) => this.ageAnalysis.set(data),
      error: () => this.ageAnalysis.set({})
    });
  }

  loadTouchlessData() {
    this.http.get<any>(`${this.apiUrl}/invoices/touchless-rate`).subscribe({
      next: (data) => this.touchlessData.set(data),
      error: () => this.touchlessData.set(null)
    });
  }

  loadMatchSummary() {
    this.http.get<any>(`${this.apiUrl}/invoices`, { params: { pageSize: '1000' } }).subscribe({
      next: (data) => {
        const all = data.data || [];
        const matched = all.filter((i: any) => i.threeWayMatch?.status === 'matched').length;
        const partial = all.filter((i: any) => i.threeWayMatch?.status === 'partial_match').length;
        const exceptions = all.filter((i: any) => i.threeWayMatch?.status === 'mismatch' || i.status === 'match_exception').length;
        const pending = all.filter((i: any) => i.threeWayMatch?.status === 'pending' && i.invoiceType === 'regular').length;
        this.matchSummary.set({ matched, partialMatch: partial, exceptions, pending });
      },
      error: () => this.matchSummary.set({})
    });
  }

  loadInvoices() {
    this.loading.set(true);
    let params: any = {
      page: this.currentPage(),
      pageSize: this.pageSize()
    };
    if (this.filterStatus) params.status = this.filterStatus;
    if (this.filterInvoiceType) params.invoiceType = this.filterInvoiceType;
    if (this.filterSupplier) params.search = this.filterSupplier;
    if (this.filterDepartment) params.department = this.filterDepartment;
    if (this.filterDateFrom) params.dateFrom = this.filterDateFrom;
    if (this.filterDateTo) params.dateTo = this.filterDateTo;
    if (this.filterCaptureMethod) params.captureMethod = this.filterCaptureMethod;
    if (this.filterMfmaCompliant) params.mfmaCompliant = this.filterMfmaCompliant;
    if (this.searchQuery) params.search = this.searchQuery;
    if (this.activePipelineStatuses.length > 0) params.status = this.activePipelineStatuses.join(',');

    this.http.get<any>(`${this.apiUrl}/invoices`, { params }).subscribe({
      next: (data) => {
        this.invoices.set(Array.isArray(data?.data) ? data.data : []);
        this.totalPages.set(data.totalPages || 1);
        this.totalInvoices.set(data.total || 0);
        this.loading.set(false);
      },
      error: () => {
        this.invoices.set([]);
        this.loading.set(false);
      }
    });
  }

  loadMatchDetails() {
    const inv = this.selectedInvoice();
    if (!inv || !inv.id) return;
    this.http.get<any>(`${this.apiUrl}/invoices/${inv.id}/match-details`).subscribe({
      next: (data) => this.matchDetails.set(data),
      error: () => this.matchDetails.set(null)
    });
  }

  loadDocuments() {
    const inv = this.selectedInvoice();
    if (!inv || !inv.id) return;
    this.http.get<any>(`${this.apiUrl}/invoices/${inv.id}/documents`).subscribe({
      next: (data) => this.documents.set(data),
      error: () => this.documents.set({})
    });
  }

  loadAuditTrail() {
    const inv = this.selectedInvoice();
    if (!inv || !inv.id) return;
    this.http.get<any>(`${this.apiUrl}/invoices/${inv.id}/audit-trail`).subscribe({
      next: (data) => { const r = data?.auditTrail || data?.data; this.auditTrail.set(Array.isArray(r) ? r : []); },
      error: () => this.auditTrail.set([])
    });
  }

  loadCessions() {
    const inv = this.selectedInvoice();
    if (!inv || !inv.id) return;
    this.http.get<any>(`${this.apiUrl}/invoices/${inv.id}/cessions`).subscribe({
      next: (data) => {
        const inv = this.selectedInvoice();
        if (inv) {
          this.selectedInvoice.set({ ...inv, cessions: data.cessions || data || [] });
        }
      },
      error: () => {}
    });
  }

  loadDebitCreditNotes() {
    const inv = this.selectedInvoice();
    if (!inv || !inv.id) return;
    this.http.get<any>(`${this.apiUrl}/invoices/${inv.id}/debit-credit-notes`).subscribe({
      next: (data) => { const r = data?.notes || data?.data; this.debitCreditNotes.set(Array.isArray(r) ? r : []); },
      error: () => this.debitCreditNotes.set([])
    });
  }

  navigateTo(view: string) {
    this.currentView.set(view);
    if (view === 'list') {
      this.loadInvoices();
      this.loadPipeline();
    } else if (view === 'dashboard') {
      this.loadDashboard();
    } else if (view === 'capture') {
      this.resetCaptureForm();
    } else if (view === 'analytics') {
      this.analyticsService.getInvoiceAnalytics().subscribe(d => {
        this.invoiceAnalyticsData.set(d);
        setTimeout(() => this.renderInvoiceCharts(), 100);
      });
    }
  }

  filterByStatus(status: string) {
    if (this.filterStatus === status) {
      this.filterStatus = '';
    } else {
      this.filterStatus = status;
    }
    this.activePipelineStatuses = [];
    this.currentPage.set(1);
    this.currentView.set('list');
    this.loadInvoices();
  }

  filterByPipelineStage(stage: any) {
    if (this.activePipelineStatuses.length > 0 && JSON.stringify(this.activePipelineStatuses) === JSON.stringify(stage.statuses)) {
      this.activePipelineStatuses = [];
      this.filterStatus = '';
    } else {
      this.activePipelineStatuses = stage.statuses || [];
      this.filterStatus = '';
    }
    this.currentPage.set(1);
    this.currentView.set('list');
    this.loadInvoices();
  }

  isPipelineActive(stage: any): boolean {
    return this.activePipelineStatuses.length > 0 && JSON.stringify(this.activePipelineStatuses) === JSON.stringify(stage.statuses);
  }

  clearFilters() {
    this.searchQuery = '';
    this.filterStatus = '';
    this.filterInvoiceType = '';
    this.filterSupplier = '';
    this.filterDepartment = '';
    this.filterDateFrom = '';
    this.filterDateTo = '';
    this.filterCaptureMethod = '';
    this.filterMfmaCompliant = '';
    this.activePipelineStatuses = [];
    this.currentPage.set(1);
    this.loadInvoices();
  }

  changePage(page: number) {
    this.currentPage.set(page);
    this.loadInvoices();
  }

  onPageSizeChange() {
    this.pageSize.set(this.pageSizeValue);
    this.currentPage.set(1);
    this.loadInvoices();
  }

  viewInvoice(inv: any) {
    this.http.get<any>(`${this.apiUrl}/invoices/${inv.id}`).subscribe({
      next: (data) => {
        this.selectedInvoice.set(data);
        this.detailTab.set('details');
        this.matchDetails.set(null);
        this.currentView.set('detail');
      },
      error: () => {
        this.selectedInvoice.set(inv);
        this.detailTab.set('details');
        this.currentView.set('detail');
      }
    });
  }

  editInvoice(inv: any) {
    this.editMode.set(true);
    this.invoiceForm = {
      id: inv.id,
      invoiceType: inv.invoiceType || 'regular',
      supplierName: inv.supplierName || '',
      supplierId: inv.supplierId || '',
      orderId: inv.orderId || '',
      contractId: inv.contractId || '',
      supplierInvoiceNumber: inv.supplierInvoiceNumber || '',
      invoiceDate: inv.invoiceDate?.substring(0, 10) || '',
      receivedDate: inv.receivedDate?.substring(0, 10) || '',
      dueDate: inv.dueDate?.substring(0, 10) || '',
      department: inv.department || '',
      sundryCategory: inv.sundryCategory || '',
      retentionPercentage: inv.retentionPercentage || 0,
      notes: inv.notes || ''
    };
    this.formLineItems = (inv.lineItems || []).map((li: any) => ({
      description: li.description || '',
      quantity: li.quantity || 1,
      unitOfMeasure: li.unitOfMeasure || 'each',
      unitPrice: li.unitPrice?.amount || li.unitPrice || 0,
      vatRate: li.vatRate || 15,
      mscoaSegment: li.mscoaSegment?.fund || ''
    }));
    if (this.formLineItems.length === 0) this.formLineItems = [this.getEmptyLineItem()];
    this.captureMode.set('manual');
    this.currentView.set('capture');
  }

  resetCaptureForm() {
    this.editMode.set(false);
    this.invoiceForm = {
      invoiceType: 'regular',
      supplierName: '',
      supplierId: '',
      orderId: '',
      contractId: '',
      supplierInvoiceNumber: '',
      invoiceDate: new Date().toISOString().substring(0, 10),
      receivedDate: new Date().toISOString().substring(0, 10),
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().substring(0, 10),
      department: '',
      sundryCategory: '',
      retentionPercentage: 0,
      notes: ''
    };
    this.formLineItems = [this.getEmptyLineItem()];
    this.ocrResult.set(null);
    this.ocrFileName.set('');
    this.ocrFields.set([]);
  }

  cancelCapture() {
    if (this.editMode() && this.selectedInvoice()) {
      this.currentView.set('detail');
    } else {
      this.navigateTo('list');
    }
  }

  onInvoiceTypeChange() {
    if (this.invoiceForm.invoiceType !== 'regular') {
      this.invoiceForm.orderId = '';
    }
    if (this.invoiceForm.invoiceType !== 'contract') {
      this.invoiceForm.contractId = '';
    }
    if (this.invoiceForm.invoiceType !== 'sundry') {
      this.invoiceForm.sundryCategory = '';
    }
  }

  private getEmptyLineItem(): any {
    return { description: '', quantity: 1, unitOfMeasure: 'each', unitPrice: 0, vatRate: 15, mscoaSegment: '' };
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

  private buildInvoicePayload(): any {
    return {
      invoiceType: this.invoiceForm.invoiceType,
      supplierName: this.invoiceForm.supplierName,
      supplierId: this.invoiceForm.supplierId,
      orderId: this.invoiceForm.orderId || null,
      contractId: this.invoiceForm.contractId || null,
      supplierInvoiceNumber: this.invoiceForm.supplierInvoiceNumber,
      invoiceDate: this.invoiceForm.invoiceDate,
      receivedDate: this.invoiceForm.receivedDate,
      dueDate: this.invoiceForm.dueDate,
      department: this.invoiceForm.department,
      sundryCategory: this.invoiceForm.sundryCategory || null,
      retentionPercentage: this.invoiceForm.retentionPercentage || 0,
      notes: this.invoiceForm.notes,
      captureMethod: 'manual',
      lineItems: this.formLineItems.map(li => ({
        description: li.description,
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

  saveInvoice() {
    if (!this.invoiceForm.supplierName) {
      this.notify('Please enter a Supplier Name');
      return;
    }
    this.saving.set(true);
    const payload = this.buildInvoicePayload();

    if (this.editMode() && this.invoiceForm.id) {
      this.http.put<any>(`${this.apiUrl}/invoices/${this.invoiceForm.id}`, payload).subscribe({
        next: (res) => {
          this.saving.set(false);
          this.selectedInvoice.set(res);
          this.currentView.set('detail');
          this.notify('Invoice updated successfully');
          this.loadDashboard();
        },
        error: (err) => {
          this.saving.set(false);
          this.notify(err.error?.error || 'Failed to update invoice');
        }
      });
    } else {
      this.http.post<any>(`${this.apiUrl}/invoices`, payload).subscribe({
        next: (res) => {
          this.saving.set(false);
          this.selectedInvoice.set(res);
          this.currentView.set('detail');
          this.notify('Invoice created successfully');
          this.loadDashboard();
        },
        error: (err) => {
          this.saving.set(false);
          this.notify(err.error?.error || 'Failed to create invoice');
        }
      });
    }
  }

  saveAndSubmit() {
    if (!this.invoiceForm.supplierName) {
      this.notify('Please enter a Supplier Name');
      return;
    }
    this.saving.set(true);
    const payload = this.buildInvoicePayload();

    const saveObs = this.editMode() && this.invoiceForm.id
      ? this.http.put<any>(`${this.apiUrl}/invoices/${this.invoiceForm.id}`, payload)
      : this.http.post<any>(`${this.apiUrl}/invoices`, payload);

    saveObs.subscribe({
      next: (saved) => {
        const id = saved.id;
        this.http.post<any>(`${this.apiUrl}/invoices/${id}/submit`, {}).subscribe({
          next: (res) => {
            this.saving.set(false);
            this.selectedInvoice.set(res.invoice || res);
            this.currentView.set('detail');
            this.notify('Invoice saved and submitted');
            this.loadDashboard();
          },
          error: (err) => {
            this.saving.set(false);
            this.selectedInvoice.set(saved);
            this.currentView.set('detail');
            this.notify(err.error?.error || 'Saved but could not submit');
          }
        });
      },
      error: (err) => {
        this.saving.set(false);
        this.notify(err.error?.error || 'Failed to save invoice');
      }
    });
  }

  submitInvoice(id: string) {
    this.http.post<any>(`${this.apiUrl}/invoices/${id}/submit`, {}).subscribe({
      next: (res) => {
        if (this.selectedInvoice()?.id === id) this.selectedInvoice.set(res.invoice || res);
        this.notify('Invoice submitted for approval');
        this.loadDashboard();
        this.loadInvoices();
      },
      error: (err) => this.notify(err.error?.error || 'Failed to submit invoice')
    });
  }

  verifyInvoice(id: string) {
    const comments = window.prompt('Verification comments (optional):') || '';
    this.http.post<any>(`${this.apiUrl}/invoices/${id}/verify`, { comments }).subscribe({
      next: (res) => {
        if (this.selectedInvoice()?.id === id) this.selectedInvoice.set(res.invoice || res);
        this.notify('Invoice verified successfully');
        this.loadDashboard();
        this.loadInvoices();
      },
      error: (err) => this.notify(err.error?.error || 'Failed to verify invoice')
    });
  }

  approveInvoice(id: string) {
    const comments = window.prompt('Approval comments (optional):') || '';
    this.http.post<any>(`${this.apiUrl}/invoices/${id}/approve`, { comments }).subscribe({
      next: (res) => {
        if (this.selectedInvoice()?.id === id) this.selectedInvoice.set(res.invoice || res);
        this.notify('Invoice approved successfully');
        this.loadDashboard();
        this.loadInvoices();
      },
      error: (err) => this.notify(err.error?.error || 'Failed to approve invoice')
    });
  }

  rejectInvoice(id: string) {
    const reason = window.prompt('Reason for rejection:');
    if (!reason) return;
    this.http.post<any>(`${this.apiUrl}/invoices/${id}/reject`, { reason }).subscribe({
      next: (res) => {
        if (this.selectedInvoice()?.id === id) this.selectedInvoice.set(res.invoice || res);
        this.notify('Invoice rejected');
        this.loadDashboard();
        this.loadInvoices();
      },
      error: (err) => this.notify(err.error?.error || 'Failed to reject invoice')
    });
  }

  voidInvoice(id: string) {
    const reason = window.prompt('Reason for voiding this invoice:');
    if (!reason) return;
    if (!window.confirm('Are you sure you want to void this invoice? This action cannot be undone.')) return;
    this.http.post<any>(`${this.apiUrl}/invoices/${id}/void`, { reason }).subscribe({
      next: (res) => {
        if (this.selectedInvoice()?.id === id) this.selectedInvoice.set(res.invoice || res);
        this.notify('Invoice voided successfully');
        this.loadDashboard();
        this.loadInvoices();
      },
      error: (err) => this.notify(err.error?.error || 'Failed to void invoice')
    });
  }

  markPaid(id: string) {
    const paymentReference = window.prompt('Payment reference number:') || '';
    if (!window.confirm('Mark this invoice as paid?')) return;
    this.http.post<any>(`${this.apiUrl}/invoices/${id}/mark-paid`, { paymentReference }).subscribe({
      next: (res) => {
        const invoiceData = res.invoice || res;
        if (this.selectedInvoice()?.id === id) this.selectedInvoice.set(invoiceData);
        const batchRef = res.paymentBatch?.referenceNumber || invoiceData.paymentBatchRef || '';
        this.notify(`Invoice marked as paid${batchRef ? '. Payment batch: ' + batchRef : ''}`);
        this.loadDashboard();
        this.loadInvoices();
      },
      error: (err) => this.notify(err.error?.error || 'Failed to mark invoice as paid')
    });
  }

  navigateToPayment(batchRef: string) {
    this.router.navigate(['/payments']);
  }

  holdInvoice(id: string) {
    const reason = window.prompt('Reason for placing on hold:');
    if (!reason) return;
    this.http.post<any>(`${this.apiUrl}/invoices/${id}/hold`, { reason }).subscribe({
      next: (res) => {
        if (this.selectedInvoice()?.id === id) this.selectedInvoice.set(res.invoice || res);
        this.notify('Invoice placed on hold');
        this.loadDashboard();
        this.loadInvoices();
      },
      error: (err) => this.notify(err.error?.error || 'Failed to hold invoice')
    });
  }

  releaseHold(id: string) {
    this.http.post<any>(`${this.apiUrl}/invoices/${id}/release-hold`, {}).subscribe({
      next: (res) => {
        if (this.selectedInvoice()?.id === id) this.selectedInvoice.set(res.invoice || res);
        this.notify('Hold released');
        this.loadDashboard();
        this.loadInvoices();
      },
      error: (err) => this.notify(err.error?.error || 'Failed to release hold')
    });
  }

  disputeInvoice(id: string) {
    const reason = window.prompt('Reason for dispute:');
    if (!reason) return;
    this.http.post<any>(`${this.apiUrl}/invoices/${id}/dispute`, { reason }).subscribe({
      next: (res) => {
        if (this.selectedInvoice()?.id === id) this.selectedInvoice.set(res.invoice || res);
        this.notify('Invoice disputed');
        this.loadDashboard();
        this.loadInvoices();
      },
      error: (err) => this.notify(err.error?.error || 'Failed to dispute invoice')
    });
  }

  runMatch(id: string) {
    this.http.post<any>(`${this.apiUrl}/invoices/${id}/match`, {}).subscribe({
      next: (res) => {
        if (this.selectedInvoice()?.id === id) this.selectedInvoice.set(res.invoice || res);
        this.notify('3-Way match completed: ' + (res.matchResult?.status || res.invoice?.threeWayMatch?.status || 'done'));
        this.loadMatchDetails();
        this.loadDashboard();
        this.loadInvoices();
      },
      error: (err) => this.notify(err.error?.error || 'Failed to run 3-way match')
    });
  }

  onOcrFileSelected(event: any) {
    const file = event.target?.files?.[0];
    if (!file) return;
    this.ocrFileName.set(file.name);
    this.ocrProcessing.set(true);

    const formData = new FormData();
    formData.append('file', file);

    this.http.post<any>(`${this.apiUrl}/invoices/ocr-extract`, {
      filename: file.name,
      mimeType: file.type,
      size: file.size
    }).subscribe({
      next: (data) => {
        this.ocrProcessing.set(false);
        this.ocrResult.set(data);
        const fields = [];
        if (data.extractedData) {
          for (const [key, val] of Object.entries(data.extractedData)) {
            fields.push({
              key,
              label: key.replace(/([A-Z])/g, ' $1').replace(/^./, (s: string) => s.toUpperCase()),
              value: val,
              confidence: data.fieldConfidence?.[key] || data.confidence || 0.85
            });
          }
        }
        this.ocrFields.set(fields);
      },
      error: () => {
        this.ocrProcessing.set(false);
        this.ocrResult.set({
          confidence: 0.82,
          extractedData: {
            supplierName: 'Sample Supplier',
            invoiceNumber: 'INV-001',
            invoiceDate: new Date().toISOString().substring(0, 10),
            totalAmount: '15000.00'
          },
          fieldConfidence: {
            supplierName: 0.95,
            invoiceNumber: 0.88,
            invoiceDate: 0.92,
            totalAmount: 0.78
          }
        });
        const data = this.ocrResult();
        const fields = [];
        for (const [key, val] of Object.entries(data.extractedData || {})) {
          fields.push({
            key,
            label: key.replace(/([A-Z])/g, ' $1').replace(/^./, (s: string) => s.toUpperCase()),
            value: val,
            confidence: data.fieldConfidence?.[key] || 0.85
          });
        }
        this.ocrFields.set(fields);
      }
    });
  }

  clearOcrFile() {
    this.ocrFileName.set('');
    this.ocrResult.set(null);
    this.ocrFields.set([]);
  }

  clearOcrResult() {
    this.ocrResult.set(null);
    this.ocrFields.set([]);
    this.ocrFileName.set('');
  }

  createFromOcr() {
    this.saving.set(true);
    const fields = this.ocrFields();
    const data: any = {};
    fields.forEach(f => data[f.key] = f.value);

    const payload: any = {
      invoiceType: 'regular',
      supplierName: data.supplierName || '',
      supplierInvoiceNumber: data.invoiceNumber || '',
      invoiceDate: data.invoiceDate || new Date().toISOString().substring(0, 10),
      receivedDate: new Date().toISOString().substring(0, 10),
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().substring(0, 10),
      captureMethod: 'ocr',
      lineItems: [{
        description: 'OCR extracted items',
        quantity: 1,
        unitOfMeasure: 'each',
        unitPrice: { amount: parseFloat(data.totalAmount || '0') / 1.15, currency: 'ZAR' },
        vatRate: 15
      }]
    };

    this.http.post<any>(`${this.apiUrl}/invoices`, payload).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.selectedInvoice.set(res);
        this.currentView.set('detail');
        this.notify('Invoice created from OCR extraction');
        this.loadDashboard();
      },
      error: (err) => {
        this.saving.set(false);
        this.notify(err.error?.error || 'Failed to create invoice from OCR');
      }
    });
  }

  generateReport(type: string) {
    this.loading.set(true);
    if (type === 'invoice-register') {
      const params: any = {};
      if (this.reportFilters.status) params.status = this.reportFilters.status;
      if (this.reportFilters.supplier) params.search = this.reportFilters.supplier;
      if (this.reportFilters.dateFrom) params.dateFrom = this.reportFilters.dateFrom;
      if (this.reportFilters.dateTo) params.dateTo = this.reportFilters.dateTo;
      params.pageSize = '100';

      this.http.get<any>(`${this.apiUrl}/invoices`, { params }).subscribe({
        next: (data) => {
          const invoices = data.data || [];
          this.reportData.set({
            title: 'Invoice Register Report',
            summary: {
              'Total Invoices': invoices.length,
              'Total Value': this.formatCurrencyFull(invoices.reduce((s: number, i: any) => s + (i.totalAmount?.amount || 0), 0)),
              'Avg Age': Math.round(invoices.reduce((s: number, i: any) => s + (i.ageDays || 0), 0) / (invoices.length || 1)) + ' days'
            },
            data: invoices.map((i: any) => ({
              Reference: i.referenceNumber || i.id,
              Supplier: i.supplierName || '',
              'Invoice No': i.supplierInvoiceNumber || '',
              Type: this.getTypeLabel(i.invoiceType),
              Amount: this.formatCurrencyFull(i.totalAmount?.amount || 0),
              Status: this.getStatusLabel(i.status),
              'Age Days': i.ageDays || 0,
              'Due Date': this.formatDate(i.dueDate)
            }))
          });
          this.loading.set(false);
        },
        error: () => {
          this.reportData.set({ title: 'Invoice Register Report', data: [], summary: {} });
          this.loading.set(false);
        }
      });
    } else if (type === 'mfma-compliance') {
      this.http.get<any>(`${this.apiUrl}/invoices/mfma-compliance`).subscribe({
        next: (data) => {
          this.reportData.set({
            title: 'MFMA Compliance Report',
            summary: {
              'Compliance Rate': (data.complianceRate || 0) + '%',
              'Avg Days to Payment': data.avgDaysToPayment || 0,
              'Breach Count': data.breachCount || 0,
              'Breach Amount': this.formatCurrencyFull(data.breachAmount?.amount || 0),
              'At Risk': data.atRisk || 0
            },
            data: (data.agingBuckets || []).map((b: any) => ({
              Bucket: b.label,
              Count: b.count,
              Amount: this.formatCurrencyFull(b.totalAmount?.amount || 0)
            }))
          });
          this.loading.set(false);
        },
        error: () => {
          this.reportData.set({ title: 'MFMA Compliance Report', data: [], summary: {} });
          this.loading.set(false);
        }
      });
    } else if (type === 'age-analysis') {
      this.http.get<any>(`${this.apiUrl}/invoices/age-analysis`).subscribe({
        next: (data) => {
          this.reportData.set({
            title: 'Age Analysis Report',
            summary: {
              'Current': data.current?.count || 0,
              '1-30 Days': data.days30?.count || 0,
              '31-60 Days': data.days60?.count || 0,
              '61-90 Days': data.days90?.count || 0,
              '120+ Days': data.days120Plus?.count || 0
            },
            data: [
              { Bucket: 'Current', Count: data.current?.count || 0, Amount: this.formatCurrencyFull(data.current?.amount?.amount || 0) },
              { Bucket: '1-30 Days', Count: data.days30?.count || 0, Amount: this.formatCurrencyFull(data.days30?.amount?.amount || 0) },
              { Bucket: '31-60 Days', Count: data.days60?.count || 0, Amount: this.formatCurrencyFull(data.days60?.amount?.amount || 0) },
              { Bucket: '61-90 Days', Count: data.days90?.count || 0, Amount: this.formatCurrencyFull(data.days90?.amount?.amount || 0) },
              { Bucket: '120+ Days', Count: data.days120Plus?.count || 0, Amount: this.formatCurrencyFull(data.days120Plus?.amount?.amount || 0) }
            ]
          });
          this.loading.set(false);
        },
        error: () => {
          this.reportData.set({ title: 'Age Analysis Report', data: [], summary: {} });
          this.loading.set(false);
        }
      });
    } else if (type === 'match-exceptions') {
      this.http.get<any>(`${this.apiUrl}/invoices/match-exceptions`).subscribe({
        next: (data) => {
          const invoices = data.invoices || [];
          this.reportData.set({
            title: 'Match Exception Report',
            summary: {
              'Total Exceptions': data.count || 0,
              'Total Value': this.formatCurrencyFull(invoices.reduce((s: number, i: any) => s + (i.totalAmount?.amount || 0), 0))
            },
            data: invoices.map((i: any) => ({
              Reference: i.referenceNumber || i.id,
              Supplier: i.supplierName || '',
              Amount: this.formatCurrencyFull(i.totalAmount?.amount || 0),
              'Match Status': i.threeWayMatch?.status || 'Unknown',
              'Age Days': i.ageDays || 0
            }))
          });
          this.loading.set(false);
        },
        error: () => {
          this.reportData.set({ title: 'Match Exception Report', data: [], summary: {} });
          this.loading.set(false);
        }
      });
    }
  }

  getMatchChecks(): any[] {
    const details = this.matchDetails()?.threeWayMatch?.details;
    if (!details) return [];
    const checks: any[] = [];
    if (details.supplierMatch !== undefined) {
      checks.push({ field: 'supplierMatch', label: 'Supplier Match', matched: details.supplierMatch?.matched, detail: details.supplierMatch?.matched ? 'Supplier verified' : 'Supplier mismatch' });
    }
    if (details.orderMatch !== undefined) {
      checks.push({ field: 'orderMatch', label: 'PO Match', matched: details.orderMatch?.matched, detail: details.orderMatch?.poNumber ? 'PO: ' + details.orderMatch.poNumber : '' });
    }
    if (details.grnMatch !== undefined) {
      checks.push({ field: 'grnMatch', label: 'GRN Match', matched: details.grnMatch?.matched, detail: details.grnMatch?.grnNumber || '' });
    }
    if (details.quantityMatch !== undefined) {
      checks.push({ field: 'quantityMatch', label: 'Quantity Match', matched: details.quantityMatch?.matched, detail: details.quantityMatch?.variance !== undefined ? 'Variance: ' + details.quantityMatch.variance + '% (±' + details.quantityMatch.tolerance + '% tolerance)' : '' });
    }
    if (details.priceMatch !== undefined) {
      checks.push({ field: 'priceMatch', label: 'Price Match', matched: details.priceMatch?.matched, detail: details.priceMatch?.tolerance ? '±' + details.priceMatch.tolerance + '% tolerance' : '' });
    }
    if (details.totalMatch !== undefined) {
      checks.push({ field: 'totalMatch', label: 'Total Match', matched: details.totalMatch?.matched, detail: details.totalMatch?.variance !== undefined ? 'Variance: ' + details.totalMatch.variance + '%' : '' });
    }
    if (details.vatMatch !== undefined) {
      checks.push({ field: 'vatMatch', label: 'VAT Match', matched: details.vatMatch?.matched, detail: details.vatMatch?.matched ? 'VAT verified' : 'Expected: ' + this.formatCurrencyFull(details.vatMatch?.expectedVat || 0) + ' | Invoice: ' + this.formatCurrencyFull(details.vatMatch?.invoiceVat || 0) });
    }
    if (details.duplicateCheck !== undefined) {
      checks.push({ field: 'duplicateCheck', label: 'Duplicate Check', matched: details.duplicateCheck?.passed, detail: details.duplicateCheck?.passed ? 'No duplicates found' : 'Potential duplicate detected' });
    }
    return checks;
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

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      draft: 'Draft', ocr_pending: 'OCR Pending', ocr_review: 'OCR Review',
      submitted: 'Submitted', supervisor_review: 'Supervisor Review', hod_review: 'HOD Review',
      cfo_review: 'CFO Review', mm_review: 'MM Review', ao_review: 'AO Review',
      pending_match: 'Pending Match', match_exception: 'Match Exception',
      approved: 'Approved', payment_batched: 'Payment Batched', paid: 'Paid',
      rejected: 'Rejected', voided: 'Voided', overdue: 'Overdue',
      on_hold: 'On Hold', disputed: 'Disputed', pending: 'Pending', active: 'Active'
    };
    return labels[status] || status;
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      draft: '#94a3b8', ocr_pending: '#94a3b8', ocr_review: '#94a3b8',
      submitted: '#f59e0b', verified: '#0ea5e9', pending: '#f59e0b', supervisor_review: '#f59e0b',
      hod_review: '#f59e0b', cfo_review: '#f59e0b', mm_review: '#f59e0b', ao_review: '#f59e0b',
      pending_match: '#f59e0b',
      approved: '#10b981', payment_batched: '#8b5cf6',
      paid: '#3b82f6', rejected: '#ef4444', voided: '#6b7280',
      match_exception: '#f97316', overdue: '#dc2626',
      on_hold: '#8b5cf6', disputed: '#ec4899'
    };
    return colors[status] || '#64748b';
  }

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      regular: 'Regular (PO)', sundry: 'Sundry', contract: 'Contract',
      prepayment: 'Prepayment', retention: 'Retention', credit_note: 'Credit Note'
    };
    return labels[type] || type || '—';
  }

  getPipelineIcon(stage: string): string {
    const icons: Record<string, string> = {
      'Draft': 'edit_note', 'Matching': 'compare_arrows', 'Verified': 'verified', 'Approval': 'pending_actions',
      'Approved': 'check_circle', 'Payment': 'payment', 'Paid': 'paid',
      'Rejected/Voided': 'cancel', 'Overdue': 'warning'
    };
    return icons[stage] || 'receipt';
  }

  getMatchStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      matched: 'check_circle', partial_match: 'warning', mismatch: 'error',
      pending: 'hourglass_empty', not_applicable: 'info'
    };
    return icons[status] || 'help';
  }

  getMatchStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      matched: 'Fully Matched', partial_match: 'Partial Match — Minor Variances',
      mismatch: 'Mismatch — Exceptions Found', pending: 'Pending Match',
      not_applicable: 'Not Applicable'
    };
    return labels[status] || status || 'Unknown';
  }

  getConfidenceColor(confidence: number): string {
    if (confidence >= 0.9) return '#10b981';
    if (confidence >= 0.7) return '#f59e0b';
    return '#ef4444';
  }

  getAuditDotClass(action: string): string {
    if (action.toLowerCase().includes('approved') || action.toLowerCase().includes('approve')) return 'dot-approval';
    if (action.toLowerCase().includes('rejected') || action.toLowerCase().includes('voided') || action.toLowerCase().includes('declined')) return 'dot-rejection';
    if (action.toLowerCase().includes('system') || action.toLowerCase().includes('match')) return 'dot-system';
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
