import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe, PercentPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-trend-indicator',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './trend-indicator.component.html',
  styleUrl: './trend-indicator.component.css'
})
export class TrendIndicatorComponent {
  value = input.required<number>();
  previousValue = input<number>(0);
  format = input<'currency' | 'percent' | 'number'>('number');
  invertColors = input<boolean>(false);

  direction = computed<'up' | 'down' | 'neutral'>(() => {
    const v = this.value();
    const pv = this.previousValue();
    if (v > pv) return 'up';
    if (v < pv) return 'down';
    return 'neutral';
  });

  trendColorClass = computed(() => {
    const dir = this.direction();
    if (dir === 'neutral') return 'trend-neutral';
    const isPositive = this.invertColors() ? dir === 'down' : dir === 'up';
    return isPositive ? 'trend-positive' : 'trend-negative';
  });

  formattedValue = computed(() => {
    const v = this.value();
    switch (this.format()) {
      case 'currency':
        return 'R ' + Math.abs(v).toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
      case 'percent':
        return v.toFixed(1) + '%';
      default:
        return v.toLocaleString('en-ZA');
    }
  });

  changeText = computed(() => {
    const v = this.value();
    const pv = this.previousValue();
    if (pv === 0) return '';
    const pctChange = ((v - pv) / Math.abs(pv)) * 100;
    return (pctChange >= 0 ? '+' : '') + pctChange.toFixed(1) + '%';
  });
}
