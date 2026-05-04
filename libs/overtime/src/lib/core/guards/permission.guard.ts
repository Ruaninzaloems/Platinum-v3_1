import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs/operators';
import { UserContextService } from '../services/user-context.service';

function makeGuard(flagKey: 'canAccessConfig' | 'canAccessCapture' | 'canAccessPayroll' | 'canAccessEnquiry', pageName: string): CanActivateFn {
  return () => {
    const userCtx = inject(UserContextService);
    const router  = inject(Router);
    const denied  = router.createUrlTree(['/overtime/access-denied'], { queryParams: { page: pageName } });

    const me = userCtx.me();

    if (me !== null) {
      return me[flagKey] ? true : denied;
    }

    return toObservable(userCtx.me).pipe(
      filter(u => u !== null),
      take(1),
      map(u => (u![flagKey] ? true : denied))
    );
  };
}

export const canAccessConfigGuard: CanActivateFn  = makeGuard('canAccessConfig',  'Configuration');
export const canAccessCaptureGuard: CanActivateFn = makeGuard('canAccessCapture', 'Overtime Capture');
export const canAccessPayrollGuard: CanActivateFn = makeGuard('canAccessPayroll', 'Payroll Processing');
export const canAccessEnquiryGuard: CanActivateFn = makeGuard('canAccessEnquiry', 'Overtime Enquiry');
