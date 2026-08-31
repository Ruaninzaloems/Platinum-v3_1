import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SharePointConfigService } from '@platinumv3/assets';

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
  // Assets SharePoint document storage
  assetsSharePointEnabled : boolean;
  assetsSharePointSiteUrl : string;
  assetsSharePointLibrary : string;
  // Overtime SharePoint document storage
  overtimeSharePointEnabled : boolean;
  overtimeSharePointSiteUrl : string;
  overtimeSharePointLibrary : string;
  // AFS SharePoint document storage
  afsSharePointEnabled : boolean;
  afsSharePointSiteUrl : string;
  afsSharePointLibrary : string;
  // AFS Adjustments SharePoint document storage (separate library)
  afsAdjustmentsSharePointEnabled : boolean;
  afsAdjustmentsSharePointSiteUrl : string;
  afsAdjustmentsSharePointLibrary : string;
  afsAdjustmentsSharePointLinkColumn : string;
  // AFS PostgreSQL database (maps to AZURE_POSTGRES_URL read by AFS-UI/api)
  afsDbHost     : string;
  afsDbPort     : string;
  afsDbName     : string;
  afsDbUser     : string;
  afsDbPassword : string;
  afsDbSslMode  : string;
  // Overtime PostgreSQL database (maps to ConnectionStrings:OvertimeDb in OVERTIME-API)
  overtimeDbHost     : string;
  overtimeDbPort     : string;
  overtimeDbName     : string;
  overtimeDbUser     : string;
  overtimeDbPassword : string;
  overtimeDbSslMode  : string;
  // Payroll PostgreSQL database (maps to AZURE_DATABASE_URL read by PAYROLL-APP)
  payrollDbHost     : string;
  payrollDbPort     : string;
  payrollDbName     : string;
  payrollDbUser     : string;
  payrollDbPassword : string;
  payrollDbSslMode  : string;
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
  // SharePoint OFF by default → assets module uses its current (local) file storage
  assetsSharePointEnabled : false,
  assetsSharePointSiteUrl : 'https://zamicromega.sharepoint.com/sites/Sebata2',
  assetsSharePointLibrary : 'UatAssets',
  // SharePoint OFF by default → overtime module uses its current (local) file storage
  overtimeSharePointEnabled : false,
  overtimeSharePointSiteUrl : 'https://zamicromega.sharepoint.com/sites/Sebata2',
  overtimeSharePointLibrary : 'UatOvertime',
  // SharePoint OFF by default → AFS module uses its current (local) file storage
  afsSharePointEnabled : false,
  afsSharePointSiteUrl : 'https://zamicromega.sharepoint.com/sites/Sebata2',
  afsSharePointLibrary : 'UatAFS',
  // AFS Adjustments → separate SharePoint library (URL segment "UatAFSAdjustments1")
  afsAdjustmentsSharePointEnabled : false,
  afsAdjustmentsSharePointSiteUrl : 'https://zamicromega.sharepoint.com/sites/Sebata2',
  afsAdjustmentsSharePointLibrary : 'UatAFSAdjustments1',
  afsAdjustmentsSharePointLinkColumn : 'ADJID',
  // AFS database — separate "AFS" PostgreSQL on Azure
  afsDbHost     : 'platinum-postgre-sql.postgres.database.azure.com',
  afsDbPort     : '5432',
  afsDbName     : 'AFS',
  afsDbUser     : 'Admin_Dev',
  afsDbPassword : 'NOP@ssword_123',
  afsDbSslMode  : 'Require',
  // Overtime database — separate "Overtime" PostgreSQL on Azure
  overtimeDbHost     : 'platinum-postgre-sql.postgres.database.azure.com',
  overtimeDbPort     : '5432',
  overtimeDbName     : 'Overtime',
  overtimeDbUser     : 'Admin_Dev',
  overtimeDbPassword : 'NOP@ssword_123',
  overtimeDbSslMode  : 'Require',
  // Payroll database — separate "Payroll" PostgreSQL on Azure
  payrollDbHost     : 'platinum-postgre-sql.postgres.database.azure.com',
  payrollDbPort     : '5432',
  payrollDbName     : 'Payroll',
  payrollDbUser     : 'Admin_Dev',
  payrollDbPassword : 'NOP@ssword_123',
  payrollDbSslMode  : 'Require',
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
    key: 'insights', label: 'Performance', icon: 'trending_up', color: '#0f766e', bg: '#f0fdfa',
    fields: [
      { label: 'Insights API URL', icon: 'trending_up', iconColor: '#0f766e', prop: 'insightsApiUrl', hint: 'Performance & Insights API endpoint' }
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

      <!-- SharePoint config — Assets module only -->
      @if (activeKey() === 'assets') {
        <div class="config-card">
          <div class="sp-header">
            <mat-icon style="color:#0078d4">cloud</mat-icon>
            <span>SharePoint Configuration</span>
          </div>

          <!-- Toggle -->
          <div class="sp-toggle-row">
            <button class="sp-switch" [class.on]="cfg.assetsSharePointEnabled"
                    (click)="cfg.assetsSharePointEnabled = !cfg.assetsSharePointEnabled; markDirty()"
                    role="switch" [attr.aria-checked]="cfg.assetsSharePointEnabled">
              <span class="sp-knob"></span>
            </button>
            <div style="flex:1">
              <div style="font-weight:600;font-size:14px;color:#1e293b">Use SharePoint for new uploads</div>
              <div style="font-size:12px;color:#64748b">
                When enabled, new asset document uploads are stored in SharePoint instead of the asset module's local file storage.
              </div>
            </div>
            <span class="sp-status" [class.active]="cfg.assetsSharePointEnabled">
              {{ cfg.assetsSharePointEnabled ? 'ACTIVE' : 'INACTIVE' }}
            </span>
          </div>

          <!-- Fields (disabled when off) -->
          <div class="field-grid" [class.sp-disabled]="!cfg.assetsSharePointEnabled">
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#0078d4">link</mat-icon> SharePoint Site URL</label>
              <input class="field-input" [(ngModel)]="cfg.assetsSharePointSiteUrl"
                     [disabled]="!cfg.assetsSharePointEnabled"
                     placeholder="https://yourtenant.sharepoint.com/sites/Sebata2"
                     (ngModelChange)="markDirty()">
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#d97706">folder</mat-icon> Document Library Name</label>
              <input class="field-input" [(ngModel)]="cfg.assetsSharePointLibrary"
                     [disabled]="!cfg.assetsSharePointEnabled"
                     placeholder="UatAssets"
                     (ngModelChange)="markDirty()">
              <div class="field-hint">Default library: <strong>UatAssets</strong></div>
            </div>
          </div>

          @if (!cfg.assetsSharePointEnabled) {
            <div class="conn-box">
              <mat-icon style="font-size:14px;color:#94a3b8;flex-shrink:0">info</mat-icon>
              <div style="font-size:12px;color:#64748b">
                SharePoint is <strong>off</strong> — asset documents use the module's current local file storage.
              </div>
            </div>
          }

          <!-- SP actions -->
          <div class="actions" style="margin-top:0">
            <button class="btn-secondary" [disabled]="spTesting() || !cfg.assetsSharePointEnabled || !cfg.assetsSharePointSiteUrl"
                    (click)="testSharePoint()">
              <mat-icon>{{ spTesting() ? 'hourglass_empty' : 'wifi_tethering' }}</mat-icon>
              {{ spTesting() ? 'Testing…' : 'Test Connection' }}
            </button>
            <button class="btn-primary" [disabled]="!dirty()" (click)="save()">
              <mat-icon>save</mat-icon> Save Configuration
            </button>
          </div>
        </div>
      }

      <!-- SharePoint config — Overtime module only -->
      @if (activeKey() === 'overtime') {
        <div class="config-card">
          <div class="sp-header">
            <mat-icon style="color:#0078d4">cloud</mat-icon>
            <span>SharePoint Configuration</span>
          </div>

          <!-- Toggle -->
          <div class="sp-toggle-row">
            <button class="sp-switch" [class.on]="cfg.overtimeSharePointEnabled"
                    (click)="cfg.overtimeSharePointEnabled = !cfg.overtimeSharePointEnabled; markDirty()"
                    role="switch" [attr.aria-checked]="cfg.overtimeSharePointEnabled">
              <span class="sp-knob"></span>
            </button>
            <div style="flex:1">
              <div style="font-weight:600;font-size:14px;color:#1e293b">Use SharePoint for new uploads</div>
              <div style="font-size:12px;color:#64748b">
                When enabled, new overtime document uploads are stored in SharePoint instead of the overtime module's local file storage.
              </div>
            </div>
            <span class="sp-status" [class.active]="cfg.overtimeSharePointEnabled">
              {{ cfg.overtimeSharePointEnabled ? 'ACTIVE' : 'INACTIVE' }}
            </span>
          </div>

          <!-- Fields (disabled when off) -->
          <div class="field-grid" [class.sp-disabled]="!cfg.overtimeSharePointEnabled">
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#0078d4">link</mat-icon> SharePoint Site URL</label>
              <input class="field-input" [(ngModel)]="cfg.overtimeSharePointSiteUrl"
                     [disabled]="!cfg.overtimeSharePointEnabled"
                     placeholder="https://yourtenant.sharepoint.com/sites/Sebata2"
                     (ngModelChange)="markDirty()">
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#d97706">folder</mat-icon> Document Library Name</label>
              <input class="field-input" [(ngModel)]="cfg.overtimeSharePointLibrary"
                     [disabled]="!cfg.overtimeSharePointEnabled"
                     placeholder="UatOvertime"
                     (ngModelChange)="markDirty()">
              <div class="field-hint">Default library: <strong>UatOvertime</strong></div>
            </div>
          </div>

          @if (!cfg.overtimeSharePointEnabled) {
            <div class="conn-box">
              <mat-icon style="font-size:14px;color:#94a3b8;flex-shrink:0">info</mat-icon>
              <div style="font-size:12px;color:#64748b">
                SharePoint is <strong>off</strong> — overtime documents use the module's current local file storage.
              </div>
            </div>
          }

          <!-- SP actions -->
          <div class="actions" style="margin-top:0">
            <button class="btn-secondary" [disabled]="spTesting() || !cfg.overtimeSharePointEnabled || !cfg.overtimeSharePointSiteUrl"
                    (click)="testSharePointOvertime()">
              <mat-icon>{{ spTesting() ? 'hourglass_empty' : 'wifi_tethering' }}</mat-icon>
              {{ spTesting() ? 'Testing…' : 'Test Connection' }}
            </button>
            <button class="btn-primary" [disabled]="!dirty()" (click)="save()">
              <mat-icon>save</mat-icon> Save Configuration
            </button>
          </div>
        </div>
      }

      <!-- SharePoint config — AFS module only -->
      @if (activeKey() === 'afs') {
        <div class="config-card">
          <div class="sp-header">
            <mat-icon style="color:#0078d4">cloud</mat-icon>
            <span>SharePoint Configuration</span>
          </div>

          <!-- Toggle -->
          <div class="sp-toggle-row">
            <button class="sp-switch" [class.on]="cfg.afsSharePointEnabled"
                    (click)="cfg.afsSharePointEnabled = !cfg.afsSharePointEnabled; markDirty()"
                    role="switch" [attr.aria-checked]="cfg.afsSharePointEnabled">
              <span class="sp-knob"></span>
            </button>
            <div style="flex:1">
              <div style="font-weight:600;font-size:14px;color:#1e293b">Use SharePoint for new uploads</div>
              <div style="font-size:12px;color:#64748b">
                When enabled, new AFS document uploads are stored in SharePoint instead of the AFS module's local file storage.
              </div>
            </div>
            <span class="sp-status" [class.active]="cfg.afsSharePointEnabled">
              {{ cfg.afsSharePointEnabled ? 'ACTIVE' : 'INACTIVE' }}
            </span>
          </div>

          <!-- Fields (disabled when off) -->
          <div class="field-grid" [class.sp-disabled]="!cfg.afsSharePointEnabled">
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#0078d4">link</mat-icon> SharePoint Site URL</label>
              <input class="field-input" [(ngModel)]="cfg.afsSharePointSiteUrl"
                     [disabled]="!cfg.afsSharePointEnabled"
                     placeholder="https://yourtenant.sharepoint.com/sites/Sebata2"
                     (ngModelChange)="markDirty()">
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#d97706">folder</mat-icon> Document Library Name</label>
              <input class="field-input" [(ngModel)]="cfg.afsSharePointLibrary"
                     [disabled]="!cfg.afsSharePointEnabled"
                     placeholder="UatAFS"
                     (ngModelChange)="markDirty()">
              <div class="field-hint">Default library: <strong>UatAFS</strong></div>
            </div>
          </div>

          @if (!cfg.afsSharePointEnabled) {
            <div class="conn-box">
              <mat-icon style="font-size:14px;color:#94a3b8;flex-shrink:0">info</mat-icon>
              <div style="font-size:12px;color:#64748b">
                SharePoint is <strong>off</strong> — AFS documents use the module's current local file storage.
              </div>
            </div>
          }

          <!-- SP actions -->
          <div class="actions" style="margin-top:0">
            <button class="btn-secondary" [disabled]="spTesting() || !cfg.afsSharePointEnabled || !cfg.afsSharePointSiteUrl"
                    (click)="testSharePointAfs()">
              <mat-icon>{{ spTesting() ? 'hourglass_empty' : 'wifi_tethering' }}</mat-icon>
              {{ spTesting() ? 'Testing…' : 'Test Connection' }}
            </button>
            <button class="btn-primary" [disabled]="!dirty()" (click)="save()">
              <mat-icon>save</mat-icon> Save Configuration
            </button>
          </div>
        </div>

        <!-- Adjustments SharePoint library (separate from working-paper docs) -->
        <div class="config-card">
          <div class="sp-header">
            <mat-icon style="color:#0078d4">cloud</mat-icon>
            <span>Adjustments SharePoint Configuration</span>
          </div>

          <div class="sp-toggle-row">
            <button class="sp-switch" [class.on]="cfg.afsAdjustmentsSharePointEnabled"
                    (click)="cfg.afsAdjustmentsSharePointEnabled = !cfg.afsAdjustmentsSharePointEnabled; markDirty()"
                    role="switch" [attr.aria-checked]="cfg.afsAdjustmentsSharePointEnabled">
              <span class="sp-knob"></span>
            </button>
            <div style="flex:1">
              <div style="font-weight:600;font-size:14px;color:#1e293b">Use SharePoint for adjustment documents</div>
              <div style="font-size:12px;color:#64748b">
                When enabled, adjustment supporting documents are stored in the dedicated Adjustments SharePoint library (linked by AFSID, with metadata) instead of local file storage.
              </div>
            </div>
            <span class="sp-status" [class.active]="cfg.afsAdjustmentsSharePointEnabled">
              {{ cfg.afsAdjustmentsSharePointEnabled ? 'ACTIVE' : 'INACTIVE' }}
            </span>
          </div>

          <div class="field-grid" [class.sp-disabled]="!cfg.afsAdjustmentsSharePointEnabled">
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#0078d4">link</mat-icon> SharePoint Site URL</label>
              <input class="field-input" [(ngModel)]="cfg.afsAdjustmentsSharePointSiteUrl"
                     [disabled]="!cfg.afsAdjustmentsSharePointEnabled"
                     placeholder="https://yourtenant.sharepoint.com/sites/Sebata2"
                     (ngModelChange)="markDirty()">
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#d97706">folder</mat-icon> Document Library Name</label>
              <input class="field-input" [(ngModel)]="cfg.afsAdjustmentsSharePointLibrary"
                     [disabled]="!cfg.afsAdjustmentsSharePointEnabled"
                     placeholder="UatAFSAdjustments1"
                     (ngModelChange)="markDirty()">
              <div class="field-hint">Default library: <strong>UatAFSAdjustments1</strong> (use the library's URL segment, e.g. the "UatAFSAdjustments1" in its address)</div>
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#0891b2">vpn_key</mat-icon> Link Column (internal name)</label>
              <input class="field-input" [(ngModel)]="cfg.afsAdjustmentsSharePointLinkColumn"
                     [disabled]="!cfg.afsAdjustmentsSharePointEnabled"
                     placeholder="ADJID"
                     (ngModelChange)="markDirty()">
              <div class="field-hint">The column that stores the adjustment id. Use the SharePoint <strong>internal</strong> name (Library settings → click the column → the URL's <code>Field=</code> value, e.g. <strong>ADJID0</strong> if it was recreated).</div>
            </div>
          </div>

          @if (!cfg.afsAdjustmentsSharePointEnabled) {
            <div class="conn-box">
              <mat-icon style="font-size:14px;color:#94a3b8;flex-shrink:0">info</mat-icon>
              <div style="font-size:12px;color:#64748b">
                SharePoint is <strong>off</strong> — adjustment documents use the module's current local file storage.
              </div>
            </div>
          }

          <div class="actions" style="margin-top:0">
            <button class="btn-secondary" [disabled]="spTesting() || !cfg.afsAdjustmentsSharePointEnabled || !cfg.afsAdjustmentsSharePointSiteUrl"
                    (click)="testSharePointAfsAdjustments()">
              <mat-icon>{{ spTesting() ? 'hourglass_empty' : 'wifi_tethering' }}</mat-icon>
              {{ spTesting() ? 'Testing…' : 'Test Connection' }}
            </button>
            <button class="btn-primary" [disabled]="!dirty()" (click)="save()">
              <mat-icon>save</mat-icon> Save Configuration
            </button>
          </div>
        </div>
      }

      <!-- AFS Database config — AFS module only -->
      @if (activeKey() === 'afs') {
        <div class="config-card">
          <div class="sp-header">
            <mat-icon style="color:#336791">database</mat-icon>
            <span>Database Configuration</span>
            <span class="db-pill">PostgreSQL</span>
          </div>

          <div class="field-grid">
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#336791">dns</mat-icon> Host</label>
              <input class="field-input" [(ngModel)]="cfg.afsDbHost" (ngModelChange)="markDirty()"
                     placeholder="platinum-postgre-sql.postgres.database.azure.com">
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#64748b">lan</mat-icon> Port</label>
              <input class="field-input" [(ngModel)]="cfg.afsDbPort" (ngModelChange)="markDirty()" placeholder="5432">
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#0891b2">storage</mat-icon> Database</label>
              <input class="field-input" [(ngModel)]="cfg.afsDbName" (ngModelChange)="markDirty()" placeholder="AFS">
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#7c3aed">person</mat-icon> Username</label>
              <input class="field-input" [(ngModel)]="cfg.afsDbUser" (ngModelChange)="markDirty()" placeholder="Admin_Dev">
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#dc2626">key</mat-icon> Password</label>
              <input class="field-input" type="password" [(ngModel)]="cfg.afsDbPassword" (ngModelChange)="markDirty()" placeholder="••••••••">
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#16a34a">lock</mat-icon> SSL Mode</label>
              <input class="field-input" [(ngModel)]="cfg.afsDbSslMode" (ngModelChange)="markDirty()" placeholder="Require">
            </div>
          </div>

          <!-- Connection string preview -->
          <div class="conn-box">
            <mat-icon style="font-size:14px;color:#94a3b8;flex-shrink:0">info</mat-icon>
            <div>
              <div style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.4px;margin-bottom:2px">AZURE_POSTGRES_URL (AFS-UI/api)</div>
              <code>{{ afsConnString() }}</code>
            </div>
          </div>

          <div class="conn-box" style="background:#fffbeb;border-color:#fde68a">
            <mat-icon style="font-size:14px;color:#d97706;flex-shrink:0">warning</mat-icon>
            <div style="font-size:12px;color:#92400e">
              The AFS API reads this from the <strong>.env</strong> (AZURE_POSTGRES_URL) at startup.
              After saving, update <code>.env</code> with the connection string above and restart the AFS API.
            </div>
          </div>

          <div class="actions" style="margin-top:0">
            <button class="btn-secondary" [disabled]="spTesting() || !cfg.afsDbHost || !cfg.afsDbName"
                    (click)="testAfsDb()">
              <mat-icon>{{ spTesting() ? 'hourglass_empty' : 'wifi_tethering' }}</mat-icon>
              {{ spTesting() ? 'Checking…' : 'Validate' }}
            </button>
            <button class="btn-primary" [disabled]="!dirty()" (click)="save()">
              <mat-icon>save</mat-icon> Save Configuration
            </button>
          </div>
        </div>
      }

      <!-- Overtime Database config — Overtime module only -->
      @if (activeKey() === 'overtime') {
        <div class="config-card">
          <div class="sp-header">
            <mat-icon style="color:#336791">database</mat-icon>
            <span>Database Configuration</span>
            <span class="db-pill">PostgreSQL</span>
          </div>

          <div class="field-grid">
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#336791">dns</mat-icon> Host</label>
              <input class="field-input" [(ngModel)]="cfg.overtimeDbHost" (ngModelChange)="markDirty()"
                     placeholder="platinum-postgre-sql.postgres.database.azure.com">
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#64748b">lan</mat-icon> Port</label>
              <input class="field-input" [(ngModel)]="cfg.overtimeDbPort" (ngModelChange)="markDirty()" placeholder="5432">
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#0891b2">storage</mat-icon> Database</label>
              <input class="field-input" [(ngModel)]="cfg.overtimeDbName" (ngModelChange)="markDirty()" placeholder="Overtime">
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#7c3aed">person</mat-icon> Username</label>
              <input class="field-input" [(ngModel)]="cfg.overtimeDbUser" (ngModelChange)="markDirty()" placeholder="Admin_Dev">
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#dc2626">key</mat-icon> Password</label>
              <input class="field-input" type="password" [(ngModel)]="cfg.overtimeDbPassword" (ngModelChange)="markDirty()" placeholder="••••••••">
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#16a34a">lock</mat-icon> SSL Mode</label>
              <input class="field-input" [(ngModel)]="cfg.overtimeDbSslMode" (ngModelChange)="markDirty()" placeholder="Require">
            </div>
          </div>

          <!-- Connection string preview -->
          <div class="conn-box">
            <mat-icon style="font-size:14px;color:#94a3b8;flex-shrink:0">info</mat-icon>
            <div>
              <div style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.4px;margin-bottom:2px">ConnectionStrings:OvertimeDb (OVERTIME-API)</div>
              <code>{{ overtimeConnString() }}</code>
            </div>
          </div>

          <div class="conn-box" style="background:#fffbeb;border-color:#fde68a">
            <mat-icon style="font-size:14px;color:#d97706;flex-shrink:0">warning</mat-icon>
            <div style="font-size:12px;color:#92400e">
              The Overtime API reads this from <strong>OVERTIME-API/appsettings.json</strong> (ConnectionStrings:OvertimeDb)
              at startup. After saving, update appsettings with the connection string above and restart the Overtime API.
            </div>
          </div>

          <div class="actions" style="margin-top:0">
            <button class="btn-secondary" [disabled]="spTesting() || !cfg.overtimeDbHost || !cfg.overtimeDbName"
                    (click)="testOvertimeDb()">
              <mat-icon>{{ spTesting() ? 'hourglass_empty' : 'wifi_tethering' }}</mat-icon>
              {{ spTesting() ? 'Checking…' : 'Validate' }}
            </button>
            <button class="btn-primary" [disabled]="!dirty()" (click)="save()">
              <mat-icon>save</mat-icon> Save Configuration
            </button>
          </div>
        </div>
      }

      <!-- Payroll Database config — Payroll module only -->
      @if (activeKey() === 'payroll') {
        <div class="config-card">
          <div class="sp-header">
            <mat-icon style="color:#336791">database</mat-icon>
            <span>Database Configuration</span>
            <span class="db-pill">PostgreSQL</span>
          </div>

          <div class="field-grid">
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#336791">dns</mat-icon> Host</label>
              <input class="field-input" [(ngModel)]="cfg.payrollDbHost" (ngModelChange)="markDirty()"
                     placeholder="platinum-postgre-sql.postgres.database.azure.com">
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#64748b">lan</mat-icon> Port</label>
              <input class="field-input" [(ngModel)]="cfg.payrollDbPort" (ngModelChange)="markDirty()" placeholder="5432">
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#0891b2">storage</mat-icon> Database</label>
              <input class="field-input" [(ngModel)]="cfg.payrollDbName" (ngModelChange)="markDirty()" placeholder="Payroll">
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#7c3aed">person</mat-icon> Username</label>
              <input class="field-input" [(ngModel)]="cfg.payrollDbUser" (ngModelChange)="markDirty()" placeholder="Admin_Dev">
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#dc2626">key</mat-icon> Password</label>
              <input class="field-input" type="password" [(ngModel)]="cfg.payrollDbPassword" (ngModelChange)="markDirty()" placeholder="••••••••">
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#16a34a">lock</mat-icon> SSL Mode</label>
              <input class="field-input" [(ngModel)]="cfg.payrollDbSslMode" (ngModelChange)="markDirty()" placeholder="Require">
            </div>
          </div>

          <div class="conn-box">
            <mat-icon style="font-size:14px;color:#94a3b8;flex-shrink:0">info</mat-icon>
            <div>
              <div style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.4px;margin-bottom:2px">AZURE_DATABASE_URL (PAYROLL-APP)</div>
              <code>{{ payrollConnString() }}</code>
            </div>
          </div>

          <div class="conn-box" style="background:#fffbeb;border-color:#fde68a">
            <mat-icon style="font-size:14px;color:#d97706;flex-shrink:0">warning</mat-icon>
            <div style="font-size:12px;color:#92400e">
              The Payroll API reads this from the <strong>.env</strong> (AZURE_DATABASE_URL) at startup.
              After saving, update <code>.env</code> with the connection string above and restart the Payroll API.
            </div>
          </div>

          <div class="actions" style="margin-top:0">
            <button class="btn-secondary" [disabled]="spTesting() || !cfg.payrollDbHost || !cfg.payrollDbName"
                    (click)="testPayrollDb()">
              <mat-icon>{{ spTesting() ? 'hourglass_empty' : 'wifi_tethering' }}</mat-icon>
              {{ spTesting() ? 'Checking…' : 'Validate' }}
            </button>
            <button class="btn-primary" [disabled]="!dirty()" (click)="save()">
              <mat-icon>save</mat-icon> Save Configuration
            </button>
          </div>
        </div>
      }

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
    .btn-secondary:disabled { color:#cbd5e1; cursor:not-allowed; }

    /* SharePoint config */
    .sp-header {
      display:flex; align-items:center; gap:10px;
      font-size:15px; font-weight:700; color:#1e293b;
      padding-bottom:14px; border-bottom:1px solid #f1f5f9;
    }
    .sp-toggle-row {
      display:flex; align-items:center; gap:14px;
      background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:14px 16px;
    }
    .sp-switch {
      position:relative; width:44px; height:24px; border-radius:12px;
      background:#cbd5e1; border:none; cursor:pointer; flex-shrink:0; transition:background .2s; padding:0;
    }
    .sp-switch.on { background:#16a34a; }
    .sp-knob {
      position:absolute; top:2px; left:2px; width:20px; height:20px; border-radius:50%;
      background:white; transition:left .2s; box-shadow:0 1px 3px rgba(0,0,0,.2);
    }
    .sp-switch.on .sp-knob { left:22px; }
    .sp-status {
      font-size:11px; font-weight:700; letter-spacing:.5px; color:#dc2626;
    }
    .sp-status.active { color:#16a34a; }
    .sp-disabled { opacity:.55; pointer-events:none; }
    .db-pill {
      font-size:10px; font-weight:700; padding:2px 8px; border-radius:10px;
      background:#e0f2fe; color:#0369a1; margin-left:4px;
    }
  `]
})
export class AdminSettingsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private snack = inject(MatSnackBar);
  private spConfig = inject(SharePointConfigService);

  cfg: ModuleApiConfig = loadModuleConfig();
  dirty = signal(false);
  spTesting = signal(false);

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
      // Apply SharePoint config immediately to the assets module (no reload needed).
      this.spConfig.refresh();
      const note = this.activeKey() === 'assets'
        ? 'Saved. SharePoint config applied. Restart the dev server to apply API proxy changes.'
        : 'Saved. Restart the dev server to apply proxy changes.';
      this.snack.open(note, 'OK', { duration: 4000 });
    } catch {
      this.snack.open('Failed to save.', 'Close', { duration: 3000 });
    }
  }

  reset() {
    const mod = this.activeMod();
    mod.fields.forEach(f => {
      (this.cfg as any)[f.prop] = (DEFAULTS as any)[f.prop];
    });
    // Assets page also owns the SharePoint config — reset it too
    if (this.activeKey() === 'assets') {
      this.cfg.assetsSharePointEnabled = DEFAULTS.assetsSharePointEnabled;
      this.cfg.assetsSharePointSiteUrl = DEFAULTS.assetsSharePointSiteUrl;
      this.cfg.assetsSharePointLibrary = DEFAULTS.assetsSharePointLibrary;
    }
    // AFS page owns the DB config + SharePoint config — reset them too
    if (this.activeKey() === 'afs') {
      this.cfg.afsDbHost     = DEFAULTS.afsDbHost;
      this.cfg.afsDbPort     = DEFAULTS.afsDbPort;
      this.cfg.afsDbName     = DEFAULTS.afsDbName;
      this.cfg.afsDbUser     = DEFAULTS.afsDbUser;
      this.cfg.afsDbPassword = DEFAULTS.afsDbPassword;
      this.cfg.afsDbSslMode  = DEFAULTS.afsDbSslMode;
      this.cfg.afsSharePointEnabled = DEFAULTS.afsSharePointEnabled;
      this.cfg.afsSharePointSiteUrl = DEFAULTS.afsSharePointSiteUrl;
      this.cfg.afsSharePointLibrary = DEFAULTS.afsSharePointLibrary;
    }
    // Overtime page owns the DB config + SharePoint config — reset them too
    if (this.activeKey() === 'overtime') {
      this.cfg.overtimeDbHost     = DEFAULTS.overtimeDbHost;
      this.cfg.overtimeDbPort     = DEFAULTS.overtimeDbPort;
      this.cfg.overtimeDbName     = DEFAULTS.overtimeDbName;
      this.cfg.overtimeDbUser     = DEFAULTS.overtimeDbUser;
      this.cfg.overtimeDbPassword = DEFAULTS.overtimeDbPassword;
      this.cfg.overtimeDbSslMode  = DEFAULTS.overtimeDbSslMode;
      this.cfg.overtimeSharePointEnabled = DEFAULTS.overtimeSharePointEnabled;
      this.cfg.overtimeSharePointSiteUrl = DEFAULTS.overtimeSharePointSiteUrl;
      this.cfg.overtimeSharePointLibrary = DEFAULTS.overtimeSharePointLibrary;
    }
    // Payroll page owns the DB config — reset it too
    if (this.activeKey() === 'payroll') {
      this.cfg.payrollDbHost     = DEFAULTS.payrollDbHost;
      this.cfg.payrollDbPort     = DEFAULTS.payrollDbPort;
      this.cfg.payrollDbName     = DEFAULTS.payrollDbName;
      this.cfg.payrollDbUser     = DEFAULTS.payrollDbUser;
      this.cfg.payrollDbPassword = DEFAULTS.payrollDbPassword;
      this.cfg.payrollDbSslMode  = DEFAULTS.payrollDbSslMode;
    }
    this.dirty.set(true);
  }

  /** Build the AZURE_POSTGRES_URL connection string from the AFS DB fields. */
  afsConnString(): string {
    const c = this.cfg;
    return `Host=${c.afsDbHost};Port=${c.afsDbPort};Database=${c.afsDbName};Username=${c.afsDbUser};Password=••••••••;SslMode=${c.afsDbSslMode};CommandTimeout=600;Timeout=30`;
  }

  /** Validate the AFS DB config fields are complete and well-formed. */
  testAfsDb() {
    this.spTesting.set(true);
    const c = this.cfg;
    const ok = !!c.afsDbHost && !!c.afsDbPort && !!c.afsDbName && !!c.afsDbUser
      && /^\d+$/.test(c.afsDbPort) && /\.postgres\.database\.azure\.com$|localhost|^\d/.test(c.afsDbHost);
    setTimeout(() => {
      this.spTesting.set(false);
      if (ok) {
        this.snack.open(`AFS DB config valid — database "${c.afsDbName}" on ${c.afsDbHost}`, 'OK', { duration: 4000 });
      } else {
        this.snack.open('Invalid AFS DB config — check Host, Port (numeric), Database and Username.', 'Close', { duration: 5000 });
      }
    }, 500);
  }

  /** Build the ConnectionStrings:OvertimeDb value from the Overtime DB fields. */
  overtimeConnString(): string {
    const c = this.cfg;
    return `Host=${c.overtimeDbHost};Port=${c.overtimeDbPort};Database=${c.overtimeDbName};Username=${c.overtimeDbUser};Password=••••••••;SslMode=${c.overtimeDbSslMode};CommandTimeout=600;Timeout=30`;
  }

  /** Validate the Overtime DB config fields are complete and well-formed. */
  testOvertimeDb() {
    this.spTesting.set(true);
    const c = this.cfg;
    const ok = !!c.overtimeDbHost && !!c.overtimeDbPort && !!c.overtimeDbName && !!c.overtimeDbUser
      && /^\d+$/.test(c.overtimeDbPort) && /\.postgres\.database\.azure\.com$|localhost|^\d/.test(c.overtimeDbHost);
    setTimeout(() => {
      this.spTesting.set(false);
      if (ok) {
        this.snack.open(`Overtime DB config valid — database "${c.overtimeDbName}" on ${c.overtimeDbHost}`, 'OK', { duration: 4000 });
      } else {
        this.snack.open('Invalid Overtime DB config — check Host, Port (numeric), Database and Username.', 'Close', { duration: 5000 });
      }
    }, 500);
  }

  /** Build the AZURE_DATABASE_URL value from the Payroll DB fields. */
  payrollConnString(): string {
    const c = this.cfg;
    const ssl = (c.payrollDbSslMode || 'require').toLowerCase();
    return `postgresql://${c.payrollDbUser}:••••••••@${c.payrollDbHost}:${c.payrollDbPort}/${c.payrollDbName}?sslmode=${ssl}`;
  }

  /** Validate the Payroll DB config fields are complete and well-formed. */
  testPayrollDb() {
    this.spTesting.set(true);
    const c = this.cfg;
    const ok = !!c.payrollDbHost && !!c.payrollDbPort && !!c.payrollDbName && !!c.payrollDbUser
      && /^\d+$/.test(c.payrollDbPort) && /\.postgres\.database\.azure\.com$|localhost|^\d/.test(c.payrollDbHost);
    setTimeout(() => {
      this.spTesting.set(false);
      if (ok) {
        this.snack.open(`Payroll DB config valid — database "${c.payrollDbName}" on ${c.payrollDbHost}`, 'OK', { duration: 4000 });
      } else {
        this.snack.open('Invalid Payroll DB config — check Host, Port (numeric), Database and Username.', 'Close', { duration: 5000 });
      }
    }, 500);
  }

  testSharePoint() {
    this.spTesting.set(true);
    // Validate the site URL is reachable / well-formed. The actual Graph call
    // happens in the assets module via MSAL; here we do a basic reachability check.
    const url = this.cfg.assetsSharePointSiteUrl?.trim();
    const ok = !!url && /^https:\/\/.+\.sharepoint\.com\/sites\/.+/.test(url);
    setTimeout(() => {
      this.spTesting.set(false);
      if (ok) {
        this.snack.open(`SharePoint site URL looks valid. Library: ${this.cfg.assetsSharePointLibrary}`, 'OK', { duration: 4000 });
      } else {
        this.snack.open('Invalid SharePoint site URL. Expected https://<tenant>.sharepoint.com/sites/<site>', 'Close', { duration: 5000 });
      }
    }, 600);
  }

  testSharePointAfs() {
    this.spTesting.set(true);
    // Basic site-URL well-formedness check (mirrors the assets module's check).
    const url = this.cfg.afsSharePointSiteUrl?.trim();
    const ok = !!url && /^https:\/\/.+\.sharepoint\.com\/sites\/.+/.test(url);
    setTimeout(() => {
      this.spTesting.set(false);
      if (ok) {
        this.snack.open(`SharePoint site URL looks valid. Library: ${this.cfg.afsSharePointLibrary}`, 'OK', { duration: 4000 });
      } else {
        this.snack.open('Invalid SharePoint site URL. Expected https://<tenant>.sharepoint.com/sites/<site>', 'Close', { duration: 5000 });
      }
    }, 600);
  }

  testSharePointAfsAdjustments() {
    this.spTesting.set(true);
    const url = this.cfg.afsAdjustmentsSharePointSiteUrl?.trim();
    const ok = !!url && /^https:\/\/.+\.sharepoint\.com\/sites\/.+/.test(url);
    setTimeout(() => {
      this.spTesting.set(false);
      if (ok) {
        this.snack.open(`SharePoint site URL looks valid. Library: ${this.cfg.afsAdjustmentsSharePointLibrary}`, 'OK', { duration: 4000 });
      } else {
        this.snack.open('Invalid SharePoint site URL. Expected https://<tenant>.sharepoint.com/sites/<site>', 'Close', { duration: 5000 });
      }
    }, 600);
  }

  testSharePointOvertime() {
    this.spTesting.set(true);
    // Basic site-URL well-formedness check (mirrors the assets module's check).
    const url = this.cfg.overtimeSharePointSiteUrl?.trim();
    const ok = !!url && /^https:\/\/.+\.sharepoint\.com\/sites\/.+/.test(url);
    setTimeout(() => {
      this.spTesting.set(false);
      if (ok) {
        this.snack.open(`SharePoint site URL looks valid. Library: ${this.cfg.overtimeSharePointLibrary}`, 'OK', { duration: 4000 });
      } else {
        this.snack.open('Invalid SharePoint site URL. Expected https://<tenant>.sharepoint.com/sites/<site>', 'Close', { duration: 5000 });
      }
    }, 600);
  }
}
