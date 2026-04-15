import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { UiService } from '../../../core/services/ui.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-security',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './security.component.html',
  styleUrl: './security.component.css'
})
export class SecurityComponent implements OnInit {
  permissions: any[] = [];
  filteredPermissions: any[] = [];
  userRoles: any[] = [];
  filteredUserRoles: any[] = [];
  searchTerm = '';
  loading = true;
  showPermModal = false;
  showRoleModal = false;
  newPerm: any = {};
  newRole: any = {};

  constructor(private api: ApiService, private ui: UiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    Promise.all([
      new Promise<any[]>((resolve) => {
        this.api.get<any[]>('/settings/permissions').subscribe({
          next: (d) => resolve(d || []), error: () => resolve([])
        });
      }),
      new Promise<any[]>((resolve) => {
        this.api.get<any[]>('/settings/user-roles').subscribe({
          next: (d) => resolve(d || []), error: () => resolve([])
        });
      })
    ]).then(([perms, roles]) => {
      this.permissions = perms;
      this.userRoles = roles;
      this.applyFilter();
      this.loading = false; this.cdr.detectChanges();
    });
  }

  applyFilter(): void {
    const s = this.searchTerm.toLowerCase();
    if (!s) {
      this.filteredPermissions = [...this.permissions];
      this.filteredUserRoles = [...this.userRoles];
    } else {
      this.filteredPermissions = this.permissions.filter(p =>
        (p.role_name || p.role_id || '').toString().toLowerCase().includes(s) ||
        (p.module || '').toLowerCase().includes(s) ||
        (p.action || '').toLowerCase().includes(s)
      );
      this.filteredUserRoles = this.userRoles.filter(ur =>
        (ur.employee_name || ur.username || '').toLowerCase().includes(s) ||
        (ur.role_name || ur.role_id || '').toString().toLowerCase().includes(s) ||
        (ur.employee_number || ur.user_id || '').toString().toLowerCase().includes(s)
      );
    }
    this.cdr.detectChanges();
  }

  get uniqueRoleCount(): number {
    const roles = new Set([
      ...this.permissions.map(p => p.role_name || p.role_id),
      ...this.userRoles.map(ur => ur.role_name || ur.role_id)
    ].filter(Boolean));
    return roles.size;
  }

  getActionBadge(action: string): string {
    if (action === 'DELETE') return 'danger';
    if (action === 'APPROVE') return 'warning';
    if (action === 'WRITE') return 'success';
    return 'info';
  }

  openPermModal(): void {
    this.newPerm = { role_id: '', module: '', action: 'READ' };
    this.showPermModal = true;
  }

  savePerm(): void {
    if (!this.newPerm.role_id || !this.newPerm.module) {
      this.ui.toast('error', 'Validation', 'Role and module are required');
      return;
    }
    this.api.post('/settings/permissions', this.newPerm).subscribe({
      next: () => { this.ui.toast('success', 'Created', 'Permission added successfully'); this.showPermModal = false; this.load(); },
      error: () => this.ui.toast('error', 'Error', 'Failed to add permission')
    });
  }

  async deletePerm(item: any): Promise<void> {
    const confirmed = await this.ui.confirm({ title: 'Delete Permission', message: 'Are you sure you want to remove this permission?', danger: true });
    if (confirmed) {
      this.api.delete(`/settings/permissions/${item.id}`).subscribe({
        next: () => { this.ui.toast('success', 'Deleted', 'Permission removed'); this.load(); },
        error: () => this.ui.toast('error', 'Error', 'Failed to delete')
      });
    }
  }

  editPerm(p: any): void {
    this.newPerm = { ...p };
    this.showPermModal = true;
  }

  editRole(ur: any): void {
    this.newRole = { ...ur };
    this.showRoleModal = true;
  }

  async deleteRole(item: any): Promise<void> {
    const confirmed = await this.ui.confirm({ title: 'Delete User Role', message: 'Are you sure you want to remove this user role assignment?', danger: true });
    if (confirmed) {
      this.api.delete(`/settings/user-roles/${item.id}`).subscribe({
        next: () => { this.ui.toast('success', 'Deleted', 'User role removed'); this.load(); },
        error: () => this.ui.toast('error', 'Error', 'Failed to delete')
      });
    }
  }

  openRoleModal(): void {
    this.newRole = { user_id: '', role_id: '' };
    this.showRoleModal = true;
  }

  saveRole(): void {
    if (!this.newRole.user_id || !this.newRole.role_id) {
      this.ui.toast('error', 'Validation', 'User and role are required');
      return;
    }
    this.api.post('/settings/user-roles', this.newRole).subscribe({
      next: () => { this.ui.toast('success', 'Assigned', 'User role assigned successfully'); this.showRoleModal = false; this.load(); },
      error: () => this.ui.toast('error', 'Error', 'Failed to assign')
    });
  }

  formatDate(d: string): string {
    if (!d) return '-';
    return new Date(d).toLocaleDateString();
  }
}
