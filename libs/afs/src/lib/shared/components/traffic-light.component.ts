import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-traffic-light',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './traffic-light.component.html',
  styleUrl: './traffic-light.component.css'
})
export class TrafficLightComponent {
  status = input.required<'green' | 'amber' | 'red'>();
  label = input<string>('');

  dotColor = computed(() => {
    switch (this.status()) {
      case 'green': return '#4caf50';
      case 'amber': return '#f59e0b';
      case 'red': return '#ef5350';
      default: return '#94a3b8';
    }
  });
}
