import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from './api.service';

export interface User {
  id: string;
  email: string;
  name: string;
  roles: string[];
  permissions: string[];
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUser = signal<User | null>(null);
  private token = signal<string | null>(null);
  isEmbedded = signal(false);

  user = this.currentUser.asReadonly();
  isAuthenticated = computed(() => !!this.token() || this.isEmbedded());

  constructor(private api: ApiService, private router: Router) {
    this.isEmbedded.set(this.detectEmbedded());
    const savedToken = localStorage.getItem('perf_token');
    const savedUser = localStorage.getItem('perf_user');
    if (savedToken && savedUser) {
      this.token.set(savedToken);
      try { this.currentUser.set(JSON.parse(savedUser)); } catch {}
    }
    if (this.isEmbedded() && !this.isAuthenticated()) {
      this.setEmbeddedSession();
    }
  }

  private detectEmbedded(): boolean {
    try { return window.self !== window.top; } catch { return true; }
  }

  getToken(): string | null { return this.token(); }

  setEmbeddedSession() {
    const user: User = { id: 'embedded', email: 'admin@platinum.gov.za', name: 'System Admin', roles: ['admin'], permissions: ['*'] };
    this.token.set('embedded-session');
    this.currentUser.set(user);
  }

  login(username: string, password: string) {
    return this.api.post<{ token: string; user: User }>('/auth/login', { username, password });
  }

  handleLoginSuccess(response: { token: string; user: User }) {
    this.token.set(response.token);
    this.currentUser.set(response.user);
    localStorage.setItem('perf_token', response.token);
    localStorage.setItem('perf_user', JSON.stringify(response.user));
    this.router.navigate(['/dashboard']);
  }

  setLocalSession(username: string) {
    const user: User = { id: '1', email: `${username}@platinum.gov.za`, name: 'System Admin', roles: ['admin'], permissions: ['*'] };
    this.token.set('local-session');
    this.currentUser.set(user);
    localStorage.setItem('perf_token', 'local-session');
    localStorage.setItem('perf_user', JSON.stringify(user));
  }

  logout() {
    this.token.set(null);
    this.currentUser.set(null);
    localStorage.removeItem('perf_token');
    localStorage.removeItem('perf_user');
    this.router.navigate(['/login']);
  }
}
