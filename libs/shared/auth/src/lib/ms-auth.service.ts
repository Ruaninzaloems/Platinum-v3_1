import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MsalService, MsalBroadcastService } from '@azure/msal-angular';
import {
  AuthenticationResult,
  InteractionStatus,
  InteractionRequiredAuthError,
  AccountInfo,
} from '@azure/msal-browser';
import { filter, firstValueFrom } from 'rxjs';

// Graph scopes used for all token acquisitions.
// Keep in sync with the scopes listed in app.config.ts msalGuardConfig.
export const GRAPH_SCOPES = [
  'User.Read',
  'Sites.Read.All',
  'Sites.ReadWrite.All',
  'Files.ReadWrite.All',
];

// Dedicated popup redirect page — a minimal Angular route (no shell layout,
// no handleRedirectPromise) so the main window can read the auth code from
// the popup URL and close the popup automatically.
const POPUP_REDIRECT_URI = `${window.location.origin}/auth-redirect`;

export interface MsUser {
  name       : string;
  email      : string;
  accountId  : string;
  tenantId   : string;
  username   : string;
}

@Injectable({ providedIn: 'root' })
export class MsAuthService {
  private msal      = inject(MsalService);
  private broadcast = inject(MsalBroadcastService);
  private platform  = inject(PLATFORM_ID);

  private _msUser   = signal<MsUser | null>(null);
  private _ready    = signal(false);

  msUser    = this._msUser.asReadonly();
  isSignedIn = computed(() => !!this._msUser());
  ready      = this._ready.asReadonly();

  constructor() {
    if (!isPlatformBrowser(this.platform)) return;

    // Wait for MSAL to finish any redirect before reading account state.
    this.broadcast.inProgress$
      .pipe(filter(status => status === InteractionStatus.None))
      .subscribe(() => {
        this.syncAccount();
        this._ready.set(true);
      });
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /** Opens a popup sign-in dialog. Falls back to redirect on mobile. */
  async signIn(): Promise<void> {
    // Clear any stale MSAL interaction lock left from a previous failed or
    // cancelled popup. Without this, MSAL throws 'interaction_in_progress'.
    this.clearStaleLock();
    try {
      const result: AuthenticationResult = await this.msal.instance.loginPopup({
        scopes      : GRAPH_SCOPES,
        prompt      : 'select_account',
        redirectUri : POPUP_REDIRECT_URI,
      });
      this.msal.instance.setActiveAccount(result.account);
      this.syncAccount();
    } catch (e: any) {
      // If popups are blocked, fall through to redirect
      if (e?.errorCode === 'popup_window_error' || e?.errorCode === 'empty_window_error') {
        await this.msal.instance.loginRedirect({ scopes: GRAPH_SCOPES });
      } else {
        throw e;
      }
    }
  }

  /** Signs the user out of Azure AD and clears local state. */
  async signOut(): Promise<void> {
    const account = this.msal.instance.getActiveAccount();
    this._msUser.set(null);
    if (account) {
      await this.msal.instance.logoutPopup({
        account,
        mainWindowRedirectUri: '/login',
        postLogoutRedirectUri: POPUP_REDIRECT_URI,
      }).catch(() => this.msal.instance.logoutRedirect({ account }));
    }
  }

  /**
   * Clears the local Microsoft session — in-memory user + cached MSAL account —
   * WITHOUT opening a logout popup. Called by AuthService.logout() so an
   * explicit sign-out also drops any Microsoft account and a page reload won't
   * silently resurrect it via syncAccount().
   */
  async clearLocalSession(): Promise<void> {
    this._msUser.set(null);
    try {
      const instance: any = this.msal.instance;
      instance.setActiveAccount?.(null);
      if (typeof instance.clearCache === 'function') {
        await instance.clearCache();
      }
    } catch {}
  }

  /**
   * Returns a valid access token for Microsoft Graph.
   * Tries silent first; falls back to interactive if needed.
   */
  async getGraphToken(): Promise<string> {
    const account = this.msal.instance.getActiveAccount();
    if (!account) throw new Error('No signed-in Microsoft account.');

    try {
      const result = await this.msal.instance.acquireTokenSilent({
        scopes  : GRAPH_SCOPES,
        account,
      });
      return result.accessToken;
    } catch (e) {
      if (e instanceof InteractionRequiredAuthError) {
        this.clearStaleLock();
        const result = await this.msal.instance.acquireTokenPopup({
          scopes      : GRAPH_SCOPES,
          redirectUri : POPUP_REDIRECT_URI,
        });
        return result.accessToken;
      }
      throw e;
    }
  }

  // ── Private ────────────────────────────────────────────────────────────────

  /**
   * Removes stale MSAL interaction locks from sessionStorage.
   * MSAL writes an 'interaction.status' key when a popup/redirect starts.
   * If the flow is interrupted (page refresh, popup closed unexpectedly),
   * the key is never cleared and the next attempt throws 'interaction_in_progress'.
   */
  private clearStaleLock(): void {
    try {
      Object.keys(sessionStorage)
        .filter(k => k.includes('interaction.status') || k.includes('interaction_status'))
        .forEach(k => sessionStorage.removeItem(k));
    } catch {}
  }

  private syncAccount(): void {
    const accounts = this.msal.instance.getAllAccounts();
    const account: AccountInfo | null =
      this.msal.instance.getActiveAccount() ?? accounts[0] ?? null;

    if (account) {
      this.msal.instance.setActiveAccount(account);
      this._msUser.set({
        name     : account.name      ?? account.username,
        email    : account.username,
        accountId: account.localAccountId,
        tenantId : account.tenantId,
        username : account.username,
      });
    } else {
      this._msUser.set(null);
    }
  }
}
