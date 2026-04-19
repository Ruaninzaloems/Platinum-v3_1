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
import type { AuthorizationQueueItem, IndigentType, DeclineReason, ATTPDocument, ATTPSignature, ATTPDocumentType } from '../../models/indigent.models';

interface QualifyingUnitRow {
  unitId: number;
  subsidy: number;
}

@Component({
  selector: 'app-indigent-authorization',
  standalone: true,
  imports: [CommonModule, FormsModule, ApplicationDetailComponent, DateInputComponent, DocumentManagerComponent],
  templateUrl: './indigent-authorization.component.html',
  styleUrl: './indigent-authorization.component.css'
})
export class IndigentAuthorizationComponent implements OnInit {
  queue = signal<AuthorizationQueueItem[]>([]);
  totalCount = signal(0);
  loading = signal(true);
  indigentTypes = signal<IndigentType[]>([]);
  declineReasons = signal<DeclineReason[]>([]);

  page = 1;
  pageSize = 15;
  pageSizeOptions = [10, 15, 25, 50];
  filterType = '';
  submitting = signal(false);

  authorizeModalOpen = false;
  declineModalOpen = false;
  selectedItem: AuthorizationQueueItem | null = null;
  showAuthDocs = false;

  authForm = { monthlySubsidy: 0, qualifyingUnits: 0, onceWriteOff: 0, remarks: '',
    commencementDate: this.fyStart(), reApplicationDate: this.fyEnd30(), terminationDate: this.fyEnd30() };
  qualifyingUnitDetails: QualifyingUnitRow[] = [];
  declineForm = { declineReasonId: 0, remarks: '' };

  selectedIds = new Set<number>();
  batchAuthorizeModalOpen = false;
  batchAuthForm = { monthlySubsidy: 0, qualifyingUnits: 0, onceWriteOff: 0, remarks: '',
    commencementDate: this.fyStart(), reApplicationDate: this.fyEnd30(), terminationDate: this.fyEnd30() };

  detailPanelOpen = false;
  detailApplicationId: number | null = null;

  authDocs = signal<ATTPDocument[]>([]);
  authSigs = signal<ATTPSignature[]>([]);
  requiredDocTypes = signal<ATTPDocumentType[]>([]);
  authDocsLoading = signal(false);

  qualCheckLabels: Record<string, string> = {};

  constructor(
    private svc: IndigentService,
    private auth: AuthService,
    private toast: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  private get userId(): number { return this.auth.user()?.user_ID || 0; }

  async loadData(): Promise<void> {
    this.loading.set(true);
    try {
      const [queueRes, typesRes, reasonsRes] = await Promise.allSettled([
        firstValueFrom(this.svc.getAuthorizationQueue({ page: this.page, pageSize: this.pageSize, indigentTypeId: this.filterType ? Number(this.filterType) : undefined })),
        firstValueFrom(this.svc.getIndigentTypes()),
        firstValueFrom(this.svc.getDeclineReasons()),
      ]);
      if (queueRes.status === 'fulfilled') {
        const res = queueRes.value;
        this.queue.set(Array.isArray(res) ? res : (res?.data || []));
        this.totalCount.set(Array.isArray(res) ? res.length : (res?.totalCount || 0));
      }
      if (typesRes.status === 'fulfilled') {
        this.indigentTypes.set(Array.isArray(typesRes.value) ? typesRes.value : []);
      }
      if (reasonsRes.status === 'fulfilled') {
        this.declineReasons.set(Array.isArray(reasonsRes.value) ? reasonsRes.value : []);
      }
    } catch {
      this.toast.show('Failed to load authorization queue', 'error');
    } finally {
      this.loading.set(false);
    }
  }

  get totalPages(): number { return Math.max(1, Math.ceil(this.totalCount() / this.pageSize)); }
  fmtDate(val: string | null | undefined): string { return formatDate(val); }
  fmtCurrency(val: number): string { return 'R ' + (val ?? 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

  onFilterChange(): void { this.page = 1; this.selectedIds.clear(); this.loadData(); }
  onPageSizeChange(): void { this.page = 1; this.selectedIds.clear(); this.loadData(); }
  prevPage(): void { if (this.page > 1) { this.page--; this.selectedIds.clear(); this.loadData(); } }
  nextPage(): void { if (this.page < this.totalPages) { this.page++; this.selectedIds.clear(); this.loadData(); } }

  goToPage(p: number): void {
    if (p >= 1 && p <= this.totalPages && p !== this.page) {
      this.page = p;
      this.selectedIds.clear();
      this.loadData();
    }
  }

  toggleSelect(id: number): void {
    if (this.selectedIds.has(id)) this.selectedIds.delete(id);
    else this.selectedIds.add(id);
  }

  isSelected(id: number): boolean { return this.selectedIds.has(id); }

  selectAll(): void {
    if (this.selectedIds.size === this.queue().length) this.selectedIds.clear();
    else this.queue().forEach(i => this.selectedIds.add(i.applicationId));
  }

  get allSelected(): boolean { return this.queue().length > 0 && this.selectedIds.size === this.queue().length; }

  getQualChecks(item: AuthorizationQueueItem): { key: string; label: string; passed: boolean }[] {
    if (!item.qualificationChecks) return [];
    return Object.entries(item.qualificationChecks).map(([key, passed]) => ({
      key,
      label: this.qualCheckLabels[key] || key,
      passed: !!passed
    }));
  }

  get authDocsComplete(): boolean {
    if (this.requiredDocTypes().length === 0) return true;
    const docs = this.authDocs();
    const typeId = this.selectedItem?.indigentTypeId;
    const applicable = this.requiredDocTypes().filter(dt =>
      dt.indigentTypeId == null || dt.indigentTypeId === typeId
    );
    if (applicable.length === 0) return true;
    return applicable.every(dt => docs.some(d => d.documentTypeId === dt.documentTypeId));
  }

  get authSigsComplete(): boolean {
    return this.authSigs().length > 0;
  }

  async openAuthorizeModal(item: AuthorizationQueueItem): Promise<void> {
    this.selectedItem = item;
    const reAppDate = this.calcReapplicationDate(item.indigentTypeId, item.applicationDate, item.idNumber);
    this.authForm = { monthlySubsidy: 0, qualifyingUnits: 0, onceWriteOff: 0, remarks: '',
      commencementDate: this.fyStart(), reApplicationDate: reAppDate, terminationDate: reAppDate };
    this.qualifyingUnitDetails = [];
    this.authDocs.set([]);
    this.authSigs.set([]);
    this.authorizeModalOpen = true;
    this.authDocsLoading.set(true);
    try {
      const [docsRes, sigsRes, docTypesRes] = await Promise.allSettled([
        firstValueFrom(this.svc.getDocuments(item.applicationId)),
        firstValueFrom(this.svc.getSignatures(item.applicationId)),
        firstValueFrom(this.svc.getDocumentTypes()),
      ]);
      this.authDocs.set(docsRes.status === 'fulfilled' && Array.isArray(docsRes.value) ? docsRes.value : []);
      this.authSigs.set(sigsRes.status === 'fulfilled' && Array.isArray(sigsRes.value) ? sigsRes.value : []);
      const allTypes = docTypesRes.status === 'fulfilled' && Array.isArray(docTypesRes.value) ? docTypesRes.value : [];
      this.requiredDocTypes.set(allTypes.filter((t: ATTPDocumentType) => t.isRequired && t.isActive));
    } catch { /* silent */ } finally {
      this.authDocsLoading.set(false);
    }
  }

  closeAuthorizeModal(): void { this.authorizeModalOpen = false; this.selectedItem = null; this.showAuthDocs = false; }

  async refreshAuthDocsAfterUpload(): Promise<void> {
    if (!this.selectedItem) return;
    try {
      const docsRes = await firstValueFrom(this.svc.getDocuments(this.selectedItem.applicationId));
      this.authDocs.set(Array.isArray(docsRes) ? docsRes : []);
    } catch { /* keep existing docs */ }
  }

  addQualifyingUnit(): void {
    this.qualifyingUnitDetails.push({ unitId: this.qualifyingUnitDetails.length + 1, subsidy: 0 });
  }

  removeQualifyingUnit(index: number): void {
    this.qualifyingUnitDetails.splice(index, 1);
  }

  get totalUnitSubsidy(): number {
    return this.qualifyingUnitDetails.reduce((sum, u) => sum + (u.subsidy || 0), 0);
  }

  openDeclineModal(item: AuthorizationQueueItem): void {
    this.selectedItem = item;
    this.declineForm = { declineReasonId: 0, remarks: '' };
    this.declineModalOpen = true;
  }

  closeDeclineModal(): void { this.declineModalOpen = false; this.selectedItem = null; }

  async submitAuthorize(): Promise<void> {
    if (this.submitting()) return;
    if (!this.selectedItem) return;
    if (!this.authDocsComplete) {
      this.toast.show('All required documents must be uploaded before authorizing', 'error');
      return;
    }
    if (!this.authSigsComplete) {
      this.toast.show('At least one signature must be captured before authorizing', 'error');
      return;
    }
    this.submitting.set(true);
    try {
      const now = new Date().toISOString();
      const writeOffAllowed = this.isWriteOffEnabled(this.selectedItem.indigentTypeId);
      const result = await firstValueFrom(this.svc.authorizeApplication({
        applicationId: this.selectedItem.applicationId,
        appStatusId: 140,
        monthlySubsidy: this.authForm.monthlySubsidy,
        qualifyingUnits: this.authForm.qualifyingUnits,
        onceWriteOff: writeOffAllowed ? this.authForm.onceWriteOff : 0,
        commencementDate: this.toIso(this.authForm.commencementDate),
        reApplicationDate: this.toIso(this.authForm.reApplicationDate),
        terminationDate: this.toIso(this.authForm.terminationDate),
        qualifyingUnitDetails: this.qualifyingUnitDetails.map(u => ({ unitId: u.unitId, subsidy: u.subsidy })),
        remarks: this.authForm.remarks,
        reviewerID: this.userId,
        reviewDate: now,
        modifierID: this.userId,
        dateModified: now,
      }));
      this.toast.show(result.message || 'Application approved — status changed to Active', 'success');

      const iType = this.indigentTypes().find(t => t.indigentTypeId === this.selectedItem!.indigentTypeId);
      if (iType) {
        this.svc.fireLifecycleNotification({
          indigentType: iType,
          eventType: 'authorization_approved',
          mergeData: {
            applicantName: this.selectedItem.accountHolderName,
            accountNumber: this.selectedItem.accountNumber,
            applicationId: String(this.selectedItem.applicationId),
            indigentTypeName: this.selectedItem.indigentTypeName,
            monthlySubsidy: 'R ' + this.authForm.monthlySubsidy.toFixed(2),
            reApplicationDate: this.authForm.reApplicationDate,
          },
          recipientEmail: this.selectedItem.email || '',
          recipientPhone: this.selectedItem.cellPhone || '',
          accountId: String(this.selectedItem.accountId),
          accountNumber: this.selectedItem.accountNumber,
          accountHolder: this.selectedItem.accountHolderName,
        });
      }

      await this.executeDebtActionsIfNeeded(this.selectedItem.indigentTypeId, this.selectedItem.accountNumber, this.authForm.onceWriteOff, this.authForm.remarks);

      this.closeAuthorizeModal();
      await this.loadData();
    } catch (e: unknown) {
      const err = e as { error?: { message?: string } };
      this.toast.show(err?.error?.message || 'Failed to authorize application', 'error');
    } finally {
      this.submitting.set(false);
    }
  }

  async submitDecline(): Promise<void> {
    if (this.submitting()) return;
    if (!this.selectedItem || !this.declineForm.declineReasonId) {
      this.toast.show('Please select a decline reason', 'error');
      return;
    }
    const reqType = (this.selectedItem.requestType || '').toLowerCase();
    if (reqType && !reqType.includes('auth') && !reqType.includes('await') && !reqType.includes('pending')) {
      this.toast.show('Only applications awaiting authorization can be declined', 'error');
      return;
    }
    this.submitting.set(true);
    try {
      const now = new Date().toISOString();
      const result = await firstValueFrom(this.svc.declineApplication({
        applicationId: this.selectedItem.applicationId,
        appStatusId: 141,
        declineReasonId: Number(this.declineForm.declineReasonId),
        remarks: this.declineForm.remarks,
        reviewerId: this.userId,
        reviewDate: now,
        capturerId: this.userId,
        modifierId: this.userId,
      }));
      this.toast.show(result.message || 'Application declined', 'success');
      const declineType = this.indigentTypes().find(t => t.indigentTypeId === this.selectedItem!.indigentTypeId);
      if (declineType) {
        const reason = this.declineReasons().find(r => r.declineReasonId === Number(this.declineForm.declineReasonId));
        this.svc.fireLifecycleNotification({
          indigentType: declineType,
          eventType: 'authorization_declined',
          mergeData: {
            applicantName: this.selectedItem!.accountHolderName,
            accountNumber: this.selectedItem!.accountNumber,
            applicationId: String(this.selectedItem!.applicationId),
            indigentTypeName: this.selectedItem!.indigentTypeName,
            declineReason: reason?.declineReasonName || 'Not specified',
          },
          recipientEmail: this.selectedItem!.email || '',
          recipientPhone: this.selectedItem!.cellPhone || '',
          accountId: String(this.selectedItem!.accountId),
          accountNumber: this.selectedItem!.accountNumber,
          accountHolder: this.selectedItem!.accountHolderName,
        });
      }
      this.closeDeclineModal();
      await this.loadData();
    } catch (e: unknown) {
      const err = e as { error?: { message?: string } };
      this.toast.show(err?.error?.message || 'Failed to decline application', 'error');
    } finally {
      this.submitting.set(false);
    }
  }

  openBatchAuthorizeModal(): void {
    if (this.selectedIds.size === 0) { this.toast.show('Select at least one application', 'error'); return; }
    this.batchAuthForm = { monthlySubsidy: 0, qualifyingUnits: 0, onceWriteOff: 0, remarks: '',
      commencementDate: this.fyStart(), reApplicationDate: this.fyEnd30(), terminationDate: this.fyEnd30() };
    this.batchAuthorizeModalOpen = true;
  }

  closeBatchAuthorizeModal(): void { this.batchAuthorizeModalOpen = false; }

  async submitBatchAuthorize(): Promise<void> {
    if (this.submitting()) return;
    this.submitting.set(true);
    const now = new Date().toISOString();
    const ids = Array.from(this.selectedIds);
    const BATCH_SIZE = 5;
    let succeeded = 0;
    let failed = 0;
    for (let i = 0; i < ids.length; i += BATCH_SIZE) {
      const batch = ids.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(batch.map(appId => {
        const item = this.queue().find(q => q.applicationId === appId);
        const itemWriteOffAllowed = item ? this.isWriteOffEnabled(item.indigentTypeId) : false;
        return firstValueFrom(this.svc.authorizeApplication({
          applicationId: appId,
          appStatusId: 140,
          monthlySubsidy: this.batchAuthForm.monthlySubsidy,
          qualifyingUnits: this.batchAuthForm.qualifyingUnits,
          onceWriteOff: itemWriteOffAllowed ? this.batchAuthForm.onceWriteOff : 0,
          commencementDate: this.toIso(this.batchAuthForm.commencementDate),
          reApplicationDate: this.toIso(this.batchAuthForm.reApplicationDate),
          terminationDate: this.toIso(this.batchAuthForm.terminationDate),
          qualifyingUnitDetails: [],
          remarks: this.batchAuthForm.remarks,
          reviewerID: this.userId,
          reviewDate: now,
          modifierID: this.userId,
          dateModified: now,
        }));
      }));
      for (let j = 0; j < results.length; j++) {
        if (results[j].status === 'fulfilled') {
          succeeded++;
          const item = this.queue().find(q => q.applicationId === batch[j]);
          if (item) {
            await this.executeDebtActionsIfNeeded(item.indigentTypeId, item.accountNumber, this.batchAuthForm.onceWriteOff, this.batchAuthForm.remarks);
            const iType = this.indigentTypes().find(t => t.indigentTypeId === item.indigentTypeId);
            if (iType) {
              this.svc.fireLifecycleNotification({
                indigentType: iType,
                eventType: 'authorization_approved',
                mergeData: {
                  applicantName: item.accountHolderName,
                  accountNumber: item.accountNumber,
                  applicationId: String(item.applicationId),
                  indigentTypeName: item.indigentTypeName,
                  monthlySubsidy: 'R ' + this.batchAuthForm.monthlySubsidy.toFixed(2),
                  reApplicationDate: this.batchAuthForm.reApplicationDate,
                },
                recipientEmail: item.email || '',
                recipientPhone: item.cellPhone || '',
                accountId: String(item.accountId),
                accountNumber: item.accountNumber,
                accountHolder: item.accountHolderName,
              });
            }
          }
        } else {
          failed++;
        }
      }
    }
    this.toast.show(`Batch: ${succeeded} authorized, ${failed} failed`, succeeded > 0 ? 'success' : 'error');
    this.selectedIds.clear();
    this.closeBatchAuthorizeModal();
    this.submitting.set(false);
    await this.loadData();
  }

  viewApplication(applicationId: number): void {
    this.detailApplicationId = applicationId;
    this.detailPanelOpen = true;
  }

  closeDetailPanel(): void {
    this.detailPanelOpen = false;
    this.detailApplicationId = null;
  }

  getTypeConfig(indigentTypeId: number): IndigentType | undefined {
    return this.indigentTypes().find(t => t.indigentTypeId === indigentTypeId);
  }

  private calcReapplicationDate(indigentTypeId?: number, applicationDate?: string, applicantIdNo?: string): string {
    if (!indigentTypeId) return this.fyEnd30();
    const typeConfig = this.indigentTypes().find(t => t.indigentTypeId === indigentTypeId) as any;
    if (!typeConfig) return this.fyEnd30();

    let period = typeConfig.reApplicationPeriod || 12;

    if (typeConfig.exemptSeniorsFromRenewal && typeConfig.seniorExtendedPeriod && applicantIdNo && applicantIdNo.length === 13) {
      const yy = parseInt(applicantIdNo.substring(0, 2), 10);
      const mm = parseInt(applicantIdNo.substring(2, 4), 10) - 1;
      const dd = parseInt(applicantIdNo.substring(4, 6), 10);
      const now = new Date();
      const currentYearShort = now.getFullYear() % 100;
      const century = yy <= currentYearShort ? 2000 : 1900;
      const dob = new Date(century + yy, mm, dd);
      let age = now.getFullYear() - dob.getFullYear();
      if (now.getMonth() < dob.getMonth() || (now.getMonth() === dob.getMonth() && now.getDate() < dob.getDate())) age--;
      const threshold = typeConfig.seniorExemptionAge || 65;
      if (age >= threshold) {
        period = typeConfig.seniorExtendedPeriod;
      }
    }

    if (typeConfig.reapplicationBaseDate === 'approval') {
      const approvalDate = new Date();
      approvalDate.setMonth(approvalDate.getMonth() + period);
      return approvalDate.toISOString().split('T')[0];
    }
    if (typeConfig.reapplicationBaseDate === 'application' && applicationDate) {
      const appDate = new Date(applicationDate);
      appDate.setMonth(appDate.getMonth() + period);
      return appDate.toISOString().split('T')[0];
    }
    return this.fyEnd30();
  }

  private fyStart(): string {
    const now = new Date();
    const year = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
    return `${year}-07-01`;
  }

  private fyEnd30(): string {
    const now = new Date();
    const year = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
    const end = new Date(`${year + 1}-06-30T00:00:00`);
    end.setDate(end.getDate() + 30);
    return end.toISOString().split('T')[0];
  }

  isWriteOffEnabled(indigentTypeId?: number): boolean {
    if (!indigentTypeId) return false;
    const cfg = this.getTypeConfig(indigentTypeId);
    const mode = (cfg as any)?.writeOffApprovalMode || (cfg?.enableWriteOffOnApproval === true ? 'first_application' : 'disabled');
    return mode !== 'disabled';
  }

  private async executeDebtActionsIfNeeded(indigentTypeId: number, accountNumber: string, onceWriteOff?: number, remarks?: string): Promise<void> {
    const typeConfig = this.getTypeConfig(indigentTypeId);
    if (!typeConfig || !accountNumber) return;

    const approvalMode = (typeConfig as any).writeOffApprovalMode || (typeConfig.enableWriteOffOnApproval === true ? 'first_application' : 'disabled');
    const writeOffEnabled = approvalMode !== 'disabled';
    const hasOnceWriteOff = writeOffEnabled && (onceWriteOff || 0) > 0;
    const shouldWriteOffHandover = writeOffEnabled && (typeConfig as any).writeOffHandoverDebt === true;
    const shouldTerminateHandover = typeConfig.terminateHandoverOnApproval === true;
    const shouldTerminatePlans = typeConfig.terminateRepaymentPlanOnApproval === true;

    if (!(hasOnceWriteOff || shouldWriteOffHandover || shouldTerminateHandover || shouldTerminatePlans)) return;

    try {
      const debtResult = await firstValueFrom(this.svc.executeIndigentDebtActions({
        accountNo: accountNumber,
        indigentTypeId: indigentTypeId,
        writeOffHandoverDebt: shouldWriteOffHandover,
        terminateHandover: shouldTerminateHandover,
        terminateRepaymentPlan: shouldTerminatePlans,
        onceWriteOff: writeOffEnabled ? (onceWriteOff || 0) : 0,
        writeOffDocumentType: (typeConfig as any).writeOffDocumentType || undefined,
        capturerID: this.userId,
        remarks: remarks || 'Indigent application approved',
      }));
      const actionSummary = (debtResult.actions || []).filter((a: any) => a.action !== 'no_action');
      if (actionSummary.length > 0) {
        const failed = actionSummary.filter((a: any) => !a.success);
        if (failed.length > 0) {
          this.toast.show(`Debt actions: ${failed.length} issue(s) — check handover/repayment status manually`, 'warning');
        } else {
          this.toast.show('Handover & repayment plan actions completed', 'success');
        }
      }
    } catch {
      this.toast.show('Approval succeeded but debt actions could not be processed — check manually', 'warning');
    }
  }

  private toIso(dateStr: string): string {
    return dateStr ? dateStr + 'T00:00:00' : new Date().toISOString();
  }

  getSlaRag(item: AuthorizationQueueItem): { label: string; css: string } | null {
    const iType = this.indigentTypes().find(t => t.indigentTypeId === item.indigentTypeId);
    if (!iType) return null;
    const target = iType.applicationSlaTargetDays || 30;
    const elapsed = Math.floor((Date.now() - new Date(item.applicationDate).getTime()) / (1000 * 60 * 60 * 24));
    const greenThreshold = Math.floor(target * 0.5);
    const amberThreshold = Math.floor(target * 0.833);
    const css = elapsed < greenThreshold ? 'badge-success' : elapsed <= amberThreshold ? 'badge-warning' : 'badge-danger';
    return { label: `${elapsed}d/${target}d`, css };
  }
}
