import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      // eslint-disable-next-line no-console
      console.error('[API ERROR]', req.method, req.url, err.status, err.message);
      return throwError(() => err);
    }),
  );
