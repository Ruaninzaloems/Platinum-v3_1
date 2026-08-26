import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.user()) {
    await firstValueFrom(auth.loadCurrentUser());
  }
  if (auth.user()) return true;
  if (environment.allowDevAuthFallback) return true;
  return router.createUrlTree(['/login']);
};

export const accessGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  if (!auth.user()) return true; // authGuard handled it
  // Always allow the access-denied page itself to avoid redirect loops.
  if (state.url.startsWith('/access-denied')) return true;
  if (auth.canAccessPath(state.url)) return true;
  return inject(Router).createUrlTree(['/access-denied']);
};
