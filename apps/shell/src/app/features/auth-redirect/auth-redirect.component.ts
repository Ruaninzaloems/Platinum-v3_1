import { Component, OnInit, inject } from '@angular/core';
import { MsalService } from '@azure/msal-angular';

/**
 * Minimal page shown inside the MSAL popup window after Azure AD authenticates.
 *
 * The main window's MSAL polls the popup URL, reads the auth code, and calls
 * popup.close() automatically. This component just shows a spinner and does
 * NOTHING else — it must not navigate or call handleRedirectPromise(), which
 * would consume the auth code before the main window can read it.
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
export class AuthRedirectComponent implements OnInit {
  private msal = inject(MsalService);

  ngOnInit(): void {
    // MSAL v3+ uses BroadcastChannel for popup flow.
    // The popup MUST call initialize() + handleRedirectPromise() so MSAL can
    // detect the popup context and forward the auth result to the main window
    // via BroadcastChannel. MSAL will NOT navigate — it closes the popup itself.
    this.msal.instance.initialize()
      .then(() => this.msal.instance.handleRedirectPromise())
      .catch(err => console.warn('[AuthRedirect]', err));
  }
}
