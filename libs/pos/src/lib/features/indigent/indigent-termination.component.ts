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
import { SignatureCaptureComponent } from './shared/signature-capture.component';
import type { IndigentRegisterItem, BatchTerminateResponse, IndigentType } from '../../models/indigent.models';

@Component({
  selector: 'app-indigent-termination',
  standalone: true,
  imports: [CommonModule, FormsModule, SignatureCaptureComponent, DateInputComponent],
  templateUrl: './indigent-termination.component.html',
  styleUrl: './indigent-termination.component.css'
})
export class IndigentTerminationComponent implements OnInit {
  items = signal<IndigentRegisterItem[]>([]);
  totalCount = signal(0);
  loading = signal(true);
  submitting = signal(false);
  terminationReasons: { reasonId: number; reasonName: string }[] = [];
  indigentTypes = signal<IndigentType[]>([]);

  page = 1;
  pageSize = 15;
  searchText = '';

  modalOpen = false;
  selectedItem: IndigentRegisterItem | null = null;
  termForm = { terminationReasonId: 0, remarks: '', terminationDate: '', writeOffOnTermination: false, writeOffAmount: 0 };

  batchModalOpen = false;
  selectedIds = new Set<number>();
  batchReasonId = 0;
  batchTerminationDate = '';
  batchRemarks = '';

  batchResultsOpen = false;
  batchResults: BatchTerminateResponse | null = null;

  disqualifiedItems = signal<Record<string, unknown>[]>([]);
  disqualifiedLoading = signal(false);
  overrideModalOpen = false;
  overrideItem: Record<string, unknown> | null = null;
  overrideReason = '';

  dncModalOpen = false;
  dncItem: IndigentRegisterItem | null = null;
  dncDate = '';
  dncReason = '';

  signatureCaptured = false;

  activeSection: 'termination' | 'disqualification' | 'auto-termination' | 'comm-log' = 'termination';

  expiringItems = signal<Record<string, unknown>[]>([]);
  expiringLoading = signal(false);
  autoTermRunning = signal(false);
  autoTermResults: any = null;
  autoTermResultsOpen = false;
  autoTermLogItems = signal<Record<string, unknown>[]>([]);
  autoTermLogLoading = signal(false);

  commLogModalOpen = false;
  commLogItem: IndigentRegisterItem | null = null;
  commLogs = signal<any[]>([]);
  commLogsLoading = signal(false);

  constructor(
    private svc: IndigentService,
    private auth: AuthService,
    private toast: ToastService,
    private router: Router
  ) {}

  private get userId(): number { return this.auth.user()?.user_ID || 0; }

  ngOnInit(): void { this.loadData(); }

  async loadData(): Promise<void> {
    this.loading.set(true);
    try {
      const [regRes, reasonsRes, typesRes] = await Promise.allSettled([
        firstValueFrom(this.svc.getIndigentRegister({
          status: 'Active',
          page: this.page,
          pageSize: this.pageSize,
          search: this.searchText || undefined,
        })),
        firstValueFrom(this.svc.getTerminationReasons()),
        firstValueFrom(this.svc.getIndigentTypes()),
      ]);
      if (regRes.status === 'fulfilled') {
        const res = regRes.value;
        this.items.set(Array.isArray(res) ? res : (res?.items || res?.data || []));
        this.totalCount.set(Array.isArray(res) ? res.length : (res?.totalCount || 0));
      }
      if (reasonsRes.status === 'fulfilled') this.terminationReasons = Array.isArray(reasonsRes.value) ? reasonsRes.value : [];
      if (typesRes.status === 'fulfilled') this.indigentTypes.set(Array.isArray(typesRes.value) ? typesRes.value : []);
    } catch {
      this.toast.show('Failed to load data', 'error');
    } finally {
      this.loading.set(false);
    }
  }

  async loadDisqualified(): Promise<void> {
    this.disqualifiedLoading.set(true);
    try {
      const res = await firstValueFrom(this.svc.getAutomaticDisqualification());
      this.disqualifiedItems.set(Array.isArray(res) ? res : []);
    } catch {
      this.disqualifiedItems.set([]);
    } finally {
      this.disqualifiedLoading.set(false);
    }
  }

  async loadExpiringApplications(): Promise<void> {
    this.expiringLoading.set(true);
    try {
      const res = await firstValueFrom(this.svc.getExpiringApplications({ daysAhead: 90 }));
      this.expiringItems.set(Array.isArray(res) ? res : (res?.data || []));
    } catch {
      this.toast.show('Failed to load expiring applications', 'error');
    } finally {
      this.expiringLoading.set(false);
    }
  }

  async loadAutoTerminationLog(): Promise<void> {
    this.autoTermLogLoading.set(true);
    try {
      const res = await firstValueFrom(this.svc.getAutoTerminationLog());
      this.autoTermLogItems.set(Array.isArray(res) ? res : []);
    } catch {
      this.toast.show('Failed to load auto-termination log', 'error');
    } finally {
      this.autoTermLogLoading.set(false);
    }
  }

  setSection(section: 'termination' | 'disqualification' | 'auto-termination' | 'comm-log'): void {
    this.activeSection = section;
    if (section === 'disqualification' && this.disqualifiedItems().length === 0) {
      this.loadDisqualified();
    }
    if (section === 'auto-termination' && this.expiringItems().length === 0) {
      this.loadExpiringApplications();
      this.loadAutoTerminationLog();
    }
  }

  get totalPages(): number { return Math.max(1, Math.ceil(this.totalCount() / this.pageSize)); }
  fmtDate(val: string | null | undefined): string { return formatDate(val); }
  fmtCurrency(val: number): string { return 'R ' + (val ?? 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

  Math = Math;

  daysUntilExpiry(reappDate: string | null | undefined): number {
    if (!reappDate) return 0;
    const expiry = new Date(reappDate);
    const now = new Date();
    return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  expiryUrgency(reappDate: string | null | undefined): string {
    const days = this.daysUntilExpiry(reappDate);
    if (days < 0) return 'overdue';
    if (days <= 14) return 'critical';
    if (days <= 30) return 'warning';
    return 'normal';
  }

  onSearch(): void { this.page = 1; this.selectedIds.clear(); this.loadData(); }
  prevPage(): void { if (this.page > 1) { this.page--; this.selectedIds.clear(); this.loadData(); } }
  nextPage(): void { if (this.page < this.totalPages) { this.page++; this.selectedIds.clear(); this.loadData(); } }

  toggleSelect(id: number): void {
    if (this.selectedIds.has(id)) this.selectedIds.delete(id);
    else this.selectedIds.add(id);
  }

  isSelected(id: number): boolean { return this.selectedIds.has(id); }

  selectAll(): void {
    if (this.selectedIds.size === this.items().length) this.selectedIds.clear();
    else this.items().forEach(i => this.selectedIds.add(i.applicationId));
  }

  get allSelected(): boolean { return this.items().length > 0 && this.selectedIds.size === this.items().length; }

  openTerminateModal(item: IndigentRegisterItem): void {
    this.selectedItem = item;
    const today = new Date().toISOString().slice(0, 10);
    this.termForm = { terminationReasonId: 0, remarks: '', terminationDate: today, writeOffOnTermination: false, writeOffAmount: 0 };
    this.signatureCaptured = false;
    this.modalOpen = true;
  }

  closeModal(): void { this.modalOpen = false; this.selectedItem = null; }

  isWriteOffEnabledForItem(item?: IndigentRegisterItem | null): boolean {
    if (!item?.indigentTypeId) return false;
    const cfg = this.indigentTypes().find(t => t.indigentTypeId === item.indigentTypeId);
    return cfg?.enableWriteOffOnApproval === true;
  }

  onSignatureSaved(): void {
    this.signatureCaptured = true;
  }

  async submitTermination(): Promise<void> {
    if (this.submitting()) return;
    if (!this.selectedItem || !this.termForm.terminationReasonId) {
      this.toast.show('Please select a termination reason', 'error');
      return;
    }
    if (!this.signatureCaptured) {
      this.toast.show('A signature must be captured before submitting termination', 'error');
      return;
    }
    this.submitting.set(true);
    try {
      const now = new Date().toISOString();
      const termDate = this.termForm.terminationDate ? this.termForm.terminationDate + 'T00:00:00' : now;
      await firstValueFrom(this.svc.terminateApplication({
        applicationId: this.selectedItem.applicationId,
        appStatusId: 145,
        terminationReasonId: this.termForm.terminationReasonId,
        terminationDate: termDate,
        remarks: this.termForm.remarks,
        reviewerID: this.userId,
        reviewDate: now,
        modifierID: this.userId,
        dateModified: now,
        writeOffOnTermination: this.termForm.writeOffOnTermination,
        writeOffAmount: this.termForm.writeOffOnTermination ? this.termForm.writeOffAmount : 0,
        accountNo: this.selectedItem.accountNumber || '',
        indigentTypeId: this.selectedItem.indigentTypeId || 0,
      }));
      const reasonName = this.terminationReasons.find(r => r.reasonId === Number(this.termForm.terminationReasonId))?.reasonName || 'Unknown';
      this.logTerminationComm(this.selectedItem, reasonName, this.termForm.remarks);
      const iType = this.indigentTypes().find(t => t.indigentTypeName === this.selectedItem!.indigentTypeName);
      if (iType) {
        this.svc.fireLifecycleNotification({
          indigentType: iType,
          eventType: 'termination_notice',
          mergeData: {
            applicantName: this.selectedItem!.accountHolderName,
            accountNumber: this.selectedItem!.accountNumber,
            applicationId: String(this.selectedItem!.applicationId),
            indigentTypeName: this.selectedItem!.indigentTypeName,
            terminationReason: reasonName,
          },
          recipientEmail: this.selectedItem!.email || '',
          recipientPhone: this.selectedItem!.cellPhone || '',
          accountId: String(this.selectedItem!.accountId),
          accountNumber: this.selectedItem!.accountNumber,
          accountHolder: this.selectedItem!.accountHolderName,
        });
      }
      this.toast.show('Application terminated successfully', 'success');
      this.closeModal();
      await this.loadData();
    } catch (e: unknown) {
      const err = e as { error?: { message?: string } };
      this.toast.show(err?.error?.message || 'Failed to terminate application', 'error');
    } finally {
      this.submitting.set(false);
    }
  }

  private logTerminationComm(item: IndigentRegisterItem, reason: string, remarks: string): void {
    const subject = `Indigent Termination — Application #${item.applicationId}`;
    const body = `Application #${item.applicationId} for account ${item.accountNumber} (${item.accountHolderName}) has been terminated.\n\nReason: ${reason}\nRemarks: ${remarks || 'None'}\nType: ${item.indigentTypeName}\nSubsidy Lost: ${this.fmtCurrency(item.monthlySubsidy)}/month`;
    firstValueFrom(this.svc.logCommunication({
      accountId: String(item.accountId || item.applicationId),
      accountNumber: item.accountNumber,
      accountHolder: item.accountHolderName,
      method: 'system',
      recipients: 'internal-log',
      subject,
      messageBody: body,
      statementType: 'Indigent Termination',
    })).catch(() => {});
  }

  openBatchModal(): void {
    if (this.selectedIds.size === 0) { this.toast.show('Select at least one application', 'error'); return; }
    this.batchReasonId = 0;
    this.batchTerminationDate = new Date().toISOString().slice(0, 10);
    this.batchRemarks = '';
    this.batchModalOpen = true;
  }

  closeBatchModal(): void { this.batchModalOpen = false; }

  async submitBatchTermination(): Promise<void> {
    if (this.submitting()) return;
    if (!this.batchReasonId) { this.toast.show('Please select a termination reason', 'error'); return; }
    this.submitting.set(true);
    try {
      const now = new Date().toISOString();
      const batchTermDate = this.batchTerminationDate ? this.batchTerminationDate + 'T00:00:00' : now;
      const res = await firstValueFrom(this.svc.batchTerminate({
        applicationIds: Array.from(this.selectedIds),
        appStatusId: 145,
        terminationReasonId: this.batchReasonId,
        terminationDate: batchTermDate,
        remarks: this.batchRemarks,
        reviewerID: this.userId,
        reviewDate: now,
        modifierID: this.userId,
        dateModified: now,
      }));
      this.batchResults = res;
      const reasonName = this.terminationReasons.find(r => r.reasonId === Number(this.batchReasonId))?.reasonName || 'Unknown';
      if (res.results) {
        res.results.filter((r: any) => r.success).forEach((r: any) => {
          const item = this.items().find(i => i.applicationId === r.applicationId);
          if (item) {
            this.logTerminationComm(item, reasonName, this.batchRemarks);
            const iType = this.indigentTypes().find(t => t.indigentTypeName === item.indigentTypeName);
            if (iType) {
              this.svc.fireLifecycleNotification({
                indigentType: iType,
                eventType: 'termination_notice',
                mergeData: {
                  applicantName: item.accountHolderName,
                  accountNumber: item.accountNumber,
                  applicationId: String(item.applicationId),
                  indigentTypeName: item.indigentTypeName,
                  terminationReason: reasonName,
                },
                recipientEmail: item.email || '',
                recipientPhone: item.cellPhone || '',
                accountId: String(item.accountId),
                accountNumber: item.accountNumber,
                accountHolder: item.accountHolderName,
              });
            }
          }
        });
      }
      this.selectedIds.clear();
      this.closeBatchModal();
      this.batchResultsOpen = true;
      await this.loadData();
    } catch (e: unknown) {
      const err = e as { error?: { message?: string } };
      this.toast.show(err?.error?.message || 'Batch termination failed', 'error');
    } finally {
      this.submitting.set(false);
    }
  }

  closeBatchResults(): void { this.batchResultsOpen = false; this.batchResults = null; }

  openOverrideModal(item: Record<string, unknown>): void {
    this.overrideItem = item;
    this.overrideReason = '';
    this.overrideModalOpen = true;
  }

  closeOverrideModal(): void { this.overrideModalOpen = false; this.overrideItem = null; this.overrideReason = ''; }

  async submitOverride(): Promise<void> {
    if (!this.overrideItem) return;
    if (this.overrideReason.length < 10) {
      this.toast.show('Override reason must be at least 10 characters', 'error');
      return;
    }
    this.submitting.set(true);
    try {
      const now = new Date().toISOString();
      const appId = Number(this.overrideItem['applicationId'] || this.overrideItem['application_ID'] || 0);
      await firstValueFrom(this.svc.overrideDisqualification({
        applicationId: appId,
        overrideReason: this.overrideReason,
        newStatusId: 1,
        reviewerID: this.userId,
        reviewDate: now,
        modifierID: this.userId,
        dateModified: now,
      }));
      const acctId = String(this.overrideItem['accountId'] || this.overrideItem['account_ID'] || appId);
      firstValueFrom(this.svc.logCommunication({
        accountId: acctId,
        accountNumber: String(this.overrideItem['accountNumber'] || this.overrideItem['account_Number'] || ''),
        accountHolder: String(this.overrideItem['accountHolderName'] || this.overrideItem['account_Holder'] || ''),
        method: 'system',
        recipients: 'internal-log',
        subject: `Disqualification Override — Application #${appId}`,
        messageBody: `Disqualification override for application #${appId}.\nReason: ${this.overrideReason}\nNew status: Active`,
        statementType: 'Indigent Override',
      })).catch(() => {});
      this.toast.show('Disqualification overridden — account returned to Active', 'success');
      this.closeOverrideModal();
      await this.loadDisqualified();
    } catch (e: unknown) {
      const err = e as { error?: { message?: string } };
      this.toast.show(err?.error?.message || 'Override failed', 'error');
    } finally {
      this.submitting.set(false);
    }
  }

  openDncModal(item: IndigentRegisterItem): void {
    this.dncItem = item;
    this.dncDate = item.doNotCutDate ? item.doNotCutDate.split('T')[0] : '';
    this.dncReason = '';
    this.dncModalOpen = true;
  }

  closeDncModal(): void { this.dncModalOpen = false; this.dncItem = null; }

  async submitDncUpdate(): Promise<void> {
    if (!this.dncItem) return;
    if (!this.dncReason) { this.toast.show('Reason is required', 'error'); return; }
    this.submitting.set(true);
    try {
      const now = new Date().toISOString();
      await firstValueFrom(this.svc.doNotCutUpdate({
        applicationId: this.dncItem.applicationId,
        doNotCutDate: this.dncDate || null,
        doNotCutExtReason: this.dncReason,
        modifierID: this.userId,
        dateModified: now,
      }));
      this.toast.show(this.dncDate ? 'Do-not-cut date updated' : 'Do-not-cut protection removed', 'success');
      this.closeDncModal();
      await this.loadData();
    } catch (e: unknown) {
      const err = e as { error?: { message?: string } };
      this.toast.show(err?.error?.message || 'Do-not-cut update failed', 'error');
    } finally {
      this.submitting.set(false);
    }
  }

  clearDncDate(): void { this.dncDate = ''; }

  viewApplication(appId: number): void {
    this.router.navigate(['/pos/indigent/application'], { queryParams: { applicationId: appId, source: 'termination' } });
  }

  async runAutoTermination(dryRun: boolean): Promise<void> {
    this.autoTermRunning.set(true);
    try {
      const res = await firstValueFrom(this.svc.runAutoTermination({ dryRun }));
      this.autoTermResults = res;
      this.autoTermResultsOpen = true;
      if (!dryRun) {
        const terminated = res?.terminated || res?.results?.filter((r: any) => r.success) || [];
        if (Array.isArray(terminated)) {
          for (const t of terminated) {
            firstValueFrom(this.svc.logCommunication({
              accountId: String(t.accountId || t.applicationId || ''),
              accountNumber: t.accountNumber || '',
              accountHolder: t.accountHolderName || t.accountHolder || '',
              method: 'system-auto',
              recipients: 'auto-termination',
              subject: `Auto-Termination — Application #${t.applicationId || ''}`,
              messageBody: `Application auto-terminated due to expired registration.\nReason: Registration expired, grace period elapsed.\nType: ${t.indigentTypeName || ''}\nExpiry: ${t.expiryDate || t.reApplicationDate || ''}`,
              statementType: 'Indigent Auto-Termination',
            })).catch(() => {});
            const iType = this.indigentTypes().find(it => it.indigentTypeName === (t.indigentTypeName || ''));
            if (iType) {
              this.svc.fireLifecycleNotification({
                indigentType: iType,
                eventType: 'termination_notice',
                mergeData: {
                  applicantName: t.accountHolderName || t.accountHolder || '',
                  accountNumber: t.accountNumber || '',
                  applicationId: String(t.applicationId || ''),
                  indigentTypeName: t.indigentTypeName || '',
                  terminationReason: 'Registration expired, grace period elapsed',
                },
                recipientEmail: t.email || '',
                recipientPhone: t.cellPhone || '',
                accountId: String(t.accountId || t.applicationId || ''),
                accountNumber: t.accountNumber || '',
                accountHolder: t.accountHolderName || t.accountHolder || '',
              });
            }
          }
        }
        this.toast.show(`Auto-termination complete: ${res?.totalTerminated || 0} terminated`, 'success');
        await this.loadExpiringApplications();
        await this.loadAutoTerminationLog();
      } else {
        this.toast.show(`Preview complete: ${res?.totalEligible || res?.total || 0} would be terminated`, 'info');
      }
    } catch (e: unknown) {
      const err = e as { error?: { message?: string } };
      this.toast.show(err?.error?.message || 'Auto-termination failed', 'error');
    } finally {
      this.autoTermRunning.set(false);
    }
  }

  closeAutoTermResults(): void { this.autoTermResultsOpen = false; this.autoTermResults = null; }

  openCommLogModal(item: IndigentRegisterItem): void {
    this.commLogItem = item;
    this.commLogModalOpen = true;
    this.loadCommLogs(item);
  }

  closeCommLogModal(): void { this.commLogModalOpen = false; this.commLogItem = null; this.commLogs.set([]); }

  async loadCommLogs(item: IndigentRegisterItem): Promise<void> {
    this.commLogsLoading.set(true);
    try {
      const accountId = String(item.accountId || item.applicationId);
      const logs = await firstValueFrom(this.svc.getCommunicationLogs(accountId));
      this.commLogs.set(Array.isArray(logs) ? logs : []);
    } catch {
      this.commLogs.set([]);
    } finally {
      this.commLogsLoading.set(false);
    }
  }
}
