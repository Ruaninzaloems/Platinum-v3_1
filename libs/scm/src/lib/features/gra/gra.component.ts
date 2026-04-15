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
import { environment } from '../../environment';

@Component({
  selector: 'app-gra',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatCardModule, MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatDatepickerModule, MatNativeDateModule, MatSelectModule, MatMenuModule, MatTooltipModule, MatTabsModule, MatChipsModule],
  templateUrl: './gra.component.html',
  styleUrl: './gra.component.scss'
})
export class GraComponent implements OnInit {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  currentView = signal<string>('list');
  activeTab = signal<string>('returns');
  returns = signal<any[]>([]);
  gras = signal<any[]>([]);
  selectedReturn = signal<any>(null);
  selectedGra = signal<any>(null);
  summary = signal<any>({});
  approvedReturns = signal<any[]>([]);
  notification = signal<string>('');
  loading = signal(false);
  saving = signal(false);
  totalPages = signal(1);
  currentPage = signal(1);
  pageSize = signal(20);
  graTotalPages = signal(1);
  graCurrentPage = signal(1);
  searchQuery = '';
  filterStatus = '';
  showFilters = signal(false);

  filterReturnNumber = '';
  filterGrnNumber = '';
  filterOrderNumber = '';
  filterVendorName = '';

  graSearchQuery = '';
  filterGraNumber = '';
  filterGraReturnNumber = '';
  filterDebitNoteNumber = '';

  returnForm: any = {};
  returnFormLines: any[] = [];
  graForm: any = {};

  ngOnInit() {
    this.loadSummary();
    this.loadReturns();
    this.loadGras();
  }

  loadSummary() {
    this.http.get<any>(`${this.apiUrl}/gra/dashboard/summary`).subscribe({
      next: (data) => this.summary.set(data),
      error: () => this.summary.set({})
    });
  }

  loadReturns() {
    this.loading.set(true);
    const params: any = { page: this.currentPage(), pageSize: this.pageSize() };
    if (this.searchQuery) params.search = this.searchQuery;
    if (this.filterStatus) params.status = this.filterStatus;
    if (this.filterReturnNumber) params.returnNumber = this.filterReturnNumber;
    if (this.filterGrnNumber) params.grnNumber = this.filterGrnNumber;
    if (this.filterOrderNumber) params.orderNumber = this.filterOrderNumber;
    if (this.filterVendorName) params.vendorName = this.filterVendorName;

    const qs = Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v as string)}`).join('&');
    this.http.get<any>(`${this.apiUrl}/gra/returns?${qs}`).subscribe({
      next: (data) => {
        const rr = data?.data || data?.returns; this.returns.set(Array.isArray(rr) ? rr : []);
        this.totalPages.set(data.totalPages || data.pages || 1);
        this.loading.set(false);
      },
      error: () => { this.returns.set([]); this.loading.set(false); }
    });
  }

  loadGras() {
    const params: any = { page: this.graCurrentPage(), pageSize: this.pageSize() };
    if (this.graSearchQuery) params.search = this.graSearchQuery;
    if (this.filterGraNumber) params.graNumber = this.filterGraNumber;
    if (this.filterGraReturnNumber) params.returnNumber = this.filterGraReturnNumber;
    if (this.filterDebitNoteNumber) params.debitNoteNumber = this.filterDebitNoteNumber;

    const qs = Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v as string)}`).join('&');
    this.http.get<any>(`${this.apiUrl}/gra?${qs}`).subscribe({
      next: (data) => {
        const gr = data?.data || data?.gras; this.gras.set(Array.isArray(gr) ? gr : []);
        this.graTotalPages.set(data.totalPages || data.pages || 1);
      },
      error: () => this.gras.set([])
    });
  }

  loadApprovedReturns() {
    this.http.get<any>(`${this.apiUrl}/gra/returns?status=approved&pageSize=100`).subscribe({
      next: (data) => { const r = data?.data || data?.returns; this.approvedReturns.set(Array.isArray(r) ? r : []); },
      error: () => this.approvedReturns.set([])
    });
  }

  switchTab(tab: string) {
    this.activeTab.set(tab);
    if (tab === 'returns') this.loadReturns();
    else this.loadGras();
  }

  viewReturn(ret: any) {
    this.loading.set(true);
    this.http.get<any>(`${this.apiUrl}/gra/returns/${ret.id}`).subscribe({
      next: (data) => {
        this.selectedReturn.set(data);
        this.currentView.set('return-detail');
        this.loading.set(false);
      },
      error: () => {
        this.selectedReturn.set(ret);
        this.currentView.set('return-detail');
        this.loading.set(false);
      }
    });
  }

  viewGra(gra: any) {
    this.loading.set(true);
    this.http.get<any>(`${this.apiUrl}/gra/${gra.id}`).subscribe({
      next: (data) => {
        this.selectedGra.set(data);
        this.currentView.set('gra-detail');
        this.loading.set(false);
      },
      error: () => {
        this.selectedGra.set(gra);
        this.currentView.set('gra-detail');
        this.loading.set(false);
      }
    });
  }

  openCaptureReturn() {
    this.returnForm = {
      grnSearch: '',
      grnId: '',
      grnNumber: '',
      orderId: '',
      orderNumber: '',
      vendorId: '',
      vendorName: '',
      returnDate: new Date().toISOString().split('T')[0],
      description: ''
    };
    this.returnFormLines = [];
    this.currentView.set('capture');
  }

  searchGrn() {
    if (!this.returnForm.grnSearch) return;
    this.loading.set(true);
    this.http.get<any>(`${this.apiUrl}/grn/by-number/${encodeURIComponent(this.returnForm.grnSearch)}`).subscribe({
      next: (data) => {
        this.returnForm.grnId = data.id;
        this.returnForm.grnNumber = data.grnNumber || this.returnForm.grnSearch;
        this.returnForm.orderId = data.orderId || '';
        this.returnForm.orderNumber = data.orderNumber || '';
        this.returnForm.vendorId = data.vendorId || '';
        this.returnForm.vendorName = data.vendorName || data.supplier?.name || '';
        this.returnFormLines = (data.lineItems || []).map((li: any) => ({
          description: li.description,
          grnQuantity: li.receivedQuantity || li.receivedQty || li.acceptedQuantity || 0,
          returnQuantity: 0,
          returnReason: '',
          lineId: li.id
        }));
        this.loading.set(false);
        this.showNotification('GRN loaded successfully');
      },
      error: () => {
        this.loading.set(false);
        this.showNotification('GRN not found');
      }
    });
  }

  saveReturn() {
    this.saving.set(true);
    const payload = {
      grnId: this.returnForm.grnId,
      orderId: this.returnForm.orderId,
      vendorId: this.returnForm.vendorId,
      vendorName: this.returnForm.vendorName,
      returnDate: this.returnForm.returnDate,
      description: this.returnForm.description,
      lineItems: this.returnFormLines.filter(l => l.returnQuantity > 0)
    };

    this.http.post<any>(`${this.apiUrl}/gra/returns`, payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.showNotification('Return created successfully');
        this.backToList();
        this.loadReturns();
        this.loadSummary();
      },
      error: (err) => {
        this.saving.set(false);
        this.showNotification('Error creating return: ' + (err.error?.message || 'Unknown error'));
      }
    });
  }

  saveAndSubmitReturn() {
    this.saving.set(true);
    const payload = {
      grnId: this.returnForm.grnId,
      orderId: this.returnForm.orderId,
      vendorId: this.returnForm.vendorId,
      vendorName: this.returnForm.vendorName,
      returnDate: this.returnForm.returnDate,
      description: this.returnForm.description,
      lineItems: this.returnFormLines.filter(l => l.returnQuantity > 0)
    };

    this.http.post<any>(`${this.apiUrl}/gra/returns`, payload).subscribe({
      next: (data) => {
        const id = data.id;
        this.http.post<any>(`${this.apiUrl}/gra/returns/${id}/submit`, {}).subscribe({
          next: () => {
            this.saving.set(false);
            this.showNotification('Return submitted successfully');
            this.backToList();
            this.loadReturns();
            this.loadSummary();
          },
          error: () => {
            this.saving.set(false);
            this.showNotification('Return saved but submission failed');
            this.backToList();
            this.loadReturns();
          }
        });
      },
      error: (err) => {
        this.saving.set(false);
        this.showNotification('Error creating return: ' + (err.error?.message || 'Unknown error'));
      }
    });
  }

  submitReturn(id: string) {
    this.http.post<any>(`${this.apiUrl}/gra/returns/${id}/submit`, {}).subscribe({
      next: () => {
        this.showNotification('Return submitted for approval');
        this.loadReturns();
        this.loadSummary();
        if (this.selectedReturn()?.id === id) this.viewReturn({ id });
      },
      error: () => this.showNotification('Failed to submit return')
    });
  }

  approveReturn(id: string) {
    this.http.post<any>(`${this.apiUrl}/gra/returns/${id}/approve`, {}).subscribe({
      next: () => {
        this.showNotification('Return approved successfully');
        this.loadReturns();
        this.loadSummary();
        if (this.selectedReturn()?.id === id) this.viewReturn({ id });
      },
      error: () => this.showNotification('Failed to approve return')
    });
  }

  declineReturn(id: string) {
    const comment = prompt('Reason for declining:');
    if (!comment) return;
    this.http.post<any>(`${this.apiUrl}/gra/returns/${id}/decline`, { comment }).subscribe({
      next: () => {
        this.showNotification('Return declined');
        this.loadReturns();
        this.loadSummary();
        if (this.selectedReturn()?.id === id) this.viewReturn({ id });
      },
      error: () => this.showNotification('Failed to decline return')
    });
  }

  openCreateGra() {
    this.graForm = { returnId: '', returnNumber: '', vendorName: '', description: '' };
    this.loadApprovedReturns();
    this.currentView.set('create-gra');
  }

  createGraFromReturn(ret: any) {
    this.graForm = { returnId: ret.id, returnNumber: ret.returnNumber, vendorName: ret.vendorName, description: '' };
    this.currentView.set('create-gra');
  }

  onReturnSelected() {
    const ret = this.approvedReturns().find(r => r.id === this.graForm.returnId);
    if (ret) {
      this.graForm.returnNumber = ret.returnNumber;
      this.graForm.vendorName = ret.vendorName;
    }
  }

  saveGra() {
    this.saving.set(true);
    this.http.post<any>(`${this.apiUrl}/gra`, {
      returnId: this.graForm.returnId,
      description: this.graForm.description
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.showNotification('GRA created successfully');
        this.activeTab.set('gras');
        this.backToList();
        this.loadGras();
        this.loadReturns();
        this.loadSummary();
      },
      error: (err) => {
        this.saving.set(false);
        this.showNotification('Error creating GRA: ' + (err.error?.message || 'Unknown error'));
      }
    });
  }

  printGraPdf(id: string) {
    window.open(`${this.apiUrl}/gra/${id}/pdf`, '_blank');
  }

  printDebitNote(id: string) {
    window.open(`${this.apiUrl}/gra/${id}/debit-note`, '_blank');
  }

  backToList() {
    this.currentView.set('list');
    this.selectedReturn.set(null);
    this.selectedGra.set(null);
  }

  changePage(page: number) {
    this.currentPage.set(page);
    this.loadReturns();
  }

  changeGraPage(page: number) {
    this.graCurrentPage.set(page);
    this.loadGras();
  }

  clearFilters() {
    this.searchQuery = '';
    this.filterStatus = '';
    this.filterReturnNumber = '';
    this.filterGrnNumber = '';
    this.filterOrderNumber = '';
    this.filterVendorName = '';
    this.currentPage.set(1);
    this.loadReturns();
  }

  clearGraFilters() {
    this.graSearchQuery = '';
    this.filterGraNumber = '';
    this.filterGraReturnNumber = '';
    this.filterDebitNoteNumber = '';
    this.graCurrentPage.set(1);
    this.loadGras();
  }

  getReturnStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      draft: 'Draft',
      pending_approval: 'Pending Approval',
      approved: 'Approved',
      declined: 'Declined',
      gra_created: 'GRA Created'
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
