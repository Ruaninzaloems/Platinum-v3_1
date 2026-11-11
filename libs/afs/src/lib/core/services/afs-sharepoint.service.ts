import { Injectable, signal, inject } from '@angular/core';
import { GraphService } from '@platinumv3/shared/graph';

/**
 * AFS SharePoint document storage — managed in the shell's Admin → AFS settings.
 * When enabled, AFS document uploads go to the configured SharePoint library
 * (siteUrl + library), tagged with the library's metadata columns and linked to
 * the entity via the AFSID column.
 *
 *   Library columns written:  AFSID, description, Classification, Category, Tags
 *
 * Eighteen independent libraries are supported, each with its own enable toggle:
 *   • 'afs'          → general AFS documents (and working papers when 'workingPaper' is off) (default lib: UatAFS)
 *   • 'adjustments'  → adjustment supporting documents   (default lib: UatAFSAdjustments)
 *   • 'rfi'          → Working-Papers RFI attachments    (default lib: UatAFS WorkingPapers_RFI_Attachment)
 *   • 'workingPaper' → Working-Papers working papers     (default lib: UatAFS WorkingPapers-WorkingPaper)
 *   • 'finding'      → Working-Papers finding attachments (default lib: UatAFS WorkingPapers_FindingAttachment)
 *   • 'scoaVersion'  → Working-Papers SCOA version documents (default lib: UatAFS WorkingPapers_ScoaVersion)
 *   • 'afsDraft'     → Working-Papers AFS drafts           (default lib: UatAFS WorkingPapers_AFS_Draft)
 *   • 'afsFinal'     → Working-Papers final AFS documents  (default lib: UatAFS WorkingPapers_AfsFinal)
 *   • 'adjustmentSupport' → Working-Papers adjustment support (default lib: UatAFS WorkingPapers_AdjustmentSupport)
 *   • 'mappingSnapshot' → Working-Papers mapping snapshots (default lib: UatAFS WorkingPapers_MappingSnapshot)
 *   • 'export'       → Working-Papers exports              (default lib: UatAFS WorkingPapers_Export)
 *   • 'template'     → Working-Papers templates            (default lib: UatAFS WorkingPapers_Template)
 *   • 'evidence'     → Working-Papers evidence             (default lib: UatAFS WorkingPapers_Evidence)
 *   • 'administration' → AFS administration documents     (default lib: UatAFS Administration)
 *   • 'documentManagement' → AFS document management      (default lib: UatAFS Document_Management)
 *   • 'dataSourceTb' → AFS data sources (TB)              (default lib: UatAFS Data_Source_TB)
 *   • 'rolledUpGl'   → AFS dashboard rolled-up GL          (default lib: UatAFS Dashboard Rolled_Up_GL)
 *   • 'mfmaReporting' → AFS MFMA reporting dashboard      (default lib: UatAFS MFMA Reporting Dashboard)
 *
 * Mirrors the Assets SharePointConfigService / Overtime OvertimeSharePointService.
 */
const STORAGE_KEY = 'platinum_module_config';

export type AfsSpVariant = 'afs' | 'adjustments' | 'rfi' | 'workingPaper' | 'finding' | 'scoaVersion' | 'afsDraft' | 'afsFinal' | 'adjustmentSupport' | 'mappingSnapshot' | 'export' | 'template' | 'evidence' | 'administration' | 'documentManagement' | 'dataSourceTb' | 'rolledUpGl' | 'mfmaReporting';

export interface AfsSharePointConfig {
  enabled: boolean;
  siteUrl: string;
  library: string;
  /** Optional explicit internal name of the entity-link column (overrides discovery/default). */
  linkColumn?: string;
}

/** Normalized SharePoint document (shaped for the AFS DMS list). */
export interface SpAfsDoc {
  __sp: true;
  __item: any;            // raw Graph DriveItem (download / delete / open)
  __variant: AfsSpVariant;
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

const DEFAULT_CONFIGS: Record<AfsSpVariant, AfsSharePointConfig> = {
  afs: { enabled: false, siteUrl: 'https://zamicromega.sharepoint.com/sites/Sebata2', library: 'UatAFS' },
  // The Adjustments library's URL segment is "UatAFSAdjustments1" (its display title is still
  // "UatAFSAdjustments" but that name was taken, so SharePoint suffixed the URL with 1).
  adjustments: { enabled: false, siteUrl: 'https://zamicromega.sharepoint.com/sites/Sebata2', library: 'UatAFSAdjustments1' },
  rfi: { enabled: false, siteUrl: 'https://zamicromega.sharepoint.com/sites/Sebata2', library: 'UatAFS WorkingPapers_RFI_Attachment' },
  workingPaper: { enabled: false, siteUrl: 'https://zamicromega.sharepoint.com/sites/Sebata2', library: 'UatAFS WorkingPapers-WorkingPaper' },
  finding: { enabled: false, siteUrl: 'https://zamicromega.sharepoint.com/sites/Sebata2', library: 'UatAFS WorkingPapers_FindingAttachment' },
  scoaVersion: { enabled: false, siteUrl: 'https://zamicromega.sharepoint.com/sites/Sebata2', library: 'UatAFS WorkingPapers_ScoaVersion' },
  afsDraft: { enabled: false, siteUrl: 'https://zamicromega.sharepoint.com/sites/Sebata2', library: 'UatAFS WorkingPapers_AFS_Draft' },
  afsFinal: { enabled: false, siteUrl: 'https://zamicromega.sharepoint.com/sites/Sebata2', library: 'UatAFS WorkingPapers_AfsFinal' },
  adjustmentSupport: { enabled: false, siteUrl: 'https://zamicromega.sharepoint.com/sites/Sebata2', library: 'UatAFS WorkingPapers_AdjustmentSupport' },
  mappingSnapshot: { enabled: false, siteUrl: 'https://zamicromega.sharepoint.com/sites/Sebata2', library: 'UatAFS WorkingPapers_MappingSnapshot' },
  export: { enabled: false, siteUrl: 'https://zamicromega.sharepoint.com/sites/Sebata2', library: 'UatAFS WorkingPapers_Export' },
  template: { enabled: false, siteUrl: 'https://zamicromega.sharepoint.com/sites/Sebata2', library: 'UatAFS WorkingPapers_Template' },
  evidence: { enabled: false, siteUrl: 'https://zamicromega.sharepoint.com/sites/Sebata2', library: 'UatAFS WorkingPapers_Evidence' },
  administration: { enabled: false, siteUrl: 'https://zamicromega.sharepoint.com/sites/Sebata2', library: 'UatAFS Administration' },
  documentManagement: { enabled: false, siteUrl: 'https://zamicromega.sharepoint.com/sites/Sebata2', library: 'UatAFS Document_Management' },
  dataSourceTb: { enabled: false, siteUrl: 'https://zamicromega.sharepoint.com/sites/Sebata2', library: 'UatAFS Data_Source_TB' },
  rolledUpGl: { enabled: false, siteUrl: 'https://zamicromega.sharepoint.com/sites/Sebata2', library: 'UatAFS Dashboard Rolled_Up_GL' },
  mfmaReporting: { enabled: false, siteUrl: 'https://zamicromega.sharepoint.com/sites/Sebata2', library: 'UatAFS MFMA Reporting Dashboard' },
};

interface AfsDocMeta {
  description?: string;
  classification?: string;
  category?: string;
  tags?: string;
  documentType?: string;
  accessLevel?: string;
}

const emptyFields = (): Record<string, string | null> =>
  ({ afsid: null, description: null, classification: null, category: null, tags: null, documenttype: null, accesslevel: null });

// The entity-link column differs per library: AFS uses "AFSID", the Adjustments
// library uses "ADJID", and each Working-Papers / administration / document management / data
// sources (TB) library has its own (RFI_A_ID, WPID, FA_ID …). (description/Classification/Category/Tags are the same.)
const LINK_FIELD: Record<AfsSpVariant, { key: string; defaultName: string }> = {
  afs: { key: 'afsid', defaultName: 'AFSID' },
  adjustments: { key: 'adjid', defaultName: 'ADJID' },
  rfi: { key: 'rfi_a_id', defaultName: 'RFI_A_ID' },
  workingPaper: { key: 'wpid', defaultName: 'WPID' },
  finding: { key: 'fa_id', defaultName: 'FA_ID' },
  scoaVersion: { key: 'scoaid', defaultName: 'SCOAID' },
  afsDraft: { key: 'afs_draft_id', defaultName: 'AFS_Draft_ID' },
  afsFinal: { key: 'afsfinal_id', defaultName: 'AFSFinal_ID' },
  adjustmentSupport: { key: 'adjsupportid', defaultName: 'ADJSupportID' },
  mappingSnapshot: { key: 'mappingid', defaultName: 'MappingID' },
  export: { key: 'exportid', defaultName: 'ExportID' },
  template: { key: 'templateid', defaultName: 'TemplateID' },
  evidence: { key: 'evd_id', defaultName: 'Evd_ID' },
  administration: { key: 'adminid', defaultName: 'AdminID' },
  documentManagement: { key: 'docid', defaultName: 'DocID' },
  dataSourceTb: { key: 'datasource_id', defaultName: 'DataSource_ID' },
  rolledUpGl: { key: 'gl_id', defaultName: 'GL_ID' },
  mfmaReporting: { key: 'mfma_id', defaultName: 'MFMA_ID' },
};

/** Normalise a library title / URL segment for matching: decode %20, lowercase, drop whitespace
 *  (so "UatAFS WorkingPapers", "UatAFS%20WorkingPapers" and "UatAFSWorkingPapers" all match). */
const normLibrary = (s?: string): string => {
  let v = s || '';
  try { v = decodeURIComponent(v); } catch { /* keep as-is */ }
  return v.toLowerCase().replace(/\s+/g, '');
};

@Injectable({ providedIn: 'root' })
export class AfsSharePointService {
  private graph = inject(GraphService);

  /** Working-paper / general AFS library config. */
  readonly config = signal<AfsSharePointConfig>(this.read('afs'));
  /** Adjustments library config. */
  readonly adjustmentsConfig = signal<AfsSharePointConfig>(this.read('adjustments'));
  /** Working-Papers RFI attachment library config. */
  readonly rfiConfig = signal<AfsSharePointConfig>(this.read('rfi'));
  /** Working-Papers working-paper library config. */
  readonly workingPaperConfig = signal<AfsSharePointConfig>(this.read('workingPaper'));
  /** Working-Papers finding attachment library config. */
  readonly findingConfig = signal<AfsSharePointConfig>(this.read('finding'));
  /** Working-Papers SCOA version library config. */
  readonly scoaVersionConfig = signal<AfsSharePointConfig>(this.read('scoaVersion'));
  /** Working-Papers AFS draft library config. */
  readonly afsDraftConfig = signal<AfsSharePointConfig>(this.read('afsDraft'));
  /** Working-Papers final AFS library config. */
  readonly afsFinalConfig = signal<AfsSharePointConfig>(this.read('afsFinal'));
  /** Working-Papers adjustment support library config. */
  readonly adjustmentSupportConfig = signal<AfsSharePointConfig>(this.read('adjustmentSupport'));
  /** Working-Papers mapping snapshot library config. */
  readonly mappingSnapshotConfig = signal<AfsSharePointConfig>(this.read('mappingSnapshot'));
  /** Working-Papers export library config. */
  readonly exportConfig = signal<AfsSharePointConfig>(this.read('export'));
  /** Working-Papers template library config. */
  readonly templateConfig = signal<AfsSharePointConfig>(this.read('template'));
  /** Working-Papers evidence library config. */
  readonly evidenceConfig = signal<AfsSharePointConfig>(this.read('evidence'));
  /** AFS administration library config. */
  readonly administrationConfig = signal<AfsSharePointConfig>(this.read('administration'));
  /** AFS document management library config. */
  readonly documentManagementConfig = signal<AfsSharePointConfig>(this.read('documentManagement'));
  /** AFS data sources (TB) library config. */
  readonly dataSourceTbConfig = signal<AfsSharePointConfig>(this.read('dataSourceTb'));
  /** AFS dashboard rolled-up general ledger library config. */
  readonly rolledUpGlConfig = signal<AfsSharePointConfig>(this.read('rolledUpGl'));
  /** AFS MFMA reporting dashboard library config. */
  readonly mfmaReportingConfig = signal<AfsSharePointConfig>(this.read('mfmaReporting'));

  private driveIds: Record<AfsSpVariant, string | null> = { afs: null, adjustments: null, rfi: null, workingPaper: null, finding: null, scoaVersion: null, afsDraft: null, afsFinal: null, adjustmentSupport: null, mappingSnapshot: null, export: null, template: null, evidence: null, administration: null, documentManagement: null, dataSourceTb: null, rolledUpGl: null, mfmaReporting: null };
  private fieldsByVariant: Record<AfsSpVariant, Record<string, string | null>> = {
    afs: emptyFields(), adjustments: emptyFields(), rfi: emptyFields(), workingPaper: emptyFields(), finding: emptyFields(), scoaVersion: emptyFields(), afsDraft: emptyFields(), afsFinal: emptyFields(), adjustmentSupport: emptyFields(), mappingSnapshot: emptyFields(), export: emptyFields(), template: emptyFields(), evidence: emptyFields(), administration: emptyFields(), documentManagement: emptyFields(), dataSourceTb: emptyFields(), rolledUpGl: emptyFields(), mfmaReporting: emptyFields(),
  };

  refresh(): void {
    this.config.set(this.read('afs'));
    this.adjustmentsConfig.set(this.read('adjustments'));
    this.rfiConfig.set(this.read('rfi'));
    this.workingPaperConfig.set(this.read('workingPaper'));
    this.findingConfig.set(this.read('finding'));
    this.scoaVersionConfig.set(this.read('scoaVersion'));
    this.afsDraftConfig.set(this.read('afsDraft'));
    this.afsFinalConfig.set(this.read('afsFinal'));
    this.adjustmentSupportConfig.set(this.read('adjustmentSupport'));
    this.mappingSnapshotConfig.set(this.read('mappingSnapshot'));
    this.exportConfig.set(this.read('export'));
    this.templateConfig.set(this.read('template'));
    this.evidenceConfig.set(this.read('evidence'));
    this.administrationConfig.set(this.read('administration'));
    this.documentManagementConfig.set(this.read('documentManagement'));
    this.dataSourceTbConfig.set(this.read('dataSourceTb'));
    this.rolledUpGlConfig.set(this.read('rolledUpGl'));
    this.mfmaReportingConfig.set(this.read('mfmaReporting'));
    this.driveIds = { afs: null, adjustments: null, rfi: null, workingPaper: null, finding: null, scoaVersion: null, afsDraft: null, afsFinal: null, adjustmentSupport: null, mappingSnapshot: null, export: null, template: null, evidence: null, administration: null, documentManagement: null, dataSourceTb: null, rolledUpGl: null, mfmaReporting: null };
    this.fieldsByVariant = { afs: emptyFields(), adjustments: emptyFields(), rfi: emptyFields(), workingPaper: emptyFields(), finding: emptyFields(), scoaVersion: emptyFields(), afsDraft: emptyFields(), afsFinal: emptyFields(), adjustmentSupport: emptyFields(), mappingSnapshot: emptyFields(), export: emptyFields(), template: emptyFields(), evidence: emptyFields(), administration: emptyFields(), documentManagement: emptyFields(), dataSourceTb: emptyFields(), rolledUpGl: emptyFields(), mfmaReporting: emptyFields() };
  }

  private configSignal(variant: AfsSpVariant) {
    switch (variant) {
      case 'adjustments': return this.adjustmentsConfig;
      case 'rfi': return this.rfiConfig;
      case 'workingPaper': return this.workingPaperConfig;
      case 'finding': return this.findingConfig;
      case 'scoaVersion': return this.scoaVersionConfig;
      case 'afsDraft': return this.afsDraftConfig;
      case 'afsFinal': return this.afsFinalConfig;
      case 'adjustmentSupport': return this.adjustmentSupportConfig;
      case 'mappingSnapshot': return this.mappingSnapshotConfig;
      case 'export': return this.exportConfig;
      case 'template': return this.templateConfig;
      case 'evidence': return this.evidenceConfig;
      case 'administration': return this.administrationConfig;
      case 'documentManagement': return this.documentManagementConfig;
      case 'dataSourceTb': return this.dataSourceTbConfig;
      case 'rolledUpGl': return this.rolledUpGlConfig;
      case 'mfmaReporting': return this.mfmaReportingConfig;
      default: return this.config;
    }
  }

  isEnabled(variant: AfsSpVariant = 'afs'): boolean {
    return this.read(variant).enabled;
  }

  // ── SharePoint operations ───────────────────────────────────────────────────

  async resolveDriveId(variant: AfsSpVariant = 'afs'): Promise<string> {
    if (this.driveIds[variant]) return this.driveIds[variant] as string;
    const cfg = this.read(variant);
    this.configSignal(variant).set(cfg);
    const u = new URL(cfg.siteUrl);
    const site = await this.graph.getSiteByPath(u.hostname, u.pathname.replace(/\/$/, ''));
    const drives = await this.graph.getDrives(site.id);
    // Match on display name OR the library's URL segment — display titles can collide (two
    // libraries titled "UatAFSAdjustments"), so the URL segment ("UatAFSAdjustments1") disambiguates.
    const want = normLibrary(cfg.library);
    const segOf = (url?: string) => (url || '').replace(/\/+$/, '').split('/').pop()?.toLowerCase() || '';
    const exact = drives.find(d => normLibrary(d.name) === want || normLibrary(segOf(d.webUrl)) === want);
    const drive = exact ?? drives[0];
    if (!drive) throw new Error(`Document library "${cfg.library}" not found on the SharePoint site.`);
    if (!exact) {
      console.warn(`[AfsSharePoint] library "${cfg.library}" NOT found — falling back to "${drive.name}". Available libraries: ${drives.map(d => `${d.name} (${segOf(d.webUrl)})`).join(', ')}`);
    } else {
      console.log(`[AfsSharePoint] resolved ${variant} library → "${drive.name}" [${segOf(drive.webUrl)}] (${drive.id})`);
    }
    this.driveIds[variant] = drive.id;
    return drive.id;
  }

  /** List documents linked to an AFS entity via AFSID, from the given library. */
  async listAfsDocuments(afsId: string, variant: AfsSpVariant = 'afs'): Promise<SpAfsDoc[]> {
    if (!afsId) return [];
    const driveId = await this.resolveDriveId(variant);
    const items = await this.graph.getChildren(driveId, 'root');
    await this.discoverFields(driveId, variant, items);
    const f = this.fieldsByVariant[variant];
    const me = String(afsId);
    const linkCol = this.linkColumn(variant);
    return items
      .filter((it: any) => !it.folder)
      .filter((it: any) => String(it.listItem?.fields?.[linkCol] ?? '') === me)
      .map((it: any) => this.toDoc(it, f, variant));
  }

  /** List ALL documents in a library (not filtered by entity id) — e.g. every working paper in UatAFS.
   *  Walks subfolders too, so documents organised in folders are still returned. */
  async listAllAfsDocuments(variant: AfsSpVariant = 'afs'): Promise<SpAfsDoc[]> {
    const driveId = await this.resolveDriveId(variant);
    const files = await this.collectFiles(driveId, 'root');
    await this.discoverFields(driveId, variant, files);
    const f = this.fieldsByVariant[variant];
    console.log(`[AfsSharePoint] listAllAfsDocuments(${variant}) → ${files.length} file(s) in drive ${driveId}`);
    return files.map((it: any) => this.toDoc(it, f, variant));
  }

  /** Recursively gather all (non-folder) drive items under a folder. */
  private async collectFiles(driveId: string, folderId: string, depth = 0): Promise<any[]> {
    if (depth > 6) return [];
    let items: any[];
    try {
      items = await this.graph.getChildren(driveId, folderId);
    } catch (e: any) {
      console.warn('[AfsSharePoint] getChildren failed for folder', folderId, ':', e?.message ?? e);
      return [];
    }
    const files: any[] = [];
    for (const it of items) {
      if (it.folder) files.push(...await this.collectFiles(driveId, it.id, depth + 1));
      else files.push(it);
    }
    return files;
  }

  /**
   * Copy an existing document from one library to another (e.g. a UatAFS working paper
   * into UatAFSAdjustments), re-linking it to the target entity and carrying its metadata.
   */
  async copyDocument(sourceItem: any, sourceVariant: AfsSpVariant, targetVariant: AfsSpVariant, linkId: string, meta?: AfsDocMeta): Promise<SpAfsDoc> {
    const srcDriveId = sourceItem?.parentReference?.driveId || await this.resolveDriveId(sourceVariant);
    const blob = await this.graph.getFileBlob(srcDriveId, sourceItem.id);
    const file = new File([blob], sourceItem.name, { type: sourceItem.file?.mimeType || (blob as any)?.type || 'application/octet-stream' });
    return this.uploadAfsDocument(linkId, file, meta, targetVariant);
  }

  /** Upload a file, tag AFSID + the metadata columns, link it to the AFS entity. */
  async uploadAfsDocument(afsId: string, file: File, meta?: AfsDocMeta, variant: AfsSpVariant = 'afs'): Promise<SpAfsDoc> {
    const driveId = await this.resolveDriveId(variant);
    await this.discoverFields(driveId, variant);
    const f = this.fieldsByVariant[variant];

    const uploaded = await this.graph.uploadFile(driveId, 'root', file);

    // 1) Write the standard metadata columns (these resolve from the live schema and Graph
    //    accepts them — e.g. "description"). Non-fatal: the link column is the important part.
    const metaFields: Record<string, any> = {};
    if (meta?.description?.trim())     metaFields[f.description || 'description'] = meta.description.trim();
    if (meta?.classification?.trim())  metaFields[f.classification || 'Classification'] = meta.classification.trim();
    if (meta?.category?.trim())        metaFields[f.category || 'Category'] = meta.category.trim();
    if (meta?.tags?.trim())            metaFields[f.tags || 'Tags'] = meta.tags.trim();
    if (meta?.documentType?.trim())    metaFields[f.documenttype || 'DocumentType'] = meta.documentType.trim();
    if (meta?.accessLevel?.trim())     metaFields[f.accesslevel || 'AccessLevel'] = meta.accessLevel.trim();
    if (Object.keys(metaFields).length) {
      try {
        await this.graph.updateItemFields(driveId, uploaded.id, metaFields);
      } catch (e: any) {
        // One bad column (e.g. a Choice column rejecting a value) fails the whole PATCH — retry
        // field-by-field so the columns that ARE valid still get saved.
        console.warn('[AfsSharePoint] bulk metadata save failed, retrying field-by-field:', e?.message ?? e);
        for (const [k, v] of Object.entries(metaFields)) {
          try { await this.graph.updateItemFields(driveId, uploaded.id, { [k]: v }); }
          catch (e2: any) { console.warn(`[AfsSharePoint] could not save column "${k}":`, e2?.message ?? e2); }
        }
      }
    }

    // 2) Write the entity-link column (ADJID/AFSID). Its internal name often differs from the
    //    display name (a hyphen/space gets encoded, e.g. "Adj-id" → "Adj_x002d_id") and Graph
    //    may not even list a just-created column — so try each candidate internal name until one
    //    is accepted, then cache the winner for the rest of the session.
    const candidates = await this.linkColumnCandidates(driveId, variant);
    let linkedCol = '';
    let lastErr: any = null;
    for (const col of candidates) {
      try {
        await this.graph.updateItemFields(driveId, uploaded.id, { [col]: String(afsId ?? '') });
        linkedCol = col;
        this.fieldsByVariant[variant].afsid = col;   // cache for subsequent uploads
        break;
      } catch (e: any) { lastErr = e; }
    }

    if (!linkedCol) {
      const cols = await this.dumpColumns(driveId);
      console.warn('[AfsSharePoint] link column write failed. Tried:', candidates.join(', '), '| last error:', lastErr?.message ?? lastErr);
      throw new Error(
        `File uploaded and metadata saved, but it could not be linked to the adjustment — ` +
        `none of these column names were accepted by SharePoint: ${candidates.join(', ')}. ` +
        `Set Admin → AFS → Adjustments SharePoint "Link Column" to the INTERNAL name of your ID column. ` +
        `Writable columns Graph currently reports: ${cols}`
      );
    }
    console.log('[AfsSharePoint] linked document via column →', linkedCol);
    return this.toDoc({ ...uploaded, listItem: { fields: { ...metaFields, [linkedCol]: String(afsId ?? '') } } }, f, variant, afsId);
  }

  async deleteAfsDocument(item: any, variant: AfsSpVariant = 'afs'): Promise<void> {
    const driveId = item?.parentReference?.driveId || await this.resolveDriveId(variant);
    await this.graph.deleteItem(driveId, item.id);
  }

  async downloadAfsDocument(item: any, variant: AfsSpVariant = 'afs'): Promise<void> {
    const driveId = item?.parentReference?.driveId || await this.resolveDriveId(variant);
    await this.graph.triggerDownload(driveId, item.id, item.name);
  }

  // ── Private ─────────────────────────────────────────────────────────────────

  /**
   * Resolved entity-link column for the library:
   *   1. the internal name discovered from the live schema (most reliable — this is the
   *      actual name Graph accepts on writes, e.g. "ADJID0" after a delete+recreate), else
   *   2. an explicit internal name configured in Admin (override for columns Graph won't list), else
   *   3. the AFSID/ADJID default.
   */
  private linkColumn(variant: AfsSpVariant): string {
    return this.fieldsByVariant[variant].afsid
      || this.read(variant).linkColumn
      || LINK_FIELD[variant].defaultName;
  }

  /** SharePoint encodes non-alphanumeric chars in internal column names as _xHHHH_ (UTF-16 hex),
   *  e.g. "Adj-id" → "Adj_x002d_id", "Adj Id" → "Adj_x0020_Id". */
  private spEncode(name: string): string {
    return name.replace(/[^a-zA-Z0-9]/g, ch => '_x' + ch.charCodeAt(0).toString(16).toLowerCase().padStart(4, '0') + '_');
  }

  /** Normalise a column name for comparison: lowercase, strip ALL non-alphanumerics
   *  (so "Adj-id", "Adj_x002d_id", "ADJ ID" all reduce to "adjid"). */
  private normName(s: string): string {
    return (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  /**
   * Candidate internal names to try when writing the entity-link column, best guess first:
   *   1. an already-cached/discovered internal name,
   *   2. the internal name found in the live schema (exact then "contains" match — ALL columns,
   *      incl. hidden/readonly, since a freshly-created column can be flagged oddly),
   *   3. the Admin override — both as typed and SharePoint-encoded,
   *   4. the AFSID/ADJID default — both as typed and SharePoint-encoded,
   *   5. common spellings (AdjId / Adj-id …) and their encoded forms, in case Graph won't list it.
   */
  private async linkColumnCandidates(driveId: string, variant: AfsSpVariant): Promise<string[]> {
    const out: string[] = [];
    const add = (n?: string | null) => { if (n && !out.includes(n)) out.push(n); };

    add(this.fieldsByVariant[variant].afsid);

    const target = LINK_FIELD[variant].key;            // 'adjid' | 'afsid'
    try {
      const cols = await this.graph.getDriveColumns(driveId);
      add(cols.find(c => this.normName(c.name) === this.normName(target) || this.normName(c.displayName) === this.normName(target))?.name);
      add(cols.find(c => this.normName(c.name).includes(this.normName(target)) || this.normName(c.displayName).includes(this.normName(target)))?.name);
    } catch { /* schema not readable — fall through to configured/encoded candidates */ }

    const override = this.read(variant).linkColumn;
    if (override) { add(override); add(this.spEncode(override)); }

    const def = LINK_FIELD[variant].defaultName;     // ADJID | AFSID
    add(def); add(this.spEncode(def));

    // Last-resort spellings for the adjustments link column when Graph won't surface it.
    if (variant === 'adjustments') {
      for (const n of ['ADJID', 'AdjId', 'Adjid', 'Adj-id', 'Adj_Id', 'ADJ_ID', 'AdjID']) {
        add(n); add(this.spEncode(n));
      }
    }
    return out;
  }

  /** A readable list of EVERY column Graph returns (internal|display, flagged), for diagnostics. */
  private async dumpColumns(driveId: string): Promise<string> {
    try {
      const cols = await this.graph.getDriveColumns(driveId);
      const fmt = (c: any) => `${c.name}|${c.displayName}${c.readOnly ? '(ro)' : ''}${c.hidden ? '(hidden)' : ''}`;
      console.log('[AfsSharePoint] ALL columns Graph returns for drive', driveId, ':', cols.map(fmt).join(', '));
      return cols.map(fmt).join(', ') || '(no columns returned by Graph)';
    } catch (e: any) {
      return `(could not read columns: ${e?.message ?? e})`;
    }
  }

  private toDoc(it: any, f: Record<string, string | null>, variant: AfsSpVariant, afsIdFallback = ''): SpAfsDoc {
    const flds = it.listItem?.fields || {};
    const tagsRaw = flds[f.tags || 'Tags'];
    return {
      __sp: true,
      __item: it,
      __variant: variant,
      id: it.id,
      fileName: it.name,
      fileSize: it.size ?? 0,
      createdAt: it.lastModifiedDateTime ?? it.createdDateTime ?? new Date().toISOString(),
      mimeType: it.file?.mimeType || '',
      afsId: String(flds[this.linkColumn(variant)] ?? afsIdFallback ?? ''),
      description: flds[f.description || 'description'] ?? '',
      classificationLabel: flds[f.classification || 'Classification'] ?? '',
      category: flds[f.category || 'Category'] ?? '',
      tags: typeof tagsRaw === 'string' && tagsRaw ? tagsRaw.split(',').map((t: string) => t.trim()) : [],
    };
  }

  /** Discover the internal column names (AFSID/description/Classification/Category/Tags). */
  private async discoverFields(driveId: string, variant: AfsSpVariant, sampleItems?: any[]): Promise<void> {
    const fields = this.fieldsByVariant[variant];
    if (Object.values(fields).every(v => v)) return;
    const want: Record<string, string> = {
      afsid: LINK_FIELD[variant].key, description: 'description', classification: 'classification',
      category: 'category', tags: 'tags', documenttype: 'documenttype', accesslevel: 'accesslevel',
    };

    let items = sampleItems;
    if (!items) { try { items = await this.graph.getChildren(driveId, 'root'); } catch { items = []; } }
    for (const it of (items || [])) {
      for (const key of Object.keys(it.listItem?.fields || {})) {
        const norm = key.replace(/\s+/g, '').toLowerCase();
        for (const slot of Object.keys(want)) {
          if (!fields[slot] && norm === want[slot]) fields[slot] = key;
        }
      }
      if (Object.values(fields).every(v => v)) break;
    }

    if (!Object.values(fields).every(v => v)) {
      try {
        const cols = await this.graph.getDriveColumns(driveId);
        // Diagnostic: the link column's INTERNAL name (c.name) often differs from its
        // display name (c.displayName) — Graph writes need the internal name.
        console.log(`[AfsSharePoint] ${variant} columns (internal|display):`,
          cols.map((c: any) => `${c.name}|${c.displayName}`).join(', '));
        const linkTarget = want['afsid'];                          // 'adjid' | 'afsid'
        for (const c of cols) {
          const nm = (c.name || '').replace(/\s+/g, '').toLowerCase();
          const dn = (c.displayName || '').replace(/\s+/g, '').toLowerCase();
          for (const slot of Object.keys(want)) {
            if (fields[slot]) continue;
            const isLink = slot === 'afsid';
            const hit = nm === want[slot] || dn === want[slot]
              || (isLink && (nm.includes(linkTarget) || dn.includes(linkTarget)));
            if (hit) fields[slot] = c.name;
          }
        }
      } catch (e: any) {
        console.warn('[AfsSharePoint] getDriveColumns failed:', e?.message ?? e);
      }
    }

    if (!fields['afsid']) {
      console.warn(`[AfsSharePoint] could not resolve the link column ("${LINK_FIELD[variant].defaultName}") for ${variant} — metadata save will fail. Check the SharePoint column's internal name.`);
    }
  }

  private read(variant: AfsSpVariant): AfsSharePointConfig {
    const d = DEFAULT_CONFIGS[variant];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (variant === 'adjustments') {
          return {
            enabled: p.afsAdjustmentsSharePointEnabled ?? d.enabled,
            siteUrl: p.afsAdjustmentsSharePointSiteUrl || d.siteUrl,
            library: p.afsAdjustmentsSharePointLibrary || d.library,
            linkColumn: (p.afsAdjustmentsSharePointLinkColumn || '').trim() || undefined,
          };
        }
        if (variant === 'rfi') {
          return {
            enabled: p.afsRfiSharePointEnabled ?? d.enabled,
            siteUrl: p.afsRfiSharePointSiteUrl || d.siteUrl,
            library: p.afsRfiSharePointLibrary || d.library,
            linkColumn: (p.afsRfiSharePointLinkColumn || '').trim() || undefined,
          };
        }
        if (variant === 'mfmaReporting') {
          return {
            enabled: p.afsMfmaSharePointEnabled ?? d.enabled,
            siteUrl: p.afsMfmaSharePointSiteUrl || d.siteUrl,
            library: p.afsMfmaSharePointLibrary || d.library,
            linkColumn: (p.afsMfmaSharePointLinkColumn || '').trim() || undefined,
          };
        }
        if (variant === 'rolledUpGl') {
          return {
            enabled: p.afsRollupGlSharePointEnabled ?? d.enabled,
            siteUrl: p.afsRollupGlSharePointSiteUrl || d.siteUrl,
            library: p.afsRollupGlSharePointLibrary || d.library,
            linkColumn: (p.afsRollupGlSharePointLinkColumn || '').trim() || undefined,
          };
        }
        if (variant === 'dataSourceTb') {
          return {
            enabled: p.afsTbSharePointEnabled ?? d.enabled,
            siteUrl: p.afsTbSharePointSiteUrl || d.siteUrl,
            library: p.afsTbSharePointLibrary || d.library,
            linkColumn: (p.afsTbSharePointLinkColumn || '').trim() || undefined,
          };
        }
        if (variant === 'documentManagement') {
          return {
            enabled: p.afsDocMgmtSharePointEnabled ?? d.enabled,
            siteUrl: p.afsDocMgmtSharePointSiteUrl || d.siteUrl,
            library: p.afsDocMgmtSharePointLibrary || d.library,
            linkColumn: (p.afsDocMgmtSharePointLinkColumn || '').trim() || undefined,
          };
        }
        if (variant === 'administration') {
          return {
            enabled: p.afsAdminSharePointEnabled ?? d.enabled,
            siteUrl: p.afsAdminSharePointSiteUrl || d.siteUrl,
            library: p.afsAdminSharePointLibrary || d.library,
            linkColumn: (p.afsAdminSharePointLinkColumn || '').trim() || undefined,
          };
        }
        if (variant === 'evidence') {
          return {
            enabled: p.afsEvidenceSharePointEnabled ?? d.enabled,
            siteUrl: p.afsEvidenceSharePointSiteUrl || d.siteUrl,
            library: p.afsEvidenceSharePointLibrary || d.library,
            linkColumn: (p.afsEvidenceSharePointLinkColumn || '').trim() || undefined,
          };
        }
        if (variant === 'template') {
          return {
            enabled: p.afsTemplateSharePointEnabled ?? d.enabled,
            siteUrl: p.afsTemplateSharePointSiteUrl || d.siteUrl,
            library: p.afsTemplateSharePointLibrary || d.library,
            linkColumn: (p.afsTemplateSharePointLinkColumn || '').trim() || undefined,
          };
        }
        if (variant === 'export') {
          return {
            enabled: p.afsExportSharePointEnabled ?? d.enabled,
            siteUrl: p.afsExportSharePointSiteUrl || d.siteUrl,
            library: p.afsExportSharePointLibrary || d.library,
            linkColumn: (p.afsExportSharePointLinkColumn || '').trim() || undefined,
          };
        }
        if (variant === 'mappingSnapshot') {
          return {
            enabled: p.afsMappingSharePointEnabled ?? d.enabled,
            siteUrl: p.afsMappingSharePointSiteUrl || d.siteUrl,
            library: p.afsMappingSharePointLibrary || d.library,
            linkColumn: (p.afsMappingSharePointLinkColumn || '').trim() || undefined,
          };
        }
        if (variant === 'adjustmentSupport') {
          return {
            enabled: p.afsAdjSupportSharePointEnabled ?? d.enabled,
            siteUrl: p.afsAdjSupportSharePointSiteUrl || d.siteUrl,
            library: p.afsAdjSupportSharePointLibrary || d.library,
            linkColumn: (p.afsAdjSupportSharePointLinkColumn || '').trim() || undefined,
          };
        }
        if (variant === 'afsFinal') {
          return {
            enabled: p.afsFinalSharePointEnabled ?? d.enabled,
            siteUrl: p.afsFinalSharePointSiteUrl || d.siteUrl,
            library: p.afsFinalSharePointLibrary || d.library,
            linkColumn: (p.afsFinalSharePointLinkColumn || '').trim() || undefined,
          };
        }
        if (variant === 'afsDraft') {
          return {
            enabled: p.afsDraftSharePointEnabled ?? d.enabled,
            siteUrl: p.afsDraftSharePointSiteUrl || d.siteUrl,
            library: p.afsDraftSharePointLibrary || d.library,
            linkColumn: (p.afsDraftSharePointLinkColumn || '').trim() || undefined,
          };
        }
        if (variant === 'scoaVersion') {
          return {
            enabled: p.afsScoaSharePointEnabled ?? d.enabled,
            siteUrl: p.afsScoaSharePointSiteUrl || d.siteUrl,
            library: p.afsScoaSharePointLibrary || d.library,
            linkColumn: (p.afsScoaSharePointLinkColumn || '').trim() || undefined,
          };
        }
        if (variant === 'finding') {
          return {
            enabled: p.afsFindingSharePointEnabled ?? d.enabled,
            siteUrl: p.afsFindingSharePointSiteUrl || d.siteUrl,
            library: p.afsFindingSharePointLibrary || d.library,
            linkColumn: (p.afsFindingSharePointLinkColumn || '').trim() || undefined,
          };
        }
        if (variant === 'workingPaper') {
          return {
            enabled: p.afsWpSharePointEnabled ?? d.enabled,
            siteUrl: p.afsWpSharePointSiteUrl || d.siteUrl,
            library: p.afsWpSharePointLibrary || d.library,
            linkColumn: (p.afsWpSharePointLinkColumn || '').trim() || undefined,
          };
        }
        return {
          enabled: p.afsSharePointEnabled ?? d.enabled,
          siteUrl: p.afsSharePointSiteUrl || d.siteUrl,
          library: p.afsSharePointLibrary || d.library,
          linkColumn: (p.afsSharePointLinkColumn || '').trim() || undefined,
        };
      }
    } catch {}
    return { ...d };
  }
}
