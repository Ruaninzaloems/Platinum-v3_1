import { Component, OnInit, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { ApiService } from '../../../../core/api.service';
import { QuillModule } from 'ngx-quill';

const TRANSACTION_TYPES = [
  'Depreciation',
  'Impairment',
  'Impairment Reversal',
  'Revaluation',
  'Disposal',
  'Refurbishment',
  'Prior Year Adjustment',
  'Prior Period Adjustment',
  'Transfer',
  'Unbundling',
];

const UNIVERSAL_TOKENS: Array<{token: string; description: string}> = [
  { token: '{AssetId}',          description: 'Asset register item ID' },
  { token: '{AssetDescription}', description: 'Asset description from the register' },
  { token: '{AssetClass}',       description: 'Asset class description' },
  { token: '{AssetType}',        description: 'Asset type description' },
  { token: '{Category}',         description: 'Asset category description' },
  { token: '{ApprovalDate}',     description: 'Date of approval (dd MMM yyyy)' },
  { token: '{Timestamp}',        description: 'Approval date and time (dd MMM yyyy HH:mm)' },
  { token: '{SystemName}',       description: 'System name — "Platinum Asset Management System"' },
  { token: '{Municipality}',     description: 'Municipality name — "Mnquma Local Municipality"' },
];

const TRANSACTION_TOKENS: Record<string, Array<{token: string; description: string}>> = {
  'Depreciation': [
    { token: '{FinancialYear}',     description: 'Financial year of the depreciation run' },
    { token: '{TotalDepreciation}', description: 'Total depreciation amount for the batch' },
    { token: '{ProcessedAssets}',   description: 'Number of assets processed in the batch' },
  ],
  'Impairment': [
    { token: '{TransactionDate}',          description: 'Date of the impairment transaction' },
    { token: '{ImpairmentType}',           description: 'Type label — "Impairment" or "Impairment Reversal"' },
    { token: '{AdjustedCarryingAmount}',   description: 'New carrying amount after the impairment' },
    { token: '{RecoverableServiceAmount}', description: 'Recoverable service amount used to calculate the impairment' },
    { token: '{ValueInUse}',               description: 'Value in use estimate (if applicable)' },
    { token: '{ImpairmentLoss}',           description: 'Impairment loss amount (GRAP 21/26)' },
    { token: '{RevaluationReserve}',       description: 'Revaluation reserve adjustment debited on impairment' },
    { token: '{Reason}',                   description: 'Reason / indicators of impairment' },
  ],
  'Impairment Reversal': [
    { token: '{TransactionDate}',          description: 'Date of the reversal transaction' },
    { token: '{ImpairmentType}',           description: 'Label — "Impairment Reversal"' },
    { token: '{AdjustedCarryingAmount}',   description: 'Carrying amount restored after reversal' },
    { token: '{RecoverableServiceAmount}', description: 'Carrying amount after reversal' },
    { token: '{ValueInUse}',               description: 'Value in use estimate (if applicable)' },
    { token: '{ImpairmentLoss}',           description: 'Reversal amount' },
    { token: '{RevaluationReserve}',       description: 'Revaluation reserve credit on reversal' },
    { token: '{Reason}',                   description: 'Reason for reversal' },
  ],
  'Revaluation': [
    { token: '{RevaluationDate}',          description: 'Date of the revaluation' },
    { token: '{LastDepreciationDate}',     description: 'Date of the last depreciation run before revaluation' },
    { token: '{CostRevaluedAmount}',       description: 'Gross replacement cost / revalued cost amount' },
    { token: '{AccumulatedDepreciation}',  description: 'Accumulated depreciation closing balance after revaluation' },
    { token: '{CarryingAmountAtLastDep}',  description: 'Carrying amount at the date of last depreciation' },
    { token: '{RevaluationReserveBalance}',description: 'Revaluation reserve balance before revaluation' },
    { token: '{AdjustedCarryingAmount}',   description: 'Carrying amount after revaluation' },
    { token: '{MarketValue}',              description: 'Fair market value used for the revaluation' },
    { token: '{ValuationModule}',          description: 'Valuation model / module identifier' },
    { token: '{AccumDepAdjustment}',       description: 'Accumulated depreciation eliminated on revaluation' },
    { token: '{FairValueAdjustment}',      description: 'Difference between fair value and carrying amount' },
    { token: '{RevaluationReserveAfter}',  description: 'Revaluation reserve balance after revaluation' },
  ],
  'Disposal': [
    { token: '{DisposalDate}',           description: 'Date of disposal' },
    { token: '{DisposalMethod}',         description: 'Disposal method (e.g. Sale, Write-off, Donation)' },
    { token: '{AdjustedCarryingAmount}', description: 'Carrying amount at the disposal date' },
    { token: '{DisposalProceeds}',       description: 'Net sale proceeds received' },
    { token: '{ProfitLoss}',             description: 'Profit or loss on disposal (negative = loss)' },
    { token: '{DisposalReason}',         description: 'Reason recorded for the disposal' },
  ],
  'Refurbishment': [
    { token: '{RefurbishmentDate}',      description: 'Date of refurbishment' },
    { token: '{DebitProject}',           description: 'Debit GL plan project item ID' },
    { token: '{DebitScoaItem}',          description: 'Debit mSCOA item identifier' },
    { token: '{CreditProject}',          description: 'Credit GL plan project item ID' },
    { token: '{CreditScoaItem}',         description: 'Credit mSCOA item identifier' },
    { token: '{RefurbishmentDebit}',     description: 'Refurbishment debit amount (cost addition)' },
    { token: '{RefurbishmentCredit}',    description: 'Refurbishment credit amount' },
    { token: '{DepreciationAdjustment}', description: 'Accumulated depreciation eliminated on refurbishment' },
    { token: '{RevaluationAdjustment}',  description: 'Revaluation reserve adjusted on refurbishment' },
    { token: '{ImpairmentAdjustment}',   description: 'Accumulated impairment eliminated on refurbishment' },
  ],
  'Transfer': [
    { token: '{FromLocation}', description: 'Source location of the transferred asset' },
    { token: '{ToLocation}',   description: 'Destination location of the transferred asset' },
  ],
  'Unbundling': [
    { token: '{WipReference}', description: 'WIP Register reference ID' },
    { token: '{Comment}',      description: 'Unbundling comment recorded at approval' },
  ],
  'Prior Period Adjustment': [
    { token: '{AdjustmentAmount}', description: 'Adjustment amount' },
  ],
  'Prior Year Adjustment': [
    { token: '{AdjustmentAmount}', description: 'Adjustment amount' },
  ],
};

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function formatDate(d: Date): string {
  var dd = String(d.getDate()).padStart(2, '0');
  var mmm = MONTHS_SHORT[d.getMonth()];
  var yyyy = d.getFullYear();
  return dd + ' ' + mmm + ' ' + yyyy;
}

function formatTimestamp(d: Date): string {
  var hh = String(d.getHours()).padStart(2, '0');
  var min = String(d.getMinutes()).padStart(2, '0');
  return formatDate(d) + ' ' + hh + ':' + min;
}

function buildSampleValues(): Record<string, string> {
  var today = new Date();
  var prevMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
  var yyyy = today.getFullYear();
  var fy = today.getMonth() >= 6 ? (yyyy + '/' + (yyyy + 1)) : ((yyyy - 1) + '/' + yyyy);

  var raw: Record<string, string> = {
    '{AssetId}':                   '12345',
    '{AssetDescription}':          'Toyota Hilux Double Cab (4x4)',
    '{AssetClass}':                'Transport Assets',
    '{AssetType}':                 'Motor Vehicles',
    '{Category}':                  'Movable Assets',
    '{ApprovalDate}':              formatDate(today),
    '{Timestamp}':                 formatTimestamp(today),
    '{SystemName}':                'Platinum Asset Management System',
    '{Municipality}':              'Mnquma Local Municipality',
    '{FinancialYear}':             fy,
    '{TotalDepreciation}':         'R 1 245 600.00',
    '{ProcessedAssets}':           '348',
    '{TransactionDate}':           formatDate(today),
    '{ImpairmentType}':            'Impairment',
    '{AdjustedCarryingAmount}':    'R 320 000.00',
    '{RecoverableServiceAmount}':  'R 280 000.00',
    '{ValueInUse}':                'R 265 000.00',
    '{ImpairmentLoss}':            'R 40 000.00',
    '{RevaluationReserve}':        'R 15 000.00',
    '{Reason}':                    'Physical damage observed during verification',
    '{RevaluationDate}':           formatDate(today),
    '{LastDepreciationDate}':      formatDate(prevMonth),
    '{CostRevaluedAmount}':        'R 950 000.00',
    '{AccumulatedDepreciation}':   'R 285 000.00',
    '{CarryingAmountAtLastDep}':   'R 665 000.00',
    '{RevaluationReserveBalance}': 'R 120 000.00',
    '{MarketValue}':               'R 900 000.00',
    '{ValuationModule}':           'Income Approach',
    '{AccumDepAdjustment}':        'R 285 000.00',
    '{FairValueAdjustment}':       'R 235 000.00',
    '{RevaluationReserveAfter}':   'R 355 000.00',
    '{DisposalDate}':              formatDate(today),
    '{DisposalMethod}':            'Sale',
    '{DisposalProceeds}':          'R 180 000.00',
    '{ProfitLoss}':                'R -5 000.00',
    '{DisposalReason}':            'End of useful life — sold via public tender',
    '{RefurbishmentDate}':         formatDate(today),
    '{DebitProject}':              'PRJ-' + yyyy + '-014',
    '{DebitScoaItem}':             'A.1.2.3',
    '{CreditProject}':             'PRJ-' + yyyy + '-001',
    '{CreditScoaItem}':            'A.3.1.1',
    '{RefurbishmentDebit}':        'R 85 000.00',
    '{RefurbishmentCredit}':       'R 85 000.00',
    '{DepreciationAdjustment}':    'R 22 000.00',
    '{RevaluationAdjustment}':     'R 10 000.00',
    '{ImpairmentAdjustment}':      'R 5 000.00',
    '{FromLocation}':              'Butterworth Depot',
    '{ToLocation}':                'Centane Sub-office',
    '{WipReference}':              'WIP-' + yyyy + '-0042',
    '{Comment}':                   'Unbundled into road and stormwater components',
    '{AdjustmentAmount}':          'R 12 500.00',
  };

  var allDefs: Array<{token: string; description: string}> = [];
  for (var i = 0; i < UNIVERSAL_TOKENS.length; i++) allDefs.push(UNIVERSAL_TOKENS[i]);
  var txKeys = Object.keys(TRANSACTION_TOKENS);
  for (var j = 0; j < txKeys.length; j++) {
    var toks = TRANSACTION_TOKENS[txKeys[j]];
    for (var k = 0; k < toks.length; k++) allDefs.push(toks[k]);
  }

  var result: Record<string, string> = {};
  for (var m = 0; m < allDefs.length; m++) {
    var tok = allDefs[m].token;
    if (raw[tok] !== undefined) result[tok] = raw[tok];
  }
  return result;
}

interface EmailTemplate {
  id?: number;
  TransactionType: string;
  TemplateTitle: string;
  RecipientEmails: string;
  MessageContent: string;
  IsActive: number;
}

interface EmailLogEntry {
  id: number;
  TemplateID: number;
  TransactionType: string;
  Recipients: string;
  Subject: string;
  Status: string;
  ErrorMessage: string;
  SentAt: string;
}

@Component({
  selector: 'app-email-templates',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatButtonModule, MatIconModule,
    MatTooltipModule, MatSnackBarModule,
    MatPaginatorModule,
    QuillModule,
  ],
  templateUrl: './email-templates.component.html',
  styleUrl: './email-templates.component.css',
})
export class EmailTemplatesComponent implements OnInit {
  transactionTypes = TRANSACTION_TYPES;

  activeTab = signal<'templates' | 'log' | 'tokens'>('templates');

  templates = signal<EmailTemplate[]>([]);
  loading = signal(false);
  saving = signal(false);

  showForm = signal(false);
  editingId = signal<number | null>(null);

  form: EmailTemplate = this.emptyForm();

  logEntries = signal<EmailLogEntry[]>([]);
  logLoading = signal(false);
  logTotalCount = signal(0);
  logPage = signal(0);
  logPageSize = signal(50);
  logFilterStatus = '';
  logFilterType = '';

  expandedLogId = signal<number | null>(null);

  logSummary = signal<{ totalSent: number; totalFailed: number; last30DaysSent: number; last30DaysFailed: number } | null>(null);
  logSummaryLoading = signal(false);

  selectedTokenType = signal<string>('Depreciation');

  showPreview = signal(false);

  lastFocusedEl: HTMLInputElement | HTMLTextAreaElement | null = null;
  lastFocusedFieldName: 'TemplateTitle' | 'MessageContent' | null = null;

  quillInstance: any = null;

  quillModules: any = null;

  tableContextMenu = signal<{ visible: boolean; x: number; y: number }>({ visible: false, x: 0, y: 0 });
  private contextMenuCell: HTMLTableCellElement | null = null;
  private contextMenuRow: HTMLTableRowElement | null = null;
  private contextMenuTable: HTMLTableElement | null = null;

  constructor(private api: ApiService, private snack: MatSnackBar) {}

  @HostListener('document:click')
  onDocumentClick() {
    if (this.tableContextMenu().visible) {
      this.tableContextMenu.set({ visible: false, x: 0, y: 0 });
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey() {
    if (this.tableContextMenu().visible) {
      this.tableContextMenu.set({ visible: false, x: 0, y: 0 });
    }
  }

  ngOnInit() {
    this.quillModules = {
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline'],
          [{ color: [] }, { background: [] }],
          [{ list: 'ordered' }, { list: 'bullet' }],
          [{ align: [] }],
          ['link', 'image'],
          ['table'],
          ['clean'],
        ],
        handlers: {
          table: () => this.insertTable(),
        },
      },
    };
    this.loadTemplates();
    this.loadEmailLog();
  }

  emptyForm(): EmailTemplate {
    return { TransactionType: '', TemplateTitle: '', RecipientEmails: '', MessageContent: '', IsActive: 1 };
  }

  loadTemplates() {
    this.loading.set(true);
    this.api.getEmailTemplates().subscribe({
      next: (data) => { this.templates.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  loadEmailLog() {
    this.logLoading.set(true);
    this.api.getEmailLog({
      status: this.logFilterStatus || undefined,
      transactionType: this.logFilterType || undefined,
      page: this.logPage() + 1,
      pageSize: this.logPageSize(),
    }).subscribe({
      next: (res) => {
        this.logEntries.set(res.data ?? []);
        this.logTotalCount.set(res.totalCount ?? 0);
        this.logLoading.set(false);
        this.loadEmailLogSummary();
      },
      error: () => {
        this.logLoading.set(false);
        this.snack.open('Failed to load email log.', 'Close', { duration: 4000 });
      },
    });
  }

  loadEmailLogSummary() {
    this.logSummaryLoading.set(true);
    this.api.getEmailLogSummary({
      status: this.logFilterStatus || undefined,
      transactionType: this.logFilterType || undefined,
    }).subscribe({
      next: (data) => { this.logSummary.set(data); this.logSummaryLoading.set(false); },
      error: () => this.logSummaryLoading.set(false),
    });
  }

  getFailureRate(summary: { last30DaysSent: number; last30DaysFailed: number }): string {
    var total = summary.last30DaysSent + summary.last30DaysFailed;
    if (total === 0) return '0%';
    var rate = (summary.last30DaysFailed / total) * 100;
    if (rate < 1 && rate > 0) return '<1%';
    return Math.round(rate) + '%';
  }

  onLogPageChange(event: PageEvent) {
    this.logPage.set(event.pageIndex);
    this.logPageSize.set(event.pageSize);
    this.loadEmailLog();
  }

  applyLogFilter() {
    this.logPage.set(0);
    this.loadEmailLog();
  }

  clearLogFilter() {
    this.logFilterStatus = '';
    this.logFilterType = '';
    this.logPage.set(0);
    this.loadEmailLog();
  }

  toggleLogExpand(id: number) {
    this.expandedLogId.set(this.expandedLogId() === id ? null : id);
  }

  getStatusClass(status: string): string {
    if (status === 'Success') return 'status-badge active';
    if (status === 'Failed') return 'status-badge failed';
    return 'status-badge';
  }

  formatDate(val: string): string {
    if (!val) return '-';
    var d = new Date(val);
    if (isNaN(d.getTime())) return val;
    return d.toLocaleString('en-ZA', {
      year: 'numeric', month: 'short', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  }

  hasError(entry: EmailLogEntry): boolean {
    return !!(entry.ErrorMessage && entry.ErrorMessage.trim().length > 0);
  }

  openCreate() {
    this.form = this.emptyForm();
    this.editingId.set(null);
    this.showForm.set(true);
  }

  openEdit(t: EmailTemplate) {
    this.form = { ...t };
    this.editingId.set(t.id ?? null);
    this.showForm.set(true);
    this.lastFocusedEl = null;
    this.lastFocusedFieldName = null;
  }

  cancelForm() {
    this.showForm.set(false);
    this.editingId.set(null);
    this.form = this.emptyForm();
    this.lastFocusedEl = null;
    this.lastFocusedFieldName = null;
    this.showPreview.set(false);
  }

  onFieldFocus(event: FocusEvent, fieldName: 'TemplateTitle' | 'MessageContent') {
    this.lastFocusedEl = event.target as HTMLInputElement | HTMLTextAreaElement;
    this.lastFocusedFieldName = fieldName;
  }

  onEditorCreated(quill: any) {
    this.quillInstance = quill;
    const editorEl = quill.root as HTMLElement;
    editorEl.addEventListener('contextmenu', (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const cell = target.closest('td, th') as HTMLTableCellElement | null;
      if (cell) {
        e.preventDefault();
        e.stopPropagation();
        this.contextMenuCell = cell;
        this.contextMenuRow = cell.parentElement as HTMLTableRowElement;
        this.contextMenuTable = this.contextMenuRow.closest('table') as HTMLTableElement;
        this.tableContextMenu.set({ visible: true, x: e.clientX, y: e.clientY });
      }
    });
  }

  closeTableContextMenu(e: MouseEvent) {
    e.stopPropagation();
    this.tableContextMenu.set({ visible: false, x: 0, y: 0 });
  }

  ctxInsertRowAbove() {
    if (!this.contextMenuRow) return;
    const newRow = this.buildEmptyRow(this.contextMenuRow.cells.length);
    this.contextMenuRow.parentElement!.insertBefore(newRow, this.contextMenuRow);
    this.syncAfterTableEdit();
    this.tableContextMenu.set({ visible: false, x: 0, y: 0 });
  }

  ctxInsertRowBelow() {
    if (!this.contextMenuRow) return;
    const newRow = this.buildEmptyRow(this.contextMenuRow.cells.length);
    this.contextMenuRow.parentElement!.insertBefore(newRow, this.contextMenuRow.nextSibling);
    this.syncAfterTableEdit();
    this.tableContextMenu.set({ visible: false, x: 0, y: 0 });
  }

  ctxDeleteRow() {
    if (!this.contextMenuRow || !this.contextMenuTable) return;
    if (this.contextMenuTable.rows.length <= 1) {
      this.snack.open('Cannot delete the only row.', 'Close', { duration: 2000 });
      this.tableContextMenu.set({ visible: false, x: 0, y: 0 });
      return;
    }
    this.contextMenuRow.parentElement!.removeChild(this.contextMenuRow);
    this.syncAfterTableEdit();
    this.tableContextMenu.set({ visible: false, x: 0, y: 0 });
  }

  ctxInsertColLeft() {
    if (!this.contextMenuCell || !this.contextMenuTable) return;
    this.insertColumnAt(this.contextMenuCell.cellIndex);
    this.syncAfterTableEdit();
    this.tableContextMenu.set({ visible: false, x: 0, y: 0 });
  }

  ctxInsertColRight() {
    if (!this.contextMenuCell || !this.contextMenuTable) return;
    this.insertColumnAt(this.contextMenuCell.cellIndex + 1);
    this.syncAfterTableEdit();
    this.tableContextMenu.set({ visible: false, x: 0, y: 0 });
  }

  ctxDeleteCol() {
    if (!this.contextMenuCell || !this.contextMenuTable) return;
    const rows = this.contextMenuTable.rows;
    if (rows.length > 0 && rows[0].cells.length <= 1) {
      this.snack.open('Cannot delete the only column.', 'Close', { duration: 2000 });
      this.tableContextMenu.set({ visible: false, x: 0, y: 0 });
      return;
    }
    const colIndex = this.contextMenuCell.cellIndex;
    for (var i = 0; i < rows.length; i++) {
      if (rows[i].cells[colIndex]) {
        rows[i].deleteCell(colIndex);
      }
    }
    this.syncAfterTableEdit();
    this.tableContextMenu.set({ visible: false, x: 0, y: 0 });
  }

  private insertColumnAt(atIndex: number) {
    if (!this.contextMenuTable) return;
    const rows = this.contextMenuTable.rows;
    for (var i = 0; i < rows.length; i++) {
      const isHeaderRow = i === 0 && rows[i].cells[0]?.tagName === 'TH';
      const newCell = document.createElement(isHeaderRow ? 'th' : 'td');
      newCell.innerHTML = '&nbsp;';
      if (atIndex >= rows[i].cells.length) {
        rows[i].appendChild(newCell);
      } else {
        rows[i].insertBefore(newCell, rows[i].cells[atIndex]);
      }
    }
  }

  private buildEmptyRow(colCount: number): HTMLTableRowElement {
    const row = document.createElement('tr');
    for (var i = 0; i < colCount; i++) {
      const cell = document.createElement('td');
      cell.innerHTML = '&nbsp;';
      row.appendChild(cell);
    }
    return row;
  }

  private syncAfterTableEdit() {
    if (!this.quillInstance) return;
    if (typeof this.quillInstance.update === 'function') {
      this.quillInstance.update('user');
    }
    this.form.MessageContent = this.quillInstance.root.innerHTML;
  }

  insertTable() {
    if (!this.quillInstance) return;
    this.lastFocusedFieldName = 'MessageContent';
    const range = this.quillInstance.getSelection(true);
    const index = range ? range.index : this.quillInstance.getLength();
    const tableHtml =
      '<table>' +
      '<tbody>' +
      '<tr><th>Header 1</th><th>Header 2</th><th>Header 3</th></tr>' +
      '<tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>' +
      '<tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>' +
      '</tbody>' +
      '</table><p><br/></p>';
    this.quillInstance.clipboard.dangerouslyPasteHTML(index, tableHtml, 'user');
    this.quillInstance.setSelection(index + 1, 0);
  }

  onQuillFocus() {
    this.lastFocusedFieldName = 'MessageContent';
    this.lastFocusedEl = null;
  }

  isQuillEmpty(content: string): boolean {
    if (!content) return true;
    return content.replace(/<[^>]+>/g, '').trim().length === 0;
  }

  insertToken(token: string) {
    if (this.lastFocusedFieldName === 'MessageContent' && this.quillInstance) {
      const range = this.quillInstance.getSelection(true);
      const index = range ? range.index : this.quillInstance.getLength();
      this.quillInstance.insertText(index, token, 'user');
      this.quillInstance.setSelection(index + token.length, 0);
      return;
    }
    const el = this.lastFocusedEl;
    const fieldName = this.lastFocusedFieldName;
    if (!el || !fieldName) {
      this.copyToken(token);
      return;
    }
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const before = el.value.substring(0, start);
    const after = el.value.substring(end);
    this.form[fieldName] = before + token + after;
    const cursorPos = start + token.length;
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(cursorPos, cursorPos);
    }, 0);
  }

  getInsertHint(): string {
    if (!this.lastFocusedFieldName) return 'Focus Subject or Body first';
    if (this.lastFocusedFieldName === 'TemplateTitle') return 'Click to insert into Subject';
    return 'Click to insert into Body';
  }

  validateRecipients(raw: string): { valid: string[]; invalid: string[]; duplicates: string[] } {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const lines = raw.split('\n').map(function(l) { return l.trim(); }).filter(function(l) { return l.length > 0; });
    const seen: string[] = [];
    const valid: string[] = [];
    const invalid: string[] = [];
    const duplicates: string[] = [];
    for (var i = 0; i < lines.length; i++) {
      var email = lines[i];
      if (!emailRegex.test(email)) {
        invalid.push(email);
      } else if (seen.indexOf(email.toLowerCase()) !== -1) {
        duplicates.push(email);
      } else {
        seen.push(email.toLowerCase());
        valid.push(email);
      }
    }
    return { valid, invalid, duplicates };
  }

  saveTemplate() {
    if (!this.form.TransactionType || !this.form.TemplateTitle || !this.form.RecipientEmails || this.isQuillEmpty(this.form.MessageContent)) {
      this.snack.open('Please fill in all required fields.', 'Close', { duration: 3000 });
      return;
    }
    var recipientCheck = this.validateRecipients(this.form.RecipientEmails);
    if (recipientCheck.invalid.length > 0) {
      this.snack.open('Invalid email address(es): ' + recipientCheck.invalid.join(', '), 'Close', { duration: 5000 });
      return;
    }
    if (recipientCheck.valid.length === 0) {
      this.snack.open('Please enter at least one valid recipient email address.', 'Close', { duration: 3000 });
      return;
    }
    if (recipientCheck.duplicates.length > 0) {
      this.snack.open('Duplicate email(s) removed: ' + recipientCheck.duplicates.join(', '), 'Close', { duration: 4000 });
    }
    this.form.RecipientEmails = recipientCheck.valid.join('\n');
    this.saving.set(true);
    const id = this.editingId();
    const obs = id
      ? this.api.updateEmailTemplate(id, this.form)
      : this.api.createEmailTemplate(this.form);

    obs.subscribe({
      next: () => {
        this.snack.open('Template saved successfully.', 'Close', { duration: 3000 });
        this.cancelForm();
        this.loadTemplates();
        this.saving.set(false);
      },
      error: (e) => {
        this.snack.open('Failed to save template: ' + (e?.error?.error ?? 'Unknown error'), 'Close', { duration: 4000 });
        this.saving.set(false);
      },
    });
  }

  deleteTemplate(id: number) {
    if (!confirm('Delete this email template?')) return;
    this.api.deleteEmailTemplate(id).subscribe({
      next: () => {
        this.snack.open('Template deleted.', 'Close', { duration: 3000 });
        this.loadTemplates();
      },
      error: () => this.snack.open('Failed to delete template.', 'Close', { duration: 3000 }),
    });
  }

  getRecipientCount(emails: string): number {
    if (!emails) return 0;
    return emails.split('\n').filter(e => e.trim().includes('@')).length;
  }

  getActiveLabel(isActive: number): string {
    return isActive === 1 ? 'Active' : 'Inactive';
  }

  getTokensForType(type: string): Array<{token: string; description: string}> {
    var specific = TRANSACTION_TOKENS[type] ?? [];
    var result: Array<{token: string; description: string}> = [];
    for (var i = 0; i < UNIVERSAL_TOKENS.length; i++) result.push(UNIVERSAL_TOKENS[i]);
    for (var j = 0; j < specific.length; j++) result.push(specific[j]);
    return result;
  }

  copyToken(token: string) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(token).then(() => {
        this.snack.open('Copied ' + token, 'Close', { duration: 2000 });
      });
    }
  }

  togglePreview() {
    this.showPreview.set(!this.showPreview());
  }

  renderPreview(text: string): string {
    if (!text) return '';
    var result = text;
    var samples = buildSampleValues();
    var keys = Object.keys(samples);
    for (var i = 0; i < keys.length; i++) {
      var token = keys[i];
      var value = samples[token];
      result = result.split(token).join(value);
    }
    return result;
  }

  getPreviewSubject(): string {
    return this.renderPreview(this.form.TemplateTitle);
  }

  getPreviewBody(): string {
    return this.renderPreview(this.form.MessageContent);
  }

  hasUnresolvedTokens(text: string): boolean {
    return /\{[A-Za-z]+\}/.test(text);
  }
}
