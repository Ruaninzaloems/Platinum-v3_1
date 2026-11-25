import { Injectable, signal } from '@angular/core';

// Proxy targets defined in apps/shell/proxy.conf.json
const PG_API    = '/api';       // → localhost:3000 (PostgreSQL)
const MSSQL_API = '/ASSETS-API'; // → localhost:3001 (SQL Server), rewritten to /api

export type DatabaseBackend = 'postgresql' | 'sqlserver' | 'hybrid';

export interface SharedTable {
  key: string;
  label: string;
  sqlTable: string;
  psqlRoute: string;
  mssqlRoute: string;
  category: string;
}

export const SHARED_TABLES: SharedTable[] = [
  { key: 'buildings', label: 'Buildings', sqlTable: 'Const_Building', psqlRoute: 'buildings', mssqlRoute: 'buildings', category: 'Location' },
  { key: 'floors', label: 'Floors', sqlTable: 'Const_Floor', psqlRoute: 'floors', mssqlRoute: 'floors', category: 'Location' },
  { key: 'rooms', label: 'Rooms', sqlTable: 'Const_Room', psqlRoute: 'rooms', mssqlRoute: 'rooms', category: 'Location' },
  { key: 'streets', label: 'Streets', sqlTable: 'Const_Street', psqlRoute: 'streets', mssqlRoute: 'streets', category: 'Location' },
  { key: 'suburbs', label: 'Suburbs', sqlTable: 'Const_Suburb', psqlRoute: 'suburbs', mssqlRoute: 'suburbs', category: 'Location' },
  { key: 'towns', label: 'Towns', sqlTable: 'Const_Town', psqlRoute: 'towns', mssqlRoute: 'towns', category: 'Location' },
  { key: 'wards', label: 'Wards', sqlTable: 'Const_Ward', psqlRoute: 'wards', mssqlRoute: 'wards', category: 'Location' },
  { key: 'departments', label: 'Departments', sqlTable: 'Const_Department', psqlRoute: 'departments', mssqlRoute: 'departments', category: 'Organisation' },
  { key: 'divisions', label: 'Divisions', sqlTable: 'Const_Division', psqlRoute: 'divisions', mssqlRoute: 'divisions', category: 'Organisation' },
  { key: 'employees', label: 'Employees', sqlTable: 'Payroll_Employee', psqlRoute: 'employees', mssqlRoute: 'employees', category: 'Organisation' },
  { key: 'months', label: 'Months', sqlTable: 'Const_Month_sys', psqlRoute: 'months', mssqlRoute: 'months', category: 'Finance' },
  { key: 'funding-sources', label: 'Funding Sources', sqlTable: 'Const_FundingSource', psqlRoute: 'const-funding-sources', mssqlRoute: 'const-funding-sources', category: 'Finance' },
  { key: 'fin-years', label: 'Financial Years', sqlTable: 'Const_FinYearWithIndex_sys', psqlRoute: 'fin-years', mssqlRoute: 'fin-years', category: 'Finance' },
  { key: 'led-votes', label: 'LED Votes', sqlTable: 'Led_Vote', psqlRoute: 'led-votes', mssqlRoute: 'led-votes', category: 'Finance' },
  { key: 'scoa-structure', label: 'SCOA Structure', sqlTable: 'Const_SCOA_Structure', psqlRoute: 'scoa-structure', mssqlRoute: 'scoa-structure', category: 'Finance' },
  { key: 'commodities', label: 'Commodities', sqlTable: 'Inven_Commodity', psqlRoute: 'commodities', mssqlRoute: 'commodities', category: 'Reference' },
  { key: 'document-types', label: 'Document Types', sqlTable: 'Const_DocumentType', psqlRoute: 'document-types', mssqlRoute: 'document-types', category: 'Reference' },
  { key: 'property-types-of-use', label: 'Property Types of Use', sqlTable: 'Const_PropertyTypeOfUse', psqlRoute: 'property-types-of-use', mssqlRoute: 'property-types-of-use', category: 'Reference' },
  { key: 'unit-of-issue', label: 'Units of Issue', sqlTable: 'Const_UnitOfIssue', psqlRoute: 'unit-of-issues', mssqlRoute: 'unit-of-issue', category: 'Reference' },
  { key: 'user-processing-months', label: 'User Processing Months', sqlTable: 'User_UserProcessingMonth', psqlRoute: 'user-processing-months', mssqlRoute: 'user-processing-months', category: 'Organisation' },
  { key: 'inv-transfers', label: 'Inventory Transfers', sqlTable: 'Asset_InvTransfer', psqlRoute: 'inv-transfers', mssqlRoute: 'inv-transfers', category: 'Assets' },
  { key: 'scm-transfers', label: 'SCM Transfers', sqlTable: 'Asset_SCMTransfer', psqlRoute: 'scm-transfers', mssqlRoute: 'scm-transfers', category: 'Assets' },
  { key: 'vendors', label: 'Construction Vendors', sqlTable: 'Cons_Vendor', psqlRoute: 'vendors', mssqlRoute: 'vendors', category: 'SCM' },
  { key: 'plan-projects', label: 'Plan Projects', sqlTable: 'Plan_Project', psqlRoute: 'plan-projects', mssqlRoute: 'plan-projects', category: 'SCM' },
  { key: 'plan-project-items', label: 'Plan Project Items', sqlTable: 'Plan_ProjectItem', psqlRoute: 'plan-project-items', mssqlRoute: 'plan-project-items', category: 'SCM' },
  { key: 'scm-contracts', label: 'SCM Contracts', sqlTable: 'SCM_ContractDetails', psqlRoute: 'scm-contracts', mssqlRoute: 'scm-contracts', category: 'SCM' },
  { key: 'scm-contract-detail-items', label: 'SCM Contract Detail Items', sqlTable: 'SCM_ContractDetailItems', psqlRoute: 'scm-contract-detail-items', mssqlRoute: 'scm-contract-detail-items', category: 'SCM' },
  { key: 'scm-invoice-details', label: 'SCM Invoice Details', sqlTable: 'SCM_InvoiceDetail', psqlRoute: 'scm-invoice-details', mssqlRoute: 'scm-invoice-details', category: 'SCM' },
  { key: 'scm-invoices', label: 'SCM Invoices', sqlTable: 'SCM_Invoice', psqlRoute: 'scm-invoices', mssqlRoute: 'scm-invoices', category: 'SCM' },
  { key: 'scm-unbundling-headers', label: 'SCM Unbundling Headers', sqlTable: 'SCM_AssetUnbundling_Header', psqlRoute: 'scm-unbundling-headers', mssqlRoute: 'scm-unbundling-headers', category: 'SCM' },
  { key: 'scm-unbundling-details', label: 'SCM Unbundling Details', sqlTable: 'SCM_AssetUnbundling_Detail', psqlRoute: 'scm-unbundling-details', mssqlRoute: 'scm-unbundling-details', category: 'SCM' },
  { key: 'gl-outbox', label: 'GL Outbox', sqlTable: 'GL_Outbox', psqlRoute: 'gl-outbox', mssqlRoute: 'gl-outbox', category: 'GL' },
  { key: 'gl-outbox-lines', label: 'GL Outbox Lines', sqlTable: 'GL_Outbox_Lines', psqlRoute: 'gl-outbox-lines', mssqlRoute: 'gl-outbox-lines', category: 'GL' },
  { key: 'asset-config-event-types', label: 'Asset Config Event Types', sqlTable: 'AssetConfig_EventType', psqlRoute: 'asset-config-event-types', mssqlRoute: 'asset-config-event-types', category: 'GL' },
];

@Injectable({ providedIn: 'root' })
export class DatabaseToggleService {
  private static readonly STORAGE_KEY = 'preferredApi';
  private static readonly TABLE_SOURCES_KEY = 'tableDataSources';
  private static readonly MIGRATION_KEY = 'preferredApi_v3migrated';

  activeBackend = signal<DatabaseBackend>(this.loadPreference());
  tableSources = signal<Record<string, DatabaseBackend>>(this.loadTableSources());
  readonly tableOverrides = this.tableSources;

  get apiPrefix(): string {
    return this.activeBackend() === 'postgresql' ? PG_API : MSSQL_API;
  }

  /** Cycles through postgresql → sqlserver → hybrid → postgresql */
  cycleBackend(): void {
    const current = this.activeBackend();
    if (current === 'postgresql') this.setBackend('sqlserver');
    else if (current === 'sqlserver') this.setBackend('hybrid');
    else this.setBackend('postgresql');
  }

  tableSource(tableKey: string): DatabaseBackend {
    return this.tableSources()[tableKey] || 'postgresql';
  }

  getTableBackend(tableKey: string): DatabaseBackend {
    const backend = this.activeBackend();
    if (backend === 'postgresql') return 'postgresql';
    if (backend === 'sqlserver') return 'sqlserver';
    // hybrid: use per-table override if set, otherwise default to sqlserver
    const override = this.tableSources()[tableKey];
    if (override === 'postgresql' || override === 'sqlserver') return override;
    return 'sqlserver';
  }

  getTablePrefix(tableKey: string): string {
    const backend = this.activeBackend();
    if (backend === 'postgresql') return PG_API;
    if (backend === 'sqlserver') return MSSQL_API;
    // hybrid: per-table override
    const override = this.tableSources()[tableKey];
    return override === 'postgresql' ? PG_API : MSSQL_API;
  }

  getTableUrl(tableKey: string): string {
    const table = SHARED_TABLES.find(t => t.key === tableKey);
    const backend = this.activeBackend();

    if (backend === 'postgresql') {
      return PG_API + '/' + (table ? table.psqlRoute : tableKey);
    }
    if (backend === 'sqlserver') {
      return MSSQL_API + '/' + (table ? table.mssqlRoute : tableKey);
    }
    // hybrid: per-table override, default to sqlserver
    const override = this.tableSources()[tableKey];
    if (override === 'postgresql') {
      return PG_API + '/' + (table ? table.psqlRoute : tableKey);
    }
    return MSSQL_API + '/' + (table ? table.mssqlRoute : tableKey);
  }

  setBackend(backend: DatabaseBackend): void {
    this.activeBackend.set(backend);
    try { localStorage.setItem(DatabaseToggleService.STORAGE_KEY, backend); } catch (_) {}
  }

  setTableSource(tableKey: string, backend: DatabaseBackend | 'inherit'): void {
    const sources = { ...this.tableSources() };
    if (backend === 'inherit') delete sources[tableKey];
    else sources[tableKey] = backend;
    this.tableSources.set(sources);
    try { localStorage.setItem(DatabaseToggleService.TABLE_SOURCES_KEY, JSON.stringify(sources)); } catch (_) {}
  }

  setTableBackend(tableKey: string, backend: DatabaseBackend | 'inherit'): void {
    this.setTableSource(tableKey, backend);
  }

  resetTableOverrides(): void {
    this.tableSources.set({});
    try { localStorage.removeItem(DatabaseToggleService.TABLE_SOURCES_KEY); } catch (_) {}
  }

  private loadPreference(): DatabaseBackend {
    try {
      const migrated = localStorage.getItem(DatabaseToggleService.MIGRATION_KEY);
      const stored   = localStorage.getItem(DatabaseToggleService.STORAGE_KEY);
      // One-time migration: old 'sqlserver' default → 'hybrid'
      if (!migrated && stored === 'sqlserver') {
        localStorage.setItem(DatabaseToggleService.STORAGE_KEY, 'hybrid');
        localStorage.setItem(DatabaseToggleService.MIGRATION_KEY, '1');
        return 'hybrid';
      }
      if (!migrated) localStorage.setItem(DatabaseToggleService.MIGRATION_KEY, '1');
      if (stored === 'postgresql' || stored === 'sqlserver' || stored === 'hybrid') return stored;
    } catch (_) {}
    return 'postgresql';
  }

  private loadTableSources(): Record<string, DatabaseBackend> {
    try {
      const stored = localStorage.getItem(DatabaseToggleService.TABLE_SOURCES_KEY);
      if (stored) return JSON.parse(stored) as Record<string, DatabaseBackend>;
    } catch (_) {}
    return {};
  }
}
