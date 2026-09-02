import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Global (cross-module) Users/Roles/Permissions admin — POS-API's new
 * /api/security/* endpoints (ems-security.ts / routes/security.routes.ts).
 *
 * Reached through the shell proxy at /pos-app/api, same as
 * AccessManagementService — but a DIFFERENT backend schema: this one is the
 * real legacy EMS security tables (Sys_Permission, Sys_RolePermission,
 * User_UserRoles, etc.), not the module-tile-visibility schema
 * AccessManagementService talks to. Do not merge the two.
 */
const POS_API = '/pos-app/api/security';

export interface SecurityUser {
  userId: number;
  userName: string;
  firstName: string;
  lastName: string;
  email: string;
  enabled: boolean;
  superUser: boolean;
  lastLoginDate: string | null;
}

export interface PagedUsers {
  data: SecurityUser[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface SecurityRole {
  roleId: number;
  roleDesc: string;
  enabled: boolean;
  permissionCount: number;
}

export interface SecurityPermission {
  permissionId: number;
  moduleId: number;
  moduleHeader: string;
  levelDesc: string;
  permissionName: string;
  permissionDesc: string;
  displayOrder: number;
}

export interface RoleAssignment {
  roleId: number;
  roleDesc: string;
  delegatedByUserId: number | null;
  delegationStart: string | null;
  delegationExpiry: string | null;
}

export interface RoleAssignmentInput {
  roleId: number;
  delegatedByUserId: number | null;
  delegationStart: string | null;
  delegationExpiry: string | null;
}

export interface MyPermissions {
  isSuperUser: boolean;
  permissionIds: number[];
}

@Injectable({ providedIn: 'root' })
export class UserRolesAdminService {
  private http = inject(HttpClient);

  getUsers(params: { search?: string; enabled?: boolean; page: number; pageSize: number }): Observable<PagedUsers> {
    let query = `page=${params.page}&pageSize=${params.pageSize}`;
    if (params.search) query += `&search=${encodeURIComponent(params.search)}`;
    if (params.enabled !== undefined) query += `&enabled=${params.enabled}`;
    return this.http.get<PagedUsers>(`${POS_API}/users?${query}`);
  }

  getUser(userId: number): Observable<SecurityUser> {
    return this.http.get<SecurityUser>(`${POS_API}/users/${userId}`);
  }

  createUser(input: Partial<SecurityUser> & { password: string }): Observable<SecurityUser> {
    return this.http.post<SecurityUser>(`${POS_API}/users`, input);
  }

  updateUser(userId: number, input: Partial<SecurityUser>): Observable<SecurityUser> {
    return this.http.put<SecurityUser>(`${POS_API}/users/${userId}`, input);
  }

  setUserEnabled(userId: number, enabled: boolean): Observable<any> {
    return this.http.patch(`${POS_API}/users/${userId}/enabled`, { enabled });
  }

  getUserRoles(userId: number): Observable<RoleAssignment[]> {
    return this.http.get<RoleAssignment[]>(`${POS_API}/users/${userId}/roles`);
  }

  saveUserRoles(userId: number, roles: RoleAssignmentInput[]): Observable<any> {
    return this.http.put(`${POS_API}/users/${userId}/roles`, { roles });
  }

  getDelegatedRoles(userId: number): Observable<RoleAssignment[]> {
    return this.http.get<RoleAssignment[]>(`${POS_API}/users/${userId}/delegated-roles`);
  }

  getUserPermissions(userId: number): Observable<MyPermissions> {
    return this.http.get<MyPermissions>(`${POS_API}/users/${userId}/permissions`);
  }

  getMyPermissions(): Observable<MyPermissions> {
    return this.http.get<MyPermissions>(`${POS_API}/users/me/permissions`);
  }

  getRoles(enabledOnly = false): Observable<SecurityRole[]> {
    return this.http.get<SecurityRole[]>(`${POS_API}/roles?enabledOnly=${enabledOnly}`);
  }

  getRole(roleId: number): Observable<SecurityRole> {
    return this.http.get<SecurityRole>(`${POS_API}/roles/${roleId}`);
  }

  createRole(roleDesc: string): Observable<SecurityRole> {
    return this.http.post<SecurityRole>(`${POS_API}/roles`, { roleDesc });
  }

  updateRole(roleId: number, roleDesc: string): Observable<SecurityRole> {
    return this.http.put<SecurityRole>(`${POS_API}/roles/${roleId}`, { roleDesc });
  }

  setRoleEnabled(roleId: number, enabled: boolean): Observable<any> {
    return this.http.patch(`${POS_API}/roles/${roleId}/enabled`, { enabled });
  }

  getRolePermissions(roleId: number): Observable<{ permissionIds: number[] }> {
    return this.http.get<{ permissionIds: number[] }>(`${POS_API}/roles/${roleId}/permissions`);
  }

  saveRolePermissions(roleId: number, permissionIds: number[]): Observable<any> {
    return this.http.put(`${POS_API}/roles/${roleId}/permissions`, { permissionIds });
  }

  getUsersInRole(roleId: number): Observable<SecurityUser[]> {
    return this.http.get<SecurityUser[]>(`${POS_API}/roles/${roleId}/users`);
  }

  getPermissions(moduleId?: number): Observable<SecurityPermission[]> {
    const query = moduleId != null ? `?moduleId=${moduleId}` : '';
    return this.http.get<SecurityPermission[]>(`${POS_API}/permissions${query}`);
  }

  /** No real backing table exists yet — expect a 501, not empty data pretending to be real. */
  getSegregationRules(): Observable<{ message: string; rules: any[] }> {
    return this.http.get<{ message: string; rules: any[] }>(`${POS_API}/segregation-rules`);
  }
}
