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
  '/perf-app/api/',
];

/** Hosts that explicitly accept the SCM Azure JWT bearer token. */
const SCM_BEARER_HOSTS = ['rep-scm-api.azurewebsites.net'];

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
  return SCM_BEARER_HOSTS.some(h => url.includes(h));
}

function isGeorgeTarget(url: string): boolean {
  return GEORGE_PREFIXES.some(p => url.startsWith(p)) || GEORGE_HOSTS.some(h => url.includes(h));
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
 * Auth interceptor with explicit scoping:
 *  - withCredentials: true ONLY for first-party API calls (so the POS-API
 *    session cookie travels with same-origin requests through the shell
 *    proxy, but is NOT sent on third-party calls).
 *  - Authorization: Bearer ONLY when calling the SCM Azure backend that
 *    actually accepts the token. Prevents leaking the SCM JWT to other hosts.
 *  - On 401 from a non-auth endpoint, tears down the local session and
 *    redirects to /login.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const headers: Record<string, string> = {};
  if (isScmBearerTarget(req.url)) {
    const token = auth.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  const george = isGeorgeTarget(req.url);
  if (george) {
    const token = georgeToken(auth.getToken());
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const cloned = req.clone({
    withCredentials: isFirstPartyApi(req.url),
    setHeaders: headers,
  });

  return next(cloned).pipe(
    catchError((err: HttpErrorResponse) => {
      // A 401 from the George API just means its token is missing/invalid — it must NOT tear
      // down the app session (that's POS-API's domain).
      if (err.status === 401 && !req.url.includes('/auth/') && !george) {
        // Soft teardown: don't persist the logged-out flag, so an expected
        // upstream 401 (e.g. the SCM Azure API without a real JWT) doesn't
        // permanently suppress the auto-admin session on the next reload.
        auth.logout(false).catch(() => router.navigate(['/login']));
      }
      return throwError(() => err);
    })
  );
};
