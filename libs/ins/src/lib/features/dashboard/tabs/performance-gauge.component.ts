import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface GaugeBand { from: number; to: number; color: string; label: string; short: string; }

const BANDS: GaugeBand[] = [
  { from: 0, to: 50, color: '#e53935', label: 'POOR', short: 'POOR' },
  { from: 50, to: 75, color: '#fb8c00', label: 'AVERAGE', short: 'AVG' },
  { from: 75, to: 90, color: '#fbc02d', label: 'GOOD', short: 'GOOD' },
  { from: 90, to: 100, color: '#43a047', label: 'EXCELLENT', short: 'EXC' },
];

export function ratingFor(value: number): GaugeBand {
  if (value >= 90) return BANDS[3];
  if (value >= 75) return BANDS[2];
  if (value >= 50) return BANDS[1];
  return BANDS[0];
}

@Component({
  selector: 'app-performance-gauge',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="gauge">
      <svg viewBox="0 0 240 138" class="gauge__svg" role="img" [attr.aria-label]="'Performance gauge: ' + clamped().toFixed(1) + '%'">
        <path *ngFor="let b of arcs()" [attr.d]="b.path" [attr.stroke]="b.color" stroke-width="24" fill="none" stroke-linecap="butt" />
        <defs>
          <path *ngFor="let b of arcs()" [attr.id]="b.labelPathId" [attr.d]="b.path" fill="none" />
        </defs>
        <ng-container *ngFor="let b of arcs()">
          <text *ngIf="b.showLabel" class="gauge__bandlabel" dy="2.3">
            <textPath [attr.href]="'#' + b.labelPathId" startOffset="50%" text-anchor="middle">{{ b.label }}</textPath>
          </text>
        </ng-container>
        <text *ngFor="let t of ticks()" [attr.x]="t.x" [attr.y]="t.y" text-anchor="middle" class="gauge__tick">{{ t.text }}</text>
        <line [attr.x1]="cx" [attr.y1]="cy" [attr.x2]="needle().x" [attr.y2]="needle().y"
              stroke="#1e293b" stroke-width="3.5" stroke-linecap="round" />
        <circle [attr.cx]="cx" [attr.cy]="cy" r="7" fill="#1e293b" />
        <circle [attr.cx]="cx" [attr.cy]="cy" r="3" fill="#fff" />
      </svg>
      <div class="gauge__value" [style.color]="hasData() ? rating().color : '#94a3b8'">{{ (hasData() ? clamped() : 0) | number:'1.1-1' }}%</div>
      <div class="gauge__rating" [style.color]="hasData() ? rating().color : '#94a3b8'">
        {{ hasData() ? rating().label + ' PERFORMANCE' : 'NO DATA' }}
      </div>
    </div>
  `,
  styles: [`
    .gauge { display:flex; flex-direction:column; align-items:center; }
    .gauge__svg { width: 300px; max-width: 100%; }
    .gauge__tick { font-size: 10px; font-weight: 700; fill: #1e293b; }
    .gauge__bandlabel { font-size: 6.5px; font-weight: 700; fill: #fff; letter-spacing: .02em; }
    .gauge__value { font-size: 30px; font-weight: 800; margin-top: -4px; }
    .gauge__rating { font-size: 12px; font-weight: 700; letter-spacing: .06em; }
  `],
})
export class PerformanceGaugeComponent {
  readonly value = input<number>(0);
  readonly hasData = input<boolean>(true);

  readonly cx = 120;
  readonly cy = 118;
  private readonly uid = Math.random().toString(36).slice(2, 8);

  readonly clamped = computed(() => Math.max(0, Math.min(100, this.value() || 0)));
  readonly rating = computed(() => ratingFor(this.clamped()));

  private toArc(value: number): number {
    const i = BANDS.findIndex(b => value <= b.to);
    const b = BANDS[i === -1 ? BANDS.length - 1 : i];
    const idx = i === -1 ? BANDS.length - 1 : i;
    const frac = (value - b.from) / (b.to - b.from);
    return (idx + Math.max(0, Math.min(1, frac))) * 25;
  }

  private point(pct: number, radius: number): { x: number; y: number } {
    const angle = Math.PI * (1 - this.toArc(pct) / 100);
    return { x: this.cx + radius * Math.cos(angle), y: this.cy - radius * Math.sin(angle) };
  }

  readonly arcs = computed(() =>
    BANDS.map((b, i) => {
      const r = 78;
      const s = this.point(b.from, r);
      const e = this.point(b.to, r);
      const arcLength = 0.25 * Math.PI * r;
      const fits = (t: string) => t.length * 4.3 <= arcLength - 4;
      return {
        color: b.color,
        label: fits(b.label) ? b.label : b.short,
        showLabel: true,
        labelPathId: `gauge-band-${this.uid}-${i}`,
        path: `M ${s.x} ${s.y} A ${r} ${r} 0 0 1 ${e.x} ${e.y}`,
      };
    }),
  );

  readonly ticks = computed(() =>
    [0, 50, 75, 90, 100].map(v => {
      const p = this.point(v, 102);
      return { text: v + '%', x: p.x, y: p.y + 4 };
    }),
  );

  readonly needle = computed(() => this.point(this.hasData() ? this.clamped() : 0, 62));
}
