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
import { MatStepperModule } from '@angular/material/stepper';
import { environment } from '../../../environments/environment';
import { AnalyticsService } from '../../core/services/analytics.service';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

@Component({
  selector: 'app-suppliers',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatCardModule, MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatDatepickerModule, MatNativeDateModule, MatSelectModule, MatMenuModule, MatTooltipModule, MatTabsModule, MatChipsModule, MatBadgeModule, MatStepperModule],
  templateUrl: './suppliers.component.html',
  styleUrl: './suppliers.component.scss'
})
export class SuppliersComponent implements OnInit {
  private http = inject(HttpClient);

  currentView = signal<'main' | 'detail' | 'manual-register' | 'analytics'>('main');
  activeTab = signal<'dashboard' | 'registrations' | 'csd' | 'documents' | 'reports'>('dashboard');
  detailTab = signal('info');
  reportTab = signal('details');
  notification = signal('');
  saving = signal(false);

  config = signal<any>({ ntCategories: [], municipalGroupings: [], documentTypes: [], registrationTypes: [], accreditationTypes: [], professionalRegistrationBodies: [] });
  dashboardData = signal<any>({});
  expiringAlerts = signal<any>({});
  recentRegistrations = signal<any[]>([]);

  registrations = signal<any[]>([]);
  regTotal = signal(0);
  regPage = signal(1);
  regPageSize = 20;
  regTotalPages = computed(() => Math.max(1, Math.ceil(this.regTotal() / this.regPageSize)));
  regPageStart = computed(() => this.regTotal() === 0 ? 0 : (this.regPage() - 1) * this.regPageSize + 1);
  regPageEnd = computed(() => Math.min(this.regPage() * this.regPageSize, this.regTotal()));
  regSearch = '';
  regFilterStatus = '';
  regFilterSource = '';
  regDateFrom = '';
  regDateTo = '';

  csdSearchForm: any = { csdNumber: '', companyName: '', registrationNumber: '' };
  csdResults = signal<any[]>([]);
  csdImportResult = signal<any>(null);

  allDocuments = signal<any[]>([]);
  docTotal = signal(0);
  docPage = signal(1);
  docPageSize = 20;
  docTotalPages = computed(() => Math.max(1, Math.ceil(this.docTotal() / this.docPageSize)));
  docPageStart = computed(() => this.docTotal() === 0 ? 0 : (this.docPage() - 1) * this.docPageSize + 1);
  docPageEnd = computed(() => Math.min(this.docPage() * this.docPageSize, this.docTotal()));
  docFilterType = '';
  docFilterStatus = '';

  selectedRegistration = signal<any>(null);
  selectedSupplier = signal<any>(null);
  supplierChecklist = signal<any>({});
  directorsData = signal<any>({});
  accreditations = signal<any[]>([]);
  statusHistory = signal<any[]>([]);
  wizardDocuments = signal<any[]>([]);

  reportDetails = signal<any[]>([]);
  statusReport = signal<any>(null);
  exceptionsReport = signal<any>(null);
  diversityReport = signal<any>(null);
  rptSearch = '';
  rptStatus = '';
  rptBbbee: any = '';

  wizardCurrentStep = signal(1);
  wizardData: any = {};
  wizDocForm: any = { documentType: '', documentNumber: '', fileName: '', expiryDate: '' };
  wizDirForm: any = { firstName: '', lastName: '', idNumber: '', gender: 'Male', hdi: false, disability: false, percentageOwned: 0 };
  wizAccForm: any = { type: '', number: '', grade: '', issueDate: '', expiryDate: '' };
  wizProfForm: any = { body: '', registrationNumber: '', expiryDate: '' };

  manualForm: any = { name: '', tradingName: '', registrationNumber: '', registrationType: 'PTY', contactPerson: '', email: '', phone: '', vatNumber: '' };
  supDocForm: any = { documentType: '', documentNumber: '', fileName: '', expiryDate: '' };
  dirForm: any = { firstName: '', lastName: '', idNumber: '', gender: 'Male', hdi: false, disability: false, percentageOwned: 0 };
  accForm: any = { type: '', number: '', grade: '', issueDate: '', expiryDate: '' };

  supplierNameCache: Record<string, string> = {};

  wizardSteps = [
    { key: 'general', label: 'General' },
    { key: 'discount', label: 'Discount' },
    { key: 'tax', label: 'Tax' },
    { key: 'businessAreas', label: 'Business' },
    { key: 'documents', label: 'Docs' },
    { key: 'directorate', label: 'Directors' },
    { key: 'contact', label: 'Contact' },
    { key: 'banking', label: 'Banking' },
    { key: 'bbbee', label: 'B-BBEE' },
    { key: 'accreditation', label: 'Accred.' },
    { key: 'notes', label: 'Notes' }
  ];

  private analyticsService = inject(AnalyticsService);
  vendorAnalytics = signal<any>(null);
  showVendorAnalytics = signal(false);

  ngOnInit() {
    this.loadConfig();
    this.loadDashboard();
    this.analyticsService.getVendorAnalytics().subscribe(d => this.vendorAnalytics.set(d));
  }

  renderVendorCharts(): void {
    if (!this.vendorAnalytics()) return;
    setTimeout(() => {
      const data = this.vendorAnalytics();
      const ctx = document.getElementById('vendorConcentrationChart') as HTMLCanvasElement;
      if (ctx) {
        new Chart(ctx, {
          type: 'bar',
          data: {
            labels: data.concentrationIndex.data.map((d: any) => d.commodity),
            datasets: [
              { label: 'Top 10 Share %', data: data.concentrationIndex.data.map((d: any) => d.top10Share), backgroundColor: data.concentrationIndex.data.map((d: any) => d.status === 'high_concentration' ? '#fca5a5' : d.status === 'moderate' ? '#fde68a' : '#86efac'), borderRadius: 6 }
            ]
          },
          options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { min: 0, max: 100, ticks: { font: { size: 10 }, callback: (v: any) => v + '%' }, grid: { color: '#f1f5f9' } }, y: { ticks: { font: { size: 10 } }, grid: { display: false } } } }
        });
      }
    }, 200);
  }

  navigateToAnalytics(): void {
    this.currentView.set('analytics');
    if (!this.vendorAnalytics()) {
      this.analyticsService.getVendorAnalytics().subscribe(d => {
        this.vendorAnalytics.set(d);
        this.renderVendorCharts();
      });
    } else {
      setTimeout(() => this.renderVendorCharts(), 100);
    }
  }

  loadConfig() {
    this.http.get<any>(`${environment.apiUrl}/vendor-management/config`).subscribe({
      next: (data) => this.config.set(data),
      error: () => {}
    });
  }

  loadDashboard() {
    this.http.get<any>(`${environment.apiUrl}/vendor-management/registrations`, { params: { page: '1', pageSize: '200' } }).subscribe({
      next: (data) => {
        const regs = data.data || [];
        const draft = regs.filter((r: any) => r.status === 'draft').length;
        const submitted = regs.filter((r: any) => r.status === 'pending_supervisor_approval').length;
        const approved = regs.filter((r: any) => r.status === 'approved').length;
        const active = regs.filter((r: any) => ['approved', 'active'].includes(r.status)).length;

        this.recentRegistrations.set(regs.slice(0, 10));
        regs.forEach((r: any) => {
          if (r.supplierId && r.importedData?.registeredName) {
            this.supplierNameCache[r.supplierId] = r.importedData.registeredName;
          }
        });

        this.dashboardData.set({
          ...this.dashboardData(),
          pipeline: { draft, submitted, approved, active },
          pendingApprovals: submitted,
          activeRegistrations: regs.length,
          activeVendors: active
        });
      },
      error: () => {}
    });

    this.http.get<any>(`${environment.apiUrl}/vendor-reports/status`).subscribe({
      next: (data) => {
        const bbbee = data.bbbeeBreakdown || {};
        const topLevel = Object.entries(bbbee).sort((a: any, b: any) => b[1] - a[1])[0];
        this.dashboardData.set({
          ...this.dashboardData(),
          totalVendors: data.total || 0,
          bbbeeDistribution: topLevel ? `${topLevel[0]}: ${topLevel[1]}` : '—'
        });
      },
      error: () => {}
    });

    this.http.get<any>(`${environment.apiUrl}/vendor-reports/diversity`).subscribe({
      next: (data) => {
        const total = data.totalActiveSuppliers || 1;
        const hdiCount = data.hdiOwned?.count || 0;
        this.dashboardData.set({
          ...this.dashboardData(),
          hdiPercent: Math.round((hdiCount / total) * 100)
        });
      },
      error: () => {}
    });

    this.loadExpiringDocuments();
  }

  loadExpiringDocuments() {
    this.http.get<any>(`${environment.apiUrl}/vendor-management/documents/expiring`, { params: { days: '30' } }).subscribe({
      next: (data) => {
        this.expiringAlerts.set(data);
        this.dashboardData.set({
          ...this.dashboardData(),
          expiringDocs: (data.totalExpiring || 0) + (data.totalExpired || 0)
        });
      },
      error: () => {}
    });
  }

  loadRegistrations() {
    const params: any = { page: String(this.regPage()), pageSize: String(this.regPageSize) };
    if (this.regFilterStatus) params.status = this.regFilterStatus;
    if (this.regFilterSource) params.source = this.regFilterSource;
    if (this.regSearch) params.search = this.regSearch;
    this.http.get<any>(`${environment.apiUrl}/vendor-management/registrations`, { params }).subscribe({
      next: (data) => {
        let items = data.data || [];
        if (this.regFilterSource) {
          items = items.filter((r: any) => r.registrationSource === this.regFilterSource);
        }
        this.registrations.set(items);
        this.regTotal.set(data.total || 0);
      },
      error: () => {}
    });
  }

  clearRegFilters() {
    this.regSearch = '';
    this.regFilterStatus = '';
    this.regFilterSource = '';
    this.regDateFrom = '';
    this.regDateTo = '';
    this.regPage.set(1);
    this.loadRegistrations();
  }

  searchCsd() {
    this.saving.set(true);
    this.csdImportResult.set(null);
    const params: any = {};
    if (this.csdSearchForm.csdNumber) params.csdNumber = this.csdSearchForm.csdNumber;
    if (this.csdSearchForm.companyName) params.companyName = this.csdSearchForm.companyName;
    if (this.csdSearchForm.registrationNumber) params.registrationNumber = this.csdSearchForm.registrationNumber;
    this.http.get<any>(`${environment.apiUrl}/vendor-management/csd/search`, { params }).subscribe({
      next: (data) => {
        this.saving.set(false);
        this.csdResults.set(data.results || []);
        if (!data.results?.length) this.showNotification('No CSD records found');
      },
      error: (err) => {
        this.saving.set(false);
        this.showNotification(err.error?.error || 'CSD search failed');
      }
    });
  }

  importFromCsd(csdNumber: string) {
    this.saving.set(true);
    this.http.post<any>(`${environment.apiUrl}/vendor-management/csd/import`, { csdNumber }).subscribe({
      next: (data) => {
        this.saving.set(false);
        this.csdImportResult.set(data);
        this.showNotification('Vendor imported successfully from CSD');
      },
      error: (err) => {
        this.saving.set(false);
        this.showNotification(err.error?.error || 'Import failed');
      }
    });
  }

  openManualRegistration() {
    this.manualForm = { name: '', tradingName: '', registrationNumber: '', registrationType: 'PTY', contactPerson: '', email: '', phone: '', vatNumber: '' };
    this.currentView.set('manual-register');
  }

  saveManualRegistration() {
    this.saving.set(true);
    this.http.post<any>(`${environment.apiUrl}/vendor-management/register/manual`, this.manualForm).subscribe({
      next: (data) => {
        this.saving.set(false);
        this.showNotification('Vendor registration created');
        this.currentView.set('main');
        this.activeTab.set('registrations');
        this.loadRegistrations();
      },
      error: (err) => {
        this.saving.set(false);
        this.showNotification(err.error?.error || 'Registration failed');
      }
    });
  }

  viewRegistration(reg: any) {
    this.http.get<any>(`${environment.apiUrl}/vendor-management/registrations/${reg.id}`).subscribe({
      next: (data) => {
        this.selectedRegistration.set(data.registration);
        this.selectedSupplier.set(data.supplier);
        this.wizardData = { ...data.supplier };
        this.wizardCurrentStep.set(data.registration?.wizard?.currentStep || 1);
        this.detailTab.set('info');
        this.currentView.set('detail');
        if (data.supplier?.id) {
          this.supplierNameCache[data.supplier.id] = data.supplier.name;
        }
      },
      error: () => this.showNotification('Failed to load registration')
    });
  }

  backToList() {
    this.currentView.set('main');
    this.loadRegistrations();
    this.loadDashboard();
  }

  submitRegistration(regId: string) {
    this.saving.set(true);
    this.http.post<any>(`${environment.apiUrl}/vendor-management/registrations/${regId}/submit`, {}).subscribe({
      next: (data) => {
        this.saving.set(false);
        this.showNotification('Registration submitted for approval');
        if (this.currentView() === 'detail') {
          this.selectedRegistration.set(data.registration);
        }
        this.loadRegistrations();
      },
      error: (err) => {
        this.saving.set(false);
        this.showNotification(err.error?.error || 'Submission failed');
      }
    });
  }

  approveRegistration(regId: string, action: string) {
    const comments = action !== 'approve' ? window.prompt(`Reason for ${action}:`) : '';
    if (action !== 'approve' && !comments) return;
    this.saving.set(true);
    this.http.post<any>(`${environment.apiUrl}/vendor-management/registrations/${regId}/approve`, { action, comments }).subscribe({
      next: (data) => {
        this.saving.set(false);
        this.showNotification(`Registration ${action}d successfully`);
        if (this.currentView() === 'detail') {
          this.selectedRegistration.set(data.registration);
        }
        this.loadRegistrations();
      },
      error: (err) => {
        this.saving.set(false);
        this.showNotification(err.error?.error || `${action} failed`);
      }
    });
  }

  saveWizardStep() {
    const reg = this.selectedRegistration();
    if (!reg) return;
    const stepKey = this.wizardSteps[this.wizardCurrentStep() - 1]?.key;
    this.saving.set(true);

    let stepData: any = {};
    switch (stepKey) {
      case 'general': stepData = { name: this.wizardData.name, tradingName: this.wizardData.tradingName, registrationNumber: this.wizardData.registrationNumber }; break;
      case 'discount': stepData = { paymentTermDays: this.wizardData.paymentTermDays, discountPercentage: this.wizardData.discountPercentage }; break;
      case 'tax': stepData = { vatNumber: this.wizardData.vatNumber, incomeTaxNumber: this.wizardData.incomeTaxNumber, payeNumber: this.wizardData.payeNumber, taxClearancePin: this.wizardData.taxClearancePin, taxClearanceExpiry: this.wizardData.taxClearanceExpiry }; break;
      case 'businessAreas': stepData = { ntCategory: this.wizardData.ntCategory, municipalGrouping: this.wizardData.municipalGrouping }; break;
      case 'contact': stepData = { contactPerson: this.wizardData.contactPerson, email: this.wizardData.email, phone: this.wizardData.phone, mobile: this.wizardData.mobile }; break;
      case 'banking': stepData = { bankingDetails: { bankName: this.wizardData.bankName, branchCode: this.wizardData.branchCode, accountNumber: this.wizardData.accountNumber, accountType: this.wizardData.accountType } }; break;
      case 'bbbee': stepData = { bbbeeLevel: this.wizardData.bbbeeLevel, bbbeeCertificateNumber: this.wizardData.bbbeeCertificateNumber, bbbeeExpiry: this.wizardData.bbbeeExpiry }; break;
      case 'notes': stepData = { notes: this.wizardData.notes }; break;
    }

    this.http.put<any>(`${environment.apiUrl}/vendor-management/registrations/${reg.id}/wizard`, {
      step: this.wizardCurrentStep(),
      stepData,
      completedStep: stepKey
    }).subscribe({
      next: (data) => {
        this.saving.set(false);
        this.selectedRegistration.set(data.registration);
        this.showNotification(`Step "${stepKey}" saved`);
      },
      error: (err) => {
        this.saving.set(false);
        this.showNotification(err.error?.error || 'Failed to save step');
      }
    });
  }

  isWizardStepCompleted(stepKey: string): boolean {
    return this.selectedRegistration()?.wizard?.completedSteps?.includes(stepKey) || false;
  }

  uploadWizardDocument() {
    const reg = this.selectedRegistration();
    if (!reg) return;
    this.saving.set(true);
    this.http.post<any>(`${environment.apiUrl}/vendor-management/documents`, {
      supplierId: reg.supplierId,
      documentType: this.wizDocForm.documentType,
      documentNumber: this.wizDocForm.documentNumber,
      fileName: this.wizDocForm.fileName || 'document.pdf',
      expiryDate: this.wizDocForm.expiryDate || null
    }).subscribe({
      next: (data) => {
        this.saving.set(false);
        this.showNotification('Document uploaded');
        this.wizDocForm = { documentType: '', documentNumber: '', fileName: '', expiryDate: '' };
        this.loadWizardDocuments();
      },
      error: (err) => {
        this.saving.set(false);
        this.showNotification(err.error?.error || 'Upload failed');
      }
    });
  }

  loadWizardDocuments() {
    const reg = this.selectedRegistration();
    if (!reg) return;
    this.http.get<any>(`${environment.apiUrl}/vendor-management/documents`, { params: { supplierId: reg.supplierId } }).subscribe({
      next: (data) => this.wizardDocuments.set(data.data || []),
      error: () => {}
    });
  }

  addDirectorFromWizard() {
    const reg = this.selectedRegistration();
    if (!reg) return;
    this.saving.set(true);
    this.http.post<any>(`${environment.apiUrl}/vendor-management/directors`, {
      supplierId: reg.supplierId,
      ...this.wizDirForm,
      fullName: `${this.wizDirForm.firstName} ${this.wizDirForm.lastName}`
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.showNotification('Director added');
        this.wizDirForm = { firstName: '', lastName: '', idNumber: '', gender: 'Male', hdi: false, disability: false, percentageOwned: 0 };
        this.loadDirectors();
      },
      error: (err) => {
        this.saving.set(false);
        this.showNotification(err.error?.error || 'Failed to add director');
      }
    });
  }

  addAccreditationFromWizard() {
    const reg = this.selectedRegistration();
    if (!reg) return;
    this.saving.set(true);
    this.http.post<any>(`${environment.apiUrl}/vendor-management/accreditations`, {
      supplierId: reg.supplierId,
      type: this.wizAccForm.type,
      registrationNumber: this.wizAccForm.number,
      grade: this.wizAccForm.grade,
      issueDate: this.wizAccForm.issueDate,
      expiryDate: this.wizAccForm.expiryDate
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.showNotification('Accreditation added');
        this.wizAccForm = { type: '', number: '', grade: '', issueDate: '', expiryDate: '' };
        this.loadAccreditations();
      },
      error: (err) => {
        this.saving.set(false);
        this.showNotification(err.error?.error || 'Failed');
      }
    });
  }

  addProfRegistrationFromWizard() {
    const reg = this.selectedRegistration();
    if (!reg) return;
    this.saving.set(true);
    this.http.post<any>(`${environment.apiUrl}/vendor-management/professional-registrations`, {
      supplierId: reg.supplierId,
      body: this.wizProfForm.body,
      registrationNumber: this.wizProfForm.registrationNumber,
      expiryDate: this.wizProfForm.expiryDate
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.showNotification('Professional registration added');
        this.wizProfForm = { body: '', registrationNumber: '', expiryDate: '' };
      },
      error: (err) => {
        this.saving.set(false);
        this.showNotification(err.error?.error || 'Failed');
      }
    });
  }

  loadSupplierDocuments() {
    const sup = this.selectedSupplier();
    if (!sup) return;
    this.http.get<any>(`${environment.apiUrl}/vendor-management/documents/${sup.id}`).subscribe({
      next: (data) => this.supplierChecklist.set(data),
      error: () => {}
    });
  }

  uploadSupplierDocument() {
    const sup = this.selectedSupplier();
    if (!sup) return;
    this.saving.set(true);
    this.http.post<any>(`${environment.apiUrl}/vendor-management/documents`, {
      supplierId: sup.id,
      documentType: this.supDocForm.documentType,
      documentNumber: this.supDocForm.documentNumber,
      fileName: this.supDocForm.fileName || 'document.pdf',
      expiryDate: this.supDocForm.expiryDate || null
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.showNotification('Document uploaded');
        this.supDocForm = { documentType: '', documentNumber: '', fileName: '', expiryDate: '' };
        this.loadSupplierDocuments();
      },
      error: (err) => {
        this.saving.set(false);
        this.showNotification(err.error?.error || 'Upload failed');
      }
    });
  }

  loadDirectors() {
    const sup = this.selectedSupplier();
    if (!sup) return;
    this.http.get<any>(`${environment.apiUrl}/vendor-management/directors/${sup.id}`).subscribe({
      next: (data) => this.directorsData.set(data),
      error: () => {}
    });
  }

  addDirector() {
    const sup = this.selectedSupplier();
    if (!sup) return;
    this.saving.set(true);
    this.http.post<any>(`${environment.apiUrl}/vendor-management/directors`, {
      supplierId: sup.id,
      ...this.dirForm,
      fullName: `${this.dirForm.firstName} ${this.dirForm.lastName}`
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.showNotification('Director added');
        this.dirForm = { firstName: '', lastName: '', idNumber: '', gender: 'Male', hdi: false, disability: false, percentageOwned: 0 };
        this.loadDirectors();
      },
      error: (err) => {
        this.saving.set(false);
        this.showNotification(err.error?.error || 'Failed to add director');
      }
    });
  }

  loadAccreditations() {
    const sup = this.selectedSupplier();
    if (!sup) return;
    this.http.get<any>(`${environment.apiUrl}/vendor-management/accreditations`, { params: { supplierId: sup.id } }).subscribe({
      next: (data) => this.accreditations.set(data.data || []),
      error: () => {}
    });
  }

  addAccreditation() {
    const sup = this.selectedSupplier();
    if (!sup) return;
    this.saving.set(true);
    this.http.post<any>(`${environment.apiUrl}/vendor-management/accreditations`, {
      supplierId: sup.id,
      type: this.accForm.type,
      registrationNumber: this.accForm.number,
      grade: this.accForm.grade,
      issueDate: this.accForm.issueDate,
      expiryDate: this.accForm.expiryDate
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.showNotification('Accreditation added');
        this.accForm = { type: '', number: '', grade: '', issueDate: '', expiryDate: '' };
        this.loadAccreditations();
      },
      error: (err) => {
        this.saving.set(false);
        this.showNotification(err.error?.error || 'Failed');
      }
    });
  }

  loadStatusHistory() {
    const sup = this.selectedSupplier();
    if (!sup) return;
    this.http.get<any>(`${environment.apiUrl}/vendor-management/status-changes`, { params: { supplierId: sup.id } }).subscribe({
      next: (data) => this.statusHistory.set(data.data || []),
      error: () => {}
    });
  }

  loadAllDocuments() {
    const params: any = { page: String(this.docPage()), pageSize: String(this.docPageSize) };
    if (this.docFilterType) params.documentType = this.docFilterType;
    if (this.docFilterStatus) params.status = this.docFilterStatus;
    this.http.get<any>(`${environment.apiUrl}/vendor-management/documents`, { params }).subscribe({
      next: (data) => {
        this.allDocuments.set(data.data || []);
        this.docTotal.set(data.total || 0);
      },
      error: () => {}
    });
  }

  verifyDocument(docId: string) {
    this.http.put<any>(`${environment.apiUrl}/vendor-management/documents/${docId}/verify`, {}).subscribe({
      next: () => {
        this.showNotification('Document verified');
        this.loadAllDocuments();
      },
      error: (err) => this.showNotification(err.error?.error || 'Verification failed')
    });
  }

  deleteDocument(docId: string) {
    if (!window.confirm('Delete this document?')) return;
    this.http.delete<any>(`${environment.apiUrl}/vendor-management/documents/${docId}`).subscribe({
      next: () => {
        this.showNotification('Document deleted');
        this.loadAllDocuments();
      },
      error: (err) => this.showNotification(err.error?.error || 'Delete failed')
    });
  }

  loadVendorDetailsReport() {
    const params: any = {};
    if (this.rptSearch) params.search = this.rptSearch;
    if (this.rptStatus) params.status = this.rptStatus;
    if (this.rptBbbee) params.bbbeeLevel = String(this.rptBbbee);
    this.http.get<any>(`${environment.apiUrl}/vendor-reports/details`, { params }).subscribe({
      next: (data) => this.reportDetails.set(data.data || []),
      error: () => {}
    });
  }

  loadStatusReport() {
    this.http.get<any>(`${environment.apiUrl}/vendor-reports/status`).subscribe({
      next: (data) => this.statusReport.set(data),
      error: () => {}
    });
  }

  loadExceptionsReport() {
    this.http.get<any>(`${environment.apiUrl}/vendor-reports/exceptions`).subscribe({
      next: (data) => this.exceptionsReport.set(data),
      error: () => {}
    });
  }

  loadDiversityReport() {
    this.http.get<any>(`${environment.apiUrl}/vendor-reports/diversity`).subscribe({
      next: (data) => this.diversityReport.set(data),
      error: () => {}
    });
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      draft: 'Draft',
      pending_supervisor_approval: 'Pending Approval',
      approved: 'Approved',
      rejected: 'Rejected',
      returned: 'Returned',
      active: 'Active',
      pending_verification: 'Pending Verification',
      suspended: 'Suspended',
      blacklisted: 'Blacklisted',
      verified: 'Verified'
    };
    return labels[status] || status;
  }

  getRegSupplierName(reg: any): string {
    if (reg.name) return reg.name;
    if (reg.importedData?.registeredName) return reg.importedData.registeredName;
    if (this.supplierNameCache[reg.supplierId]) return this.supplierNameCache[reg.supplierId];
    return reg.tradingName || reg.supplierId || '—';
  }

  getDocTypeName(code: string): string {
    const dt = this.config().documentTypes?.find((d: any) => d.code === code);
    return dt ? dt.name : code;
  }

  isDocExpired(doc: any): boolean {
    return doc.expiryDate ? new Date(doc.expiryDate) < new Date() : false;
  }

  isDateExpired(date: string): boolean {
    return date ? new Date(date) < new Date() : false;
  }

  getTimelineColor(status: string): string {
    const colors: Record<string, string> = {
      draft: '#1565c0', pending_supervisor_approval: '#ef6c00', approved: '#2e7d32',
      rejected: '#c62828', returned: '#6a1b9a', active: '#2e7d32', suspended: '#e65100'
    };
    return colors[status] || '#64748b';
  }

  getObjectEntries(obj: Record<string, any>): [string, any][] {
    return Object.entries(obj || {});
  }

  formatDate(date: string | null | undefined): string {
    if (!date) return '—';
    try {
      return new Date(date).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return date;
    }
  }

  formatCurrency(amount: number | null | undefined): string {
    if (amount == null) return 'R 0.00';
    return `R ${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  showNotification(msg: string) {
    this.notification.set(msg);
    setTimeout(() => this.notification.set(''), 4000);
  }
}
