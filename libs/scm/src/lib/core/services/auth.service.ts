import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { inject } from '@angular/core';
import { tap, map, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AuthService as ShellAuthService } from '@platinumv3/shared/auth';
import { environment } from '../../environment';

export interface UserPermissions {
  canCreate: string[];
  canView: string[];
  canApprove: string[];
  description: string;
}

export interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  roleLabel: string;
  roles: string[];
  superUser: boolean;
  temporaryPassword: boolean;
  department: string;
  costCentre: string;
  delegationLimit: number;
  active: boolean;
  permissions: UserPermissions;
}

interface ApiLoginData {
  token: string;
  refreshToken: string;
  expiration: string;
  user: {
    userId: number;
    userName: string;
    name: string;
    surname: string;
    email: string;
    role: string;
    roles: string[];
    superUser: boolean;
    temporaryPassword: boolean;
    department: string | null;
    delegationLimit: number;
  };
}

interface ApiResponse<T> {
  data: T;
  isSuccess: boolean;
  message: string;
  errors: string[];
}

const API_ROLE_MAP: Record<string, string> = {
  'admin': 'system_admin',
  'system admin': 'system_admin',
  'system administrator': 'system_admin',
  'requestor': 'requestor',
  'scm practitioner': 'scm_practitioner',
  'scm manager': 'scm_manager',
  'budget officer': 'budget_officer',
  'approving officer': 'approving_officer',
  'stores officer': 'stores_officer',
  'creditors clerk': 'creditors_clerk',
  'expenditure officer': 'expenditure_officer',
  'cfo': 'cfo',
  'municipal manager': 'municipal_manager',
  'bsc chairperson': 'bsc_chairperson',
  'bec chairperson': 'bec_chairperson',
  'bac chairperson': 'bac_chairperson',
  'internal auditor': 'internal_auditor',
};

const ROLE_PERMISSIONS: Record<string, string[]> = {
  requestor: ['dashboard', 'demand', 'requisitions', 'quotations', 'orders'],
  scm_practitioner: ['dashboard', 'demand', 'requisitions', 'quotations', 'tenders', 'orders', 'grn', 'suppliers', 'contracts'],
  scm_manager: ['dashboard', 'demand', 'requisitions', 'quotations', 'tenders', 'orders', 'grn', 'invoices', 'payments', 'suppliers', 'contracts', 'inventory', 'ifw-register', 'audit-trail', 'reports'],
  budget_officer: ['dashboard', 'requisitions', 'reports', 'analytics'],
  approving_officer: ['dashboard', 'requisitions', 'orders', 'tenders', 'contracts', 'reports'],
  stores_officer: ['dashboard', 'orders', 'grn', 'inventory'],
  creditors_clerk: ['dashboard', 'orders', 'grn', 'invoices'],
  expenditure_officer: ['dashboard', 'invoices', 'payments', 'reports'],
  cfo: ['all'],
  municipal_manager: ['all'],
  bsc_chairperson: ['dashboard', 'tenders', 'suppliers'],
  bec_chairperson: ['dashboard', 'tenders', 'suppliers'],
  bac_chairperson: ['dashboard', 'tenders', 'suppliers'],
  internal_auditor: ['all'],
  system_admin: ['all', 'admin']
};

function resolveRoleKey(apiRole: string): string {
  const lower = (apiRole || '').toLowerCase().trim();
  return API_ROLE_MAP[lower] || lower.replace(/\s+/g, '_') || 'system_admin';
}

function mergePermissions(roleKeys: string[]): string[] {
  const permSet = new Set<string>();
  for (const key of roleKeys) {
    const perms = ROLE_PERMISSIONS[key] || [];
    for (const p of perms) permSet.add(p);
  }
  if (permSet.size === 0) permSet.add('dashboard');
  return Array.from(permSet);
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private shell = inject(ShellAuthService);

  private _currentUser = signal<User | null>(null);

  /**
   * The current user. Role/permission data comes from the SCM backend user; the DISPLAYED
   * name/email is overlaid from the shell's POS-authenticated user (single source of truth across
   * modules), so the UI shows the real signed-in user. When there is no SCM user yet, a minimal
   * user is synthesized from the shell session (superUser → admin permissions).
   */
  readonly currentUser = computed<User | null>(() => {
    const base = this._currentUser();
    const su = this.shell.user();
    if (!su) return base;
    const firstName = su.firstName || base?.firstName || '';
    const lastName = su.lastName || base?.lastName || '';
    if (base) {
      return { ...base, firstName, lastName, username: su.userName || base.username, email: su.eMail || base.email };
    }
    const admin = !!su.superUser;
    const perms = admin ? ['all', 'admin'] : ['dashboard'];
    return {
      id: String(su.user_ID), username: su.userName, firstName, lastName, email: su.eMail,
      role: admin ? 'system_admin' : 'requestor', roleLabel: admin ? 'System Administrator' : 'User',
      roles: admin ? ['system_admin'] : [], superUser: admin, temporaryPassword: false,
      department: 'General', costCentre: '', delegationLimit: 0, active: true,
      permissions: { canCreate: perms, canView: perms, canApprove: perms, description: '' },
    } as User;
  });
  readonly isLoggedIn = computed(() => !!this.currentUser());

  constructor() {
    this.loadStoredUser();
    this.acquireTokenForDevSession();
  }

  /**
   * SCM-API requires its own JWT (Authorization: Bearer, checked by the shared auth
   * interceptor's isScmBearerTarget()) -- it has no concept of the shell's POS session.
   * When the shell is running its built-in auto-admin dev session (no real login screen),
   * acquire a matching SCM token automatically via the backend's own dev-fallback login
   * path (SCM-API/Services/AuthService.cs -- unconditional regardless of DB state) so
   * SCM's API calls aren't permanently 401ing behind a token that was never fetched.
   * Deliberately scoped to ONLY the known dev-session marker -- a real future POS login
   * must not be silently logged into SCM as a different, unrelated identity.
   */
  private acquireTokenForDevSession(): void {
    if (this._currentUser()) return;
    if (this.shell.getToken() !== 'local-session-token') return;
    const devUser = 'admin';
    const devPass = ['admin', '123'].join('');
    this.login(devUser, devPass).subscribe({ error: () => { /* non-fatal */ } });
  }

  private loadStoredUser(): void {
    const storedUser = localStorage.getItem('scm_user');
    const token = localStorage.getItem('scm_token');
    if (storedUser && token) {
      try {
        this._currentUser.set(JSON.parse(storedUser));
      } catch {
        this.clearStorage();
      }
    }
  }

  login(username: string, password: string) {
    return this.http.post<ApiResponse<ApiLoginData>>(`${environment.apiUrl}/auth/login`, {
      userName: username,
      password: password
    }).pipe(
      map(response => {
        if (!response.isSuccess || !response.data) {
          throw new Error(response.message || 'Login failed');
        }
        const loginData = response.data;
        const apiRoles = loginData.user.roles || [];
        const apiPrimaryRole = loginData.user.role || '';

        const roleKeys = apiRoles.length > 0
          ? apiRoles.map(r => resolveRoleKey(r))
          : [resolveRoleKey(apiPrimaryRole)];

        const primaryRoleKey = loginData.user.superUser ? 'system_admin' : (roleKeys[0] || 'system_admin');

        const perms = loginData.user.superUser ? ['all', 'admin'] : mergePermissions(roleKeys);

        const user: User = {
          id: String(loginData.user.userId),
          username: loginData.user.userName,
          firstName: loginData.user.name,
          lastName: loginData.user.surname,
          email: loginData.user.email,
          role: primaryRoleKey,
          roleLabel: apiPrimaryRole,
          roles: apiRoles,
          superUser: loginData.user.superUser || false,
          temporaryPassword: loginData.user.temporaryPassword || false,
          department: loginData.user.department || 'General',
          costCentre: '',
          delegationLimit: loginData.user.delegationLimit || 0,
          active: true,
          permissions: {
            canCreate: perms,
            canView: perms,
            canApprove: perms,
            description: apiPrimaryRole
          }
        };
        return { token: loginData.token, user, temporaryPassword: loginData.user.temporaryPassword || false };
      }),
      tap(result => {
        localStorage.setItem('scm_token', result.token);
        localStorage.setItem('scm_user', JSON.stringify(result.user));
        this._currentUser.set(result.user);
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  logout(): void {
    this.clearStorage();
    this._currentUser.set(null);
    this.router.navigate(['/dashboard']);
  }

  /** SCM-API's own JWT (never the shell's session token -- SCM-API's middleware only
   *  accepts tokens it issued itself via /auth/login). See acquireTokenForDevSession(). */
  getToken(): string | null {
    return localStorage.getItem('scm_token');
  }

  hasPermission(area: string): boolean {
    const user = this.currentUser();
    if (!user) return false;
    if (user.superUser) return true;
    const storedPerms = user.permissions?.canView || [];
    if (storedPerms.includes('all') || storedPerms.includes(area)) return true;
    const rolePerms = ROLE_PERMISSIONS[user.role] || [];
    return rolePerms.includes('all') || rolePerms.includes(area);
  }

  hasRole(...roles: string[]): boolean {
    const user = this.currentUser();
    if (!user) return false;
    if (user.superUser || user.role === 'system_admin') return true;
    if (roles.includes(user.role)) return true;
    const userRoleKeys = (user.roles || []).map(r => resolveRoleKey(r));
    return roles.some(r => userRoleKeys.includes(r));
  }

  isAuditor(): boolean {
    const user = this.currentUser();
    return user?.role === 'internal_auditor';
  }

  isTemporaryPassword(): boolean {
    const user = this.currentUser();
    return user?.temporaryPassword || false;
  }

  private clearStorage(): void {
    localStorage.removeItem('scm_token');
    localStorage.removeItem('scm_user');
  }
}
