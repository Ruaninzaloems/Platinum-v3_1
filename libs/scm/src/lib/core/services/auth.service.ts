import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { inject } from '@angular/core';
import { tap, map, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
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

  private _currentUser = signal<User | null>(null);
  readonly currentUser = this._currentUser.asReadonly();
  readonly isLoggedIn = computed(() => !!this._currentUser());

  constructor() {
    this.loadStoredUser();
  }

  private loadStoredUser(): void {
    const storedUser = localStorage.getItem('platinum_user');
    const token = localStorage.getItem('platinum_token');
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
        localStorage.setItem('platinum_token', result.token);
        localStorage.setItem('platinum_user', JSON.stringify(result.user));
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

  getToken(): string | null {
    return localStorage.getItem('platinum_token');
  }

  hasPermission(area: string): boolean {
    const user = this._currentUser();
    if (!user) return false;
    if (user.superUser) return true;
    const storedPerms = user.permissions?.canView || [];
    if (storedPerms.includes('all') || storedPerms.includes(area)) return true;
    const rolePerms = ROLE_PERMISSIONS[user.role] || [];
    return rolePerms.includes('all') || rolePerms.includes(area);
  }

  hasRole(...roles: string[]): boolean {
    const user = this._currentUser();
    if (!user) return false;
    if (user.superUser || user.role === 'system_admin') return true;
    if (roles.includes(user.role)) return true;
    const userRoleKeys = (user.roles || []).map(r => resolveRoleKey(r));
    return roles.some(r => userRoleKeys.includes(r));
  }

  isAuditor(): boolean {
    const user = this._currentUser();
    return user?.role === 'internal_auditor';
  }

  isTemporaryPassword(): boolean {
    const user = this._currentUser();
    return user?.temporaryPassword || false;
  }

  private clearStorage(): void {
    localStorage.removeItem('platinum_token');
    localStorage.removeItem('platinum_user');
  }
}
