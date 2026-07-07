import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

/**
 * Access Management data source — POS-API (the identity provider).
 *
 * Reached through the shell proxy at /pos-app/api (→ localhost:3003 in dev). The
 * module-access tables live in the shared ems_v3 DB; the tenant is resolved
 * server-side from the session's site config.
 *
 *   GET  /api/users            tenant users + their assigned roleIds
 *   GET  /api/roles            role catalogue (id, name, isAdmin/isBase, moduleCodes)
 *   PUT  /api/user-roles/:id   replace a user's role assignment ({ roleIds })
 */
const POS_API = '/pos-app/api';

export interface AmUser {
  userId: string;
  name: string;
  email: string;
  enabled: boolean;
  roleIds: number[];      // assigned role IDs
  roles: string[];        // assigned role names (resolved via the catalogue)
  raw: any;
}

export interface AmRole {
  id: number;
  name: string;
  isAdmin: boolean;
  isBase: boolean;
  moduleCodes: string[];
  raw: any;
}

@Injectable({ providedIn: 'root' })
export class AccessManagementService {
  private http = inject(HttpClient);

  /** All assignable roles. */
  getRoles(): Observable<AmRole[]> {
    return this.http.get<any[]>(`${POS_API}/roles`).pipe(
      map((res) => (res || []).map((r) => ({
        id: Number(r.roleId ?? r.id),
        name: String(r.roleName ?? r.name ?? ''),
        isAdmin: !!r.isAdmin,
        isBase: !!r.isBase,
        moduleCodes: Array.isArray(r.moduleCodes) ? r.moduleCodes : [],
        raw: r,
      })).filter((r) => r.name)),
    );
  }

  /** All tenant users with their assigned role IDs, resolved to names via the catalogue. */
  getUsers(roles: AmRole[]): Observable<AmUser[]> {
    const nameById = new Map(roles.map((r) => [r.id, r.name]));
    return this.http.get<any[]>(`${POS_API}/users`).pipe(
      map((res) => (res || []).map((u) => {
        const roleIds: number[] = Array.isArray(u.roleIds) ? u.roleIds.map((n: any) => Number(n)) : [];
        return {
          userId: String(u.userId ?? ''),
          name: String(u.name ?? u.userName ?? '').trim(),
          email: String(u.email ?? ''),
          enabled: !!u.enabled,
          roleIds,
          roles: roleIds.map((id) => nameById.get(id)).filter(Boolean) as string[],
          raw: u,
        };
      })),
    );
  }

  /** Persist a user's role assignment. */
  saveUserRoles(user: AmUser, roleIds: number[]): Observable<any> {
    return this.http.put(`${POS_API}/user-roles/${user.userId}`, { roleIds });
  }
}
