import { HttpInterceptorFn } from '@angular/common/http';

import { environment } from '@env/environment';

/**
 * Backend `auth` middleware identifies the caller via the `x-user`
 * header (username). Until proper JWT auth is wired in we send the
 * configured demo username so dev API calls authenticate cleanly.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const cloned = req.clone({
    setHeaders: { 'x-user': environment.demoUser },
    withCredentials: true,
  });
  return next(cloned);
};
