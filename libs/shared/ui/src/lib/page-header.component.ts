import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'plat-page-header',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="page-header">
      @if (icon()) {
        <mat-icon class="header-icon" [style.color]="iconColor()">{{ icon() }}</mat-icon>
      }
      <div class="header-text">
        <h2>{{ title() }}</h2>
        @if (subtitle()) {
          <p class="subtitle">{{ subtitle() }}</p>
        }
      </div>
      <div class="header-actions"><ng-content></ng-content></div>
    </div>
  `,
  styles: [`
    .page-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; }
    .header-icon { font-size: 32px; width: 32px; height: 32px; }
    h2 { margin: 0; font-size: 1.3rem; font-weight: 700; }
    .subtitle { margin: 0; color: #64748b; font-size: 0.85rem; }
    .header-actions { margin-left: auto; display: flex; gap: 0.5rem; }
  `]
})
export class PageHeaderComponent {
  title = input.required<string>();
  subtitle = input<string>();
  icon = input<string>();
  iconColor = input<string>('#1a237e');
}
