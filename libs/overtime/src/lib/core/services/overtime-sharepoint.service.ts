import { Injectable, signal, inject } from '@angular/core';
import { GraphService } from '@platinumv3/shared/graph';

/**
 * Reads the Overtime SharePoint document-storage configuration that is managed
 * in the shell's Admin → Overtime settings page, and provides the SharePoint
 * document operations (list / upload / delete / download) used by the overtime
 * capture & edit forms.
 *
 *   - enabled = true  → supporting documents live in SharePoint (siteUrl +
 *                       library), filtered to a transaction via the OvertimeID
 *                       metadata column.
 *   - enabled = false → use the overtime API's existing local file storage.
 *
 * Mirrors the Assets module's SharePointConfigService, keyed by OvertimeID.
 */
const STORAGE_KEY = 'platinum_module_config';

export interface OvertimeSharePointConfig {
  enabled: boolean;
  siteUrl: string;
  library: string;
}

/** Normalized SharePoint document for display in the overtime form. */
export interface SpOvertimeDoc {
  __sp: true;
  __item: any; // raw Graph DriveItem (for download / delete / open)
  id: string;
  fileName: string;
  sizeBytes: number;
  uploadedAt: string;
  mimeType: string;
  overtimeId: string;
}

const DEFAULT_CONFIG: OvertimeSharePointConfig = {
  enabled: false,
  siteUrl: 'https://zamicromega.sharepoint.com/sites/Sebata2',
  library: 'UatOvertime',
};

@Injectable({ providedIn: 'root' })
export class OvertimeSharePointService {
  private graph = inject(GraphService);

  /** Reactive snapshot of the current SharePoint config. */
  readonly config = signal<OvertimeSharePointConfig>(this.read());

  private driveId: string | null = null;
  private overtimeIdField: string | null = null;
  private descriptionField: string | null = null;
  private employeeField: string | null = null;

  /** Re-reads the config from localStorage (call after the admin page saves). */
  refresh(): OvertimeSharePointConfig {
    const cfg = this.read();
    this.config.set(cfg);
    this.driveId = null;
    this.overtimeIdField = null;
    this.descriptionField = null;
    this.employeeField = null;
    return cfg;
  }

  /** True when uploads/listings should use SharePoint instead of local storage. */
  isEnabled(): boolean {
    return this.read().enabled;
  }

  // ── SharePoint document operations ─────────────────────────────────────────

  /** Resolve (and cache) the drive ID for the configured site + library. */
  async resolveDriveId(): Promise<string> {
    if (this.driveId) return this.driveId;
    const cfg = this.read();
    this.config.set(cfg);
    const u = new URL(cfg.siteUrl);
    const site = await this.graph.getSiteByPath(u.hostname, u.pathname.replace(/\/$/, ''));
    const drives = await this.graph.getDrives(site.id);
    const drive = drives.find(d => d.name?.toLowerCase() === cfg.library.toLowerCase()) ?? drives[0];
    if (!drive) throw new Error(`Document library "${cfg.library}" not found on the SharePoint site.`);
    this.driveId = drive.id;
    return drive.id;
  }

  /** List documents for an overtime transaction, filtered by the OvertimeID column. */
  async listOvertimeDocuments(overtimeId: string): Promise<SpOvertimeDoc[]> {
    const driveId = await this.resolveDriveId();
    const items = await this.graph.getChildren(driveId, 'root');
    await this.discoverFields(driveId, items);

    const idField = this.overtimeIdField || 'OvertimeID';
    const me = String(overtimeId);

    return items
      .filter((it: any) => !it.folder)
      .filter((it: any) => String(it.listItem?.fields?.[idField] ?? '') === me)
      .map((it: any): SpOvertimeDoc => ({
        __sp: true,
        __item: it,
        id: it.id,
        fileName: it.name,
        sizeBytes: it.size,
        uploadedAt: it.lastModifiedDateTime,
        mimeType: it.file?.mimeType || '',
        overtimeId: it.listItem?.fields?.[idField] ?? '',
      }));
  }

  /**
   * Upload a PDF and tag it with OvertimeID (+ an optional description). Field
   * internal names are discovered from the live library so the write targets the
   * exact column.
   */
  async uploadOvertimeDocument(
    overtimeId: string,
    file: File,
    meta?: { description?: string; employee?: string },
  ): Promise<void> {
    const driveId = await this.resolveDriveId();
    await this.discoverFields(driveId);
    const idField = this.overtimeIdField || 'OvertimeID';
    const descField = this.descriptionField || 'description';
    const empField = this.employeeField || 'Employee';

    const uploaded = await this.graph.uploadFile(driveId, 'root', file);

    const fields: Record<string, any> = { [idField]: String(overtimeId) };
    if (meta?.description && meta.description.trim()) {
      fields[descField] = meta.description.trim();
    }
    if (meta?.employee && meta.employee.trim()) {
      fields[empField] = meta.employee.trim();
    }

    try {
      await this.graph.updateItemFields(driveId, uploaded.id, fields);
    } catch (e: any) {
      console.warn('[OvertimeSharePoint] metadata tag failed for', file.name, ':', e?.message ?? e);
      throw new Error('File uploaded but metadata (OvertimeID) could not be saved: ' + (e?.message ?? e));
    }
  }

  /** Delete a SharePoint document by its raw DriveItem. */
  async deleteOvertimeDocument(item: any): Promise<void> {
    const driveId = await this.resolveDriveId();
    await this.graph.deleteItem(driveId, item.id);
  }

  /** Trigger a browser download of a SharePoint document. */
  async downloadOvertimeDocument(item: any): Promise<void> {
    const driveId = await this.resolveDriveId();
    await this.graph.triggerDownload(driveId, item.id, item.name);
  }

  // ── Private ────────────────────────────────────────────────────────────────

  /** Discover the OvertimeID / Description / Employee column INTERNAL names (cached). */
  private async discoverFields(driveId: string, sampleItems?: any[]): Promise<void> {
    if (this.overtimeIdField && this.descriptionField && this.employeeField) return;

    let items = sampleItems;
    if (!items) {
      try { items = await this.graph.getChildren(driveId, 'root'); }
      catch { items = []; }
    }
    for (const it of (items || [])) {
      const f = it.listItem?.fields || {};
      for (const key of Object.keys(f)) {
        const k = key.replace(/\s+/g, '').toLowerCase();
        if (!this.overtimeIdField && k === 'overtimeid') this.overtimeIdField = key;
        if (!this.descriptionField && key.toLowerCase() === 'description') this.descriptionField = key;
        if (!this.employeeField && k === 'employee') this.employeeField = key;
      }
      if (this.overtimeIdField && this.descriptionField && this.employeeField) break;
    }

    if (!this.overtimeIdField || !this.descriptionField || !this.employeeField) {
      try {
        const cols = await this.graph.getDriveColumns(driveId);
        for (const c of cols) {
          const nm = (c.name || '').replace(/\s+/g, '').toLowerCase();
          const dn = (c.displayName || '').replace(/\s+/g, '').toLowerCase();
          if (!this.overtimeIdField && (nm === 'overtimeid' || dn === 'overtimeid')) this.overtimeIdField = c.name;
          if (!this.descriptionField && (nm === 'description' || dn === 'description')) this.descriptionField = c.name;
          if (!this.employeeField && (nm === 'employee' || dn === 'employee')) this.employeeField = c.name;
        }
      } catch { /* ignore */ }
    }
  }

  private read(): OvertimeSharePointConfig {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          enabled: parsed.overtimeSharePointEnabled ?? DEFAULT_CONFIG.enabled,
          siteUrl: parsed.overtimeSharePointSiteUrl || DEFAULT_CONFIG.siteUrl,
          library: parsed.overtimeSharePointLibrary || DEFAULT_CONFIG.library,
        };
      }
    } catch {}
    return { ...DEFAULT_CONFIG };
  }
}
