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

  const cloned = req.clone({
    withCredentials: isFirstPartyApi(req.url),
    setHeaders: headers,
  });

  return next(cloned).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && !req.url.includes('/auth/')) {
        auth.logout().catch(() => router.navigate(['/login']));
      }
      return throwError(() => err);
    })
  );
};
