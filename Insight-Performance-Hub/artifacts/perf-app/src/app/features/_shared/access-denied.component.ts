import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-access-denied',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="denied">
      <div class="lock">🔒</div>
      <h2>Access Denied</h2>
      <p>You do not have permission to access this section. Contact your administrator for access.</p>
    </div>
  `,
  styles: [`
    .denied { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; text-align: center; padding: 24px; }
    .lock { width: 80px; height: 80px; border-radius: 24px; background: #fef2f2; display: flex; align-items: center; justify-content: center; font-size: 32px; box-shadow: inset 0 2px 6px rgba(0,0,0,0.04); margin-bottom: 24px; }
    h2 { color: #1e293b; font-size: 22px; margin: 0; }
    p  { color: #64748b; max-width: 420px; margin-top: 8px; }
  `],
})
export class AccessDeniedComponent {}
