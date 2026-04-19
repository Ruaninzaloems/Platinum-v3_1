import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService as ShellAuthService } from '@platinumv3/shared/auth';

export interface AuthUser {
  user_ID: number;
  userName: string;
  firstName: string;
  lastName: string;
  eMail: string;
  enabled: boolean;
  superUser: boolean;
  cashFloat: number;
  finYear: string;
}

export interface SiteInfo {
  id: string;
  name: string;
  logo: string;
  themeClass: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private shell = inject(ShellAuthService);
  private router = inject(Router);

  private _site = signal<SiteInfo>({
    id: 'site01',
    name: 'Mnquma Local Municipality',
    logo: '',
    themeClass: '',
  });
  private _checked = signal(true);

  user = computed<AuthUser | null>(() => {
    const u = this.shell.user();
    if (!u) return null;
    return {
      user_ID: Number(u.id) || 0,
      userName: u.email?.split('@')[0] || '',
      firstName: u.firstName || '',
      lastName: u.lastName || '',
      eMail: u.email || '',
      enabled: true,
      superUser: (u.roles || []).includes('admin') || (u.permissions || []).includes('*'),
      cashFloat: 0,
      finYear: '2025/2026',
    };
  });

  site = this._site.asReadonly();
  authenticated = computed(() => this.shell.isAuthenticated());
  checked = this._checked.asReadonly();
  isSite02 = computed(() => this._site().id === 'site02');

  async checkAuth(): Promise<boolean> {
    return this.shell.isAuthenticated();
  }

  async login(_username: string, _password: string, _siteId?: string): Promise<{ success: boolean; error?: string }> {
    return { success: this.shell.isAuthenticated(), error: this.shell.isAuthenticated() ? undefined : 'Please sign in via the main login page.' };
  }

  async logout(): Promise<void> {
    this.shell.logout();
  }
}
