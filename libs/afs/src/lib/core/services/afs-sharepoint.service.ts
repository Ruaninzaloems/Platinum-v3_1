import { Injectable, signal, inject } from '@angular/core';
import { GraphService } from '@platinumv3/shared/graph';

/**
 * AFS SharePoint document storage — managed in the shell's Admin → AFS settings.
 * When enabled, AFS document uploads (e.g. working-paper supporting documents) go
 * to the configured SharePoint library (siteUrl + library), tagged with the
 * library's metadata columns and linked to the entity via the AFSID column.
 *
 *   Library columns written:  AFSID, description, Classification, Category, Tags
 *
 * Mirrors the Assets SharePointConfigService / Overtime OvertimeSharePointService,
 * keyed by AFSID.
 */
const STORAGE_KEY = 'platinum_module_config';

export interface AfsSharePointConfig {
  enabled: boolean;
  siteUrl: string;
  library: string;
}

/** Normalized SharePoint document (shaped for the AFS DMS list). */
export interface SpAfsDoc {
  __sp: true;
  __item: any;            // raw Graph DriveItem (download / delete / open)
  id: string;
  fileName: string;
  fileSize: number;
  createdAt: string;
  mimeType: string;
  afsId: string;
  description: string;
  classificationLabel: string;
  category: string;
  tags: string[];
}

const DEFAULT_CONFIG: AfsSharePointConfig = {
  enabled: false,
  siteUrl: 'https://zamicromega.sharepoint.com/sites/Sebata2',
  library: 'UatAFS',
};

interface AfsDocMeta {
  description?: string;
  classification?: string;
  category?: string;
  tags?: string;
}

@Injectable({ providedIn: 'root' })
export class AfsSharePointService {
  private graph = inject(GraphService);

  readonly config = signal<AfsSharePointConfig>(this.read());

  private driveId: string | null = null;
  private fields: Record<string, string | null> = {
    afsid: null, description: null, classification: null, category: null, tags: null,
  };

  refresh(): AfsSharePointConfig {
    const cfg = this.read();
    this.config.set(cfg);
    this.driveId = null;
    this.fields = { afsid: null, description: null, classification: null, category: null, tags: null };
    return cfg;
  }

  isEnabled(): boolean {
    return this.read().enabled;
  }

  // ── SharePoint operations ───────────────────────────────────────────────────

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

  /** List documents linked to an AFS entity (e.g. a working paper) via AFSID. */
  async listAfsDocuments(afsId: string): Promise<SpAfsDoc[]> {
    if (!afsId) return [];
    const driveId = await this.resolveDriveId();
    const items = await this.graph.getChildren(driveId, 'root');
    await this.discoverFields(driveId, items);
    const f = this.fields;
    const me = String(afsId);
    return items
      .filter((it: any) => !it.folder)
      .filter((it: any) => String(it.listItem?.fields?.[f.afsid || 'AFSID'] ?? '') === me)
      .map((it: any) => this.toDoc(it, f));
  }

  /** Upload a file, tag AFSID + the metadata columns, link it to the AFS entity. */
  async uploadAfsDocument(afsId: string, file: File, meta?: AfsDocMeta): Promise<SpAfsDoc> {
    const driveId = await this.resolveDriveId();
    await this.discoverFields(driveId);
    const f = this.fields;

    const uploaded = await this.graph.uploadFile(driveId, 'root', file);

    const fields: Record<string, any> = { [f.afsid || 'AFSID']: String(afsId ?? '') };
    if (meta?.description?.trim())     fields[f.description || 'description'] = meta.description.trim();
    if (meta?.classification?.trim())  fields[f.classification || 'Classification'] = meta.classification.trim();
    if (meta?.category?.trim())        fields[f.category || 'Category'] = meta.category.trim();
    if (meta?.tags?.trim())            fields[f.tags || 'Tags'] = meta.tags.trim();

    try {
      await this.graph.updateItemFields(driveId, uploaded.id, fields);
    } catch (e: any) {
      console.warn('[AfsSharePoint] metadata tag failed for', file.name, ':', e?.message ?? e);
      throw new Error('File uploaded but metadata (AFSID/columns) could not be saved: ' + (e?.message ?? e));
    }
    // Re-read the item so the returned doc carries the saved fields.
    return this.toDoc({ ...uploaded, listItem: { fields } }, f, afsId);
  }

  async deleteAfsDocument(item: any): Promise<void> {
    const driveId = await this.resolveDriveId();
    await this.graph.deleteItem(driveId, item.id);
  }

  async downloadAfsDocument(item: any): Promise<void> {
    const driveId = await this.resolveDriveId();
    await this.graph.triggerDownload(driveId, item.id, item.name);
  }

  // ── Private ─────────────────────────────────────────────────────────────────

  private toDoc(it: any, f: Record<string, string | null>, afsIdFallback = ''): SpAfsDoc {
    const flds = it.listItem?.fields || {};
    const tagsRaw = flds[f.tags || 'Tags'];
    return {
      __sp: true,
      __item: it,
      id: it.id,
      fileName: it.name,
      fileSize: it.size ?? 0,
      createdAt: it.lastModifiedDateTime ?? it.createdDateTime ?? new Date().toISOString(),
      mimeType: it.file?.mimeType || '',
      afsId: String(flds[f.afsid || 'AFSID'] ?? afsIdFallback ?? ''),
      description: flds[f.description || 'description'] ?? '',
      classificationLabel: flds[f.classification || 'Classification'] ?? '',
      category: flds[f.category || 'Category'] ?? '',
      tags: typeof tagsRaw === 'string' && tagsRaw ? tagsRaw.split(',').map((t: string) => t.trim()) : [],
    };
  }

  /** Discover the internal column names (AFSID/description/Classification/Category/Tags). */
  private async discoverFields(driveId: string, sampleItems?: any[]): Promise<void> {
    if (Object.values(this.fields).every(v => v)) return;
    const want: Record<string, string> = {
      afsid: 'afsid', description: 'description', classification: 'classification',
      category: 'category', tags: 'tags',
    };

    let items = sampleItems;
    if (!items) { try { items = await this.graph.getChildren(driveId, 'root'); } catch { items = []; } }
    for (const it of (items || [])) {
      for (const key of Object.keys(it.listItem?.fields || {})) {
        const norm = key.replace(/\s+/g, '').toLowerCase();
        for (const slot of Object.keys(want)) {
          if (!this.fields[slot] && norm === want[slot]) this.fields[slot] = key;
        }
      }
      if (Object.values(this.fields).every(v => v)) break;
    }

    if (!Object.values(this.fields).every(v => v)) {
      try {
        const cols = await this.graph.getDriveColumns(driveId);
        for (const c of cols) {
          const nm = (c.name || '').replace(/\s+/g, '').toLowerCase();
          const dn = (c.displayName || '').replace(/\s+/g, '').toLowerCase();
          for (const slot of Object.keys(want)) {
            if (!this.fields[slot] && (nm === want[slot] || dn === want[slot])) this.fields[slot] = c.name;
          }
        }
      } catch { /* ignore */ }
    }
  }

  private read(): AfsSharePointConfig {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        return {
          enabled: p.afsSharePointEnabled ?? DEFAULT_CONFIG.enabled,
          siteUrl: p.afsSharePointSiteUrl || DEFAULT_CONFIG.siteUrl,
          library: p.afsSharePointLibrary || DEFAULT_CONFIG.library,
        };
      }
    } catch {}
    return { ...DEFAULT_CONFIG };
  }
}
