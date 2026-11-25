import { Component } from '@angular/core';

/**
 * Shown at /auth-redirect only when a user navigates there manually in the
 * main window (not during the normal popup flow).
 *
 * In the popup flow, main.ts intercepts the /auth-redirect URL BEFORE
 * Angular bootstraps and calls broadcastResponseToMainFrame() from
 * @azure/msal-browser/redirect-bridge, which broadcasts the auth code to
 * the main window and closes the popup — Angular never renders here.
 */
@Component({
  selector: 'app-auth-redirect',
  standalone: true,
  template: `
    <div class="wrap">
      <div class="spinner"></div>
      <p>Completing sign in…</p>
    </div>
  `,
  styles: [`
    .wrap {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; height: 100vh;
      font-family: 'Segoe UI', sans-serif; color: #64748b; background: #f0f2f5;
    }
    .spinner {
      width: 40px; height: 40px; border: 4px solid #e2e8f0;
      border-top-color: #3f51b5; border-radius: 50%;
      animation: spin .7s linear infinite; margin-bottom: 1.25rem;
    }
    p { margin: 0; font-size: .95rem; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class AuthRedirectComponent {}
