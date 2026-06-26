import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

/**
 * Access Management data source — the George Platinum API.
 *
 * Reached through the shell proxy at /george-app/api (→ georgeplatinumuatapi.azurewebsites.net/api)
 * so browser CORS isn't an issue. The auth interceptor attaches the Bearer token
 * (a dedicated `george_token` in localStorage if present, otherwise the session token).
 *
 * The upstream JSON shapes aren't published, so mapping is defensive: each field tries
 * several common property names.
 */
const GEORGE_API = '/george-app/api';

export interface AmUser {
  userId: string;
  name: string;
  email: string;
  enabled: boolean;
  roles: string[];
  raw: any;            // original record (for the edit dialog / save)
}

export interface AmRole {
  id: string;
  name: string;
  raw: any;
}

const pick = (o: any, ...keys: string[]): any => {
  for (const k of keys) {
    if (o && o[k] !== undefined && o[k] !== null && o[k] !== '') return o[k];
  }
  return undefined;
};

/** Normalise a roles value that may be string[], {name}[], or a comma string. */
const toRoleNames = (v: any): string[] => {
  if (!v) return [];
  if (typeof v === 'string') return v.split(',').map(s => s.trim()).filter(Boolean);
  if (Array.isArray(v)) {
    return v
      .map(r => (typeof r === 'string' ? r : pick(r, 'name', 'roleName', 'role', 'description', 'code', 'moduleName')))
      .filter(Boolean)
      .map((s: any) => String(s).trim());
  }
  return [];
};

@Injectable({ providedIn: 'root' })
export class AccessManagementService {
  private http = inject(HttpClient);

  /** All users. */
  getUsers(): Observable<AmUser[]> {
    return this.http.get<any>(`${GEORGE_API}/User`).pipe(map(res => this.toUsers(res)));
  }

  /** All assignable roles. */
  getRoles(): Observable<AmRole[]> {
    return this.http.get<any>(`${GEORGE_API}/usermodules/roles`).pipe(map(res => this.toRoles(res)));
  }

  /** Persist a user's role assignment. Endpoint shape is unconfirmed — adjust once known. */
  saveUserRoles(user: AmUser, roleNames: string[]): Observable<any> {
    return this.http.put(`${GEORGE_API}/User/${user.userId}`, { ...user.raw, roles: roleNames });
  }

  // ── mapping ──────────────────────────────────────────────────────────────
  private toUsers(res: any): AmUser[] {
    const list: any[] = Array.isArray(res) ? res : (res?.data ?? res?.items ?? res?.users ?? res?.value ?? []);
    return list.map(u => ({
      userId: String(pick(u, 'userID', 'userId', 'id', 'user_ID', 'userId') ?? ''),
      name: String(
        pick(u, 'name', 'displayName', 'fullName', 'userName', 'username') ??
        [pick(u, 'firstName', 'firstname'), pick(u, 'lastName', 'lastname', 'surname')].filter(Boolean).join(' ') ??
        ''
      ).trim(),
      email: String(pick(u, 'email', 'eMail', 'emailAddress', 'mail') ?? ''),
      enabled: Boolean(pick(u, 'enabled', 'isEnabled', 'active', 'isActive') ?? false),
      roles: toRoleNames(pick(u, 'roles', 'assignedRoles', 'userRoles', 'modules', 'userModules')),
      raw: u,
    }));
  }

  private toRoles(res: any): AmRole[] {
    const list: any[] = Array.isArray(res) ? res : (res?.data ?? res?.items ?? res?.roles ?? res?.value ?? []);
    return list.map(r => {
      const name = typeof r === 'string' ? r : String(pick(r, 'name', 'roleName', 'role', 'description', 'code', 'moduleName') ?? '');
      return { id: String(typeof r === 'string' ? r : (pick(r, 'id', 'roleId', 'roleID', 'code') ?? name)), name, raw: r };
    }).filter(r => r.name);
  }
}
