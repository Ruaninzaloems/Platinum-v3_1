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
import { environment } from '../../environment';
import { AnalyticsService } from '../../core/services/analytics.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-payments',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatCardModule, MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatDatepickerModule, MatNativeDateModule, MatSelectModule, MatMenuModule, MatTooltipModule, MatTabsModule, MatChipsModule, MatBadgeModule, MatCheckboxModule, MatSlideToggleModule],
  templateUrl: './payments.component.html',
  styleUrl: './payments.component.scss'
})
export class PaymentsComponent implements OnInit {
  private http = inject(HttpClient);
  private analyticsService = inject(AnalyticsService);
  private apiUrl = environment.apiUrl;

  currentView = signal<string>('dashboard');
  payAnalytics = signal<any>(null);
  showPayAnalytics = signal(false);
  batches = signal<any[]>([]);
  selectedBatch = signal<any>(null);
  summary = signal<any>({});
  forecast = signal<any[]>([]);
  ageAnalysis = signal<any>({});
  cr01Data = signal<any>(null);
  remittances = signal<any[]>([]);
  approvedInvoices = signal<any[]>([]);
  selectedInvoiceIds = signal<string[]>([]);
  notification = signal<string>('');
  loading = signal(false);
  saving = signal(false);
  totalBatches = signal(0);
  totalPages = signal(1);
  currentPage = signal(1);
  pageSize = signal(20);
  pageSizeValue = 20;

  filterStatus = '';
  filterPaymentMethod = '';
  filterDateFrom = '';
  filterDateTo = '';
  searchQuery = '';
  newBatchMethod = 'EFT';
  newBatchNotes = '';
  cr01Month = '';
  reconFilterStatus = '';
  reconDateFrom = '';
  reconDateTo = '';
  scheduleMonth = String(new Date().getMonth() + 1);
  scheduleYear = String(new Date().getFullYear());
  newDocType = '';
  newDocFilename = '';
  bankConfigData: any = { defaultBank: 'standard_bank', branchCode: '', accountNumber: '', accountName: '' };

  reconciliationData = signal<any>({});
  scheduleData = signal<any>({});
  exceptionsData = signal<any>({});
  paymentDocuments = signal<any[]>([]);
  docPaymentId = signal<string>('');
  bankFiles = signal<any[]>([]);

  months = [
    { value: '1', label: 'January' }, { value: '2', label: 'February' }, { value: '3', label: 'March' },
    { value: '4', label: 'April' }, { value: '5', label: 'May' }, { value: '6', label: 'June' },
    { value: '7', label: 'July' }, { value: '8', label: 'August' }, { value: '9', label: 'September' },
    { value: '10', label: 'October' }, { value: '11', label: 'November' }, { value: '12', label: 'December' }
  ];

  pageStart = computed(() => {
    const total = this.totalBatches();
    if (total === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize() + 1;
  });

  pageEnd = computed(() => {
    return Math.min(this.currentPage() * this.pageSize(), this.totalBatches());
  });

  allInvoicesSelected = computed(() => {
    const invs = this.approvedInvoices();
    const sel = this.selectedInvoiceIds();
    return invs.length > 0 && invs.every(inv => sel.includes(inv.id));
  });

  ngOnInit() {
    this.loadDashboard();
    this.analyticsService.getPaymentAnalytics().subscribe(d => this.payAnalytics.set(d));
  }

  renderPayCharts(): void {
    if (!this.payAnalytics()) return;
    setTimeout(() => {
      const data = this.payAnalytics();
      const cycleCtx = document.getElementById('paymentCycleChart') as HTMLCanvasElement;
      if (cycleCtx) {
        new Chart(cycleCtx, {
          type: 'line',
          data: {
            labels: data.cycleTime.labels,
            datasets: [
              { label: 'Invoice→Approval', data: data.cycleTime.invoiceToApproval, borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)', tension: 0.4, fill: true, pointRadius: 3, borderWidth: 2 },
              { label: 'Approval→Payment', data: data.cycleTime.approvalToPayment, borderColor: '#8b5cf6', backgroundColor: 'rgba(139,92,246,0.1)', tension: 0.4, fill: true, pointRadius: 3, borderWidth: 2 },
              { label: 'Total Cycle', data: data.cycleTime.totalCycle, borderColor: '#10b981', backgroundColor: 'transparent', tension: 0.4, pointRadius: 4, borderWidth: 2, borderDash: [5, 5] },
              { label: '30-Day Target', data: Array(12).fill(30), borderColor: '#ef4444', backgroundColor: 'transparent', borderDash: [8, 4], pointRadius: 0, borderWidth: 1.5 }
            ]
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { font: { size: 10 }, usePointStyle: true, padding: 10 } } },
            scales: {
              y: { ticks: { font: { size: 10 }, callback: (v: any) => v + 'd' }, grid: { color: '#f1f5f9' }, title: { display: true, text: 'Days', font: { size: 10 } } },
              x: { ticks: { font: { size: 10 } }, grid: { display: false } }
            }
          }
        });
      }

      const bankCtx = document.getElementById('bankChangeChart') as HTMLCanvasElement;
      if (bankCtx) {
        new Chart(bankCtx, {
          type: 'bar',
          data: {
            labels: data.bankChangeRisk.labels,
            datasets: [
              { label: 'Total Changes', data: data.bankChangeRisk.changes, backgroundColor: '#93c5fd', borderRadius: 4 },
              { label: 'Flagged', data: data.bankChangeRisk.flagged, backgroundColor: '#fca5a5', borderRadius: 4 },
              { label: 'Close to Payment', data: data.bankChangeRisk.closToPayment, backgroundColor: '#dc2626', borderRadius: 4 }
            ]
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { font: { size: 10 }, usePointStyle: true } } },
            scales: { y: { ticks: { stepSize: 1, font: { size: 10 } }, grid: { color: '#f1f5f9' } }, x: { ticks: { font: { size: 10 } }, grid: { display: false } } }
          }
        });
      }
    }, 200);
  }

  loadDashboard() {
    this.loadSummary();
    this.loadForecast();
    this.loadAgeAnalysis();
    this.loadBatchesForCounts();
    this.loadExceptions();
    this.loadBankConfig();
  }

  loadSummary() {
    this.http.get<any>(`${this.apiUrl}/payments/dashboard/summary`).subscribe({
      next: (data) => this.summary.set(data),
      error: () => this.summary.set({})
    });
  }

  loadForecast() {
    this.http.get<any>(`${this.apiUrl}/payments/payment-forecast`).subscribe({
      next: (data) => { const r = data?.data || data; this.forecast.set(Array.isArray(r) ? r : []); },
      error: () => this.forecast.set([])
    });
  }

  loadAgeAnalysis() {
    this.http.get<any>(`${this.apiUrl}/payments/creditor-age-analysis`).subscribe({
      next: (data) => this.ageAnalysis.set(data || {}),
      error: () => this.ageAnalysis.set({})
    });
  }

  private allBatches: any[] = [];

  loadBatchesForCounts() {
    this.http.get<any>(`${this.apiUrl}/payments/batches`, { params: { pageSize: '1000' } }).subscribe({
      next: (data) => {
        const result = data?.data || data;
        this.allBatches = Array.isArray(result) ? result : [];
      },
      error: () => { this.allBatches = []; }
    });
  }

  getStatusCount(status: string): number {
    return Array.isArray(this.allBatches) ? this.allBatches.filter(b => b.status === status).length : 0;
  }

  loadBatches() {
    this.loading.set(true);
    const params: any = {
      page: this.currentPage().toString(),
      pageSize: this.pageSize().toString()
    };
    if (this.filterStatus) params.status = this.filterStatus;
    if (this.filterPaymentMethod) params.paymentMethod = this.filterPaymentMethod;
    if (this.filterDateFrom) params.dateFrom = this.filterDateFrom;
    if (this.filterDateTo) params.dateTo = this.filterDateTo;
    if (this.searchQuery) params.search = this.searchQuery;

    this.http.get<any>(`${this.apiUrl}/payments/batches`, { params }).subscribe({
      next: (data) => {
        this.batches.set(Array.isArray(data?.data) ? data.data : []);
        this.totalBatches.set(data.total || 0);
        this.totalPages.set(data.totalPages || 1);
        this.loading.set(false);
      },
      error: () => {
        this.batches.set([]);
        this.loading.set(false);
      }
    });
  }

  loadApprovedInvoices() {
    this.http.get<any>(`${this.apiUrl}/invoices`, { params: { status: 'approved', pageSize: '200' } }).subscribe({
      next: (data) => this.approvedInvoices.set(Array.isArray(data?.data) ? data.data : []),
      error: () => this.approvedInvoices.set([])
    });
  }

  loadCr01() {
    this.loading.set(true);
    const params: any = {};
    if (this.cr01Month) params.month = this.cr01Month;
    this.http.get<any>(`${this.apiUrl}/payments/cr01-report`, { params }).subscribe({
      next: (data) => {
        this.cr01Data.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.cr01Data.set(null);
        this.loading.set(false);
        this.notify('Failed to load CR01 report');
      }
    });
  }

  loadRemittances() {
    this.http.get<any>(`${this.apiUrl}/payments/remittance-advices`).subscribe({
      next: (data) => this.remittances.set(Array.isArray(data?.data) ? data.data : []),
      error: () => this.remittances.set([])
    });
  }

  navigateTo(view: string) {
    this.currentView.set(view);
    if (view === 'dashboard') {
      this.loadDashboard();
    } else if (view === 'list') {
      this.loadBatches();
      this.loadBatchesForCounts();
    } else if (view === 'create') {
      this.loadApprovedInvoices();
      this.selectedInvoiceIds.set([]);
    } else if (view === 'cr01') {
      this.loadCr01();
    } else if (view === 'remittance') {
      this.loadRemittances();
    } else if (view === 'reconciliation') {
      this.loadReconciliation();
    } else if (view === 'schedule') {
      this.loadSchedule();
    } else if (view === 'exceptions') {
      this.loadExceptions();
    } else if (view === 'analytics') {
      this.analyticsService.getPaymentAnalytics().subscribe(d => {
        this.payAnalytics.set(d);
        setTimeout(() => this.renderPayCharts(), 100);
      });
    } else if (view === 'bankConfig') {
      this.loadBankConfig();
    } else if (view === 'detail') {
      if (this.selectedBatch()) {
        this.currentView.set('detail');
      }
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
    this.loadBatches();
    this.loadBatchesForCounts();
  }

  clearFilters() {
    this.searchQuery = '';
    this.filterStatus = '';
    this.filterPaymentMethod = '';
    this.filterDateFrom = '';
    this.filterDateTo = '';
    this.currentPage.set(1);
    this.loadBatches();
  }

  changePage(page: number) {
    this.currentPage.set(page);
    this.loadBatches();
  }

  onPageSizeChange() {
    this.pageSize.set(this.pageSizeValue);
    this.currentPage.set(1);
    this.loadBatches();
  }

  viewBatch(batch: any) {
    this.http.get<any>(`${this.apiUrl}/payments/batches/${batch.id}`).subscribe({
      next: (data) => {
        this.selectedBatch.set(data);
        this.currentView.set('detail');
      },
      error: () => {
        this.selectedBatch.set(batch);
        this.currentView.set('detail');
      }
    });
  }

  createBatch() {
    const invoiceIds = this.selectedInvoiceIds();
    if (invoiceIds.length === 0) {
      this.notify('Please select at least one invoice');
      return;
    }
    this.saving.set(true);
    this.http.post<any>(`${this.apiUrl}/payments/batches`, {
      invoiceIds,
      paymentMethod: this.newBatchMethod,
      notes: this.newBatchNotes
    }).subscribe({
      next: (batch) => {
        this.saving.set(false);
        this.selectedBatch.set(batch);
        this.currentView.set('detail');
        this.notify('Payment batch created successfully: ' + batch.referenceNumber);
        this.selectedInvoiceIds.set([]);
        this.newBatchNotes = '';
      },
      error: (err) => {
        this.saving.set(false);
        this.notify(err.error?.error || 'Failed to create payment batch');
      }
    });
  }

  submitBatch(id: string) {
    this.http.post<any>(`${this.apiUrl}/payments/batches/${id}/submit`, {}).subscribe({
      next: (res) => {
        this.selectedBatch.set(res.batch || res);
        this.notify('Payment batch submitted for approval');
        this.loadSummary();
      },
      error: (err) => this.notify(err.error?.error || 'Failed to submit batch')
    });
  }

  approveBatch(id: string) {
    const comments = window.prompt('Approval comments (optional):') || '';
    this.http.post<any>(`${this.apiUrl}/payments/batches/${id}/approve`, { comments }).subscribe({
      next: (res) => {
        if (this.selectedBatch()?.id === id) this.selectedBatch.set(res.batch || res);
        this.notify('Payment batch approved');
        this.loadSummary();
        this.loadBatches();
      },
      error: (err) => this.notify(err.error?.error || 'Failed to approve batch')
    });
  }

  generateEft(id: string) {
    this.http.post<any>(`${this.apiUrl}/payments/batches/${id}/generate-eft`, {}).subscribe({
      next: (res) => {
        if (this.selectedBatch()?.id === id) this.selectedBatch.set(res.batch || res);
        this.notify('EFT file generated: ' + (res.eftFileName || res.eftFileReference || ''));
        this.loadSummary();
        this.loadBatches();
      },
      error: (err) => this.notify(err.error?.error || 'Failed to generate EFT file')
    });
  }

  processBatch(id: string) {
    if (!window.confirm('Are you sure you want to process this payment batch? This will mark all invoices as paid.')) return;
    this.http.post<any>(`${this.apiUrl}/payments/batches/${id}/process`, {}).subscribe({
      next: (res) => {
        if (this.selectedBatch()?.id === id) this.selectedBatch.set(res.batch || res);
        this.notify('Payment batch processed successfully. ' + (res.invoicesPaid || 0) + ' invoices paid.');
        this.loadSummary();
        this.loadBatches();
      },
      error: (err) => this.notify(err.error?.error || 'Failed to process batch')
    });
  }

  voidBatch(id: string) {
    if (!window.confirm('Are you sure you want to void this payment batch? Invoices will be released back to approved status.')) return;
    this.http.post<any>(`${this.apiUrl}/payments/batches/${id}/void`, {}).subscribe({
      next: (res) => {
        if (this.selectedBatch()?.id === id) this.selectedBatch.set(res.batch || res);
        this.notify('Payment batch voided');
        this.loadSummary();
        this.loadBatches();
      },
      error: (err) => this.notify(err.error?.error || 'Failed to void batch')
    });
  }

  resendRemittance(id: string) {
    this.http.post<any>(`${this.apiUrl}/payments/remittance-advices/${id}/resend`, {}).subscribe({
      next: () => {
        this.notify('Remittance advice resent');
        this.loadRemittances();
      },
      error: (err) => this.notify(err.error?.error || 'Failed to resend remittance')
    });
  }

  loadReconciliation() {
    this.loading.set(true);
    const params: any = {};
    if (this.reconFilterStatus) params.status = this.reconFilterStatus;
    if (this.reconDateFrom) params.dateFrom = this.reconDateFrom;
    if (this.reconDateTo) params.dateTo = this.reconDateTo;
    this.http.get<any>(`${this.apiUrl}/payments/reconciliation`, { params }).subscribe({
      next: (data) => { this.reconciliationData.set(data); this.loading.set(false); },
      error: () => { this.reconciliationData.set({}); this.loading.set(false); }
    });
  }

  clearReconFilters() {
    this.reconFilterStatus = '';
    this.reconDateFrom = '';
    this.reconDateTo = '';
    this.loadReconciliation();
  }

  matchPayment(paymentId: string) {
    const bankRef = window.prompt('Enter bank statement reference:');
    if (!bankRef) return;
    const amountStr = window.prompt('Enter matched amount (leave blank for full match):');
    const body: any = { paymentId, bankStatementRef: bankRef };
    if (amountStr) body.matchedAmount = parseFloat(amountStr);
    this.http.post<any>(`${this.apiUrl}/payments/reconciliation/match`, body).subscribe({
      next: (res) => {
        this.notify(`Payment ${res.entry?.status || 'matched'}: ${bankRef}`);
        this.loadReconciliation();
      },
      error: (err) => this.notify(err.error?.error || 'Failed to match payment')
    });
  }

  loadSchedule() {
    this.loading.set(true);
    const params: any = { month: this.scheduleMonth, year: this.scheduleYear };
    this.http.get<any>(`${this.apiUrl}/payments/schedule`, { params }).subscribe({
      next: (data) => { this.scheduleData.set(data); this.loading.set(false); },
      error: () => { this.scheduleData.set({}); this.loading.set(false); }
    });
  }

  hasOverduePayment(day: any): boolean {
    return (day.payments || []).some((p: any) => p.isOverdue);
  }

  reschedulePayment(invoiceId: string) {
    const newDate = window.prompt('Enter new scheduled date (YYYY-MM-DD):');
    if (!newDate) return;
    const reason = window.prompt('Reason for rescheduling:') || 'Rescheduled';
    this.http.put<any>(`${this.apiUrl}/payments/${invoiceId}/schedule`, { scheduledDate: newDate, reason }).subscribe({
      next: () => { this.notify('Payment rescheduled'); this.loadSchedule(); },
      error: (err) => this.notify(err.error?.error || 'Failed to reschedule payment')
    });
  }

  loadExceptions() {
    this.http.get<any>(`${this.apiUrl}/payments/exceptions`).subscribe({
      next: (data) => this.exceptionsData.set(data),
      error: () => this.exceptionsData.set({})
    });
  }

  reverseBatch(id: string) {
    const reason = window.prompt('Enter reversal reason:');
    if (!reason) return;
    this.http.post<any>(`${this.apiUrl}/payments/${id}/reverse`, { reason, reversalDate: new Date().toISOString() }).subscribe({
      next: (res) => {
        if (this.selectedBatch()?.id === id) this.selectedBatch.set(res.batch || res);
        this.notify('Payment batch reversed');
        this.loadSummary();
        this.loadBatches();
      },
      error: (err) => this.notify(err.error?.error || 'Failed to reverse payment')
    });
  }

  cancelBatch(id: string) {
    if (!window.confirm('Cancel this payment? Invoices will be released.')) return;
    const reason = window.prompt('Cancel reason:') || 'Cancelled by user';
    this.http.post<any>(`${this.apiUrl}/payments/${id}/cancel`, { reason }).subscribe({
      next: (res) => {
        if (this.selectedBatch()?.id === id) this.selectedBatch.set(res.batch || res);
        this.notify('Payment cancelled');
        this.loadSummary();
        this.loadBatches();
      },
      error: (err) => this.notify(err.error?.error || 'Failed to cancel payment')
    });
  }

  generateRemittance(id: string) {
    this.http.post<any>(`${this.apiUrl}/payments/${id}/remittance`, {}).subscribe({
      next: (res) => this.notify(`Remittance advices generated: ${res.remittances?.length || 0}`),
      error: (err) => this.notify(err.error?.error || 'Failed to generate remittance')
    });
  }

  sendRemittance(id: string) {
    const method = window.prompt('Send method (email/portal):', 'email') || 'email';
    this.http.post<any>(`${this.apiUrl}/payments/${id}/remittance/send`, { method }).subscribe({
      next: (res) => this.notify(res.message || 'Remittance sent'),
      error: (err) => this.notify(err.error?.error || 'Failed to send remittance')
    });
  }

  viewDocuments(paymentId: string) {
    this.docPaymentId.set(paymentId);
    this.loadDocuments(paymentId);
    this.currentView.set('documents');
  }

  loadDocuments(paymentId: string) {
    this.http.get<any>(`${this.apiUrl}/payments/${paymentId}/documents`).subscribe({
      next: (data) => { const r = data?.documents || data?.data; this.paymentDocuments.set(Array.isArray(r) ? r : []); },
      error: () => this.paymentDocuments.set([])
    });
  }

  uploadDocument() {
    const paymentId = this.docPaymentId();
    if (!paymentId || !this.newDocType || !this.newDocFilename) return;
    this.http.post<any>(`${this.apiUrl}/payments/${paymentId}/documents`, {
      type: this.newDocType, filename: this.newDocFilename, size: 1024, mimeType: 'application/pdf'
    }).subscribe({
      next: () => {
        this.notify('Document uploaded');
        this.newDocType = '';
        this.newDocFilename = '';
        this.loadDocuments(paymentId);
      },
      error: (err) => this.notify(err.error?.error || 'Failed to upload document')
    });
  }

  deleteDocument(docId: string) {
    if (!window.confirm('Delete this document?')) return;
    const paymentId = this.docPaymentId();
    this.http.delete<any>(`${this.apiUrl}/payments/${paymentId}/documents/${docId}`).subscribe({
      next: () => { this.notify('Document deleted'); this.loadDocuments(paymentId); },
      error: (err) => this.notify(err.error?.error || 'Failed to delete document')
    });
  }

  loadBankConfig() {
    this.http.get<any>(`${this.apiUrl}/payments/bank-file/config`).subscribe({
      next: (data) => {
        this.bankConfigData = { defaultBank: data.defaultBank || 'standard_bank', branchCode: data.branchCode || '', accountNumber: data.accountNumber || '', accountName: data.accountName || '' };
        this.bankFiles.set(Array.isArray(data?.generatedFiles) ? data.generatedFiles : []);
      },
      error: () => {}
    });
  }

  saveBankConfig() {
    this.http.put<any>(`${this.apiUrl}/payments/bank-file/config`, this.bankConfigData).subscribe({
      next: () => this.notify('Bank configuration saved'),
      error: (err) => this.notify(err.error?.error || 'Failed to save bank configuration')
    });
  }

  toggleInvoiceSelection(id: string) {
    const current = this.selectedInvoiceIds();
    if (current.includes(id)) {
      this.selectedInvoiceIds.set(current.filter(i => i !== id));
    } else {
      this.selectedInvoiceIds.set([...current, id]);
    }
  }

  toggleSelectAllInvoices() {
    if (this.allInvoicesSelected()) {
      this.selectedInvoiceIds.set([]);
    } else {
      this.selectedInvoiceIds.set(this.approvedInvoices().map(inv => inv.id));
    }
  }

  isInvoiceSelected(id: string): boolean {
    return this.selectedInvoiceIds().includes(id);
  }

  getSelectedTotal(): number {
    const selected = this.selectedInvoiceIds();
    return this.approvedInvoices()
      .filter(inv => selected.includes(inv.id))
      .reduce((sum, inv) => sum + (inv.netPayable?.amount || inv.totalAmount?.amount || 0), 0);
  }

  exportCr01() {
    this.notify('CR01 Report export initiated (simulated). In production, this would download a PDF/Excel file.');
  }

  getCr01ColumnTotal(column: string): number {
    const data = this.cr01Data()?.data || [];
    return data.reduce((sum: number, row: any) => sum + (row[column] || 0), 0);
  }

  getForecastBarWidth(week: any): number {
    const max = Math.max(...this.forecast().map(w => w.amount?.amount || 0), 1);
    return ((week.amount?.amount || 0) / max) * 100;
  }

  getForecastTotal(): number {
    return this.forecast().reduce((sum, w) => sum + (w.amount?.amount || 0), 0);
  }

  notify(message: string) {
    this.notification.set(message);
    setTimeout(() => this.notification.set(''), 5000);
  }

  formatCurrency(value: number): string {
    if (!value && value !== 0) return 'R 0.00';
    if (value >= 1000000) return 'R ' + (value / 1000000).toFixed(1) + 'M';
    if (value >= 1000) return 'R ' + (value / 1000).toFixed(0) + 'K';
    return 'R ' + value.toFixed(2);
  }

  formatCurrencyFull(value: number): string {
    if (!value && value !== 0) return 'R 0.00';
    return 'R ' + value.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'draft': 'Draft',
      'pending_approval': 'Pending Approval',
      'submitted': 'Submitted',
      'approved': 'Approved',
      'eft_generated': 'EFT Generated',
      'processed': 'Processed',
      'voided': 'Voided',
      'reversed': 'Reversed',
      'cancelled': 'Cancelled',
      'matched': 'Matched',
      'unmatched': 'Unmatched',
      'partial': 'Partial Match'
    };
    return labels[status] || status;
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'draft': '#94a3b8',
      'pending_approval': '#f59e0b',
      'submitted': '#f59e0b',
      'approved': '#10b981',
      'eft_generated': '#6366f1',
      'processed': '#3b82f6',
      'voided': '#6b7280',
      'reversed': '#dc2626',
      'cancelled': '#6b7280'
    };
    return colors[status] || '#64748b';
  }
}
