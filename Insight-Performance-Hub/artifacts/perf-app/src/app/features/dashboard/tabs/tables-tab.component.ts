import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, combineLatest, of, switchMap } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { CycleStore, PERIOD_OPTIONS, PeriodStore } from './cycle-picker';

interface ScorecardCounts {
  targetsSet: number;
  achieved: number;
  partiallyAchieved: number;
  notAchieved: number;
  overAchieved: number;
  onHold: number;
  notApplicable: number;
  unableToAssess: number;
}
interface ScorecardRow extends ScorecardCounts { name: string; }
interface OrgScorecardData {
  byNkpa?: ScorecardRow[];
  nkpaTotal?: ScorecardCounts;
  byDepartment?: ScorecardRow[];
  departmentTotal?: ScorecardCounts;
}

interface StatusDef { key: keyof ScorecardCounts; label: string; color: string; }

const STATUSES: StatusDef[] = [
  { key: 'achieved', label: 'Achieved', color: '#10b981' },
  { key: 'overAchieved', label: 'Over achieved', color: '#7c3aed' },
  { key: 'partiallyAchieved', label: 'Partially achieved', color: '#f59e0b' },
  { key: 'notAchieved', label: 'Not achieved', color: '#ef4444' },
  { key: 'onHold', label: 'On hold', color: '#64748b' },
  { key: 'notApplicable', label: 'Not applicable', color: '#cbd5e1' },
  { key: 'unableToAssess', label: 'Unable to assess', color: '#e2e8f0' },
];

// Column order used in the tables (matches the reference layout)
const TABLE_STATUSES: StatusDef[] = [
  STATUSES[0], // Achieved
  STATUSES[2], // Partially achieved
  STATUSES[3], // Not achieved
  STATUSES[1], // Over achieved
  STATUSES[4], // On hold
  STATUSES[5], // Not applicable
  STATUSES[6], // Unable to assess
];

@Component({
  selector: 'app-tables-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bar">
      <div>
        <h2>Performance Tables</h2>
        <p>Organisational scorecard status breakdowns</p>
      </div>
      <div class="bar__filters">
      </div>
    </div>

    <ng-container *ngIf="cycles.cycleId(); else pick">
      <div class="grid">
        <!-- NKPA table -->
        <div class="plat-card card">
          <div class="card__head">
            <div>
              <h3>Organisational Scorecard per NKPA</h3>
              <p>Target status breakdown per National KPA, based on captured performance data</p>
            </div>
            <div class="card__actions">
              <button class="exp" (click)="exportTable('nkpa', 'xls')"><span class="material-symbols-rounded">download</span> Excel</button>
              <button class="exp" (click)="exportTable('nkpa', 'pdf')"><span class="material-symbols-rounded">download</span> PDF</button>
              <button class="exp" (click)="exportTable('nkpa', 'doc')"><span class="material-symbols-rounded">download</span> Word</button>
            </div>
          </div>
          <ng-container *ngIf="nkpaRows().length; else empty">
            <div class="scroll">
              <table class="tbl">
                <thead>
                  <tr>
                    <th>National KPA</th>
                    <th class="r">Targets set</th>
                    <th class="r" *ngFor="let s of tableStatuses">{{ s.label }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let row of nkpaRows()">
                    <td class="nm">{{ row.name }}</td>
                    <td class="r">{{ row.targetsSet }}</td>
                    <td class="r" *ngFor="let s of tableStatuses">{{ row[s.key] }}</td>
                  </tr>
                  <tr class="total" *ngIf="nkpaTotal() as t">
                    <td class="nm">Total</td>
                    <td class="r">{{ t.targetsSet }}</td>
                    <td class="r" *ngFor="let s of tableStatuses">{{ t[s.key] }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </ng-container>
        </div>

        <!-- NKPA chart -->
        <div class="plat-card card">
          <div class="card__head">
            <div>
              <h3>Organisational Scorecard per NKPA - Graphical View</h3>
              <p>Visual breakdown of target status per National KPA</p>
            </div>
            <div class="card__actions">
              <button class="exp" (click)="exportChart('nkpa', 'xls')"><span class="material-symbols-rounded">download</span> Excel</button>
              <button class="exp" (click)="exportChart('nkpa', 'pdf')"><span class="material-symbols-rounded">download</span> PDF</button>
              <button class="exp" (click)="exportChart('nkpa', 'doc')"><span class="material-symbols-rounded">download</span> Word</button>
            </div>
          </div>
          <ng-container *ngIf="nkpaRows().length; else empty">
            <svg class="chart chart--nkpa" [attr.viewBox]="'0 0 ' + chartW + ' ' + chartH" preserveAspectRatio="xMidYMid meet">
              <g *ngFor="let gl of gridLines(nkpaRows())">
                <line [attr.x1]="pad.l" [attr.x2]="chartW - pad.r" [attr.y1]="gl.y" [attr.y2]="gl.y" stroke="#e2e8f0" stroke-width="1"/>
                <text [attr.x]="pad.l - 6" [attr.y]="gl.y + 3" text-anchor="end" font-size="9" fill="#94a3b8">{{ gl.value }}</text>
              </g>
              <line [attr.x1]="pad.l" [attr.x2]="chartW - pad.r" [attr.y1]="chartH - pad.b" [attr.y2]="chartH - pad.b" stroke="#94a3b8" stroke-width="1"/>
              <line [attr.x1]="pad.l" [attr.x2]="pad.l" [attr.y1]="pad.t" [attr.y2]="chartH - pad.b" stroke="#94a3b8" stroke-width="1"/>
              <g *ngFor="let bar of bars(nkpaRows())">
                <rect *ngFor="let seg of bar.segments" [attr.x]="bar.x" [attr.y]="seg.y"
                      [attr.width]="bar.w" [attr.height]="seg.h" [attr.fill]="seg.color"/>
                <text *ngFor="let ln of bar.labelLines; let i = index" [attr.x]="bar.x + bar.w / 2"
                      [attr.y]="chartH - pad.b + 10 + i * 9" text-anchor="middle" font-size="8" fill="#64748b">{{ ln }}</text>
              </g>
            </svg>
            <div class="legend">
              <span *ngFor="let s of statuses" class="legend__item">
                <span class="dot" [style.background]="s.color"></span>
                <b [style.color]="legendText(s)">{{ s.label }}</b>
              </span>
            </div>
          </ng-container>
        </div>

        <!-- Department table -->
        <div class="plat-card card">
          <div class="card__head">
            <div>
              <h3>Organisational Scorecard per Department</h3>
              <p>Target status breakdown per department, based on captured performance data</p>
            </div>
            <div class="card__actions">
              <button class="exp" (click)="exportTable('dept', 'xls')"><span class="material-symbols-rounded">download</span> Excel</button>
              <button class="exp" (click)="exportTable('dept', 'pdf')"><span class="material-symbols-rounded">download</span> PDF</button>
              <button class="exp" (click)="exportTable('dept', 'doc')"><span class="material-symbols-rounded">download</span> Word</button>
            </div>
          </div>
          <ng-container *ngIf="deptRows().length; else empty">
            <div class="scroll">
              <table class="tbl">
                <thead>
                  <tr>
                    <th>Department</th>
                    <th class="r">Targets set</th>
                    <th class="r" *ngFor="let s of tableStatuses">{{ s.label }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let row of deptRows()">
                    <td class="nm">{{ row.name }}</td>
                    <td class="r">{{ row.targetsSet }}</td>
                    <td class="r" *ngFor="let s of tableStatuses">{{ row[s.key] }}</td>
                  </tr>
                  <tr class="total" *ngIf="deptTotal() as t">
                    <td class="nm">Total</td>
                    <td class="r">{{ t.targetsSet }}</td>
                    <td class="r" *ngFor="let s of tableStatuses">{{ t[s.key] }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </ng-container>
        </div>

        <!-- Department chart -->
        <div class="plat-card card">
          <div class="card__head">
            <div>
              <h3>Organisational Scorecard per Department - Graphical View</h3>
              <p>Visual breakdown of target status per department</p>
            </div>
            <div class="card__actions">
              <button class="exp" (click)="exportChart('dept', 'xls')"><span class="material-symbols-rounded">download</span> Excel</button>
              <button class="exp" (click)="exportChart('dept', 'pdf')"><span class="material-symbols-rounded">download</span> PDF</button>
              <button class="exp" (click)="exportChart('dept', 'doc')"><span class="material-symbols-rounded">download</span> Word</button>
            </div>
          </div>
          <ng-container *ngIf="deptRows().length; else empty">
            <svg class="chart chart--dept" [attr.viewBox]="'0 0 ' + chartW + ' ' + chartH" preserveAspectRatio="xMidYMid meet">
              <g *ngFor="let gl of gridLines(deptRows())">
                <line [attr.x1]="pad.l" [attr.x2]="chartW - pad.r" [attr.y1]="gl.y" [attr.y2]="gl.y" stroke="#e2e8f0" stroke-width="1"/>
                <text [attr.x]="pad.l - 6" [attr.y]="gl.y + 3" text-anchor="end" font-size="9" fill="#94a3b8">{{ gl.value }}</text>
              </g>
              <line [attr.x1]="pad.l" [attr.x2]="chartW - pad.r" [attr.y1]="chartH - pad.b" [attr.y2]="chartH - pad.b" stroke="#94a3b8" stroke-width="1"/>
              <line [attr.x1]="pad.l" [attr.x2]="pad.l" [attr.y1]="pad.t" [attr.y2]="chartH - pad.b" stroke="#94a3b8" stroke-width="1"/>
              <g *ngFor="let bar of bars(deptRows())">
                <rect *ngFor="let seg of bar.segments" [attr.x]="bar.x" [attr.y]="seg.y"
                      [attr.width]="bar.w" [attr.height]="seg.h" [attr.fill]="seg.color"/>
                <text *ngFor="let ln of bar.labelLines; let i = index" [attr.x]="bar.x + bar.w / 2"
                      [attr.y]="chartH - pad.b + 10 + i * 9" text-anchor="middle" font-size="8" fill="#64748b">{{ ln }}</text>
              </g>
            </svg>
            <div class="legend">
              <span *ngFor="let s of statuses" class="legend__item">
                <span class="dot" [style.background]="s.color"></span>
                <b [style.color]="legendText(s)">{{ s.label }}</b>
              </span>
            </div>
          </ng-container>
        </div>
      </div>
    </ng-container>

    <ng-template #empty><p class="emptymsg">No performance data captured yet</p></ng-template>
    <ng-template #pick><p class="emptymsg">Select a performance cycle to view performance tables</p></ng-template>
  `,
  styles: [`
    :host { display:block; }
    .bar { display:flex; justify-content:space-between; align-items:flex-start; gap:16px; margin-bottom:18px; }
    .bar h2 { font-size:22px; font-weight:700; margin:0; }
    .bar p { color: var(--plat-muted); margin:4px 0 0; }
    .bar__filters { display:flex; gap:8px; }
    .bar__filters select { padding:8px 10px; border:1px solid var(--plat-border); border-radius:8px; background:#fff; }
    .grid { display:grid; grid-template-columns:1fr 1fr; gap:18px; }
    @media (max-width: 1100px) { .grid { grid-template-columns:1fr; } }
    .card { padding:16px; display:flex; flex-direction:column; }
    .card__head { display:flex; justify-content:space-between; align-items:flex-start; gap:10px; margin-bottom:10px; flex-wrap:wrap; }
    .card__head h3 { margin:0; font-size:14px; font-weight:700; }
    .card__head p { margin:3px 0 0; font-size:11px; color:var(--plat-muted); }
    .card__actions { display:flex; gap:6px; flex-shrink:0; }
    .exp { display:inline-flex; align-items:center; gap:4px; padding:4px 10px; border:1px solid var(--plat-border); border-radius:6px; background:#fff; font-size:12px; cursor:pointer; color:#334155; }
    .exp:hover { background:#f8fafc; }
    .exp .material-symbols-rounded { font-size:14px; }
    .scroll { overflow-x:auto; }
    .tbl { width:100%; border-collapse:collapse; font-size:12px; min-width:640px; }
    .tbl th, .tbl td { padding:7px 8px; border-bottom:1px solid var(--plat-border); text-align:left; white-space:nowrap; }
    .tbl th { font-size:10px; color:var(--plat-muted); text-transform:none; font-weight:600; }
    .tbl .r { text-align:right; }
    .tbl .nm { white-space:normal; min-width:110px; font-weight:500; }
    .tbl .total td { font-weight:700; border-top:2px solid #334155; }
    .chart { width:100%; height:auto; }
    .legend { display:flex; flex-wrap:wrap; gap:12px; justify-content:center; margin-top:8px; font-size:11px; }
    .legend__item { display:inline-flex; align-items:center; gap:5px; }
    .dot { width:9px; height:9px; border-radius:2px; display:inline-block; }
    .emptymsg { text-align:center; color:var(--plat-muted); padding:24px; }
  `],
})
export class TablesTabComponent {
  private readonly api = inject(ApiService);
  private readonly host = inject(ElementRef<HTMLElement>);
  readonly cycles = inject(CycleStore);
  readonly periods = inject(PeriodStore);
  readonly quarter = signal(0);
  readonly statuses = STATUSES;
  readonly tableStatuses = TABLE_STATUSES;

  readonly chartW = 480;
  readonly chartH = 240;
  readonly pad = { l: 34, t: 12, r: 10, b: 34 };

  readonly data = toSignal<OrgScorecardData | null>(
    combineLatest([toObservable(this.cycles.cycleId), toObservable(this.quarter), toObservable(this.periods.period)]).pipe(
      switchMap(([cid, q, period]) => {
        if (!cid) return of(null);
        const params: Record<string, number | string> = { cycleId: cid, period };
        if (q) params['quarter'] = q;
        return this.api.get<OrgScorecardData>('/dashboards/org-scorecard', params)
          .pipe(catchError(() => of(null)));
      }),
    ),
    { initialValue: null },
  );

  readonly nkpaRows = computed(() => (this.data()?.byNkpa ?? []).filter(r => r.targetsSet > 0));
  readonly deptRows = computed(() => (this.data()?.byDepartment ?? []).filter(r => r.targetsSet > 0));
  readonly nkpaTotal = computed(() => this.data()?.nkpaTotal ?? null);
  readonly deptTotal = computed(() => this.data()?.departmentTotal ?? null);

  legendText(s: StatusDef): string {
    return s.key === 'notApplicable' || s.key === 'unableToAssess' ? '#94a3b8' : s.color;
  }

  private statusSum(row: ScorecardCounts): number {
    return STATUSES.reduce((sum, s) => sum + (row[s.key] ?? 0), 0);
  }

  gridLines(rows: ScorecardRow[]): Array<{ y: number; value: number }> {
    const max = Math.max(1, ...rows.map(r => this.statusSum(r)));
    const innerH = this.chartH - this.pad.t - this.pad.b;
    const step = max <= 5 ? 1 : Math.ceil(max / 5);
    const lines: Array<{ y: number; value: number }> = [];
    for (let v = 0; v <= max; v += step) {
      lines.push({ y: this.chartH - this.pad.b - (v / max) * innerH, value: v });
    }
    return lines;
  }

  bars(rows: ScorecardRow[]): Array<{ x: number; w: number; labelLines: string[]; segments: Array<{ y: number; h: number; color: string }> }> {
    const max = Math.max(1, ...rows.map(r => this.statusSum(r)));
    const innerW = this.chartW - this.pad.l - this.pad.r;
    const innerH = this.chartH - this.pad.t - this.pad.b;
    const slot = innerW / Math.max(1, rows.length);
    const w = Math.min(64, slot * 0.55);
    return rows.map((row, i) => {
      const x = this.pad.l + slot * i + (slot - w) / 2;
      let yBottom = this.chartH - this.pad.b;
      const segments: Array<{ y: number; h: number; color: string }> = [];
      for (const s of STATUSES) {
        const count = row[s.key] ?? 0;
        if (!count) continue;
        const h = (count / max) * innerH;
        yBottom -= h;
        segments.push({ y: yBottom, h, color: s.color });
      }
      return { x, w, labelLines: this.wrapLabel(row.name), segments };
    });
  }

  private wrapLabel(name: string): string[] {
    const words = name.split(/\s+/);
    const lines: string[] = [];
    let current = '';
    for (const word of words) {
      if ((current + ' ' + word).trim().length > 14 && current) {
        lines.push(current);
        current = word;
      } else {
        current = (current + ' ' + word).trim();
      }
    }
    if (current) lines.push(current);
    return lines.slice(0, 3);
  }

  // ---- Exports ----

  private cycleLabel(): string {
    const cid = this.cycles.cycleId();
    return this.cycles.cycles().find(c => c.id === cid)?.financialYearLabel ?? '';
  }

  private quarterLabel(): string {
    const p = this.periods.period();
    return PERIOD_OPTIONS.find(o => o.value === p)?.label ?? 'Annual';
  }

  private cardMeta(kind: 'nkpa' | 'dept') {
    return kind === 'nkpa'
      ? {
          title: 'Organisational Scorecard per NKPA',
          sub: 'Target status breakdown per National KPA',
          groupCol: 'National KPA',
          rows: this.nkpaRows(),
          total: this.nkpaTotal(),
          file: 'org-scorecard-per-nkpa',
          chartClass: 'chart--nkpa',
        }
      : {
          title: 'Organisational Scorecard per Department',
          sub: 'Target status breakdown per department',
          groupCol: 'Department',
          rows: this.deptRows(),
          total: this.deptTotal(),
          file: 'org-scorecard-per-department',
          chartClass: 'chart--dept',
        };
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  private esc(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  private tableHtml(kind: 'nkpa' | 'dept'): string {
    const m = this.cardMeta(kind);
    const cellBase = 'padding:6px 10px;border:1px solid #cbd5e1;font-family:Arial,sans-serif;font-size:12px;vertical-align:middle;';
    const th = (t: string, numeric = false) =>
      `<th style="${cellBase}background:#1e3a8a;color:#ffffff;font-size:11px;font-weight:700;text-align:${numeric ? 'right' : 'left'};">${this.esc(t)}</th>`;
    const tdName = (t: string, bold = false) =>
      `<td style="${cellBase}text-align:left;${bold ? 'font-weight:700;background:#f1f5f9;' : ''}">${this.esc(t)}</td>`;
    const tdNum = (t: number, bold = false) =>
      `<td style="${cellBase}text-align:right;mso-number-format:'0';${bold ? 'font-weight:700;background:#f1f5f9;' : ''}">${t}</td>`;
    const header = `<tr>${th(m.groupCol)}${th('Targets set', true)}${TABLE_STATUSES.map(s => th(s.label, true)).join('')}</tr>`;
    const body = m.rows.map(r =>
      `<tr>${tdName(r.name)}${tdNum(r.targetsSet)}${TABLE_STATUSES.map(s => tdNum(r[s.key] ?? 0)).join('')}</tr>`).join('');
    const t = m.total;
    const totalRow = t
      ? `<tr>${tdName('Total', true)}${tdNum(t.targetsSet, true)}${TABLE_STATUSES.map(s => tdNum(t[s.key] ?? 0, true)).join('')}</tr>`
      : '';
    const colWidths = `<col style="width:220px;" /><col style="width:80px;" />${TABLE_STATUSES.map(() => '<col style="width:90px;" />').join('')}`;
    return `<h1 style="font-family:Arial,sans-serif;font-size:16px;color:#1e3a8a;margin:0 0 4px;">${this.esc(m.title)}</h1>
      <p style="font-family:Arial,sans-serif;font-size:11px;color:#64748b;margin:0 0 10px;">${this.esc(m.sub)} — Cycle: ${this.esc(this.cycleLabel())} — ${this.esc(this.quarterLabel())}</p>
      <table border="1" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #cbd5e1;font-family:Arial,sans-serif;font-size:12px;width:100%;max-width:900px;">${colWidths}<thead>${header}</thead><tbody>${body}${totalRow}</tbody></table>`;
  }

  private async chartPng(kind: 'nkpa' | 'dept'): Promise<{ dataUrl: string; width: number; height: number } | null> {
    const m = this.cardMeta(kind);
    const svg = this.host.nativeElement.querySelector(`svg.${m.chartClass}`) as SVGSVGElement | null;
    if (!svg) return null;
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const vb = svg.viewBox.baseVal;
    const width = vb.width * 3;
    const height = vb.height * 3;
    clone.setAttribute('width', String(width));
    clone.setAttribute('height', String(height));
    const svgUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(clone));
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(null); return; }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve({ dataUrl: canvas.toDataURL('image/png'), width, height });
      };
      img.onerror = () => resolve(null);
      img.src = svgUrl;
    });
  }

  private legendHtml(): string {
    return `<p style="font-family:Arial,sans-serif;font-size:11px;">${TABLE_STATUSES.map(s =>
      `<b style="color:${this.legendText(s)};">■ ${this.esc(s.label)}</b>`).join(' &nbsp; ')}</p>`;
  }

  private chartHtml(kind: 'nkpa' | 'dept', png: { dataUrl: string; width: number; height: number } | null): string {
    const m = this.cardMeta(kind);
    const img = png
      ? `<div><img src="${png.dataUrl}" width="${Math.round(png.width / 3)}" height="${Math.round(png.height / 3)}" alt="Chart" /></div>`
      : '';
    return `<h1 style="font-family:Arial,sans-serif;font-size:16px;color:#1e3a8a;">${this.esc(m.title)} - Graphical View</h1>
      <p style="font-family:Arial,sans-serif;font-size:11px;color:#64748b;">${this.esc(m.sub)} — Cycle: ${this.esc(this.cycleLabel())} — ${this.esc(this.quarterLabel())}</p>
      ${img}${this.legendHtml()}`;
  }

  async exportTable(kind: 'nkpa' | 'dept', fmt: 'xls' | 'doc' | 'pdf'): Promise<void> {
    const m = this.cardMeta(kind);
    if (fmt === 'pdf') { await this.tablePdf(kind); return; }
    const mime = fmt === 'xls' ? 'application/vnd.ms-excel' : 'application/msword';
    const ns = fmt === 'xls' ? 'xmlns:x="urn:schemas-microsoft-com:office:excel"' : 'xmlns:w="urn:schemas-microsoft-com:office:word"';
    const html = `<html ${ns}><head><meta charset="utf-8"></head><body>${this.tableHtml(kind)}</body></html>`;
    this.downloadBlob(new Blob([html], { type: mime }), `${m.file}.${fmt}`);
  }

  async exportChart(kind: 'nkpa' | 'dept', fmt: 'xls' | 'doc' | 'pdf'): Promise<void> {
    const m = this.cardMeta(kind);
    if (fmt === 'pdf') { await this.chartPdf(kind); return; }
    const png = await this.chartPng(kind);
    const mime = fmt === 'xls' ? 'application/vnd.ms-excel' : 'application/msword';
    const ns = fmt === 'xls' ? 'xmlns:x="urn:schemas-microsoft-com:office:excel"' : 'xmlns:w="urn:schemas-microsoft-com:office:word"';
    const html = `<html ${ns}><head><meta charset="utf-8"></head><body>${this.chartHtml(kind, png)}${this.tableHtml(kind)}</body></html>`;
    this.downloadBlob(new Blob([html], { type: mime }), `${m.file}-graphical.${fmt}`);
  }

  private hexToRgb(hex: string): [number, number, number] {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  private pdfHeader(doc: import('jspdf').jsPDF, title: string, sub: string): void {
    const centerX = doc.internal.pageSize.getWidth() / 2;
    doc.setFontSize(14);
    doc.setTextColor('#1e3a8a');
    doc.setFont('helvetica', 'bold');
    doc.text(title, centerX, 16, { align: 'center' });
    doc.setFontSize(9);
    doc.setTextColor('#64748b');
    doc.setFont('helvetica', 'normal');
    doc.text(`${sub} — Cycle: ${this.cycleLabel()} — ${this.quarterLabel()}`, centerX, 23, { align: 'center' });
  }

  private async pdfTable(doc: import('jspdf').jsPDF, kind: 'nkpa' | 'dept', startY: number): Promise<void> {
    const { default: autoTable } = await import('jspdf-autotable');
    const m = this.cardMeta(kind);
    const head = [[m.groupCol, 'Targets set', ...TABLE_STATUSES.map(s => s.label)]];
    const body = m.rows.map(r => [r.name, r.targetsSet, ...TABLE_STATUSES.map(s => r[s.key] ?? 0)]);
    const foot = m.total
      ? [['Total', m.total.targetsSet, ...TABLE_STATUSES.map(s => m.total![s.key] ?? 0)]]
      : undefined;
    const numericCols: Record<number, { halign: 'right' }> = {};
    for (let i = 1; i <= TABLE_STATUSES.length + 1; i++) numericCols[i] = { halign: 'right' };
    autoTable(doc, {
      startY,
      head,
      body: body as (string | number)[][],
      foot: foot as (string | number)[][] | undefined,
      theme: 'grid',
      margin: { left: 14, right: 14 },
      styles: { font: 'helvetica', fontSize: 8.5, cellPadding: 2.5, lineColor: [203, 213, 225], lineWidth: 0.2, textColor: [30, 41, 59] },
      headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'right' },
      footStyles: { fillColor: [241, 245, 249], textColor: [30, 41, 59], fontStyle: 'bold', halign: 'right' },
      columnStyles: { 0: { halign: 'left', cellWidth: 70 }, ...numericCols },
      didParseCell: (data) => {
        if (data.section === 'head' && data.column.index === 0) data.cell.styles.halign = 'left';
        if (data.section === 'foot' && data.column.index === 0) data.cell.styles.halign = 'left';
      },
    });
  }

  private async tablePdf(kind: 'nkpa' | 'dept'): Promise<void> {
    const { jsPDF } = await import('jspdf');
    const m = this.cardMeta(kind);
    const doc = new jsPDF({ orientation: 'landscape' });
    this.pdfHeader(doc, m.title, m.sub);
    await this.pdfTable(doc, kind, 30);
    doc.save(`${m.file}.pdf`);
  }

  private async chartPdf(kind: 'nkpa' | 'dept'): Promise<void> {
    const { jsPDF } = await import('jspdf');
    const m = this.cardMeta(kind);
    const doc = new jsPDF({ orientation: 'landscape' });
    const pageW = doc.internal.pageSize.getWidth();
    this.pdfHeader(doc, `${m.title} - Graphical View`, m.sub);

    let y = 30;
    const png = await this.chartPng(kind);
    if (png) {
      const imgW = 180;
      const imgH = imgW * (png.height / png.width);
      doc.addImage(png.dataUrl, 'PNG', (pageW - imgW) / 2, y, imgW, imgH);
      y += imgH + 6;
    }

    // Legend: colored squares + labels, centered
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const gap = 4;
    const sq = 2.8;
    const items = STATUSES.map(s => ({ s, w: sq + 1.5 + doc.getTextWidth(s.label) }));
    const totalW = items.reduce((sum, it) => sum + it.w, 0) + gap * (items.length - 1);
    let x = Math.max(14, (pageW - totalW) / 2);
    for (const it of items) {
      const [r, g, b] = this.hexToRgb(it.s.color);
      doc.setFillColor(r, g, b);
      doc.rect(x, y - sq + 0.5, sq, sq, 'F');
      doc.setTextColor('#334155');
      doc.text(it.s.label, x + sq + 1.5, y);
      x += it.w + gap;
    }
    y += 8;
    await this.pdfTable(doc, kind, y);
    doc.save(`${m.file}-graphical.pdf`);
  }
}
