import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, of, switchMap } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { CycleStore } from './cycle-picker';

interface HeatQuarter { quarter: number; status: string; performance: number | null; }
interface HeatDirectorate { departmentId: number; directorateName: string; quarters: HeatQuarter[]; }
interface HeatmapData { directorates: HeatDirectorate[]; }

interface Band { key: string; color: string; label: string; }

const BANDS: Band[] = [
  { key: 'green', color: '#22c55e', label: '≥90%' },
  { key: 'amber', color: '#eab308', label: '75–89%' },
  { key: 'orange', color: '#f97316', label: '50–74%' },
  { key: 'red', color: '#ef4444', label: '<50%' },
  { key: 'hold', color: '#94a3b8', label: 'On hold' },
  { key: 'na', color: '#e2e8f0', label: 'Not applicable' },
];

export function heatCellColor(q: HeatQuarter): string {
  if (q.status === 'on_hold') return '#94a3b8';
  if (q.status !== 'active' || q.performance === null) return '#e2e8f0';
  if (q.performance >= 90) return '#22c55e';
  if (q.performance >= 75) return '#eab308';
  if (q.performance >= 50) return '#f97316';
  return '#ef4444';
}

export function heatCellLabel(q: HeatQuarter): string {
  if (q.status === 'on_hold') return 'On hold';
  if (q.status !== 'active' || q.performance === null) return 'Not applicable';
  return `${q.performance.toFixed(1)}%`;
}

@Component({
  selector: 'app-directorate-heatmap',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="plat-card panelp">
      <div class="head">
        <div>
          <h3>Directorate Heat Map</h3>
          <p class="sub">Quarterly performance at a glance, per directorate</p>
        </div>
        <div class="actions">
          <button class="exp" (click)="exportExcel()"><span class="material-symbols-rounded">download</span> Excel</button>
          <button class="exp" (click)="exportPdf()"><span class="material-symbols-rounded">download</span> PDF</button>
          <button class="exp" (click)="exportWord()"><span class="material-symbols-rounded">download</span> Word</button>
        </div>
      </div>

      <table class="tbl" *ngIf="rows().length > 0; else empty">
        <thead>
          <tr>
            <th>Directorate</th>
            <th class="c" *ngFor="let q of quarterCols()">Q{{ q }}</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let d of rows()">
            <td class="name">{{ d.directorateName }}</td>
            <td class="c" *ngFor="let q of d.quarters">
              <span class="dot" [style.background]="color(q)"
                    [title]="'Q' + q.quarter + ': ' + label(q)"></span>
            </td>
          </tr>
        </tbody>
      </table>
      <ng-template #empty><p class="none">No directorate data for this cycle</p></ng-template>

      <div class="legend">
        <span *ngFor="let b of bands"><span class="dot sm" [style.background]="b.color"></span> {{ b.label }}</span>
      </div>
    </div>
  `,
  styles: [`
    :host { display:block; }
    .panelp { padding:18px; margin-bottom:18px; }
    .head { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; margin-bottom:10px; }
    .head h3 { margin:0; font-size:15px; font-weight:700; }
    .sub { margin:2px 0 0; font-size:12px; color:var(--plat-muted); }
    .actions { display:flex; gap:6px; }
    .exp { display:inline-flex; align-items:center; gap:4px; padding:4px 10px; border:1px solid var(--plat-border); border-radius:6px; background:#fff; font-size:12px; cursor:pointer; color:#334155; }
    .exp:hover { background:#f8fafc; }
    .exp .material-symbols-rounded { font-size:14px; }
    .tbl { width:100%; border-collapse:collapse; font-size:13px; }
    .tbl th, .tbl td { padding:10px; border-bottom:1px solid var(--plat-border); text-align:left; }
    .tbl th { font-size:11px; color:var(--plat-muted); text-transform:uppercase; letter-spacing:.04em; }
    .tbl .c { text-align:center; width:70px; }
    .name { font-weight:600; color:#0f172a; }
    .dot { display:inline-block; width:14px; height:14px; border-radius:50%; }
    .dot.sm { width:10px; height:10px; vertical-align:-1px; }
    .legend { display:flex; flex-wrap:wrap; gap:16px; margin-top:12px; font-size:12px; color:#475569; }
    .none { text-align:center; color:var(--plat-muted); padding:24px; }
  `],
})
export class DirectorateHeatmapComponent {
  private readonly api = inject(ApiService);
  readonly cycles = inject(CycleStore);
  readonly bands = BANDS;

  // The heatmap always shows the full year (Q1–Q4), independent of the
  // dashboard period filter.
  readonly data = toSignal<HeatmapData | null>(
    toObservable(this.cycles.cycleId).pipe(
      switchMap((cid) => {
        if (!cid) return of(null);
        return this.api.get<HeatmapData>('/dashboards/directorate-heatmap', { cycleId: cid })
          .pipe(catchError(() => of(null)));
      }),
    ),
    { initialValue: null },
  );

  readonly rows = computed(() => this.data()?.directorates ?? []);
  readonly quarterCols = computed(() =>
    this.rows()[0]?.quarters.map(q => q.quarter) ?? [1, 2, 3, 4]);

  color(q: HeatQuarter): string { return heatCellColor(q); }
  label(q: HeatQuarter): string { return heatCellLabel(q); }

  private cycleLabel(): string {
    const cid = this.cycles.cycleId();
    return this.cycles.cycles().find(c => c.id === cid)?.financialYearLabel ?? '';
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

  private tableHtml(): string {
    const rows = this.rows().map(d => {
      const cells = d.quarters.map(q =>
        `<td style="padding:6px 12px;border:1px solid #cbd5e1;text-align:center;background:${heatCellColor(q)};color:#0f172a;">${this.esc(heatCellLabel(q))}</td>`
      ).join('');
      return `<tr><td style="padding:6px 12px;border:1px solid #cbd5e1;font-weight:600;">${this.esc(d.directorateName)}</td>${cells}</tr>`;
    }).join('');
    const legend = this.bands.map(b => `<span style="color:${b.color};">&#9679;</span> ${this.esc(b.label)}`).join(' &nbsp; ');
    return `<h1 style="font-family:Arial,sans-serif;font-size:18px;color:#1e3a8a;">Directorate Heat Map</h1>
      <p style="font-family:Arial,sans-serif;font-size:12px;color:#64748b;">Quarterly performance at a glance, per directorate — Cycle: ${this.esc(this.cycleLabel())}</p>
      <table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:13px;">
        <tr><th style="padding:6px 12px;border:1px solid #cbd5e1;text-align:left;">Directorate</th>${this.quarterCols().map(q => `<th style="padding:6px 12px;border:1px solid #cbd5e1;">Q${q}</th>`).join('')}</tr>
        ${rows}
      </table>
      <p style="font-family:Arial,sans-serif;font-size:11px;color:#64748b;">Legend: ${legend}</p>`;
  }

  exportExcel(): void {
    const html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body>${this.tableHtml()}</body></html>`;
    this.downloadBlob(new Blob([html], { type: 'application/vnd.ms-excel' }), 'directorate-heat-map.xls');
  }

  exportWord(): void {
    const html = `<html xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"></head><body>${this.tableHtml()}</body></html>`;
    this.downloadBlob(new Blob([html], { type: 'application/msword' }), 'directorate-heat-map.doc');
  }

  async exportPdf(): Promise<void> {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.setTextColor('#1e3a8a');
    doc.text('Directorate Heat Map', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.setTextColor('#64748b');
    doc.text(`Quarterly performance at a glance, per directorate — Cycle: ${this.cycleLabel()}`, 105, 28, { align: 'center' });

    let y = 42;
    doc.setFontSize(10);
    doc.setTextColor('#64748b');
    doc.text('DIRECTORATE', 20, y);
    const qx = [120, 140, 160, 180];
    this.quarterCols().forEach((q, i) => doc.text(`Q${q}`, qx[i], y, { align: 'center' }));
    y += 4;
    doc.setDrawColor('#cbd5e1');
    doc.line(20, y, 190, y);
    y += 8;

    doc.setFontSize(11);
    for (const d of this.rows()) {
      doc.setTextColor('#0f172a');
      doc.text(d.directorateName.length > 45 ? d.directorateName.slice(0, 44) + '…' : d.directorateName, 20, y);
      d.quarters.forEach((q, i) => {
        doc.setFillColor(heatCellColor(q));
        doc.circle(qx[i], y - 1.5, 2.5, 'F');
      });
      y += 10;
      if (y > 270) { doc.addPage(); y = 20; }
    }

    y += 4;
    doc.setFontSize(9);
    let x = 20;
    for (const b of this.bands) {
      doc.setFillColor(b.color);
      doc.circle(x, y - 1, 1.8, 'F');
      doc.setTextColor('#475569');
      doc.text(b.label, x + 4, y);
      x += doc.getTextWidth(b.label) + 14;
    }

    doc.save('directorate-heat-map.pdf');
  }
}
