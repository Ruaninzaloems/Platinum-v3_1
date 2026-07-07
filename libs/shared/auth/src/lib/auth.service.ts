import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom, Observable, of } from 'rxjs';
import { MsAuthService } from './ms-auth.service';

/**
 * User shape matches POS-API session payload (the system-wide auth source of truth).
 * See POS-API/routes/auth.routes.ts → /api/auth/login response.
 */
export interface AuthUser {
  user_ID: number;
  userName: string;
  firstName: string;
  lastName: string;
  eMail: string;
  enabled: boolean;
  superUser: boolean;
  cashFloat: number;
  finYear: string;
  /** Convenience aliases used by some legacy components */
  role?: string;
  /**
   * Effective side-nav module codes the user may access (e.g. ['dashboard',
   * 'assets']). Delivered by POS-API in the login/session payload. superUsers
   * ignore this list and see everything (see canAccessModule).
   */
  modules?: string[];
}

export interface SiteInfo {
  id: string;
  name: string;
  logo?: string;
  themeClass?: string;
}

export interface LoginResponse {
  success: boolean;
  user?: AuthUser;
  site?: SiteInfo;
  token?: string;
  error?: string;
}

const STORAGE_USER = 'platinum_user';
const STORAGE_SITE = 'platinum_site';
const STORAGE_TOKEN = 'platinum_token';
/**
 * Set when the user explicitly signs out, so the auto-admin session is NOT
 * silently recreated on the next page load. Cleared on any successful login
 * (including the "Continue as Administrator" path on the login page).
 */
const STORAGE_LOGGED_OUT = 'platinum_logged_out';

/**
 * The base path that proxies to POS-API (the identity provider).
 * In dev, apps/shell/proxy.conf.json maps /pos-app/api → http://localhost:3003.
 */
const POS_AUTH_BASE = '/pos-app/api';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private msAuth = inject(MsAuthService);

  private _user = signal<AuthUser | null>(null);
  private _site = signal<SiteInfo | null>(null);
  private _token = signal<string | null>(null);
  private _checked = signal(false);

  user = this._user.asReadonly();
  site = this._site.asReadonly();
  isAuthenticated = computed(() => !!this._user());
  authenticated = this.isAuthenticated;
  checked = this._checked.asReadonly();
  userRoles = computed(() => {
    const u = this._user();
    if (!u) return [];
    return u.superUser ? ['admin', 'super'] : ['user'];
  });

  /**
   * Effective side-nav module codes for the current user. superUsers implicitly
   * have every module (empty vs full distinction lives in canAccessModule).
   */
  allowedModules = computed<string[]>(() => this._user()?.modules ?? []);

  /**
   * True if the user may access the given side-nav module code. superUsers see
   * everything; everyone else is gated by their granted module list. Dashboard
   * is always open so a base user with no grants still has a landing page.
   *
   * Access is only enforced once the server has resolved an explicit module
   * list (an array — possibly empty). When it is unresolved (module access is
   * unavailable: the feature/EMS is not configured, the lookup failed, or a
   * cached session predates this feature) we fail OPEN, matching the pre-feature
   * behaviour, so a real user is never locked out of everything. loadMyModules()
   * hydrates the authoritative list shortly after.
   */
  canAccessModule(code: string): boolean {
    const u = this._user();
    if (!u) return false;
    if (u.superUser) return true;
    if (code === 'dashboard') return true;
    if (!Array.isArray(u.modules)) return true; // unresolved → fail open
    return u.modules.includes(code);
  }

  constructor() {
    // Login screen is disabled — every visitor gets an instant local admin
    // session so the shell + all modules are immediately reachable.
    try {
      const u = localStorage.getItem(STORAGE_USER);
      const s = localStorage.getItem(STORAGE_SITE);
      const t = localStorage.getItem(STORAGE_TOKEN);
      if (u) this._user.set(JSON.parse(u));
      if (s) this._site.set(JSON.parse(s));
      if (t) this._token.set(t);
    } catch {}
    let loggedOut = false;
    try { loggedOut = localStorage.getItem(STORAGE_LOGGED_OUT) === '1'; } catch {}
    if (!this._user() && !loggedOut) {
      this.setLocalSession('admin');
    }
    this._checked.set(true);
    // Self-heal module access for a restored (non-super) session whose cached
    // payload predates this feature.
    const restored = this._user();
    if (restored && !restored.superUser && restored.modules === undefined) {
      this.loadMyModules();
    }
  }

  /**
   * Refreshes the effective module list from POS-API and merges it into the
   * current user. No-op for superUsers (they already see everything); errors
   * are swallowed so a transient failure never blocks the shell.
   */
  loadMyModules(): void {
    const u = this._user();
    if (!u || u.superUser) return;
    this.http.get<{ modules: string[] }>(`${POS_AUTH_BASE}/auth/my-modules`, { withCredentials: true })
      .subscribe({
        next: (resp) => {
          if (resp && Array.isArray(resp.modules)) {
            const next = { ...this._user()!, modules: resp.modules };
            this._user.set(next);
            try { localStorage.setItem(STORAGE_USER, JSON.stringify(next)); } catch {}
          }
        },
        error: () => { /* non-fatal */ },
      });
  }

  /** Read-only token (used by SCM Azure backend bearer requests). */
  getToken(): string | null { return this._token(); }

  /**
   * Verifies the current session against POS-API. Call from APP_INITIALIZER or
   * the auth guard to recover from page reloads when localStorage is empty.
   */
  async checkAuth(): Promise<boolean> {
    try {
      const resp: any = await firstValueFrom(
        this.http.get(`${POS_AUTH_BASE}/auth/status`, { withCredentials: true })
      );
      if (resp?.authenticated && resp.user) {
        this.applySession(resp.user, resp.site, resp.token);
      } else {
        this.clearSession();
      }
    } catch {
      // Network failure on the auth probe — clear stale local auth so the
      // guard sends the user back to /login instead of letting them through.
      this.clearSession();
    }
    this._checked.set(true);
    return this.isAuthenticated();
  }

  /** Primary login. Posts to POS-API; cookie-based session. */
  login(username: string, password: string, siteId: string = 'george'): Observable<LoginResponse> {
    return new Observable<LoginResponse>(sub => {
      this.http.post<LoginResponse>(
        `${POS_AUTH_BASE}/auth/login`,
        { username, password, siteId },
        { withCredentials: true }
      ).subscribe({
        next: (resp) => {
          if (resp?.success && resp.user) {
            this.applySession(resp.user, resp.site, resp.token);
          }
          sub.next(resp);
          sub.complete();
        },
        error: (err: HttpErrorResponse) => {
          sub.next({ success: false, error: err.error?.error || err.message || 'Login failed' });
          sub.complete();
        }
      });
    });
  }

  /**
   * Azure-AD (MSAL) login. After the front end completes the Microsoft popup,
   * the resulting claims are posted to POS-API, which looks up / creates the
   * matching EMS user and starts a cookie session.
   */
  loginAzure(
    claims: { azureUid: string; email: string; username: string },
    siteId: string = 'george'
  ): Observable<LoginResponse> {
    return new Observable<LoginResponse>(sub => {
      this.http.post<LoginResponse>(
        `${POS_AUTH_BASE}/auth/createTokenAzure`,
        { ...claims, siteId },
        { withCredentials: true }
      ).subscribe({
        next: (resp) => {
          if (resp?.success && resp.user) {
            this.applySession(resp.user, resp.site, resp.token);
          }
          sub.next(resp);
          sub.complete();
        },
        error: (err: HttpErrorResponse) => {
          sub.next({ success: false, error: err.error?.error || err.message || 'Microsoft sign-in failed' });
          sub.complete();
        }
      });
    });
  }

  /** Convenience used by login.component when the API returns the legacy shape. */
  handleLoginSuccess(response: { token?: string; user: AuthUser; site?: SiteInfo }) {
    this.applySession(response.user, response.site, response.token);
    this.router.navigate(['/dashboard']);
  }

  /** Compatibility shim: legacy quick-admin path used as offline fallback. */
  setLocalSession(username: string) {
    const user: AuthUser = {
      user_ID: 1, userName: username, firstName: 'System', lastName: 'Admin',
      eMail: `${username}@platinum.gov.za`, enabled: true, superUser: true,
      cashFloat: 0, finYear: '2025', role: 'admin',
    };
    const site: SiteInfo = { id: 'george', name: 'George Municipality' };
    this.applySession(user, site, 'local-session-token');
  }

  /** Loads the list of sites from POS-API for the login dropdown. */
  loadSites(): Observable<SiteInfo[]> {
    return this.http.get<SiteInfo[]>(`${POS_AUTH_BASE}/sites`, { withCredentials: true });
  }

  /**
   * Signs the user out.
   * @param persist When true (explicit "Sign Out"), remembers the logged-out
   *   state so the auto-admin session is NOT silently recreated on reload.
   *   The interceptor's 401 teardown passes false so expected upstream 401s
   *   (e.g. the SCM Azure API) don't lock the user out permanently.
   */
  async logout(persist = true): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post(`${POS_AUTH_BASE}/auth/logout`, {}, { withCredentials: true })
      );
    } catch {}
    this.clearSession();
    // Also drop any Microsoft account so the login page doesn't bounce the
    // user straight back to the dashboard via msAuth.isSignedIn().
    try { await this.msAuth.clearLocalSession(); } catch {}
    if (persist) {
      try { localStorage.setItem(STORAGE_LOGGED_OUT, '1'); } catch {}
    }
    this.router.navigate(['/login']);
  }

  hasRole(role: string): boolean {
    return this.userRoles().includes(role);
  }

  // ---------- internals ----------

  private applySession(user: AuthUser, site?: SiteInfo, token?: string | null) {
    user.role = user.role || (user.superUser ? 'admin' : 'user');
    this._user.set(user);
    this._site.set(site || null);
    if (token) this._token.set(token);
    try {
      // A fresh session means the user is no longer explicitly signed out.
      localStorage.removeItem(STORAGE_LOGGED_OUT);
      localStorage.setItem(STORAGE_USER, JSON.stringify(user));
      if (site) localStorage.setItem(STORAGE_SITE, JSON.stringify(site));
      if (token) localStorage.setItem(STORAGE_TOKEN, token);
    } catch {}
  }

  private clearSession() {
    this._user.set(null);
    this._site.set(null);
    this._token.set(null);
    try {
      localStorage.removeItem(STORAGE_USER);
      localStorage.removeItem(STORAGE_SITE);
      localStorage.removeItem(STORAGE_TOKEN);
    } catch {}
  }
}
