import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { timer, throwError } from 'rxjs';
import { retry, catchError } from 'rxjs/operators';

export const retryInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.method !== 'GET') {
    return next(req);
  }

  return next(req).pipe(
    retry({
      count: 2,
      delay: (error: HttpErrorResponse, retryCount: number) => {
        if (error.status === 401 || error.status === 403 || error.status === 404 || error.status === 422) {
          return throwError(() => error);
        }
        const delayMs = Math.min(1000 * Math.pow(2, retryCount - 1), 4000);
        return timer(delayMs);
      },
    }),
    catchError((error) => throwError(() => error)),
  );
};
