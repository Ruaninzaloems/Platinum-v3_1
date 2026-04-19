import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { IndigentService } from '../../services/indigent.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { formatDate } from '../../services/format.service';
import { ApplicationDetailComponent } from './shared/application-detail.component';
import type {
  DocVerificationQueueItem,
  IndigentType,
  IndigentLifecycleEvent,
  ATTPDocument,
  DocumentVerificationStatus,
  ReferralTarget,
  ReferralWorkflowConfig
} from '../../models/indigent.models';
import {
  REFERRAL_TARGET_LABELS,
  REFERRAL_TARGET_ICONS,
  REFERRAL_TARGET_COLORS
} from '../../models/indigent.models';

@Component({
  selector: 'app-indigent-doc-verification',
  standalone: true,
  imports: [CommonModule, FormsModule, ApplicationDetailComponent],
  templateUrl: './indigent-doc-verification.component.html',
  styleUrl: './indigent-doc-verification.component.css'
})
export class IndigentDocVerificationComponent implements OnInit {
  queue = signal<DocVerificationQueueItem[]>([]);
  totalCount = signal(0);
  loading = signal(true);
  submitting = signal(false);
  indigentTypes = signal<IndigentType[]>([]);
  stats = signal({ pending: 0, verified: 0, referred: 0, rejected: 0 });

  page = 1;
  pageSize = 15;
  pageSizeOptions = [10, 15, 25, 50];
  filterType = '';
  filterStatus = '';

  reviewModalOpen = false;
  selectedItem: DocVerificationQueueItem | null = null;
  reviewDocs = signal<ATTPDocument[]>([]);
  docStatuses: Record<string, DocumentVerificationStatus> = {};
  docReasons: Record<string, string> = {};
  referralNote = '';

  detailPanelOpen = false;
  detailApplicationId: number | null = null;

  constructor(
    private svc: IndigentService,
    private auth: AuthService,
    private toast: ToastService
  ) {}

  private get userId(): number { return this.auth.user()?.user_ID || 0; }

  ngOnInit(): void {
    this.loadData();
  }

  async loadData(): Promise<void> {
    this.loading.set(true);
    try {
      const [queueRes, typesRes] = await Promise.allSettled([
        firstValueFrom(this.svc.getDocVerificationQueue({
          page: this.page,
          pageSize: this.pageSize,
          indigentTypeId: this.filterType ? Number(this.filterType) : undefined,
          status: this.filterStatus || undefined
        })),
        firstValueFrom(this.svc.getIndigentTypes()),
      ]);

      if (queueRes.status === 'fulfilled') {
        const res = queueRes.value;
        this.queue.set(Array.isArray(res?.data) ? res.data : []);
        this.totalCount.set(res?.totalCount || 0);
        this.computeStats();
      }
      if (typesRes.status === 'fulfilled') {
        this.indigentTypes.set(Array.isArray(typesRes.value) ? typesRes.value : []);
      }
    } catch { /* handled */ } finally {
      this.loading.set(false);
    }
  }

  private computeStats(): void {
    const items = this.queue();
    this.stats.set({
      pending: items.filter(i => i.pendingDocuments > 0 && !i.referralTarget).length,
      verified: items.filter(i => i.verifiedDocuments === i.totalDocuments && i.totalDocuments > 0).length,
      referred: items.filter(i => !!i.referralTarget).length,
      rejected: items.filter(i => i.rejectedDocuments > 0).length,
    });
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalCount() / this.pageSize));
  }

  onFilterChange(): void {
    this.page = 1;
    this.loadData();
  }

  onPageSizeChange(): void {
    this.page = 1;
    this.loadData();
  }

  prevPage(): void { if (this.page > 1) { this.page--; this.loadData(); } }
  nextPage(): void { if (this.page < this.totalPages) { this.page++; this.loadData(); } }
  goToPage(p: number): void { this.page = p; this.loadData(); }

  getDocPercent(item: DocVerificationQueueItem): number {
    if (item.totalDocuments === 0) return 0;
    return Math.round((item.verifiedDocuments / item.totalDocuments) * 100);
  }

  fmtDate(d: string | null): string {
    return formatDate(d);
  }

  fmtCurrency(v: number): string {
    return 'R ' + (v || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatFileSize(bytes: number | null): string {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  }

  async openReviewModal(item: DocVerificationQueueItem): Promise<void> {
    this.selectedItem = item;
    this.docStatuses = {};
    this.docReasons = {};
    this.referralNote = '';
    this.reviewModalOpen = true;

    try {
      const docs = await firstValueFrom(this.svc.getDocuments(item.applicationId));
      const docsList = Array.isArray(docs) ? docs : [];
      this.reviewDocs.set(docsList);
      for (const doc of docsList) {
        const key = this.docKey(doc);
        this.docStatuses[key] = 'pending';
        this.docReasons[key] = '';
      }
    } catch {
      this.reviewDocs.set([]);
    }
  }

  closeReviewModal(): void {
    this.reviewModalOpen = false;
    this.selectedItem = null;
    this.reviewDocs.set([]);
  }

  private docKey(doc: ATTPDocument): string {
    return String(doc.documentId || doc.documentTypeId);
  }

  getDocStatus(doc: ATTPDocument): DocumentVerificationStatus {
    return this.docStatuses[this.docKey(doc)] || 'pending';
  }

  setDocStatus(doc: ATTPDocument, status: DocumentVerificationStatus): void {
    this.docStatuses = { ...this.docStatuses, [this.docKey(doc)]: status };
    if (status !== 'rejected') {
      this.docReasons = { ...this.docReasons, [this.docKey(doc)]: '' };
    }
  }

  getDocRejectionReason(doc: ATTPDocument): string {
    return this.docReasons[this.docKey(doc)] || '';
  }

  setDocRejectionReason(doc: ATTPDocument, reason: string): void {
    this.docReasons = { ...this.docReasons, [this.docKey(doc)]: reason };
  }

  get allDocsVerified(): boolean {
    const docs = this.reviewDocs();
    if (docs.length === 0) return false;
    return docs.every(d => this.getDocStatus(d) === 'verified');
  }

  get hasRejectedDocs(): boolean {
    return Object.values(this.docStatuses).some(s => s === 'rejected');
  }

  get docVerificationSummary(): string {
    const verified = Object.values(this.docStatuses).filter(s => s === 'verified').length;
    const rejected = Object.values(this.docStatuses).filter(s => s === 'rejected').length;
    const pending = Object.values(this.docStatuses).filter(s => s === 'pending').length;
    const parts: string[] = [];
    if (verified > 0) parts.push(`${verified} verified`);
    if (rejected > 0) parts.push(`${rejected} rejected`);
    if (pending > 0) parts.push(`${pending} pending`);
    return parts.join(', ') || 'No documents';
  }

  get availableReferralTargets(): ReferralTarget[] {
    if (!this.selectedItem) return [];
    const iType = this.indigentTypes().find(t => t.indigentTypeId === this.selectedItem!.indigentTypeId);
    const config: ReferralWorkflowConfig = {
      enableReferToContractor: true, enableReferToCapturer: true,
      enableReferToSupervisor: true, enableReferToSteeringCommittee: true,
      supervisorCanReferToContractor: true, supervisorCanReferToCapturer: true,
      supervisorCanReferToDocVerifier: true, supervisorCanReferToSteeringCommittee: true,
      ...(iType?.referralWorkflow || {})
    };
    const targets: ReferralTarget[] = [];
    if (config.enableReferToCapturer) targets.push('capturer');
    if (config.enableReferToContractor) targets.push('contractor');
    if (config.enableReferToSupervisor) targets.push('supervisor');
    if (config.enableReferToSteeringCommittee) targets.push('steering_committee');
    return targets;
  }

  getReferralLabel(target: ReferralTarget | string): string {
    return REFERRAL_TARGET_LABELS[target as ReferralTarget] || target;
  }

  getReferralIcon(target: ReferralTarget | string): string {
    return REFERRAL_TARGET_ICONS[target as ReferralTarget] || 'swap_horiz';
  }

  getReferralColor(target: ReferralTarget | string): string {
    return REFERRAL_TARGET_COLORS[target as ReferralTarget] || '#6b7280';
  }

  private buildVerificationResults(): { documentId: number; status: string; rejectionReason?: string }[] {
    return this.reviewDocs().map(doc => {
      const key = this.docKey(doc);
      const result: { documentId: number; status: string; rejectionReason?: string } = {
        documentId: doc.documentId || doc.documentTypeId || 0,
        status: this.docStatuses[key] || 'pending',
      };
      if (this.docStatuses[key] === 'rejected' && this.docReasons[key]) {
        result.rejectionReason = this.docReasons[key];
      }
      return result;
    });
  }

  async submitApproved(): Promise<void> {
    if (this.submitting() || !this.selectedItem) return;
    if (!this.allDocsVerified) {
      this.toast.show('All documents must be verified before approving', 'error');
      return;
    }
    this.submitting.set(true);
    try {
      await firstValueFrom(this.svc.submitDocVerification({
        applicationId: this.selectedItem.applicationId,
        verificationResults: this.buildVerificationResults(),
        overallOutcome: 'approved',
      }));
      this.toast.show('Documents verified — application forwarded to Authorization', 'success');
      this.notifyLifecycle('doc_verification_approved');
      this.closeReviewModal();
      await this.loadData();
    } catch (e: unknown) {
      const err = e as { error?: { message?: string } };
      this.toast.show(err?.error?.message || 'Failed to approve documents', 'error');
    } finally {
      this.submitting.set(false);
    }
  }

  async submitRejected(): Promise<void> {
    if (this.submitting() || !this.selectedItem) return;
    if (!this.hasRejectedDocs) {
      this.toast.show('Mark at least one document as rejected', 'error');
      return;
    }
    const missingReasons = this.reviewDocs().some(doc => {
      const key = this.docKey(doc);
      return this.docStatuses[key] === 'rejected' && !this.docReasons[key]?.trim();
    });
    if (missingReasons) {
      this.toast.show('Please provide a rejection reason for all rejected documents', 'error');
      return;
    }
    this.submitting.set(true);
    try {
      await firstValueFrom(this.svc.submitDocVerification({
        applicationId: this.selectedItem.applicationId,
        verificationResults: this.buildVerificationResults(),
        overallOutcome: 'rejected',
        referralTarget: 'capturer',
        referralNote: this.referralNote || 'Documents rejected — please correct and resubmit',
      }));
      this.toast.show('Documents rejected — returned to Capturer for correction', 'success');
      this.notifyLifecycle('doc_verification_rejected');
      this.closeReviewModal();
      await this.loadData();
    } catch (e: unknown) {
      const err = e as { error?: { message?: string } };
      this.toast.show(err?.error?.message || 'Failed to reject documents', 'error');
    } finally {
      this.submitting.set(false);
    }
  }

  async submitReferred(target: ReferralTarget): Promise<void> {
    if (this.submitting() || !this.selectedItem) return;
    this.submitting.set(true);
    try {
      await firstValueFrom(this.svc.submitDocVerification({
        applicationId: this.selectedItem.applicationId,
        verificationResults: this.buildVerificationResults(),
        overallOutcome: 'referred',
        referralTarget: target,
        referralNote: this.referralNote || `Referred to ${REFERRAL_TARGET_LABELS[target]}`,
      }));
      this.toast.show(`Application referred to ${REFERRAL_TARGET_LABELS[target]}`, 'success');
      this.closeReviewModal();
      await this.loadData();
    } catch (e: unknown) {
      const err = e as { error?: { message?: string } };
      this.toast.show(err?.error?.message || 'Failed to submit referral', 'error');
    } finally {
      this.submitting.set(false);
    }
  }

  async downloadDoc(doc: ATTPDocument): Promise<void> {
    if (!doc.documentId) return;
    try {
      const result = await firstValueFrom(this.svc.downloadDocument(doc.documentId));
      if (result?.fileData) {
        const link = document.createElement('a');
        link.href = `data:${result.contentType || 'application/octet-stream'};base64,${result.fileData}`;
        link.download = result.fileName || doc.fileName || 'document';
        link.click();
      }
    } catch {
      this.toast.show('Failed to download document', 'error');
    }
  }

  private notifyLifecycle(eventType: IndigentLifecycleEvent): void {
    if (!this.selectedItem) return;
    const iType = this.indigentTypes().find(t => t.indigentTypeId === this.selectedItem!.indigentTypeId);
    if (!iType) return;
    this.svc.fireLifecycleNotification({
      indigentType: iType,
      eventType,
      mergeData: {
        applicantName: this.selectedItem.accountHolderName,
        accountNumber: this.selectedItem.accountNumber,
        applicationId: String(this.selectedItem.applicationId),
        indigentTypeName: this.selectedItem.indigentTypeName,
      },
      recipientEmail: this.selectedItem.email || '',
      recipientPhone: this.selectedItem.cellPhone || '',
      accountId: String(this.selectedItem.accountId),
      accountNumber: this.selectedItem.accountNumber,
      accountHolder: this.selectedItem.accountHolderName,
    });
  }

  viewApplication(applicationId: number): void {
    this.detailApplicationId = applicationId;
    this.detailPanelOpen = true;
  }

  closeDetailPanel(): void {
    this.detailPanelOpen = false;
    this.detailApplicationId = null;
  }
}
