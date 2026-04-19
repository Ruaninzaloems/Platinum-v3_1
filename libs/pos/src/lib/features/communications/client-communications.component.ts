import { Component, signal, computed, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import { firstValueFrom } from 'rxjs';

interface ContactItem {
  value: string;
  enabled: boolean;
  isPrimary: boolean;
}

interface Recipient {
  id: string;
  accountId: number;
  accountNo: string;
  name: string;
  email: string;
  additionalEmails: string[];
  mobile: string;
  additionalMobiles: string[];
  emailContacts: ContactItem[];
  mobileContacts: ContactItem[];
  address: string;
  outstanding: number;
  selected: boolean;
  contactLoading: boolean;
  contactLoaded: boolean;
}

interface Attachment {
  id: string;
  name: string;
  size: number;
}

type CommMode = 'email' | 'sms';
type PageView = 'compose' | 'history';

interface HistoryEntry {
  id: number;
  accountNumber: string;
  accountHolder: string;
  method: string;
  recipients: string;
  subject: string;
  messageBody: string;
  status: string;
  createdAt: string;
}

interface SendSummary {
  mode: string;
  succeeded: number;
  failed: number;
  total: number;
  subject: string;
  recipientCount: number;
}

@Component({
  selector: 'app-client-communications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './client-communications.component.html',
  styleUrl: './client-communications.component.css'
})
export class ClientCommunicationsComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private auth = inject(AuthService);

  loading = signal(false);
  sending = signal(false);
  sendProgress = signal({ current: 0, total: 0, succeeded: 0, failed: 0 });
  error = signal('');
  mode = signal<CommMode>('email');

  pageView = signal<PageView>('compose');
  showSuccessPopup = signal(false);
  sendSummary = signal<SendSummary | null>(null);
  historyEntries = signal<HistoryEntry[]>([]);
  historyLoading = signal(false);
  historyFilter = signal<'all' | 'email' | 'sms'>('all');
  filteredHistory = computed(() => {
    const filter = this.historyFilter();
    const entries = this.historyEntries();
    if (filter === 'all') return entries;
    return entries.filter(e => e.method === filter);
  });

  recipients = signal<Recipient[]>([]);
  searchQuery = signal('');
  searching = signal(false);
  searchResults = signal<any[]>([]);
  searchDropdownOpen = signal(false);
  contactIndicators = signal<Record<number, { email: boolean; mobile: boolean; loading: boolean }>>({});

  subject = signal('');
  messageBody = signal('');
  attachments = signal<Attachment[]>([]);

  importing = signal(false);
  importProgress = signal({ current: 0, total: 0, added: 0 });
  contactEnriching = signal(false);
  contactEnrichProgress = signal({ current: 0, total: 0 });
  showPreview = signal(false);

  private recipientIds = new Set<number>();
  private searchTimer: any = null;

  selectedRecipients = computed(() => this.recipients().filter(r => r.selected));
  validEmailRecipients = computed(() => this.selectedRecipients().filter(r => r.emailContacts?.some(c => c.enabled)));
  validSmsRecipients = computed(() => this.selectedRecipients().filter(r => r.mobileContacts?.some(c => c.enabled)));
  totalEmailAddresses = computed(() => this.validEmailRecipients().reduce((sum, r) => sum + (r.emailContacts?.filter(c => c.enabled).length || 0), 0));
  totalSmsNumbers = computed(() => this.validSmsRecipients().reduce((sum, r) => sum + (r.mobileContacts?.filter(c => c.enabled).length || 0), 0));

  ngOnInit(): void {
    document.addEventListener('mousedown', this.handleClickOutside);
  }

  private handleClickOutside = (e: MouseEvent) => {
    const container = document.querySelector('.search-container');
    if (container && !container.contains(e.target as Node)) {
      this.searchDropdownOpen.set(false);
    }
  };

  ngOnDestroy(): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    document.removeEventListener('mousedown', this.handleClickOutside);
  }

  private isValidEmail(val: any): boolean {
    if (typeof val !== 'string') return false;
    const trimmed = val.trim();
    return trimmed.length > 3 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
  }

  private isValidMobile(val: any): boolean {
    if (typeof val !== 'string') return false;
    const cleaned = val.replace(/[\s\-()]/g, '');
    if (/^0[6-8]\d{8}$/.test(cleaned)) return true;
    if (/^\+27[6-8]\d{8}$/.test(cleaned)) return true;
    if (/^27[6-8]\d{8}$/.test(cleaned)) return true;
    if (/^0\d{9}$/.test(cleaned)) return true;
    return false;
  }

  private normalizeMobile(val: string): string {
    const cleaned = val.replace(/[\s\-()]/g, '');
    if (/^\+27\d{9}$/.test(cleaned)) return '0' + cleaned.slice(3);
    if (/^27\d{9}$/.test(cleaned)) return '0' + cleaned.slice(2);
    return cleaned;
  }

  private unwrapResponse(res: any): any[] {
    if (!res || res._error) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.value)) return res.value;
    if (Array.isArray(res?.results)) return res.results;
    if (Array.isArray(res?.items)) return res.items;
    if (typeof res === 'object') return [res];
    return [];
  }

  private isValidPhone(val: any): boolean {
    if (typeof val !== 'string') return false;
    const cleaned = val.replace(/[\s\-()]/g, '');
    if (/^\+27\d{9}$/.test(cleaned)) return true;
    if (/^27\d{9}$/.test(cleaned)) return true;
    if (/^0\d{9}$/.test(cleaned)) return true;
    return false;
  }

  private extractAllContacts(contactRes: any, nameRes: any, enquiryContactRes?: any): { emails: string[]; mobiles: string[] } {
    const emailSet = new Set<string>();
    const mobileSet = new Set<string>();

    const emailFields = ['email', 'eMail', 'emailAddress', 'emailId', 'Email'];
    const phoneFields = ['tel_Mobile', 'tel_Home', 'tel_Work', 'cellphone', 'cellPhone', 'mobile', 'mobileNumber', 'CellPhone', 'telephone', 'workPhone', 'homePhone', 'phone', 'Phone', 'telNo', 'contactNo', 'contactNumber', 'cellPhoneNo'];

    const extractFromRecord = (rec: any) => {
      if (!rec || typeof rec !== 'object') return;
      for (const f of emailFields) {
        if (this.isValidEmail(rec[f])) emailSet.add(rec[f].trim().toLowerCase());
      }
      for (const f of phoneFields) {
        if (this.isValidPhone(rec[f])) {
          mobileSet.add(this.normalizeMobile(rec[f].trim()));
        }
      }
    };

    this.unwrapResponse(contactRes).forEach(extractFromRecord);
    this.unwrapResponse(nameRes).forEach(extractFromRecord);
    if (enquiryContactRes) this.unwrapResponse(enquiryContactRes).forEach(extractFromRecord);

    return { emails: Array.from(emailSet), mobiles: Array.from(mobileSet) };
  }

  async performSearch(query: string): Promise<void> {
    if (query.length < 2) {
      this.searchResults.set([]);
      this.searchDropdownOpen.set(false);
      return;
    }
    this.searching.set(true);
    try {
      const isNumeric = /^\d+$/.test(query);
      const searchBody: any = {};
      if (isNumeric) { searchBody.accountNo = query; } else { searchBody.name = query; }

      const rawData: any = await firstValueFrom(this.api.post('/api/platinum/billing-payment/search-accounts', searchBody)).catch(() => []);
      const items = Array.isArray(rawData) ? rawData : (rawData?.value || []);
      const results = items.slice(0, 20);
      this.searchResults.set(results);
      this.searchDropdownOpen.set(results.length > 0);

      results.forEach((item: any) => {
        const accId = item.account_ID || item.accountID || item.id;
        if (accId && !this.contactIndicators()[accId]) {
          this.contactIndicators.update(prev => ({ ...prev, [accId]: { email: false, mobile: false, loading: true } }));
          Promise.all([
            firstValueFrom(this.api.get('/api/platinum/billing-account-management/get-contact-details', { accountId: String(accId) })).catch(() => null),
            firstValueFrom(this.api.get('/api/platinum/billing-enquiry/name-info-by-account', { accountId: String(accId) })).catch(() => null),
          ]).then(([contactRes, nameRes]) => {
            const { emails, mobiles } = this.extractAllContacts(contactRes, nameRes);
            this.contactIndicators.update(prev => ({ ...prev, [accId]: { email: emails.length > 0, mobile: mobiles.length > 0, loading: false } }));
          });
        }
      });
    } catch {
      this.searchResults.set([]);
    } finally {
      this.searching.set(false);
    }
  }

  onSearchInput(value: string): void {
    this.searchQuery.set(value);
    if (this.searchTimer) clearTimeout(this.searchTimer);
    if (value.length >= 2) {
      this.searchTimer = setTimeout(() => this.performSearch(value), 300);
    } else {
      this.searchResults.set([]);
      this.searchDropdownOpen.set(false);
    }
  }

  private async fetchContactDetails(accountId: number): Promise<{ email: string; additionalEmails: string[]; mobile: string; additionalMobiles: string[]; emailContacts: ContactItem[]; mobileContacts: ContactItem[] }> {
    try {
      const [contactRes, nameRes, addEmailRes, enquiryContactRes] = await Promise.all([
        firstValueFrom(this.api.get('/api/platinum/billing-account-management/get-contact-details', { accountId: String(accountId) })).catch(() => null),
        firstValueFrom(this.api.get('/api/platinum/billing-enquiry/name-info-by-account', { accountId: String(accountId) })).catch(() => null),
        firstValueFrom(this.api.get('/api/platinum/billing-account-management/get-additional-emails', { accountId: String(accountId) })).catch(() => null),
        firstValueFrom(this.api.get(`/api/platinum/billing-enquiry/contact-details/${accountId}`)).catch(() => null),
      ]);

      const { emails, mobiles } = this.extractAllContacts(contactRes, nameRes, enquiryContactRes);

      let extraEmails: string[] = [];
      if (addEmailRes && !addEmailRes._error) {
        const emailList = Array.isArray(addEmailRes) ? addEmailRes : (addEmailRes?.value || addEmailRes?.emails || []);
        extraEmails = emailList
          .map((e: any) => e?.emailAdress || e?.emailAddress || e?.email || e?.Email || (typeof e === 'string' ? e : ''))
          .filter((e: string) => this.isValidEmail(e))
          .map((e: string) => e.trim().toLowerCase());
      }

      const allEmails = Array.from(new Set([...emails, ...extraEmails]));
      const primaryEmail = allEmails.length > 0 ? allEmails[0] : '';
      const additionalEmails = allEmails.slice(1);

      const primaryMobile = mobiles.length > 0 ? mobiles[0] : '';
      const additionalMobiles = mobiles.slice(1);

      const emailContacts: ContactItem[] = allEmails.map((e, i) => ({ value: e, enabled: true, isPrimary: i === 0 }));
      const mobileContacts: ContactItem[] = [primaryMobile, ...additionalMobiles].filter(Boolean).map((m, i) => ({ value: m, enabled: true, isPrimary: i === 0 }));

      return { email: primaryEmail, additionalEmails, mobile: primaryMobile, additionalMobiles, emailContacts, mobileContacts };
    } catch {
      return { email: '', additionalEmails: [], mobile: '', additionalMobiles: [], emailContacts: [], mobileContacts: [] };
    }
  }

  async addRecipient(item: any): Promise<void> {
    const accId = item.account_ID || item.accountID || item.id;
    if (this.recipientIds.has(accId)) {
      this.toast.info(`Account ${accId} is already in the recipient list.`);
      return;
    }

    const accNo = item.accountNumber || item.accountNo || String(accId);
    const name = [item.initials, item.lastName].filter(Boolean).join(' ') || item.name || 'Unknown';
    const address = item.deliveryAddress?.replace(/\r?\n/g, ', ') || '';
    const outstanding = item.outStandingAmt || item.outstandingAmount || 0;

    this.recipientIds.add(accId);
    const newRecipient: Recipient = {
      id: `r-${Date.now()}-${accId}`, accountId: accId, accountNo: accNo, name, email: '',
      additionalEmails: [], mobile: '', additionalMobiles: [], emailContacts: [], mobileContacts: [],
      address, outstanding, selected: true, contactLoading: true, contactLoaded: false,
    };

    this.recipients.update(prev => [...prev, newRecipient]);
    this.searchQuery.set('');
    this.searchResults.set([]);
    this.searchDropdownOpen.set(false);

    try {
      const contactInfo = await this.fetchContactDetails(accId);
      this.recipients.update(prev => prev.map(r =>
        r.accountId === accId ? { ...r, ...contactInfo, contactLoading: false, contactLoaded: true } : r
      ));
    } catch {
      this.recipients.update(prev => prev.map(r =>
        r.accountId === accId ? { ...r, contactLoading: false, contactLoaded: true } : r
      ));
    }
  }

  removeRecipient(id: string): void {
    const removed = this.recipients().find(r => r.id === id);
    if (removed) this.recipientIds.delete(removed.accountId);
    this.recipients.update(prev => prev.filter(r => r.id !== id));
  }

  toggleRecipient(id: string): void {
    this.recipients.update(prev => prev.map(r => r.id === id ? { ...r, selected: !r.selected } : r));
  }

  updateRecipientField(id: string, field: 'email' | 'mobile', value: string): void {
    this.recipients.update(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  }

  toggleContactItem(recipientId: string, type: 'email' | 'mobile', contactValue: string): void {
    this.recipients.update(prev => prev.map(r => {
      if (r.id !== recipientId) return r;
      if (type === 'email') {
        return { ...r, emailContacts: r.emailContacts.map(c => c.value === contactValue ? { ...c, enabled: !c.enabled } : c) };
      } else {
        return { ...r, mobileContacts: r.mobileContacts.map(c => c.value === contactValue ? { ...c, enabled: !c.enabled } : c) };
      }
    }));
  }

  selectAll(): void { this.recipients.update(prev => prev.map(r => ({ ...r, selected: true }))); }
  deselectAll(): void { this.recipients.update(prev => prev.map(r => ({ ...r, selected: false }))); }
  clearAll(): void { this.recipientIds.clear(); this.recipients.set([]); }

  onFileUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    const newAttachments: Attachment[] = [];
    for (let i = 0; i < input.files.length; i++) {
      const f = input.files[i];
      newAttachments.push({ id: `att-${Date.now()}-${i}`, name: f.name, size: f.size });
    }
    this.attachments.update(prev => [...prev, ...newAttachments]);
    input.value = '';
  }

  removeAttachment(id: string): void {
    this.attachments.update(prev => prev.filter(a => a.id !== id));
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  }

  async handleSend(): Promise<void> {
    if (this.mode() === 'email') {
      if (this.validEmailRecipients().length === 0) {
        this.toast.error('None of the selected accounts have email addresses.');
        return;
      }
      if (!this.subject().trim()) {
        this.toast.error('Please enter an email subject.');
        return;
      }
    } else {
      if (this.validSmsRecipients().length === 0) {
        this.toast.error('None of the selected accounts have mobile numbers.');
        return;
      }
    }
    if (!this.messageBody().trim()) {
      this.toast.error('Please enter a message body.');
      return;
    }

    if (this.mode() === 'sms') {
      await this.sendSmsMessages();
    } else {
      await this.sendEmailMessages();
    }
  }

  private async sendSmsMessages(): Promise<void> {
    const recipients = this.validSmsRecipients();
    const messageText = this.messageBody().trim();

    const allNumbers: { to: string; accountId: number; accountNo: string; accountHolder: string }[] = [];
    for (const r of recipients) {
      for (const c of (r.mobileContacts || []).filter(c => c.enabled)) {
        allNumbers.push({ to: c.value, accountId: r.accountId, accountNo: r.accountNo, accountHolder: r.name });
      }
    }

    if (allNumbers.length === 0) {
      this.toast.error('No valid mobile numbers found.');
      return;
    }

    this.sending.set(true);
    this.sendProgress.set({ current: 0, total: allNumbers.length, succeeded: 0, failed: 0 });

    try {
      const messages = allNumbers.map(n => ({
        to: n.to,
        message: messageText,
        accountId: String(n.accountId),
        accountNumber: n.accountNo,
        accountHolder: n.accountHolder,
      }));

      const result: any = await firstValueFrom(this.api.post('/api/sms/send-bulk', {
        messages: messages.map(m => ({ to: m.to, message: m.message, accountId: m.accountId, accountNumber: m.accountNumber, accountHolder: m.accountHolder })),
        context: 'Client Communications',
      }));

      const succeeded = result?.succeeded ?? (result?.success ? allNumbers.length : 0);
      const failed = result?.failed ?? (result?.success ? 0 : allNumbers.length);
      this.sendProgress.set({ current: allNumbers.length, total: allNumbers.length, succeeded, failed });

      if (succeeded > 0) {
        this.sendSummary.set({
          mode: 'SMS',
          succeeded,
          failed,
          total: allNumbers.length,
          subject: '',
          recipientCount: recipients.length,
        });
        this.showSuccessPopup.set(true);
        this.resetForm();
      } else {
        this.toast.error(`All ${failed} SMS message(s) failed to send.`);
      }
    } catch (e: any) {
      const errMsg = e?.error?.message || e?.message || 'Unknown error';
      console.error('[ClientCommunications] SMS send error:', errMsg);
      if (errMsg.includes('credentials not configured')) {
        this.toast.error('SMS sending is not available — SMS Portal credentials need to be configured. Please contact your system administrator.');
      } else {
        this.toast.error(`SMS sending failed: ${errMsg}`);
      }
    } finally {
      this.sending.set(false);
    }
  }

  private async sendEmailMessages(): Promise<void> {
    const recipients = this.validEmailRecipients();
    const messageText = this.messageBody().trim();
    const subjectText = this.subject().trim();

    const allEmails: { email: string; accountId: number; accountNo: string; accountHolder: string }[] = [];
    for (const r of recipients) {
      for (const c of (r.emailContacts || []).filter(c => c.enabled)) {
        allEmails.push({ email: c.value, accountId: r.accountId, accountNo: r.accountNo, accountHolder: r.name });
      }
    }

    if (allEmails.length === 0) {
      this.toast.error('No valid email addresses found.');
      return;
    }

    this.sending.set(true);
    this.sendProgress.set({ current: 0, total: allEmails.length, succeeded: 0, failed: 0 });

    let succeeded = 0;
    let failed = 0;
    const BATCH_SIZE = 2;
    const perEmailResults: { accountId: string; accountNumber: string; accountHolder: string; method: string; recipients: string; subject: string; messageBody: string; status: string }[] = [];

    try {
      for (let i = 0; i < allEmails.length; i += BATCH_SIZE) {
        const batch = allEmails.slice(i, i + BATCH_SIZE);
        if (i > 0) await new Promise(r => setTimeout(r, 1500));
        const results = await Promise.allSettled(
          batch.map(e =>
            firstValueFrom(this.api.post('/api/platinum/billing-enquiry/send-notification', {
              accountId: String(e.accountId),
              method: 'email',
              recipient: e.email,
              subject: subjectText,
              message: messageText,
            }))
          )
        );

        for (let j = 0; j < results.length; j++) {
          const r = results[j];
          const emailEntry = batch[j];
          const wasSent = r.status === 'fulfilled' && (r.value as any)?.success;
          if (wasSent) {
            succeeded++;
          } else {
            failed++;
            const reason = r.status === 'rejected' ? (r.reason?.error?.message || r.reason?.message || '') : '';
            if (reason) console.warn('[ClientCommunications] Email send failed:', reason);
          }
          perEmailResults.push({
            accountId: String(emailEntry.accountId),
            accountNumber: emailEntry.accountNo,
            accountHolder: emailEntry.accountHolder,
            method: 'email',
            recipients: emailEntry.email,
            subject: subjectText,
            messageBody: messageText,
            status: wasSent ? 'sent' : 'failed',
          });
        }
        this.sendProgress.set({ current: i + batch.length, total: allEmails.length, succeeded, failed });
      }

      for (const entry of perEmailResults) {
        try {
          await firstValueFrom(this.api.post('/api/communication-logs', entry));
        } catch {}
      }

      if (succeeded > 0) {
        this.sendSummary.set({
          mode: 'Email',
          succeeded,
          failed,
          total: allEmails.length,
          subject: subjectText,
          recipientCount: recipients.length,
        });
        this.showSuccessPopup.set(true);
        this.resetForm();
      } else {
        this.toast.error(`All ${failed} email(s) failed to send. The Platinum email service may be temporarily unavailable.`);
      }
    } catch (e: any) {
      console.error('[ClientCommunications] Email send error:', e);
      const msg = e?.error?.message || e?.statusText || e?.message || 'Unknown error';
      this.toast.error(`Email dispatch failed: ${msg}`);
    } finally {
      this.sending.set(false);
    }
  }

  async handleCsvImport(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.importing.set(true);
    this.importProgress.set({ current: 0, total: 0, added: 0 });

    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      const accountNos: string[] = [];
      for (const line of lines) {
        const parts = line.split(/[,;\t]/).map(p => p.trim().replace(/"/g, ''));
        for (const part of parts) {
          const cleaned = part.replace(/\D/g, '');
          if (cleaned.length >= 2 && cleaned.length <= 15) accountNos.push(cleaned);
        }
      }

      const unique = Array.from(new Set(accountNos));
      if (unique.length === 0) {
        this.toast.error('Could not find any new valid account numbers in the file.');
        this.importing.set(false);
        return;
      }

      this.importProgress.set({ current: 0, total: unique.length, added: 0 });
      let totalAdded = 0;
      const pendingContactIds: number[] = [];
      const BATCH_SIZE = 20;

      for (let batchStart = 0; batchStart < unique.length; batchStart += BATCH_SIZE) {
        const batch = unique.slice(batchStart, batchStart + BATCH_SIZE);
        const searchPromises = batch.map(async (accNo) => {
          try {
            const rawData: any = await firstValueFrom(this.api.post('/api/platinum/billing-payment/search-accounts', { accountNo: accNo })).catch(() => []);
            const data = rawData || [];
            const items: any[] = Array.isArray(data) ? data : (data?.value || []);
            return items.find((i: any) => {
              const itemAccNo = String(i.accountNumber || i.accountNo || i.account_ID || i.accountID || i.id || '');
              return itemAccNo === accNo || itemAccNo.replace(/^0+/, '') === accNo.replace(/^0+/, '');
            }) || (items.length > 0 ? items[0] : null);
          } catch { return null; }
        });

        const foundItems = await Promise.all(searchPromises);
        for (const item of foundItems) {
          if (!item) continue;
          const accId = item.account_ID || item.accountID || item.id;
          if (accId && !this.recipientIds.has(accId)) {
            const accNo = item.accountNumber || item.accountNo || String(accId);
            const name = [item.initials, item.lastName].filter(Boolean).join(' ') || item.name || 'Unknown';
            const address = item.deliveryAddress?.replace(/\r?\n/g, ', ') || '';
            const outstanding = item.outStandingAmt || item.outstandingAmount || 0;

            this.recipientIds.add(accId);
            const newRecipient: Recipient = {
              id: `r-${Date.now()}-${accId}`, accountId: accId, accountNo: accNo, name, email: '',
              additionalEmails: [], mobile: '', additionalMobiles: [], emailContacts: [], mobileContacts: [],
              address, outstanding, selected: true, contactLoading: true, contactLoaded: false,
            };
            this.recipients.update(prev => [...prev, newRecipient]);
            totalAdded++;
            pendingContactIds.push(accId);
          }
        }
        this.importProgress.set({ current: Math.min(batchStart + BATCH_SIZE, unique.length), total: unique.length, added: totalAdded });
      }

      this.toast.success(`Import complete: Added ${totalAdded} account(s).${pendingContactIds.length > 0 ? ' Loading contact details in background...' : ''}`);
      this.importing.set(false);
      this.importProgress.set({ current: 0, total: 0, added: 0 });

      if (pendingContactIds.length > 0) {
        this.contactEnriching.set(true);
        this.contactEnrichProgress.set({ current: 0, total: pendingContactIds.length });
        const CONTACT_BATCH_SIZE = 10;

        for (let ci = 0; ci < pendingContactIds.length; ci += CONTACT_BATCH_SIZE) {
          const contactBatch = pendingContactIds.slice(ci, ci + CONTACT_BATCH_SIZE);
          const contactResults = await Promise.all(
            contactBatch.map(async (accId: number) => {
              const info = await this.fetchContactDetails(accId);
              return { accId, info };
            })
          );

          this.recipients.update(prev => {
            const updates = new Map(contactResults.map(cr => [cr.accId, cr.info]));
            return prev.map(r => {
              const info = updates.get(r.accountId);
              return info ? { ...r, ...info, contactLoading: false, contactLoaded: true } : r;
            });
          });

          this.contactEnrichProgress.set({ current: Math.min(ci + CONTACT_BATCH_SIZE, pendingContactIds.length), total: pendingContactIds.length });
        }

        this.contactEnriching.set(false);
        this.toast.success(`Loaded contact info for ${pendingContactIds.length} account(s).`);
      }
    } catch {
      this.toast.error('Could not read the file.');
    } finally {
      this.importing.set(false);
      this.importProgress.set({ current: 0, total: 0, added: 0 });
      input.value = '';
    }
  }

  isAlreadyAdded(accId: number): boolean {
    return this.recipientIds.has(accId);
  }

  formatFileSizeTotal(): string {
    const total = this.attachments().reduce((s, a) => s + a.size, 0);
    return this.formatFileSize(total);
  }

  previewToLine(): string {
    const vr = this.validEmailRecipients();
    const shown = vr.slice(0, 3).map(r => {
      const enabledEmails = (r.emailContacts || []).filter(c => c.enabled).map(c => c.value);
      const addr = enabledEmails.length > 0 ? enabledEmails[0] : r.email;
      return `${r.name} <${addr}>`;
    }).join('; ');
    return vr.length > 3 ? `${shown} (+${vr.length - 3} more)` : shown;
  }

  previewFileNames(): string {
    return this.attachments().map(a => a.name).join(', ');
  }

  downloadTemplate(): void {
    const csv = 'AccountNumber\n000000001234\n000000005678\n000000009012';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'import_template.csv';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  resetForm(): void {
    this.recipientIds.clear();
    this.recipients.set([]);
    this.subject.set('');
    this.messageBody.set('');
    this.attachments.set([]);
    this.searchQuery.set('');
    this.searchResults.set([]);
    this.searchDropdownOpen.set(false);
    this.sendProgress.set({ current: 0, total: 0, succeeded: 0, failed: 0 });
    this.showPreview.set(false);
  }

  dismissSuccessPopup(): void {
    this.showSuccessPopup.set(false);
    this.sendSummary.set(null);
  }

  goToHistoryFromPopup(): void {
    this.dismissSuccessPopup();
    this.switchToHistory();
  }

  switchToHistory(): void {
    this.pageView.set('history');
    this.loadHistory();
  }

  switchToCompose(): void {
    this.pageView.set('compose');
  }

  async loadHistory(): Promise<void> {
    this.historyLoading.set(true);
    try {
      const today = new Date();
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
      const dateFrom = thirtyDaysAgo.toISOString().split('T')[0];
      const dateTo = tomorrow.toISOString().split('T')[0];
      const data: any = await firstValueFrom(
        this.api.get(`/api/communication-logs-audit?dateFrom=${dateFrom}&dateTo=${dateTo}`)
      );
      const entries: HistoryEntry[] = (Array.isArray(data) ? data : []).map((d: any) => ({
        id: d.id,
        accountNumber: d.accountNumber || '',
        accountHolder: d.accountHolder || '',
        method: d.method || 'email',
        recipients: d.recipients || '',
        subject: d.subject || '',
        messageBody: d.messageBody || '',
        status: d.status || 'sent',
        createdAt: d.createdAt || '',
      }));
      this.historyEntries.set(entries);
    } catch (e: any) {
      console.error('[ClientCommunications] History load error:', e);
      this.toast.error('Failed to load communication history.');
    } finally {
      this.historyLoading.set(false);
    }
  }

  formatHistoryDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${mins}`;
  }

  truncateMessage(msg: string, maxLen: number = 80): string {
    if (!msg) return '';
    return msg.length > maxLen ? msg.slice(0, maxLen) + '...' : msg;
  }
}
