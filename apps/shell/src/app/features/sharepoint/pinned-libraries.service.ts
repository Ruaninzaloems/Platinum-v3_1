import { Injectable, signal } from '@angular/core';

/** A SharePoint document library the user pinned for quick access. */
export interface PinnedLibrary {
  hostname    : string;   // e.g. 'zamicromega.sharepoint.com'
  sitePath    : string;   // e.g. '/sites/Sebata2'
  siteName    : string;   // label shown under the library name
  libraryName : string;   // document library display name
}

const STORAGE_KEY = 'platinum_pinned_libraries';

/**
 * Pinned SharePoint libraries, shown in the SharePoint sidebar under "Pinned Libraries".
 * Stored per browser (localStorage) like the rest of the module settings.
 */
@Injectable({ providedIn: 'root' })
export class PinnedLibrariesService {
  readonly list = signal<PinnedLibrary[]>(this.load());

  private same(a: PinnedLibrary, b: Pick<PinnedLibrary, 'hostname' | 'sitePath' | 'libraryName'>): boolean {
    return a.hostname.toLowerCase() === b.hostname.toLowerCase()
        && a.sitePath.toLowerCase() === b.sitePath.toLowerCase()
        && a.libraryName.toLowerCase() === b.libraryName.toLowerCase();
  }

  isPinned(hostname: string, sitePath: string, libraryName: string): boolean {
    return this.list().some(p => this.same(p, { hostname, sitePath, libraryName }));
  }

  /** Pin the library if it is not pinned yet, otherwise unpin it. Returns true when now pinned. */
  toggle(lib: PinnedLibrary): boolean {
    if (this.isPinned(lib.hostname, lib.sitePath, lib.libraryName)) {
      this.remove(lib);
      return false;
    }
    this.save([...this.list(), lib]);
    return true;
  }

  remove(lib: PinnedLibrary): void {
    this.save(this.list().filter(p => !this.same(p, lib)));
  }

  private save(next: PinnedLibrary[]): void {
    this.list.set(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* storage unavailable */ }
  }

  private load(): PinnedLibrary[] {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(raw)
        ? raw.filter(p => p && p.hostname && p.sitePath && p.libraryName)
        : [];
    } catch {
      return [];
    }
  }
}
