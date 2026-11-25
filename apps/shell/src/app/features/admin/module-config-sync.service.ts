import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

const STORAGE_KEY = 'platinum_module_config';
const API = '/pos-app/api/platform-settings/module-config';

/** Fired on `window` after the server values were merged into the local module config. */
export const MODULE_CONFIG_CHANGED_EVENT = 'platinum-module-config-changed';

interface ServerResponse { values: Record<string, boolean | string>; updatedBy?: string | null; updatedAt?: string | null; }

/** Only SharePoint settings live on the server (the local module config also holds DB credentials). */
export const isSharePointKey = (key: string): boolean => /^[a-z][A-Za-z0-9]*SharePoint[A-Za-z0-9]*$/.test(key);

/**
 * Keeps the module SharePoint settings on the server (POS-API `platform_settings`) so a change an
 * administrator saves applies to every user, not just their own browser.
 *
 * The modules still read `platinum_module_config` from localStorage, so the server values are
 * mirrored into it ("server wins" for SharePoint keys) and a change event tells the module
 * services to re-read. Everything fails soft: with no server (or before sign-in finishes) the
 * module keeps using whatever this browser already has.
 */
@Injectable({ providedIn: 'root' })
export class ModuleConfigSyncService {
  private http = inject(HttpClient);
  private pulling: Promise<boolean> | null = null;

  /** Fetch the server's SharePoint settings and apply them locally. Resolves true on success. */
  pull(): Promise<boolean> {
    if (!this.pulling) {
      this.pulling = this.doPull().finally(() => { this.pulling = null; });
    }
    return this.pulling;
  }

  /** Pull now, and keep retrying for a while: sign-in finishes in the background after page load. */
  pullWithRetry(): void {
    const delays = [0, 3000, 8000, 20000, 45000];
    const attempt = (i: number) => {
      this.pull().then(ok => { if (!ok && i + 1 < delays.length) setTimeout(() => attempt(i + 1), delays[i + 1]); });
    };
    attempt(0);
  }

  /** Save the SharePoint part of `cfg` to the server. Resolves true on success. */
  async push(cfg: Record<string, unknown>): Promise<boolean> {
    const values: Record<string, boolean | string> = {};
    for (const [k, v] of Object.entries(cfg)) {
      if (isSharePointKey(k) && (typeof v === 'boolean' || typeof v === 'string')) values[k] = v;
    }
    try {
      await firstValueFrom(this.http.put<ServerResponse>(API, { values }));
      return true;
    } catch {
      return false;
    }
  }

  private async doPull(): Promise<boolean> {
    try {
      const res = await firstValueFrom(this.http.get<ServerResponse>(API));
      const values = res?.values ?? {};
      if (!Object.keys(values).length) return true; // nothing saved on the server yet — keep local values
      let local: Record<string, unknown> = {};
      try { local = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {}; } catch { /* corrupt → start clean */ }
      let changed = false;
      for (const [k, v] of Object.entries(values)) {
        if (!isSharePointKey(k)) continue;
        if (local[k] !== v) { local[k] = v; changed = true; }
      }
      if (changed) {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(local)); } catch { return false; }
        window.dispatchEvent(new Event(MODULE_CONFIG_CHANGED_EVENT));
      }
      return true;
    } catch {
      return false;
    }
  }
}
