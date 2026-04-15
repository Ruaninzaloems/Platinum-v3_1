import { Component, ChangeDetectionStrategy, signal, computed, inject, OnInit } from '@angular/core';
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
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatStepperModule } from '@angular/material/stepper';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';
import { environment } from '../../environment';

@Component({
  selector: 'app-supplier-portal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatIconModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatMenuModule,
    MatTooltipModule, MatTabsModule, MatChipsModule, MatBadgeModule,
    MatCheckboxModule, MatSlideToggleModule, MatProgressBarModule,
    MatStepperModule, MatDialogModule, MatExpansionModule, MatDividerModule
  ],
  templateUrl: './supplier-portal.component.html',
  styleUrl: './supplier-portal.component.scss'
})
export class SupplierPortalComponent implements OnInit {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  portalMode = signal<'supplier' | 'admin'>('supplier');
  currentView = signal('dashboard');
  supplierTab = signal<'dashboard' | 'orders' | 'contracts' | 'invoices' | 'payments' | 'documents' | 'notifications'>('dashboard');
  loading = signal(false);
  notification = signal('');
  demoSupplierId = signal('SUP001');
  demoSupplierOptions = [
    { id: 'SUP001', name: 'Mzansi Civil Engineering' },
    { id: 'SUP002', name: 'Ubuntu Office Solutions' },
    { id: 'SUP003', name: 'Kwena Cleaning Services' },
    { id: 'SUP004', name: 'Vukani Security Group' },
    { id: 'SUP005', name: 'Isivuno Agricultural Supplies' }
  ];

  summary = signal<any>({});
  suppliers = signal<any[]>([]);
  totalSuppliers = signal(0);
  totalPages = signal(1);
  currentPage = signal(1);
  pageSize = signal(10);
  pageSizeValue = 10;
  selectedSupplier = signal<any>(null);
  recentSuppliers = signal<any[]>([]);
  submissions = signal<any[]>([]);
  recentSubmissions = signal<any[]>([]);
  documentChecklist = signal<any[]>([]);
  documentChecklistSummary = signal<any>({ uploaded: 0, total: 0 });
  searchQuery = '';
  filterStatusValue = '';
  submissionSearch = '';
  submissionFilterStatus = '';

  supplierDashboard = signal<any>({});
  supplierOrders = signal<any>({ orders: [], summary: {} });
  supplierContracts = signal<any>({ contracts: [], summary: {} });
  supplierInvoices = signal<any>({ invoices: [], summary: {}, approvalPhases: [] });
  supplierPayments = signal<any>({ payments: [], summary: {} });
  supplierNotifications = signal<any>({ notifications: [], unreadCount: 0, urgentCount: 0 });
  supplierStatement = signal<any>({ lines: [], totals: {} });
  invoiceTimeline = signal<any>(null);
  selectedInvoiceDetail = signal<any>(null);
  selectedOrderDetail = signal<any>(null);
  selectedContractDetail = signal<any>(null);
  invoiceStatusFilter = '';
  showInvoiceUpload = signal(false);
  showResubmitDialog = signal(false);
  resubmitInvoice = signal<any>(null);

  uploadForm = {
    orderId: '', contractId: '', invoiceType: 'regular',
    supplierInvoiceNumber: '', estimatedAmount: 0,
    invoiceFile: { filename: '', fileSize: 0 },
    supportingDocuments: [] as any[]
  };
  resubmitDocs: any[] = [];

  private get supplierQuery(): string {
    return `supplierId=${this.demoSupplierId()}`;
  }

  ngOnInit() {
    this.loadSupplierDashboard();
    this.loadAdminDashboard();
  }

  changeDemoSupplier(id: string) {
    this.demoSupplierId.set(id);
    this.selectedInvoiceDetail.set(null);
    this.selectedOrderDetail.set(null);
    this.selectedContractDetail.set(null);
    this.invoiceTimeline.set(null);
    const tab = this.supplierTab();
    if (tab === 'dashboard') this.loadSupplierDashboard();
    else if (tab === 'orders') this.loadSupplierOrders();
    else if (tab === 'contracts') this.loadSupplierContracts();
    else if (tab === 'invoices') this.loadSupplierInvoices();
    else if (tab === 'payments') this.loadSupplierPayments();
    else if (tab === 'documents') this.loadSupplierStatement();
    else if (tab === 'notifications') this.loadSupplierNotifications();
  }

  switchMode(mode: 'supplier' | 'admin') {
    this.portalMode.set(mode);
    if (mode === 'supplier') {
      this.supplierTab.set('dashboard');
      this.loadSupplierDashboard();
    } else {
      this.currentView.set('dashboard');
      this.loadAdminDashboard();
    }
  }

  switchSupplierTab(tab: any) {
    this.supplierTab.set(tab);
    this.selectedInvoiceDetail.set(null);
    this.selectedOrderDetail.set(null);
    this.selectedContractDetail.set(null);
    this.showInvoiceUpload.set(false);
    if (tab === 'dashboard') this.loadSupplierDashboard();
    else if (tab === 'orders') this.loadSupplierOrders();
    else if (tab === 'contracts') this.loadSupplierContracts();
    else if (tab === 'invoices') this.loadSupplierInvoices();
    else if (tab === 'payments') this.loadSupplierPayments();
    else if (tab === 'documents') this.loadSupplierStatement();
    else if (tab === 'notifications') this.loadSupplierNotifications();
  }

  loadSupplierDashboard() {
    this.loading.set(true);
    this.http.get<any>(`${this.apiUrl}/supplier-portal/my/dashboard-enhanced?${this.supplierQuery}`).subscribe({
      next: (data) => { this.supplierDashboard.set(data); this.loading.set(false); },
      error: () => { this.loading.set(false); }
    });
  }

  loadSupplierOrders() {
    this.loading.set(true);
    this.http.get<any>(`${this.apiUrl}/supplier-portal/my/orders-detail?${this.supplierQuery}`).subscribe({
      next: (data) => { this.supplierOrders.set(data); this.loading.set(false); },
      error: () => { this.loading.set(false); }
    });
  }

  loadSupplierContracts() {
    this.loading.set(true);
    this.http.get<any>(`${this.apiUrl}/supplier-portal/my/contracts-detail?${this.supplierQuery}`).subscribe({
      next: (data) => { this.supplierContracts.set(data); this.loading.set(false); },
      error: () => { this.loading.set(false); }
    });
  }

  loadSupplierInvoices() {
    this.loading.set(true);
    let url = `${this.apiUrl}/supplier-portal/my/invoices-detail?${this.supplierQuery}`;
    if (this.invoiceStatusFilter) url += `&status=${this.invoiceStatusFilter}`;
    this.http.get<any>(url).subscribe({
      next: (data) => { this.supplierInvoices.set(data); this.loading.set(false); },
      error: () => { this.loading.set(false); }
    });
  }

  loadSupplierPayments() {
    this.loading.set(true);
    this.http.get<any>(`${this.apiUrl}/supplier-portal/my/payments-detail?${this.supplierQuery}`).subscribe({
      next: (data) => { this.supplierPayments.set(data); this.loading.set(false); },
      error: () => { this.loading.set(false); }
    });
  }

  loadSupplierNotifications() {
    this.http.get<any>(`${this.apiUrl}/supplier-portal/my/notifications?${this.supplierQuery}`).subscribe({
      next: (data) => { this.supplierNotifications.set(data); },
      error: () => {}
    });
  }

  loadSupplierStatement() {
    this.http.get<any>(`${this.apiUrl}/supplier-portal/my/statement?${this.supplierQuery}`).subscribe({
      next: (data) => { this.supplierStatement.set(data); },
      error: () => {}
    });
  }

  loadInvoiceTimeline(invoiceId: string) {
    this.http.get<any>(`${this.apiUrl}/supplier-portal/my/invoice/${invoiceId}/timeline?${this.supplierQuery}`).subscribe({
      next: (data) => { this.invoiceTimeline.set(data); },
      error: () => { this.notify('Failed to load invoice timeline'); }
    });
  }

  viewInvoiceDetail(invoice: any) {
    this.selectedInvoiceDetail.set(invoice);
    this.loadInvoiceTimeline(invoice.id);
  }

  viewOrderDetail(order: any) {
    this.selectedOrderDetail.set(order);
  }

  viewContractDetail(contract: any) {
    this.selectedContractDetail.set(contract);
  }

  backToList() {
    this.selectedInvoiceDetail.set(null);
    this.invoiceTimeline.set(null);
    this.selectedOrderDetail.set(null);
    this.selectedContractDetail.set(null);
  }

  openInvoiceUpload(orderId?: string, contractId?: string) {
    this.uploadForm = {
      orderId: orderId || '', contractId: contractId || '',
      invoiceType: orderId ? 'regular' : (contractId ? 'contract_service' : 'regular'),
      supplierInvoiceNumber: '', estimatedAmount: 0,
      invoiceFile: { filename: '', fileSize: 0 },
      supportingDocuments: []
    };
    this.showInvoiceUpload.set(true);
  }

  submitInvoiceUpload() {
    if (!this.uploadForm.supplierInvoiceNumber) { this.notify('Please enter your invoice number'); return; }
    this.loading.set(true);
    this.http.post<any>(`${this.apiUrl}/supplier-portal/my/upload-invoice-with-docs?${this.supplierQuery}`, {
      orderId: this.uploadForm.orderId || null,
      contractId: this.uploadForm.contractId || null,
      invoiceType: this.uploadForm.invoiceType,
      supplierInvoiceNumber: this.uploadForm.supplierInvoiceNumber,
      estimatedAmount: this.uploadForm.estimatedAmount,
      invoiceFile: { filename: `${this.uploadForm.supplierInvoiceNumber}.pdf`, fileSize: 245000 },
      supportingDocuments: this.uploadForm.supportingDocuments
    }).subscribe({
      next: (res) => {
        this.notify(res.message || 'Invoice uploaded successfully');
        this.showInvoiceUpload.set(false);
        this.loadSupplierInvoices();
        this.loading.set(false);
      },
      error: (err) => {
        this.notify(err.error?.error || 'Failed to upload invoice');
        this.loading.set(false);
      }
    });
  }

  addSupportingDoc(type: string) {
    if (!this.uploadForm.supportingDocuments.find((d: any) => d.type === type)) {
      this.uploadForm.supportingDocuments.push({ type, filename: `${type}_doc.pdf`, fileSize: 150000 });
    }
  }

  removeSupportingDoc(index: number) {
    this.uploadForm.supportingDocuments.splice(index, 1);
  }

  openResubmitDialog(invoice: any) {
    this.resubmitInvoice.set(invoice);
    this.resubmitDocs = (invoice.missingDocuments || []).flatMap((d: any) =>
      d.missingDocuments ? d.missingDocuments.filter((m: any) => !m.resubmitted).map((m: any) => ({ type: m.type, label: m.label, selected: false, filename: '' })) :
      [{ type: d.type || d, label: d.label || d.type || d, selected: false, filename: '' }]
    );
    this.showResubmitDialog.set(true);
  }

  submitResubmission() {
    const inv = this.resubmitInvoice();
    if (!inv) return;
    const docs = this.resubmitDocs.filter(d => d.selected).map(d => ({
      type: d.type, filename: d.filename || `${d.type}_resubmit.pdf`
    }));
    if (docs.length === 0) { this.notify('Select at least one document to resubmit'); return; }

    this.http.post<any>(`${this.apiUrl}/supplier-portal/my/invoice/${inv.id}/resubmit-documents?${this.supplierQuery}`, { documents: docs }).subscribe({
      next: (res) => {
        this.notify(res.message);
        this.showResubmitDialog.set(false);
        this.loadSupplierInvoices();
      },
      error: (err) => this.notify(err.error?.error || 'Failed to resubmit documents')
    });
  }

  filterInvoicesByStatus(status: string) {
    this.invoiceStatusFilter = this.invoiceStatusFilter === status ? '' : status;
    this.loadSupplierInvoices();
  }

  loadAdminDashboard() {
    this.http.get<any>(`${this.apiUrl}/supplier-portal/suppliers?page=1&pageSize=100`).subscribe({
      next: (res) => {
        const allSuppliers = res.data || [];
        const activeSuppliers = allSuppliers.filter((s: any) => s.status === 'active').length;
        const pendingVerification = allSuppliers.filter((s: any) => s.status === 'pending_verification').length;
        const pendingRegistration = allSuppliers.filter((s: any) => s.status === 'pending_registration').length;
        const verified = allSuppliers.filter((s: any) => s.status === 'verified').length;
        const suspended = allSuppliers.filter((s: any) => s.status === 'suspended').length;
        const blacklisted = allSuppliers.filter((s: any) => s.status === 'blacklisted').length;

        this.summary.set({
          totalRegistered: allSuppliers.length, activeSuppliers, pendingVerification,
          pendingRegistration, verified, suspended, blacklisted,
          invoiceSubmissions: this.submissions().length
        });
        this.recentSuppliers.set(
          [...allSuppliers].sort((a: any, b: any) => new Date(b.registeredDate).getTime() - new Date(a.registeredDate).getTime()).slice(0, 5)
        );
      },
      error: () => this.summary.set({})
    });
  }

  loadSuppliers() {
    this.loading.set(true);
    let url = `${this.apiUrl}/supplier-portal/suppliers?page=${this.currentPage()}&pageSize=${this.pageSize()}`;
    if (this.filterStatusValue) url += `&status=${this.filterStatusValue}`;
    if (this.searchQuery) url += `&search=${encodeURIComponent(this.searchQuery)}`;
    this.http.get<any>(url).subscribe({
      next: (res) => {
        this.suppliers.set(res.data || []); this.totalSuppliers.set(res.total || 0);
        this.totalPages.set(res.totalPages || 1); this.loading.set(false);
      },
      error: () => { this.suppliers.set([]); this.loading.set(false); }
    });
  }

  loadAllSubmissions() {
    this.http.get<any>(`${this.apiUrl}/supplier-portal/suppliers?page=1&pageSize=100`).subscribe({
      next: (res) => {
        const allSuppliers = res.data || [];
        allSuppliers.forEach((supplier: any) => {
          if (supplier.id) this.http.get<any>(`${this.apiUrl}/supplier-portal/suppliers/${supplier.id}`).subscribe({});
        });
        this.http.get<any>(`${this.apiUrl}/invoices?page=1&pageSize=100`).subscribe({
          next: (invoiceRes: any) => {
            const submissions = (invoiceRes?.data || [])
              .filter((inv: any) => inv.supplierPortalSubmission || inv.ocrExtractionId)
              .map((inv: any) => ({
                id: inv.supplierPortalSubmission?.id || inv.id,
                supplierName: inv.supplier?.name || inv.supplierName || '—',
                submissionDate: inv.supplierPortalSubmission?.submissionDate || inv.receivedDate || inv.invoiceDate,
                fileName: inv.supplierPortalSubmission?.fileName || 'invoice.pdf',
                status: inv.supplierPortalSubmission?.status || (inv.ocrExtractionId ? 'ocr_complete' : 'manual_capture'),
                ocrConfidence: inv.ocrExtraction?.overallConfidence || null
              }));
            if (submissions.length > 0) this.submissions.set(submissions);
          },
          error: () => {}
        });
        this.generateMockSubmissions();
      },
      error: () => {}
    });
  }

  private generateMockSubmissions() {
    const mockSubmissions = [
      { id: 'SSUB-001', supplierPortalId: 'SPREG-001', supplierName: 'ABC Construction', orderId: 'ORD-001', submissionDate: '2025-02-15T10:30:00Z', fileName: 'invoice_abc_001.pdf', fileSize: 245000, status: 'ocr_complete', ocrConfidence: 0.95, statusHistory: [] },
      { id: 'SSUB-002', supplierPortalId: 'SPREG-002', supplierName: 'XYZ Supplies', orderId: 'ORD-003', submissionDate: '2025-02-14T14:20:00Z', fileName: 'inv_feb_2025.pdf', fileSize: 189000, status: 'ocr_low_confidence', ocrConfidence: 0.62, statusHistory: [] },
      { id: 'SSUB-003', supplierPortalId: 'SPREG-003', supplierName: 'Metro Electrical', orderId: null, submissionDate: '2025-02-13T09:15:00Z', fileName: null, fileSize: 0, status: 'manual_capture', ocrConfidence: null, statusHistory: [] },
      { id: 'SSUB-004', supplierPortalId: 'SPREG-001', supplierName: 'ABC Construction', orderId: 'ORD-005', submissionDate: '2025-02-12T16:45:00Z', fileName: 'invoice_progress.pdf', fileSize: 312000, status: 'accepted', ocrConfidence: 0.98, statusHistory: [] },
      { id: 'SSUB-005', supplierPortalId: 'SPREG-004', supplierName: 'National Plumbing', orderId: 'ORD-007', submissionDate: '2025-02-11T11:00:00Z', fileName: 'scan_inv_012.pdf', fileSize: 156000, status: 'uploaded', ocrConfidence: null, statusHistory: [] },
      { id: 'SSUB-006', supplierPortalId: 'SPREG-005', supplierName: 'Green IT Solutions', orderId: 'ORD-010', submissionDate: '2025-02-10T13:30:00Z', fileName: 'inv_git_feb.pdf', fileSize: 278000, status: 'rejected', ocrConfidence: 0.45, statusHistory: [] }
    ];
    if (this.submissions().length === 0) this.submissions.set(mockSubmissions);
    this.recentSubmissions.set(mockSubmissions.slice(0, 4));
    const current = this.summary();
    if (!current.invoiceSubmissions) this.summary.set({ ...current, invoiceSubmissions: this.submissions().length || mockSubmissions.length });
  }

  loadSupplierDetail(id: string) {
    this.loading.set(true);
    this.http.get<any>(`${this.apiUrl}/supplier-portal/suppliers/${id}`).subscribe({
      next: (data) => { this.selectedSupplier.set(data); this.loading.set(false); this.loadDocumentChecklist(id); },
      error: () => { this.loading.set(false); this.notify('Failed to load supplier details'); }
    });
  }

  loadDocumentChecklist(id: string) {
    this.http.get<any>(`${this.apiUrl}/supplier-portal/suppliers/${id}/document-checklist`).subscribe({
      next: (data) => {
        this.documentChecklist.set(data.checklist || []);
        this.documentChecklistSummary.set({ uploaded: data.totalUploaded || 0, total: data.totalRequired || 0 });
      },
      error: () => { this.documentChecklist.set([]); this.documentChecklistSummary.set({ uploaded: 0, total: 0 }); }
    });
  }

  viewSupplier(supplier: any) {
    this.loadSupplierDetail(supplier.id);
    this.currentView.set('detail');
  }

  verifySupplier(id: string) {
    if (!window.confirm('Run verification checks for this supplier?')) return;
    const checks = { csd: { verified: true, status: 'compliant' }, cipc: { verified: true, status: 'compliant' }, sars: { verified: true, compliant: true } };
    this.http.post<any>(`${this.apiUrl}/supplier-portal/suppliers/${id}/verify`, { checks }).subscribe({
      next: (res) => { this.notify('Verification checks updated'); if (this.selectedSupplier()?.id === id) this.selectedSupplier.set(res.supplier); this.loadAdminDashboard(); },
      error: (err) => this.notify(err.error?.error || 'Failed to verify supplier')
    });
  }

  verifyAllChecks(id: string) {
    if (!window.confirm('Mark ALL verification checks as passed?')) return;
    const checks = { csd: { verified: true, status: 'compliant' }, cipc: { verified: true, status: 'compliant' }, sars: { verified: true, compliant: true }, municipal_rates: { verified: true, status: 'compliant' }, bank_verification: { verified: true, status: 'verified' } };
    this.http.post<any>(`${this.apiUrl}/supplier-portal/suppliers/${id}/verify`, { checks }).subscribe({
      next: (res) => { this.notify('All verification checks passed'); if (this.selectedSupplier()?.id === id) this.selectedSupplier.set(res.supplier); this.loadAdminDashboard(); },
      error: (err) => this.notify(err.error?.error || 'Failed to verify supplier')
    });
  }

  approveSupplier(id: string) {
    if (!window.confirm('Approve and activate this supplier?')) return;
    this.http.post<any>(`${this.apiUrl}/supplier-portal/suppliers/${id}/approve`, {}).subscribe({
      next: (res) => { this.notify('Supplier approved and activated'); if (this.selectedSupplier()?.id === id) this.selectedSupplier.set(res.supplier); this.loadAdminDashboard(); },
      error: (err) => this.notify(err.error?.error || 'Failed to approve supplier')
    });
  }

  suspendSupplier(id: string) {
    const reason = window.prompt('Reason for suspending this supplier:');
    if (!reason) return;
    this.http.post<any>(`${this.apiUrl}/supplier-portal/suppliers/${id}/suspend`, { reason }).subscribe({
      next: (res) => { this.notify('Supplier suspended'); if (this.selectedSupplier()?.id === id) this.selectedSupplier.set(res.supplier); this.loadAdminDashboard(); },
      error: (err) => this.notify(err.error?.error || 'Failed to suspend supplier')
    });
  }

  navigateTo(view: string) {
    this.currentView.set(view);
    if (view === 'list') this.loadSuppliers();
    else if (view === 'dashboard') this.loadAdminDashboard();
    else if (view === 'submissions') this.loadAllSubmissions();
  }

  filterByStatus(status: string) {
    this.filterStatusValue = this.filterStatusValue === status ? '' : status;
    this.currentPage.set(1);
    this.currentView.set('list');
    this.loadSuppliers();
  }

  clearFilters() { this.searchQuery = ''; this.filterStatusValue = ''; this.currentPage.set(1); this.loadSuppliers(); }
  filterSubmissionsByStatus(status: string) { this.submissionFilterStatus = this.submissionFilterStatus === status ? '' : status; }
  clearSubmissionFilters() { this.submissionSearch = ''; this.submissionFilterStatus = ''; }

  changePage(page: number) { this.currentPage.set(page); this.loadSuppliers(); }
  onPageSizeChange() { this.pageSize.set(this.pageSizeValue); this.currentPage.set(1); this.loadSuppliers(); }

  getVerificationChecks(): any[] {
    const vs = this.selectedSupplier()?.verificationStatus || {};
    return [
      { key: 'csd', label: 'CSD Verification', verified: vs.csd?.verified || false, verifiedDate: vs.csd?.verifiedDate },
      { key: 'cipc', label: 'CIPC Registration', verified: vs.cipc?.verified || false, verifiedDate: vs.cipc?.verifiedDate },
      { key: 'sars', label: 'SARS Tax Compliance', verified: vs.sars?.verified || false, verifiedDate: vs.sars?.verifiedDate },
      { key: 'municipal_rates', label: 'Municipal Rates & Taxes', verified: vs.municipal_rates?.verified || false, verifiedDate: vs.municipal_rates?.verifiedDate },
      { key: 'bank_verification', label: 'Bank Account Verification', verified: vs.bank_verification?.verified || false, verifiedDate: vs.bank_verification?.verifiedDate }
    ];
  }

  getStatusLabel(status: string): string {
    const labels: any = { 'pending_registration': 'Pending Registration', 'pending_verification': 'Pending Verification', 'verified': 'Verified', 'active': 'Active', 'suspended': 'Suspended', 'blacklisted': 'Blacklisted' };
    return labels[status] || status;
  }

  getSubmissionStatusLabel(status: string): string {
    const labels: any = { 'uploaded': 'Uploaded', 'ocr_processing': 'OCR Processing', 'ocr_complete': 'OCR Complete', 'ocr_low_confidence': 'Low Confidence', 'manual_capture': 'Manual Capture', 'accepted': 'Accepted', 'rejected': 'Rejected' };
    return labels[status] || status;
  }

  getSubmissionCount(status: string): number { return this.submissions().filter(s => s.status === status).length; }

  getOcrConfidence(sub: any): number { return sub.ocrConfidence ? Math.round(sub.ocrConfidence * 100) : 0; }

  getOcrConfidenceColor(sub: any): string {
    const conf = sub.ocrConfidence || 0;
    return conf >= 0.9 ? '#2e7d32' : conf >= 0.7 ? '#ef6c00' : '#c62828';
  }

  getBreakdownWidth(count: number): number {
    const total = this.summary().totalRegistered || 1;
    return Math.max(((count || 0) / total) * 100, 2);
  }

  getInvoiceStatusColor(status: string): string {
    const colors: any = {
      draft: '#94a3b8', submitted: '#3b82f6', pending_match: '#8b5cf6', match_exception: '#ef4444',
      supervisor_review: '#f59e0b', hod_review: '#f59e0b', cfo_review: '#f59e0b', mm_review: '#f59e0b',
      ao_review: '#f59e0b', approved: '#10b981', payment_batched: '#06b6d4', paid: '#059669',
      rejected: '#dc2626', voided: '#6b7280', overdue: '#dc2626', on_hold: '#f97316', disputed: '#e11d48'
    };
    return colors[status] || '#64748b';
  }

  getInvoiceStatusLabel(status: string): string {
    const labels: any = {
      draft: 'Draft', submitted: 'Submitted', pending_match: 'Pending Match',
      match_exception: 'Match Exception', supervisor_review: 'Supervisor Review',
      hod_review: 'HOD Review', cfo_review: 'CFO Review', mm_review: 'MM Review',
      ao_review: 'AO Review', approved: 'Approved', payment_batched: 'In Payment',
      paid: 'Paid', rejected: 'Rejected', voided: 'Voided', overdue: 'Overdue',
      on_hold: 'On Hold', disputed: 'Disputed'
    };
    return labels[status] || status;
  }

  getPhaseIcon(phase: any): string { return phase?.icon || 'circle'; }

  getFinBarWidth(type: string): number {
    const fin = this.supplierDashboard()?.financial || {};
    const values = [
      fin.totalOrderValue?.amount || 0,
      fin.totalContractValue?.amount || 0,
      fin.totalInvoiced?.amount || 0,
      fin.totalPaid?.amount || 0
    ];
    const max = Math.max(...values, 1);
    const map: any = { orders: 0, contracts: 1, invoiced: 2, paid: 3 };
    return Math.max((values[map[type] ?? 0] / max) * 100, 3);
  }

  notify(msg: string) { this.notification.set(msg); setTimeout(() => this.notification.set(''), 4000); }

  formatCurrency(value: any): string {
    const amt = typeof value === 'object' ? value?.amount : value;
    if (!amt && amt !== 0) return 'R0.00';
    return 'R' + Number(amt).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatDate(date: string): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  formatDateTime(date: string): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
}
