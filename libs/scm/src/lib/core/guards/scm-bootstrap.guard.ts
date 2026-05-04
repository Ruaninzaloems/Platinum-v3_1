import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { from, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

let bootstrapInFlight: Promise<boolean> | null = null;

function hasToken(token: string | null): boolean {
  return !!token && token.length > 0;
}

function isJwt(token: string | null): boolean {
  return !!token && token.split('.').length === 3 && token.startsWith('eyJ');
}

export const scmBootstrapGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = localStorage.getItem('platinum_token');

  if (hasToken(token)) {
    if (!isJwt(token)) {
      const storedUser = localStorage.getItem('platinum_user');
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          if (user.superUser || user.role === 'admin') {
            return true;
          }
        } catch {}
      }
    } else {
      return true;
    }
  }

  if (!bootstrapInFlight) {
    bootstrapInFlight = new Promise<boolean>((resolve) => {
      authService.login('admin', 'admin123').subscribe({
        next: () => {
          bootstrapInFlight = null;
          const t = localStorage.getItem('platinum_token');
          resolve(hasToken(t));
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
