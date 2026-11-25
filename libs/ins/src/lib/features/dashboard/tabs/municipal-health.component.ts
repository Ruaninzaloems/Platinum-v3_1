import { ChangeDetectionStrategy, Component, ElementRef, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, of, switchMap } from 'rxjs';
import { ApiService } from '@ins-core/services/api.service';
import { CycleStore } from './cycle-picker';

interface MunicipalHealthData {
  performance?: number;
  evidenceCompliance?: number;
  workflowEfficiency?: number;
  composite?: number;
  band?: string;
  hasData?: boolean;
}

interface HealthBand { from: number; to: number; color: string; label: string; }

const HEALTH_BANDS: HealthBand[] = [
  { from: 0, to: 50, color: '#e53935', label: 'CRITICAL' },
  { from: 50, to: 75, color: '#fb8c00', label: 'NEEDS ATTENTION' },
  { from: 75, to: 90, color: '#fbc02d', label: 'GOOD STANDING' },
  { from: 90, to: 100, color: '#43a047', label: 'EXCELLENT' },
];

export function healthBandFor(value: number): HealthBand {
  if (value >= 90) return HEALTH_BANDS[3];
  if (value >= 75) return HEALTH_BANDS[2];
  if (value >= 50) return HEALTH_BANDS[1];
  return HEALTH_BANDS[0];
}

function barColor(value: number): string {
  if (value >= 90) return '#22c55e';
  if (value >= 75) return '#fbc02d';
  if (value >= 50) return '#fb8c00';
  return '#ef4444';
}

@Component({
  selector: 'app-municipal-health',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="plat-card panelp">
      <div class="head">
        <div>
          <h3 class="title"><span class="material-symbols-rounded ic">health_and_safety</span> MUNICIPAL HEALTH SCORE</h3>
          <p class="sub">Composite assessment across performance and compliance dimensions</p>
        </div>
        <div class="actions">
          <button class="exp" (click)="exportExcel()"><span class="material-symbols-rounded">download</span> Excel</button>
          <button class="exp" (click)="exportPdf()"><span class="material-symbols-rounded">download</span> PDF</button>
          <button class="exp" (click)="exportWord()"><span class="material-symbols-rounded">download</span> Word</button>
        </div>
      </div>

      <div class="body">
        <div class="gaugecol">
          <svg viewBox="0 0 240 138" class="mh-gauge-svg" role="img" [attr.aria-label]="'Municipal health score: ' + composite().toFixed(1) + '%'">
            <path *ngFor="let a of arcs()" [attr.d]="a.path" [attr.stroke]="a.color" stroke-width="22" fill="none" stroke-linecap="butt" />
            <text *ngFor="let t of ticks()" [attr.x]="t.x" [attr.y]="t.y" text-anchor="middle" class="tick">{{ t.text }}</text>
            <line [attr.x1]="cx" [attr.y1]="cy" [attr.x2]="needle().x" [attr.y2]="needle().y"
                  stroke="#1e293b" stroke-width="3.5" stroke-linecap="round" />
            <circle [attr.cx]="cx" [attr.cy]="cy" r="7" fill="#1e293b" />
            <circle [attr.cx]="cx" [attr.cy]="cy" r="3" fill="#fff" />
          </svg>
          <div class="val" [style.color]="statusColor()">{{ composite() | number:'1.0-0' }}%</div>
          <div class="status" [style.color]="statusColor()">{{ statusLabel() }}</div>
          <div class="pill" [style.color]="statusColor()">{{ composite() | number:'1.0-0' }}% Overall</div>
        </div>

        <div class="breakcol">
          <div class="brk-head">
            <span>Score Breakdown</span>
            <span class="brk-pct">Percentage</span>
          </div>
          <div class="brk-row" *ngFor="let r of breakdownRows()">
            <span class="material-symbols-rounded brk-ic">{{ r.icon }}</span>
            <span class="brk-name">{{ r.name }}</span>
            <div class="brk-bar"><div class="brk-fill" [style.width.%]="r.value" [style.background]="r.color"></div></div>
            <span class="brk-val" [style.color]="r.color">{{ r.value | number:'1.0-1' }}%</span>
          </div>
          <div class="brk-total">
            <span>Composite Health Score</span>
            <span [style.color]="statusColor()">{{ composite() | number:'1.0-0' }}%</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display:block; }
    .panelp { padding:18px; margin-bottom:18px; }
    .head { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; margin-bottom:10px; }
    .title { margin:0; font-size:15px; font-weight:700; letter-spacing:.03em; color:#0f172a; display:flex; align-items:center; gap:6px; }
    .title .ic { font-size:18px; color:#1e3a8a; }
    .sub { margin:2px 0 0; font-size:12px; color:var(--plat-muted); }
    .actions { display:flex; gap:6px; }
    .exp { display:inline-flex; align-items:center; gap:4px; padding:4px 10px; border:1px solid var(--plat-border); border-radius:6px; background:#fff; font-size:12px; cursor:pointer; color:#334155; }
    .exp:hover { background:#f8fafc; }
    .exp .material-symbols-rounded { font-size:14px; }
    .body { display:flex; gap:28px; align-items:flex-start; flex-wrap:wrap; }
    .gaugecol { display:flex; flex-direction:column; align-items:center; flex:0 0 260px; }
    .mh-gauge-svg { width:240px; max-width:100%; }
    .tick { font-size:10px; font-weight:700; fill:#1e293b; }
    .val { font-size:30px; font-weight:800; margin-top:-4px; }
    .status { font-size:12px; font-weight:700; letter-spacing:.06em; }
    .pill { margin-top:6px; padding:2px 12px; border-radius:999px; background:#fef9c3; font-size:12px; font-weight:700; }
    .breakcol { flex:1; min-width:320px; border-left:3px solid #1e3a8a; padding-left:18px; }
    .brk-head { display:flex; justify-content:space-between; font-size:13px; font-weight:700; color:#0f172a; padding-bottom:8px; border-bottom:1px solid var(--plat-border); }
    .brk-pct { font-size:11px; font-weight:600; color:#64748b; background:#f1f5f9; padding:2px 8px; border-radius:6px; }
    .brk-row { display:flex; align-items:center; gap:10px; padding:12px 0; border-bottom:1px solid var(--plat-border); }
    .brk-ic { font-size:16px; color:#1e3a8a; background:#eef2ff; border-radius:6px; padding:4px; }
    .brk-name { font-size:13px; font-weight:600; color:#0f172a; width:160px; flex-shrink:0; }
    .brk-bar { flex:1; height:8px; background:#e2e8f0; border-radius:999px; overflow:hidden; }
    .brk-fill { height:100%; border-radius:999px; }
    .brk-val { width:56px; text-align:right; font-size:13px; font-weight:700; }
    .brk-total { display:flex; justify-content:space-between; padding-top:12px; font-size:13px; font-weight:700; color:#0f172a; }
  `],
})
export class MunicipalHealthComponent {
  private readonly api = inject(ApiService);
  private readonly host = inject(ElementRef<HTMLElement>);
  readonly cycles = inject(CycleStore);

  readonly cx = 120;
  readonly cy = 118;

  // Health score is a full-year (Q1–Q4) view, independent of the dashboard
  // period filter.
  readonly data = toSignal<MunicipalHealthData | null>(
    toObservable(this.cycles.cycleId).pipe(
      switchMap((cid) => {
        if (!cid) return of(null);
        return this.api.get<MunicipalHealthData>('/dashboards/municipal-health', { cycleId: cid })
          .pipe(catchError(() => of(null)));
      }),
    ),
    { initialValue: null },
  );

  readonly hasData = computed(() => this.data()?.hasData === true);
  readonly composite = computed(() => Math.max(0, Math.min(100, this.data()?.composite ?? 0)));
  readonly statusLabel = computed(() => this.hasData() ? (this.data()?.band ?? healthBandFor(this.composite()).label) : 'NO DATA');
  readonly statusColor = computed(() => this.hasData() ? healthBandFor(this.composite()).color : '#94a3b8');

  readonly breakdownRows = computed(() => {
    const d = this.data();
    return [
      { name: 'Performance', icon: 'monitoring', value: d?.performance ?? 0, color: barColor(d?.performance ?? 0) },
      { name: 'Evidence Compliance', icon: 'description', value: d?.evidenceCompliance ?? 0, color: barColor(d?.evidenceCompliance ?? 0) },
      { name: 'Workflow Efficiency', icon: 'account_tree', value: d?.workflowEfficiency ?? 0, color: barColor(d?.workflowEfficiency ?? 0) },
    ];
  });

  private toArc(value: number): number {
    const i = HEALTH_BANDS.findIndex(b => value <= b.to);
    const idx = i === -1 ? HEALTH_BANDS.length - 1 : i;
    const b = HEALTH_BANDS[idx];
    const frac = (value - b.from) / (b.to - b.from);
    return (idx + Math.max(0, Math.min(1, frac))) * 25;
  }

  private point(pct: number, radius: number): { x: number; y: number } {
    const angle = Math.PI * (1 - this.toArc(pct) / 100);
    return { x: this.cx + radius * Math.cos(angle), y: this.cy - radius * Math.sin(angle) };
  }

  readonly arcs = computed(() =>
    HEALTH_BANDS.map(b => {
      const r = 78;
      const s = this.point(b.from, r);
      const e = this.point(b.to, r);
      return { color: b.color, path: `M ${s.x} ${s.y} A ${r} ${r} 0 0 1 ${e.x} ${e.y}` };
    }),
  );

  readonly ticks = computed(() =>
    [0, 50, 75, 90, 100].map(v => {
      const p = this.point(v, 102);
      return { text: v + '%', x: p.x, y: p.y + 4 };
    }),
  );

  readonly needle = computed(() => this.point(this.hasData() ? this.composite() : 0, 62));

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

  private summaryRows(): Array<[string, string]> {
    const d = this.data();
    return [
      ['Performance', `${(d?.performance ?? 0).toFixed(1)}%`],
      ['Evidence Compliance', `${(d?.evidenceCompliance ?? 0).toFixed(1)}%`],
      ['Workflow Efficiency', `${(d?.workflowEfficiency ?? 0).toFixed(1)}%`],
      ['Composite Health Score', `${this.composite().toFixed(1)}%`],
      ['Status', this.statusLabel()],
    ];
  }

  private tableHtml(): string {
    const rows = this.summaryRows()
      .map(([k, v]) => `<tr><td style="padding:6px 12px;border:1px solid #cbd5e1;font-weight:600;">${this.esc(k)}</td><td style="padding:6px 12px;border:1px solid #cbd5e1;">${this.esc(v)}</td></tr>`)
      .join('');
    return `<h1 style="font-family:Arial,sans-serif;font-size:18px;color:#1e3a8a;">Municipal Health Score</h1>
      <p style="font-family:Arial,sans-serif;font-size:12px;color:#64748b;">Composite assessment across performance and compliance dimensions — Cycle: ${this.esc(this.cycleLabel())}</p>
      <table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:13px;">${rows}</table>`;
  }

  private async gaugePng(): Promise<{ dataUrl: string; width: number; height: number } | null> {
    const svg = this.host.nativeElement.querySelector('svg.mh-gauge-svg') as SVGSVGElement | null;
    if (!svg) return null;
    const clone = svg.cloneNode(true) as SVGSVGElement;
    const origEls = svg.querySelectorAll('*');
    const cloneEls = clone.querySelectorAll('*');
    const props = ['fill', 'stroke', 'stroke-width', 'stroke-linecap', 'font-size', 'font-weight', 'font-family', 'letter-spacing', 'text-anchor'];
    origEls.forEach((el, i) => {
      const target = cloneEls[i] as SVGElement;
      const cs = getComputedStyle(el);
      for (const p of props) {
        const v = cs.getPropertyValue(p);
        if (v) target.style.setProperty(p, v);
      }
    });
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

  private gaugeImgHtml(png: { dataUrl: string; width: number; height: number } | null): string {
    if (!png) return '';
    const w = Math.round(png.width / 3);
    const h = Math.round(png.height / 3);
    return `<div><img src="${png.dataUrl}" width="${w}" height="${h}" alt="Municipal health gauge" /></div>
      <p style="font-family:Arial,sans-serif;font-size:22px;font-weight:800;color:${this.statusColor()};margin:2px 0;">${this.esc(this.composite().toFixed(0) + '%')}</p>
      <p style="font-family:Arial,sans-serif;font-size:12px;font-weight:700;color:${this.statusColor()};margin:0 0 10px;">${this.esc(this.statusLabel())}</p>`;
  }

  async exportExcel(): Promise<void> {
    const png = await this.gaugePng();
    const html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body>${this.tableHtml()}${this.gaugeImgHtml(png)}</body></html>`;
    this.downloadBlob(new Blob([html], { type: 'application/vnd.ms-excel' }), 'municipal-health-score.xls');
  }

  async exportWord(): Promise<void> {
    const png = await this.gaugePng();
    const html = `<html xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"></head><body>${this.gaugeImgHtml(png)}${this.tableHtml()}</body></html>`;
    this.downloadBlob(new Blob([html], { type: 'application/msword' }), 'municipal-health-score.doc');
  }

  async exportPdf(): Promise<void> {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.setTextColor('#1e3a8a');
    doc.text('Municipal Health Score', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.setTextColor('#64748b');
    doc.text(`Composite assessment across performance and compliance dimensions — Cycle: ${this.cycleLabel()}`, 105, 28, { align: 'center' });

    let y = 40;
    const png = await this.gaugePng();
    if (png) {
      const imgW = 90;
      const imgH = imgW * (png.height / png.width);
      doc.addImage(png.dataUrl, 'PNG', 105 - imgW / 2, y, imgW, imgH);
      y += imgH + 8;
    }

    doc.setFontSize(26);
    doc.setTextColor(this.statusColor());
    doc.text(`${this.composite().toFixed(0)}%`, 105, y, { align: 'center' });
    y += 8;
    doc.setFontSize(12);
    doc.text(this.statusLabel(), 105, y, { align: 'center' });
    y += 18;

    doc.setFontSize(11);
    doc.setTextColor('#1e293b');
    for (const [k, v] of this.summaryRows()) {
      doc.text(k, 30, y);
      doc.text(v, 150, y);
      y += 8;
    }
    doc.save('municipal-health-score.pdf');
  }
}
