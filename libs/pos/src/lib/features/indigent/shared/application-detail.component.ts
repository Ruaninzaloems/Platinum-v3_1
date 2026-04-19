import { Component, Input, Output, EventEmitter, signal, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DateInputComponent } from '../../../shared/components/date-input.component';
import { firstValueFrom } from 'rxjs';
import { IndigentService } from '../../../services/indigent.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { formatDate } from '../../../services/format.service';
import type { ApplicationDetail, Application, Occupier, Tenant, Verification, QualifyingUnit, CommunicationLogEntry, IndigentType, SlaInfo, RequiredDocumentConfig } from '../../../models/indigent.models';
import { getStatusBadgeClass as getStatusBadgeClassUtil } from './status-badge.util';

@Component({
  selector: 'app-application-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, DateInputComponent],
  templateUrl: './application-detail.component.html',
  styleUrl: './application-detail.component.css'
})
export class ApplicationDetailComponent implements OnChanges {
  @Input() applicationId: number | null = null;
  @Input() mode: 'panel' | 'page' = 'panel';
  @Output() closePanel = new EventEmitter<void>();

  loading = signal(true);
  detail = signal<ApplicationDetail | null>(null);
  activeTab = 'summary';

  tabs = [
    { key: 'summary', label: 'Summary' },
    { key: 'occupiers', label: 'Occupiers' },
    { key: 'tenant', label: 'Tenant' },
    { key: 'verification', label: 'Site Verification History' },
    { key: 'documents', label: 'Documents' },
    { key: 'qualifying', label: 'Qualifying Units' },
    { key: 'communications', label: 'Communications' },
  ];

  documents = signal<any[]>([]);
  documentsLoading = signal(false);
  documentsError = signal<string | null>(null);

  downloadMenuOpen = signal(false);
  downloadingType = signal<string | null>(null);

  submittingForVerification = signal(false);
  requiredDocsForType = signal<{ documentTypeId: number; documentTypeName: string }[]>([]);

  commLogs = signal<CommunicationLogEntry[]>([]);
  commLoading = signal(false);
  indigentTypes = signal<IndigentType[]>([]);
  slaInfo = signal<SlaInfo | null>(null);

  docRequestModalOpen = false;
  docRequestDocs: { key: string; label: string; selected: boolean; previouslyRequested: boolean }[] = [];
  docRequestDeadlineDays = 14;
  docRequestCustomMessage = '';

  downloading = signal(false);

  dncModalOpen = false;
  dncDate = '';
  dncReason = '';
  dncSubmitting = signal(false);

  constructor(
    private svc: IndigentService,
    private auth: AuthService,
    private toast: ToastService
  ) {}

  private get userId(): number { return this.auth.user()?.user_ID || 0; }

  get docRequestSelectedCount(): number {
    return this.docRequestDocs.filter(d => d.selected).length;
  }

  get docRequestDeadlineDisplay(): string {
    const d = new Date();
    d.setDate(d.getDate() + (this.docRequestDeadlineDays || 0));
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${d.getFullYear()}`;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['applicationId'] && this.applicationId) {
      this.loadDetail();
    }
  }

  async loadDetail(): Promise<void> {
    if (!this.applicationId) return;
    this.loading.set(true);
    try {
      const [result] = await Promise.all([
        firstValueFrom(this.svc.getApplicationDetail(this.applicationId)),
        this.loadIndigentTypes(),
      ]);
      this.detail.set(result);
      if (result?.application) {
        const iType = this.indigentTypes().find(t => t.indigentTypeId === result.application.indigentTypeId);
        const slaTarget = iType?.applicationSlaTargetDays || 30;
        this.slaInfo.set(this.svc.computeSlaInfo(result.application.applicationDate, slaTarget));
        this.loadRequiredDocsForType(result.application.indigentTypeId);
        this.loadDocuments();
      }
    } catch (e: unknown) {
      const err = e as { error?: { message?: string } };
      this.toast.show(err?.error?.message || 'Failed to load application details', 'error');
    } finally {
      this.loading.set(false);
    }
  }

  get app(): Application | null {
    return this.detail()?.application || null;
  }

  get occupiers(): Occupier[] {
    return this.detail()?.occupiers || [];
  }

  get tenant(): Tenant | null {
    return this.detail()?.tenant || null;
  }

  get verifications(): Verification[] {
    return this.detail()?.verifications || [];
  }

  get qualifyingUnits(): QualifyingUnit[] {
    return this.detail()?.qualifyingUnits || [];
  }

  get totalOccupierIncome(): number {
    return this.occupiers.reduce((sum, o) => sum + (o.incomeAmount || 0), 0);
  }

  get totalSubsidyAmount(): number {
    return this.qualifyingUnits.reduce((sum, u) => sum + (u.subsidy || 0), 0);
  }

  selectTab(key: string): void {
    this.activeTab = key;
    if (key === 'communications' && this.commLogs().length === 0) {
      this.loadCommunicationHistory();
    }
    if (key === 'documents' && this.documents().length === 0) {
      this.loadDocuments();
    }
  }

  fmtDate(val: string | null | undefined): string {
    return formatDate(val);
  }

  fmtCurrency(val: number | null | undefined): string {
    return 'R ' + (val ?? 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  getStatusBadgeClass(statusName: string): string {
    return getStatusBadgeClassUtil(statusName);
  }

  get latestVerification(): Verification | null {
    const list = this.detail()?.verifications || [];
    if (list.length === 0) return null;
    return [...list].sort((a, b) => {
      const da = new Date(a.homeVisitDate || 0).getTime();
      const db = new Date(b.homeVisitDate || 0).getTime();
      return db - da;
    })[0];
  }

  get siteTrackBadge(): { label: string; cssClass: string } {
    const v = this.latestVerification;
    if (!v) return { label: 'Site: Not Started', cssClass: 'badge-grey' };
    const outcome = (v.verificationOutcomeName || '').trim();
    const home = (v.homeVisitOutcomeName || '').trim();
    if (outcome.toLowerCase() === 'qualify') return { label: 'Site: Qualified', cssClass: 'badge-success' };
    if (outcome.toLowerCase() === 'disqualify') return { label: 'Site: Disqualified', cssClass: 'badge-danger' };
    if (home) return { label: `Site: ${home}`, cssClass: 'badge-warning' };
    return { label: 'Site: In Progress', cssClass: 'badge-info' };
  }

  get docTrackBadge(): { label: string; cssClass: string } {
    const docs = this.documents();
    const required = this.requiredDocsForType();
    if (this.documentsLoading()) return { label: 'Docs: Loading…', cssClass: 'badge-default' };
    if (this.documentsError()) return { label: 'Docs: Error', cssClass: 'badge-danger' };
    if (docs.length === 0) return { label: 'Docs: Not Started', cssClass: 'badge-grey' };
    const anyRejected = docs.some((d: any) => {
      const s = (d.verificationStatus || d.verificationOutcomeName || d.status || '').toLowerCase();
      return s === 'rejected' || s === 'disqualify';
    });
    if (anyRejected) return { label: 'Docs: Rejected', cssClass: 'badge-danger' };
    const allVerified = docs.length > 0 && docs.every((d: any) => {
      const s = (d.verificationStatus || d.verificationOutcomeName || d.status || '').toLowerCase();
      return s === 'verified' || s === 'approved' || s === 'qualify';
    });
    if (allVerified) return { label: 'Docs: Verified', cssClass: 'badge-success' };
    if (required.length > 0) {
      const haveTypes = new Set(docs.map((d: any) => d.documentTypeId));
      const missing = required.filter(r => !haveTypes.has(r.documentTypeId));
      if (missing.length > 0) return { label: `Docs: ${docs.length} uploaded · ${missing.length} missing`, cssClass: 'badge-warning' };
    }
    return { label: `Docs: ${docs.length} Awaiting Verification`, cssClass: 'badge-info' };
  }

  get canSubmitForVerification(): boolean {
    const a = this.app;
    if (!a) return false;
    if (this.submittingForVerification()) return false;
    const id = a.appStatusId;
    const name = (a.appStatusName || '').toLowerCase();
    return id === 134 || id === 135 || name === 'application' || name === 're-application';
  }

  async submitForVerification(): Promise<void> {
    if (!this.applicationId || !this.canSubmitForVerification) return;
    this.submittingForVerification.set(true);
    try {
      const res = await firstValueFrom(this.svc.submitForVerification({
        applicationId: this.applicationId,
        capturerId: this.userId,
        modifierId: this.userId,
      }));
      if (res?.isSuccess === false) {
        this.toast.show(res?.message || 'Failed to submit for verification', 'error');
        return;
      }
      this.toast.show('Application submitted for verification', 'success');
      await this.loadDetail();
    } catch (e: any) {
      const msg = e?.error?.message || e?.message || 'Failed to submit for verification.';
      this.toast.show(msg, 'error');
    } finally {
      this.submittingForVerification.set(false);
    }
  }

  onClose(): void {
    this.closePanel.emit();
  }

  async downloadPdf(): Promise<void> { return this.downloadPdfType('application'); }

  toggleDownloadMenu(): void { this.downloadMenuOpen.update(v => !v); }
  closeDownloadMenu(): void { this.downloadMenuOpen.set(false); }

  async downloadPdfType(type: 'application' | 'site-verification' | 'doc-verification' | 'authorization' | 'termination'): Promise<void> {
    if (!this.applicationId || this.downloadingType()) return;
    this.downloadingType.set(type);
    this.downloading.set(true);
    this.closeDownloadMenu();
    const filenames: Record<string, string> = {
      'application': `Indigent_Application_${this.applicationId}.pdf`,
      'site-verification': `Site_Verification_${this.applicationId}.pdf`,
      'doc-verification': `Document_Verification_${this.applicationId}.pdf`,
      'authorization': `Authorization_Letter_${this.applicationId}.pdf`,
      'termination': `Termination_Letter_${this.applicationId}.pdf`,
    };
    const callers: Record<string, () => any> = {
      'application': () => this.svc.downloadApplicationPdf(this.applicationId!),
      'site-verification': () => this.svc.downloadSiteVerificationPdf(this.applicationId!),
      'doc-verification': () => this.svc.downloadDocVerificationPdf(this.applicationId!),
      'authorization': () => this.svc.downloadAuthorizationLetter(this.applicationId!),
      'termination': () => this.svc.downloadTerminationLetter(this.applicationId!),
    };
    try {
      const blob = await firstValueFrom(callers[type]());
      const url = URL.createObjectURL(blob as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filenames[type];
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: any) {
      const msg = e?.status === 404
        ? 'This document is not yet available for this application.'
        : 'Failed to generate PDF. Please try again.';
      this.toast.show(msg, 'error');
    } finally {
      this.downloadingType.set(null);
      this.downloading.set(false);
    }
  }

  async loadDocuments(): Promise<void> {
    if (!this.applicationId) return;
    this.documentsLoading.set(true);
    this.documentsError.set(null);
    try {
      const data: any = await firstValueFrom(this.svc.getDocuments(this.applicationId));
      const list = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : null);
      if (list === null) {
        throw new Error('Unexpected response shape from documents endpoint');
      }
      this.documents.set(list);
    } catch (e: any) {
      this.documents.set([]);
      const msg = e?.error?.message || e?.message || 'Failed to load documents from Platinum API.';
      this.documentsError.set(msg);
      this.toast.show(msg, 'error');
    } finally {
      this.documentsLoading.set(false);
    }
  }

  async downloadAttachment(doc: any): Promise<void> {
    const documentId = doc.documentId ?? doc.DocumentId ?? doc.id;
    if (!documentId || doc._downloading) return;
    doc._downloading = true;
    this.documents.update(d => [...d]);
    try {
      const res: any = await firstValueFrom(this.svc.downloadDocument(documentId));
      if (!res?.fileData) {
        this.toast.show('Document content not available.', 'error');
        return;
      }
      const raw = res.fileData.includes(',') ? res.fileData.split(',')[1] : res.fileData;
      const bytes = Uint8Array.from(atob(raw), c => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: res.contentType || 'application/octet-stream' });
      const url = URL.createObjectURL(blob as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.fileName || doc.fileName || doc.documentName || `document-${documentId}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      this.toast.show('Failed to download document.', 'error');
    } finally {
      doc._downloading = false;
      this.documents.update(d => [...d]);
    }
  }

  fmtFileSize(bytes: number | null | undefined): string {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }

  async loadCommunicationHistory(): Promise<void> {
    if (!this.app) return;
    this.commLoading.set(true);
    try {
      const accountId = String(this.app.accountId || this.app.applicationId);
      const logs = await firstValueFrom(this.svc.getCommunicationLogs(accountId, this.app.applicationId));
      this.commLogs.set(logs || []);
      const iType = this.indigentTypes().find(t => t.indigentTypeId === this.app!.indigentTypeId);
      const slaTarget = iType?.applicationSlaTargetDays || 30;
      this.slaInfo.set(this.svc.computeSlaInfo(this.app.applicationDate, slaTarget, logs));
    } catch {
      this.commLogs.set([]);
    } finally {
      this.commLoading.set(false);
    }
  }

  async loadIndigentTypes(): Promise<void> {
    try {
      const types = await firstValueFrom(this.svc.getIndigentTypes());
      this.indigentTypes.set(Array.isArray(types) ? types : []);
    } catch { }
  }

  async loadRequiredDocsForType(indigentTypeId: number): Promise<void> {
    try {
      const all = await firstValueFrom(this.svc.getDocumentTypes());
      const list = Array.isArray(all) ? all : [];
      const required = list
        .filter((dt: any) => dt.isRequired && dt.isActive && (dt.indigentTypeId == null || dt.indigentTypeId === indigentTypeId))
        .map((dt: any) => ({ documentTypeId: dt.documentTypeId, documentTypeName: dt.documentTypeName }));
      this.requiredDocsForType.set(required);
    } catch {
      this.requiredDocsForType.set([]);
    }
  }

  get currentSlaInfo(): SlaInfo | null {
    return this.slaInfo();
  }

  getSlaRagClass(status: string): string {
    switch (status) {
      case 'green': return 'badge-success';
      case 'amber': return 'badge-warning';
      case 'red': return 'badge-danger';
      default: return 'badge-grey';
    }
  }

  openDocRequestModal(): void {
    if (!this.app) return;
    const iType = this.indigentTypes().find(t => t.indigentTypeId === this.app!.indigentTypeId);
    let rawDocs = iType?.requiredDocuments;
    if (typeof rawDocs === 'string') { try { rawDocs = JSON.parse(rawDocs); } catch { rawDocs = []; } }
    const requiredDocs: RequiredDocumentConfig[] = Array.isArray(rawDocs) ? rawDocs : [];

    const docRequestLogs = this.commLogs().filter(l =>
      l.eventType === 'documents_outstanding' ||
      l.subject?.toLowerCase().includes('outstanding')
    );
    const previouslyRequestedText = docRequestLogs.map(l => l.messageBody || '').join(' ').toLowerCase();

    this.docRequestDocs = requiredDocs.map(d => {
      const wasPreviouslyRequested = previouslyRequestedText.includes(d.documentLabel.toLowerCase());
      return { key: d.documentKey, label: d.documentLabel, selected: wasPreviouslyRequested, previouslyRequested: wasPreviouslyRequested };
    });
    this.docRequestDeadlineDays = 14;
    this.docRequestCustomMessage = '';
    this.docRequestModalOpen = true;
  }

  closeDocRequestModal(): void { this.docRequestModalOpen = false; }

  async submitDocRequest(): Promise<void> {
    if (!this.app) return;
    const selectedDocs = this.docRequestDocs.filter(d => d.selected).map(d => d.label);
    if (selectedDocs.length === 0) { this.toast.show('Please select at least one document', 'error'); return; }
    const iType = this.indigentTypes().find(t => t.indigentTypeId === this.app!.indigentTypeId);
    if (!iType) { this.toast.show('Indigent type not found', 'error'); return; }
    try {
      const result = await this.svc.requestOutstandingDocuments({
        applicationId: this.app.applicationId,
        accountId: String(this.app.accountId),
        accountNumber: this.app.accountNumber || String(this.app.accountId),
        accountHolder: this.app.accountHolderName || '',
        recipientEmail: this.app.email || '',
        recipientPhone: this.app.cellNo || '',
        missingDocuments: selectedDocs,
        deadlineDays: this.docRequestDeadlineDays,
        customMessage: this.docRequestCustomMessage,
        indigentType: iType,
      });
      if (result.sent) {
        this.toast.show(`Document request sent via ${result.channels.join(', ')}`, 'success');
      } else {
        this.toast.show('No notification channels are enabled or configured for this indigent type', 'error');
      }
    } catch (err) {
      this.toast.show('Failed to send document request', 'error');
    }
    this.closeDocRequestModal();
    setTimeout(() => this.loadCommunicationHistory(), 2000);
  }

  exportCommunicationsCsv(): void {
    const logs = this.commLogs();
    if (!logs.length) return;
    const headers = ['Date', 'Channel', 'Recipients', 'Subject', 'Message', 'Status', 'Sent By'];
    const rows = logs.map(l => [
      l.createdAt ? new Date(l.createdAt).toLocaleString('en-ZA') : '',
      l.method, `"${l.recipients}"`, `"${l.subject}"`, `"${(l.messageBody || '').replace(/"/g, '""')}"`, l.status, l.sentByName
    ].join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob as Blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comm-history-app-${this.app?.applicationId || 'unknown'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    this.toast.show('Communication history exported', 'success');
  }

  openDncModal(): void {
    if (!this.app) return;
    this.dncDate = this.app.doNotCutDate ? this.app.doNotCutDate.split('T')[0] : '';
    this.dncReason = '';
    this.dncModalOpen = true;
  }

  closeDncModal(): void { this.dncModalOpen = false; }
  clearDncDate(): void { this.dncDate = ''; }

  async submitDncUpdate(): Promise<void> {
    if (!this.app) return;
    if (!this.dncReason) { this.toast.show('Reason is required', 'error'); return; }
    this.dncSubmitting.set(true);
    try {
      const now = new Date().toISOString();
      await firstValueFrom(this.svc.doNotCutUpdate({
        applicationId: this.app.applicationId,
        doNotCutDate: this.dncDate || null,
        doNotCutExtReason: this.dncReason,
        modifierID: this.userId,
        dateModified: now,
      }));
      this.toast.show(this.dncDate ? 'Do-not-cut date updated' : 'Do-not-cut protection removed', 'success');
      this.closeDncModal();
      await this.loadDetail();
    } catch (e: unknown) {
      const err = e as { error?: { message?: string } };
      this.toast.show(err?.error?.message || 'Do-not-cut update failed', 'error');
    } finally {
      this.dncSubmitting.set(false);
    }
  }
}
