import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [MatIconModule, NgIf],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="empty">
      <mat-icon *ngIf="icon">{{ icon }}</mat-icon>
      <h3>{{ title }}</h3>
      <p *ngIf="message">{{ message }}</p>
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    .empty { text-align: center; padding: 48px 24px; color: #64748b; }
    mat-icon { font-size: 40px; width: 40px; height: 40px; color: #cbd5e1; margin-bottom: 12px; }
    h3 { margin: 0 0 6px; color: #334155; font-size: 16px; font-weight: 600; }
    p  { margin: 0; font-size: 13px; }
  `],
})
export class EmptyStateComponent {
  @Input() icon = 'inbox';
  @Input() title = 'No data';
  @Input() message = '';
}
