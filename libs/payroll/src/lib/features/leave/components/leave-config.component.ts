import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { UiService } from '../../../core/services/ui.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { DateInputComponent } from '../../../shared/components/date-input/date-input.component';

type Tab = 'setup' | 'types' | 'schemes';
type View = 'list' | 'detail';

@Component({
  selector: 'app-leave-config',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, StatusBadgeComponent, DateInputComponent],
  host: { 'data-accent': 'leave' },
  templateUrl: './leave-config.component.html',
  styleUrl: './leave-config.component.css'
})
export class LeaveConfigComponent implements OnInit {
  activeTab: Tab = 'setup';

  // === Setup ===
  setup: any = {};
  setupDirty = false;
  approvers: any[] = [];

  // === Types ===
  types: any[] = [];
  filteredTypes: any[] = [];
  classifications: any[] = [];
  typesView: View = 'list';
  typesMode: 'create' | 'view' | 'edit' = 'view';
  type: any = {};
  typeSearch = '';

  // === Schemes ===
  schemes: any[] = [];
  filteredSchemes: any[] = [];
  schemesView: View = 'list';
  schemesMode: 'create' | 'view' | 'edit' = 'view';
  scheme: any = {};
  schemeSearch = '';
  employeeTypes: any[] = [];
  employeeSubtypes: any[] = [];
  conditions: any[] = [];
  invalidEmployees: any[] = [];

  loading = false;

  constructor(
    private api: ApiService,
    private ui: UiService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((p) => {
      const t = (p['tab'] as Tab) || 'setup';
      if (['setup', 'types', 'schemes'].includes(t)) this.activeTab = t;
      this.loadActiveTab();
    });
    this.api.get<any[]>('/leave/classifications').subscribe({
      next: (d) => { this.classifications = d || []; this.cdr.detectChanges(); },
      error: () => { this.classifications = []; }
    });
    this.api.get<any[]>('/notifications/workflows/users').subscribe({
      next: (d: any) => { this.approvers = d || []; this.cdr.detectChanges(); },
      error: () => { this.approvers = []; }
    });
    this.api.get<any[]>('/settings/employee-types').subscribe({
      next: (d) => { this.employeeTypes = d || []; this.cdr.detectChanges(); },
      error: () => {}
    });
    this.api.get<any[]>('/settings/employee-subtypes').subscribe({
      next: (d) => { this.employeeSubtypes = d || []; this.cdr.detectChanges(); },
      error: () => {}
    });
    this.api.get<any[]>('/settings/conditions-of-service').subscribe({
      next: (d) => { this.conditions = d || []; this.cdr.detectChanges(); },
      error: () => {}
    });
  }

  switchTab(tab: Tab): void {
    if (this.hasUnsavedChanges()) {
      if (!confirm('You have unsaved changes. Discard and switch tabs?')) return;
    }
    this.router.navigate([], { queryParams: { tab }, queryParamsHandling: 'merge' });
  }

  hasUnsavedChanges(): boolean {
    if (this.activeTab === 'setup' && this.setupDirty) return true;
    if (this.activeTab === 'types' && this.typesView === 'detail' && this.typesMode !== 'view') return true;
    if (this.activeTab === 'schemes' && this.schemesView === 'detail' && this.schemesMode !== 'view') return true;
    return false;
  }

  loadActiveTab(): void {
    if (this.activeTab === 'setup') this.loadSetup();
    else if (this.activeTab === 'types') this.loadTypes();
    else if (this.activeTab === 'schemes') { this.loadSchemes(); this.loadInvalidEmployees(); }
  }

  // ===== Setup tab =====
  loadSetup(): void {
    this.loading = true;
    this.api.get<any>('/leave/setup').subscribe({
      next: (d) => {
        const today = new Date().toISOString().split('T')[0];
        this.setup = d || { id: 1, enable_leave: false };
        this.setup.leave_start_date = this.setup.leave_start_date
          ? String(this.setup.leave_start_date).split('T')[0]
          : today;
        this.setupDirty = false;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.ui.toast('error', 'Failed to load setup', ''); }
    });
  }

  saveSetup(): void {
    if (this.setup?.enable_leave === true && !this.setup?.leave_start_date) {
      this.ui.toast('error', 'Validation', 'Leave Start Date is required when Leave is enabled'); return;
    }
    this.api.put('/leave/setup', this.setup).subscribe({
      next: () => { this.setupDirty = false; this.ui.toast('success', 'Setup saved', ''); this.loadSetup(); },
      error: (e) => { this.ui.toast('error', 'Save failed', e?.error?.error?.message || ''); }
    });
  }

  approverLevels(): number[] {
    const n = parseInt(this.setup?.approval_levels) || 1;
    return Array.from({ length: Math.min(Math.max(n, 1), 4) }, (_, i) => i + 1);
  }

  // ===== Leave Types tab =====
  loadTypes(): void {
    this.loading = true;
    this.api.get<any[]>('/leave/types').subscribe({
      next: (d) => {
        this.types = d || [];
        this.filterTypes();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; }
    });
  }

  filterTypes(): void {
    const q = (this.typeSearch || '').trim().toLowerCase();
    this.filteredTypes = q ? this.types.filter(t =>
      (t.name || '').toLowerCase().includes(q) || (t.code || '').toLowerCase().includes(q)) : [...this.types];
  }

  newType(): void {
    const today = new Date().toISOString().split('T')[0];
    const startDate = this.setup?.leave_start_date || today;
    this.type = {
      name: '', base_type: 'WORKING_DAYS', paid: true, enabled: true,
      forfeit_excess: true, pro_rata_on_join: true, pro_rata_on_terminate: true,
      max_negative_balance: 0,
      start_date: startDate, end_date: '9999-12-31',
      calendar_color: '#3b82f6', calendar_abbreviation: '',
      rules: [{ deduction_priority: 1, entitlement_days: 0, accrual_frequency: 'MONTHLY' }]
    };
    this.typesMode = 'create';
    this.typesView = 'detail';
  }

  openType(t: any): void {
    this.api.get<any>(`/leave/types/${t.id}`).subscribe({
      next: (d) => {
        this.type = { ...d, rules: d.rules || [] };
        this.typesMode = 'view';
        this.typesView = 'detail';
        this.cdr.detectChanges();
      }
    });
  }

  editType(): void { this.typesMode = 'edit'; }

  cancelType(): void {
    if (this.typesMode === 'create') this.typesView = 'list';
    else this.openType(this.type);
  }

  addRule(): void {
    if (!this.type.rules) this.type.rules = [];
    this.type.rules.push({ entitlement_days: 0, accrual_frequency: 'MONTHLY' });
    this.renumberPriorities();
  }

  removeRule(i: number): void {
    this.type.rules.splice(i, 1);
    this.renumberPriorities();
  }

  private renumberPriorities(): void {
    (this.type.rules || []).forEach((r: any, idx: number) => { r.deduction_priority = idx + 1; });
  }

  saveType(): void {
    if (!this.type.name || !this.type.base_type) {
      this.ui.toast('error', 'Validation', 'Description and base type are required'); return;
    }
    if (!this.type.rules || this.type.rules.length === 0) {
      this.ui.toast('error', 'Validation', 'At least one entitlement rule is required'); return;
    }
    if (this.type.base_type !== 'CALENDAR_DAYS') this.type.include_public_holidays = false;
    this.renumberPriorities();
    const obs = this.typesMode === 'create'
      ? this.api.post('/leave/types', this.type)
      : this.api.put(`/leave/types/${this.type.id}`, this.type);
    obs.subscribe({
      next: () => {
        this.ui.toast('success', 'Leave type saved', '');
        this.typesView = 'list';
        this.loadTypes();
      },
      error: (e) => this.ui.toast('error', 'Save failed', e?.error?.error?.message || '')
    });
  }

  deleteType(t: any, ev: Event): void {
    ev.stopPropagation();
    if (!confirm(`Delete leave type "${t.name}"?`)) return;
    this.api.delete(`/leave/types/${t.id}`).subscribe({
      next: () => { this.ui.toast('success', 'Deleted', ''); this.loadTypes(); },
      error: (e) => this.ui.toast('error', 'Delete failed', e?.error?.error?.message || '')
    });
  }

  classificationName(id: number): string {
    return this.classifications.find(c => c.id === id)?.name || '-';
  }

  // ===== Leave Schemes tab =====
  loadSchemes(): void {
    this.loading = true;
    this.api.get<any[]>('/leave/schemes').subscribe({
      next: (d) => {
        this.schemes = d || [];
        this.filterSchemes();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; }
    });
  }

  filterSchemes(): void {
    const q = (this.schemeSearch || '').trim().toLowerCase();
    this.filteredSchemes = q ? this.schemes.filter(s =>
      (s.name || '').toLowerCase().includes(q) || (s.code || '').toLowerCase().includes(q)) : [...this.schemes];
  }

  loadInvalidEmployees(): void {
    this.api.get<any[]>('/leave/validation/invalid-employee-schemes').subscribe({
      next: (d) => { this.invalidEmployees = d || []; this.cdr.detectChanges(); },
      error: () => { this.invalidEmployees = []; }
    });
  }

  newScheme(): void {
    this.scheme = { code: '', name: '', enabled: true, leave_types: [], leave_type_ids: [] };
    this.schemesMode = 'create';
    this.schemesView = 'detail';
    if (!this.types.length) this.loadTypes();
  }

  openScheme(s: any): void {
    this.api.get<any>(`/leave/schemes/${s.id}`).subscribe({
      next: (d) => {
        this.scheme = { ...d, leave_type_ids: (d.leave_types || []).map((t: any) => t.id) };
        if (this.scheme.start_date) this.scheme.start_date = String(this.scheme.start_date).split('T')[0];
        if (this.scheme.end_date) this.scheme.end_date = String(this.scheme.end_date).split('T')[0];
        this.schemesMode = 'view';
        this.schemesView = 'detail';
        if (!this.types.length) this.loadTypes();
        this.cdr.detectChanges();
      }
    });
  }

  editScheme(): void { this.schemesMode = 'edit'; }

  cancelScheme(): void {
    if (this.schemesMode === 'create') this.schemesView = 'list';
    else this.openScheme(this.scheme);
  }

  toggleSchemeType(typeId: number): void {
    if (!this.scheme.leave_type_ids) this.scheme.leave_type_ids = [];
    const i = this.scheme.leave_type_ids.indexOf(typeId);
    if (i >= 0) this.scheme.leave_type_ids.splice(i, 1);
    else this.scheme.leave_type_ids.push(typeId);
  }

  isSchemeTypeSelected(typeId: number): boolean {
    return (this.scheme.leave_type_ids || []).includes(typeId);
  }

  saveScheme(): void {
    if (!this.scheme.code || !this.scheme.name) {
      this.ui.toast('error', 'Validation', 'Code and name are required'); return;
    }
    if (!this.scheme.leave_type_ids || this.scheme.leave_type_ids.length === 0) {
      this.ui.toast('error', 'Validation', 'Select at least one leave type for this scheme'); return;
    }
    const obs = this.schemesMode === 'create'
      ? this.api.post('/leave/schemes', this.scheme)
      : this.api.put(`/leave/schemes/${this.scheme.id}`, this.scheme);
    obs.subscribe({
      next: () => {
        this.ui.toast('success', 'Leave scheme saved', '');
        this.schemesView = 'list';
        this.loadSchemes();
        this.loadInvalidEmployees();
      },
      error: (e) => this.ui.toast('error', 'Save failed', e?.error?.error?.message || '')
    });
  }

  deleteScheme(s: any, ev: Event): void {
    ev.stopPropagation();
    if (!confirm(`Delete leave scheme "${s.name}"?`)) return;
    this.api.delete(`/leave/schemes/${s.id}`).subscribe({
      next: () => { this.ui.toast('success', 'Deleted', ''); this.loadSchemes(); },
      error: (e) => this.ui.toast('error', 'Delete failed', e?.error?.error?.message || '')
    });
  }
}
