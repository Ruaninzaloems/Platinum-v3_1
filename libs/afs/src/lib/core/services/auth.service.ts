import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { User, LoginResponse } from '../models/interfaces';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUser = signal<User | null>(null);
  private token = signal<string | null>(null);

  user = this.currentUser.asReadonly();
  isAuthenticated = computed(() => !!this.token());
  userRoles = computed(() => this.currentUser()?.roles || []);
  userPermissions = computed(() => this.currentUser()?.permissions || []);

  constructor(private api: ApiService, private router: Router) {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      this.token.set(savedToken);
      this.currentUser.set(JSON.parse(savedUser));
    }
  }

  getToken(): string | null {
    return this.token();
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
