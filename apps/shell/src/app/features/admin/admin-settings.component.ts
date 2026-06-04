import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

const STORAGE_KEY = 'platinum_module_config';

export interface ModuleApiConfig {
  assetsPostgresUrl  : string;
  assetsSqlServerUrl : string;
  scmApiUrl          : string;
  posApiUrl          : string;
  payrollApiUrl      : string;
  idpApiUrl          : string;
  budgetApiUrl       : string;
  afsApiUrl          : string;
  insightsApiUrl     : string;
  overtimeApiUrl     : string;
}

const DEFAULTS: ModuleApiConfig = {
  assetsPostgresUrl  : 'http://localhost:3000',
  assetsSqlServerUrl : 'https://platinum-assets-api.azurewebsites.net',
  scmApiUrl          : 'http://localhost:3002',
  posApiUrl          : 'http://localhost:3003',
  payrollApiUrl      : 'http://localhost:6000',
  idpApiUrl          : 'http://localhost:8008',
  budgetApiUrl       : 'http://localhost:3001',
  afsApiUrl          : 'http://localhost:9000',
  insightsApiUrl     : 'http://localhost:8080',
  overtimeApiUrl     : 'http://localhost:8099',
};

export function loadModuleConfig(): ModuleApiConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULTS };
}

interface ModuleDef {
  key: string;
  label: string;
  icon: string;
  color: string;
  bg: string;
  fields: FieldDef[];
}

interface FieldDef {
  label: string;
  icon: string;
  iconColor: string;
  badge?: string;
  badgeClass?: string;
  prop: keyof ModuleApiConfig;
  hint: string;
  infoValue?: string;
  infoLabel?: string;
}

const MODULES: ModuleDef[] = [
  {
    key: 'assets', label: 'Assets', icon: 'inventory_2', color: '#2563eb', bg: '#eff6ff',
    fields: [
      {
        label: 'PostgreSQL API URL', icon: 'storage', iconColor: '#16a34a',
        badge: 'PostgreSQL toggle', badgeClass: 'badge-green',
        prop: 'assetsPostgresUrl', hint: 'Local ASSETS-PSQL-API → PlatinumV3_db (Azure PostgreSQL)',
        infoLabel: 'Connection', infoValue: 'postgresql://Admin_Dev:***@platinum-postgre-sql.postgres.database.azure.com:5432/PlatinumV3_db'
      },
      {
        label: 'SQL Server API URL', icon: 'dns', iconColor: '#1565c0',
        badge: 'SQL Server toggle', badgeClass: 'badge-blue',
        prop: 'assetsSqlServerUrl', hint: 'Azure-hosted ASSETS-API → test02 SQL Server',
        infoLabel: 'Database', infoValue: 'platinum-assets-api.azurewebsites.net → test02'
      }
    ]
  },
  {
    key: 'scm', label: 'SCM', icon: 'local_shipping', color: '#0891b2', bg: '#ecfeff',
    fields: [
      { label: 'SCM API URL', icon: 'local_shipping', iconColor: '#0891b2', prop: 'scmApiUrl', hint: 'Supply Chain Management API endpoint' }
    ]
  },
  {
    key: 'pos', label: 'POS', icon: 'point_of_sale', color: '#059669', bg: '#ecfdf5',
    fields: [
      { label: 'POS API URL', icon: 'point_of_sale', iconColor: '#059669', prop: 'posApiUrl', hint: 'Point of Sale API endpoint' }
    ]
  },
  {
    key: 'payroll', label: 'Payroll', icon: 'payments', color: '#7c3aed', bg: '#f5f3ff',
    fields: [
      { label: 'Payroll API URL', icon: 'payments', iconColor: '#7c3aed', prop: 'payrollApiUrl', hint: 'Payroll API endpoint' }
    ]
  },
  {
    key: 'idp', label: 'IDP', icon: 'assignment', color: '#d97706', bg: '#fffbeb',
    fields: [
      { label: 'IDP API URL', icon: 'assignment', iconColor: '#d97706', prop: 'idpApiUrl', hint: 'Integrated Development Plan API endpoint' }
    ]
  },
  {
    key: 'budget', label: 'Budget', icon: 'account_balance', color: '#dc2626', bg: '#fef2f2',
    fields: [
      { label: 'Budget API URL', icon: 'account_balance', iconColor: '#dc2626', prop: 'budgetApiUrl', hint: 'Budget Management API endpoint' }
    ]
  },
  {
    key: 'afs', label: 'AFS', icon: 'summarize', color: '#475569', bg: '#f8fafc',
    fields: [
      { label: 'AFS API URL', icon: 'summarize', iconColor: '#475569', prop: 'afsApiUrl', hint: 'Annual Financial Statements API endpoint' }
    ]
  },
  {
    key: 'insights', label: 'Performance', icon: 'insights', color: '#0f766e', bg: '#f0fdfa',
    fields: [
      { label: 'Insights API URL', icon: 'insights', iconColor: '#0f766e', prop: 'insightsApiUrl', hint: 'Performance & Insights API endpoint' }
    ]
  },
  {
    key: 'overtime', label: 'Overtime', icon: 'more_time', color: '#9333ea', bg: '#faf5ff',
    fields: [
      { label: 'Overtime API URL', icon: 'more_time', iconColor: '#9333ea', prop: 'overtimeApiUrl', hint: 'Overtime Management API endpoint' }
    ]
  },
];

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatSnackBarModule],
  template: `
    <div style="padding:32px;max-width:860px;margin:0 auto">

      <!-- Header -->
      <div style="margin-bottom:28px">
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:6px">
          <div class="module-icon" [style.background]="activeMod().bg" [style.color]="activeMod().color">
            <mat-icon>{{activeMod().icon}}</mat-icon>
          </div>
          <div>
            <h1 style="font-size:20px;font-weight:700;color:#1e293b;margin:0">{{activeMod().label}} — API Configuration</h1>
            <p style="color:#64748b;margin:0;font-size:13px">Configure the backend API endpoints for the {{activeMod().label}} module.</p>
          </div>
        </div>
      </div>

      <!-- Fields -->
      <div class="config-card">
        @for (field of activeMod().fields; track field.prop) {
          <div class="field-block">
            <label class="field-label">
              <mat-icon class="field-icon" [style.color]="field.iconColor">{{field.icon}}</mat-icon>
              {{field.label}}
              @if (field.badge) {
                <span class="badge" [class]="field.badgeClass">{{field.badge}}</span>
              }
            </label>
            <input class="field-input" [(ngModel)]="cfg[field.prop]" [placeholder]="field.hint"
                   (ngModelChange)="markDirty()">
            <div class="field-hint">{{field.hint}}</div>
            @if (field.infoValue) {
              <div class="conn-box">
                <mat-icon style="font-size:14px;color:#94a3b8;flex-shrink:0">info</mat-icon>
                <div>
                  <div style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.4px;margin-bottom:2px">{{field.infoLabel}}</div>
                  <code>{{field.infoValue}}</code>
                </div>
              </div>
            }
          </div>
        }
      </div>

      <!-- Actions -->
      <div class="actions">
        <button class="btn-secondary" (click)="reset()">
          <mat-icon>restart_alt</mat-icon> Reset to Default
        </button>
        <button class="btn-primary" [disabled]="!dirty()" (click)="save()">
          <mat-icon>save</mat-icon> Save
        </button>
      </div>

    </div>
  `,
  styles: [`
    :host { display:block; background:#f8f9fb; min-height:100%; }

    .module-icon {
      width:44px; height:44px; border-radius:12px; flex-shrink:0;
      display:flex; align-items:center; justify-content:center;
    }
    .config-card {
      background:white; border:1px solid #e2e8f0; border-radius:12px;
      padding:24px; margin-bottom:20px; display:flex; flex-direction:column; gap:20px;
    }
    .field-block { display:flex; flex-direction:column; gap:6px; }
    .field-label {
      display:flex; align-items:center; gap:6px;
      font-size:12px; font-weight:700; color:#374151;
      text-transform:uppercase; letter-spacing:.5px;
    }
    .field-icon { font-size:16px; width:16px; height:16px; }
    .badge {
      font-size:10px; font-weight:700; padding:2px 8px; border-radius:10px;
      text-transform:none; letter-spacing:0; margin-left:4px;
    }
    .badge-green { background:#dcfce7; color:#166534; }
    .badge-blue  { background:#dbeafe; color:#1e40af; }
    .field-input {
      border:1px solid #cbd5e1; border-radius:8px; padding:11px 14px;
      font-size:13px; font-family:monospace; color:#1e293b; outline:none;
      transition:border-color .15s, box-shadow .15s;
    }
    .field-input:focus { border-color:#3f51b5; box-shadow:0 0 0 3px rgba(63,81,181,.12); }
    .field-hint { font-size:11px; color:#94a3b8; }
    .conn-box {
      display:flex; align-items:flex-start; gap:8px;
      background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px;
      padding:10px 12px; margin-top:2px;
    }
    .conn-box code { font-size:12px; font-family:monospace; color:#475569; word-break:break-all; }
    .actions { display:flex; justify-content:flex-end; gap:12px; }
    .btn-primary, .btn-secondary {
      display:inline-flex; align-items:center; gap:8px;
      padding:10px 20px; border-radius:8px; font-size:14px; font-weight:600;
      cursor:pointer; border:none; transition:all .15s;
    }
    .btn-primary { background:#3f51b5; color:white; }
    .btn-primary:hover:not(:disabled) { background:#303f9f; }
    .btn-primary:disabled { background:#cbd5e1; cursor:not-allowed; }
    .btn-secondary { background:white; color:#475569; border:1px solid #cbd5e1; }
    .btn-secondary:hover { background:#f8fafc; }
  `]
})
export class AdminSettingsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private snack = inject(MatSnackBar);

  cfg: ModuleApiConfig = loadModuleConfig();
  dirty = signal(false);

  activeKey = signal('assets');

  activeMod = computed(() => MODULES.find(m => m.key === this.activeKey()) ?? MODULES[0]);

  ngOnInit() {
    this.route.params.subscribe(p => {
      const mod = p['module'];
      if (mod && MODULES.find(m => m.key === mod)) {
        this.activeKey.set(mod);
      } else {
        this.activeKey.set('assets');
      }
    });
  }

  markDirty() { this.dirty.set(true); }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.cfg));
      this.dirty.set(false);
      this.snack.open('Saved. Restart the dev server to apply proxy changes.', 'OK', { duration: 4000 });
    } catch {
      this.snack.open('Failed to save.', 'Close', { duration: 3000 });
    }
  }

  reset() {
    const mod = this.activeMod();
    mod.fields.forEach(f => {
      (this.cfg as any)[f.prop] = (DEFAULTS as any)[f.prop];
    });
    this.dirty.set(true);
  }
}
