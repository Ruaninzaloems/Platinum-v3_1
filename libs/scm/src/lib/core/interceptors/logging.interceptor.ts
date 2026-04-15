import { HttpInterceptorFn } from '@angular/common/http';
import { tap, finalize } from 'rxjs';

export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
  const startTime = performance.now();
  const method = req.method;
  const url = req.urlWithParams;

  return next(req).pipe(
    tap({
      error: (error) => {
        const duration = Math.round(performance.now() - startTime);
        console.error(
          `[HTTP ERROR] ${method} ${url} — ${error.status} ${error.statusText} (${duration}ms)`,
          error.error
        );
      }
    }),
    finalize(() => {
      const duration = Math.round(performance.now() - startTime);
      if (duration > 3000) {
        console.warn(`[HTTP SLOW] ${method} ${url} took ${duration}ms`);
      }
    })
  );
};
