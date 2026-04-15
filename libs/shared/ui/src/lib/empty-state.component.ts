import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'plat-empty-state',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="empty-state">
      <mat-icon class="empty-icon">{{ icon() }}</mat-icon>
      <h3>{{ title() }}</h3>
      <p>{{ message() }}</p>
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    .empty-state { text-align: center; padding: 4rem 2rem; }
    .empty-icon { font-size: 64px; width: 64px; height: 64px; color: #cbd5e1; margin-bottom: 1rem; }
    h3 { margin-bottom: 0.5rem; color: #334155; }
    p { color: #94a3b8; max-width: 400px; margin: 0 auto; }
  `]
})
export class EmptyStateComponent {
  title = input('No data available');
  message = input('');
  icon = input('inbox');
}
