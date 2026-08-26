import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, combineLatest, of, switchMap } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { CycleStore, PeriodStore } from './cycle-picker';

interface IndicatorRow {
  kpiId: number;
  kpiNumber: string;
  department: string | null;
  nationalKpa: string | null;
  indicator: string;
  quarter: number;
  target: string | null;
  actual: string;
  unit: string | null;
  score: number | null;
  status: string;
}
interface StatusSummary { status: string; count: number; }
interface ApiResponse { rows?: IndicatorRow[]; summary?: StatusSummary[]; total?: number; }

@Component({
  selector: 'app-org-status-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bar">
      <div>
        <h2>Indicator Status — Organisational</h2>
        <p>Per-indicator target status for the locked-down SDBIP or Revised SDBIP</p>
      </div>
      <div class="controls">
        <select [ngModel]="deptFilter()" (ngModelChange)="deptFilter.set($event)">
          <option value="">All Departments</option>
          <option *ngFor="let d of departments()" [value]="d">{{ d }}</option>
        </select>
        <select [ngModel]="statusFilter()" (ngModelChange)="statusFilter.set($event)">
          <option value="">All Statuses</option>
          <option *ngFor="let s of statuses()" [value]="s">{{ s }}</option>
        </select>
        <button class="exp" (click)="exportExcel()"><span class="material-symbols-rounded">download</span> Excel</button>
        <button class="exp" (click)="exportPdf()"><span class="material-symbols-rounded">download</span> PDF</button>
        <button class="exp" (click)="exportWord()"><span class="material-symbols-rounded">download</span> Word</button>
      </div>
    </div>

    <ng-container *ngIf="cycles.cycleId(); else pick">
      <div class="sum-label">Summary by Status</div>
      <div class="cards">
        <div class="card" *ngFor="let s of summaryCards()" [ngClass]="cardCls(s.status)">
          <div class="cnum">{{ s.count }}</div>
          <div class="cname">{{ s.status }}</div>
        </div>
        <div class="card total">
          <div class="cnum">{{ filteredRows().length }}</div>
          <div class="cname">Total</div>
        </div>
      </div>

      <div class="plat-card panelp">
        <table class="tbl" *ngIf="filteredRows().length > 0; else noRows">
          <thead>
            <tr>
              <th>Department</th><th>Indicator</th>
              <th class="c">Quarter</th><th class="c">Target</th><th class="c">Actual</th>
              <th class="c">Score</th><th class="c">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let r of filteredRows()">
              <td class="strong">{{ r.department || '—' }}</td>
              <td class="ind">{{ r.indicator }}</td>
              <td class="c">Q{{ r.quarter }}</td>
              <td class="c">{{ valueWithUnit(r.target, r.unit) }}</td>
              <td class="c">{{ valueWithUnit(r.actual, r.unit) }}</td>
              <td class="c strong">{{ r.score !== null ? (r.score | number:'1.1-1') + '%' : '—' }}</td>
              <td class="c"><span class="badge" [ngClass]="badgeCls(r.status)">{{ r.status }}</span></td>
            </tr>
          </tbody>
        </table>
        <ng-template #noRows><p class="empty">No captured indicator results for this selection</p></ng-template>
      </div>
    </ng-container>

    <ng-template #pick><p class="empty">Select a performance cycle to view indicator status</p></ng-template>
  `,
  styles: [`
    :host { display:block; }
    .bar { display:flex; justify-content:space-between; align-items:flex-start; gap:16px; margin-bottom:18px; flex-wrap:wrap; }
    .bar h2 { font-size:22px; font-weight:700; margin:0; }
    .bar p { color: var(--plat-muted); margin:4px 0 0; font-size:13px; }
    .controls { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
    .controls select { padding:7px 10px; border:1px solid var(--plat-border); border-radius:8px; background:#fff; font-size:13px; }
    .exp { display:inline-flex; align-items:center; gap:4px; padding:6px 10px; border:1px solid var(--plat-border); border-radius:6px; background:#fff; font-size:12px; cursor:pointer; color:#334155; }
    .exp:hover { background:#f8fafc; }
    .exp .material-symbols-rounded { font-size:14px; }
    .sum-label { font-size:11px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--plat-muted); margin-bottom:10px; }
    .cards { display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:14px; margin-bottom:18px; }
    .card { border:1px solid var(--plat-border); border-radius:12px; padding:18px; text-align:center; background:#f8fafc; }
    .card .cnum { font-size:26px; font-weight:700; color:#0f172a; }
    .card .cname { font-size:12px; font-weight:600; margin-top:4px; color:#475569; }
    .card.green { background:#f0fdf4; border-color:#bbf7d0; }
    .card.green .cnum, .card.green .cname { color:#15803d; }
    .card.amber { background:#fffbeb; border-color:#fde68a; }
    .card.amber .cnum, .card.amber .cname { color:#b45309; }
    .card.red { background:#fef2f2; border-color:#fecaca; }
    .card.red .cnum, .card.red .cname { color:#b91c1c; }
    .card.grey .cnum, .card.grey .cname { color:#475569; }
    .panelp { padding:0; margin-bottom:18px; overflow-x:auto; }
    .tbl { width:100%; border-collapse:collapse; font-size:13px; }
    .tbl th, .tbl td { padding:10px 12px; border-bottom:1px solid var(--plat-border); text-align:left; vertical-align:top; }
    .tbl th { font-size:11px; color:var(--plat-muted); text-transform:uppercase; letter-spacing:.03em; white-space:nowrap; }
    .tbl tr:last-child td { border-bottom:none; }
    .tbl .c { text-align:center; }
    .strong { font-weight:600; }
    .ind { max-width:420px; color:#334155; }
    .badge { display:inline-block; padding:3px 10px; border-radius:999px; font-size:11px; font-weight:600; white-space:nowrap; }
    .b-green { background:#dcfce7; color:#15803d; }
    .b-amber { background:#fef3c7; color:#92400e; }
    .b-red { background:#fee2e2; color:#991b1b; }
    .b-grey { background:#f1f5f9; color:#475569; }
    .b-teal { background:#ccfbf1; color:#0f766e; }
    .b-blue { background:#dbeafe; color:#1d4ed8; }
    .card.teal { background:#f0fdfa; border-color:#99f6e4; }
    .card.teal .cnum, .card.teal .cname { color:#0f766e; }
    .card.blue { background:#eff6ff; border-color:#bfdbfe; }
    .card.blue .cnum, .card.blue .cname { color:#1d4ed8; }
    .empty { text-align:center; color:var(--plat-muted); padding:24px; }
  `],
})
export class OrgStatusTabComponent {
  private readonly api = inject(ApiService);
  readonly cycles = inject(CycleStore);
  readonly periods = inject(PeriodStore);

  readonly deptFilter = signal('');
  readonly statusFilter = signal('');

  private readonly data = toSignal<ApiResponse | null>(
    combineLatest([toObservable(this.cycles.cycleId), toObservable(this.periods.period)]).pipe(
      switchMap(([cid, period]) => {
        if (!cid) return of(null);
        return this.api.get<ApiResponse>('/dashboards/org-indicator-status', { cycleId: cid, period })
          .pipe(catchError(() => of(null)));
      }),
    ),
    { initialValue: null },
  );

  readonly rows = computed(() => this.data()?.rows ?? []);

  readonly departments = computed(() =>
    Array.from(new Set(this.rows().map(r => r.department).filter((d): d is string => !!d))).sort());

  private static readonly STATUS_ORDER = [
    'Not Captured',
    'Saved',
    'Pending Manager Review',
    'Returned by Manager',
    'Pending PMS Review',
    'Returned by PMS Office',
    'PMS Approved (Finalised)',
    'Approved by Internal Audit',
    'Returned by Internal Audit',
    'Cascaded',
  ];

  readonly statuses = computed(() => {
    const extra = Array.from(new Set(this.rows().map(r => r.status)))
      .filter(s => !OrgStatusTabComponent.STATUS_ORDER.includes(s)).sort();
    return [...OrgStatusTabComponent.STATUS_ORDER, ...extra];
  });

  readonly filteredRows = computed(() => this.rows().filter(r =>
    (!this.deptFilter() || r.department === this.deptFilter()) &&
    (!this.statusFilter() || r.status === this.statusFilter())));

  readonly summaryCards = computed(() => {
    const counts = new Map<string, number>();
    for (const r of this.filteredRows()) counts.set(r.status, (counts.get(r.status) ?? 0) + 1);
    return Array.from(counts.entries())
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count || a.status.localeCompare(b.status));
  });

  /** Targets/actuals are captured as already-formatted strings (e.g. "25%",
   *  "31 Aug 2026"); appending the unit abbreviation just adds noise like "2 #". */
  valueWithUnit(v: string | null, _unit: string | null): string {
    if (v === null || v === '') return '—';
    return v.trim();
  }

  cardCls(status: string): string {
    return this.badgeCls(status).replace('b-', '');
  }

  badgeCls(status: string): string {
    if (status === 'Approved by Internal Audit') return 'b-green';
    if (status === 'PMS Approved (Finalised)') return 'b-teal';
    if (status.startsWith('Pending')) return 'b-amber';
    if (status.startsWith('Returned')) return 'b-red';
    if (status === 'Cascaded') return 'b-blue';
    return 'b-grey';
  }

  private esc(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  private exportCols: Array<[string, (r: IndicatorRow) => string]> = [
    ['Department', r => r.department || '—'],
    ['Indicator', r => r.indicator],
    ['Quarter', r => `Q${r.quarter}`],
    ['Target', r => this.valueWithUnit(r.target, r.unit)],
    ['Actual', r => this.valueWithUnit(r.actual, r.unit)],
    ['Score', r => r.score !== null ? `${r.score.toFixed(1)}%` : '—'],
    ['Status', r => r.status],
  ];

  private generatedStamp(): string {
    return new Date().toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  private tableHtml(): string {
    const head = this.exportCols
      .map(([h]) => `<th style="padding:8px 10px;border:1px solid #1e3a8a;background:#1e3a8a;color:#ffffff;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.04em;">${this.esc(h)}</th>`)
      .join('');
    const body = this.filteredRows()
      .map((r, i) => `<tr style="background:${i % 2 === 1 ? '#f8fafc' : '#ffffff'};">${this.exportCols.map(([, fn]) => `<td style="padding:7px 10px;border:1px solid #cbd5e1;color:#334155;vertical-align:top;">${this.esc(fn(r))}</td>`).join('')}</tr>`)
      .join('');
    const cycle = this.cycles.cycles().find(c => c.id === this.cycles.cycleId());
    return `<div style="font-family:Arial,sans-serif;">
      <table style="width:100%;border-collapse:collapse;margin-bottom:14px;"><tr>
        <td style="border-left:4px solid #1e3a8a;padding:2px 12px;">
          <div style="font-size:19px;font-weight:bold;color:#0f172a;">Indicator Status — Organisational</div>
          <div style="font-size:12px;color:#64748b;margin-top:3px;">Per-indicator target status for the locked-down SDBIP or Revised SDBIP</div>
          <div style="font-size:11px;color:#94a3b8;margin-top:3px;">${cycle ? `Financial year: ${this.esc(cycle.financialYearLabel)} · ` : ''}${this.filteredRows().length} indicator${this.filteredRows().length === 1 ? '' : 's'}</div>
        </td>
      </tr></table>
      <table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;font-size:12px;"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>
    </div>`;
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  exportExcel(): void {
    const html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body>${this.tableHtml()}</body></html>`;
    this.downloadBlob(new Blob([html], { type: 'application/vnd.ms-excel' }), 'indicator-status-organisational.xls');
  }

  exportWord(): void {
    const html = `<html xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"></head><body>${this.tableHtml()}</body></html>`;
    this.downloadBlob(new Blob([html], { type: 'application/msword' }), 'indicator-status-organisational.doc');
  }

  async exportPdf(): Promise<void> {
    const { jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF({ orientation: 'landscape' });
    const cycle = this.cycles.cycles().find(c => c.id === this.cycles.cycleId());
    const rows = this.filteredRows();

    // Header band
    doc.setFillColor(30, 58, 138);
    doc.rect(0, 0, 297, 24, 'F');
    doc.setTextColor('#ffffff');
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Indicator Status — Organisational', 14, 11);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Per-indicator target status for the locked-down SDBIP or Revised SDBIP', 14, 18);
    doc.setFontSize(9);
    const meta = cycle ? `FY ${cycle.financialYearLabel}` : '';
    if (meta) doc.text(meta, 283, 11, { align: 'right' });
    doc.text(`${rows.length} indicator${rows.length === 1 ? '' : 's'}`, 283, 18, { align: 'right' });

    autoTable(doc, {
      startY: 30,
      head: [this.exportCols.map(([h]) => h)],
      body: rows.map(r => this.exportCols.map(([, fn]) => fn(r))),
      theme: 'grid',
      styles: { font: 'helvetica', fontSize: 8, textColor: '#334155', cellPadding: 2.5, valign: 'top', lineColor: '#cbd5e1', lineWidth: 0.15 },
      headStyles: { fillColor: '#1e3a8a', textColor: '#ffffff', fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: '#f8fafc' },
      columnStyles: {
        0: { cellWidth: 42 },
        1: { cellWidth: 80 },
        2: { cellWidth: 18, halign: 'center' },
        3: { cellWidth: 38 },
        4: { cellWidth: 34 },
        5: { cellWidth: 18, halign: 'center' },
        6: { cellWidth: 39 },
      },
      margin: { left: 14, right: 14, top: 14 },
    });

    const total = doc.getNumberOfPages();
    for (let p = 1; p <= total; p++) {
      doc.setPage(p);
      doc.setFontSize(8);
      doc.setTextColor('#94a3b8');
      doc.text(`Page ${p} of ${total}`, 283, 205, { align: 'right' });
      doc.text('Platinum Performance — Performance Management System', 14, 205);
    }
    doc.save('indicator-status-organisational.pdf');
  }
}
