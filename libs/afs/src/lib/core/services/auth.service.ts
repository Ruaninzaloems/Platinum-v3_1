import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService as ShellAuthService } from '@platinumv3/shared/auth';
import { ApiService } from './api.service';
import { User, LoginResponse } from '../models/interfaces';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private shell = inject(ShellAuthService);
  private currentUser = signal<User | null>(null);
  private token = signal<string | null>(null);

  // The signed-in identity is the shell's POS-authenticated user (single source of truth across
  // modules), mapped into the AFS User shape; falls back to any AFS-local session.
  user = computed<User | null>(() => {
    const su = this.shell.user();
    if (su) {
      return {
        id: String(su.user_ID),
        email: su.eMail,
        firstName: su.firstName,
        lastName: su.lastName,
        tenantId: 'default',
        roles: su.superUser ? ['admin'] : ['user'],
        permissions: su.superUser ? ['*'] : [],
      } as User;
    }
    return this.currentUser();
  });
  isAuthenticated = computed(() => !!this.shell.user() || !!this.token());
  userRoles = computed(() => this.user()?.roles || []);
  userPermissions = computed(() => this.user()?.permissions || []);

  constructor(private api: ApiService, private router: Router) {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      this.token.set(savedToken);
      this.currentUser.set(JSON.parse(savedUser));
    }
  }

  /** Token from the shared POS session (single source), falling back to any AFS-local token. */
  getToken(): string | null {
    return this.shell.getToken() ?? this.token();
  }

  setEmbeddedSession() {
    const embeddedUser: User = {
      id: 'embedded',
      email: 'admin@platinum.gov.za',
      firstName: 'System',
      lastName: 'Admin',
      tenantId: 'default',
      roles: ['admin'],
      permissions: ['*']
    };
    this.token.set('embedded-session');
    this.currentUser.set(embeddedUser);
  }

  login(email: string, password: string) {
    return this.api.post<LoginResponse>('/auth/login', { email, password });
  }

  handleLoginSuccess(response: LoginResponse) {
    this.token.set(response.accessToken);
    this.currentUser.set(response.user);
    localStorage.setItem('token', response.accessToken);
    localStorage.setItem('user', JSON.stringify(response.user));
    if ((response.user as any).mustResetPassword) {
      this.router.navigate(['/change-password']);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  changePassword(currentPassword: string, newPassword: string) {
    return this.api.post<{ message: string }>('/auth/change-password', { currentPassword, newPassword });
  }

  clearMustResetPassword() {
    const user = this.currentUser();
    if (user) {
      const updated = { ...user, mustResetPassword: false } as any;
      this.currentUser.set(updated);
      localStorage.setItem('user', JSON.stringify(updated));
    }
  }

  logout() {
    this.token.set(null);
    this.currentUser.set(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }

  hasRole(role: string): boolean {
    return this.userRoles().includes(role);
  }

  hasPermission(permission: string): boolean {
    return this.userPermissions().includes(permission);
  }

  hasAnyRole(...roles: string[]): boolean {
    return roles.some(r => this.hasRole(r));
  }
}
