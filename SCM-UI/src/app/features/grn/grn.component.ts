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
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { environment } from '../../../environments/environment';
import { AnalyticsService } from '../../core/services/analytics.service';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

@Component({
  selector: 'app-grn',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatCardModule, MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatDatepickerModule, MatNativeDateModule, MatSelectModule, MatMenuModule, MatTooltipModule, MatTabsModule, MatChipsModule, MatSlideToggleModule],
  templateUrl: './grn.component.html',
  styleUrl: './grn.component.scss'
})
export class GrnComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = environment.apiUrl;
  private analyticsService = inject(AnalyticsService);

  grnAnalytics = signal<any>(null);
  showGrnAnalytics = signal(false);

  currentView = signal<'list' | 'detail' | 'capture' | 'analytics'>('list');
  grns = signal<any[]>([]);
  selectedGrn = signal<any>(null);
  summary = signal<any>({});
  stores = signal<any[]>([]);
  notification = signal<string>('');
  loading = signal(false);
  totalPages = signal(1);
  currentPage = signal(1);
  pageSize = signal(20);
  totalGrns = signal(0);
  filterStatus = '';
  searchQuery = '';
  showFilters = signal(false);
  editMode = signal(false);
  saving = signal(false);
  budgetImpact = signal<any>(null);
  correspondence = signal<any[]>([]);

  filterGrnNumber = '';
  filterOrderNumber = '';
  filterVendorName = '';
  filterStore = '';
  filterFinancialYear = '';

  grnForm: any = {};
  formLineItems: any[] = [];

  ngOnInit() {
    this.loadSummary();
    this.loadGrns();
    this.loadStores();
    this.analyticsService.getGrnAnalytics().subscribe(d => this.grnAnalytics.set(d));
  }

  renderGrnCharts(): void {
    if (!this.grnAnalytics()) return;
    setTimeout(() => {
      const data = this.grnAnalytics();
      const matchCtx = document.getElementById('threeWayMatchChart') as HTMLCanvasElement;
      if (matchCtx) {
        new Chart(matchCtx, {
          type: 'line',
          data: {
            labels: data.threeWayMatch.trend.labels,
            datasets: [{ label: 'Match Rate %', data: data.threeWayMatch.trend.matchRate, borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', tension: 0.4, fill: true, pointRadius: 3, borderWidth: 2 }]
          },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { min: 80, max: 100, ticks: { font: { size: 10 }, callback: (v: any) => v + '%' }, grid: { color: '#f1f5f9' } }, x: { ticks: { font: { size: 10 } }, grid: { display: false } } } }
        });
      }
      const otifCtx = document.getElementById('supplierOtifChart') as HTMLCanvasElement;
      if (otifCtx) {
        new Chart(otifCtx, {
          type: 'bar',
          data: {
            labels: data.supplierOtif.suppliers.map((s: any) => s.name.split(' ')[0]),
            datasets: [
              { label: 'OTIF %', data: data.supplierOtif.suppliers.map((s: any) => s.otif), backgroundColor: data.supplierOtif.suppliers.map((s: any) => s.otif >= 90 ? '#86efac' : s.otif >= 80 ? '#fde68a' : '#fca5a5'), borderRadius: 6 }
            ]
          },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { min: 50, max: 100, ticks: { font: { size: 10 }, callback: (v: any) => v + '%' }, grid: { color: '#f1f5f9' } }, x: { ticks: { font: { size: 10 } }, grid: { display: false } } } }
        });
      }
    }, 200);
  }

  loadSummary() {
    this.http.get<any>(`${this.apiUrl}/grn/dashboard/summary`).subscribe({
      next: (res) => this.summary.set(res?.data || res),
      error: () => this.summary.set({})
    });
  }

  loadGrns() {
    this.loading.set(true);
    const params: any = {
      page: this.currentPage(),
      pageSize: this.pageSize()
    };
    if (this.searchQuery) params.search = this.searchQuery;
    if (this.filterStatus) params.status = this.filterStatus;
    if (this.filterGrnNumber) params.grnNumber = this.filterGrnNumber;
    if (this.filterOrderNumber) params.orderNumber = this.filterOrderNumber;
    if (this.filterVendorName) params.vendorName = this.filterVendorName;
    if (this.filterStore) params.store = this.filterStore;
    if (this.filterFinancialYear) params.financialYear = this.filterFinancialYear;

    const queryString = Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v as string)}`).join('&');
    this.http.get<any>(`${this.apiUrl}/grn?${queryString}`).subscribe({
      next: (data) => {
        this.grns.set(data.data || data.grns || data || []);
        this.totalPages.set(data.totalPages || data.pages || 1);
        this.totalGrns.set(data.total || data.totalCount || 0);
        this.loading.set(false);
      },
      error: () => {
        this.grns.set([]);
        this.loading.set(false);
      }
    });
  }

  loadStores() {
    this.http.get<any>(`${this.apiUrl}/grn/stores`).subscribe({
      next: (res) => {
        const data = res?.data || res;
        this.stores.set(data.stores || data || []);
      },
      error: () => this.stores.set([])
    });
  }

  viewGrn(grn: any) {
    this.loading.set(true);
    this.http.get<any>(`${this.apiUrl}/grn/${grn.id}`).subscribe({
      next: (res) => {
        const data = this.unwrapGrn(res);
        this.selectedGrn.set(data);
        this.currentView.set('detail');
        this.loading.set(false);
        this.loadBudgetImpact(grn.id);
        this.loadCorrespondence(grn.id);
      },
      error: () => {
        this.selectedGrn.set(grn);
        this.currentView.set('detail');
        this.loading.set(false);
      }
    });
  }

  loadBudgetImpact(id: string) {
    this.http.get<any>(`${this.apiUrl}/grn/${id}/budget-impact`).subscribe({
      next: (res) => this.budgetImpact.set(res?.data || res),
      error: () => this.budgetImpact.set(null)
    });
  }

  loadCorrespondence(id: string) {
    this.http.get<any>(`${this.apiUrl}/grn/${id}/correspondence`).subscribe({
      next: (res) => {
        const data = res?.data || res;
        this.correspondence.set(data.correspondence || data || []);
      },
      error: () => this.correspondence.set([])
    });
  }

  editGrn(grn: any) {
    this.editMode.set(true);
    this.grnForm = {
      id: grn.id,
      orderNumber: grn.orderNumber,
      orderId: grn.orderId,
      vendorName: grn.vendorName || grn.supplier?.name || '',
      storeId: grn.storeId || '',
      binLocation: grn.binLocation || '',
      deliveryNoteNumber: grn.deliveryNoteNumber || '',
      deliveryNoteDate: grn.deliveryNoteDate || '',
      dateReceived: grn.dateReceived || '',
      directDelivery: grn.directDelivery || false,
      comments: grn.comments || '',
      qualityCheckPassed: grn.qualityCheckPassed ?? null,
      orderSearch: grn.orderNumber || ''
    };
    this.formLineItems = (grn.lineItems || []).map((li: any) => ({
      ...li,
      fromOrder: true,
      orderedQuantity: li.orderedQuantity || li.orderedQty || 0,
      previouslyReceived: li.previouslyReceived || 0,
      receivedQuantity: li.receivedQuantity || li.receivedQty || 0,
      rejectedQuantity: li.rejectedQuantity || li.rejectedQty || 0,
      condition: li.condition || 'good',
      notes: li.notes || ''
    }));
    this.currentView.set('capture');
  }

  openCaptureForm() {
    this.editMode.set(false);
    this.grnForm = {
      orderSearch: '',
      orderNumber: '',
      orderId: '',
      vendorName: '',
      storeId: '',
      binLocation: '',
      deliveryNoteNumber: '',
      deliveryNoteDate: '',
      dateReceived: new Date().toISOString().split('T')[0],
      directDelivery: false,
      comments: '',
      qualityCheckPassed: null
    };
    this.formLineItems = [];
    this.currentView.set('capture');
  }

  searchOrder() {
    if (!this.grnForm.orderSearch) return;
    this.loading.set(true);
    this.http.get<any>(`${this.apiUrl}/grn/by-order/${encodeURIComponent(this.grnForm.orderSearch)}`).subscribe({
      next: (res) => {
        const data = res?.data || res;
        this.grnForm.orderNumber = data.orderNumber || this.grnForm.orderSearch;
        this.grnForm.orderId = data.orderId || data.id || '';
        this.grnForm.vendorName = data.vendorName || data.supplier?.name || '';
        this.grnForm.department = data.department || '';
        this.formLineItems = (data.lineItems || []).map((li: any) => ({
          description: li.description,
          orderedQuantity: li.quantity || li.orderedQuantity || 0,
          previouslyReceived: li.previouslyReceived || 0,
          receivedQuantity: 0,
          rejectedQuantity: 0,
          unitOfMeasure: li.unitOfMeasure || 'each',
          condition: 'good',
          notes: '',
          fromOrder: true,
          lineId: li.id
        }));
        this.loading.set(false);
        this.showNotification('Order loaded successfully');
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err?.error?.message || 'Order not found or not eligible for GRN';
        this.showNotification(msg);
      }
    });
  }

  addLineItem() {
    this.formLineItems.push({
      description: '',
      orderedQuantity: 0,
      previouslyReceived: 0,
      receivedQuantity: 0,
      rejectedQuantity: 0,
      unitOfMeasure: 'each',
      condition: 'good',
      notes: '',
      fromOrder: false
    });
  }

  removeLineItem(index: number) {
    this.formLineItems.splice(index, 1);
  }

  private unwrapGrn(res: any): any {
    return res?.data?.grn || res?.data || res?.grn || res;
  }

  saveGrn() {
    this.saving.set(true);
    const payload = {
      ...this.grnForm,
      lineItems: this.formLineItems
    };

    const request = this.editMode()
      ? this.http.put<any>(`${this.apiUrl}/grn/${this.grnForm.id}`, payload)
      : this.http.post<any>(`${this.apiUrl}/grn`, payload);

    request.subscribe({
      next: (res) => {
        this.saving.set(false);
        this.showNotification(this.editMode() ? 'GRN updated successfully' : 'GRN created successfully');
        this.backToList();
        this.loadGrns();
        this.loadSummary();
      },
      error: (err) => {
        this.saving.set(false);
        this.showNotification('Error saving GRN: ' + (err.error?.message || 'Unknown error'));
      }
    });
  }

  saveAndSubmit() {
    this.saving.set(true);
    const payload = {
      ...this.grnForm,
      lineItems: this.formLineItems
    };

    const saveRequest = this.editMode()
      ? this.http.put<any>(`${this.apiUrl}/grn/${this.grnForm.id}`, payload)
      : this.http.post<any>(`${this.apiUrl}/grn`, payload);

    saveRequest.subscribe({
      next: (res) => {
        const grn = this.unwrapGrn(res);
        const id = grn.id || this.grnForm.id;
        this.http.post<any>(`${this.apiUrl}/grn/${id}/submit`, {}).subscribe({
          next: () => {
            this.saving.set(false);
            this.showNotification('GRN submitted successfully');
            this.backToList();
            this.loadGrns();
            this.loadSummary();
          },
          error: () => {
            this.saving.set(false);
            this.showNotification('GRN saved but submission failed');
            this.backToList();
            this.loadGrns();
          }
        });
      },
      error: (err) => {
        this.saving.set(false);
        this.showNotification('Error saving GRN: ' + (err.error?.message || 'Unknown error'));
      }
    });
  }

  submitGrn(id: string) {
    this.http.post<any>(`${this.apiUrl}/grn/${id}/submit`, {}).subscribe({
      next: () => {
        this.showNotification('GRN submitted for approval');
        this.loadGrns();
        this.loadSummary();
        if (this.selectedGrn()?.id === id) {
          this.viewGrn({ id });
        }
      },
      error: () => this.showNotification('Failed to submit GRN')
    });
  }

  approveGrn(id: string) {
    this.http.post<any>(`${this.apiUrl}/grn/${id}/approve`, {}).subscribe({
      next: () => {
        this.showNotification('GRN approved successfully');
        this.loadGrns();
        this.loadSummary();
        if (this.selectedGrn()?.id === id) {
          this.viewGrn({ id });
        }
      },
      error: () => this.showNotification('Failed to approve GRN')
    });
  }

  performQualityCheck(id: any, passed: boolean) {
    const notes = passed ? '' : prompt('Please provide a reason for the quality check failure:') || '';
    if (!passed && !notes) {
      this.showNotification('Quality check failure requires a reason');
      return;
    }
    this.http.put<any>(`${this.apiUrl}/grn/${id}`, {
      qualityCheckPassed: passed,
      qualityCheckPerformed: true,
      qualityNotes: passed ? 'Quality inspection passed - goods meet specifications' : notes
    }).subscribe({
      next: () => {
        this.showNotification(passed ? 'Quality check passed' : 'Quality check failed');
        this.loadGrns();
        this.loadSummary();
        this.viewGrn({ id });
      },
      error: () => this.showNotification('Failed to update quality check')
    });
  }

  voidGrn(id: string) {
    if (!confirm('Are you sure you want to void this GRN? This action cannot be undone.')) return;
    this.http.post<any>(`${this.apiUrl}/grn/${id}/void`, {}).subscribe({
      next: () => {
        this.showNotification('GRN voided successfully');
        this.loadGrns();
        this.loadSummary();
        if (this.selectedGrn()?.id === id) {
          this.viewGrn({ id });
        }
      },
      error: () => this.showNotification('Failed to void GRN')
    });
  }

  printPdf(id: string) {
    window.open(`${this.apiUrl}/grn/${id}/pdf`, '_blank');
  }

  notifyInventory(id: string) {
    this.http.post<any>(`${this.apiUrl}/grn/${id}/inventory-notify`, {}).subscribe({
      next: () => this.showNotification('Inventory notified successfully'),
      error: () => this.showNotification('Failed to notify inventory')
    });
  }

  createInvoiceFromGrn(grn: any) {
    this.loading.set(true);
    this.http.get<any>(`${this.apiUrl}/orders/${grn.orderId}`).subscribe({
      next: (orderRes) => {
        const order = orderRes?.data || orderRes;
        const orderLines: any[] = order?.lineItems || [];
        const grnLines: any[] = grn.lineItems || [];
        const lineItems = grnLines
          .map((li: any, i: number) => {
            const matchedOrder = orderLines.find((ol: any) =>
              (li.lineId && ol.lineId && li.lineId === ol.lineId) ||
              (li.id && ol.id && li.id === ol.id)
            ) || orderLines[i] || {};
            const unitPrice = matchedOrder.unitPrice?.amount ?? 0;
            const qty = li.receivedQuantity ?? li.orderedQuantity ?? 0;
            if (qty <= 0) return null;
            const totalPrice = unitPrice * qty;
            const vatAmount = totalPrice * 0.15;
            return {
              description: li.description || matchedOrder.description || 'Line item',
              quantity: qty,
              unitOfMeasure: li.unitOfMeasure || matchedOrder.unitOfMeasure || 'each',
              unitPrice: { amount: unitPrice, currency: 'ZAR' },
              totalPrice: { amount: totalPrice, currency: 'ZAR' },
              vatRate: 15,
              vatAmount: { amount: vatAmount, currency: 'ZAR' }
            };
          })
          .filter((li: any) => li !== null);

        if (lineItems.length === 0) {
          this.loading.set(false);
          this.showNotification('No invoiceable line items found (all quantities are zero)');
          return;
        }

        const subtotal = lineItems.reduce((sum: number, li: any) => sum + (li.totalPrice?.amount || 0), 0);
        const vatTotal = subtotal * 0.15;

        const invoicePayload = {
          invoiceType: 'regular',
          supplierName: grn.vendorName || order?.supplierName || order?.supplier?.name || '',
          supplierId: order?.supplierId || '',
          orderId: grn.orderId,
          orderNumber: grn.orderNumber,
          grnId: grn.id,
          grnNumber: grn.grnNumber,
          department: grn.department || order?.department || '',
          financialYear: grn.financialYear || '2025/2026',
          invoiceDate: new Date().toISOString().split('T')[0],
          receivedDate: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
          supplierInvoiceNumber: '',
          notes: `Invoice created from ${grn.grnNumber} for ${grn.orderNumber}`,
          lineItems,
          subtotal: { amount: subtotal, currency: 'ZAR' },
          vatAmount: { amount: vatTotal, currency: 'ZAR' },
          totalAmount: { amount: subtotal + vatTotal, currency: 'ZAR' }
        };

        this.http.post<any>(`${this.apiUrl}/invoices`, invoicePayload).subscribe({
          next: (inv) => {
            this.loading.set(false);
            const invoiceData = inv?.data || inv;
            this.showNotification(`Invoice ${invoiceData.referenceNumber || ''} created from ${grn.grnNumber}. Navigating to Invoices...`);
            setTimeout(() => this.router.navigate(['/invoices']), 1500);
          },
          error: () => {
            this.loading.set(false);
            this.showNotification('Failed to create invoice');
          }
        });
      },
      error: () => {
        this.loading.set(false);
        this.showNotification('Failed to load order data for invoice creation');
      }
    });
  }

  notifyAssets(id: string) {
    this.http.post<any>(`${this.apiUrl}/grn/${id}/asset-notify`, {}).subscribe({
      next: () => this.showNotification('Assets register notified'),
      error: () => this.showNotification('Failed to notify assets')
    });
  }

  navigateTo(view: string) {
    this.currentView.set(view as any);
    if (view === 'list') {
      this.loadGrns();
    }
    if (view === 'analytics') {
      this.analyticsService.getGrnAnalytics().subscribe(d => {
        this.grnAnalytics.set(d);
        setTimeout(() => this.renderGrnCharts(), 100);
      });
    }
  }

  backToList() {
    this.currentView.set('list');
    this.selectedGrn.set(null);
    this.editMode.set(false);
    this.budgetImpact.set(null);
    this.correspondence.set([]);
  }

  changePage(page: number) {
    this.currentPage.set(page);
    this.loadGrns();
  }

  clearFilters() {
    this.searchQuery = '';
    this.filterStatus = '';
    this.filterGrnNumber = '';
    this.filterOrderNumber = '';
    this.filterVendorName = '';
    this.filterStore = '';
    this.filterFinancialYear = '';
    this.currentPage.set(1);
    this.loadGrns();
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      draft: 'Draft',
      submitted: 'Submitted',
      pending: 'Pending',
      approved: 'Approved',
      voided: 'Voided',
      partial: 'Partial'
    };
    return labels[status] || status;
  }

  formatDate(date: string): string {
    if (!date) return '—';
    try {
      return new Date(date).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch { return date; }
  }

  formatCurrency(value: number): string {
    if (typeof value === 'object' && value !== null) value = (value as any).amount || 0;
    return 'R ' + (value || 0).toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  formatCurrencyFull(value: number): string {
    if (typeof value === 'object' && value !== null) value = (value as any).amount || 0;
    return 'R ' + (value || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  showNotification(msg: string) {
    this.notification.set(msg);
    setTimeout(() => this.notification.set(''), 4000);
  }
}
