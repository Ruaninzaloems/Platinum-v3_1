import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig, msalInstance } from './app/app.config';
import { AppComponent } from './app/app.component';
import { broadcastResponseToMainFrame } from '@azure/msal-browser/redirect-bridge';

async function init(): Promise<void> {
  // ── Popup window (MSAL auth-redirect callback) ─────────────────────────
  //
  // When Azure AD redirects the popup back to /auth-redirect#code=..., the
  // popup must broadcast the auth code to the main window and then close.
  //
  // IMPORTANT: We use the URL path (not window.opener) to detect the popup
  // because login.microsoftonline.com sends a Cross-Origin-Opener-Policy
  // header that severs window.opener before the popup returns to localhost.
  //
  // broadcastResponseToMainFrame() is MSAL's dedicated popup bridge:
  //   - Reads the auth code from the URL hash (window.location.hash)
  //   - Creates a BroadcastChannel keyed to the MSAL state/interaction ID
  //   - Sends the raw payload to the main window's loginPopup() listener
  //   - Calls window.close() to shut the popup
  //
  // Unlike handleRedirectPromise(), it does NOT require initialize() first
  // and does NOT discard popup responses (handleRedirectPromise validates
  // only for InteractionType.Redirect and silently drops popup payloads,
  // which is the root cause of the "Signing in..." stuck state).
  if (window.location.pathname.startsWith('/auth-redirect')) {
    try {
      await broadcastResponseToMainFrame();
      return; // MSAL closes the popup automatically on success
    } catch (err) {
      // No auth code in the URL (user navigated here manually, or the
      // auth already expired). Fall through and bootstrap Angular so
      // the /auth-redirect route renders normally.
      console.warn('[AuthRedirect] broadcastResponseToMainFrame:', err);
    }
  }

  // ── Main window ──────────────────────────────────────────────────────────
  // Initialize MSAL before Angular bootstraps so the BroadcastChannel
  // listener is registered before loginPopup() is ever called.
  try {
    await msalInstance.initialize();
  } catch (err) {
    console.error('[MSAL] Initialization failed, continuing:', err);
  }
  bootstrapApplication(AppComponent, appConfig).catch(console.error);
}

init().catch(console.error);
