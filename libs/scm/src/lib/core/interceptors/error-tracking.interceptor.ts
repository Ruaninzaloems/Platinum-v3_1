import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const errorTrackingInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const context = {
        method: req.method,
        url: req.urlWithParams,
        status: error.status,
        statusText: error.statusText,
        message: error.error?.message || error.message,
        timestamp: new Date().toISOString()
      };

      if (error.status >= 500) {
        console.error('[SERVER ERROR]', context);
      } else if (error.status === 0) {
        console.error('[NETWORK ERROR] Request failed — server unreachable', context);
      }

      return throwError(() => error);
    })
  );
};
