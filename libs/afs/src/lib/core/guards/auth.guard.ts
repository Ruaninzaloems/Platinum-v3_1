import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

function isEmbedded(): boolean {
  try { return window.self !== window.top; } catch { return true; }
}

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (isEmbedded()) {
    if (!authService.isAuthenticated()) {
      authService.setEmbeddedSession();
    }
    return true;
  }

  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  const user = authService.user();
  if ((user as any)?.mustResetPassword && state.url !== '/change-password') {
    router.navigate(['/change-password']);
    return false;
  }

  return true;
};
