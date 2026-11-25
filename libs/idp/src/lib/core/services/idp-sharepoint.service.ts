import { Injectable, inject } from '@angular/core';
import { GraphService } from '@platinumv3/shared/graph';

/**
 * IDP milestone evidence → SharePoint, managed in the shell's Admin → IDP settings.
 *
 * Each milestone that has its own SharePoint panel maps to a config prefix in
 * `platinum_module_config` (e.g. `idpInstitutionalSharePointEnabled / SiteUrl /
 * Library / LinkColumn`). When that panel is enabled, the milestone's evidence
 * upload goes to the configured library and the milestone id is written to the
 * library's link column (e.g. "institutionalid"). The milestone's EvidenceUrl is
 * then set to the SharePoint file's web URL.
 *
 * Mirrors AfsSharePointService (same library resolution and link-column fallback).
 */
const STORAGE_KEY = 'platinum_module_config';
const ACTIVATED_FLAG = 'idpMilestoneSharePointActivatedV1';
const DEFAULT_SITE ='https://zamicromega.sharepoint.com/sites/Sebata2';

export interface IdpSharePointConfig {
  enabled: boolean;
  siteUrl: string;
  library: string;
  linkColumn: string;
}

interface MilestoneLibrary {
  /** Matches the milestone title (case-insensitive, trimmed). */
  title: string;
  /** Config key prefix in platinum_module_config, e.g. 'idpInstitutional'. */
  prefix: string;
  defaultLibrary: string;
  defaultLinkColumn: string;
}

/**
 * Milestones whose evidence uploads are wired to SharePoint — one per panel in
 * Admin → IDP. Each default library is "UatIDP" + the milestone title; keep the
 * prefixes and link columns in sync with DEFAULT_CONFIG in admin-settings.component.ts.
 */
const MILESTONE_LIBRARIES: MilestoneLibrary[] = ([
  // [milestone title, config prefix, default link column]
  ['Institutional capacity assessment completed',            'idpInstitutional',          'institutionalid'],
  ['Situational analysis report finalised',                  'idpSituational',            'Situationalid'],
  ['Spatial analysis and development profile finalised',     'idpSpatial',                'spartialid'],
  ['SWOT analysis completed',                                'idpSwot',                   'swotid'],
  ['Priority issues identified and documented',              'idpPriority',               'priorityid'],
  ['Strategic objectives approved by Council',               'idpStrategic',              'Strategicid'],
  ['Vision and mission reviewed and confirmed',              'idpVision',                 'visionid'],
  ['KPI framework aligned with PGDS targets',                'idpKpi',                    'kpiid'],
  ['Development strategies aligned with NDP/PGDS',           'idpDevelopment',            'developmentid'],
  ['Spatial Development Framework alignment verified',       'idpSdf',                    'spartialdevid'],
  ['Capital projects identified and costed',                 'idpCapital',                'capitalid'],
  ['Operational plans drafted per department',               'idpOperational',            'operationalid'],
  ['MSCOA alignment verification',                           'idpMscoa',                  'mscoaid'],
  ['Project prioritisation scoring completed',               'idpProjectPrioritisation',  'projectid'],
  ['Financial plan and MTREF aligned with IDP',              'idpFinancial',              'financialid'],
  ['IDP document compiled and reviewed internally',          'idpDocument',               'idpid'],
  ['Sector plan integration review',                         'idpSector',                 'sectorid'],
  ['Budget-IDP alignment confirmed by CFO',                  'idpBudgetAlignment',        'budgetid'],
  ['IDP advertised for public comment (21 days)',            'idpPublicComment',          'idpadvid'],
  ['MEC assessment response addressed',                      'idpMec',                    'mecid'],
  ['Final IDP submitted to MEC',                             'idpFinalSubmission',        'finalid'],
  ['Public comment period completed',                        'idpPublicCommentPeriod',    'publicid'],
  ['Council adoption resolution',                            'idpCouncilAdoption',        'councilid'],
  ['Community needs assessment completed',                   'idpCommunityNeeds',         'communityid'],
] as const).map(([title, prefix, defaultLinkColumn]) => ({
  title, prefix, defaultLinkColumn, defaultLibrary: `UatIDP${title}`,
}));

@Injectable({ providedIn: 'root' })
export class IdpSharePointService {
  private graph = inject(GraphService);
  private driveIds = new Map<string, string>();       // prefix → drive id
  private linkCols = new Map<string, string>();       // prefix → accepted internal column name

  /** The library mapping for a milestone, or null when it has no SharePoint panel. */
  private libraryFor(milestoneTitle: string): MilestoneLibrary | null {
    const t = (milestoneTitle || '').trim().toLowerCase();
    return MILESTONE_LIBRARIES.find(l => l.title.toLowerCase() === t) ?? null;
  }

  /** Config for the milestone's library, or null when unmapped. */
  configFor(milestoneTitle: string): IdpSharePointConfig | null {
    const lib = this.libraryFor(milestoneTitle);
    return lib ? this.read(lib) : null;
  }

  /** True when this milestone's evidence should go to SharePoint. */
  isEnabledFor(milestoneTitle: string): boolean {
    return !!this.configFor(milestoneTitle)?.enabled;
  }

  /**
   * Upload a milestone's evidence file to its SharePoint library and tag the
   * link column with the milestone id. Returns the file's SharePoint web URL.
   */
  async uploadEvidence(milestoneTitle: string, milestoneId: number | string, file: File): Promise<{ webUrl: string; fileName: string }> {
    const lib = this.libraryFor(milestoneTitle);
    if (!lib) throw new Error(`No SharePoint library is configured for "${milestoneTitle}".`);
    const cfg = this.read(lib);

    const driveId = await this.resolveDriveId(lib, cfg);
    const uploaded: any = await this.graph.uploadFile(driveId, 'root', file);

    // Write the link column. Its internal name can differ from the display name, so try
    // candidates until SharePoint accepts one, then cache it for the session.
    const candidates = await this.linkColumnCandidates(lib, cfg, driveId);
    let linked = '';
    let lastErr: any = null;
    for (const col of candidates) {
      try {
        await this.graph.updateItemFields(driveId, uploaded.id, { [col]: String(milestoneId) });
        linked = col;
        this.linkCols.set(lib.prefix, col);
        break;
      } catch (e: any) { lastErr = e; }
    }
    if (!linked) {
      console.warn('[IdpSharePoint] link column write failed. Tried:', candidates.join(', '), '| last error:', lastErr?.message ?? lastErr);
      throw new Error(
        `File uploaded to "${cfg.library}", but it could not be linked to the milestone — ` +
        `SharePoint accepted none of these column names: ${candidates.join(', ')}. ` +
        `Set the Link Column in Admin → IDP to the column's INTERNAL name.`
      );
    }
    console.log(`[IdpSharePoint] uploaded "${file.name}" to "${cfg.library}", linked via ${linked}=${milestoneId}`);
    return { webUrl: uploaded.webUrl, fileName: uploaded.name ?? file.name };
  }

  // ── Private ─────────────────────────────────────────────────────────────────

  private async resolveDriveId(lib: MilestoneLibrary, cfg: IdpSharePointConfig): Promise<string> {
    const cacheKey = `${lib.prefix}|${cfg.siteUrl}|${cfg.library}`;
    const cached = this.driveIds.get(cacheKey);
    if (cached) return cached;

    const u = new URL(cfg.siteUrl);
    const site = await this.graph.getSiteByPath(u.hostname, u.pathname.replace(/\/$/, ''));
    const drives = await this.graph.getDrives(site.id);
    // Match on display name OR the library's URL segment (display titles can collide).
    // Exact (case-insensitive) first, then loosely: "&" = "and", spaces/punctuation ignored.
    const want = cfg.library.toLowerCase();
    const segOf = (url?: string) => decodeURIComponent((url || '').replace(/\/+$/, '').split('/').pop() || '').toLowerCase();
    const loose = (s?: string) => (s || '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]/g, '');
    const drive =
      drives.find((d: any) => d.name?.toLowerCase() === want || segOf(d.webUrl) === want) ??
      drives.find((d: any) => loose(d.name) === loose(want) || loose(segOf(d.webUrl)) === loose(want));
    if (!drive) {
      // List the IDP libraries only, so the right name is easy to spot and copy into Admin → IDP.
      const idpLibs = drives.map((d: any) => d.name as string).filter(n => /idp/i.test(n)).sort();
      throw new Error(
        `Document library "${cfg.library}" was not found on ${cfg.siteUrl}.\n\n` +
        `Set the correct library name for this milestone in Admin → IDP. ` +
        (idpLibs.length
          ? `IDP libraries on this site:\n• ${idpLibs.join('\n• ')}`
          : `No libraries with "IDP" in the name exist on this site.`)
      );
    }
    this.driveIds.set(cacheKey, drive.id);
    return drive.id;
  }

  /** SharePoint encodes non-alphanumeric chars in internal names as _xHHHH_. */
  private spEncode(name: string): string {
    return name.replace(/[^a-zA-Z0-9]/g, ch => '_x' + ch.charCodeAt(0).toString(16).padStart(4, '0') + '_');
  }

  private norm(s: string): string {
    return (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  private async linkColumnCandidates(lib: MilestoneLibrary, cfg: IdpSharePointConfig, driveId: string): Promise<string[]> {
    const out: string[] = [];
    const add = (n?: string | null) => { if (n && !out.includes(n)) out.push(n); };

    add(this.linkCols.get(lib.prefix));
    const target = this.norm(cfg.linkColumn);
    try {
      const cols: any[] = await this.graph.getDriveColumns(driveId);
      add(cols.find(c => this.norm(c.name) === target || this.norm(c.displayName) === target)?.name);
    } catch { /* schema not readable — fall back to the configured name */ }
    add(cfg.linkColumn);
    add(this.spEncode(cfg.linkColumn));
    return out;
  }

  /**
   * One-time switch-on of every milestone panel, for browsers that saved the Admin settings
   * while the panels were still off by default. Same flag as the shell's admin settings.
   */
  private activateOnce(): void {
    try {
      if (localStorage.getItem(ACTIVATED_FLAG)) return;
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        for (const l of MILESTONE_LIBRARIES) p[`${l.prefix}SharePointEnabled`] = true;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
      }
      localStorage.setItem(ACTIVATED_FLAG, '1');
    } catch { /* storage unavailable — defaults apply */ }
  }

  private read(lib: MilestoneLibrary): IdpSharePointConfig {
    this.activateOnce();
    const d: IdpSharePointConfig = {
      enabled: true, siteUrl: DEFAULT_SITE, library: lib.defaultLibrary, linkColumn: lib.defaultLinkColumn,
    };
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        return {
          enabled: p[`${lib.prefix}SharePointEnabled`] ?? d.enabled,
          siteUrl: (p[`${lib.prefix}SharePointSiteUrl`] || d.siteUrl).trim(),
          library: (p[`${lib.prefix}SharePointLibrary`] || d.library).trim(),
          linkColumn: (p[`${lib.prefix}SharePointLinkColumn`] || d.linkColumn).trim(),
        };
      }
    } catch { /* fall through to defaults */ }
    return d;
  }
}
