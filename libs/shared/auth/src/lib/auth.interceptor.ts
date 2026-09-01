import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

/** First-party API path prefixes that flow through the shell proxy. */
const FIRST_PARTY_API_PREFIXES = [
  '/api/',
  '/pos-app/api/',
  '/scm-app/api/',
  '/idp-app/api/',
  '/payroll-app/api/',
  '/afs-app/api/',
  '/budget-app/api/',
  '/insights-app/api/',
];

/** Default SCM Azure backend host. Overridable via the SCM_API_URL App Setting, which
 *  server.js injects as window.__PLATINUM_ENV__.SCM_API_URL (so the host can be changed
 *  on the web app without a code change). */
const SCM_DEFAULT_URL = 'https://rep-scm-api.azurewebsites.net';

/** The configured SCM backend host (from the injected runtime env, else the default). */
function scmHost(): string {
  const url =
    (typeof globalThis !== 'undefined' && (globalThis as any).__PLATINUM_ENV__?.SCM_API_URL) ||
    SCM_DEFAULT_URL;
  try { return new URL(url).host; } catch { return 'rep-scm-api.azurewebsites.net'; }
}

/** The George Platinum API (Access Management) — its own .NET backend, Bearer-authenticated.
 *  Reached via the shell proxy (/george-app/api → georgeplatinumuatapi) to avoid CORS. */
const GEORGE_PREFIXES = ['/george-app/api/'];
const GEORGE_HOSTS = ['georgeplatinumuatapi.azurewebsites.net'];

function isFirstPartyApi(url: string): boolean {
  // Same-origin relative URLs starting with one of the proxied prefixes.
  if (url.startsWith('/')) {
    return FIRST_PARTY_API_PREFIXES.some(p => url.startsWith(p));
  }
  return false;
}

function isScmBearerTarget(url: string): boolean {
  return url.includes(scmHost());
}

function isGeorgeTarget(url: string): boolean {
  return GEORGE_PREFIXES.some(p => url.startsWith(p)) || GEORGE_HOSTS.some(h => url.includes(h));
}

/** The Overtime module's own backend — reads the legacy Platinum permission tables
 *  (Sys_RolePermission / User_UserRoles) keyed by User_UserDetail.UserName. It has no
 *  concept of the shell's session; the shell must bridge its real POS-authenticated
 *  identity in via X-Username so DevCurrentUserService resolves the right person
 *  instead of falling back to an arbitrary default user. */
const OVERTIME_PREFIXES = ['/overtime-app/api/'];

function isOvertimeTarget(url: string): boolean {
  return OVERTIME_PREFIXES.some(p => url.startsWith(p));
}

/** The Performance module's api-server — identifies the caller via a lowercase
 *  `x-user` header (username), same bridge shape as Overtime's X-Username. Was
 *  previously hardcoded to a demo user when perf-app ran as a separate iframed
 *  app; now that it's native shell code, bridge the shell's real user in. */
const PERFORMANCE_PREFIXES = ['/insights-app/api/'];

function isPerformanceTarget(url: string): boolean {
  return PERFORMANCE_PREFIXES.some(p => url.startsWith(p));
}

/** Token for the George API: a dedicated george_token if configured, else the session token. */
function georgeToken(fallback: string | null): string | null {
  try {
    const t = localStorage.getItem('george_token');
    if (t) return t;
  } catch { /* ignore */ }
  return fallback;
}

/**
 * Token for the SCM Azure backend: the dedicated scm_token acquired via SCM-API's own
 * /auth/login (see @platinumv3/scm's AuthService.acquireTokenForDevSession) -- never the
 * shell's own session token, which SCM-API's JWT middleware will always reject (it's not
 * a token SCM-API issued). Mirrors georgeToken()'s dedicated-key-first pattern exactly.
 */
function scmToken(): string | null {
  try {
    return localStorage.getItem('scm_token');
  } catch { return null; }
}

/**
 * Auth interceptor with explicit scoping:
 *  - withCredentials: true ONLY for first-party API calls (so the POS-API
 *    session cookie travels with same-origin requests through the shell
 *    proxy, but is NOT sent on third-party calls).
 *  - Authorization: Bearer ONLY when calling the SCM Azure backend that
 *    actually accepts the token. Prevents leaking the SCM JWT to other hosts.
 *  - On 401 from a non-auth endpoint, tears down the local session and
 *    redirects to /login — EXCEPT for the SCM and George backends, whose 401
 *    just means their own token is missing/invalid (not that the app session
 *    expired), so they must not bounce the user to /login.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const headers: Record<string, string> = {};
  const scm = isScmBearerTarget(req.url);
  if (scm) {
    const token = scmToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  const george = isGeorgeTarget(req.url);
  if (george) {
    const token = georgeToken(auth.getToken());
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  if (isOvertimeTarget(req.url)) {
    const userName = auth.user()?.userName;
    if (userName) headers['X-Username'] = userName;
  }
  if (isPerformanceTarget(req.url)) {
    const userName = auth.user()?.userName;
    if (userName) headers['x-user'] = userName;
  }

  const cloned = req.clone({
    withCredentials: isFirstPartyApi(req.url),
    setHeaders: headers,
  });

  const performance = isPerformanceTarget(req.url);
  const overtime = isOvertimeTarget(req.url);

  return next(cloned).pipe(
    catchError((err: HttpErrorResponse) => {
      // A 401 from SCM, George, Performance or Overtime just means THEIR own bridged-identity
      // token/header is missing or unrecognised — those backends have no concept of the shell's
      // session, so a 401 from them must NOT tear down the app session (that's POS-API's domain)
      // or bounce the user to /login. Without this, clicking into Performance while its backend
      // rejects the bridged x-user header force-logs-out the entire shell.
      if (err.status === 401 && !req.url.includes('/auth/') && !george && !scm && !performance && !overtime) {
        // Soft teardown: don't persist the logged-out flag, so an expected upstream 401 doesn't
        // permanently suppress the auto-admin session on the next reload.
        auth.logout(false).catch(() => router.navigate(['/login']));
      }
      return throwError(() => err);
    })
  );
};
