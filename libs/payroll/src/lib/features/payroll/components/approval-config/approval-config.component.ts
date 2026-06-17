import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { UiService } from '../../../../core/services/ui.service';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { EntityTypeBadgePipe } from '../../../../shared/pipes/entity-type-badge.pipe';

interface WorkflowUser {
  id: number;
  username: string;
  first_name: string;
  surname: string;
  employee_id?: number;
}

interface ApprovalLevel {
  assigned_users: number[];
  assigned_role: string;
}

@Component({
  selector: 'app-approval-config',
  standalone: true,
  host: { 'data-accent': 'payroll' },
  imports: [CommonModule, FormsModule, IconComponent, EntityTypeBadgePipe],
  templateUrl: './approval-config.component.html',
  styleUrl: './approval-config.component.css'
})
export class ApprovalConfigComponent implements OnInit {
  workflows: any[] = [];
  filteredWorkflows: any[] = [];
  loading = true;
  searchTerm = '';
  entityTypeFilter = '';
  departmentFilter = '';

  departments: any[] = [];
  filteredDivisions: any[] = [];
  availableUsers: WorkflowUser[] = [];

  showModal = false;
  isNew = false;
  editItem: any = {};
  editLevels: ApprovalLevel[] = [];
  saving = false;

  showUserPicker = -1;
  userSearchTerm = '';
  filteredUsers: WorkflowUser[] = [];

  constructor(private api: ApiService, private ui: UiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.load();
    this.loadDepartments();
    this.loadUsers();
  }

  load(): void {
    this.loading = true;
    this.api.get<any[]>('/notifications/workflows/definitions').subscribe({
      next: (data) => {
        this.workflows = data || [];
        this.applyFilter();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  loadDepartments(): void {
    this.api.get<any[]>('/settings/departments').subscribe({
      next: (data) => {
        this.departments = data || [];
        this.cdr.detectChanges();
      },
      error: () => { this.departments = []; }
    });
  }

  loadUsers(): void {
    this.api.get<WorkflowUser[]>('/notifications/workflows/users').subscribe({
      next: (data) => {
        this.availableUsers = data || [];
        this.cdr.detectChanges();
      },
      error: () => { this.availableUsers = []; this.cdr.detectChanges(); }
    });
  }

  loadDivisions(departmentId: number): void {
    if (!departmentId) {
      this.filteredDivisions = [];
      this.cdr.detectChanges();
      return;
    }
    this.api.get<any[]>('/settings/divisions').subscribe({
      next: (data) => {
        this.filteredDivisions = (data || []).filter((d: any) => d.department_id === departmentId);
        this.cdr.detectChanges();
      },
      error: () => { this.filteredDivisions = []; this.cdr.detectChanges(); }
    });
  }

  applyFilter(): void {
    const s = this.searchTerm.toLowerCase();
    this.filteredWorkflows = this.workflows.filter(w => {
      const matchSearch = !s || (w.name || '').toLowerCase().includes(s) || (w.module || '').toLowerCase().includes(s);
      const matchType = !this.entityTypeFilter || w.entity_type === this.entityTypeFilter;
      const matchDept = !this.departmentFilter || String(w.department_id) === this.departmentFilter;
      return matchSearch && matchType && matchDept;
    });
    this.cdr.detectChanges();
  }

  get claimCount(): number {
    return this.workflows.filter(w => w.entity_type === 'CLAIM' || w.module === 'CLAIM').length;
  }

  get wageCount(): number {
    return this.workflows.filter(w => w.entity_type === 'WAGE' || w.module === 'WAGE').length;
  }

  get overtimeCount(): number {
    return this.workflows.filter(w => w.entity_type === 'OVERTIME' || w.module === 'OVERTIME').length;
  }

  get installmentCount(): number {
    return this.workflows.filter(w => w.entity_type === 'INSTALLMENT' || w.module === 'INSTALLMENT').length;
  }

  get leaveRequestCount(): number {
    return this.workflows.filter(w => w.entity_type === 'LEAVE_REQUEST' || w.module === 'LEAVE_REQUEST').length;
  }

  get leaveAdjustmentCount(): number {
    return this.workflows.filter(w => w.entity_type === 'LEAVE_ADJUSTMENT' || w.module === 'LEAVE_ADJUSTMENT').length;
  }

  get activeCount(): number {
    return this.workflows.filter(w => w.enabled !== false).length;
  }

  getLevels(wf: any): ApprovalLevel[] {
    try {
      const steps = typeof wf.steps === 'string' ? JSON.parse(wf.steps) : wf.steps;
      if (!Array.isArray(steps)) return [];
      return steps.map((s: any) => ({
        assigned_users: s.assigned_users || (s.assigned_to ? [s.assigned_to] : []),
        assigned_role: s.assigned_role || ''
      }));
    } catch { return []; }
  }

  getUserName(userId: number): string {
    const u = this.availableUsers.find(x => x.id === userId);
    return u ? `${u.first_name} ${u.surname}` : `User #${userId}`;
  }

  getLevelUserNames(level: ApprovalLevel): string {
    if (!level.assigned_users || level.assigned_users.length === 0) {
      return level.assigned_role || '-';
    }
    return level.assigned_users.map(id => this.getUserName(id)).join(', ');
  }

  getScopeLabel(wf: any): string {
    if (wf.division_name) return wf.division_name;
    if (wf.department_name) return wf.department_name;
    if (wf.division_id) return `Division #${wf.division_id}`;
    if (wf.department_id) return `Dept #${wf.department_id}`;
    return 'Default (All)';
  }

  openAddModal(): void {
    this.isNew = true;
    this.editItem = {
      name: '',
      entity_type: 'CLAIM',
      module: 'CLAIM',
      enabled: true,
      department_id: null,
      division_id: null
    };
    this.editLevels = [{ assigned_users: [], assigned_role: '' }];
    this.filteredDivisions = [];
    this.showUserPicker = -1;
    this.showModal = true;
    this.cdr.detectChanges();
  }

  openEditModal(wf: any): void {
    this.isNew = false;
    this.editItem = {
      id: wf.id,
      name: wf.name,
      entity_type: wf.entity_type || wf.module,
      module: wf.module,
      enabled: wf.enabled !== false,
      department_id: wf.department_id || null,
      division_id: wf.division_id || null
    };
    this.editLevels = this.getLevels(wf);
    if (this.editLevels.length === 0) {
      this.editLevels = [{ assigned_users: [], assigned_role: '' }];
    }
    this.showUserPicker = -1;

    if (wf.department_id) {
      this.loadDivisions(wf.department_id);
    } else {
      this.filteredDivisions = [];
    }
    this.showModal = true;
    this.cdr.detectChanges();
  }

  onEntityTypeChange(): void {
    this.editItem.module = this.editItem.entity_type;
    this.cdr.detectChanges();
  }

  onDepartmentChange(): void {
    this.editItem.division_id = null;
    if (this.editItem.department_id) {
      this.loadDivisions(parseInt(this.editItem.department_id));
    } else {
      this.filteredDivisions = [];
    }
    this.cdr.detectChanges();
  }

  addLevel(): void {
    this.editLevels.push({ assigned_users: [], assigned_role: '' });
    this.cdr.detectChanges();
  }

  removeLevel(index: number): void {
    if (this.editLevels.length <= 1) {
      this.ui.toast('warning', 'Required', 'At least one approval level is required');
      return;
    }
    this.editLevels.splice(index, 1);
    if (this.showUserPicker === index) this.showUserPicker = -1;
    this.cdr.detectChanges();
  }

  moveLevel(index: number, direction: number): void {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= this.editLevels.length) return;
    [this.editLevels[index], this.editLevels[newIndex]] = [this.editLevels[newIndex], this.editLevels[index]];
    this.cdr.detectChanges();
  }

  openUserPicker(index: number): void {
    this.showUserPicker = index;
    this.userSearchTerm = '';
    this.filteredUsers = [];
    this.cdr.detectChanges();
  }

  onUserSearch(term: string): void {
    this.userSearchTerm = term;
    if (!term || term.trim().length < 2) {
      this.filteredUsers = [];
      this.cdr.detectChanges();
      return;
    }
    const q = term.toLowerCase();
    this.filteredUsers = this.availableUsers.filter(u =>
      `${u.first_name} ${u.surname}`.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q)
    ).slice(0, 20);
    this.cdr.detectChanges();
  }

  closeUserPicker(): void {
    this.showUserPicker = -1;
    this.userSearchTerm = '';
    this.filteredUsers = [];
    this.cdr.detectChanges();
  }

  isUserInLevel(levelIndex: number, userId: number): boolean {
    return this.editLevels[levelIndex].assigned_users.includes(userId);
  }

  toggleUserInLevel(levelIndex: number, userId: number): void {
    const users = this.editLevels[levelIndex].assigned_users;
    const idx = users.indexOf(userId);
    if (idx >= 0) {
      users.splice(idx, 1);
    } else {
      users.push(userId);
    }
    this.cdr.detectChanges();
  }

  removeUserFromLevel(levelIndex: number, userId: number): void {
    const users = this.editLevels[levelIndex].assigned_users;
    const idx = users.indexOf(userId);
    if (idx >= 0) {
      users.splice(idx, 1);
      this.cdr.detectChanges();
    }
  }

  save(): void {
    if (!this.editItem.name?.trim()) {
      this.ui.toast('error', 'Validation', 'Workflow name is required');
      return;
    }
    if (!this.editItem.entity_type) {
      this.ui.toast('error', 'Validation', 'Entity type is required');
      return;
    }
    const missingIdx = this.editLevels.findIndex(l => l.assigned_users.length === 0 && !l.assigned_role);
    if (missingIdx >= 0) {
      this.ui.toast('error', 'Validation', `Level ${missingIdx + 1} must have at least one approver assigned`);
      return;
    }

    this.saving = true;
    const body = {
      name: this.editItem.name.trim(),
      entity_type: this.editItem.entity_type,
      module: this.editItem.entity_type,
      enabled: this.editItem.enabled,
      department_id: this.editItem.department_id ? parseInt(this.editItem.department_id) : null,
      division_id: this.editItem.division_id ? parseInt(this.editItem.division_id) : null,
      steps: this.editLevels
    };

    const request$ = this.isNew
      ? this.api.post('/notifications/workflows/definitions', body)
      : this.api.put(`/notifications/workflows/definitions/${this.editItem.id}`, body);

    request$.subscribe({
      next: () => {
        this.ui.toast('success', this.isNew ? 'Created' : 'Updated', `Approval workflow ${this.isNew ? 'created' : 'updated'} successfully`);
        this.showModal = false;
        this.saving = false;
        this.load();
      },
      error: (err: any) => {
        this.ui.toast('error', 'Error', err?.error?.error?.message || 'Failed to save workflow');
        this.saving = false;
        this.cdr.detectChanges();
      }
    });
  }

  async deleteWorkflow(wf: any): Promise<void> {
    const confirmed = await this.ui.confirm({
      title: 'Delete Workflow',
      message: `Are you sure you want to delete "${wf.name}"? This cannot be undone.`,
      danger: true
    });
    if (!confirmed) return;

    this.api.delete(`/notifications/workflows/definitions/${wf.id}`).subscribe({
      next: () => {
        this.ui.toast('success', 'Deleted', 'Workflow deleted successfully');
        this.load();
      },
      error: (err: any) => {
        this.ui.toast('error', 'Error', err?.error?.error?.message || 'Failed to delete workflow');
      }
    });
  }
}
