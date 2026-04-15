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
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { environment } from '../../../environments/environment';
import { DashboardService } from '../../core/services/dashboard.service';

@Component({
  selector: 'app-informal-tenders',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatCardModule, MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatDatepickerModule, MatNativeDateModule, MatSelectModule, MatMenuModule, MatTooltipModule, MatTabsModule, MatChipsModule, MatBadgeModule, MatProgressBarModule],
  templateUrl: './informal-tenders.component.html',
  styleUrl: './informal-tenders.component.scss'
})
export class InformalTendersComponent implements OnInit {
  private http = inject(HttpClient);
  private dashboardService = inject(DashboardService);

  mainView = signal<'dashboard' | 'list' | 'create' | 'detail' | 'reports'>('dashboard');
  iftAiInsights = signal<any[]>([]);
  selectedIft = signal<any>(null);
  detailTab = signal<string>('information');

  ifts = signal<any[]>([]);
  recentIfts = signal<any[]>([]);
  totalIfts = signal(0);
  currentPage = signal(1);
  pageSize = signal(20);
  totalPages = signal(1);

  summary = signal<any>({});
  config = signal<any>(null);
  totalValue = signal(0);
  avgTurnaround = signal(0);

  exceptions = signal<any[]>([]);
  documents = signal<any[]>([]);
  vendorSearchResults = signal<any[]>([]);
  lineItems = signal<any[]>([]);

  saving = signal(false);
  notification = signal('');

  searchQuery = '';
  filterStatus = '';
  filterDepartment = '';
  filterDateFrom = '';
  filterDateTo = '';
  filterValueMin: number | null = null;
  filterValueMax: number | null = null;
  dashboardFilter = '';

  exceptionFilterStatus = '';
  exceptionFilterFrom = '';
  exceptionFilterTo = '';

  vendorSearchQuery = '';
  lessThanThreeReason = '';

  statuses = ['draft', 'saved', 'published', 'closed', 'adjudicated', 'awarded', 'pending_approval', 'approved', 'completed', 'voided'];

  departments = [
    'Infrastructure and Engineering', 'Water & Sanitation', 'Corporate Services',
    'Community Services', 'Finance', 'Planning & Development', 'Electricity', 'Public Safety'
  ];

  provinces = [
    'Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Free State',
    'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape'
  ];

  pipelineSteps = [
    { key: 'draft', label: 'Draft', icon: 'edit_note' },
    { key: 'published', label: 'Published', icon: 'campaign' },
    { key: 'closed', label: 'Closed', icon: 'lock' },
    { key: 'adjudicated', label: 'Adjudicated', icon: 'gavel' },
    { key: 'awarded', label: 'Awarded', icon: 'emoji_events' },
    { key: 'approved', label: 'Approved', icon: 'verified' },
    { key: 'completed', label: 'Completed', icon: 'check_circle' }
  ];

  iftForm: any = {};
  lineItemForm: any = { description: '', quantity: 0, unit: 'each', unitPrice: 0 };
  responseForm: any = { supplierId: '', costPerUnit: null, totalCost: null, taxAmount: null, compliant: true, nonCompliantReason: '' };
  adjudicationForm: any = { recommendedVendor: '', notes: '', reasonForNotReceivingThreeQuotes: '' };
  docForm: any = { type: '', name: '' };

  pageStart = computed(() => {
    const total = this.totalIfts();
    if (total === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize() + 1;
  });

  pageEnd = computed(() => {
    return Math.min(this.currentPage() * this.pageSize(), this.totalIfts());
  });

  ngOnInit() {
    this.loadConfig();
    this.loadIfts();
    this.loadExceptions();
    this.dashboardService.getInformalTenderAiInsights().subscribe(d => this.iftAiInsights.set(d.insights || []));
  }

  switchView(view: 'dashboard' | 'list' | 'create' | 'detail' | 'reports') {
    this.mainView.set(view);
    if (view === 'dashboard') {
      this.loadIfts();
    }
    if (view === 'create') {
      this.resetIftForm();
    }
    if (view === 'reports') {
      this.loadExceptions();
    }
  }

  loadConfig() {
    this.http.get<any>(`${environment.apiUrl}/informal-tenders/config`).subscribe({
      next: (data) => this.config.set(data.config || data),
      error: () => this.config.set(null)
    });
  }

  loadIfts() {
    const params: any = { page: this.currentPage(), pageSize: this.pageSize() };
    if (this.searchQuery) params.search = this.searchQuery;
    if (this.filterStatus) params.status = this.filterStatus;
    if (this.filterDateFrom) params.closingFromDate = this.filterDateFrom;
    if (this.filterDateTo) params.closingToDate = this.filterDateTo;

    this.http.get<any>(`${environment.apiUrl}/informal-tenders`, { params }).subscribe({
      next: (res) => {
        this.ifts.set(res.data || []);
        this.totalIfts.set(res.total || 0);
        this.totalPages.set(res.totalPages || 1);
        this.summary.set(res.summary || {});
        this.recentIfts.set((res.data || []).slice(0, 5));

        const allIfts = res.data || [];
        this.totalValue.set(allIfts.reduce((sum: number, t: any) => sum + (t.estimatedValue?.amount || 0), 0));

        const completed = allIfts.filter((t: any) => t.award?.awardedDate && t.createdDate);
        if (completed.length) {
          const totalDays = completed.reduce((sum: number, t: any) => {
            const diff = new Date(t.award.awardedDate).getTime() - new Date(t.createdDate).getTime();
            return sum + Math.ceil(diff / (1000 * 60 * 60 * 24));
          }, 0);
          this.avgTurnaround.set(Math.round(totalDays / completed.length));
        }
      },
      error: () => {
        this.ifts.set([]);
        this.totalIfts.set(0);
      }
    });
  }

  loadExceptions() {
    const params: any = {};
    if (this.exceptionFilterStatus) params.status = this.exceptionFilterStatus;
    if (this.exceptionFilterFrom) params.closingFromDate = this.exceptionFilterFrom;
    if (this.exceptionFilterTo) params.closingToDate = this.exceptionFilterTo;

    this.http.get<any>(`${environment.apiUrl}/informal-tenders/reports/exception`, { params }).subscribe({
      next: (res) => this.exceptions.set(res.exceptions || []),
      error: () => this.exceptions.set([])
    });
  }

  viewIft(ift: any) {
    this.http.get<any>(`${environment.apiUrl}/informal-tenders/${ift.id}`).subscribe({
      next: (data) => {
        this.selectedIft.set(data);
        this.detailTab.set('information');
        this.mainView.set('detail');
        this.adjudicationForm = { recommendedVendor: data.adjudication?.recommendedVendor || '', notes: '', reasonForNotReceivingThreeQuotes: '' };
      },
      error: () => this.showNotification('Failed to load IFT details')
    });
  }

  resetIftForm() {
    this.iftForm = {
      description: '',
      requisitionId: '',
      requisitionNumber: '',
      estimatedValue: null,
      vendorProvince: '',
      vendorCity: '',
      openingDate: new Date().toISOString().substring(0, 10),
      closingDate: '',
      closingTime: '12:00',
      serviceContract: false,
      comments: ''
    };
    this.lineItems.set([]);
  }

  addLineItem() {
    if (!this.lineItemForm.description || !this.lineItemForm.quantity) return;
    const items = [...this.lineItems()];
    items.push({
      id: 'LI' + Date.now(),
      description: this.lineItemForm.description,
      quantity: this.lineItemForm.quantity,
      unit: this.lineItemForm.unit,
      unitPrice: this.lineItemForm.unitPrice || 0
    });
    this.lineItems.set(items);
    this.lineItemForm = { description: '', quantity: 0, unit: 'each', unitPrice: 0 };
  }

  removeLineItem(id: string) {
    this.lineItems.set(this.lineItems().filter(i => i.id !== id));
  }

  getLineItemsTotal(): number {
    return this.lineItems().reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  }

  saveIftDraft() {
    if (!this.iftForm.description || !this.iftForm.estimatedValue) {
      this.showNotification('Description and estimated value are required');
      return;
    }
    this.saving.set(true);
    const payload = {
      requisitionId: this.iftForm.requisitionId || this.iftForm.requisitionNumber,
      requisitionNumber: this.iftForm.requisitionNumber,
      description: this.iftForm.description,
      estimatedValue: this.iftForm.estimatedValue,
      vendorProvince: this.iftForm.vendorProvince,
      vendorCity: this.iftForm.vendorCity,
      openingDate: this.iftForm.openingDate,
      closingDate: this.iftForm.closingDate,
      closingTime: this.iftForm.closingTime,
      serviceContract: this.iftForm.serviceContract,
      comments: this.iftForm.comments
    };
    this.http.post<any>(`${environment.apiUrl}/informal-tenders`, payload).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.showNotification('Informal tender created successfully');
        this.selectedIft.set(res.tender);
        this.mainView.set('detail');
        this.detailTab.set('information');
        this.loadIfts();
      },
      error: (err) => {
        this.saving.set(false);
        this.showNotification(err.error?.error || 'Failed to create IFT');
      }
    });
  }

  publishIft(ift: any) {
    if (!window.confirm('Publish this informal tender to vendors?')) return;
    this.saving.set(true);
    this.http.post<any>(`${environment.apiUrl}/informal-tenders/${ift.id}/publish`, {}).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.showNotification('IFT published and vendors notified');
        if (this.selectedIft()) this.selectedIft.set(res.tender);
        this.loadIfts();
      },
      error: (err) => {
        this.saving.set(false);
        this.showNotification(err.error?.error || 'Failed to publish');
      }
    });
  }

  closeIft(ift: any) {
    if (!window.confirm('Close this IFT for responses?')) return;
    this.saving.set(true);
    this.http.put<any>(`${environment.apiUrl}/informal-tenders/${ift.id}`, { status: 'closed' }).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.showNotification('IFT closed for responses');
        if (this.selectedIft()) this.selectedIft.set(res.tender);
        this.loadIfts();
      },
      error: (err) => {
        this.saving.set(false);
        this.showNotification(err.error?.error || 'Failed to close IFT');
      }
    });
  }

  awardIft(ift: any) {
    if (!window.confirm('Award this IFT to the recommended vendor?')) return;
    this.saving.set(true);
    this.http.post<any>(`${environment.apiUrl}/informal-tenders/${ift.id}/award`, {}).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.showNotification('IFT awarded successfully');
        if (this.selectedIft()) this.selectedIft.set(res.tender);
        this.loadIfts();
      },
      error: (err) => {
        this.saving.set(false);
        this.showNotification(err.error?.error || 'Failed to award');
      }
    });
  }

  approveIft(ift: any) {
    const comments = window.prompt('Approval comments:') || '';
    this.saving.set(true);
    this.http.post<any>(`${environment.apiUrl}/informal-tenders/${ift.id}/approve`, { action: 'approved', comments }).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.showNotification('IFT approved');
        if (this.selectedIft()) this.selectedIft.set(res.tender);
        this.loadIfts();
      },
      error: (err) => {
        this.saving.set(false);
        this.showNotification(err.error?.error || 'Failed to approve');
      }
    });
  }

  voidIft(ift: any) {
    const reason = window.prompt('Reason for voiding:');
    if (!reason) return;
    this.saving.set(true);
    this.http.post<any>(`${environment.apiUrl}/informal-tenders/${ift.id}/void`, { voidReason: reason }).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.showNotification('IFT voided');
        if (this.selectedIft()) this.selectedIft.set(res.tender);
        this.loadIfts();
      },
      error: (err) => {
        this.saving.set(false);
        this.showNotification(err.error?.error || 'Failed to void');
      }
    });
  }

  autoRotationalSelect() {
    const ift = this.selectedIft();
    if (!ift) return;
    this.saving.set(true);
    this.http.post<any>(`${environment.apiUrl}/informal-tenders/${ift.id}/select-vendors`, { autoRotational: true }).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.selectedIft.set(res.tender);
        this.showNotification(`${res.vendorsSelected} vendors selected via rotational database`);
      },
      error: (err) => {
        this.saving.set(false);
        this.showNotification(err.error?.error || 'Failed to select vendors');
      }
    });
  }

  searchVendors() {
    if (!this.vendorSearchQuery) return;
    this.http.get<any>(`${environment.apiUrl}/suppliers`, { params: { search: this.vendorSearchQuery, pageSize: 10 } }).subscribe({
      next: (res) => this.vendorSearchResults.set(res.data || []),
      error: () => this.vendorSearchResults.set([])
    });
  }

  addVendorManually(vendor: any) {
    const ift = this.selectedIft();
    if (!ift) return;
    const existing = ift.rotationalVendorsInvited?.map((v: any) => v.supplierId) || [];
    const supplierIds = [...existing, vendor.id];
    this.saving.set(true);
    this.http.post<any>(`${environment.apiUrl}/informal-tenders/${ift.id}/select-vendors`, { supplierIds }).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.selectedIft.set(res.tender);
        this.vendorSearchResults.set([]);
        this.vendorSearchQuery = '';
        this.showNotification(`Vendor ${vendor.name} added`);
      },
      error: (err) => {
        this.saving.set(false);
        this.showNotification(err.error?.error || 'Failed to add vendor');
      }
    });
  }

  recordVendorResponse() {
    const ift = this.selectedIft();
    if (!ift || !this.responseForm.supplierId) return;
    const vendor = ift.rotationalVendorsInvited?.find((v: any) => v.supplierId === this.responseForm.supplierId);
    this.saving.set(true);
    this.http.post<any>(`${environment.apiUrl}/informal-tenders/${ift.id}/vendor-response`, {
      supplierId: this.responseForm.supplierId,
      supplierName: vendor?.supplierName || '',
      costPerUnit: this.responseForm.costPerUnit,
      totalCost: this.responseForm.totalCost,
      taxAmount: this.responseForm.taxAmount,
      compliant: this.responseForm.compliant,
      nonCompliantReason: this.responseForm.nonCompliantReason
    }).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.selectedIft.set(res.tender);
        this.responseForm = { supplierId: '', costPerUnit: null, totalCost: null, taxAmount: null, compliant: true, nonCompliantReason: '' };
        this.showNotification('Vendor response recorded');
      },
      error: (err) => {
        this.saving.set(false);
        this.showNotification(err.error?.error || 'Failed to record response');
      }
    });
  }

  markNoResponse() {
    const ift = this.selectedIft();
    if (!ift || !this.responseForm.supplierId) return;
    const vendor = ift.rotationalVendorsInvited?.find((v: any) => v.supplierId === this.responseForm.supplierId);
    this.saving.set(true);
    this.http.post<any>(`${environment.apiUrl}/informal-tenders/${ift.id}/vendor-response`, {
      supplierId: this.responseForm.supplierId,
      supplierName: vendor?.supplierName || '',
      totalCost: 0,
      compliant: false,
      nonCompliantReason: 'No response received by closing date'
    }).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.selectedIft.set(res.tender);
        this.responseForm = { supplierId: '', costPerUnit: null, totalCost: null, taxAmount: null, compliant: true, nonCompliantReason: '' };
        this.showNotification('Marked as no response');
      },
      error: (err) => {
        this.saving.set(false);
        this.showNotification(err.error?.error || 'Failed');
      }
    });
  }

  performAdjudication() {
    const ift = this.selectedIft();
    if (!ift || !this.adjudicationForm.recommendedVendor) return;
    this.saving.set(true);
    this.http.post<any>(`${environment.apiUrl}/informal-tenders/${ift.id}/adjudicate`, {
      recommendedVendor: this.adjudicationForm.recommendedVendor,
      adjudicationNotes: this.adjudicationForm.notes,
      reasonForNotReceivingThreeQuotes: this.adjudicationForm.reasonForNotReceivingThreeQuotes || undefined
    }).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.selectedIft.set(res.tender);
        this.showNotification('Adjudication completed');
        this.loadIfts();
      },
      error: (err) => {
        this.saving.set(false);
        this.showNotification(err.error?.error || 'Failed to adjudicate');
      }
    });
  }

  uploadDocument() {
    if (!this.docForm.type || !this.docForm.name) return;
    const docs = [...this.documents()];
    docs.push({
      id: 'DOC' + Date.now(),
      type: this.docForm.type,
      name: this.docForm.name,
      uploadedDate: new Date().toISOString()
    });
    this.documents.set(docs);
    this.docForm = { type: '', name: '' };
    this.showNotification('Document added');
  }

  deleteDocument(doc: any) {
    if (!window.confirm(`Delete document "${doc.name}"?`)) return;
    this.documents.set(this.documents().filter(d => d.id !== doc.id));
    this.showNotification('Document removed');
  }

  filterByStatus(status: string) {
    this.filterStatus = this.filterStatus === status ? '' : status;
    this.currentPage.set(1);
    this.loadIfts();
  }

  filterDashboard(status: string) {
    this.dashboardFilter = this.dashboardFilter === status ? '' : status;
  }

  applyFilters() {
    this.currentPage.set(1);
    this.loadIfts();
  }

  clearFilters() {
    this.searchQuery = '';
    this.filterStatus = '';
    this.filterDepartment = '';
    this.filterDateFrom = '';
    this.filterDateTo = '';
    this.filterValueMin = null;
    this.filterValueMax = null;
    this.currentPage.set(1);
    this.loadIfts();
  }

  changePage(page: number) {
    this.currentPage.set(page);
    this.loadIfts();
  }

  getPipelineCount(status: string): number {
    const s = this.summary();
    if (status === 'draft') return (s.draft || 0);
    if (status === 'published') return (s.published || 0);
    if (status === 'adjudicated') return (s.adjudicated || 0);
    if (status === 'awarded' || status === 'approved' || status === 'completed') return Math.max(0, Math.floor((s.awarded || 0) / 3));
    if (status === 'voided') return (s.voided || 0);
    return 0;
  }

  getVendorResponseStatus(supplierId: string): string {
    const ift = this.selectedIft();
    if (!ift) return 'awaiting';
    const resp = ift.vendorResponses?.find((r: any) => r.supplierId === supplierId);
    return resp?.responseStatus || 'awaiting';
  }

  isLowestCompliantBid(resp: any): boolean {
    const ift = this.selectedIft();
    if (!ift || !resp.compliant || resp.responseStatus !== 'responded') return false;
    const compliant = ift.vendorResponses.filter((r: any) => r.compliant && r.responseStatus === 'responded' && r.totalCost != null);
    if (!compliant.length) return false;
    const lowest = Math.min(...compliant.map((r: any) => r.totalCost));
    return resp.totalCost === lowest;
  }

  getLowestCompliantBidAmount(): number {
    const ift = this.selectedIft();
    if (!ift) return 0;
    const compliant = ift.vendorResponses?.filter((r: any) => r.compliant && r.responseStatus === 'responded' && r.totalCost != null) || [];
    if (!compliant.length) return 0;
    return Math.min(...compliant.map((r: any) => r.totalCost));
  }

  getCompliantResponseCount(): number {
    const ift = this.selectedIft();
    if (!ift) return 0;
    return (ift.vendorResponses || []).filter((r: any) => r.compliant && r.responseStatus === 'responded').length;
  }

  getNoResponseVendors(): any[] {
    const ift = this.selectedIft();
    if (!ift) return [];
    return (ift.rotationalVendorsInvited || []).filter((v: any) =>
      !(ift.vendorResponses || []).some((r: any) => r.supplierId === v.supplierId)
    );
  }

  isStepCompleted(key: string): boolean {
    const order = ['draft', 'published', 'closed', 'adjudicated', 'awarded', 'approved', 'completed'];
    const ift = this.selectedIft();
    if (!ift) return false;
    const currentIdx = order.indexOf(ift.status);
    const stepIdx = order.indexOf(key);
    return stepIdx < currentIdx;
  }

  isStepCurrent(key: string): boolean {
    return this.selectedIft()?.status === key;
  }

  isStepActive(key: string): boolean {
    return this.isStepCompleted(key) || this.isStepCurrent(key);
  }

  selectDetailTabFromStep(key: string) {
    const map: Record<string, string> = {
      draft: 'information', published: 'vendors', closed: 'responses',
      adjudicated: 'adjudication', awarded: 'information', approved: 'information', completed: 'information'
    };
    this.detailTab.set(map[key] || 'information');
  }

  getDaysRemaining(ift: any): number | null {
    if (!ift.closingDate) return null;
    const diff = new Date(ift.closingDate).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
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
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      draft: 'Draft', saved: 'Saved', published: 'Published', closed: 'Closed',
      adjudicated: 'Adjudicated', awarded: 'Awarded', pending_approval: 'Pending Approval',
      approved: 'Approved', completed: 'Completed', voided: 'Voided'
    };
    return labels[status] || status;
  }

  formatDocType(type: string): string {
    return (type || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  getDocTypeBadgeColor(type: string): string {
    const colors: Record<string, string> = {
      quotation: '#e3f2fd', specification: '#f3e5f5', evaluation_report: '#fce4ec',
      award_letter: '#e0f2f1', correspondence: '#fff8e1', other: '#f5f5f5'
    };
    return colors[type] || '#f5f5f5';
  }

  showNotification(msg: string) {
    this.notification.set(msg);
    setTimeout(() => this.notification.set(''), 4000);
  }
}
