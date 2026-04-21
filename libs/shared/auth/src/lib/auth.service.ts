import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom, Observable, of } from 'rxjs';

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
 * The base path that proxies to POS-API (the identity provider).
 * In dev, apps/shell/proxy.conf.json maps /pos-app/api → http://localhost:3003.
 */
const POS_AUTH_BASE = '/pos-app/api';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

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
    if (!this._user()) {
      this.setLocalSession('admin');
    }
    this._checked.set(true);
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

  async logout(): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post(`${POS_AUTH_BASE}/auth/logout`, {}, { withCredentials: true })
      );
    } catch {}
    this.clearSession();
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
