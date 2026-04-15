import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sparkline',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sparkline.component.html',
  styleUrl: './sparkline.component.css'
})
export class SparklineComponent {
  data = input.required<number[]>();
  color = input<string>('#3b82f6');
  height = input<number>(32);

  private static idCounter = 0;
  private readonly _id = ++SparklineComponent.idCounter;

  gradientId = computed(() => `sparkline-grad-${this._id}`);

  viewBox = computed(() => {
    const d = this.data();
    return `0 0 ${d.length - 1} ${this.height()}`;
  });

  polylinePoints = computed(() => {
    const d = this.data();
    if (d.length < 2) return '';
    const h = this.height();
    const min = Math.min(...d);
    const max = Math.max(...d);
    const range = max - min || 1;
    const padding = 2;
    const usableH = h - padding * 2;
    return d.map((v, i) => {
      const x = i;
      const y = padding + usableH - ((v - min) / range) * usableH;
      return `${x},${y}`;
    }).join(' ');
  });

  fillPath = computed(() => {
    const d = this.data();
    if (d.length < 2) return '';
    const h = this.height();
    const min = Math.min(...d);
    const max = Math.max(...d);
    const range = max - min || 1;
    const padding = 2;
    const usableH = h - padding * 2;
    const points = d.map((v, i) => {
      const x = i;
      const y = padding + usableH - ((v - min) / range) * usableH;
      return `${x} ${y}`;
    });
    return `M 0 ${h} L ${points.join(' L ')} L ${d.length - 1} ${h} Z`;
  });
}
