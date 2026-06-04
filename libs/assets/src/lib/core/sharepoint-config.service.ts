import { Injectable, signal, inject } from '@angular/core';
import { GraphService } from '@platinumv3/shared/graph';

/**
 * Reads the Assets SharePoint document-storage configuration that is managed
 * in the shell's Admin → Assets settings page, and provides the shared
 * SharePoint document operations (list / upload / delete) used by the asset
 * document panel and the asset-detail Documents badge.
 *
 *   - enabled = true  → documents live in SharePoint (siteUrl + library),
 *                       filtered to an asset via the AssetsID metadata column
 *   - enabled = false → use the asset module's existing local file storage
 */
const STORAGE_KEY = 'platinum_module_config';

export interface AssetsSharePointConfig {
  enabled : boolean;
  siteUrl : string;
  library : string;
}

/** Normalized SharePoint document for display in the asset document panel. */
export interface SpAssetDoc {
  __sp        : true;
  __item      : any;     // raw Graph DriveItem (for download / delete / open)
  file_name   : string;
  file_size   : number;
  uploaded_at : string;
  mime_type   : string;
  description : string;
  assetsId    : string;
}

const DEFAULT_CONFIG: AssetsSharePointConfig = {
  enabled : false,
  siteUrl : 'https://zamicromega.sharepoint.com/sites/Sebata2',
  library : 'UatAssets',
};

@Injectable({ providedIn: 'root' })
export class SharePointConfigService {
  private graph = inject(GraphService);

  /** Reactive snapshot of the current SharePoint config. */
  readonly config = signal<AssetsSharePointConfig>(this.read());

  private driveId: string | null = null;
  private assetsIdField: string | null = null;
  private descriptionField: string | null = null;

  /** Re-reads the config from localStorage (call after the admin page saves). */
  refresh(): AssetsSharePointConfig {
    const cfg = this.read();
    this.config.set(cfg);
    // Invalidate cached drive/field info so the new site/library is picked up.
    this.driveId = null;
    this.assetsIdField = null;
    this.descriptionField = null;
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
    const cfg = this.config();
    const u = new URL(cfg.siteUrl);
    const hostname = u.hostname;
    const sitePath = u.pathname.replace(/\/$/, '');
    const site   = await this.graph.getSiteByPath(hostname, sitePath);
    const drives = await this.graph.getDrives(site.id);
    const drive  = drives.find(d => d.name?.toLowerCase() === cfg.library.toLowerCase()) ?? drives[0];
    if (!drive) throw new Error(`Document library "${cfg.library}" not found on the SharePoint site.`);
    this.driveId = drive.id;
    return drive.id;
  }

  /** List documents for an asset, filtered by the library's AssetsID column. */
  async listAssetDocuments(assetId: number): Promise<SpAssetDoc[]> {
    const driveId = await this.resolveDriveId();
    const items = await this.graph.getChildren(driveId, 'root');
    await this.discoverFields(driveId, items);

    const idField   = this.assetsIdField   || 'AssetsID';
    const descField = this.descriptionField || 'Description';
    const me = String(assetId);

    return items
      .filter((it: any) => !it.folder)
      .filter((it: any) => String(it.listItem?.fields?.[idField] ?? '') === me)
      .map((it: any): SpAssetDoc => ({
        __sp        : true,
        __item      : it,
        file_name   : it.name,
        file_size   : it.size,
        uploaded_at : it.lastModifiedDateTime,
        mime_type   : it.file?.mimeType || '',
        description : it.listItem?.fields?.[descField] ?? '',
        assetsId    : it.listItem?.fields?.[idField] ?? '',
      }));
  }

  /**
   * Upload a file and tag it with AssetsID + the asset name as the Description.
   * Field internal names are discovered from the live library so the write
   * targets the exact column (e.g. lowercase "description").
   */
  async uploadAssetDocument(assetId: number, file: File, description?: string): Promise<void> {
    const driveId = await this.resolveDriveId();
    await this.discoverFields(driveId);
    const idField   = this.assetsIdField   || 'AssetsID';
    const descField = this.descriptionField || 'description';

    const uploaded = await this.graph.uploadFile(driveId, 'root', file);

    const fields: Record<string, any> = { [idField]: String(assetId) };
    if (description && description.trim() && description !== 'General') {
      fields[descField] = description.trim();
    }

    try {
      await this.graph.updateItemFields(driveId, uploaded.id, fields);
    } catch (e: any) {
      console.warn('[SharePointConfig] metadata tag failed for', file.name, ':', e?.message ?? e);
      throw new Error('File uploaded but metadata (AssetsID/description) could not be saved: ' + (e?.message ?? e));
    }
  }

  /** Delete a SharePoint document by its raw DriveItem. */
  async deleteAssetDocument(item: any): Promise<void> {
    const driveId = await this.resolveDriveId();
    await this.graph.deleteItem(driveId, item.id);
  }

  /** Trigger a browser download of a SharePoint document. */
  async downloadAssetDocument(item: any): Promise<void> {
    const driveId = await this.resolveDriveId();
    await this.graph.triggerDownload(driveId, item.id, item.name);
  }

  // ── Private ────────────────────────────────────────────────────────────────

  /**
   * Discover the AssetsID / Description column INTERNAL names (cached).
   *
   * The authoritative source is the actual `listItem.fields` keys on existing
   * items — those keys are exactly what `updateItemFields` must write to. We
   * match case-insensitively (the SharePoint columns are "AssetsID" and the
   * lowercase "description"), so we never guess the casing wrong.
   * getDriveColumns is used as a secondary source when no items exist yet.
   */
  private async discoverFields(driveId: string, sampleItems?: any[]): Promise<void> {
    if (this.assetsIdField && this.descriptionField) return;

    // 1) Authoritative: sniff real field keys from existing items.
    let items = sampleItems;
    if (!items) {
      try { items = await this.graph.getChildren(driveId, 'root'); }
      catch { items = []; }
    }
    for (const it of (items || [])) {
      const f = it.listItem?.fields || {};
      for (const key of Object.keys(f)) {
        if (!this.assetsIdField && key.replace(/\s+/g, '').toLowerCase() === 'assetsid') this.assetsIdField = key;
        if (!this.descriptionField && key.toLowerCase() === 'description') this.descriptionField = key;
      }
      if (this.assetsIdField && this.descriptionField) break;
    }

    // 2) Secondary: the column list (covers empty libraries / unset fields).
    if (!this.assetsIdField || !this.descriptionField) {
      try {
        const cols = await this.graph.getDriveColumns(driveId);
        for (const c of cols) {
          const nm = (c.name || '').replace(/\s+/g, '').toLowerCase();
          const dn = (c.displayName || '').replace(/\s+/g, '').toLowerCase();
          if (!this.assetsIdField && (nm === 'assetsid' || dn === 'assetsid')) this.assetsIdField = c.name;
          if (!this.descriptionField && (nm === 'description' || dn === 'description')) this.descriptionField = c.name;
        }
      } catch { /* ignore */ }
    }
  }

  private read(): AssetsSharePointConfig {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          enabled : parsed.assetsSharePointEnabled ?? DEFAULT_CONFIG.enabled,
          siteUrl : parsed.assetsSharePointSiteUrl  || DEFAULT_CONFIG.siteUrl,
          library : parsed.assetsSharePointLibrary  || DEFAULT_CONFIG.library,
        };
      }
    } catch {}
    return { ...DEFAULT_CONFIG };
  }
}
