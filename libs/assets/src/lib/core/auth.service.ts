import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';

export interface AuthUser {
  username: string;
  displayName: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _currentUser = signal<AuthUser | null>(this.loadUser());
  currentUser = this._currentUser.asReadonly();
  isAuthenticated = computed(() => !!this._currentUser());

  constructor(private router: Router) {}

  private loadUser(): AuthUser | null {
    try {
      const stored = localStorage.getItem('platinum_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  login(username: string, password: string): boolean {
    if (username === 'admin' && password === 'admin123') {
      const user: AuthUser = {
        username: 'admin',
        displayName: 'System Administrator',
        role: 'SYSTEM_ADMIN'
      };
      localStorage.setItem('platinum_user', JSON.stringify(user));
      localStorage.setItem('platinum_token', 'demo-token-' + Date.now());
      this._currentUser.set(user);
      return true;
    }
    return false;
  }

  logout(): void {
    localStorage.removeItem('platinum_user');
    localStorage.removeItem('platinum_token');
    this._currentUser.set(null);
    this.router.navigate(['/login']);
  }
}
