import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-progress-ring',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './progress-ring.component.html',
  styleUrl: './progress-ring.component.css'
})
export class ProgressRingComponent {
  value = input.required<number>();
  size = input<number>(80);
  strokeWidth = input<number>(6);
  color = input<string>('#3b82f6');

  clampedValue = computed(() => Math.max(0, Math.min(100, Math.round(this.value()))));
  center = computed(() => this.size() / 2);
  ringRadius = computed(() => (this.size() - this.strokeWidth()) / 2);
  circumference = computed(() => 2 * Math.PI * this.ringRadius());
  dashOffset = computed(() => this.circumference() * (1 - this.clampedValue() / 100));
}
