// Pure helpers for SharePoint document search (no Angular imports, so they are unit-testable).

/** Split user input into search terms, dropping characters that would break a KQL query. */
export function searchTerms(input: string): string[] {
  return (input || '')
    .replace(/["'()\\:*]/g, ' ')
    .split(/\s+/)
    .map(t => t.trim())
    .filter(t => t.length > 0);
}

/**
 * Build the KQL query for Graph's /search/query.
 * Every term becomes a prefix match (`screen*` finds "Screenshot…"), terms are AND-ed,
 * results are limited to documents, and optionally scoped to one site (all of its libraries).
 */
export function buildDocumentQuery(input: string, siteWebUrl?: string | null): string {
  const terms = searchTerms(input);
  const parts = terms.map(t => `${t}*`);
  parts.push('IsDocument:true');
  if (siteWebUrl) parts.push(`path:"${siteWebUrl.replace(/"/g, '')}"`);
  return parts.join(' ');
}

/** "site / library / folder" from a SharePoint file URL (host and file name removed). */
export function locationFromUrl(webUrl: string): string {
  try {
    const u = new URL(webUrl);
    const segs = u.pathname.split('/').filter(Boolean).map(s => decodeURIComponent(s));
    segs.pop(); // file name
    if (segs[0] && /^(sites|teams)$/i.test(segs[0])) segs.shift(); // drop "sites"/"teams"
    return segs.join(' / ');
  } catch {
    return '';
  }
}

/** Does the file name contain every search term (case-insensitive)? */
export function nameContainsAll(name: string, input: string): boolean {
  const n = (name || '').toLowerCase();
  const terms = searchTerms(input);
  return terms.length > 0 && terms.every(t => n.includes(t.toLowerCase()));
}

// ── Live (index-free) folder walk ────────────────────────────────────────────

export interface FolderRef { driveId: string; folderId: string; }

export interface CrawlOptions {
  maxFolders   : number;
  /** Absolute time (ms since epoch) after which no further folders are started. */
  deadline     : number;
  concurrency  : number;
  /** Return true to abandon the walk (e.g. the user started a newer search). */
  cancelled   ?: () => boolean;
  now         ?: () => number;
}

export interface CrawlResult<T> {
  matches        : { driveId: string; item: T }[];
  foldersChecked : number;
  /** Folders that could not be listed: their files AND sub-folders were not checked. */
  failedFolders  : number;
  /** True when the folder or time budget ran out before every folder was checked. */
  truncated      : boolean;
}

/**
 * Walk folders looking for matching files. `groups` are priority tiers: everything under the first
 * group is walked before the second starts. A folder is only listed once, so a later group may
 * safely contain a parent of an earlier one (the library root after the open folder).
 * All groups share one budget. Nothing is skipped silently: see `failedFolders` and `truncated`.
 */
export async function crawlFolders<T extends { id: string; folder?: unknown }>(
  groups: FolderRef[][],
  list: (ref: FolderRef) => Promise<T[]>,
  matches: (item: T) => boolean,
  opts: CrawlOptions,
): Promise<CrawlResult<T>> {
  const now = opts.now ?? Date.now;
  const out: CrawlResult<T> = { matches: [], foldersChecked: 0, failedFolders: 0, truncated: false };
  const visited = new Set<string>();
  const claim = (ref: FolderRef): boolean => {
    const key = `${ref.driveId}|${ref.folderId}`;
    if (visited.has(key)) return false;
    visited.add(key);
    return true;
  };
  let started = 0;

  for (const group of groups) {
    const queue = group.filter(claim);
    while (queue.length) {
      if (opts.cancelled?.()) return out;
      if (started >= opts.maxFolders || now() >= opts.deadline) { out.truncated = true; return out; }
      const batch = queue.splice(0, Math.min(opts.concurrency, opts.maxFolders - started));
      started += batch.length;
      await Promise.all(batch.map(async ref => {
        let items: T[];
        try {
          items = await list(ref);
        } catch {
          out.failedFolders++;
          return;
        }
        out.foldersChecked++;
        for (const item of items) {
          if (item.folder) {
            const child = { driveId: ref.driveId, folderId: item.id };
            if (claim(child)) queue.push(child);
          } else if (matches(item)) {
            out.matches.push({ driveId: ref.driveId, item });
          }
        }
      }));
    }
  }
  return out;
}

export interface RetryOptions {
  retries   ?: number;
  /** Do not start a wait that would end after this time (ms since epoch). */
  deadline  ?: number;
  cancelled ?: () => boolean;
  sleep     ?: (ms: number) => Promise<void>;
  now       ?: () => number;
}

/** HTTP statuses worth trying again: network drop, throttling and temporary server errors. */
const RETRYABLE = new Set([0, 429, 500, 502, 503, 504]);

/** How long to wait before the next try: the server's Retry-After (seconds), else 1s, 2s, 4s… */
export function retryDelayMs(err: any, attempt: number): number {
  const after = Number(err?.headers?.get?.('Retry-After'));
  return after > 0 ? after * 1000 : 1000 * 2 ** attempt;
}

/** Run `fn`, retrying throttled or temporarily failing requests. Other errors are thrown at once. */
export async function withRetry<T>(fn: () => Promise<T>, opts: RetryOptions = {}): Promise<T> {
  const retries = opts.retries ?? 3;
  const sleep = opts.sleep ?? ((ms: number) => new Promise<void>(r => setTimeout(r, ms)));
  const now = opts.now ?? Date.now;
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      if (attempt >= retries || !RETRYABLE.has(err?.status) || opts.cancelled?.()) throw err;
      const wait = retryDelayMs(err, attempt);
      if (opts.deadline !== undefined && now() + wait > opts.deadline) throw err;
      await sleep(wait);
    }
  }
}

/**
 * Split a "document library" setting into the library name and an optional folder path.
 *   "UatAssets"                         → { library: "UatAssets", folder: "" }
 *   "WCDM File Plan/Assets Management"  → { library: "WCDM File Plan", folder: "Assets Management" }
 * Backslashes are treated as slashes; empty segments are dropped.
 */
export function splitLibraryPath(setting: string): { library: string; folder: string } {
  const parts = (setting || '').replace(/\\/g, '/').split('/').map(p => p.trim()).filter(Boolean);
  return { library: parts[0] ?? '', folder: parts.slice(1).join('/') };
}

/** Last path segment of a URL, decoded and lower-cased — a library's URL segment (e.g. "wcdm file plan"). */
export function urlSegment(url?: string): string {
  const seg = (url || '').replace(/\/+$/, '').split('/').pop() || '';
  try { return decodeURIComponent(seg).toLowerCase(); } catch { return seg.toLowerCase(); }
}
