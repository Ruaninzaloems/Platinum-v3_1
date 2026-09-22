import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  UserRolesAdminService, SecurityUser, SecurityRole, SecurityPermission,
  RoleAssignment, RoleAssignmentInput,
} from './user-roles-admin.service';

/**
 * Settings → "User & Roles" — the GLOBAL, cross-module counterpart to
 * Access Management. Access Management controls which module tiles a user
 * sees (a coarse concept in POS-API's own ems_v3 schema); this page manages
 * fine-grained page/action permissions via the real legacy EMS security
 * tables (Sys_Permission, Sys_RolePermission, User_UserRoles, etc.) that SCM
 * already uses for its own module — here generalized across every module.
 *
 * Routed at /settings/user-roles and /admin-settings/user-roles.
 */
@Component({
  selector: 'app-user-roles-admin',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatPaginatorModule, MatProgressBarModule, MatTooltipModule, MatTabsModule,
    MatDialogModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ura-page">
      <mat-tab-group animationDuration="0ms" style="background:white;border-radius:12px;border:1px solid #e2e8f0">

        <mat-tab label="Users">
          <div style="padding:20px">
            <div class="ura-toolbar">
              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="ura-search">
                <mat-icon matPrefix>search</mat-icon>
                <input matInput placeholder="Search by username, name, email…" [(ngModel)]="userSearch" (ngModelChange)="onUserSearch()">
              </mat-form-field>
              <button mat-icon-button matTooltip="Refresh" (click)="loadUsers()"><mat-icon>refresh</mat-icon></button>
              <span class="ura-count">{{ userTotal() }} user{{ userTotal() === 1 ? '' : 's' }}</span>
            </div>

            @if (userLoading()) { <mat-progress-bar mode="indeterminate"></mat-progress-bar> }
            @if (userError()) { <div class="ura-error"><mat-icon>error_outline</mat-icon><div>{{ userError() }}</div></div> }

            <div class="ura-table-wrap">
              <table class="ura-table">
                <thead>
                  <tr>
                    <th>Username</th><th>Name</th><th>Email</th><th style="width:90px">Enabled</th>
                    <th style="width:90px">SuperUser</th><th style="width:140px;text-align:right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (u of users(); track u.userId) {
                    <tr>
                      <td>{{ u.userName }}</td>
                      <td>{{ (u.firstName + ' ' + u.lastName).trim() || '—' }}</td>
                      <td class="ura-muted">{{ u.email || '—' }}</td>
                      <td><span class="ura-pill" [class.on]="u.enabled">{{ u.enabled ? 'Yes' : 'No' }}</span></td>
                      <td><span class="ura-pill" [class.on]="u.superUser">{{ u.superUser ? 'Yes' : 'No' }}</span></td>
                      <td style="text-align:right">
                        <button mat-icon-button matTooltip="Manage roles" (click)="editUserRoles(u)"><mat-icon>admin_panel_settings</mat-icon></button>
                        <button mat-icon-button [matTooltip]="u.enabled ? 'Disable user' : 'Enable user'" (click)="toggleUserEnabled(u)">
                          <mat-icon>{{ u.enabled ? 'block' : 'check_circle' }}</mat-icon>
                        </button>
                      </td>
                    </tr>
                  }
                  @if (!userLoading() && !users().length) {
                    <tr><td colspan="6" class="ura-empty">No users to display.</td></tr>
                  }
                </tbody>
              </table>
            </div>

            <mat-paginator
              [length]="userTotal()" [pageSize]="userPageSize()" [pageIndex]="userPageIndex()"
              [pageSizeOptions]="[10, 25, 50]" (page)="onUserPage($event)">
            </mat-paginator>
          </div>
        </mat-tab>

        <mat-tab label="Roles & Permissions">
          <div style="padding:20px">
            <div class="ura-toolbar">
              <button mat-flat-button color="primary" (click)="createRole()"><mat-icon>add</mat-icon> New role</button>
              <button mat-icon-button matTooltip="Refresh" (click)="loadRoles()"><mat-icon>refresh</mat-icon></button>
              <span class="ura-count">{{ roles().length }} role{{ roles().length === 1 ? '' : 's' }}</span>
            </div>

            @if (roleLoading()) { <mat-progress-bar mode="indeterminate"></mat-progress-bar> }
            @if (roleError()) { <div class="ura-error"><mat-icon>error_outline</mat-icon><div>{{ roleError() }}</div></div> }

            <div class="ura-table-wrap">
              <table class="ura-table">
                <thead>
                  <tr><th>Role</th><th style="width:90px">Enabled</th><th style="width:140px">Permissions</th><th style="width:160px;text-align:right">Actions</th></tr>
                </thead>
                <tbody>
                  @for (r of roles(); track r.roleId) {
                    <tr>
                      <td>{{ r.roleDesc }}</td>
                      <td><span class="ura-pill" [class.on]="r.enabled">{{ r.enabled ? 'Yes' : 'No' }}</span></td>
                      <td>{{ r.permissionCount }}</td>
                      <td style="text-align:right">
                        <button mat-icon-button matTooltip="Edit permissions" (click)="editRolePermissions(r)"><mat-icon>rule</mat-icon></button>
                        <button mat-icon-button [matTooltip]="r.enabled ? 'Disable role' : 'Enable role'" (click)="toggleRoleEnabled(r)">
                          <mat-icon>{{ r.enabled ? 'block' : 'check_circle' }}</mat-icon>
                        </button>
                      </td>
                    </tr>
                  }
                  @if (!roleLoading() && !roles().length) {
                    <tr><td colspan="4" class="ura-empty">No roles to display.</td></tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </mat-tab>

        <mat-tab label="Segregation of Duties">
          <div style="padding:20px">
            @if (sodLoading()) { <mat-progress-bar mode="indeterminate"></mat-progress-bar> }
            <div class="ura-sod-empty">
              <mat-icon style="font-size:40px;width:40px;height:40px;color:#94a3b8">rule_folder</mat-icon>
              <h3>Segregation of Duties is not configured yet</h3>
              <p>{{ sodMessage() }}</p>
            </div>
          </div>
        </mat-tab>

      </mat-tab-group>
    </div>
  `,
  styles: [`
    .ura-page { padding: 16px 24px; }
    .ura-toolbar { display:flex; align-items:center; gap:12px; margin-bottom:12px; }
    .ura-search { width:340px; }
    .ura-count { margin-left:auto; font-size:12px; color:#64748b; }
    .ura-error { display:flex; gap:10px; align-items:flex-start; background:#fef2f2; border:1px solid #fecaca;
                 color:#b91c1c; padding:12px 14px; border-radius:8px; margin-bottom:12px; font-size:13px; }
    .ura-table-wrap { background:#fff; border:1px solid #e2e8f0; border-radius:12px; overflow:auto; }
    .ura-table { width:100%; border-collapse:collapse; font-size:13px; }
    .ura-table thead th { text-align:left; padding:14px 16px; color:#475569; font-weight:600; border-bottom:1px solid #e2e8f0; white-space:nowrap; }
    .ura-table tbody td { padding:14px 16px; border-bottom:1px solid #f1f5f9; color:#1e293b; vertical-align:top; }
    .ura-table tbody tr:last-child td { border-bottom:none; }
    .ura-muted { color:#475569; }
    .ura-pill { display:inline-block; padding:3px 12px; border-radius:999px; background:#e2e8f0; color:#475569; font-weight:600; font-size:12px; }
    .ura-pill.on { background:#dcfce7; color:#166534; }
    .ura-empty { text-align:center; color:#94a3b8; padding:32px; }
    .ura-sod-empty { display:flex; flex-direction:column; align-items:center; gap:8px; text-align:center; padding:48px 24px; color:#64748b; }
    .ura-sod-empty h3 { margin:0; color:#334155; }
    .ura-sod-empty p { margin:0; max-width:480px; font-size:13px; }
    mat-paginator { background:transparent; margin-top:8px; }
  `],
})
export class UserRolesAdminComponent implements OnInit {
  private svc = inject(UserRolesAdminService);
  private dialog = inject(MatDialog);

  // Users
  users = signal<SecurityUser[]>([]);
  userTotal = signal(0);
  userLoading = signal(false);
  userError = signal('');
  userSearch = '';
  private userSearchTerm = signal('');
  userPageIndex = signal(0);
  userPageSize = signal(10);

  // Roles
  roles = signal<SecurityRole[]>([]);
  roleLoading = signal(false);
  roleError = signal('');

  // Permissions catalogue (for the role-permission dialog)
  allPermissions = signal<SecurityPermission[]>([]);

  // Segregation of Duties
  sodLoading = signal(false);
  sodMessage = signal('Loading…');

  ngOnInit() {
    this.loadUsers();
    this.loadRoles();
    this.loadPermissionsCatalogue();
    this.loadSod();
  }

  // ── Users ──────────────────────────────────────────────────────────────

  loadUsers() {
    this.userLoading.set(true);
    this.userError.set('');
    this.svc.getUsers({
      search: this.userSearchTerm() || undefined,
      page: this.userPageIndex() + 1,
      pageSize: this.userPageSize(),
    }).subscribe({
      next: (res) => {
        this.users.set(res.data);
        this.userTotal.set(res.totalCount);
        this.userLoading.set(false);
      },
      error: (err) => { this.userLoading.set(false); this.userError.set(this.msg(err)); },
    });
  }

  onUserSearch() { this.userSearchTerm.set(this.userSearch); this.userPageIndex.set(0); this.loadUsers(); }
  onUserPage(e: PageEvent) { this.userPageIndex.set(e.pageIndex); this.userPageSize.set(e.pageSize); this.loadUsers(); }

  toggleUserEnabled(u: SecurityUser) {
    this.svc.setUserEnabled(u.userId, !u.enabled).subscribe({
      next: () => this.loadUsers(),
      error: (err) => this.userError.set('Could not update user: ' + this.msg(err)),
    });
  }

  editUserRoles(u: SecurityUser) {
    this.svc.getUserRoles(u.userId).subscribe({
      next: (current) => {
        const ref = this.dialog.open(EditUserRolesDialogComponent, {
          width: '560px',
          data: { user: u, roles: this.roles(), current },
        });
        ref.afterClosed().subscribe((result: RoleAssignmentInput[] | undefined) => {
          if (!result) return;
          this.svc.saveUserRoles(u.userId, result).subscribe({
            next: () => {
              this.loadUsers();
              this.svc.refreshModulePermissionCaches().subscribe();
            },
            error: (err) => this.userError.set('Saving roles failed: ' + this.msg(err)),
          });
        });
      },
      error: (err) => this.userError.set('Could not load current roles: ' + this.msg(err)),
    });
  }

  // ── Roles ──────────────────────────────────────────────────────────────

  loadRoles() {
    this.roleLoading.set(true);
    this.roleError.set('');
    this.svc.getRoles(false).subscribe({
      next: (r) => { this.roles.set(r); this.roleLoading.set(false); },
      error: (err) => { this.roleLoading.set(false); this.roleError.set(this.msg(err)); },
    });
  }

  loadPermissionsCatalogue() {
    this.svc.getPermissions().subscribe({
      next: (p) => this.allPermissions.set(p),
      error: () => this.allPermissions.set([]),
    });
  }

  createRole() {
    const roleDesc = window.prompt('New role name:');
    if (!roleDesc) return;
    this.svc.createRole(roleDesc).subscribe({
      next: () => this.loadRoles(),
      error: (err) => this.roleError.set('Could not create role: ' + this.msg(err)),
    });
  }

  toggleRoleEnabled(r: SecurityRole) {
    this.svc.setRoleEnabled(r.roleId, !r.enabled).subscribe({
      next: () => this.loadRoles(),
      error: (err) => this.roleError.set('Could not update role: ' + this.msg(err)),
    });
  }

  editRolePermissions(r: SecurityRole) {
    this.svc.getRolePermissions(r.roleId).subscribe({
      next: (current) => {
        const ref = this.dialog.open(EditRolePermissionsDialogComponent, {
          width: '720px',
          data: { role: r, permissions: this.allPermissions(), current: current.permissionIds },
        });
        ref.afterClosed().subscribe((selected: number[] | undefined) => {
          if (!selected) return;
          this.svc.saveRolePermissions(r.roleId, selected).subscribe({
            next: () => {
              this.loadRoles();
              this.svc.refreshModulePermissionCaches().subscribe();
            },
            error: (err) => this.roleError.set('Saving permissions failed: ' + this.msg(err)),
          });
        });
      },
      error: (err) => this.roleError.set('Could not load current permissions: ' + this.msg(err)),
    });
  }

  // ── Segregation of Duties ────────────────────────────────────────────

  loadSod() {
    this.sodLoading.set(true);
    this.svc.getSegregationRules().subscribe({
      next: () => { this.sodLoading.set(false); this.sodMessage.set('No rules configured.'); },
      error: (err) => {
        this.sodLoading.set(false);
        this.sodMessage.set(
          err?.error?.message ||
          'No segregation-of-duties data source is configured for this tenant yet.',
        );
      },
    });
  }

  private msg(err: any): string {
    if (err?.status === 401) return 'Not authorised (401). Sign in again.';
    if (err?.status === 403) return err?.error?.message || 'Insufficient permissions for this action.';
    if (err?.status === 503) return 'The security database is not reachable on the server.';
    return err?.error?.message || err?.message || `Request failed (HTTP ${err?.status ?? '?'}).`;
  }
}

/** Role-assignment dialog: checklist + optional delegation start/expiry per role. */
@Component({
  selector: 'app-edit-user-roles-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatIconModule, MatCheckboxModule, MatFormFieldModule, MatInputModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>
      <mat-icon style="vertical-align:middle;margin-right:8px;color:#ea8b35">admin_panel_settings</mat-icon>
      Manage Roles — {{ data.user.userName }}
    </h2>
    <mat-dialog-content>
      <p style="color:#64748b;font-size:13px;margin:0 0 12px">
        Assign roles. Leave delegation dates blank for a permanent assignment.
      </p>
      <div class="role-grid">
        @for (r of data.roles; track r.roleId) {
          <div class="role-row">
            <mat-checkbox [checked]="isOn(r.roleId)" (change)="toggle(r.roleId, $event.checked)">{{ r.roleDesc }}</mat-checkbox>
            @if (isOn(r.roleId)) {
              <div class="delegation-fields">
                <mat-form-field appearance="outline" subscriptSizing="dynamic">
                  <mat-label>Delegation start</mat-label>
                  <input matInput type="date" [ngModel]="getStart(r.roleId)" (ngModelChange)="setStart(r.roleId, $event)">
                </mat-form-field>
                <mat-form-field appearance="outline" subscriptSizing="dynamic">
                  <mat-label>Delegation expiry</mat-label>
                  <input matInput type="date" [ngModel]="getExpiry(r.roleId)" (ngModelChange)="setExpiry(r.roleId, $event)">
                </mat-form-field>
              </div>
            }
          </div>
        }
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button (click)="ref.close()">Cancel</button>
      <button mat-flat-button color="primary" (click)="save()"><mat-icon>save</mat-icon> Save</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .role-grid { display:flex; flex-direction:column; gap:8px; max-height:420px; overflow:auto; }
    .role-row { border-bottom:1px solid #f1f5f9; padding-bottom:8px; }
    .delegation-fields { display:flex; gap:12px; margin:6px 0 0 32px; }
    .delegation-fields mat-form-field { width:180px; }
  `],
})
export class EditUserRolesDialogComponent {
  ref = inject(MatDialogRef<EditUserRolesDialogComponent>);
  data = inject<{ user: SecurityUser; roles: SecurityRole[]; current: RoleAssignment[] }>(MAT_DIALOG_DATA);

  private assignments = signal<Map<number, RoleAssignmentInput>>(
    new Map(this.data.current.map((c) => [c.roleId, {
      roleId: c.roleId, delegatedByUserId: c.delegatedByUserId,
      delegationStart: c.delegationStart, delegationExpiry: c.delegationExpiry,
    }])),
  );

  isOn(roleId: number) { return this.assignments().has(roleId); }

  toggle(roleId: number, on: boolean) {
    const next = new Map(this.assignments());
    if (on) next.set(roleId, { roleId, delegatedByUserId: null, delegationStart: null, delegationExpiry: null });
    else next.delete(roleId);
    this.assignments.set(next);
  }

  getStart(roleId: number): string { return this.assignments().get(roleId)?.delegationStart?.slice(0, 10) ?? ''; }
  getExpiry(roleId: number): string { return this.assignments().get(roleId)?.delegationExpiry?.slice(0, 10) ?? ''; }

  setStart(roleId: number, value: string) {
    const next = new Map(this.assignments());
    const a = next.get(roleId);
    if (a) next.set(roleId, { ...a, delegationStart: value || null });
    this.assignments.set(next);
  }

  setExpiry(roleId: number, value: string) {
    const next = new Map(this.assignments());
    const a = next.get(roleId);
    if (a) next.set(roleId, { ...a, delegationExpiry: value || null });
    this.assignments.set(next);
  }

  save() { this.ref.close(Array.from(this.assignments().values())); }
}

/** Permission-assignment dialog: checklist grouped by moduleHeader then levelDesc. */
@Component({
  selector: 'app-edit-role-permissions-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatCheckboxModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>
      <mat-icon style="vertical-align:middle;margin-right:8px;color:#ea8b35">rule</mat-icon>
      Edit Permissions — {{ data.role.roleDesc }}
    </h2>
    <mat-dialog-content>
      @for (group of groups(); track group.moduleHeader) {
        <div class="perm-group">
          <h4>{{ group.moduleHeader }}</h4>
          @for (level of group.levels; track level.levelDesc) {
            <div class="perm-level">
              <div class="perm-level-title">{{ level.levelDesc }}</div>
              <div class="perm-grid">
                @for (p of level.permissions; track p.permissionId) {
                  <mat-checkbox [checked]="isOn(p.permissionId)" (change)="toggle(p.permissionId, $event.checked)">
                    {{ p.permissionName }}
                  </mat-checkbox>
                }
              </div>
            </div>
          }
        </div>
      }
      @if (!data.permissions.length) {
        <p style="color:#b91c1c;font-size:13px">No permission catalogue loaded.</p>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button (click)="ref.close()">Cancel</button>
      <button mat-flat-button color="primary" (click)="ref.close(current())"><mat-icon>save</mat-icon> Save</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .perm-group { margin-bottom:16px; }
    .perm-group h4 { margin:0 0 8px; color:#1e293b; border-bottom:1px solid #e2e8f0; padding-bottom:6px; }
    .perm-level { margin-bottom:8px; }
    .perm-level-title { font-size:12px; font-weight:600; color:#64748b; text-transform:uppercase; letter-spacing:0.4px; margin-bottom:4px; }
    .perm-grid { display:grid; grid-template-columns:1fr 1fr; gap:6px 16px; }
  `],
})
export class EditRolePermissionsDialogComponent {
  ref = inject(MatDialogRef<EditRolePermissionsDialogComponent>);
  data = inject<{ role: SecurityRole; permissions: SecurityPermission[]; current: number[] }>(MAT_DIALOG_DATA);
  private selected = signal<Set<number>>(new Set(this.data.current));

  groups = computed(() => {
    const byModule = new Map<string, Map<string, SecurityPermission[]>>();
    for (const p of this.data.permissions) {
      if (!byModule.has(p.moduleHeader)) byModule.set(p.moduleHeader, new Map());
      const byLevel = byModule.get(p.moduleHeader)!;
      if (!byLevel.has(p.levelDesc)) byLevel.set(p.levelDesc, []);
      byLevel.get(p.levelDesc)!.push(p);
    }
    return Array.from(byModule.entries()).map(([moduleHeader, levels]) => ({
      moduleHeader,
      levels: Array.from(levels.entries()).map(([levelDesc, permissions]) => ({ levelDesc, permissions })),
    }));
  });

  isOn(id: number) { return this.selected().has(id); }
  toggle(id: number, on: boolean) {
    const next = new Set(this.selected());
    if (on) next.add(id); else next.delete(id);
    this.selected.set(next);
  }
  current() { return Array.from(this.selected()); }
}
