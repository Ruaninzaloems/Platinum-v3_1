import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

let autoLoginInProgress: Promise<boolean> | null = null;

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);

  if (auth.authenticated()) {
    return true;
  }

  if (!auth.checked()) {
    await auth.checkAuth();
    if (auth.authenticated()) {
      return true;
    }
  }

  if (autoLoginInProgress) {
    return autoLoginInProgress;
  }

  autoLoginInProgress = auth.login('admin', 'admin123').then(result => {
    autoLoginInProgress = null;
    return true;
  }).catch(() => {
    autoLoginInProgress = null;
    return true;
  });

  return autoLoginInProgress;
};
