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
