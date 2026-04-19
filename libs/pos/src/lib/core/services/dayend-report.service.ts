import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';

interface ReportShift {
  cashierName: string;
  cashOffice: string;
  startTime: string;
  systemTotals: { cash: number; card: number; cheque: number; postal: number; total: number };
  declaredTotals?: { cash: number; card: number; cheque: number; postal: number; total: number };
  shortage: number;
  surplus: number;
  transactionCount: number;
  reconcileStatus?: string;
  statusId?: number;
}

interface ReportData {
  cashReceipts: any[];
  cardReceipts: any[];
  chequeReceipts: any[];
  postalReceipts: any[];
  dropboxReceipts: any[];
  offlineReceipts: any[];
  cancelledReceipts: any[];
  systemVsCashier: any[];
  reconcile: any;
}

@Injectable({ providedIn: 'root' })
export class DayEndReportService {
  private auth = inject(AuthService);

  private navy: [number, number, number] = [15, 43, 70];
  private gold: [number, number, number] = [201, 168, 76];
  private lightBg: [number, number, number] = [248, 250, 252];
  private totalBg: [number, number, number] = [241, 245, 249];
  private redHeader: [number, number, number] = [153, 27, 27];
  private redLightBg: [number, number, number] = [254, 242, 242];
  private redTotalBg: [number, number, number] = [254, 226, 226];

  private formatDate(iso: string): string {
    if (!iso) return '-';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }

  private formatDateTime(iso: string): string {
    if (!iso) return '-';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return `${this.formatDate(iso)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  private formatCurrency(v: number): string {
    return 'R ' + v.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  private toNum(v: any): number {
    const n = Number(v);
    return isNaN(n) ? 0 : n;
  }

  private sumField(list: any[], ...fields: string[]): number {
    return list.reduce((s: number, r: any) => {
      for (const f of fields) { if (r[f] != null) return s + this.toNum(r[f]); }
      return s;
    }, 0);
  }

  private validReceipts(list: any[]): any[] {
    return list.filter(r => !(r.isCancelled === 1 || r.isCancelled === true));
  }

  private getMunicipalityName(): string {
    return this.auth.site()?.name || 'Municipality';
  }

  private getUserName(): string {
    const u = this.auth.user();
    return u ? `${u.firstName} ${u.lastName}` : 'System';
  }

  private getFinYear(): string {
    return this.auth.user()?.finYear || '';
  }

  private getStatusLabel(shift: ReportShift): string {
    const id = shift.statusId || 0;
    if (id === 174) return 'Submitted';
    if (id === 175) return 'Verified';
    if (id === 176) return 'Returned';
    if (id === 177 || id === 178) return 'Completed';
    if (shift.reconcileStatus) return shift.reconcileStatus;
    return '-';
  }

  private addHeader(doc: any, title: string, shift: ReportShift, isOffice: boolean, margin: number, pageW: number): number {
    const municipality = this.getMunicipalityName();

    doc.setFillColor(this.navy[0], this.navy[1], this.navy[2]);
    doc.rect(0, 0, pageW, 38, 'F');

    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text(title, pageW / 2, 13, { align: 'center' });

    doc.setFontSize(9);
    doc.setTextColor(201, 168, 76);
    const dateLabel = this.formatDate(shift.startTime);
    const status = this.getStatusLabel(shift);

    if (isOffice) {
      doc.text(`Office: ${shift.cashOffice}    |    Date: ${dateLabel}    |    Status: ${status}`, pageW / 2, 22, { align: 'center' });
    } else {
      doc.text(`Cashier: ${shift.cashierName}    |    Office: ${shift.cashOffice}    |    Date: ${dateLabel}    |    Status: ${status}`, pageW / 2, 22, { align: 'center' });
    }

    doc.setFontSize(8);
    doc.setTextColor(180, 180, 180);
    const finYear = this.getFinYear();
    const genDate = this.formatDateTime(new Date().toISOString());
    doc.text(`${municipality}    |    Financial Year: ${finYear}    |    Generated: ${genDate}`, pageW / 2, 30, { align: 'center' });

    doc.setDrawColor(this.gold[0], this.gold[1], this.gold[2]);
    doc.setLineWidth(0.8);
    doc.line(margin, 36, pageW - margin, 36);

    return 44;
  }

  private addFooter(doc: any, margin: number, pageW: number, pageH: number): void {
    const pageCount = doc.getNumberOfPages();
    const now = new Date();
    const genDate = this.formatDateTime(now.toISOString());
    const userName = this.getUserName();

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setDrawColor(this.gold[0], this.gold[1], this.gold[2]);
      doc.setLineWidth(0.3);
      doc.line(margin, pageH - 10, pageW - margin, pageH - 10);

      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      doc.text(`Print Date: ${genDate}`, margin, pageH - 6);
      doc.text(`User: ${userName}`, pageW / 2, pageH - 6, { align: 'center' });
      doc.text(`Page ${i} of ${pageCount}`, pageW - margin, pageH - 6, { align: 'right' });
    }
  }

  private addSectionTitle(doc: any, title: string, y: number, margin: number, pageW: number): number {
    doc.setFontSize(11);
    doc.setTextColor(this.navy[0], this.navy[1], this.navy[2]);
    doc.text(title, margin, y);
    doc.setDrawColor(this.gold[0], this.gold[1], this.gold[2]);
    doc.setLineWidth(0.4);
    doc.line(margin, y + 1.5, pageW - margin, y + 1.5);
    return y + 5;
  }

  private checkPageBreak(doc: any, y: number, needed: number, pageH: number): number {
    if (y + needed > pageH - 15) {
      doc.addPage();
      return 15;
    }
    return y;
  }

  private addSessionSummary(doc: any, autoTable: any, data: ReportData, y: number, margin: number, pageW: number, pageH: number): number {
    y = this.addSectionTitle(doc, 'Session Summary', y, margin, pageW);

    const validCash = this.validReceipts(data.cashReceipts);
    const validCard = this.validReceipts(data.cardReceipts);
    const validCheque = this.validReceipts(data.chequeReceipts);
    const validPostal = this.validReceipts(data.postalReceipts);
    const validDropbox = this.validReceipts(data.dropboxReceipts);
    const validOffline = this.validReceipts(data.offlineReceipts);
    const cancelledInCash = data.cashReceipts.filter((r: any) => r.isCancelled === 1 || r.isCancelled === true);
    const cancelledInCard = data.cardReceipts.filter((r: any) => r.isCancelled === 1 || r.isCancelled === true);
    const sumValid = (list: any[]) => list.reduce((s: number, r: any) => s + this.toNum(r.paidAmount || r.amount || r.totalAmount || 0), 0);

    const summaryData = [
      ['Cash Receipts', String(validCash.length), this.formatCurrency(sumValid(validCash))],
      ['Card Receipts', String(validCard.length), this.formatCurrency(sumValid(validCard))],
      ['Cheque Receipts', String(validCheque.length), this.formatCurrency(sumValid(validCheque))],
      ['Postal Receipts', String(validPostal.length), this.formatCurrency(sumValid(validPostal))],
      ['Drop Box Receipts', String(validDropbox.length), this.formatCurrency(sumValid(validDropbox))],
      ['Offline Receipts', String(validOffline.length), this.formatCurrency(sumValid(validOffline))],
      ['Cancelled Receipts', String(cancelledInCash.length + cancelledInCard.length + data.cancelledReceipts.length), this.formatCurrency(sumValid(cancelledInCash) + sumValid(cancelledInCard) + sumValid(data.cancelledReceipts))],
    ];
    const totalValid = sumValid(validCash) + sumValid(validCard) + sumValid(validCheque) + sumValid(validPostal) + sumValid(validDropbox) + sumValid(validOffline);
    summaryData.push(['TOTAL (Valid)', '', this.formatCurrency(totalValid)]);

    (autoTable as any)(doc, {
      startY: y,
      head: [['Category', 'Count', 'Amount']],
      body: summaryData,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: this.navy, textColor: 255, fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: 80 }, 1: { halign: 'center', cellWidth: 30 }, 2: { halign: 'right', cellWidth: 50 } },
      alternateRowStyles: { fillColor: this.lightBg },
      margin: { left: margin, right: margin },
      tableWidth: 160,
      didParseCell: (cellData: any) => {
        if (cellData.row.index === summaryData.length - 1) {
          cellData.cell.styles.fillColor = this.totalBg;
          cellData.cell.styles.fontStyle = 'bold';
        }
      }
    });

    return (doc as any).lastAutoTable.finalY + 6;
  }

  private addReconciliationSummary(doc: any, autoTable: any, shift: ReportShift, y: number, margin: number, pageW: number, pageH: number): number {
    y = this.checkPageBreak(doc, y, 30, pageH);
    y = this.addSectionTitle(doc, 'Reconciliation Summary', y, margin, pageW);

    const reconData = [
      ['System Total', this.formatCurrency(shift.systemTotals.total)],
      ['Declared Total', shift.declaredTotals ? this.formatCurrency(shift.declaredTotals.total) : '-'],
      ['Shortage', shift.shortage > 0 ? this.formatCurrency(shift.shortage) : '-'],
      ['Surplus', shift.surplus > 0 ? this.formatCurrency(shift.surplus) : '-'],
    ];
    (autoTable as any)(doc, {
      startY: y,
      head: [['Item', 'Amount']],
      body: reconData,
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: this.navy, textColor: 255, fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: 80 }, 1: { halign: 'right', cellWidth: 50 } },
      margin: { left: margin, right: margin },
      tableWidth: 130,
      alternateRowStyles: { fillColor: this.lightBg },
    });

    return (doc as any).lastAutoTable.finalY + 6;
  }

  private addSystemVsCashier(doc: any, autoTable: any, data: ReportData, shift: ReportShift, y: number, margin: number, pageW: number, pageH: number): number {
    y = this.checkPageBreak(doc, y, 30, pageH);
    y = this.addSectionTitle(doc, 'System vs Cashier Comparison', y, margin, pageW);

    if (data.systemVsCashier && data.systemVsCashier.length > 0) {
      const svcBody = data.systemVsCashier.map((r: any, i: number) => [
        String(i + 1),
        r.title || r.description || r.paymentType || r.type || r.name || '-',
        this.formatCurrency(this.toNum(r.systemTotal ?? r.systemAmount ?? r.system ?? 0)),
        this.formatCurrency(this.toNum(r.cashierTotal ?? r.cashierAmount ?? r.cashier ?? 0)),
        this.formatCurrency(this.toNum(r.totalDifference ?? r.variance ?? r.difference ?? 0)),
      ]);

      const totalSystem = data.systemVsCashier.reduce((s: number, r: any) => s + this.toNum(r.systemTotal ?? r.systemAmount ?? r.system ?? 0), 0);
      const totalCashier = data.systemVsCashier.reduce((s: number, r: any) => s + this.toNum(r.cashierTotal ?? r.cashierAmount ?? r.cashier ?? 0), 0);
      const totalVariance = data.systemVsCashier.reduce((s: number, r: any) => s + this.toNum(r.totalDifference ?? r.variance ?? r.difference ?? 0), 0);
      svcBody.push(['', 'TOTALS', this.formatCurrency(totalSystem), this.formatCurrency(totalCashier), this.formatCurrency(totalVariance)]);

      (autoTable as any)(doc, {
        startY: y,
        head: [['#', 'Description', 'System Amount', 'Cashier Amount', 'Variance']],
        body: svcBody,
        styles: { fontSize: 7.5, cellPadding: 2 },
        headStyles: { fillColor: this.navy, textColor: 255, fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 12, halign: 'center' },
          1: { cellWidth: 70 },
          2: { halign: 'right', cellWidth: 35 },
          3: { halign: 'right', cellWidth: 35 },
          4: { halign: 'right', cellWidth: 35 },
        },
        alternateRowStyles: { fillColor: this.lightBg },
        margin: { left: margin, right: margin },
        didParseCell: (cellData: any) => {
          if (cellData.row.index === svcBody.length - 1) {
            cellData.cell.styles.fillColor = this.totalBg;
            cellData.cell.styles.fontStyle = 'bold';
          }
          if (cellData.column.index === 4 && cellData.section === 'body') {
            const raw = String(cellData.cell.raw || '');
            const num = parseFloat(raw.replace(/[R\s]/g, ''));
            if (num > 0) cellData.cell.styles.textColor = [220, 38, 38];
            else if (num < 0) cellData.cell.styles.textColor = [220, 38, 38];
          }
        }
      });
    } else {
      const fallbackBody = [
        ['1', 'Cash On Hand + Drop Box', this.formatCurrency(shift.systemTotals.cash), shift.declaredTotals ? this.formatCurrency(shift.declaredTotals.cash) : this.formatCurrency(shift.systemTotals.cash), this.formatCurrency(shift.declaredTotals ? shift.systemTotals.cash - shift.declaredTotals.cash : 0)],
        ['2', 'Cheque', this.formatCurrency(shift.systemTotals.cheque), shift.declaredTotals ? this.formatCurrency(shift.declaredTotals.cheque) : this.formatCurrency(shift.systemTotals.cheque), this.formatCurrency(shift.declaredTotals ? shift.systemTotals.cheque - shift.declaredTotals.cheque : 0)],
        ['3', 'Credit/Debit Card', this.formatCurrency(shift.systemTotals.card), shift.declaredTotals ? this.formatCurrency(shift.declaredTotals.card) : this.formatCurrency(shift.systemTotals.card), this.formatCurrency(shift.declaredTotals ? shift.systemTotals.card - shift.declaredTotals.card : 0)],
        ['4', 'Postal Orders', this.formatCurrency(shift.systemTotals.postal), shift.declaredTotals ? this.formatCurrency(shift.declaredTotals.postal) : this.formatCurrency(shift.systemTotals.postal), this.formatCurrency(shift.declaredTotals ? shift.systemTotals.postal - shift.declaredTotals.postal : 0)],
      ];
      const sysTotal = shift.systemTotals.total;
      const declTotal = shift.declaredTotals ? shift.declaredTotals.total : sysTotal;
      fallbackBody.push(['', 'TOTALS', this.formatCurrency(sysTotal), this.formatCurrency(declTotal), this.formatCurrency(sysTotal - declTotal)]);

      (autoTable as any)(doc, {
        startY: y,
        head: [['#', 'Description', 'System Amount', 'Cashier Amount', 'Variance']],
        body: fallbackBody,
        styles: { fontSize: 7.5, cellPadding: 2 },
        headStyles: { fillColor: this.navy, textColor: 255, fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 12, halign: 'center' },
          1: { cellWidth: 70 },
          2: { halign: 'right', cellWidth: 35 },
          3: { halign: 'right', cellWidth: 35 },
          4: { halign: 'right', cellWidth: 35 },
        },
        alternateRowStyles: { fillColor: this.lightBg },
        margin: { left: margin, right: margin },
        didParseCell: (cellData: any) => {
          if (cellData.row.index === fallbackBody.length - 1) {
            cellData.cell.styles.fillColor = this.totalBg;
            cellData.cell.styles.fontStyle = 'bold';
          }
          if (cellData.column.index === 4 && cellData.section === 'body') {
            const raw = String(cellData.cell.raw || '');
            const num = parseFloat(raw.replace(/[R\s]/g, ''));
            if (num !== 0) cellData.cell.styles.textColor = [220, 38, 38];
          }
        }
      });
    }

    return (doc as any).lastAutoTable.finalY + 8;
  }

  private isMiscReceipt(r: any): boolean {
    if (r.isMiscPayment === true || r.isMiscPayment === 1 || r.isMiscPayment === '1' || r.is_misc_payment === true || r.is_misc_payment === 1 || r.is_misc_payment === '1') return true;
    const holder = String(r.accHolderName || r.accountHolder || '').toLowerCase();
    if (holder.startsWith('deposits') || holder.startsWith('deposit') || holder.startsWith('misc')) return true;
    const acc = String(r.accountNumber || r.accountNo || r.accountId || '');
    if (!acc || acc === '-' || acc === '0') return true;
    return false;
  }

  private receiptRowData(r: any): string[] {
    const paid = this.toNum(r.paidAmount ?? r.amount ?? r.totalAmount ?? 0);
    const tender = this.toNum(r.tenderAmount ?? 0);
    const change = this.toNum(r.changeAmount ?? 0);
    const status = (r.isCancelled === 1 || r.isCancelled === true) ? 'Voided' : 'Valid';
    return [
      r.receiptNo || r.receipt_no || r.receiptNumber || '-',
      r.accountNumber || r.accountNo || r.accountId || '-',
      r.accHolderName || r.accountHolder || '-',
      this.formatCurrency(paid),
      this.formatCurrency(tender),
      this.formatCurrency(change),
      this.formatDate(r.dateCaptured || r.receiptDate || r.date || ''),
      status,
    ];
  }

  private receiptTableConfig(margin: number, pageW: number): any {
    const usable = pageW - margin * 2;
    return {
      styles: { fontSize: 7.5, cellPadding: 2, lineColor: [200, 200, 200], lineWidth: 0.1, overflow: 'ellipsize' },
      headStyles: { fillColor: this.navy, textColor: 255, fontStyle: 'bold', fontSize: 7.5 },
      alternateRowStyles: { fillColor: this.lightBg },
      margin: { left: margin, right: margin },
      tableWidth: usable,
      columnStyles: {
        0: { cellWidth: usable * 0.14 },
        1: { cellWidth: usable * 0.13 },
        2: { cellWidth: usable * 0.24 },
        3: { halign: 'right' as const, cellWidth: usable * 0.11 },
        4: { halign: 'right' as const, cellWidth: usable * 0.11 },
        5: { halign: 'right' as const, cellWidth: usable * 0.09 },
        6: { cellWidth: usable * 0.10 },
        7: { cellWidth: usable * 0.08 },
      },
    };
  }

  private addReceiptSubTable(doc: any, autoTable: any, receipts: any[], y: number, margin: number, pageW: number, pageH: number): number {
    const body = receipts.map((r: any) => this.receiptRowData(r));
    const totPaid = this.sumField(receipts, 'paidAmount', 'amount', 'totalAmount');
    const totTender = this.sumField(receipts, 'tenderAmount');
    const totChange = this.sumField(receipts, 'changeAmount');
    body.push(['SUBTOTAL', '', '', this.formatCurrency(totPaid), this.formatCurrency(totTender), this.formatCurrency(totChange), '', '']);

    const config = this.receiptTableConfig(margin, pageW);
    (autoTable as any)(doc, {
      startY: y,
      head: [['Receipt No', 'Account', 'Account Holder', 'Paid', 'Tendered', 'Change', 'Date', 'Status']],
      body: body,
      ...config,
      didParseCell: (cellData: any) => {
        if (cellData.row.index === body.length - 1) {
          cellData.cell.styles.fillColor = this.totalBg;
          cellData.cell.styles.fontStyle = 'bold';
          cellData.cell.styles.textColor = this.navy;
        }
        const val = String(cellData.cell.raw || '');
        if (val === 'Voided') { cellData.cell.styles.textColor = [153, 27, 27]; cellData.cell.styles.fontStyle = 'bold'; }
      }
    });
    return (doc as any).lastAutoTable.finalY + 4;
  }

  private addSubSectionLabel(doc: any, label: string, count: number, y: number, margin: number, pageW: number, pageH: number): number {
    y = this.checkPageBreak(doc, y, 15, pageH);
    doc.setFontSize(9);
    doc.setTextColor(this.navy[0], this.navy[1], this.navy[2]);
    doc.text(`${label} (${count})`, margin + 2, y);
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.line(margin + 2, y + 1, pageW - margin, y + 1);
    return y + 4;
  }

  private addReceiptSection(doc: any, autoTable: any, label: string, receipts: any[], paymentType: string, y: number, margin: number, pageW: number, pageH: number, shift: ReportShift): number {
    y = this.checkPageBreak(doc, y, 25, pageH);
    y = this.addSectionTitle(doc, `${label} (${receipts.length})`, y, margin, pageW);

    if (receipts.length === 0) {
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text('No records found', margin + 5, y + 2);
      return y + 8;
    }

    const accountPayments = receipts.filter(r => !this.isMiscReceipt(r));
    const miscReceipts = receipts.filter(r => this.isMiscReceipt(r));

    if (accountPayments.length > 0 && miscReceipts.length > 0) {
      y = this.addSubSectionLabel(doc, 'Account Payments', accountPayments.length, y, margin, pageW, pageH);
      y = this.addReceiptSubTable(doc, autoTable, accountPayments, y, margin, pageW, pageH);

      y = this.addSubSectionLabel(doc, 'Misc Receipts', miscReceipts.length, y, margin, pageW, pageH);
      y = this.addReceiptSubTable(doc, autoTable, miscReceipts, y, margin, pageW, pageH);

      const totPaid = this.sumField(receipts, 'paidAmount', 'amount', 'totalAmount');
      const totTender = this.sumField(receipts, 'tenderAmount');
      const totChange = this.sumField(receipts, 'changeAmount');
      const totalBody = [['SECTION TOTAL', '', '', this.formatCurrency(totPaid), this.formatCurrency(totTender), this.formatCurrency(totChange), '', '']];
      const config = this.receiptTableConfig(margin, pageW);
      (autoTable as any)(doc, {
        startY: y,
        body: totalBody,
        ...config,
        showHead: 'never' as const,
        didParseCell: (cellData: any) => {
          cellData.cell.styles.fillColor = [230, 240, 250];
          cellData.cell.styles.fontStyle = 'bold';
          cellData.cell.styles.textColor = this.navy;
          cellData.cell.styles.fontSize = 8;
        }
      });
      return (doc as any).lastAutoTable.finalY + 6;
    } else {
      const body = receipts.map((r: any) => this.receiptRowData(r));
      const totPaid = this.sumField(receipts, 'paidAmount', 'amount', 'totalAmount');
      const totTender = this.sumField(receipts, 'tenderAmount');
      const totChange = this.sumField(receipts, 'changeAmount');
      body.push(['TOTALS', '', '', this.formatCurrency(totPaid), this.formatCurrency(totTender), this.formatCurrency(totChange), '', '']);

      const config = this.receiptTableConfig(margin, pageW);
      (autoTable as any)(doc, {
        startY: y,
        head: [['Receipt No', 'Account', 'Account Holder', 'Paid', 'Tendered', 'Change', 'Date', 'Status']],
        body: body,
        ...config,
        didParseCell: (cellData: any) => {
          if (cellData.row.index === body.length - 1) {
            cellData.cell.styles.fillColor = this.totalBg;
            cellData.cell.styles.fontStyle = 'bold';
            cellData.cell.styles.textColor = this.navy;
          }
          const val = String(cellData.cell.raw || '');
          if (val === 'Voided') { cellData.cell.styles.textColor = [153, 27, 27]; cellData.cell.styles.fontStyle = 'bold'; }
        }
      });
      return (doc as any).lastAutoTable.finalY + 6;
    }
  }

  private addCancelledSection(doc: any, autoTable: any, cancelled: any[], y: number, margin: number, pageW: number, pageH: number): number {
    if (cancelled.length === 0) return y;

    y = this.checkPageBreak(doc, y, 25, pageH);

    doc.setFontSize(11);
    doc.setTextColor(this.redHeader[0], this.redHeader[1], this.redHeader[2]);
    doc.text(`Cancelled Receipts (${cancelled.length})`, margin, y);
    doc.setDrawColor(220, 38, 38);
    doc.setLineWidth(0.4);
    doc.line(margin, y + 1.5, pageW - margin, y + 1.5);
    y += 5;

    const body = cancelled.map((r: any) => [
      r.receiptNo || '-',
      r.accountNumber || r.accountNo || r.accountId || '-',
      r.accHolderName || '-',
      this.formatCurrency(this.toNum(r.paidAmount || 0)),
      this.formatDate(r.dateCaptured || ''),
      this.formatDate(r.canceledDate || ''),
      r.reasonForCancel || '-',
    ]);

    const total = this.sumField(cancelled, 'paidAmount');
    body.push(['', '', 'Total:', this.formatCurrency(total), '', '', '']);

    (autoTable as any)(doc, {
      startY: y,
      head: [['Receipt No', 'Account', 'Account Holder', 'Amount', 'Captured', 'Cancelled', 'Reason']],
      body: body,
      styles: { fontSize: 6.5, cellPadding: 1.5, lineColor: [200, 200, 200], lineWidth: 0.1 },
      headStyles: { fillColor: this.redHeader, textColor: 255, fontStyle: 'bold', fontSize: 6.5 },
      alternateRowStyles: { fillColor: this.redLightBg },
      margin: { left: margin, right: margin },
      columnStyles: { 3: { halign: 'right' } },
      didParseCell: (cellData: any) => {
        if (cellData.row.index === body.length - 1) {
          cellData.cell.styles.fillColor = this.redTotalBg;
          cellData.cell.styles.fontStyle = 'bold';
        }
      }
    });

    return (doc as any).lastAutoTable.finalY + 6;
  }

  private addDepositSummary(doc: any, autoTable: any, data: ReportData, shift: ReportShift, y: number, margin: number, pageW: number, pageH: number): number {
    y = this.checkPageBreak(doc, y, 30, pageH);
    y = this.addSectionTitle(doc, 'Deposit Summary', y, margin, pageW);

    const validCash = this.validReceipts(data.cashReceipts);
    const validCard = this.validReceipts(data.cardReceipts);
    const validCheque = this.validReceipts(data.chequeReceipts);
    const validPostal = this.validReceipts(data.postalReceipts);
    const cancelledCash = data.cashReceipts.filter(r => r.isCancelled === 1 || r.isCancelled === true);
    const allValid = [...validCash, ...validCard, ...validCheque, ...validPostal, ...this.validReceipts(data.dropboxReceipts), ...this.validReceipts(data.offlineReceipts)];

    const cashTotal = this.sumField(validCash, 'paidAmount', 'amount', 'totalAmount');
    const cardTotal = this.sumField(validCard, 'paidAmount', 'amount', 'totalAmount');
    const chequeTotal = this.sumField(validCheque, 'paidAmount', 'amount', 'totalAmount');
    const postalTotal = this.sumField(validPostal, 'paidAmount', 'amount', 'totalAmount');
    const cancelledTotal = this.sumField(cancelledCash, 'paidAmount', 'amount', 'totalAmount');

    const summaryData = [
      ['Total Receipts', String(allValid.length)],
      ['Total Cash For The Day', this.formatCurrency(cashTotal)],
      ['Total Credit Card For The Day', this.formatCurrency(cardTotal)],
      ['Total Cheque For The Day', this.formatCurrency(chequeTotal)],
      ['Total Postal Orders For The Day', this.formatCurrency(postalTotal)],
      ['Total Cash (Cancelled Receipts)', this.formatCurrency(cancelledTotal)],
      ['', ''],
      ['Total Cash To Bank', this.formatCurrency(cashTotal)],
    ];

    (autoTable as any)(doc, {
      startY: y,
      body: summaryData,
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 100, fontStyle: 'normal', textColor: [50, 50, 50] },
        1: { cellWidth: 60, halign: 'right', fontStyle: 'bold', textColor: this.navy }
      },
      alternateRowStyles: { fillColor: this.lightBg },
      margin: { left: margin, right: margin },
      theme: 'plain',
      didParseCell: (cellData: any) => {
        if (cellData.row.index === summaryData.length - 1) {
          cellData.cell.styles.fillColor = this.totalBg;
          cellData.cell.styles.fontStyle = 'bold';
          cellData.cell.styles.fontSize = 10;
        }
      }
    });

    return (doc as any).lastAutoTable.finalY + 6;
  }

  private addChequeInfoTable(doc: any, autoTable: any, chequeReceipts: any[], y: number, margin: number, pageW: number, pageH: number): number {
    y = this.checkPageBreak(doc, y, 25, pageH);
    y = this.addSectionTitle(doc, 'Cheque Information', y, margin, pageW);

    if (chequeReceipts.length === 0) {
      const body = [['', '', '', '', '', '', this.formatCurrency(0)]];
      (autoTable as any)(doc, {
        startY: y,
        head: [['Receipt No', 'Receipt Date And Time', 'Account Holder Name', 'Cheque No', 'Bank', 'Branch Code', 'Amount']],
        body: body,
        styles: { fontSize: 7.5, cellPadding: 2 },
        headStyles: { fillColor: this.navy, textColor: 255, fontStyle: 'bold' },
        columnStyles: { 6: { halign: 'right' } },
        margin: { left: margin, right: margin },
      });
    } else {
      const body = chequeReceipts.map(r => [
        r.receiptNo || '-',
        this.formatDateTime(r.dateCaptured || r.receiptDate || ''),
        r.accHolderName || '-',
        r.chequeNo || '-',
        r.bankBranch || '-',
        r.bankBrachCode || r.bankBranchCode || '-',
        this.formatCurrency(this.toNum(r.paidAmount ?? r.amount ?? r.totalAmount ?? 0)),
      ]);
      const total = this.sumField(chequeReceipts, 'paidAmount', 'amount', 'totalAmount');
      body.push(['', '', '', '', '', 'Total', this.formatCurrency(total)]);
      (autoTable as any)(doc, {
        startY: y,
        head: [['Receipt No', 'Receipt Date And Time', 'Account Holder Name', 'Cheque No', 'Bank', 'Branch Code', 'Amount']],
        body: body,
        styles: { fontSize: 7.5, cellPadding: 2 },
        headStyles: { fillColor: this.navy, textColor: 255, fontStyle: 'bold' },
        columnStyles: { 6: { halign: 'right' } },
        margin: { left: margin, right: margin },
        didParseCell: (cellData: any) => {
          if (cellData.row.index === body.length - 1) {
            cellData.cell.styles.fillColor = this.totalBg;
            cellData.cell.styles.fontStyle = 'bold';
          }
        }
      });
    }

    return (doc as any).lastAutoTable.finalY + 6;
  }

  private addCardInfoTable(doc: any, autoTable: any, cardReceipts: any[], y: number, margin: number, pageW: number, pageH: number): number {
    y = this.checkPageBreak(doc, y, 25, pageH);
    y = this.addSectionTitle(doc, 'Credit Card Information', y, margin, pageW);

    if (cardReceipts.length === 0) {
      const body = [['', '', '', '', this.formatCurrency(0)]];
      (autoTable as any)(doc, {
        startY: y,
        head: [['Receipt No', 'Receipt Date And Time', 'Card No', 'Expiry Date', 'Amount']],
        body: body,
        styles: { fontSize: 7.5, cellPadding: 2 },
        headStyles: { fillColor: this.navy, textColor: 255, fontStyle: 'bold' },
        columnStyles: { 4: { halign: 'right' } },
        margin: { left: margin, right: margin },
      });
    } else {
      const body = cardReceipts.map(r => [
        r.receiptNo || '-',
        this.formatDateTime(r.dateCaptured || r.receiptDate || ''),
        r.cardNo ? '****' + r.cardNo.slice(-4) : '-',
        r.cardExpiryDate || '-',
        this.formatCurrency(this.toNum(r.paidAmount ?? r.amount ?? r.totalAmount ?? 0)),
      ]);
      const total = this.sumField(cardReceipts, 'paidAmount', 'amount', 'totalAmount');
      body.push(['', '', '', 'Total', this.formatCurrency(total)]);
      (autoTable as any)(doc, {
        startY: y,
        head: [['Receipt No', 'Receipt Date And Time', 'Card No', 'Expiry Date', 'Amount']],
        body: body,
        styles: { fontSize: 7.5, cellPadding: 2 },
        headStyles: { fillColor: this.navy, textColor: 255, fontStyle: 'bold' },
        columnStyles: { 4: { halign: 'right' } },
        margin: { left: margin, right: margin },
        didParseCell: (cellData: any) => {
          if (cellData.row.index === body.length - 1) {
            cellData.cell.styles.fillColor = this.totalBg;
            cellData.cell.styles.fontStyle = 'bold';
          }
        }
      });
    }

    return (doc as any).lastAutoTable.finalY + 6;
  }

  private addPostalInfoTable(doc: any, autoTable: any, postalReceipts: any[], y: number, margin: number, pageW: number, pageH: number): number {
    y = this.checkPageBreak(doc, y, 25, pageH);
    y = this.addSectionTitle(doc, 'Postal Order Information', y, margin, pageW);

    if (postalReceipts.length === 0) {
      const body = [['', '', this.formatCurrency(0)]];
      (autoTable as any)(doc, {
        startY: y,
        head: [['Receipt No', 'Receipt Date And Time', 'Amount']],
        body: body,
        styles: { fontSize: 7.5, cellPadding: 2 },
        headStyles: { fillColor: this.navy, textColor: 255, fontStyle: 'bold' },
        columnStyles: { 2: { halign: 'right' } },
        margin: { left: margin, right: margin },
      });
    } else {
      const body = postalReceipts.map(r => [
        r.receiptNo || '-',
        this.formatDateTime(r.dateCaptured || r.receiptDate || ''),
        this.formatCurrency(this.toNum(r.paidAmount ?? r.amount ?? r.totalAmount ?? 0)),
      ]);
      const total = this.sumField(postalReceipts, 'paidAmount', 'amount', 'totalAmount');
      body.push(['', 'Total', this.formatCurrency(total)]);
      (autoTable as any)(doc, {
        startY: y,
        head: [['Receipt No', 'Receipt Date And Time', 'Amount']],
        body: body,
        styles: { fontSize: 7.5, cellPadding: 2 },
        headStyles: { fillColor: this.navy, textColor: 255, fontStyle: 'bold' },
        columnStyles: { 2: { halign: 'right' } },
        margin: { left: margin, right: margin },
        didParseCell: (cellData: any) => {
          if (cellData.row.index === body.length - 1) {
            cellData.cell.styles.fillColor = this.totalBg;
            cellData.cell.styles.fontStyle = 'bold';
          }
        }
      });
    }

    return (doc as any).lastAutoTable.finalY + 6;
  }

  private addReceiptBreakdownByType(doc: any, autoTable: any, data: ReportData, y: number, margin: number, pageW: number, pageH: number): number {
    y = this.checkPageBreak(doc, y, 40, pageH);
    y = this.addSectionTitle(doc, 'Receipt Breakdown by Type', y, margin, pageW);

    const allLists = [
      { label: 'Cash', list: this.validReceipts(data.cashReceipts) },
      { label: 'Card', list: this.validReceipts(data.cardReceipts) },
      { label: 'Cheque', list: this.validReceipts(data.chequeReceipts) },
      { label: 'Postal', list: this.validReceipts(data.postalReceipts) },
      { label: 'Drop Box', list: this.validReceipts(data.dropboxReceipts) },
      { label: 'Offline', list: this.validReceipts(data.offlineReceipts) },
    ];

    const sumAmt = (list: any[]) => this.sumField(list, 'paidAmount', 'amount', 'totalAmount');
    const rows: string[][] = [];
    let grandAcctCount = 0, grandAcctAmt = 0, grandMiscCount = 0, grandMiscAmt = 0;

    for (const { label, list } of allLists) {
      if (list.length === 0) continue;
      const acct = list.filter(r => !this.isMiscReceipt(r));
      const misc = list.filter(r => this.isMiscReceipt(r));
      if (acct.length > 0) {
        const amt = sumAmt(acct);
        rows.push([label, 'Account Payment', String(acct.length), this.formatCurrency(amt)]);
        grandAcctCount += acct.length;
        grandAcctAmt += amt;
      }
      if (misc.length > 0) {
        const amt = sumAmt(misc);
        rows.push([label, 'Misc Receipt', String(misc.length), this.formatCurrency(amt)]);
        grandMiscCount += misc.length;
        grandMiscAmt += amt;
      }
    }

    if (rows.length === 0) {
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text('No receipts found', margin + 5, y + 2);
      return y + 8;
    }

    rows.push(['', '', '', '']);
    rows.push(['', 'Total Account Payments', String(grandAcctCount), this.formatCurrency(grandAcctAmt)]);
    rows.push(['', 'Total Misc Receipts', String(grandMiscCount), this.formatCurrency(grandMiscAmt)]);
    rows.push(['', 'GRAND TOTAL', String(grandAcctCount + grandMiscCount), this.formatCurrency(grandAcctAmt + grandMiscAmt)]);

    const subtotalStartIdx = rows.length - 3;

    (autoTable as any)(doc, {
      startY: y,
      head: [['Payment Method', 'Receipt Type', 'Count', 'Amount']],
      body: rows,
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: this.navy, textColor: 255, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 80 },
        2: { halign: 'center', cellWidth: 30 },
        3: { halign: 'right', cellWidth: 55 },
      },
      alternateRowStyles: { fillColor: this.lightBg },
      margin: { left: margin, right: margin },
      didParseCell: (cellData: any) => {
        const idx = cellData.row.index;
        if (idx >= subtotalStartIdx) {
          cellData.cell.styles.fillColor = this.totalBg;
          cellData.cell.styles.fontStyle = 'bold';
          cellData.cell.styles.textColor = this.navy;
        }
        if (idx === rows.length - 1) {
          cellData.cell.styles.fillColor = [230, 240, 250];
          cellData.cell.styles.fontSize = 9;
        }
        if (idx === subtotalStartIdx - 1) {
          cellData.cell.styles.fillColor = [255, 255, 255];
          cellData.cell.styles.minCellHeight = 2;
          cellData.cell.styles.cellPadding = 0.5;
        }
      }
    });

    return (doc as any).lastAutoTable.finalY + 8;
  }

  async generateCashierCashReport(shift: ReportShift, data: ReportData): Promise<void> {
    const jsPDFModule = await import('jspdf');
    const jsPDF = jsPDFModule.default || jsPDFModule.jsPDF;
    const autoTableModule = await import('jspdf-autotable');
    const autoTable: any = (autoTableModule as any);

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageW = 297;
    const pageH = 210;
    const margin = 10;

    let y = this.addHeader(doc, 'Cashier Day-End Cash Report', shift, false, margin, pageW);

    y = this.addSessionSummary(doc, autoTable, data, y, margin, pageW, pageH);

    y = this.addReconciliationSummary(doc, autoTable, shift, y, margin, pageW, pageH);

    y = this.addSystemVsCashier(doc, autoTable, data, shift, y, margin, pageW, pageH);

    y = this.addReceiptBreakdownByType(doc, autoTable, data, y, margin, pageW, pageH);

    const sections: { label: string; list: any[]; type: string }[] = [
      { label: 'Cash Receipts', list: this.validReceipts(data.cashReceipts), type: 'Cash' },
      { label: 'Card Receipts', list: this.validReceipts(data.cardReceipts), type: 'Card' },
      { label: 'Cheque Receipts', list: this.validReceipts(data.chequeReceipts), type: 'Cheque' },
      { label: 'Postal Receipts', list: this.validReceipts(data.postalReceipts), type: 'Postal' },
      { label: 'Drop Box Receipts', list: this.validReceipts(data.dropboxReceipts), type: 'Drop Box' },
      { label: 'Offline Receipts', list: this.validReceipts(data.offlineReceipts), type: 'Offline' },
    ];

    for (const section of sections) {
      if (section.list.length > 0) {
        y = this.addReceiptSection(doc, autoTable, section.label, section.list, section.type, y, margin, pageW, pageH, shift);
      }
    }

    y = this.addCancelledSection(doc, autoTable, data.cancelledReceipts, y, margin, pageW, pageH);

    this.addFooter(doc, margin, pageW, pageH);

    const safeName = this.safeName(shift.cashierName || 'Cashier');
    const dateStr = this.fileDate(shift.startTime);
    doc.save(`${safeName}_Cash_Report_${dateStr}.pdf`);
  }

  async generateCashierDepositSlip(shift: ReportShift, data: ReportData): Promise<void> {
    const jsPDFModule = await import('jspdf');
    const jsPDF = jsPDFModule.default || jsPDFModule.jsPDF;
    const autoTableModule = await import('jspdf-autotable');
    const autoTable: any = (autoTableModule as any);

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = 210;
    const pageH = 297;
    const margin = 15;

    let y = this.addHeader(doc, 'Cashier Day-End Deposit Slip', shift, false, margin, pageW);

    y = this.addSessionSummary(doc, autoTable, data, y, margin, pageW, pageH);

    y = this.addReconciliationSummary(doc, autoTable, shift, y, margin, pageW, pageH);

    y = this.addSystemVsCashier(doc, autoTable, data, shift, y, margin, pageW, pageH);

    y = this.addDepositSummary(doc, autoTable, data, shift, y, margin, pageW, pageH);

    const validCheque = this.validReceipts(data.chequeReceipts);
    const validCard = this.validReceipts(data.cardReceipts);
    const validPostal = this.validReceipts(data.postalReceipts);

    y = this.addChequeInfoTable(doc, autoTable, validCheque, y, margin, pageW, pageH);
    y = this.addCardInfoTable(doc, autoTable, validCard, y, margin, pageW, pageH);
    y = this.addPostalInfoTable(doc, autoTable, validPostal, y, margin, pageW, pageH);

    this.addFooter(doc, margin, pageW, pageH);

    const safeName = this.safeName(shift.cashierName || 'Cashier');
    const dateStr = this.fileDate(shift.startTime);
    doc.save(`${safeName}_Deposit_Slip_${dateStr}.pdf`);
  }

  async generateOfficeCashReport(shift: ReportShift, data: ReportData, allCashierShifts: ReportShift[]): Promise<void> {
    const jsPDFModule = await import('jspdf');
    const jsPDF = jsPDFModule.default || jsPDFModule.jsPDF;
    const autoTableModule = await import('jspdf-autotable');
    const autoTable: any = (autoTableModule as any);

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageW = 297;
    const pageH = 210;
    const margin = 10;

    let y = this.addHeader(doc, 'Cash Office Day-End Cash Report', shift, true, margin, pageW);

    y = this.addSessionSummary(doc, autoTable, data, y, margin, pageW, pageH);

    y = this.addReconciliationSummary(doc, autoTable, shift, y, margin, pageW, pageH);

    y = this.addSystemVsCashier(doc, autoTable, data, shift, y, margin, pageW, pageH);

    y = this.addReceiptBreakdownByType(doc, autoTable, data, y, margin, pageW, pageH);

    if (allCashierShifts.length > 1) {
      y = this.checkPageBreak(doc, y, 40, pageH);
      y = this.addSectionTitle(doc, 'Cashier Breakdown', y, margin, pageW);
      const breakdownBody = allCashierShifts.map(s => [
        s.cashierName,
        this.formatCurrency(s.systemTotals.cash),
        this.formatCurrency(s.systemTotals.card),
        this.formatCurrency(s.systemTotals.cheque),
        this.formatCurrency(s.systemTotals.postal),
        this.formatCurrency(s.systemTotals.total),
        String(s.transactionCount),
      ]);
      const totals = allCashierShifts.reduce((acc, s) => ({
        cash: acc.cash + s.systemTotals.cash,
        card: acc.card + s.systemTotals.card,
        cheque: acc.cheque + s.systemTotals.cheque,
        postal: acc.postal + s.systemTotals.postal,
        total: acc.total + s.systemTotals.total,
        count: acc.count + s.transactionCount,
      }), { cash: 0, card: 0, cheque: 0, postal: 0, total: 0, count: 0 });
      breakdownBody.push([
        'TOTAL',
        this.formatCurrency(totals.cash),
        this.formatCurrency(totals.card),
        this.formatCurrency(totals.cheque),
        this.formatCurrency(totals.postal),
        this.formatCurrency(totals.total),
        String(totals.count),
      ]);
      (autoTable as any)(doc, {
        startY: y,
        head: [['Cashier', 'Cash', 'Card', 'Cheque', 'Postal', 'Total', 'Receipts']],
        body: breakdownBody,
        styles: { fontSize: 7.5, cellPadding: 2 },
        headStyles: { fillColor: this.navy, textColor: 255, fontStyle: 'bold' },
        columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' }, 6: { halign: 'center' } },
        alternateRowStyles: { fillColor: this.lightBg },
        margin: { left: margin, right: margin },
        didParseCell: (cellData: any) => {
          if (cellData.row.index === breakdownBody.length - 1) {
            cellData.cell.styles.fillColor = this.totalBg;
            cellData.cell.styles.fontStyle = 'bold';
          }
        }
      });
      y = (doc as any).lastAutoTable.finalY + 6;
    }

    const sections: { label: string; list: any[]; type: string }[] = [
      { label: 'Cash Receipts', list: this.validReceipts(data.cashReceipts), type: 'Cash' },
      { label: 'Card Receipts', list: this.validReceipts(data.cardReceipts), type: 'Card' },
      { label: 'Cheque Receipts', list: this.validReceipts(data.chequeReceipts), type: 'Cheque' },
      { label: 'Postal Receipts', list: this.validReceipts(data.postalReceipts), type: 'Postal' },
      { label: 'Drop Box Receipts', list: this.validReceipts(data.dropboxReceipts), type: 'Drop Box' },
      { label: 'Offline Receipts', list: this.validReceipts(data.offlineReceipts), type: 'Offline' },
    ];

    for (const section of sections) {
      if (section.list.length > 0) {
        y = this.addReceiptSection(doc, autoTable, section.label, section.list, section.type, y, margin, pageW, pageH, shift);
      }
    }

    y = this.addCancelledSection(doc, autoTable, data.cancelledReceipts, y, margin, pageW, pageH);

    this.addFooter(doc, margin, pageW, pageH);

    const safeName = this.safeName(shift.cashOffice || 'Office');
    const dateStr = this.fileDate(shift.startTime);
    doc.save(`${safeName}_Office_Cash_Report_${dateStr}.pdf`);
  }

  async generateOfficeDepositSlip(shift: ReportShift, data: ReportData, allCashierShifts: ReportShift[]): Promise<void> {
    const jsPDFModule = await import('jspdf');
    const jsPDF = jsPDFModule.default || jsPDFModule.jsPDF;
    const autoTableModule = await import('jspdf-autotable');
    const autoTable: any = (autoTableModule as any);

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = 210;
    const pageH = 297;
    const margin = 15;

    let y = this.addHeader(doc, 'Cash Office Day-End Deposit Slip', shift, true, margin, pageW);

    y = this.addSessionSummary(doc, autoTable, data, y, margin, pageW, pageH);

    y = this.addReconciliationSummary(doc, autoTable, shift, y, margin, pageW, pageH);

    y = this.addSystemVsCashier(doc, autoTable, data, shift, y, margin, pageW, pageH);

    y = this.addDepositSummary(doc, autoTable, data, shift, y, margin, pageW, pageH);

    if (allCashierShifts.length > 1) {
      y = this.checkPageBreak(doc, y, 40, pageH);
      y = this.addSectionTitle(doc, 'Per-Cashier Deposit Totals', y, margin, pageW);
      const breakdownBody = allCashierShifts.map(s => [
        s.cashierName,
        this.formatCurrency(s.systemTotals.cash),
        this.formatCurrency(s.systemTotals.card),
        this.formatCurrency(s.systemTotals.cheque),
        this.formatCurrency(s.systemTotals.postal),
        this.formatCurrency(s.systemTotals.total),
      ]);
      const totals = allCashierShifts.reduce((acc, s) => ({
        cash: acc.cash + s.systemTotals.cash, card: acc.card + s.systemTotals.card,
        cheque: acc.cheque + s.systemTotals.cheque, postal: acc.postal + s.systemTotals.postal,
        total: acc.total + s.systemTotals.total,
      }), { cash: 0, card: 0, cheque: 0, postal: 0, total: 0 });
      breakdownBody.push(['TOTAL', this.formatCurrency(totals.cash), this.formatCurrency(totals.card), this.formatCurrency(totals.cheque), this.formatCurrency(totals.postal), this.formatCurrency(totals.total)]);
      (autoTable as any)(doc, {
        startY: y,
        head: [['Cashier', 'Cash', 'Card', 'Cheque', 'Postal', 'Total']],
        body: breakdownBody,
        styles: { fontSize: 8, cellPadding: 2.5 },
        headStyles: { fillColor: this.navy, textColor: 255, fontStyle: 'bold' },
        columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' } },
        alternateRowStyles: { fillColor: this.lightBg },
        margin: { left: margin, right: margin },
        didParseCell: (cellData: any) => {
          if (cellData.row.index === breakdownBody.length - 1) {
            cellData.cell.styles.fillColor = this.totalBg;
            cellData.cell.styles.fontStyle = 'bold';
          }
        }
      });
      y = (doc as any).lastAutoTable.finalY + 8;
    }

    const validCheque = this.validReceipts(data.chequeReceipts);
    const validCard = this.validReceipts(data.cardReceipts);
    const validPostal = this.validReceipts(data.postalReceipts);

    y = this.addChequeInfoTable(doc, autoTable, validCheque, y, margin, pageW, pageH);
    y = this.addCardInfoTable(doc, autoTable, validCard, y, margin, pageW, pageH);
    y = this.addPostalInfoTable(doc, autoTable, validPostal, y, margin, pageW, pageH);

    this.addFooter(doc, margin, pageW, pageH);

    const safeName = this.safeName(shift.cashOffice || 'Office');
    const dateStr = this.fileDate(shift.startTime);
    doc.save(`${safeName}_Office_Deposit_Slip_${dateStr}.pdf`);
  }

  private safeName(name: string): string {
    return name.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '').replace(/__+/g, '_');
  }

  private fileDate(iso: string): string {
    if (!iso) return 'unknown';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return 'unknown';
    return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
  }
}
