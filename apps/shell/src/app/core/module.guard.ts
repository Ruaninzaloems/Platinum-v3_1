import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { AuthService } from '@platinumv3/shared/auth';

/**
 * Guards a module's routes by its side-nav module code. Used as `canMatch` so a
 * user without access never even lazy-loads the feature chunk — they are
 * redirected to the dashboard instead. superUsers pass everything (see
 * AuthService.canAccessModule).
 *
 * Usage: `{ path: 'assets', canMatch: [moduleGuard('assets')], loadChildren: … }`
 */
export function moduleGuard(code: string): CanMatchFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    return auth.canAccessModule(code) ? true : router.parseUrl('/dashboard');
  };
}
