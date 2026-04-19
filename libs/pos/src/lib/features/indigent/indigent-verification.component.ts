import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { IndigentService } from '../../services/indigent.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { formatDate } from '../../services/format.service';
import { DateInputComponent } from '../../shared/components/date-input.component';
import { ApplicationDetailComponent } from './shared/application-detail.component';
import { DocumentManagerComponent } from './shared/document-manager.component';
import type { VerificationQueueItem, Contractor, SaveVerificationRequest, ATTPDocument, ATTPSignature, ATTPDocumentType, IndigentType, DocumentVerificationStatus, ReferralTarget, ReferralWorkflowConfig, FieldWorker, ContractorAllocationRequest } from '../../models/indigent.models';
import { REFERRAL_TARGET_LABELS, REFERRAL_TARGET_ICONS, REFERRAL_TARGET_COLORS } from '../../models/indigent.models';

@Component({
  selector: 'app-indigent-verification',
  standalone: true,
  imports: [CommonModule, FormsModule, ApplicationDetailComponent, DateInputComponent, DocumentManagerComponent],
  templateUrl: './indigent-verification.component.html',
  styleUrl: './indigent-verification.component.css'
})
export class IndigentVerificationComponent implements OnInit {
  queue = signal<VerificationQueueItem[]>([]);
  totalCount = signal(0);
  loading = signal(true);
  contractors = signal<Contractor[]>([]);
  homeVisitOutcomes: { outcomeId: number; outcomeName: string }[] = [];
  verificationOutcomes: { outcomeId: number; outcomeName: string }[] = [];
  requiredDocTypes = signal<ATTPDocumentType[]>([]);

  page = 1;
  pageSize = 15;
  pageSizeOptions = [10, 15, 25, 50, 100];
  filterContractor = '';
  filterIndigentType = '';
  searchText = '';
  private searchDebounce: any = null;
  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  submitting = signal(false);

  modalOpen = false;
  selectedItem: VerificationQueueItem | null = null;
  selectedDocs = signal<ATTPDocument[]>([]);
  selectedSigs = signal<ATTPSignature[]>([]);
  fieldWorkers = signal<FieldWorker[]>([]);
  verForm = {
    homeVisitDate: '',
    verificationOfficer: '',
    contractorId: 0,
    fieldWorkerId: 0,
    fieldWorkerName: '',
    homeVisitOutcomeId: 0,
    verificationOutcomeId: 0,
    doNotCutExtDate: '',
    doNotCutExtReason: '',
    remarks: ''
  };
  selectedAppIds = new Set<number>();
  allocating = signal(false);

  doNotCutModalOpen = false;
  doNotCutItem: VerificationQueueItem | null = null;
  doNotCutDate = '';
  doNotCutReason = '';
  doNotCutSubmitting = signal(false);

  detailPanelOpen = false;
  detailApplicationId: number | null = null;

  docCompletenessCache = new Map<number, { total: number; uploaded: number }>();

  indigentTypes = signal<IndigentType[]>([]);
  docVerificationStatuses = signal<Record<string, DocumentVerificationStatus>>({});
  docRejectionReasons = signal<Record<string, string>>({});
  showDocVerificationPanel = false;
  showDocUploadSection = false;

  constructor(
    private svc: IndigentService,
    private auth: AuthService,
    private toast: ToastService,
    private router: Router
  ) {}

  private get userId(): number { return this.auth.user()?.user_ID || 0; }

  ngOnInit(): void {
    this.loadData();
  }

  async loadData(): Promise<void> {
    this.loading.set(true);
    this.selectedAppIds.clear();
    try {
      const [queueRes, contractorRes, hvOutcomes, vOutcomes, docTypesRes, typesRes] = await Promise.allSettled([
        firstValueFrom(this.svc.getVerificationQueue({ page: this.page, pageSize: this.pageSize, contractorId: this.filterContractor ? Number(this.filterContractor) : undefined })),
        firstValueFrom(this.svc.getContractors()),
        firstValueFrom(this.svc.getHomeVisitOutcomes()),
        firstValueFrom(this.svc.getVerificationOutcomes()),
        firstValueFrom(this.svc.getDocumentTypes()),
        firstValueFrom(this.svc.getIndigentTypes()),
      ]);
      if (queueRes.status === 'fulfilled') {
        const res = queueRes.value;
        this.queue.set(Array.isArray(res) ? res : (res?.data || []));
        this.totalCount.set(Array.isArray(res) ? res.length : (res?.totalCount || 0));
      } else {
        this.toast.show('Failed to load verification queue', 'error');
      }
      if (contractorRes.status === 'fulfilled') {
        this.contractors.set(Array.isArray(contractorRes.value) ? contractorRes.value : []);
      } else {
        this.toast.show('Failed to load contractors list', 'warning');
      }
      if (hvOutcomes.status === 'fulfilled') {
        const raw = Array.isArray(hvOutcomes.value) ? hvOutcomes.value : [];
        this.homeVisitOutcomes = raw.map((o: any) => ({ outcomeId: o.homeVisitOutcomeId ?? o.outcomeId ?? o.id, outcomeName: o.homeVisitOutcomeName ?? o.outcomeName ?? o.name ?? '' }));
      }
      if (vOutcomes.status === 'fulfilled') {
        const raw = Array.isArray(vOutcomes.value) ? vOutcomes.value : [];
        this.verificationOutcomes = raw.map((o: any) => ({ outcomeId: o.verificationOutcomeId ?? o.outcomeId ?? o.id, outcomeName: o.verificationOutcomeName ?? o.outcomeName ?? o.name ?? '' }));
      }
      if (docTypesRes.status === 'fulfilled') {
        const all = Array.isArray(docTypesRes.value) ? docTypesRes.value : [];
        this.requiredDocTypes.set(all.filter(dt => dt.isRequired && dt.isActive));
      }
      if (typesRes.status === 'fulfilled') {
        this.indigentTypes.set(Array.isArray(typesRes.value) ? typesRes.value : []);
      }
    } catch {
      this.toast.show('Failed to load verification queue', 'error');
    } finally {
      this.loading.set(false);
    }
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalCount() / this.pageSize));
  }

  fmtDate(val: string | null | undefined): string {
    return formatDate(val);
  }

  fmtCurrency(val: number): string {
    return 'R\u00A0' + (val ?? 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  onFilterChange(): void {
    this.page = 1;
    this.loadData();
  }

  onSearchChange(): void {
    clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => { this.page = 1; }, 200);
  }

  clearSearch(): void {
    this.searchText = '';
    this.page = 1;
  }

  clearAllFilters(): void {
    this.searchText = '';
    this.filterContractor = '';
    this.filterIndigentType = '';
    this.page = 1;
    this.loadData();
  }

  get hasActiveFilters(): boolean {
    return !!this.searchText || !!this.filterContractor || !!this.filterIndigentType;
  }

  toggleSort(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
  }

  getSortIcon(column: string): string {
    if (this.sortColumn !== column) return '⇅';
    return this.sortDirection === 'asc' ? '↑' : '↓';
  }

  get displayedQueue(): VerificationQueueItem[] {
    let items = [...this.queue()];
    if (this.searchText.trim()) {
      const term = this.searchText.trim().toLowerCase();
      items = items.filter(i =>
        (i.accountHolderName || '').toLowerCase().includes(term) ||
        (i.accountNumber || '').toLowerCase().includes(term) ||
        String(i.applicationId).includes(term) ||
        (i.indigentTypeName || '').toLowerCase().includes(term) ||
        (i.assignedContractorName || '').toLowerCase().includes(term)
      );
    }
    if (this.filterIndigentType) {
      items = items.filter(i => String(i.indigentTypeId) === this.filterIndigentType);
    }
    if (this.sortColumn) {
      items.sort((a: any, b: any) => {
        let va = a[this.sortColumn];
        let vb = b[this.sortColumn];
        if (va == null) va = '';
        if (vb == null) vb = '';
        if (typeof va === 'number' && typeof vb === 'number') {
          return this.sortDirection === 'asc' ? va - vb : vb - va;
        }
        const sa = String(va).toLowerCase();
        const sb = String(vb).toLowerCase();
        const cmp = sa < sb ? -1 : sa > sb ? 1 : 0;
        return this.sortDirection === 'asc' ? cmp : -cmp;
      });
    }
    return items;
  }

  get filteredCount(): number {
    return this.displayedQueue.length;
  }

  get rangeStart(): number {
    if (this.filteredCount === 0) return 0;
    return (this.page - 1) * this.pageSize + 1;
  }

  get rangeEnd(): number {
    return Math.min(this.page * this.pageSize, this.filteredCount);
  }

  get pageNumbers(): number[] {
    const tp = this.totalPages;
    if (tp <= 7) return Array.from({ length: tp }, (_, i) => i + 1);
    const pages: number[] = [1];
    const start = Math.max(2, this.page - 1);
    const end = Math.min(tp - 1, this.page + 1);
    if (start > 2) pages.push(-1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < tp - 1) pages.push(-1);
    pages.push(tp);
    return pages;
  }

  onPageSizeChange(): void {
    this.page = 1;
    this.loadData();
  }

  prevPage(): void {
    if (this.page > 1) { this.page--; this.loadData(); }
  }

  nextPage(): void {
    if (this.page < this.totalPages) { this.page++; this.loadData(); }
  }

  goToPage(p: number): void {
    if (p >= 1 && p <= this.totalPages && p !== this.page) {
      this.page = p;
      this.loadData();
    }
  }

  isAttemptsExhausted(item: VerificationQueueItem): boolean {
    return item.verificationAttempts >= item.maxVerificationAttempts;
  }

  get isHomeVisitSuccessful(): boolean {
    if (!this.verForm.homeVisitOutcomeId) return false;
    const outcome = this.homeVisitOutcomes.find(o => o.outcomeId === Number(this.verForm.homeVisitOutcomeId));
    return !!outcome && outcome.outcomeName.toLowerCase().includes('successful') && !outcome.outcomeName.toLowerCase().includes('unsuccessful');
  }

  get extensionReasonRequired(): boolean {
    return !!this.verForm.doNotCutExtDate && this.verForm.doNotCutExtDate.trim().length > 0;
  }

  async openVerificationModal(item: VerificationQueueItem): Promise<void> {
    if (this.isAttemptsExhausted(item)) {
      this.toast.show('Maximum verification attempts reached for this application', 'error');
      return;
    }
    this.selectedItem = item;
    this.selectedDocs.set([]);
    this.selectedSigs.set([]);
    this.fieldWorkers.set([]);
    const u = this.auth.user();
    const officerName = u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : '';
    this.verForm = {
      homeVisitDate: new Date().toISOString().split('T')[0],
      verificationOfficer: officerName,
      contractorId: item.assignedContractorId || 0,
      fieldWorkerId: item.assignedFieldWorkerId || 0,
      fieldWorkerName: item.assignedFieldWorkerName || '',
      homeVisitOutcomeId: 0,
      verificationOutcomeId: 0,
      doNotCutExtDate: item.doNotCutDate || '',
      doNotCutExtReason: '',
      remarks: ''
    };
    this.modalOpen = true;

    try {
      const [docsRes, sigsRes, fwRes] = await Promise.allSettled([
        firstValueFrom(this.svc.getDocuments(item.applicationId)),
        firstValueFrom(this.svc.getSignatures(item.applicationId)),
        firstValueFrom(this.svc.getFieldWorkers(item.assignedContractorId || undefined)),
      ]);
      this.selectedDocs.set(docsRes.status === 'fulfilled' && Array.isArray(docsRes.value) ? docsRes.value : []);
      this.selectedSigs.set(sigsRes.status === 'fulfilled' && Array.isArray(sigsRes.value) ? sigsRes.value : []);
      const fws = fwRes.status === 'fulfilled' && Array.isArray(fwRes.value) ? fwRes.value : [];
      this.fieldWorkers.set(fws);
      if (item.assignedFieldWorkerId && fws.some(fw => fw.fieldWorkerId === item.assignedFieldWorkerId)) {
        this.verForm.fieldWorkerId = item.assignedFieldWorkerId;
        this.verForm.fieldWorkerName = item.assignedFieldWorkerName || '';
      }
    } catch { /* silent */ }
  }

  async onContractorChange(): Promise<void> {
    const cId = Number(this.verForm.contractorId);
    this.verForm.fieldWorkerId = 0;
    this.verForm.fieldWorkerName = '';
    if (cId > 0) {
      try {
        const fws = await firstValueFrom(this.svc.getFieldWorkers(cId));
        this.fieldWorkers.set(Array.isArray(fws) ? fws : []);
      } catch {
        this.fieldWorkers.set([]);
      }
    } else {
      this.fieldWorkers.set([]);
    }
  }

  onFieldWorkerChange(): void {
    const fwId = Number(this.verForm.fieldWorkerId);
    const fw = this.fieldWorkers().find(f => f.fieldWorkerId === fwId);
    this.verForm.fieldWorkerName = fw?.fieldWorkerName || '';
  }

  get applicableDocTypes(): { documentTypeId: number; documentTypeName: string }[] {
    if (this.requiredDocTypes().length === 0) return [];
    const typeId = this.selectedItem?.indigentTypeId;
    return this.requiredDocTypes().filter(dt =>
      dt.indigentTypeId == null || dt.indigentTypeId === typeId
    );
  }

  get missingDocNames(): string[] {
    const docs = this.selectedDocs();
    return this.applicableDocTypes
      .filter(dt => !docs.some(d => d.documentTypeId === dt.documentTypeId))
      .map(dt => dt.documentTypeName);
  }

  get docsComplete(): boolean {
    return this.missingDocNames.length === 0;
  }

  get sigsComplete(): boolean {
    return this.selectedSigs().length > 0;
  }

  get completenessLabel(): string {
    const parts: string[] = [];
    if (!this.docsComplete) parts.push('Missing documents');
    if (!this.sigsComplete) parts.push('No signatures');
    return parts.length === 0 ? 'All requirements met' : parts.join(', ');
  }

  formSubmitAttempted = false;
  showOverrideConfirm = false;

  get formFieldErrors(): string[] {
    const errors: string[] = [];
    if (!this.verForm.verificationOfficer?.trim()) errors.push('Site Verification Officer is required');
    if (!this.verForm.homeVisitOutcomeId) errors.push('Home Visit Outcome is required');
    if (this.isHomeVisitSuccessful && !this.verForm.verificationOutcomeId) errors.push('Site Verification Outcome is required for successful home visits');
    if (this.extensionReasonRequired && !this.verForm.doNotCutExtReason.trim()) errors.push('Extension Reason is required when extension date is set');
    return errors;
  }

  get completenessWarnings(): string[] {
    const warnings: string[] = [];
    if (!this.docsComplete) {
      const names = this.missingDocNames;
      if (names.length <= 3) {
        warnings.push(`Missing documents: ${names.join(', ')}`);
      } else {
        warnings.push(`${names.length} required documents are missing`);
      }
    }
    if (!this.sigsComplete) warnings.push('No signatures have been captured for this application');
    return warnings;
  }

  get canSubmit(): boolean {
    return this.formFieldErrors.length === 0;
  }

  closeModal(): void {
    this.modalOpen = false;
    this.selectedItem = null;
    this.formSubmitAttempted = false;
    this.showOverrideConfirm = false;
    this.showDocUploadSection = false;
    this.showDocVerificationPanel = false;
  }

  async refreshDocsAfterUpload(): Promise<void> {
    if (!this.selectedItem) return;
    try {
      const docsRes = await firstValueFrom(this.svc.getDocuments(this.selectedItem.applicationId));
      this.selectedDocs.set(Array.isArray(docsRes) ? docsRes : []);
    } catch { /* keep existing docs */ }
  }

  confirmOverrideAndSubmit(): void {
    this.showOverrideConfirm = false;
    this.doSubmitVerification();
  }

  cancelOverride(): void {
    this.showOverrideConfirm = false;
  }

  async submitVerification(): Promise<void> {
    if (this.submitting()) return;
    if (!this.selectedItem) return;
    this.formSubmitAttempted = true;

    if (this.isAttemptsExhausted(this.selectedItem)) {
      this.toast.show('Maximum verification attempts reached for this application', 'error');
      this.closeModal();
      return;
    }
    if (this.formFieldErrors.length > 0) {
      return;
    }
    if (this.completenessWarnings.length > 0 && !this.showOverrideConfirm) {
      this.showOverrideConfirm = true;
      return;
    }
    this.doSubmitVerification();
  }

  private async doSubmitVerification(): Promise<void> {
    if (!this.selectedItem) return;
    this.submitting.set(true);
    try {
      const now = new Date().toISOString();
      const request: SaveVerificationRequest = {
        verificationId: null,
        applicationId: this.selectedItem.applicationId,
        homeVisitDate: this.verForm.homeVisitDate || now,
        verificationOfficer: this.verForm.verificationOfficer,
        contractorId: this.verForm.contractorId,
        fieldWorkerId: this.verForm.fieldWorkerId || undefined,
        fieldWorkerName: this.verForm.fieldWorkerName || undefined,
        homeVisitOutcomeId: Number(this.verForm.homeVisitOutcomeId),
        verificationOutcomeId: this.isHomeVisitSuccessful ? Number(this.verForm.verificationOutcomeId) : 0,
        doNotCutExtDate: this.verForm.doNotCutExtDate || null,
        doNotCutExtReason: this.verForm.doNotCutExtReason || null,
        remarks: this.verForm.remarks,
        capturerID: this.userId,
        dateCaptured: now,
        modifierID: this.userId,
        dateModified: now,
      };
      const result = await firstValueFrom(this.svc.saveVerification(request));
      const isQualified = result.verificationOutcomeName?.toLowerCase() === 'qualify';
      if (isQualified) {
        this.toast.show('Site verification recorded — application moved to Awaiting Authorisation', 'success');
      } else {
        this.toast.show('Site verification recorded successfully', 'success');
      }
      if (this.selectedItem) {
        const iType = this.indigentTypes().find(t => t.indigentTypeId === this.selectedItem!.indigentTypeId);
        if (iType) {
          this.svc.fireLifecycleNotification({
            indigentType: iType,
            eventType: 'verification_completed',
            mergeData: {
              applicantName: this.selectedItem.accountHolderName,
              accountNumber: this.selectedItem.accountNumber,
              applicationId: String(this.selectedItem.applicationId),
              indigentTypeName: this.selectedItem.indigentTypeName,
              verificationOutcome: result.verificationOutcomeName || '',
            },
            recipientEmail: this.selectedItem.email || '',
            recipientPhone: this.selectedItem.cellPhone || '',
            accountId: String(this.selectedItem.accountId),
            accountNumber: this.selectedItem.accountNumber,
            accountHolder: this.selectedItem.accountHolderName,
          });
        }
      }
      this.closeModal();
      await this.loadData();
    } catch (e: unknown) {
      const err = e as { error?: { message?: string } };
      this.toast.show(err?.error?.message || 'Failed to save verification', 'error');
    } finally {
      this.submitting.set(false);
    }
  }

  openDoNotCutModal(item: VerificationQueueItem): void {
    this.doNotCutItem = item;
    this.doNotCutDate = item.doNotCutDate || '';
    this.doNotCutReason = '';
    this.doNotCutModalOpen = true;
  }

  closeDoNotCutModal(): void {
    this.doNotCutModalOpen = false;
    this.doNotCutItem = null;
  }

  async submitDoNotCut(): Promise<void> {
    if (this.doNotCutSubmitting()) return;
    if (!this.doNotCutItem || !this.doNotCutDate) {
      this.toast.show('Please select a date', 'error');
      return;
    }
    this.doNotCutSubmitting.set(true);
    try {
      const now = new Date().toISOString();
      await firstValueFrom(this.svc.doNotCutUpdate({
        applicationId: this.doNotCutItem.applicationId,
        doNotCutDate: this.doNotCutDate,
        doNotCutExtReason: this.doNotCutReason,
        modifierID: this.userId,
        dateModified: now,
      }));
      this.toast.show('Do-not-cut date updated', 'success');
      this.closeDoNotCutModal();
      await this.loadData();
    } catch (e: unknown) {
      const err = e as { error?: { message?: string } };
      this.toast.show(err?.error?.message || 'Failed to update do-not-cut date', 'error');
    } finally {
      this.doNotCutSubmitting.set(false);
    }
  }

  getAttemptsBadge(item: VerificationQueueItem): string {
    if (item.verificationAttempts >= item.maxVerificationAttempts) return 'badge-danger';
    if (item.verificationAttempts > 0) return 'badge-warning';
    return 'badge-info';
  }

  viewApplication(applicationId: number): void {
    this.detailApplicationId = applicationId;
    this.detailPanelOpen = true;
  }

  closeDetailPanel(): void {
    this.detailPanelOpen = false;
    this.detailApplicationId = null;
  }

  isDocVerificationEnabled(item: VerificationQueueItem): boolean {
    const type = this.indigentTypes().find(t => t.indigentTypeId === item.indigentTypeId);
    return !!type?.enableDocumentVerification;
  }

  getDocVerificationLabel(item: VerificationQueueItem): string {
    if (!this.isDocVerificationEnabled(item)) return '';
    const docs = this.selectedDocs();
    if (docs.length === 0) return 'No documents';
    return `${docs.length} document(s) to verify`;
  }

  toggleDocVerificationPanel(): void {
    this.showDocVerificationPanel = !this.showDocVerificationPanel;
    if (this.showDocVerificationPanel) {
      const statuses: Record<string, DocumentVerificationStatus> = {};
      const reasons: Record<string, string> = {};
      for (const doc of this.selectedDocs()) {
        const key = String(doc.documentId || doc.documentTypeId);
        statuses[key] = 'pending';
        reasons[key] = '';
      }
      this.docVerificationStatuses.set(statuses);
      this.docRejectionReasons.set(reasons);
    }
  }

  setDocVerificationStatus(docId: string, status: DocumentVerificationStatus): void {
    const statuses = { ...this.docVerificationStatuses() };
    statuses[docId] = status;
    this.docVerificationStatuses.set(statuses);
    if (status !== 'rejected') {
      const reasons = { ...this.docRejectionReasons() };
      reasons[docId] = '';
      this.docRejectionReasons.set(reasons);
    }
  }

  setDocRejectionReason(docId: string, reason: string): void {
    const reasons = { ...this.docRejectionReasons() };
    reasons[docId] = reason;
    this.docRejectionReasons.set(reasons);
  }

  get allDocsVerified(): boolean {
    const statuses = this.docVerificationStatuses();
    const docs = this.selectedDocs();
    if (docs.length === 0) return true;
    return docs.every(d => {
      const key = String(d.documentId || d.documentTypeId);
      return statuses[key] === 'verified';
    });
  }

  get hasRejectedDocs(): boolean {
    const statuses = this.docVerificationStatuses();
    return Object.values(statuses).some(s => s === 'rejected');
  }

  get docVerificationSummary(): string {
    const statuses = this.docVerificationStatuses();
    const verified = Object.values(statuses).filter(s => s === 'verified').length;
    const rejected = Object.values(statuses).filter(s => s === 'rejected').length;
    const pending = Object.values(statuses).filter(s => s === 'pending').length;
    const parts: string[] = [];
    if (verified > 0) parts.push(`${verified} verified`);
    if (rejected > 0) parts.push(`${rejected} rejected`);
    if (pending > 0) parts.push(`${pending} pending`);
    return parts.join(', ');
  }

  referralNote = '';

  getReferralWorkflowConfig(item: VerificationQueueItem): ReferralWorkflowConfig {
    const type = this.indigentTypes().find(t => t.indigentTypeId === item.indigentTypeId);
    const defaults: ReferralWorkflowConfig = {
      enableReferToContractor: true, enableReferToCapturer: true, enableReferToSupervisor: true, enableReferToSteeringCommittee: true,
      supervisorCanReferToContractor: true, supervisorCanReferToCapturer: true, supervisorCanReferToDocVerifier: true, supervisorCanReferToSteeringCommittee: true,
    };
    return { ...defaults, ...(type?.referralWorkflow || {}) };
  }

  getAvailableReferralTargets(item: VerificationQueueItem): ReferralTarget[] {
    const config = this.getReferralWorkflowConfig(item);
    const targets: ReferralTarget[] = [];
    if (config.enableReferToCapturer) targets.push('capturer');
    if (config.enableReferToContractor) targets.push('contractor');
    if (config.enableReferToSupervisor) targets.push('supervisor');
    if (config.enableReferToSteeringCommittee) targets.push('steering_committee');
    return targets;
  }

  getSupervisorReferralTargets(item: VerificationQueueItem): ReferralTarget[] {
    const config = this.getReferralWorkflowConfig(item);
    const targets: ReferralTarget[] = [];
    if (config.supervisorCanReferToCapturer) targets.push('capturer');
    if (config.supervisorCanReferToContractor) targets.push('contractor');
    if (config.supervisorCanReferToDocVerifier) targets.push('document_verifier');
    if (config.supervisorCanReferToSteeringCommittee) targets.push('steering_committee');
    return targets;
  }

  getReferralLabel(target: ReferralTarget): string {
    return REFERRAL_TARGET_LABELS[target];
  }

  getReferralIcon(target: ReferralTarget): string {
    return REFERRAL_TARGET_ICONS[target];
  }

  getReferralColor(target: ReferralTarget): string {
    return REFERRAL_TARGET_COLORS[target];
  }

  private buildReferralRemarks(target: ReferralTarget): string {
    const rejectedDocs = this.selectedDocs().filter(d => {
      const key = String(d.documentId || d.documentTypeId);
      return this.docVerificationStatuses()[key] === 'rejected';
    });
    const rejectionDetails = rejectedDocs.map(d => {
      const key = String(d.documentId || d.documentTypeId);
      return `${d.documentTypeName || d.fileName}: ${this.docRejectionReasons()[key] || 'No reason provided'}`;
    });

    const targetLabel = REFERRAL_TARGET_LABELS[target];
    const summary = this.docVerificationSummary;
    const lines = [`REFERRAL TO ${targetLabel.toUpperCase()} — Document Verification: ${summary}`];
    if (rejectionDetails.length > 0) {
      lines.push('Rejected documents:');
      lines.push(...rejectionDetails);
    }
    if (this.referralNote.trim()) {
      lines.push(`Note: ${this.referralNote.trim()}`);
    }
    return lines.join('\n');
  }

  async referTo(target: ReferralTarget): Promise<void> {
    if (!this.selectedItem) return;
    if (target !== 'supervisor' && target !== 'steering_committee' && !this.hasRejectedDocs) {
      this.toast.show('Mark at least one document as rejected before referring', 'error');
      return;
    }
    this.submitting.set(true);
    try {
      const now = new Date().toISOString();
      const request: SaveVerificationRequest = {
        verificationId: null,
        applicationId: this.selectedItem.applicationId,
        homeVisitDate: now,
        verificationOfficer: `${this.auth.user()?.firstName || ''} ${this.auth.user()?.lastName || ''}`.trim() || '',
        contractorId: target === 'contractor' ? (this.selectedItem.assignedContractorId || 0) : 0,
        homeVisitOutcomeId: 0,
        verificationOutcomeId: 0,
        doNotCutExtDate: null,
        doNotCutExtReason: null,
        remarks: this.buildReferralRemarks(target),
        referralTarget: target,
        capturerID: this.userId,
        dateCaptured: now,
        modifierID: this.userId,
        dateModified: now,
      };
      await firstValueFrom(this.svc.saveVerification(request));
      this.toast.show(`Application referred to ${REFERRAL_TARGET_LABELS[target]}`, 'success');
      this.referralNote = '';
      this.closeModal();
      await this.loadData();
    } catch (e: unknown) {
      const err = e as { error?: { message?: string } };
      this.toast.show(err?.error?.message || 'Failed to submit referral', 'error');
    } finally {
      this.submitting.set(false);
    }
  }

  toggleAppSelect(appId: number): void {
    if (this.selectedAppIds.has(appId)) this.selectedAppIds.delete(appId);
    else this.selectedAppIds.add(appId);
  }

  isAppSelected(appId: number): boolean {
    return this.selectedAppIds.has(appId);
  }

  selectAllApps(): void {
    const displayed = this.displayedQueue;
    if (displayed.length > 0 && displayed.every(i => this.selectedAppIds.has(i.applicationId))) {
      displayed.forEach(i => this.selectedAppIds.delete(i.applicationId));
    } else {
      displayed.forEach(i => this.selectedAppIds.add(i.applicationId));
    }
  }

  get allAppsSelected(): boolean {
    const displayed = this.displayedQueue;
    return displayed.length > 0 && displayed.every(i => this.selectedAppIds.has(i.applicationId));
  }

  get hasUnassignedSelected(): boolean {
    return Array.from(this.selectedAppIds).some(id => {
      const item = this.queue().find(q => q.applicationId === id);
      return item && !item.assignedContractorId;
    });
  }

  async autoAllocateContractors(): Promise<void> {
    if (this.allocating()) return;
    const ids = Array.from(this.selectedAppIds);
    if (ids.length === 0) {
      this.toast.show('Select at least one application to auto-allocate', 'error');
      return;
    }
    const selectedItems = this.queue().filter(q => ids.includes(q.applicationId));
    const uniqueTypeIds = new Set(selectedItems.map(q => q.indigentTypeId));
    if (uniqueTypeIds.size > 1) {
      this.toast.show('All selected applications must be of the same indigent type for auto-allocation. Please filter or select applications of one type only.', 'error');
      return;
    }
    const firstItem = selectedItems[0];
    if (!firstItem) return;
    const typeConfig = this.indigentTypes().find(t => t.indigentTypeId === firstItem.indigentTypeId);
    const method = typeConfig?.allocationMethod || 'round_robin';
    if (method === 'manual') {
      this.toast.show('Auto-allocation is not enabled for this indigent type. Set allocation method in configuration.', 'error');
      return;
    }
    this.allocating.set(true);
    try {
      const now = new Date().toISOString();
      const slaDays = typeConfig?.verificationSLADays || 14;
      const request: ContractorAllocationRequest = {
        applicationIds: ids,
        indigentTypeId: firstItem.indigentTypeId,
        allocationMethod: method as 'round_robin' | 'load_balanced',
        verificationSLADays: slaDays,
        capturerID: this.userId,
        dateModified: now,
      };
      const result = await firstValueFrom(this.svc.allocateContractors(request));
      this.toast.show(result.message || `${result.allocations.length} applications allocated`, 'success');
      if (typeConfig) {
        for (const item of selectedItems) {
          this.svc.fireLifecycleNotification({
            indigentType: typeConfig,
            eventType: 'verification_scheduled',
            mergeData: {
              applicantName: item.accountHolderName,
              accountNumber: item.accountNumber,
              applicationId: String(item.applicationId),
              indigentTypeName: item.indigentTypeName,
            },
            recipientEmail: item.email || '',
            recipientPhone: item.cellPhone || '',
            accountId: String(item.accountId),
            accountNumber: item.accountNumber,
            accountHolder: item.accountHolderName,
          });
        }
      }
      this.selectedAppIds.clear();
      await this.loadData();
    } catch (e: unknown) {
      const err = e as { error?: { message?: string } };
      this.toast.show(err?.error?.message || 'Failed to auto-allocate contractors', 'error');
    } finally {
      this.allocating.set(false);
    }
  }

  isOverdue(item: VerificationQueueItem): boolean {
    if (!item.verificationDueDate) return false;
    return new Date(item.verificationDueDate) < new Date();
  }

  getDueDateBadge(item: VerificationQueueItem): string {
    if (!item.verificationDueDate) return 'badge-muted';
    if (this.isOverdue(item)) return 'badge-danger';
    const daysLeft = Math.ceil((new Date(item.verificationDueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 3) return 'badge-warning';
    return 'badge-info';
  }

  getSlaRag(item: VerificationQueueItem): { label: string; css: string } | null {
    const iType = this.indigentTypes().find(t => t.indigentTypeId === item.indigentTypeId);
    if (!iType) return null;
    const target = iType.applicationSlaTargetDays || 30;
    const elapsed = Math.floor((Date.now() - new Date(item.applicationDate).getTime()) / (1000 * 60 * 60 * 24));
    const greenThreshold = Math.floor(target * 0.5);
    const amberThreshold = Math.floor(target * 0.833);
    const css = elapsed < greenThreshold ? 'sla-green' : elapsed <= amberThreshold ? 'sla-amber' : 'sla-red';
    return { label: `${elapsed}d/${target}d`, css };
  }
}
