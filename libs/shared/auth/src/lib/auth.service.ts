import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  permissions: string[];
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUser = signal<User | null>(null);
  private tokenSignal = signal<string | null>(null);

  user = this.currentUser.asReadonly();
  isAuthenticated = computed(() => !!this.tokenSignal());
  userRoles = computed(() => this.currentUser()?.roles || []);

  constructor(private http: HttpClient, private router: Router) {
    const savedToken = localStorage.getItem('platinum_token');
    const savedUser = localStorage.getItem('platinum_user');
    if (savedToken && savedUser) {
      this.tokenSignal.set(savedToken);
      try { this.currentUser.set(JSON.parse(savedUser)); } catch {}
    }
  }

  getToken(): string | null {
    return this.tokenSignal();
  }

  login(username: string, password: string) {
    return this.http.post<{ token: string; user: User }>('/api/auth/login', { username, password });
  }

  handleLoginSuccess(response: { token: string; user: User }) {
    this.tokenSignal.set(response.token);
    this.currentUser.set(response.user);
    localStorage.setItem('platinum_token', response.token);
    localStorage.setItem('platinum_user', JSON.stringify(response.user));
    this.router.navigate(['/dashboard']);
  }

  setLocalSession(username: string) {
    const user: User = {
      id: '1',
      email: `${username}@platinum.gov.za`,
      firstName: 'System',
      lastName: 'Admin',
      roles: ['admin'],
      permissions: ['*']
    };
    this.tokenSignal.set('local-session-token');
    this.currentUser.set(user);
    localStorage.setItem('platinum_token', 'local-session-token');
    localStorage.setItem('platinum_user', JSON.stringify(user));
  }

  logout() {
    this.tokenSignal.set(null);
    this.currentUser.set(null);
    localStorage.removeItem('platinum_token');
    localStorage.removeItem('platinum_user');
    this.router.navigate(['/login']);
  }

  hasRole(role: string): boolean {
    return this.userRoles().includes(role);
  }
}
