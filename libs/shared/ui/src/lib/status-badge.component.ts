import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'plat-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `<span class="badge" [ngClass]="badgeClass()">{{ label() }}</span>`,
  styles: [`
    .badge { display: inline-flex; padding: 2px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; }
    .badge-success { background: #dcfce7; color: #166534; }
    .badge-warning { background: #fef3c7; color: #92400e; }
    .badge-error { background: #fee2e2; color: #991b1b; }
    .badge-info { background: #dbeafe; color: #1e40af; }
    .badge-neutral { background: #f1f5f9; color: #475569; }
  `]
})
export class StatusBadgeComponent {
  label = input.required<string>();
  variant = input<'success' | 'warning' | 'error' | 'info' | 'neutral'>('neutral');
  badgeClass = computed(() => `badge-${this.variant()}`);
}
