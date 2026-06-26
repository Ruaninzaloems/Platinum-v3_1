import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

/**
 * Admin → Settings → Access Management.
 *
 * Scaffold page for user / role / permission administration. Routed at
 * /admin-settings/access-management (registered before the /admin-settings/:module
 * catch-all so it isn't treated as a module-config page).
 */
@Component({
  selector: 'app-access-management',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="am-page">
      <div class="am-header">
        <div class="am-icon"><mat-icon>admin_panel_settings</mat-icon></div>
        <div>
          <h1>Access Management</h1>
          <p>Manage who can sign in and what they can do across the Platinum ERP modules.</p>
        </div>
      </div>

      <div class="am-grid">
        <div class="am-card">
          <div class="am-card-head"><mat-icon>group</mat-icon><h2>Users</h2></div>
          <p>Provision and deactivate user accounts, link Microsoft (Azure AD) identities, and assign roles.</p>
          <button mat-stroked-button disabled>
            <mat-icon>person_add</mat-icon> Manage Users
          </button>
          <span class="am-soon">Coming soon</span>
        </div>

        <div class="am-card">
          <div class="am-card-head"><mat-icon>verified_user</mat-icon><h2>Roles &amp; Permissions</h2></div>
          <p>Define roles and the module-level permissions (view / capture / approve) each role grants.</p>
          <button mat-stroked-button disabled>
            <mat-icon>tune</mat-icon> Manage Roles
          </button>
          <span class="am-soon">Coming soon</span>
        </div>

        <div class="am-card">
          <div class="am-card-head"><mat-icon>history</mat-icon><h2>Access Audit</h2></div>
          <p>Review sign-in activity and permission changes for an AG-compliant audit trail.</p>
          <button mat-stroked-button disabled>
            <mat-icon>fact_check</mat-icon> View Audit Log
          </button>
          <span class="am-soon">Coming soon</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .am-page { padding: 24px; max-width: 1100px; }
    .am-header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
    .am-icon { width: 48px; height: 48px; border-radius: 12px; background: #eef2ff; color: #4f46e5;
               display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .am-header h1 { margin: 0; font-size: 22px; color: #1e293b; }
    .am-header p { margin: 4px 0 0; font-size: 13px; color: #64748b; }
    .am-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
    .am-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px;
               display: flex; flex-direction: column; gap: 10px; }
    .am-card-head { display: flex; align-items: center; gap: 10px; }
    .am-card-head mat-icon { color: #4f46e5; }
    .am-card-head h2 { margin: 0; font-size: 15px; color: #1e293b; }
    .am-card p { margin: 0; font-size: 13px; color: #64748b; flex: 1; }
    .am-card button { align-self: flex-start; }
    .am-soon { font-size: 11px; color: #94a3b8; font-style: italic; }
  `]
})
export class AccessManagementComponent {}
