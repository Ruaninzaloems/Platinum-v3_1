import { Component, signal, computed, OnInit, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import { firstValueFrom } from 'rxjs';
import * as XLSX from 'xlsx-js-style';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface DenominationDef {
  key: string;
  label: string;
  value: number;
}

const NOTE_DENOMINATIONS: DenominationDef[] = [
  { key: 'n200', label: 'R200', value: 200 },
  { key: 'n100', label: 'R100', value: 100 },
  { key: 'n50', label: 'R50', value: 50 },
  { key: 'n20', label: 'R20', value: 20 },
  { key: 'n10', label: 'R10', value: 10 },
];

const COIN_DENOMINATIONS: DenominationDef[] = [
  { key: 'co5', label: 'R5', value: 5 },
  { key: 'co2', label: 'R2', value: 2 },
  { key: 'co1', label: 'R1', value: 1 },
  { key: 'c50', label: '50c', value: 0.50 },
  { key: 'c20', label: '20c', value: 0.20 },
  { key: 'c10', label: '10c', value: 0.10 },
  { key: 'c5', label: '5c', value: 0.05 },
  { key: 'c1', label: '1c', value: 0.01 },
];

@Component({
  selector: 'app-cashier-day-end',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cashier-day-end.component.html',
  styleUrl: './cashier-day-end.component.css'
})
export class CashierDayEndComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private auth = inject(AuthService);
  private router = inject(Router);

  user = this.auth.user;

  noteDenominations = NOTE_DENOMINATIONS;
  coinDenominations = COIN_DENOMINATIONS;

  sessionLoading = signal(true);
  sessionActive = signal(false);
  sessionCashierId = signal<number | null>(null);
  sessionCashierName = signal('');
  sessionOfficeName = signal('');
  sessionOfficeId = signal<number | null>(null);
  sessionCashFloat = signal(0);

  cashierDetails = signal<any>(null);
  isLoadingDetails = signal(false);

  chequeList = signal<any[]>([]);
  cardList = signal<any[]>([]);
  dropBoxList = signal<any[]>([]);
  reconcileList = signal<any[]>([]);
  isLoadingReceipts = signal(false);

  denominations = signal<Record<string, number>>({
    n200: 0, n100: 0, n50: 0, n20: 0, n10: 0,
    c1: 0, c5: 0, c10: 0, c20: 0, c50: 0,
    co1: 0, co2: 0, co5: 0,
  });

  totalCashAmt = signal(0);
  totalCreditAmt = signal(0);
  totalChequeAmt = signal(0);
  reason = signal('');
  isSaving = signal(false);
  showTransactionHistory = signal(false);
  enableDenominationCounting = signal(true);

  activeSection = signal<'takings' | 'cancellation' | 'dropbox'>('takings');

  cancelSearchQuery = signal('');
  cancelSearching = signal(false);
  cancelFoundReceipt = signal<any>(null);
  cancelSearchError = signal('');
  cancelReason = signal('');
  isCancellingReceipt = signal(false);
  showConfirmDialog = signal(false);
  confirmDialogAction = signal<'submit' | 'cancel' | null>(null);

  today = (() => { const d = new Date(); return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`; })();

  totalNotes = computed(() =>
    NOTE_DENOMINATIONS.reduce((sum, d) => sum + (this.denominations()[d.key] || 0) * d.value, 0)
  );

  totalCoins = computed(() =>
    COIN_DENOMINATIONS.reduce((sum, d) => sum + (this.denominations()[d.key] || 0) * d.value, 0)
  );

  calculatedCashTotal = computed(() => this.totalNotes() + this.totalCoins());

  cashOnHand = computed(() =>
    this.enableDenominationCounting() ? this.calculatedCashTotal() : this.totalCashAmt()
  );

  dropBoxTotal = computed(() =>
    this.dropBoxList().reduce((s, r) => s + (Number(r.amount) || 0), 0)
  );

  totalCashOnHandPlusDropBox = computed(() => this.cashOnHand() + this.dropBoxTotal());

  grandTotal = computed(() =>
    this.totalCashOnHandPlusDropBox() + this.totalCreditAmt()
  );

  cancellableReceipts = computed(() =>
    this.reconcileList().filter(r => !this.isCancelled(r))
  );

  ngOnInit(): void {
    this.detectSession();
  }

  async detectSession(): Promise<void> {
    this.sessionLoading.set(true);
    try {
      const userId = this.user()?.user_ID;
      const finYear = this.user()?.finYear || '';
      if (!userId) {
        this.sessionActive.set(false);
        return;
      }

      const data: any = await firstValueFrom(
        this.api.get('/api/platinum/auth/active-cashier-by-userid', {
          userid: String(userId),
          finYear
        })
      ).catch(() => null);

      if (!data || data._error) {
        this.sessionActive.set(false);
        return;
      }

      const isActive = data.isActive === true || data.active === true;
      const hasPendingDayEnd = data.hasPendingDayEnd === true;
      const hasDayEndReturned = data.hasDayEndReturned === true;

      if (!isActive && !hasPendingDayEnd && !hasDayEndReturned) {
        this.sessionActive.set(false);
        return;
      }

      this.sessionActive.set(true);
      const cashierId = data.cashierId || data.details?.id || data.id || null;
      this.sessionCashierId.set(cashierId ? Number(cashierId) : null);

      const name = data.cashierName || data.details?.userName || data.details?.name || this.user()?.userName || '';
      this.sessionCashierName.set(name);

      const office = data.officeName || data.details?.const_CashOffice?.cashOfficeDesc || data.cashOfficeName || '';
      this.sessionOfficeName.set(office);

      const officeId = data.officeId || data.details?.officeId || data.details?.const_CashOffice?.cashOffice_ID || null;
      this.sessionOfficeId.set(officeId ? Number(officeId) : null);

      const cashFloat = data.cashFloat || data.details?.cashFloat || 0;
      this.sessionCashFloat.set(Number(cashFloat) || 0);

      if (cashierId) {
        this.loadCashierDetails(cashierId);
        this.loadReceiptData(cashierId);
      }
    } catch {
      this.sessionActive.set(false);
    } finally {
      this.sessionLoading.set(false);
    }
  }

  async loadCashierDetails(cashierId: number): Promise<void> {
    this.isLoadingDetails.set(true);
    try {
      const data: any = await firstValueFrom(
        this.api.get('/api/platinum/billing-payment-day-end/get-cashier-details', { id: String(cashierId) })
      );
      this.cashierDetails.set(data);
      if (data) {
        const office = data.cashOfficeName || data.cash_office || data.cashOffice || data.officeName || data.const_CashOffice?.cashOfficeDesc || '';
        if (office && !this.sessionOfficeName()) this.sessionOfficeName.set(office);
      }
    } catch (e) {
      console.error('Failed to load cashier details', e);
    } finally {
      this.isLoadingDetails.set(false);
    }
  }

  async loadReceiptData(cashierId: number): Promise<void> {
    this.isLoadingReceipts.set(true);
    const userId = String(this.user()?.user_ID || '');

    try {
      const [cheques, cards, dropBoxes, reconciles]: any[] = await Promise.all([
        firstValueFrom(this.api.post(`/api/platinum/billing-payment-day-end/get-cashier-receipt-cheque-list?id=${cashierId}`, {})).catch(() => []),
        firstValueFrom(this.api.post(`/api/platinum/billing-payment-day-end/get-cashier-receipt-card-list?id=${cashierId}`, {})).catch(() => []),
        firstValueFrom(this.api.post(`/api/platinum/billing-payment-day-end/get-cashier-receipt-drop-box-list?id=${cashierId}`, {})).catch(() => []),
        firstValueFrom(this.api.get('/api/platinum/billing-payment-day-end/get-cashier-receipt-reconcile-list', { userId, id: String(cashierId) })).catch(() => []),
      ]);

      const chequeItems = this.extractItems(cheques);
      const cardItems = this.extractItems(cards);
      const dropBoxItems = this.extractItems(dropBoxes);
      const reconcileItems = this.extractItems(reconciles);

      this.chequeList.set(chequeItems);
      this.cardList.set(cardItems);
      this.dropBoxList.set(dropBoxItems);
      this.reconcileList.set(reconcileItems);

      this.totalChequeAmt.set(chequeItems.reduce((s: number, r: any) => s + (Number(r.amount) || 0), 0));
      this.totalCreditAmt.set(cardItems.reduce((s: number, r: any) => s + (Number(r.amount) || 0), 0));
    } catch (e) {
      console.error('Failed to load receipt data', e);
    } finally {
      this.isLoadingReceipts.set(false);
    }
  }

  updateDenomination(key: string, count: number): void {
    this.denominations.update(prev => ({ ...prev, [key]: Math.max(0, count) }));
  }

  getDenominationCount(key: string): number {
    return this.denominations()[key] || 0;
  }

  getDenominationTotal(key: string, value: number): number {
    return (this.denominations()[key] || 0) * value;
  }

  requestSaveReconcile(): void {
    const cashierId = this.sessionCashierId();
    if (!cashierId) {
      this.toast.error('No active session found. Cannot submit reconciliation.');
      return;
    }
    if (!this.sessionActive()) {
      this.toast.error('Session is not active. Please start a session first.');
      return;
    }
    const finYear = this.user()?.finYear;
    if (!finYear) {
      this.toast.error('Financial year missing from your session. Please log in again.');
      return;
    }
    this.confirmDialogAction.set('submit');
    this.showConfirmDialog.set(true);
  }

  dismissConfirmDialog(): void {
    this.showConfirmDialog.set(false);
    this.confirmDialogAction.set(null);
  }

  confirmDialogAccepted(): void {
    if (this.isSaving() || this.isCancellingReceipt()) return;
    const action = this.confirmDialogAction();
    this.showConfirmDialog.set(false);
    this.confirmDialogAction.set(null);
    if (action === 'submit') {
      this.handleSaveReconcile();
    } else if (action === 'cancel') {
      this.handleRequestCancel();
    }
  }

  async handleSaveReconcile(): Promise<void> {
    if (this.isSaving()) return;
    const cashierId = this.sessionCashierId();
    if (!cashierId) { this.toast.error('No active session found.'); return; }
    const finYear = this.user()?.finYear;
    if (!finYear) { this.toast.error('Financial year missing. Please log in again.'); return; }

    this.isSaving.set(true);
    try {
      const userId = this.user()?.user_ID || '';
      const denoms = this.enableDenominationCounting() ? this.denominations() : {
        n200: 0, n100: 0, n50: 0, n20: 0, n10: 0,
        c1: 0, c5: 0, c10: 0, c20: 0, c50: 0,
        co1: 0, co2: 0, co5: 0,
      };
      const payload = {
        cashierId: Number(cashierId),
        reason: this.reason() || null,
        totalCashAmt: this.cashOnHand(),
        totalChequeAmt: this.totalChequeAmt(),
        totalCoins: this.enableDenominationCounting() ? this.totalCoins() : 0,
        totalCreditAmt: this.totalCreditAmt(),
        totalAmt: this.grandTotal(),
        n10: denoms['n10'] || 0,
        n20: denoms['n20'] || 0,
        n50: denoms['n50'] || 0,
        n100: denoms['n100'] || 0,
        n200: denoms['n200'] || 0,
        co1: denoms['co1'] || 0,
        co2: denoms['co2'] || 0,
        co5: denoms['co5'] || 0,
        c1: denoms['c1'] || 0,
        c5: denoms['c5'] || 0,
        c10: denoms['c10'] || 0,
        c20: denoms['c20'] || 0,
        c50: denoms['c50'] || 0,
        finyear: finYear,
      };

      console.log('[DayEnd] Step 1: save-reconcile-data payload:', JSON.stringify(payload));
      const result: any = await firstValueFrom(
        this.api.post(`/api/platinum/billing-payment-day-end/save-reconcile-data?userId=${userId}`, payload)
      );
      console.log('[DayEnd] Step 1 response:', JSON.stringify(result));

      if (result?.error || result?.isError === true || result?.success === false) {
        const errMsg = result?.error || result?.message || result?.errorMessage || 'API rejected the submission.';
        throw new Error(errMsg);
      }

      try {
        console.log('[DayEnd] Step 2: validate-cashbook for cashier', cashierId);
        await firstValueFrom(
          this.api.post('/api/platinum/auth-day-end/validate-cashbook', { cashierId: Number(cashierId) })
        );
        console.log('[DayEnd] validate-cashbook passed');
      } catch (valErr: any) {
        console.warn('[DayEnd] validate-cashbook warning (continuing):', valErr?.message);
        this.toast.warning('Cashbook validation had a warning — submission will continue.');
      }

      const cashierOfficeId = this.sessionOfficeId() || Number(
        this.cashierDetails()?.officeId ||
        this.cashierDetails()?.cashOffice_ID ||
        this.cashierDetails()?.const_CashOffice?.cashOffice_ID || 1
      );

      let cashBookId = 0;
      try {
        const cashbooks: any = await firstValueFrom(this.api.get('/api/platinum/auth-day-end/cashbook-list'));
        const books = Array.isArray(cashbooks) ? cashbooks : [];
        if (books.length > 0) {
          const match = books.find((b: any) => Number(b.cashOfficeId || b.cashOffice_ID) === Number(cashierOfficeId));
          cashBookId = match?.id || match?.cashBookId || match?.cashBook_ID || books[0]?.id || books[0]?.cashBookId || 1;
          console.log('[DayEnd] Resolved cashBookId from cashbook-list:', cashBookId);
        } else {
          cashBookId = 1;
        }
      } catch (cbErr: any) {
        console.error('[DayEnd] cashbook-list fetch failed:', cbErr?.message);
        cashBookId = 1;
      }

      try {
        console.log('[DayEnd] Step 3: submit-day-auth-reconcile for cashier', cashierId, 'cashBookId', cashBookId, 'officeId', cashierOfficeId);
        const submitResult: any = await firstValueFrom(
          this.api.post(`/api/platinum/auth-day-end/submit-day-auth-reconcile?cashierId=${cashierId}`, {
            cashierId: Number(cashierId),
            cashBookId: Number(cashBookId),
            cashierOfficeId: Number(cashierOfficeId),
          })
        );
        console.log('[DayEnd] submit-day-auth-reconcile response:', JSON.stringify(submitResult));

        if (submitResult?.isSuccess === false || submitResult?.error) {
          const errMsg = submitResult?.message || submitResult?.error || 'Failed to submit day-end for authorization.';
          console.error('[DayEnd] submit-day-auth-reconcile returned error:', errMsg);
          this.toast.error('Day-end data saved, but supervisor authorization may not have completed. Please check with your supervisor.');
          return;
        }
      } catch (subErr: any) {
        console.warn('[DayEnd] submit-day-auth-reconcile warning (continuing):', subErr?.message);
        this.toast.warning('Day-end data saved. Supervisor authorization step had a warning — please verify with your supervisor.');
      }

      this.toast.success('Day-end reconciliation submitted for supervisor approval.');
      setTimeout(() => this.router.navigate(['/']), 1500);
    } catch (e: any) {
      console.error('[DayEnd] API error:', e);
      this.toast.error(e?.message || 'Failed to save reconciliation data. Please check your connection and try again.');
    } finally {
      this.isSaving.set(false);
    }
  }

  async searchCancelReceipt(): Promise<void> {
    const query = this.cancelSearchQuery().trim();
    if (!query) return;

    this.cancelSearching.set(true);
    this.cancelFoundReceipt.set(null);
    this.cancelSearchError.set('');

    try {
      const data: any = await firstValueFrom(
        this.api.get('/api/platinum/view-receipt/search-receipt-numbers', { receiptNumbers: query })
      );

      const results = Array.isArray(data) ? data : (data?.result || data?.data || []);
      if (!Array.isArray(results) || results.length === 0) {
        this.cancelSearchError.set(`No receipt found for "${query}". Please check the number and try again.`);
        return;
      }

      const match = results.find((r: any) => {
        const rNo = String(r.receiptNo || r.receipt_no || r.receiptNumber || '');
        return rNo.includes(query) || query.includes(rNo);
      }) || results[0];

      this.cancelFoundReceipt.set(match);
    } catch (e: any) {
      this.cancelSearchError.set(e?.message || 'Failed to search for receipt. Please try again.');
    } finally {
      this.cancelSearching.set(false);
    }
  }

  clearCancelSearch(): void {
    this.cancelSearchQuery.set('');
    this.cancelFoundReceipt.set(null);
    this.cancelSearchError.set('');
    this.cancelReason.set('');
  }

  async handleRequestCancel(): Promise<void> {
    const receipt = this.cancelFoundReceipt();
    const reason = this.cancelReason();
    if (!receipt) {
      this.toast.error('Please search for a receipt first.');
      return;
    }
    const receiptId = receipt.receiptId || receipt.receiptID || receipt.receipt_ID || receipt.id;
    if (!receiptId) {
      this.toast.error('Could not determine receipt ID. Please try a different receipt.');
      return;
    }
    if (!reason.trim()) {
      this.toast.error('Please provide a reason for cancellation.');
      return;
    }

    this.isCancellingReceipt.set(true);
    try {
      const result: any = await firstValueFrom(
        this.api.post('/api/platinum/auth-day-end/request-cancel-receipt', {
          receiptId: Number(receiptId),
          reason: reason.trim(),
          cashierId: this.sessionCashierId(),
          userId: this.user()?.user_ID,
        })
      );

      if (result?.error || result?.isError === true || result?.success === false) {
        throw new Error(result?.error || result?.message || 'API rejected the cancellation request.');
      }

      this.toast.success('Cancellation request submitted. Awaiting supervisor approval.');
      this.clearCancelSearch();

      const cid = this.sessionCashierId();
      if (cid) this.loadReceiptData(cid);
    } catch (e: any) {
      this.toast.error(e?.message || 'Failed to submit cancellation request.');
    } finally {
      this.isCancellingReceipt.set(false);
    }
  }

  resetForm(): void {
    this.denominations.set({
      n200: 0, n100: 0, n50: 0, n20: 0, n10: 0,
      c1: 0, c5: 0, c10: 0, c20: 0, c50: 0,
      co1: 0, co2: 0, co5: 0,
    });
    this.totalCashAmt.set(0);
    this.reason.set('');
  }

  getReceiptLabel(item: any): string {
    const no = item.receiptNo || item.receipt_no || '';
    const acc = item.accountNumber || item.accountId || '';
    return no ? `${no} — ${acc}` : acc || `Receipt #${item.id || '?'}`;
  }

  getPayTypeLabel(item: any): string {
    if (item.paymentTypeId === 1) return 'Cash';
    if (item.paymentTypeId === 3) return 'Credit Card';
    if (item.paymentTypeId === 4) return 'Postal Order';
    return item.paymentType || item.payMode || '-';
  }

  formatDate(item: any): string {
    const dateVal = item.dateCaptured || item.receiptDate || item.date;
    if (!dateVal) return '-';
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return '-';
      return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    } catch {
      return '-';
    }
  }

  isCancelled(item: any): boolean {
    return item.isCancelled === 1 || item.isCancelled === true;
  }

  private extractItems(data: any): any[] {
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') {
      return data.items || data.value || data.results || data.data || data.rows || [];
    }
    return [];
  }

  formatCurrency(amount: number): string {
    return amount.toFixed(2);
  }

  exportingCardExcel = false;
  exportingCardPdf = false;

  private get exportMeta() {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return {
      date: `${dd}/${mm}/${yyyy}`,
      cashier: this.sessionCashierName() || this.user()?.userName || '—',
      office: this.sessionOfficeName() || '—',
      fileName: `credit-card-receipts-${dd}${mm}${yyyy}`,
    };
  }

  exportCardReceiptsExcel(): void {
    if (this.exportingCardExcel) return;
    this.exportingCardExcel = true;
    try {
      const items = this.cardList();
      const meta = this.exportMeta;
      const NAVY = '0F2B46';
      const GOLD = 'C9A84C';
      const WHITE = 'FFFFFF';
      const LIGHT = 'F8FAFC';
      const BORDER = { style: 'thin', color: { rgb: 'CBD5E1' } } as any;

      const headerStyle = (bg = NAVY, color = WHITE, bold = true): any => ({
        font: { bold, color: { rgb: color }, sz: 11 },
        fill: { patternType: 'solid', fgColor: { rgb: bg } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER },
      });
      const cellStyle = (bold = false, right = false, bg = WHITE): any => ({
        font: { sz: 10, bold, color: { rgb: '1E293B' } },
        fill: { patternType: 'solid', fgColor: { rgb: bg } },
        alignment: { horizontal: right ? 'right' : 'left', vertical: 'center' },
        border: { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER },
      });

      const rows: any[][] = [];
      // Title block
      rows.push([{ v: 'George Municipality — Credit Card Receipts', s: headerStyle(NAVY, GOLD) }, ...Array(7).fill({ v: '', s: headerStyle(NAVY, GOLD) })]);
      rows.push([{ v: `Report Date: ${meta.date}`, s: headerStyle('1E3A5F', WHITE, false) }, ...Array(7).fill({ v: '', s: headerStyle('1E3A5F', WHITE, false) })]);
      rows.push([{ v: `Cashier: ${meta.cashier}   |   Office: ${meta.office}`, s: headerStyle('1E3A5F', WHITE, false) }, ...Array(7).fill({ v: '', s: headerStyle('1E3A5F', WHITE, false) })]);
      rows.push([{ v: '', s: {} }, ...Array(7).fill({ v: '', s: {} })]);
      // Column headers
      const cols = ['No', 'Account / Invoice', 'Receipt No', 'Date', 'Cancelled', 'Card No', 'Expiry', 'Amount (R)'];
      rows.push(cols.map(c => ({ v: c, s: headerStyle(NAVY, WHITE) })));
      // Data
      items.forEach((item, i) => {
        const bg = i % 2 === 0 ? WHITE : LIGHT;
        rows.push([
          { v: i + 1, s: cellStyle(false, false, bg) },
          { v: item.accountNumber || item.accountId || item.invoiceNumber || '-', s: cellStyle(false, false, bg) },
          { v: item.receiptNo || item.receipt_no || '-', s: cellStyle(false, false, bg) },
          { v: this.formatDate(item), s: cellStyle(false, false, bg) },
          { v: this.isCancelled(item) ? 'Yes' : 'No', s: cellStyle(false, false, bg) },
          { v: item.cardNo || item.cardNumber || '-', s: cellStyle(false, false, bg) },
          { v: item.expiryDate || item.cardExpiryDate || '-', s: cellStyle(false, false, bg) },
          { v: (item.amount || 0).toFixed(2), s: { ...cellStyle(true, true, bg), font: { bold: true, sz: 10, color: { rgb: '1E293B' } } } },
        ]);
      });
      // Total row
      rows.push([
        { v: '', s: headerStyle(NAVY, WHITE, false) },
        { v: '', s: headerStyle(NAVY, WHITE, false) },
        { v: '', s: headerStyle(NAVY, WHITE, false) },
        { v: '', s: headerStyle(NAVY, WHITE, false) },
        { v: '', s: headerStyle(NAVY, WHITE, false) },
        { v: '', s: headerStyle(NAVY, WHITE, false) },
        { v: 'Total:', s: { ...headerStyle(NAVY, GOLD), alignment: { horizontal: 'right', vertical: 'center' } } },
        { v: `R ${this.totalCreditAmt().toFixed(2)}`, s: { ...headerStyle(NAVY, GOLD), alignment: { horizontal: 'right', vertical: 'center' } } },
      ]);

      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: 7 } },
        { s: { r: 3, c: 0 }, e: { r: 3, c: 7 } },
        { s: { r: rows.length - 1, c: 0 }, e: { r: rows.length - 1, c: 5 } },
      ];
      ws['!cols'] = [{ wch: 5 }, { wch: 22 }, { wch: 18 }, { wch: 18 }, { wch: 10 }, { wch: 16 }, { wch: 10 }, { wch: 14 }];
      ws['!rows'] = [{ hpt: 22 }, { hpt: 16 }, { hpt: 16 }, { hpt: 8 }, { hpt: 18 }];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Credit Card Receipts');
      XLSX.writeFile(wb, `${meta.fileName}.xlsx`);
      this.toast.show(`Excel exported — ${items.length} record${items.length !== 1 ? 's' : ''}.`, 'success');
    } catch (e: any) {
      this.toast.show('Failed to export Excel. Please try again.', 'error');
      console.error('[exportCardExcel]', e);
    } finally {
      this.exportingCardExcel = false;
    }
  }

  exportCardReceiptsPdf(): void {
    if (this.exportingCardPdf) return;
    this.exportingCardPdf = true;
    try {
      const items = this.cardList();
      const meta = this.exportMeta;
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const NAVY: [number, number, number] = [15, 43, 70];
      const GOLD: [number, number, number] = [201, 168, 76];
      const WHITE: [number, number, number] = [255, 255, 255];
      const W = doc.internal.pageSize.getWidth();

      // Header bar
      doc.setFillColor(...NAVY);
      doc.rect(0, 0, W, 22, 'F');
      doc.setFillColor(...GOLD);
      doc.rect(0, 22, W, 1.5, 'F');

      // Municipality name
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(...WHITE);
      doc.text('GEORGE MUNICIPALITY', 12, 10);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(200, 210, 220);
      doc.text('Municipal Point-of-Sale System', 12, 16);

      // Report title (right-aligned)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(...GOLD);
      doc.text('CREDIT CARD RECEIPTS REPORT', W - 12, 10, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(200, 210, 220);
      doc.text(`Generated: ${meta.date}`, W - 12, 16, { align: 'right' });

      // Meta info block
      const Y = 28;
      doc.setFillColor(248, 250, 252);
      doc.rect(12, Y, W - 24, 14, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.rect(12, Y, W - 24, 14, 'S');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...NAVY);
      const col1 = 16, col2 = W / 2;
      doc.text('Cashier:', col1, Y + 5);
      doc.text('Office:', col2, Y + 5);
      doc.text('Report Date:', col1, Y + 11);
      doc.text('Total Records:', col2, Y + 11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      doc.text(meta.cashier, col1 + 18, Y + 5);
      doc.text(meta.office, col2 + 14, Y + 5);
      doc.text(meta.date, col1 + 24, Y + 11);
      doc.text(String(items.length), col2 + 26, Y + 11);

      // Table
      autoTable(doc, {
        startY: Y + 18,
        head: [['No', 'Account / Invoice', 'Receipt No', 'Date', 'Cancelled', 'Card No', 'Expiry', 'Amount (R)']],
        body: items.length > 0
          ? items.map((item, i) => [
              i + 1,
              item.accountNumber || item.accountId || item.invoiceNumber || '-',
              item.receiptNo || item.receipt_no || '-',
              this.formatDate(item),
              this.isCancelled(item) ? 'Yes' : 'No',
              item.cardNo || item.cardNumber || '-',
              item.expiryDate || item.cardExpiryDate || '-',
              `R ${(item.amount || 0).toFixed(2)}`,
            ])
          : [['', 'No records to display', '', '', '', '', '', '']],
        foot: [['', '', '', '', '', '', 'TOTAL', `R ${this.totalCreditAmt().toFixed(2)}`]],
        showFoot: 'lastPage',
        headStyles: { fillColor: NAVY, textColor: WHITE, fontStyle: 'bold', fontSize: 8, cellPadding: 3 },
        footStyles: { fillColor: NAVY, textColor: GOLD, fontStyle: 'bold', fontSize: 9, halign: 'right' },
        bodyStyles: { fontSize: 8, cellPadding: 2.5, textColor: [30, 41, 59] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { halign: 'center', cellWidth: 10 },
          1: { cellWidth: 38 },
          2: { cellWidth: 32 },
          3: { cellWidth: 38 },
          4: { halign: 'center', cellWidth: 18 },
          5: { cellWidth: 28 },
          6: { cellWidth: 18 },
          7: { halign: 'right', fontStyle: 'bold', cellWidth: 24 },
        },
        margin: { left: 12, right: 12 },
        didDrawPage: (data: any) => {
          // Footer on each page
          const pageH = doc.internal.pageSize.getHeight();
          doc.setFillColor(...NAVY);
          doc.rect(0, pageH - 10, W, 10, 'F');
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
          doc.setTextColor(...WHITE);
          doc.text('George Municipality — Confidential', 12, pageH - 4);
          doc.text(`Page ${data.pageNumber}`, W - 12, pageH - 4, { align: 'right' });
        },
      });

      doc.save(`${meta.fileName}.pdf`);
      this.toast.show(`PDF exported — ${items.length} record${items.length !== 1 ? 's' : ''}.`, 'success');
    } catch (e: any) {
      this.toast.show('Failed to export PDF. Please try again.', 'error');
      console.error('[exportCardPdf]', e);
    } finally {
      this.exportingCardPdf = false;
    }
  }
}
