import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AppStateService } from '@platinumv3/shared/core';

@Component({
  selector: 'plat-notification-toast',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  template: `
    @for (n of state.activeNotifications(); track n.id) {
      <div class="toast" [class]="'toast-' + n.type">
        <mat-icon>{{ iconMap[n.type] }}</mat-icon>
        <span class="msg">{{ n.message }}</span>
        <button mat-icon-button (click)="state.dismiss(n.id)"><mat-icon>close</mat-icon></button>
      </div>
    }
  `,
  styles: [`
    :host { position: fixed; top: 1rem; right: 1rem; z-index: 9999; display: flex; flex-direction: column; gap: 0.5rem; }
    .toast { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; border-radius: 8px; min-width: 300px; max-width: 450px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); animation: slideIn 0.3s ease; }
    .toast-success { background: #dcfce7; color: #166534; }
    .toast-error { background: #fee2e2; color: #991b1b; }
    .toast-warning { background: #fef3c7; color: #92400e; }
    .toast-info { background: #dbeafe; color: #1e40af; }
    .msg { flex: 1; font-size: 0.875rem; }
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  `]
})
export class NotificationToastComponent {
  state = inject(AppStateService);
  iconMap: Record<string, string> = { success: 'check_circle', error: 'error', warning: 'warning', info: 'info' };
}
