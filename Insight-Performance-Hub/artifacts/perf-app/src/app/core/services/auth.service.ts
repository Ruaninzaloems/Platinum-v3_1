import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, tap } from 'rxjs';
import { User, ROLE_NAV_ACCESS, PATH_SECTION_MAP } from '../models/user.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly _user = signal<User | null>(null);
  private readonly _loading = signal<boolean>(true);
  private hydrated = false;

  readonly user = this._user.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly role = computed(() => this._user()?.role ?? '');
  readonly displayName = computed(() => this._user()?.displayName ?? this._user()?.username ?? 'Guest');
  readonly isAuthenticated = computed(() => this._user() !== null);
  readonly hasFullAccess = computed(() => (ROLE_NAV_ACCESS[this.role()] ?? []).includes('*'));

  loadCurrentUser(): Observable<User | null> {
    if (this.hydrated && this._user()) return of(this._user());
    this._loading.set(true);
    return this.http.get<User>(`${environment.apiBaseUrl}/auth/me`).pipe(
      tap((u) => {
        this._user.set(u);
        this._loading.set(false);
        this.hydrated = true;
      }),
      catchError(() => {
        if (environment.allowDevAuthFallback) {
          const fallback: User = {
            id: 0,
            username: environment.demoUser,
            displayName: 'Dev User',
            email: '',
            role: 'system_admin',
            departmentId: null,
            isActive: true,
            permissions: ['*'],
          };
          this._user.set(fallback);
        } else {
          this._user.set(null);
        }
        this._loading.set(false);
        this.hydrated = true;
        return of(this._user());
      }),
    );
  }

  logout(): void {
    this._user.set(null);
    this.hydrated = false;
  }

  canAccessSection(sectionTitle: string): boolean {
    if (sectionTitle === 'Dashboard') return true;
    if (this.hasFullAccess()) return true;
    const allowed = ROLE_NAV_ACCESS[this.role()] ?? [];
    return allowed.includes(sectionTitle);
  }

  canAccessPath(path: string): boolean {
    if (!this._user()) return false;
    if (path === '/' || path === '' || path === '/dashboard') return true;
    if (this.hasFullAccess()) return true;
    const match = PATH_SECTION_MAP.find(([prefix]) => path.startsWith(prefix));
    if (!match) return false;
    return this.canAccessSection(match[1]);
  }
}
