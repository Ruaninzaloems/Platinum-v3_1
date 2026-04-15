import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-gauge-chart',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './gauge-chart.component.html',
  styleUrl: './gauge-chart.component.css'
})
export class GaugeChartComponent {
  value = input.required<number>();
  label = input<string>('');
  thresholds = input<Array<{ value: number; color: string }>>([
    { value: 40, color: '#ef5350' },
    { value: 70, color: '#f59e0b' },
    { value: 100, color: '#4caf50' }
  ]);

  private readonly cx = 100;
  private readonly cy = 100;
  private readonly radius = 80;

  strokeWidth = input<number>(12);

  clampedValue = computed(() => Math.max(0, Math.min(100, this.value())));

  gaugeColor = computed(() => {
    const v = this.clampedValue();
    const t = this.thresholds();
    for (const threshold of t) {
      if (v <= threshold.value) return threshold.color;
    }
    return t.length > 0 ? t[t.length - 1].color : '#4caf50';
  });

  arcPath = computed(() => {
    const startAngle = Math.PI;
    const endAngle = 2 * Math.PI;
    const x1 = this.cx + this.radius * Math.cos(startAngle);
    const y1 = this.cy + this.radius * Math.sin(startAngle);
    const x2 = this.cx + this.radius * Math.cos(endAngle);
    const y2 = this.cy + this.radius * Math.sin(endAngle);
    return `M ${x1} ${y1} A ${this.radius} ${this.radius} 0 0 1 ${x2} ${y2}`;
  });

  arcLength = computed(() => {
    return Math.PI * this.radius;
  });

  dashOffset = computed(() => {
    const totalLen = this.arcLength();
    return totalLen - (this.clampedValue() / 100) * totalLen;
  });
}
