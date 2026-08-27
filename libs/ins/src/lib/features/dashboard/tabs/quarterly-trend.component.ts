import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface QuarterlyTrendQuarter {
  quarter: number;
  score: number | null;
  target: number;
}

interface ChartPoint { x: number; y: number; value: number; quarter: number; }

const MONTHS = ['Jul – Sep', 'Oct – Dec', 'Jan – Mar', 'Apr – Jun'];

@Component({
  selector: 'app-quarterly-trend',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="plat-card panelq">
      <div class="head">
        <div>
          <h3>Quarterly Performance Trend</h3>
          <p class="sub">Organisational average score vs. target, per quarter</p>
        </div>
        <div class="actions" *ngIf="hasData()">
          <button class="exp" (click)="exportExcel()"><span class="material-symbols-rounded">download</span> Excel</button>
          <button class="exp" (click)="exportPdf()"><span class="material-symbols-rounded">download</span> PDF</button>
          <button class="exp" (click)="exportWord()"><span class="material-symbols-rounded">download</span> Word</button>
        </div>
      </div>

      <ng-container *ngIf="hasData(); else noData">
        <div class="tiles">
          <div class="tile blue">
            <span class="material-symbols-rounded ticon">trending_up</span>
            <div class="tval">{{ currentScore() | number:'1.0-1' }}%</div>
            <div class="tname">Current Quarter</div>
            <div class="tsub">{{ changeLabel() }}</div>
          </div>
          <div class="tile" [class.green]="onTrack()" [class.grey]="!onTrack()">
            <span class="material-symbols-rounded ticon">{{ onTrack() ? 'task_alt' : 'schedule' }}</span>
            <div class="tval">{{ progressToTarget() | number:'1.0-0' }}%</div>
            <div class="tname">{{ onTrack() ? 'On Track to Target' : 'Below Target' }}</div>
            <div class="tsub">Progress to Target</div>
          </div>
          <div class="tile grey">
            <span class="material-symbols-rounded ticon">bar_chart</span>
            <div class="tval">{{ ytdAverage() | number:'1.0-1' }}%</div>
            <div class="tname">Year to Date Average</div>
            <div class="tsub">Average Performance</div>
          </div>
          <div class="tile plain">
            <span class="material-symbols-rounded ticon">show_chart</span>
            <div class="tval">{{ changePp() > 0 ? '+' : '' }}{{ changePp() | number:'1.0-1' }}pp</div>
            <div class="tname">vs Q{{ prevQuarterNo() }}</div>
            <div class="tsub">{{ changePp() > 0 ? 'Improving' : changePp() < 0 ? 'Declining' : 'No Change' }}</div>
          </div>
          <div class="tile plain">
            <span class="material-symbols-rounded ticon">flag</span>
            <div class="tval">{{ annualTarget() | number:'1.0-0' }}%</div>
            <div class="tname">Annual Target</div>
            <div class="tsub">Maintain Focus</div>
          </div>
        </div>

        <svg [attr.viewBox]="'0 0 ' + W + ' ' + H" class="chart" role="img" aria-label="Quarterly performance trend line chart">
          <!-- gridlines -->
          <ng-container *ngFor="let g of gridlines()">
            <line [attr.x1]="PAD_L" [attr.x2]="W - PAD_R" [attr.y1]="g.y" [attr.y2]="g.y"
                  stroke="#e2e8f0" stroke-width="1" [attr.stroke-dasharray]="g.value === 0 ? null : '3 4'" />
            <text [attr.x]="PAD_L - 8" [attr.y]="g.y + 3" text-anchor="end" class="axis">{{ g.value }}</text>
          </ng-container>

          <!-- target line -->
          <polyline *ngIf="targetPoints().length > 1" [attr.points]="pointsAttr(targetPoints())"
                    fill="none" stroke="#10b981" stroke-width="2" stroke-dasharray="5 5" />
          <ng-container *ngFor="let p of targetPoints()">
            <line [attr.x1]="clampX(p.x - 14)" [attr.x2]="clampX(p.x + 14)" [attr.y1]="p.y" [attr.y2]="p.y"
                  stroke="#10b981" stroke-width="2" stroke-dasharray="5 5" />
            <circle [attr.cx]="p.x" [attr.cy]="p.y" r="3.5" fill="#10b981" stroke="#fff" stroke-width="1.5" />
          </ng-container>

          <!-- actual line -->
          <polyline *ngIf="actualPoints().length > 1" [attr.points]="pointsAttr(actualPoints())"
                    fill="none" stroke="#2563eb" stroke-width="2.5" />
          <ng-container *ngFor="let p of actualPoints()">
            <circle [attr.cx]="p.x" [attr.cy]="p.y" r="4" fill="#2563eb" stroke="#fff" stroke-width="1.5" />
            <g [attr.transform]="'translate(' + badgeX(p) + ',' + (p.y - 22) + ')'">
              <rect x="-21" y="0" width="42" height="15" rx="7.5" fill="#0f172a" />
              <text x="0" y="10.5" text-anchor="middle" class="badge">{{ p.value | number:'1.0-1' }}%</text>
            </g>
          </ng-container>

          <!-- x axis labels -->
          <ng-container *ngFor="let p of allPoints(); let i = index">
            <text [attr.x]="p.x" [attr.y]="H - 22" text-anchor="middle" class="xq">Q{{ p.quarter }}</text>
            <text [attr.x]="p.x" [attr.y]="H - 8" text-anchor="middle" class="xm">{{ months[p.quarter - 1] }}</text>
          </ng-container>
        </svg>

        <div class="legend">
          <span class="li"><span class="dot" style="background:#10b981"></span>Target</span>
          <span class="li"><span class="dot" style="background:#2563eb"></span>Actual Score</span>
        </div>
      </ng-container>

      <ng-template #noData><p class="empty">No performance data captured yet</p></ng-template>
    </div>
  `,
  styles: [`
    :host { display:block; }
    .panelq { padding:18px; margin-bottom:18px; }
    .panelq h3 { margin:0; font-size:15px; font-weight:600; }
    .sub { margin:4px 0 14px; font-size:12px; color:var(--plat-muted); }
    .head { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; }
    .actions { display:flex; gap:6px; }
    .exp { display:inline-flex; align-items:center; gap:4px; padding:4px 10px; border:1px solid var(--plat-border); border-radius:6px; background:#fff; font-size:12px; cursor:pointer; color:#334155; }
    .exp:hover { background:#f8fafc; }
    .exp .material-symbols-rounded { font-size:14px; }
    .tiles { display:grid; grid-template-columns:repeat(auto-fit, minmax(150px, 1fr)); gap:12px; margin-bottom:16px; }
    .tile { border:1px solid var(--plat-border); border-radius:10px; padding:12px 14px; }
    .tile.blue { background:#eff6ff; border-color:#bfdbfe; }
    .tile.green { background:#ecfdf5; border-color:#a7f3d0; }
    .tile.grey { background:#f8fafc; }
    .ticon { font-size:18px; color:#64748b; }
    .tile.blue .ticon { color:#2563eb; }
    .tile.green .ticon { color:#10b981; }
    .tval { font-size:20px; font-weight:800; margin-top:2px; }
    .tile.blue .tval { color:#1d4ed8; }
    .tile.green .tval { color:#059669; }
    .tname { font-size:12px; font-weight:600; margin-top:2px; }
    .tsub { font-size:11px; color:var(--plat-muted); margin-top:1px; }
    .chart { width:100%; height:auto; display:block; }
    .axis { font-size:9px; fill:#94a3b8; }
    .badge { font-size:8.5px; font-weight:700; fill:#fff; }
    .xq { font-size:10px; font-weight:700; fill:#334155; }
    .xm { font-size:8.5px; fill:#94a3b8; }
    .legend { display:flex; justify-content:center; gap:20px; margin-top:6px; }
    .li { display:flex; align-items:center; gap:6px; font-size:12px; color:#334155; }
    .dot { width:9px; height:9px; border-radius:50%; display:inline-block; }
    .empty { text-align:center; color:var(--plat-muted); padding:24px; }
  `],
})
export class QuarterlyTrendComponent {
  private readonly host = inject(ElementRef<HTMLElement>);
  readonly quarters = input<QuarterlyTrendQuarter[]>([]);
  readonly cycleLabel = input<string>('');

  readonly W = 900;
  readonly H = 300;
  readonly PAD_L = 40;
  readonly PAD_R = 20;
  readonly PAD_T = 30;
  readonly PAD_B = 44;
  readonly months = MONTHS;

  private x(quarter: number): number {
    const usable = this.W - this.PAD_L - this.PAD_R;
    return this.PAD_L + ((quarter - 1) / 3) * usable;
  }
  private y(value: number): number {
    const usable = this.H - this.PAD_T - this.PAD_B;
    return this.PAD_T + (1 - Math.max(0, Math.min(100, value)) / 100) * usable;
  }

  readonly withScores = computed(() => this.quarters().filter(q => q.score !== null));
  readonly hasData = computed(() => this.withScores().length > 0);

  readonly gridlines = computed(() =>
    [0, 25, 50, 75, 100].map(v => ({ value: v, y: this.y(v) })),
  );

  readonly allPoints = computed<ChartPoint[]>(() =>
    this.quarters().map(q => ({ x: this.x(q.quarter), y: 0, value: 0, quarter: q.quarter })),
  );

  readonly actualPoints = computed<ChartPoint[]>(() =>
    this.withScores().map(q => ({
      x: this.x(q.quarter), y: this.y(q.score!), value: q.score!, quarter: q.quarter,
    })),
  );

  readonly targetPoints = computed<ChartPoint[]>(() =>
    this.quarters().map(q => ({
      x: this.x(q.quarter), y: this.y(q.target), value: q.target, quarter: q.quarter,
    })),
  );

  pointsAttr(pts: ChartPoint[]): string {
    return pts.map(p => `${p.x},${p.y}`).join(' ');
  }

  clampX(x: number): number {
    return Math.max(this.PAD_L, Math.min(this.W - this.PAD_R, x));
  }

  badgeX(p: ChartPoint): number {
    return Math.max(this.PAD_L + 21, Math.min(this.W - this.PAD_R - 21, p.x));
  }

  readonly currentQuarterNo = computed(() => {
    const s = this.withScores();
    return s.length ? s[s.length - 1].quarter : 0;
  });
  readonly currentScore = computed(() => {
    const s = this.withScores();
    return s.length ? s[s.length - 1].score! : 0;
  });
  readonly prevQuarterNo = computed(() => {
    const s = this.withScores();
    return s.length > 1 ? s[s.length - 2].quarter : Math.max(1, this.currentQuarterNo() - 1);
  });
  readonly changePp = computed(() => {
    const s = this.withScores();
    if (s.length < 2) return 0;
    return Math.round((s[s.length - 1].score! - s[s.length - 2].score!) * 10) / 10;
  });
  readonly changeLabel = computed(() => {
    const pp = this.changePp();
    return `${pp > 0 ? '+' : ''}${pp}pp vs Q${this.prevQuarterNo()}`;
  });
  readonly ytdAverage = computed(() => {
    const s = this.withScores();
    if (!s.length) return 0;
    return s.reduce((sum, q) => sum + q.score!, 0) / s.length;
  });
  readonly annualTarget = computed(() => {
    const qs = this.quarters();
    return qs.length ? qs[qs.length - 1].target : 100;
  });
  readonly progressToTarget = computed(() => {
    const t = this.annualTarget();
    return t > 0 ? Math.min(100, (this.currentScore() / t) * 100) : 0;
  });
  readonly onTrack = computed(() => this.currentScore() >= this.annualTarget() * 0.9);

  private summaryRows(): Array<[string, string]> {
    const pp = this.changePp();
    return [
      ['Current Quarter Score', `${this.currentScore().toFixed(1)}%`],
      ['Change vs Q' + this.prevQuarterNo(), `${pp > 0 ? '+' : ''}${pp.toFixed(1)}pp`],
      ['Progress to Target', `${this.progressToTarget().toFixed(0)}%`],
      ['Status', this.onTrack() ? 'On Track to Target' : 'Below Target'],
      ['Year to Date Average', `${this.ytdAverage().toFixed(1)}%`],
      ['Annual Target', `${this.annualTarget().toFixed(0)}%`],
      ...this.quarters().map((q): [string, string] => [
        `Q${q.quarter} (${MONTHS[q.quarter - 1]})`,
        q.score !== null ? `${q.score.toFixed(1)}% (target ${q.target.toFixed(0)}%)` : `No data (target ${q.target.toFixed(0)}%)`,
      ]),
    ];
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

  private async chartPng(): Promise<{ dataUrl: string; width: number; height: number } | null> {
    const svg = this.host.nativeElement.querySelector('svg.chart') as SVGSVGElement | null;
    if (!svg) return null;
    const clone = svg.cloneNode(true) as SVGSVGElement;
    const origEls = svg.querySelectorAll('*');
    const cloneEls = clone.querySelectorAll('*');
    const props = ['fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-dasharray', 'font-size', 'font-weight', 'font-family', 'letter-spacing', 'text-anchor'];
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

  private chartImgHtml(png: { dataUrl: string; width: number; height: number } | null): string {
    if (!png) return '';
    const w = Math.round(png.width / 3);
    const h = Math.round(png.height / 3);
    return `<div><img src="${png.dataUrl}" width="${w}" height="${h}" alt="Quarterly performance trend chart" /></div>
      <p style="font-family:Arial,sans-serif;font-size:11px;color:#334155;margin:4px 0 10px;">
        <span style="color:#10b981;font-weight:700;">&#9679;</span> Target &nbsp;
        <span style="color:#2563eb;font-weight:700;">&#9679;</span> Actual Score</p>`;
  }

  private summaryHtml(): string {
    const rows = this.summaryRows()
      .map(([k, v]) => `<tr><td style="padding:6px 12px;border:1px solid #cbd5e1;font-weight:600;">${this.esc(k)}</td><td style="padding:6px 12px;border:1px solid #cbd5e1;">${this.esc(v)}</td></tr>`)
      .join('');
    const cycle = this.cycleLabel() ? ` — Cycle: ${this.esc(this.cycleLabel())}` : '';
    return `<h1 style="font-family:Arial,sans-serif;font-size:18px;color:#1e3a8a;">Quarterly Performance Trend</h1>
      <p style="font-family:Arial,sans-serif;font-size:12px;color:#64748b;">Organisational average score vs. target, per quarter${cycle}</p>
      <table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:13px;">${rows}</table>`;
  }

  async exportExcel(): Promise<void> {
    const png = await this.chartPng();
    const html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body>${this.summaryHtml()}${this.chartImgHtml(png)}</body></html>`;
    this.downloadBlob(new Blob([html], { type: 'application/vnd.ms-excel' }), 'quarterly-performance-trend.xls');
  }

  async exportWord(): Promise<void> {
    const png = await this.chartPng();
    const html = `<html xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"></head><body>${this.summaryHtml()}${this.chartImgHtml(png)}</body></html>`;
    this.downloadBlob(new Blob([html], { type: 'application/msword' }), 'quarterly-performance-trend.doc');
  }

  async exportPdf(): Promise<void> {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.setTextColor('#1e3a8a');
    doc.text('Quarterly Performance Trend', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.setTextColor('#64748b');
    const cycle = this.cycleLabel() ? ` — Cycle: ${this.cycleLabel()}` : '';
    doc.text(`Organisational average score vs. target, per quarter${cycle}`, 105, 28, { align: 'center' });

    let y = 38;
    const png = await this.chartPng();
    if (png) {
      const imgW = 170;
      const imgH = imgW * (png.height / png.width);
      doc.addImage(png.dataUrl, 'PNG', 105 - imgW / 2, y, imgW, imgH);
      y += imgH + 12;
    }

    doc.setFontSize(11);
    doc.setTextColor('#1e293b');
    for (const [k, v] of this.summaryRows()) {
      if (y > 280) { doc.addPage(); y = 20; }
      doc.text(k, 30, y);
      doc.text(v, 150, y);
      y += 8;
    }
    doc.save('quarterly-performance-trend.pdf');
  }
}
