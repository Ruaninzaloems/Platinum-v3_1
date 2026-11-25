import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, switchMap, take, throwError, timeout, catchError, TimeoutError } from 'rxjs';
import { AuthService } from '../core/auth.service';
import { environment } from '../../environments/environment';

const AUTH_TIMEOUT_MS = 10_000;

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function requestWithUserId(req: Parameters<HttpInterceptorFn>[0], userId: number) {
  return req.clone({ setHeaders: { 'X-User-Id': String(userId) } });
}

function noIdentityError() {
  return throwError(
    () =>
      new HttpErrorResponse({
        status: 401,
        statusText: 'Unauthorized',
        error: 'Write request blocked: user identity not confirmed.',
      })
  );
}

export const userIdInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.includes(environment.assetsApiUrl)) {
    return next(req);
  }

  const authService = inject(AuthService);

  if (req.url.includes('/auth/me')) {
    return next(req);
  }

  if (WRITE_METHODS.has(req.method)) {
    if (authService.resolved()) {
      const userId = authService.getCurrentUserId();
      if (userId === null) return noIdentityError();
      return next(requestWithUserId(req, userId));
    }

    return toObservable(authService.resolved).pipe(
      filter(Boolean),
      take(1),
      timeout(AUTH_TIMEOUT_MS),
      catchError((err) => (err instanceof TimeoutError ? noIdentityError() : throwError(() => err))),
      switchMap(() => {
        const userId = authService.getCurrentUserId();
        if (userId === null) return noIdentityError();
        return next(requestWithUserId(req, userId));
      })
    );
  }

  const userId = authService.getCurrentUserId();
  if (userId !== null) {
    return next(requestWithUserId(req, userId));
  }
  return next(req);
};
