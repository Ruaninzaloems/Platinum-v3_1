import { ChangeDetectionStrategy, Component, ElementRef, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, combineLatest, of, switchMap } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { CycleStore, PeriodStore } from './cycle-picker';
import { PerformanceGaugeComponent, ratingFor } from './performance-gauge.component';
import { DirectorateHeatmapComponent } from './directorate-heatmap.component';
import { MunicipalHealthComponent } from './municipal-health.component';

interface OverviewData {
  orgSummary?: { totalKpis?: number; avgScore?: number; achievedPct?: number; };
}
interface ExecutiveData {
  totalKpis?: number;
  achieved?: number;
  notAchieved?: number;
  atRisk?: number;
  onHold?: number;
  weightedPerformance?: number;
}

@Component({
  selector: 'app-overview-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, PerformanceGaugeComponent, DirectorateHeatmapComponent, MunicipalHealthComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bar">
      <div>
        <h2>Overview Dashboard</h2>
        <p>Overall organisational performance</p>
      </div>
    </div>

    <ng-container *ngIf="cycles.cycleId(); else pick">
      <div class="plat-card panelp exec">
        <div class="exec__head">
          <div class="exec__spacer"></div>
          <div class="exec__titles">
            <h3 class="exec__title">EXECUTIVE PERFORMANCE OVERVIEW</h3>
            <p class="exec__sub">Overall Organisational Performance</p>
          </div>
          <div class="exec__actions">
            <button class="exp" (click)="exportExcel()"><span class="material-symbols-rounded">download</span> Excel</button>
            <button class="exp" (click)="exportPdf()"><span class="material-symbols-rounded">download</span> PDF</button>
            <button class="exp" (click)="exportWord()"><span class="material-symbols-rounded">download</span> Word</button>
          </div>
        </div>
        <app-performance-gauge [value]="score()" [hasData]="hasScore()"></app-performance-gauge>
        <div class="exec__legend">
          <span><span class="lg-icon">⭐</span> <b class="green2">EXCELLENT</b> ≥ 90%</span>
          <span><span class="lg-icon">😊</span> <b class="gold2">GOOD</b> 75% – 89%</span>
          <span><span class="lg-icon">😐</span> <b class="orange2">AVERAGE</b> 50% – 74%</span>
          <span><span class="lg-icon">😟</span> <b class="red2">POOR</b> &lt; 50%</span>
        </div>
      </div>

      <app-directorate-heatmap></app-directorate-heatmap>

      <app-municipal-health></app-municipal-health>
    </ng-container>

    <ng-template #pick><p class="empty">Select a performance cycle to view overview</p></ng-template>
  `,
  styles: [`
    :host { display:block; }
    .bar { display:flex; justify-content:space-between; align-items:flex-start; gap:16px; margin-bottom:18px; }
    .bar h2 { font-size:22px; font-weight:700; margin:0; }
    .bar p { color: var(--plat-muted); margin:4px 0 0; }
    .bar select { padding:8px 10px; border:1px solid var(--plat-border); border-radius:8px; background:#fff; }
    .panelp { padding:18px; margin-bottom:18px; }
    .empty { text-align:center; color:var(--plat-muted); padding:24px; }
    .exec { text-align:center; }
    .exec__head { display:flex; align-items:flex-start; gap:8px; }
    .exec__spacer { flex:1; }
    .exec__titles { flex:2; }
    .exec__title { margin:0; font-size:15px; font-weight:700; letter-spacing:.03em; color:#1e3a8a; }
    .exec__sub { margin:2px 0 0; font-size:12px; color:var(--plat-muted); }
    .exec__actions { flex:1; display:flex; justify-content:flex-end; gap:6px; }
    .exp { display:inline-flex; align-items:center; gap:4px; padding:4px 10px; border:1px solid var(--plat-border); border-radius:6px; background:#fff; font-size:12px; cursor:pointer; color:#334155; }
    .exp:hover { background:#f8fafc; }
    .exp .material-symbols-rounded { font-size:14px; }
    .exec__legend { display:flex; flex-wrap:wrap; gap:18px; justify-content:center; margin-top:10px; font-size:12px; color:#334155; }
    .lg-icon { font-size:13px; }
    .green2 { color:#43a047; } .gold2 { color:#f9a825; } .orange2 { color:#fb8c00; } .red2 { color:#e53935; }
  `],
})
export class OverviewTabComponent {
  private readonly api = inject(ApiService);
  private readonly host = inject(ElementRef<HTMLElement>);
  readonly cycles = inject(CycleStore);
  readonly periods = inject(PeriodStore);

  readonly data = toSignal<OverviewData | null>(
    combineLatest([toObservable(this.cycles.cycleId), toObservable(this.periods.period)]).pipe(
      switchMap(([cid, period]) => {
        if (!cid) return of(null);
        return this.api.get<OverviewData>('/dashboards/overview', { cycleId: cid, period })
          .pipe(catchError(() => of(null)));
      }),
    ),
    { initialValue: null },
  );

  readonly exec = toSignal<ExecutiveData | null>(
    combineLatest([toObservable(this.cycles.cycleId), toObservable(this.periods.period)]).pipe(
      switchMap(([cid, period]) => {
        if (!cid) return of(null);
        return this.api.get<ExecutiveData>('/dashboards/executive', { cycleId: cid, period })
          .pipe(catchError(() => of(null)));
      }),
    ),
    { initialValue: null },
  );

  readonly score = computed(() => this.exec()?.weightedPerformance ?? 0);
  readonly hasScore = computed(() => {
    const e = this.exec();
    return !!e && ((e.achieved ?? 0) + (e.notAchieved ?? 0) + (e.atRisk ?? 0) + (e.onHold ?? 0)) > 0;
  });

  private summaryRows(): Array<[string, string]> {
    const e = this.exec();
    const o = this.data()?.orgSummary;
    const rating = this.hasScore() ? ratingFor(this.score()).label : 'NO DATA';
    return [
      ['Overall Organisational Performance', this.hasScore() ? `${this.score().toFixed(1)}%` : 'No data'],
      ['Rating', rating],
      ['Total KPIs', String(o?.totalKpis ?? e?.totalKpis ?? 0)],
      ['Average Score', `${(o?.avgScore ?? 0).toFixed(1)}%`],
      ['Achievement Rate', `${(o?.achievedPct ?? 0).toFixed(1)}%`],
      ['Achieved', String(e?.achieved ?? 0)],
      ['Not Achieved', String(e?.notAchieved ?? 0)],
      ['At Risk', String(e?.atRisk ?? 0)],
      ['On Hold', String(e?.onHold ?? 0)],
    ];
  }

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

  private async gaugePng(): Promise<{ dataUrl: string; width: number; height: number } | null> {
    const svg = this.host.nativeElement.querySelector('svg.gauge__svg') as SVGSVGElement | null;
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
    const rating = this.hasScore() ? ratingFor(this.score()) : null;
    const color = rating ? rating.color : '#94a3b8';
    const value = this.hasScore() ? `${this.score().toFixed(1)}%` : '0.0%';
    const label = rating ? `${rating.label} PERFORMANCE` : 'NO DATA';
    return `<div><img src="${png.dataUrl}" width="${w}" height="${h}" alt="Performance gauge" /></div>
      <p style="font-family:Arial,sans-serif;font-size:22px;font-weight:800;color:${color};margin:2px 0;">${this.esc(value)}</p>
      <p style="font-family:Arial,sans-serif;font-size:12px;font-weight:700;color:${color};margin:0 0 10px;">${this.esc(label)}</p>`;
  }

  private summaryHtml(): string {
    const rows = this.summaryRows()
      .map(([k, v]) => `<tr><td style="padding:6px 12px;border:1px solid #cbd5e1;font-weight:600;">${this.esc(k)}</td><td style="padding:6px 12px;border:1px solid #cbd5e1;">${this.esc(v)}</td></tr>`)
      .join('');
    return `<h1 style="font-family:Arial,sans-serif;font-size:18px;color:#1e3a8a;">Executive Performance Overview</h1>
      <p style="font-family:Arial,sans-serif;font-size:12px;color:#64748b;">Overall Organisational Performance — Cycle: ${this.esc(this.cycleLabel())}</p>
      <table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:13px;">${rows}</table>`;
  }

  async exportExcel(): Promise<void> {
    const png = await this.gaugePng();
    const html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body>${this.summaryHtml()}${this.gaugeImgHtml(png)}</body></html>`;
    this.downloadBlob(new Blob([html], { type: 'application/vnd.ms-excel' }), 'executive-performance-overview.xls');
  }

  async exportWord(): Promise<void> {
    const png = await this.gaugePng();
    const html = `<html xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"></head><body>${this.gaugeImgHtml(png)}${this.summaryHtml()}</body></html>`;
    this.downloadBlob(new Blob([html], { type: 'application/msword' }), 'executive-performance-overview.doc');
  }

  async exportPdf(): Promise<void> {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    const rating = this.hasScore() ? ratingFor(this.score()) : null;

    doc.setFontSize(16);
    doc.setTextColor('#1e3a8a');
    doc.text('Executive Performance Overview', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.setTextColor('#64748b');
    doc.text(`Overall Organisational Performance — Cycle: ${this.cycleLabel()}`, 105, 28, { align: 'center' });

    let y = 40;
    const png = await this.gaugePng();
    if (png) {
      const imgW = 90;
      const imgH = imgW * (png.height / png.width);
      doc.addImage(png.dataUrl, 'PNG', 105 - imgW / 2, y, imgW, imgH);
      y += imgH + 8;
    }

    doc.setFontSize(26);
    doc.setTextColor(rating ? rating.color : '#94a3b8');
    doc.text(this.hasScore() ? `${this.score().toFixed(1)}%` : '0.0%', 105, y, { align: 'center' });
    y += 8;
    doc.setFontSize(12);
    doc.text(rating ? `${rating.label} PERFORMANCE` : 'NO DATA', 105, y, { align: 'center' });
    y += 18;

    doc.setFontSize(11);
    doc.setTextColor('#1e293b');
    for (const [k, v] of this.summaryRows()) {
      doc.text(k, 30, y);
      doc.text(v, 150, y);
      y += 8;
    }
    doc.save('executive-performance-overview.pdf');
  }

}
