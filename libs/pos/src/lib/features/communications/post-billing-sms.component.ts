import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import { firstValueFrom } from 'rxjs';

interface ArrearsAccount {
  accountId: number;
  accountNumber: string;
  accountName: string;
  outstandingAmount: number;
  cellNumber: string;
  email: string;
  allEmails?: string[];
  allMobiles?: string[];
  ageingId: number;
  ageingLabel: string;
  hasCell: boolean;
  selected: boolean;
  smsSent: boolean;
  smsStatus: 'pending' | 'sending' | 'sent' | 'failed';
  smsError?: string;
}

interface Section129Run {
  runId: number;
  description: string;
  runDate: string;
  runType: string;
  totalAccounts: number;
  billingCycle: string;
  status: string;
}

interface Institution {
  id: number;
  name: string;
  accountNumbers: string[];
  loaded: boolean;
}

type Step = 'select' | 'compose' | 'review' | 'sending' | 'done';

const AGEING_LABELS: Record<number, string> = {
  0: 'Current',
  1: '30 Days',
  2: '60 Days',
  3: '90 Days',
  4: '120 Days',
  5: '150 Days',
  6: '180+ Days',
};

const DEFAULT_TEMPLATE = 'Dear {name}, your municipal account {accountNo} has an outstanding balance of R{amount} ({days} overdue). Please make payment to avoid further action. Contact us for payment arrangements. Ref: George Municipality';

@Component({
  selector: 'app-post-billing-sms',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './post-billing-sms.component.html',
  styleUrl: './post-billing-sms.component.css'
})
export class PostBillingSmsComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private auth = inject(AuthService);

  step = signal<Step>('select');

  runsLoading = signal(false);
  runs = signal<Section129Run[]>([]);
  selectedRunId = signal<number | null>(null);

  accountsLoading = signal(false);
  allAccounts = signal<ArrearsAccount[]>([]);
  contactsEnriching = signal(false);
  contactsEnrichProgress = signal('');
  minAgeingFilter = 1;
  minAmountFilter = 0;
  searchQuery = '';

  institutions = signal<Institution[]>([]);
  institutionsLoading = signal(false);
  selectedInstitutionId: number | null = null;
  institutionAccountNos = signal<Set<string> | null>(null);

  smsTemplate = DEFAULT_TEMPLATE;
  smsCredits = signal<number | null>(null);

  sending = signal(false);
  sendProgress = signal({ current: 0, total: 0, succeeded: 0, failed: 0 });

  get characterCount(): number { return this.smsTemplate.length; }

  get filteredAccounts(): ArrearsAccount[] {
    const all = this.allAccounts();
    const minAge = this.minAgeingFilter;
    const minAmt = this.minAmountFilter;
    const q = this.searchQuery.toLowerCase().trim();
    const instFilter = this.institutionAccountNos();
    return all.filter(a => {
      if (a.ageingId < minAge) return false;
      if (a.outstandingAmount < minAmt) return false;
      if (q && !a.accountNumber.toLowerCase().includes(q) && !a.accountName.toLowerCase().includes(q)) return false;
      if (instFilter && !instFilter.has(a.accountNumber)) return false;
      return true;
    });
  }

  get selectedAccounts(): ArrearsAccount[] { return this.filteredAccounts.filter(a => a.selected); }
  get smsEligible(): ArrearsAccount[] { return this.selectedAccounts.filter(a => a.hasCell); }
  get noPhoneCount(): number { return this.selectedAccounts.filter(a => !a.hasCell).length; }

  get totalOutstanding(): number {
    return this.selectedAccounts.reduce((s, a) => s + (a.outstandingAmount || 0), 0);
  }

  get ageingSummary(): { label: string; count: number; amount: number }[] {
    const selected = this.selectedAccounts;
    const summary: { label: string; count: number; amount: number }[] = [];
    const groups = new Map<number, { count: number; amount: number }>();
    for (const a of selected) {
      const g = groups.get(a.ageingId) || { count: 0, amount: 0 };
      g.count++;
      g.amount += a.outstandingAmount || 0;
      groups.set(a.ageingId, g);
    }
    for (const [id, g] of groups) {
      summary.push({ label: AGEING_LABELS[id] || `${id * 30}+ Days`, count: g.count, amount: g.amount });
    }
    summary.sort((a, b) => {
      const idxA = Object.values(AGEING_LABELS).indexOf(a.label);
      const idxB = Object.values(AGEING_LABELS).indexOf(b.label);
      return idxA - idxB;
    });
    return summary;
  }

  get previewMessage(): string {
    const eligible = this.smsEligible;
    if (eligible.length === 0) return '';
    const sample = eligible[0];
    return this.interpolateTemplate(this.smsTemplate, sample);
  }

  ngOnInit(): void {
    this.loadRuns();
    this.loadCredits();
    this.loadInstitutions();
  }

  async loadRuns(): Promise<void> {
    this.runsLoading.set(true);
    try {
      const data: any = await firstValueFrom(this.api.get('/api/platinum/billing-debt/section129-runs'));
      const mapped = (Array.isArray(data) ? data : [])
        .filter((r: any) => r.totalAccounts > 0)
        .sort((a: any, b: any) => new Date(b.runDate || b.dateCreated).getTime() - new Date(a.runDate || a.dateCreated).getTime())
        .slice(0, 20)
        .map((r: any) => ({
          runId: r.runId || r.id,
          description: r.description || `Run #${r.runId || r.id}`,
          runDate: r.runDate || r.dateCreated || '',
          runType: r.runType || '',
          totalAccounts: r.totalAccounts || 0,
          billingCycle: r.billingCycle || '',
          status: r.status || '',
        }));
      this.runs.set(mapped);
    } catch (err: any) {
      this.toast.show('Failed to load billing runs', 'error');
    } finally {
      this.runsLoading.set(false);
    }
  }

  async loadCredits(): Promise<void> {
    try {
      const data: any = await firstValueFrom(this.api.get('/api/sms/credits'));
      this.smsCredits.set(data?.credits ?? data?.balance ?? null);
    } catch {}
  }

  private isValidPhone(val: any): boolean {
    if (typeof val !== 'string') return false;
    const cleaned = val.replace(/[\s\-()]/g, '');
    if (/^\+27\d{9}$/.test(cleaned)) return true;
    if (/^27\d{9}$/.test(cleaned)) return true;
    if (/^0\d{9}$/.test(cleaned)) return true;
    return false;
  }

  private isMobileNumber(val: any): boolean {
    if (typeof val !== 'string') return false;
    const cleaned = val.replace(/[\s\-()]/g, '');
    if (/^0[6-8]\d{8}$/.test(cleaned)) return true;
    if (/^\+27[6-8]\d{8}$/.test(cleaned)) return true;
    if (/^27[6-8]\d{8}$/.test(cleaned)) return true;
    return false;
  }

  private isValidEmail(val: any): boolean {
    if (typeof val !== 'string') return false;
    return val.trim().length > 3 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  }

  private normalizeMobile(val: string): string {
    const cleaned = val.replace(/[\s\-()]/g, '');
    if (/^\+27\d{9}$/.test(cleaned)) return '0' + cleaned.slice(3);
    if (/^27\d{9}$/.test(cleaned)) return '0' + cleaned.slice(2);
    return cleaned;
  }

  private extractContactsFromRecord(rec: any): { emails: string[]; mobiles: string[] } {
    const emailSet = new Set<string>();
    const mobileSet = new Set<string>();
    if (!rec || typeof rec !== 'object') return { emails: [], mobiles: [] };
    const emailFields = ['email', 'eMail', 'emailAddress', 'Email'];
    const phoneFields = ['tel_Mobile', 'tel_Home', 'tel_Work', 'cellphone', 'cellPhone', 'mobile', 'mobileNumber', 'CellPhone', 'telephone', 'workPhone', 'homePhone', 'phone', 'Phone', 'telNo'];
    for (const f of emailFields) {
      if (this.isValidEmail(rec[f])) emailSet.add(rec[f].trim().toLowerCase());
    }
    for (const f of phoneFields) {
      if (this.isMobileNumber(rec[f])) {
        mobileSet.add(this.normalizeMobile(rec[f].trim()));
      }
    }
    return { emails: Array.from(emailSet), mobiles: Array.from(mobileSet) };
  }

  async enrichAccountContacts(): Promise<void> {
    const accounts = this.allAccounts();
    if (accounts.length === 0) return;
    const accountIds = accounts.map(a => a.accountId).filter(id => id > 0);
    if (accountIds.length === 0) return;

    this.contactsEnriching.set(true);
    const BATCH_SIZE = 50;
    const totalBatches = Math.ceil(accountIds.length / BATCH_SIZE);
    const contactMap = new Map<number, { emails: string[]; mobiles: string[] }>();

    try {
      for (let i = 0; i < totalBatches; i++) {
        const batch = accountIds.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
        this.contactsEnrichProgress.set(`Loading contacts: batch ${i + 1}/${totalBatches}`);
        try {
          const results: any[] = await firstValueFrom(
            this.api.post('/api/platinum/billing-debt/batch-contact-details', { accountIds: batch })
          );
          for (const item of (results || [])) {
            const { emails: cEmails, mobiles: cMobiles } = this.extractContactsFromRecord(item?.contact);
            const allEmails = new Set(cEmails);
            const allMobiles = new Set(cMobiles);
            if (Array.isArray(item?.additionalEmails)) {
              for (const ae of item.additionalEmails) {
                const addr = ae?.emailAdress ?? ae?.emailAddress ?? ae?.email ?? '';
                if (this.isValidEmail(addr)) allEmails.add(addr.trim().toLowerCase());
              }
            }
            contactMap.set(item.accountId, { emails: Array.from(allEmails), mobiles: Array.from(allMobiles) });
          }
        } catch (batchErr) {
          console.warn(`[post-billing-sms] Contact enrichment batch ${i + 1} failed:`, batchErr);
        }
      }
      this.allAccounts.update(accs => accs.map(a => {
        const contacts = contactMap.get(a.accountId);
        if (!contacts) return a;
        const allMobiles = contacts.mobiles;
        const allEmails = contacts.emails;
        const cellNumber = allMobiles[0] || a.cellNumber || '';
        const email = allEmails[0] || a.email || '';
        const hasCell = allMobiles.length > 0;
        return { ...a, cellNumber, email, allEmails, allMobiles, hasCell, selected: hasCell && a.ageingId >= 1 };
      }));
      const withPhone = Array.from(contactMap.values()).filter(c => c.mobiles.length > 0).length;
      this.contactsEnrichProgress.set(`Contacts loaded: ${withPhone} accounts with valid phone numbers`);
    } catch (err) {
      console.error('[post-billing-sms] Contact enrichment failed:', err);
      this.contactsEnrichProgress.set('Contact enrichment failed');
    } finally {
      this.contactsEnriching.set(false);
    }
  }

  async loadAccounts(): Promise<void> {
    const runId = this.selectedRunId();
    if (!runId) return;
    this.accountsLoading.set(true);
    try {
      const data: any = await firstValueFrom(
        this.api.get('/api/platinum/billing-debt/section129-run-accounts', { runId: String(runId) })
      );
      const raw = Array.isArray(data) ? data : (data?.accounts || []);
      const accounts: ArrearsAccount[] = raw.map((r: any) => {
        const ageingId = r.ageingId ?? r.ageing ?? 0;
        return {
          accountId: r.detailId ?? r.accountId ?? r.id ?? 0,
          accountNumber: r.accountNumber ?? r.accountNo ?? '',
          accountName: r.accountName ?? r.name ?? r.ownerName ?? '',
          outstandingAmount: r.qualifyingAmount ?? r.balanceDue ?? r.totalBalance ?? r.outstandingAmount ?? r.balance ?? 0,
          cellNumber: '',
          email: '',
          ageingId,
          ageingLabel: AGEING_LABELS[ageingId] || `${ageingId * 30}+ Days`,
          hasCell: false,
          selected: false,
          smsSent: false,
          smsStatus: 'pending' as const,
        };
      });

      const nameIds = accounts.filter(a => !a.accountName && a.accountId > 0).map(a => a.accountId);
      if (nameIds.length > 0) {
        try {
          const names: any = await firstValueFrom(
            this.api.post('/api/platinum/billing-debt/section129-account-names', {
              accounts: nameIds.map(id => ({ detailId: id, accountId: id }))
            })
          );
          if (Array.isArray(names)) {
            const nameMap = new Map<number, string>();
            for (const n of names) {
              const id = n.detailId ?? n.accountId;
              const name = n.fullName ?? n.name ?? n.ownerName ?? '';
              if (id && name) nameMap.set(id, name);
            }
            for (const a of accounts) {
              if (!a.accountName && nameMap.has(a.accountId)) {
                a.accountName = nameMap.get(a.accountId)!;
              }
            }
          }
        } catch {}
      }

      this.allAccounts.set(accounts);
      this.step.set('compose');
      setTimeout(() => this.enrichAccountContacts(), 100);
    } catch (err: any) {
      this.toast.show(err?.error?.message || 'Failed to load accounts', 'error');
    } finally {
      this.accountsLoading.set(false);
    }
  }

  async loadInstitutions(): Promise<void> {
    this.institutionsLoading.set(true);
    try {
      const data: any = await firstValueFrom(
        this.api.get('/api/platinum/const-institutions')
      );
      const arr = Array.isArray(data) ? data : [];
      const mapped: Institution[] = arr
        .map((g: any) => ({
          id: g.institution_ID || g.institutionID || g.accountGroupId || g.accountGroupID || g.id || 0,
          name: g.institutionDesc || g.accountGroupDesc || g.name || '',
          accountNumbers: [],
          loaded: false,
        }))
        .filter((i: Institution) => i.id && i.name)
        .sort((a: Institution, b: Institution) => a.name.localeCompare(b.name));
      this.institutions.set(mapped);
    } catch (err: any) {
      console.error('[post-billing-sms] Failed to load institutions:', err);
    } finally {
      this.institutionsLoading.set(false);
    }
  }

  async onInstitutionChange(): Promise<void> {
    const instId = this.selectedInstitutionId;
    if (!instId) {
      this.institutionAccountNos.set(null);
      return;
    }
    const inst = this.institutions().find(i => i.id === instId);
    if (!inst) {
      this.institutionAccountNos.set(null);
      return;
    }

    if (inst.loaded) {
      this.institutionAccountNos.set(new Set(inst.accountNumbers));
      return;
    }

    try {
      const data: any = await firstValueFrom(
        this.api.post('/api/platinum/billing-payment/get-group-accounts', {
          groupId: inst.id,
          institutionName: inst.name,
        })
      );
      const arr = Array.isArray(data) ? data : (data?.accounts || []);
      const accNos = arr.map((a: any) => String(a.accountNumber || a.accountNo || a.account_Number || '')).filter((n: string) => n);
      inst.accountNumbers = accNos;
      inst.loaded = true;
      this.institutionAccountNos.set(new Set(accNos));
    } catch (err: any) {
      this.toast.show('Failed to load institution accounts', 'error');
      this.institutionAccountNos.set(null);
      this.selectedInstitutionId = null;
    }
  }

  clearInstitutionFilter(): void {
    this.selectedInstitutionId = null;
    this.institutionAccountNos.set(null);
  }

  selectRun(runId: number): void {
    this.selectedRunId.set(runId);
  }

  goToCompose(): void {
    if (!this.selectedRunId()) {
      this.toast.show('Please select a billing run first', 'warning');
      return;
    }
    this.loadAccounts();
  }

  goToReview(): void {
    if (this.smsEligible.length === 0) {
      this.toast.show('No accounts with valid phone numbers selected', 'warning');
      return;
    }
    if (!this.smsTemplate.trim()) {
      this.toast.show('Please enter an SMS message', 'warning');
      return;
    }
    this.step.set('review');
  }

  goBack(): void {
    const s = this.step();
    if (s === 'compose') this.step.set('select');
    else if (s === 'review') this.step.set('compose');
  }

  toggleSelectAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const filtered = this.filteredAccounts;
    const ids = new Set(filtered.map(a => a.accountId));
    this.allAccounts.update(all =>
      all.map(a => ids.has(a.accountId) ? { ...a, selected: checked } : a)
    );
  }

  toggleAccount(acc: ArrearsAccount): void {
    this.allAccounts.update(all =>
      all.map(a => a.accountId === acc.accountId ? { ...a, selected: !a.selected } : a)
    );
  }

  get allFilteredSelected(): boolean {
    const f = this.filteredAccounts;
    return f.length > 0 && f.every(a => a.selected);
  }

  insertPlaceholder(placeholder: string): void {
    this.smsTemplate = this.smsTemplate + placeholder;
  }

  interpolateTemplate(template: string, acc: ArrearsAccount): string {
    return template
      .replace(/\{name\}/gi, acc.accountName || 'Account Holder')
      .replace(/\{accountNo\}/gi, acc.accountNumber)
      .replace(/\{amount\}/gi, (acc.outstandingAmount || 0).toFixed(2))
      .replace(/\{days\}/gi, acc.ageingLabel)
      .replace(/\{phone\}/gi, acc.cellNumber)
      .replace(/\{date\}/gi, this.formatDate(new Date()));
  }

  formatDate(d: Date): string {
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
  }

  formatRunDate(dateStr: string): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return this.formatDate(d);
  }

  formatCurrency(amount: number): string {
    return 'R ' + (amount || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  async sendAllSms(): Promise<void> {
    const eligible = this.smsEligible;
    if (eligible.length === 0) return;

    this.sending.set(true);
    this.step.set('sending');
    this.sendProgress.set({ current: 0, total: eligible.length, succeeded: 0, failed: 0 });

    const BATCH_SIZE = 25;
    let succeeded = 0;
    let failed = 0;

    for (let i = 0; i < eligible.length; i += BATCH_SIZE) {
      const batch = eligible.slice(i, i + BATCH_SIZE);

      const messages = batch.map(acc => ({
        to: acc.cellNumber,
        message: this.interpolateTemplate(this.smsTemplate, acc),
        accountId: acc.accountId,
        accountNumber: acc.accountNumber,
        accountHolder: acc.accountName,
      }));

      this.allAccounts.update(all =>
        all.map(a => {
          const inBatch = batch.find(b => b.accountId === a.accountId);
          return inBatch ? { ...a, smsStatus: 'sending' as const } : a;
        })
      );

      try {
        const result: any = await firstValueFrom(
          this.api.post('/api/sms/send-bulk', { messages, context: 'Post-Billing Arrears Notification' })
        );

        const results = result?.results || [];
        this.allAccounts.update(all =>
          all.map(a => {
            const batchIdx = batch.findIndex(b => b.accountId === a.accountId);
            if (batchIdx === -1) return a;
            const r = results[batchIdx];
            const success = r?.success ?? false;
            if (success) succeeded++;
            else failed++;
            return {
              ...a,
              smsSent: true,
              smsStatus: success ? 'sent' as const : 'failed' as const,
              smsError: success ? undefined : (r?.errorMessage || 'Send failed'),
            };
          })
        );
      } catch (err: any) {
        failed += batch.length;
        this.allAccounts.update(all =>
          all.map(a => {
            const inBatch = batch.find(b => b.accountId === a.accountId);
            return inBatch ? { ...a, smsSent: true, smsStatus: 'failed' as const, smsError: err?.error?.message || 'Network error' } : a;
          })
        );
      }

      this.sendProgress.set({
        current: Math.min(i + BATCH_SIZE, eligible.length),
        total: eligible.length,
        succeeded,
        failed,
      });

      if (i + BATCH_SIZE < eligible.length) {
        await new Promise(r => setTimeout(r, 500));
      }
    }

    this.sending.set(false);
    this.step.set('done');
    this.toast.show(`SMS campaign complete: ${succeeded} sent, ${failed} failed`, succeeded > 0 ? 'success' : 'error');
  }

  startNewCampaign(): void {
    this.step.set('select');
    this.selectedRunId.set(null);
    this.allAccounts.set([]);
    this.smsTemplate = DEFAULT_TEMPLATE;
    this.sendProgress.set({ current: 0, total: 0, succeeded: 0, failed: 0 });
  }

  exportResultsCsv(): void {
    const accounts = this.smsEligible;
    if (accounts.length === 0) return;
    const rows = [
      ['Account Number', 'Account Name', 'Phone', 'Outstanding', 'Ageing', 'SMS Status', 'Error'].join(','),
      ...accounts.map(a =>
        [
          a.accountNumber,
          `"${(a.accountName || '').replace(/"/g, '""')}"`,
          a.cellNumber,
          (a.outstandingAmount || 0).toFixed(2),
          a.ageingLabel,
          a.smsStatus,
          `"${(a.smsError || '').replace(/"/g, '""')}"`,
        ].join(',')
      ),
    ];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const d = new Date();
    link.download = `post-billing-sms-results-${String(d.getDate()).padStart(2,'0')}${String(d.getMonth()+1).padStart(2,'0')}${d.getFullYear()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }
}
