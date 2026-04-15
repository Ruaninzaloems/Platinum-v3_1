import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-kpi-tile',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './kpi-tile.component.html',
  styleUrl: './kpi-tile.component.css'
})
export class KpiTileComponent {
  title = input.required<string>();
  value = input.required<string | number>();
  subtitle = input<string>('');
  icon = input<string>('');
  trend = input<'up' | 'down' | 'neutral'>('neutral');
  trendValue = input<string>('');
  color = input<'primary' | 'success' | 'warning' | 'danger' | 'info'>('info');

  trendClass = computed(() => {
    return this.trend() === 'up' ? 'trend-up' : this.trend() === 'down' ? 'trend-down' : '';
  });
}
