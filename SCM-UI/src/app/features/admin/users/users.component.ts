import { Component, ChangeDetectionStrategy, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-users',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatCardModule, MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatMenuModule, MatTooltipModule, MatChipsModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})
export class UsersComponent implements OnInit {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  activeTab = signal<'users' | 'roles' | 'sod'>('users');
  currentView = signal<'list' | 'detail'>('list');
  users = signal<any[]>([]);
  selectedUser = signal<any>(null);
  notification = signal<string>('');
  loading = signal(false);
  expandedRole = signal<string | null>(null);
  userAuditTrail = signal<any[]>([]);
  sodRules = signal<any[]>([]);
  rolesData = signal<any>({});
  permissionsData = signal<any>({});

  searchQuery = '';
  filterRole = '';
  filterStatus = '';
  filterDepartment = '';

  private roleLabels: Record<string, string> = {
    requestor: 'Requestor',
    scm_practitioner: 'SCM Practitioner',
    scm_manager: 'SCM Manager',
    budget_officer: 'Budget Officer',
    approving_officer: 'Approving Officer',
    stores_officer: 'Stores / Warehouse Officer',
    creditors_clerk: 'Creditors Clerk',
    expenditure_officer: 'Expenditure Officer',
    cfo: 'Chief Financial Officer',
    municipal_manager: 'Municipal Manager (Accounting Officer)',
    bsc_chairperson: 'Bid Specification Committee Chairperson',
    bec_chairperson: 'Bid Evaluation Committee Chairperson',
    bac_chairperson: 'Bid Adjudication Committee Chairperson',
    internal_auditor: 'Internal Auditor',
    system_admin: 'System Administrator'
  };

  private rolePermissions: Record<string, any> = {
    requestor: { canCreate: ['requisitions'], canView: ['requisitions', 'orders', 'dashboard'], canApprove: [], description: 'Creates requisitions, views own orders and requisition status' },
    scm_practitioner: { canCreate: ['rfq', 'quotations', 'tenders', 'orders', 'grn'], canView: ['requisitions', 'rfq', 'quotations', 'tenders', 'orders', 'grn', 'suppliers', 'contracts', 'dashboard', 'reports'], canApprove: [], description: 'Processes procurement activities, generates RFQs, manages quotations and tenders' },
    scm_manager: { canCreate: ['rfq', 'quotations', 'tenders', 'orders', 'deviations'], canView: ['requisitions', 'rfq', 'quotations', 'tenders', 'orders', 'grn', 'invoices', 'suppliers', 'contracts', 'dashboard', 'reports', 'analytics'], canApprove: ['requisitions', 'rfq', 'quotations', 'orders'], description: 'Manages SCM unit, recommends awards, approves within delegation' },
    budget_officer: { canCreate: [], canView: ['requisitions', 'orders', 'budget', 'dashboard', 'reports'], canApprove: ['budget_checks'], description: 'Verifies budget availability, approves budget allocations' },
    approving_officer: { canCreate: [], canView: ['requisitions', 'orders', 'tenders', 'contracts', 'dashboard', 'reports'], canApprove: ['requisitions', 'orders', 'tenders', 'contracts', 'deviations'], description: 'Approves transactions within delegation of authority thresholds' },
    stores_officer: { canCreate: ['grn', 'inventory_adjustments', 'stock_counts', 'inventory_transfers'], canView: ['orders', 'grn', 'inventory', 'dashboard'], canApprove: ['grn'], description: 'Receives goods, manages inventory, conducts stock counts' },
    creditors_clerk: { canCreate: ['invoices'], canView: ['orders', 'grn', 'invoices', 'suppliers', 'dashboard', 'reports'], canApprove: [], description: 'Captures invoices, performs 3-way matching, manages creditor accounts' },
    expenditure_officer: { canCreate: ['payment_batches', 'eft_files'], canView: ['invoices', 'payments', 'suppliers', 'dashboard', 'reports'], canApprove: ['invoices'], description: 'Processes payments, generates EFT files, manages payment batches' },
    cfo: { canCreate: ['deviations'], canView: ['all'], canApprove: ['requisitions', 'orders', 'tenders', 'contracts', 'deviations', 'payments', 'invoices', 'budget_transfers'], description: 'Financial oversight, senior approvals, strategic reporting' },
    municipal_manager: { canCreate: [], canView: ['all'], canApprove: ['all'], description: 'Accounting Officer — highest approval authority, full system visibility' },
    bsc_chairperson: { canCreate: ['bid_specifications'], canView: ['tenders', 'suppliers', 'dashboard'], canApprove: ['bid_specifications'], description: 'Chairs Bid Specification Committee, approves tender specifications' },
    bec_chairperson: { canCreate: ['bid_evaluations'], canView: ['tenders', 'suppliers', 'dashboard'], canApprove: ['bid_evaluations'], description: 'Chairs Bid Evaluation Committee, signs off evaluation scorecards' },
    bac_chairperson: { canCreate: ['bid_adjudications'], canView: ['tenders', 'suppliers', 'contracts', 'dashboard', 'reports'], canApprove: ['bid_adjudications', 'tenders'], description: 'Chairs Bid Adjudication Committee, recommends award to Accounting Officer' },
    internal_auditor: { canCreate: [], canView: ['all'], canApprove: [], description: 'Read-only access to all modules for audit purposes' },
    system_admin: { canCreate: ['all'], canView: ['all'], canApprove: ['all'], description: 'Full system access — all workflows, approvals, and configuration' }
  };

  totalUsers = computed(() => this.users().length);
  activeUsers = computed(() => this.users().filter(u => u.active).length);
  inactiveUsers = computed(() => this.users().filter(u => !u.active).length);
  rolesInUse = computed(() => new Set(this.users().map(u => u.role)).size);
  departments = computed(() => new Set(this.users().map(u => u.department)).size);
  allDepartments = computed(() => [...new Set(this.users().map(u => u.department))].sort());
  allRoleKeys = computed(() => Object.keys(this.roleLabels));

  filteredUsers = computed(() => {
    let result = this.users();
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(u =>
        (u.firstName + ' ' + u.lastName).toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.department.toLowerCase().includes(q)
      );
    }
    if (this.filterRole) {
      result = result.filter(u => u.role === this.filterRole);
    }
    if (this.filterStatus) {
      result = result.filter(u => this.filterStatus === 'active' ? u.active : !u.active);
    }
    if (this.filterDepartment) {
      result = result.filter(u => u.department === this.filterDepartment);
    }
    return result;
  });

  ngOnInit() {
    this.loadUsers();
    this.loadRoles();
    this.loadSodRules();
  }

  loadUsers() {
    this.loading.set(true);
    this.http.get<any[]>(`${this.apiUrl}/auth/users`).subscribe({
      next: (data) => {
        this.users.set(data || []);
        this.loading.set(false);
      },
      error: () => {
        this.users.set([]);
        this.loading.set(false);
      }
    });
  }

  loadRoles() {
    this.http.get<any>(`${this.apiUrl}/roles`).subscribe({
      next: (data) => {
        if (data.roles) this.rolesData.set(data.roles);
        if (data.permissions) this.permissionsData.set(data.permissions);
      },
      error: () => {}
    });
  }

  loadSodRules() {
    this.http.get<any[]>(`${this.apiUrl}/segregation-rules`).subscribe({
      next: (data) => this.sodRules.set(data || []),
      error: () => {
        this.sodRules.set([
          { action1: 'create_requisition', action2: 'approve_requisition', description: 'Requestor cannot approve own requisition' },
          { action1: 'create_requisition', action2: 'receive_goods', description: 'Requestor cannot receive goods for own requisition' },
          { action1: 'approve_requisition', action2: 'receive_goods', description: 'Approver cannot receive goods for requisition they approved' },
          { action1: 'receive_goods', action2: 'capture_invoice', description: 'Receiver cannot capture invoice for goods they received' },
          { action1: 'capture_invoice', action2: 'approve_payment', description: 'Invoice capturer cannot approve payment for that invoice' },
          { action1: 'create_order', action2: 'approve_order', description: 'Order creator cannot approve same order' },
          { action1: 'evaluate_bid', action2: 'adjudicate_bid', description: 'BEC member cannot serve on BAC for same tender' },
          { action1: 'specify_bid', action2: 'evaluate_bid', description: 'BSC member cannot serve on BEC for same tender' }
        ]);
      }
    });
  }

  viewUser(user: any) {
    this.selectedUser.set(user);
    this.currentView.set('detail');
    this.loadUserAuditTrail(user.id);
  }

  loadUserAuditTrail(userId: string) {
    this.http.get<any>(`${this.apiUrl}/audit-trail?userId=${userId}&pageSize=10`).subscribe({
      next: (data) => this.userAuditTrail.set(data.data || data.entries || data || []),
      error: () => this.userAuditTrail.set([])
    });
  }

  backToList() {
    this.currentView.set('list');
    this.selectedUser.set(null);
    this.userAuditTrail.set([]);
  }

  applyFilters() {
    this.users.update(u => [...u]);
  }

  clearFilters() {
    this.searchQuery = '';
    this.filterRole = '';
    this.filterStatus = '';
    this.filterDepartment = '';
    this.users.update(u => [...u]);
  }

  toggleRole(roleKey: string) {
    this.expandedRole.set(this.expandedRole() === roleKey ? null : roleKey);
  }

  getRoleLabel(role: string): string {
    return this.roleLabels[role] || role;
  }

  getRoleDescription(role: string): string {
    return this.rolePermissions[role]?.description || '';
  }

  getUserPermissions(role: string): any {
    return this.rolePermissions[role] || { canCreate: [], canView: [], canApprove: [] };
  }

  getPermissionCount(role: string): number {
    const p = this.rolePermissions[role];
    if (!p) return 0;
    return (p.canCreate?.length || 0) + (p.canView?.length || 0) + (p.canApprove?.length || 0);
  }

  getUsersByRole(role: string): any[] {
    return this.users().filter(u => u.role === role);
  }

  getInitial(user: any): string {
    return ((user.firstName?.[0] || '') + (user.lastName?.[0] || '')).toUpperCase();
  }

  getAvatarColor(role: string): string {
    const colors: Record<string, string> = {
      municipal_manager: '#0f2b46',
      cfo: '#c9a84c',
      scm_manager: '#3b82f6',
      scm_practitioner: '#6366f1',
      budget_officer: '#059669',
      approving_officer: '#7c3aed',
      stores_officer: '#ea580c',
      creditors_clerk: '#0891b2',
      expenditure_officer: '#be185d',
      bsc_chairperson: '#4f46e5',
      bec_chairperson: '#0d9488',
      bac_chairperson: '#9333ea',
      internal_auditor: '#64748b',
      system_admin: '#dc2626',
      requestor: '#2563eb'
    };
    return colors[role] || '#64748b';
  }

  getRoleBadgeColor(role: string): string {
    const colors: Record<string, string> = {
      municipal_manager: '#e0e7f0',
      cfo: '#fef3c7',
      scm_manager: '#dbeafe',
      scm_practitioner: '#e0e7ff',
      budget_officer: '#d1fae5',
      approving_officer: '#ede9fe',
      stores_officer: '#ffedd5',
      creditors_clerk: '#cffafe',
      expenditure_officer: '#fce7f3',
      bsc_chairperson: '#e0e7ff',
      bec_chairperson: '#ccfbf1',
      bac_chairperson: '#f3e8ff',
      internal_auditor: '#f1f5f9',
      system_admin: '#fee2e2',
      requestor: '#dbeafe'
    };
    return colors[role] || '#f1f5f9';
  }

  getRoleBadgeText(role: string): string {
    const colors: Record<string, string> = {
      municipal_manager: '#0f2b46',
      cfo: '#92400e',
      scm_manager: '#1e40af',
      scm_practitioner: '#3730a3',
      budget_officer: '#065f46',
      approving_officer: '#5b21b6',
      stores_officer: '#9a3412',
      creditors_clerk: '#155e75',
      expenditure_officer: '#9d174d',
      bsc_chairperson: '#3730a3',
      bec_chairperson: '#115e59',
      bac_chairperson: '#6b21a8',
      internal_auditor: '#334155',
      system_admin: '#991b1b',
      requestor: '#1e40af'
    };
    return colors[role] || '#334155';
  }

  getRoleIcon(role: string): string {
    const icons: Record<string, string> = {
      requestor: 'person',
      scm_practitioner: 'work',
      scm_manager: 'manage_accounts',
      budget_officer: 'account_balance',
      approving_officer: 'verified_user',
      stores_officer: 'warehouse',
      creditors_clerk: 'receipt_long',
      expenditure_officer: 'payments',
      cfo: 'account_balance_wallet',
      municipal_manager: 'shield',
      bsc_chairperson: 'description',
      bec_chairperson: 'assessment',
      bac_chairperson: 'gavel',
      internal_auditor: 'policy',
      system_admin: 'settings'
    };
    return icons[role] || 'person';
  }

  getActionIcon(action: string): string {
    const icons: Record<string, string> = {
      create_requisition: 'add_circle',
      approve_requisition: 'check_circle',
      receive_goods: 'local_shipping',
      capture_invoice: 'receipt',
      approve_payment: 'payments',
      create_order: 'shopping_cart',
      approve_order: 'verified',
      evaluate_bid: 'assessment',
      adjudicate_bid: 'gavel',
      specify_bid: 'description'
    };
    return icons[action] || 'circle';
  }

  formatAction(action: string): string {
    return action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  getConflictingRoles(rule: any): string[] {
    const actionToRoles: Record<string, string[]> = {
      create_requisition: ['requestor'],
      approve_requisition: ['scm_manager', 'approving_officer', 'cfo', 'municipal_manager'],
      receive_goods: ['stores_officer'],
      capture_invoice: ['creditors_clerk'],
      approve_payment: ['expenditure_officer', 'cfo', 'municipal_manager'],
      create_order: ['scm_practitioner', 'scm_manager'],
      approve_order: ['scm_manager', 'approving_officer', 'cfo', 'municipal_manager'],
      evaluate_bid: ['bec_chairperson'],
      adjudicate_bid: ['bac_chairperson'],
      specify_bid: ['bsc_chairperson']
    };
    const roles1 = actionToRoles[rule.action1] || [];
    const roles2 = actionToRoles[rule.action2] || [];
    return [...new Set([...roles1, ...roles2])];
  }

  formatCurrency(value: number): string {
    return 'R ' + (value || 0).toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  formatDate(date: string): string {
    if (!date) return '—';
    try {
      return new Date(date).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch { return date; }
  }

  showNotification(msg: string) {
    this.notification.set(msg);
    setTimeout(() => this.notification.set(''), 4000);
  }
}
