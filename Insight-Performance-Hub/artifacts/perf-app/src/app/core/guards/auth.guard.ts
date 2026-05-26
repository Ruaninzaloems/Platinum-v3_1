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

export const accessGuard: CanActivateFn = () => {
  // Permission checks disabled — all authenticated users can access every section.
  return true;
};
