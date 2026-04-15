import { Component, EventEmitter, Input, Output, inject, ChangeDetectorRef, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ApiService } from '../../core/services/api.service';
import { GlBreakdownEntry } from '../../core/models/interfaces';

interface BreadcrumbItem {
  level: 'line-item' | 'account' | 'transaction' | 'document';
  label: string;
  data?: any;
}

interface GlTransaction {
  id: string;
  postingDate: string;
  documentNumber: string;
  documentType: string;
  transactionDescription: string;
  amount: number;
  glDebit: number;
  glCredit: number;
  glBalance: number;
  voteNumber: string;
  voteDescription: string;
  capturedBy: string;
  referenceNumber: string;
  scoaItemCode: string;
  scoaItemShortDesc: string;
  processingMonth: number;
  itemType: string;
}

interface SourceDocument {
  documentNumber: string;
  finYear: string;
  lineItemCount: number;
  totalDebit: number;
  totalCredit: number;
  netAmount: number;
  transactionType?: string;
  postingDate?: string;
  capturedBy?: string;
  lineItems: SourceDocLineItem[];
}

interface SourceDocLineItem {
  genLedgerId: number;
  documentNumber: string;
  postingDate: string;
  transactionType: string;
  transactionDetails: string;
  debit: number;
  credit: number;
  balance: number;
  voteNumber: string;
  voteDescription: string;
  scoaItemCode: string;
  scoaItemDescription: string;
  scoaFunctionDescription: string;
  capturedBy: string;
  itemType: string;
}

@Component({
  selector: 'app-drill-through-panel',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule, MatProgressSpinnerModule, MatSelectModule, MatFormFieldModule],
  templateUrl: './drill-through-panel.component.html',
  styleUrl: './drill-through-panel.component.css'
})
export class DrillThroughPanelComponent implements OnChanges {
  @Input() open = false;
  @Input() glEntries: GlBreakdownEntry[] = [];
  @Input() lineItemLabel = '';
  @Input() priorYearLabel = 'Prior Year';
  @Input() financialYearId = '';
  @Input() compilationId = '';
  @Input() periodFrom = '';
  @Input() periodTo = '';
  @Output() closed = new EventEmitter<void>();

  private api = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);

  currentLevel: 'line-item' | 'account' | 'transaction' | 'document' = 'line-item';
  breadcrumbs: BreadcrumbItem[] = [];

  selectedAccount: GlBreakdownEntry | null = null;
  transactions: GlTransaction[] = [];
  transactionsLoading = false;
  transactionsError = '';
  transactionsTotal = 0;
  transactionsPage = 1;
  transactionsTotalPages = 1;
  periodFilter: number | null = null;
  readonly months = [
    { value: null, label: 'All Periods' },
    { value: 1, label: 'Jul (P1)' }, { value: 2, label: 'Aug (P2)' },
    { value: 3, label: 'Sep (P3)' }, { value: 4, label: 'Oct (P4)' },
    { value: 5, label: 'Nov (P5)' }, { value: 6, label: 'Dec (P6)' },
    { value: 7, label: 'Jan (P7)' }, { value: 8, label: 'Feb (P8)' },
    { value: 9, label: 'Mar (P9)' }, { value: 10, label: 'Apr (P10)' },
    { value: 11, label: 'May (P11)' }, { value: 12, label: 'Jun (P12)' },
  ];

  selectedTransaction: GlTransaction | null = null;

  selectedDocNumber = '';
  sourceDocument: SourceDocument | null = null;
  relatedDocs: any[] = [];
  evidenceAttachments: any[] = [];
  documentLoading = false;
  documentError = '';

  get totalAmount(): number {
    return this.glEntries.reduce((sum, e) => sum + (e.amount || 0), 0);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['open'] && changes['open'].currentValue === true) {
      this.resetState();
    }
  }

  private resetState() {
    this.currentLevel = 'line-item';
    const truncLabel = this.lineItemLabel.length > 30 ? this.lineItemLabel.substring(0, 30) + '...' : this.lineItemLabel;
    this.breadcrumbs = [{ level: 'line-item', label: truncLabel || 'Line Item' }];
    this.selectedAccount = null;
    this.transactions = [];
    this.transactionsLoading = false;
    this.transactionsError = '';
    this.transactionsTotal = 0;
    this.transactionsPage = 1;
    this.transactionsTotalPages = 1;
    this.periodFilter = null;
    this.selectedTransaction = null;
    this.selectedDocNumber = '';
    this.sourceDocument = null;
    this.relatedDocs = [];
    this.evidenceAttachments = [];
    this.documentLoading = false;
    this.documentError = '';
  }

  close() {
    this.open = false;
    this.closed.emit();
  }

  onOverlayClick(event: Event) {
    if ((event.target as HTMLElement).classList.contains('dt-overlay')) {
      this.close();
    }
  }

  navigateTo(index: number) {
    if (index >= this.breadcrumbs.length - 1) return;
    const crumb = this.breadcrumbs[index];
    this.breadcrumbs = this.breadcrumbs.slice(0, index + 1);
    this.currentLevel = crumb.level;
    this.cdr.markForCheck();
  }

  drillToTransactions(entry: GlBreakdownEntry) {
    this.selectedAccount = entry;
    this.currentLevel = 'account';
    this.transactionsPage = 1;
    this.breadcrumbs.push({
      level: 'account',
      label: (entry.accountName || entry.accountCode || '').substring(0, 25),
      data: entry,
    });
    this.loadTransactions();
  }

  loadTransactions() {
    if (!this.selectedAccount || !this.financialYearId) {
      this.transactions = [];
      this.transactionsTotal = 0;
      this.transactionsTotalPages = 1;
      return;
    }
    this.transactionsLoading = true;
    this.transactionsError = '';
    this.cdr.markForCheck();

    const code = this.selectedAccount.mscoaSegments?.['item']
      || this.selectedAccount.accountCode;
    let qs = `scoaItemCode=${encodeURIComponent(code)}&page=${this.transactionsPage}&limit=50`;
    if (this.periodFilter != null) {
      qs += `&processingMonth=${this.periodFilter}`;
    }
    if (this.periodFrom) {
      qs += `&periodFrom=${encodeURIComponent(this.periodFrom)}`;
    }
    if (this.periodTo) {
      qs += `&periodTo=${encodeURIComponent(this.periodTo)}`;
    }

    this.api.get<any>(`/reports/gl-drillthrough/${this.financialYearId}?${qs}`).subscribe({
      next: (res) => {
        this.transactions = res.entries || [];
        this.transactionsTotal = res.total || 0;
        this.transactionsTotalPages = res.totalPages || 1;
        this.transactionsLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.transactions = [];
        this.transactionsLoading = false;
        this.transactionsError = err.status === 0
          ? 'Unable to reach the server. Check your connection.'
          : 'Failed to load transactions. Please try again.';
        this.cdr.markForCheck();
      },
    });
  }

  onPeriodChange(month: number | null) {
    this.periodFilter = month;
    this.transactionsPage = 1;
    this.loadTransactions();
  }

  txPageChange(delta: number) {
    this.transactionsPage += delta;
    this.loadTransactions();
  }

  drillToDocument(tx: GlTransaction) {
    if (!tx.documentNumber) return;
    this.selectedTransaction = tx;
    this.currentLevel = 'transaction';
    this.breadcrumbs.push({
      level: 'transaction',
      label: 'Tx: ' + (tx.transactionDescription || tx.documentNumber || '').substring(0, 18),
      data: tx,
    });
    this.cdr.markForCheck();
  }

  drillToSourceDocument(tx: GlTransaction) {
    if (!tx.documentNumber) return;
    this.selectedDocNumber = tx.documentNumber;
    this.currentLevel = 'document';
    this.breadcrumbs.push({
      level: 'document',
      label: tx.documentNumber.substring(0, 20),
      data: tx,
    });
    this.loadSourceDocument(tx.documentNumber);
  }

  drillToRelatedDoc(docNumber: string) {
    this.selectedDocNumber = docNumber;
    const docIdx = this.breadcrumbs.findIndex(b => b.level === 'document');
    if (docIdx >= 0) {
      this.breadcrumbs = this.breadcrumbs.slice(0, docIdx);
    }
    this.breadcrumbs.push({
      level: 'document',
      label: docNumber.substring(0, 20),
    });
    this.loadSourceDocument(docNumber);
  }

  loadSourceDocument(documentNumber: string) {
    this.documentLoading = true;
    this.documentError = '';
    this.sourceDocument = null;
    this.relatedDocs = [];
    this.evidenceAttachments = [];
    this.cdr.markForCheck();

    this.api.get<any>(`/platinum/documents/${encodeURIComponent(documentNumber)}`).subscribe({
      next: (doc) => {
        this.sourceDocument = doc;
        this.documentLoading = false;
        this.cdr.markForCheck();
        this.loadRelatedDocs(documentNumber);
        this.loadEvidenceAttachments(documentNumber);
      },
      error: (err) => {
        this.documentError = err.status === 404
          ? 'Source document not found in the EMS database. The document may not have been synced yet.'
          : 'Failed to load source document. The EMS connection may be unavailable.';
        this.documentLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  private loadRelatedDocs(documentNumber: string) {
    this.api.get<any>(`/platinum/documents/${encodeURIComponent(documentNumber)}/related`).subscribe({
      next: (res) => {
        this.relatedDocs = res?.relatedDocuments || [];
        this.cdr.markForCheck();
      },
      error: () => {
        this.relatedDocs = [];
      },
    });
  }

  private loadEvidenceAttachments(documentNumber: string) {
    if (!this.compilationId) {
      this.evidenceAttachments = [];
      return;
    }
    this.api.get<any[]>(`/evidence?compilationId=${encodeURIComponent(this.compilationId)}`).subscribe({
      next: (res) => {
        const docs = (res || []).filter((e: any) =>
          e.originalName?.includes(documentNumber) ||
          e.description?.includes(documentNumber) ||
          e.tags?.includes(documentNumber) ||
          e.externalRef === documentNumber
        );
        this.evidenceAttachments = docs;
        this.cdr.markForCheck();
      },
      error: () => {
        this.evidenceAttachments = [];
      },
    });
  }

  formatFileSize(bytes: number): string {
    if (!bytes || bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0) + ' ' + units[i];
  }

  getDocTypeMeta(doc: any): { label: string; value: string }[] {
    const meta: { label: string; value: string }[] = [];
    const fieldMap: [string, string][] = [
      ['vendor', 'Vendor'],
      ['vendorName', 'Vendor Name'],
      ['supplierName', 'Supplier Name'],
      ['invoiceNumber', 'Invoice Number'],
      ['invoiceDate', 'Invoice Date'],
      ['paymentReference', 'Payment Reference'],
      ['paymentMethod', 'Payment Method'],
      ['chequeNumber', 'Cheque Number'],
      ['receiptNumber', 'Receipt Number'],
      ['preparedBy', 'Prepared By'],
      ['approvedBy', 'Approved By'],
      ['authorisedBy', 'Authorised By'],
      ['journalDescription', 'Journal Description'],
      ['journalType', 'Journal Type'],
      ['referenceNumber', 'Reference Number'],
      ['orderNumber', 'Order Number'],
      ['batchNumber', 'Batch Number'],
    ];
    for (const [key, label] of fieldMap) {
      if (doc[key] != null && doc[key] !== '') {
        meta.push({ label, value: String(doc[key]) });
      }
    }
    return meta;
  }

  getDocTypeLabel(transactionType: string): string {
    const map: Record<string, string> = {
      'JNL': 'Journal Entry',
      'INV': 'Invoice',
      'PMT': 'Payment',
      'RCT': 'Receipt',
      'CRN': 'Credit Note',
      'DBN': 'Debit Note',
      'ADJ': 'Adjustment',
      'REV': 'Reversal',
      'BUD': 'Budget Entry',
      'GRN': 'Goods Received',
      'PO': 'Purchase Order',
      'REQ': 'Requisition',
      'SAL': 'Salary',
      'DEP': 'Depreciation',
    };
    return map[transactionType?.toUpperCase()] || '';
  }

  formatAmount(value: number | undefined): string {
    if (value == null) return '—';
    const abs = Math.abs(value / 1000);
    const formatted = abs.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    return value < 0 ? `(R ${formatted})` : `R ${formatted}`;
  }

  formatCurrency(n: number): string {
    if (n == null) return '—';
    const abs = Math.abs(n);
    const formatted = abs.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return n < 0 ? `(R ${formatted})` : `R ${formatted}`;
  }
}
