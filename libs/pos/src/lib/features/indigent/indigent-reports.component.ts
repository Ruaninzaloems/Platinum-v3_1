import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { IndigentService } from '../../services/indigent.service';
import { ToastService } from '../../core/services/toast.service';
import { getFinancialYearList } from '../../services/format.service';
import type { ApplicationStats, IndigentType, ATTPDocumentType, WriteOffHistoryItem, SteercomReferralItem, CommunicationLogEntry } from '../../models/indigent.models';

@Component({
  selector: 'app-indigent-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './indigent-reports.component.html',
  styleUrl: './indigent-reports.component.css'
})
export class IndigentReportsComponent implements OnInit {
  stats = signal<ApplicationStats | null>(null);
  indigentTypes = signal<IndigentType[]>([]);
  docTypes = signal<ATTPDocumentType[]>([]);
  writeOffHistory = signal<WriteOffHistoryItem[]>([]);
  steercomReferrals = signal<SteercomReferralItem[]>([]);
  steercomLoading = signal(false);
  steercomTotal = signal(0);
  commAuditLogs = signal<CommunicationLogEntry[]>([]);
  commAuditLoading = signal(false);
  commAuditFilters = { dateFrom: '', dateTo: '', accountNumber: '', method: 'all', indigentTypeName: '' };
  loading = signal(true);
  finYear: string;
  finYears: string[] = [];
  activeReportTab = 'overview';

  constructor(
    private svc: IndigentService,
    private toast: ToastService
  ) {
    const now = new Date();
    const year = now.getMonth() >= 6 ? now.getFullYear() + 1 : now.getFullYear();
    this.finYear = `${year - 1}/${year}`;
    this.finYears = getFinancialYearList(5);
  }

  ngOnInit(): void { this.loadStats(); }

  async loadStats(): Promise<void> {
    this.loading.set(true);
    try {
      const [statsRes, typesRes, docTypesRes] = await Promise.allSettled([
        firstValueFrom(this.svc.getApplicationStats(this.finYear)),
        firstValueFrom(this.svc.getIndigentTypes()),
        firstValueFrom(this.svc.getDocumentTypes()),
      ]);
      if (statsRes.status === 'fulfilled') this.stats.set(statsRes.value || null);
      if (typesRes.status === 'fulfilled') this.indigentTypes.set(Array.isArray(typesRes.value) ? typesRes.value : []);
      if (docTypesRes.status === 'fulfilled') this.docTypes.set(Array.isArray(docTypesRes.value) ? docTypesRes.value : []);
    } catch {
      this.stats.set(null);
    } finally {
      this.loading.set(false);
    }
  }

  onFinYearChange(): void { this.loadStats(); }

  fmtCurrency(val: number): string { return 'R ' + (val ?? 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  fmtNumber(val: number): string { return (val ?? 0).toLocaleString('en-ZA'); }
  fmtPercent(val: number): string { return (val ?? 0).toFixed(1) + '%'; }

  get approvalRate(): number {
    const s = this.stats();
    if (!s || !s.totalApplications) return 0;
    return (s.totalApproved / s.totalApplications) * 100;
  }

  get declineRate(): number {
    const s = this.stats();
    if (!s || !s.totalApplications) return 0;
    return (s.totalDeclined / s.totalApplications) * 100;
  }

  getBarWidth(val: number, max: number): string {
    if (!max) return '0%';
    return Math.min(100, (val / max) * 100) + '%';
  }

  getMaxMonthly(): number {
    const s = this.stats();
    if (!s?.byMonth) return 1;
    return Math.max(1, ...s.byMonth.map(m => m.applications));
  }

  getWriteOffConfiguredCount(): number {
    return this.indigentTypes().filter(t => t.isActive && (t.enableWriteOffOnApproval || t.enableContinuousWriteOff)).length;
  }

  get pendingSeniorWriteOffCount(): number {
    return this.indigentTypes().filter(t => t.isActive && t.enableContinuousWriteOff && t.exemptSeniorsFromRenewal).length;
  }

  getDocTypeName(id: number | null): string {
    if (!id) return '-';
    const dt = this.docTypes().find(d => d.documentTypeId === id);
    return dt?.documentTypeName || `Type #${id}`;
  }

  getWriteOffTypeLabel(type: string): string {
    switch (type) {
      case 'approval': return 'On Approval';
      case 'continuous': return 'Continuous';
      case 'senior_periodic': return 'Senior Periodic';
      case 'handover_debt': return 'Handover Debt';
      default: return type;
    }
  }

  getWriteOffTypeBadge(type: string): string {
    switch (type) {
      case 'approval': return 'badge-success';
      case 'continuous': return 'badge-info';
      case 'senior_periodic': return 'badge-warning';
      case 'handover_debt': return 'badge-danger';
      default: return 'badge-muted';
    }
  }

  fmtDate(dateStr: string): string {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }

  async exportWriteOffCsv(): Promise<void> {
    const history = this.writeOffHistory();
    if (!history.length) return;
    const headers = ['Date', 'Account', 'Name', 'Indigent Type', 'Amount', 'Type', 'Document Type', 'Processed By', 'Status'];
    const rows = history.map(h => [h.writeOffDate, h.accountNo, h.accountHolderName, h.indigentTypeName, h.writeOffAmount, h.writeOffType, h.documentTypeUsed, h.processedBy, h.status].join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `indigent-writeoff-report-${this.finYear.replace('/', '-')}.csv`; a.click();
    URL.revokeObjectURL(url);
    this.toast.show('Write-off report exported', 'success');
  }

  async loadSteercomReferrals(): Promise<void> {
    this.steercomLoading.set(true);
    try {
      const result = await firstValueFrom(this.svc.getSteercomReferrals({ pageSize: 100 }));
      this.steercomReferrals.set(result?.items || result?.data || (Array.isArray(result) ? result : []));
      this.steercomTotal.set(result?.totalCount || 0);
    } catch {
      this.steercomReferrals.set([]);
    } finally {
      this.steercomLoading.set(false);
    }
  }

  onReportTabChange(tab: string): void {
    this.activeReportTab = tab;
    if (tab === 'steercom' && this.steercomReferrals().length === 0) {
      this.loadSteercomReferrals();
    }
    if (tab === 'comm_audit' && this.commAuditLogs().length === 0) {
      this.loadCommAudit();
    }
  }

  async loadCommAudit(): Promise<void> {
    this.commAuditLoading.set(true);
    try {
      const params: Record<string, string> = {};
      if (this.commAuditFilters.dateFrom) params['dateFrom'] = this.commAuditFilters.dateFrom;
      if (this.commAuditFilters.dateTo) params['dateTo'] = this.commAuditFilters.dateTo;
      if (this.commAuditFilters.accountNumber) params['accountNumber'] = this.commAuditFilters.accountNumber;
      if (this.commAuditFilters.method && this.commAuditFilters.method !== 'all') params['method'] = this.commAuditFilters.method;
      if (this.commAuditFilters.indigentTypeName) params['indigentTypeName'] = this.commAuditFilters.indigentTypeName;
      const logs = await firstValueFrom(this.svc.getCommunicationAuditLogs(params));
      this.commAuditLogs.set(Array.isArray(logs) ? logs : []);
    } catch {
      this.commAuditLogs.set([]);
    } finally {
      this.commAuditLoading.set(false);
    }
  }

  async exportCommAuditCsv(): Promise<void> {
    const logs = this.commAuditLogs();
    if (!logs.length) return;
    const headers = ['Date', 'Account Number', 'Account Holder', 'Channel', 'Event', 'Indigent Type', 'Recipients', 'Subject', 'Message', 'Status', 'Sent By'];
    const rows = logs.map(l => [
      l.createdAt ? new Date(l.createdAt).toLocaleString('en-ZA') : '',
      l.accountNumber, `"${l.accountHolder}"`, l.method, l.eventType || '', l.indigentTypeName || '', `"${l.recipients}"`, `"${l.subject}"`, `"${(l.messageBody || '').replace(/"/g, '""')}"`, l.status, l.sentByName
    ].join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `comm-audit-${new Date().toISOString().split('T')[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
    this.toast.show('Communication audit exported', 'success');
  }

  async exportSteercomCsv(): Promise<void> {
    const items = this.steercomReferrals();
    if (!items.length) return;
    const headers = ['Application ID', 'Account', 'Account Holder', 'Indigent Type', 'Referral Date', 'Reason', 'Referred By', 'Status'];
    const rows = items.map(i => [i.applicationId, i.accountNumber, i.accountHolderName, i.indigentTypeName, i.referralDate, `"${i.referralReason}"`, i.referredBy, i.status].join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `steercom-referrals-${new Date().toISOString().split('T')[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
    this.toast.show('Steercom referral report exported', 'success');
  }

  async exportCsv(): Promise<void> {
    const s = this.stats();
    if (!s) return;
    const headers = ['Month', 'Applications', 'Approved', 'Declined', 'Terminated', 'Subsidy Cost'];
    const rows = (s.byMonth || []).map(m => [m.monthName, m.applications, m.approved, m.declined, m.terminated, m.subsidyCost].join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `indigent-report-${this.finYear.replace('/', '-')}.csv`; a.click();
    URL.revokeObjectURL(url);
    this.toast.show('Report exported', 'success');
  }
}
