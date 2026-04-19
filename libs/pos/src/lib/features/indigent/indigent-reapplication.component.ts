import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { IndigentService } from '../../services/indigent.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { formatDate } from '../../services/format.service';
import { getExpiryBadgeClass } from './shared/status-badge.util';
import { ApplicationDetailViewComponent } from './shared/application-detail-view.component';
import type { ReapplicationDueItem, IndigentType } from '../../models/indigent.models';

@Component({
  selector: 'app-indigent-reapplication',
  standalone: true,
  imports: [CommonModule, FormsModule, ApplicationDetailViewComponent],
  templateUrl: './indigent-reapplication.component.html',
  styleUrl: './indigent-reapplication.component.css'
})
export class IndigentReapplicationComponent implements OnInit {
  items = signal<ReapplicationDueItem[]>([]);
  totalCount = signal(0);
  loading = signal(true);
  submitting = signal(false);

  daysFilter = 30;
  indigentTypes = signal<IndigentType[]>([]);

  modalOpen = false;
  selectedItem: ReapplicationDueItem | null = null;
  reapplyForm = { householdIncome: 0, remarks: '' };

  detailApplicationId = signal<number | null>(null);

  constructor(
    private svc: IndigentService,
    private auth: AuthService,
    private toast: ToastService,
  ) {}

  private get userId(): number { return this.auth.user()?.user_ID || 0; }

  ngOnInit(): void { this.loadData(); }

  async loadData(): Promise<void> {
    this.loading.set(true);
    try {
      const [res, typesRes] = await Promise.allSettled([
        firstValueFrom(this.svc.getReapplicationDue(this.daysFilter)),
        firstValueFrom(this.svc.getIndigentTypes()),
      ]);
      if (typesRes.status === 'fulfilled') this.indigentTypes.set(Array.isArray(typesRes.value) ? typesRes.value : []);
      if (res.status === 'fulfilled') {
        const resVal = res.value;
        const data = Array.isArray(resVal) ? resVal : (resVal?.data || []);
        this.items.set(data);
        this.totalCount.set(Array.isArray(resVal) ? resVal.length : (resVal?.totalCount || data.length));
      } else {
        this.items.set([]);
        this.totalCount.set(0);
      }
    } catch {
      this.toast.show('Failed to load reapplication data', 'error');
    } finally {
      this.loading.set(false);
    }
  }

  fmtDate(val: string | null | undefined): string { return formatDate(val); }
  fmtCurrency(val: number): string { return 'R ' + (val ?? 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

  onDaysChange(): void { this.loadData(); }

  getUrgencyClass(days: number): string {
    return getExpiryBadgeClass(days);
  }

  getUrgencyLabel(days: number): string {
    if (days <= 0) return 'Expired';
    return `${days}d`;
  }

  openReapplyModal(item: ReapplicationDueItem): void {
    this.selectedItem = item;
    this.reapplyForm = { householdIncome: item.householdIncome, remarks: '' };
    this.modalOpen = true;
  }

  closeModal(): void { this.modalOpen = false; this.selectedItem = null; }

  async submitReapplication(): Promise<void> {
    if (this.submitting()) return;
    if (!this.selectedItem) return;
    this.submitting.set(true);
    try {
      const now = new Date().toISOString();
      const fyYear = new Date().getMonth() >= 6 ? new Date().getFullYear() : new Date().getFullYear() - 1;
      const reAppDate = `${fyYear + 1}-07-30T00:00:00`;
      await firstValueFrom(this.svc.submitReapplication({
        applicationId: this.selectedItem.applicationId,
        appStatusId: 135,
        householdIncome: this.reapplyForm.householdIncome,
        reApplicationDate: reAppDate,
        terminationDate: reAppDate,
        remarks: this.reapplyForm.remarks,
        capturerID: this.userId,
        dateCaptured: now,
        modifierID: this.userId,
        dateModified: now,
      }));
      this.toast.show('Reapplication submitted successfully', 'success');
      const iType = this.indigentTypes().find(t => t.indigentTypeName === this.selectedItem!.indigentTypeName);
      if (iType) {
        this.svc.fireLifecycleNotification({
          indigentType: iType,
          eventType: 'reapplication_received',
          mergeData: {
            applicantName: this.selectedItem!.accountHolderName,
            accountNumber: this.selectedItem!.accountNumber,
            applicationId: String(this.selectedItem!.applicationId),
            indigentTypeName: this.selectedItem!.indigentTypeName,
          },
          recipientEmail: this.selectedItem!.email || '',
          recipientPhone: this.selectedItem!.cellPhone || '',
          accountId: String(this.selectedItem!.accountId),
          accountNumber: this.selectedItem!.accountNumber,
          accountHolder: this.selectedItem!.accountHolderName,
        });
      }
      this.closeModal();
      await this.loadData();
    } catch (e: any) {
      this.toast.show(e?.error?.message || 'Failed to submit reapplication', 'error');
    } finally {
      this.submitting.set(false);
    }
  }

  viewApplication(appId: number): void {
    this.detailApplicationId.set(appId);
  }

  closeDetail(): void {
    this.detailApplicationId.set(null);
  }

  sendReminders(): void {
    const dueItems = this.items().filter(i => !i.reapplicationSubmitted);
    if (dueItems.length === 0) {
      this.toast.show('No items to send reminders for', 'info');
      return;
    }
    let sent = 0;
    for (const item of dueItems) {
      const iType = this.indigentTypes().find(t => t.indigentTypeName === item.indigentTypeName);
      if (!iType) continue;
      this.svc.fireLifecycleNotification({
        indigentType: iType,
        eventType: 'reapplication_reminder',
        mergeData: {
          applicantName: item.accountHolderName,
          accountNumber: item.accountNumber,
          applicationId: String(item.applicationId),
          indigentTypeName: item.indigentTypeName,
          reApplicationDate: item.reApplicationDate,
          daysRemaining: String(item.daysUntilExpiry),
        },
        recipientEmail: item.email || '',
        recipientPhone: item.cellPhone || '',
        accountId: String(item.accountId),
        accountNumber: item.accountNumber,
        accountHolder: item.accountHolderName,
      });
      sent++;
    }
    this.toast.show(`Reapplication reminders sent to ${sent} applicant(s)`, 'success');
  }
}
