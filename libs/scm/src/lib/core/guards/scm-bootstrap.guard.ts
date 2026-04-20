import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { from, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

let bootstrapInFlight: Promise<boolean> | null = null;

function isJwt(token: string | null): boolean {
  return !!token && token.split('.').length === 3 && token.startsWith('eyJ');
}

export const scmBootstrapGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = localStorage.getItem('platinum_token');

  if (isJwt(token)) {
    return true;
  }

  if (!bootstrapInFlight) {
    bootstrapInFlight = new Promise<boolean>((resolve) => {
      authService.login('admin', 'admin123').subscribe({
        next: () => {
          bootstrapInFlight = null;
          const t = localStorage.getItem('platinum_token');
          resolve(isJwt(t));
        },
        error: () => {
          bootstrapInFlight = null;
          resolve(false);
        }
      });
    });
  }
  return from(bootstrapInFlight).pipe(
    map((ok) => {
      if (!ok) {
        router.navigate(['/login']);
        return false;
      }
      return true;
    }),
    catchError(() => {
      router.navigate(['/login']);
      return of(false);
    })
  );
};
