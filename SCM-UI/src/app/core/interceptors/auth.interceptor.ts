import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError, from, switchMap } from 'rxjs';
import { AuthService } from '../services/auth.service';

let refreshInProgress: Promise<string | null> | null = null;

function reLogin(authService: AuthService): Promise<string | null> {
  if (refreshInProgress) return refreshInProgress;
  refreshInProgress = new Promise((resolve) => {
    authService.login('admin', 'admin123').subscribe({
      next: (result) => {
        refreshInProgress = null;
        resolve(result.token);
      },
      error: () => {
        refreshInProgress = null;
        resolve(null);
      }
    });
  });
  return refreshInProgress;
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = localStorage.getItem('platinum_token');

  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/auth/login')) {
        return from(reLogin(authService)).pipe(
          switchMap((newToken) => {
            if (newToken) {
              const retryReq = req.clone({
                setHeaders: { Authorization: `Bearer ${newToken}` }
              });
              return next(retryReq);
            }
            return throwError(() => error);
          })
        );
      }
      return throwError(() => error);
    })
  );
};
