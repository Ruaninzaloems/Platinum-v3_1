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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { environment } from '../../../environments/environment';
import { DashboardService } from '../../core/services/dashboard.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

@Component({
  selector: 'app-tenders',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatCardModule, MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatMenuModule, MatTooltipModule, MatTabsModule, MatChipsModule, MatBadgeModule, MatCheckboxModule, MatDatepickerModule, MatNativeDateModule],
  templateUrl: './tenders.component.html',
  styleUrl: './tenders.component.scss'
})
export class TendersComponent implements OnInit {
  private http = inject(HttpClient);
  private dashboardService = inject(DashboardService);
  private analyticsService = inject(AnalyticsService);

  currentView = signal<'list' | 'detail' | 'create' | 'edit' | 'analytics'>('list');
  selectedTender = signal<any>(null);
  detailTab = signal<string>('overview');

  tenders = signal<any[]>([]);
  totalTenders = signal(0);
  currentPage = signal(1);
  pageSize = signal(20);
  totalPages = signal(1);

  pipeline = signal<any>({});
  tenderSla = signal<any>({});
  tenderAiInsights = signal<any[]>([]);
  showAiPanel = signal(true);
  tenderAnalyticsData = signal<any>(null);
  showAnalytics = signal(false);

  bscComments = '';
  becComments = '';
  bacComments = '';
  bscL2Comments = '';
  openingComments = '';

  showBidderForm = false;
  newBidderForm: any = { supplierName: '', bidAmount: null, bbbeeLevel: 1, contactEmail: '', contactPerson: '', registrationNumber: '', briefingAttended: false };

  searchQuery = '';
  filterStatus = '';
  filterDepartment = '';
  filterMethod = '';
  filterCategory = '';
  filterDateFrom: any = null;
  filterDateTo: any = null;
  filterValueMin: number | null = null;
  filterValueMax: number | null = null;
  filterCidbGrading = '';
  sortBy = 'createdDate';
  sortDir = 'desc';

  workflowSteps = [
    { key: 'draft', label: 'Capture', icon: 'edit_note', tab: 'overview' },
    { key: 'specifications', label: 'BSC', icon: 'description', tab: 'bsc' },
    { key: 'published', label: 'Advertise', icon: 'campaign', tab: 'bidders' },
    { key: 'closed', label: 'Close', icon: 'lock', tab: 'bidders' },
    { key: 'evaluation', label: 'BEC', icon: 'rate_review', tab: 'bec' },
    { key: 'adjudication', label: 'BAC', icon: 'gavel', tab: 'bac' },
    { key: 'awarded', label: 'Award', icon: 'emoji_events', tab: 'award' },
    { key: 'contract_active', label: 'Contract', icon: 'verified', tab: 'overview' }
  ];

  departments = [
    'Infrastructure and Engineering', 'Water & Sanitation', 'Corporate Services',
    'Community Services', 'Finance', 'Planning & Development', 'Electricity', 'Public Safety'
  ];

  predefinedBuyers = [
    { id: 'thandi.mthembu', name: 'Thandi Mthembu', role: 'Senior Buyer' },
    { id: 'pieter.botha', name: 'Pieter Botha', role: 'Procurement Officer' },
    { id: 'zanele.dlamini', name: 'Zanele Dlamini', role: 'SCM Buyer' },
    { id: 'james.smith', name: 'James Smith', role: 'Procurement Specialist' },
    { id: 'fatima.khan', name: 'Fatima Khan', role: 'Senior Procurement Officer' },
    { id: 'sipho.nkosi', name: 'Sipho Nkosi', role: 'SCM Manager' }
  ];
  buyers = ['Thandi Mthembu', 'Pieter Botha', 'Zanele Dlamini', 'James Smith', 'Fatima Khan', 'Sipho Nkosi'];

  tenderDocTypes = ['specification', 'terms_of_reference', 'scope_of_work', 'evaluation_criteria', 'bid_conditions', 'budget_approval', 'demand_plan', 'other'];

  linkedRequisitions = signal<any[]>([]);
  formDocuments = signal<any[]>([]);
  formDocType = '';
  formDocDate = '';
  formDocFile: File | null = null;

  reportData = signal<any>(null);
  buyerGateEnabled = true;
  showBuyerSelector = false;
  selectedBuyerForAssign = '';
  selectedBidderForPricing = '';
  bidderPricing: Record<string, number> = {};

  boqItems = signal<any[]>([]);
  boqComparison = signal<any[]>([]);
  comparisonBidders = signal<any[]>([]);
  showBoqForm = false;
  boqForm: any = { description: '', section: 'General', unit: 'each', quantity: 0, estimatedRate: 0, notes: '' };
  newBoqProjectItem = '';

  subcontractingPlan = signal<any>({ required: false, minimumPercentage: 0, plans: [] });
  subcontractingRequired = false;
  subcontractingMinPct = 0;
  subcontractorForm: any = { subcontractorName: '', registrationNumber: '', bbbeeLevel: null, workDescription: '', percentage: 0, value: 0 };

  tenderDocuments = signal<any[]>([]);
  tenderDocumentTypes = ['tender_document', 'specification', 'addendum', 'bid_submission', 'evaluation_report', 'award_letter', 'contract', 'correspondence', 'briefing_minutes'];
  docTypeFilter = '';
  newDocForm: any = { type: '', name: '', description: '' };

  briefingForm: any = { date: '', venue: '', mandatory: false, minutes: '' };
  briefingAttendeeForm: any = { companyName: '', representative: '', attended: true };
  briefingQuestionForm: any = { question: '', answer: '', answeredBy: '' };

  pageStart = computed(() => {
    const total = this.totalTenders();
    if (total === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize() + 1;
  });

  pageEnd = computed(() => {
    return Math.min(this.currentPage() * this.pageSize(), this.totalTenders());
  });

  ngOnInit() {
    this.loadPipeline();
    this.loadTenders();
    this.dashboardService.getFormalTenderAiInsights().subscribe(d => this.tenderAiInsights.set(d.insights || []));
    this.analyticsService.getTenderAnalytics().subscribe(d => {
      this.tenderAnalyticsData.set(d);
    });
  }

  loadPipeline() {
    this.http.get<any>(`${environment.apiUrl}/tenders/pipeline`).subscribe({
      next: (data) => this.pipeline.set(data),
      error: () => this.pipeline.set({})
    });
  }

  loadTenders() {
    const params: any = { page: this.currentPage(), pageSize: this.pageSize(), sortBy: this.sortBy, sortDir: this.sortDir };
    if (this.searchQuery) params.search = this.searchQuery;
    if (this.filterStatus) params.status = this.filterStatus;
    if (this.filterDepartment) params.department = this.filterDepartment;
    if (this.filterMethod) params.procurementMethod = this.filterMethod;
    if (this.filterCategory) params.category = this.filterCategory;
    if (this.filterDateFrom) params.dateFrom = this.filterDateFrom instanceof Date ? this.filterDateFrom.toISOString().substring(0, 10) : this.filterDateFrom;
    if (this.filterDateTo) params.dateTo = this.filterDateTo instanceof Date ? this.filterDateTo.toISOString().substring(0, 10) : this.filterDateTo;
    if (this.filterValueMin) params.valueMin = this.filterValueMin;
    if (this.filterValueMax) params.valueMax = this.filterValueMax;
    if (this.filterCidbGrading) params.cidbGrading = this.filterCidbGrading;

    this.http.get<any>(`${environment.apiUrl}/tenders`, { params }).subscribe({
      next: (res) => {
        this.tenders.set(res.data || []);
        this.totalTenders.set(res.total || 0);
        this.totalPages.set(res.totalPages || 1);
      },
      error: () => this.tenders.set([])
    });
  }

  viewTender(tender: any) {
    this.http.get<any>(`${environment.apiUrl}/tenders/${tender.id}`).subscribe({
      next: (data) => {
        this.selectedTender.set(data);
        this.loadTenderSla();
        this.currentView.set('detail');
        this.detailTab.set('overview');
      }
    });
  }

  loadTenderSla() {
    const tender = this.selectedTender();
    if (!tender) return;
    this.http.get<any>(`${environment.apiUrl}/tenders/${tender.id}/sla-performance`).subscribe({
      next: (data) => this.tenderSla.set(data || {}),
      error: () => this.tenderSla.set({})
    });
  }

  getSlaWidth(actual: number, target: number): number {
    return Math.min((actual / (target * 2)) * 100, 100);
  }

  navigateTo(view: string) {
    this.currentView.set(view as any);
    if (view === 'list') {
      this.loadTenders();
    }
    if (view === 'analytics') {
      this.analyticsService.getTenderAnalytics().subscribe(d => {
        this.tenderAnalyticsData.set(d);
        setTimeout(() => this.renderTenderCharts(), 200);
      });
    }
  }

  backToList() {
    this.currentView.set('list');
    this.selectedTender.set(null);
  }

  filterByStatus(status: string) {
    if (this.filterStatus === status) {
      this.filterStatus = '';
    } else {
      this.filterStatus = status;
    }
    this.currentPage.set(1);
    this.loadTenders();
  }

  clearFilters() {
    this.searchQuery = '';
    this.filterStatus = '';
    this.filterDepartment = '';
    this.filterMethod = '';
    this.filterCategory = '';
    this.filterDateFrom = null;
    this.filterDateTo = null;
    this.filterValueMin = null;
    this.filterValueMax = null;
    this.filterCidbGrading = '';
    this.currentPage.set(1);
    this.loadTenders();
  }

  applyFilters() {
    this.currentPage.set(1);
    this.loadTenders();
  }

  sort(field: string) {
    if (this.sortBy === field) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortDir = 'asc';
    }
    this.loadTenders();
  }

  changePage(page: number) {
    this.currentPage.set(page);
    this.loadTenders();
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
      draft: 'Draft', specifications: 'BSC Review', published: 'Published',
      closed: 'Closed', evaluation: 'BEC Evaluation', adjudication: 'BAC Adjudication',
      awarded: 'Awarded', cancelled: 'Cancelled', contract_active: 'Contract Active',
      pending: 'Pending', in_progress: 'In Progress', completed: 'Completed',
      approved: 'Approved', not_started: 'Not Started'
    };
    return labels[status] || status;
  }

  getMethodLabel(method: string): string {
    const labels: Record<string, string> = {
      petty_cash: 'Petty Cash', informal_written: 'Informal Quote',
      formal_written: 'Formal Quote', competitive_bid: 'Competitive Bid',
      formal_price_quotation: 'Formal Price Quote'
    };
    return labels[method] || method;
  }

  getDaysRemaining(tender: any): number | null {
    if (!tender.closingDate) return null;
    const diff = new Date(tender.closingDate).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  hasNonResponsiveBids(tender: any): boolean {
    return tender.bidders?.some((b: any) => !b.responsive) || false;
  }

  isStepCompleted(key: string): boolean {
    const order = ['draft', 'specifications', 'published', 'closed', 'evaluation', 'adjudication', 'awarded', 'contract_active'];
    const tender = this.selectedTender();
    if (!tender) return false;
    const currentIdx = order.indexOf(tender.status);
    const stepIdx = order.indexOf(key);
    return stepIdx < currentIdx;
  }

  isStepCurrent(key: string): boolean {
    return this.selectedTender()?.status === key;
  }

  isStepActive(key: string): boolean {
    return this.isStepCompleted(key) || this.isStepCurrent(key);
  }

  selectDetailTab(stepKey: string) {
    const step = this.workflowSteps.find(s => s.key === stepKey);
    const targetTab = step?.tab || 'overview';
    if (this.isTabAccessible(targetTab)) {
      this.detailTab.set(targetTab);
      if (targetTab === 'boq') this.loadBoq();
    }
  }

  isTabAccessible(tab: string): boolean {
    const tender = this.selectedTender();
    if (!tender) return false;
    const statusOrder = ['draft', 'specifications', 'published', 'closed', 'evaluation', 'adjudication', 'awarded', 'contract_active'];
    const currentIdx = statusOrder.indexOf(tender.status);
    const tabRequirements: Record<string, number> = {
      overview: -1, bsc: 0, boq: -1, bidders: 2,
      bec: 3, bac: 4, award: 5,
      briefing: -1, subcontracting: -1, documents: -1, reports: -1
    };
    const requiredIdx = tabRequirements[tab];
    if (requiredIdx === undefined || requiredIdx === -1) return true;
    return currentIdx >= requiredIdx;
  }

  getTabLockReason(tab: string): string {
    if (this.isTabAccessible(tab)) return '';
    const reasons: Record<string, string> = {
      bsc: 'BSC tab requires the tender to be in draft or later status',
      bidders: 'Bidders can only be registered after the tender is published and advertised',
      boq: 'BOQ is accessible from draft onwards',
      bec: 'BEC evaluation requires the tender to be closed first',
      bac: 'BAC adjudication requires BEC evaluation to be completed first',
      award: 'Award requires BAC adjudication to be completed first'
    };
    return reasons[tab] || 'This tab is not yet available at the current workflow stage';
  }

  navigateTab(tab: string) {
    if (!this.isTabAccessible(tab)) {
      this.showNotification(this.getTabLockReason(tab));
      return;
    }
    this.detailTab.set(tab);
    if (tab === 'boq') this.loadBoq();
  }

  getNextStepLabel(): string {
    const tender = this.selectedTender();
    if (!tender) return '';
    const labels: Record<string, string> = {
      draft: 'Next: Submit to BSC for Specification Review', specifications: 'Next: Publish Tender',
      published: 'Next: Close Bidding', closed: 'Next: Start BEC Evaluation',
      evaluation: 'Next: BAC Adjudication', adjudication: 'Next: Award Decision',
      awarded: 'Next: AO Approval'
    };
    return labels[tender.status] || '';
  }

  getNextStepGateMessage(): string {
    const tender = this.selectedTender();
    if (!tender) return '';
    if (tender.status === 'contract_active' || tender.status === 'cancelled') return '';
    return 'gates_checklist';
  }

  getPhaseLabel(): string {
    const tender = this.selectedTender();
    if (!tender) return '';
    const labels: Record<string, string> = {
      draft: 'Capture', specifications: 'BSC Review', published: 'Advertise',
      closed: 'Closed', evaluation: 'BEC Evaluation', adjudication: 'BAC Adjudication',
      awarded: 'Award', contract_active: 'Contract Active', cancelled: 'Cancelled'
    };
    return labels[tender.status] || tender.status;
  }

  getPhaseIcon(): string {
    const tender = this.selectedTender();
    if (!tender) return 'info';
    const icons: Record<string, string> = {
      draft: 'edit_note', specifications: 'description', published: 'campaign',
      closed: 'lock', evaluation: 'rate_review', adjudication: 'gavel',
      awarded: 'emoji_events', contract_active: 'verified'
    };
    return icons[tender.status] || 'info';
  }

  getPhaseGates(): { label: string; met: boolean }[] {
    const tender = this.selectedTender();
    if (!tender) return [];
    switch (tender.status) {
      case 'draft':
        return [
          { label: 'Tender details completed (title, description)', met: !!tender.title && !!tender.description },
          { label: 'Closing date set', met: !!tender.closingDate },
          { label: 'Buyer assigned', met: !!tender.assignedBuyer },
          { label: 'Budget verified', met: !!tender.complianceChecks?.budgetVerified },
          { label: 'Submit to BSC for specification review', met: false }
        ];
      case 'specifications':
        return [
          { label: 'Specifications submitted to BSC', met: true },
          { label: 'BSC specification approval', met: tender.committees?.bsc?.status === 'approved' },
          { label: 'Budget verified', met: !!tender.complianceChecks?.budgetVerified },
          { label: 'Buyer assigned', met: !!tender.assignedBuyer },
          { label: 'Mandatory documents uploaded', met: (tender.documents?.length || 0) > 0 }
        ];
      case 'published':
        return [
          { label: 'Closing date reached or all bids received', met: tender.closingDate ? new Date(tender.closingDate) <= new Date() : false },
          { label: 'Bidders registered', met: (tender.bidders?.length || 0) > 0 }
        ];
      case 'closed':
        return [
          { label: 'Tender opening approved', met: tender.openingApproval?.status === 'approved' },
          { label: 'Bidder compliance verified', met: tender.bidders?.every((b: any) => b.complianceChecked) || false }
        ];
      case 'evaluation':
        return [
          { label: 'All responsive bidders scored', met: tender.bidders?.filter((b: any) => b.responsive).every((b: any) => b.totalScore != null) || false },
          { label: 'BEC recommendation submitted', met: tender.committees?.bec?.status === 'completed' || tender.committees?.bec?.status === 'approved' }
        ];
      case 'adjudication':
        return [
          { label: 'BAC reviewed BEC recommendation', met: tender.committees?.bac?.status === 'completed' || tender.committees?.bac?.status === 'approved' },
          { label: 'Award decision made', met: tender.status === 'awarded' }
        ];
      case 'awarded':
        return [
          { label: 'Accounting Officer approval', met: !!tender.aoApproval }
        ];
      default:
        return [];
    }
  }

  allGatesMet(): boolean {
    const gates = this.getPhaseGates();
    if (gates.length === 0) return true;
    return gates.slice(0, -1).every(g => g.met);
  }

  getNextStepAction(): string {
    const tender = this.selectedTender();
    if (!tender) return '';
    if (tender.status === 'draft' && this.canSubmitToBsc()) return 'Submit to BSC';
    if (tender.status === 'specifications' && this.isReadyToPublish()) return 'Publish Tender';
    if (tender.status === 'closed') return 'Start Evaluation';
    return '';
  }

  getNextStepActionIcon(): string {
    const tender = this.selectedTender();
    if (!tender) return 'arrow_forward';
    const icons: Record<string, string> = {
      draft: 'send', specifications: 'campaign', closed: 'rate_review'
    };
    return icons[tender.status] || 'arrow_forward';
  }

  executeNextStepAction() {
    const tender = this.selectedTender();
    if (!tender) return;
    if (tender.status === 'draft') this.submitToBsc();
    else if (tender.status === 'specifications') this.publishTender();
    else if (tender.status === 'closed') this.startEvaluation();
  }

  canSubmitToBsc(): boolean {
    const tender = this.selectedTender();
    if (!tender) return false;
    if (tender.status !== 'draft') return false;
    return !!tender.title && !!tender.description;
  }

  submitToBsc() {
    const tender = this.selectedTender();
    if (!tender) return;
    if (!this.canSubmitToBsc()) {
      window.alert('Please complete the tender title and description before submitting to BSC.');
      return;
    }
    if (!window.confirm('Submit this tender to the Bid Specification Committee (BSC) for specification review?\n\nOnce submitted, the tender status will change to "Specifications" and the BSC will need to approve before you can publish.')) return;
    this.saving.set(true);
    this.http.post<any>(`${environment.apiUrl}/tenders/${tender.id}/submit-specifications`, {}).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.selectedTender.set(res.tender || res);
        this.detailTab.set('bsc');
        this.showNotification('Tender submitted to BSC for specification review');
        this.loadPipeline();
        this.loadTenders();
      },
      error: (err) => {
        this.saving.set(false);
        this.showNotification(err.error?.error || 'Failed to submit to BSC');
      }
    });
  }

  getComplianceIcon(status: string): string {
    return status === 'valid' || status === 'active' || status === 'clear' ? 'check_circle' : 'cancel';
  }

  getComplianceColor(status: string): string {
    return status === 'valid' || status === 'active' || status === 'clear' ? '#2e7d32' : '#c62828';
  }

  getBscStatus(): string {
    return this.selectedTender()?.committees?.bsc?.status || 'not_started';
  }

  getBscStatusLabel(): string {
    return this.getStatusLabel(this.getBscStatus());
  }

  getBecStatus(): string {
    return this.selectedTender()?.committees?.bec?.status || 'not_started';
  }

  getBecStatusLabel(): string {
    return this.getStatusLabel(this.getBecStatus());
  }

  getBacStatus(): string {
    return this.selectedTender()?.committees?.bac?.status || 'not_started';
  }

  getBacStatusLabel(): string {
    return this.getStatusLabel(this.getBacStatus());
  }

  getBecMembers(): string[] {
    const bec = this.selectedTender()?.committees?.bec;
    if (!bec?.members) return [];
    return bec.members.filter((m: string) => m !== bec.chairperson);
  }

  getBacMembers(): string[] {
    const bac = this.selectedTender()?.committees?.bac;
    if (!bac?.members) return [];
    return bac.members.filter((m: string) => m !== bac.chairperson);
  }

  getResponsiveBidders(): any[] {
    return this.selectedTender()?.bidders?.filter((b: any) => b.responsive) || [];
  }

  getScoredBidders(): any[] {
    const bidders = this.selectedTender()?.bidders || [];
    return bidders
      .filter((b: any) => b.totalScore != null)
      .sort((a: any, b: any) => (b.totalScore || 0) - (a.totalScore || 0));
  }

  hasFunctionalityScores(): boolean {
    const bidders = this.getResponsiveBidders();
    return bidders.some((b: any) => b.functionalityScores?.length > 0);
  }

  getFunctionalityScore(bidder: any, criterion: string): string {
    if (!bidder.functionalityScores) return '—';
    const score = bidder.functionalityScores.find((s: any) => s.criterion === criterion);
    return score ? String(score.score) : '—';
  }

  getTotalWeight(): number {
    const criteria = this.selectedTender()?.functionalityCriteria || [];
    return criteria.reduce((sum: number, c: any) => sum + (c.weight || 0), 0);
  }

  getWinningBidder(): any {
    const bidders = this.selectedTender()?.bidders || [];
    return bidders.find((b: any) => b.status === 'awarded' || b.ranking === 1);
  }

  hasAwardLetter(): boolean {
    const docs = this.selectedTender()?.documents || [];
    return docs.some((d: any) => d.type === 'award_letter');
  }

  loadApprovedRequisitions() {
    this.http.get<any>(`${environment.apiUrl}/requisitions`, {
      params: { status: 'final_approved' }
    }).subscribe({
      next: (res) => {
        const reqs = res.data || res || [];
        this.linkedRequisitions.set(Array.isArray(reqs) ? reqs : []);
      },
      error: () => this.linkedRequisitions.set([])
    });
  }

  onRequisitionSelected(reqId: string) {
    if (!reqId) {
      this.tenderForm.linkedRequisitionRef = '';
      return;
    }
    const req = this.linkedRequisitions().find((r: any) => r.id === reqId);
    if (req) {
      this.tenderForm.linkedRequisitionRef = req.referenceNumber + ' — ' + req.title;
      if (req.totalEstimatedValue?.amount) {
        this.tenderForm.estimatedValue = req.totalEstimatedValue.amount;
      }
    }
  }

  onDocFileSelected(event: any) {
    const file = event.target?.files?.[0];
    if (file) {
      this.formDocFile = file;
    }
  }

  addFormDocument() {
    if (!this.formDocFile || !this.formDocType) return;
    const docs = [...this.formDocuments()];
    docs.push({
      name: this.formDocFile.name,
      type: this.formDocType,
      date: this.formDocDate || new Date().toISOString().substring(0, 10),
      documentDate: this.formDocDate || '',
      file: this.formDocFile
    });
    this.formDocuments.set(docs);
    this.formDocFile = null;
    this.formDocType = '';
    this.formDocDate = '';
  }

  removeFormDocument(index: number) {
    const docs = [...this.formDocuments()];
    docs.splice(index, 1);
    this.formDocuments.set(docs);
  }

  tenderForm: any = {};
  saving = signal(false);
  notification = signal('');

  openNewTender() {
    this.tenderForm = {
      title: '',
      description: '',
      department: '',
      category: 'goods',
      estimatedValue: null,
      procurementMethod: 'competitive_bid',
      scoringMethod: '80/20',
      twoEnvelope: false,
      functionalityThreshold: 70,
      closingDate: null,
      briefingDate: null,
      briefingVenue: '',
      briefingMandatory: false,
      cidbGrading: '',
      validityPeriod: 90,
      assignedBuyer: '',
      linkedRequisitionId: '',
      linkedRequisitionRef: '',
      validityFromDate: null,
      validityToDate: null,
      bscPlannedDate: null,
      bscActualDate: null,
      advertisePlannedDate: null,
      evaluationPlannedDate: null,
      adjudicationPlannedDate: null,
      specPurpose: '',
      specBackground: '',
      specScope: '',
      specGeneralConditions: '',
      specSpecificConditions: '',
      specComments: ''
    };
    this.formDocuments.set([]);
    this.formDocFile = null;
    this.formDocType = '';
    this.formDocDate = '';
    this.loadApprovedRequisitions();
    this.currentView.set('create');
  }

  editTender(tender: any) {
    this.tenderForm = {
      id: tender.id,
      title: tender.title || '',
      description: tender.description || '',
      department: tender.department || '',
      category: tender.category || 'goods',
      estimatedValue: tender.estimatedValue?.amount || null,
      procurementMethod: tender.procurementMethod || 'competitive_bid',
      scoringMethod: tender.scoringMethod || '80/20',
      twoEnvelope: tender.twoEnvelope || false,
      functionalityThreshold: tender.functionalityThreshold || 70,
      closingDate: tender.closingDate ? new Date(tender.closingDate) : null,
      briefingDate: tender.briefingDate ? new Date(tender.briefingDate) : null,
      briefingVenue: tender.briefingVenue || '',
      briefingMandatory: tender.briefingMandatory || false,
      cidbGrading: tender.cidbGrading || '',
      validityPeriod: tender.validityPeriod || 90,
      assignedBuyer: tender.assignedBuyer || '',
      linkedRequisitionId: tender.linkedRequisitionId || '',
      linkedRequisitionRef: tender.linkedRequisitionRef || '',
      validityFromDate: tender.validityFromDate ? new Date(tender.validityFromDate) : null,
      validityToDate: tender.validityToDate ? new Date(tender.validityToDate) : null,
      bscPlannedDate: tender.bscPlannedDate ? new Date(tender.bscPlannedDate) : null,
      bscActualDate: tender.bscActualDate ? new Date(tender.bscActualDate) : null,
      advertisePlannedDate: tender.advertisePlannedDate ? new Date(tender.advertisePlannedDate) : null,
      evaluationPlannedDate: tender.evaluationPlannedDate ? new Date(tender.evaluationPlannedDate) : null,
      adjudicationPlannedDate: tender.adjudicationPlannedDate ? new Date(tender.adjudicationPlannedDate) : null,
      specPurpose: tender.specPurpose || '',
      specBackground: tender.specBackground || '',
      specScope: tender.specScope || '',
      specGeneralConditions: tender.specGeneralConditions || '',
      specSpecificConditions: tender.specSpecificConditions || '',
      specComments: tender.specComments || ''
    };
    this.formDocuments.set(tender.documents || []);
    this.formDocFile = null;
    this.formDocType = '';
    this.formDocDate = '';
    this.loadApprovedRequisitions();
    this.currentView.set('edit');
  }

  private buildTenderPayload(): any {
    return {
      title: this.tenderForm.title,
      description: this.tenderForm.description,
      department: this.tenderForm.department,
      category: this.tenderForm.category,
      estimatedValue: { amount: Number(this.tenderForm.estimatedValue) || 0, currency: 'ZAR' },
      twoEnvelope: this.tenderForm.twoEnvelope,
      functionalityThreshold: this.tenderForm.functionalityThreshold || 70,
      closingDate: this.tenderForm.closingDate ? new Date(this.tenderForm.closingDate).toISOString() : null,
      briefingDate: this.tenderForm.briefingDate ? new Date(this.tenderForm.briefingDate).toISOString() : null,
      briefingVenue: this.tenderForm.briefingVenue || null,
      briefingMandatory: this.tenderForm.briefingMandatory || false,
      cidbGrading: this.tenderForm.cidbGrading || null,
      validityPeriod: this.tenderForm.validityPeriod || 90,
      assignedBuyer: this.tenderForm.assignedBuyer || null,
      linkedRequisitionId: this.tenderForm.linkedRequisitionId || null,
      linkedRequisitionRef: this.tenderForm.linkedRequisitionRef || null,
      validityFromDate: this.tenderForm.validityFromDate ? new Date(this.tenderForm.validityFromDate).toISOString() : null,
      validityToDate: this.tenderForm.validityToDate ? new Date(this.tenderForm.validityToDate).toISOString() : null,
      bscPlannedDate: this.tenderForm.bscPlannedDate ? new Date(this.tenderForm.bscPlannedDate).toISOString() : null,
      bscActualDate: this.tenderForm.bscActualDate ? new Date(this.tenderForm.bscActualDate).toISOString() : null,
      advertisePlannedDate: this.tenderForm.advertisePlannedDate ? new Date(this.tenderForm.advertisePlannedDate).toISOString() : null,
      evaluationPlannedDate: this.tenderForm.evaluationPlannedDate ? new Date(this.tenderForm.evaluationPlannedDate).toISOString() : null,
      adjudicationPlannedDate: this.tenderForm.adjudicationPlannedDate ? new Date(this.tenderForm.adjudicationPlannedDate).toISOString() : null,
      specPurpose: this.tenderForm.specPurpose || null,
      specBackground: this.tenderForm.specBackground || null,
      specScope: this.tenderForm.specScope || null,
      specGeneralConditions: this.tenderForm.specGeneralConditions || null,
      specSpecificConditions: this.tenderForm.specSpecificConditions || null,
      specComments: this.tenderForm.specComments || null
    };
  }

  saveTender() {
    this.saving.set(true);
    const payload = this.buildTenderPayload();

    if (this.currentView() === 'edit' && this.tenderForm.id) {
      this.http.put<any>(`${environment.apiUrl}/tenders/${this.tenderForm.id}`, payload).subscribe({
        next: (data) => {
          this.saving.set(false);
          this.showNotification('Tender updated successfully');
          this.selectedTender.set(data);
          this.currentView.set('detail');
          this.loadPipeline();
          this.loadTenders();
        },
        error: (err) => {
          this.saving.set(false);
          this.showNotification(err.error?.error || 'Failed to update tender');
        }
      });
    } else {
      this.http.post<any>(`${environment.apiUrl}/tenders`, payload).subscribe({
        next: (data) => {
          this.saving.set(false);
          this.showNotification('Tender created successfully');
          this.selectedTender.set(data);
          this.currentView.set('detail');
          this.loadPipeline();
          this.loadTenders();
        },
        error: (err) => {
          this.saving.set(false);
          this.showNotification(err.error?.error || 'Failed to create tender');
        }
      });
    }
  }

  saveAndPublish() {
    this.saving.set(true);
    const payload = this.buildTenderPayload();

    const doPublish = (id: string) => {
      this.http.post<any>(`${environment.apiUrl}/tenders/${id}/publish`, {}).subscribe({
        next: (res) => {
          this.saving.set(false);
          this.showNotification('Tender published successfully');
          this.selectedTender.set(res.tender || res);
          this.currentView.set('detail');
          this.loadPipeline();
          this.loadTenders();
        },
        error: (err) => {
          this.saving.set(false);
          const gates = err.error?.complianceGates;
          if (gates && gates.length > 0) {
            const gateList = gates.map((g: string) => `• ${g}`).join('\n');
            window.alert(`Cannot publish yet — the following compliance gates must be met first:\n\n${gateList}\n\nThe tender has been saved as a draft. Please complete these steps before publishing.`);
          } else {
            const msg = err.error?.error || 'Failed to publish tender';
            window.alert(`Cannot publish: ${msg}\n\nThe tender has been saved as a draft.`);
          }
        }
      });
    };

    if (this.currentView() === 'edit' && this.tenderForm.id) {
      this.http.put<any>(`${environment.apiUrl}/tenders/${this.tenderForm.id}`, payload).subscribe({
        next: (data) => doPublish(data.id),
        error: (err) => {
          this.saving.set(false);
          this.showNotification(err.error?.error || 'Failed to save tender');
        }
      });
    } else {
      this.http.post<any>(`${environment.apiUrl}/tenders`, payload).subscribe({
        next: (data) => doPublish(data.id),
        error: (err) => {
          this.saving.set(false);
          this.showNotification(err.error?.error || 'Failed to create tender');
        }
      });
    }
  }

  publishTender() {
    const tender = this.selectedTender();
    if (!tender) return;
    if (this.buyerGateEnabled && !tender.assignedBuyer) {
      window.alert('Please assign a buyer before publishing this tender.');
      return;
    }
    if (!window.confirm('Are you sure you want to publish this tender for bidding?')) return;
    this.saving.set(true);
    this.http.post<any>(`${environment.apiUrl}/tenders/${tender.id}/publish`, {}).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.selectedTender.set(res.tender || res);
        this.detailTab.set('overview');
        this.showNotification('Tender published — now open for bidding');
        this.loadPipeline();
        this.loadTenders();
      },
      error: (err) => {
        this.saving.set(false);
        const gates = err.error?.complianceGates;
        if (gates && gates.length > 0) {
          const gateList = gates.map((g: string) => `• ${g}`).join('\n');
          window.alert(`Cannot publish yet — the following compliance gates must be met first:\n\n${gateList}`);
        } else {
          const msg = err.error?.error || 'Failed to publish tender';
          window.alert(`Cannot publish: ${msg}`);
        }
      }
    });
  }

  isReadyToPublish(): boolean {
    const tender = this.selectedTender();
    if (!tender) return false;
    if (tender.status !== 'specifications') return false;
    if (tender.committees?.bsc?.status !== 'approved') return false;
    if (!tender.complianceChecks?.budgetVerified) return false;
    if (this.buyerGateEnabled && !tender.assignedBuyer) return false;
    return true;
  }

  closeTender() {
    const tender = this.selectedTender();
    if (!tender) return;
    if (!window.confirm('Are you sure you want to close this tender for bidding?')) return;
    this.saving.set(true);
    this.http.post<any>(`${environment.apiUrl}/tenders/${tender.id}/close`, {}).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.selectedTender.set(res.tender || res);
        this.detailTab.set('bidders');
        this.showNotification('Tender closed — review bidders then start BEC evaluation');
        this.loadPipeline();
        this.loadTenders();
      },
      error: (err) => {
        this.saving.set(false);
        this.showNotification(err.error?.error || 'Failed to close tender');
      }
    });
  }

  startEvaluation() {
    const tender = this.selectedTender();
    if (!tender) return;
    this.saving.set(true);
    this.http.post<any>(`${environment.apiUrl}/tenders/${tender.id}/bec/start`, {}).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.selectedTender.set(res.tender || res);
        this.detailTab.set('bec');
        this.showNotification('BEC evaluation started');
        this.loadPipeline();
        this.loadTenders();
      },
      error: (err) => {
        this.saving.set(false);
        this.showNotification(err.error?.error || 'Failed to start evaluation');
      }
    });
  }

  startAdjudication() {
    const tender = this.selectedTender();
    if (!tender) return;
    this.saving.set(true);
    this.http.post<any>(`${environment.apiUrl}/tenders/${tender.id}/bac/start`, {}).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.selectedTender.set(res.tender || res);
        this.detailTab.set('bac');
        this.showNotification('BAC adjudication started');
        this.loadPipeline();
        this.loadTenders();
      },
      error: (err) => {
        this.saving.set(false);
        this.showNotification(err.error?.error || 'Failed to start adjudication');
      }
    });
  }

  requestVoid() {
    const tender = this.selectedTender();
    if (!tender) return;
    const reason = window.prompt('Reason for voiding this tender:');
    if (!reason) return;
    this.saving.set(true);
    this.http.post<any>(`${environment.apiUrl}/tenders/${tender.id}/void-request`, { reason }).subscribe({
      next: (res) => { this.saving.set(false); this.selectedTender.set(res.tender); this.showNotification('Void request submitted for approval'); },
      error: (err) => { this.saving.set(false); this.showNotification(err.error?.error || 'Failed'); }
    });
  }

  approveVoid() {
    const tender = this.selectedTender();
    if (!tender) return;
    this.saving.set(true);
    this.http.post<any>(`${environment.apiUrl}/tenders/${tender.id}/void-approve`, {}).subscribe({
      next: (res) => { this.saving.set(false); this.selectedTender.set(res.tender); this.showNotification('Void approved - tender cancelled'); this.loadTenders(); },
      error: (err) => { this.saving.set(false); this.showNotification(err.error?.error || 'Failed'); }
    });
  }

  rejectVoid() {
    const tender = this.selectedTender();
    if (!tender) return;
    const reason = window.prompt('Reason for rejecting void request:');
    this.saving.set(true);
    this.http.post<any>(`${environment.apiUrl}/tenders/${tender.id}/void-reject`, { reason }).subscribe({
      next: (res) => { this.saving.set(false); this.selectedTender.set(res.tender); this.showNotification('Void request rejected'); },
      error: (err) => { this.saving.set(false); this.showNotification(err.error?.error || 'Failed'); }
    });
  }

  cancelTender() {
    const tender = this.selectedTender();
    if (!tender) return;
    if (tender.cidbGrading) {
      const proceed = window.confirm(`This tender has CIDB grading "${tender.cidbGrading}". Cancelling will trigger a notification to the CIDB. Do you wish to proceed?`);
      if (!proceed) return;
    }
    const reason = window.prompt('Please provide a reason for cancelling this tender:');
    if (!reason) return;
    const voidRef = window.prompt('Enter void reference number (optional):') || '';
    this.saving.set(true);
    this.http.post<any>(`${environment.apiUrl}/tenders/${tender.id}/cancel`, { reason, voidReference: voidRef }).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.selectedTender.set(res.tender || res);
        if (res.cidbNotification) {
          this.showNotification(`Tender cancelled. CIDB notified for grading ${res.cidbNotification.grading}.`);
        } else {
          this.showNotification('Tender cancelled');
        }
        this.loadPipeline();
        this.loadTenders();
      },
      error: (err) => {
        this.saving.set(false);
        this.showNotification(err.error?.error || 'Failed to cancel tender');
      }
    });
  }

  deleteTender() {
    const tender = this.selectedTender();
    if (!tender) return;
    if (!window.confirm('Are you sure you want to delete this tender? This action cannot be undone.')) return;
    this.saving.set(true);
    this.http.delete<any>(`${environment.apiUrl}/tenders/${tender.id}`).subscribe({
      next: () => {
        this.saving.set(false);
        this.showNotification('Tender deleted');
        this.backToList();
        this.loadPipeline();
        this.loadTenders();
      },
      error: (err) => {
        this.saving.set(false);
        this.showNotification(err.error?.error || 'Failed to delete tender');
      }
    });
  }

  bscApprove() {
    const tender = this.selectedTender();
    if (!tender) return;
    if (!window.confirm('Approve BSC specifications for this tender?')) return;
    this.saving.set(true);
    this.http.post<any>(`${environment.apiUrl}/tenders/${tender.id}/bsc/approve`, {
      recommendation: this.bscComments || 'Specifications approved by BSC'
    }).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.selectedTender.set(res.tender || res);
        this.showNotification('BSC specifications approved');
        this.loadPipeline();
        this.loadTenders();
      },
      error: (err) => {
        this.saving.set(false);
        this.showNotification(err.error?.error || 'Failed to approve specifications');
      }
    });
  }

  bscReject() {
    const tender = this.selectedTender();
    if (!tender) return;
    const comments = this.bscComments || window.prompt('Provide comments for rejecting specifications:');
    if (!comments) return;
    this.saving.set(true);
    this.http.post<any>(`${environment.apiUrl}/tenders/${tender.id}/bsc/revise`, {
      comments
    }).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.selectedTender.set(res.tender || res);
        this.showNotification('BSC specifications returned for revision');
        this.loadPipeline();
        this.loadTenders();
      },
      error: (err) => {
        this.saving.set(false);
        this.showNotification(err.error?.error || 'Failed to reject specifications');
      }
    });
  }

  bscLevel2Approve() {
    const tender = this.selectedTender();
    if (!tender) return;
    this.saving.set(true);
    this.http.post<any>(`${environment.apiUrl}/tenders/${tender.id}/bsc/level2-approve`, {
      recommendation: this.bscL2Comments || 'BSC Level 2 approved specifications'
    }).subscribe({
      next: (res) => { this.saving.set(false); this.selectedTender.set(res.tender); this.showNotification('BSC Level 2 approved'); this.bscL2Comments = ''; },
      error: (err) => { this.saving.set(false); this.showNotification(err.error?.error || 'BSC Level 2 approval failed'); }
    });
  }

  bscLevel2Revise() {
    const tender = this.selectedTender();
    if (!tender) return;
    const reason = this.bscL2Comments || window.prompt('Revision reason:');
    if (!reason) return;
    this.saving.set(true);
    this.http.post<any>(`${environment.apiUrl}/tenders/${tender.id}/bsc/level2-revise`, { comments: reason }).subscribe({
      next: (res) => { this.saving.set(false); this.selectedTender.set(res.tender); this.showNotification('BSC Level 2 revision requested'); this.bscL2Comments = ''; },
      error: (err) => { this.saving.set(false); this.showNotification(err.error?.error || 'Failed'); }
    });
  }

  approveOpening() {
    const tender = this.selectedTender();
    if (!tender) return;
    this.saving.set(true);
    this.http.post<any>(`${environment.apiUrl}/tenders/${tender.id}/opening-approve`, { comments: this.openingComments }).subscribe({
      next: (res) => { this.saving.set(false); this.selectedTender.set(res.tender); this.showNotification('Tender opening approved'); this.openingComments = ''; },
      error: (err) => { this.saving.set(false); this.showNotification(err.error?.error || 'Failed'); }
    });
  }

  rejectOpening() {
    const tender = this.selectedTender();
    if (!tender) return;
    const reason = this.openingComments || window.prompt('Rejection reason:');
    if (!reason) return;
    this.saving.set(true);
    this.http.post<any>(`${environment.apiUrl}/tenders/${tender.id}/opening-reject`, { reason }).subscribe({
      next: (res) => { this.saving.set(false); this.selectedTender.set(res.tender); this.showNotification('Opening rejected'); this.openingComments = ''; },
      error: (err) => { this.saving.set(false); this.showNotification(err.error?.error || 'Failed'); }
    });
  }

  becSubmit() {
    const tender = this.selectedTender();
    if (!tender) return;
    if (!window.confirm('Submit BEC evaluation for this tender?')) return;
    this.saving.set(true);

    const startBac = () => {
      this.http.post<any>(`${environment.apiUrl}/tenders/${tender.id}/bac/start`, {}).subscribe({
        next: (res) => {
          this.saving.set(false);
          this.selectedTender.set(res.tender || res);
          this.detailTab.set('bac');
          this.showNotification('BEC evaluation submitted — tender auto-advanced to BAC adjudication');
          this.becComments = '';
          this.loadPipeline();
          this.loadTenders();
        },
        error: (err) => {
          this.saving.set(false);
          this.selectedTender.update(t => t);
          this.detailTab.set('bac');
          this.showNotification('BEC evaluation completed — ready for BAC adjudication');
          this.becComments = '';
          this.loadPipeline();
          this.loadTenders();
        }
      });
    };

    const doBecComplete = () => {
      this.http.post<any>(`${environment.apiUrl}/tenders/${tender.id}/bec/complete`, {
        recommendation: this.becComments || 'BEC evaluation completed'
      }).subscribe({
        next: (res) => {
          this.selectedTender.set(res.tender || res);
          startBac();
        },
        error: (err) => {
          this.saving.set(false);
          const msg = err.error?.error || 'Failed to submit BEC evaluation';
          window.alert(`BEC Submission Failed: ${msg}`);
        }
      });
    };

    if (tender.status === 'closed') {
      this.http.post<any>(`${environment.apiUrl}/tenders/${tender.id}/bec/start`, {}).subscribe({
        next: (res) => {
          this.selectedTender.set(res.tender || res);
          doBecComplete();
        },
        error: (err) => {
          this.saving.set(false);
          const msg = err.error?.error || 'Failed to start BEC evaluation';
          window.alert(`Cannot start BEC evaluation: ${msg}`);
        }
      });
    } else {
      doBecComplete();
    }
  }

  bacDecide(decision: string) {
    const tender = this.selectedTender();
    if (!tender) return;
    const labels: Record<string, string> = { award: 'Award', cancel: 'Reject', refer_back: 'Refer Back' };
    if (!window.confirm(`Are you sure you want to ${labels[decision] || decision} this tender?`)) return;
    this.saving.set(true);
    this.http.post<any>(`${environment.apiUrl}/tenders/${tender.id}/bac/decide`, {
      decision,
      recommendation: this.bacComments || `BAC decision: ${labels[decision] || decision}`
    }).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.selectedTender.set(res.tender || res);
        if (decision === 'award') {
          this.detailTab.set('award');
          this.showNotification('BAC awarded — tender auto-advanced to Award/AO Approval');
        } else if (decision === 'refer_back') {
          this.detailTab.set('bec');
          this.showNotification('BAC referred back to BEC for re-evaluation');
        } else {
          this.showNotification(`BAC decision: ${labels[decision] || decision}`);
        }
        this.bacComments = '';
        this.loadPipeline();
        this.loadTenders();
      },
      error: (err) => {
        this.saving.set(false);
        this.showNotification(err.error?.error || 'Failed to submit BAC decision');
      }
    });
  }

  loadBoq() {
    const tender = this.selectedTender();
    if (!tender) return;
    this.http.get<any>(`${environment.apiUrl}/tenders/${tender.id}/boq`).subscribe({
      next: (data) => this.boqItems.set(data.boqItems || []),
      error: () => this.boqItems.set([])
    });
    this.loadBoqComparison();
  }

  loadBoqComparison() {
    const tender = this.selectedTender();
    if (!tender || !tender.bidders?.length) return;
    this.http.get<any>(`${environment.apiUrl}/tenders/${tender.id}/boq/comparison`).subscribe({
      next: (data) => {
        this.boqComparison.set(data.comparison || []);
        const bidders = (data.comparison?.[0]?.bidderPrices || []).map((bp: any) => ({ bidderId: bp.bidderId, supplierName: bp.supplierName }));
        this.comparisonBidders.set(bidders);
      },
      error: () => { this.boqComparison.set([]); this.comparisonBidders.set([]); }
    });
  }

  addBoqItem() {
    const tender = this.selectedTender();
    if (!tender) return;
    this.http.post<any>(`${environment.apiUrl}/tenders/${tender.id}/boq`, {
      items: [{ ...this.boqForm, projectItem: this.newBoqProjectItem }]
    }).subscribe({
      next: () => {
        this.showBoqForm = false;
        this.boqForm = { description: '', section: 'General', unit: 'each', quantity: 0, estimatedRate: 0, notes: '' };
        this.newBoqProjectItem = '';
        this.loadBoq();
        this.showNotification('BOQ item added');
      },
      error: (err) => this.showNotification(err.error?.error || 'Failed to add BOQ item')
    });
  }

  deleteBoqItem(boqId: string) {
    const tender = this.selectedTender();
    if (!tender || !window.confirm('Remove this BOQ item?')) return;
    this.http.delete<any>(`${environment.apiUrl}/tenders/${tender.id}/boq/${boqId}`).subscribe({
      next: () => { this.loadBoq(); this.showNotification('BOQ item removed'); },
      error: (err) => this.showNotification(err.error?.error || 'Failed to remove item')
    });
  }

  getBoqTotal(): number {
    return this.boqItems().reduce((sum, item) => sum + (item.estimatedTotal || 0), 0);
  }

  importBoqDialog() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev: any) => {
        const text = ev.target.result;
        const lines = text.split('\n').filter((l: string) => l.trim());
        if (lines.length < 2) { this.showNotification('CSV must have header + data rows'); return; }
        const items = lines.slice(1).map((line: string) => {
          const cols = line.split(',').map((c: string) => c.trim().replace(/^"|"$/g, ''));
          return {
            description: cols[0] || '',
            section: cols[1] || 'General',
            unit: cols[2] || 'each',
            quantity: Number(cols[3]) || 0,
            estimatedRate: Number(cols[4]) || 0,
            notes: cols[5] || ''
          };
        }).filter((i: any) => i.description);
        if (!items.length) { this.showNotification('No valid items found in CSV'); return; }
        const tender = this.selectedTender();
        if (!tender) return;
        this.http.post<any>(`${environment.apiUrl}/tenders/${tender.id}/boq`, { items }).subscribe({
          next: (res) => { this.loadBoq(); this.showNotification(`${res.added?.length || items.length} BOQ items imported`); },
          error: (err) => this.showNotification(err.error?.error || 'Failed to import BOQ')
        });
      };
      reader.readAsText(file);
    };
    input.click();
  }

  aoApprove() {
    const tender = this.selectedTender();
    if (!tender) return;
    const comments = window.prompt('AO approval comments (optional):') || '';
    this.saving.set(true);
    this.http.post<any>(`${environment.apiUrl}/tenders/${tender.id}/ao-approve`, { approved: true, comments }).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.selectedTender.set(res.tender || res);
        this.showNotification('AO approved — contract activated');
        this.loadPipeline();
        this.loadTenders();
      },
      error: (err) => {
        this.saving.set(false);
        this.showNotification(err.error?.error || 'Failed to submit AO approval');
      }
    });
  }

  aoReject() {
    const tender = this.selectedTender();
    if (!tender) return;
    const comments = window.prompt('Reason for rejection (required):');
    if (!comments) return;
    this.saving.set(true);
    this.http.post<any>(`${environment.apiUrl}/tenders/${tender.id}/ao-approve`, { approved: false, comments }).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.selectedTender.set(res.tender || res);
        this.showNotification('AO rejected — referred back to BAC');
        this.loadPipeline();
        this.loadTenders();
      },
      error: (err) => {
        this.saving.set(false);
        this.showNotification(err.error?.error || 'Failed to submit AO rejection');
      }
    });
  }

  reInviteBids() {
    const tender = this.selectedTender();
    if (!tender) return;
    const reason = window.prompt('Reason for re-inviting bids (required):');
    if (!reason) return;
    const newClosingDate = window.prompt('New closing date (YYYY-MM-DD):') || '';
    const retainBidders = window.confirm('Retain existing bidders? Click OK to keep, Cancel to clear all.');
    this.saving.set(true);
    this.http.post<any>(`${environment.apiUrl}/tenders/${tender.id}/re-invite`, { reason, newClosingDate: newClosingDate || null, retainBidders }).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.selectedTender.set(res.tender || res);
        this.showNotification('Tender re-invited for new bids');
        this.loadPipeline();
        this.loadTenders();
      },
      error: (err) => {
        this.saving.set(false);
        this.showNotification(err.error?.error || 'Failed to re-invite');
      }
    });
  }

  assignBuyerDialog() {
    this.showBuyerSelector = true;
    this.selectedBuyerForAssign = '';
  }

  confirmAssignBuyer() {
    const tender = this.selectedTender();
    if (!tender || !this.selectedBuyerForAssign) return;
    const buyer = this.predefinedBuyers.find(b => b.id === this.selectedBuyerForAssign);
    if (!buyer) return;
    this.saving.set(true);
    this.showBuyerSelector = false;
    this.http.post<any>(`${environment.apiUrl}/tenders/${tender.id}/assign-buyer`, { buyerId: buyer.id, buyerName: buyer.name }).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.selectedTender.set(res.tender || res);
        this.showNotification(`Buyer ${buyer.name} assigned successfully`);
        this.loadPipeline();
        this.loadTenders();
      },
      error: (err) => {
        this.saving.set(false);
        this.showNotification(err.error?.error || 'Failed to assign buyer');
      }
    });
  }

  cancelAssignBuyer() {
    this.showBuyerSelector = false;
    this.selectedBuyerForAssign = '';
  }

  registerBidder() {
    const tender = this.selectedTender();
    if (!tender) return;
    this.saving.set(true);
    const payload = {
      supplierName: this.newBidderForm.supplierName,
      bidAmount: { amount: Number(this.newBidderForm.bidAmount) || 0, currency: 'ZAR' },
      bbbeeLevel: this.newBidderForm.bbbeeLevel || 1,
      contactEmail: this.newBidderForm.contactEmail || '',
      contactPerson: this.newBidderForm.contactPerson || '',
      registrationNumber: this.newBidderForm.registrationNumber || '',
      briefingAttended: this.newBidderForm.briefingAttended || false
    };
    this.http.post<any>(`${environment.apiUrl}/tenders/${tender.id}/bidders`, payload).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.selectedTender.set(res.tender || res);
        this.showBidderForm = false;
        this.newBidderForm = { supplierName: '', bidAmount: null, bbbeeLevel: 1, contactEmail: '', contactPerson: '', registrationNumber: '', briefingAttended: false };
        this.showNotification('Bidder registered successfully');
        this.loadTenders();
      },
      error: (err) => {
        this.saving.set(false);
        this.showNotification(err.error?.error || 'Failed to register bidder');
      }
    });
  }

  navigateToRequisition() {
    const tender = this.selectedTender();
    if (!tender) return;
    const reqId = tender.linkedRequisitionId || tender.linkedRequisition;
    if (reqId) {
      window.location.hash = '';
      const url = `/requisitions?id=${reqId}`;
      window.open(url, '_self');
    }
  }

  createPurchaseOrderFromTender() {
    const tender = this.selectedTender();
    if (!tender) return;
    if (tender.linkedPurchaseOrder) {
      this.showNotification(`PO ${tender.linkedPurchaseOrder} already exists for this tender`);
      return;
    }
    this.saving.set(true);
    this.http.post<any>(`${environment.apiUrl}/tenders/${tender.id}/generate-order`, {}).subscribe({
      next: (res) => {
        this.saving.set(false);
        const updatedTender = { ...tender, linkedPurchaseOrder: res.order?.referenceNumber || res.order?.id };
        this.selectedTender.set(updatedTender);
        this.showNotification(`Purchase Order ${res.order?.referenceNumber || res.order?.id} created from tender ${tender.referenceNumber}`);
        this.loadTenders();
      },
      error: (err) => {
        this.saving.set(false);
        this.showNotification(err.error?.error || 'Failed to generate purchase order');
      }
    });
  }

  navigateToPurchaseOrder() {
    const tender = this.selectedTender();
    if (!tender?.linkedPurchaseOrder) return;
    window.open(`/orders?id=${tender.linkedPurchaseOrder}`, '_self');
  }

  printTender() {
    window.print();
  }

  generateReport(type: string) {
    const tender = this.selectedTender();
    if (!tender) return;
    const titles: Record<string, string> = { tender: 'Tender Summary Report', bbbee: 'B-BBEE Compliance Report', nt: 'National Treasury Report' };
    const bidders = tender.bidders || [];
    const awarded = bidders.filter((b: any) => b.status === 'awarded');

    if (type === 'bbbee') {
      const rows = bidders.map((b: any) => ({
        'Bidder': b.supplierName, 'B-BBEE Level': b.bbbeeLevel || 'N/A',
        'B-BBEE Points': b.bbbeePoints ?? '—', 'Status': b.responsive ? 'Responsive' : 'Non-Responsive',
        'Bid Amount': this.formatCurrencyFull(b.bidAmount?.amount)
      }));
      this.reportData.set({ title: titles[type], columns: ['Bidder', 'B-BBEE Level', 'B-BBEE Points', 'Status', 'Bid Amount'], rows, totalTenders: 1, totalValue: tender.estimatedValue?.amount || 0, awarded: awarded.length });
    } else if (type === 'nt') {
      const rows = [{
        'Reference': tender.referenceNumber, 'Description': tender.title, 'Department': tender.department,
        'Category': tender.category, 'Method': tender.procurementMethod, 'Value': this.formatCurrencyFull(tender.estimatedValue?.amount),
        'Status': tender.status, 'Award Date': tender.awardDate ? this.formatDate(tender.awardDate) : '—',
        'Awarded To': awarded[0]?.supplierName || '—'
      }];
      this.reportData.set({ title: titles[type], columns: ['Reference', 'Description', 'Department', 'Category', 'Method', 'Value', 'Status', 'Award Date', 'Awarded To'], rows, totalTenders: 1, totalValue: tender.estimatedValue?.amount || 0, awarded: awarded.length });
    } else {
      const rows = bidders.map((b: any) => ({
        'Bidder': b.supplierName, 'Bid Amount': this.formatCurrencyFull(b.bidAmount?.amount),
        'Price Score': b.priceScore?.toFixed(2) || '—', 'B-BBEE Points': b.bbbeePoints ?? '—',
        'Total Score': b.totalScore?.toFixed(2) || '—', 'Ranking': b.ranking || '—',
        'Status': b.status || (b.responsive ? 'Responsive' : 'Non-Responsive')
      }));
      this.reportData.set({ title: titles[type], columns: ['Bidder', 'Bid Amount', 'Price Score', 'B-BBEE Points', 'Total Score', 'Ranking', 'Status'], rows, totalTenders: 1, totalValue: tender.estimatedValue?.amount || 0, awarded: awarded.length });
    }
  }

  onApprovalDocSelected(event: any, stage: string) {
    const file = event.target.files[0];
    if (!file) return;
    this.showNotification(`Document "${file.name}" attached for ${stage.toUpperCase()} approval`);
  }

  getBidderPricingTotal(): number {
    return this.boqItems().reduce((sum, item) => sum + ((this.bidderPricing[item.id] || 0) * (item.quantity || 0)), 0);
  }

  saveBidderPricing() {
    const tender = this.selectedTender();
    if (!tender || !this.selectedBidderForPricing) return;
    const pricing = this.boqItems().map(item => ({
      boqItemId: item.id,
      rate: this.bidderPricing[item.id] || 0
    }));
    this.saving.set(true);
    this.http.post<any>(`${environment.apiUrl}/tenders/${tender.id}/boq/bidder-pricing`, {
      bidderId: this.selectedBidderForPricing,
      pricing
    }).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.showNotification('Bidder pricing saved');
        this.loadBoqComparison();
      },
      error: (err) => {
        this.saving.set(false);
        this.showNotification(err.error?.error || 'Failed to save pricing');
      }
    });
  }

  loadSubcontracting() {
    const tender = this.selectedTender();
    if (!tender) return;
    this.http.get<any>(`${environment.apiUrl}/tenders/${tender.id}/subcontracting`).subscribe({
      next: (res) => {
        this.subcontractingPlan.set(res.subcontractingPlan || { required: false, minimumPercentage: 0, plans: [] });
        this.subcontractingRequired = res.subcontractingPlan?.required || false;
        this.subcontractingMinPct = res.subcontractingPlan?.minimumPercentage || 0;
      },
      error: () => this.subcontractingPlan.set({ required: false, minimumPercentage: 0, plans: [] })
    });
  }

  getSubcontractingTotal(): number {
    const plans = this.subcontractingPlan()?.plans || [];
    return plans.reduce((s: number, p: any) => s + (p.percentage || 0), 0);
  }

  addSubcontractor() {
    const plan = this.subcontractingPlan();
    const plans = [...(plan?.plans || []), { ...this.subcontractorForm, id: `SUB-NEW-${Date.now()}`, verified: false }];
    this.subcontractingPlan.set({ ...plan, plans });
    this.subcontractorForm = { subcontractorName: '', registrationNumber: '', bbbeeLevel: null, workDescription: '', percentage: 0, value: 0 };
  }

  saveSubcontractingPlan() {
    const tender = this.selectedTender();
    if (!tender) return;
    const plan = this.subcontractingPlan();
    this.saving.set(true);
    this.http.post<any>(`${environment.apiUrl}/tenders/${tender.id}/subcontracting`, {
      required: this.subcontractingRequired,
      minimumPercentage: this.subcontractingMinPct,
      plans: plan?.plans || []
    }).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.subcontractingPlan.set(res.subcontractingPlan);
        this.showNotification('Sub-contracting plan saved');
      },
      error: (err) => {
        this.saving.set(false);
        this.showNotification(err.error?.error || 'Failed to save sub-contracting plan');
      }
    });
  }

  loadTenderDocuments() {
    const tender = this.selectedTender();
    if (!tender) return;
    const params: any = {};
    if (this.docTypeFilter) params.type = this.docTypeFilter;
    this.http.get<any>(`${environment.apiUrl}/tenders/${tender.id}/documents`, { params }).subscribe({
      next: (res) => this.tenderDocuments.set(res.documents || []),
      error: () => this.tenderDocuments.set([])
    });
  }

  uploadTenderDocument() {
    const tender = this.selectedTender();
    if (!tender) return;
    this.saving.set(true);
    this.http.post<any>(`${environment.apiUrl}/tenders/${tender.id}/documents`, this.newDocForm).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.newDocForm = { type: '', name: '', description: '' };
        this.loadTenderDocuments();
        this.showNotification('Document uploaded');
      },
      error: (err) => {
        this.saving.set(false);
        this.showNotification(err.error?.error || 'Failed to upload document');
      }
    });
  }

  deleteTenderDocument(doc: any) {
    const tender = this.selectedTender();
    if (!tender) return;
    if (!window.confirm(`Remove document "${doc.name}"? This action cannot be undone.`)) return;
    this.http.delete<any>(`${environment.apiUrl}/tenders/${tender.id}/documents/${doc.id}`).subscribe({
      next: () => {
        this.loadTenderDocuments();
        this.showNotification('Document removed');
      },
      error: (err) => this.showNotification(err.error?.error || 'Failed to remove document')
    });
  }

  formatDocType(type: string): string {
    return (type || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  getDocTypeBadgeColor(type: string): string {
    const colors: Record<string, string> = {
      tender_document: '#e3f2fd', specification: '#f3e5f5', addendum: '#fff3e0',
      bid_submission: '#e8f5e9', evaluation_report: '#fce4ec', award_letter: '#e0f2f1',
      contract: '#e8eaf6', correspondence: '#fff8e1', briefing_minutes: '#f1f8e9'
    };
    return colors[type] || '#f5f5f5';
  }

  recordBriefingSession() {
    const tender = this.selectedTender();
    if (!tender) return;
    this.saving.set(true);
    this.http.post<any>(`${environment.apiUrl}/tenders/${tender.id}/briefing-session`, {
      date: this.briefingForm.date,
      venue: this.briefingForm.venue,
      mandatory: this.briefingForm.mandatory,
      attendees: [],
      minutes: this.briefingForm.minutes,
      questionsRaised: []
    }).subscribe({
      next: (res) => {
        this.saving.set(false);
        const updated = { ...this.selectedTender()!, briefingSession: res.briefingSession };
        this.selectedTender.set(updated);
        this.showNotification('Briefing session recorded');
      },
      error: (err) => {
        this.saving.set(false);
        this.showNotification(err.error?.error || 'Failed to record briefing session');
      }
    });
  }

  addBriefingAttendee() {
    const tender = this.selectedTender();
    if (!tender || !tender.briefingSession) return;
    const attendees = [...(tender.briefingSession.attendees || []), { ...this.briefingAttendeeForm, bidderId: null }];
    this.saving.set(true);
    this.http.put<any>(`${environment.apiUrl}/tenders/${tender.id}/briefing-session/attendance`, { attendees }).subscribe({
      next: (res) => {
        this.saving.set(false);
        const updated = { ...tender, briefingSession: res.briefingSession };
        this.selectedTender.set(updated);
        this.briefingAttendeeForm = { companyName: '', representative: '', attended: true };
        this.showNotification('Attendee added');
      },
      error: (err) => {
        this.saving.set(false);
        this.showNotification(err.error?.error || 'Failed to add attendee');
      }
    });
  }

  addBriefingQuestion() {
    const tender = this.selectedTender();
    if (!tender || !tender.briefingSession) return;
    const questionsRaised = [...(tender.briefingSession.questionsRaised || []), { ...this.briefingQuestionForm }];
    this.saving.set(true);
    this.http.post<any>(`${environment.apiUrl}/tenders/${tender.id}/briefing-session`, {
      ...tender.briefingSession,
      questionsRaised
    }).subscribe({
      next: (res) => {
        this.saving.set(false);
        const updated = { ...tender, briefingSession: res.briefingSession };
        this.selectedTender.set(updated);
        this.briefingQuestionForm = { question: '', answer: '', answeredBy: '' };
        this.showNotification('Question added');
      },
      error: (err) => {
        this.saving.set(false);
        this.showNotification(err.error?.error || 'Failed to add question');
      }
    });
  }

  renderTenderCharts(): void {
    if (!this.tenderAnalyticsData()) return;
    setTimeout(() => {
      const data = this.tenderAnalyticsData();

      const paretoCtx = document.getElementById('disqualPareto') as HTMLCanvasElement;
      if (paretoCtx) {
        new Chart(paretoCtx, {
          type: 'bar',
          data: {
            labels: data.disqualificationPareto.labels,
            datasets: [
              { label: 'Count', data: data.disqualificationPareto.data, backgroundColor: '#fca5a5', borderColor: '#ef4444', borderWidth: 1, borderRadius: 4, yAxisID: 'y' },
              { label: 'Cumulative %', data: data.disqualificationPareto.cumulative, type: 'line' as any, borderColor: '#3b82f6', backgroundColor: 'transparent', tension: 0.3, pointRadius: 3, borderWidth: 2, yAxisID: 'y1' }
            ]
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { font: { size: 10 }, usePointStyle: true } } },
            scales: {
              y: { position: 'left', ticks: { font: { size: 10 } }, grid: { color: '#f1f5f9' } },
              y1: { position: 'right', min: 0, max: 100, ticks: { font: { size: 10 }, callback: (v: any) => v + '%' }, grid: { display: false } },
              x: { ticks: { font: { size: 9 }, maxRotation: 45 }, grid: { display: false } }
            }
          }
        });
      }

      const appealCtx = document.getElementById('appealsTrendChart') as HTMLCanvasElement;
      if (appealCtx) {
        new Chart(appealCtx, {
          type: 'bar',
          data: {
            labels: data.appealsTrend.labels.map((l: string) => l.split(' ')[0]),
            datasets: [
              { label: 'Appeals', data: data.appealsTrend.appeals, backgroundColor: '#fca5a5', borderRadius: 3 },
              { label: 'Objections', data: data.appealsTrend.objections, backgroundColor: '#fde68a', borderRadius: 3 },
              { label: 'Upheld', data: data.appealsTrend.upheld, backgroundColor: '#93c5fd', borderRadius: 3 }
            ]
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { font: { size: 10 }, usePointStyle: true } } },
            scales: {
              y: { ticks: { stepSize: 1, font: { size: 10 } }, grid: { color: '#f1f5f9' } },
              x: { ticks: { font: { size: 9 } }, grid: { display: false } },
            },
            interaction: { mode: 'index', intersect: false }
          }
        });
      }
    }, 200);
  }

  showNotification(msg: string) {
    this.notification.set(msg);
    setTimeout(() => this.notification.set(''), 4000);
  }
}
